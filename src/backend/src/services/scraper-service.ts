import { Page } from 'puppeteer';
import { browserService } from './browser-service';
import { configManager } from '../config/config-manager';
import { logger } from '../index';
import { io } from '../index';
import fs from 'fs-extra';
import path from 'path';

export class ScraperService {

    public async navigateToLogin(): Promise<void> {
        const page = await browserService.getPage();
        // Macquarie Online Banking URL
        const url = 'https://online.macquarie.com.au';
        logger.info(`Navigating to ${url}`);
        io.emit('log', `Navigating to ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' });
        logger.info('Navigation complete. Waiting for user login...');
        io.emit('log', 'Please log in manually via the Browser tab.');
    }

    public async highlightSelector(selector: string): Promise<void> {
        const page = await browserService.getPage();
        try {
            const count = await page.evaluate((sel) => {
                const elements = document.querySelectorAll(sel);
                elements.forEach((el: any) => {
                    el.style.border = '5px solid red';
                    el.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                    // Remove highlight after 3 seconds
                    setTimeout(() => {
                        el.style.border = '';
                        el.style.backgroundColor = '';
                    }, 3000);
                });
                return elements.length;
            }, selector);

            logger.info(`Highlighted ${count} elements for selector: ${selector}`);
            io.emit('log', `Found and highlighted ${count} elements matching "${selector}"`);
        } catch (error) {
            logger.error(`Error highlighting selector: ${error}`);
            io.emit('log', `Error highlighting selector: ${(error as Error).message}`);
        }
    }

    public async runImport(dateRange: { start: string, end: string }): Promise<void> {
        const config = configManager.getConfig();
        const page = await browserService.getPage();
        const selectors = config.selectors;

        io.emit('log', 'Starting Import Process...');

        // 1. Identify Accounts
        io.emit('log', 'Scanning for accounts...');
        // Wait for account list to be visible
        try {
            await page.waitForSelector(selectors.dashboard.accountItem, { timeout: 10000 });
        } catch (e) {
             io.emit('log', 'Could not find account list. Are you logged in?');
             throw new Error('Account list not found');
        }

        // Get all account elements
        // We need to loop through them. Since navigating away might lose the DOM reference,
        // we should probably collect IDs or Links first.
        const accounts = await page.evaluate((sel) => {
            const items = Array.from(document.querySelectorAll(sel.accountItem));
            return items.map((item, index) => {
                const nameEl = item.querySelector(sel.accountName);
                // Try to find a link
                const linkEl = item.querySelector(sel.accountLink) || item;
                // We might need to click the item itself if it's a clickable row
                return {
                    index,
                    name: nameEl ? nameEl.textContent?.trim() : `Account ${index}`,
                };
            });
        }, selectors.dashboard);

        io.emit('log', `Found ${accounts.length} accounts: ${accounts.map(a => a.name).join(', ')}`);

        // 2. Process each account
        for (const account of accounts) {
            // Check if this account is mapped in config
            const accountConfig = config.accounts.find(a => a.bankAccountName === account.name);
            if (!accountConfig) {
                io.emit('log', `Skipping ${account.name} (No configuration mapping found)`);
                continue;
            }

            io.emit('log', `Processing ${account.name}...`);

            // Navigate to account details
            // We re-query the DOM because the previous iteration might have caused a page reload
            // (though we try to go back).
            // Actually, best practice is to navigate to the "All Accounts" page first or ensure we are there.

            // Click on the account
            // This is tricky. We need to be on the dashboard.
            // Let's assume we are.
            await page.evaluate((sel, idx) => {
                const items = document.querySelectorAll(sel.accountItem);
                if (items[idx]) {
                     const link = items[idx].querySelector(sel.accountLink) as HTMLElement;
                     if (link) link.click();
                     else (items[idx] as HTMLElement).click();
                }
            }, selectors.dashboard, account.index);

            await page.waitForNavigation({ waitUntil: 'networkidle2' });

            // Apply Date Filter
            io.emit('log', `Applying date filter: ${dateRange.start} - ${dateRange.end}`);
            // This part is highly specific to the bank's UI.
            // We'll use the generic logic: Open Filter -> Input Dates -> Apply
            try {
                if (selectors.transactions.filterButton) {
                    await page.click(selectors.transactions.filterButton);
                }

                // Clear and Type Dates
                // We assume inputs are visible now
                await this.typeDate(page, selectors.transactions.dateRangeStart, dateRange.start);
                await this.typeDate(page, selectors.transactions.dateRangeEnd, dateRange.end);

                await page.click(selectors.transactions.applyFilterButton);

                // Wait for reload (often ajax)
                await new Promise(r => setTimeout(r, 2000)); // weak wait
            } catch (e) {
                 io.emit('log', `Error applying filters: ${(e as Error).message}. Continuing...`);
            }

            // Download CSV
            io.emit('log', 'Downloading CSV...');
            try {
                // Ensure downloads dir is empty or track new file
                await page.click(selectors.transactions.downloadButton);

                if (selectors.transactions.csvOption) {
                    await page.waitForSelector(selectors.transactions.csvOption);
                    await page.click(selectors.transactions.csvOption);
                }

                // Wait for download to finish
                const filePath = await this.waitForDownload();
                io.emit('log', `Downloaded: ${path.basename(filePath)}`);

                // Upload to Firefly
                io.emit('log', `Uploading to Firefly using config: ${accountConfig.fireflyConfigPath}`);
                const { fireflyService } = await import('./firefly-service');
                await fireflyService.upload(filePath, accountConfig.fireflyConfigPath);

                // Cleanup
                await fs.unlink(filePath);
            } catch (e) {
                io.emit('log', `Download failed: ${(e as Error).message}`);
            }

            // Go back to dashboard for next account
            await page.goBack({ waitUntil: 'networkidle2' });
        }

        io.emit('log', 'Import process completed.');
    }

    private async typeDate(page: Page, selector: string, value: string) {
        await page.click(selector, { clickCount: 3 }); // select all
        await page.keyboard.press('Backspace');
        await page.type(selector, value);
    }

    private async waitForDownload(): Promise<string> {
        const downloadPath = '/downloads';
        // Simple polling for a new file
        // In production, robust file watching is better
        let retries = 30;
        while (retries > 0) {
            const files = await fs.readdir(downloadPath);
            // find a file ending in .csv (that isn't .crdownload)
            const csv = files.find(f => f.endsWith('.csv'));
            if (csv) {
                // wait a bit for write to finish
                await new Promise(r => setTimeout(r, 1000));
                return path.join(downloadPath, csv);
            }
            await new Promise(r => setTimeout(r, 1000));
            retries--;
        }
        throw new Error('Timeout waiting for download');
    }
}

export const scraperService = new ScraperService();

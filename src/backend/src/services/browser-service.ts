import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from '../index';

export class BrowserService {
    private browser: Browser | null = null;
    private page: Page | null = null;

    public async launchBrowser(): Promise<void> {
        if (this.browser) return;

        logger.info('Launching browser...');
        this.browser = await puppeteer.launch({
            headless: false, // We want the head for VNC
            executablePath: '/usr/bin/chromium',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--display=:0', // Connect to Xvfb
                '--start-maximized'
            ],
            defaultViewport: null, // Let it fill the screen
            ignoreDefaultArgs: ['--enable-automation'], // Hide automation banner if possible
        });

        const pages = await this.browser.pages();
        this.page = pages.length > 0 ? pages[0] : await this.browser.newPage();

        // Setup download behavior
        const client = await this.page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: '/downloads',
        });

        logger.info('Browser launched.');
    }

    public async getPage(): Promise<Page> {
        if (!this.page) {
            await this.launchBrowser();
        }
        return this.page!;
    }

    public async closeBrowser(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
            logger.info('Browser closed.');
        }
    }

    public isBrowserRunning(): boolean {
        return this.browser !== null;
    }
}

export const browserService = new BrowserService();

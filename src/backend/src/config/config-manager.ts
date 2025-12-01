import fs from 'fs-extra';
import path from 'path';
import { DEFAULT_SELECTORS } from '../constants/selectors';

const CONFIG_PATH = process.env.CONFIG_PATH || '/config/settings.json';

export interface AppConfig {
    firefly: {
        url: string;
        token: string;
        secret: string;
    };
    selectors: typeof DEFAULT_SELECTORS;
    accounts: Array<{
        bankAccountName: string;
        fireflyConfigPath: string; // Path to uploaded JSON
    }>;
}

const DEFAULT_CONFIG: AppConfig = {
    firefly: {
        url: 'http://firefly-importer:8080',
        token: '',
        secret: '',
    },
    selectors: DEFAULT_SELECTORS,
    accounts: [],
};

export class ConfigManager {
    private config: AppConfig;

    constructor() {
        this.config = this.loadConfig();
    }

    private loadConfig(): AppConfig {
        try {
            if (fs.existsSync(CONFIG_PATH)) {
                const raw = fs.readJsonSync(CONFIG_PATH);
                // Merge with defaults to ensure all keys exist
                return { ...DEFAULT_CONFIG, ...raw, selectors: { ...DEFAULT_CONFIG.selectors, ...raw.selectors } };
            }
        } catch (error) {
            console.error('Failed to load config, using defaults:', error);
        }
        return DEFAULT_CONFIG;
    }

    public getConfig(): AppConfig {
        return this.config;
    }

    public async updateConfig(newConfig: Partial<AppConfig>): Promise<AppConfig> {
        this.config = { ...this.config, ...newConfig };
        try {
            await fs.ensureDir(path.dirname(CONFIG_PATH));
            await fs.writeJson(CONFIG_PATH, this.config, { spaces: 2 });
        } catch (error) {
            console.error('Failed to save config:', error);
            throw error;
        }
        return this.config;
    }

    public async addAccountMapping(bankAccountName: string, configJsonPath: string) {
        // Remove existing mapping for this account if exists
        this.config.accounts = this.config.accounts.filter(a => a.bankAccountName !== bankAccountName);
        this.config.accounts.push({ bankAccountName, fireflyConfigPath: configJsonPath });
        await this.updateConfig({});
    }
}

export const configManager = new ConfigManager();

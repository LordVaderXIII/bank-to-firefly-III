import { ConfigManager } from '../src/config/config-manager';
import fs from 'fs-extra';
import path from 'path';

jest.mock('fs-extra');

describe('ConfigManager', () => {
    const mockConfigPath = '/config/settings.json';

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset singleton if possible, or just test logic.
        // Since it's a singleton exported as const, we might need to rely on fs mocks.
    });

    it('should return default config if file does not exist', () => {
        const existsSyncMock = fs.existsSync as unknown as jest.Mock;
        existsSyncMock.mockReturnValue(false);
        const manager = new ConfigManager();
        expect(manager.getConfig().firefly.url).toBe('http://firefly-importer:8080');
    });

    it('should load config from file', () => {
        const existsSyncMock = fs.existsSync as unknown as jest.Mock;
        existsSyncMock.mockReturnValue(true);
        const readJsonSyncMock = fs.readJsonSync as unknown as jest.Mock;
        readJsonSyncMock.mockReturnValue({
            firefly: { url: 'http://test:1234', token: 'abc', secret: '123' }
        });
        const manager = new ConfigManager();
        expect(manager.getConfig().firefly.url).toBe('http://test:1234');
    });

    it('should merge defaults with loaded config', () => {
        const existsSyncMock = fs.existsSync as unknown as jest.Mock;
        existsSyncMock.mockReturnValue(true);
        const readJsonSyncMock = fs.readJsonSync as unknown as jest.Mock;
        readJsonSyncMock.mockReturnValue({
            firefly: { url: 'http://test:1234' }
        });
        const manager = new ConfigManager();
        expect(manager.getConfig().selectors.login.usernameInput).toBeDefined();
    });
});

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs-extra';
import { configManager } from '../config/config-manager';
import { logger } from '../index';
import { io } from '../index';

export class FireflyService {
    public async upload(csvPath: string, jsonConfigPath: string): Promise<void> {
        const config = configManager.getConfig();
        const { url, token, secret } = config.firefly;

        if (!url || !token) {
            throw new Error('Firefly URL or Token not configured');
        }

        const formData = new FormData();
        formData.append('importable', fs.createReadStream(csvPath));
        formData.append('json_config_file', fs.createReadStream(jsonConfigPath));
        if (secret) {
            formData.append('secret', secret);
        }

        const uploadUrl = `${url.replace(/\/$/, '')}/api/v1/autoupload`; // Firefly III auto-import endpoint
        // Wait, the documentation says POST to /autoupload on the *Importer*, not Firefly III Core?
        // The user prompt said: "use the Firefly III Data Importer's API ... Reference official Firefly docs: POST to /autoupload"
        // The Data Importer is a separate app usually.
        // If the URL provided is the Importer URL (e.g., http://importer:8080), then the path is just /autoupload.

        // Let's assume the user provides the Importer Base URL.
        const targetUrl = `${url.replace(/\/$/, '')}/autoupload`;

        try {
            logger.info(`Uploading to ${targetUrl}`);
            const response = await axios.post(targetUrl, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            logger.info(`Upload successful: ${response.status}`);
            io.emit('log', `Successfully uploaded to Firefly Importer. Job ID: ${response.data.id || 'N/A'}`);
        } catch (error: any) {
            logger.error(`Upload failed: ${error.message}`);
            if (error.response) {
                logger.error(`Response: ${JSON.stringify(error.response.data)}`);
                io.emit('log', `Upload failed: ${JSON.stringify(error.response.data)}`);
            } else {
                 io.emit('log', `Upload failed: ${error.message}`);
            }
            throw error;
        }
    }
}

export const fireflyService = new FireflyService();

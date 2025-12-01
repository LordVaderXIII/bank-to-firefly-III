import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import winston from 'winston';
import { configManager } from './config/config-manager';
import { browserService } from './services/browser-service';
import { scraperService } from './services/scraper-service';

// Setup Logger
export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        // We could add file transport if needed
    ]
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow dev frontend
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/config', (req, res) => {
    res.json(configManager.getConfig());
});

app.post('/api/config', async (req, res) => {
    try {
        const newConfig = await configManager.updateConfig(req.body);
        res.json(newConfig);
    } catch (err) {
        res.status(500).json({ error: 'Failed to save config' });
    }
});

app.post('/api/browser/launch', async (req, res) => {
    try {
        await browserService.launchBrowser();
        await scraperService.navigateToLogin();
        res.json({ message: 'Browser launched' });
    } catch (e) {
        logger.error(e);
        res.status(500).json({ error: 'Failed to launch browser' });
    }
});

app.post('/api/browser/highlight', async (req, res) => {
    try {
        await scraperService.highlightSelector(req.body.selector);
        res.json({ message: 'Highlighted' });
    } catch (e) {
        logger.error(e);
        res.status(500).json({ error: 'Failed to highlight' });
    }
});

app.post('/api/import/start', async (req, res) => {
    const { start, end } = req.body;
    // Basic validation
    if (!start || !end) return res.status(400).json({ error: 'Start and End dates required' });

    // Run in background
    scraperService.runImport({ start, end }).catch(e => {
        logger.error('Import process failed', e);
        io.emit('log', `CRITICAL ERROR: ${e.message}`);
    });

    res.json({ message: 'Import process started' });
});

// Serve Frontend (Production)
// Assuming frontend build is copied to /app/frontend/dist in Docker
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).send('API not found');
    }
    // Check if index.html exists, if not sending a simple message (dev mode)
    if (require('fs').existsSync(path.join(frontendPath, 'index.html'))) {
        res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
        res.send('Macquarie Firefly Importer API is running. Frontend not found (dev mode?).');
    }
});

// Socket.io
io.on('connection', (socket) => {
    logger.info('Client connected');
    socket.emit('status', { message: 'Connected to Backend' });

    socket.on('disconnect', () => {
        logger.info('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

export { io };

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText } from '@mui/material';
import { socket } from '../App';

const Logs = () => {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        socket.on('log', (message: string) => {
            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
        });

        return () => {
            socket.off('log');
        };
    }, []);

    // Auto-scroll could be added here

    return (
        <Paper sx={{ p: 2, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>Application Logs</Typography>
            <Box sx={{ flexGrow: 1, overflow: 'auto', bgcolor: '#000', p: 1, fontFamily: 'monospace' }}>
                <List dense>
                    {logs.map((log, index) => (
                        <ListItem key={index}>
                            <ListItemText primary={log} primaryTypographyProps={{ style: { color: '#00ff00' } }} />
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Paper>
    );
};

export default Logs;

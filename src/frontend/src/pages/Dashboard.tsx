import { useState } from 'react';
import { Box, Paper, Typography, Button, TextField, Grid, Divider } from '@mui/material';
import axios from 'axios';

const Dashboard = () => {
    const [, setBrowserStatus] = useState('Unknown');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const startBrowser = async () => {
        try {
            await axios.post('/api/browser/launch');
            setBrowserStatus('Launching...');
        } catch (e) {
            console.error(e);
        }
    };

    const runImport = async () => {
        try {
            await axios.post('/api/import/start', { start: startDate, end: endDate });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Grid container spacing={3} sx={{ height: '100%' }}>
            <Grid item xs={12} md={8} sx={{ height: '100%' }}>
                <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" gutterBottom>Browser View (VNC)</Typography>
                    <Box sx={{ flexGrow: 1, bgcolor: '#000', position: 'relative' }}>
                        {/* We embed noVNC here.
                            Since noVNC runs on port 6080, and we are on 3000 (dev) or via Express (prod).
                            In Docker, 6080 is exposed. We can use an iframe.
                            For hostname, we need to be careful. In dev, localhost:6080.
                            In prod, same host, port 6080.
                        */}
                        <iframe
                            src={`http://${window.location.hostname}:6080/vnc.html?autoconnect=true&resize=scale`}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title="VNC Viewer"
                        />
                    </Box>
                </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Controls</Typography>
                    <Button variant="contained" fullWidth onClick={startBrowser} sx={{ mb: 2 }}>
                        Launch Browser
                    </Button>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Launch the browser, then use the VNC view to log in to Macquarie Bank manually.
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>Run Import</Typography>
                    <TextField
                        label="Start Date (DD/MM/YYYY)"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <TextField
                        label="End Date (DD/MM/YYYY)"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                    <Button variant="contained" color="secondary" fullWidth onClick={runImport}>
                        Start Import
                    </Button>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default Dashboard;

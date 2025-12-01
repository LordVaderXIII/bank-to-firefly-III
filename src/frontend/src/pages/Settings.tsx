import { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Grid, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';

const Settings = () => {
    const [config, setConfig] = useState<any>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        const res = await axios.get('/api/config');
        setConfig(res.data);
    };

    const saveConfig = async () => {
        await axios.post('/api/config', config);
        alert('Configuration Saved');
    };

    const handleFireflyChange = (field: string, value: string) => {
        setConfig({ ...config, firefly: { ...config.firefly, [field]: value } });
    };

    const handleSelectorChange = (category: string, field: string, value: string) => {
        setConfig({ ...config, selectors: { ...config.selectors, [category]: { ...config.selectors[category], [field]: value } } });
    };

    const testSelector = async (selector: string) => {
        try {
            await axios.post('/api/browser/highlight', { selector });
        } catch (e) {
            alert('Failed to highlight. Is browser running?');
        }
    };

    if (!config) return <Typography>Loading...</Typography>;

    return (
        <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', overflow: 'auto', maxHeight: '100%' }}>
            <Typography variant="h5" gutterBottom>Settings</Typography>

            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Firefly Importer Configuration</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="Importer URL"
                                fullWidth
                                value={config.firefly.url}
                                onChange={(e) => handleFireflyChange('url', e.target.value)}
                                helperText="e.g. http://firefly-importer:8080"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Access Token"
                                fullWidth
                                type="password"
                                value={config.firefly.token}
                                onChange={(e) => handleFireflyChange('token', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Secret (AUTO_IMPORT_SECRET)"
                                fullWidth
                                type="password"
                                value={config.firefly.secret}
                                onChange={(e) => handleFireflyChange('secret', e.target.value)}
                            />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>CSS Selectors (Advanced)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Use these fields to teach the bot how to read the website.
                        Click "Highlight" to verify the selector in the open browser.
                    </Typography>

                    {/* Dashboard Selectors */}
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>Dashboard / Accounts List</Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={8}>
                            <TextField
                                label="Account Item Selector" fullWidth size="small"
                                value={config.selectors.dashboard.accountItem}
                                onChange={(e) => handleSelectorChange('dashboard', 'accountItem', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <Button onClick={() => testSelector(config.selectors.dashboard.accountItem)}>Highlight</Button>
                        </Grid>

                        <Grid item xs={8}>
                            <TextField
                                label="Account Name Selector" fullWidth size="small"
                                value={config.selectors.dashboard.accountName}
                                onChange={(e) => handleSelectorChange('dashboard', 'accountName', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <Button onClick={() => testSelector(config.selectors.dashboard.accountName)}>Highlight</Button>
                        </Grid>
                    </Grid>

                    {/* Transaction Selectors */}
                    <Typography variant="subtitle2" sx={{ mt: 2 }}>Transactions / Download</Typography>
                    <Grid container spacing={2} alignItems="center">
                         <Grid item xs={8}>
                            <TextField
                                label="Date Filter Button" fullWidth size="small"
                                value={config.selectors.transactions.filterButton}
                                onChange={(e) => handleSelectorChange('transactions', 'filterButton', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <Button onClick={() => testSelector(config.selectors.transactions.filterButton)}>Highlight</Button>
                        </Grid>

                        <Grid item xs={8}>
                            <TextField
                                label="Download Button" fullWidth size="small"
                                value={config.selectors.transactions.downloadButton}
                                onChange={(e) => handleSelectorChange('transactions', 'downloadButton', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <Button onClick={() => testSelector(config.selectors.transactions.downloadButton)}>Highlight</Button>
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" size="large" onClick={saveConfig}>Save Configuration</Button>
            </Box>
        </Paper>
    );
};

export default Settings;

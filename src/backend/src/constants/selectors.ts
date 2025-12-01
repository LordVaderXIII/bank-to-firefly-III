export const DEFAULT_SELECTORS = {
    // These are placeholders. The user will likely need to update them via the UI.
    login: {
        usernameInput: 'input[type="text"]', // Generic guess
        passwordInput: 'input[type="password"]',
        submitButton: 'button[type="submit"]',
    },
    dashboard: {
        // Selector that identifies a row or card for a bank account
        accountItem: '.account-list-item',
        // Selector within the accountItem to get the text name
        accountName: '.account-name',
        // Selector to click to enter the account details
        accountLink: 'a',
    },
    transactions: {
        // Button to open the filter menu
        filterButton: 'button[aria-label="Filter"]',
        // Date range input fields (start and end)
        dateRangeStart: 'input[name="startDate"]',
        dateRangeEnd: 'input[name="endDate"]',
        // Button to apply the filter
        applyFilterButton: '.apply-filter-btn',
        // Button to open download options
        downloadButton: '.download-export-btn',
        // Specific option for CSV if it's a dropdown
        csvOption: '.export-csv-option',
    }
};

/**
 * EECOL Wire Tools Suite - Wire Mark Calculator Business Logic
 * Enterprise PWA v0.8.0.0
 */

// ===== DEPENDENCIES =====
// - /src/utils/modals.js (showAlert, initModalSystem)
// - /src/utils/print.js (printWireMarkResults)
// - /src/assets/js/pwa-core.js (PWA functionality)
// - /src/core/database/indexeddb.js (data persistence)

// Wire Mark Calculator Logic - CORE BUSINESS FUNCTIONS
const wireMarkCalculator = {
    // DOM element references
    elements: {
        startMark: null,
        endMark: null,
        markUnit: null,
        calculateBtn: null,
        resultContainer: null,
        resultText: null,
        resultTextPrimary: null,
        resultTextSecondary: null,
        displayStartMark: null,
        displayEndMark: null,
        errorBox: null,
        errorMessage: null,
        printResultsBtn: null,
        saveForCuttingRecordsBtn: null
    },

    // Initialize the calculator when DOM is ready
    init() {
        console.log('🧮 Initializing EECOL Wire Mark Calculator...');

        // Get DOM elements
        this.elements = {
            startMark: document.getElementById('startMark'),
            endMark: document.getElementById('endMark'),
            markUnit: document.getElementById('markUnit'),
            calculateBtn: document.getElementById('calculateBtn'),
            resultContainer: document.getElementById('resultContainer'),
            resultText: document.getElementById('resultText'),
            resultTextPrimary: document.getElementById('resultTextPrimary'),
            resultTextSecondary: document.getElementById('resultTextSecondary'),
            displayStartMark: document.getElementById('displayStartMark'),
            displayEndMark: document.getElementById('displayEndMark'),
            errorBox: document.getElementById('errorBox'),
            errorMessage: document.getElementById('errorMessage'),
            printResultsBtn: document.getElementById('printResultsBtn'),
            saveForCuttingRecordsBtn: document.getElementById('saveForCuttingRecordsBtn')
        };

        // Setup event listeners
        this.setupEventListeners();

        // Initialize PWA features
        this.initPWA();
    },

    // Setup all event listeners
    setupEventListeners() {
        // Calculate button
        if (this.elements.calculateBtn) {
            this.elements.calculateBtn.addEventListener('click', () => this.calculate());
        }

        // Input validation
        if (this.elements.startMark && this.elements.endMark) {
            [this.elements.startMark, this.elements.endMark].forEach(input => {
                input.addEventListener('input', () => this.validateInput(input));
            });
        }

        // Print button
        if (this.elements.printResultsBtn) {
            this.elements.printResultsBtn.addEventListener('click', () => this.printResults());
        }

        // Save for cutting records button
        if (this.elements.saveForCuttingRecordsBtn) {
            this.elements.saveForCuttingRecordsBtn.addEventListener('click', () => this.saveForCuttingRecords());
        }
    },

    // Initialize PWA features
    initPWA() {
        // Initialize modal system if available
        if (typeof initModalSystem === 'function') {
            initModalSystem();
        }

        // Setup PWA events if available
        if (typeof setupPWAEvents === 'function') {
            setupPWAEvents();
        }
    },

    // Validate individual input fields
    validateInput(input) {
        let value = parseFloat(input.value);
        if (isNaN(value) || value < 0) {
            input.value = '0';
        } else if (value > 99999) {
            input.value = '99999';
        }
    },

    // Main calculation logic
    calculate() {
        const startMark = parseFloat(this.elements.startMark?.value || 0);
        const endMark = parseFloat(this.elements.endMark?.value || 0);
        const unit = this.elements.markUnit?.value || 'm';

        // Reset error state
        this.hideError();

        // Validation
        if (isNaN(startMark) || isNaN(endMark)) {
            this.showError('Please enter valid numbers for Start and End Marks.');
            return;
        }

        if (startMark < 0 || startMark > 99999 || endMark < 0 || endMark > 99999) {
            this.showError('Marks must be between 0 and 99999.');
            return;
        }

        // Calculate difference (handles both counting directions)
        let length;
        if (startMark > endMark) {
            // Counting down
            length = startMark - endMark;
        } else {
            // Counting up
            length = endMark - startMark;
        }

        // Ensure result is always positive
        length = Math.abs(length);

        // Display results
        this.displayResult(length, unit, startMark, endMark);
    },

    // Display calculation results
    displayResult(length, unit, startValue, endValue) {
        if (!this.elements.resultTextPrimary || !this.elements.resultText || !this.elements.resultTextSecondary) {
            console.warn('Result display elements not found');
            return;
        }

        // Primary result
        this.elements.resultTextPrimary.textContent = 'Length Between Marks';
        this.elements.resultText.textContent = `${length.toFixed(2)} ${unit}`;

        // Update Start and End Mark display
        if (this.elements.displayStartMark) {
            this.elements.displayStartMark.textContent = `${startValue.toFixed(2)} ${unit}`;
        }
        if (this.elements.displayEndMark) {
            this.elements.displayEndMark.textContent = `${endValue.toFixed(2)} ${unit}`;
        }

        // Secondary result (unit conversion)
        let secondaryText = '';
        if (unit === 'm') {
            const feetValue = (length * 3.28084).toFixed(2);
            secondaryText = `${feetValue} ft`;
        } else {
            const metersValue = (length * 0.3048).toFixed(2);
            secondaryText = `${metersValue} m`;
        }
        this.elements.resultTextSecondary.textContent = secondaryText;

        // Show results
        if (this.elements.resultContainer) {
            this.elements.resultContainer.classList.remove('hidden');
        }
    },

    // Show error message
    showError(message) {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
        }
        if (this.elements.errorBox) {
            this.elements.errorBox.classList.remove('hidden');
        }
    },

    // Hide error message
    hideError() {
        if (this.elements.errorBox) {
            this.elements.errorBox.classList.add('hidden');
        }
        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = '';
        }
    },

    // Print results functionality
    async printResults() {
        if (!this.elements.resultText) return;

        const resultText = this.elements.resultText.textContent;

        try {
            // Use shared print utility if available
            if (typeof printWireMarkResults === 'function') {
                printWireMarkResults(resultText, 'Length Between Marks');
            } else {
                // Fallback print function
                this.fallbackPrint(resultText);
            }
        } catch (error) {
            console.error('Print failed:', error);
            this.fallbackPrint(resultText);
        }
    },

    // Fallback print function
    fallbackPrint(resultText) {
        const safeResult = window.escapeHTML(resultText);
        const html = `
            <html>
            <head>
                <title>EECOL Wire Mark Results</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #0058B3; }
                    h2 { color: #0058B3; }
                    .result { margin: 20px 0; padding: 15px; border: 2px solid #0058B3; border-radius: 8px; }
                    .label { font-weight: bold; color: #666; }
                    .value { font-size: 24px; color: #0058B3; font-weight: bold; }
                    button { position: fixed; top: 10px; right: 10px; padding: 8px 16px; background: #0058B3; color: white; border: none; border-radius: 4px; cursor: pointer; }
                    @media print { button { display: none !important; } }
                </style>
            </head>
            <body>
                <h2>EECOL Wire Mark Calculator Results</h2>
                <div class="result">
                    <p class="label">Length Between Marks:</p>
                    <p class="value">${safeResult}</p>
                </div>
                <button onclick="window.print()">Print</button>
            </body>
            </html>
        `;

        if (typeof createPrintWindow === 'function') {
            createPrintWindow('EECOL Wire Mark Results', html);
        } else {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
                printWindow.print();
            }
        }
    },

    // Save for Cutting Records functionality
    async saveForCuttingRecords() {
        const startMark = parseFloat(this.elements.startMark?.value || 0);
        const endMark = parseFloat(this.elements.endMark?.value || 0);
        const unit = this.elements.markUnit?.value || 'm';

        if (isNaN(startMark) || isNaN(endMark)) {
            this.showError('Please enter valid mark values to save.');
            return;
        }

        const data = {
            type: 'markCalculator',
            startMark: Math.round(startMark),
            endMark: Math.round(endMark),
            unit: unit,
            timestamp: new Date().toISOString()
        };

        try {
            console.log('🔄 Wire Mark Calculator: Starting save operation...');

            // Use IndexedDB class if available
            if (typeof EECOLIndexedDB !== 'undefined') {
                console.log('✅ EECOLIndexedDB is available, creating instance...');
                const eecolDB = EECOLIndexedDB.getInstance();

                console.log('🔄 Waiting for database to be ready...');
                await eecolDB.ready;
                console.log('✅ Database is ready');

                console.log('💾 Saving data to markConverter store...');
                await eecolDB.saveMarkConverter(data);
                console.log('✅ Data saved successfully');

                // Show success alert using modal system
                window.showAlert('Marks saved for import into Cutting Records tool.', 'Success');
            } else {
                console.error('❌ EECOLIndexedDB is not available');
                throw new Error('Database not available');
            }
        } catch (error) {
            console.error('❌ Error saving data:', error);

            window.showAlert('Error saving data. Please try again.', 'Error');
        }
    }
};

// ===== INITIALIZATION =====
// Initialize calculator when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    wireMarkCalculator.init();
});

// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        version: 'v0.8.0.4',
        menuItems: [
            { text: '🏠 Home', href: '../../../src/pages/index/index.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: 'Is This Tool Useful?', href: '../../../src/pages/useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' }
        ],
        version: 'v0.8.0.4',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'EECOL Wire Mark Calculator'
    });
}

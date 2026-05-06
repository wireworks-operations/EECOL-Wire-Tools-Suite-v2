/**
 * EECOL Wire Tools Suite - Shipping Manifest JavaScript
 * Enterprise PWA v0.8.0.0
 */

// Global variables
let labelHistory = [];
let reelConfigurations = []; // Store available reel configurations from IndexedDB

// DOM elements
const autoPullBtn = document.getElementById('autoPullBtn');
const printLabelBtn = document.getElementById('printLabelBtn');
const importReelDimensionsBtn = document.getElementById('importReelDimensionsBtn');
const hazardSheetsBtn = document.getElementById('hazardSheetsBtn');

// Form elements
const customerNameInput = document.getElementById('customerName');
const wireIdInput = document.getElementById('wireId');
const targetAmountInput = document.getElementById('targetAmount');
const dateInput = document.getElementById('date');
const orderNumberInput = document.getElementById('orderNumber');
const weightInput = document.getElementById('weight');
const customDetailsInput = document.getElementById('customDetails');

// Reel dimension elements
const coreDiameterInput = document.getElementById('coreDiameter');
const flangeDiameterInput = document.getElementById('flangeDiameter');
const traverseWidthInput = document.getElementById('traverseWidth');

// Auto-populate date on page load
document.addEventListener('DOMContentLoaded', async function() {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Load label history
    loadLabelHistory();

    // Initialize IndexedDB and load reel configurations
    await initializeIndexedDB();
    await loadReelConfigurations();

    // Set default reel dimensions if available from estimator (backward compatibility)
    loadReelEstimatorData();
});

// Auto-pull from cutting records
autoPullBtn.addEventListener('click', function() {
    // Load recent cutting records data
    const cutRecords = loadCuttingRecordsData();

    if (cutRecords.length === 0) {
        showAlert('No cutting records found. Please add some cutting records first.', 'No Data');
        return;
    }

    // Get most recent record
    const latestRecord = cutRecords[0];

    // Auto-populate form fields
    if (latestRecord.customerName) {
        customerNameInput.value = latestRecord.customerName;
    }
    if (latestRecord.wireId) {
        wireIdInput.value = latestRecord.wireId;
    }
    if (latestRecord.orderNumber) {
        orderNumberInput.value = latestRecord.orderNumber;
    }

    showAlert('Form populated with data from most recent cutting record.', 'Auto-Pull Complete');
});

// Import from reel estimator
importReelDimensionsBtn.addEventListener('click', function() {
    const dataStr = localStorage.getItem('reelEstimatorFlangeDiameter');
    if (!dataStr) {
        showAlert('No flange diameter data found from Reel Estimator. Please calculate reel capacity first and export from the Reel Estimator tool.', 'No Data');
        return;
    }

    try {
        const data = JSON.parse(dataStr);
        if (!data.value || !data.unit) {
            showAlert('Invalid data format. Please re-export from Reel Estimator.', 'Invalid Data');
            return;
        }

        // Set flange diameter
        flangeDiameterInput.value = data.value;
        flangeDiameterUnit.value = data.unit;

        showAlert(`Flange diameter imported: ${data.value} ${data.unit}`, 'Import Successful');
    } catch (e) {
        showAlert('Error importing data. Please re-export from Reel Estimator.', 'Import Error');
    }
});

// Print reel label
printLabelBtn.addEventListener('click', function() {
    printShippingManifestLabel();
});

// Hazard sheets button
hazardSheetsBtn.addEventListener('click', function() {
    printShippingManifestHazardSheets();
});

function loadCuttingRecordsData() {
    const stored = localStorage.getItem('cutRecords');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error("Error parsing stored cut records:", e);
        }
    }
    return [];
}

function loadReelEstimatorData() {
    const dataStr = localStorage.getItem('reelEstimatorFlangeDiameter');
    if (dataStr) {
        try {
            const data = JSON.parse(dataStr);
            flangeDiameterInput.value = data.value;
            document.getElementById('flangeDiameterUnit').value = data.unit;
        } catch (e) {
            console.error("Error loading reel estimator data:", e);
        }
    }
}

function loadLabelHistory() {
    const stored = localStorage.getItem('labelHistory');
    if (stored) {
        try {
            labelHistory = JSON.parse(stored);
        } catch (e) {
            console.error("Error parsing label history:", e);
        }
    }
}

function saveLabelHistory() {
    const labelData = {
        customerName: customerNameInput.value,
        wireId: wireIdInput.value,
        targetAmount: targetAmountInput.value,
        date: dateInput.value,
        orderNumber: orderNumberInput.value,
        weight: weightInput.value,
        customDetails: customDetailsInput.value,
        coreDiameter: coreDiameterInput.value,
        flangeDiameter: flangeDiameterInput.value,
        traverseWidth: traverseWidthInput.value,
        timestamp: Date.now()
    };

    labelHistory.unshift(labelData);
    if (labelHistory.length > 50) {
        labelHistory = labelHistory.slice(0, 50);
    }

    localStorage.setItem('labelHistory', JSON.stringify(labelHistory));
}


// IndexedDB Integration Functions
async function initializeIndexedDB() {
    try {
        // Import EECOLIndexedDB if available
        if (typeof EECOLIndexedDB === 'undefined') {
            // Try to load it dynamically
            const script = document.createElement('script');
            script.src = '../../core/database/indexeddb.js';
            script.onload = () => console.log('✅ IndexedDB loaded for shipping manifest');
            script.onerror = () => console.warn('⚠️ Could not load IndexedDB for shipping manifest');
            document.head.appendChild(script);

            // Wait a bit for the script to load
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('✅ IndexedDB initialized for shipping manifest');
    } catch (error) {
        console.warn('⚠️ IndexedDB initialization failed, continuing without:', error);
    }
}

async function loadReelConfigurations() {
    try {
        if (typeof EECOLIndexedDB === 'undefined') {
            console.log('⚠️ EECOLIndexedDB not available, skipping reel configuration loading');
            return;
        }

        const db = EECOLIndexedDB.getInstance();
        await db.ready;

        // Get all reel capacity estimator configurations
        reelConfigurations = await db.getAll('reelcapacityEstimator') || [];

        // Sort by most recent timestamp
        reelConfigurations.sort((a, b) => b.timestamp - a.timestamp);

        console.log(`✅ Loaded ${reelConfigurations.length} reel configurations`);

        // Populate the configuration selector
        populateReelConfigurationSelector();

    } catch (error) {
        console.error('❌ Failed to load reel configurations:', error);
        reelConfigurations = [];
    }
}

function populateReelConfigurationSelector() {
    const selector = document.getElementById('reelConfigurationSelector');
    const refreshBtn = document.getElementById('refreshConfigurationsBtn');

    if (!selector) {
        console.warn('⚠️ Reel configuration selector not found in DOM');
        return;
    }

    // Clear existing options except the default
    const defaultOption = selector.querySelector('option[value=""]');
    selector.replaceChildren(); // BOLT OPTIMIZATION: O(1) DOM clearing

    if (defaultOption) {
        selector.appendChild(defaultOption);
    } else {
        const newDefault = document.createElement('option');
        newDefault.value = '';
        newDefault.textContent = '-- Select Saved Configuration --';
        selector.appendChild(newDefault);
    }

    // Add configurations
    reelConfigurations.forEach((config, index) => {
        const option = document.createElement('option');
        option.value = index;

        // Format display text
        const date = new Date(config.timestamp).toLocaleDateString();
        const flange = config.flangeDiameter ? `${config.flangeDiameter.value} ${config.flangeDiameter.unit}` : 'N/A';
        const core = config.coreDiameter ? `${config.coreDiameter.value} ${config.coreDiameter.unit}` : 'N/A';
        const traverse = config.traverseWidth ? `${config.traverseWidth.value} ${config.traverseWidth.unit}` : 'N/A';

        option.textContent = `Config ${date} - Flange: ${flange}`;
        option.title = `Flange: ${flange} | Core: ${core} | Traverse: ${traverse}`;
        selector.appendChild(option);
    });

    // Add change listener
    selector.addEventListener('change', handleReelConfigurationChange);

    // Add refresh button listener
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadReelConfigurations();
            showAlert('Reel configurations refreshed!', 'Updated');
        });
    }

    console.log(`✅ Populated reel configuration selector with ${reelConfigurations.length} options`);
}

function handleReelConfigurationChange(event) {
    const selectedIndex = event.target.value;

    if (!selectedIndex && selectedIndex !== '0') {
        // No selection made
        return;
    }

    const config = reelConfigurations[parseInt(selectedIndex)];
    if (!config) {
        showAlert('Selected configuration not found.', 'Error');
        return;
    }

    // Fill in the reel dimensions
    const updates = [];

    if (config.flangeDiameter) {
        flangeDiameterInput.value = config.flangeDiameter.value;
        document.getElementById('flangeDiameterUnit').value = config.flangeDiameter.unit;
        updates.push(`Flange: ${config.flangeDiameter.value} ${config.flangeDiameter.unit}`);
    }

    if (config.coreDiameter) {
        coreDiameterInput.value = config.coreDiameter.value;
        document.getElementById('coreDiameterUnit').value = config.coreDiameter.unit;
        updates.push(`Core: ${config.coreDiameter.value} ${config.coreDiameter.unit}`);
    }

    if (config.traverseWidth) {
        traverseWidthInput.value = config.traverseWidth.value;
        document.getElementById('traverseWidthUnit').value = config.traverseWidth.unit;
        updates.push(`Traverse: ${config.traverseWidth.value} ${config.traverseWidth.unit}`);
    }

    // Show success message
    if (updates.length > 0) {
        const configDate = new Date(config.timestamp).toLocaleDateString();
        showAlert(`Configuration loaded from ${configDate}:\n${updates.join('\n')}`, 'Configuration Auto-Filled');
    }
}

// Auto-uppercase inputs
customerNameInput.addEventListener('input', function(e) {
    e.target.value = e.target.value.toUpperCase();
});

wireIdInput.addEventListener('input', function(e) {
    e.target.value = e.target.value.toUpperCase();
});

orderNumberInput.addEventListener('input', function(e) {
    // Restrict to digits only and limit to 7 characters
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 7).toUpperCase();
});

// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        menuItems: [
            { text: '🏠 Home', href: '../index/index.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: 'Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' },
            { text: '⚠️ Hazard Sheets', href: '../shipping-manifest/shipping-manifest.html#hazardSheetsBtn', class: 'bg-yellow-500 hover:bg-yellow-600' },
            { text: '🏷️ Reel Labels', href: '../reel-labels/reel-labels.html', class: 'bg-green-600 hover:bg-green-700' }
        ],
        version: 'v0.8.0.4',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'EECOL Shipping Manifest'
    });
}

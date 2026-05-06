// Constants & Utility Functions
const METERS_TO_FEET = 3.280839895;
const FEET_TO_METERS = 0.3048;
const INCHES_TO_METERS = 0.0254;
const MM_TO_METERS = 0.001;
const CM_TO_METERS = 0.01;
const PI = Math.PI;
const VOLUMETRIC_EFFICIENCY = 0.90;
const WINDING_EFFICIENCY = 0.80;
const SPECIFIC_GRAVITY = {
    copper: 8.89,
    aluminum: 2.70,
    pvc: 1.40,
    xlpe: 0.92
};
const STRANDING_FACTOR = 1.03;

// Flag to track manual calculation state
let hasCalculatedManually = false;

function metersToFeet(m) { return m * METERS_TO_FEET; }
function feetToMeters(ft) { return ft / METERS_TO_FEET; }
function toMeters(value, unit) {
    switch (unit) {
        case 'in': return value * INCHES_TO_METERS;
        case 'cm': return value * CM_TO_METERS;
        case 'mm': return value * MM_TO_METERS;
        case 'ft': return feetToMeters(value);
        case 'm':
        default: return value;
    }
}
function degreesToRadians(degrees) {
    return degrees * (PI / 180);
}

// Utility Functions
function hideAllMessages() {
    const wireCutResultContainer = document.getElementById('wireCutResultContainer');
    if (wireCutResultContainer) wireCutResultContainer.classList.add('hidden');
    const reelEstimatorResultContainer = document.getElementById('reelEstimatorResultContainer');
    if (reelEstimatorResultContainer) reelEstimatorResultContainer.classList.add('hidden');
    const cutRecordResultContainer = document.getElementById('cutRecordResultContainer');
    if (cutRecordResultContainer) cutRecordResultContainer.classList.add('hidden');
}

async function showError(message) {
    // Since no error div, maybe modal alert
    await showAlert(message, "Input Error");
}

function hideError() {
    // Nothing to hide
}

// Wire Cut Tool Calculation
function calculateConversion(showErrors = false) {
    const startValue = parseFloat(document.getElementById('startValue').value);
    const startUnit = document.getElementById('startUnit').value;
    const cutLengthValue = parseFloat(document.getElementById('cutLengthValue').value);
    const cutLengthUnit = document.getElementById('cutLengthUnit').value;
    const markingReference = document.getElementById('markingReference').value;
    const customOffsetValue = parseFloat(document.getElementById('customOffsetInput').value);
    const countingDirection = document.getElementById('countingDirection').value;
    const counterDistanceValue = parseFloat(document.getElementById('counterDistanceValue').value);
    const counterDistanceUnit = document.getElementById('counterDistanceUnit').value;

    if (isNaN(startValue) || isNaN(cutLengthValue) || startValue < 0 || cutLengthValue < 0 ||
        isNaN(counterDistanceValue) || counterDistanceValue < 0) {
        if (showErrors) showError('Please enter valid non-negative numbers for all value fields.');
        return;
    }

    if (markingReference === 'custom' && (isNaN(customOffsetValue) || customOffsetValue < 0)) {
        if (showErrors) showError('Please enter a valid non-negative number for the custom offset value.');
        return;
    }

    hideError();

    let startFeetFinal = (startUnit === 'm') ? metersToFeet(startValue) : startValue;
    const cutLengthFeet = (cutLengthUnit === 'm') ? metersToFeet(cutLengthValue) : cutLengthValue;

    let offsetFeet = 0;
    if (markingReference === 'offset_meter') {
        offsetFeet = (startUnit === 'ft') ? 3.28084 : 1;
    } else if (markingReference === 'offset_foot') {
        offsetFeet = (startUnit === 'ft') ? 1 : feetToMeters(1);
    } else if (markingReference === 'custom') {
        const customUnit = document.getElementById('customOffsetUnit').value;
        offsetFeet = (customUnit === 'm') ? metersToFeet(customOffsetValue) : customOffsetValue;
    }

    let stoppingMarkFeet;
    if (countingDirection === 'up') {
        stoppingMarkFeet = startFeetFinal + cutLengthFeet + offsetFeet;
    } else {
        stoppingMarkFeet = startFeetFinal - cutLengthFeet - offsetFeet;
        if (stoppingMarkFeet < 0) {
            if (showErrors) showError('The cut length is too long and would result in a negative stopping mark.');
            return;
        }
    }

    let counterDistanceFeet = (counterDistanceUnit === 'm') ? metersToFeet(counterDistanceValue) : counterDistanceValue;
    let visualReferenceMarkFeet = countingDirection === 'up'
        ? stoppingMarkFeet - counterDistanceFeet
        : stoppingMarkFeet + counterDistanceFeet;

    const stoppingMarkValue = (startUnit === 'ft') ? stoppingMarkFeet.toFixed(3) : feetToMeters(stoppingMarkFeet).toFixed(3);
    const stoppingMarkUnit = startUnit;
    const visualMarkValue = (startUnit === 'ft') ? visualReferenceMarkFeet.toFixed(3) : feetToMeters(visualReferenceMarkFeet).toFixed(3);

    document.getElementById('resultTextPrimary').textContent = `Stopping Mark (in ${stoppingMarkUnit === 'ft' ? 'Feet' : 'Meters'})`;
    document.getElementById('stoppingMarkPrimary').textContent = `${stoppingMarkValue} ${stoppingMarkUnit}`;

    if (startUnit !== cutLengthUnit) {
        const secondaryUnit = (stoppingMarkUnit === 'ft') ? 'm' : 'ft';
        const secondaryValue = (stoppingMarkUnit === 'ft')
            ? feetToMeters(stoppingMarkFeet).toFixed(3)
            : metersToFeet(feetToMeters(parseFloat(stoppingMarkValue))).toFixed(3);
        document.getElementById('stoppingMarkSecondary').textContent = `${secondaryValue} ${secondaryUnit}`;
    } else {
        document.getElementById('stoppingMarkSecondary').textContent = '';
    }

    document.getElementById('visualMarkValue').textContent = `${visualMarkValue} ${stoppingMarkUnit}`;

    const visualMarkConverted = document.getElementById('visualMarkValueConverted');
    if (visualMarkConverted) {
        const convertedValue = (stoppingMarkUnit === 'm')
            ? metersToFeet(parseFloat(visualMarkValue)).toFixed(3) + ' ft'
            : feetToMeters(parseFloat(visualMarkValue)).toFixed(3) + ' m';
        visualMarkConverted.textContent = convertedValue;
    }

    // New Reference Marks Logic
    const markAtCounter = parseFloat(stoppingMarkValue);
    // "1 Unit Behind" defined as "1 unit upstream past counter" (towards reel).
    // If counting UP (0->100), upstream is 101 (future/higher).
    // If counting DOWN (100->0), upstream is 99 (future/lower).
    let markBehind;
    if (countingDirection === 'up') {
        markBehind = markAtCounter + 1;
    } else {
        markBehind = markAtCounter - 1;
    }

    const referenceList = document.getElementById('referenceMarksList');
    if (referenceList) {
        referenceList.replaceChildren(); // BOLT OPTIMIZATION: O(1) DOM clearing

        const createReferenceRow = (icon, label, value, valueClass) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-100';

            const labelSpan = document.createElement('span');
            labelSpan.className = 'text-xs font-bold text-gray-700 flex items-center';
            const iconSpan = document.createElement('span');
            iconSpan.className = 'mr-1';
            iconSpan.textContent = icon;
            labelSpan.appendChild(iconSpan);
            labelSpan.appendChild(document.createTextNode(label));

            const valueSpan = document.createElement('span');
            valueSpan.className = `text-sm font-bold ${valueClass}`;
            valueSpan.textContent = value;

            rowDiv.appendChild(labelSpan);
            rowDiv.appendChild(valueSpan);
            return rowDiv;
        };

        referenceList.appendChild(createReferenceRow('🏁', ' Starting Mark', `${startValue.toFixed(3)} ${stoppingMarkUnit}`, 'text-blue-600'));
        referenceList.appendChild(createReferenceRow('✅', ' Mark at Counter', `${markAtCounter.toFixed(3)} ${stoppingMarkUnit}`, 'text-green-600'));
        referenceList.appendChild(createReferenceRow('📍', ' Mark 1 Unit Upstream', `${markBehind.toFixed(3)} ${stoppingMarkUnit}`, 'text-blue-600'));
    }

    const explanation = document.getElementById('mechanismExplanation');
    if (explanation) explanation.classList.remove('hidden');

    document.getElementById('wireCutResultContainer').classList.remove('hidden');
}

function clearWireCutInputs() {
    document.getElementById('startValue').value = '0';
    document.getElementById('cutLengthValue').value = '0';
    document.getElementById('counterDistanceValue').value = '0';
    document.getElementById('markingReference').value = 'zero';
    document.getElementById('countingDirection').value = 'up';
    hasCalculatedManually = false;
    hideError();
    hideAllMessages();
}

// Custom Offset Logic
function updateCustomOffsetInputs() {
    const markingReference = document.getElementById('markingReference').value;
    const customOffsetInput = document.getElementById('customOffsetInput');
    const customOffsetUnit = document.getElementById('customOffsetUnit');

    if (markingReference === 'custom') {
        customOffsetInput.disabled = false;
        customOffsetInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
        customOffsetUnit.disabled = false;
        customOffsetUnit.classList.remove('bg-gray-100', 'cursor-not-allowed');
    } else {
        customOffsetInput.disabled = true;
        customOffsetInput.classList.add('bg-gray-100', 'cursor-not-allowed');
        customOffsetInput.value = '';
        customOffsetUnit.disabled = true;
        customOffsetUnit.classList.add('bg-gray-100', 'cursor-not-allowed');
    }
}

// Print Results Function
function printWireCutResults() {
    const stoppingMark = document.getElementById('stoppingMarkPrimary').textContent;
    const visualMark = document.getElementById('visualMarkValue').textContent;

    try {
        // Use shared print utility
        if (typeof printWireStopMarkResults === 'function') {
            printWireStopMarkResults(stoppingMark, visualMark);
            return;
        }

        const html = `
            <html>
            <head>
                <title>EECOL Wire Cut Results</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h2 { color: #0058B3; }
                    .result { margin: 20px 0; padding: 15px; border: 2px solid #0058B3; border-radius: 8px; }
                    .label { font-weight: bold; color: #666; }
                    .value { font-size: 24px; color: #0058B3; font-weight: bold; }
                    @media print { button { display: none; } }
                </style>
            </head>
            <body>
                <h2>EECOL Wire Cut Stop Mark Results</h2>
                <div class="result">
                    <p class="label">Stopping Mark:</p>
                    <p class="value">${window.escapeHTML(stoppingMark)}</p>
                </div>
                <div class="result">
                    <p class="label">Visual Reference Mark (at Reel):</p>
                    <p class="value">${window.escapeHTML(visualMark)}</p>
                </div>
                <button onclick="window.print()">Print</button>
            </body>
            </html>
        `;

        if (typeof createPrintWindow === 'function') {
            createPrintWindow('EECOL Wire Cut Results', html);
        } else {
            // Fallback (hardened)
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
                printWindow.print();
            }
        }
    } catch (error) {
        console.error('Print failed:', error);
    }
}

// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        version: 'v0.8.0.4',
        menuItems: [
            { text: '🏠 Home', href: '../../../src/pages/index/index.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: 'Is This Tool Useful?', href: '../../../src/pages/useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' }
        ],
        version: 'v0.8.0.0',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'EECOL Wire Stop Mark'
    });
}

// Initialize modal system
if (window.initModalSystem) window.initModalSystem();

// Initialize on page load
hideAllMessages();
updateCustomOffsetInputs();

// Wire Cut Tool Event Listeners
document.getElementById('calculateBtn').addEventListener('click', () => {
    hasCalculatedManually = true;
    calculateConversion(true);
});
document.getElementById('clearBtn').addEventListener('click', clearWireCutInputs);
document.getElementById('printResultsBtn').addEventListener('click', printWireCutResults);
document.getElementById('markingReference').addEventListener('change', () => {
    updateCustomOffsetInputs();
    if (hasCalculatedManually) calculateConversion(true);
});

// Auto-update event listeners for input fields
document.getElementById('startValue').addEventListener('input', () => {
    if (hasCalculatedManually) calculateConversion(true);
});
document.getElementById('startUnit').addEventListener('change', () => {
    if (hasCalculatedManually) calculateConversion(true);
});
document.getElementById('cutLengthValue').addEventListener('input', () => {
    if (hasCalculatedManually) calculateConversion(true);
});
document.getElementById('cutLengthUnit').addEventListener('change', () => {
    if (hasCalculatedManually) calculateConversion(true);
});
document.getElementById('customOffsetInput').addEventListener('input', () => {
    if (hasCalculatedManually) calculateConversion(true);
});
document.getElementById('customOffsetUnit').addEventListener('change', () => {
    if (hasCalculatedManually) calculateConversion(true);
});
document.getElementById('countingDirection').addEventListener('change', () => {
    if (hasCalculatedManually) calculateConversion(true);
});
document.getElementById('counterDistanceValue').addEventListener('input', () => {
    if (hasCalculatedManually) calculateConversion(true);
});
document.getElementById('counterDistanceUnit').addEventListener('change', () => {
    if (hasCalculatedManually) calculateConversion(true);
});

// Save for Cutting Records button functionality
document.getElementById('saveForCuttingRecordsBtn').addEventListener('click', async () => {
    const startValue = parseFloat(document.getElementById('startValue').value);
    const stoppingMarkPrimary = document.getElementById('stoppingMarkPrimary').textContent;

    if (isNaN(startValue)) return;

    const stoppingMarkMatch = stoppingMarkPrimary.match(/(\d+(?:\.\d+)?) (\w+)/);
    if (!stoppingMarkMatch) return;

    const stoppingMarkValue = parseFloat(stoppingMarkMatch[1]);
    const unit = stoppingMarkMatch[2];

    const data = {
        type: 'stopCalculator',
        startMark: Math.round(startValue),
        endMark: Math.round(stoppingMarkValue),
        unit: unit
    };

    try {
        // Use IndexedDB instead of localStorage
        if (typeof EECOLIndexedDB !== 'undefined') {
            const eecolDB = EECOLIndexedDB.getInstance();
            await eecolDB.ready;
            await eecolDB.saveStopMarkConverter(data);

            await showAlert('Marks saved for import into Cutting Records tool.');
        } else {
            // Fallback to localStorage if IndexedDB not available
            localStorage.setItem('eecalWireMarks', JSON.stringify(data));
            await showAlert('Marks saved for import into Cutting Records tool.');
        }
    } catch (error) {
        console.error('Error saving data:', error);
        await showAlert('Error saving data. Please try again.', "Error");
    }
});

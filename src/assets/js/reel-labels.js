// DOM elements
const printLabelBtn = document.getElementById('printLabelBtn');

// Form elements
const wireIdInput = document.getElementById('wireId');
const lengthInput = document.getElementById('length');
const lengthUnit = document.getElementById('lengthUnit');
const lineCodeInput = document.getElementById('lineCode');

// Reel dimension elements
const coreDiameterInput = document.getElementById('coreDiameter');
const flangeDiameterInput = document.getElementById('flangeDiameter');
const flangeDiameterUnit = document.getElementById('flangeDiameterUnit');
const coreDiameterUnit = document.getElementById('coreDiameterUnit');
const traverseWidthUnit = document.getElementById('traverseWidthUnit');
const traverseWidthInput = document.getElementById('traverseWidth');

// Print reel label
printLabelBtn.addEventListener('click', function() {
    printReelLabel();
});

function printReelLabel() {
    // Validate required fields
    if (!wireIdInput.value.trim() || !lengthInput.value.trim() || !lineCodeInput.value.trim()) {
        showAlert('Please enter Wire ID, Length, and Line Code to print a label.', 'Missing Information');
        return;
    }

    // Generate label content dynamically
    const labelDiv = document.querySelector('#labelContent div');
    if (!labelDiv) return;
    labelDiv.innerHTML = '';

    const container = document.createElement('div');
    container.style.cssText = "font-family: Arial, sans-serif; font-size: 12px; line-height: 1.3; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 15px;";

    // Add reel dimensions only if any dimension has a meaningful value (> 0)
    const hasFlange = flangeDiameterInput.value && parseFloat(flangeDiameterInput.value) > 0;
    const hasCore = coreDiameterInput.value && parseFloat(coreDiameterInput.value) > 0;
    const hasWidth = traverseWidthInput.value && parseFloat(traverseWidthInput.value) > 0;
    const hasAnyDimension = hasFlange || hasCore || hasWidth;

    if (hasAnyDimension) {
        const dimensionsDiv = document.createElement('div');
        dimensionsDiv.style.cssText = "margin: 10px 0; text-align: left; font-size: 10px; color: #666;";

        const parts = [];
        if (hasFlange) {
            parts.push(`Flange: ${flangeDiameterInput.value} ${flangeDiameterUnit.value}`);
        }
        if (hasCore || hasWidth) {
            parts.push(`Core: ${hasCore ? coreDiameterInput.value : '0'} ${coreDiameterUnit.value} | Width: ${hasWidth ? traverseWidthInput.value : '0'} ${traverseWidthUnit.value}`);
        }
        dimensionsDiv.textContent = parts.join(' ');
        container.appendChild(dimensionsDiv);
    }

    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = "flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;";

    const wireIdDiv = document.createElement('div');
    wireIdDiv.style.cssText = "text-align: center; font-size: 32px; font-weight: bold; color: #0058B3;";
    wireIdDiv.textContent = `Wire ID: ${wireIdInput.value.toUpperCase()}`;
    contentDiv.appendChild(wireIdDiv);

    const lengthDiv = document.createElement('div');
    lengthDiv.style.cssText = "text-align: center; font-size: 24px; font-weight: bold; color: #333;";
    lengthDiv.textContent = `Length: ${lengthInput.value} ${lengthUnit.value}`;
    contentDiv.appendChild(lengthDiv);

    const lineCodeDiv = document.createElement('div');
    lineCodeDiv.style.cssText = "text-align: center; font-size: 24px; font-weight: bold; color: #0058B3;";
    lineCodeDiv.textContent = `L:${lineCodeInput.value.toUpperCase()}`;
    contentDiv.appendChild(lineCodeDiv);

    container.appendChild(contentDiv);
    labelDiv.appendChild(container);

    // Print the label
    window.print();
}

// Auto-uppercase inputs
wireIdInput.addEventListener('input', function(e) {
    e.target.value = e.target.value.toUpperCase();
});

// Length input - allow numbers and decimals (like weight in shipping manifest)
lengthInput.addEventListener('input', function(e) {
    // Allow numbers and one decimal point
    let value = e.target.value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    e.target.value = value;
});

lineCodeInput.addEventListener('input', function(e) {
    let value = e.target.value.toUpperCase();
    // Restrict to single capital letter or 1-3 digits
    value = value.replace(/[^A-Z0-9]/g, '');

    // Limit to single letter or up to 3 digits
    if (value.length === 1 && /^[A-Z]$/.test(value)) {
        // Single letter is fine
    } else if (/^\d{1,3}$/.test(value)) {
        // 1-3 digits is fine
    } else {
        // Invalid input, trim appropriately
        if (value.length > 0 && /^[A-Z]/.test(value)) {
            value = value[0]; // Keep only first character if it's a letter
        } else if (value.length > 0) {
            value = value.replace(/[^\d]/g, '').slice(0, 3); // Keep only up to 3 digits
        } else {
            value = '';
        }
    }

    e.target.value = value;
});

// Initialize modal system
if (window.initModalSystem) window.initModalSystem();

// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        menuItems: [
            { text: '🏠 Home', href: '../index/index.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: 'Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' },
            { text: '📱 Shipping Manifest', href: '../shipping-manifest/shipping-manifest.html', class: 'bg-green-600 hover:bg-green-700' }
        ],
        version: 'v0.8.0.4',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'EECOL Reel Labels'
    });
}

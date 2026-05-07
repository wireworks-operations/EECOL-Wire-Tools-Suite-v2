/**
 * EECOL Wire Tools Suite - Calculator Print Utilities
 */

import { _esc, _openPrint } from './core.js';

/**
 * Print standard calculation results with EECOL branding
 */
export function printCalculationResult(title, resultValue, resultDescription = '') {
    const formattedTitle = _esc(title || 'EECOL Calculator Results');
    const formattedValue = _esc(resultValue || 'N/A');
    const formattedDescription = _esc(resultDescription || 'Calculation completed');

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>${formattedTitle}</title>
            <style>
                body {
                    font-family: 'Roboto', 'Segoe UI', Arial, sans-serif;
                    padding: 20px;
                    color: #0058B3;
                    line-height: 1.6;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #0058B3;
                    padding-bottom: 15px;
                }
                .title {
                    font-size: 18px;
                    font-weight: bold;
                    margin: 0 0 10px 0;
                }
                .result {
                    margin: 20px 0;
                    padding: 20px;
                    border: 2px solid #0058B3;
                    border-radius: 8px;
                    background: #f8f9fa;
                    text-align: center;
                }
                .label {
                    font-weight: bold;
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 5px;
                }
                .value {
                    font-size: 32px;
                    color: #0058B3;
                    font-weight: bold;
                    margin: 10px 0;
                }
                .description {
                    font-size: 12px;
                    color: #777;
                    margin-top: 15px;
                }
                .branding {
                    text-align: center;
                    margin-top: 40px;
                    font-size: 10px;
                    color: #999;
                    font-style: italic;
                }
                @media print {
                    body { margin: 0; }
                    button { display: none; }
                    .branding { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">${formattedTitle}</div>
            </div>
            <div class="result">
                <div class="label">${formattedDescription}</div>
                <div class="value">${formattedValue}</div>
            </div>
            <div class="branding">
                EECOL Wire Tools Suite 2025 - Enterprise Edition<br>
                Generated: ${_esc(new Date().toLocaleDateString())} ${_esc(new Date().toLocaleTimeString())}
            </div>
            <button onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 8px 16px; background: #0058B3; color: white; border: none; border-radius: 4px; cursor: pointer;">Print</button>
        </body>
        </html>
    `;

    const w = _openPrint(formattedTitle, html);
    if (w) {
        try { w.print(); } catch (e) { console.error('Print failed:', e); }
    }
}

/**
 * Print wire mark calculator results
 */
export function printWireMarkResults(resultText, primaryLabel = 'Length Between Marks') {
    printCalculationResult('EECOL Wire Mark Calculator', resultText, primaryLabel);
}

/**
 * Print wire weight estimator results
 */
export function printWireWeightResults(totalShipmentWeight, totalWireWeight, unitWeight) {
    const tShipment = _esc(totalShipmentWeight);
    const tWire = _esc(totalWireWeight);
    const uWeight = _esc(unitWeight);

    const formattedTitle = 'EECOL Wire Weight Estimator Results';

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>${_esc(formattedTitle)}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h2 { color: #0058B3; }
                .result-section { margin: 20px 0; }
                .result { margin: 10px 0; padding: 15px; border: 2px solid #0058B3; border-radius: 8px; }
                .label { font-weight: bold; color: #666; }
                .value { font-size: 18px; color: #0058B3; font-weight: bold; margin-top: 5px; }
                .shipment-weight { color: #dc2626; font-size: 20px; }
                .wire-weight { color: #0058B3; font-size: 18px; }
                @media print { button { display: none; } }
            </style>
        </head>
        <body>
            <h2>EECOL Wire Weight Estimator Results</h2>
            <div class="result-section">
                <h3>Weight Calculations</h3>
                <div class="result">
                    <div class="result">
                        <p class="label">Total Shipment Weight (Wire + Reel + Skid):</p>
                        <p class="value shipment-weight">${tShipment}</p>
                    </div>
                    <div class="result">
                        <p class="label">Wire Weight Only:</p>
                        <p class="value wire-weight">${tWire}</p>
                    </div>
                    <div class="result">
                        <p class="label">Unit Weight:</p>
                        <p class="value">${uWeight}</p>
                    </div>
                </div>
            </div>
            <button onclick="window.print()">Print</button>
        </body>
        </html>
    `;
    const w = _openPrint(formattedTitle, html);
    if (w) {
        try { w.print(); } catch (e) { console.error('Print failed:', e); }
    }
}

/**
 * Print wire stop mark calculator results
 */
export function printWireStopMarkResults(stoppingMark, visualMark, primaryLabel = 'Stopping Mark and Visual Reference') {
    const s = _esc(stoppingMark);
    const v = _esc(visualMark);
    const lbl = _esc(primaryLabel);

    const formattedTitle = 'EECOL Wire Stop Mark Calculator';

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>${_esc(formattedTitle)}</title>
            <style>
                body {
                    font-family: 'Roboto', 'Segoe UI', Arial, sans-serif;
                    padding: 20px;
                    color: #0058B3;
                    line-height: 1.6;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #0058B3;
                    padding-bottom: 15px;
                }
                .title {
                    font-size: 18px;
                    font-weight: bold;
                    margin: 0 0 10px 0;
                }
                .result {
                    margin: 20px 0;
                    padding: 20px;
                    border: 2px solid #0058B3;
                    border-radius: 8px;
                    background: #f8f9fa;
                    text-align: center;
                }
                .result-primary {
                    font-size: 32px;
                    color: #0058B3;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .result-secondary {
                    font-size: 24px;
                    color: #0058B3;
                    font-weight: bold;
                    margin-bottom: 15px;
                }
                .label {
                    font-weight: bold;
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 5px;
                }
                .description {
                    font-size: 12px;
                    color: #777;
                    margin-top: 15px;
                }
                .branding {
                    text-align: center;
                    margin-top: 40px;
                    font-size: 10px;
                    color: #999;
                    font-style: italic;
                }
                @media print {
                    body { margin: 0; }
                    button { display: none; }
                    .branding { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">${_esc(formattedTitle)}</div>
            </div>
            <div class="result">
                <div class="label">${lbl}</div>
                <div class="result-primary"><strong>Stopping Mark:</strong> ${s}</div>
                <div class="result-secondary"><strong>Visual Reference Mark:</strong> ${v}</div>
                <div class="description">Conversion Factor Used: 1 m ≈ 3.28084 ft</div>
            </div>
            <div class="branding">
                EECOL Wire Tools Suite 2025 - Enterprise Edition<br>
                Generated: ${_esc(new Date().toLocaleDateString())} ${_esc(new Date().toLocaleTimeString())}
            </div>
            <button onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 8px 16px; background: #0058B3; color: white; border: none; border-radius: 4px; cursor: pointer;">Print</button>
        </body>
        </html>
    `;
    const w = _openPrint(formattedTitle, html);
    if (w) {
        try { w.print(); } catch (e) { console.error('Print failed:', e); }
    }
}

/**
 * Print rectangular result
 */
export function printRectangularResult(title, htmlContent) {
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><title>${_esc(title)}</title></head>
        <body>${htmlContent}</body>
        </html>
    `;
    const w = _openPrint(title, html);
    if (w) { try { w.print(); } catch (e) {} }
}

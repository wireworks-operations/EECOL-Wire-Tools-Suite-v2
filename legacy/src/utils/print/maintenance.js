/**
 * EECOL Wire Tools Suite - Maintenance Print Utilities
 */

import { _esc, _openPrint } from './core.js';

/**
 * Print machine maintenance checklist
 */
export function printMachineMaintenanceChecklist() {
    // Collect data from current form (or loaded historical data)
    const inspectedBy = _esc(document.getElementById('globalInspectedBy')?.value || 'Not specified');
    const inspectionDate = _esc(document.getElementById('globalInspectionDate')?.value || new Date().toLocaleDateString());
    const comments = _esc(document.getElementById('comments')?.value || '');

    // Build checklist content
    let checklistHTML = '';

    const maintenanceItems = [
        'Frame Welds & Covers', 'Hoses & Cables', 'Electrical Connections', 'Oil Leaks',
        'Hydraulic Hose(s) & Pins', 'Coller & Reel Bars', 'Deadman (Foot Switch)',
        'Controls & Operation', 'Wire Machine Surroundings', 'Cutting Area Free Of Hazards',
        'Tail Ends Trimmed Or Tacked', 'Top Wire Spooled From Bottom', 'PPE Ready & Available'
    ];

    const machines = ['Manual Hand Coiler', 'Green Electric Hand Coiler', 'Blue Electric Hand Coiler', 'Telus Machine', 'Big Blue Machine #1', 'Big Blue Machine #2'];

    checklistHTML += '<table>';
    checklistHTML += '<thead><tr>';
    checklistHTML += '<th>MAINTENANCE ITEM</th>';

    machines.forEach(machine => {
        checklistHTML += `<th>${_esc(machine)}</th>`;
    });

    checklistHTML += '</tr></thead><tbody>';

    maintenanceItems.forEach((item, itemIndex) => {
        checklistHTML += `<tr><td>${_esc(item)}</td>`;

        for (let machineIndex = 0; machineIndex < machines.length; machineIndex++) {
            // Check if checkbox exists for this machine/item combination
            const okCheckbox = document.querySelector(`.ok-checkbox[data-machine="${machineIndex + 1}"][data-item="${itemIndex}"]`);
            const notOkCheckbox = document.querySelector(`.not-ok-checkbox[data-machine="${machineIndex + 1}"][data-item="${itemIndex}"]`);

            if (!okCheckbox || !notOkCheckbox) {
                checklistHTML += '<td style="text-align: center;">-</td>';
            } else {
                let status = '';
                let statusClass = '';
                if (okCheckbox.checked) {
                    status = '✓';
                    statusClass = 'status-ok';
                } else if (notOkCheckbox.checked) {
                    status = 'X';
                    statusClass = 'status-ng';
                }
                checklistHTML += `<td style="text-align: center;"><span class="${statusClass}">${status}</span></td>`;
            }
        }

        checklistHTML += '</tr>';
    });

    checklistHTML += '</tbody></table>';

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>EECOL Machine Maintenance Checklist</title>
            <style>
                @page {
                    size: landscape;
                    margin: 10mm;
                }
                body {
                    font-family: 'Roboto', 'Segoe UI', Arial, sans-serif;
                    color: #333;
                    line-height: 1.4;
                    font-size: 11px; /* Slightly smaller for matrix */
                    margin: 0;
                    padding: 0;
                }

                /* ISO Header Style */
                .iso-header {
                    display: flex;
                    border: 2px solid #000;
                    margin-bottom: 20px;
                }
                .iso-header > div {
                    padding: 10px;
                    border-right: 1px solid #000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .iso-header > div:last-child {
                    border-right: none;
                }
                .logo-box {
                    width: 20%;
                    font-weight: bold;
                    font-size: 16px;
                    color: #0058B3;
                    background: #f0f0f0;
                    text-align: center;
                }
                .title-box {
                    width: 50%;
                    font-weight: bold;
                    font-size: 18px;
                    text-transform: uppercase;
                    flex-direction: column;
                    text-align: center;
                }
                .title-box .sub {
                    font-size: 10px;
                    font-weight: normal;
                    margin-top: 5px;
                    color: #666;
                }
                .meta-box {
                    width: 30%;
                    font-size: 11px;
                    flex-direction: column;
                    align-items: flex-start !important;
                    padding-left: 15px !important;
                }

                /* Professional Table */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11px;
                    margin-bottom: 20px;
                }
                th {
                    background-color: #0058B3 !important;
                    color: white !important;
                    font-weight: bold;
                    text-align: center;
                    padding: 8px 4px;
                    border: 1px solid #000;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                    vertical-align: middle;
                }
                th:first-child {
                    text-align: left;
                    width: 20%;
                }
                td {
                    border: 1px solid #ccc;
                    padding: 6px 4px;
                    color: #333;
                    vertical-align: middle;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                tr:nth-child(odd) {
                    background-color: #fff !important;
                }

                /* Status Icons */
                .status-ok {
                    color: #10b981;
                    font-weight: bold;
                    font-size: 14px;
                }
                .status-ng {
                    color: #ef4444;
                    font-weight: bold;
                    font-size: 14px;
                }

                /* Comments Section */
                .comments-box {
                    border: 1px solid #ddd;
                    background: #fcfcfc;
                    padding: 10px;
                    margin-bottom: 20px;
                    font-size: 11px;
                    min-height: 40px;
                }
                .comments-label {
                    font-weight: bold;
                    font-size: 11px;
                    margin-bottom: 5px;
                    color: #555;
                    text-transform: uppercase;
                }

                /* Signature Footer */
                .signature-footer {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 30px;
                    padding-top: 10px;
                    border-top: 2px solid #000;
                    page-break-inside: avoid;
                }
                .sig-block {
                    width: 45%;
                }
                .sig-line {
                    border-bottom: 1px solid #000;
                    height: 30px;
                    margin-bottom: 5px;
                }
                .sig-label {
                    font-size: 10px;
                    font-weight: bold;
                    text-transform: uppercase;
                }

                @media print {
                    body { margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="iso-header">
                <div class="logo-box">EECOL<br>WIRE TOOLS</div>
                <div class="title-box">
                    MACHINE MAINTENANCE RECORD
                    <div class="sub">SITE-WIDE INSPECTION LOG</div>
                </div>
                <div class="meta-box">
                    <div><strong>Date:</strong> ${inspectionDate}</div>
                    <div><strong>Inspector:</strong> ${inspectedBy}</div>
                    <div><strong>Scope:</strong> All Machines</div>
                </div>
            </div>

            ${checklistHTML}

            <div class="comments-label">ADDITIONAL COMMENTS / NOTES:</div>
            <div class="comments-box">
                ${comments.replace(/\n/g, '<br>') || 'No additional comments recorded.'}
            </div>

            <div class="signature-footer">
                <div class="sig-block">
                    <div class="sig-line"></div>
                    <div class="sig-label">Inspector Signature</div>
                </div>
                <div class="sig-block">
                    <div class="sig-line"></div>
                    <div class="sig-label">Supervisor Review</div>
                </div>
            </div>

            <button onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #0058B3; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">🖨️ PRINT RECORD</button>
        </body>
        </html>
    `;

    const w = _openPrint('EECOL Machine Maintenance Checklist', html);
    if (w) { try { w.print(); } catch (e) {} }
}

/**
 * Print machine maintenance checklist multi-page
 */
export function printMachineMaintenanceChecklistMultiPage() {
    const machines = [
        'Manual Hand Coiler',
        'Green Electric Hand Coiler',
        'Blue Electric Hand Coiler',
        'Telus Machine',
        'Big Blue Machine #1',
        'Big Blue Machine #2'
    ];

    const maintenanceItems = [
        'Frame Welds & Covers', 'Hoses & Cables', 'Electrical Connections', 'Oil Leaks',
        'Hydraulic Hose(s) & Pins', 'Coiler & Reel Bars', 'Deadman (Foot Switch)',
        'Controls & Operation', 'Wire Machine Surroundings', 'Cutting Area Free Of Hazards',
        'Tail Ends Trimmed Or Tacked', 'Top Wire Spooled From Bottom', 'PPE Ready & Available'
    ];

    let printContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>EECOL Multi-Machine Maintenance Checklist</title>
            <style>
                @page {
                    size: A4;
                    margin: 10mm;
                }
                body {
                    font-family: 'Roboto', 'Segoe UI', Arial, sans-serif;
                    color: #333;
                    line-height: 1.4;
                    font-size: 12px;
                    margin: 0;
                    padding: 0;
                }

                /* ISO Header Style */
                .iso-header {
                    display: flex;
                    border: 2px solid #000;
                    margin-bottom: 20px;
                }
                .iso-header > div {
                    padding: 10px;
                    border-right: 1px solid #000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .iso-header > div:last-child {
                    border-right: none;
                }
                .logo-box {
                    width: 20%;
                    font-weight: bold;
                    font-size: 16px;
                    color: #0058B3;
                    background: #f0f0f0;
                    text-align: center;
                }
                .title-box {
                    width: 50%;
                    font-weight: bold;
                    font-size: 18px;
                    text-transform: uppercase;
                    flex-direction: column;
                    text-align: center;
                }
                .title-box .sub {
                    font-size: 10px;
                    font-weight: normal;
                    margin-top: 5px;
                    color: #666;
                }
                .meta-box {
                    width: 30%;
                    font-size: 11px;
                    flex-direction: column;
                    align-items: flex-start !important;
                    padding-left: 15px !important;
                }

                /* Machine Section */
                .machine-section {
                    margin-bottom: 30px;
                    page-break-inside: avoid;
                    border: 1px solid #ccc;
                    padding: 15px;
                    border-radius: 4px;
                }
                .machine-section:not(:first-child) {
                    page-break-before: always;
                    break-before: page;
                }
                .machine-title {
                    background: #0058B3;
                    color: white;
                    padding: 8px 15px;
                    font-weight: bold;
                    font-size: 16px;
                    margin: -15px -15px 15px -15px; /* Flush with container */
                    border-radius: 3px 3px 0 0;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                /* Professional Table */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                    margin-bottom: 20px;
                }
                th {
                    background-color: #0058B3 !important;
                    color: white !important;
                    font-weight: bold;
                    text-align: left;
                    padding: 8px;
                    border: 1px solid #000;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                td {
                    border: 1px solid #ccc;
                    padding: 6px 8px;
                    color: #333;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                tr:nth-child(odd) {
                    background-color: #fff !important;
                }

                /* Status Icons */
                .status-ok {
                    color: #10b981;
                    font-weight: bold;
                    font-size: 14px;
                }
                .status-ng {
                    color: #ef4444;
                    font-weight: bold;
                    font-size: 14px;
                }

                /* Comments Section */
                .comments-box {
                    border: 1px solid #ddd;
                    background: #fcfcfc;
                    padding: 10px;
                    margin-bottom: 20px;
                    font-size: 11px;
                    min-height: 40px;
                }
                .comments-label {
                    font-weight: bold;
                    font-size: 11px;
                    margin-bottom: 5px;
                    color: #555;
                    text-transform: uppercase;
                }

                /* Signature Footer */
                .signature-footer {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 30px;
                    padding-top: 10px;
                    border-top: 2px solid #000;
                }
                .sig-block {
                    width: 45%;
                }
                .sig-line {
                    border-bottom: 1px solid #000;
                    height: 30px;
                    margin-bottom: 5px;
                }
                .sig-label {
                    font-size: 10px;
                    font-weight: bold;
                    text-transform: uppercase;
                }

                @media print {
                    body { margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                    button { display: none; }
                    .machine-section { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
    `;

    const skipLists = {
        1: [1, 2, 3, 4, 5, 6, 7], // Manual Hand Coiler skips these item indices
        2: [3, 4, 5, 7],       // Green Electric Hand Coiler skips
        3: [3, 4, 5]          // Blue Electric Hand Coiler skips
    };

    for (let i = 1; i <= 6; i++) {
        const inspectedBy = _esc(document.getElementById(`inspectedBy-${i}`)?.value || 'Not specified');
        const inspectionDate = _esc(document.getElementById(`inspectionDate-${i}`)?.value || new Date().toLocaleDateString());
        const comments = _esc(document.getElementById(`comments-${i}`)?.value || '');

        printContent += `
            <div class="machine-section">
                <!-- ISO Header repeated for each page/machine -->
                <div class="iso-header">
                    <div class="logo-box">EECOL<br>WIRE TOOLS</div>
                    <div class="title-box">
                        MACHINE MAINTENANCE RECORD
                        <div class="sub">DAILY INSPECTION LOG</div>
                    </div>
                    <div class="meta-box">
                        <div><strong>Date:</strong> ${inspectionDate}</div>
                        <div><strong>Inspector:</strong> ${inspectedBy}</div>
                        <div><strong>Machine ID:</strong> #${i}</div>
                    </div>
                </div>

                <div class="machine-title">${_esc(machines[i - 1])}</div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 60%;">MAINTENANCE ITEM</th>
                            <th style="width: 20%; text-align: center;">OK</th>
                            <th style="width: 20%; text-align: center;">NG</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        maintenanceItems.forEach((item, itemIndex) => {
            const skipIndexes = skipLists[i] || [];
            if (!skipIndexes.includes(itemIndex)) {
                const okCheckbox = document.querySelector(`.ok-checkbox[data-machine="${i}"][data-item="${itemIndex}"]`);
                const notOkCheckbox = document.querySelector(`.not-ok-checkbox[data-machine="${i}"][data-item="${itemIndex}"]`);

                let statusOK = '', statusNG = '';
                if (okCheckbox && okCheckbox.checked) statusOK = '✓';
                if (notOkCheckbox && notOkCheckbox.checked) statusNG = 'X';

                printContent += `
                    <tr>
                        <td>${_esc(item)}</td>
                        <td style="text-align: center;"><span class="status-ok">${statusOK}</span></td>
                        <td style="text-align: center;"><span class="status-ng">${statusNG}</span></td>
                    </tr>
                `;
            }
        });

        printContent += `
                    </tbody>
                </table>

                <div class="comments-label">ADDITIONAL COMMENTS / NOTES:</div>
                <div class="comments-box">
                    ${comments.replace(/\n/g, '<br>') || 'No additional comments recorded.'}
                </div>

                <div class="signature-footer">
                    <div class="sig-block">
                        <div class="sig-line"></div>
                        <div class="sig-label">Inspector Signature</div>
                    </div>
                    <div class="sig-block">
                        <div class="sig-line"></div>
                        <div class="sig-label">Supervisor Review</div>
                    </div>
                </div>
            </div>
        `;
    }

    printContent += `
            <button onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #0058B3; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">🖨️ PRINT RECORD</button>
            <div class="branding" style="text-align: center; margin-top: 20px; font-size: 10px; color: #999; font-style: italic;">
                EECOL Wire Tools Suite 2025 - Enterprise Edition<br>
                Generated: ${_esc(new Date().toLocaleDateString())} ${_esc(new Date().toLocaleTimeString())}
            </div>
        </body>
        </html>
    `;

    const w = _openPrint('EECOL Multi-Machine Maintenance Checklist', printContent);
    if (w) { try { w.print(); } catch (e) {} }
}

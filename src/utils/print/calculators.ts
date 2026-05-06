import { _esc, _openPrint, formatPrintTimestamp } from './core';

/**
 * Print standard calculation results with EECOL branding
 */
export function printCalculationResult(title: string, resultValue: string, resultDescription: string = '') {
    const formattedTitle = _esc(title || 'EECOL Calculator Results');
    const formattedValue = _esc(resultValue || 'N/A');
    const formattedDescription = _esc(resultDescription || 'Calculation completed');

    const html = `
      <div class="header">
          <div class="title">${formattedTitle}</div>
      </div>
      <div style="margin: 20px 0; padding: 20px; border: 2px solid #0058B3; border-radius: 8px; background: #f8f9fa; text-align: center;">
          <div style="font-weight: bold; color: #666; font-size: 14px; margin-bottom: 5px;">${formattedDescription}</div>
          <div style="font-size: 32px; color: #0058B3; font-weight: bold; margin: 10px 0;">${formattedValue}</div>
      </div>
      <div style="text-align: center; margin-top: 40px; font-size: 10px; color: #999; font-style: italic;">
          EECOL Wire Tools Suite 2025 - Enterprise Edition<br>
          Generated: ${formatPrintTimestamp()}
      </div>
    `;

    _openPrint(formattedTitle, html);
}

/**
 * Print wire weight estimator results
 */
export function printWireWeightResults(totalShipmentWeight: string, totalWireWeight: string, unitWeight: string) {
    const tShipment = _esc(totalShipmentWeight);
    const tWire = _esc(totalWireWeight);
    const uWeight = _esc(unitWeight);
    const title = 'EECOL Wire Weight Estimator Results';

    const html = `
      <div class="header">
          <div class="title">${title}</div>
      </div>
      <div style="margin: 20px 0;">
          <div style="margin: 10px 0; padding: 15px; border: 2px solid #0058B3; border-radius: 8px;">
              <p style="font-weight: bold; color: #666;">Total Shipment Weight (Wire + Reel + Skid):</p>
              <p style="font-size: 24px; color: #dc2626; font-weight: bold; margin-top: 5px;">${tShipment}</p>
          </div>
          <div style="margin: 10px 0; padding: 15px; border: 2px solid #0058B3; border-radius: 8px;">
              <p style="font-weight: bold; color: #666;">Wire Weight Only:</p>
              <p style="font-size: 20px; color: #0058B3; font-weight: bold; margin-top: 5px;">${tWire}</p>
          </div>
          <div style="margin: 10px 0; padding: 15px; border: 2px solid #0058B3; border-radius: 8px;">
              <p style="font-weight: bold; color: #666;">Unit Weight:</p>
              <p style="font-size: 18px; color: #0058B3; font-weight: bold; margin-top: 5px;">${uWeight}</p>
          </div>
      </div>
      <div style="text-align: center; margin-top: 40px; font-size: 10px; color: #999; font-style: italic;">
          EECOL Wire Tools Suite 2025 - Enterprise Edition<br>
          Generated: ${formatPrintTimestamp()}
      </div>
    `;

    _openPrint(title, html);
}

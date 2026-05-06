import { _esc, _openPrint, formatPrintTimestamp } from './core';

interface MaintenanceRecord {
  machineId: number;
  machineName: string;
  inspector: string;
  date: string;
  items: { name: string; status: 'ok' | 'ng' | 'none' }[];
  comments: string;
}

export function printMaintenanceRecord(record: MaintenanceRecord) {
    const title = `EECOL Maintenance - ${record.machineName}`;

    const html = `
      <div class="iso-header" style="display: flex; border: 2px solid #000; margin-bottom: 20px;">
          <div style="width: 20%; font-weight: bold; font-size: 16px; color: #0058B3; background: #f0f0f0; text-align: center; padding: 10px; border-right: 1px solid #000;">EECOL<br>WIRE</div>
          <div style="width: 50%; font-weight: bold; font-size: 18px; text-transform: uppercase; text-align: center; padding: 10px; border-right: 1px solid #000;">
              MAINTENANCE RECORD
              <div style="font-size: 10px; font-weight: normal; margin-top: 5px; color: #666;">DAILY INSPECTION LOG</div>
          </div>
          <div style="width: 30%; font-size: 11px; padding: 10px; display: flex; flex-direction: column;">
              <div><strong>Date:</strong> ${_esc(record.date)}</div>
              <div><strong>Inspector:</strong> ${_esc(record.inspector)}</div>
              <div><strong>Machine:</strong> ${_esc(record.machineName)}</div>
          </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
          <thead>
              <tr>
                  <th style="background: #0058B3; color: white; border: 1px solid #000; padding: 8px; text-align: left;">MAINTENANCE ITEM</th>
                  <th style="background: #0058B3; color: white; border: 1px solid #000; padding: 8px; text-align: center; width: 60px;">STATUS</th>
              </tr>
          </thead>
          <tbody>
              ${record.items.map(item => `
                  <tr>
                      <td style="border: 1px solid #ccc; padding: 6px;">${_esc(item.name)}</td>
                      <td style="border: 1px solid #ccc; padding: 6px; text-align: center; font-weight: bold; color: ${item.status === 'ok' ? '#10b981' : item.status === 'ng' ? '#ef4444' : '#666'}">
                          ${item.status === 'ok' ? '✓ OK' : item.status === 'ng' ? 'X NG' : '-'}
                      </td>
                  </tr>
              `).join('')}
          </tbody>
      </table>

      <div style="font-weight: bold; font-size: 11px; margin-bottom: 5px; color: #555; text-transform: uppercase;">COMMENTS:</div>
      <div style="border: 1px solid #ddd; background: #fcfcfc; padding: 10px; font-size: 11px; min-height: 40px; margin-bottom: 20px;">
          ${_esc(record.comments).replace(/\n/g, '<br>') || 'No additional comments.'}
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 40px;">
          <div style="width: 45%; border-top: 1px solid #000; padding-top: 5px; font-size: 10px; font-weight: bold;">INSPECTOR SIGNATURE</div>
          <div style="width: 45%; border-top: 1px solid #000; padding-top: 5px; font-size: 10px; font-weight: bold;">SUPERVISOR REVIEW</div>
      </div>

      <div style="text-align: center; margin-top: 40px; font-size: 10px; color: #999; font-style: italic;">
          Printed: ${formatPrintTimestamp()}
      </div>
    `;

    _openPrint(title, html);
}

/**
 * EECOL Wire Tools Suite - Print Core Utilities (TypeScript)
 * Shared helpers for printing features.
 */

/**
 * Safely escapes strings for HTML insertion.
 */
export function _esc(v: any): string {
    if (v === null || v === undefined) return '';
    return String(v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Opens a print window and writes HTML content to it.
 */
export function _openPrint(title: string, html: string): Window | null {
    const w = window.open('', '_blank');
    if (!w) {
        alert('Unable to open print window. Please allow popups for this site.');
        return null;
    }

    // Construct valid HTML structure
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>${title}</title>
          <meta charset="UTF-8">
          <style>
            @page { margin: 1cm; }
            body {
              font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #1e293b;
              line-height: 1.5;
              padding: 20px;
            }
            .header { border-bottom: 2px solid #0058B3; margin-bottom: 20px; padding-bottom: 10px; }
            .title { color: #0058B3; font-weight: 900; text-transform: uppercase; font-size: 24px; }
            .timestamp { font-size: 10px; color: #64748b; text-align: right; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
      </head>
      <body>
          ${html}
          <div class="no-print" style="position: fixed; top: 10px; right: 10px;">
            <button onclick="window.print()" style="background: #0058B3; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">Print Document</button>
          </div>
      </body>
      </html>
    `;

    try {
        w.document.write(fullHtml);
        w.document.close();
    } catch (e) {
        console.error('Print window error:', e);
    }
    return w;
}

/**
 * Formats the current date and time for printouts.
 */
export function formatPrintTimestamp(): string {
    return `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
}

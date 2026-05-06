/**
 * EECOL Wire Tools Suite - Print Core Utilities
 * Shared helpers for printing features.
 */

/**
 * Safely escapes strings for HTML insertion.
 * @param {any} v - Value to escape
 * @returns {string} Escaped string
 */
export function _esc(v) {
    if (v === null || v === undefined) return '';
    if (typeof window !== 'undefined') {
        // Prefer the standardized window.escapeHTML defined in theme-loader.js
        if (typeof window.escapeHTML === 'function') {
            return window.escapeHTML(v);
        }
        // Fallback to the lowercase variant if available (via sanitize.js shim)
        if (typeof window.escapeHtml === 'function') {
            return window.escapeHtml(v);
        }
    }
    // Defense-in-depth: Basic local fallback if no global sanitizer is available
    return String(v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Opens a print window and writes HTML content to it.
 * @param {string} title - Window title
 * @param {string} html - HTML content
 * @returns {Window|null} The opened window or null
 */
export function _openPrint(title, html) {
    if (typeof window !== 'undefined' && typeof window.safeOpenPrintWindow === 'function') {
        return window.safeOpenPrintWindow(title, html);
    }
    // fallback
    const w = window.open('', '_blank');
    if (!w) {
        alert('Unable to open print window. Please allow popups for this site.');
        return null;
    }
    try {
        w.document.title = title || 'Print';
    } catch (e) {
        // ignore cross-browser quirks
    }
    try { w.document.open(); } catch (e) {}
    w.document.write(html);
    try { w.document.close(); } catch (e) {}
    return w;
}

/**
 * Formats the current date and time for printouts.
 * @returns {string} Formatted timestamp
 */
export function formatPrintTimestamp() {
    return `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
}

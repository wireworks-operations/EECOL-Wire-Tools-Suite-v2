/**
 * EECOL Wire Tools Suite - Legacy Print Utilities
 * Maintained for backward compatibility.
 */

import { _openPrint } from './core.js';

/**
 * Legacy function for backward compatibility
 */
export function createPrintWindow(title, content) {
    const w = _openPrint(title, content);
    if (w) { try { w.print(); } catch (e) {} }
    return w;
}

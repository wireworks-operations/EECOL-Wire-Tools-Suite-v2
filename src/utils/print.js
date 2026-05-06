/**
 * EECOL Wire Tools Suite - Shared Print Utilities (Global Shim)
 * Enterprise PWA v0.8.0.0
 *
 * This file serves as a global shim to maintain backward compatibility
 * with legacy HTML pages while using modern ES Modules internally.
 */

import { _esc, _openPrint, formatPrintTimestamp } from './print/core.js';
import {
    printCalculationResult,
    printWireMarkResults,
    printWireWeightResults,
    printWireStopMarkResults,
    printRectangularResult
} from './print/calculators.js';
import {
    printMachineMaintenanceChecklist,
    printMachineMaintenanceChecklistMultiPage
} from './print/maintenance.js';
import { createPrintWindow } from './print/legacy.js';

// Export for ESM usage
export {
    _esc,
    _openPrint,
    formatPrintTimestamp,
    printCalculationResult,
    printWireMarkResults,
    printWireWeightResults,
    printWireStopMarkResults,
    printRectangularResult,
    printMachineMaintenanceChecklist,
    printMachineMaintenanceChecklistMultiPage,
    createPrintWindow
};

// Attach to window for legacy global usage
if (typeof window !== 'undefined') {
    window.printCalculationResult = printCalculationResult;
    window.printWireMarkResults = printWireMarkResults;
    window.printWireStopMarkResults = printWireStopMarkResults;
    window.printWireWeightResults = printWireWeightResults;
    window.printRectangularResult = printRectangularResult;

    // Wrappers for external functions defined in feature-specific assets
    window.printReelLabel = function() {
        if (typeof window.doPrintReelLabel === 'function') {
            try { return window.doPrintReelLabel(); } catch(e){ console.error('printReelLabel failed:', e); }
        }
    };
    window.printShippingManifestLabel = function() {
        if (typeof window.doPrintShippingManifestLabel === 'function') {
            try { return window.doPrintShippingManifestLabel(); } catch(e){ console.error('printShippingManifestLabel failed:', e); }
        }
    };

    // Maintenance functions
    window.printMachineMaintenanceChecklist = printMachineMaintenanceChecklist;
    window.printMachineMaintenanceChecklistMultiPage = printMachineMaintenanceChecklistMultiPage;
    window.formatPrintTimestamp = formatPrintTimestamp;
    window.createPrintWindow = createPrintWindow;

    // Calibration (placeholder for external definition)
    // window.printMachineCalibrationMeasurement is typically defined in calibration.js
}

# Sentinel Security Journal 🛡️

## 2026-03-09 - Project-wide XSS Mitigation
**Vulnerability:** Widespread use of `innerHTML` for rendering dynamic data from IndexedDB and user inputs across almost all application modules (Inventory, Cutting, Shipping, Estimators).
**Learning:** Manual escaping with `window.escapeHTML()` was inconsistently applied and cumbersome for complex data types. Using `document.createElement()` and `.textContent` provides a more robust, native defense that is easier to verify and harder to accidentally bypass.
**Prevention:** Establish a "Secure by Default" pattern where `innerHTML` is strictly forbidden for dynamic content. Prefer `textContent` for data and `createElement` for structure. Use `innerHTML` only for static, predefined templates where dynamic parts are everything.

## 2026-03-09 - Redundant Alert Utility Risks
**Vulnerability:** Redundant, local implementations of `showAlert` and `showConfirm` across multiple page-specific JS files (e.g., `reel-labels.js`, `stop-mark-converter.js`).
**Learning:** Local copies bypass central security hardening applied to `src/utils/modals.js` and often use insecure `innerHTML` patterns. Consolidation is necessary to maintain a "Single Source of Truth" for secure UI interactions.
**Prevention:** Strictly forbid local re-implementations of shared UI utilities. All modal alerts must use the central, hardened `modals.js` utility which enforces `.textContent` for dynamic parameters.

## 2026-03-10 - Silent XSS Exposure in Print Utilities
**Vulnerability:** The shared print utility `_esc` in `src/utils/print/core.js` only checked for the lowercase `window.escapeHtml` (from a non-standard shim), failing to use the project's primary `window.escapeHTML` standard. This resulted in zero sanitization for printouts on most pages.
**Learning:** Inconsistent naming conventions for critical security utilities (escapeHtml vs escapeHTML) led to silent failure of sanitization logic. Relying solely on global functions without a local fallback creates a fragile security posture.
**Prevention:** Always implement a multi-layered sanitization pattern ("Defense-in-Depth"). Security-critical utilities should prioritize project standards but must always include a local regex-based fallback to ensure protection if global dependencies fail to load or are renamed.

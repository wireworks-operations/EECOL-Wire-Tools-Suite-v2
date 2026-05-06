# 🧠 Jules' Memory & Knowledge Base - EECOL Wire Tools

This file serves as a living document of my understanding, insights, and
critical patterns for the EECOL Wire Tools Suite.

## 🏗️ Project Overview

- **Type:** Client-side only Progressive Web Application (PWA).
- **Domain:** Industrial wire processing and inventory management.
- **Persistence:** Local-first using **IndexedDB** (`EECOLIndexedDB`).
- **Styling:** Tailwind CSS + Custom CSS (`eecol-theme.css`).
- **Version:** v0.8.0.4 (Synchronized across `package.json`, `README.md`, and
  `index.html`).

## 🛠️ Architecture & Core Patterns

### 🗄️ Database (IndexedDB)

- **Singleton Pattern:** Always use `EECOLIndexedDB.getInstance()` to avoid
  multiple connection issues.
- **Reliability:** Implements `db.onversionchange = () => db.close()` and
  `request.onblocked` handlers to prevent upgrade deadlocks.
- **Stores:** `cuttingRecords`, `inventoryRecords`, `markConverter`,
  `stopmarkConverter`, `reelcapacityEstimator`, `settings`, etc.
- **Atomic Batch Updates:** Use `bulkPut(storeName, items, clearFirst)` for
  multi-record operations (Undo, Redo, Import). This pattern wraps all requests
  in a single transaction, ensuring atomicity and minimizing
  performance-degrading disk syncs.

### 🛡️ Security (Sentinel Protocol)

- **Secure by Default Rendering:** Strictly avoid `innerHTML` for any
  user-controllable data (Wire IDs, Customer Names, Comments). Every list item
  in the 'Wire Cut List' is constructed using `document.createElement()` and
  `.textContent`. This provides native browser protection against XSS and is
  far more robust than manual string escaping.
- **Utility Priority:** Use `window.escapeHTML` (from
  `src/utils/theme-loader.js` or `src/utils/sanitize.js`) for manual escaping
  if necessary.
- **Alerts/Modals:** Custom `showAlert` and `showConfirm` in
  `src/utils/modals.js` use `.textContent`. Use `whitespace-pre-line` for
  formatting.

### ⚡ Performance (Bolt Optimization)

- **Iteration Consolidation:** When processing dashboard metrics or large
  datasets, consolidate multiple `filter()` and `reduce()` calls into a single
  `for...of` loop.
- **Data Integrity:** Handle `null` or `undefined` gracefully, especially in
  inventory/cutting records.
- **Modular Print Utility:** Print features are organized into specific modules
  (`core.js`, `calculators.js`, `maintenance.js`) under `src/utils/print/`. The
  root `src/utils/print.js` acts as an ESM global shim for backward
  compatibility. HTML pages must load it with `type="module"`.

### 🎨 UI/UX (Palette Protocol)

- **Theme:** EECOL Blue (`#0058B3`) and Indigo accents.
- **Accessibility:** Ensure `aria-label` and `aria-expanded` are present for
  dynamic components (mobile menus, toggles).
- **Touch-Friendly:** Inputs and buttons should have a minimum touch target of
  44px (using `mobile-touch-input` or `touch-device-friendly` classes).
- **Stop Mark Calculator:** Uses blue containers (`bg-blue-50`) for reference
  points and green (`text-green-600`) for results.

## 📖 Component-Specific Insights

### Cutting Records

- **`updateStats`:** Optimized to a single-pass metric calculation.
- **Persistence:** Records are sorted by `timestamp` (newest first).
- **Batch Mode:** Allows multiple cut entries for a single order/customer.
- **AutoFill Integration:** The 'Wire Cut List' supports a one-click 'AutoFill
  Cut' feature. This feature uses an **event-driven architecture**; instead of
  just setting input values, it dispatches native `input` and `change` events.
  This ensures that any dependent UI logic (like character limits or
  formatting) is triggered immediately, maintaining perfect synchronization
  between the data layer and the DOM.
- **Data Normalization:** Key identification fields (Order Number, Customer,
  Wire ID) are strictly enforced as **UPPERCASE**. This decision eliminates
  data fragmentation in IndexedDB (e.g., preventing "TK6" and "tk6" from being
  treated as different wire types) and drastically improves search/filter
  reliability.
- **Alphanumeric Order Numbers:** The `orderNumber` field was upgraded from
  digit-only to alphanumeric. This change provides flexibility for
  Inter-Branch Transfers (IBTs) and custom project codes while maintaining the
  7-character constraint for database performance.
- **Archival Flow:** The list distinguishes between 'Hard Removal' (right-click
  for mistakes) and 'Archival' (Remove button). The Archival flow mandates a
  **Removal Reason**, ensuring that cancelled or modified orders are tracked
  with context rather than simply disappearing.

### Inventory Records

- **Length Fallback:** Uses `item.length || item.actualLength ||
  item.currentLength || 0`.
- **Categorization:** 'Damaged' or 'Tail End' rely on the `reason` field
  (case-insensitive); `note` is ignored for stats.

## ⚠️ Important Considerations

- **No Backend:** Do not expect a traditional server. All sync is P2P or
  export-based.
- **Environment:** If `pnpm dev` fails, use `python3 -m http.server 3000` as a
  fallback.
- **Verification:** UI changes must be verified with Playwright scripts and
  screenshots.
- **Constraints:** Keep changes focused and under 50 lines per PR where
  possible (Sentinel/Bolt personas).

### 📱 PWA & Deployment

- **Architecture:** The `manifest.json` and `sw.js` files must reside in the
  repository root to ensure the Service Worker scope covers the entire
  application, which is mandatory for PWA installability in major browsers.
- **GitHub Pages Compatibility:** Since the app is hosted in a subdirectory
  (`/EECOL-Wire-Tools-Suite/`), all resource paths within the manifest and
  service worker must be **relative** (e.g., `src/assets/icons/...`) rather
  than absolute (`/src/assets/...`).
- **Service Worker Registration:** Use relative paths (e.g., `../../../sw.js`
  for nested pages) or a robust path detector in `pwa-core.js` that accounts
  for the subdirectory environment to ensure the service worker registers
  correctly across all pages and deployment scenarios.

---

**Created with ❤️ by Jules 🤖**

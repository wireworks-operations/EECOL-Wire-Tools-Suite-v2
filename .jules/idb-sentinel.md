# IDB Sentinel Journal 🗂️

## 2026-03-10 - Wire Cut List Implementation
**Change:** Added `wireCutList` object store to IndexedDB (EECOLTools_v2, Version 4).
**Pattern:** Implemented a `position` index for manual drag-and-drop re-ordering persistence.
**Singleton:** Ensured all interactions use `EECOLIndexedDB.getInstance()` to maintain data integrity across the session.
**Validation:** Verified store creation and CRUD operations via Playwright integration testing.

## 2026-03-12 - Idempotent Schema Upgrade & Index Alignment
**Observation:** Identified "schema drift" where object store indexes in `EECOLIndexedDB` did not match actual property names used in application code (e.g., `operator` vs `cutterName`). Linear scans were occurring despite indexes being defined.
**Learning:** Initial `createObjectStores` logic was only idempotent for *stores*, not *indexes*. Upgrades would fail to add new indexes or remove obsolete ones on existing stores.
**Action:**
1. Bumped DB version to 5.
2. Updated `cuttingRecords` and `inventoryRecords` schema definitions to use correct property names (`cutterName`, `wireId`, `personName`, etc.).
3. Refactored `createObjectStores` to be fully idempotent: it now scans existing indexes, deletes ones not in the schema, and creates missing ones using the active upgrade transaction.
**Validation:** Verified version bump, index creation/deletion, and CRUD stability via Playwright automation.

## 2026-03-23 - Schema Upgrade & Performance Tuning
**Observation:** Found that the `inventoryRecords` store lacked a `timestamp` index despite being used for sorting in application code. Linear scans were occurring for all inventory data loads.
**Learning:** Moving to `{ durability: 'relaxed' }` for write transactions in local-first apps significantly improves responsiveness by reducing synchronous disk flushes without sacrificing integrity for this single-user application.
**Action:**
1. Bumped DB version to 7.
2. Added `timestamp` index to `inventoryRecords`.
3. Implemented `relaxed` durability for all readwrite transactions.
4. Hardened lifecycle by setting `this.db = null` on version change.
**Validation:** Verified version 7 upgrade, index existence, and CRUD operations via Playwright automation.

## 2026-03-25 - Hardened ID Generation & Redundant Verification Removal
**Observation:** Tool-specific save methods used `Date.now().toString()` for IDs, creating a collision risk during rapid operations. Also performed redundant read-after-write verification.
**Learning:** `crypto.randomUUID()` is the modern standard for unique IDs in IndexedDB. Redundant `get` calls after `add` increase transaction overhead without providing additional safety beyond the IDB 'onsuccess' guarantee.
**Action:**
1. Updated `saveMarkConverter`, `saveStopMarkConverter`, `saveReelCapacityEstimator`, and `saveReelSizeEstimator` to use `crypto.randomUUID()`.
2. Removed redundant `this.get()` verification logic in these methods.
**Validation:** Verified UUID generation and CRUD success via Playwright (`verification/verify_uuids.py`).

## 2026-03-27 - Optimized Calibration & Version Standardization
**Observation:** Found that the `calibrationMeasurements` store lacked a compound index for efficient retrieval, requiring full linear scans and in-memory sorting for recent data.
**Learning:** Standardizing IndexedDB versioning (v8) via a static property and enforcing the singleton pattern without optional parameters prevents `VersionError` drift. Compound indexes (e.g., `['machineName', 'timestamp']`) combined with reverse cursors (`prev`) achieve O(log N) performance for time-series data.
**Action:**
1. Bumped DB version to 8 (Standardized via `static DATABASE_VERSION`).
2. Added `machine_timestamp` compound index to `calibrationMeasurements`.
3. Refactored `getRecentCalibrationMeasurements` to use an optimized range query with a reverse cursor.
4. Hardened `createObjectStores` to support advanced (object-based) index configurations idempotently.
5. Improved migration reliability by preventing store deletion within asynchronous cursor callbacks.
**Validation:** Verified version 8 upgrade, compound index existence, and O(log N) query performance via Playwright automation (`verification/verify_idb_v8.py`).

## 2026-04-05 - Fix upgrade idempotency and improve transaction reliability
**Observation:**
The `createObjectStores` method in `EECOLIndexedDB` had a non-idempotent migration path for the `multicutPlanner` store. If an upgrade was interrupted or re-run, it would attempt to `createObjectStore` for a store that might already exist, causing a `ConstraintError`. Additionally, `get`, `getAll`, and `count` methods lacked transaction-level `onerror` and `onabort` handlers, which could lead to hung promises if a transaction failed.

**Learning:**
1. **Idempotency in `onupgradeneeded`**: Always check `db.objectStoreNames.contains(name)` before calling `createObjectStore`, even during custom migration logic.
2. **Robust Promise Handling**: When wrapping IndexedDB requests in Promises, it's critical to attach error handlers to both the `request` AND the `transaction`. A transaction failure might not always be caught by the request's `onerror` handler alone.
3. **Migration Performance**: Iterative `await this.add(...)` calls in migration loops cause significant overhead due to multiple transactions. Using `bulkPut` (or a single transaction) is vastly more efficient for initial data migrations.

**Action:**
1. Bumped DB version to 9 (via `static DATABASE_VERSION`).
2. Modified `createObjectStores` to check for `multicutPlanner` existence before creation.
3. Added `transaction.onerror` and `transaction.onabort` handlers to `get`, `getAll`, and `count`.
4. Refactored `migrateFromLocalStorage` to use `bulkPut`, reducing migration time and transaction overhead.
**Validation:** Verified fixes and version 9 upgrade via Playwright (`verification/verify_sentinel_fix.py`).

## 2026-04-20 - Fix transaction abort on duplicate key add
**Observation:** Attempting `add()` and falling back to `update()` on `ConstraintError` causes transaction aborts, leading to rejected promises even if the update eventually succeeds (or fails silently due to the aborted transaction).
**Learning:** In IndexedDB, a request error (like a duplicate key) marks the transaction for abort. Any further requests in that transaction will fail, and the transaction's `onabort` will trigger. Upserts should use `put()` directly.
**Action:** Refactored `EECOLIndexedDB.add` to use `update` (`put`) directly. Updated verification script to match DB version 9.

## 2026-04-27 - Fix migration data loss risk and harden transactions
**Observation:** The `migrateFromLocalStorage` method removed all `localStorage` keys if at least one item was migrated, regardless of whether other categories failed. Additionally, some transactions and cursors lacked `onerror` handlers.
**Learning:** Granular cleanup of `localStorage` is essential in multi-step migrations to ensure data is not lost if the process is interrupted or partially fails. Robust IDB wrappers must always attach error handlers to both requests and their parent transactions.
**Action:**
1. Refactored `migrateFromLocalStorage` in `src/core/database/indexeddb.js` to remove each `localStorage` key individually after its successful migration.
2. Added `transaction.onerror` and `transaction.onabort` to `getRecentCalibrationMeasurements`.
3. Added `onerror` handler to the migration cursor in `createObjectStores`.
**Validation:** Verified via existing `verify_sentinel_fix.py` and a new `verify_migration_safety.py` script that specifically tests partial migration scenarios.

## 2026-05-04 - Implement cross-tab change notification
**Observation:** Multiple tabs of the PWA could show stale data because IndexedDB writes in one tab do not automatically notify other tabs. While pages like Live Statistics listen for an `eecolDBChange` localStorage key, nothing was actually updating it.
**Learning:** The `storage` event in the Web API is an efficient way to synchronize state across tabs on the same origin. Updating a localStorage key upon every successful IDB write transaction provides a simple "push" notification to other tabs.
**Action:**
1. Implemented `_notifyChange()` method in `EECOLIndexedDB` that updates `localStorage.setItem('eecolDBChange', Date.now().toString())`.
2. Integrated `_notifyChange()` into `update`, `bulkPut`, `delete`, and `clear` methods.
**Validation:** Verified via `verification/verify_tab_sync.py` and `verification/verify_frontend_sync.py` (Playwright) ensuring that write operations correctly update the sync key.

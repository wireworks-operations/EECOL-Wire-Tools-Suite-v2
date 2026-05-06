# Scribe's Journal 📘

Critical learnings and repository architectural insights.

## 2026-05-21 - [Documentation Pass v0.8.0.4 - Full Refresh]

**Observation:**
The documentation was slightly out of sync with the latest codebase changes, particularly regarding the IndexedDB v9 schema and the actual available tools listed in the Bento Box landing page (`index.html`).

**Learning:**
A documentation pass is more than just updating versions; it's about ensuring the mental model provided in `BLUEPRINT.md` and the "Happy Path" in `QUICKSTART.md` match the user's actual experience. Direct inspection of `index.html` revealed several tools (like `Wire Weight Estimator` and `Learning Hub`) that were not prominently mentioned in the main `README.md`.

**Action:**
Synchronized `README.md`, `QUICKSTART.md`, `BLUEPRINT.md`, and `SECURITY.md` to version 0.8.0.4 and IndexedDB v9. Enumerated all 14 object stores in `BLUEPRINT.md`. Updated `README.md` "Available Tools" section to reflect all modules visible in the landing page, including Support & Education. Verified setup commands (`npm install`, `npm run dev`) and verification script (`python3 verification/verify_idb.py`).

## 2026-05-15 - [Full Documentation Refresh v0.8.0.4 - Syncing Schema & Tools]

**Observation:**
Discovered a version mismatch between documentation (v8) and implementation (v9) of IndexedDB in `src/core/database/indexeddb.js`. Also confirmed that despite `package.json` having scripts for Webpack, Docker, and Jest, the corresponding config files and Dockerfile are missing, confirming the "In-Progress" status.

**Learning:**
Maintaining parity between the database version in code and documentation is crucial for developers using DevTools to inspect storage. Explicitly documenting "missing" or "in-progress" tools prevents developer frustration during onboarding.

**Action:**
Updated all documentation (README, QUICKSTART, BLUEPRINT, SECURITY) to explicitly state the operational status of tools. Consolidated headings with emojis and ensured that `npm` (bundled with Node.js) is the documented package manager for maximum first-time success, while noting that `pnpm` is also supported. Updated IndexedDB version to 9 across all documents. Verified that `npm run dev` works with a local `http-server` installation and that `python3 verification/verify_idb.py` passes on the v9 schema.

## 2026-03-31 - [IndexedDB Schema Enumeration]

**Observation:**
The `EECOLIndexedDB` class (version 8) manages 14 distinct object stores. Some stores are for calculators (e.g., `markConverter`), while others are for operational logs (e.g., `cuttingRecords`).

**Learning:**
Maintaining documentation that matches the schema version (currently v8) is critical for newcomers debugging the Application panel in DevTools.

**Action:**
Updated `BLUEPRINT.md` to enumerate all 14 stores and their purposes, providing a clear map for future data-driven feature development. Syncing store list with `src/core/database/indexeddb.js` version 9.

## 2026-05-20 - [Scribe: Full documentation refresh]

**Observation:**
Discovered that `BLUEPRINT.md` and `README.md` were lagging behind the actual `EECOLIndexedDB` version (v9) and store configurations. The verification script `verify_idb.py` was also targeting version 9, creating a discrepancy with the docs stating version 8.

**Learning:**
Always verify documentation against the source of truth (`indexeddb.js`) and existing verification scripts (`verify_idb.py`) before finalizing. Documentation-first agents must ensure that "Get Started" commands are not just present, but functional in the current environment.

**Action:**
Synchronized all documentation to IndexedDB v9. Refactored `QUICKSTART.md` for a 90-second "Happy Path". Standardized `SECURITY.md` with a complete hardening checklist. Enumerated all 14 stores in `BLUEPRINT.md` to provide a complete map of the local data layer. Verified everything via `markdownlint` and `verify_idb.py`.

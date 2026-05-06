# Blueprint 🧱

> **Goal:** Provide a fast mental model—components, boundaries, and critical flows.

## 🏛️ System Overview

```text
                    +-------------------------+
   Browser/Client   |         Frontend        |
  +--------------+  |  Vanilla JS (ESM)       |
  |  User Agent  |--|  Tailwind CSS + HTML5   |
  +--------------+  +------------+------------+
                                  |
                                  | window.eecolDB
                                  v
                    +-------------+-------------+
                    |      EECOLIndexedDB       |
                    |   (Singleton Pattern)     |
                    |   Database Version: 9     |
                    +-------------+-------------+
                                  |
             +--------------------+--------------------+
             |                                         |
             v                                         v
  +---------------------+                   +---------------------+
  |   Service Worker    |                   |    IndexedDB        |
  | (sw.js) Caching     |                   |  14 Object Stores   |
  | Offline Capability  |                   |  Local-First Data   |
  +---------------------+                   +---------------------+
```

## 🔄 Data Flow (Happy Path)

1. **User Action**: User enters data into a tool (e.g., Cutting Records).
2. **Persistence**: Frontend calls the `EECOLIndexedDB` singleton via `window.EECOLIndexedDB.getInstance()`.
3. **Local Storage**: Data is written directly to a specialized IndexedDB store (e.g., `cuttingRecords`) using `relaxed` durability.
4. **Offline Access**: Service worker (`sw.js`) serves cached HTML/JS/CSS assets even without connectivity.
5. **Retrieval**: Analytics tools query IndexedDB to render real-time charts via Chart.js.

## 🗄️ Database Architecture (v9)

The application uses **14 specialized stores** within the `EECOLTools_v2` database:

- **Record-Keeping**: `cuttingRecords`, `inventoryRecords`, `maintenanceLogs`.
- **Calculators**: `markConverter`, `stopmarkConverter`, `reelcapacityEstimator`, `reelsizeEstimator`, `wireCutList`.
- **Engineering**: `calibrationMeasurements`, `multicutPlanner`.
- **Core**: `settings`, `users`, `notifications`, `sessions`.

### Store Enumerable

| Store Name | Key Path | Primary Purpose |
| :--- | :--- | :--- |
| `cuttingRecords` | `id` | Logs and analysis of wire cuts. |
| `inventoryRecords` | `id` | Material management and tracking. |
| `users` | `id` | Local user profiles and roles. |
| `notifications` | `id` | Local system alerts and reminders. |
| `maintenanceLogs` | `id` | Equipment inspection checklists. |
| `markConverter` | `id` | Wire mark calculation history. |
| `stopmarkConverter` | `id` | Stop mark calculation history. |
| `reelcapacityEstimator` | `id` | Reel capacity calculation history. |
| `reelsizeEstimator` | `id` | Reel size calculation history. |
| `multicutPlanner` | `id` | Planning for multiple reel cuts. |
| `settings` | `name` | Application-wide local configurations. |
| `sessions` | `sessionId` | Local session management. |
| `calibrationMeasurements` | `id` | Machine calibration tracking. |
| `wireCutList` | `id` | Queue of pending wire cuts. |

## 📁 Repos & Conventions

- **Pages**: `/src/pages/<tool-name>/` (HTML/JS/CSS for specific tools).
- **Database**: `/src/core/database/indexeddb.js` (Singleton implementation).
- **Assets**: `/src/assets/` (Shared CSS, JS, and PWA assets).
- **Utilities**: `/src/utils/` (Sanitization, modals, and helper functions).
- **Print Utility**: `/src/utils/print/` (Modular print logic organized by domain).

## 💡 Key Decisions

- **Local-First**: Zero backend dependencies to ensure 100% uptime in industrial environments.
- **Vanilla JS**: Chosen for longevity and to minimize framework-induced maintenance debt.
- **IndexedDB**: Used over LocalStorage for structured, high-capacity data persistence. Target version is **9**.
- **ESM Hybrid**: Transitioning towards ES Modules (`type="module"`) while maintaining global shims for backward compatibility.
- **Relaxed Durability**: Uses `durability: 'relaxed'` in IDB transactions for optimal UI responsiveness.

## ⚠️ Risks & Trade-offs

- **Device Binding**: Data is local to the device/browser. Backup/Restore is a manual JSON-based process.
- **Storage Quotas**: Reliant on browser-enforced storage limits.
- **Syncing**: No multi-device sync; requires manual export/import for data transfer.

---

### Additional Docs

- [README.md](README.md) - General info
- [QUICKSTART.md](QUICKSTART.md) - Setup steps
- [SECURITY.md](SECURITY.md) - Security details

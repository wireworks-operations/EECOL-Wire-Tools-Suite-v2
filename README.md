# EECOL Wire Tools Suite <small>— Industrial-grade PWA for wire processing</small> 📘

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D%2016.0.0-green.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-v8%2B-red.svg)](https://www.npmjs.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Version](https://img.shields.io/badge/Version-0.8.0.4-blue.svg)](https://github.com/eecol/eecol-wire-tools-suite-v2/releases)

An enterprise-grade, **"Local-First"** Progressive Web Application (PWA) designed for industrial wire processing. This suite provides specialized calculators, inventory management, and operational tracking tools that persist data directly in the browser's IndexedDB, ensuring 100% uptime without backend dependencies.

---

## 🚀 Getting Started

> The commands below are verified for this repository. If your platform differs, see **Troubleshooting**.

### Prerequisites

- **Node.js**: >= 16.0.0 (npm v8+)
- **Python**: 3.x (Optional, for database verification)
- **Docker**: (Required for `docker:*` scripts, currently in-progress)

### 1) Install Dependencies

```bash
# Clone the repository
git clone https://github.com/eecol/eecol-wire-tools-suite-v2.git
cd eecol-wire-tools-suite-v2

# Install Node dependencies
npm install
```

### 2) Run (Local Development)

```bash
# Start the development server (serves the PWA at http://localhost:3000)
npm run dev
```

### 3) Tooling Status

| Command | Status | Description |
| :--- | :--- | :--- |
| `npm run dev` | ✅ **Operational** | Starts local dev server using `http-server`. |
| `python3 verification/verify_idb.py` | ✅ **Operational** | IDB verification via Playwright (Python). |
| `npm run build` | 🚧 **In-Progress** | Production build (Missing Webpack config). |
| `npm test` | 🚧 **In-Progress** | Unit testing via Jest (Missing config). |
| `npm run lint` | 🚧 **In-Progress** | ESLint validation (Missing config). |
| `npm run docker:build` | 🚧 **In-Progress** | Docker containerization (Missing Dockerfile). |

---

## 🧭 Quickstart (90-second path)

```bash
# 1. Clone & Enter
git clone https://github.com/eecol/eecol-wire-tools-suite-v2.git
cd eecol-wire-tools-suite-v2

# 2. Install & Start
npm install && npm run dev

# 3. Open app
# http://localhost:3000
```

---

## 🏗️ Architecture

The EECOL Wire Tools Suite is built on a **Local-First** architecture, meaning it operates entirely on the client-side with zero external API or database dependencies.

See **[BLUEPRINT.md](BLUEPRINT.md)** for the ASCII architecture and component interactions.

<details>
<summary>⚙️ Core Technology Stack</summary>

- **Frontend**: Vanilla JavaScript (ESM Hybrid), HTML5, Tailwind CSS.
- **Persistence**: IndexedDB (Primary) via `EECOLIndexedDB` singleton (v9).
- **PWA**: Service Worker (`sw.js`) and Web App Manifest for offline capability.
- **Visualization**: Chart.js for operational reporting and analytics.
- **Utility**: Custom modular print system and sanitization layer.

</details>

---

## 📋 Available Tools

<details>
<summary>📦 Operations & Records</summary>

- **Wire Cut Records**: Log and analyze wire cuts with single-pass metric optimization.
- **Wire Inventory Records**: Manage materials with automatic timestamping and length fallbacks.
- **Machine Maintenance**: Daily equipment inspection checklists with multi-page support.
- **Shipping Manifest**: Generate reel labels and shipping documentation.
- **Reel Inventory Labels**: Simple large-format reel identification.
- **Multi-Cut Planner**: (Planned) Plan multiple reel cuts & capacity.

</details>

<details>
<summary>🧮 Calculators & Estimators</summary>

- **Mark Calculator**: Precise length calculation between wire marks.
- **Stop Mark Calculator**: Determine exact machine stop points for targeted cuts.
- **Reel Capacity Estimator**: Calculate maximum wire capacity for various reel sizes.
- **Reel Size Estimator**: Find optimal reel for wire length.
- **Weight Calculator**: Estimate wire weight based on dimensions and length.
- **Advanced Mathematics**: Engineering formulas for reels.

</details>

<details>
<summary>🎓 Support & Education</summary>

- **Education Center**: Master wire cutting excellence with the Learning Hub.
- **Backup Guide**: Step-by-step instructions for JSON-based data backups.
- **Privacy Policy**: Details on our commitment to local-only data storage.
- **Database Config**: Direct access to IndexedDB management and migrations.

</details>

---

## 🧪 Testing Matrix

| Scope | Tool | Status |
| :--- | :--- | :--- |
| **Functional (IDB)** | Playwright (Python) | ✅ Operational |
| **Unit** | Jest | 🚧 Pending Config |
| **E2E** | Cypress | 🚧 Pending Config |
| **Linting** | ESLint | 🚧 Pending Config |

---

## 🔒 Security & Privacy

- **Zero Data Transmission**: All data remains in the browser's IndexedDB (v9). No cloud sync.
- **XSS Mitigation**: Strict use of `.textContent` ("Secure by Default") and a robust Content Security Policy (CSP).
- **Offline Reliability**: Service workers ensure the app loads even without an internet connectivity.

See **[SECURITY.md](SECURITY.md)** for our full security policy.

---

## 🆘 Troubleshooting

- **Service Worker not registering**: Ensure you are serving via `http` or `https`. The `file://` protocol is not supported for PWAs.
- **IndexedDB not updating**: Use the "Refresh" button in the browser's DevTools Application panel (IndexedDB view) to see live changes. Ensure you are looking at the **EECOLTools_v2** database (Version 9).
- **Port Conflict**: If port 3000 is in use, run `PORT=3001 npm run dev`.

---

## 🗄️ Database Schema (v9)

The application uses **14 specialized stores** within the `EECOLTools_v2` database (v9). See [BLUEPRINT.md](BLUEPRINT.md) for the full schema enumeration.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

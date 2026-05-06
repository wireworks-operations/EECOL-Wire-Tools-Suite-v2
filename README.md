# EECOL Wire Tools Suite <small>— Industrial-grade PWA for wire processing</small> 📘

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D%2018.0.0-green.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-v9%2B-red.svg)](https://www.npmjs.com/)
[![React](https://img.shields.io/badge/React-v18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-v5-purple.svg)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Version](https://img.shields.io/badge/Version-0.9.0-blue.svg)](https://github.com/wireworks-operations/EECOL-Wire-Tools-Suite)

An enterprise-grade, **"Local-First"** Single Page Application (SPA) refactored to **React, Vite, and TypeScript**. This suite provides specialized calculators, inventory management, and operational tracking tools that persist data directly in the browser's IndexedDB, ensuring 100% uptime without backend dependencies.

---

## 🚀 Getting Started

> The commands below are verified for this repository. If your platform differs, see **Troubleshooting**.

### Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0

### 1) Clone & Install

```bash
git clone https://github.com/wireworks-operations/EECOL-Wire-Tools-Suite.git
cd EECOL-Wire-Tools-Suite
npm install
```

### 2) Run (Local Development)

```bash
# Start the Vite development server (serves the SPA at http://localhost:5173)
npm run dev
```

### 3) Tooling Status

| Command | Status | Description |
| :--- | :--- | :--- |
| `npm run dev` | ✅ **Operational** | Starts local dev server using Vite. |
| `npm run build` | ✅ **Operational** | Production build using Vite + TSC. |
| `npm run type-check` | ✅ **Operational** | TypeScript validation. |
| `npm run lint` | ✅ **Operational** | ESLint validation for React/TS. |
| `npm run preview` | ✅ **Operational** | Preview the production build locally. |

---

## 🧭 Quickstart (60-second path)

```bash
# 1. Clone the repository
git clone https://github.com/wireworks-operations/EECOL-Wire-Tools-Suite.git
cd EECOL-Wire-Tools-Suite

# 2. Install dependencies and start the app
npm install && npm run dev

# 3. Open app
# http://localhost:5173/EECOL-Wire-Tools-Suite/
```

---

## 🏗️ Architecture

The EECOL Wire Tools Suite is built on a **Local-First** React architecture, meaning it operates entirely on the client-side with zero external API or database dependencies.

See **[BLUEPRINT.md](BLUEPRINT.md)** for the ASCII architecture and component interactions.

<details>
<summary>⚙️ Core Technology Stack</summary>

- **Frontend**: React 18, TypeScript 5, Vite 5.
- **Styling**: Tailwind CSS 3 (with Native Dark Mode support).
- **Persistence**: IndexedDB (Primary) via `EECOLIndexedDB` singleton service.
- **PWA**: `vite-plugin-pwa` for service worker and manifest generation.
- **Visualization**: Chart.js with `react-chartjs-2`.
- **Icons**: Lucide React.

</details>

---

## 📋 Available Tools

<details>
<summary>📦 Operations & Records</summary>

- **Wire Cut Records**: Log and analyze wire cuts with single-pass metric optimization.
- **Inventory Records**: Manage materials with automatic timestamping and length fallbacks.
- **Machine Maintenance**: Daily equipment inspection checklists with multi-page support.
- **Shipping Manifest**: Generate reel labels and shipping documentation.
- **Reel Inventory Labels**: Simple large-format reel identification.

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

- **Zero Data Transmission**: All data remains in the browser's IndexedDB. No cloud sync.
- **XSS Mitigation**: Strict use of `.textContent` ("Secure by Default") and a robust Content Security Policy (CSP).
- **Offline Reliability**: Service workers ensure the app loads even without an internet connection.

See **[SECURITY.md](SECURITY.md)** for our full security policy.

---

## 🆘 Troubleshooting

- **Service Worker not registering**: Ensure you are serving via `http` or `https`. The `file://` protocol is not supported for PWAs.
- **IndexedDB not updating**: Use the "Refresh" button in the browser's DevTools Application panel (IndexedDB view) to see live changes.
- **Port Conflict**: If port 3000 is in use, run `PORT=3001 npm run dev`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

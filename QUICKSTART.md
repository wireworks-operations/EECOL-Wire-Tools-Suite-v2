# Quickstart ⚡

This path gets you from **clone → running app** in under 90 seconds.

## 📋 Prerequisites

- **Node.js**: >= 16.0.0 (npm v8+)
- **Python**: 3.x (Optional, for verification)

## 1) Clone & Enter

```bash
git clone https://github.com/eecol/eecol-wire-tools-suite-v2.git
cd eecol-wire-tools-suite-v2
```

## 2) Install & Start

```bash
# Install dependencies
npm install

# Start the application locally
npm run dev
```

## 3) Access App

- **App URL**: [http://localhost:3000](http://localhost:3000)
- **Database**: [http://localhost:3000/src/pages/database-config/database-config.html](http://localhost:3000/src/pages/database-config/database-config.html)

## 4) Verify

```bash
# Run IndexedDB functional verification (requires Playwright/Python)
python3 verification/verify_idb.py
```

---

### 🏗️ Architecture & Security

The application is **entirely client-side** (Local-First). All data is stored securely in your browser's IndexedDB (v9).

- [README.md](README.md) - Full installation guide
- [BLUEPRINT.md](BLUEPRINT.md) - System architecture
- [SECURITY.md](SECURITY.md) - Security policy

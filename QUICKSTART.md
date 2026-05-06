# Quickstart ⚡

This path gets you from **clone → running app** in under 90 seconds.

## 📋 Prerequisites

- **Node.js**: >= 16.0.0
- **npm**: (Bundled with Node.js) or **pnpm** / **yarn**

## 1) Clone & Enter

```bash
git clone https://github.com/eecol/eecol-wire-tools-suite-v2.git
cd eecol-wire-tools-suite-v2
```

## 2) Install & Start

```bash
# Install dependencies
npm install  # or pnpm install / yarn install

# Start the application locally
npm run dev
```

## 3) Access App

- **URL**: [http://localhost:3000](http://localhost:3000)

## 4) Verify

```bash
# Optional: Run IndexedDB functional verification (requires Playwright)
python3 verification/verify_idb.py
```

---

### 🛡️ Local-First Note

The application is **entirely client-side**. No backend or database setup is required. All data you enter is stored securely in your browser's IndexedDB.

### For deeper setup and architecture

- [README.md](README.md) - Full installation guide
- [BLUEPRINT.md](BLUEPRINT.md) - System architecture
- [SECURITY.md](SECURITY.md) - Security policy

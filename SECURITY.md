# Security Policy 🔐

## 📊 Supported Versions

| Version | Supported           |
| :------ | :------------------ |
| 0.8.x   | ✅ Security updates |
| main    | ✅ Security updates |

## 🛡️ Reporting a Vulnerability

We take all security bugs in this project seriously. To report a security vulnerability, please follow these steps:

1. **Email:** <lucas.kara@eecol.com>
2. **Private Issue:** GitHub Security Advisory (preferred for public repos).
3. **Response Target:** Acknowledge within **48 hours**.

**Please do not** publicly disclose vulnerabilities until a fix is released.

---

## 🏛️ Security Posture

This application is designed as a **local-first** Progressive Web App (PWA). All data is stored exclusively on the client-side using IndexedDB, with no server-side components or cloud services involved.

### Architecture Security

- **Client-Side Only**: No backend server, API calls, or external data transmission for user data.
- **Offline-First Design**: All functionality works without internet connectivity once the initial assets are cached.
- **PWA Isolation**: Service workers manage caching of static assets only.

### Data Storage Security

- **No Cloud Storage**: All data remains on the user's device. No cloud storage or synchronization.
- **No Encryption at Rest**: Data stored in IndexedDB is not encrypted by the application.
- **Browser Protection**: Security depends on the user's operating system and browser's "Same-Origin Policy" (SOP).

### Hardening Checklist

- [x] **Content Security Policy (CSP)**: Strict policy implemented in `index.html` including fonts and CDN scripts.
- [x] **Secure by Default** Rendering: Strict use of `.textContent` over `innerHTML` for user-controllable data.
- [x] **Sanitization Layer**: Manual escaping using `window.escapeHTML` (uppercase HTML) where necessary.
- [x] **Subresource Integrity (SRI)**: Integrity hashes used for all CDN dependencies (Chart.js, jsPDF).
- [ ] **Automated Dependency Scanning**: (Planned).

### Attack Vector Analysis

#### Mitigated Threats

- **Server-Side Attacks**: Not applicable (no server).
- **SQL Injection**: Not applicable (uses IndexedDB).
- **Authentication Bypass**: Not applicable (no server-side authentication).
- **CSRF**: Not applicable (no server-side state changes).

#### Potential Attack Vectors

- **Cross-Site Scripting (XSS)**: Mitigated by a strict CSP and consistent use of sanitization utilities and native browser protections (`textContent`).
- **Physical Access**: Anyone with physical access to the device can inspect IndexedDB contents via browser dev tools. Users are encouraged to secure their devices.

---

### 👤 Contact & Keys

- **Maintenance Lead**: EECOL Tools Team (@lucas.kara)

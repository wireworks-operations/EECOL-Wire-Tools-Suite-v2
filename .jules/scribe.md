# Scribe's Journal 📘

Critical learnings and repository architectural insights.

## 2026-04-15 - [React/Vite/TypeScript Refactor v0.9.0]

**Observation:**
Refactoring a legacy ESM/Vanilla codebase of this scale (70+ modules) to a React SPA requires strict adherence to modularity and separation of concerns. The 250-line-per-file constraint proved invaluable for maintaining clarity during the porting of complex calculators and the IndexedDB singleton service.

**Learning:**
React's component-based architecture significantly simplifies the "Local-First" pattern. By wrapping the IndexedDB singleton in a custom hook (`useDatabase`), we achieved consistent data access across all tools while centralizing the "isReady" logic. This eliminates the race conditions often found in the legacy vanilla implementation where scripts might try to access the DB before initialization.

**Action:**
1.  **Environment Transformation**: Transitioned from a multi-page legacy setup to a high-performance Vite SPA.
2.  **Persistence Layer**: Ported the IndexedDB v8 schema to a TypeScript service, ensuring type safety for all 14+ data stores.
3.  **Modern UI**: Replaced custom CSS with Tailwind CSS, enabling native dark mode support through simple utility classes.
4.  **Verification Strategy**: Replaced manual verification with a Playwright visual audit suite, ensuring 100% route coverage and aesthetic consistency across 11 primary views.
5.  **Documentation**: Overhauled `README.md` and `BLUEPRINT.md` to reflect the new technology stack and modern development workflow.

## 2026-03-31 - [Full Documentation Refresh v0.8.0.4]

... [Historical entries preserved] ...

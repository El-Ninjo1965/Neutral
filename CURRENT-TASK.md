# CURRENT TASK – OFFLINE-FIRST MODULE START

**Status:** IMPLEMENTIERT UND LOKAL VERIFIZIERT – DEPLOYMENT AUSSTEHEND
**Datum:** 2026-09-12

- [x] Failing delayed/offline/lifecycle behavior captured.
- [x] Generic versioned sanitized public/offline projection implemented.
- [x] GPS declared public/offline and removed from User RBAC/Package/Entitlement base gating.
- [x] Projection hydrated through existing registry before first render.
- [x] Background reconciliation updates navigation/open Settings without Welcome full-render.
- [x] Admin lifecycle updates public projection; deactivation prevents future offline hydration.
- [x] Corrupt/incompatible projection fails closed and contains no auth material.
- [x] Profile/Moderation remain permission-sensitive; catalog errors remain retryable.
- [x] Accepted Details/Save/Theme/Table/GPS UI contracts retained.
- [x] Full suite (560/560), JS syntax, PHP lint, diff check and 136-file production package.
- [ ] Commit, push, CodeQL, FTPS and production smoke.

Core Freeze remains not declared.

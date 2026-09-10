# Neutral Core 1.0 — Freeze Readiness Audit

**Audit:** 2026-09-10
**Decision:** **NOT YET CORE 1.0 BESTANDEN**

## Installation and portability

| Requirement | Classification | Evidence / remaining acceptance |
|---|---|---|
| Empty shared-host setup, DB, migrations, first user | HOST ACTION REQUIRED | Setup/migrator contracts and automated fixtures exist; a fresh compatible shared-host installation must still be executed end-to-end. |
| Host-only secrets | VORHANDEN + TEST/BELEG | Public package/secret scans and protected runtime paths are automated. |
| Central app/API addresses | VORHANDEN + TEST/BELEG | Base-path resolver and subpath tests. |
| Reproducible package/update | VORHANDEN + TEST/BELEG | Manifest, hashes, deploy stamp, FTPS revision smoke. |
| Backup/restore/move | CODE/ISOLATED COMPLETE · HOST ACTION REQUIRED | V2 includes all Core tables, generically declared installed-module tables and managed media bytes; v1 remains compatible. Sessions/throttle are intentionally cleared. Cron and remaining real host/move acceptance remain open. No production restore. |

## Client / Offline

Public Core contracts, events/services, timeout API, module-separated local storage, offline state, responsive shell and client/server trust separation are **VORHANDEN + TEST/BELEG**. The corrected free-value Packages/Licenses/User-limit controls, manager selection and three-select Birthday UX are **DEVICE RETEST REQUIRED** on iPad/Chrome.

## Server / Admin

Auth, parallel scoped sessions, CSRF, RBAC, users/roles/permissions, module/settings/audit, database/migration status, throttle fallback, cookies and HTTPS are **VORHANDEN + TEST/BELEG**; User/Admin login and GPS basis are additionally **LIVE BESTANDEN** per operator retest. Package/License/Device management and production Audit Delete All are **DEVICE RETEST REQUIRED**. Backup operation remains **HOST ACTION REQUIRED**.

License Delete now has code/test evidence for unreferenced success, assignment blocking, transaction/audit and unchanged Package data. Session UI has code/test evidence for User ID plus stable Installation ID and conservative platform fixtures. The operator confirmed the real protected Backup Storage Path, key/crypto/schema readiness and manual create. Isolated tests prove exact round-trip and rollback for all 21 portable Core tables, but module-owned data and media binaries remain outside the artifact; therefore **BACKUP CONTRACT PARTIAL** and no Core Freeze.

## Modules

Manifest/compatibility, discovery, inactive install, activation/deactivation/update/uninstall, permission/limit enforcement, module-owned PHP routes/services, checksummed SQL migration/rollback compensation, declarative settings and provider boundaries are **VORHANDEN + TEST/BELEG** for the distinct `gps` and `reference-notes` references. No product-specific Core hook was added.

## Quality / release decision

Positive/negative automated suites, PHP/JS static checks, package and deployment smoke are present. No known Critical/High issue is recorded. Final status remains blocked by the explicitly listed **HOST ACTION REQUIRED** and **DEVICE RETEST REQUIRED** evidence; therefore the release must not be marked `BESTANDEN` or frozen yet.

# CURRENT TASK – CRITICAL AUTH / SESSION RECOVERY

**Status:** IMPLEMENTED / DEPLOYMENT PENDING
**Datum:** 2026-09-11
**Quelle:** `CODEX.md`

Kein Core Freeze, kein Production Restore, keine Secrets und keine UI-Fallbacks, die Authfehler verdecken.

## Root Cause / Reparatur

- [x] User Login Request, Cookie, PHP-Session, DB-Session, nullable Expiry und `/auth/me` end-to-end prüfen.
- [x] Admin Login, eigener Cookie/Scope und repräsentative Adminendpoints end-to-end prüfen.
- [x] Verlust/GC der PHP-Sessiondatei darf eine weiterhin gültige DB-Session nicht als `Not authenticated` behandeln.
- [x] User/Admin-Scope serverseitig dauerhaft trennen; keine Cross-Scope-Wiederherstellung.
- [x] User-Persistenz, Logout/Revoke, Device-Limit und Login-Throttling erhalten.
- [x] Anonyme explizit freigegebene Module dürfen nicht auf Session-Recovery warten.
- [x] User Eye lokal im Passwort-Control positionieren und Pointer-Hold-Verhalten layoutnah prüfen.

## Verifikation / Abschluss

- [x] Integrationsnahe User Login → Cookie → `/auth/me` → Logout Tests.
- [x] Integrationsnahe Admin Login → Cookie → mehrere Adminendpoints Tests.
- [x] Getrennte User-/Admin-Session gegenseitig regressionsfrei testen.
- [x] Vollständige Suite, PHP-Lint, JS-Syntax, `git diff --check` und Production Package.
- [x] Read-only Production Smoke um sichere Auth-Basics erweitern.
- [x] Geforderte Dokumentation wahrheitsgemäß synchronisieren.
- [ ] Commit/Push `main`, CodeQL/FTPS terminal, read-only Production Smoke.
- [ ] `CHATGPT.md` auf einen aktuellen Abschlussstand und genau die drei priorisierten Blocker-Retests reduzieren.

Bis zur realen Betreiberbestätigung: **OPERATOR RETEST REQUIRED**. Kein Core Freeze.

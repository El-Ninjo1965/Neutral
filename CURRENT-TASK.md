# CURRENT TASK – USER LOGIN PASSWORD SICHTBAR

**Status:** DEPLOYED / OPERATOR RETEST REQUIRED
**Datum:** 2026-09-11
**Quelle:** `CODEX.md`

- [x] User-Login-Passwortfeld dauerhaft als `type="text"` rendern.
- [x] User-Eye und sämtliche User-Hold-/Helper-Bindelogik entfernen.
- [x] Nicht mehr benötigtes User-Hold-Asset aus Shell und Service Worker entfernen; Admin-Helper unverändert lassen.
- [x] Login-Submit-Flow unverändert und verhaltensnah funktionsfähig prüfen.
- [x] User Login normal/Inkognito und Admin Login regressionsfrei automatisiert prüfen.
- [x] Vollsuite, JS-Syntax, PHP-Lint, `git diff --check`, Production Package.
- [x] `CHATGPT.md`, `CURRENT-TASK.md`, `UI-UX.md` und Change-Historie wahrheitsgemäß aktualisieren.
- [x] Commit/Push `main`; CodeQL, FTPS und read-only Production Smoke terminal prüfen.

Operator-Retest danach ausschließlich: User Login normal, User Login Inkognito, Passwort dauerhaft sichtbar, kein Eye. Kein Core Freeze.

# CURRENT TASK – USER LOGIN PASSWORD EYE

**Status:** IMPLEMENTED / DEPLOYMENT PENDING
**Datum:** 2026-09-11
**Quelle:** neuester Betreiberauftrag

- [x] User Login als normales browser-autofillfähiges `type="password"`-Feld mit `name` und `autocomplete="current-password"` rendern.
- [x] Genau einen statischen Eye-Button direkt im Passwort-Control rendern.
- [x] Einfacher lokaler Klick: verborgen ↔ sichtbar; Wert und Autofill unverändert.
- [x] Keine externe Helper-Abhängigkeit, kein Observer, kein Hold, kein Auth-/Session-/Admin-Umbau.
- [x] Login-Submit mit verborgenem und sichtbarem Passwort verhaltensnah testen.
- [x] Browser-Autofillattribute, genau ein Eye und Toggle-Verhalten testen; Admin regressionsfrei halten.
- [x] Vollsuite, JS-Syntax, PHP-Lint, `git diff --check`, Production Package.
- [x] `CHATGPT.md`, `CURRENT-TASK.md`, `UI-UX.md` und Change-Historie wahrheitsgemäß aktualisieren.
- [ ] Commit/Push `main`; CodeQL, FTPS und read-only Production Smoke terminal prüfen.

Operator-Retest: Browserpasswort wird eingesetzt; Eye-Klick zeigt/versteckt denselben Wert; Login normal und Inkognito. Kein Core Freeze.

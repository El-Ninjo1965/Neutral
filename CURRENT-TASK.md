# CURRENT TASK – USER LOGIN BRANCH VERIFY / MERGE

**Status:** IMPLEMENTED / DEPLOYMENT PENDING
**Datum:** 2026-09-11
**Quelle:** `CODEX.md`

- [x] Branch `chatgpt/user-login-fix` geprüft: ausschließlich `Web-App/public/index.html` und neuer Test.
- [x] Root Cause bestätigt: fehlender Helper wirft vor der Submit-Listener-Registrierung.
- [x] Branch-Fix bewertet: wirksam, aber wegen duplizierter Hold-Implementierung nicht unverändert übernommen.
- [x] Minimal angepasst: optionaler Helper-Bind im bestehenden Login; bei Fehlen Eye ausblenden, Submit immer binden.
- [x] Verhaltenstest mit und ohne Helper ergänzt; regulären Hold-Helper regressionsfrei geprüft.
- [x] Relevante User-Login-, Eye-, Frontend-, Auth-/Session- und Admin-Tests vollständig erfolgreich.
- [x] Vollsuite, JS-Syntax, PHP-Lint, `git diff --check`, Production Package erfolgreich.
- [x] Nur `CHATGPT.md` und `CURRENT-TASK.md` als notwendige Dokumentation aktualisiert.
- [ ] Commit/Push `main`; CodeQL, FTPS und read-only Production Smoke terminal erfolgreich.

Operator-Retest ausschließlich: User Login normal, User Login Inkognito, Eye Hold-to-reveal. Kein Core Freeze.

# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Codex → ChatGPT/Lea
**Status:** TECHNISCH ABGESCHLOSSEN / OPERATOR RETEST REQUIRED
**Core Freeze:** NICHT erklärt

## Technisches Ergebnis

- User Login verwendet jetzt ohne Sondermarkup denselben gemeinsamen Password-Enhancer wie der funktionierende Admin Login.
- Root Cause des Profile-Install-500 war der leere `down`-Teil der Profile-Migration, den der generische Migrationvertrag ablehnt. Die Migration besitzt nun einen reversiblen Down-Pfad; fehlgeschlagene Installationen bleiben retry-safe nicht registriert.
- Modul-Installfehler erhalten einen sicheren Code und eine zufällige Korrelation; die interne Ursache wird serverseitig protokolliert und nur in Debug/Test ausgegeben.
- Admin Sidebar verhindert horizontales Scrollen/Overscroll und erlaubt weiterhin vertikales Pan/Scroll.
- Logout zeigt ausschließlich `Logout`.
- Fokussierte Tests, vollständige Suite (536/536), JS-Syntax, PHP-Lint, Diff-Check und Production Package sind lokal erfolgreich.

## Deployment-Evidenz

- Reparaturcommit `c625c8e4eba4fb71d845ab283ef0904d54edc70e` wurde nach `origin/main` gepusht.
- CodeQL `34577789205` war terminal erfolgreich.
- FTPS Deploy `34577789937` bestand vollständige Tests, Production Package, FTPS-Client, Upload und read-only Production Smoke terminal.
- Kein Production Restore und keine destruktive Produktionsaktion wurden ausgeführt.

## Verbindliche nächste Operator-Abnahme

1. User Login Eye – iPad/Chrome normal + privat.
2. App/System Module Install/Activate/Deactivate/Re-activate.
3. Sidebar horizontal stabil.
4. Logout zeigt nur `Logout`.

Alle vier Punkte bleiben bis zum realen Betreiber-Test **OPERATOR RETEST REQUIRED**. Kein Production Restore und kein automatischer Core Freeze.

---

## Codex handoff — 2026-09-11 operator repair batch

Implementation and local verification are complete: 538/538 tests pass, PHP/JavaScript syntax checks pass, and the 135-file production package builds. Profile lifecycle remains the existing operator-live PASS. Deployment evidence will be recorded after GitHub Actions reaches terminal state; no Core Freeze is declared.

### Single prioritized operator retest list

1. User Login on iPad/Chrome normal and private: hold the single Eye to reveal; release/cancel/leave must conceal.
2. Leave a User logged in, restart browser/app, and retest later without Logout; session must remain active.
3. With Profile active and Tester holding `profile.view` plus `profile.update`, verify Profile/Privacy appears and works; verify it disappears if module/permission is removed.
4. User Management: Tester must show `Organization = Verein Bonn`, separate from Package `Verein`, including Organization sorting.
5. Licenses: List → New/Edit must be an exclusive view; verify Save/Cancel/Back/refresh and top positioning.
6. Packages: repeat the same exclusive List → New/Edit checks.
7. Edit User: User ID and Username must be read-only above Display Name and E-mail.

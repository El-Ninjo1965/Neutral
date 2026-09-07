# NEUTRAL – Status

**Status:** IN ARBEIT / DEVICE RETEST REQUIRED (nach Device-Retest #1 Fehlschlag am 2026-09-07 erneut korrigiert)
**Geprüft:** 2026-09-07
**Reference:** Repository + PHP 8.3 validation + full `npm test` suite + realer iPad-Device-Retest #1

## Current device-live status
- Device-Retest #1 nach Commit `87bfc31` ist FEHLGESCHLAGEN: Ein Login als Developer/Admin über die User-App führte im Adminbereich weiterhin zu `Access denied – Administrative access requires an authorized role.`, statt das separate Admin-Loginformular zu zeigen.
- Root Cause: `Server/public/admin.php` fiel bei fehlender Admin-Session zusätzlich auf das User-App-Cookie (`neutral_session`) zurück und interpretierte jede vorhandene User-App-Session fälschlich als Admin-Identitäts-Kandidat.
- Fix: `admin.php` liest jetzt ausschließlich das Admin-Scope-Cookie (`neutral_admin_session`); der Legacy-Fallback auf `neutral_session` wurde entfernt.
- Neue Regressionstests bestätigen: reine User-Session → Admin-Loginformular (nicht Access Denied); User-Session mit Admin-Rolle ohne separate Admin-Session → weiterhin Admin-Loginformular; parallele Admin- und User-Sessions → korrekte Admin-UI.
- Aktueller Code-Status: `CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED`. Ein zweiter Device-Retest durch den Betreiber steht noch aus.

## Active issue status
- Zweite Root-Cause-Iteration abgeschlossen und mit gezielten Regressionstests abgesichert (`tests/admin-php-entry.test.js` Fall B2/B3/C3).
- Vollständige Suite (392/392) unter PHP 8.3 grün, PHP-Lint sauber, `git diff --check` sauber, Produktionspaket gebaut.
- `LIVE BESTANDEN` bleibt gesperrt, bis der Betreiber den zweiten realen Device-Retest erfolgreich durchführt.

## Historical root-cause evidence retained
The following historical conditions remain as documentation evidence and must not be deleted or rewritten:
- `User is not valid or active`
- `Set up the local developer account before logging in`
- `Server authentication client is not available`
- `No authenticated user was returned by the server`
- `Access denied – Administrative access requires an authorized role.` (Device-Retest #1, 2026-09-07: User-App-Session-Fallback in `admin.php`)

These conditions are historic evidence of earlier failures; they are not the current active status once the corresponding fix is validated by a successful live retest.

## Core work status
- User- and admin-session separation: CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED (zweite Iteration nach fehlgeschlagenem Retest #1)
- User-App header cleanup: DONE / DOCUMENTED
- Navigation as true buttons/tabs: DONE / DOCUMENTED
- Configurable landing page: PENDING
- i18n: PENDING
- Permission catalog UX improvements: PENDING
- Session overview enhancements: PENDING
- Settings/device acceptance: PENDING
- Light/Dark validation: PENDING
- GPS/device flow: PENDING
- Offline / airplane-mode / warm-start: PENDING
- Final cleanup and freeze gate: FUTURE

# CURRENT TASK – LIVE ROOT-CAUSE REPAIR

**Status:** TECHNISCH IMPLEMENTIERT / DEPLOYMENT-VERIFIKATION AUSSTEHEND
**Datum:** 2026-09-11
**Quelle:** `CODEX.md`

Kein Core Freeze, kein Production Restore, keine neuen Features und keine unnötigen Refactorings.

## Arbeitspunkte

- [x] **User Login Eye:** User Login verwendet nun denselben gemeinsamen Password-Enhancer wie der funktionierende Admin Login; genau ein generiertes Eye, `password ↔ text`.
- [x] **Module Install 500:** Profile-Migration erfüllte wegen leerem `down` nicht den generischen Migrationvertrag. Reversiblen Down-Pfad ergänzt; sichere Fehlerkorrelation und interne Ursachenprotokollierung ergänzt; Retry-safe-Kompensation bleibt erhalten.
- [x] **Admin Sidebar:** horizontales Overflow/Overscroll und intrinsische Verbreiterung blockiert; vertikales Scrollen/Pan bleibt erhalten.
- [x] **Logout:** zeigt ausschließlich `Logout`; Funktion unverändert.
- [x] Fokussierte Regressionstests ausgeführt.
- [x] Vollständige Testsuite, JS-Syntax, PHP-Lint und `git diff --check` ausgeführt.
- [x] Production Package und Modul-Migrations-/Lifecycleverträge geprüft.
- [ ] Commit/Push nach `main`; erforderliche CI/CodeQL/FTPS bis terminal abwarten.
- [ ] Read-only Production Smoke terminal prüfen.
- [ ] `CHATGPT.md` mit finalem Commit und tatsächlichem CI-/Deploymentergebnis abschließen.

## Operator-Retest nach technischer Fertigstellung

1. User Login Eye – iPad/Chrome normal + privat.
2. App/System Module Install/Activate/Deactivate/Re-activate.
3. Sidebar horizontal stabil.
4. Logout zeigt nur `Logout`.

Bis zur realen Bestätigung bleiben diese Punkte **OPERATOR RETEST REQUIRED**. Kein Core Freeze.

# CURRENT TASK — Admin Packages/Licenses/Devices, Profile UX, Audit und Freeze-Readiness

**Quelle:** `CODEX.md`, 2026-09-10
**Status:** IN ARBEIT

1. [x] `origin/main` synchronisiert; Pflicht-, Architektur-, Status-, UI/I18N-, Install-/Deployment- und betroffene Implementierungs-/Testdateien vollständig gelesen; **`CODEX.md == CURRENT-TASK-Anforderungen` geprüft.**
2. [x] Betreiberwahrheit übernehmen: User `Tester`, Admin `Developer`, parallele Scopes, deduplizierte Sessions, GPS-Basis und geprüfte Settings sind `LIVE BESTANDEN`; Backup bleibt `HOST ACTION REQUIRED`.
3. [x] Test-first neutrale Adminfläche Packages/Entitlements: CRUD/status, frei benannt/beschrieben, Module available/locked/hidden, Device-Default/unlimited, sichere Löschregel.
4. [x] Test-first Licenses/Organizations: CRUD/status, Package, Seats/unlimited, Manager, Used Seats, Users und Limit-Herkunft.
5. [x] User Create/Edit um License und Allowed-Devices-Default/Override/unlimited samt Used-Devices/Drill-down ergänzen; Senkung löscht keine Sessions.
6. [x] End-to-end Package-/License-/Device-Verträge inklusive Limits, Wechsel, Zustände, Seats, Scope und Auth-/Deduplizierungsregression prüfen.
7. [x] Birthday als mobile Datumsauswahl; serverseitig echtes Kalenderdatum/Leap-Year prüfen, optional löschbar, ISO ohne Zeitzonenverschiebung, Privacy default-off.
8. [x] Audit `Delete All` mit eigener Permission, doppelter Bestätigung, CSRF, Anzahl und neuem Nachweis-Eintrag implementieren; Retention erhalten.
9. [x] CORE-1.0-Anforderungen ausführbar als vorhanden/belegt, Device-Retest, Host-Action oder fehlt auditieren; nur kleine zwingende Corelücken schließen.
10. [x] Relevante Vertrags-, Status-, Todo-, Changelog-, Workflow- und Übergabedokumente wahrheitsgemäß aktualisieren.
11. [x] Vollständige Regression, PHP-Lint, JS-Syntax, `git diff --check`, Produktionspaket sowie Secret-/Artefaktprüfung.
12. [ ] Commit/push main; CodeQL/FTPS terminal; Revision, `migrationsReady:true`, sichere Smokes, HEAD/Origin, sauberer Tree und GitHub-CHATGPT verifizieren.
13. [x] Vollständigen `CHATGPT.md`-Bericht samt Restlücken und Betreiber-Retestliste liefern; kein voreiliges Core-1.0-BESTANDEN.

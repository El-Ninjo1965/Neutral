# CURRENT TASK — Live Admin Reality Check Phase 2

**Quelle:** `CODEX.md`, 2026-09-09
**Status:** CODE-SEITIG ERLEDIGT · DEPLOYED · DEVICE RETEST REQUIRED · HOST-CHECK REQUIRED
**Grenzen:** Root-Cause-Reparatur, keine Appearance-/i18n-Neuentwicklung, keine Secrets, kein destruktiver Produktions-Restore; P1/P4 regressionsfrei.

## Verbindliche Reihenfolge

1. [x] Mit `origin/main` synchronisieren; alle Pflichtdokumente und Phase-1-Dateien vollständig lesen; Auftrag vollständig erfassen.
2. [x] Capture prüfen: alle Abschnitte 1–17 aus `CODEX.md` sind in dieser Liste abgebildet; **`CODEX.md == CURRENT-TASK-Anforderungen` — bestanden.**
3. [x] Test-first Session-SQL reproduzieren und Device-Session-Fluss create/persist/list/current/revoke/cleanup sowie bestehende/idempotente Migration reparieren.
4. [x] Einen gemeinsamen Admin-PHP-Envelope-/DTO-Vertrag implementieren; Erfolg, optional unkonfiguriert und Fehler sichtbar unterscheiden; Sessions, Connections/Providers, Server, DB, Diagnostics, Backups und Release abdecken.
5. [x] Connections/Providers/Server/Database/Diagnostics an sichere autoritative Quellen binden, Pings fehlertolerant klassifizieren und GPS-Modulzahl korrekt liefern.
6. [x] Expliziten sicheren, idempotenten cPanel-/CLI-Deploymentmigrator mit sicheren Statuscodes implementieren; Login/Setup nur zusätzliche Sicherheitslinie; fehlgeschlagene Migration darf Deploy nicht grün lassen.
7. [x] Backup/Restore reparieren: sichere Fehlerklassen/Codes, Host-Prerequisite-Status, manuellen Pfad unabhängig von Cron, Runner paketieren, Retention sowie bestehende AES-/Validierungs-/Sessionausschlussverträge erhalten.
8. [x] Maintenance und Release trennen; Version, Commit und Buildzeit aus Manifest ableiten; Status aus Health/Maintenance, keinen Self-Updater suggerieren.
9. [x] Backupintervall und Retention eindeutig trennen; Retention als validierte positive Ganzzahl innerhalb sicherer Grenzen, Altwerte kompatibel, Reload exakt.
10. [x] Alert-Lebenszyklus routenlokal machen und explizit globale Meldungen erhalten.
11. [x] Auditfilter vollständig sichtbar beschriften und responsive gruppieren; ARIA, Filter und Retention erhalten.
12. [x] Echte PHP-/JS-Integrationstests für Sessions/Migration/DTOs/Backup/Settings/Alerts/Audit ergänzen; keine reine Regex-/verkürzte Mock-Abnahme.
13. [x] Paket-/Deploymenttests und nichtdestruktive Smokes um Migrator, Cron-Runner, Manifestrelease und sichere Bereitschaft erweitern.
14. [x] Vollständige Regression ausführen: P1/P4, Warmstart, Themes, Appearance V2 Bestand, Navigation, GPS, Auth/RBAC, Sessions, Maintenance, Backup, Audit, SW, Packaging/Base Path, Smoke, Secrets/Artefakte, PHP-/JS-Syntax, diff-check.
15. [x] Alle genannten Dokumente wahrheitsgemäß aktualisieren; Phase-1-Diagnose als historische Evidenz erhalten; Zustände CODE-SEITIG/DEPLOYED/HOST-CHECK/DEVICE-RETEST/LIVE klar trennen.
16. [x] Produktionspaket vollständig prüfen, Commit/Push `main`, CI/FTPS terminal abwarten, `HEAD == origin/main`, sauberer Tree und Deploymentrevision verifizieren; nur sichere nichtdestruktive Produktionschecks.
17. [x] Vollständigen Abschlussbericht und kurze 10-Punkte-iPad/Safari-Retestliste nach `CHATGPT.md` schreiben, pushen und auf GitHub `main` verifizieren.

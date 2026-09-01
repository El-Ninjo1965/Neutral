# NEUTRAL – Status

**Status:** NACHGEWIESENER IST-STAND  
**Geprüft:** 2026-09-01  
**Referenz:** GitHub `main` bei Beginn der Prüfung: `52cc5a5`

Diese Datei bewertet den Stand gegen [`CORE-1.0.md`](CORE-1.0.md). Sie verändert keine Anforderungen.

## Gesamturteil

Neutral ist eine belastbare Core-Grundlage, aber noch kein abgenommener Core 1.0. Client-Verträge, grundlegender PHP-Betrieb, Auth/RBAC, Administration und der Modul-Lifecycle sind substanziell vorhanden. Die offenen Kernarbeiten sind endlich und konkret: universelle Modul-Servererweiterung, Modulmigrationen, Limits, sichere Drittanbieterprovider, Portabilitätsabnahme und vollständige Produktionsprüfung.

## Funktionsmatrix

| Bereich | Status | Nachweis / offene Lücke |
|---|---|---|
| Öffentlicher Client-Core-Vertrag | VORHANDEN | `Web-App/core/core-contracts.js`, `tests/core-contracts.test.js` |
| Events, Services, Fehlerisolation | VORHANDEN | Core-Dateien und Vertragstests |
| Modul-Discovery und Client-Lifecycle | VORHANDEN | `module-manager.js`, `module-interface.js`, Lifecycle-Tests |
| PHP-Modulregistrierung und Zustände | VORHANDEN | `Phase7ModuleRuntime.php`, Admin-API |
| Modulrechte nach Rollen | VORHANDEN | Modulmanifest, RBAC, Admin-Modulansicht, GPS-Referenz |
| Mengenlimits/Entitlements | FEHLT | kein allgemeines serverseitiges Limitmodell nachgewiesen |
| Allgemeine PHP-Routen je Modul | FEHLT | Module benötigen derzeit Änderungen am zentralen Router |
| Modul-SQL-Migration und Rollback | TEILWEISE | Tabellen/`module_migrations` existieren; allgemeiner Runner fehlt |
| Modulsettings | TEILWEISE | deklarative Felder und Namespace vorhanden; sichere Secrets/Provider fehlen |
| Drittanbieter-Provideradapter | FEHLT | vorhandener Provider-Manager beschreibt primär Deployment und simuliert Operationen |
| Login, Session, CSRF, RBAC | VORHANDEN | PHP-Router und Services; produktive Hostprüfung bleibt offen |
| PHP-Login-Drosselung | FEHLT | in der PHP-Produktion nicht nachgewiesen |
| API-Timeout | VORHANDEN | `ApiClient` nutzt kontrollierten Timeout; `tests/api-timeout.test.js` besteht |
| API-Versionierung | FEHLT | kein verbindlicher URL-/Headervertrag |
| Offline-Grundlage | TEILWEISE | IndexedDB/Netzwerkstatus vorhanden; Sync-Queue und Konfliktengine fehlen |
| Shared-Hosting-Deployment | TEILWEISE | FTPS-Workflow erfolgreich; vollständige Installation/API/DB-Abnahme offen |
| Backup, Restore und Umzug | TEILWEISE | Strukturen/Status vorhanden; reproduzierbarer End-to-End-Nachweis fehlt |
| PWA/Store-Verpackung | GEPLANT | bewusst nach Core 1.0 verschoben |
| Optionale Node-Erweiterung | GEPLANT | Node-Referenzcode existiert, ist keine Produktionsvoraussetzung |

## Bestätigte Hostinggrundlage

Die bisherige Hostingdiagnose bestätigte PHP, HTTPS und PDO/MySQL-Grundfähigkeiten. FTPS-Deployment auf den Zielwebspace funktionierte. Eine vollständige leere Neuinstallation mit produktiver Datenbank, Login, Moduloperationen, Backup/Restore und Umzug ist noch nicht als zusammenhängende Abnahme dokumentiert.

## Testzustand am 2026-09-01

Ein unveränderter lokaler Ausgangsstand wurde mit der gebündelten Node-Laufzeit geprüft:

- 30 Tests bestanden.
- Node-API-Tests konnten wegen des lokal fehlenden nativen Pakets `argon2` nicht geladen werden.
- PHP-Tests konnten wegen eines lokal nicht installierten PHP-CLI nicht ausgeführt werden.
- `tests/vision-framework.test.js` enthielt zusätzlich einen echten bereits auf `origin/main` vorhandenen Fehlschlag.

Das ist kein vollständiger grüner Baseline-Nachweis. Diese Dokumentationsüberarbeitung darf deshalb keinen vollständig bestandenen Gesamttest behaupten. Die betroffenen Punkte stehen in [`TODO.md`](TODO.md).

Nach der Dokumentationsänderung bestanden 24 gezielt ausführbare Tests für Core-Verträge, API-Timeout, Adminstart und das sichere Produktions-Staging ohne Fehler. Diese Teilprüfung ersetzt nicht die noch offene vollständige Suite.

## Nächster Abschlussmeilenstein

Der nächste Meilenstein ist eine reproduzierbare Core-1.0-Baseline: vollständige lokale Werkzeuge, grüne bestehende Tests und eine dokumentierte leere PHP-Installation. Danach werden die offenen Modulverträge in der Reihenfolge aus `TODO.md` umgesetzt.

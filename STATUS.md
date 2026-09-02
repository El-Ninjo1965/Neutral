# NEUTRAL – Status

**Status:** NACHGEWIESENER IST-STAND  
**Geprüft:** 2026-09-02
**Referenz:** aktueller `main`; vollständige Prüfung und Änderungen siehe `CHANGELOG.md`

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
| Login, Session, CSRF, RBAC | VORHANDEN | PHP-Router und Services; produktiver 401-Schutz des Admin-Einstiegs geprüft, vollständiger Login-/Schreibfluss bleibt offen |
| Setup-Sperre und öffentlicher Status | VORHANDEN | aktive Installation verbirgt Setup/UI/API; Statusantwort ist auf ungefährliche Betriebsdaten reduziert; Sicherheitstests vorhanden |
| PHP-Login-Drosselung | FEHLT | in der PHP-Produktion nicht nachgewiesen |
| API-Timeout | VORHANDEN | `ApiClient` nutzt kontrollierten Timeout; `tests/api-timeout.test.js` besteht |
| API-Versionierung | FEHLT | kein verbindlicher URL-/Headervertrag |
| Offline-Grundlage | TEILWEISE | IndexedDB/Netzwerkstatus vorhanden; Sync-Queue und Konfliktengine fehlen |
| Shared-Hosting-Deployment | TEILWEISE | FTPS-Workflow erfolgreich; produktive MySQL-Neuinstallation mit korrekter Datenbankidentität, 16 aktuellen Tabellen, 2 Migrationen und Status `ACTIVE` nachgewiesen; vollständige Login-/API-Abnahme offen |
| Backup, Restore und Umzug | TEILWEISE | Strukturen/Status vorhanden; reproduzierbarer End-to-End-Nachweis fehlt |
| PWA/Store-Verpackung | GEPLANT | bewusst nach Core 1.0 verschoben |
| Optionale Node-Erweiterung | GEPLANT | Node-Referenzcode existiert, ist keine Produktionsvoraussetzung |

## Bestätigte Hostinggrundlage

Die Hostingdiagnose bestätigte PHP, HTTPS und PDO/MySQL-Grundfähigkeiten. Der Security-Commit `a75470a` wurde erfolgreich per FTPS ausgerollt und durch CodeQL geprüft. Die produktiven Statusendpunkte liefern nur Service-, Environment-, App- und DB-Zustand; Setupseite sowie geroutete Setup-Status-/Installpfade liefern ohne Recoveryfreigabe für GET, OPTIONS und POST HTTP 404; der Admin-Einstieg liefert ohne Sitzung HTTP 401.

Am 2026-09-02 wurde die zuvor befüllte Neutral-Testdatenbank nach verifizierter Datenbankidentität und exaktem Alt-Tabellensatz zurückgesetzt und mit dem aktuellen Installer neu aufgebaut. Ein separater read-only Nachweis bestätigte anschließend Verbindung, Status `ACTIVE`, 16 vom aktuellen Schema erwartete Tabellen einschließlich `login_attempts` und 2 angewendete Migrationen. Alle temporären Prüf- und Ergebnisdateien wurden per FTPS entfernt; erneute Löschversuche bestätigten für sämtliche älteren Markerdateien `No such file or directory`. Die noch offene Produktionsabnahme umfasst authentifizierten Login, Moduloperationen, Backup/Restore und Umzug.

## Testzustand am 2026-09-02

Die lokale Referenzumgebung aus [`DEVELOPMENT.md`](DEVELOPMENT.md) führt die gesamte Suite einschließlich Node-, PHP- und `argon2`-Pfaden erfolgreich aus:

- 150 Tests wurden vollständig ausgeführt,
- 150 Tests bestanden,
- 0 Tests schlugen fehl,
- 0 Tests wurden abgebrochen.

Die zuvor reproduzierten Fehler wurden auf fünf plattformabhängige Ursachen zurückgeführt und behoben: synthetische PHP-Sessions unter PHP-Strict-Mode, absolute Windows-Modulpfade, statische URL-Auflösung unter Windows, native PHP-Environment-Pfade und case-sensitive Architekturprüfung.

`npm run setup:preflight` läuft erfolgreich durch. Allowlist und Deployment-Dry-Run sind grün. Lokale DB-/FTP-Bereitschaft bleibt absichtlich `false`, solange produktive Secrets ausschließlich außerhalb des Repositorys verwaltet werden; die GitHub-FTPS-Ausführung wurde bereits separat erfolgreich nachgewiesen.

## Nächster Abschlussmeilenstein

Der nächste Meilenstein ist die vollständige Live-Sicherheits- und API-Abnahme der neu installierten Produktion. Danach werden die offenen Modulverträge in der Reihenfolge aus `TODO.md` umgesetzt.

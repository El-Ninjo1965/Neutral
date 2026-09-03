# NEUTRAL – Status

**Status:** NACHGEWIESENER IST-STAND  
**Geprüft:** 2026-09-03
**Referenz:** GitHub `main`, Commit `a800c960a7be04c37b09fc8f3bb6eede7517e5a9`; vollständige Prüfung und Änderungen siehe `CHANGELOG.md`

Diese Datei bewertet den Stand gegen [`CORE-1.0.md`](CORE-1.0.md). Sie verändert keine Anforderungen.

## Gesamturteil

Neutral ist eine belastbare Core-Grundlage, aber noch kein abgenommener Core 1.0. Client-Verträge, grundlegender PHP-Betrieb, Auth/RBAC, Administration und der Modul-Lifecycle sind substanziell vorhanden. Die offenen Kernarbeiten sind endlich und konkret: universelle Modul-Servererweiterung, Modulmigrationen, Limits, sichere Drittanbieterprovider, Portabilitätsabnahme und vollständige Produktionsprüfung.

Die portable Installationsbasis für Domain-Root, eigenen physischen DocumentRoot und URL-Unterpfad ist lokal implementiert: gemeinsamer Basispfadvertrag, reproduzierbares Paket, wertfreie Vorlagen, App-Bootstrap und paketbasierter Offline-Preflight sind vorhanden. Die externe Abnahme auf neuem PHP-/Apache-Hosting, leerer Datenbank und neuem Repository ist weiterhin offen; deshalb ist Neutral noch nicht als vollständig portable Produktion oder Core 1.0 freigegeben.

Die Task-6-Umsetzung einschließlich der finalen Whole-Branch-Reviewkorrektur und GitHub-Integration wurde durch **Codex (ChatGPT Work / GitHub-Connector)** ausgeführt und dokumentiert. CodeQL für den Abschlusscommit ist bestanden. PHP-, Apache-, Live-, Datenbank- und FTPS-Nachweise bleiben offen; der FTPS-Lauf wurde vor dem Upload sicher von der zwingenden Hostnamenprüfung blockiert.

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
| Admin-CMS-Oberfläche | TEILWEISE | moderner Router, Sidebar und Fachansichten vorhanden; Browserstart nach Commit `156e6e9` produktiv durch Codex geprüft, alte Fallbackansicht nicht mehr sichtbar; reale responsive iPad-/Safari-Abnahme bleibt offen |
| Setup-Sperre und öffentlicher Status | VORHANDEN | aktive Installation verbirgt Setup/UI/API; Statusantwort ist auf ungefährliche Betriebsdaten reduziert; Sicherheitstests vorhanden |
| PHP-Login-Drosselung | TEILWEISE | `LoginRateLimiter` und persistenter PDO-Store einschließlich Fail-closed-Pfad sind getestet; produktiver Lockout-/Retry-Nachweis fehlt |
| API-Timeout | VORHANDEN | `ApiClient` nutzt kontrollierten Timeout; `tests/api-timeout.test.js` besteht |
| API-Versionierung | VORHANDEN | `/api/v1` ist kanonisch, `/api` bleibt kompatibel; Antworten senden `X-Neutral-API-Version: 1` |
| Offline-Grundlage | TEILWEISE | IndexedDB/Netzwerkstatus vorhanden; Sync-Queue und Konfliktengine fehlen |
| Shared-Hosting-Deployment | TEILWEISE | aktueller Code erzwingt ausdrückliches Ziel und Hostnamenprüfung, bindet Löschzustand per SHA-256-Fingerprint, überträgt vollständig und reicht lftp-Secrets nur über stdin; Lauf `33716219697` wurde wegen nicht aktivierter Hostnamenprüfung vor dem Upload blockiert, daher ist der portable Abschlussstand noch nicht ausgerollt |
| Produktionspaket und Offline-Preflight | VORHANDEN | Produzenten-/Formatkennung, `sourceDirty`, exakte Allowlist, Manifest/`SHA256SUMS`, Resolver-Einstiege, Meta-/`base`-Pfad, Hash-, Traversal-, Symlink-, HTTPS-/Basispfad- und maskierte Secretprüfungen; externe PHP-/Rewritefähigkeiten bleiben `NICHT_GEPRUEFT` |
| Neuinstallation/neues Repository | TEILWEISE | lokaler Bootstrap erzeugt secretfreie Appvarianten und optional ein Repository ohne Remote; echter Ablauf aus einem neu angelegten Repository in neuem Serverziel und neuer Datenbank fehlt |
| Installation unter URL-Unterpfad | TEILWEISE | PHP-/Browserresolver, direktes API-Rewrite, paketiertes `<base href>`, Paket/Preflight und tiefe `/meine-app`-SPA-Fixtures sind lokal getestet; echter Apache-/PHP-/DB-End-to-End-Lauf unter einem URL-Unterpfad fehlt |
| Backup, Restore und Umzug | TEILWEISE | Strukturen/Status vorhanden; reproduzierbarer End-to-End-Nachweis fehlt |
| PWA/Store-Verpackung | GEPLANT | bewusst nach Core 1.0 verschoben |
| Optionale Node-Erweiterung | GEPLANT | Node-Referenzcode existiert, ist keine Produktionsvoraussetzung |

## Bestätigte Hostinggrundlage

Die Hostingdiagnose bestätigte PHP, HTTPS und PDO/MySQL-Grundfähigkeiten. Der Security-Commit `a75470a` wurde erfolgreich per FTPS ausgerollt und durch CodeQL geprüft. Die produktiven Statusendpunkte liefern nur Service-, Environment-, App- und DB-Zustand; Setupseite sowie geroutete Setup-Status-/Installpfade liefern ohne Recoveryfreigabe für GET, OPTIONS und POST HTTP 404; der Admin-Einstieg liefert ohne Sitzung HTTP 401.

Am 2026-09-02 reparierte Codex (ChatGPT Work / GitHub-Connector) mit Commit `156e6e9` die fehlenden Browser-Exports der Admin-Komponenten. CodeQL und FTPS-Deployment wurden erfolgreich abgeschlossen. Eine anschließende authentifizierte Live-Prüfung unter `https://www.turbolikes.com/admin.php` zeigte die neue CMS-Shell mit allen fünf Navigationsgruppen und ohne die frühere Ansicht „FRAMEWORK DASHBOARD“. Die reale responsive Abnahme auf iPad/Safari ist weiterhin offen.

Am 2026-09-02 wurde die zuvor befüllte Neutral-Testdatenbank nach verifizierter Datenbankidentität und exaktem Alt-Tabellensatz zurückgesetzt und mit dem aktuellen Installer neu aufgebaut. Ein separater read-only Nachweis bestätigte anschließend Verbindung, Status `ACTIVE`, 16 vom aktuellen Schema erwartete Tabellen einschließlich `login_attempts` und 2 angewendete Migrationen. Alle temporären Prüf- und Ergebnisdateien wurden per FTPS entfernt; erneute Löschversuche bestätigten für sämtliche älteren Markerdateien `No such file or directory`. Die noch offene Produktionsabnahme umfasst authentifizierten Login, Moduloperationen, Backup/Restore und Umzug.

## Testzustand am 2026-09-03

Die aktuelle Cloud besitzt keine PHP-Binary. Nach gezielten RED/GREEN-Runden für Routing/Basispfad, Paketidentität/Secretprüfung, FTPS-Zielbindung und Dokumentationsverträge erfasste die finale PHP-ausgeschlossene Gesamtsuite 241 Tests: 239 bestanden, zwei erwartete PHP-Skips, 0 Fehler. Die fokussierte Nachprüfung fand einen verbliebenen öffentlichen `/api`-Default in weiteren Admin-/Providerpfaden; **Codex (ChatGPT Work)** schloss ihn testgetrieben, danach bestand dieselbe Gesamtsuite erneut unverändert. Ein fehlendes `php` wird vom CLI wahrheitsgemäß als `NICHT_GEPRUEFT` ausgegeben; PHP-Produktion wird daraus nicht abgeleitet.

Der lokale Preflight prüft nur ein bereits gebautes Paket und die deklarierte öffentliche HTTPS-Basis. Paketmanifest, Inventar, Größen, Hashes, Einstiegspunkte und Secretfreiheit können `PASS` erreichen. Apache-Rewrite im Ziel bleibt ohne expliziten HTTP-Smoke-Test `NICHT_GEPRUEFT`, sodass der Offline-Gesamtstatus keine Live-Freigabe vortäuscht. GitHub-CodeQL-Lauf `33716219316` ist bestanden; FTPS-Lauf `33716219697` endete vor dem Upload sicher mit Fehler, weil die vorhandene Actions-Konfiguration `FTP_SSL_CHECK_HOSTNAME=true` noch nicht erfüllt.

## Nächster Abschlussmeilenstein

Der nächste Meilenstein ist die externe Portabilitätsabnahme: neues Repository, neuer physischer DocumentRoot, echter URL-Unterpfad, PHP-/Apache-Anforderungen, leere Datenbank, Setup/Migration/Betreiberanlage, Setup-Sperre und vollständige HTTP-Smoke-Tests. Danach folgen die verbleibenden Modul-/Providerverträge und die finale Core-1.0-Abnahme gemäß `TODO.md`.

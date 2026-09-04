# NEUTRAL – Architektur

**Status:** TECHNISCHER IST-/ZIELVERTRAG

**Geprüft:** 2026-09-04
**Autorität:** untergeordnet zu [`VISION.md`](VISION.md) und [`CORE-1.0.md`](CORE-1.0.md); Statusübersicht in [`STATUS.md`](STATUS.md).

## Statuslegende

- **IST**: im aktuellen Repository nachweisbar implementiert.
- **GEPLANT**: verbindliche Zielrichtung aus `VISION.md`, noch nicht vollständig implementiert.
- **FEHLT**: erforderliche Fähigkeit ohne belastbare Implementierung.

## 1. Systemgrenze

### Zielbild – GEPLANT

```text
Mobile-first Web-App mit Client-Core
        ↓ HTTPS/JSON-API
PHP-Server als Vertrauensgrenze
        ↓ PDO
MariaDB/MySQL
```

Web-App, Server und Datenbank sind durch dokumentierte Verträge getrennt. Infrastrukturdetails sind konfigurierbar.

### Repositorystruktur – IST

```text
Neutral/
├── Web-App/
│   ├── app/          # App-Shell und GPS-Referenzmodul
│   ├── apps/         # App-Metadaten
│   ├── core/         # Browser-Core
│   └── public/       # Browser-UI und Assets
├── Server/
│   ├── node/         # ausschließlich Entwicklung und Tests
│   ├── php/          # produktiver PHP-Core
│   └── public/       # PHP-Entrypoints und API
├── tests/            # Entwicklungs-/Regressionstests
└── scripts/          # notwendige Start-, Preflight- und Deploywerkzeuge
```

Die früher parallel im Root vorhandenen Laufzeitordner `app`, `apps`, `core`, `platform`, `webroot`, `server` und `config` existieren nicht mehr. Generierte Zustände liegen ignoriert innerhalb `Server/`.

### Aktueller Gesamtzustand – IST/TEILWEISE

- Browser-Client vollständig unter `Web-App/`: `public/` enthält Shell und UI, `core/` den neutralen Client-Core, `app/` App-Shell und Erweiterungen sowie `apps/` die App-Metadaten.
- Server vollständig unter `Server/`: `php/` enthält den PHP-Core, `public/` die PHP-Entrypoints/API und `node/` ausschließlich die Referenz-/Testlaufzeit.
- Node ist keine Voraussetzung der Shared-Hosting-Produktion.
- GPS ist die technische Client-/Gerätereferenzerweiterung unter `Web-App/app/modules/gps/`; `reference-notes` ist zusätzlich die fachlich unabhängige Server-/Modulvertragsreferenz und wird aus neuen Produktkopien entfernt.

## 2. Web-App

**IST:** `Web-App/public/index.html` stellt die Shell bereit. `Web-App/public/user-app.js` rendert sie sofort und startet Core, IndexedDB und Discovery danach im Hintergrund. `Web-App/public/public-path.js` normalisiert den öffentlichen Installationspräfix aus `NeutralConfig.basePath` beziehungsweise dem Meta-Element `neutral-base-path`; `api-client.js`, Assets, Admin und Setup konsumieren denselben Resolver. Ein zum normalisierten Basispfad passendes `<base href>` hält Assets auch auf tiefen SPA-Routen unter derselben Installation. Die einzige ausgelieferte Runtimekonfiguration enthält `basePath` und das daraus abgeleitete `apiBase`, keine Environment- oder Dateisystemwerte; der Resolver verwendet `basePath` als Eingabe.

**GEPLANT:** sofort sichtbare mobile Grundoberfläche vor langsamer Initialisierung; klare Schichten für Shell, Core und Erweiterungs-UI; messbare Browserkompatibilität.

**FEHLT/TEILWEISE:** belastbare Startperformance-Budgets und eine dokumentierte Geräte-/Browser-Testmatrix; weitere direkte UI-Fetches sind noch nicht vollständig auf den zentralen Transportadapter konsolidiert.

## 3. Core

**IST:** Browser-Core in `Web-App/core/`:

- `core-lifecycle.js`: Zustände created, initializing, ready, running, stopped.
- `core-network.js`: Browser-Online-/Offline-Zustand, Subscription und Event `network:changed`, ohne Servererreichbarkeit oder Sync zu behaupten.
- `core-event-bus.js` und `core-event-ring.js`: synchrone Events und begrenzte Ereignishistorie.
- `config-manager.js`/`core-config.js`: Konfigurationszugriff.
- `core-storage.js` und `storage-manager.js`: lokale Schlüssel-/Adapter-Speicherung.
- `database-manager.js`: IndexedDB und CRUD.
- `service-manager.js`: Service-Registry.
- `core-error-handler.js`/`error-log.js`: Fehler- und Logpfad.
- `core-loader.js`, `module-interface.js`, `module-registry.js`, `module-manager.js`: Discovery, Manifestnormalisierung und Lifecycle.
- `core-auth.js`, `core-user.js`, `core-access.js`, `core-context.js`: Clientfacaden für Identität und Berechtigungsabfragen.

**GEPLANT:** stabile öffentliche Verträge, adapterbasierte Geräte-/Netzwerkfunktionen, Offline-Queue, Konfliktbehandlung und nicht blockierender Start.

**FEHLT:** vollständiger produktiver Sync-Orchestrator und verbindliche Konfliktstrategie.

## 4. Server und PHP

**IST:** `Server/php/bootstrap.php` erzeugt `AppRuntime`. `AppConfig`, `EnvLoader`, `Database`, `SchemaMigrator`, Auth/RBAC-, Modul-, Settings- und Auditservices bilden die serverseitige Laufzeit. `Server/public/api/index.php` ist der zentrale PHP-API-Router. `Server/public/admin.php` schützt die Adminoberfläche serverseitig. `Server/public/setup.php` und Setup-Endpunkte initialisieren Installation und Schema.

**IST:** Der öffentliche Modulpfad bildet ausschließlich die gespeicherten `viewer`-Modulrechte auf einen anonymen, bereinigten `clientAccess`-Kontext ab. Nur aktive und sichtbare Module gelangen in den Katalog; diese Cliententscheidung erweitert keine Serverberechtigung.

**IST:** Der produktive PHP-Modulserver ist fachneutral: `ModuleContract` validiert Kompatibilität und Eigentum, `ModuleServerRegistry` lädt ausschließlich geschützte Entries unter `Server/php/modules/<id>/`, `ModuleHttpKernel` dispatcht deklarierte Routen mit Auth/Permission/CSRF, `ModuleLimitGuard` erzwingt quantitative Rollenlimits und `ModuleMigrationRunner` verwaltet checksumgebundene Up-/Down-Migrationen. Modulupdates und Deinstallationen sind nur inaktiv zulässig.

**IST:** Das Shared-Hosting-Staging behält `Web-App/` und `Server/` als getrennte Komponenten unter dem Deploymentroot. Die Root-`.htaccess` bildet die öffentlichen Pfade auf diese Struktur ab und sperrt PHP-Core, Runtime und Dotfiles. `Server/node/` ist nicht Bestandteil des Produktions-Stagings.

**IST:** `Server/php/src/PublicPath.php` und der Browserresolver implementieren denselben `NEUTRAL_BASE_PATH`-Vertrag. Der leere Wert gilt für Domain-Root und einen eigenen physischen DocumentRoot; `/meine-app` gilt ausschließlich für die entsprechende öffentliche URL-Basis. Der physische Deploymentordner bleibt eine unabhängige Einstellung. Die per-directory-Rewrite-Regeln benötigen kein festes `RewriteBase`.

**IST:** Die PHP-Runtime ist für PHP 8.x, PDO und MySQL/MariaDB geschrieben. Routing erfolgt über `Server/public/api/.htaccess` an `index.php`.

**GEPLANT:** die PHP-Implementierung bleibt ein Adapter hinter dem API-Vertrag. Ein Infrastrukturwechsel darf den Clientvertrag nicht unnötig ändern.

## 5. Node-Laufzeit

**IST:** `Server/node/bootstrap/server.js` implementiert eine umfangreiche Node-API für lokale Entwicklung und Tests; `Server/node/server.js` exportiert sie.

**Regel:** Node.js ist keine Voraussetzung der ersten Produktion. Verhalten der Node- und PHP-APIs darf nicht ungeprüft als identisch angenommen werden. `API.md` kennzeichnet beide Oberflächen getrennt.

## 6. API und Datenfluss

**IST:** Der Browser verwendet `ApiClient`; öffentliche API-URLs werden aus dem normalisierten Basispfad und `/api/v1` gebildet. Same-Origin-Cookies tragen die Session; bei Schreibmethoden wird `neutral_csrf` als `x-csrf-token` gesendet. Der PHP-Router validiert Identität, Berechtigungen und CSRF, ruft Services auf und antwortet über `JsonResponse`.

```text
UI/Modul → ApiClient → HTTPS /api/v1 → PHP-Router → Service → PDO → MariaDB/MySQL
```

**IST:** Der API-Versionierungsvertrag ist vorhanden: `/api/v1` ist kanonisch, `/api` bleibt kompatibel, Antworten senden `X-Neutral-API-Version: 1` und unbekannte explizite Versionen werden abgewiesen. Ein zentraler kontrollierter Fetch-Timeout ist ebenfalls **VORHANDEN** und wird durch `tests/api-timeout.test.js` geprüft.

**GEPLANT:** konfigurierbare API-Basis ohne feste Hostnamen, Retry nur für sichere/idempotente Fälle und Offline-Queue.

**FEHLT/TEILWEISE:** Eine allgemeine sichere Retry-/Backoff-Policy fehlt; Schreib- und Authrequests werden nicht blind wiederholt.

## 7. Datenbank und lokale Speicherung

### Client

**IST:** `database-manager.js` öffnet IndexedDB `CoreDB` (konfigurierbar) und legt Stores `users`, `modules`, `logs`, `sessions`, `settings`, `cache`, `sync` an. CRUD und Indexsuche sind vorhanden. Mehrere Komponenten nutzen zusätzlich `localStorage`.

**TEILWEISE:** Ein `sync`-Store existiert, aber keine vollständige persistente Queue-/Retry-/Konfliktengine. Schema-Upgrades erstellen fehlende Stores, besitzen aber noch keinen umfassenden Migrationskatalog.

### Server

**IST:** PDO mit MySQL/MariaDB; `SchemaMigrator.php` verwaltet `schema_migrations` sowie Rollen, Rechte, Benutzer, Sessions, Settings, Module, Modulstatus/-migrationen, Setupstatus, Audit, Backups und Releasezustand.

**GEPLANT:** migrationsbasierte Weiterentwicklung mit minimalen DB-Rechten, Transaktionen und adapterfähiger Konfiguration.

## 8. Authentifizierung und Autorisierung

**IST:** PHP-Login, Logout und `auth/me`; serverseitige Sessionregistrierung; Rollen/Permissions in MariaDB; Session-Cookie und CSRF-Token; Adminzugriff wird in PHP geprüft. Ein expliziter Bootstrap-Tokenpfad existiert für Setup/Automation und darf normale Benutzeranmeldung nicht ersetzen.

**TEILWEISE:** Der Browser besitzt lokale Auth-Hilfen für Entwicklung. Diese sind keine Serverautorität.

**FEHLT/GEPLANT:** dokumentierte Remember-/Refresh-Strategie und Offline-Reauthentifizierungsregeln.

## 9. Konfiguration

**IST:** Clientkonfiguration über ConfigManager und Runtimeobjekte. Serverkonfiguration über `.env`, `EnvLoader` und `AppConfig`; `.env` bleibt hostlokal. Die versionierte `.env.example` enthält nur leere hostabhängige/secretartige Werte und sichere öffentliche Defaults. `NEUTRAL_BASE_PATH` wird server- und browserseitig identisch validiert; ungültige Werte brechen ab und fallen nicht still auf Root zurück.

**GEPLANT:** validiertes, versioniertes Konfigurationsschema und Adapterauswahl für Hostingwechsel.

## 10. Events und Services

**IST:** `Core.emit/on/off/once` delegiert an den Event-Bus. Lifecycle, Datenbank und Modulmanager emittieren Core-Events. `ServiceManager` registriert und liefert benannte Services. `MasterFramework` bietet weitere App-, Entity-, Provider-, Storage-, Rollen- und Modulfunktionen.

**IST:** Corevertrag `1.0.0` katalogisiert öffentliche Facaden und kanonische Events; der EventBus isoliert Handler und Services besitzen Sichtbarkeit/Cleanup. Globale `window.*`-Objekte bleiben als dokumentierte Kompatibilitätsschicht, private Globals sind nicht Teil des Modulvertrags.

## 11. Abhängigkeiten

- Browser: Web APIs, globale Lade-Reihenfolge der Skripte, optional Fetch/IndexedDB/Geolocation.
- PHP: PHP 8.x, PDO und `pdo_mysql`, Sessions, JSON, Dateisystemzugriff für Logs/Setupzustand.
- Entwicklung/Test: Node.js und npm; `argon2` für die Node-Referenzruntime sowie Paketbau, Bootstrap und Offline-Preflight.
- Produktion: Node ist nicht erforderlich.

## 12. Erweiterungspunkte

**IST:** Modulmanifest, globaler Entry Point, Loader/Registry/Manager, Modul-Lifecycle, Manifest-Permissions, Capabilities, Adminsettings, lokaler Storagezugriff über Core, Events und Services. PHP entdeckt Manifestdateien und persistiert Modulzustände.

**IST:** Loader, Interface und Registry erhalten den serverseitigen Clientzugriffskontext. Nur ein validierter anonymer Katalog wird installationsbezogen offline gespeichert. Die User-Shell filtert Navigation und Direktaufrufe fail-closed; lokale Benutzereinstellungen können Sichtbarkeit reduzieren, aber keine Freigabe erzeugen. Persistiert aktive Module werden nach Discovery tatsächlich initialisiert und aktiviert.

**IST:** Modul-Datenbanktabellen, Migrationen, geschützte Services/Routen, Rechte, Mengenlimits und Deinstallationspolitik sind manifestbasiert. Der Core lädt Servercode nicht aus öffentlichen Pfaden und erlaubt destruktive Deinstallation nur für validierte modul-eigene Tabellen.

**FEHLT:** standardisierte Hooks, Prozess-/Code-Sandboxing sowie vollständige Offline-/Sync-Verträge. Details stehen in `ModuleCreation.md`.

### Versionierter Client-Core-Vertrag – IST

`Web-App/core/core-contracts.js` veröffentlicht Vertrag `1.0.0`. Nur die dort gelisteten Facaden sind für Erweiterungen öffentlich; `CoreEventBus`, `CoreEventRing`, `CoreLoader`, `CoreState`, `MasterFramework` und `ErrorLog` bleiben interne Kompatibilitätsobjekte. Die globale Skript-Ladefolge bleibt derzeit technisch erforderlich, ist aber kein Freibrief für Module, beliebige Globals zu verwenden.

`CoreNetwork` ist die öffentliche, fachfreie Connectivity-Facade. Startup initialisiert sie idempotent, Shutdown gibt Listener frei. API-Health, Retry und fachliche Synchronisation bleiben getrennte spätere Schichten.

Module beziehen Core-Fähigkeiten über `Core.getFacade(name)`. Die weiterhin global geladenen Objekte sichern Bestandskompatibilität; nicht im Vertragskatalog gelistete Globals bleiben privat. Eine vollständige ESM-/Dependency-Injection-Migration wird nicht als verdeckte Breaking Change in P2 durchgeführt.

## Startperformance – P3 IST

Die statische User-Shell enthält einen sichtbaren, zugänglichen Ladezustand. Externe klassische Scripts verwenden `defer` und behalten ihre deklarierte Reihenfolge, sodass HTML/CSS/Shell vor Ausführung vollständig geparst werden. `CorePerformance` ist die öffentliche, payloadfreie Messfacade für Navigation, DOM, Shell und weitere Startphasen; reale Gerätezeiten werden separat gemessen.

`CoreStartup.start()` ist die minimale READY-Phase und wartet nicht auf IndexedDB oder Module. `startBackground()` ist die deduplizierte Hintergrundkette für Storage, Clientfacaden und Discovery; ihre Phasen emittieren Status und bleiben bei Einzelproblemen diagnostizierbar. Nur storageabhängige Funktionen warten auf `startup:storage-ready` bzw. die Hintergrund-Promise.

Der Adminstart prüft die Serveridentität nach sichtbarer Auth-Shell. `neutral:auth-ready` startet den Router genau einmal; es existiert kein DOM-Polling und kein pauschaler Startdelay. CoreStartup ist alleinige Discovery-Autorität. Adminviews dürfen nach bestätigter Identität laden, aber First Paint und Loginstatus nicht blockieren.

### P3-Abnahmekriterien – IST

1. Statische Shell ist ohne Serverantwort sichtbar.
2. Minimal-Core enthält keine IndexedDB-, Authserver- oder Discovery-Wartekette.
3. UI wird vor `startBackground()` interaktiv markiert.
4. Storage, Authstatus, Discovery und Hintergrundabschluss besitzen getrennte Marken.
5. CoreStartup besitzt genau eine Discovery-Aufrufstelle.
6. API-Timeout lässt Auth-Shell sichtbar und erteilt keine Rechte.
7. Adminrouter startet eventgetrieben erst nach bestätigter Identität.

Zeitbudgets auf realer Mobilhardware bleiben zwei ausdrücklich offene P8-Gerätetests.

## Portable Installation – IST/TEILWEISE

**IST:** `scripts/lib/portable-install.js` ist der gemeinsame Kern für Allowlist-Inventar, Pfadnormalisierung, SHA-256, Secretprüfung und verifizierte Pakete. `build-production-package.js` erzeugt `dist/neutral-production/` über einen benachbarten temporären Baum und ersetzt nur einen über Produzent, Format, Metadaten, exakte Allowlist, Inventar und Hashes positiv verifizierten Altstand. Das Manifest hält mit `sourceDirty` konserv
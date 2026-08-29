# NEUTRAL – Architektur

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
- GPS als einzige konkrete Referenzerweiterung unter `Web-App/app/modules/gps/`.

## 2. Web-App

**IST:** `Web-App/public/index.html` stellt die Shell bereit. `Web-App/public/user-app.js` rendert sie sofort und startet Core, IndexedDB und Discovery danach im Hintergrund. `Web-App/public/api-client.js` kapselt JSON-Fetch und löst die zentrale, über `NeutralConfig` oder das Meta-Element `neutral-api-base` konfigurierbare API-Basis auf.

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

**IST:** Die PHP-Runtime ist für PHP 8.x, PDO und MySQL/MariaDB geschrieben. Routing erfolgt über `Server/public/api/.htaccess` an `index.php`.

**GEPLANT:** die PHP-Implementierung bleibt ein Adapter hinter dem API-Vertrag. Ein Infrastrukturwechsel darf den Clientvertrag nicht unnötig ändern.

## 5. Node-Laufzeit

**IST:** `Server/node/bootstrap/server.js` implementiert eine umfangreiche Node-API für lokale Entwicklung und Tests; `Server/node/server.js` exportiert sie.

**Regel:** Node.js ist keine Voraussetzung der ersten Produktion. Verhalten der Node- und PHP-APIs darf nicht ungeprüft als identisch angenommen werden. `API.md` kennzeichnet beide Oberflächen getrennt.

## 6. API und Datenfluss

**IST:** Der Browser verwendet `ApiClient` und relative `/api/...`-Pfade. Same-Origin-Cookies tragen die Session; bei Schreibmethoden wird `neutral_csrf` als `x-csrf-token` gesendet. Der PHP-Router validiert Identität, Berechtigungen und CSRF, ruft Services auf und antwortet über `JsonResponse`.

```text
UI/Modul → ApiClient → HTTPS /api → PHP-Router → Service → PDO → MariaDB/MySQL
```

**GEPLANT:** konfigurierbare API-Basis ohne feste Hostnamen, explizite Versionierungsstrategie, Timeouts, Retry nur für sichere/idempotente Fälle und Offline-Queue.

**FEHLT:** API-Version im URL-/Headervertrag, zentraler Fetch-Timeout und allgemeiner Retry.

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

**IST:** Clientkonfiguration über ConfigManager und Runtimeobjekte. Serverkonfiguration über `.env`, `EnvLoader` und `AppConfig`; `.env` bleibt hostlokal. API- und Installationspfade werden aus dem aktiven Kontext abgeleitet.

**GEPLANT:** validiertes, versioniertes Konfigurationsschema und Adapterauswahl für Hostingwechsel.

## 10. Events und Services

**IST:** `Core.emit/on/off/once` delegiert an den Event-Bus. Lifecycle, Datenbank und Modulmanager emittieren Core-Events. `ServiceManager` registriert und liefert benannte Services. `MasterFramework` bietet weitere App-, Entity-, Provider-, Storage-, Rollen- und Modulfunktionen.

**IST:** Corevertrag `1.0.0` katalogisiert öffentliche Facaden und kanonische Events; der EventBus isoliert Handler und Services besitzen Sichtbarkeit/Cleanup. Globale `window.*`-Objekte bleiben als dokumentierte Kompatibilitätsschicht, private Globals sind nicht Teil des Modulvertrags.

## 11. Abhängigkeiten

- Browser: Web APIs, globale Lade-Reihenfolge der Skripte, optional Fetch/IndexedDB/Geolocation.
- PHP: PHP 8.x, PDO und `pdo_mysql`, Sessions, JSON, Dateisystemzugriff für Logs/Setupzustand.
- Entwicklung/Test: Node.js und npm; `argon2` für die Node-Referenzruntime.
- Produktion: Node ist nicht erforderlich.

## 12. Erweiterungspunkte

**IST:** Modulmanifest, globaler Entry Point, Loader/Registry/Manager, Modul-Lifecycle, Manifest-Permissions, Capabilities, Adminsettings, lokaler Storagezugriff über Core, Events und Services. PHP entdeckt Manifestdateien und persistiert Modulzustände.

**TEILWEISE:** Modul-Datenbanktabellen können deklariert und bei sicher deklarierter Deinstallation entfernt werden; eine allgemeine Modul-Migrationsausführung ist noch nicht vollständig als öffentlicher Vertrag umgesetzt.

**FEHLT:** produktive Modul-API-Registrierung, standardisierte Hooks, Modul-Sandboxing sowie vollständige Offline-/Sync-Verträge. Details stehen in `ModuleCreation.md`.

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

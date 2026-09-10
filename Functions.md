# NEUTRAL – Funktionskatalog des Core

**Status:** NACHGEWIESENES FUNKTIONSINVENTAR

**Geprüft:** 2026-09-03
**Autorität:** beschreibt den Ist-Code; Anforderungen stehen in [`CORE-1.0.md`](CORE-1.0.md).

Dieses Dokument beschreibt ausschließlich im Repository nachweisbare, relevante Funktionen. Detailmethoden bleiben im Quellcode maßgeblich.

Die User-App ergänzt eine lokale Light/Dark-Auswahl unter `neutral.user.theme.v1`; Auswahl, Warmstart und Persistenz benötigen keine Serververbindung.

Die User-App verwendet für Primary-, Secondary-, Navigations- und Icon-Aktionen den gemeinsamen `.ui-button`-Vertrag mit zentralen Größen-, Kontur-, Zustands- und Fokus-Tokens. Die Home-Navigation zeigt ein lokales SVG, behält aber `Start` als Accessible Name und dieselbe `home`-Route.

`NeutralHomepageDocument` bettet ein freies HTML-Fragment unverändert in ein vollständiges Dokument ein oder fügt bei einem vollständigen HTML-Dokument den Frameworkadapter am Anfang von `head` ein. Der Adapter setzt den eindeutigen Light-/Dark-`color-scheme` und neutrale `html`/`body`-Farbdefaults. Weil die unveränderte Administratorquelle danach folgt, bleiben deren explizite Background-/Textregeln maßgeblich. `apply(frame, content, theme)` aktualisiert denselben sandboxed Frame ohne Lockerung seiner Attribute.

Vor jeder `srcdoc`-Navigation entfernt `apply` die Ready-Klasse, registriert einen einmaligen revisionsgebundenen `load`-Handler und setzt Theme-Farbraum, iframe-Hintergrund und das fertige Dokument, bevor die User-App den Frame einhängt. Erst der zum aktuellen Dokument gehörende Load setzt `homepage-frame-ready`. Der Wrapper hält währenddessen die Theme-Surface und die feste Inhaltsfläche; es gibt keinen zeitgesteuerten Reveal.

Der synchrone Head-Bootstrap liest `neutral.user.theme.v1` vor dem render-blocking Stylesheet und setzt `html[data-user-theme]`; derselbe Selektor aktiviert nun bereits auf `:root` die semantischen Theme-Tokens. Die statische Shell enthält keinen generischen Loadingtext. Nach dem synchronen Cache-Read rendert ein Warmstart direkt die lokale Homepage; nur ein echter Start ohne gültige Projektion erzeugt aus `user-app.js` einen zugänglichen, tokenbasiert thematisierten Ladezustand.

Die User-App lädt die zentrale Homepage-Projektion fehlertolerant parallel zum Core-Start und zur User-Session. Sie öffnet im Modulmodus nur ein aktives, sichtbares und berechtigtes Modul; im HTML-Modus übernimmt sie den bewusst unveränderten Administrator-Inhalt in den vorhandenen Sandbox-Frame. Die Produktidentität unterstützt konfigurierbaren Namen, kurzen Icon-Text und eine optionale Logo-URL.

Ein Homepage-Modul bleibt im aktiven Bereich `Start`; die eigenständige Modulansicht wird nur durch die Navigation geöffnet. User-Login wird als einzelner Formular-Submit verarbeitet und durch eine Revisionsprüfung gegen eine gleichzeitig laufende Session-Wiederherstellung geschützt. GPS bewahrt Rohgenauigkeit und ISO-Zeit intern, formatiert beide jedoch über locale-fähige `Intl`-APIs menschenlesbar für die Anzeige.

`NeutralHomepageCache` persistiert ausschließlich eine schema-versionierte öffentliche Homepageprojektion. Gültiges HTML kann beim Warmstart synchron vor dem Netzwerkrefresh erscheinen; inkompatible, leere oder nicht als öffentlich markierte Records werden verworfen. Die Performance-Marken `homepage-local-ready` und `homepage-refresh-ready` trennen lokalen First Render vom Serverabgleich.

Der Header-Theme-Toggle verwendet `neutral.user.theme.v1` und `applyUserTheme` als einzigen normalen User-Zugriff; normale User Settings enthalten keine redundante Theme-Auswahl. Beim Speichern anderer User Settings wird der bestehende Theme-Wert nur unverändert mitgeführt. Die User-/GPS-Oberflächen beziehen Flächen, Text, Muted, Border, Primary und Fokus zentral aus den semantischen CSS-Tokens.

Der Produktions-Smoke wiederholt ausschließlich einen kurzfristigen Revision-Mismatch nach bereits erfolgreichem Upload begrenzt (maximal fünf Versuche und 30 Sekunden Backoff). Andere Vertragsfehler bleiben sofortige Fehler; GitHub-Deployments sind über eine gemeinsame Concurrency-Gruppe serialisiert.

## Status

- **VORHANDEN**: implementiert und aufrufbar.
- **TEILWEISE**: implementierter Ansatz mit dokumentierter Lücke.
- **FEHLT/TODO**: Ziel aus `VISION.md`, nicht belastbar implementiert.

## Browser-Core

| Name | Zweck / Datei | Öffentliche Schnittstelle | Ein-/Ausgabe | Abhängigkeiten / Events | Fehlerverhalten | Status |
|---|---|---|---|---|---|---|
| `CoreLifecycle` | App-Lifecycle; `Web-App/core/core-lifecycle.js` | `getPhase()`, `setPhase()`, `is()` | Phase → neuer Zustand/void | `Core.emit`; Event `lifecycle:changed` | ungültige Phase/Transition wirft `Error` | VORHANDEN |
| `CoreEventBus` | Publish/Subscribe; `Web-App/core/core-event-bus.js` | `on`, `off`, `once`, `emit`, `clear` | Eventname, Handler, Payload | Browserlaufzeit | ungültige Argumente werfen; Handlerfehler werden isoliert/weitergereicht gemäß Implementierung | VORHANDEN |
| `CoreNetwork` | Online-/Offline-Zustand; `Web-App/core/core-network.js` | `init`, `isOnline`, `getStatus`, `subscribe` | Listener → Snapshot/Unsubscribe | Browser `online`/`offline`; Event `network:changed` | ungültiger Listener wirft; Status behauptet keinen API-/Sync-Erfolg | VORHANDEN |
| `Core` | zentrale Facade; `Web-App/core/core.js` | `on/off/once/emit`, Zustands- und Runtimezugriff | je Methode | EventBus, CoreState | fehlende Infrastruktur führt zu Fehlern | VORHANDEN |
| `ConfigManager` | verschachtelte Laufzeitkonfiguration; `Web-App/core/config-manager.js` | `get`, `set`, `has`, `remove`, `merge`, `reset` | Pfad/Wert → Wert/Status | lokale Konfigurationsdaten | validiert Pfade/Werte, wirft bei ungültiger Nutzung | VORHANDEN |
| `CoreStorage` | einfacher lokaler Key-Value-Speicher; `Web-App/core/core-storage.js` | `set`, `get`, `remove`, `clear`, `has`, `keys` | Schlüssel/Wert → Wert/Boolean | `localStorage` mit Fallback | Serialisierungs-/Storagefehler werden behandelt bzw. gemeldet | VORHANDEN |
| `DatabaseManager` | IndexedDB-Konfiguration und CRUD; `Web-App/core/database-manager.js` | `init`, `getStatus`, `save/get/insert/update/delete/clear/findByIndex/getAll`, `transaction` | Store, Schlüssel/Daten → Promise | IndexedDB; Event `database:initialized` | Promise-Rejection und Status `ERROR` | VORHANDEN |
| `ServiceManager` | benannte Service-Registry; `Web-App/core/service-manager.js` | `register`, `unregister`, `get`, `has`, `getAll`, `clear` | Name/Service → Service/Boolean | keine | ungültiger Name, Duplikat oder fehlender Service wirft | VORHANDEN |
| `CoreErrorHandler` | zentrale Browserfehler; `Web-App/core/core-error-handler.js` | `handle`, globale Handlerinitialisierung | Error + Kontext → Protokolleintrag | ErrorLog/CoreEventRing | verhindert keine beliebigen Folgefehler | VORHANDEN |
| `CoreLoader` | Core-/Manifest-/Skript-Laden und anonymer Offline-Modulkatalog; `Web-App/core/core-loader.js` | `initialize`, `loadModuleManifest`, `loadModuleFromManifest`, `discoverExternalModules` | Pfade/Manifest → Promise/Modul | Fetch oder Node-fs, globale Module, lokaler anonymer Katalogcache | fehlende/ungültige Dateien liefern null/leer; nur validierte anonyme Kataloge dienen als Offlinefallback | VORHANDEN |
| `ModuleInterface` | Manifestnormalisierung; `Web-App/core/module-interface.js` | `validateManifest`, Lifecycle-Helfer | Manifest → normalisiertes Manifest | keine | ungültige Pflichtfelder führen zu Fehler/null gemäß Methode | VORHANDEN |
| `ModuleRegistry` | Modulregister und Discovery; `Web-App/core/module-registry.js` | `register`, `unregister`, `get`, `getAll`, `getByApp`, `discover` | Modul/ID → Modul/Liste | ModuleInterface, CoreLoader, `window` Entry | Duplikat/ungültige ID wirft; fehlender Entry wird übersprungen | VORHANDEN |
| `ModuleManager` | Client-Modul-Lifecycle; `Web-App/core/module-manager.js` | `discoverModules`, `register`, `install`, `initialize`, `enable/activate`, `disable/deactivate`, `update`, `uninstall` | Modul-ID → Modul/Boolean | Registry, MasterFramework, Core Events | fehlendes Modul/Dependency wirft | VORHANDEN |
| `MasterFramework` | App-, Entity-, Connection-, Provider-, Storage-, Rollen-, Modul- und Setupfacade; `Web-App/core/master-framework.js` | zahlreiche dokumentierte Methoden, u. a. `registerApp`, Entity-CRUD, `registerConnection`, Modul-/Rollenfunktionen | Definitionen/IDs → Zustandsobjekte | Config/Storage/Provider und Runtime | Eingaben werden normalisiert; ungültige IDs/Abhängigkeiten werfen | VORHANDEN, breit gekoppelt |
| `ApiClient` | zentraler JSON-Fetch; `Web-App/public/api-client.js` | `request`, `get/post/put/patch/delete`, fachfreie Endpoint-Wrapper, `resolveNeutralApiUrl` | Endpoint/Optionen → `{ok,status,data|error}` | Fetch, Cookies, `NeutralPublicPath` aus konfiguriertem `basePath` | Netzwerk/HTTP wird als Ergebnis `ok:false` zurückgegeben | VORHANDEN |
| `ThemeEngine` | Theme-Registrierung/-Aktivierung; `Web-App/core/theme-engine.js` | `registerTheme`, `activateTheme`, `getCurrentTheme` | Theme → Theme | DOM, Config | ungültiges/unbekanntes Theme wirft | VORHANDEN |
| `MediaManager` | Uploadprüfung/Bildoptimierung; `Web-App/core/media-manager.js` | `validateUpload`, `optimizeImage`, `optimizeUpload` | File + Config → Ergebnis/Promise | Browser File/Image/Canvas APIs | Validierungs- oder Verarbeitungsfehler | VORHANDEN |
| `LocalAuth` | lokale Entwicklerauthentifizierung; `Web-App/core/local-auth.js` | `login`, `setupDeveloper`, `ensureDeveloperUser`, Statusmethoden | Credentials → lokales Ergebnis | Storage, optional UserModule | kein Ersatz für Serversession | TEILWEISE/DEV |

## PHP-Core

| Name | Zweck / Datei | Öffentliche Schnittstelle | Ein-/Ausgabe | Abhängigkeiten | Fehlerverhalten | Status |
|---|---|---|---|---|---|---|
| `neutral_bootstrap` / `AppRuntime` | PHP-Laufzeit initialisieren; `Server/php/bootstrap.php`, `AppRuntime.php` | `neutral_bootstrap()`, `AppRuntime::init()` | Optionen → Runtime | EnvLoader, Config, Logger, Database | registriert Fehlerbehandlung; Exceptions werden geloggt | VORHANDEN |
| `EnvLoader` / `AppConfig` | Environment laden/validieren | `parseFile`, `loadMerged`, Config-Getter | Pfad/Env → Array/Werte | Dateisystem | fehlende Werte über `missingKeys` erkennbar | VORHANDEN |
| `Database` | PDO-Verbindung und DB-Erstellung | `connect`, `connectServer`, `ping`, `ensureDatabaseExists` | Config → PDO/Status | PDO MySQL | `PDOException`/Runtimefehler | VORHANDEN |
| `SchemaMigrator` | Core-Schema verwalten | `status`, `migrate`, `managedTables` | keine → Status | Database/PDO | SQL-/PDO-Fehler propagieren | VORHANDEN |
| `Phase4AuthManager` | Sessionidentität, Login/Logout, Rechte | `authenticate`, `identityFromSession`, `resolveIdentity`, `logout`, `hasPermission` | Credentials/Header → Identität/Boolean | User, Role, SessionRegistry | ungültige Identität ergibt null; API übersetzt in HTTP-Fehler | VORHANDEN |
| `Phase4UserService` | Benutzer-CRUD/Authentifizierung | `allPublic`, `getPublicById`, `create`, `update`, `delete`, `authenticate` | Payload/ID → User | PDO, PasswordHasher, RoleService | Validierungs-/Konfliktfehler | VORHANDEN |
| `Phase4RoleService` / `Phase4PermissionService` | RBAC und Permissionkatalog | Rollen-CRUD, `replacePermissions`, `ensure`, `deleteByScope` | Definitionen → Rollen/Rechte | PDO | Systemrollen geschützt; ungültige Keys werden abgelehnt | VORHANDEN |
| `Phase6SettingsService` | DB-Settings und Modulnamespace | `getAll`, `update`, `removeModuleSettings` | Settings → Settings | PDO | DB-/Validierungsfehler | VORHANDEN |
| `Phase6AuditService` | Audit schreiben/lesen | `log`, `list` | Aktion/Filter → Liste | PDO | DB-Fehler | VORHANDEN |
| `Phase7ModuleRuntime` | Server-Discovery, Lifecycle und bereinigter Clientzugriff | `discover`, `listForAdmin`, `listForClient`, `install`, `activate`, `deactivate`, `update`, `uninstall` | ID/Identity → Modul | Manifestdateien, PDO, Permissions, Modulvertrag/Migrationen | unbekannte/ungültige Module werfen; Update/Uninstall erfordern INACTIVE; Downgrade ist gesperrt | VORHANDEN |
| `ModuleContract` / `ModuleServerRegistry` | Manifestkompatibilität und isolierte Server-Entries validieren | `normalize`, `resolve`, `resolveForLifecycle` | Manifest/Modul → normalisierter Vertrag | PHP 8+, API/Core-Version | ungültige IDs, Pfade, Verträge und inkompatible Versionen scheitern geschlossen | VORHANDEN |
| `ModuleHttpKernel` / `ModuleLimitGuard` | deklarierte Modulrouten autorisieren und serverseitige Limits erzwingen | `dispatch`, `assertWithinLimit` | Request/Identität → Serviceantwort | Auth, CSRF, Rollenrechte, Servicefactory | keine aktive Registration, Rechte, CSRF oder Kapazität → kontrollierter HTTP-Fehler | VORHANDEN |
| `ModuleMigrationRunner` | Modul-SQL versioniert und checksumgebunden ausführen/zurückrollen | `migrate`, `rollback`, `runBatch` | Modul/Migrationen → Ergebnis | PDO, DB-Sperre, `module_migrations` | Checksumkonflikt, SQL-Fehler und unvollständiger Rollback werden gespeichert/gemeldet | VORHANDEN |
| `JsonResponse` | einheitliche JSON-Antwort | `success`, `error`, `send` | Payload/Status → HTTP-Antwort | PHP HTTP | beendet Ausführung (`never`) | VORHANDEN |

## Fehlende universelle Core-Funktionen

| Fähigkeit | Status | Begründung/TODO |
|---|---|---|
| persistente Sync-Queue mit Backoff/Idempotenz | FEHLT/TODO | IndexedDB-Store `sync` existiert, Orchestrierung fehlt |
| Konflikterkennung und Konfliktauflösung | FEHLT/TODO | kein allgemeiner Vertrag nachweisbar |
| Datenversionierung für synchronisierte Records | FEHLT/TODO | nicht allgemein implementiert |
| zentraler API-Timeout und Retry-Policy | TEILWEISE | kontrollierter Timeout ist vorhanden und getestet; allgemeine sichere Retry-Policy fehlt |
| versionierter Core-/Event-/Servicekatalog | VORHANDEN | Vertrag `1.0.0`; Payload-Grundregeln und Service-Sichtbarkeit sind stabilisiert |
| abstrahierte Geräte-Service-Schicht | FEHLT/TODO | GPS greift direkt auf Browser-Geolocation zu |

## Versionierter öffentlicher Vertrag

`CoreContracts` (`Web-App/core/core-contracts.js`) ist **VORHANDEN**. `Core.contractVersion`, `Core.getContract()`, `Core.events` und `Core.isPublicFacade(name)` liefern den unveränderlichen Vertrag `1.0.0`. Facaden in `publicFacades` sind öffentlich; Einträge in `internalGlobals` sind Implementierungsdetails und dürfen von Modulen nicht als stabil angenommen werden.

### Event- und Servicegarantien

`CoreEventBus.publish()` validiert den Eventnamen, isoliert fehlerhafte Listener, liefert die Anzahl erfolgreicher Zustellungen und übergibt veröffentlichte Events an den begrenzten `CoreEventRing`. `ServiceManager.register(name, service, {visibility})` akzeptiert kollisionsfreie Kleinbuchstaben-Namen, überschreibt keine Registrierung und unterstützt `unregister`/`clear`; interne Services sind nur mit `{includeInternal:true}` erreichbar.

`CoreNetwork.dispose()` entfernt Browserlistener und Subscribers und erlaubt eine saubere erneute Initialisierung. `network:changed` wird genau einmal pro tatsächlichem Browserstatuswechsel mit unveränderlichem Snapshot emittiert; der Status ist ausdrücklich kein API-Health- oder Syncnachweis.

### Storage- und Modulkonfiguration

`CoreStorage.namespace(namespace)` erzeugt eine eingeschränkte Key-Value-Facade und behält das bestehende Format `core:<namespace>:<key>`. `ConfigManager.setModule/getModule` verwaltet ausschließlich `moduleSettings.<id>`; secretartige Felder werden im ausgelieferten Clientvertrag abgelehnt.

### Fehlervertrag

`CoreErrorHandler.handle(error, context)` erzeugt über das interne `ErrorLog` einen klassifizierten Eintrag (`type`, `severity`, `code`) und emittiert `error:handled` ohne rohes Errorobjekt. Kontext, Meldung und Stack werden auf typische Secretmuster bereinigt; die lokale Historie ist auf 256 Einträge begrenzt.

### Facadenauflösung und Modulzustände

`Core.getFacade(name)` liefert nur Facaden des versionierten Public-Katalogs. Der `ModuleManager` garantiert: Discovery aktiviert nicht; `install` endet `INACTIVE`; `activate` endet `ACTIVE`; `deactivate` endet `INACTIVE`; `update` emittiert `module:updated`; `uninstall` deaktiviert aktive Module vor Cleanup/Entfernung und emittiert `module:uninstalled`.

Ein bereits serverseitig aktives Modul wird nach der Client-Discovery initialisiert und genau einmal über `enable()` beziehungsweise `activate()` in seinen tatsächlichen Laufzeitzustand versetzt. `clientAccess.mode/canView/canUse` wird durch Loader, Interface und Registry erhalten. Die User-Shell filtert anonyme Navigation und direkte Aufrufe fail-closed anhand dieser Entscheidung; lokale Einstellungen dürfen die Serverfreigabe nur weiter einschränken.

| `CorePerformance` | datensparsame Startphasen; `Web-App/core/core-performance.js` | `mark`, `has`, `get`, `snapshot` | Phasenname → monotone Zeitmarke | Browser Performance API mit Date-Fallback | doppelte Marken verändern den Erstwert nicht | VORHANDEN |

`CoreStartup.start()` liefert die interaktive Minimalbereitschaft. `startBackground()` startet dedupliziert Storage, Corefacaden und Modul-Discovery; `getStatus()` meldet nur technische Phasen. Marken: `minimal-core-ready`, `storage-ready`, `module-discovery-complete`, `background-initialization-complete`.

`ApiClient.request(endpoint, {timeoutMs})` beendet hängende Requests kontrolliert (Standard 10 s) und liefert `API_TIMEOUT` statt unbegrenzt zu warten; kein automatischer Retry verändert Schreib-/Authsemantik.

### Vollständige Startmarken

`navigation-start`, `dom-available`, `shell-visible`, `minimal-core-ready`, `ui-interactive`, `storage-ready`, `auth-status-known`, `module-discovery-complete` und `background-initialization-complete` bilden den P3-Codevertrag. Die Werte enthalten keine Identität, URL, Payload oder Secrets.
## User UI Design V2

`NeutralUserUiDesign` migriert V1 und normalisiert einen versionierten V2-Allowlist-Vertrag mit komponentenspezifischen Action-, Navigation- und Form-Control-Farben. Der User-Presentation-Vertrag speichert pro Gerät den Modus Icon+Text/nur Icons/nur Text und maximal 32 Zeichen lange Klartext-Label-Overrides anhand stabiler zentraler bzw. Modul-IDs; Reset nutzt den zur Renderzeit gelieferten offiziellen Text.

`NeutralUserUiDesign` normalisiert einen versionierten Allowlist-Vertrag für getrennte Light-/Dark-Paletten, gemeinsame Radien/Contentbreite/Basisschriftgröße und begrenztes Custom CSS. Admin Appearance besitzt isolierte Preview, strukturierten Reset und CSS-Clear. Die öffentliche Projektion wird synchron local-first vor First Paint angewendet und unabhängig im Hintergrund erneuert; persönliche Themeauswahl bleibt lokal und unverändert.

## P4 global homepage configuration

`Admin → Appearance` owns the global start page. Obsolete server-backed Theme/Layout controls are not presented because the current Admin and User themes are independent local header states and no productive layout consumer exists. Legacy settings are preserved when the homepage is saved.
Administrators choose either an active startable module from the runtime module
catalog or trusted free HTML. The central settings contract stores the mode,
module ID, and HTML unchanged; the public API exposes only that homepage
projection for User-App startup. Writes continue through the protected admin
settings endpoint with admin authorization and CSRF enforcement.

The User-App opens a configured module only when it is active and visible to the
current user. Trusted HTML is rendered as a complete `srcdoc` document in a
script-capable sandboxed frame. Missing configuration, unavailable server state,
an inactive module, or insufficient module access falls back to the neutral
default home instead of leaving an empty view.

## Admin operations (2026-09-09)

- Classified read-only permission catalog with Admin/User-App and Core/Module source filters.
- Persistent, revocable device sessions with privacy-safe platform labels and central device limit.
- Authoritative runtime/server/database/module diagnostics and explicit optional provider state.
- Persistent maintenance mode with User-App maintenance projection and Admin-safe control.
- Encrypted backup create/list/upload/download/restore/delete plus retention and CLI automatic trigger.
- Filterable, folded-detail audit log and audited age-based retention purge.

## 2026-09-09 Live follow-up behavior

- `Phase4SessionRegistry::replaceActiveInstallation(userId, deviceId, currentSessionId)` retires older active logins for exactly one installation.
- `ApiClient.deviceLabel()` honestly labels detectable iOS/iPadOS browser tokens, including `CriOS` as Chrome, without hardware fingerprinting.
- `AdminRouter.showView()` swaps to a route-owned host immediately and contains late/failing view work.
- `GpsModule.locationLinks(position)` creates neutral Google Maps, OpenStreetMap and OSM embed URLs from an explicitly selected current position.

## Account and license foundation (2026-09-09)

- `Phase4PasswordHasher::assertValid` centralizes the exact 8–25/no-whitespace policy for creation, bootstrap and password changes.
- `AccountLicenseService` validates private profiles/default-off sharing, verifies current-password changes, resolves exact license-manager scope, assigns seats, projects entitlement module states, records privacy-minimal server presence, aggregates installation metrics and validates profile images.
- `Phase4SessionRegistry::licensedDeviceLimit` resolves per-user/per-license limits with configured fallback; configured privileged roles can be unlimited without using UA data as identity.
- User Settings has four responsive internal sections and preserves the selected section after save. GPS registers translations through Core I18N and uses a local OSM tile viewport with real zoom/pan.

## Completed freeze follow-up functions (2026-09-09)

- Login without request-time migration locks for both user and separate admin scopes.
- Deterministic Web-Mercator projection, responsive tile placement and safe external OSM navigation.
- Scoped organization members (create/list/block/remove), usage/activity, devices and revoke.
- Private validated image submission, owner status, controlled delivery and audited moderation lifecycle.

## Administrative commercial and governance functions

- Package list/create/edit/status/delete-if-unassigned with module states and device default.
- License/organization list/create/edit with package, seats, manager, status and device-limit origin.
- User license assignment and default/numeric/unlimited device override without implicit revocation.
- Native birthday selection plus strict ISO calendar validation.
- Dedicated, confirmed, transactional and self-auditing Audit Delete All.
# 2026-09-10 License/session/backup additions

- `AccountLicenseService::deleteLicense()` permits only unreferenced License deletion and returns bounded ID/key metadata for same-transaction auditing.
- `Phase4SessionRegistry::supportMetadata()` projects conservative Device class, Operating system and Browser labels while `deviceId` remains authoritative.
- `DatabaseBackupService::normalizeConfiguredDirectory()` and `testDirectory()` validate/probe a custom protected path; the constructor's optional directory is consumed by both HTTP backup operations and the automatic CLI runner.
- `DatabaseBackupService::portableTables()` defines the exact 21-table Core v1 backup boundary, excluding `sessions` and `login_attempts`; module-owned tables and media binaries are not silently implied.
- `DatabaseBackupService::validatedTables()` is the shared pre-mutation/pre-storage validator for logical format, current schema, exact table set and row shape, used by both restore and upload.

- Backup v2 `portableTables()` merges Core tables with installed modules' generic manifest table declarations; managed-media export/validation/staging carries byte content with logical paths and SHA-256 while v1 remains readable.

- `AccountLicenseService::profile()` projects the authoritative boolean organization-sharing capability; `updateProfile()` rejects unauthorized true sharing flags before mutation and preserves privacy when omitted.
- User hash routing reproduces main/Settings-subtab Active-State and applies `aria-current` plus centralized `--nav-active-*` tokens.
## Shared UI feedback

- `NeutralUiFeedback.showSuccess(message, options)` renders the one-at-a-time accessible User/Admin success dialog and restores focus when closed.
- `NeutralUiFeedback.enhancePasswordFields(root)` equips static or dynamically rendered password inputs with the shared Show/Hide control.
- `AccountLicenseService::assignDirectPackage()` validates and stores an individual user's direct Package and device override.
- `moduleEntitlementsForUser()` resolves active License Package first, then the retained direct Package fallback.
- `NeutralUiFeedback.enhancePasswordFields()` renders shared open/crossed eye SVGs for static and dynamic password inputs.

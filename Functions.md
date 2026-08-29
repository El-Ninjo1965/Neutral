# NEUTRAL – Funktionskatalog des Core

Dieses Dokument beschreibt ausschließlich im Repository nachweisbare, relevante Funktionen. Detailmethoden bleiben im Quellcode maßgeblich.

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
| `CoreLoader` | Core-/Manifest-/Skript-Laden; `Web-App/core/core-loader.js` | `initialize`, `loadModuleManifest`, `loadModuleFromManifest`, `discoverExternalModules` | Pfade/Manifest → Promise/Modul | Fetch oder Node-fs, globale Module | fehlende/ungültige Dateien liefern null/leer oder werden protokolliert | VORHANDEN |
| `ModuleInterface` | Manifestnormalisierung; `Web-App/core/module-interface.js` | `validateManifest`, Lifecycle-Helfer | Manifest → normalisiertes Manifest | keine | ungültige Pflichtfelder führen zu Fehler/null gemäß Methode | VORHANDEN |
| `ModuleRegistry` | Modulregister und Discovery; `Web-App/core/module-registry.js` | `register`, `unregister`, `get`, `getAll`, `getByApp`, `discover` | Modul/ID → Modul/Liste | ModuleInterface, CoreLoader, `window` Entry | Duplikat/ungültige ID wirft; fehlender Entry wird übersprungen | VORHANDEN |
| `ModuleManager` | Client-Modul-Lifecycle; `Web-App/core/module-manager.js` | `discoverModules`, `register`, `install`, `initialize`, `enable/activate`, `disable/deactivate`, `update`, `uninstall` | Modul-ID → Modul/Boolean | Registry, MasterFramework, Core Events | fehlendes Modul/Dependency wirft | VORHANDEN |
| `MasterFramework` | App-, Entity-, Connection-, Provider-, Storage-, Rollen-, Modul- und Setupfacade; `Web-App/core/master-framework.js` | zahlreiche dokumentierte Methoden, u. a. `registerApp`, Entity-CRUD, `registerConnection`, Modul-/Rollenfunktionen | Definitionen/IDs → Zustandsobjekte | Config/Storage/Provider und Runtime | Eingaben werden normalisiert; ungültige IDs/Abhängigkeiten werfen | VORHANDEN, breit gekoppelt |
| `ApiClient` | zentraler JSON-Fetch; `Web-App/public/api-client.js` | `request`, `get/post/put/patch/delete`, fachfreie Endpoint-Wrapper, `resolveNeutralApiUrl` | Endpoint/Optionen → `{ok,status,data|error}` | Fetch, Cookies, `NeutralConfig.apiBase`/Meta-Konfiguration | Netzwerk/HTTP wird als Ergebnis `ok:false` zurückgegeben | VORHANDEN |
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
| `Phase7ModuleRuntime` | Server-Discovery und Lifecycle | `discover`, `listForAdmin`, `listForClient`, `install`, `activate`, `deactivate`, `uninstall` | ID/Identity → Modul | Manifestdateien, PDO, Permissions | unbekannte/ungültige Module werfen; Transaktionen schützen Änderungen | VORHANDEN |
| `JsonResponse` | einheitliche JSON-Antwort | `success`, `error`, `send` | Payload/Status → HTTP-Antwort | PHP HTTP | beendet Ausführung (`never`) | VORHANDEN |

## Fehlende universelle Core-Funktionen

| Fähigkeit | Status | Begründung/TODO |
|---|---|---|
| persistente Sync-Queue mit Backoff/Idempotenz | FEHLT/TODO | IndexedDB-Store `sync` existiert, Orchestrierung fehlt |
| Konflikterkennung und Konfliktauflösung | FEHLT/TODO | kein allgemeiner Vertrag nachweisbar |
| Datenversionierung für synchronisierte Records | FEHLT/TODO | nicht allgemein implementiert |
| zentraler API-Timeout und Retry-Policy | FEHLT/TODO | ApiClient verwendet Fetch ohne Timeout/Retry |
| versionierte Event-/Serviceverträge | FEHLT/TODO | globale Namen und Payloads sind nicht formal versioniert |
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

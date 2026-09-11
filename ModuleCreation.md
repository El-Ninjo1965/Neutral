# NEUTRAL – Verbindliche Anleitung zur Modulerstellung

## Aktueller Modulvertrag und Abgrenzung (2026-09-11)

### Verbindliches Integrationsprinzip

Ein Fachmodul ändert keine Coredatei nur zu seiner eigenen Anbindung. Es nutzt Manifest, Browserentry, generischen Modulloader, `Server/php/modules/<id>/module.php`, Modulservice/-route, eigene deklarierte Tabellen/Migrationen, Permissions, Settings, Events und öffentliche Facades. Erst eine unabhängig belegte universelle Lücke rechtfertigt einen neutralen Core-Extension-Point.

### Tatsächlich validierte Manifestbereiche

`ModuleContract` validiert `id`, semantische `version`, `permissions`, `compatibility`, `server.entry/services/routes`, mutierende CSRF-Routen, optionale Routenlimits, `database.tables/migrations`, `limits` und `uninstall.dataPolicy`. Zusätzlich werden `presentation` (`userNavigation`, `adminNavigation`, `system`), `category`, `optionalDependencies` und der optionale sichere `standalone`-Self-Test-Eintrag normalisiert. `capabilities`, `access`, `admin` und weitere beschreibende Metadaten werden transportiert beziehungsweise von ihren jeweiligen Consumern ausgewertet; freie `contracts`-Objekte sind derzeit deklaratives Scaffolding und kein automatisch ausgeführter Fachvertrag.

Pflichtabhängigkeiten stehen in `dependencies` und dürfen nur verwendet werden, wenn das Modul ohne sie nicht funktionieren kann. `optionalDependencies` blockieren Installation/Aktivierung nicht und müssen per Capability Detection mit sauberem Fallback genutzt werden. Abhängigkeiten verleihen keine Permission.

### Lifecycle und Präsentation

Discovery bedeutet nur gefunden. Installation registriert Manifest, Permissiondefinitionen und Migrationen und endet inaktiv. Aktivierung ist ein eigener Schritt. Deaktivierung behält bei `retain` Daten. Uninstall folgt dem validierten Datenvertrag. `presentation.userNavigation=false` erlaubt aktive unsichtbare Systemmodule; `adminNavigation` steuert nur die deklarierte Präsentation. Eine namespacete rollenbezogene Visibility-/Navigation-Konfiguration ist getrennt von Permissions vorhanden. Permissions bleiben alleinige serverseitige Autorisierung.

### Server, Daten, Backup und Sicherheit

Serverrouten liegen unter `/api/v1/modules/<id>/<path>` und deklarieren Service, Action, Permission und CSRF. Tabellen verwenden den Modulnamespace und Manifest-/PHP-Migrationsdeklarationen müssen übereinstimmen. Backup V2 nimmt Tabellen installierter Module aus deren Manifest und verwaltete Core-Mediendateien auf. Ein Modul darf daraus keine Sicherung nicht deklarierter externer Dateien ableiten. Browsercode enthält keine Secrets und behandelt 401/403/404/409/422/503 kontrolliert.

### UI, Settings, I18N, Theme und Offline

Module verwenden zentrale responsive Komponenten/Tokens, stabile I18N-Keys und `moduleSettings.<id>`. Offlinefähigkeit muss konkret angegeben und getestet werden; der gecachte Entry allein beweist weder Offline-Datenhaltung noch Sync. Die generische Sync-/Konfliktengine ist noch geplant.

### Standalone-/Self-Test

Ein `standalone`-Entry ist sinnvoll, wenn eine isolierbare Browser-/Gerätefunktion ohne Auth, DB oder produktiven Serverzustand geprüft werden kann. Er muss Voraussetzungen und Grenzen deklarieren. GPS ist das einzige live bestätigte Referenzbeispiel. Ein Standalone-Test ersetzt niemals Manifest-, Lifecycle-, Permission-, CSRF-, DB-, Backup-, Offline- oder Produktionsprüfung und ist für reine Server-/Systemmodule nicht automatisch Pflicht.

### Systemmodule und Beweismodul

Profile, Media, Sharing, Notifications, Moderation und Postbox sind optionale Module mit dem in `SYSTEM-MODULES.md` beschriebenen Zielgrad. Field Notes ist als unabhängiges User Module mit eigener Navigation, Permissions, Tabelle/Migration, CRUD, I18N und Theme über bestehende generische Verträge implementiert. Es beansprucht keine Offline-Synchronisation; Datenoperationen benötigen den Server. Code-/Testnachweis ersetzt nicht die offene Betreiber-Liveabnahme.

---

**Status:** VERBINDLICHER AKTUELLER MODULVERTRAG

**Geprüft:** 2026-09-03
**Autorität:** untergeordnet zu [`CORE-1.0.md`](CORE-1.0.md); noch fehlende Core-1.0-Modulfähigkeiten stehen in [`STATUS.md`](STATUS.md).

Diese Anleitung beschreibt den aktuellen Modulvertrag. Sie fordert kein neues Modul. Status **FEHLT/GEPLANT** bezeichnet nicht vorhandene Fähigkeiten, die nicht erfunden oder durch direkte Core-Manipulation umgangen werden dürfen.

## 1. Grundregeln

- Ein Modul implementiert eine abgegrenzte Erweiterung; der NEUTRAL-Core bleibt fachfrei.
- Das Modul besitzt seine Dateien, Konfiguration und Daten selbst.
- Discovery, Installation und Aktivierung sind getrennt.
- Ein Modul wird nie allein durch Discovery oder Installation aktiv.
- Keine Secrets im Manifest oder Browsercode.
- Keine direkten Änderungen an `Web-App/core/core*.js`, `Web-App/core/master-framework.js`, `Server/public/api/index.php`, PHP-Coreklassen oder Dateien anderer Module, nur um ein einzelnes Feature anzubinden.
- Fehlt ein universeller Vertrag, wird er in `TODO.md` dokumentiert und separat als Core-Entscheidung bearbeitet.

## 2. Tatsächliche Struktur

Referenz ist `Web-App/app/modules/gps/`:

```text
Web-App/app/modules/<module-id>/
├── module.json       # Pflichtmanifest
├── index.js          # deklarierter Browser-Entry
└── index.html        # optionaler Standalone-Test, nur wenn deklariert
```

Für Serverfähigkeiten gehört genau ein geschützter Entry hinzu:

```text
Server/php/modules/<module-id>/
└── module.php       # gibt ID, Version, Services und Migrationen zurück
```

`Web-App/app/modules/index.json` kann Clientkatalogeinträge enthalten. PHP `Phase7ModuleRuntime` scannt Modulmanifeste im Projektmodulpfad. Pfade müssen relativ zum aktiven Installationskontext bleiben.

## 3. Manifest

Nachweisbar unterstützte Felder:

- `id`: stabil, klein geschrieben und routing-/DB-tauglich
- `name`, optional `displayName`, `description`
- `version`
- `type`
- `entry`: Browser-Entry
- `globalName`: global exportiertes Implementierungsobjekt
- `dependencies`: deklarierte Modulabhängigkeiten
- `permissions`: Definitionen mit `key`, `description`, `defaultRoles`
- `access`: `visibilityPermissions`, `usagePermissions`, `managementPermissions`, `adminPermissions`
- `capabilities`: beschreibende Fähigkeiten
- `standalone`: optionaler Testentry mit `requires`
- `database.tables`: explizit deklarierte modul-eigene Tabellen
- `database.migrations`: geordnete Objekte aus unveränderlichem `key` und SemVer-`version`
- `compatibility`: unterstützte Core-Spanne, API-Major und minimale PHP-Version
- `server.entry`: relativer geschützter PHP-Entry
- `server.services`: eindeutige Service-IDs
- `server.routes`: relative Route, Methode, Service/Action, Permission und optional `limit`
- `limits`: benannte rollenspezifische ganzzahlige Grenzwerte; `null` bedeutet unbegrenzt
- `uninstall.dataPolicy`: `retain` als Standard oder explizit `destroy`
- `admin.settings`: Settingsmetadaten mit Pfad unter `moduleSettings.<id>`

Unbekannte Felder sind kein automatisch unterstützter Vertrag. Manifest und Implementierung müssen dieselbe ID/Version verwenden.

## 4. Entry Point

Der Entry wird durch `CoreLoader` geladen/evaluiert. Die Implementierung wird über `window[globalName]` gefunden und durch `ModuleRegistry`/`ModuleManager` normalisiert. Das Objekt darf nach aktuellem Manager folgende Lifecyclemethoden bereitstellen:

- `install()`
- `initialize()`
- `enable()` oder `activate()`
- `disable()` oder `deactivate()`
- `update()`
- `uninstall()`

Methoden müssen idempotent geplant werden, Listener/Watcher bei Deaktivierung entfernen und Fehler werfen oder über den Core-Fehlerpfad melden, statt Fehler zu verschlucken.

## 5. Discovery und Registration

1. Loader liest Katalog/Manifest und Entry.
2. `ModuleInterface.validateManifest()` normalisiert/validiert.
3. `ModuleRegistry.discover()` kombiniert Katalog und externe Discovery.
4. `ModuleManager.discoverModules()` registriert Clientrepräsentationen, ohne Aktivierung zu erzwingen.
5. PHP `Phase7ModuleRuntime::discover()` liest Manifeste; `install()` persistiert Registration und inaktiven State.

Discovery darf keine DB-Änderung, Geräteberechtigung, Netzwerkanfrage oder UI-Navigation auslösen.

## 6. Lifecycle

| Phase | Zulässige Arbeit |
|---|---|
| DISCOVERED | Metadaten lesen/anzeigen; keine Aktivierung |
| INSTALL/REGISTER | nur neues oder `retain`-tombstoniertes Modul; Manifest/Permissions registrieren; bleibt inaktiv |
| INACTIVE | keine Watcher oder fachliche Hintergrundarbeit |
| ACTIVATE/ACTIVE | nur exakt und eindeutig installierte Version; fehlender Versionsmarker scheitert geschlossen; Dependencies/Rechte prüfen, Listener und UI kontrolliert starten |
| DEACTIVATE | Watcher, Timer, Listener und Ressourcen freigeben; Daten erhalten |
| UPDATE | nur INACTIVE; Kompatibilität/Migrationen prüfen; Downgrade ablehnen; Version danach persistieren |
| UNINSTALL | Registrierung, modulbezogene Rechte/Settings entfernen; Daten nur nach expliziter sicherer Deklaration löschen |

## 7. Dependencies

Abhängigkeiten im Manifest deklarieren. `ModuleManager.validateDependencies()` bzw. `MasterFramework.validateModuleDependencies()` prüft Vorhandensein und Versionanforderungen. Kein Modul liest private Interna einer Dependency. Zyklische oder fehlende Abhängigkeiten müssen Aktivierung verhindern und diagnostizierbar sein.

## 8. Permissions und Security

- Jeder Modulzugriff erhält modulbezogene Permissionkeys, z. B. `<id>.view`.
- Sichtbarkeit, Nutzung, Verwaltung und Administration werden in `access` getrennt.
- Clientprüfung verbessert UX, erteilt aber keine Serverrechte.
- Serverseitige Daten/Actions benötigen zwingend serverseitige Permission- und CSRF-Prüfung.
- Defaultrollen sind Installationsdefaults, keine unveränderliche Autorisierung.
- Browser-Geheimnisse, DB-Zugangsdaten und Admin-Tokens sind verboten.
- Jede Permission wird ausschließlich im Modulmanifest unter `permissions` mit stabilem `<module-id>.<action>`-Key, konkreter menschenlesbarer `description` und überprüften `defaultRoles` deklariert. Dieselben Keys werden in `access` und bei Serverrouten referenziert. Installation synchronisiert diese Definitionen in den read-only Permission Catalog; die Adminoberfläche erstellt, editiert oder löscht keine Keys.
- Der öffentliche PHP-Modulkatalog verwendet für Besucher ohne Login ausschließlich die gespeicherten Modulrechte der Systemrolle `viewer`. Nur aktive Module mit Sichtrecht werden ausgeliefert; `clientAccess.canUse` benötigt zusätzlich das Nutzungsrecht.
- `clientAccess` ist eine bereinigte Browserentscheidung und niemals ein Ersatz für Session-, Permission- oder CSRF-Prüfung an Serverendpunkten.

## 9. Capabilities

`capabilities` sind deklarative Metadaten und kein Rechteersatz. Die Serverkompatibilität wird separat über `compatibility.core`, `compatibility.api` und `compatibility.php` geprüft; derzeit gilt Core `>=1.0.0 <2.0.0`, API-Major `1` und PHP 8+.

## 9a. Mobile-/Plattformvertrag für Gerätefunktionen

Zukünftige Produktmodule müssen grundsätzlich für mobile Web-App-Nutzung auf iOS und Android geeignet sein. Der Standard ist Mobile-First und Touch-First; ein Modul darf nicht ohne zwingende technische Notwendigkeit auf ein einzelnes Betriebssystem oder einen einzelnen Browser eingegrenzt werden.

- Mobiles Web-Design ist der Standard. Touch-Ziele, kleine Bildschirme, schwankende Netzverbindungen und Gerätefunktionen werden als Teil des normalen Entwurfsverhaltens behandelt.
- Gerätefunktionen werden über Capability Detection, standardisierte Web-APIs oder dokumentierte Core-Facaden abgerufen. Eine harte iOS-/Android-Erkennung ist nur zulässig, wenn der technische Unterschied nachweislich und lokal begrenzt notwendig ist.
- Ein Modul muss definierte Fallbacks für fehlende Gerätefähigkeiten besitzen, statt bei einem nicht vorhandenen Feature sofort zu scheitern.
- Berechtigungen müssen im UI und im Modulfluss klar behandelt werden; Browser-Permissiondialoge dürfen nur in verständlichem, benutzergesteuertem Kontext ausgelöst werden.
- Der öffentliche Modulvertrag soll bei späteren nativen Wrappern möglichst erhalten bleiben. Ein nativer Container darf intern adaptieren, aber der Modulkontrakt und die Nutzererfahrung müssen konsistent bleiben.
- Persönliche Modulvoreinstellungen für installierte Module werden im Namespace `moduleSettings.<id>` gespeichert; sie steuern das Nutzerverhalten ohne die serverseitige Modulinstallation oder den Lifecycle zu verwischen. Installation, Aktivierung und Deinstallation bleiben getrennte Admin-/Management-Entscheidungen.
- `GPS` dient als Referenzmodul für diesen plattformneutralen Gerätevertrag; ein Gerät-Feature muss im Core oder im Modul selbst durch dokumentierte Fallbacks und Progressive Enhancement abgesichert werden.

## 10. Erlaubte Core-Schnittstellen

Maßgeblich ist Vertrag `window.Core.getContract()` in Version `1.0.0`; eine erlaubte Facade wird mit `window.Core.getFacade(name)` bezogen. Nur Namen in `publicFacades` sind Modul-APIs; `internalGlobals` sind trotz globaler Erreichbarkeit privat.

Module dürfen ausschließlich dokumentierte öffentliche Facaden nutzen:

- `window.Core`: `on`, `off`, `once`, `emit` und dokumentierter Corezustand
- `window.ModuleManager`/`ModuleRegistry`: nur für Modulverwaltung durch Framework-/Admincode; ein Fachmodul verwaltet nicht fremde Module
- `Core.getFacade("ConfigManager")`: lesen/schreiben im eigenen Namespace `moduleSettings.<module-id>`
- `Core.getFacade("CoreStorage")`: über `namespace("module:<id>")` nur eigene Daten
- `Core.getFacade("DatabaseManager")`: dokumentierte CRUD-Operationen; eigene Records/Stores nur nach freigegebenem Schemavertrag
- `Core.getFacade("ServiceManager")`: veröffentlichte Services beziehen; eigene Services unter kollisionsfreiem Modulnamen registrieren
- `Core.getFacade("CoreErrorHandler")`: Fehler mit Modulkontext melden
- `ApiClient`: dokumentierte Serverendpunkte verwenden
- Browsergeräte-API nur, wenn noch kein Coreadapter existiert; Berechtigung und Fallback dokumentieren. GPS ist aktuelles Beispiel.

Vor Nutzung Methodensignatur in `Functions.md` und Quellcode prüfen. Direkter Zugriff auf globale Implementierungsobjekte ist nur eine Bestands-Kompatibilitätsschicht und kein Modulvertrag.

## 11. Verbotene Core-Eingriffe

Ein Modul verändert nicht direkt:

- Core-/Plattformdateien unter `Web-App/core/`
- `MasterFramework`-Interna oder dessen private Zustandsstrukturen
- den zentralen PHP-Router oder Core-Schema nur für modulfachliche Logik
- Adminshell, Auth-, Session- oder RBAC-Core
- Dateien/Storagekeys/Tabellen anderer Module
- globale Eventhandler ohne Cleanup

Benötigt ein Modul einen neuen universellen Extension Point, wird zuerst Vertrag, Sicherheitsgrenze, Tests und Migration dokumentiert.

## 12. Events, Hooks und Modulkommunikation

**VORHANDEN:** Module können `Core.on/off/once/emit` verwenden. Frameworkevents umfassen u. a. Modulregistrierung/-aktivierung/-deaktivierung, Lifecycle- und Datenbankinitialisierung.

Regeln:

- Eventnamen mit Modulnamespace, z. B. `module:<id>:<event>`.
- Payload als dokumentiertes Objekt; keine Secrets oder mutable private Referenzen.
- Listener bei Deaktivierung entfernen.
- Module kommunizieren über Events oder explizit registrierte Services, niemals über Dateimanipulation oder private globale Variablen.
- Request/Response über Events ist aktuell nicht formal standardisiert.

**VORHANDEN:** kanonischer Eventkatalog in Vertrag `1.0.0`. **FEHLT/GEPLANT:** formales Hookregister, versionsspezifische Payloadschemas, asynchrone Zustellgarantie und Sandbox.

## 13. Services

Browserservices werden mit einem Namen wie `module.<id>.<service>` als öffentlich oder intern registriert. Serverseitig sind Services in `server.services` deklariert und werden vom gleich identifizierten `module.php` als Factories geliefert. Doppelte oder fehlende Services sowie Manifest-/Entry-ID- oder Versionsabweichungen werden abgelehnt. Fremde Services dürfen nur über dokumentierte öffentliche Verträge verwendet werden.

## 14. Storage und lokale Datenbank

- Keys über `CoreStorage.namespace("module:<id>")` immer mit Modul-ID namespacen.
- Kein Passwort oder Server-Sessiongeheimnis lokal speichern.
- localStorage nur für kleine, unkritische Werte.
- IndexedDB für strukturierte/offlinefähige Daten.
- Datenmodell, Version und Migration dokumentieren.
- Deinstallation löscht lokale Daten nur nach expliziter Nutzer-/Vertragsentscheidung.

Eigene dynamische IndexedDB-Stores pro Modul sind derzeit nicht als stabiler öffentlicher Migrationsvertrag implementiert (**FEHLT/GEPLANT**). Bis dahin vorhandene gemeinsame Stores nur kontrolliert und namespaced verwenden.

## 15. Serverdatenbank und Migrationen

Das Manifest deklariert eigene Tabellen unter `database.tables`; Bindestriche der Modul-ID werden für den verlangten Tabellenpräfix zu Unterstrichen. Drop bei Uninstall ist nur bei `uninstall.dataPolicy=destroy` und ausschließlich für validierte eigene Tabellen zulässig. Ohne Angabe gilt `retain`.

`database.migrations` und die Definitionen aus `module.php` müssen in Reihenfolge, Key und Version exakt übereinstimmen. Der Server bindet angewendete Migrationen an SHA-256, sperrt konkurrierende Läufe und kompensiert einen fehlgeschlagenen Batch über die zugehörigen `down`-Statements. Eine bereits angewendete Migration darf nie verändert oder aus einer neueren Definition entfernt werden. Bei `retain` bleiben Modulzeile und Migrationshistorie als inaktiver, nicht registrierter Tombstone erhalten, damit eine Neuinstallation keine Migration doppelt ausführt. Destruktives Uninstall akzeptiert nur einzeln analysierbare Gegenmigrationen, deren Mutationsziel eine deklarierte eigene Tabelle ist; am Ende muss jede eigene Tabelle explizit entfernt werden. Keine SQL-Datei wird allein durch Ablage vertrauenswürdig oder ausgeführt.

## 16. API und Serverkommunikation

Module verwenden über `ApiClient` ihre deklarierten Endpunkte unter `/api/v1/modules/<module-id>/<route>`. Der zentrale Kernel prüft aktiven Registrierungszustand, Methode, Authentifizierung, Permission und CSRF für Schreibmethoden, bevor Server-Entry und Servicefactory ausgeführt werden. Quantitative Limits werden über eine modul-/limitbezogene DB-Sperre atomar um Nutzungsmessung und Mutation erzwungen. Der zentrale Router erhält keine fachlichen Modulzweige.

Keine direkte DB-Verbindung aus dem Browser. Keine feste Produktionsdomain im Modul. Offlinefehler kontrolliert behandeln.

## 17. Konfiguration

Adminsettings im Manifest verwenden Pfade unter `moduleSettings.<module-id>` und werden über `ConfigManager.setModule/getModule` bereitgestellt. Defaults sind keine Secrets. Einstellungen werden validiert und über Config/Settings-Service gelesen. Ein Modul liest oder löscht keine fremden Namespaces. Serverseitige sicherheitsrelevante Konfiguration bleibt serverseitig.

## 18. Logging und Fehler

- Fehler an `CoreErrorHandler` mit Modul-ID, Lifecyclephase und sicherem Kontext melden.
- Keine Passwörter, Tokens, vollständigen Standortverläufe oder personenbezogene Payloads loggen.
- Aktivierungsfehler hinterlassen keinen halben aktiven Zustand.
- Timer, Watcher und Listener in `finally`/Cleanup-Pfaden kontrolliert freigeben; Imports werden nicht in try/catch versteckt.

## 19. Offline und Synchronisation

Ein Modul muss Onlineabhängigkeit explizit deklarieren und lokale Zustände (`lokal`, `ausstehend`, `synchronisiert`, `Konflikt`, `Fehler`) sichtbar behandeln. Die universelle Sync-Queue, Retry-/Backoff-, Idempotenz- und Konfliktengine ist derzeit **FEHLT/GEPLANT**. Bis sie existiert, darf ein Modul nicht behaupten, generische Synchronisation sei garantiert.

GPS validiert lokale Speicherung und Offlineverhalten, besitzt aber aktuell keine serverseitigen Tabellen und keinen vollständigen Syncvertrag.

Der Loader speichert ausschließlich einen strukturell validierten anonymen Modulkatalog unter einem installationsbezogenen lokalen Schlüssel. Bei Netzwerkfehlern darf nur dieser anonyme Katalog wiederverwendet werden. Authentifizierte Antworten und fehlerhafte Kataloge werden nicht als anonymer Offlinezustand gespeichert. Ohne gültigen Cache bleibt die anonyme Modulliste leer.

Ein Modul mit Geräteberechtigung darf bei bereits erteiltem Browserstatus kontrolliert aktualisieren. Es darf beim bloßen Rendern keinen erstmaligen Berechtigungsdialog auslösen. Das GPS-Referenzmodul zeigt zunächst den letzten lokalen Wert und fragt höchstens einmal pro Mount automatisch ab, wenn der Status bereits `granted` ist.

Der allgemeine Offline-Vertrag des Cores: Nach einem erfolgreichen Online-Start stellt der Core-Service-Worker (`Web-App/public/service-worker.js`) die App-Shell, alle Core-Skripte, öffentliche CSS/JS-Assets und einmal erfolgreich geladene Modul-Entry-Skripte (`Web-App/app/modules/<id>/index.js`) versioniert im Cache Storage bereit. Ein Modul kann seinen Browser-Entry daher nach erfolgreichem ersten Laden auch offline erneut laden lassen. Nicht gecacht werden niemals: Nicht-GET-Requests, `/api/`-Antworten, Auth-/Session-, Admin- und Setup-Endpunkte sowie jede personalisierte oder sicherheitskritische Serverantwort. Module müssen deklarieren bzw. im Manifest-/Beschreibungstext dokumentieren, welche ihrer Funktionen offline arbeiten und welche zwingend Netzwerk benötigen; netzwerkabhängige Funktionen melden lokal `Offline – diese Funktion benötigt eine Verbindung.`, ohne die App zu blockieren.

## 20. Test- und Abnahmeregel

Mindestens prüfen:

1. Manifestvalidierung und Discovery ohne Aktivierung.
2. fehlende Dependency verhindert Aktivierung.
3. Install bleibt inaktiv.
4. Aktivierung registriert Ressourcen genau einmal.
5. Deaktivierung entfernt Watcher/Listener.
6. Update ist nur inaktiv, migrationssicher und downgradegeschützt.
7. Uninstall entfernt Registration/Permissions/Settings ohne fremde Daten; Standard ist Datenerhalt.
8. serverseitige Actions prüfen Session, Permission, CSRF und deklarierte Limits.
9. Offline-/Fehlerzustände verlieren keine lokalen Daten.
10. Standalone-Test ist nur Entwicklungsoberfläche und keine zweite Produktionsautorität.
11. `TODO.md`, `WORKFLOW.md`, `Functions.md`, `API.md`, `Database.md` und `Security.md` werden bei Vertragsänderung aktualisiert.

### Startperformance für Module

Discovery erfolgt ausschließlich einmal in `CoreStartup.startBackground()`. Ein Modul startet bei Discovery keine Geräteabfrage, Netzwerkoperation oder Aktivierung. Installation bleibt inaktiv; teure Ressourcen beginnen erst bei expliziter Aktivierung und werden bei Deaktivierung freigegeben. Module dürfen keinen zweiten Katalogscan aus UI-Code anstoßen.

## Permission domain

Modules declare their permissions in the module contract. These permissions are classified as User-App/Module in the registry unless a separately reviewed administrative module contract says otherwise. Modules must not reuse Core Admin permission keys to make User-App features function, and the Admin UI does not create arbitrary permission keys.

`Area` identifies the security/product surface (`Admin`, `User-App`, or `System`), not the noun in a permission key. A module permission such as `gps.admin` may control module-scoped settings, but Core module lifecycle and role assignment continue to require the separately enforced Core Admin permissions.

## Responsive User content

Module user interfaces use the shared `.user-content-grid` contract for groups of cards instead of device-specific widths. The grid fills available content width with `auto-fit`/`minmax`, collapses naturally on small viewports, and allows a module-specific modifier only to express content proportions. Cards remain token-based and touch-safe; modules do not hardcode iPad model dimensions.

## Freeze-Entscheidung für neue Produktmodule

Ein Produktfeature darf bestehende Coredateien nicht für seine konkrete Fachlogik patchen. Vor einem Core-Änderungswunsch ist der Referenzablauf aus Manifest, Browserentry, `module.php`, generischem `/api/v1/modules/<id>/…`-Dispatch, Modulmigrationen, Permissionregistry, Adminsettings und Lifecycle vollständig auszuschöpfen. Nur eine mit einem neutralen Contract-Test belegte allgemeine Frameworklücke rechtfertigt einen kleinen Core-Extension-Point; andernfalls bleibt die Änderung im Modul.

## Entitlement projection contract

A module may receive a server-authoritative entitlement projection of `available`, `locked`, or `hidden`. `locked` may be rendered with a generic required-entitlement notice; `hidden` is not rendered. Neither client state grants permissions. Package names remain configuration, never Core constants. Product modules must continue to use server permission checks and may not inspect organization names or commercial tiers in Core code.

## Media and location reuse

Modules use the published permission/API contracts for media and the GPS module's coordinate output. They must not bypass controlled media delivery, infer organization scope client-side, or duplicate the Web-Mercator projection with swapped latitude/longitude.

## Module category and role navigation

`category` accepts `user` or `system` and defaults to `user`; it does not alter lifecycle, permissions, visibility, activation or dependencies. Admin groups modules by this declaration. Per-role navigation visibility is a separate persisted presentation decision for Admin, Developer, User and Viewer. It may hide/show a navigation entry but never authorizes a route. `presentation.userNavigation` remains the default until a role override is stored.

## Pre-freeze clarification: optional module Self-Test and Field Notes proof (2026-09-11)

`standalone` is an optional object. When present, `entry` must be a relative, module-local `.html` path without absolute paths, traversal, backslashes or duplicate separators. `label` and `description` are display metadata; `requires.server`, `requires.database` and `requires.auth` truthfully disclose prerequisites. Invalid declarations fail manifest validation. Admin displays the action only for a valid declared entry. The page remains module-owned, may not bypass permissions, expose secrets or perform destructive production work, and proves only that isolated page—not lifecycle, API, database, permission, integration, backup or live operation. GPS is the current bundled example; modules without a meaningful isolated browser path declare no Self-Test.

`field-notes` is now the no-Core-change proof module. It declares category `user`, no dependencies, `field-notes.view`/`field-notes.use`, owner-scoped generic module routes, a retained `field_notes_items` table/migration and an item limit. Its implementation required only new files below `Web-App/app/modules/field-notes/` and `Server/php/modules/field-notes/`; discovery, loading, navigation/visibility, authorization/CSRF, migrations and Backup V2 use existing generic contracts. Its production/operator lifecycle and UI remain `OPERATOR RETEST REQUIRED`; this code proof does not itself declare Core Freeze.

## Install compensation contract

Registration synchronizes declared permissions automatically. If server-entry resolution or migration then fails, the generic lifecycle marks the module not present, disabled and error while retaining owned data; a retry runs the existing checksum/additive migration machinery. Admin `App Modules`/`System Modules` routes are category filters only and impose no module dependency.

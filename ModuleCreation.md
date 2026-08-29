# NEUTRAL – Verbindliche Anleitung zur Modulerstellung

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
| INSTALL/REGISTER | Manifest/Permissions registrieren; Settingsdefaults vorbereiten; bleibt inaktiv |
| INACTIVE | keine Watcher oder fachliche Hintergrundarbeit |
| ACTIVATE/ACTIVE | Dependencies/Rechte prüfen, Listener und UI kontrolliert starten |
| DEACTIVATE | Watcher, Timer, Listener und Ressourcen freigeben; Daten erhalten |
| UPDATE | **TEILWEISE** im Clientframework; serverseitiger allgemeiner Modulupdatevertrag fehlt |
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

## 9. Capabilities

`capabilities` sind aktuell deklarative Metadaten. Sie dürfen zur Erkennung genutzt werden, sind aber kein Rechteersatz und kein automatischer Servicevertrag. Semantische Versionierung/Capability-Aushandlung ist **FEHLT/GEPLANT**.

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

Eigene Services werden mit einem Namen wie `module.<id>.<service>` als öffentlich oder intern registriert. Doppelte Namen werden abgelehnt; Deaktivierung/Deinstallation ruft `unregister` auf, das optional `dispose()` ausführt. Fremde Services nur über deren öffentliche Methoden verwenden. Serviceabhängigkeiten gehören ins Manifest bzw. müssen vor Aktivierung geprüft werden. Ein formales Service-Manifest ist **FEHLT**.

## 14. Storage und lokale Datenbank

- Keys über `CoreStorage.namespace("module:<id>")` immer mit Modul-ID namespacen.
- Kein Passwort oder Server-Sessiongeheimnis lokal speichern.
- localStorage nur für kleine, unkritische Werte.
- IndexedDB für strukturierte/offlinefähige Daten.
- Datenmodell, Version und Migration dokumentieren.
- Deinstallation löscht lokale Daten nur nach expliziter Nutzer-/Vertragsentscheidung.

Eigene dynamische IndexedDB-Stores pro Modul sind derzeit nicht als stabiler öffentlicher Migrationsvertrag implementiert (**FEHLT/GEPLANT**). Bis dahin vorhandene gemeinsame Stores nur kontrolliert und namespaced verwenden.

## 15. Serverdatenbank und Migrationen

Das Manifest kann `database.tables` deklarieren. Aktuell dient dies insbesondere sicherer Eigentums-/Deinstallationsprüfung. Ein Modul darf nur eigene Tabellen deklarieren. Drop bei Uninstall ist nur zulässig, wenn der Manifestvertrag dies ausdrücklich als sicher markiert und der Server es validiert.

Allgemeine modul-eigene SQL-Migrationen, Rollback und Updateausführung sind **TEILWEISE/GEPLANT**. Keine SQL-Datei wird allein durch Ablage automatisch vertrauenswürdig oder ausgeführt.

## 16. API und Serverkommunikation

Module verwenden dokumentierte HTTPS-Endpunkte über `ApiClient`. Es gibt derzeit keine öffentliche API, mit der ein Modul selbstständig PHP-Routen registriert (**FEHLT**). Neue Serverendpunkte erfordern eine separate Core/API-Änderung mit Auth, Permission, CSRF, Validierung, Datenbankvertrag, Tests sowie Aktualisierung von `API.md` und `Security.md`.

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

## 20. Test- und Abnahmeregel

Mindestens prüfen:

1. Manifestvalidierung und Discovery ohne Aktivierung.
2. fehlende Dependency verhindert Aktivierung.
3. Install bleibt inaktiv.
4. Aktivierung registriert Ressourcen genau einmal.
5. Deaktivierung entfernt Watcher/Listener.
6. Uninstall entfernt Registration/Permissions/Settings ohne fremde Daten.
7. serverseitige Actions prüfen Session, Permission und CSRF.
8. Offline-/Fehlerzustände verlieren keine lokalen Daten.
9. Standalone-Test ist nur Entwicklungsoberfläche und keine zweite Produktionsautorität.
10. `TODO.md`, `WORKFLOW.md`, `Functions.md`, `API.md`, `Database.md` und `Security.md` werden bei Vertragsänderung aktualisiert.

### Startperformance für Module

Discovery erfolgt ausschließlich einmal in `CoreStartup.startBackground()`. Ein Modul startet bei Discovery keine Geräteabfrage, Netzwerkoperation oder Aktivierung. Installation bleibt inaktiv; teure Ressourcen beginnen erst bei expliziter Aktivierung und werden bei Deaktivierung freigegeben. Module dürfen keinen zweiten Katalogscan aus UI-Code anstoßen.

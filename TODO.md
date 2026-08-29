# NEUTRAL – TODO

Stand: 2026-08-29. Diese Liste bildet die tatsächliche weitere Entwicklungsreihenfolge ab. Erledigt wird nur markiert, was durch aktuellen Code, Dokumentation oder Tests nachgewiesen ist.

## P1 – Dokumentation und Architektur

- [x] `VISION.md` als widerspruchsfreie langfristige Zielarchitektur für NEUTRAL neu aufbauen.
- [x] Ist- und Zielarchitektur in `Architecture.md` trennen und mit IST/GEPLANT/FEHLT kennzeichnen.
- [x] tatsächliche Core-Funktionen, APIs, Datenhaltung und Sicherheit dokumentieren.
- [x] getrennte Installationsanleitungen für Web-App und PHP-Server erstellen.
- [x] verbindlichen aktuellen Modulerstellungsvertrag dokumentieren.
- [x] Workflow auf Arbeitsregeln und vollständiges Arbeitsprotokoll bereinigen.
- [x] Laufzeit vollständig in die zwei Hauptordner `Web-App/` und `Server/` migrieren und parallele Root-Laufzeitstrukturen entfernen.
- [x] veraltete Diagnose-/Setup-Seiten, Platzhalter, doppelte Konfiguration, erzeugte Runtimeartefakte und ungenutzte Hilfsskripte evidenzbasiert entfernen.
- [ ] Dokumentation bei jeder Vertragsänderung zusammen mit Code und Tests fortschreiben.
- [x] GitHub-FTPS-Workflow auf die Produktionsquellen `Web-App/`, `Server/php/` und `Server/public/` umstellen.

### P1.1 – Neuinstallation auf leerem Shared Hosting

- [x] öffentliches Root-Routing für `/api`, `/admin.php`, `/setup.php` und die Web-App bereitstellen sowie PHP-Core, Runtime, Dotfiles und Verzeichnislisten sperren.
- [x] Setupoberfläche auf denselben Projektroot wie API, Migrationen, Runtime und Modul-Discovery ausrichten.
- [x] Erstinstallation einer noch nicht vorhandenen Datenbank ermöglichen: Voraussetzungstest prüft den MySQL-Server, die Installationsroutine legt danach das konfigurierte Schema an und migriert es.
- [x] manuelles und GitHub-FTPS-Staging um die Root-`.htaccess` ergänzen, Node konsequent ausschließen und Zertifikatsprüfung aktivieren.
- [x] cPanel-Preflight von Node-Runtimevariablen entkoppeln; Produktion benötigt nur PHP-/DB- und Deploymentkonfiguration.
- [x] Installationsanleitungen und Architektur-/API-/DB-/Security-Dokumentation gegen den korrigierten Produktionsumfang abgleichen.
- [ ] **LIVE:** FTPS-Anmeldung, Zielverzeichnis sowie Lese-/Schreibrecht mit den GitHub-Secrets prüfen.
- [ ] **LIVE:** LiteSpeed-/Apache-Verarbeitung der Root-`.htaccess` und die öffentlichen Pfade `/`, `/api/status`, `/setup.php`, `/admin.php` prüfen.
- [ ] **LIVE:** PHP 8.x, `json`, `pdo`, `pdo_mysql`, Session und OpenSSL im Hosting prüfen.
- [ ] **LIVE:** leeres MariaDB-/MySQL-Schema anlegen bzw. Erstellungsrecht prüfen und Setup/Migration einmalig ausführen.
- [ ] **LIVE:** HTTPS, Zertifikatskette, Secure-/HttpOnly-/SameSite-Cookies und CSRF im echten Origin prüfen.
- [ ] **LIVE:** Web-App-Assets, GPS-Manifest, Same-Origin-API und geschützte Adminoberfläche im Browser prüfen.

## P2 – Core

### P2.1 – Vertragsinventar und öffentliche Facade

- [x] **Aufgabe:** versionierten Core-Vertragskatalog für öffentliche Facaden, Events und Services bereitstellen; private Implementierungsobjekte ausdrücklich abgrenzen. **Zweck:** Module erhalten eine prüfbare, fachfreie API statt impliziter `window.*`-Annahmen. **Bereiche:** `Web-App/core/core.js`, neuer Vertragskatalog, Ladefolge, `Functions.md`, `Architecture.md`, `ModuleCreation.md`. **Abhängigkeiten:** bestehende globale APIs bleiben kompatibel. **Status:** ERLEDIGT. **Tests:** Vertragsversion, unveränderliche Kataloge, öffentliche Facaden und unbekannte Verträge.

### P2.2 – Event- und Serviceverträge

- [x] **Aufgabe:** Eventnamen/Payload-Grundregeln sowie Service-Namensraum, Sichtbarkeit und Lifecycle im Core erzwingen und dokumentieren. **Zweck:** vorhersehbare Modulkommunikation und klare öffentliche/private Services. **Bereiche:** `core-event-bus.js`, `core-event-ring.js`, `service-manager.js`. **Abhängigkeiten:** P2.1-Katalog; bestehende Event-/Servicenamen dürfen nicht brechen. **Status:** ERLEDIGT. **Tests:** Subscribe/Unsubscribe, Handlerisolation, Eventhistorie, Service-Duplikate, Sichtbarkeit und Cleanup.

### P2.3 – Online-/Offline-Grundlage

- [x] **Aufgabe:** `CoreNetwork` idempotent initialisierbar und wieder sauber freigebbar machen, unveränderliche Statussnapshots und genau ein `network:changed` je Zustandswechsel garantieren. **Zweck:** stabile fachfreie Grundlage für P6 ohne Syncbehauptung. **Bereiche:** `core-network.js`, Startup/Shutdown. **Abhängigkeiten:** Eventvertrag aus P2.2. **Status:** ERLEDIGT. **Tests:** initial/online/offline, doppelte Initialisierung, Subscribe/Unsubscribe, Dispose/Re-init.

### P2.4 – Storage- und Konfigurationsgrenzen

- [x] **Aufgabe:** Verantwortlichkeiten von `CoreStorage`, `StorageManager`, `DatabaseManager`, Cache und Konfiguration eindeutig festlegen; sichere Namespaces und kompatible Schema-Upgrades testen. **Zweck:** widersprüchliche Speicherwege vermeiden, ohne vorhandene Daten zu brechen. **Bereiche:** Storage-/DB-/Config-Core und `Database.md`. **Abhängigkeiten:** vorhandene Keys und IndexedDB-Version bleiben kompatibel. **Status:** ERLEDIGT. **Tests:** Namespaces, JSON-/Quotafehler, Adaptervertrag, bestehende/fehlende Stores beim Upgrade, Konfigurationsisolation und Secret-Ausschluss.

### P2.5 – Fehlerbehandlung und Logging

- [x] **Aufgabe:** Fehlerklassifikation, sichere Kontextbereinigung und einheitlichen Event-/Ring-/Logpfad herstellen. **Zweck:** diagnostizierbare, abfangbare Fehler ohne Secrets oder unnötige personenbezogene Daten. **Bereiche:** `core-error-handler.js`, `error-log.js`, EventRing, `Security.md`. **Abhängigkeiten:** P2.2-Eventvertrag. **Status:** ERLEDIGT. **Tests:** Klassifikation, Redaction, begrenzte Historie, Handlerfehler ohne Rekursion.

### P2.6 – Modulvertrag und globale Kopplung

- [x] **Aufgabe:** Modul-Lifecycle gegen `DISCOVER → INSTALL/INACTIVE → ACTIVATE/ACTIVE → DEACTIVATE → UPDATE → UNINSTALL` regressionsprüfen und Module auf die öffentliche Core-Facade verweisen; verbleibende globale Kompatibilitätsschicht dokumentieren. **Zweck:** generischer Vertrag ohne GPS-Sonderlogik oder Breaking Change. **Bereiche:** Modulruntime, GPS-Referenztest, `ModuleCreation.md`. **Abhängigkeiten:** P2.1–P2.5. **Status:** ERLEDIGT. **Tests:** kompletter Lifecycle, Installation bleibt inaktiv, Cleanup, Dependencyfehler, keine GPS-Verzweigung im Core.

## P3 – Startperformance

### P3.1 – Messung, statische Shell und Asset-Ladepfad

- [x] **Aufgabe:** datensparsame Startmesspunkte und sofort sichtbare Lade-/Offline-Shell einführen; klassische Skripte geordnet mit `defer` laden. **Technische Ursache:** 36 synchrone User-Skripte bzw. 46 Admin-Skripte stehen vor der initialen UI-Initialisierung; der Main-Bereich ist im HTML leer und es fehlen vergleichbare Phasenmarken. **Bereiche:** User-/Admin-HTML, neuer Performance-Core, CSS, Tests. **Abhängigkeiten:** bestehende globale Ladefolge muss erhalten bleiben. **Abnahme:** HTML enthält sichtbaren Status ohne JavaScript; alle externen Startscripte sind defer; Navigation, DOM, Shell, Minimal-Core und UI-Interaktivität werden ohne Nutzdaten markiert. **Status:** ERLEDIGT.

### P3.2 – Minimaler Core und nicht blockierende Hintergrundphasen

- [x] **Aufgabe:** CoreStartup in minimale synchrone Bereitschaft und beobachtbare Hintergrundphasen für Storage, Auth-Basis und Discovery trennen. **Technische Ursache:** `CoreStartup.start()` wartet seriell auf IndexedDB und Modul-Discovery, bevor `core:started` zurückkehrt. **Bereiche:** `core-startup.js`, `user-app.js`, Lifecycle/Performance, Tests. **Abhängigkeiten:** P2-Verträge; Funktionen mit DB-Bedarf warten gezielt auf Storage-Ready. **Abnahme:** Shell/UI werden vor `DatabaseManager.init()` und `discoverModules()` markiert; genau eine Hintergrund-Promise; Phasenfehler lassen die Shell bedienbar. **Status:** ERLEDIGT.

### P3.3 – Auth/API-Timeout und unmittelbarer Übergang

- [x] **Aufgabe:** Sessionprüfung im Hintergrund mit kontrolliertem Timeout ausführen und Login-Erfolg sofort als Übergangszustand darstellen. **Technische Ursache:** `ApiClient` besitzt keinen Abort-Timeout; Admin wartet seriell auf Startup, `auth/me` und Views, Login wartet nach erfolgreichem Login nochmals auf `me`. **Bereiche:** `api-client.js`, User-/Admin-Authstatus, `master-ui.js`, Tests, API-/Security-Doku. **Abhängigkeiten:** serverseitige Session bleibt Autorität; kein Cache als Rechteentscheidung. **Abnahme:** Fetch endet kontrolliert; Shell bleibt bei Offline/Timeout sichtbar; erfolgreicher Login zeigt sofort „Session wird geöffnet“ und verwendet die Loginidentität, zusätzliche `me`-Validierung läuft nur wo erforderlich. **Status:** ERLEDIGT.

### P3.4 – Einmalige Discovery und Admin-Initialisierung

- [x] **Aufgabe:** doppelte Admin-Discovery, 500-ms-Fallbackdelay und Auth-Polling beseitigen; unabhängige Adminansichten erst nach sichtbarer Shell laden. **Technische Ursache:** `CoreStartup` entdeckt Module und `master-ui.ensureRuntime()` entdeckt erneut; `admin-init.js` pollt Globals und verzögert bei bereits fertigem DOM pauschal. **Bereiche:** `master-ui.js`, `admin-init.js`, Admin-Ladevertrag, Tests. **Abhängigkeiten:** P3.2-Hintergrundpromise und Modul-Lifecycle. **Abnahme:** pro Start genau ein Discovery-Aufruf; kein Intervall/pauschaler 500-ms-Startdelay; geschützte Shell/Status sofort, Routerdaten parallel nach bestätigter Session. **Status:** ERLEDIGT.

### Reale Geräteabnahme (P8)

- [ ] Safari/WebKit auf einem repräsentativen iPhone/iPad: First Paint, Interaktionsbereitschaft und Storage-Migration mit Performanceprofil messen.
- [ ] Chromium/Android WebView auf einem repräsentativen schwächeren Androidgerät: First Paint, CPU-/Netzwerkdrosselung und Offline-Start messen.

## P4 – Web-App / Server / API

- [ ] PHP-Produktionsvertrag und Node-Testvertrag endpointweise abgleichen; Abweichungen bewusst dokumentieren oder schließen.
- [ ] API-Versionierungsstrategie definieren.
- [ ] zentralen API-Timeout und sichere Retryregeln (nur idempotent bzw. mit Idempotenzschlüssel) implementieren.
- [x] zentrale konfigurierbare API-Basis im `ApiClient` und portable Zwei-Ordner-Pfade automatisiert testen.
- [ ] verbleibende direkte UI-Fetches vollständig über den zentralen Transportservice führen.

## P5 – Authentifizierung

- [ ] PHP-Login-Drosselung/Missbrauchsschutz implementieren und testen.
- [ ] produktive Cookieflags (`Secure`, `HttpOnly`, `SameSite`) unter HTTPS automatisiert verifizieren.
- [ ] entscheiden, ob Remember/Refresh benötigt wird; nur dann Rotations-/Widerrufsvertrag entwerfen.
- [ ] lokale Auth-Hilfen klar vom produktiven Serververtrauen isolieren.

## P6 – Offline-First / Synchronisation

- [ ] persistente Sync-Queue mit Änderungsstatus, Idempotenz, Retry/Backoff und Wiederanlauf implementieren.
- [ ] Daten-/Schema-Versionierung sowie Tombstones/Löschung definieren.
- [ ] Konflikterkennung, Konfliktstrategien und Benutzerauflösung dokumentieren und testen.
- [ ] Clientmigrationen, Cacheinvalidierung und Datenschutz für lokale Daten umsetzen.

## P7 – GPS

- [ ] GPS ausschließlich als technische Referenzerweiterung gegen Berechtigungen, Lifecycle, Storage und Offlinezustände validieren.
- [ ] Geräteberechtigungswechsel und Geolocationfehler auf realen Mobilgeräten testen.
- [ ] erst nach allgemeinem Syncvertrag GPS-Synchronisation/API/DB anbinden; keine GPS-Fachlogik in den Core verschieben.

## P8 – Mobile-Kompatibilität

- [ ] unterstützte Android-/iOS-/iPadOS-/Tablet-Browsermatrix festlegen.
- [ ] Touch, responsive Layouts, Storagegrenzen, Offlinewechsel und Hintergrundverhalten auf älteren sinnvoll verbreiteten Geräten testen.
- [ ] Accessibility- und Performancekriterien in die Abnahme aufnehmen.

## P9 – Serverwechsel / Skalierung

- [ ] Konfiguration und Adapter für API, Datenbank, Storage und Provider auf Hostkopplung prüfen.
- [ ] dokumentierten Backup-/Restore-, Umzugs- und Rollbacktest in einer disponiblen Umgebung durchführen.
- [ ] Skalierung erst anhand gemessener Anforderungen planen; Shared Hosting bleibt erste Produktionsbasis ohne Node-Dauerprozess.

## P10 – Erweiterungs-/Modularchitektur

- [ ] Manifest-, Capability-, Event- und Serviceverträge formal versionieren.
- [ ] allgemeinen sicheren Modulupdate-/Migrationspfad mit Rollback umsetzen.
- [ ] Modul-API-/Hook-Erweiterungspunkte entwerfen, ohne direkten Eingriff in den zentralen Router.
- [ ] Lifecycle, Permissions, Settings und Uninstall mit einer weiteren realen Erweiterung validieren, sobald eine fachlich erforderliche Erweiterung vorliegt.
- [ ] Modul-Isolation und Fehlerbegrenzung schrittweise verbessern.

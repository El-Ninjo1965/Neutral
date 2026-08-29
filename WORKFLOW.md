# NEUTRAL – Workflow

## 1. Zweck

Dieses Dokument enthält verbindliche Arbeitsregeln und ein fortlaufendes Arbeitsprotokoll. Zielarchitektur steht in `VISION.md`; tatsächliche technische Verträge stehen in den jeweiligen Fachdokumenten. Historische Bugs und abgeschlossene Live-Diagnosen gehören nicht in die Arbeitsregeln.

## 2. Projektgrenzen

- Projektname und Produktidentität sind ausschließlich **NEUTRAL**.
- NEUTRAL ist ein neutrales Entwicklungsframework, keine konkrete Fachanwendung.
- Web-App und Server bleiben getrennte Hauptkomponenten; Kommunikation erfolgt über dokumentierte HTTPS/API-Verträge.
- Core nicht für einzelne Features umbauen. Universelle Erweiterungspunkte werden nur evidenzbasiert und dokumentiert ergänzt.
- Shared Hosting mit PHP 8.x und MariaDB/MySQL ist die erste Produktionsbasis. Node.js darf Entwicklung und Tests unterstützen, ist aber keine Produktionsvoraussetzung.
- GPS ist technische Referenzerweiterung, keine Core- oder Produktidentität.

## 3. Verbindliche Vorbereitung vor jeder Änderung

In dieser Reihenfolge vollständig lesen bzw. prüfen:

1. `VISION.md`
2. `WORKFLOW.md`
3. `TODO.md`
4. relevante technische Dokumentation (`Architecture.md`, `Functions.md`, `API.md`, `Database.md`, `Security.md`, Installations- oder Moduldokumentation)
5. tatsächlichen aktuellen Code, Tests, Git-Status und betroffene Konfiguration

Keine alte Annahme, Dokumentationsaussage oder frühere Diagnose ungeprüft übernehmen. Ist Dokumentation und Code widersprüchlich, wird der Ist-Zustand im Code ermittelt und die Abweichung dokumentiert; Zielentscheidungen folgen `VISION.md`.

## 4. Änderungsregeln

- Änderung minimal, überprüfbar und auf den Auftrag begrenzen.
- Keine neuen Features, Module oder Refactorings ohne konkreten Auftrag.
- Keine Secrets, `.env`-Werte, Tokens, Sessions, Live-Identitäten, Logs mit Geheimnissen oder `node_modules` committen.
- Keine produktiven Hostnamen, Ports oder Dateipfade als universelle Coreannahme fest verdrahten.
- Keine Browserrolle als Ersatz für serverseitige Session-/Permissionprüfung verwenden.
- Keine Modul-Discovery mit Installation oder Aktivierung gleichsetzen.
- Keine fremden Modul- oder privaten Coredateien aus einem Fachmodul verändern.
- Status ehrlich als IST/VORHANDEN, TEILWEISE, GEPLANT oder FEHLT kennzeichnen.

## 5. Abschluss jeder Änderung

In dieser Reihenfolge:

1. kleinste relevante Tests und erforderliche Gesamttests ausführen
2. Ergebnisse und Seiteneffekte prüfen
3. `TODO.md` auf den nachgewiesenen Stand bringen
4. dieses Arbeitsprotokoll vollständig ergänzen
5. betroffene technische Dokumentation aktualisieren und auf Widersprüche prüfen
6. Git-Diff und Secret-/Artefaktgrenzen prüfen
7. alle vorgesehenen Änderungen committen
8. nach GitHub `main` pushen, sofern der Auftrag dies ausdrücklich vorsieht
9. GitHub `main` direkt verifizieren
10. `git fetch origin`, lokalen `main` mit `origin/main` vergleichen und sauberen Arbeitsbaum prüfen

Eine Aufgabe gilt erst als abgeschlossen, wenn der vorgesehene Commit auf GitHub vorhanden ist und die Abschlussprüfung bestanden wurde.

## 6. Tests und Validierung

- Dokumentationsänderungen: Dateiinventar, Links/Pfade, Statusaussagen, verbotene Altbegriffe und Widersprüche prüfen; bestehende automatisierte Tests ausführen, wenn technische Verträge beschrieben werden.
- Auth/API/DB: positive und negative Fälle, Auth, Rechte, CSRF, Validierung, Fehlercodes und Persistenz prüfen.
- Module: Discovery, Install/inaktiv, Activate, Deactivate, Uninstall, Dependencies, Permissions, Settings und Cleanup prüfen.
- UI/Performance: realen Browser bzw. geeignetes Gerät nutzen; browserlose Tests niemals als visuellen oder realen GPS-Test ausgeben.
- Deployment: Staging-/Allowlist prüfen; Web-App und Server getrennt behandeln; Secrets nicht ausgeben.

Fehlgeschlagene Tests werden nicht verschwiegen. Testbedingte Runtimeänderungen werden nur dann zurückgesetzt, wenn sie nachweislich erst durch den Test entstanden sind.

## 7. Git- und GitHub-Regeln

- Vor Arbeit `git fetch origin` und Branch/Status/Divergenz prüfen.
- Lokale Arbeit nie durch Hard Reset, Force Push oder ungeprüftes Überschreiben verlieren.
- Normalerweise Featurebranch und Pull Request verwenden. Ein direkter Push nach `main` erfolgt nur bei ausdrücklichem Auftrag und nach bestandenen Prüfungen.
- Commitnachrichten beschreiben den tatsächlichen Inhalt.
- Nach Push GitHub per API/Remoteinhalt prüfen; ein lokaler Commit allein schließt die Aufgabe nicht ab.

## 8. Sicherheits- und Betriebsregeln

- Hostlokale `.env`- und Deploymentdateien bleiben ignoriert und außerhalb der Dokumentation.
- Produktions-Web-App enthält keine DB-/FTP-/Adminsecrets.
- PHP-Server ist Vertrauensgrenze für Auth, Rechte, CSRF und Datenbank.
- HTTPS ist Pflicht. Schreibrechte werden minimal vergeben; kein pauschales `777`.
- Node-Port 3000, Passenger, SSH oder ein Node-Dauerprozess dürfen nicht als Shared-Hosting-Voraussetzung angenommen werden.

## 9. Dokumentationspflege

- `VISION.md`: nur langfristige Zielarchitektur, keine Chronik oder Livefehler.
- `Architecture.md`: IST und Ziel getrennt.
- `Functions.md`: nur nachweisbare Funktionen, fehlende Ziele ausdrücklich markieren.
- `API.md`: nur implementierte Endpunkte; Auth, Request, Response, Fehler und DB-Bezug.
- `Database.md`: keine erfundenen Stores/Tabellen.
- `Security.md`: Schutzstatus ehrlich kennzeichnen.
- Installationsanleitungen: reproduzierbare Schritte ohne echte Secrets.
- `ModuleCreation.md`: verbindlicher aktueller Erweiterungsvertrag.
- `TODO.md`: nur tatsächliche Reihenfolge und nicht nachweislich erledigte Arbeit offen lassen.

## 10. Fortlaufendes Arbeitsprotokoll

### 2026-08-29 – Dokumentationsgrundlage vollständig neu aufbauen

- **Aufgabe:** Ausstehenden Dokumentationsauftrag nachholen, die Vision vollständig bereinigen und alle geforderten technischen Dokumente aus dem aktuellen Code ableiten.
- **Betroffene Dateien:** `VISION.md`, `WORKFLOW.md`, `TODO.md`, `Architecture.md`, `Functions.md`, `API.md`, `Database.md`, `Security.md`, `Install-README-Web-App.md`, `Install-README-Server.md`, `ModuleCreation.md`.
- **Änderung:** `VISION.md` vollständig durch eine fachfreie Zwei-Komponenten-Zielarchitektur ersetzt; Offline-First, Mobile-First, Startperformance, Shared-Hosting-Portabilität und GPS als reine Referenzerweiterung festgelegt. Workflow und TODO bereinigt. Acht fehlende Fachdokumente anhand von Browser-Core, PHP-Core, Node-Testserver, API-Router, Schema und GPS-Manifest erstellt.
- **Zweck:** widerspruchsfreie, überprüfbare Grundlage für weitere Coding-Agenten schaffen, ohne fehlende Features oder Datenstrukturen zu erfinden.
- **Tests/Validierung:** vollständiger Dokumentationsbestand; Quellcode-/Routen-/Schema-/Manifestanalyse; Suche nach unerwünschten Fachproduktbegriffen, historischen Hostpfaden und falschen Node-Produktionsannahmen; `npm test`; Git-Diff-/Status- und GitHub-Dateiprüfung.
- **Ergebnis:** alle elf geforderten Dokumentationsdateien erstellt bzw. aktualisiert; Ist-, Ziel- und Fehlstatus getrennt; keine Feature- oder Modulimplementierung verändert.
- **Offene Punkte:** die priorisierten Implementierungslücken stehen in `TODO.md`, insbesondere Sync/Offline, Startperformance, API-Verträge, PHP-Login-Schutz und formale Modulverträge.
- **Commit:** `0fe9aa24e6b5c1c823d8915028938bbe5cc4a34c`.

### 2026-08-29 – Laufzeit auf Web-App und Server konsolidieren

- **Aufgabe:** Die parallelen historischen Laufzeitordner in eine verbindliche Zwei-Ordner-Architektur migrieren, Pfade korrigieren, Startblockaden reduzieren und nachweislich obsolete Dateien entfernen.
- **Struktur vorher:** Laufzeitcode lag parallel in `app/`, `apps/`, `core/`, `platform/`, `webroot/`, `server/` und `config/`; Browser- und Serverdateien waren im alten Webroot gemischt, erzeugte Runtimezustände waren versioniert.
- **Struktur nachher:** Browserlaufzeit ausschließlich unter `Web-App/` (`core/`, `public/`, `app/`, `apps/`); serverseitiger PHP-Core, öffentliche PHP-Entrypoints und Node-Testadapter ausschließlich unter `Server/` (`php/`, `public/`, `node/`). Im Root bleiben Dokumentation, GitHub-, Test-, Build- und notwendige Werkzeugsdateien.
- **Verschobene Bereiche:** Client-Core nach `Web-App/core/`; UI/Assets nach `Web-App/public/`; App-Shell, Manifestkatalog und GPS nach `Web-App/app/`; Appmetadaten nach `Web-App/apps/`; PHP-Core nach `Server/php/`; PHP-API/Admin/Setup nach `Server/public/`; Node-Referenzruntime nach `Server/node/`.
- **Gelöschte Altlasten:** öffentliche Diagnose-Einzeldatei, alte Developer-/Admin-Setup-HTML-Seiten, Dev-Parallelentry, App-Platzhalterseite, doppelte Node-Konfiguration, historischer Serverbericht, zwei ungenutzte FTPS-Hilfsskripte, generiertes Deploymanifest und versionierte Runtime-/Testdaten. Die generischen, aber nicht beauftragten Katalog-/Marketplace-Flächen wurden aus Core, Node-Test-API, UI und Tests entfernt.
- **Angepasste Schnittstellen:** zentrale konfigurierbare API-URL-Auflösung im `ApiClient`; fachfreier `CoreNetwork` für Online-/Offline-Zustand; weiterhin ausschließlich HTTPS/JSON zwischen Web-App und Server; GPS bleibt manifestbasiertes einziges Referenzmodul.
- **Angepasste Pfade:** JavaScript-/PHP-Imports, Manifest-Discovery, Node-Adapter, Runtimepfade, HTML-Assets, Tests, package entry, Startskript, Preflight, manuelles Deployment und GitHub-Workflow verwenden ausschließlich `Web-App/` und `Server/`.
- **Startperformance:** Shell wird vor Core-/IndexedDB-/Modulinitialisierung gerendert; Hintergrundstart wird nach dem ersten Render eingeplant; die doppelte Modul-Discovery im User-Start wurde entfernt.
- **Tests:** `npm test` mit 107 bestandenen Tests; zusätzliche Regression prüft Zwei-Ordner-Struktur, UI-vor-Hintergrundstart und genau einen Discovery-Aufruf. PHP-Admin/API-, Auth/CSRF-, Modul-/GPS-, Storage-, Deployment- und Portabilitätstests sind enthalten.
- **Ergebnis:** Zwei-Ordner-Laufzeit hergestellt, alte parallele Runtimeordner entfernt, GPS erhalten, generische Discovery/Installation/Aktivierung/Deaktivierung/Deinstallation weiterhin getestet.
- **Offene Punkte:** direkte UI-Fetches vollständig auf den zentralen Transportservice konsolidieren; Hintergrundphasen messbar machen; produktive Offline-Sync-/Konfliktengine, Geräte-Matrix und PHP-Login-Drosselung bleiben gemäß `TODO.md` offen.
- **Commit-ID:** `cd1d51544f7eb94d9144a3fdf2f448d9952a820a`.

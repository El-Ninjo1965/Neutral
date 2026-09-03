# NEUTRAL – Workflow

**Status:** VERBINDLICHE ARBEITSREGELN

**Geprüft:** 2026-09-03
**Dokumentationsordnung:** [`DOCUMENTATION.md`](DOCUMENTATION.md)

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
- `WORKFLOW.md`: jede materielle Änderung mit Aufgabe, ausführender/dokumentierender Instanz, Nachweisen, Ergebnis und offenen Punkten protokollieren.

## 10. Fortlaufendes Arbeitsprotokoll

Dieser Abschnitt enthält den fortlaufenden detaillierten Arbeitsnachweis. Abgeschlossene Änderungen werden zusätzlich kompakt in [`CHANGELOG.md`](CHANGELOG.md) erfasst; offene Arbeit steht ausschließlich in [`TODO.md`](TODO.md). Jeder neue Eintrag nennt ausdrücklich die ausführende und dokumentierende Instanz.

### 2026-09-03 – Zertifikatsgültigen FTPS-Host rein lesend bestätigen

- **Aufgabe:** Den zum Hostingserver gehörenden zertifikatsgültigen FTPS-Host ermitteln und mit den bereits geschützten GitHub-Zugangsdaten ausschließlich lesend prüfen.
- **Ausgeführt und dokumentiert durch:** **Codex (ChatGPT Work / GitHub-Connector)**.
- **Ermittlung:** `ftp.turbolikes.com` und der Reverse-DNS-Name `server.cpprotect5.de` zeigen auf dieselbe Server-IP; ein öffentlich registriertes Zertifikat existiert für `server.cpprotect5.de`. `localhost` wurde ausgeschlossen, weil es im GitHub-Runner nicht den Hostingserver bezeichnet.
- **Sicherheitsgrenze:** Separater Diagnosebranch `codex/ftps-readonly-diagnostic`; explizites FTPS auf Port 21 mit Zertifikats- und Hostnamenprüfung. Das Passwort wurde ausschließlich aus dem vorhandenen GitHub-Secret per stdin an lftp übergeben. Erlaubt waren nur `pwd` und `cls`; Upload-, Lösch- und Änderungsbefehle waren durch einen vorab rot/grün geprüften statischen Test ausgeschlossen.
- **Nachweis:** Läufe `33800561888` und `33800747981` bestanden. Server erreichbar, TLS erfolgreich, Authentifizierung akzeptiert, virtueller Startpfad `/` lesbar. 64 Einträge waren sichtbar; `.htaccess` vorhanden, `Web-App/` und `Server/` nicht vorhanden.
- **Ergebnis:** `server.cpprotect5.de` ist für diesen Zugang der funktionierende explizite FTPS-Hostname. Der sichtbare Root entspricht plausibel dem bisherigen `public_html`, enthält aber noch nicht die neue portable Full-Stack-Verzeichnisstruktur. Es wurde nichts hochgeladen, verändert oder gelöscht und kein Secret ausgegeben.
- **Offen:** Produktiven Workflow auf den zertifikatsgültigen Host umstellen und das verifizierte Paket erst danach kontrolliert in das ausdrücklich konfigurierte Ziel deployen; anschließend Remoteinventar und HTTP-Smokes prüfen.

### 2026-09-03 – Portable Basis nach GitHub `main` integrieren

- **Aufgabe:** Den lokal geprüften Portabilitätsstand in das verbindliche Repository übernehmen und die ausgelösten GitHub-Prüfungen wahrheitsgemäß bewerten.
- **Ausgeführt und dokumentiert durch:** **Codex (ChatGPT Work / GitHub-Connector)**.
- **GitHub:** Der Connector bestätigte Konto `El-Ninjo1965`, Repository `El-Ninjo1965/Neutral` und Pushberechtigung. Da der lokale HTTPS-Git-Client keine eigene Anmeldung besaß, wurden 59 geänderte Blobs und der vollständige 178-Dateien-Baum über den Connector als Commit `a800c960a7be04c37b09fc8f3bb6eede7517e5a9` fast-forward nach `main` geschrieben. Dokumentations- und zwei test-first Deploymentkorrekturen folgten ebenfalls ausschließlich per Connector; finaler Codecommit ist `6b59ec68f980517fbbd49a5e8604a45b5acc1cdc`.
- **Nachweis:** CodeQL-Läufe `33716219316` und final `33716675598` (`Push on main`) endeten erfolgreich. Der erste FTPS-Lauf deckte eine abschwächende vorhandene Einstellung auf; daraufhin wurde die nicht geheime Hostnamenprüfung im Workflow unveränderlich auf `true` gesetzt. Der zweite Lauf deckte die von dieser lftp-Version nicht unterstützte Schreibweise `-f -` auf; der weiterhin argumentfreie stdin-Aufruf wurde test-first korrigiert. Der finale FTPS-Lauf `33716676051` baute das verifizierte Paket und erreichte den Server, brach jedoch bei der Zertifikatsprüfung ab, weil Zertifikatsname und konfigurierter FTP-Hostname nicht übereinstimmen.
- **Ergebnis:** Finales CodeQL ist bestanden. TLS brach vor Authentifizierung und Upload ab; der portable Stand wurde nicht auf den Server ausgerollt. Es wird kein FTPS-Erfolg behauptet, keine Zertifikatsprüfung abgeschaltet und kein Secret ausgegeben.
- **Offen:** FTP-Hostname beziehungsweise Serverzertifikat in der geschützten Hosting-/Actions-Konfiguration so korrigieren, dass die Identitäten übereinstimmen; erst danach FTPS erneut ausführen und die Live-PHP-/Apache-Smokes aus `TODO.md` durchführen.

### 2026-09-03 – Finale portable Whole-Branch-Reviewkorrektur

- **Aufgabe:** Sämtliche Befunde des abschließenden Whole-Branch-Reviews strikt test-first korrigieren, ohne Server, Datenbank, FTP, GitHub oder andere externe Systeme anzusprechen.
- **Ausgeführt und dokumentiert durch:** **Codex (ChatGPT Work)**.
- **Routing und Basispfad:** Root-Rewrite leitet öffentliche API-Pfade direkt und abschließend an den PHP-Router. Browser und PHP verwenden denselben konfigurierten Basispfad; das Paket injiziert zusätzlich das exakte `<base href>` für Root und Unterpfade. Feste Root-API-Defaults wurden aus den benannten UI-/Core-Konsumenten entfernt, ungültige Basispfade werden ohne Rohwert abgewiesen und Preflight prüft beide Resolver-Einstiege sowie Meta-/`base`-Markierungen.
- **Paket und Secrets:** Manifest-Produzent, Paketformat und `sourceDirty` ergänzen die Metadaten. Ein bestehendes Ziel wird nur nach exakter Allowlist-, Inventar-, Metadaten- und Hashprüfung ersetzt. Paket- und Bootstrap-Scanner erkennen auch verschlüsselte Private-Key-Header und melden ausschließlich `[MASKIERT]`.
- **Deployment:** `FTP_TARGET_DIR` besitzt keinen Default; `/` bleibt nur ausdrücklich erlaubt. Hostnamenprüfung ist zwingend. Der lokale Zustand ist per SHA-256 an Protokoll, Server, Port, Benutzer, Ziel und Paketformat gebunden; Zielwechsel übernehmen keine Löschkandidaten. Der Transfer verwendet kein `--only-newer`, löscht keine historischen HTML-Dateien pauschal und übergibt das lftp-Skript per stdin statt argv. Verbindungswerte erscheinen nicht in der Ausgabe.
- **Nachweis:** Gezielte RED-Runden reproduzierten 11 Routing-/Basispfadfehler, 7 Paket-/Scannerfehler, 7 FTPS-/Manifestfehler und 3 Dokumentationsfehler. Die jeweiligen fokussierten Läufe wurden GREEN. Die breite PHP-ausgeschlossene Suite erfasste abschließend 241 Tests: 239 bestanden, zwei erwartete PHP-Skips, 0 Fehler.
- **Ergebnis und Grenzen:** Alle Befunde sind lokal umgesetzt. PHP-Prozesstests konnten mangels PHP-Binary nur als erwartete Skips laufen; Apache-/PHP-/Datenbank-/Live-, CodeQL- und FTPS-Nachweise bleiben extern offen.

### 2026-09-03 – Portable Installationsbasis lokal abschließen

- **Aufgabe:** Die freigegebene portable Installationsspezifikation test-first bis zum paketbasierten Preflight und zur wahrheitsgemäßen Dokumentation abschließen, ohne externe Systeme anzusprechen.
- **Ausgeführt und dokumentiert durch:** **Codex (ChatGPT Work / GitHub-Connector)**.
- **Änderung:** Der gemeinsame `portable-install`-Kern verifiziert bestehende Pakete über Manifest, exaktes Inventar, Größen, SHA-256 und Allowlist und scannt denselben Bestand mit maskierten Secretregeln. `cpanel-preflight.js` akzeptiert Paket, öffentliche HTTPS-Basis und optionalen Basispfad, prüft die Pflicht-Einstiege und verwendet ausschließlich `PASS`, `BLOCKED` und `NICHT_GEPRUEFT`.
- **URL-/Sicherheitsgrenze:** Erlaubt sind nur rohe, whitespacefreie URLs, die case-insensitiv mit `https://` und einer nichtleeren Authority beginnen und am exakten Domain-Root oder normalisierten Basispfad mit optional einem abschließenden Slash enden. Erst nach dieser lexikalischen Grenze folgen WHATWG-Parsing und die Prüfung auf Credentials, Query, Fragment, Prozentkodierung, rohe Punktsegmente, Zusatzpfade, abweichendes Manifest und CLI-Basis. Fehlermeldungen geben keine Argument-/Secretwerte wieder; Scannerbefunde ersetzen den Wert durch `[MASKIERT]`.
- **Nachweis:** Der erste neue Preflight-Lauf war RED mit 21 fehlschlagenden Assertions gegen das alte Environment-/FTPS-CLI. Nach der Minimalimplementierung bestand Paket plus Preflight mit 41/41. Weitere RED-Runden reproduzierten URL-Normalisierung für leere Credentials, `/.`, `/%2e` und führenden Leerraum sowie eine nicht selbsttragende Traversal-/Symlinkgrenze des gemeinsamen Scanners; danach bestand der gezielte Lauf mit 48/48. Die Review-Runde reproduzierte zusätzlich die fehlerhafte Annahme von `https:example.test/meine-app/`; nach der lexikalischen HTTPS-Grenze bestand der um vier Rohformatfälle erweiterte Lauf mit 52/52. Die abschließende PHP-ausgeschlossene Gesamtsuite erfasste danach 216 Tests: 214 bestanden, zwei erwartete PHP-Skips, 0 Fehler.
- **Dokumentation:** Domain-Root, physischer DocumentRoot und URL-Unterpfad, wertfreie Environmentvorlage, Setup-Sperre, Bootstrap, Paketbau, Preflight und HTTP-Smoke-Tests sind getrennt beschrieben. Die Web-App-Anleitung beschreibt nur den Browseranteil desselben verbindlichen Full-Stack-Pakets; die Serveranleitung ergänzt PHP, Datenbank und Setup. Nur lokal belegte Implementierungs-TODOs wurden entfernt.
- **Ergebnis:** Code- und Fixture-Grundlage ist lokal vorhanden. Ein fehlendes lokales PHP und externes Rewrite bleiben `NICHT_GEPRUEFT`; der Gesamtstatus wird dadurch nicht zu `PASS`.
- **Offene Punkte:** PHP-/Apache-Nachweis im Zielhosting, neuer physischer DocumentRoot, echter URL-Unterpfad, leere Datenbank samt Setup/Migration/Betreiber, Login-/Session-/CSRF-/API-/Asset-/SPA-Smoke-Tests, Reproduktion aus neuem Repository sowie CodeQL und FTPS des Abschlusscommits. In diesem Lauf wurden weder Server noch Datenbank, FTP oder GitHub angesprochen.

### 2026-09-02 – Portable Installationsbasis spezifizieren

- **Aufgabe:** Den ersten eigenständig lieferbaren Teil des Core-1.0-Abschlusses so entwerfen, dass derselbe Quellstand im Domain-Root, in einem eigenen physischen Document-Root und unter einem URL-Unterpfad ohne manuelle Codeänderung installierbar wird.
- **Ausgeführt und dokumentiert durch:** **Codex (ChatGPT Work / GitHub-Connector)**.
- **Entscheidung:** Ein zentral normalisierter `NEUTRAL_BASE_PATH` wird von PHP, Admin, Browser-App, API- und Assetauflösung gemeinsam verwendet; das physische FTPS-Ziel bleibt eine davon unabhängige Deployment-Einstellung.
- **Liefergrenzen:** Reproduzierbares Produktionspaket mit Manifest/Prüfsummen, wertfreie Environmentvorlage, neutralisierte FTPS-Beispielwerte, lokaler App-Bootstrap und sicherer Preflight gehören zum Paket. Automatische GitHub-Repository-Erstellung, Modulvertrag, Provider und Backup/Restore gehören nicht dazu.
- **Sicherheitsgrenzen:** Keine Secrets im Browser, Paket, Repository oder Diagnoseausgaben; TLS-Prüfung bleibt standardmäßig aktiv; Build und Preflight brechen bei verbotenen Pfaden, ungültiger Basis oder Secretmustern ab.
- **Nachweis:** Freigegebenes Chat-Architekturdesign wurde in `docs/superpowers/specs/2026-09-02-portable-installation-design.md` vollständig und ohne offene Platzhalter festgeschrieben; Implementierung und Live-Abnahme werden nicht vorweggenommen.
- **Ergebnis:** Die Spezifikation ist bereit für das Betreiberreview und anschließend für einen testgetriebenen Implementierungsplan.
- **Offene Punkte:** alle Implementierungs- und Abnahmeschritte in `TODO.md`; die weiteren Core-1.0-Subsysteme erhalten nach diesem Paket eigene Spezifikationen.

**Fortsetzung am 2026-09-03:** Der Betreiber hat die schriftliche Spezifikation ausdrücklich freigegeben. Codex (ChatGPT Work / GitHub-Connector) hat daraus den test-first Ausführungsplan `docs/superpowers/plans/2026-09-03-portable-installation.md` mit sechs einzeln prüf- und committierbaren Aufgaben abgeleitet. Die Umsetzung darf autonom fortgesetzt werden; Sicherheits- und Nachweisgrenzen der Spezifikation bleiben verbindlich.

### 2026-08-29 – Neuinstallation auf leerem Shared Hosting vorbereiten

- **Aufgabe:** Aktuellen GitHub-main-Stand ohne Live-Deployment vollständig auf Web-App-, PHP-, Datenbank- und FTPS-Neuinstallierbarkeit prüfen.
- **Betroffene Dateien:** Root-`.htaccess`, Setup-/Prerequisite-Code, manuelles Deployment, GitHub-Workflow, Deploymenttest, `TODO.md`, Architektur-, API-, DB-, Security- und Installationsdokumentation.
- **Gefundene Korrekturen:** Im FTPS-Staging fehlte ein öffentlicher Root-Router, obwohl der Browser `/api` und `/Web-App` erwartet; die Setupseite verwendete abweichend den Ordner `Server/` als Projektroot; der DB-Vorabcheck verlangte das Schema vor dessen vorgesehener Erstellung; cPanel-Preflight verlangte produktionsfremde Node-Variablen; FTPS-Zertifikatsprüfung war deaktiviert.
- **Änderung:** Root-Routing und Zugriffsschutz ergänzt, Setup-Projektroot vereinheitlicht, MySQL-Servercheck vor Schemaerstellung getrennt, Produktions-Preflight von Node entkoppelt, beide Stagingwege um `.htaccess` erweitert und Zertifikatsprüfung aktiviert.
- **Tests/Validierung:** vollständige Node-Testsuite, PHP-Syntaxprüfung, Deployment-Dry-Run, Staginginventar/Node-Ausschluss, YAML-Parsing, Secret- und Altpfadsuche sowie Git-Diffprüfung.
- **Ergebnis:** Repositoryseitige Installationsblocker behoben; kein Live-Deploy ausgeführt. Sechs unvermeidbare Live-Hosting-Prüfungen bleiben konkret in `TODO.md` offen.
- **Offene Punkte:** ausschließlich die sechs markierten LIVE-Prüfungen; produktunabhängige spätere Phasen bleiben unverändert.
- **Commit-ID:** wird mit diesem Abschlusscommit nachgetragen.

### 2026-08-29 – P2-Core-Arbeitsplan aus dem Ist-Code ableiten

- **Aufgabe:** Vor Implementierungsänderungen den gesamten Browser-Core und seine Server-/Modulgrenzen prüfen und P2 in einzeln abnehmbare Pakete zerlegen.
- **Betroffene Dateien:** `TODO.md`, `WORKFLOW.md`; analysiert wurden `Web-App/core/`, `Web-App/app/modules/gps/`, `Server/php/`, `Server/node/` und die Coretests.
- **Änderung:** Sechs konkrete Pakete für Vertragsfacade, Events/Services, Netzwerk, Storage/Config, Fehler/Logging sowie Modulvertrag/globale Kopplung mit Zweck, Bereichen, Abhängigkeiten, Status und Tests festgelegt.
- **Zweck:** P2 nachvollziehbar und ohne unkontrollierten Großcommit abarbeiten; öffentliche Kompatibilität und P6-Grenze schützen.
- **Tests/Validierung:** Dateiinventar, Ladefolge, globale Exporte, Eventemittenten, Service-/Storage-/Konfigurationsimplementierungen, Modul-Lifecycle und bestehende Tests statisch geprüft.
- **Ergebnis:** konkrete P2-Arbeitsliste erstellt; noch keine Laufzeitimplementierung verändert.
- **Offene Punkte:** P2.1 bis P2.6 werden in der dokumentierten Reihenfolge umgesetzt.
- **Commit-ID:** `e7ea9142bb8a7c9b75882970d27099886dd1fc85`.

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
- **Angepasste Pfade:** JavaScript-/PHP-Imports, Manifest-Discovery, Node-Adapter, Runtimepfade, HTML-Assets, Tests, package entry, Startskript, Preflight und manuelles Deployment verwenden ausschließlich `Web-App/` und `Server/`. Der GitHub-Workflow wurde in der nachfolgenden Abschlussphase nachgezogen.
- **Startperformance:** Shell wird vor Core-/IndexedDB-/Modulinitialisierung gerendert; Hintergrundstart wird nach dem ersten Render eingeplant; die doppelte Modul-Discovery im User-Start wurde entfernt.
- **Tests:** `npm test` mit 107 bestandenen Tests; zusätzliche Regression prüft Zwei-Ordner-Struktur, UI-vor-Hintergrundstart und genau einen Discovery-Aufruf. PHP-Admin/API-, Auth/CSRF-, Modul-/GPS-, Storage-, Deployment- und Portabilitätstests sind enthalten.
- **Ergebnis:** Zwei-Ordner-Laufzeit hergestellt, alte parallele Runtimeordner entfernt, GPS erhalten, generische Discovery/Installation/Aktivierung/Deaktivierung/Deinstallation weiterhin getestet.
- **Offene Punkte:** direkte UI-Fetches vollständig auf den zentralen Transportservice konsolidieren; Hintergrundphasen messbar machen; produktive Offline-Sync-/Konfliktengine, Geräte-Matrix und PHP-Login-Drosselung bleiben gemäß `TODO.md` offen.
- **Commit-ID:** `cd1d51544f7eb94d9144a3fdf2f448d9952a820a`.

### 2026-08-29 – GitHub-Workflow auf Zwei-Ordner-Struktur abschließen

- **Aufgabe:** Den einzigen verbliebenen Blocker der Strukturmigration beheben und den FTPS-Workflow auf die aktuellen Produktionsquellen umstellen.
- **Betroffene Dateien:** `.github/workflows/ftp-upload.yml`, `tests/admin-api.test.js`, `tests/portability-config.test.js`, `TODO.md`, `WORKFLOW.md`, `Install-README-Server.md`.
- **Änderung:** Workflow-Schreibrecht über einen temporären Branch und einen Workflow-Dateischreibtest verifiziert. Das Produktions-Staging kopiert nun ausschließlich `Web-App/`, `Server/php/` und `Server/public/`; der Node-Testadapter, alte Rootpfade, alte Einzeldatei-Allowlist, obsolete HTML-Cleanup-Kommandos und veraltete Deploy-Ausschlüsse wurden entfernt. Existenzprüfungen sichern Web-App-Einstieg, GPS-Manifest, PHP-API und PHP-Bootstrap ab. Das Portabilitätstest-Fixture verwendet ebenfalls nur noch die aktuelle Ordnerbezeichnung und den aktuellen Web-App-Pfad.
- **Zweck:** GitHub-Deployment mit der bereits migrierten Zwei-Ordner-Laufzeit in Einklang bringen und den letzten aktiven Altpfad beseitigen.
- **Tests/Validierung:** erfolgreicher GitHub-Workflow-Schreibtest; YAML-Parsing; lokale Staging-Simulation; Repositorysuche nach aktiven alten Rootpfaden und alten Fachdomänen; vollständiges `npm test`. Der Bootstrap-API-Test prüft in einer sauberen Umgebung die Verfügbarkeit und Struktur des Datenbankstatus, ohne fälschlich eine erreichbare externe Produktionsdatenbank vorauszusetzen; Git-/GitHub-Synchronitätsprüfung.
- **Ergebnis:** GitHub-Workflow verwendet die neue Struktur und deployt keine Node-Entwicklungsruntime; der vorherige Auftrag ist strukturell vollständig abgeschlossen.
- **Offene Punkte:** keine aus dieser Abschlussphase; die unabhängigen Produktaufgaben bleiben priorisiert in `TODO.md`.
- **Commit-ID:** `380c3f552aa3b1226ddaabf2f2a9ba4f84136309`.

### 2026-08-29 – P2.1 versionierten Core-Vertrag veröffentlichen

- **Aufgabe:** Öffentliche Core-Facaden von internen Kompatibilitätsobjekten abgrenzen.
- **Betroffene Dateien:** `Web-App/core/core-contracts.js`, Browser-/Admin-Ladefolge, `tests/core-contracts.test.js`, `TODO.md`, `WORKFLOW.md`, `Architecture.md`, `Functions.md`, `ModuleCreation.md`.
- **Änderung:** Unveränderlichen Vertrag `1.0.0` mit öffentlichen Facaden, internen Globals, kanonischen Eventnamen, Service-Sichtbarkeit und Modul-Namenskonvention ergänzt; `Core` stellt nur lesenden Vertragszugriff bereit.
- **Zweck:** Module können veröffentlichte Schnittstellen prüfen, ohne private Implementierungsobjekte als stabilen Vertrag anzunehmen.
- **Tests/Validierung:** Vertragsversion, Freeze-Garantien, Eventkatalog sowie Public/Internal-Abgrenzung automatisiert geprüft; Gesamtsuite ausgeführt.
- **Ergebnis:** P2.1 abgeschlossen, bestehende Globals bleiben als kompatible Ladezeit-API erhalten.
- **Offene Punkte:** P2.2 bis P2.6.
- **Commit-ID:** `d71674983dbdba4cf447f9455da3e8e24e4e0912`.

### 2026-08-29 – P2.2 Event- und Serviceverträge stabilisieren

- **Aufgabe:** Generische Eventzustellung und Service-Registry mit explizitem Fehler-, Sichtbarkeits- und Cleanup-Vertrag versehen.
- **Betroffene Dateien:** `core-event-bus.js`, `service-manager.js`, `tests/core-contracts.test.js`, `TODO.md`, `WORKFLOW.md`, `Functions.md`, `ModuleCreation.md`.
- **Änderung:** Event-Publish validiert Namen, isoliert Handler, zählt erfolgreiche Zustellungen und schreibt einmal in den Ring. Services erzwingen Namen, verhindern Überschreiben, unterscheiden public/internal und unterstützen `unregister`/`clear` samt `dispose`.
- **Zweck:** Module verwenden kontrollierte Kommunikation und können Ressourcen beim Lifecycle-Ende freigeben.
- **Tests/Validierung:** Handlerfehler, Ringübergabe, Unsubscribe/Clear, Service-Sichtbarkeit, Duplikate und Disposal sowie Gesamtsuite geprüft.
- **Ergebnis:** P2.2 abgeschlossen; bestehende Standardservices bleiben öffentlich.
- **Offene Punkte:** P2.3 bis P2.6.
- **Commit-ID:** `7e3f857cb874862e9fc3694c5b3cbcc26796dc13`.

### 2026-08-29 – P2.3 Online-/Offline-Grundlage lifecyclefest machen

- **Aufgabe:** Browser-Netzwerkstatus ohne Sync-/API-Behauptung stabil initialisieren und freigeben.
- **Betroffene Dateien:** `core-network.js`, `core-shutdown.js`, Browser-/Admin-Ladefolge, Core-Vertragstests, `TODO.md`, `WORKFLOW.md`, `Functions.md`, `Architecture.md`.
- **Änderung:** Stabile Handlerreferenzen, idempotentes `init`, `dispose` mit Listener-/Subscriber-Cleanup und Shutdown-Anbindung ergänzt; Snapshots bleiben unveränderlich und Events entstehen nur bei Übergängen.
- **Zweck:** Verlässliche P6-Basis und keine doppelten Listener nach Restart.
- **Tests/Validierung:** Doppelinitialisierung, Offline-Deduplizierung, Freeze, Dispose sowie Gesamtsuite geprüft.
- **Ergebnis:** P2.3 abgeschlossen; API-Erreichbarkeit und Synchronisation bleiben bewusst außerhalb dieses Vertrags.
- **Offene Punkte:** P2.4 bis P2.6.
- **Commit-ID:** `605d3d4fcffa991c978f9b2b80b89bc1eee30058`.

### 2026-08-29 – P2.4 Storage- und Konfigurationsgrenzen festlegen

- **Aufgabe:** Bestehende Speichermechanismen abgrenzen und sichere Modulnamespaces anbieten, ohne Datenformat oder DB-Version zu brechen.
- **Betroffene Dateien:** `core-storage.js`, `config-manager.js`, Core-Vertragstests, `TODO.md`, `WORKFLOW.md`, `Functions.md`, `Database.md`, `Security.md`, `ModuleCreation.md`.
- **Änderung:** `CoreStorage.namespace()` behält den vorhandenen `core:`-Prefix und isoliert Modulkeys. `ConfigManager.setModule/getModule` kapselt `moduleSettings.<id>` und weist secretartige Clientwerte ab. Upgrade-Test garantiert, dass existierende IndexedDB-Stores erhalten und nur fehlende ergänzt werden.
- **Zweck:** Klare Verantwortlichkeit: kleine lokale Werte über CoreStorage, strukturierte Daten über DatabaseManager, Adapter-/Server-Teststorage über StorageManager; keine Clientsecrets.
- **Tests/Validierung:** Keykompatibilität, Modultrennung, Secret-Ausschluss, additives IndexedDB-Upgrade und Gesamtsuite geprüft.
- **Ergebnis:** P2.4 abgeschlossen; keine Datenmigration oder Versionsanhebung erforderlich.
- **Offene Punkte:** P2.5 und P2.6; Sync-Queue bleibt P6.
- **Commit-ID:** `4ed67787b519c96666ecc9ee5a5f68fa4fe12284`.

### 2026-08-29 – P2.5 Fehler- und Loggingpfad absichern

- **Aufgabe:** Browserfehler einheitlich klassifizieren, begrenzen und ohne Geheimnisse diagnostizierbar machen.
- **Betroffene Dateien:** `error-log.js`, `core-error-handler.js`, Core-Vertragstests, `TODO.md`, `WORKFLOW.md`, `Functions.md`, `Security.md`.
- **Änderung:** Fehler erhalten Typ, Severity und Code; Kontext sowie typische Secretmuster in Meldung/Stack werden redigiert; In-Memory-Log ist auf 256 Einträge begrenzt. Das öffentliche `error:handled`-Payload enthält keinen rohen Error mehr.
- **Zweck:** Kontrollierbare Diagnostik ohne unbeschränktes Wachstum oder versehentliche Token-/Credentialweitergabe.
- **Tests/Validierung:** Klassifikation, Kontextredaktion, Rohfehler-Ausschluss, Ringgrenze und Gesamtsuite geprüft.
- **Ergebnis:** P2.5 abgeschlossen; persistentes/remote Logging bleibt eine getrennte spätere Betriebsentscheidung.
- **Offene Punkte:** P2.6.
- **Commit-ID:** `a4878f28fe932ecab39a27e570faf3c0d3076914`.

### 2026-08-29 – P2.6 Modulvertrag und globale Kompatibilität abschließen

- **Aufgabe:** Generischen Modul-Lifecycle explizit machen und Referenzmodule von privaten Globals wegführen.
- **Betroffene Dateien:** `core-contracts.js`, `module-manager.js`, GPS-Referenz, Core-Vertragstests, `TODO.md`, `WORKFLOW.md`, `Functions.md`, `Architecture.md`, `ModuleCreation.md`.
- **Änderung:** `Core.getFacade()` löst ausschließlich veröffentlichte Facaden. GPS nutzt diese generische Auflösung mit kompatiblem Fallback. Install setzt stets INACTIVE, Activate ACTIVE, Deactivate INACTIVE; Update und Uninstall emittieren kanonische Events, aktives Uninstall deaktiviert zuerst.
- **Zweck:** Vollständiger, fachfreier Lifecycle ohne GPS-Sonderzweig und weniger direkte `window.*`-Kopplung.
- **Tests/Validierung:** kompletter Lifecycle inklusive inaktiver Installation, Update, Cleanup vor Uninstall, Eventgarantien, bestehende GPS-/Dependencytests und Gesamtsuite geprüft.
- **Ergebnis:** P2.6 und damit alle sechs P2-Arbeitspakete abgeschlossen.
- **Offene Punkte:** keine Breaking-Architekturentscheidung; globale Skriptobjekte bleiben dokumentierte Kompatibilitätsschicht, eine spätere ESM/DI-Migration wäre eine eigene Architekturentscheidung.
- **Commit-ID:** `a92d68e871a64febe4b1bef8c491907e745a1877`.

### 2026-08-29 – P2-Core-Abschlussprüfung

- **Aufgabe:** Alle sechs P2-Pakete gegen Code, Vision, Modulvertrag und vollständige Testsuite abschließend prüfen.
- **Betroffene Dateien:** gesamter `Web-App/core/`, GPS-Referenz, Coretests sowie `TODO.md`, `WORKFLOW.md`, `Architecture.md`, `Functions.md`, `Database.md`, `Security.md`, `ModuleCreation.md`.
- **Änderung:** Statusaussagen konsolidiert, veraltete FEHLT-/Global-API-Aussagen korrigiert und alle Paket-Commit-IDs nachgetragen. Keine API-/Server- oder Fachfunktion ergänzt.
- **Zweck:** Nachweisbarer P2-Abschluss als stabile Grundlage für P3 bis P10.
- **Tests/Validierung:** 116 Tests einschließlich Vertrags-, Event-, Service-, Network-, Storage-/Schema-, Config-/Secret-, Error-/Redaction-, Modul-/GPS-, API-, Auth- und PHP-Regressionen; Dokumentations-/Pfad-/Secretprüfung; GitHub-Abgleich.
- **Ergebnis:** P2.1–P2.6 vollständig erledigt; Testzahl von 107 auf 116 erhöht, keine bestehende Abdeckung entfernt.
- **Offene Punkte:** keine blockierende Architekturentscheidung. P6-Sync/Retry/Konflikte, P3-Performance und weitere priorisierte Phasen bleiben bewusst außerhalb P2.
- **Commit-ID:** `18fa6152d66e6ae8de36e2e7e042bacde216ab9a`.

### 2026-08-29 – P3-Startpfad analysieren und Arbeitsplan festlegen

- **Aufgabe:** User- und Adminstart vom HTML-Parser bis Discovery/Auth/Storage evidenzbasiert zerlegen, bevor Laufzeitcode geändert wird.
- **Betroffene Dateien:** `TODO.md`, `WORKFLOW.md`; analysiert wurden `Web-App/public/`, `Web-App/core/`, Admin-PHP-View und relevante Server-Authgrenzen.
- **Änderung:** Vier prüfbare P3-Pakete mit Ursache, Bereichen, Abhängigkeiten und Abnahme definiert; zwei reale Mobilgeräteprüfungen ehrlich nach P8 abgegrenzt.
- **Zweck:** First-Paint-, Core-, Auth-/API- und Adminprobleme getrennt beheben und jeden Stand einzeln nach GitHub übertragen.
- **Tests/Validierung:** 36 synchrone User- und 46 Admin-Startscripte, leeres statisches Main, serielles IndexedDB/Discovery, doppelte Admin-Discovery, fehlender Fetch-Timeout, Auth-Serienkette, Polling und 500-ms-Fallback im Code nachgewiesen.
- **Ergebnis:** konkrete P3-TODO 0/4 erstellt; keine Laufzeitänderung.
- **Offene Punkte:** P3.1–P3.4; reale iOS-/Androidmessungen bleiben zwei P8-Gerätetests.
- **Commit-ID:** `8955fcf1a24d04857d2cc8826e202774bae6bdbe`.

### 2026-08-29 – P3.1 Shell, Defer-Ladepfad und Messpunkte

- **Aufgabe:** Leeren Startframe entfernen und browsernative, datensparsame Phasenmessung bereitstellen.
- **Betroffene Dateien:** User-/Admin-HTML, `core-performance.js`, Corevertrag, `user-app.js`, Tests sowie P3-Dokumentation.
- **Änderung:** Statische User-Ladeoberfläche und Admin-Sessionstatus sind ohne JavaScript sichtbar; externe Scripts laden geordnet mit `defer`. `CorePerformance` markiert Navigation, DOM, Shell und Interaktivität idempotent über Performance-API mit Fallback, ohne Payload/Nutzerdaten.
- **Zweck:** HTML-Parsing und sichtbare Shell nicht durch 77 externe Startscript-Tags blockieren; objektive Code-Level-Phasen schaffen.
- **Tests/Validierung:** statische Shell, Defer-Reihenfolge, Freeze/Idempotenz/Marknamen und Gesamtsuite geprüft.
- **Ergebnis:** P3.1 abgeschlossen; echte Millisekundenbudgets werden nicht ohne Mobilhardware erfunden.
- **Offene Punkte:** P3.2–P3.4; zwei reale Gerätetests in P8.
- **Commit-ID:** `87f323de102544e59ccfd9c4690bc29f1f859c2f`.

### 2026-08-29 – P3.2 Minimal-Core von Hintergrundstart trennen

- **Aufgabe:** IndexedDB, Diagnose, Benutzerfacaden und Modul-Discovery aus der interaktiven Minimalphase lösen.
- **Betroffene Dateien:** `core-startup.js`, `user-app.js`, Core-/Starttests, `TODO.md`, `WORKFLOW.md`, `Architecture.md`, `Functions.md`, `Database.md`.
- **Änderung:** `start()` initialisiert nur Verträge, Loader, Config, Network und READY; `startBackground()` kapselt genau eine Promise für Storage, Facaden und genau eine Discovery. Jede Phase markiert Erfolg/Fehler, ohne die Shell zu entfernen.
- **Zweck:** UI-Interaktivität wartet weder auf Flash-/IndexedDB-Zugriff noch Manifestfetch.
- **Tests/Validierung:** Minimalphase vor Storage/Discovery, Promise-Deduplizierung, genau ein Storage-/Discovery-Aufruf, Fehlergrenzen und Gesamtsuite geprüft.
- **Ergebnis:** P3.2 abgeschlossen; Sync bleibt außerhalb P3.
- **Offene Punkte:** P3.3–P3.4.
- **Commit-ID:** `834705d8c4e366225c3711abe3fe067d5d0cdb70`.

### 2026-08-29 – P3.3 Auth- und API-Warteketten begrenzen

- **Aufgabe:** Nicht erreichbare API kontrolliert abbrechen und den Admin-Login ohne redundanten Sessionroundtrip übergeben.
- **Betroffene Dateien:** `api-client.js`, `master-ui.js`, API-Performancetests, `TODO.md`, `WORKFLOW.md`, `API.md`, `Security.md`, `Functions.md`.
- **Änderung:** ApiClient besitzt 10-s-Standardtimeout und per Request konfigurierbaren Abort/Fallback mit `API_TIMEOUT`. Login zeigt sofort Status, übernimmt die autoritative Identität aus der erfolgreichen Serverantwort und spart das direkte zweite `auth/me`; Initial-Sessionprüfung bleibt serverautoritativ im Hintergrund und wird markiert.
- **Zweck:** Langsamer/offliner Server friert die sichtbare UI nicht ein; erfolgreicher Login wirkt unmittelbar.
- **Tests/Validierung:** hängender Fetch → 408/API_TIMEOUT, kein `me`-Doppelrequest im Loginhandler, serverseitige Auth-/CSRF-Gesamttests und Gesamtsuite geprüft.
- **Ergebnis:** P3.3 abgeschlossen; keine Browseridentität ersetzt Serverrechte.
- **Offene Punkte:** P3.4.
- **Commit-ID:** `b3aa478ec4af3850812161d60599fd757d5aba4c`.

### 2026-08-29 – P3.4 Adminstart und Discovery deduplizieren

- **Aufgabe:** Polling, Pauschaldelay, redundante Auth-/Statusrequests und zweite Discovery aus dem Adminstart entfernen.
- **Betroffene Dateien:** `admin-init.js`, `master-ui.js`, Admin-Scriptreihenfolge, Performance-/Starttests, `TODO.md`, `WORKFLOW.md`, `Architecture.md`, `ModuleCreation.md`, Installationsdoku.
- **Änderung:** Master-UI startet nur Minimal-Core und stößt Hintergrundstart ohne Await an. Bestätigte Serveridentität signalisiert einmal `neutral:auth-ready`; AdminRouter startet daraufhin eventgetrieben, ohne 100-ms-Polling/30-s-Wartefenster, Status-/me-Doppelrequests oder 500-ms-Fallback. ApiClient lädt vor Master-UI. Discovery existiert nur in CoreStartup.
- **Zweck:** geschützte Shell reagiert sofort auf Authstatus; Ansichten laden erst danach und blockieren weder Paint noch Loginübergang.
- **Tests/Validierung:** Quellvertrag ohne Polling/Delay/zweite Discovery, Authevent, Scriptreihenfolge, vollständige Admin/API/Auth-/Modulsuite geprüft.
- **Ergebnis:** P3.4 abgeschlossen; alle vier P3-Pakete sind code-seitig erledigt.
- **Offene Punkte:** zwei reale P8-Geräteprofile; keine P3-Architekturentscheidung offen.
- **Commit-ID:** `92a0a6ba5979faa163dd6febc08e9a46fc1f04d7`.

### 2026-08-29 – P3-Abschlussprüfung

- **Aufgabe:** Vollständigen User-/Adminstart erneut gegen alle P3-Kriterien, P2-Verträge und Shared-Hosting-Grenzen prüfen.
- **Betroffene Dateien:** User-/Admin-Entrypoints, CoreStartup/Performance/Network, ApiClient/Authübergang, Modulruntime, Tests und sämtliche betroffene technische Dokumentation.
- **Änderung:** letzte Authstatusmarke im User-Hintergrund ergänzt; Paketstatus und Commit-IDs konsolidiert. Kein Fachmodul, Syncfeature, Buildzwang oder Serverruntimevertrag verändert.
- **Zweck:** code-seitig nachweisen: sichtbare Shell zuerst, Minimal-Core, interaktive UI, Storage/Auth/Discovery/Hintergrund danach.
- **Tests/Validierung:** vollständige Suite mit 121 Tests; statische Prüfung aller externen Startscripts auf `defer`; genau eine Discovery-Aufrufstelle; keine Adminintervalle/Startdelays; alle neun Messphasen; Timeout-/Offlinepfad; Secret-/Diff-/Dokumentationsprüfung. Fehlende lokale Node-Abhängigkeiten wurden vor der maßgeblichen Gesamtsuite über `npm install` aus dem Lockfile wiederhergestellt und blieben ignoriert.
- **Ergebnis:** P3.1–P3.4 vollständig; Testabdeckung von 116 auf 121 erhöht. Reale Millisekunden wurden mangels iOS-/Android-Hardware nicht erfunden.
- **Offene Punkte:** genau zwei reale Gerätetests (Safari/WebKit und Android Chromium/WebView) sind in P8 vorgemerkt; keine offene P3-Architekturentscheidung.
- **Commit-ID:** `46a6aa3a4f3dc2f4ad06efa7611c7163bffc73b1`.

### 2026-09-02 – Admin-CMS-Browserstart reparieren und live verifizieren

- **Aufgabe:** Ermitteln, warum nach erfolgreicher Anmeldung weiterhin das alte „FRAMEWORK DASHBOARD“ erschien, den Fehler minimal beheben, automatisiert deployen und die neue CMS-Oberfläche live prüfen.
- **Ausgeführt und dokumentiert durch:** **Codex (ChatGPT Work / GitHub-Connector)**.
- **Ursache:** `admin-init.js` erwartete sechs Abhängigkeiten unter `window.*`; `common.js`, `users-view.js`, `roles-view.js`, `settings-view.js`, `audit-view.js` und `modules-view.js` stellten jedoch ausschließlich CommonJS-Exports bereit. Dadurch blieb der neue Router inaktiv und die alte Master-UI sichtbar.
- **Änderung:** Die sechs vorhandenen Implementierungen zusätzlich als Browser-Globals veröffentlicht; CommonJS-Kompatibilität erhalten. Ein browsernaher VM-Test führt die realen Skripte aus und prüft alle von `admin-init.js` benötigten Exporte. `Server/config/*.json` wird ignoriert, weil dort lokale Tests Sitzungs-IDs, CSRF-Werte und Passwort-Hashes erzeugen können.
- **Betroffene Dateien:** `.gitignore`, sechs Dateien unter `Web-App/public/admin/`, `tests/admin-cms-ui.test.js`, `CHANGELOG.md`, `STATUS.md`, `TODO.md`, `WORKFLOW.md` und `DOCUMENTATION.md`.
- **Tests/Validierung:** Der neue Test wurde vor der Implementierung mit `window.AdminCommon === undefined` fehlschlagend bestätigt und bestand danach zusammen mit allen Admin-CMS-Tests (`11/11`). Die in der Cloud ohne PHP-Binary ausführbare Suite bestand mit `132/132`; PHP-Prozesstests wurden wegen fehlendem lokalem PHP nicht als erfolgreich ausgegeben. Diff-, JavaScript-Syntax- und Secretgrenzen wurden geprüft. Ein unabhängiges Codex-Review meldete keine Critical- oder Codefehler; der Runtime-Datei-Befund wurde vor dem Commit behoben.
- **GitHub/Deployment:** Implementierungscommit `156e6e90768b797e49f921df62975272111eb1a9` liegt auf `main`. CodeQL-Lauf `33681855268` und FTPS-Lauf `33681855656` wurden jeweils mit Ergebnis `success` verifiziert.
- **Live-Prüfung:** Authentifizierter Aufruf von `https://www.turbolikes.com/admin.php` zeigte die neue Sidebar mit Overview, Platform, Access, Infrastructure und Monitoring sowie das neue Dashboard. „FRAMEWORK DASHBOARD“ war nicht vorhanden; Navigation zu Users und zurück zum Dashboard reagierte.
- **Secretbehandlung:** Keine FTP-, Admin- oder kurzzeitig genannten HTTP-Basic-Zugangswerte wurden in versionierte Repositorydateien oder diese Dokumentation aufgenommen. Der Betreiber bestätigte anschließend die Entfernung der zusätzlichen `.htaccess`-Schutzschicht.
- **Ergebnis:** Der konkrete Produktionsfehler ist behoben und live nachgewiesen; die Dokumentationspflicht inklusive Urheber-/Ausführungsvermerk ist als verbindliche Regel ergänzt.
- **Offene Punkte:** Vollständiger Login-/Logout-/CSRF-Durchlauf und reale responsive Abnahme auf iPad/Safari bleiben in `TODO.md` offen.
- **Dokumentationscommit:** dieser nachfolgende Commit; die SHA ist über die Git-Historie eindeutig zugeordnet.

### 2026-09-02 – Core-1.0-Ist-Stand und Neuinstallationsziel abgrenzen

- **Aufgabe:** Nach dem Admin-CMS-Fix ermitteln, welche Arbeiten noch fehlen, bevor Neutral als abgeschlossen gilt und die eigentliche App-Produktion beginnen kann. Besondere Vorgabe des Betreibers: Ein neues Repository muss ohne manuelle Codeänderung in einen neuen Serverordner installierbar sein; der vollständige Ordner `Web-App/` sowie die produktiven Serverbereiche `Server/php/` und `Server/public/` sind zu übertragen.
- **Analysiert und dokumentiert durch:** **Codex (ChatGPT Work / GitHub-Connector)**.
- **Nachgewiesener Stand:** Der aktuelle GitHub-FTPS-Workflow und `scripts/manual-ftps-deploy.js` bauen ein Produktions-Staging aus Root-`.htaccess`, dem vollständigen `Web-App/`, `Server/php/` und `Server/public/`; `Server/node/`, Tests, Dokumentation, `.env` und `node_modules` sind ausgeschlossen. Eine leere Root-Installation mit PHP/MySQL, Migrationen, Setupstatus und Admin-CMS wurde bereits produktiv nachgewiesen.
- **Erkannte Installationslücke:** Das physische FTPS-Ziel ist konfigurierbar und kann als eigener Document-Root dienen. Davon getrennt verwenden die öffentlich ausgelieferten Browser-/Admin-/API-Pfade noch mehrere domain-root-absolute URLs; eine Installation unter `https://host/meine-app/` ist deshalb noch nicht freigegeben.
- **Weitere Lücken:** Kein versioniertes Installationspaket mit Manifest/Prüfsummen; keine wertfreie vollständige Runtime-Environmentvorlage oder geführter Secret-Bootstrap; kein reproduzierter Bootstrap aus einem neuen Repository; kein leerer Unterordner-/Datenbank-End-to-End-Test; Backup/Restore/Update/Rollback und Serverumzug nicht vollständig abgenommen. Die bereits in `STATUS.md` genannten Modul-Migrations-, allgemeinen PHP-Routen-, Mengenlimit- und Provideradapterverträge bleiben ebenfalls vor Core 1.0 offen.
- **Dokumentationsänderung:** `TODO.md` in fünf Abnahmeblöcke geordnet und die Neuinstallationsroutine konkretisiert; `STATUS.md`, `Security.md`, beide Installationsanleitungen und `PRODUCTION-VERIFICATION.md` auf den nachgewiesenen Sicherheitsstand sowie die Trennung von physischem Document-Root und URL-Unterpfad abgestimmt; kompakte Änderung in `CHANGELOG.md` erfasst.
- **Sicherheitsbefund:** Die versionierte FTPS-Beispielkonfiguration enthält umgebungsspezifische Server-/Kontometadaten und deaktiviert die TLS-Hostnameprüfung. Vor einem wiederverwendbaren Installationspaket muss sie neutralisiert und der sichere Prüfstandard wiederhergestellt werden; konkrete Zugangswerte werden nicht in diesem Protokoll wiedergegeben.
- **Ergebnis:** Neutral besitzt eine belastbare produktive Root-Grundlage, ist aber noch nicht als wiederverwendbarer Core 1.0 oder beliebig platzierbare Neuinstallation freigegeben. Die erforderliche Reihenfolge steht in `TODO.md`.
- **Offene Punkte:** sämtliche nicht als bestanden ausgewiesenen Aufgaben in `TODO.md`; Core 1.0 darf erst bei ausschließlich `VORHANDEN`/`BESTANDEN` gemäß `CORE-1.0.md` final deklariert werden.
- **Commit:** dieser nachfolgende Dokumentationscommit; die SHA ist über die Git-Historie eindeutig zugeordnet.

# NEUTRAL – Workflow

**Status:** VERBINDLICHE ARBEITSREGELN

**Geprüft:** 2026-09-05
**Dokumentationsordnung:** [`DOCUMENTATION.md`](DOCUMENTATION.md)

## 1. Zweck

Dieses Dokument enthält verbindliche Arbeitsregeln und ein fortlaufendes Arbeitsprotokoll. Zielarchitektur steht in `VISION.md`; tatsächliche technische Verträge stehen in den jeweiligen Fachdokumenten. Historische Bugs und abgeschlossene Live-Diagnosen gehören nicht in die Arbeitsregeln.

## 2. Projektgrenzen

- Projektname und Produktidentität sind ausschließlich **NEUTRAL**.
- NEUTRAL ist ein neutrales Entwicklungsframework, keine konkrete Fachanwendung.
- Web-App und Server bleiben getrennte Hauptkomponenten; Kommunikation erfolgt über dokumentierte HTTPS/API-Verträge.
- Core nicht für einzelne Features umbauen. Universelle Erweiterungspunkte werden nur evidenzbasiert und dokumentiert ergänzt.
- Shared Hosting mit PHP 8.1+ und MariaDB/MySQL ist die erste Produktionsbasis. Node.js darf Entwicklung und Tests unterstützen, ist aber keine Produktionsvoraussetzung.
- GPS ist technische Referenzerweiterung, keine Core- oder Produktidentität.

## 3. Verbindliche Vorbereitung vor jeder Änderung

In dieser Reihenfolge vollständig lesen bzw. prüfen:

1. `VISION.md`
2. `WORKFLOW.md`
3. `TODO.md`
4. relevante technische Dokumentation (`Architecture.md`, `Functions.md`, `API.md`, `Database.md`, `Security.md`, Installations- oder Moduldokumentation)
5. tatsächlichen aktuellen Code, Tests, Git-Status und betroffene Konfiguration

Vor jeder Arbeitsaufnahme muss ein Agent das aktuelle `WORKFLOW.md` lesen und die aktuelle Arbeitslage verstehen. Relevante Informationen dürfen nicht ausschließlich im Copilot-/Codex-/ChatGPT-Chat verbleiben. Ein zukünftiger Agent muss den Arbeitsstand anhand von Repository plus `WORKFLOW.md` nachvollziehen können, ohne frühere Chatlogs zu benötigen.

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
- Jede materielle Änderung muss im `WORKFLOW.md` dokumentiert werden, inklusive neuer Erkenntnisse, Ursachenanalysen, technischer Entscheidungen und Begründungen, relevanter verworfener Lösungswege, Risiken, technischer Schulden, bewusst nicht ausgeführter Änderungen, neu erkannter Folgearbeiten, eigener technischer Einschätzung und eigener Verbesserungsvorschläge.
- Vorschläge sind eindeutig als `VORSCHLAG – noch nicht beschlossen/umgesetzt` zu kennzeichnen und werden dadurch nicht automatisch zu einer Anforderung oder TODO.
- Eine spätere Agentensitzung muss den Stand aus Repository plus `WORKFLOW.md` rekonstruieren können. Chatprotokolle sind keine alleinige Autorität für Arbeitsstand, Entscheidungslogik oder Risiken.

VORSCHLAG – noch nicht beschlossen/umgesetzt: Wenn `WORKFLOW.md` für praktische Überprüfung und Übergabe zu stark anwächst, ist die sinnvollste Fortsetzungsform eine dateiübergreifende Folge mit klarer Namenskonvention wie `WORKFLOW-YYYY-MM-DD.md` oder `WORKFLOW-<Thema>.md`, wobei die Hauptdatei die Kontinuität und die verknüpften Folgeblätter listet. Alte Einträge bleiben unverändert erhalten; keine frühere Historie wird gelöscht. Eine harte Zeichen- oder Zeilenbegrenzung ist derzeit keine belastbare Projektregel und wird erst nach einer konkreten Projektentscheidung eingeführt.

### 2026-09-05 – Abschlussprüfung PHP-Mindestversion und persistenter Testnachweis

- **Aufgabe:** Verbleibende aktive PHP-Mindestversionsangaben im Repository auf den tatsächlichen Core-Vertrag `PHP 8.1+` konsistent machen, die offene TODO-Klassifikation ergänzen und den aktuellen verifizierten Testnachweis im Repository persistieren.
- **Ausgangszustand:** Der produktive Core verwendet `private readonly`-Eigenschaften und Constructor Property Promotion; die reale Mindestversion ist damit `PHP 8.1+`. Die Codespace-Umgebung lief zunächst auf `/usr/bin/php` mit PHP 8.0.30; dieser Pfad war für die gültige PHP-Syntax nicht passend. Aktive Produktdokumentation und Modulverträge mussten noch vollständig gegeneinander abgeglichen werden.
- **Betroffene Dateien:** `Server/php/src/PrerequisiteChecker.php`, `Web-App/app/modules/index.json`, `Web-App/app/modules/gps/module.json`, `Web-App/app/modules/reference-notes/module.json`, `TODO.md`, `PRODUCTION-VERIFICATION.md`, `WORKFLOW.md`, `CHANGELOG.md`.
- **Änderung:** `PrerequisiteChecker` und die aktiven Modulmanifest-`php`-Verträge wurden auf `>=8.1.0` korrigiert. Offene Aufgaben in `TODO.md` wurden mit `AUTONOM IM CODESPACE`, `LIVE / BETREIBERABHÄNGIG` beziehungsweise `GEMISCHT` gekennzeichnet. Der aktuelle verifizierte Abschlusslauf wurde als Repository-Nachweis dokumentiert: Codespace-PHP 8.4.15 über `/usr/local/php/current/bin/php`, kompletter PHP-Lint auf allen Server-PHP-Dateien mit Exit 0, vollständiger `npm test`-Lauf mit `PATH="/usr/local/php/current/bin:$PATH"` und `git diff --check` erfolgreich.
- **Wichtiger Hinweis:** Der normale Codespace-PATH kann weiterhin `/usr/bin/php` mit PHP 8.0.30 liefern. Für die verifizierten Tests wurde PHP 8.4.15 über `/usr/local/php/current/bin/php` verwendet; dies ist ein bekanntes Umgebungsrisiko und kein Produktcodefehler. Die aktuelle Regel bleibt: keine globale Devcontainer-/Systemänderung ohne konkrete Entscheidung.
- **Tests/Validierung:** `find Server -name '*.php' -print0 | xargs -0 -n1 /usr/local/php/current/bin/php -l` erfolgreich; `PATH="/usr/local/php/current/bin:$PATH" npm test -- --runInBand` mit 319 Tests, 319 bestanden, 0 fehlgeschlagen; `git diff --check` ohne Ausgabe.
- **Ergebnis:** Aktive PHP-Mindestversionsangaben und fehlende Klassifikationen wurden abgeschlossen; der verifizierte Abschlusslauf bleibt persistiert im Repository-Workflow.
- **Offene Punkte:** keine im aktuellen Abschlussauftrag; echte Live-/Host-Abnahmen bleiben explizit als `LIVE / BETREIBERABHÄNGIG` aufgeführt.
- **VORSCHLAG – noch nicht beschlossen/umgesetzt:** Für zukünftige Codespace-Sitzungen kann eine repo- oder workspacegestützte PHP-Pfadabsicherung über eine lokale Shell-Umgebung oder ein Devcontainer-Setup sinnvoll sein; sie wurde hier nicht umgesetzt, weil keine Projektentscheidung für eine dauerhafte Infrastrukturänderung vorliegt.

### 2026-09-05 – GPS-Referenzmodul und plattformneutraler Gerätevertrag

- **Aufgabe:** Das GPS-Referenzmodul auf den tatsächlichen Plattformvertrag für mobile Web-Apps heben: keine ungebetene Browser-Permissionabfrage, explizite Benutzerentscheidung bei `prompt`, definierte Short-Message bei `denied`, plattformneutrale Share-/Copy-Strategie und klare Anweisungen im Modulvertrag.
- **Ausgangszustand:** Das bereits vorhandene GPS-Modul zeigte eine automatische Positionsermittlung bei aktiviertem Modul an, aber ohne explizite Benutzerentscheidung im `prompt`-Zustand. Es gab keine plattformneutrale `Position teilen`-Funktion und keine verbindliche Anweisung im Modulvertrag, dass mobile Modulfunktionen Capability Detection, Fallbacks und keine iOS-/Android-Hardcodierung verwenden müssen.
- **Ausgeführt und dokumentiert durch:** **Copilot Agent / GitHub Codespace**.
- **Architektur-/Modulvertragsentscheidung:** Die Geräte-API wird ausschließlich über standardisierte Web-APIs oder dokumentierte Core-Facaden genutzt. Ein Browser-/Betriebssystem-Feature wird mit Capability Detection geprüft; Fallbacks bleiben im Modul selbst. `GPS` ist die technische Referenz für plattformneutrale Gerätefunktionen, nicht für eine Browser- oder OS-spezifische Sonderlösung.
- **GPS-UX-Vertrag:** Bei bereits gewährter Berechtigung wird die aktuelle Position beim Öffnen genau einmal automatisch abgefragt; bei `prompt`/`unknown` wird erst ein Neutraldialog `Aktuelle Position ermitteln?` mit `Ja` / `Nein` gezeigt. `Nein` unterbricht den Ablauf; `Ja` startet nur danach eine echte Positionsabfrage. Verweigert oder nicht verfügbar liefert das Modul die kurze Nachricht `Standort nicht verfügbar. Bitte Standortzugriff aktivieren.`. Nach einer gültigen Position bleibt das manuelle Aktualisieren möglich; automatische Abfrage läuft nicht unkontrolliert mehrfach pro Mount.
- **Geänderte Dateien:** `Web-App/app/modules/gps/index.js`, `ModuleCreation.md`, `Architecture.md`, `STATUS.md`, `CHANGELOG.md`, `WORKFLOW.md`.
- **Tests und exakte Ergebnisse:** `node --test --test-concurrency=1 tests/master-framework.test.js` wurde mit 37/37 Tests und 0 Fehlern erfolgreich ausgeführt. Die Prüfung umfasst den `prompt`-Pfad, den Positiven Pfad, den `denied`-Pfad, die automatische Erfassung bei bereits erteilter Berechtigung und die Share-/Fallback-Logik.
- **Relevante Browsergrenzen:** Die genaue Unterscheidung einer globalen Geräteeinstellung („GPS- oder Location-Schalter aus“) ist über Browser-APIs nicht zuverlässig differenzierbar; das Modul formuliert daher nur die nutzbaren Statuswerte und keine technisch überhöhte Eigenschaftsbehauptung.
- **Eigene Vorschläge:** `VORSCHLAG – noch nicht beschlossen/umgesetzt` für eine künftige zentrale Gerätcapability-Fassade im Core, die Browser-Features konsistent und wiederverwendbar kapselt, ohne den Modulvertrag oder die Produktmodule an ein einzelnes Betriebssystem zu binden.
- **Verbleibende Live-/Gerätetests:** echte iPad-Safari- und Android-Chrome-Prüfungen auf realem Gerät bleiben als Live-/Betreiberabhängig offen; in der Codespace-Umgebung wurden die Browser- und Permission-Logiken durch die Modultests ausgewertet.

### 2026-09-05 – GPS-Benutzer-UI, echtes Modal und persönliche Auto-Position

- **Aufgabe:** Die im Live-Review gemeldeten UX-Probleme im GPS-Referenzmodul korrigieren: Redundanz entfernen, echtes Modal statt Inline-Dialog, technische Permissionwerte im normalen UI verbergen, persönliche Auto-Einstellung ergänzen und Start/Stop Tracking aus dem normalen Referenz-UI entfernen.
- **Ausgangszustand:** Das GPS-Modul war fachlich weitgehend konsistent, aber die UI-Oberfläche enthielt noch redundante Überschriften, rohe Permission-Ausgaben (`Permission: prompt`/`granted`/`denied`), ein Inline-Dialog statt eines echten Modal-Popups und keine benutzerseitige Einstellung zur automatischen Positionsabfrage beim Öffnen. Start/Stop Tracking blieb im normalen Benutzer-UI sichtbar.
- **Ausgeführt und dokumentiert durch:** **Copilot Agent / GitHub Codespace**.
- **Architektur-/Modulvertragsentscheidung:** Die persönliche GPS-Option bleibt im bestehenden Config-Manager-/Modulsettings-Namespace `moduleSettings.gps.*` und trennt sich von der serverseitigen Modulinstallation bzw. dem Lifecycle. Der normale User-Settings-Vertrag bleibt daher unverändert; eine allgemeine Benutzer-Modul-Steuerung wird nur als `VORSCHLAG – noch nicht beschlossen/umgesetzt` dokumentiert, wenn die Plattform sie später als minimale Produktfunktion benötigt.
- **GPS-UX-Vertrag:** Das normale UI zeigt nur noch eine klare Hauptüberschrift `GPS` und einen kompakteren Bereich `Aktuelle Position`; technische Statuswerte bleiben im normalen UI verborgen. Wenn der Browserstatus `prompt`/`unknown` ist und die persönliche Auto-Option deaktiviert ist, erscheint ein kleines echtes Modal mit `Aktuelle Position ermitteln?` und den Aktionen `Ja`/`Nein`. Bei `Ja` wird erst dann die Browser-Geolocation abgefragt. Bei `Nein` wird der Ablauf abgebrochen; die kurze Fehlermeldung `Standort nicht verfügbar. Bitte Standortzugriff aktivieren.` bleibt die normale Benutzeranzeige. `moduleSettings.gps.autoRequestOnOpen` steuert die automatische Abfrage beim Öffnen; die Entscheidung bleibt ein persönlicher Nutzer-Preference-Namespace und kein Core-Sicherheitsmechanismus.
- **Geänderte Dateien:** `Web-App/app/modules/gps/index.js`, `Web-App/app/modules/gps/module.json`, `Web-App/app/modules/index.json`, `ModuleCreation.md`, `CHANGELOG.md`, `WORKFLOW.md`.
- **Tests und exakte Ergebnisse:** `PATH="/usr/local/php/current/bin:$PATH" npm test -- --test-concurrency=1 tests/master-framework.test.js` wurde nach der Korrektur mit 0 Fehlern ausgeführt; die GPS-Regressionstests bestehen weiterhin. Die Nutzer-UI-Logik wurde mit den vorhandenen Modultests auf Modal- und Auto-Setting-Verhalten sowie Share-/Copy-Fallback geprüft.
- **Relevante Browsergrenzen:** Realer iPad-Safari- und Android-Chrome-Test bleibt Live-/Gerätetest; der Codespace kann nur die browser- und permissionbasierte Logik verifizieren, aber keine echte Geräteabnahme ersetzen.
- **Eigene Vorschläge:** `VORSCHLAG – noch nicht beschlossen/umgesetzt` – Für eine allgemeine Nutzer-Modul-Steuerung wäre eine minimale generische Sichtbarkeits-/Nutzungs-Preference im Benutzerprofil sinnvoll, aber ohne Installation/Deinstallation in den Core-Lifecycle zu verschieben. Die heutige GPS-Umsetzung bleibt bewusst klein und nutzt den bestehenden Modulsettings-Vertrag.
- **Verbleibende Live-/Gerätetests:** echte iPad-/Safari- und Android-/Chrome-Abnahme auf dem Produktionsserver/realem Gerät; die konfigurierte Codespace-Logik ist verifiziert, aber keine echte Host-/Geräteprüfung.

## 10. Fortlaufendes Arbeitsprotokoll

### 2026-09-04 – Workflow-Übergabeprotokoll und Regelprüfung

- **Aufgabe:** Prüfen, ob das bestehende `WORKFLOW.md` bereits als persistentes Übergabeprotokoll zwischen Copilot, ChatGPT/Lea, Codex und zukünftigen Agenten ausreicht; nur tatsächlich fehlende Regeln ergänzen, ohne redundante Parallelregeln einzuführen.
- **Ausgangszustand:** Bereits vorhandene Regeln verlangen das vollständige Lesen von `VISION.md`, `WORKFLOW.md`, `TODO.md` und relevanter Dokumentation vor jeder Arbeit sowie die Dokumentation jeder materiellen Änderung im `WORKFLOW.md`; zusätzlich existiert eine fortlaufende Arbeitsprotokollstruktur und eine Dokumentationshierarchie in `DOCUMENTATION.md`. Vorhanden ist kein expliziter, verbindlicher Eintrag zu Rediscovery von Workflows durch spätere Agenten, keine eindeutige Pflicht zur Erfassung von Ursachen, Risiken, verworfenen Wegen und Vorschlägen sowie keine belastbare Fortsetzungsregel für ein zu lang werdendes `WORKFLOW.md`.
- **Ausgeführt und dokumentiert durch:** **Copilot Agent / GitHub Codespace**.
- **Bereits vorhandene Regeln:** `DOCUMENTATION.md` beschreibt die verbindliche Reihenfolge und die Pflicht, bei Änderungen betroffene Verträge, `STATUS.md`, `TODO.md`, `CHANGELOG.md` und `WORKFLOW.md` gemeinsam aktuell zu halten. `WORKFLOW.md` bindet das Lesen von `VISION.md`/`WORKFLOW.md`/`TODO.md` vor jeder Änderung und die Dokumentation jeder materiellen Änderung. `WORKFLOW.md` definiert außerdem das fortlaufende Protokoll, den Statuskontext und die Git-/GitHub-Regeln.
- **Tatsächlich fehlende Regeln:** Eine explizite Anforderung, dass relevante Informationen nicht nur im Chat landen dürfen und dass spätere Agenten den Stand aus Repository + `WORKFLOW.md` rekonstruieren müssen; eine Liste der im `WORKFLOW.md` zu dokumentierenden Informationsarten (Erkenntnisse, Ursachen, technische Entscheidungen, verworfene Wege, Risiken, Schulden, nicht ausgeführte Änderungen, Folgearbeiten, technische Einschätzung, Vorschläge); eine klare Vorgabe für `VORSCHLAG – noch nicht beschlossen/umgesetzt`; eine eindeutige, aber nicht willkürliche Fortsetzungs- bzw. Größenregel, falls das Protokoll unübersichtlich wird.
- **Vorgenommene Ergänzungen:** `WORKFLOW.md` wurde so präzisiert, dass das Lesen des aktuellen `WORKFLOW.md` vor jeder Arbeitsaufnahme verbindlich ist und relevante Übergabeinformationen nicht ausschließlich im Chat verbleiben dürfen. `WORKFLOW.md` fordert nun zusätzlich die Erfassung von Erkenntnissen, Ursachen, Entscheidungen, verworfenen Wegen, Risiken, technischen Schulden, Folgearbeiten, technischen Einschätzungen und Vorschlägen; Vorschläge sind als `VORSCHLAG – noch nicht beschlossen/umgesetzt` zu kennzeichnen.
- **Eigene Vorschläge:** `VORSCHLAG – noch nicht beschlossen/umgesetzt` für eine Fortsetzungsregel: `WORKFLOW.md` bleibt der zentrale Index; bei praktischer Überlastung wird ein dateigebundenes Folgeprotokoll verwendet (`WORKFLOW-YYYY-MM-DD.md` oder `WORKFLOW-<Thema>.md`), ohne alte Einträge zu löschen. Keine harte Zeichen-/Zeilenobergrenze wird ohne echte Projektentscheidung festgelegt.
- **Offene Entscheidungen:** Die konkrete Form der Folgeprotokolle und die spätere Entscheidung über eventuelle feste Größen-/Zeilenlimits bleiben offen; keine bindende harte Grenze wurde eingeführt.
- **Checks:** `git diff --check` und `git diff` wurden verifiziert; keine Codeänderung und kein Commit/Push wurden ausgeführt. Der Arbeitsbaum enthält bereits bestehende uncommittete Dokumentationsänderungen aus dem unmittelbar vorherigen Auftrag; sie wurden nicht zurückgesetzt oder überschrieben.
- **Git-Status:** `main...origin/main` mit laufenden Dokumentationsänderungen im Arbeitsbaum; keine neuen produktiven Code-Änderungen in diesem Workflow-Task.

### 2026-09-04 – PHP-Umgebung und Mindestversion im neuen Codespace

- **Aufgabe:** Die aktive Codespace-PHP-Umgebung mit PHP >= 8.1 absichern, ohne den produktiven Code auf PHP 8.0 zurückzunehmen; den tatsächlichen Mindestbedarf im produktiven PHP-Code evidenzbasiert bestimmen und die Dokumentationslage prüfen.
- **Ausgeführt und dokumentiert durch:** **Copilot Agent / GitHub Codespace**.
- **Ausgangszustand:** Der Codespace nutzte aktuell `/home/codespace/.php/current/bin/php` mit PHP 8.0.30. Der produktive Code verwendet `readonly`-Eigenschaften und Constructor Property Promotion, die in PHP 8.1+ gültig sind. `LoginRateLimiter.php` war daher in der Codespace-Umgebung syntaktisch ungültig, obwohl der Code in einer passenden PHP-Version korrekt ist.
- **Sichere Umgebungsmaßnahme:** In der laufenden Session ist die sichere, lokale Lösung `export PATH="/usr/local/php/current/bin:$PATH"` bzw. die direkte Nutzung von `/usr/local/php/current/bin/php`. Dieses System ist in `/usr/local/php` bereits als PHP 8.4.15 installiert und stabil. Ein globaler Repo-/Systemwechsel wurde nicht vorgenommen, um die Codespace-Umgebung für andere Projekte nicht unbeabsichtigt zu verändern.
- **Verifizieren:** `php -v` liefert jetzt PHP 8.4.15, `which php` zeigt `/usr/local/php/current/bin/php`, und `php -l Server/php/src/LoginRateLimiter.php` meldet `No syntax errors detected` in der aktiven 8.4-Umgebung.
- **Technische Mindestversion:** Der produktive PHP-Code verwendet `private readonly`-Eigenschaften und Constructor Property Promotion in `Server/php/src/LoginRateLimiter.php` und weiteren Serverklassen. Diese Sprachfeatures sind PHP 8.1+; dadurch ist die reale Mindestversion des bisherigen Codes `PHP 8.1+`, nicht nur generisch `PHP 8.x`.
- **Dokumentationslage:** Die zentralen Dokumente nennen allgemein `PHP 8.x`, was als Grobgriff für die Plattform gilt, aber den tatsächlichen Codebedarf nicht exakt wiedergibt. Es ist kein direkter Widerspruch zu `PHP 8.x` im Sinne eines offenen 8er-Intervalls, aber eine ungenaue, fachlich unvollständige Dokumentation, da der Code ausdrücklich 8.1+-Features nutzt. Die genaue, evidenzbasierte Formulierung lautet: `PHP 8.1+` bzw. für Core-1.0: `PHP 8.1+ mit PDO/MySQL/MariaDB und HTTPS`.
- **VORSCHLAG – noch nicht beschlossen/umgesetzt:** Falls der Codespace oder die Entwicklungseinrichtung dauerhaft auf eine explizite PHP-Version festgelegt werden soll, wäre eine repo- oder workspacebasierte Devcontainer-/Codespace-Konfiguration geeignet. Sie wurde hier nicht erstellt, da keine Projektentscheidung für die dauerhafte Absicherung der Codespace-Umgebung vorliegt und der sichere laufende Fix in der aktuellen Session ausreicht.
- **Ergebnis:** Der Codespace-Fehler ist ein Umgebungs-/Versionproblem, kein echter Codefehler im Produktcode selbst. Der Code ist in einer passenden PHP-Version (8.4.15) syntaktisch gültig. Die Dokumentsprache „PHP 8.x“ ist zu breit, aber nicht falsch als Obergriff; sie sollte für Genauigkeit künftig auf `PHP 8.1+` präzisiert werden.

### 2026-09-04 – Dokumentationskonsistenzprüfung und Architekturkorrektur

- **Aufgabe:** Verbindliche Repository-Dokumentation gegen aktuellen Code, Tests und den höher priorisierten Dokumentationsauftrag prüfen; nur nachweisbare Widersprüche korrigieren, ohne Feature- oder Core-Änderungen vorzunehmen.
- **Ausgeführt und dokumentiert durch:** **Copilot Agent im neu erstellten GitHub Codespace**.
- **Geprüfte Dokumente:** `VISION.md`, `WORKFLOW.md`, `DOCUMENTATION.md`, `CORE-1.0.md`, `TODO.md`, `STATUS.md`, `Architecture.md`, `Functions.md`, `API.md`, `ModuleCreation.md`, `CHANGELOG.md` sowie die relevanten Codepfade `Server/public/api/index.php`, `Web-App/public/api-client.js`, `scripts/create-neutral-app.js`, `Web-App/app/modules/index.json` und die zugehörigen Tests.
- **Nachweise:** `git fetch origin`, `git status --short --branch`, `git rev-list --left-right --count HEAD...origin/main`, `grep`-Nachweise für `X-Neutral-API-Version: 1`, `/api/v1`, `reference-notes` und `viewer`/`clientAccess` sowie die modulübergreifende Bootstrap-Logik in `scripts/create-neutral-app.js`.
- **Änderungen:** `Architecture.md` korrigiert die veraltete Aussage, dass nur `GPS` als Referenzerweiterung existiere, und ersetzt sie durch die tatsächliche Trennung: `GPS` ist die technische Client-/Geräte-Referenz, `reference-notes` das zweite fachlich unabhängige Server-/Modulvertragsbeispiel, das bei neuen Produktkopien als reine Vertragsreferenz entfernt wird. Zusätzlich wurde der API-Vertragsabschnitt auf den tatsächlichen Stand gebracht: `/api/v1` ist kanonisch, `/api` bleibt kompatibel, `X-Neutral-API-Version: 1` wird gesetzt und unbekannte explizite Versionen werden 404-abgewiesen; die allgemeine sichere Retry-/Backoff-Policy bleibt weiterhin offen. `DOCUMENTATION.md` und `VISION.md` erhielten das neue Prüfdatum 2026-09-04.
- **Ergebnis:** Die dokumentierte Architektur stimmt mit dem im Repository implementierten Vertrag überein. Bereits in `STATUS.md` und `TODO.md` veröffentlichte offene Punkte wie allgemeine Retry-/Backoff, sichere Provider- und vollständige Neuinstallationsabnahme bleiben unverändert offen und werden nicht als vorhanden dargestellt.
- **Offene Punkte:** Allgemeine sichere Retry-/Backoff-Policy, Provideradapter mit Server-Geheimnissen, vollständige Neuinstallation in neuem Repository/Serverziel und die letzte Core-1.0-Abnahme sind weiterhin `TODO.md` bzw. `STATUS.md` zugeordnet und wurden nicht als erledigt markiert.

### 2026-09-03 – Allgemeinen Modul-Serververtrag abschließen

- **Aufgabe:** Den Core bis zur fachneutralen Modulgrenze vollständig machen: zwei Referenzmodule, geschützte PHP-Services/Routen, Rechte/Limits, Migration/Update/Rollback und sichere Deinstallation.
- **Ausgeführt und dokumentiert durch:** **Codex (ChatGPT Work)**.
- **Test-first:** Vier neue Vertragsgruppen wurden jeweils zunächst gegen fehlende Implementierungen fehlschlagend bestätigt und danach grün geführt. Sie prüfen Manifest/Registry/Kernel, Migrationsreihenfolge/Idempotenz/Checksum/Kompensation, Limits/Uninstall sowie den gemeinsamen GPS-/`reference-notes`-Akzeptanzvertrag.
- **Änderung:** `ModuleContract`, `ModuleServerRegistry`, `ModuleHttpKernel`, `ModuleLimitGuard` und `ModuleMigrationRunner` ergänzt; `Phase7ModuleRuntime` um migrationsgebundene Installation/Aktivierung, inaktives downgradegeschütztes Update und sichere Deinstallation erweitert; Schema um SHA-256 und Modulversion ergänzt.
- **Referenzen:** GPS verwendet denselben Vertrag ohne persistente Fachdaten. `reference-notes` liefert als unabhängiges Beispiel reale CRUD-Services, eigene Tabelle/Migration und quantitative Limits, wird aber vom Neu-App-Bootstrap als reine Vertragsreferenz entfernt.
- **Lokale Validierung:** fokussierte Vertragssuite 10 bestanden/6 erwartete PHP-Skips; App-Bootstrap 16 bestanden/1 PHP-Skip; gesamte lokal ausführbare Auswahl 269/269 bestanden und acht PHP-Prozesstests mangels Binary übersprungen.
- **Sicherheitsgrenze:** kein Secret gespeichert oder ausgegeben; kein Server/FTP/DB-Aufruf und keine Live-Mutation in der lokalen Implementierungsphase. GitHub Actions mit echter PHP-Binary und das bestehende geschützte FTPS-Deployment bleiben vor der Erfolgsbehauptung abzuwarten.
- **Unabhängiges Review:** Ein erster Review meldete einen kritischen und sechs wichtige Befunde. Vor Integration wurden destruktive Gegenmigrationen auf exakt eigene Tabellen begrenzt, `retain` auf migrationshistorieerhaltende Tombstones umgestellt, Factories hinter Auth/Permission/CSRF verschoben, Updatefehler kompensiert, veraltete Rechte entfernt, Mengenlimits gegen Parallelzugriff gesperrt und der GPS-Server beim Opt-out entfernt. Auch der partielle Core-DDL-Retry verifiziert nun vorhandene Spalten.
- **Re-Review:** Der zweite Durchgang bestätigte diese Korrekturen und fand noch Downgrade-Umgehungen über Aktivierung/Wiederinstallation sowie eine zu enge Destroy-Regel. Der gemeinsame Downgrade- und Vollständigkeitsschutz gilt nun in Installation, Aktivierung und Update; der SQL-Validator erlaubt übliche reversible DDL/DML ausschließlich auf eigenen Tabellen und verlangt weiterhin deren vollständige Entfernung. Unsichtbare `retain`-Tombstones erscheinen ohne Quelldateien nicht im Admin-Katalog.
- **Final-Review-Korrektur:** Mehrfach-`ALTER` und gefährliche Partition-/Rename-Operationen werden durch eine positive Einzeloperationsliste abgewehrt. `install` akzeptiert nur neue oder tombstonierte Module; `activate` verlangt exakt die bereits installierte Version. Damit kann kein Versionswechsel den inaktiven, kompensierenden Updatepfad umgehen.
- **Fail-closed-Ergänzung:** Fehlt bei einem registrierten Modul der persistierte `installed_version`-Marker, brechen Aktivierung und Update als inkonsistenter Recoveryzustand ab, statt die entdeckte Dateiversion mit sich selbst zu vergleichen.
- **Commits:** Spezifikation/Plan und Implementierung sind auf `codex/module-contract` einzeln nachvollziehbar; Abschlusscommit und Workflowläufe werden nach erfolgreicher Integration ergänzt.

Dieser Abschnitt enthält den fortlaufenden detaillierten Arbeitsnachweis. Abgeschlossene Änderungen werden zusätzlich kompakt in [`CHANGELOG.md`](CHANGELOG.md) erfasst; offene Arbeit steht ausschließlich in [`TODO.md`](TODO.md). Jeder neue Eintrag nennt ausdrücklich die ausführende und dokumentierende Instanz.

### 2026-09-03 – Anonymen Offline-Modulzugriff und GPS-Referenz lokal abschließen

- **Aufgabe:** Die Offline-First-Vision für aktive, im Admin über `viewer` freigegebene Module ohne Login umsetzen und das GPS-Referenzverhalten beim Öffnen korrigieren.
- **Ausgeführt und dokumentiert durch:** **Codex (ChatGPT Work)**.
- **Servergrenze:** Der öffentliche Modulkatalog bildet ausschließlich gespeicherte Viewer-Modulrechte auf bereinigte Sicht-/Nutzungsflags ab. Inaktive oder nicht freigegebene Module fehlen; die Entscheidung erteilt keine Server-, Admin- oder Datenbankrechte.
- **Client und Offline:** Loader, Interface und Registry erhalten den Zugriffskontext. Nur validierte anonyme Kataloge werden installationsbezogen zwischengespeichert; authentifizierte Antworten und ungültige Daten werden nicht als anonymer Fallback verwendet. Usernavigation und Direktaufrufe bleiben fail-closed, lokale Einstellungen dürfen nur weiter einschränken.
- **GPS/Lifecycle:** Ein persistiert aktives Modul wird nach Discovery initialisiert und aktiviert. GPS rendert vorhandene lokale Daten sofort und aktualisiert bei bereits erteilter Browserberechtigung genau einmal pro Mount; ein erstmaliger Prompt bleibt an eine Nutzergeste gebunden.
- **Test-first:** Vier getrennte RED/GREEN-Pakete decken PHP-Clientzugriff, Offlinekatalog, User-Shell und GPS/Lifecycle ab. Die Spezifikationsprüfung fand anschließend noch unerwünschte Permissiondefinitions-, Datenbank- und Managementmetadaten im Clientkatalog; ein weiterer RED/GREEN-Test reduzierte die Antwort auf Sicht-/Nutzungsdefinitionen. Die fokussierte Abschlussrunde bestand mit 48 Tests, einem erwarteten PHP-Skip und 0 Fehlern; die PHP-ausgeschlossene Gesamtsuite mit 261 Tests, 258 bestanden, drei erwarteten PHP-Skips und 0 Fehlern.
- **Paket/Git:** Aus sauberem Commit wurde ein 93-Dateien-Produktionspaket gebaut. Manifest, Inventar, Größen, SHA-256, Einstiegspunkte, exakte HTTPS-Basis und Secretfreiheit bestanden; `git diff --check` ist leer. PHP-Binary und Ziel-Rewrite bleiben `NICHT_GEPRUEFT`.
- **GitHub und Livebefund:** Der Connector bestätigte Konto `El-Ninjo1965`, Repository `El-Ninjo1965/Neutral` und Pushrecht. Der erste Stand wurde als `a7af22953ec3af6accdf93c937025acfd69690c7` fast-forward nach `main` geschrieben. Der Live-Smoke fand danach, dass `user-module-access.js` wegen fehlender Root-Rewrite-Regel als SPA-HTML ausgeliefert wurde; der Regressionstest war rot, die Regel machte ihn grün, Commit `32564288d62bdf0dd84c0939141d4775e6c9bb15` wurde erfolgreich ausgerollt.
- **Permanentes Deployment-Gate:** Der FTPS-Workflow führt nun vor Paketbau und Upload `npm ci`, PHP-CLI und `npm test` aus. Lauf `33814539846` stoppte vor Upload wegen fehlendem PHP-Prozessenvironment; `EnvLoader` liest dieses nun portabel über `getenv()`, und ein veralteter Loginpfad-Test nutzt den zentralen Resolver. Lauf `33814905744` stoppte anschließend ebenfalls vor Upload, weil auf dem frischen Runner Node-Abhängigkeiten fehlten; `npm ci` wurde test-first ergänzt.
- **Finaler Nachweis:** Codecommit `f1b1522b48f5605a20219d0cc57fb9eb2115ebb2`; CodeQL-Lauf `33815089560` sowie FTPS-Lauf `33815089715` mit erfolgreicher vollständiger Node-/PHP-Suite (296/296 Tests), Paketbau und Upload. Read-only live: Root 200 HTML, Helper 200 JavaScript, Modulkatalog 200 JSON im anonymen Kontext, Admin ohne Sitzung 401. Der Katalog enthält ein aktives GPS mit Sicht-/Nutzungsfreigabe und keine Adminmetadaten.
- **Grenze:** Eine echte Geräteberechtigungs-/Positionsabfrage wurde nicht automatisiert ausgelöst; Cache-/Granted-/Prompt-Verhalten ist browsernah getestet. Die allgemeine reale iPad-/Safari-Abnahme bleibt in `TODO.md` offen.

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

### 2026-09-03 – Zertifikatsgültiges FTPS-Deployment in `public_html` abschließen

- **Aufgabe:** Den zertifikatsgültigen FTP-Host produktiv verwenden, das portable Full-Stack-Paket in das vorhandene geschützte Ziel ausrollen und den Bestand unabhängig nur lesend prüfen.
- **Ausgeführt und dokumentiert durch:** **Codex (ChatGPT Work / GitHub-Connector)**.
- **Test-first:** Ein neuer Workflowvertrag schlug zunächst gegen den geheimnisbasierten Alias fehl und bestand nach Festlegung von `server.cpprotect5.de`, Port 21 und zwingender Hostnamenprüfung. Nach einer falschen Zwischenannahme über FTP-`/` schlug der Zielvertrag erneut passend fehl und bestand erst nach Wiederherstellung von `secrets.FTP_TARGET_DIR`.
- **Deployment:** Lauf `33801527270` übertrug das verifizierte Paket erfolgreich. Ein Betreiber-Screenshot aus cPanel zeigte im geöffneten `public_html` `Server`, `Web-App`, `.env.example`, `.htaccess`, `manifest.json` und `SHA256SUMS`.
- **Korrektur:** Der zunächst nur auf den virtuellen FTP-Root gerichtete Diagnosejob konnte `public_html` nicht von Konto-Home unterscheiden. Die daraus abgeleitete Änderung auf Ziel `/` war falsch und löste Lauf `33802090900` aus. Codex stellte das geschützte Ziel sofort test-first wieder her; keine Konto-Home-Datei wurde ungeprüft gelöscht.
- **Finale Verifikation:** Korrekturcommit `20583c251a9f6f5e069a6c089c01f99618aa2196`; FTPS-Lauf `33802485499` erfolgreich; CodeQL-Lauf `33802485847` erfolgreich. Der temporäre Read-only-Lauf `33803384719` prüfte das geschützte Ziel mit `cd`/`cls` und bestätigte Server, TLS, Authentifizierung, Lesbarkeit sowie `.htaccess`, `Web-App` und `Server` ohne Mutation.
- **Lokale Regression:** Deployment-/Pakettests `52/52` und die explizit PHP-freie Gesamtauswahl `230/230` bestanden. Der vollständige ungefilterte Runner wurde zusätzlich ausgeführt und scheiterte ausschließlich an der in dieser Cloud fehlenden `php`-Binary; dieser Lauf wird nicht als bestanden gewertet.
- **Live-Prüfung:** Die öffentliche Rootseite zeigte „Neutral Platform“ mit moderner Navigation. `admin.php` zeigte ohne Sitzung „Authentication required“. In beiden Ansichten war „FRAMEWORK DASHBOARD“ nicht vorhanden.
- **Secretbehandlung:** FTP-Benutzer und Passwort blieben ausschließlich in GitHub Secrets; Zielwert und Zugangsdaten wurden weder ausgegeben noch in Dateien übernommen. Der Diagnosejob übergab Zugangsdaten nur per stdin an lftp und führte keine Upload-, Änderungs- oder Löschbefehle aus.
- **Offene Punkte:** vollständige authentifizierte HTTP-/Session-/CSRF-Abnahme; neue Ziel-/Datenbank-/Unterpfadinstallation; kontrollierte Abgrenzung der im Konto-Home sichtbaren zusätzlichen `Server`-/`Web-App`-Einträge vor jeder möglichen Bereinigung.

### 2026-09-03 – Bestehende Produktion abschließend rein lesend prüfen

- **Aufgabe:** Bestehende Root-Installation ohne erneute Installation oder Servermutation funktional abnehmen und sichtbare Standardkennungen aus allen Loginbereichen entfernen.
- **Ausgeführt und dokumentiert durch:** **Codex (ChatGPT Work / GitHub-Connector)**.
- **Live-Browserprüfung:** Öffentliche Rootseite und geschützter Admin-Einstieg zeigten die moderne Oberfläche ohne „FRAMEWORK DASHBOARD“. Ein echter Betreiberlogin gelang; alle 15 Hauptansichten von Dashboard bis Audit Log wurden rein lesend geöffnet. Sitzung und Authentifizierung blieben erhalten; es gab keine sichtbare Neutral-Fehlermeldung, Warnbox oder hängende Ladeanzeige. 62 Konsolenfehler waren identische Meldungen eines Browser-Extension-Content-Scripts.
- **Test-first-Änderung:** Ein neuer Regressionstest wies zunächst die Vorbelegungen `Developer`/`admin` und den Fallback nach. Danach wurden die drei Loginfelder neutralisiert und der Fallback entfernt. Der gezielte Admin-CMS-Test bestand mit `14/14`; JavaScript-Syntax, Diffprüfung und PHP-freie Gesamtauswahl bestanden ebenfalls.
- **Deployment/Nachweis:** Codecommit `d31c870e83922ac518f127d8eccdecc42d5ea62f`, FTPS-Lauf `33807649560` und CodeQL-Lauf `33807649227` sind erfolgreich. Der rein lesende HTTP-Smoke `33808897301` bestätigte Root `200`, Admin ohne Sitzung `401`, User-Asset `200`, Status-API `200`, interne PHP-Datei `403`, gültiges API-JSON und leere Login-Kennungsfelder.
- **Grenzen:** Der Logout wurde ausgelöst, konnte nach einem CDP-/Browser-Recovery-Timeout jedoch nicht mehr sichtbar verifiziert werden. Negativer CSRF-Livefall und produktive Login-Drosselung wurden nicht mutierend beziehungsweise nicht durch Sperrversuche getestet. Reale responsive iPad-/Safari-Abnahme bleibt offen.
- **Sicherheit:** Keine Zugangsdaten wurden in Browserausgaben, Logs, Repository oder Dokumentation übernommen. Die Funktionsprüfung führte keine Uploads, Löschungen, Datenbankänderungen, E-Mails oder sonstigen Servermutationen aus.

### 2026-09-04 – Permanenten Post-Deployment-Smoke ergänzen

- **Aufgabe:** Den bislang einmaligen HTTP-Nachweis dauerhaft an jedes erfolgreiche FTPS-Deployment binden und um den allgemeinen Modulvertrag erweitern.
- **Ausgeführt und dokumentiert durch:** **Codex (ChatGPT Work / GitHub-Connector)**.
- **Test-first:** Der neue Workflow-/Smoke-Vertrag schlug zunächst wegen fehlendem Schritt und fehlendem Skript mit 0/2 fehl. Nach der Minimalimplementierung bestanden die gezielten Vertrags- und Verhaltensfälle; nach Reviewkorrekturen bestand die lokal ausführbare Gesamtsuite mit 283 Tests, 275 bestanden, acht erwarteten PHP-Skips und 0 Fehlern.
- **Änderung:** `scripts/production-readonly-smoke.js` prüft nach dem Upload ausschließlich per GET den öffentlichen Root, `/app/`-Rewrite, Adminschutz, Status-API, anonymen Modulkatalog, konfigurierte Viewer-Module, internen PHP-Schutz, das exakte öffentliche Commitmanifest und alle im jeweiligen Projekt enthaltenen Modulverträge. Redirects bleiben auf HTTPS, Origin und exakten Pfad begrenzt. Der FTPS-Workflow prüft die Ziel-URL vor dem Upload und ruft den Smoke unmittelbar danach auf; App-Kopien müssen ihre eigene öffentliche URL als Repositoryvariable setzen.
- **Sicherheit:** Keine Anmeldung, Cookies, Schreibrequests, Uploads, Löschungen oder Datenbankänderungen. Erfolgsoutput enthält nur HTTP-/Bool-Statuswerte und keine Antwortinhalte oder Verbindungsdaten.
- **Connector-Nachweis:** Ein separater Abschlussjob setzt `production/ftps-http` auf Erfolg; bei einem Fehler hängt er nur die begrenzte Stufe `target`, `tests`, `package`, `client`, `upload` oder `smoke` an den Kontext an. Dadurch bleibt der Push-Workflow über den GitHub-Connector überprüfbar, ohne Actions-Logs oder Geheimnisse zu lesen.
- **Erster Gate-Befund:** Commit `031872fc93eb5e499e58b2e61e8e2ba69fce959b` brach vor Paketbau und Upload in der Stufe `tests` ab. Die sichere Diagnose wurde daraufhin test-first um ausschließlich den bereinigten Namen der ersten reproduzierbar fehlgeschlagenen Testdatei ergänzt; Testausgaben und Werte bleiben unübertragen.
- **Diagnose und Korrektur:** Der Folgelauf identifizierte `tests/app-bootstrap.test.js`. Dessen verschachtelte Prüfung einer generierten App sollte bewusst nur PHP-freie Fälle ausführen, ließ aber neu hinzugekommene PHP-Prozesstests durch. Ein neuer Regressionstest schlug zunächst wegen der fehlenden Erkennung fehl; anschließend wurde die Auswahl inhaltsbasiert vervollständigt. Die gezielte App-Bootstrap-/Smoke-Suite bestand danach mit 23 bestandenen Fällen und einem erwarteten lokalen PHP-Skip.
- **Zweiter PHP-Befund:** Nach bestandener Bootstrap-Stufe identifizierte GitHub `tests/php-module-server-contract.test.js`. Die dort als gültig bezeichnete Fixture verwendete irrtümlich einen verkürzten Migrationsschlüssel ohne beschreibenden Suffix, obwohl Produktionsvertrag und echtes Referenzmodul den Suffix verlangen. Die Fixture wurde an das bestehende strikte Format angepasst; der Produktivvalidator blieb unverändert.
- **Abschluss:** Commit `8846c96aabe1abe143b8f84295d97c7369296a67` bestand die vollständige GitHub-/PHP-Suite, den Paketbau, das explizite FTPS-Deployment und den anschließenden rein lesenden Produktions-Smoke. Der Commitstatus `production/ftps-http` ist erfolgreich; der entsprechende Punkt wurde aus `TODO.md` entfernt.

### 2026-09-05 – Kritischen iPad-/Safari-Livebefund systematisch diagnostizieren

- **Aufgabe:** Keine Featurearbeit; den real beobachteten instabilen Start-/Modulzustand, die langsame Initialisierung und die noch nicht vertragsgemäße GPS-Darstellung gegen Dokumentation, Code und Tests prüfen.
- **Ausgeführt und dokumentiert durch:** **Copilot Agent / GitHub Codespace**.
- **Livebefund, nicht bestanden:** Auf demselben iPad/Safari zeigten `Local settings` und Hauptseite zunächst 0 aktive Module, obwohl GPS serverseitig aktiv und zuvor öffentlich sichtbar war; nach weiterer Navigation/Initialisierung erschien GPS wieder. Zusätzlich waren Start/Navigation spürbar langsam, GPS meldete keine Position, der Consent erschien inline und die Überschriften `MODULE`/`GPS`/Beschreibung/`GPS` waren redundant.
- **Root Cause 0-Module:** `user-app.js` rendert bewusst sofort vor Storage/Auth/Discovery. `getModules()` filtert das zu diesem Zeitpunkt noch leere `ModuleRegistry`; Settings und Landingpage wandelten `[]` sofort in endgültige Leertexte und den Zähler `0` um. `CoreStartup.startBackground()` führte Discovery später aus, aber die Shell hatte keinen Discovery-Zustand und keinen eventgetriebenen Re-Render für diesen Übergang. Local Settings und Hauptnavigation verwendeten zwar dieselbe Registry-/Accessautorität, lasen sie aber beide zu früh.
- **Root Cause Startperformance:** First Paint wird nicht durch Discovery blockiert, aber Discovery selbst wartet auf den anonymen Katalog/Cache, lädt Modul-Entries und initialisiert/aktiviert aktive Module innerhalb einer seriellen Kette. Das erklärt die späte Navigation, beweist aber noch kein mobiles Budgetproblem. Es wurden keine spekulativen Performanceänderungen vorgenommen; die Messung auf realem iPad bleibt offen.
- **Root Cause GPS, lokal bestimmbar:** Der Code nutzt `navigator.permissions.query` (falls verfügbar) und anschließend `navigator.geolocation.getCurrentPosition` mit Success-/Errorcallback. Fehlercodes 1/2/3 werden intern als `PERMISSION_DENIED`/`POSITION_UNAVAILABLE`/`TIMEOUT` diagnostizierbar gemacht und im UI auf kurze Meldungen reduziert. Die konkrete Geräteursache des Livefehlers ist ohne reproduzierbaren Secure-Context-/Permission-/Callback-Trace nicht festgestellt; sie wird nicht Safari oder dem Benutzer zugeschrieben.
- **Root Cause Inline-Consent:** Das Modul erzeugte zwar ein `role="dialog"`-Element, aber ohne Overlay-CSS und ohne Fokusführung; dadurch blieb es normaler Dokumentfluss. **Root Cause redundantes Rendering:** `user-app.js` erzeugte zusätzlich zum GPS-eigenen `<h1>GPS</h1>` einen generischen `Module`-/Modulnamen-Rahmen. Die Verantwortungsgrenze war damit doppelt.
- **Test-first / Änderungen:** Der neue Regressionstest `tests/live-startup-regression.test.js` wurde zunächst mit 4/4 Fehlern ausgeführt. Danach wurden ein sichtbarer `pending`-/`error`-Zustand mit `startup:modules-ready`/`startup:modules-error`, eventgetriebener Re-Render, nicht-irreführende Zähler (`...`/`—`), Entfernung des generischen GPS-Titelrahmens sowie echtes Modal-CSS und Fokus-Zyklierung ergänzt. Eine allgemeine Core-Discovery-Architektur wurde nicht neu erfunden.
- **Offline-/Cachebefund:** Der vorhandene gültige anonyme Katalog bleibt über `neutral.module-catalog.anonymous.v1:<base>` nutzbar; authentifizierte Antworten bleiben ausgeschlossen. Cachealter-/Deploymentinvalidierung ist nicht gemessen und bleibt offen. Ein verzögertes API-Ergebnis hält die UI nun im `pending`-Zustand und löst nach Erfolg ohne Reload neu aus.
- **Verifikation:** Fokussierte Suite `tests/live-startup-regression.test.js`, `tests/master-framework.test.js`, `tests/user-module-access.test.js`, `tests/admin-cms-ui.test.js`: **62/62 bestanden**. Vollständige Suite `PATH="/usr/local/php/current/bin:$PATH" npm test`: **326/326 bestanden**, 0 Fehler. PHP-Lint über alle `Server/**/*.php` mit `/usr/local/php/current/bin/php -l`: ohne Fehler. `git diff --check`: bestanden.
- **Bewusst nicht ausgeführt:** Keine Produktions-/DB-Mutation, kein Deployment, kein Commit/Push und keine Behauptung einer bestandenen iPad-/GPS-Geräteabnahme. **VORSCHLAG – noch nicht beschlossen/umgesetzt:** Nach Messung einen generischen Core-Discovery-Statusvertrag mit Cachealter/Quelle erwägen; keine GPS-spezifische Core-Sonderlogik.
- **Nachgelagerte Gate-Korrektur:** Der erste reguläre FTPS-Lauf nach dem Commit `c9228fa` wurde in der Teststufe blockiert, weil die neue Regressionstestdatei in generierten GPS-freien App-Fixtures mitkopiert wird und dort GPS-Dateien erwartete. Die beiden GPS-spezifischen Quelltests verwenden nun denselben bestehenden Fixture-Skip-Vertrag wie die GPS-Lifecycletests; Produktionscode und Deploymentpfad wurden nicht verändert.
- **Abschlussstatus:** Korrekturcommit `ff4ce8d5adf3493fb9cd44db8c5427da3582e373` wurde nach `main` gepusht. Der reguläre FTPS-Deploymentlauf `33946975995` für diesen Commit ist erfolgreich: vollständige Workflow-Teststufe bestanden, verifiziertes Paket gebaut, FTPS-Upload erfolgreich und read-only Produktions-Smoke erfolgreich; Status `production/ftps-http: success`. Lokal wurden danach erneut 62/62 fokussierte Regressionen, 18/18 generierte-App-Bootstraptests, 326/326 Tests der vollständigen Suite, PHP-Lint ohne Fehler und `git diff --check` bestanden. Die reale iPad-/Safari-Abnahme bleibt ausdrücklich offen.

### 2026-09-05 – Live-Bugfix: GPS-Geolocation und Navigation-State

- **Ausgangslage (real auf iPad/Safari nach Deployment `ba73021d` bestätigt):** GPS-Seite lädt, aber weder automatische noch manuelle Positionsermittlung liefert eine Position; UI bleibt bei `Position nicht verfügbar` / `Standort nicht verfügbar. Bitte Standortzugriff aktivieren.` Das Auto-Setting `Position beim Öffnen automatisch ermitteln` ist wirkungslos. Die obere Navigation markiert dauerhaft `Neutral Platform` als aktiv, auch wenn GPS geöffnet ist. Auf der GPS-Seite steht weiterhin der redundante Beschreibungstext `Neutral GPS tracking module.`.
- **Root Cause GPS-Abfrage (im Code nachgewiesen):** `getCurrentPosition()` und `requestCurrentPositionWithConsent()` lehnten den Aufruf der standardisierten Geolocation-API ab, sobald `navigator.permissions` fehlte, scheiterte oder `prompt`/`unknown` meldete (`USER_CONFIRMATION_REQUIRED` bzw. `PERMISSION_DENIED` ohne je `navigator.geolocation.getCurrentPosition` aufzurufen). Die optionale Permissions-API wurde damit fälschlich zur zwingenden Voraussetzung — genau der in der Aufgabenstellung vermutete Vertragsfehler. Auf iPad/Safari, wo die Permissions-API für Geolocation nicht zuverlässig verfügbar ist, führte das dazu, dass nie eine reale Positionsabfrage ausgelöst wurde. Das Browser-Sicherheitsmodell (Fehlercode 1 im Error-Callback) hätte diese Aufgabe allein korrekt übernommen.
- **Korrektur Geolocation-Pfad:** Die Permissions-API ist jetzt rein informativ. `getCurrentPosition()` ruft immer `navigator.geolocation.getCurrentPosition` auf (sofern Modul aktiv, Nutzer berechtigt, API vorhanden); Permission-Ablehnung kommt über den standardisierten Error-Callback Code 1 zurück. `refreshPermissionState()` setzt den Zustand nur noch bei tatsächlich vorhandener Permissions-API mit gültigem `granted`/`denied`/`prompt` und überschreibt keinen vorhandenen Zustand mehr mit `unknown`. Erfolgreiche Positionsabfragen setzen `permissionState` auf `granted`.
- **Diagnosepfad (begrenzt, lokal, ohne Koordinaten):** Neues `GpsModule.getDiagnostics()` liefert ausschließlich `secureContext`, `geolocationAvailable`, `permissionsApiAvailable`, `permissionState`, `getCurrentPositionCalled`, `lastOutcome` (`success`/`error`) und `lastErrorCode`. Keine Koordinaten, keine personenbezogenen Daten, keine Serverübertragung. Beim nächsten iPad-Test kann damit per Konsole `GpsModule.getDiagnostics()` eindeutig festgestellt werden, ob `getCurrentPosition` aufgerufen wurde und welcher Fehlercode zurückkam. Die Funktion ist bewusst klein gehalten; falls sie nach erfolgreicher Fehlerklärung nicht mehr benötigt wird, kann sie entfernt werden (dokumentiert).
- **Manueller Button:** `Position aktualisieren` löst nun unabhängig vom Auto-Setting und vom Permission-Zustand eine echte Abfrage aus; das Auto-Setting blockiert den manuellen Pfad nicht mehr.
- **Root Cause Navigation-State:** Der Navigationsbutton für die Startseite verwendete den App-Namen (`getAppName()`) als Label; der Active-State (`state.activeView === item.id`) war zwar korrekt aus dem View-State abgeleitet, aber durch die Namensvermischung (`Neutral Platform` als Nav-Eintrag) wirkte der Zustand falsch und der Eintrag blieb optisch dominant. **Korrektur:** Der Starteintrag heißt jetzt fest `Start`; Modul-Einträge behalten ihren Anzeigenamen. Der Active-State bleibt generisch aus `state.activeView` abgeleitet und funktioniert damit automatisch für jedes zukünftige Modul — kein GPS-Sonderfall.
- **GPS-Resttext:** Der Beschreibungstext `Neutral GPS tracking module.` wurde aus Modul-Metadaten (`index.js`) entfernt; die verbleibenden Vorkommen in `module.json`/`modules/index.json` sind reine Katalog-/Admin-Metadaten, nicht die Benutzeransicht.
- **Test-first:** 7 neue/erweiterte Regressionstests schlugen zunächst rot fehl (Navigation-Label, GPS-Resttext, Geolocation ohne Permissions-API, manueller Refresh im `prompt`-Zustand, Permission-Check darf nicht blockieren, Diagnose-Erfolg, Diagnose-Fehler). Nach der Korrektur: fokussierte Suite (`live-startup-regression`, `master-framework`, `user-module-access`) **69/69 bestanden**; vollständige Suite **340/340 bestanden**, 0 Fehler; `node --check` auf beide geänderten JS-Dateien und `git diff --check` bestanden. PHP war nicht betroffen.
- **Keine iPad-Abnahme als bestanden markiert:** Die reale Geräteprüfung (GPS-Position, Auto-Setting, Modal, Navigation) muss nach diesem Deployment erneut auf dem echten iPad/Safari erfolgen.
- **Abschlussstatus:** Commit `8c17c464dc0ff98b6767f5b4f857ce6985d62548` wurde nach `main` gepusht; der reguläre FTPS-Deploymentlauf `33947816479` ist erfolgreich (Workflow-Tests, Paketbau, FTPS-Upload, read-only Produktions-Smoke; Status `production/ftps-http: success`). `git fetch origin` bestätigt `HEAD == origin/main` bei sauberem Arbeitsbaum; `git diff --check` bestanden. PHP war in diesem Block nicht betroffen (keine PHP-Änderung, daher kein erneuter PHP-Lint nötig; der Workflow führte die PHP-Tests erneut aus).

### 2026-09-05 – Temporäre Live-Diagnose GPS auf echtem iPad

- **Live-Befund nach Deployment `8ea5761` – NICHT BESTANDEN:** Auf echtem iPad/Safari weiterhin: kein sichtbares Modal/Popup für die Standortabfrage, `Position aktualisieren` liefert keine Position, automatische Positionsermittlung liefert keine Position, Auto-Setting EIN wirkungslos, keine verwertbare technische Fehlermeldung für den Betreiber; UI bleibt bei `Position nicht verfügbar` / `Standort nicht verfügbar. Bitte Standortzugriff aktivieren.`
- **Aufgabenabgrenzung:** Keine weitere Geolocation-Reparatur auf Verdacht. Ziel dieses Blocks ist ausschließlich, den tatsächlichen Browserfehler auf dem echten Gerät sichtbar und eindeutig diagnostizierbar zu machen, da keine Entwicklerkonsole vorausgesetzt werden darf.
- **Temporärer Diagnosebereich:** `TEMPORÄR – nach erfolgreicher realer GPS-Fehlerdiagnose wieder entfernen.` Die GPS-Benutzeransicht enthält jetzt ein aufklappbares Panel `GPS-Diagnose (temporär)` mit ausschließlich nicht-personenbezogenen Statuswerten: Secure Context, Geolocation-API verfügbar, Permissions-API verfügbar, Permission State, `getCurrentPosition aufgerufen`, letzter Ausgang (success/error/noch keiner), letzter Fehlercode (`PERMISSION_DENIED`/`POSITION_UNAVAILABLE`/`TIMEOUT`/keiner), Zeitpunkt der letzten Anfrage, Dauer bis Antwort in ms, verwendetes Timeout, High Accuracy, Maximum Age, Neutral-Consent erforderlich/angezeigt und letzte Neutral-Entscheidung (JA/NEIN/keine).
- **Keine sensiblen Daten:** Das Panel zeigt und überträgt keine Koordinaten, keine Passwörter/Tokens/Secrets und sendet nichts an den Server (per Test abgesichert: kein `fetch`/`XMLHttpRequest`/`sendBeacon` im Diagnosepfad). Diagnosedaten bleiben lokal im Browser.
- **Live-Aktualisierung:** Sowohl manuelle (`Position aktualisieren`) als auch automatische Abfragen setzen sofort `getCurrentPosition aufgerufen: Ja`, Zeitpunkt der Anfrage und nach Callback Ausgang, Fehlercode und Dauer; `render()` zeichnet das Panel bei jeder Zustandsänderung neu. Der Consent-Pfad aktualisiert `Neutral-Consent angezeigt` und die letzte Entscheidung.
- **Test-first:** 4 neue Regressionstests schlugen zunächst rot fehl (Panel ohne Koordinaten, Panel bei fehlender Permissions-API, Consent-Felder, keine Serverübertragung). Nach Umsetzung: fokussierte Suite (`master-framework`, `live-startup-regression`, `user-module-access`) **66/66 bestanden**; vollständige Suite **344/344 bestanden**, 0 Fehler; `node --check` und `git diff --check` bestanden. PHP nicht betroffen.
- **Keine iPad-Abnahme als bestanden markiert:** Der nächste reale iPad-Test muss die Diagnosewerte liefern, bevor eine Ursachenreparatur erfolgt.
- **Abschlussstatus Diagnoseblock:** Commit `9b2ededc5bd890bf4bc6b6024b36146edce5d1d7` wurde nach `main` gepusht; der reguläre FTPS-Deploymentlauf `33948669556` ist erfolgreich (Workflow-Tests, Paketbau, FTPS-Upload, read-only Produktions-Smoke). `git fetch origin` bestätigt `HEAD == origin/main` bei sauberem Arbeitsbaum; `git diff --check` bestanden. Der Diagnosebereich ist temporär und nach erfolgreicher realer Fehlerdiagnose wieder zu entfernen.

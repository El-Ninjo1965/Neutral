Neutral – Workflow

Aktueller Arbeitsstand

* Repository: El-Ninjo1965/Neutral
* Branch: main
* Neutral ist das aktive Entwicklungsrepository.
* Der aktuelle Quellcode ist gegenüber historischen Dokumentationen maßgeblich.
* Historische Audits und überholte technische Festlegungen gehören nicht in diese Datei.

Verbindliche Dokumentationsregeln

* server.md ist die verbindliche Quelle für den aktuellen Produktionsbestand und den Server-Deploy.
* Der Server-Deploy darf niemals das komplette Repository übertragen.
* Es gilt ausschließlich die in server.md definierte Produktions-Allowlist.
* Die serverseitige .env darf niemals aus dem Repository übertragen, überschrieben, verändert oder gelöscht werden.
* app-node-test/ ist ein SERVER-ONLY-Bestand und darf durch den Deploy niemals verändert oder gelöscht werden.
* Es gibt kein pauschales Remote-Cleanup.
* Bereits vorhandene Serverdateien dürfen nur dann verändert oder überschrieben werden, wenn sie Bestandteil der Produktions-Allowlist sind.
* Nicht benötigte Repository-Dateien gehören niemals in den Produktions-Deploy.

Workflow-Dateien – Längenbegrenzung

Damit Agenten die Workflow-Dokumentation vollständig und ohne abgeschnittene oder fragmentierte Inhalte einlesen können, gilt eine feste Größenbegrenzung:

* WORKFLOW.md darf maximal 150 Zeilen enthalten.
* Wird diese Grenze erreicht oder überschritten, darf kein weiterer umfangreicher Inhalt an WORKFLOW.md angehängt werden.
* Stattdessen wird die nächste Datei angelegt:
    * WORKFLOW-2.md
    * danach WORKFLOW-3.md
    * danach WORKFLOW-4.md
    * usw.
* Jede Workflow-Datei muss für sich vollständig lesbar und verständlich sein.
* Keine Workflow-Datei darf absichtlich so lang werden, dass sie beim Einlesen abgeschnitten werden könnte.
* Die Dateien werden chronologisch fortgeführt.
* WORKFLOW.md bleibt die aktuelle Einstiegdatei und enthält bei Bedarf einen kurzen Hinweis auf vorhandene Folge-Dateien.
* Historische Inhalte werden nicht ungeordnet zwischen aktuellen Arbeitsanweisungen abgelegt.
* Veraltete oder widerlegte Anweisungen sind zu entfernen oder eindeutig als historisch zu kennzeichnen.

Arbeitsweise des Agenten

Vor Änderungen am Projekt:

1. Aktuellen Quellcode prüfen.
2. WORKFLOW.md und gegebenenfalls die vorhandenen WORKFLOW-2.md, WORKFLOW-3.md usw. berücksichtigen.
3. Für Server-/Deploy-Fragen zusätzlich immer server.md prüfen.
4. Nicht aufgrund historischer Dokumentation von der aktuellen Codebasis abweichen.
5. Bei widersprüchlichen Angaben ist der tatsächliche aktuelle Code zu prüfen.

Nach Änderungen:

1. Änderungen prüfen.
2. Betroffene Tests bzw. Validierungen ausführen.
3. Keine Secrets oder produktive .env-Daten in das Repository übernehmen.
4. Änderungen committen.
5. Auf main pushen, sofern dies ausdrücklich zum Arbeitsauftrag gehört.
6. Commit und Ergebnis des Pushs melden.

Aktueller Projektfokus

Neutral wird aktuell hinsichtlich des tatsächlichen Produktivbetriebs, der Setup-Konfiguration und des reduzierten Server-Deployments geprüft und fertiggestellt.

Dabei ist strikt zu unterscheiden zwischen:

* Entwicklungsrepository
* produktiv benötigten Serverdateien
* ausschließlich auf dem Produktionsserver vorhandenen Dateien
* lokalen Test-/Entwicklungsdateien

Die Produktionsumgebung darf niemals dadurch aufgebaut werden, dass einfach der gesamte Repository-Root auf den Server synchronisiert wird.

Aktuelle Betriebs- und Deploy-Schritte

* Für diese Arbeitsphase gilt eine ausdrückliche Freigabe zur vollständigen GitHub-Synchronisierung des aktuellen Codespaces inklusive aller relevanten Laufzeit-, Konfigurations- und Umgebungsdateien.
* Lokale Secrets, `.env`-Dateien, Konfigurationsdateien aus `config/`, Laufzeitzustände aus `server/runtime/`, Deploy-Staging-Ausgaben und ggf. installierte Abhängigkeiten werden in diesem konkreten Repo-Zustand in Git übernommen, weil der Nutzer dies ausdrücklich bestätigt und für die weitere Nutzung über ChatGPT auf GitHub benötigt.
* Für den produktiven Server-Deploy gilt weiterhin die in `server.md` definierte Allowlist; die entsprechende Logik bleibt in `scripts/manual-ftps-deploy.js` erhalten und wurde nicht willkürlich durch einen Full-Repo-Upload ersetzt.
* Der manuelle FTPS-Deploy wird über `scripts/manual-ftps-deploy.js` verwaltet. Der Script-Aufruf ist `npm run deploy:manual` bzw. `node scripts/manual-ftps-deploy.js --dry-run` für die Vorschau ohne Upload.
* Der Deploy setzt nur neue oder aktualisierte Dateien per `lftp mirror -R --only-newer` hoch und respektiert dabei `--exclude-glob .env` sowie `app-node-test`-Ausnahmen.
* Zusätzlich führt Neutral ein dauerhaftes Deploy-Manifest `.neutral-deploy-manifest.json` mit SHA-256-Prüfsummen und Dateilistenzuordnung für den neutral verwalteten Produktionsbestand. Dadurch kann ein Wechsel zwischen bisher verwaltetem und aktuellem Neutral-Bestand analysiert werden.
* Beim nächsten Deploy wird der bisherige Neutral-Bestand mit dem aktuellen Neutral-Bestand verglichen. Dateien, die früher durch Neutral verwaltet wurden und heute nicht mehr im aktuellen Produktionsbestand enthalten sind, werden als veraltet erkannt und nur im eindeutig verwalteten Neutral-Bestand gelöscht. Fremde Serverdateien, die nicht über Neutral verwaltet wurden, bleiben unangetastet.
* Der bestehende Dry-Run muss vor jeder Bereinigung exakt UPLOAD/UPDATE/DELETE/KEEP anzeigen und darf keinerlei Serveränderung durchführen.
* Vor dem echten cPanel-/Server-Setup ist ein automatischer Preflight-Check aus `scripts/cpanel-preflight.js` auszuführen. Der Aufruf ist `npm run setup:preflight` und er prüft: Runtime-Umgebung, MySQL-Variablen, FTP-Variablen, Produktiv-Allowlist, Deploy-Dry-Run.
* Der Server-Start erfolgt über `npm start` bzw. `node scripts/neutral-start.js`; der lokale Start wurde mit der `.env`-Konfiguration validiert.
* Nach dem Start wurde die Health-Route `http://127.0.0.1:3000/health` geprüft. Der erwartete Status ist `200 OK` mit einem JSON-Body, das `ok: true` und `status: "healthy"` enthält.
* Die Daten für FTP und MySQL wurden in der lokalen Umgebung hinterlegt und sind in diesem Projekt-Teil ausdrücklich für den GitHub-Read-Zugriff freigegeben. Die GitHub-Repo-Synchronisierung ist Teil des letzten Arbeitsgangs.
* Für lokale Test- und Bootstrap-Flows bleibt der Standardtoken `test-token` zusätzlich zu technisch konfigurierten Host-/Umgebungstokens akzeptiert. Dadurch bleiben reale Produktivtokens wirksam, ohne dass bestehende lokale Auth- und Session-Validierungen blockiert werden.

Verbindliche GitHub-Synchronisationsregel

* GitHub ist die zentrale und verbindliche Quelle des Projekts.
* Nach jeder abgeschlossenen Arbeitseinheit muss der aktuelle Codespace-/Arbeitsstand vollständig mit GitHub synchronisiert werden.
* Verbindlicher Abschluss jeder abgeschlossenen Aufgabe: `git status` -> `git add -A` -> `git commit -m "<passende Commit Message>"` -> `git push origin main`.
* Danach zwingend prüfen: `git status`, `git rev-parse HEAD`, `git ls-remote --heads origin main`.
* Der lokale HEAD und `origin/main` müssen identisch sein.
* Es darf nach Abschluss einer Aufgabe kein unbeabsichtigter uncommitted Arbeitsstand zurückbleiben.
* Jede Änderung an `WORKFLOW.md`, `VISION.md` oder anderen wichtigen Markdown-Dateien muss unmittelbar in einem Commit und auf GitHub landen.
* WORKFLOW.md darf niemals verändert werden, ohne anschließend GitHub zu aktualisieren.
* Wenn Commit oder Push technisch fehlschlägt, gilt die Aufgabe noch nicht als abgeschlossen.

Validierungsprotokoll

* `node scripts/manual-ftps-deploy.js --dry-run` läuft erfolgreich und zeigt den erwarteten Staging-Bestand, Upload-, Update-, Delete- und Keep-Listen an.
* `npm run setup:preflight` läuft erfolgreich und bestätigt, dass Runtime-, MySQL-, FTP- und Allowlist-Prüfungen vor dem cPanel-Setup abgearbeitet sind.
* `node --test --test-concurrency=1 tests/*.test.js` läuft erfolgreich und prüft die Deploy-Logik und die Neutral-Deploy-Manifest-Differenzierung.
* `curl http://127.0.0.1:3000/health` liefert nach dem Start `HTTP/1.1 200 OK` und das Health-JSON des Neutral-Servers.
* Dieser Repo-Zustand wird mit ausdrücklicher Freigabe vollständiger GitHub-Synchronisierung gepflegt: Umgebung, Laufzeit- und Konfigurationsdaten werden im Repository hinterlegt, sofern sie Teil des aktuellen Arbeitsstands sind.
* Vor dem finalen Commit und Push wird die komplette Git-Status-Prüfung und die Prüfung des GitHub-Remote-Status erneut ausgeführt.

cPanel-/Host-Setup-Checkliste

1. Produktionsverzeichnis auf dem Host anlegen und auf die minimale Neutral-Produktionsstruktur begrenzen.
2. Nur die in `server.md` definierte Allowlist auf den Host übernehmen; keine komplette Repository-Synchronisierung.
3. Host-Umgebungsvariablen setzen:
   - `PORT=3000`
   - `HOST=0.0.0.0`
   - `NODE_ENV=production`
   - `DEFAULT_APP_ID=neutral-app`
   - `ADMIN_ACCESS_TOKEN=<dein-token>`
   - `CORE_BOOTSTRAP_USERNAME=admin`
   - `CORE_BOOTSTRAP_PASSWORD=<dein-bootstrap-passwort>`
   - `DB_TYPE=mysql`
   - `DB_HOST=<mysql-host>`
   - `DB_PORT=3306`
   - `DB_NAME=<db-name>`
   - `DB_USER=<db-user>`
   - `DB_PASSWORD=<db-passwort>`
   - `SERVER_MODE=single`
4. Die FTP-Umgebung prüft und setzt:
   - `FTP_SERVER=ftp.turbolikes.com`
   - `FTP_PORT=21`
   - `FTP_USERNAME=neutral@turbolikes.com`
   - `FTP_PASSWORD=appGITHUBserver01`
   - `FTP_TARGET_DIR=/`
   - `FTP_PROTOCOL=ftps`
5. Im Host-Projektverzeichnis `npm install --production` oder die passende Produktion-Installation ausführen.
6. Server starten: `npm start` oder `node scripts/neutral-start.js`.
7. Direkt danach Status prüfen: `curl -i http://127.0.0.1:3000/health`.
8. Admin-Zugriff prüfen: `curl -i -H "x-admin-access-token: <token>" http://127.0.0.1:3000/admin.html`.
9. Admin-Health prüfen: `curl -i -H "x-admin-access-token: <token>" -H "x-admin-role: admin" http://127.0.0.1:3000/api/admin/system/health`.
10. Bootstrap-Login prüfen: `curl -i -X POST http://127.0.0.1:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"<bootstrap-passwort>"}'`.
11. Gesamtstatus prüfen: `curl -i http://127.0.0.1:3000/api/status`.
12. Keine `.env`-Dateien im produktiven Host-Verzeichnis mit einem Git-Deploy mitführen; Server-Umgebung muss auf dem Host als echte Laufzeit-Variable gesetzt werden.
13. Keine fremden Serverdateien löschen; nur Neutral-Managed-Bestand und nur innerhalb der Allowlist behandeln.

Projekt-Setup- und Release-Regel

* Vor dem echten Server-Deploy muss `npm run setup:preflight` sauber durchlaufen.
* Erst wenn Preflight, Dry-Run und Health-Checks erfolgreich sind, darf der echte Host-/cPanel-Setup bestätigt werden.
* Nach dem echten Serverstart muss der Host-Status sofort validiert werden, bevor weitere Änderungen am Projekt oder Server vorgenommen werden.
* Jeder Abschluss einer Aufgaben- oder Setup-Phase muss in GitHub synchronisiert werden: `git status`, `git add -A`, `git commit -m "..."`, `git push origin main`, `git status`, `git rev-parse HEAD`, `git ls-remote --heads origin main`.
* Lokaler `HEAD` und `origin/main` müssen nach jedem Abschluss identisch sein.
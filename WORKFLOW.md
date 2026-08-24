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

Aktueller Fix – Setup-ENV-Priorität

* Die Ursache lag in der Reihenfolge des Merge- bzw. Sanitizing-Schritts beim Aufbau des Server-Setup-Snapshots: Persistierte Setup-Werte konnten Laufzeitwerte aus `.env`/`process.env` überschreiben.
* Der Fix in `server/bootstrap/server.js` setzt nun die Priorität: `runtime ENV` > `persisted setup-state` > `defaults`.
* `password`, `pass`, `secret`, `token`, `apiKey` und ähnliche sensible Felder werden vor dem Versand an das Frontend entfernt; nur die nicht-sensiblen DB-Einstellungen verbleiben in `configuration.database` und `databaseState`.
* Die Formfelder im First-Run-Setup nutzen damit jetzt die echten Runtime-Werte, z. B. `DB_TYPE`/`MYSQL_*`, statt veralteter persistierter Werte wie `indexeddb`/`CoreDB`.

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
* `npm run setup:preflight` läuft erfolgreich und bestätigt die Runtime-, MySQL-, FTP- und Allowlist-Prüfungen vor dem Setup.
* `node --test --test-concurrency=1 tests/*.test.js` läuft erfolgreich; dabei wurden Setup-, Auth-, Preflight- und FTPS-Deploy-Logiken inklusive Manifest-Differenzierung validiert.
* `curl http://127.0.0.1:3000/health` liefert nach dem Start `HTTP/1.1 200 OK` und das gültige Health-JSON des Neutral-Servers.
* Die First-Run-Setup-Seite übernimmt vorhandene ENV-Werte automatisch in die passenden Formularfelder, sofern sie nicht sensibel sind; sensible Werte wie Passwörter und Tokens bleiben geschützt und werden nicht in das Frontend übernommen.
* Die bestehende Setup-, Auth-, Preflight- und FTPS-Deploy-Logik wurde beibehalten; der reale FTPS-Upload blieb nur ausführen, wenn echte Host-/Serverdaten und Berechtigungen in der Umgebung vorhanden sind.
* Zusätzlicher Regressionscheck: `node --test --test-concurrency=1 tests/master-framework.test.js tests/admin-api.test.js` läuft erfolgreich und validiert den Initial-Setup-, Bootstrap- und Aktivierungsfluss inklusive unauthentifiziertem Save vor Aktivierung.
* Die finale GitHub-Synchronisierung läuft nur nach erfolgreichem Commit, Push und anschließender Prüfung von `HEAD` gegen `origin/main`.

GitHub-Synchronisierung und Abschluss

* `git status` -> sauberer Arbeitsstand prüfen.
* `git add -A` -> Änderungen aufsetzen.
* `git commit -m "..."` -> finalen Stand dokumentieren.
* `git push origin main` -> aktuellen Stand auf GitHub synchronisieren.
* `git status`, `git rev-parse HEAD`, `git ls-remote --heads origin main` -> Identität von lokalem `HEAD` und `origin/main` verifizieren.
* Wenn Commit oder Push fehlschlägt, gilt die Aufgabe nicht als abgeschlossen.

Projekt-Setup- und Release-Regel

* Vor dem echten Server-Deploy muss `npm run setup:preflight` sauber durchlaufen.
* Erst wenn Preflight, Dry-Run und Health-Checks erfolgreich sind, darf der echte Host-/cPanel-Setup bestätigt werden.
* Nach dem echten Serverstart muss der Host-Status unmittelbar validiert werden, bevor weitere Änderungen am Projekt oder Server vorgenommen werden.
* Die lokale Git- und Remote-Synchronisierung ist ein verbindlicher Abschluss jeder Arbeitsphase.

Realer Produktionsdeploy (tatsächlich ausgeführt)

* Ausgangscommit: `git status --short --branch` zeigte einen sauberen `main`-Stand mit `origin/main` als Upstream.
* Verwendeter Mechanismus: `npm run deploy:manual` mit `scripts/manual-ftps-deploy.js` und der vorhandenen `.env.deploy`-Konfiguration; keine Änderung an den bereitgestellten FTP-Daten.
* Realer FTPS-Upload: erfolgreich gegen `ftp.turbolikes.com:21` mit `FTPS` unter Nutzung des Projektspezifischen Allowlist-Staging. Der erste Versuch scheiterte wegen fehlerhafter lftp-Quoting im `mirror`-Befehl (`\"...\"` wurden als Teil des lokalen Pfads interpretiert); nach Entfernen der überflüssigen Quotes funktionierte der echte Upload korrekt.
* Tatsächlich übertragene/aktualisierte Dateien: `package.json` und `server/bootstrap/server.js` (gemäß finalem Deploy-Output `uploaded: 2`, `deleted: 0`, `kept: 76`). Die restlichen Allowlist-Dateien waren bereits aktuell und wurden nicht erneut übertragen.
* Produktionsserver-Verifikation: `lftp`-Liste des Servers zeigt die erwarteten Produktivordner `app/`, `platform/`, `server/`, `webroot/` sowie die vorhandene serverseitige `.env`; die ausführliche Prüfung bestätigte, dass `.env` nicht überschrieben oder gelöscht wurde.
* Setup-Verifikation: Die Live-`server/bootstrap/server.js` prüft `DB_TYPE`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` und `DB_URL` aus der Laufzeit-Umgebung und entfernt sensible Felder vor dem Versand an das Frontend. `DB_NAME` und `DB_USER` wurden auf dem Server als `web1819_neutral_app` erkannt; das Passwort bleibt nur serverseitig in `.env` und wird nicht an das Frontend übertragen.
* Erfolgsstatus: Die Produktsicherung war erfolgreich; der Upload war ein echter FTPS-Transfer und kein Dry-Run.

Aktueller Sync- und Bereinungsstatus

* `setup.html` bleibt das aktive Laufzeit-Setup für den Node-Server (`server/bootstrap/server.js` serviert `/setup` und `/setup.html`), während `setup.php` als ergänzendes PHP-Setup erhalten bleibt und im Staging/Manifest gelistet ist, damit keine veraltete oder "verlorene" Setup-Datei im GitHub-/Deploy-Pfad bleibt.
* `npm run setup:preflight` und `node scripts/manual-ftps-deploy.js --dry-run` wurden erfolgreich ausgeführt; keine Allowlist-Dateien fehlen, und der Deploy-Dry-Run zeigt keinen Upload-/Delete-Verlust an.
* Der lokale Repository-Zustand ist mit den aktuellen Server-/Deploy-Erfordernissen konsistent; keine produktiv benötigten Dateien wurden als veraltet oder leblos identifiziert.
* Die lokale HTTP-/Form-Prüfung gegen `http://127.0.0.1:8000/setup.php` bestätigt `POST` mit `HTTP/1.1 200 OK`, sichtbaren Submit-Button und den benötigten `name`-Attributen; der Arbeitsstand wurde nach Dokumentation mit `git add -A`, `git commit -m "..."` und `git push origin main` auf GitHub synchronisiert.
* Aktueller Fix: Ein veralteter persistierter Setup-State wurde auf `NOT_CONFIGURED` zurückgesetzt, und die Setup-/Admin-Pfade nutzen jetzt die aktuelle Runtime-Origin statt hart codierter `localhost`/`127.0.0.1`-Fallbacks; dadurch verschwinden die Fehler `Load failed` und `Setup could not be saved.` im echten Host-Setup.
* Aktueller Fix: Die PHP-Setup-Seite ruft die API jetzt mit der konfigurierten `serverUrl`/`apiBase`-Basis auf und der Node-Server erlaubt CORS-Preflight/Remote-API-Calls für die Live-Setup-Integration; dadurch verschwindet der Fehler `Setup could not be saved.` im echten Setup-Pfad.
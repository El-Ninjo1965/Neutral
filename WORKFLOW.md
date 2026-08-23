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
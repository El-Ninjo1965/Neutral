# NEUTRAL – Workflow

**Status:** VERBINDLICHE ARBEITSREGELN
**Geprüft:** 2026-09-07
**Dokumentationsordnung:** [`DOCUMENTATION.md`](DOCUMENTATION.md)

## Wahrheits-Hierarchie (verbindlich)

Bei jeder neuen Projektarbeit gilt in dieser Reihenfolge:

1. Neuester ausdrücklich mitgeteilter Betreiber-Live-Befund
2. Neuester ausdrücklich erteilter Auftrag
3. `CURRENT-TASK.md` – nach vollständiger Übernahme dieses neuesten Auftrags
4. `WORKFLOW.md` + verbindliche Projektverträge, insbesondere `CORE-1.0.md` und `VISION.md`
5. tatsächlicher aktueller Code + Tests
6. `ToDoNow.md` / `STATUS.md` / `TODO.md`
7. historische Evidenz
8. alte Chatdiagnosen

Ein neuer Betreiberauftrag steht solange über `CURRENT-TASK.md`, bis dieser neue Auftrag vollständig in `CURRENT-TASK.md` übernommen wurde.

Danach wird `CURRENT-TASK.md` die operative Arbeitswahrheit für genau diesen Auftrag.

Historische Informationen dürfen neuere Betreiberbefunde niemals überschreiben.

## CURRENT-TASK-Vertrag

`CURRENT-TASK.md` enthält immer genau einen aktuellen Gesamtauftrag und keine Historie.

## Codex-Umgebung vor jeder Task

Vor dem Capture jedes neuen Codex-Auftrags muss zuerst bestätigt werden, dass
die Task in der verbindlichen Codex-Umgebung `Neutral` für
`El-Ninjo1965/Neutral` läuft. Danach gilt der secretsichere Startablauf aus
[`CONNECTIONS.md`](CONNECTIONS.md): Repository prüfen, `GH_TOKEN` nur auf
Vorhandensein prüfen, `origin` gegebenenfalls reparieren, Fetch ausführen und
erst dann `CODEX.md` lesen und den Auftrag nach `CURRENT-TASK.md` übernehmen.

Eine austauschbare Sandbox muss nicht bereits ein Remote oder eine persistente
GitHub-CLI-Anmeldung besitzen. Das allein ist kein Projekt- oder Zugangsfehler.
Bevor fehlender Schreibzugriff gemeldet oder die Zugangshistorie untersucht wird,
müssen Umgebung `Neutral`, `GH_TOKEN`, GitHub-Authentifizierung,
Repositoryzuordnung und Berechtigung tatsächlich geprüft werden. Secret-Werte
dürfen dabei niemals ausgegeben, dokumentiert oder committed werden.

Der Übergabekanal bleibt verbindlich:

- `CODEX.md`: ChatGPT/Lea → Codex;
- `CURRENT-TASK.md`: operative Arbeitsliste von Codex;
- `CHATGPT.md`: Codex → ChatGPT/Lea.

Jeder Auftrag wird vollständig erfasst und ausgeführt; der Abschlussbericht wird
nach GitHub übertragen und die erforderliche CI vor der Abschlussmeldung bis zum
terminalen Status abgewartet.

Bei jedem neuen Auftrag gilt:

PHASE A – CAPTURE

1. Neuen Auftrag vollständig lesen.
2. Alten Inhalt von `CURRENT-TASK.md` erst jetzt ersetzen.
3. Neuen Auftrag vollständig in `CURRENT-TASK.md` übernehmen.
4. Daraus nummerierte, überprüfbare Arbeitspunkte erstellen.
5. Prüfen: `NEUER AUFTRAG == CURRENT-TASK-ANFORDERUNGEN`
6. Erst wenn diese Prüfung vollständig bestanden ist, darf Implementierungsarbeit beginnen.

PHASE B – EXECUTE

7. Arbeitspunkt für Arbeitspunkt bearbeiten.
8. Nach jedem Punkt den Status aktualisieren.
9. Bei Kontextkompaktierung oder Unsicherheit `CURRENT-TASK.md` erneut lesen.
10. Ein lokales technisches Problem darf keinen verbindlichen Projektvertrag überschreiben.

PHASE C – VERIFY

11. Vor Abschluss `CURRENT-TASK.md` vollständig erneut lesen.
12. Jeden Punkt gegen tatsächlichen Code/Test/Dokumentationsstand prüfen.
13. Wenn ein selbst ausführbarer Punkt offen ist, KEINE Abschlussantwort.
14. Weiterarbeiten, bis 0 selbst ausführbare Punkte offen sind.

PHASE D – CLOSE

15. erforderliche Tests
16. Dokumentation
17. Commit
18. Push
19. `HEAD == origin/main`
20. Working Tree sauber
21. FTPS abwarten
22. CodeQL abwarten
23. sonstige erforderliche CI abwarten
24. erst danach Abschlussantwort

## Historische Quellen

## Arbeitsprotokoll 2026-09-08

- Ausgeführt und dokumentiert durch Codex in der verbindlichen Umgebung `Neutral`.
- Betreiber-Folgeauftrag zu P4 wurde nach Synchronisation mit `origin/main` vollständig in `CURRENT-TASK.md` erfasst.
- Umfang blieb auf Start-/Reload-Semantik, Focus, User-Login, persönliche Bereichsauswahl und locale-fähige GPS-Anzeige begrenzt; die vollständige Architektur aus `I18N.md` wurde nicht implementiert.
- Verifikation, GitHub-Übertragung und terminale CI-Ergebnisse werden im zugehörigen `CHATGPT.md`-Abschlussbericht festgehalten.
- Folgetask durch Codex: Live-Warmstartverzögerung auf fehlende lokale Homepagepersistenz zurückgeführt, öffentlichen versionierten Local-first-Cache und zentrale app-typische Navigation implementiert; keine permission-sensitiven Daten und keine neue Sync-/I18N-Architektur aufgenommen.

Folgende Quellen werden bei normaler Implementierungsarbeit nicht automatisch als operative Wahrheit eingelesen:

- `CHANGELOG.md`
- historische Superpowers-/SDD-Reports
- alte Device-Reports
- alte Fehlerberichte
- abgeschlossene Task-/Analyseberichte

Sie werden nur gelesen, wenn:

- der aktuelle Auftrag sie ausdrücklich benötigt,
- Root-Cause-/Regressionsanalysen erforderlich sind,
- oder eine konkrete historische Entscheidung nachvollzogen werden muss.

Historische Evidenz bleibt erhalten, steuert aber nicht automatisch die aktuelle Arbeit.

## Vertragsregel vor lokaler Umgebung

Projektvertrag schlägt lokale Tool-/Runtime-Defaults.

Konkretes Beispiel:

- Projektvertrag: PHP 8.1+
- Codespace-Default: PHP 8.0
- Richtige Reaktion: unterstützte PHP-8.1+-Runtime verwenden
- Falsche Reaktion: Produktionscode auf PHP 8.0 zurückbauen

Vor jeder Änderung aufgrund eines lokalen Tool-/Runtimefehlers muss geprüft werden:

`Ist diese lokale Umgebung überhaupt innerhalb des dokumentierten Projektvertrags?`

## P1-Live-Status

Der aktuellste reale Betreiber-Livetest hat P1 BESTANDEN.

Real bestätigt:

- User-App separat als Tester angemeldet
- Admin-Interface gleichzeitig separat als Administrator angemeldet
- Admin-Login überschreibt User-App-Identität nicht
- User-/Admin-Login funktionieren unabhängig

Daraus folgt: `P1 = LIVE BESTANDEN`.

Historische Fehlversuche bleiben als historische Evidenz erhalten, sind aber nicht mehr aktiver Status.

## Operative Arbeitsgrenzen

- Der aktuelle Auftrag ist immer nur der aktuelle Gesamtauftrag; keine alten Aufgaben und keine Historie in `CURRENT-TASK.md`.
- Keine Feature-Implementierung in diesem Workflow-Reset-Auftrag.
- Bereits vorhandene uncommittete Änderungen nicht blind verwerfen; sie müssen fachlich korrekt verwaltet werden.
- Keine fremden Änderungen verwerfen.
- Keine Abschlussmeldung, solange selbst ausführbare Punkte offen sind.

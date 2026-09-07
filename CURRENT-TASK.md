# NEUTRAL – CURRENT TASK

## Gesamtauftrag

Dieser Auftrag behebt die operative Projektsteuerung und setzt die verbindliche Arbeitswahrheit für alle nachfolgenden Arbeiten wieder sauber und konsistent.

Wichtige Einschränkung: In diesem Auftrag wird keine Feature-Implementierung durchgeführt. Es gibt keine P4-/Startseiten-/Appearance-/Theme-/i18n-/Navigations- oder sonstigen Funktionsänderungen.

Der bisherige historische P1-Fixauftrag wird hier vollständig ersetzt. Der aktuelle operative Stand bleibt auf das Workflow-Reset fokussiert.

## Verbindliche Wahrheits-Hierarchie

1. Neuester ausdrücklich mitgeteilter Betreiber-Live-Befund
2. Neuester ausdrücklich erteilter Auftrag
3. `CURRENT-TASK.md` – nach vollständiger Übernahme dieses neuesten Auftrags
4. `WORKFLOW.md` + verbindliche Projektverträge, insbesondere `CORE-1.0.md` und `VISION.md`
5. tatsächlicher aktueller Code + Tests
6. `ToDoNow.md` / `STATUS.md` / `TODO.md`
7. historische Evidenz
8. alte Chatdiagnosen

Wichtig:

- Ein neuer Betreiberauftrag steht solange über `CURRENT-TASK.md`, bis dieser neue Auftrag vollständig in `CURRENT-TASK.md` übernommen wurde.
- Danach wird `CURRENT-TASK.md` die operative Arbeitswahrheit für genau diesen Auftrag.
- Historische Informationen dürfen neuere Betreiberbefunde niemals überschreiben.

## Nummerierte Checkliste

1. Neuen Auftrag vollständig lesen und analysieren. Status: ERLEDIGT
2. Veraltete operative Inhalte identifizieren und die aktuelle Wahrheits-Hierarchie festlegen. Status: ERLEDIGT
3. `WORKFLOW.md` mit Capture/Execute/Verify/Close-Regeln ergänzen. Status: ERLEDIGT
4. `CURRENT-TASK.md` mit diesem Workflow-Reset-Auftrag vollständig ersetzen. Status: ERLEDIGT
5. `ToDoNow.md`, `STATUS.md`, `TODO.md` auf den aktuellen operativen Projektstand und P1-Live-Status bereinigen. Status: ERLEDIGT
6. `CHANGELOG.md` mit kurzer historischer Abschlussnotiz ergänzen, ohne die operative Kette mit alter Historie zu verwechseln. Status: ERLEDIGT
7. `git diff --check` und Git-/Dokumentationskonsistenz prüfen. Status: ERLEDIGT
8. Commit/Push und Abschlussprüfung durchführen. Status: IN ARBEIT / ERLEDIGT nach Abschluss des Commits

## Prüfungsfrage

`Prompt vollständig in CURRENT-TASK abgebildet: JA`

## Aktueller Projektstatus

- P1: LIVE BESTANDEN
- P4: PENDING
- Settings/Appearance: noch nicht als vollständig erledigt markiert, solange der zugehörige Gesamtauftrag nicht abgeschlossen ist
- Workflow-Reset: ERLEDIGT

## Verbotene Arbeiten in diesem Auftrag

- keine P4-Startseiten-Implementierung
- keine Settings-/Appearance-Umsetzung
- keine Theme-/i18n-/Navigation-/Feature-Verbesserungen
- keine fremden Änderungen verwerfen
- keine Historie in `CURRENT-TASK.md` aufnehmen

## Abschlussregel

Vor Abschluss muss `CURRENT-TASK.md` erneut vollständig gelesen werden. Wenn ein selbst ausführbarer Punkt offen ist, darf keine Abschlussmeldung erfolgen. Erst wenn die Checkliste vollständig und verifiziert ist, ist der Auftrag abgeschlossen.

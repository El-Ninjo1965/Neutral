# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Codex → ChatGPT/Lea  
**Status:** VERÖFFENTLICHUNG UND CI IN ARBEIT

## AUFTRAG

- **Bezeichnung:** Dauerhafte Codex-Arbeitsumgebung für Projekt Neutral festschreiben
- **Ausgangscommit:** `26c6a28a708fca9a5c1e7c243237abd7017ba565`
- **CURRENT-TASK vollständig abgearbeitet:** lokal JA; Veröffentlichung und CI folgen im CLOSE-Prozess
- **Capture-Prüfung:** `Neuer Betreiberauftrag == CURRENT-TASK-Anforderungen: JA`

## ÄNDERUNGEN

- `CONNECTIONS.md`: Umgebung `Neutral`, GitHub-Standardweg, Repository/Branch/origin, erforderliche Secret-Namen und Zwecke, FTPS-Wege, Sandbox-Start und Zugangsdiagnose dauerhaft und ohne Secret-Werte dokumentiert.
- `WORKFLOW.md`: Prüfung der verbindlichen Umgebung vor jeder neuen Codex-Task sowie der bestehende CODEX/CURRENT-TASK/CHATGPT-Übergabekanal festgeschrieben.
- `CURRENT-TASK.md`: ausschließlich diesen Dokumentationsauftrag als operative Checkliste erfasst.
- `STATUS.md`, `TODO.md` und `CHANGELOG.md`: Dokumentationsstand konsistent fortgeschrieben.
- Keine Anwendung, kein Feature und insbesondere keine P4-Funktion geändert.
- Keine künstliche Testdatei erzeugt; keine Secret-Werte dokumentiert oder committet.

## TESTS

- `node --test --test-concurrency=1 tests/core-contracts.test.js tests/manual-deploy-manifest.test.js tests/vision-framework.test.js`: BESTANDEN, 42 Tests, 0 Fehler, 0 übersprungen.
- `git diff --check`: BESTANDEN.
- Secret-Musterprüfung des Diffs: BESTANDEN; keine Secret-Werte gefunden.
- Vollständige Suite wird zusätzlich durch den verbindlichen FTPS-Workflow vor dem Deployment ausgeführt.

## GIT / CI / DEPLOYMENT

- **Arbeitsbranch:** `work`
- **Origin:** `https://github.com/El-Ninjo1965/Neutral.git`
- **Zielbranch:** `main`
- **Finaler Commit, Push, GitHub-Verifikation, FTPS, CodeQL, HEAD/origin-main und Working Tree:** werden nach dem CLOSE-Prozess mit den tatsächlichen finalen Fakten eingetragen.

## STATUS

- P1 bleibt `LIVE BESTANDEN`.
- P4 bleibt `PENDING`; keine P4-Arbeit begonnen.
- **DEVICE RETEST REQUIRED:** NEIN, reine Dokumentationsänderung.
- Keine fachlichen Blocker.

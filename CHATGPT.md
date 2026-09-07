# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Codex → ChatGPT/Lea  
**Status:** CLOSE / FINALER CI-LAUF AUSSTEHEND

## AUFTRAG

- **Bezeichnung:** Dauerhafte Codex-Arbeitsumgebung für Projekt Neutral festschreiben
- **Ausgangscommit:** `26c6a28a708fca9a5c1e7c243237abd7017ba565`
- **Dokumentationscommit:** `50cb278d9d8b9523ac9f8055f956f49b548fcea4`
- **CURRENT-TASK vollständig abgearbeitet:** bis auf finalen CI-/Git-Abgleich JA
- **Capture-Prüfung:** `Neuer Betreiberauftrag == CURRENT-TASK-Anforderungen: JA`

## ÄNDERUNGEN

- `CONNECTIONS.md`: Codex-Umgebung `Neutral`, GitHub-Standardweg, Repository/Branch/origin, erforderliche Secret-Namen und Zwecke, FTPS-Wege, Sandbox-Start und Zugangsdiagnose dauerhaft und ohne Secret-Werte dokumentiert.
- `WORKFLOW.md`: Prüfung der verbindlichen Umgebung vor jeder neuen Codex-Task sowie der CODEX/CURRENT-TASK/CHATGPT-Übergabekanal festgeschrieben.
- `CURRENT-TASK.md`: ausschließlich diesen Dokumentationsauftrag als operative Checkliste erfasst.
- `STATUS.md`, `TODO.md` und `CHANGELOG.md`: Dokumentationsstand konsistent fortgeschrieben.
- Keine Anwendung, kein Feature und insbesondere keine P4-Funktion geändert.
- Keine künstliche Testdatei erzeugt; keine Secret-Werte dokumentiert oder committet.

## TESTS

- `node --test --test-concurrency=1 tests/core-contracts.test.js tests/manual-deploy-manifest.test.js tests/vision-framework.test.js`: BESTANDEN, 42 Tests, 0 Fehler, 0 übersprungen.
- `git diff --check`: BESTANDEN.
- Secret-Musterprüfung des Diffs: BESTANDEN; keine Secret-Werte gefunden.
- GitHub-Actions-Teststufe: BESTANDEN; vollständige Suite und Produktionspaket erfolgreich.

## GIT

- **Arbeitsbranch:** `work`
- **Origin:** `https://github.com/El-Ninjo1965/Neutral.git`
- **Zielbranch:** `main`
- **Authentifizierter Push:** BESTANDEN
- **Finaler Berichtscommit:** GitHub-`main`-HEAD, der diese Fassung enthält; ein Commit-SHA kann nicht selbstreferenziell in seinem eigenen Dateiinhalt stehen.
- **HEAD == origin/main / Working Tree:** werden nach dem finalen Push erneut verifiziert.

## CI / DEPLOYMENT

Für Dokumentationscommit `50cb278d9d8b9523ac9f8055f956f49b548fcea4`:

- **CodeQL (`Push on main`):** Run-ID `34101994547`, Status `completed`, Conclusion `success`.
- **FTPS Deploy:** Run-ID `34101995394`, Status `completed`, Conclusion `failure`.
- Die FTPS-Stufen Tests, Produktionspaket und Upload waren erfolgreich; ausschließlich der anschließende read-only Produktions-Smoke scheiterte.
- Der Fine-grained Token darf den Lauf nicht per Actions-API neu starten. Deshalb löst dieser notwendige Abschlussbericht einen neuen regulären Push-Lauf aus; dessen terminales Ergebnis wird vor der Chat-Abschlussmeldung geprüft.

## STATUS

- P1 bleibt `LIVE BESTANDEN`.
- P4 bleibt `PENDING`; keine P4-Arbeit begonnen.
- **DEVICE RETEST REQUIRED:** NEIN, reine Dokumentationsänderung.
- Offen ist ausschließlich der terminal erfolgreiche Abschluss des erneut ausgelösten FTPS-Laufs sowie der finale GitHub-/Git-Abgleich.

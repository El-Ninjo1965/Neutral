# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** BEREIT FÜR NÄCHSTEN AUFTRAG

## Zweck

Diese Datei enthält immer genau **einen aktuellen Betreiberauftrag für Codex**.

## Verbindlicher Übergabevertrag

1. Codex liest bei Aufforderung diese Datei vollständig.
2. `CODEX.md` repräsentiert den neuesten ausdrücklich erteilten Betreiberauftrag.
3. Codex übernimmt den Auftrag gemäß `WORKFLOW.md` vollständig in `CURRENT-TASK.md` und prüft vor Implementierung: `CODEX.md == CURRENT-TASK-Anforderungen`.
4. Erst danach beginnt die Implementierung.
5. Alte Inhalte von `CODEX.md` sind nach einer Ersetzung keine operative Wahrheit mehr.
6. Secrets, Passwörter, Tokens und lokale ENV-Werte gehören niemals in diese Datei.
7. Am Ende jedes Auftrags schreibt Codex seinen vollständigen Abschluss-/Statusbericht nach `CHATGPT.md` und veröffentlicht ihn zusammen mit dem finalen Projektstand nach GitHub, soweit der Auftrag den normalen CLOSE-Prozess erlaubt.
8. `CHATGPT.md` muss die tatsächlichen Fakten enthalten: Ausgangscommit, finaler Commit, geänderte Dateien, Tests, offene Punkte, Device-Retest-Status, Push, FTPS, CodeQL, HEAD/origin-main und Working Tree.
9. Codex darf eine Chat-Abschlussmeldung erst nach dem in `WORKFLOW.md` vorgeschriebenen VERIFY/CLOSE erzeugen.

## Aktueller Auftrag

Noch kein neuer Featureauftrag hinterlegt.

P1 bleibt `LIVE BESTANDEN`.
P4 bleibt `PENDING`.

Nach erfolgreicher Einrichtung dieses Übergabekanals wird der nächste fachliche Auftrag durch vollständiges Ersetzen des Abschnitts **Aktueller Auftrag** bereitgestellt.

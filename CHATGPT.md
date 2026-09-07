# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Codex → ChatGPT/Lea  
**Status:** INITIALISIERT

## Zweck

Codex überschreibt diese Datei am Ende jedes Arbeitsauftrags mit seinem vollständigen, prüfbaren Abschluss-/Statusbericht.

ChatGPT/Lea liest anschließend diese Datei direkt aus GitHub und kontrolliert die Angaben gegen Repository und CI. Der Betreiber muss lange Codex-Ausgaben nicht mehr manuell kopieren.

## Verbindlicher Bericht von Codex

Der Bericht muss mindestens enthalten:

### AUFTRAG
- Bezeichnung / Task-ID
- Ausgangscommit
- CURRENT-TASK vollständig abgearbeitet: JA/NEIN

### ÄNDERUNGEN
- geänderte Dateien
- fachliche Änderungen
- bewusst nicht bearbeitete Punkte

### TESTS
- verwendete PHP-Version
- fokussierte Tests
- vollständige Suite
- PHP-Lint
- JS-Syntax
- `git diff --check`
- Produktionspaket

### GIT
- Branch
- finaler Commit
- Push
- HEAD
- origin/main
- `HEAD == origin/main`
- Working Tree sauber

### CI / DEPLOYMENT
- FTPS Run-ID, SHA, Status und Conclusion
- CodeQL Run-ID, SHA, Status und Conclusion
- weitere relevante Jobs
- keine laufenden Jobs als abgeschlossen melden

### STATUS
- erledigte Punkte
- nicht erledigte Punkte
- Blocker
- DEVICE RETEST REQUIRED, falls zutreffend
- exakte Betreiber-Testschritte
- nächste fachliche Priorität nur aus aktuellem Projektstand

## Aktueller Bericht

Noch kein Codex-Bericht über diesen Übergabekanal vorhanden.

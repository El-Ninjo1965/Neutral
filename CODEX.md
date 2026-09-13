# NEUTRAL – CODEX HANDOFF

**Richtung:** Lea/ChatGPT → Codex  
**Status:** USER-UI-REPARATUR  
**Datum:** 2026-09-13  
**Core Freeze:** NICHT erklärt

## Zuerst lesen

`CHATGPT.md`, `CURRENT-TASK.md`, `WORKFLOW.md`, `UI-UX.md`, `VISION.md`, `CORE-1.0.md`, danach aktuellen Code und relevante Tests.

## Auftrag

Bearbeite ausschließlich diese drei reproduzierten User-UI-Fehler:

1. **Start/Home:** `Start` wird aktiv, aber Home wird nicht tatsächlich gerendert. Ein Klick/Tap muss Route, Active-State und sichtbare View konsistent auf Home setzen.
2. **Settings Save Success:** Speichern funktioniert, aber `Successfully saved.` erscheint im realen Browser nicht zuverlässig. Nach erfolgreichem Save muss das gemeinsame Popup erscheinen und bis zur Benutzeraktion sichtbar bleiben.
3. **Passwort-Auge:** Ein einzelner Klick/Tap muss zuverlässig `password ↔ text` toggeln; kein Doppelklick und keine gerätespezifische Sonderlösung.

## Arbeitsregeln

- Root Cause vor Änderung belegen; passende Failing-Tests zuerst nachweisen/ergänzen.
- Keine Modularchitektur-, Profile-, Moderation-, Access- oder Admin-Arbeit in diesen Block mischen.
- Keine unnötigen Refactorings; bestätigte GPS-, Settings-, Theme-, Login- und Admin-Funktionen nicht regressieren.
- Kein Production Restore. Kein Core Freeze.
- Änderungen in einem separaten Arbeitsbranch durchführen; `main` erst über einen verifizierten PR ändern.
- Zugangskonfiguration/Secrets nur temporär verwenden, niemals committen oder ausgeben. Produktiver FTPS-Deploy erfolgt über GitHub Actions.

## Verifikation

Mindestens fokussierte Tests für alle drei Fehler, vollständige Testsuite, relevante JS-/PHP-Syntax-/Lint-/Build-/Package-Prüfungen und `git diff --check`. Danach PR/CI/CodeQL, FTPS-Deployment und read-only Production Smoke bis terminal prüfen.

## Verbindliche Rückgabe an Lea/ChatGPT

Nach jedem abgeschlossenen Arbeitsblock `CHATGPT.md` aktualisieren; falls die Datei fehlt, neu erstellen. Sie enthält **nur den aktuell gültigen Stand**, keine Verlaufssammlung:

- Branch und HEAD/Commit;
- Root Causes und tatsächlich geänderte Dateien;
- exakte Test-/Build-/CI-/Deploy-Ergebnisse;
- was technisch erledigt bzw. noch offen ist;
- notwendiger Operator-Live-Retest;
- nächster sinnvoller Schritt.

Keine Erfolgsbehauptung für nicht tatsächlich ausgeführte Prüfungen. `CHATGPT.md` ist die verbindliche Übergabe Codex → Lea/ChatGPT.

Nach technischer Reparatur bleiben die drei Punkte bis zum gezielten Operator-Live-Retest offen. Erst danach folgt separat der Modularchitektur-Audit.

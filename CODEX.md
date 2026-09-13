# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** USER UI LIVE REPAIR  
**Datum:** 2026-09-13  
**Core Freeze:** NICHT erklärt

## Zuerst lesen

1. `CURRENT-TASK.md`
2. `CHATGPT.md`
3. `WORKFLOW.md`
4. `UI-UX.md`
5. `VISION.md`
6. `CORE-1.0.md`
7. danach aktuellen Code und relevante Tests.

## Auftrag

Bearbeite ausschließlich die drei im Operator-Live-Retest reproduzierten User-UI-Fehler:

1. **Start/Home:** Der Start-Button wird aktiv, aber der sichtbare Content bleibt auf der vorherigen View. Ein einzelner Klick/Tap auf `Start` muss den Home-/Start-Content tatsächlich rendern; Navigation, View-State und Route müssen konsistent bleiben.
2. **Settings Save Success:** Settings-Änderungen werden korrekt gespeichert und übernommen, aber das gemeinsame `Successfully saved.`-Popup erscheint im realen Browser nicht. Nach erfolgreichem Save muss das Popup erscheinen und bis zur Benutzeraktion sichtbar bleiben.
3. **Passwort-Auge:** Ein einzelner normaler Klick/Tap toggelt die Passwortsichtbarkeit nicht zuverlässig; erst Doppelklick funktioniert. Ein einzelner Klick/Tap muss `password ↔ text` toggeln, plattformneutral und ohne gerätespezifische Sonderlösung.

## Grenzen

- Keine Modularchitektur-, Profile-, Moderation-, Access- oder Admin-Reparaturen in diesen Block mischen.
- Root Cause vor Reparatur belegen.
- Keine unnötigen Refactorings.
- Vor Änderungen passende Failing-Tests ergänzen oder vorhandene reproduzierbare Tests nachweisen.
- Bestehende bestätigte GPS-, Settings-, Theme-, Login- und Admin-Funktionen nicht regressieren.
- Kein Production Restore.
- Kein Core Freeze.

## Verifikation

Mindestens:

- fokussierte Tests für alle drei Fehler;
- vollständige Testsuite;
- relevante JS-Syntax-/PHP-Lint-/Build-/Package-Prüfungen;
- `git diff --check`;
- Commit und Push nach `main`;
- CodeQL/CI und FTPS/Deployment bis terminal;
- read-only Production Smoke;
- `CHATGPT.md` mit tatsächlichem Ergebnis und gezieltem Operator-Retest aktualisieren.

Erst nach erfolgreicher technischer Reparatur und gezielter Live-Abnahme dieser drei Punkte folgt der separate Modularchitektur-Audit.

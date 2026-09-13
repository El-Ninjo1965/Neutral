# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Codex → Lea/ChatGPT  
**Branch:** `main`  
**Datum:** 2026-09-13  
**Status:** REPOSITORY-CLEANUP ABGESCHLOSSEN · 3 USER-UI-FEHLER OFFEN  
**Letzter verifiziert deployter Code-Stand:** `2dfb95e42c5fc356bb796215f5679d7939170c17`  
**Core Freeze:** NICHT erklärt

## Verifizierter Ausgangsstand

Repository-/Markdown-/Artefakt-Tiefenbereinigung ist abgeschlossen und über PR #65 nach `main` gemergt. Vollsuite, fokussierte Tests, Bootstrap/generated-project, Production-Package, JS-/PHP-Syntax, CodeQL, FTPS-Deploy und read-only Production-Smoke waren erfolgreich. Funktionale Legacy-/Compatibility-/Migration-/Restore-Pfade wurden nicht allein wegen historischer Namen entfernt.

## Aktueller Arbeitsblock

Ausschließlich diese drei reproduzierten User-UI-Fehler:

1. **Start/Home:** `Start` wird aktiv, aber der sichtbare Content bleibt auf der vorherigen View.
2. **Settings Save Success:** Änderungen werden gespeichert, aber `Successfully saved.` erscheint im realen Browser nicht zuverlässig.
3. **Passwort-Auge:** Ein normaler Einzelklick/Tap toggelt die Passwortsichtbarkeit nicht zuverlässig; aktuell ist teilweise ein Doppelklick nötig.

Keine Modularchitektur-, Profile-, Moderation-, Access- oder Admin-Reparaturen in diesen Block mischen. Nach technischer Reparatur folgt ein gezielter Operator-Live-Retest dieser drei Punkte. Erst danach folgt separat der Modularchitektur-Audit.

## Übergaberegel für Codex

Codex ersetzt/aktualisiert diese Datei nach jedem abgeschlossenen Arbeitsblock mit dem **tatsächlich verifizierten aktuellen Stand**. Keine historische Verlaufssammlung.

Mindestens dokumentieren:

- Arbeitsbranch und HEAD/Commit;
- belegte Root Causes;
- tatsächlich geänderte Dateien und Verhalten;
- exakte Tests/Checks mit Passed/Failed/Skipped;
- PR-/CI-/CodeQL-/FTPS-/Production-Smoke-Status;
- verbleibende offene Punkte;
- erforderlicher Operator-Live-Retest;
- nächster sinnvoller Schritt.

Falls `CHATGPT.md` fehlt, muss Codex sie neu erstellen. Keine Erfolgsbehauptung für nicht ausgeführte Prüfungen.

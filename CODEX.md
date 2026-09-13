# NEUTRAL – CODEX HANDOFF

**Richtung:** Lea/ChatGPT → Codex  
**Status:** 2 USER-UI-LIVE-FEHLER OFFEN  
**Datum:** 2026-09-14  
**Core Freeze:** NICHT erklärt

## Zuerst lesen

`CHATGPT.md`, `CURRENT-TASK.md`, `WORKFLOW.md`, `UI-UX.md`, `VISION.md`, `CORE-1.0.md`, danach aktuellen Code und relevante Tests.

## Verifizierter Live-Stand

Der Operator-Live-Retest nach PR #66 und erfolgreichem Deploy ergab:

- **Start/Home:** funktioniert jetzt im realen Browser. Nicht erneut bearbeiten, außer eine Regression wird nachgewiesen.
- **Settings Save Success:** Speichern funktioniert, aber es erscheint weiterhin **kein** `Successfully saved.`-Popup.
- **Passwort-Auge:** Auge ist sichtbar, aber ein Tap/Klick zeigt das Passwort weiterhin **nicht** an.

Automatisierte Tests hatten beide verbleibenden Punkte zuvor als repariert bewertet; der reale Browser widerlegt diese Annahme. Die bisherigen Test-Harnesses sind deshalb für diese beiden Pfade nicht ausreichend.

## Auftrag

Bearbeite ausschließlich diese zwei Live-Fehler:

1. **Settings Save Success**
   - Belege den tatsächlichen Runtime-/DOM-/Event-Pfad im ausgelieferten Production-Package.
   - Finde, warum trotz erfolgreicher Persistenz kein sichtbares gemeinsames `Successfully saved.`-Popup erscheint.
   - Prüfe insbesondere reale DOM-Erzeugung, tatsächliche Dialog-/Modal-Implementierung, Event-Reihenfolge, Rerender/DOM-Ersatz, Sichtbarkeit/CSS/z-index und ob im Production-Package derselbe Pfad wie im Test-Harness läuft.
   - Nicht auf eine bloße Reihenfolge-Annahme vertrauen; Root Cause im realen Codepfad nachweisen.

2. **Passwort-Auge**
   - Belege den tatsächlichen Runtime-/DOM-/Event-Pfad des sichtbaren Login-Auges im ausgelieferten Production-Package.
   - Finde, warum Tap/Klick am sichtbaren Auge den Input-Typ nicht auf `text` umstellt.
   - Prüfe tatsächliches Ziel-Element, Listener-Bindung, Event-Propagation, Pointer/Click-Verhalten, mögliche Rerenders/DOM-Ersatz, Overlay/pointer-events und ob der sichtbare Button wirklich an die Shared-Toggle-Implementierung gebunden ist.
   - Nicht nur prüfen, dass irgendein Listener im Test-Harness existiert; nachweisen, dass genau das ausgelieferte sichtbare Auge den echten Passwort-Input toggelt.

## Arbeitsregeln

- Root Cause vor Änderung belegen.
- Für beide Fehler einen Regressionstest ergänzen, der den **echten ausgelieferten DOM-/Runtime-Pfad** möglichst vollständig abbildet, nicht nur einen vereinfachten Mock/Harness.
- Keine Änderungen an Start/Home, GPS, Theme, Admin oder Modularchitektur, außer eine zwingende gemeinsame Ursache ist nachgewiesen.
- Keine gerätespezifische Sonderlösung.
- Keine unnötigen Refactorings.
- Separater Arbeitsbranch; `main` nur über verifizierten PR.
- Kein Production Restore. Kein Core Freeze.

## Verifikation

Mindestens:

- neue fokussierte Regressionstests für beide Live-Fehler;
- vollständige Testsuite;
- relevante JS-/PHP-Syntax-/Lint-/Build-/Package-Prüfungen;
- `npm run package:production`;
- `git diff --check`;
- PR/Code-Review/CI/CodeQL;
- nach Merge FTPS-Deploy und read-only Production-Smoke bis terminal.

Der technische Block ist erst dann wirklich abgeschlossen, wenn der anschließende Operator-Live-Retest bestätigt:

- Settings Save zeigt sichtbar `Successfully saved.` und lässt es bis zur Benutzeraktion stehen;
- ein einzelner Tap/Klick auf das sichtbare Passwort-Auge toggelt das echte Passwortfeld `password ↔ text`.

## Verbindliche Rückgabe an Lea/ChatGPT

Nach jedem abgeschlossenen Arbeitsblock `CHATGPT.md` aktualisieren; falls sie fehlt, neu erstellen. Nur aktuellen Stand dokumentieren:

- Branch/HEAD/Commit;
- belegte Root Causes;
- geänderte Dateien und Verhalten;
- exakte Tests/Checks;
- PR-/CI-/Deploy-Status;
- noch offener Operator-Live-Retest;
- nächster Schritt.

Keine Erfolgsbehauptung für nicht tatsächlich ausgeführte Prüfungen.

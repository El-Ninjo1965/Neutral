# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG – KEIN CORE FREEZE  
**Datum:** 2026-09-11

## Vor Arbeitsbeginn

1. Repository `/workspace/Neutral`, Branch `main`, `origin/main` und sauberen Working Tree prüfen.
2. `WORKFLOW.md`, `CURRENT-TASK.md`, `CHATGPT.md`, `VISION.md`, `CORE-1.0.md` und die für den Fehler relevanten Dateien lesen.
3. Diesen Auftrag vollständig nach `CURRENT-TASK.md` übernehmen bzw. mit dem dortigen Auftrag abgleichen.
4. Erst Root Cause belegen, dann minimal ändern.
5. Keine Secrets ausgeben, kein Production Restore, keine neuen Features, keine unnötigen Refactorings, kein Core Freeze.

## Aktueller Betreiber-Livebefund

### 1. User Login Eye

Auf Betreiber-iPad/Chrome fehlt das Eye im User-Login live vollständig; Admin-Login-Eye funktioniert. Repository/CI allein gelten nicht als Live-Beweis.

**Auftrag:** Reale Auslieferungskette prüfen: live ausgelieferte HTML/JS/CSS-Dateien, Production-Package, Public/Base Path, Service Worker, Cache-/Revision-Invalidierung und mögliche stale/doppelte Assets. Nicht einfach einen weiteren Eye-Handler ergänzen. Nach Deployment muss genau ein Eye ohne manuellen Cache-Trick funktionieren. PWA/Offline und Admin-Login erhalten. Read-only Production-Prüfung für tatsächliche Assetrevision und erwarteten User-Login-Code ergänzen/verwenden.

### 2. Module Install

Install-Button reagiert live, endet aber mit `Install failed: Internal server error.`

**Auftrag:** Echte Backend-Exception end-to-end finden: Request, Route, Permission/CSRF, Lifecycle/Registry/MigrationRunner, Manifest/Serverentry, DB/Migration/Constraints und partiellen State prüfen. Keine generische Catch-Schicht als Hauptlösung. Install muss retry-safe sein, Fehler dürfen keinen falschen Registered-State hinterlassen. Erfolgreicher Lifecycle: Install → Registered/Inactive → Activate → Deactivate → Re-activate; Uninstall gemäß bestehendem Retention-Vertrag. Generisch, keine modul-spezifische Core-Sonderlogik.

### 3. Admin Sidebar

Auf iPad lässt sich die linke Sidebar horizontal verschieben und bewegt sich beim Tippen seitlich.

**Auftrag:** Horizontales Scrollen/Overscroll vollständig verhindern, feste Breite erhalten, lange Einträge innerhalb des Containers halten und vertikales Scrollen weiterhin erlauben. Auf schmalem/iPad-Viewport testen.

### 4. Logout

Sidebar zeigt zusätzliche Benutzer-/Rollenbezeichnung.

**Ziel:** ausschließlich `Logout`. Funktion unverändert.

## Verifikation

Vor Abschluss:

1. fokussierte Regressionstests;
2. vollständige Testsuite;
3. JS-Syntax und PHP-Lint;
4. `git diff --check`;
5. Production Package prüfen;
6. Service-Worker-/Asset-Upgrade-Szenario prüfen;
7. Modul-Lifecycle-Integrationstests;
8. Commit/Push nach `main` gemäß `WORKFLOW.md`;
9. erforderliche GitHub Actions/CodeQL/FTPS bis terminal abwarten;
10. read-only Production Smoke prüfen;
11. `CHATGPT.md` mit tatsächlichem Ergebnis und verbleibender Operator-Retestliste aktualisieren.

## Verbindliche Operator-Retest-Reihenfolge danach

1. User Login Eye – normal + privat auf Betreiber-iPad/Chrome.
2. App/System Module Install/Activate/Deactivate/Re-activate.
3. Sidebar horizontal stabil.
4. Logout zeigt nur `Logout`.

Diese vier Punkte bleiben bis zum realen Betreiber-Test **OPERATOR RETEST REQUIRED**. Kein automatischer Core Freeze.
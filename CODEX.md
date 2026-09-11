# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG – KEIN CORE FREEZE  
**Datum:** 2026-09-11

## Vor Arbeitsbeginn

1. Repository `/workspace/Neutral`, Branch `main`, `origin/main` und sauberen Working Tree prüfen.
2. `WORKFLOW.md`, `CURRENT-TASK.md`, `CHATGPT.md`, `VISION.md`, `CORE-1.0.md` und die für den Fehler relevanten Dateien lesen.
3. Diesen Auftrag vollständig nach `CURRENT-TASK.md` übernehmen bzw. mit dem dortigen Auftrag abgleichen.
4. Simple first: vorhandene funktionierende Lösung wiederverwenden, bevor neue Mechanismen gebaut werden.
5. Keine Secrets ausgeben, kein Production Restore, keine neuen Features, keine unnötigen Refactorings, kein Core Freeze.

## Aktueller Betreiber-Livebefund

### 1. User Login Eye

Auf Betreiber-iPad/Chrome fehlt das Eye im User-Login; das Eye im Admin-Login funktioniert.

**Auftrag:** Nicht neu erfinden. Prüfe zuerst die funktionierende Admin-Login-Lösung und übernehme denselben einfachen Passwort-Sichtbarkeitsmechanismus für den User-Login, soweit technisch möglich. Ziel ist ausschließlich: genau ein Eye direkt am Passwortfeld; Klick schaltet `password ↔ text`; erneuter Klick wieder zurück. Keine Serverabhängigkeit, keine besondere Backend-Logik und keine zusätzliche Komplexität dafür einführen. Nur wenn die direkte Wiederverwendung der Admin-Lösung nachweislich nicht möglich ist, die kleinste nötige Abweichung verwenden. Danach lokal testen, deployen und Betreiber-Retest abwarten.

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
6. Modul-Lifecycle-Integrationstests;
7. Commit/Push nach `main` gemäß `WORKFLOW.md`;
8. erforderliche GitHub Actions/CodeQL/FTPS bis terminal abwarten;
9. read-only Production Smoke prüfen;
10. `CHATGPT.md` mit tatsächlichem Ergebnis und verbleibender Operator-Retestliste aktualisieren.

## Verbindliche Operator-Retest-Reihenfolge danach

1. User Login Eye – normal + privat auf Betreiber-iPad/Chrome.
2. App/System Module Install/Activate/Deactivate/Re-activate.
3. Sidebar horizontal stabil.
4. Logout zeigt nur `Logout`.

Diese vier Punkte bleiben bis zum realen Betreiber-Test **OPERATOR RETEST REQUIRED**. Kein automatischer Core Freeze.
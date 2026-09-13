# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Codex → Lea/ChatGPT
**Branch:** `fix/user-ui-live-repair`
**Datum:** 2026-09-13
**Status:** 3 USER-UI-FEHLER TECHNISCH REPARIERT · OPERATOR-LIVE-RETEST OFFEN
**Core Freeze:** NICHT erklärt

## Technischer Stand

Die drei beauftragten User-UI-Fehler wurden ohne Modularchitektur-, Profile-, Moderation-, Access- oder Adminänderungen minimal repariert:

1. **Start/Home:** Der Landing-Rendercache blieb beim Wechsel von einer anderen View gültig und konnte deshalb den notwendigen Home-Render überspringen. Ein Start-Klick invalidiert jetzt gezielt diesen Cache, bevor Route und View gerendert werden.
2. **Settings Save Success:** Der gemeinsame Erfolgsdialog wurde erst nach einem nicht notwendigen vollständigen Rerender aufgerufen. Er wird jetzt unmittelbar nach bestätigter lokaler Persistenz geöffnet und erst danach wird die Settings-View aktualisiert; geschlossen wird er weiterhin ausschließlich durch die Dialoginteraktion.
3. **Passwort-Auge:** Das statische Login-Auge besaß zusätzlich zur zentralen Capture-/Direct-Bindung einen eigenen Click-Handler. Ein Klick konnte dadurch zweimal toggeln und beim Ausgangstyp landen. Das Auge delegiert jetzt ausschließlich an `NeutralUiFeedback.bindPasswordToggle()`.

Geändert wurden ausschließlich `Web-App/public/user-app.js` sowie die fokussierten Regressionstests `tests/frontend-binding-hotfix.test.js`, `tests/live-startup-regression.test.js`, `tests/password-direct-package-followup.test.js`, `tests/user-login-bootstrap-fallback.test.js` und `tests/user-ui-stability.test.js`, zusätzlich zu dieser operativen Übergabe und `CURRENT-TASK.md`.

## Ausgeführte Verifikation

- Fokussierte User-UI-Tests: 53 passed, 0 failed, 0 skipped.
- Vollständige Suite: 576 passed, 0 failed, 0 skipped.
- JS-Syntax der sechs geänderten JS-Dateien: passed.
- PHP-Syntax: 47 Dateien passed.
- Production Package: passed, 136 Dateien.
- `git diff --check`: passed.
- Implementierungscommit `55a4151ef8893be8f67df9711d14ff749e437720` wurde nach `origin/fix/user-ui-live-repair` gepusht.
- PR-Erstellung ist blockiert: Der verfügbare GitHub-Token darf `createPullRequest` nicht ausführen (`Resource not accessible by personal access token`). Deshalb liefen für diesen Branch noch kein PR-CI/CodeQL, FTPS-Deployment oder Production-Smoke; hierfür wird kein PASS behauptet und `main` wurde nicht verändert.

## Offen

Nach vollständiger technischer Verifikation, PR, CI und Deployment bleibt zwingend ein gezielter Operator-Live-Retest auf dem betroffenen realen Browser/Endgerät offen:

1. aus einer anderen View einmal `Start` antippen und sichtbaren Home-Inhalt prüfen;
2. Settings ändern und einmal speichern; `Successfully saved.` muss bis `OK` sichtbar bleiben;
3. Login-Passwortauge jeweils einmal antippen; jeder Tap muss exakt einmal zwischen verborgen und sichtbar wechseln.

Erst nach dieser Live-Abnahme folgt separat der Modularchitektur-Audit. Kein Core Freeze.

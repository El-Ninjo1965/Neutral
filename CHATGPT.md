# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Codex → Lea/ChatGPT
**Branch:** `fix/user-ui-live-repair`
**Technischer Reparaturcommit:** `a3dd090341d749bdb6c7633f7c83d72a0a912388`
**Datum:** 2026-09-13
**Status:** P2-REVIEW-FUND TECHNISCH REPARIERT · PR-CI UND OPERATOR-LIVE-RETEST OFFEN
**Core Freeze:** NICHT erklärt

## Belegte Root Cause

Die bisherige Landing-Cache-Invalidierung lag ausschließlich im Click-Handler der Start-Navigation. Der echte Browser-Back-Pfad setzt die Hashroute dagegen über `hashchange` und `applyHashRoute()` auf Home. Nach bereits gerendertem Home und anschließend sichtbaren Settings blieb dadurch `lastLandingRenderKey` unverändert. `renderLandingPage()` erkannte denselben Landing-Key und ein vorhandenes erstes Content-Element, kehrte früh zurück und ließ Settings-Content unter Home-Route und aktiver Home-Navigation stehen.

Der neue Runtime-Regressionstest bildet genau `Home → Settings → hashchange/Browser Back → Home` ab und prüft Route, aktive Navigation sowie das tatsächliche Entfernen des Settings-Contents.

## Genaue Änderung

- `Web-App/public/user-app.js`: Die gemeinsame Funktion `activateHome()` setzt Home-View und leeres aktives Modul und invalidiert immer `lastLandingRenderKey`. Alle tatsächlichen Home-Übergänge verwenden diesen Pfad: Hashroute/Browser Back, direkter Start-Klick, erfolgreicher Login, Logout und der Fallback eines nicht verfügbaren Moduls.
- `tests/user-ui-stability.test.js`: Neuer Browser-Back-/Hashchange-Regressionstest; der bestehende Login-Test-Harness verwendet ebenfalls den gemeinsamen Home-Übergang.
- `tests/user-login-bootstrap-fallback.test.js`: Der isolierte Login-Harness stellt die neue gemeinsame Home-Funktion bereit.

Keine gerätespezifische Lösung und keine Änderung an Settings-Save, Passwort-Toggle, GPS oder Modularchitektur wurde vorgenommen.

## Tatsächlich ausgeführte Verifikation

- Fokussierte User-UI-/Routing-/Navigation-/GPS-Tests: **63 passed, 0 failed, 0 skipped**.
- Vollständige Suite (`npm test`): **577 passed, 0 failed, 0 skipped**; 6 Suites.
- JS-Syntax der drei geänderten JavaScript-Dateien: **3 passed, 0 failed**.
- PHP-Syntax: **47 Dateien passed, 0 failed**.
- Production Package: **passed**, 136 Dateien.
- `git diff --check`: **passed**.
- PR #66 war vor dem Push offen, nicht als Draft, mergeable und zeigte auf den vorherigen Head `db47ed556543f80ef1250def34bf5c46f048f4df`. Der offene P2-Kommentar bezog sich auf `Web-App/public/user-app.js` und ist mit dem Reparaturcommit adressiert.

Für den neuen finalen Dokumentations-HEAD werden PR-CI/CodeQL erst nach dem Push ausgelöst; dafür wird hier noch kein PASS behauptet. Es wurde weder gemergt noch auf `main` geschrieben.

## Offen und nächster Schritt

1. Branch pushen und bestätigen, dass PR #66 denselben neuen Head verwendet.
2. PR-CI/CodeQL auf diesem Head bis zum terminalen Status prüfen; kein Merge in diesem Arbeitsblock.
3. Lea/ChatGPT prüft PR #66 erneut.
4. Danach bleibt der gezielte Operator-Live-Retest auf dem realen Browser/Endgerät erforderlich:
   - Home → Settings → Browser Back muss sichtbaren Home-Inhalt zeigen;
   - direkter Start-Klick muss sichtbaren Home-Inhalt zeigen;
   - Settings Save muss `Successfully saved.` bis `OK` sichtbar halten;
   - jeder einzelne Tap auf das Login-Passwortauge muss exakt einmal toggeln.

Erst nach dieser Live-Abnahme folgt separat der Modularchitektur-Audit. Kein Core Freeze.

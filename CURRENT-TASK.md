# NEUTRAL – CURRENT TASK

## Gesamtauftrag

Dark Theme zentral und konsistent fertigstellen, eine persistente Light/Dark-Schnellumschaltung im User-App-Header ergänzen und die wiederkehrenden falschen FTPS-Smoke-Fehlschläge nach erfolgreichem Upload ursächlich stabilisieren. Bestehende live bestätigte Warmstart-, P4-, GPS-, HTML-, Navigation-, Login- und P1-Fixes bleiben erhalten.

## Prüfliste

1. `origin/main` synchronisieren, neue Verträge erhalten und Pflichtdokumente/relevante Implementierung vollständig lesen. **ERLEDIGT**
2. Theme-/FTPS-Regressionstests zuerst ergänzen. **ERLEDIGT**
3. Zentrale semantische Theme-Tokens für User-App, Header, Navigation, Settings, GPS, Inputs und HTML-Container verwenden; keine punktuellen Screenshot-Hacks. **ERLEDIGT**
4. Kompakten accessible Header-Theme-Toggle implementieren, der exakt denselben lokalen Theme-State wie Settings nutzt und sofort/offline/reloadfest wirkt. **ERLEDIGT**
5. FTPS-Historie und Upload-/Smoke-Reihenfolge analysieren; Root Cause dokumentieren. **ERLEDIGT**
6. Produktionsdeployments per Workflow-Concurrency serialisieren. **ERLEDIGT**
7. Revision-Smoke nach erfolgreichem Upload begrenzt mit Backoff wiederholen; permanente Mismatches bleiben Fehler, Uploadfehler werden nicht kaschiert. **ERLEDIGT**
8. Secret-freie Diagnose und falsche URL/Base-Path-/Securityfehler weiterhin fail-closed halten. **ERLEDIGT**
9. P1/Auth/CSRF, Warmstart, HTML, GPS, Navigation, App areas, Offline, SW, Packaging/Base Path regressionsfrei halten. **ERLEDIGT**
10. Keine Scope-Ausweitung auf vollständige I18N, neue Sync-/Queue-, Modul-, Admin- oder Designsystemarchitektur. **ERLEDIGT**
11. Status/TODO/CHANGELOG/Workflow und Verträge wahrheitsgemäß aktualisieren; Theme bleibt bis Device-Retest unterhalb LIVE BESTANDEN. **ERLEDIGT**
12. Fokussierte und vollständige Verifikation gemäß WORKFLOW durchführen. **ERLEDIGT**
13. Vollständigen Bericht nach `CHATGPT.md` schreiben. **ERLEDIGT**
14. Commit/Push main, CI/FTPS/CodeQL terminal, CHATGPT GitHub-Verifikation, HEAD==origin/main, sauberer Tree. **ERLEDIGT**

## Capture-Prüfung

`CODEX.md == CURRENT-TASK-Anforderungen: JA`

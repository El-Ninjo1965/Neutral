# NEUTRAL – CURRENT TASK

## Gesamtauftrag

Den nach dem aktuellen Betreiber-Retest exakt lokalisierten weißen/hellen `Loading…`-Zwischenzustand beim Dark-Warmstart ursächlich aus dem Bootstrap-/Placeholder-Pfad entfernen. Bei gültigem lokalem Theme und Homepagecache muss der sichtbare Ablauf von der korrekt thematisierten App-Surface direkt zum lokalen Inhalt führen; ein echter Cold-Start-Ladezustand bleibt zulässig, muss aber ab First Paint theme-konform sein. Bestehenden iframe-Adapter/-Gate und alle live bestätigten P4-/P1-/FTPS-Fixes erhalten.

## Prüfliste

1. Umgebung/Repository secretsicher prüfen, vollständig mit `origin/main` synchronisieren und neuere Verträge erhalten. **ERLEDIGT**
2. Pflichtdokumente und alle relevanten Bootstrap-/Startup-, Theme-, Homepage-, Loading-/Placeholder-, CSS-, Service-Worker-, Cache-/Storage- und Testdateien vollständig lesen. **ERLEDIGT**
3. Exakten statischen und dynamischen Renderpfad von `Loading…`, frühem Theme-Bootstrap, CSS, synchronem Homepagecache und erstem User-App-Render untersuchen. **ERLEDIGT**
4. Regressionstests zuerst ergänzen: Dark/Light vor First Paint, Warmstart ohne vorgeschaltetes sichtbares generisches Loading, Cold Start mit theme-konformem Status sowie Load-/Script-Reihenfolge. **ERLEDIGT**
5. Statisches Shell-Markup so korrigieren, dass es vor dem synchronen Cache-Render keinen unnötigen sichtbaren `Loading…`-Status erzeugt und dennoch eine layoutstabile, zugängliche App-Surface zeigt. **ERLEDIGT**
6. Persistiertes Theme bereits über den synchronen Head-Bootstrap auf den zentralen semantischen Tokenvertrag anwenden, bevor Haupt-CSS/Body erstmals sichtbar werden. **ERLEDIGT**
7. Den fachlich nötigen Cold-Start-Loadingstatus über zentrale Theme-Tokens ab First Paint korrekt darstellen; Default Light bleibt definiert. **ERLEDIGT**
8. Keine CSS-Verstecklösung, künstliche Verzögerung, Animation oder Timeoutverkürzung verwenden; CSP-/Security- und Service-Worker-/Assetversionsverträge erhalten. **ERLEDIGT**
9. iframe-Dokumentadapter/-Paint-Gating, Local-first-Cache/Refresh, Theme-Switch/-Persistenz, entfernte normale Appearance-Settings, Home/GPS, GPS, Login, Buttonsystem, P1, Auth/CSRF, Packaging/Base Path und FTPS/Smoke regressionsfrei halten. **ERLEDIGT**
10. Status-, TODO-, Changelog-, Architektur-/Funktions- und Workflow-Dokumentation wahrheitsgemäß aktualisieren; keine Safari-Livebestätigung erfinden. **ERLEDIGT**
11. Fokussierte Tests, vollständige Suite, PHP-Lint, JavaScript-Syntaxcheck, `git diff --check`, Produktionspaket und Secret-/Artefaktprüfung durchführen. **ERLEDIGT**
12. Vollständigen Abschlussbericht mit sechs Betreiber-Retest-Schritten nach `CHATGPT.md` schreiben. **ERLEDIGT**
13. Alles committen/pushen; `HEAD == origin/main`, sauberer Tree, FTPS/CodeQL/weitere CI terminal erfolgreich und `CHATGPT.md` auf GitHub `main` verifiziert. **IN ARBEIT**

## Capture-Prüfung

`CODEX.md == CURRENT-TASK-Anforderungen: JA`

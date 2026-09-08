# NEUTRAL – CURRENT TASK

## Gesamtauftrag

Die zwei nach dem aktuellen Betreiber-Device-Retest verbleibenden User-App-Punkte ursächlich abschließen: den auf iPad/Safari weiterhin weißen sandboxed HTML-Homepage-Frame durch einen standardsauberen Theme-Default-Adapter korrigieren, ohne explizite Administratorgestaltung oder den Sandboxvertrag zu schwächen, und den durch den Header-Schnellumschalter redundant gewordenen Appearance/Theme-Block vollständig aus den normalen User-Settings entfernen. Alle live bestätigten Warmstart-, Home-, Navigation-, Button-, GPS-, Login- und FTPS-Fixes bleiben erhalten; P4 bleibt bis zum realen Betreiber-Retest unterhalb `LIVE BESTANDEN`.

## Prüfliste

1. Umgebung und Repository secretsicher prüfen, `origin/main` vollständig synchronisieren und neuere Betreiberverträge unverändert übernehmen. **ERLEDIGT**
2. Alle in `CODEX.md` verlangten Pflichtdokumente und relevanten Theme-, Settings-, Homepage/iframe-, CSS-, Startup-, Cache-, Security- und Testdateien vollständig lesen. **ERLEDIGT**
3. Den tatsächlichen Safari/WebKit-/HTML-Rendervertrag für sandboxed `iframe[srcdoc]`, Canvas-Hintergrund und `color-scheme` anhand primärer Standards-/WebKit-Quellen untersuchen; den Livebefund als vorrangige Evidenz behandeln. **ERLEDIGT**
4. Regressionstests zuerst ergänzen: Dark-/Light-Defaults, Themewechsel eines bereits gerenderten Frames, Vorrang expliziter Admin-CSS, unveränderter freier Inhalt, Fragment-/Voll-Dokument-Vertrag, unveränderte Sandbox und Cache/Warmstart. **ERLEDIGT**
5. Einen standardsauberen, Safari-kompatiblen Framework-Theme-Adapter für `srcdoc` implementieren, der neutrale Dokumentdefaults bereitstellt, aber späteres/ausdrückliches Administrator-CSS nicht überschreibt; kein UA-Sniffing und keine Sanitization. **ERLEDIGT**
6. Themewechsel Light↔Dark für einen bereits dargestellten Homepage-Frame sicherstellen, ohne Theme-Persistenz, Offlinebetrieb oder Local-first-Warmstart zu verändern. **ERLEDIGT**
7. Appearance-Erklärung, Theme-Label und Light/Dark-Select vollständig aus normalen User-Settings entfernen; keine leeren Container/Abstände hinterlassen. **ERLEDIGT**
8. Header-Sonne/Mond, derselbe persistente lokale Theme-State, Reload-/Offlineverhalten sowie `App areas` und `Privacy and sharing` unverändert funktional halten; separate Admin-/Developer-Themes nicht verändern. **ERLEDIGT**
9. Home-Icon/-Navigation, GPS, Buttonsystem Light/Dark, Login, P1-Sessiontrennung, Auth/CSRF, HTML-Homepage, Service Worker, Packaging/Base Path und FTPS-/Smoke-Stabilisierung regressionsfrei halten. **ERLEDIGT**
10. Keine Scope-Ausweitung auf vollständige I18N, allgemeine Modul-Icon-, Sync-/Queue-, Admin- oder sonstige P4-Architektur. **ERLEDIGT**
11. Root Cause und neuen allgemeinen Rendervertrag wahrheitsgemäß in betroffener dauerhafter Dokumentation, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `CHANGELOG.md` und `WORKFLOW.md` aktualisieren; keine erfundene Live-Bestätigung. **ERLEDIGT**
12. Fokussierte Tests, vollständige Suite, PHP-Lint, JavaScript-Syntaxcheck, `git diff --check`, Produktionspaket und Secret-/Artefaktprüfung gemäß `WORKFLOW.md` durchführen. **ERLEDIGT**
13. Vollständigen Abschlussbericht mit ausschließlich den fünf noch notwendigen Betreiber-Retest-Schritten nach `CHATGPT.md` schreiben. **ERLEDIGT**
14. Änderungen committen und nach GitHub `main` übertragen; `HEAD == origin/main`, sauberer Working Tree, FTPS/CodeQL/weitere erforderliche CI terminal erfolgreich und `CHATGPT.md` auf GitHub `main` aktuell verifizieren. **ERLEDIGT**

## Capture-Prüfung

`CODEX.md == CURRENT-TASK-Anforderungen: JA`

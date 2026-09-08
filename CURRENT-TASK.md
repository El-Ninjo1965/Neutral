# NEUTRAL – CURRENT TASK

## Gesamtauftrag

Den nach dem aktuellen iPad/Safari-Retest verbleibenden weißen Initial-Paint/Flash der bereits final korrekt dunklen HTML-Homepage ursächlich beseitigen. Der thematisierte `srcdoc`-Inhalt und alle live bestätigten Warmstart-, Theme-, Settings-, Home-, Navigation-, Button-, GPS-, Login- und FTPS-Fixes bleiben erhalten. Kein künstlicher Delay, keine Animation und keine erfundene P4-Livefreigabe.

## Prüfliste

1. Umgebung/Repository secretsicher prüfen, vollständig mit `origin/main` synchronisieren und alle neueren Betreiberverträge erhalten. **ERLEDIGT**
2. Alle verlangten Pflichtdokumente sowie relevante User-App-, Theme-, Homepage-/iframe-/srcdoc-, CSS-, Service-Worker-, Cache-, Security- und Testdateien vollständig lesen. **ERLEDIGT**
3. Tatsächliche Paint-/Lifecycle-Reihenfolge von iframe-Erzeugung, Theme-Setup, `srcdoc`, DOM-Insertion und erstem `load` untersuchen und den Safari-Livebefund über ältere Annahmen stellen. **ERLEDIGT**
4. Regressionstests zuerst ergänzen: Theme/`srcdoc` vor DOM-Insertion, kein sichtbares leeres/about:blank-Frame, themesicherer Wrapper ohne Loading/weißen Platzhalter, Dark-/Light-Warmstart und Themewechsel ohne bewusst sichtbaren unthematisierten Zustand. **ERLEDIGT**
5. Frame vor der ersten sichtbaren DOM-Insertion vollständig thematisieren und bis zum ersten thematisierten `load` strukturell unsichtbar halten; Wrapper zeigt währenddessen ohne Layoutsprung die korrekte Theme-Surface. **ERLEDIGT**
6. Visibility-Gating ausschließlich lifecycle-/eventbasiert ohne Delay, Animation oder altes Loading umsetzen; bei bereits geladenem detached Frame sofort korrekt sichtbar werden. **ERLEDIGT**
7. Light↔Dark-Neurender/Wechsel ebenfalls ohne sichtbaren about:blank-Zwischenzustand halten; explizites Administrator-CSS bleibt sichtbar und freies HTML wird nicht heuristisch verändert. **ERLEDIGT**
8. Sandbox mindestens gleich restriktiv, Local-first-Cache/Warmstart unverändert schnell und Appearance aus normalen User Settings entfernt halten. **ERLEDIGT**
9. Home/GPS, GPS, Login, Buttonsystem, Theme-Switch/-Persistenz, P1-Sessiontrennung, Auth/CSRF, Service Worker, Packaging/Base Path und FTPS-/Smoke-Stabilisierung regressionsfrei halten. **ERLEDIGT**
10. Relevante dauerhafte Dokumentation, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `CHANGELOG.md` und `WORKFLOW.md` wahrheitsgemäß aktualisieren; kein visueller Safari-Erfolg ohne Device-Retest behaupten. **ERLEDIGT**
11. Fokussierte Tests, vollständige Suite, PHP-Lint, JavaScript-Syntaxcheck, `git diff --check`, Produktionspaket und Secret-/Artefaktprüfung ausführen. **ERLEDIGT**
12. Vollständigen Abschlussbericht mit den sechs kurzen Betreiber-Retest-Schritten nach `CHATGPT.md` schreiben. **ERLEDIGT**
13. Alles committen und nach GitHub `main` übertragen; `HEAD == origin/main`, sauberer Working Tree, FTPS/CodeQL/weitere CI terminal erfolgreich und `CHATGPT.md` auf GitHub `main` aktuell verifizieren. **IN ARBEIT**

## Capture-Prüfung

`CODEX.md == CURRENT-TASK-Anforderungen: JA`

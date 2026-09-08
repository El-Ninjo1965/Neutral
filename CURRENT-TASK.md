# NEUTRAL – CURRENT TASK

## Gesamtauftrag

Den aktuellen Betreiber-Folgebefund in der User-App ursächlich bearbeiten: das zentrale Button-/Navigationsdesign besonders im Light Mode verfeinern, `Start` durch ein barrierefreies lokales Home-Icon ersetzen, die weiße Fläche der freien HTML-Homepage im Dark Mode bis zur tatsächlichen Quelle verfolgen und die anonyme Login-Seite von redundanter Framework-/Developer-Sprache bereinigen. Die live bestätigten Warmstart-, Theme-, GPS-, HTML-, Navigations- und FTPS-Stabilisierungen bleiben erhalten; P4 bleibt bis zum Betreiber-Retest unterhalb `LIVE BESTANDEN`.

## Prüfliste

1. Umgebung/Repository/GitHub-Zugriff secretsicher prüfen, vollständig mit `origin/main` synchronisieren und alle neueren Betreiberverträge erhalten. **ERLEDIGT**
2. Alle in `CODEX.md` verlangten Pflichtdokumente sowie relevante User-App-, Theme-, Designsystem-, Navigation-, Login-, Homepage-, CSS- und Testdateien vollständig lesen. **ERLEDIGT**
3. Regressionstests vor der Implementierung ergänzen/anpassen: gemeinsamer Buttonvertrag, zentrale Light-/Dark-Tokens, klare Zustände, Touch/Fokus, Home-Icon/A11y/Startlogik, HTML-Fläche/HTML-Unverändertheit/Warmstart und reduzierte Loginansicht bei unveränderter Fehlerdarstellung. **ERLEDIGT**
4. Zentrales Button-/Navigationssystem über gemeinsame Tokens und Varianten für Primary, Secondary, Navigation und Icon-Buttons verfeinern; Light-Kontrast erhöhen, Dark-Qualität erhalten und Höhe, Radius, Border, Padding, Touch, Pointer-Hover und `:focus-visible` konsistent machen. **ERLEDIGT**
5. Header-Actions, Login und Navigation in dieselbe ruhige Hierarchie einordnen; persönliche `App areas` funktional erhalten und keine vollständige Designsystem-Neugestaltung beginnen. **ERLEDIGT**
6. Sichtbaren `Start`-Text durch ein lokales, nicht-Emoji Home-Symbol in touchgerechter Fläche ersetzen; accessible name/Title `Start`, Fokus, aktiven Zustand und bestehende Start-/Route-/Homepage-Logik erhalten; `GPS` bleibt Text. **ERLEDIGT**
7. Den exakten gespeicherten Homepagewert und vollständigen Render-/CSS-Pfad prüfen und die große weiße Dark-Mode-Fläche eindeutig Framework oder freiem Admin-HTML/CSS zuordnen. **ERLEDIGT**
8. Falls Frameworkursache: zentral beheben und `<h1>TEST</h1>` ohne künstlichen weißen Vollflächenblock darstellen; falls Inhaltsursache: freien Inhalt unverändert lassen und Root Cause klar dokumentieren. Keine heuristische HTML-Manipulation. **ERLEDIGT**
9. Loginseite auf Produktkern reduzieren: technische/redundante Standardtexte entfernen, Username-/Password-Labels, Login-Aktion, Accessibility und echte Fehler-/Statusmeldungen erhalten; Authentifizierungslogik unverändert lassen. **ERLEDIGT**
10. Bestehende Theme-Schnellumschaltung/-Persistenz/Offline, GPS, HTML-Homepage, Local-first-Warmstart, Login, P1-Sessiontrennung, Auth/CSRF, Service Worker, Packaging/Base Path und FTPS-/Smoke-Stabilisierung regressionsfrei halten. **ERLEDIGT**
11. Keine Scope-Ausweitung auf vollständige I18N-/Übersetzungs-, allgemeine Modul-Icon-, Sync-/Queue-, Admin- oder sonstige P4-Featurearchitektur. **ERLEDIGT**
12. Root Causes und neue allgemeine Verträge wahrheitsgemäß in betroffener dauerhafter Dokumentation, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `CHANGELOG.md` und `WORKFLOW.md` aktualisieren; keine erfundene Live-Bestätigung. **ERLEDIGT**
13. Fokussierte Tests, vollständige Suite, PHP-Lint, JavaScript-Syntaxcheck, `git diff --check`, Produktionspaket sowie Secret-/Artefaktprüfung gemäß `WORKFLOW.md` durchführen. **ERLEDIGT**
14. Vollständigen Abschlussbericht inklusive sechs Punkte umfassendem Betreiber-Device-Retest nach `CHATGPT.md` schreiben. **OFFEN**
15. Alle Änderungen committen und nach GitHub `main` übertragen; `HEAD == origin/main`, sauberer Working Tree, FTPS/CodeQL/weitere erforderliche CI terminal erfolgreich und `CHATGPT.md` auf GitHub `main` aktuell verifizieren. **OFFEN**

## Capture-Prüfung

`CODEX.md == CURRENT-TASK-Anforderungen: JA`

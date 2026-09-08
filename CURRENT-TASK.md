# NEUTRAL – CURRENT TASK

## Gesamtauftrag

`Admin → Appearance` unter Erhalt von P1/P4 zu einem produktiven User-UI-Designeditor ausbauen: bestehende Start Page erhalten, validierte getrennte Light-/Dark-Designtokens mit isolierter Live-Preview, Reset auf strukturierte Defaults sowie klar getrenntes Advanced Custom CSS implementieren. Den freigegebenen öffentlichen Designzustand versioniert und local-first in der User-App anwenden, ohne persönliche Admin-/User-Theme-Zustände, Security-, CSP-, Homepage-Warmstart- oder Offlineverträge zu schwächen. Keine I18N-, Remote-Font-, Branding-Upload-, Page-Builder-, pro-Modul- oder Store-App-Scope-Ausweitung.

## Prüfliste

1. Umgebung/GitHub secretsicher prüfen und vollständig mit `origin/main` synchronisieren; neuere Verträge erhalten. **ERLEDIGT**
2. Alle in `CODEX.md` verlangten Dokumente und relevanten Appearance-/Settings-/API-/User-App-/Theme-/Token-/Homepage-/CSS-/Cache-/Storage-/Service-Worker-/Security-/Testdateien vollständig lesen. **ERLEDIGT**
3. Bestehende Settings-, öffentliche Projektions-, CSS-Token-, CSP- und Local-first-Architektur analysieren und einen versionierten fail-closed Designvertrag festlegen. **ERLEDIGT**
4. Tests zuerst für Appearance-Titel/Abschnitte, strukturierte Validierung/Projektion, Preview-Isolation/Light-Dark, Reset, Custom-CSS-Grenzen, User-App-Wirkung und Local-first-/Offlineverhalten ergänzen. **ERLEDIGT**
5. Zentralen strukturierten Designvertrag mit erlaubten Light-/Dark-Farben sowie begrenzten Radius-/Geometrie-/Typografiewerten in Node und PHP implementieren; unbekannte/ungültige Werte fail-closed behandeln. **ERLEDIGT**
6. Sichere öffentliche Designprojektion und Client-API ergänzen, die ausschließlich freigegebene Darstellungswerte ausliefert. **ERLEDIGT**
7. Versionierten lokalen Designcache und nicht blockierenden Hintergrundrefresh implementieren; bekannten Dark-First-Paint und Homepage-Warmstart erhalten. **ERLEDIGT**
8. User-App-Mapping auf bestehende zentrale CSS Custom Properties implementieren, sodass Header, Navigation, Buttons, Cards, Forms, Texte und Module erben. **ERLEDIGT**
9. Appearance um `Start Page`, `User UI Design` und `Advanced Custom CSS` erweitern; sofortige isolierte Light-/Dark-Preview und konsistente Benennung `Appearance` umsetzen. **ERLEDIGT**
10. Strukturierten Reset und getrenntes Custom-CSS-Clear implementieren; Start Page und persönliche Theme-Zustände unangetastet lassen. **ERLEDIGT**
11. Custom CSS ausschließlich im User-App-Kontext mit Größenlimit und sicherem CSS-only Auslieferungs-/Anwendungsweg nach strukturierten Tokens implementieren; CSP/Auth/Admin-Isolation erhalten. **ERLEDIGT**
12. P1/P4, Homepage, GPS, Login, Themes, Service Worker, Packaging/Base Path und FTPS-/Smoke regressionsfrei halten; keine ausgeschlossenen Zukunftsfeatures beginnen. **ERLEDIGT**
13. Betroffene Architektur-, Funktions-, UI-/Design-, Status-, TODO-, ToDoNow-, CHANGELOG- und Workflow-Dokumentation wahrheitsgemäß aktualisieren. **ERLEDIGT**
14. Fokussierte Tests, vollständige Suite, PHP-Lint, JS-Syntax, `git diff --check`, Produktionspaket sowie Secret-/Artefaktprüfung ausführen. **ERLEDIGT**
15. Commit/push nach `main`, terminale FTPS-/CodeQL-/sonstige CI, Abschlussbericht mit neun Retest-Schritten in `CHATGPT.md`, GitHub-Verifikation, `HEAD == origin/main` und sauberer Tree. **ERLEDIGT**

## Capture-Prüfung

`CODEX.md == CURRENT-TASK-Anforderungen: JA`

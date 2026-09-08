# NEUTRAL – CURRENT TASK

## Gesamtauftrag

Den positiv bestätigten P4-Warmstart-/First-Paint-Livebefund in der operativen Dokumentation abschließen und `Admin → Appearance` um den nach erneuter Codeprüfung funktionslosen bzw. missverständlichen sichtbaren Block `Theme & Layout` bereinigen. Die funktionierenden lokalen Admin- und User-Theme-Schalter sowie die vollständige Global-Start-Page-Funktion bleiben erhalten. Die zukünftigen Verträge aus `USER-UI-DESIGN.md` und `I18N.md` werden respektiert, aber nicht implementiert.

## Prüfliste

1. Verbindliche Umgebung und GitHub-Schreibweg secretsicher prüfen, `origin` herstellen und vollständig mit `origin/main` synchronisieren, ohne neuere Vertragsänderungen zu verlieren. **ERLEDIGT**
2. Alle in `CODEX.md` genannten Pflichtdokumente sowie relevante Appearance-, Settings-, User-App-, Theme-, Homepage-, CSS-, Service-Worker-, Cache-/Storage- und Testdateien vollständig lesen. **ERLEDIGT**
3. Repositoryweit erneut prüfen, ob `settings.theme` oder `settings.layout` produktive Consumer besitzen; lokale Admin-/User-Theme-Pfade und Homepage-Save-Semantik getrennt verifizieren. **ERLEDIGT**
4. Regressionstests zuerst so anpassen, dass `Theme & Layout`, Theme-Select und Layout-Select in Appearance fehlen, während Global Start Page, HTML-/Modulmodus, Preview, Save/Reload und Erhalt anderer Settings abgesichert bleiben. **ERLEDIGT**
5. Den sichtbaren `Theme & Layout`-Block und dessen Abfrage/Save-Verarbeitung aus `Admin → Appearance` entfernen, ohne persistierte Altwerte destruktiv zu migrieren oder andere Settings beim Homepage-Save zu löschen. **ERLEDIGT**
6. Admin-Header-Theme und User-Header-Theme unverändert erhalten; keine halbfertige User-UI-Design- oder I18N-Implementierung beginnen. **ERLEDIGT**
7. Bestehende P4-Abnahmelogik vollständig prüfen und P4 nur bei tatsächlich vollständigem Scope als `LIVE BESTANDEN` dokumentieren; P1 bleibt `LIVE BESTANDEN`, historische Befunde bleiben historische Evidenz. **ERLEDIGT**
8. Status-, TODO-, ToDoNow-, CHANGELOG-, Workflow- und erforderliche Architektur-/Funktionsdokumentation wahrheitsgemäß aktualisieren, ohne Zukunftsfeatures als umgesetzt auszugeben. **ERLEDIGT**
9. Fokussierte Appearance-/Homepage-/Theme-/Warmstart-/Regressionstests ausführen. **ERLEDIGT**
10. Vollständige Test-Suite, PHP-Lint, JavaScript-Syntaxcheck, `git diff --check`, Produktionspaket sowie Secret-/Artefaktprüfung durchführen. **ERLEDIGT**
11. Implementierung und Dokumentation committen und nach `main` pushen; erforderliche FTPS-, CodeQL- und weitere CI-Läufe bis zum terminalen Status abwarten. **ERLEDIGT**
12. Vollständigen Abschlussbericht inklusive verbleibendem kurzem Betreiber-Kontrolltest in `CHATGPT.md` schreiben, committen/pushen und auf GitHub `main` verifizieren. **ERLEDIGT**
13. Abschließend `HEAD == origin/main` und einen sauberen Working Tree verifizieren; keine selbst ausführbaren Punkte offenlassen. **ERLEDIGT**

## Capture-Prüfung

`CODEX.md == CURRENT-TASK-Anforderungen: JA`

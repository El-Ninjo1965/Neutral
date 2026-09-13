# NEUTRAL – WORKFLOW

**Status:** VERBINDLICHE ARBEITSREGELN
**Aktualisiert:** 2026-09-13

1. Neueste Operator-Befunde und ausdrücklich erteilte Aufgaben haben Vorrang vor älteren Statusangaben.
2. Vor Änderungen aktuelle Dokumentation, relevanten Code und Tests lesen.
3. `CODEX.md`, `LOCAL-AGENT.md` und `CURRENT-TASK.md` enthalten keine erledigten Aufgaben als aktive Aufträge.
4. Bei Moduländerungen ist `ModuleCreation.md` verbindlich.
5. Optionale Module dürfen Core oder unabhängige Module nicht unbeabsichtigt koppeln.
6. Zusammengehörige Änderungen auf einem Arbeitsbranch sammeln und vor Integration prüfen.
7. Root Cause oder Änderungsgrund vor Reparaturen bestimmen; keine unbeauftragten Refactorings.
8. Relevante Tests, Syntax-/Diff- und Build-Prüfungen vor Abschluss ausführen.
9. Bei möglicher GitHub-Verzögerung Commit-/Remote-Stand bis zu viermal prüfen, bevor ein zunächst fehlender Stand als endgültig fehlend bewertet wird.
10. Integration nach `main` nur nach ausdrücklicher Freigabe.
11. Automatisierte Prüfungen ersetzen keinen ausdrücklich erforderlichen Operator-Livetest.
12. Core Freeze wird nicht allein aus grünen Tests abgeleitet.

# CURRENT TASK — Live Admin Reality Check (Diagnose, keine Fixes)

**Quelle:** `CODEX.md`, 2026-09-09
**Status:** Diagnose abgeschlossen; Phase 2 noch nicht begonnen
**Grenzen:** Keine Reparatur, kein Refactoring, keine Appearance-/i18n-Arbeit, keine destruktive Produktionsaktion, keine Secret-Ausgabe.

## Arbeitsliste

1. [x] Mit `origin/main` synchronisieren und Commit-/Deploymentbasis feststellen.
2. [x] `CODEX.md`, `WORKFLOW.md`, `CHATGPT.md`, den bisherigen `CURRENT-TASK.md`, `STATUS.md`, `TODO.md` und `ToDoNow.md` vollständig lesen; Diagnoseauftrag vollständig erfassen.
3. [x] Alle im Auftrag genannten Architektur-, Security-, API-, DB-, Functions-, Connections-, UI-/UX-, Changelog-, Installations-, Deployment- und Backupdokumente vollständig lesen.
4. [x] Betroffene UI-, API-, Service-, Runtime-/DB-/Filesystem-, Migrations-, Test-, Packaging- und Deploymentpfade vollständig auditieren, ohne Änderungen am Produktcode.
5. [x] Für Sessions Datenfluss und Produktionszustand einschließlich Schema-/Migrationsdrift, Filter, Expiry/Revocation und Registry prüfen.
6. [x] Für Connections/Providers, Server und Database autoritative Quelle, API-Antwort, Berechtigung, Routing, UI-Binding und Produktionsstand prüfen.
7. [x] Backupfehler bis zur konkreten internen Bedingung verfolgen; Key nur als vorhanden/fehlend, Verzeichnis nur als zugreifbar/nicht zugreifbar und DB/Tabellen/Migrationen sicher klassifizieren; Cron und manuellen Pfad trennen.
8. [x] Maintenance/Release/Build-/Deployinformationen und deren UI-Binding prüfen.
9. [x] Bedeutung und Implementierungsstand des sichtbaren 14-Tage-Werts über Settings/UI/Backend/Defaults/Dokumentation klären.
10. [x] Globalen Alert-State beim Routing und Audit-Filterlabels einschließlich Safari/Responsive-CSS prüfen.
11. [x] Für jeden Bereich Code, Tests, Migration, produktive Anwendung, Build, FTPS, Liveendpoint, UI-Konsum und Dokumentationswahrheit getrennt bewerten.
12. [x] Kompakten vollständigen Diagnosebericht mit geforderter Tabelle, Root-Cause-Evidenz, Phase-2-Dateiliste, nötigen Migrationen/Deploymaßnahmen, iPad-Retests, Fehlerklassifikation und Reparaturreihenfolge erstellen.
13. [x] Diagnosebericht als aktuellen Übergabestand in `CHATGPT.md` dokumentieren, ohne historische Evidenz zu löschen; keine vorzeitige DONE-Kennzeichnung.
14. [x] Nur Dokumentationsänderungen prüfen, committen und nach `main` übertragen; erforderliche CI terminal abwarten, GitHub-Datei verifizieren und sauberen synchronen Git-Stand herstellen.

## Capture-Prüfung

Die Punkte 1–14 bilden sämtliche Pflichtprüfungen, die Bereiche A–I, den Dokumentationswiderspruch, die geforderte Evidenztrennung und alle Ergebnisartefakte aus `CODEX.md` ab. **`CODEX.md == CURRENT-TASK-Anforderungen` — bestanden.**

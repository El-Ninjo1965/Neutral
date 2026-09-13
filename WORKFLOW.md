# NEUTRAL – WORKFLOW

**Status:** VERBINDLICHE ARBEITSREGELN  
**Aktualisiert:** 2026-09-13

## 1. Wahrheits-Hierarchie

Bei Projektarbeit gilt in dieser Reihenfolge:

1. neuester ausdrücklich mitgeteilter Betreiber-Live-Befund;
2. neuester ausdrücklich erteilter Auftrag;
3. `CURRENT-TASK.md`, sobald der neue Auftrag vollständig übernommen wurde;
4. `WORKFLOW.md` und verbindliche Projektverträge, insbesondere `CORE-1.0.md` und `VISION.md`;
5. tatsächlicher aktueller Code und Tests;
6. aktuelle Status-/Todo-Dokumente;
7. historische Evidenz aus der Git-History.

Neuere Betreiberbefunde dürfen niemals durch ältere Dokumentation oder frühere Chatdiagnosen überschrieben werden.

## 2. Übergabekanal

- `CODEX.md`: ChatGPT/Lea → Codex. Enthält ausschließlich den aktuellen Auftrag.
- `CURRENT-TASK.md`: operative, überprüfbare Arbeitsliste von Codex. Enthält genau einen aktuellen Gesamtauftrag und keine Historie.
- `CHATGPT.md`: Codex → ChatGPT/Lea. Enthält ausschließlich den aktuellen Abschluss-/Übergabestand und offene Operator-Tests.

Historie gehört in die Git-History, nicht in diese drei operativen Übergabedateien.

## 3. Start jeder Codex-Task

1. Verbindliche Umgebung `Neutral` und Repository `El-Ninjo1965/Neutral` bestätigen.
2. `/workspace/Neutral`, Branch `main`, `origin`, GitHub-Zugriff und Working Tree prüfen.
3. Secrets nur auf Verfügbarkeit prüfen; Werte niemals ausgeben, dokumentieren oder committen.
4. `origin/main` synchronisieren.
5. `CODEX.md`, `CURRENT-TASK.md`, `CHATGPT.md`, `WORKFLOW.md`, `VISION.md`, `CORE-1.0.md` sowie die für den Auftrag relevanten Verträge/Dateien lesen.
6. Neuesten Auftrag vollständig in `CURRENT-TASK.md` übernehmen bzw. dessen vollständige Übereinstimmung prüfen.
7. Erst danach implementieren.

Verbindungsdetails stehen, soweit vorhanden, in `CONNECTIONS.md`. Eine frische Sandbox ohne persistentes Remote oder GitHub-CLI-Login ist allein kein Projektfehler.

## 4. Ausführung

- Arbeitspunkt für Arbeitspunkt aus `CURRENT-TASK.md` bearbeiten.
- Bei Unsicherheit oder Kontextverlust `CURRENT-TASK.md` erneut lesen.
- Root Cause vor Reparatur belegen.
- Projektvertrag schlägt lokale Tool-/Runtime-Defaults.
- Keine fremden oder vorhandenen Änderungen blind verwerfen.
- Keine unnötigen Refactorings oder nicht beauftragten Features.
- Keine Secrets in Code, Logs, Dokumentation oder Git-History.
- Production Restore oder destruktive Produktionsaktionen niemals als Test verwenden.

## 5. Verifikation vor Abschluss

1. `CURRENT-TASK.md` vollständig erneut lesen und jeden Punkt gegen Code, Tests und Dokumentation prüfen.
2. Erforderliche fokussierte Tests und vollständige Testsuite ausführen.
3. Erforderliche Syntax-/Lint-/Build-/Package-Prüfungen ausführen.
4. `git diff --check` und tatsächlichen Diff prüfen.
5. Dokumentation aktualisieren.
6. Commit und Push nach `main` gemäß Projektregeln.
7. `HEAD == origin/main` und sauberer Working Tree.
8. Erforderliche CI, CodeQL, FTPS/Deployment und read-only Production Smoke bis zum terminalen Status abwarten.
9. `CHATGPT.md` mit tatsächlichem Ergebnis und offenen Operator-Tests aktualisieren.
10. Erst danach Abschluss melden.

Kein selbst ausführbarer offener Punkt darf als abgeschlossen gemeldet werden.

## 6. Live-Wahrheitsgrenze und Core Freeze

Lokale Tests, CI, Deployment und read-only Smokes dürfen einen erforderlichen realen Betreiber-Livetest nicht zu `PASS` hochstufen.

Ein Core Freeze wird niemals automatisch aus Tests oder CI abgeleitet. Er darf erst erfolgen, wenn die ausdrücklich erforderlichen technischen und realen Operator-Abnahmen abgeschlossen sind.

## 7. Dokumentationsdisziplin

Operative Dateien kurz und aktuell halten. Abgeschlossene Reparaturberichte, alte Device-Befunde, frühere Tasklisten und historische Diagnosen nicht in `CODEX.md`, `CURRENT-TASK.md`, `CHATGPT.md` oder `WORKFLOW.md` ansammeln. Für historische Nachvollziehbarkeit ausschließlich die Git-History verwenden.

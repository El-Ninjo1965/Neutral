# NEUTRAL – Dokumentationsordnung

**Status:** VERBINDLICH  
**Stand:** 2026-09-13

Aktive Dokumentation enthält ausschließlich den aktuellen Vertrag, den aktuell belegten IST-Stand und tatsächlich noch gültige Anforderungen. Historische Zwischenstände, abgeschlossene Fehlerberichte, alte Agentenaufträge und überholte Architekturvarianten gehören nicht in aktive Dokumente.

## Autorität

1. `VISION.md` – langfristige verbindliche Grundrichtung.
2. `CORE-1.0.md` – Releaseumfang und Freeze-/Abnahmekriterien.
3. `Architecture.md` und `ModuleCreation.md` – technische System- und Modulverträge.
4. `UI-UX.md` und `I18N.md` – UI-/UX- und Internationalisierungsverträge.
5. `API.md`, `Database.md`, `Security.md`, `Functions.md` und weitere Fachverträge.
6. `STATUS.md` – aktuell nachgewiesener Stand und offene reale Punkte.
7. `TODO.md` / `CURRENT-TASK.md` – ausschließlich aktuelle ausführbare Arbeit.
8. `CHATGPT.md`, `CODEX.md`, `LOCAL-AGENT.md` – aktuelle Übergaben; keine Historie.

Bei Widerspruch gilt die höher eingeordnete aktuelle Vertragsquelle. Neuere ausdrücklich bestätigte Betreiber-Livebefunde schlagen ältere Dokumentation und müssen anschließend in die zuständige Datei übernommen werden.

## Pflege

Bei materiellen Änderungen:

- betroffenen Vertrag aktualisieren;
- `STATUS.md` auf tatsächlichen Stand bringen;
- nur noch offene Arbeit in Task-/Todo-Dateien belassen;
- operative Übergabedateien kurz und aktuell halten;
- keine Secrets oder hostlokalen Zugangsdaten dokumentieren;
- abgeschlossene Reparaturgeschichten aus aktiven Dateien entfernen.

Git-History ist die primäre technische Historie. Ein separates Changelog ist keine Voraussetzung für die tägliche Agentenarbeit und darf niemals aktuelle Vertragsdateien überstimmen.

## Statusbegriffe

- **VORHANDEN:** im aktuellen Code/Produkt belastbar nachgewiesen.
- **TEILWEISE:** nutzbare Grundlage, konkrete Anforderung offen.
- **GEPLANT:** weiterhin gültiges Ziel, noch nicht vollständig umgesetzt.
- **FEHLT:** erforderliche Fähigkeit ohne belastbare Implementierung.
- **BLOCKIERT:** externe Voraussetzung verhindert Fortsetzung.

Lokale Tests, CI oder Simulationen ersetzen keinen ausdrücklich erforderlichen Operator-Livetest.

## Plattform

Core 1.0 muss mit PHP 8.1+, MySQL/MariaDB, HTTPS und normalen Shared-Hosting-Rechten funktionieren. Node.js, Redis, WebSockets, permanente Worker und native Store-Werkzeuge sind keine Core-1.0-Produktionsvoraussetzung.

## Arbeitsregel für Agenten

Vor Implementierung zuerst die für den Auftrag relevanten aktuellen Vertragsdateien und danach den aktuellen Code lesen. Historische Dateien, alte Pläne oder Git-History dürfen nur zur Ursachenanalyse herangezogen werden und niemals einen aktuellen Vertrag ersetzen.

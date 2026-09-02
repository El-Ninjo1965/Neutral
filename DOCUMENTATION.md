# NEUTRAL – Dokumentationsordnung

**Status:** VERBINDLICH  
**Geprüft:** 2026-09-02

Diese Datei ist der Einstieg für jede zukünftige Arbeit am Repository. Sie legt fest, wo Anforderungen, Ist-Zustand, nächste Schritte und abgeschlossene Änderungen stehen.

## Verbindliche Reihenfolge

1. [`VISION.md`](VISION.md) beschreibt das langfristige, technologieunabhängige Ziel.
2. [`CORE-1.0.md`](CORE-1.0.md) definiert den endlichen Umfang und die Abnahme von Neutral Core 1.0.
3. [`Architecture.md`](Architecture.md) und [`ModuleCreation.md`](ModuleCreation.md) definieren Systemgrenzen und Erweiterungsverträge.
4. [`API.md`](API.md), [`Database.md`](Database.md), [`Security.md`](Security.md) und [`Functions.md`](Functions.md) dokumentieren nachprüfbare Fachverträge.
5. [`STATUS.md`](STATUS.md) beschreibt den aktuell nachgewiesenen Stand, ohne Anforderungen zu verändern.
6. [`TODO.md`](TODO.md) enthält ausschließlich die nächsten ausführbaren Arbeiten.

[`ROADMAP.md`](ROADMAP.md) enthält bewusst auf später verschobene Ziele. [`CHANGELOG.md`](CHANGELOG.md) dokumentiert abgeschlossene Änderungen. Installationsanleitungen konkretisieren ausschließlich den Betrieb und stehen unter den genannten Verträgen.

[`DEVELOPMENT.md`](DEVELOPMENT.md) beschreibt die verifizierte lokale Entwicklungsumgebung. Sie ist kein Produktionsvertrag und darf Node.js nicht zur Shared-Hosting-Voraussetzung machen.

## Konfliktregel

Bei einem Widerspruch gilt die höher eingeordnete Datei. Ein untergeordnetes Dokument darf keine neue Vision oder neue Core-1.0-Pflicht erfinden. Ein erkannter Widerspruch wird im selben Änderungssatz korrigiert und im Changelog genannt.

## Statusbegriffe

- **VORHANDEN:** im aktuellen Code implementiert und durch Codepfad, Test oder datierte Live-Prüfung nachweisbar.
- **TEILWEISE:** nutzbare Grundlage vorhanden, aber eine konkret benannte Anforderung offen.
- **GEPLANT:** freigegebenes Ziel ohne vollständige Implementierung.
- **FEHLT:** benötigte Fähigkeit ohne belastbare Implementierung.
- **BLOCKIERT:** Fortsetzung benötigt eine konkret benannte externe Voraussetzung.

Ein lokaler Test, eine Simulation oder ein Node-Referenzpfad beweist nicht automatisch die Funktion der PHP-Produktion. Live-Aussagen benötigen Datum und geprüfte Umgebung.

## Plattformregel

Neutral Core 1.0 muss produktiv mit PHP 8.x, MySQL/MariaDB, HTTPS und den üblichen Dateirechten eines Shared Hostings funktionieren. Node.js, Redis, WebSockets, permanente Worker und native Store-Werkzeuge sind optionale spätere Adapter und keine Voraussetzung für Core 1.0.

## Pflege bei jeder materiellen Änderung

Eine Änderung ist erst dokumentarisch abgeschlossen, wenn der betroffene Vertrag, `STATUS.md`, `TODO.md`, `CHANGELOG.md` und das Arbeitsprotokoll in `WORKFLOW.md` gemeinsam aktuell sind, relevante Testergebnisse wahrheitsgemäß genannt werden und keine Secrets oder hostlokalen Zugangsdaten aufgenommen wurden. Jeder neue Workflow-Eintrag nennt außerdem, wer die Änderung ausgeführt und dokumentiert hat, damit spätere Codex-Sitzungen die Herkunft nachvollziehen können.

Abgehakte historische Aufgaben gehören nicht dauerhaft in `TODO.md`; sie werden im Changelog bewahrt.

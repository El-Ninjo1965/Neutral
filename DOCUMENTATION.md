# NEUTRAL – Dokumentationsordnung

**Status:** VERBINDLICH  
**Geprüft:** 2026-09-13

Diese Datei ist der Einstieg für jede zukünftige Arbeit am Repository. Sie legt fest, wo Anforderungen, Ist-Zustand und nächste Schritte stehen. Historische Entwicklung wird über die Git-History nachvollzogen und nicht in parallelen Chronikdateien gepflegt.

## Verbindliche Reihenfolge

1. [`VISION.md`](VISION.md) beschreibt das langfristige, technologieunabhängige Ziel.
2. [`CORE-1.0.md`](CORE-1.0.md) definiert den endlichen Umfang und die Abnahme von Neutral Core 1.0.
3. [`Architecture.md`](Architecture.md) und [`ModuleCreation.md`](ModuleCreation.md) definieren Systemgrenzen und Erweiterungsverträge.
4. [`UI-UX.md`](UI-UX.md) definiert das langfristige verbindliche UI-/UX-Zielbild; [`I18N.md`](I18N.md) definiert die langfristige zentrale Internationalisierungs-, Locale- und Sprachpaketarchitektur.
5. [`API.md`](API.md), [`Database.md`](Database.md), [`Security.md`](Security.md) und [`Functions.md`](Functions.md) dokumentieren nachprüfbare Fachverträge.
6. [`STATUS.md`](STATUS.md) beschreibt den aktuell nachgewiesenen Stand, ohne Anforderungen zu verändern.
7. [`TODO.md`](TODO.md) enthält ausschließlich die nächsten ausführbaren Arbeiten.

[`ROADMAP.md`](ROADMAP.md) enthält bewusst auf später verschobene Ziele. Installationsanleitungen konkretisieren ausschließlich den Betrieb und stehen unter den genannten Verträgen.

[`DEVELOPMENT.md`](DEVELOPMENT.md) beschreibt die verifizierte lokale Entwicklungsumgebung. Sie ist kein Produktionsvertrag und darf Node.js nicht zur Shared-Hosting-Voraussetzung machen.

## Relevanzregel für UI/I18N

`UI-UX.md` und `I18N.md` sind verbindliche Zielverträge, aber nicht bei jedem fachfremden Auftrag vollständig zu lesen. Bei Arbeiten an User-App, sichtbaren Texten, Navigation, Modulen, Locale, Sprache, Datum/Uhrzeit, Zahlen-/Einheitenformatierung, Sprachpaketen oder Übersetzungsprovidern müssen die jeweils betroffenen Verträge vor Implementierung gelesen und berücksichtigt werden.

Neue Module dürfen keine Architektur schaffen, die den zentralen I18N-Vertrag aus `I18N.md` später verhindert oder durch inkompatible Insellösungen ersetzt.

## Konfliktregel

Bei einem Widerspruch gilt die höher eingeordnete Datei. Neuere ausdrücklich dokumentierte Betreiber-Livebefunde haben Vorrang vor älteren Statusaussagen. Ein untergeordnetes Dokument darf keine neue Vision oder neue Core-1.0-Pflicht erfinden. Ein erkannter Widerspruch wird im selben Änderungssatz korrigiert.

## Statusbegriffe

- **VORHANDEN:** im aktuellen Code implementiert und durch Codepfad, Test oder datierte Live-Prüfung nachweisbar.
- **TEILWEISE:** nutzbare Grundlage vorhanden, aber eine konkret benannte Anforderung offen.
- **GEPLANT:** freigegebenes Ziel ohne vollständige Implementierung.
- **FEHLT:** benötigte Fähigkeit ohne belastbare Implementierung.
- **BLOCKIERT:** Fortsetzung benötigt eine konkret benannte externe Voraussetzung.

Ein lokaler Test, eine Simulation oder ein Node-Referenzpfad beweist nicht automatisch die Funktion der PHP-Produktion. Live-Aussagen benötigen Datum und geprüfte Umgebung.

## Plattformregel

Neutral Core 1.0 muss produktiv mit PHP 8.1+, MySQL/MariaDB, HTTPS und den üblichen Dateirechten eines Shared Hostings funktionieren. Node.js, Redis, WebSockets, permanente Worker und native Store-Werkzeuge sind optionale spätere Adapter und keine Voraussetzung für Core 1.0.

## Pflege bei jeder materiellen Änderung

Eine Änderung ist erst dokumentarisch abgeschlossen, wenn der betroffene Vertrag, `STATUS.md`, `TODO.md` und die operativen Übergabedateien gemäß `WORKFLOW.md` gemeinsam aktuell sind, relevante Testergebnisse wahrheitsgemäß genannt werden und keine Secrets oder hostlokalen Zugangsdaten aufgenommen wurden.

Abgeschlossene Aufgaben und historische Zwischenstände gehören nicht dauerhaft in `TODO.md`, `CURRENT-TASK.md`, `CHATGPT.md` oder andere aktive Vertragsdateien. Historische Nachvollziehbarkeit liefert die Git-History.

Operations contracts for device sessions, permission domains, maintenance, infrastructure truth, audit retention and backup automation are authoritative in `Security.md`, `Architecture.md`, `API.md`, `Database.md` and `Install-README-Server.md`.

The Phase-2 operations response, migration, backup-readiness, release and Admin UI contracts are recorded in `API.md`, `Database.md`, `Security.md`, `Architecture.md`, `UI-UX.md` and `Install-README-Server.md`.

# NEUTRAL – Dokumentationsordnung

**Status:** VERBINDLICH  
**Geprüft:** 2026-09-13

Diese Datei ist der Einstieg für jede zukünftige Arbeit am Repository. Sie legt fest, wo Anforderungen, Ist-Zustand und nächste Schritte stehen. Historische Entwicklung wird über die Git-History nachvollzogen und nicht in parallelen Chronikdateien gepflegt.

## Verbindliche Reihenfolge

1. [`VISION.md`](VISION.md) beschreibt das langfristige, technologieunabhängige Ziel.
2. [`CORE-1.0.md`](CORE-1.0.md) definiert Umfang und Abnahme von Neutral Core 1.0.
3. [`Architecture.md`](Architecture.md) und [`ModuleCreation.md`](ModuleCreation.md) definieren Systemgrenzen und Erweiterungsverträge.
4. [`UI-UX.md`](UI-UX.md) und [`I18N.md`](I18N.md) definieren UI-/UX- und Internationalisierungsverträge.
5. [`API.md`](API.md), [`Database.md`](Database.md), [`Security.md`](Security.md), [`Functions.md`](Functions.md), [`BACKUP-CONTRACT.md`](BACKUP-CONTRACT.md) und [`USER-ACCOUNT-LICENSE-MODEL.md`](USER-ACCOUNT-LICENSE-MODEL.md) dokumentieren Fachverträge.
6. [`STATUS.md`](STATUS.md) beschreibt den aktuell nachgewiesenen Stand, ohne Anforderungen zu verändern.
7. [`TODO.md`](TODO.md) enthält ausschließlich die nächsten ausführbaren Arbeiten.

[`ROADMAP.md`](ROADMAP.md) enthält bewusst auf später verschobene Ziele. Installationsanleitungen konkretisieren ausschließlich den Betrieb und stehen unter den genannten Verträgen.

[`DEVELOPMENT.md`](DEVELOPMENT.md) beschreibt die lokale Entwicklungsumgebung. [`CONNECTIONS.md`](CONNECTIONS.md) beschreibt den secretsicheren Betriebs-/Recoveryweg. Beide sind keine Quelle für neue Produktanforderungen.

## Relevanzregel

Nicht jeder Auftrag benötigt alle Vertragsdateien vollständig. Betroffene Verträge müssen aber vor einer materiellen Änderung gelesen werden. UI-, Navigation-, Sprache-, Locale-, Modul-, Security-, API-, Storage-, Account- oder Backupänderungen beziehen jeweils die zuständigen Verträge ein.

Neue Module dürfen keine Architektur einführen, die zentrale Core-, I18N-, Security-, Storage- oder Lifecycle-Verträge durch inkompatible Insellösungen ersetzt.

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

Neutral Core 1.0 muss produktiv mit PHP 8.1+, MySQL/MariaDB, HTTPS und normalen Shared-Hosting-Rechten funktionieren. Node.js, Redis, WebSockets, permanente Worker und native Store-Werkzeuge sind keine Voraussetzung für Core 1.0.

## Pflege bei materiellen Änderungen

Eine Änderung ist dokumentarisch erst abgeschlossen, wenn der betroffene Vertrag, `STATUS.md`, `TODO.md` und die operativen Übergabedateien gemäß `WORKFLOW.md` gemeinsam aktuell sind, relevante Testergebnisse wahrheitsgemäß genannt werden und keine Secrets oder hostlokalen Zugangsdaten aufgenommen wurden.

Abgeschlossene Aufgaben und historische Zwischenstände gehören nicht dauerhaft in `TODO.md`, `CURRENT-TASK.md`, `CHATGPT.md` oder aktive Vertragsdateien. Historische Nachvollziehbarkeit liefert ausschließlich die Git-History.
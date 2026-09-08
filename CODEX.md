# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG

# Aktueller Auftrag

## P4 live abschließen + Admin → Appearance bereinigen

Synchronisiere zuerst vollständig mit `origin/main` und bewahre alle neueren Änderungen.

Lies vor Implementierung vollständig:

- `WORKFLOW.md`
- `DOCUMENTATION.md`
- `CODEX.md`
- `CURRENT-TASK.md`
- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- `CHANGELOG.md`
- `UI-UX.md`
- `USER-UI-DESIGN.md`
- `I18N.md`
- `VISION.md`
- `CORE-1.0.md`
- `Architecture.md`
- `Functions.md`
- `ModuleCreation.md`
- alle relevanten Admin-Appearance-, Settings-, User-App-, Theme-, Homepage-, CSS-, Service-Worker-, Cache-/Storage- und Testdateien

Übernimm danach den vollständigen Auftrag nach `CURRENT-TASK.md` und prüfe vor Implementierung:

`CODEX.md == CURRENT-TASK-Anforderungen`

# 1. Neuer Betreiber-Livebefund: P4-Warmstart jetzt positiv bestätigt

Der Betreiber hat den letzten iPad/Safari-Retest nach dem Fix des statischen `Loading…`-Zwischenzustands durchgeführt.

**Live bestätigt:**

- Dark Theme aktiv.
- mehrfacher Reload/Warmstart durchgeführt.
- **kein weißes `Loading…` mehr sichtbar.**
- **kein heller/weißer Flash mehr sichtbar.**
- lokaler Homepageinhalt erscheint ohne den bisherigen sichtbaren Zwischenzustand.

Damit ist genau der bisher noch offene letzte Device-Retest-Punkt des P4-Warmstart-/First-Paint-Fixes positiv bestätigt.

## Auftrag

Aktualisiere die operative Wahrheit in den Status-/Workflow-/TODO-/CHANGELOG-Dokumenten entsprechend.

WICHTIG:

- Historische Fehlbefunde bleiben als Evidenz erhalten, dürfen aber nicht weiter als aktiver Status erscheinen.
- P1 bleibt `LIVE BESTANDEN`.
- P4 darf jetzt **nur dann** auf `LIVE BESTANDEN` gesetzt werden, wenn die bestehende Status-/Abnahmelogik nach dem aktuellen Betreiberbefund keine weiteren noch offenen P4-Pflichtpunkte enthält.
- Falls innerhalb des definierten P4-Scopes noch ein echter Pflichtpunkt offen ist, benenne ihn präzise und markiere nicht pauschal alles als bestanden.
- Nicht mit späteren Zukunftsfeatures wie vollständigem I18N oder User-UI-Design vermischen. Diese sind dokumentierte Folgearchitektur, nicht rückwirkende P4-Blocker, sofern CORE-/P4-Vertrag nichts anderes verlangt.

# 2. Admin → Appearance: tote/missverständliche Controls entfernen

Der Betreiber hat `Admin → Appearance` geprüft.

Aktuell enthält die Ansicht unter `Theme & Layout`:

- `Theme → System Default / Light / Dark`
- `Layout → Default / Compact`

Repositoryprüfung ergab:

## Admin-Theme

Die Admin-UI besitzt bereits einen **eigenen funktionierenden lokalen Theme-State** über den Header-Schalter und `neutral-admin-theme`.

## User-Theme

Die User-App besitzt ebenfalls einen **eigenen funktionierenden lokalen Theme-State** über den Sonne-/Mond-Schalter und `neutral.user.theme.v1`.

## Globales `settings.theme`

Das in `Admin → Appearance` gespeicherte `settings.theme` ist dadurch mindestens missverständlich/überholt und darf nicht als scheinbar wirksame User- oder Admin-Theme-Steuerung dargestellt werden, wenn kein produktiver Consumer existiert.

## `settings.layout`

Repositoryweite Prüfung ergab keinen produktiven Consumer, der `settings.layout = default|compact` für User-App oder Admin-UI tatsächlich ausliest und anwendet. Das Control ist damit aktuell funktionslos/vorbereitet, nicht real produktiv wirksam.

## Auftrag

Entferne aus `Admin → Appearance` den gesamten derzeitigen sichtbaren Block **`Theme & Layout`**, sofern eine erneute vollständige Codeprüfung bestätigt, dass `settings.theme` und `settings.layout` keine heute erforderliche produktive Wirkung besitzen.

Die Ansicht soll danach im aktuellen Scope im Wesentlichen mit **`Global Start Page`** beginnen.

WICHTIG:

- den funktionierenden Admin-Theme-Schalter im Admin-Header **nicht entfernen**;
- den funktionierenden User-Theme-Schalter im User-Header **nicht entfernen**;
- keine Theme-/Layout-Funktionalität vortäuschen;
- vorhandene gespeicherte Altwerte `settings.theme` / `settings.layout` müssen nicht destruktiv aus bestehenden Daten gelöscht werden, sofern dies unnötige Migration/Kompatibilitätsrisiken erzeugt;
- aber neue Saves aus `Admin → Appearance` sollen diese toten Controls nicht mehr neu abfragen oder als aktive UI-Funktion führen;
- beim Speichern der Homepage bestehende andere Settings nicht versehentlich löschen;
- Global Start Page, Module-/HTML-Modus und Preview dürfen nicht regressieren.

# 3. Zukunftsvertrag nur respektieren, nicht jetzt implementieren

Neu dokumentiert und verbindlich zu respektieren:

## `USER-UI-DESIGN.md`

Langfristig soll `Admin → Appearance` die **User-UI-Gestaltung** über zentrale Design-Tokens konfigurieren können, inklusive Farben, Typografie, Buttons, Navigation, Karten/Formulare, Layoutparameter sowie Light-/Dark-Designwerte. Optional später Advanced Custom CSS.

Dieser Auftrag implementiert diese neue Designverwaltung **noch nicht**, außer minimale strukturelle Vorbereitungen sind für die saubere Entfernung der toten Controls zwingend notwendig.

Keine halbfertige Design-Editor-UI anlegen.

## `I18N.md`

Langfristig:

- Erststart: Gerätesprache erkennen;
- Fallback auf Basissprache;
- spätere User-Auswahl über `Settings → Language`;
- explizite User-Auswahl hat Vorrang und bleibt lokal/offline;
- zentrale I18N-Schicht für Core und Module.

Auch dies ist **nicht Teil dieses Auftrags**.

# Tests

Regressionstests zuerst ergänzen/anpassen.

Mindestens prüfen:

## Status / P4

- Dokumente spiegeln den neuen echten Livebefund korrekt wider;
- historische `DEVICE RETEST REQUIRED`-Aussagen werden nur dort entfernt/ersetzt, wo der Betreiber sie tatsächlich positiv bestätigt hat;
- P1 bleibt korrekt `LIVE BESTANDEN`;
- keine Zukunftsfeatures fälschlich als implementiert markieren.

## Appearance

- `Theme & Layout` erscheint nicht mehr in `Admin → Appearance`;
- `theme`-Select erscheint dort nicht mehr;
- `layout`-Select erscheint dort nicht mehr;
- `Global Start Page` bleibt vollständig funktionsfähig;
- HTML-Modus bleibt funktionsfähig;
- Module-Modus bleibt funktionsfähig;
- Preview bleibt funktionsfähig;
- Save/Reload bleibt funktionsfähig;
- bestehende andere Settings werden beim Save nicht unbeabsichtigt entfernt;
- Admin-Header-Theme bleibt unverändert funktionsfähig;
- User-Header-Theme bleibt unverändert funktionsfähig.

## Regression

- Warmstart ohne `Loading…`/Flash-Codepfad bleibt erhalten;
- Homepage Local-first Cache;
- Home/GPS;
- GPS;
- Login;
- Buttonsystem;
- P1 User-/Admin-Sessiontrennung;
- Auth/CSRF;
- Service Worker;
- Packaging/Base Path;
- FTPS-/Smoke-Stabilisierung.

# Abschluss

Danach vollständig gemäß `WORKFLOW.md`:

- fokussierte Tests;
- vollständige Test-Suite;
- PHP-Lint;
- JavaScript-Syntaxcheck;
- `git diff --check`;
- Produktionspaket;
- Secret-/Artefaktprüfung;
- relevante Status-/TODO-/CHANGELOG-/Workflow-Dokumentation wahrheitsgemäß aktualisieren;
- Commit und Push nach `main`;
- `HEAD == origin/main`;
- Working Tree sauber;
- FTPS und CodeQL bis terminal abwarten;
- vollständigen Abschlussbericht nach `CHATGPT.md` schreiben und auf GitHub `main` verifizieren;
- erst danach Abschlussmeldung.

Keine selbst ausführbaren offenen Punkte zurücklassen.

## Betreiber-Retest danach

Nur kurzer visueller Kontrolltest:

1. `Admin → Appearance` öffnen.
2. Prüfen: `Theme & Layout` ist entfernt.
3. `Global Start Page` ist weiterhin vorhanden.
4. HTML-Inhalt speichern und User-App kurz prüfen.
5. Admin-Header-Theme und User-Header-Theme kurz regressiv prüfen.

Wenn P4 nach der bestehenden Abnahmelogik mit dem bereits bestätigten Warmstartbefund vollständig erfüllt ist, Status entsprechend auf `LIVE BESTANDEN` setzen; andernfalls den verbliebenen konkreten Pflichtpunkt benennen.

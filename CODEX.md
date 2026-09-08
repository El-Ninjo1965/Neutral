# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG

# Aktueller Auftrag

## Zwei verbleibende Device-Retest-Punkte: HTML-Dark-Frame + redundante Theme-Settings

Synchronisiere zuerst vollständig mit `origin/main` und bewahre alle neueren Änderungen.

Lies vor Implementierung vollständig `WORKFLOW.md`, `DOCUMENTATION.md`, `CODEX.md`, `CURRENT-TASK.md`, `UI-UX.md`, `I18N.md`, `VISION.md`, `CORE-1.0.md`, `Architecture.md`, `Functions.md`, `ModuleCreation.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md` sowie alle relevanten User-App-, Theme-, Settings-, Homepage-/iframe-, CSS- und Testdateien.

Übernimm danach den vollständigen Auftrag nach `CURRENT-TASK.md` und prüfe vor Implementierung:

`CODEX.md == CURRENT-TASK-Anforderungen`

## Betreiber-Device-Retest vom 2026-09-08

### Live bestätigt – nicht zurückbauen

- Local-first Warmstart funktioniert ohne sichtbares früheres `Loading`.
- Sonne-/Mond-Schnellumschaltung im Header funktioniert und wechselt Theme unmittelbar.
- Home-Icon anstelle von `Start` ist live sichtbar und wird vom Betreiber als Verbesserung akzeptiert.
- Home/GPS-Navigation ist als App-Navigation erkennbar.
- überarbeitetes Buttonsystem im Dark Mode ist konsistent genug für den aktuellen Stand.
- GPS-Darstellung im Dark Mode ist sauber und lesbar.
- Login-/Header-Actions funktionieren.
- FTPS-Stabilisierung nicht zurückbauen.

Es verbleiben zwei konkrete Punkte.

# Arbeitspaket A – HTML-Homepage bleibt auf iPad/Safari im Dark Mode weiß

Der letzte Fix ist auf dem realen Betreibergerät **nicht erfolgreich**.

Live-Screenshot nach aktuellem Deploy:

- App selbst ist eindeutig im Dark Theme.
- gespeicherter Homepageinhalt ist weiterhin das schlichte `<h1>TEST</h1>`.
- trotzdem zeigt der sandboxed HTML-Homepage-Bereich weiterhin eine große weiße rechteckige Fläche.

Der vorherige Ansatz, dem `srcdoc`-iframe beim Erstellen den aktuellen lokalen `color-scheme` zu geben, reicht auf dem realen iPad/Safari also nicht aus.

## Auftrag

Untersuche den tatsächlichen Safari/WebKit-Rendervertrag für sandboxed `iframe[srcdoc]` im Dark Theme und behebe die Frameworkursache robust.

WICHTIG:

- Nicht erneut nur denselben `color-scheme`-Ansatz umformulieren.
- Der reale Device-Befund widerlegt die Annahme, dass dieser Ansatz allein genügt.
- Freies Administrator-HTML darf weiterhin nicht heuristisch verändert, sanitisiert oder inhaltlich umgeschrieben werden.
- Explizit vom Administrator gesetztes CSS/Background muss weiterhin Vorrang haben.

Prüfe insbesondere:

- Safari/WebKit-Verhalten von `iframe[srcdoc]`, `color-scheme` und transparentem iframe canvas;
- ob das iframe-Dokument ohne eigene `html/body`-Background-Regel standardmäßig einen weißen Canvas erzeugt;
- ob ein frameworkseitiges neutrales Dokumentgerüst um den freien Body-Inhalt technisch notwendig ist;
- ob Theme-Information über CSS Custom Properties, `prefers-color-scheme`, `meta name=color-scheme`, dokumenteigene Styles oder einen anderen sicheren Mechanismus in den isolierten Browsing Context übertragen werden muss;
- ob `srcdoc` als kompletter Dokumentinhalt oder Body-Fragment behandelt wird und welche Fälle unterstützt werden müssen;
- Warmstart und Theme-Wechsel nach bereits gerendertem iframe: der Frame muss bei Light↔Dark korrekt mitwechseln;
- Sandbox-/Security-Vertrag darf nicht geschwächt werden.

## Zielvertrag

Für freien Homepageinhalt ohne explizite Hintergrundgestaltung, z. B.:

`<h1>TEST</h1>`

muss der Framework-Renderpfad im Dark Theme einen zum App-Theme passenden neutralen Hintergrund/Text-Farbraum bereitstellen und im Light Theme entsprechend hell darstellen.

Wenn der Administrator dagegen ausdrücklich z. B. `body { background: white; }` oder eine äquivalente eigene Gestaltung setzt, muss diese eigene Gestaltung sichtbar bleiben.

Der Framework-Theme-Adapter darf also **Defaults bereitstellen, aber keine explizite Administratorgestaltung überschreiben**.

Bevorzugt eine standardsaubere, Safari-kompatible Lösung entwickeln und durch Tests absichern. Keine UA-Sniffing-Sonderlösung, sofern nicht zwingend erforderlich und begründet.

# Arbeitspaket B – Appearance/Theme aus User-Settings entfernen

Der Betreiber hat den aktuellen Settings-Screenshot geprüft.

Der gesamte Block:

- `Appearance`
- Erklärung `Choose the theme used by this app. It is stored locally and works offline.`
- `Theme`
- Light/Dark-Select

ist jetzt redundant, weil die User-App bereits den unmittelbar erreichbaren Sonne-/Mond-Schnellumschalter im Header besitzt.

## Auftrag

Entferne den **Appearance/Theme-Block aus den normalen User-Settings**.

WICHTIG:

- Theme-Funktionalität selbst bleibt vollständig erhalten.
- Header-Sonne/Mond bleibt der normale User-Zugriff für Light/Dark.
- derselbe persistente lokale Theme-State bleibt erhalten.
- Theme-Persistenz, Offline-Funktion und sofortiger Wechsel bleiben erhalten.
- keine Serverabhängigkeit hinzufügen.
- keine Admin-/Developer-Theme-Konfiguration entfernen, falls eine solche separat existiert und fachlich benötigt wird; Auftrag betrifft die normale User-Settings-Seite.
- nach Entfernen keine leeren Container, Überschriften oder unnötigen Abstände hinterlassen.

Die User-Settings sollen dadurch kompakter werden und mit `App areas`, `Privacy and sharing` usw. beginnen, soweit dies dem bestehenden Aufbau entspricht.

# Tests

Regressionstests zuerst ergänzen/anpassen.

## HTML iframe / Theme

Mindestens beweisen:

- `<h1>TEST</h1>` erhält im Dark Theme einen neutralen Dark-Default statt weißem UA-Canvas;
- derselbe Inhalt erhält im Light Theme einen passenden Light-Default;
- Theme-Wechsel aktualisiert einen bereits vorhandenen HTML-Homepage-Frame korrekt;
- explizites Administrator-CSS für Background/Text bleibt maßgeblich und wird nicht überschrieben;
- freier Inhalt wird nicht semantisch verändert;
- sandbox/security-Attribute bleiben unverändert bzw. mindestens gleich restriktiv;
- Local-first Warmstart/Cache bleibt erhalten;
- vollständiges HTML-Dokument und einfaches HTML-Fragment werden nach bestehendem Vertrag korrekt behandelt oder der tatsächlich unterstützte Vertrag wird sauber definiert und getestet.

## User Settings

- Appearance/Theme-Block erscheint nicht mehr in normalen User-Settings;
- Header-Theme-Switch bleibt vorhanden und funktionsfähig;
- Theme-State bleibt nach Reload persistent;
- Offline-Theme bleibt funktionsfähig;
- `App areas` und `Privacy and sharing` bleiben unverändert funktionsfähig;
- keine leere Appearance-Struktur bleibt im DOM sichtbar.

## Regression

- Home-Icon und Home-Navigation;
- GPS;
- Buttonsystem Light/Dark;
- Login;
- P1 User-/Admin-Sessiontrennung;
- Auth/CSRF;
- HTML-Homepage;
- Warmstart;
- Service Worker;
- Packaging/Base Path;
- FTPS-/Smoke-Stabilisierung.

# Abschluss

Dokumentiere die tatsächliche Root Cause des Safari/iPad-White-Frame-Problems in `CHATGPT.md`. Keine bloße Vermutung als bestätigt darstellen.

Aktualisiere dauerhafte Dokumentation nur, wenn ein neuer allgemeiner Vertrag entsteht.

Danach vollständig gemäß `WORKFLOW.md`:

- fokussierte Tests;
- vollständige Test-Suite;
- PHP-Lint;
- JavaScript-Syntaxcheck;
- `git diff --check`;
- Produktionspaket;
- Secret-/Artefaktprüfung;
- relevante Status-/TODO-/CHANGELOG-Dokumentation wahrheitsgemäß aktualisieren;
- Commit und Push nach `main`;
- `HEAD == origin/main`;
- Working Tree sauber;
- FTPS und CodeQL bis terminal abwarten;
- vollständigen Abschlussbericht nach `CHATGPT.md` schreiben und auf GitHub `main` verifizieren;
- erst danach Abschlussmeldung.

Keine selbst ausführbaren offenen Punkte zurücklassen.

## Betreiber-Retest danach

`CHATGPT.md` soll nur die noch nötigen kurzen Schritte nennen:

1. Dark aktivieren und HTML-Homepage `<h1>TEST</h1>` prüfen: keine künstliche große weiße Frameworkfläche.
2. Light aktivieren und denselben Inhalt prüfen.
3. Settings öffnen: Appearance/Theme-Block ist entfernt; App areas/Privacy bleiben vorhanden.
4. Theme über Header wechseln, Reload durchführen und Persistenz bestätigen.
5. Home/GPS/Warmstart kurz regressiv prüfen.

Bis zum positiven realen Device-Retest keine vollständige P4-Livefreigabe erfinden.

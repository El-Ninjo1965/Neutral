# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG

# Aktueller Auftrag

## User-App Visual Cleanup nach Betreiber-Device-Retest

Synchronisiere zuerst vollständig mit `origin/main` und bewahre alle neueren Änderungen.

Lies vor Implementierung vollständig `WORKFLOW.md`, `DOCUMENTATION.md`, `CODEX.md`, `CURRENT-TASK.md`, `UI-UX.md`, `I18N.md`, `VISION.md`, `CORE-1.0.md`, `Architecture.md`, `Functions.md`, `ModuleCreation.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md` sowie alle relevanten User-App-, Theme-, Designsystem-, Navigation-, Login-, Homepage-, CSS- und Testdateien.

Übernimm danach den vollständigen Auftrag nach `CURRENT-TASK.md` und prüfe vor Implementierung:

`CODEX.md == CURRENT-TASK-Anforderungen`

## Betreiber-Device-Retest vom 2026-09-08

### Jetzt live bestätigt – nicht zurückbauen

- Local-first Warmstart funktioniert ohne das frühere sichtbare `Loading`.
- Sonne-/Mond-Schnellumschaltung im Header funktioniert.
- Theme-Wechsel erfolgt unmittelbar.
- GPS-Darstellung im Dark Mode ist jetzt sauber: Hintergrund, Karte, Texte und Buttons sind konsistent und lesbar.
- Header-Actions sind im Dark Mode konsistent.
- Light Mode funktioniert grundsätzlich.
- `Start` / `GPS` sind als touchbare Navigation erkennbar.
- HTML-Homepage funktioniert weiterhin.
- GPS funktioniert weiterhin.
- FTPS-Stabilisierung des vorherigen Auftrags nicht zurückbauen.

P4 bleibt bis zum Abschluss dieses visuellen Folge-Retests unterhalb `LIVE BESTANDEN`.

# Arbeitspaket A – Zentrales Button-/Navigation-Design verfeinern

Der Betreiber bewertet das aktuelle Button-Design, **besonders im Light Mode**, noch nicht als ausreichend hochwertig.

Live sichtbar:

- `Start` / `GPS` wirken im Light Mode zu weich/weiß und besitzen zu wenig klare visuelle Hierarchie.
- aktiver und inaktiver Zustand sollen klarer und hochwertiger wirken, ohne grell zu werden;
- Theme-, Settings-, Login- und Navigationsbuttons wirken noch nicht vollständig wie Teile eines gemeinsamen Designsystems;
- `Login` ist visuell sehr dominant gegenüber den übrigen Header-Actions;
- Radien, Höhen, Border-Stärke, Innenabstände und Zustände sollen systematisch konsistent sein.

## Auftrag

Überarbeite das zentrale Button-/Navigation-System als Frameworkvertrag, nicht als Sammlung einzelner Screenshot-Hacks.

Ziel:

- einheitliche zentrale Button-Tokens bzw. gemeinsame Komponenten-/Klassenverträge;
- Light Mode mit klarer Kontur und ausreichendem Kontrast;
- Dark Mode mindestens auf dem jetzt erreichten Qualitätsniveau halten;
- klarer aktiver Navigationszustand;
- ruhiger inaktiver Zustand;
- Primary/Secondary/Navigation/Icon-Button-Hierarchie nachvollziehbar;
- Header-Actions und Navigation wirken aus derselben Designsprache;
- `Login` darf als Aktion erkennbar sein, soll aber die gesamte Navigation nicht unnötig dominieren;
- konsistente Höhe, Radius, Border, Padding und Touchfläche;
- Hover nur ergänzend für Pointer/Desktop;
- Touch darf nicht von Hover abhängen;
- sichtbarer Keyboard-Fokus;
- ausreichender Kontrast;
- zukünftige Module erben den zentralen Navigations-/Buttonvertrag.

Keine komplette Neugestaltung des gesamten Designsystems. Bestehende zentrale Tokens sinnvoll erweitern/verwenden.

# Arbeitspaket B – `Start` durch Home-Icon ersetzen

Der Textlink/-button `Start` soll in der zentralen User-App-Navigation durch ein etabliertes **Home-/Haus-Icon** ersetzt werden.

Anforderungen:

- international verständliches Home-Symbol;
- keine externe Netzwerkabhängigkeit für das Icon;
- keine zufällige Emoji-Darstellung;
- bestehende zentrale Icon-/Asset-/SVG-Lösung verwenden oder eine saubere lokale Lösung schaffen;
- touchgerechte Icon-Button-Fläche;
- aktiver/inaktiver Zustand über denselben Navigationsvertrag wie Modulnavigation;
- `aria-label`/accessible name `Start` bzw. lokalisierbarer äquivalenter Schlüssel;
- Tooltip/Title soweit für Verständlichkeit sinnvoll;
- Tastaturfokus sichtbar;
- Screenreader-Bedienbarkeit erhalten;
- bestehende Startlogik/Route/Homepage-Verhalten nicht verändern.

`GPS` vorerst als Textbezeichnung belassen. Keine allgemeine Modul-Icon-Architektur improvisieren. Eine solche Entscheidung kann später separat für alle Module getroffen werden.

# Arbeitspaket C – HTML-Homepage Dark-Mode-Fläche ursächlich prüfen

Im aktuellen Betreiber-Screenshot erscheint bei Dark Theme und gespeichertem Inhalt `<h1>TEST</h1>` weiterhin eine **große weiße rechteckige Inhaltsfläche**.

Der vorherige Auftrag sollte den Frameworkcontainer transparent/theme-neutral machen. Deshalb jetzt Root Cause tatsächlich feststellen.

Prüfe:

- den exakt gespeicherten Homepagewert und dessen Renderpfad;
- ob die weiße Fläche vom Frameworkcontainer stammt;
- ob eine CSS-Regel, ein Default-Style, Sanitizer-/Renderer-Wrapper oder ein anderer User-App-Container weiterhin `white/#fff` erzwingt;
- ob die Fläche Bestandteil des tatsächlich gespeicherten freien Administrator-HTML/CSS ist.

Regel:

- Wenn die weiße Fläche vom Framework stammt: zentral korrigieren, sodass ein simples `<h1>TEST</h1>` keinen künstlichen riesigen weißen Block im Dark Mode erzeugt.
- Wenn die weiße Fläche ausdrücklich aus dem gespeicherten Administrator-HTML/CSS stammt: freien Inhalt **nicht** automatisch umschreiben. Root Cause dokumentieren und im Abschlussbericht klar benennen.

Keine heuristische Manipulation freien Administrator-HTMLs.

# Arbeitspaket D – Login-Seite von Framework-/Developertext bereinigen

Im Betreiber-Screenshot der anonymen Login-Seite stehen weiterhin unnötige bzw. technische Texte:

- `ACCOUNT ACCESS`
- `Use your local workspace account to unlock available features.`
- `Sign in with your configured account.`

Insbesondere `local workspace account` ist technische Framework-/Workspace-Sprache und widerspricht dem bestehenden User-App-UX-Vertrag.

## Ziel

Die normale Login-Seite soll knapp und produktorientiert sein.

Standarddarstellung im Kern:

- `Login` bzw. bestehende lokalisierbare Produktbezeichnung;
- Username;
- Password;
- Login-Button;
- notwendige echte Fehler-/Statusmeldungen nur dann, wenn sie tatsächlich relevant sind.

Entferne redundante Erklärungstexte und Framework-/Workspace-Terminologie aus der normalen User-App.

WICHTIG:

- Authentifizierungslogik nicht verändern;
- echte Login-Fehler weiterhin klar anzeigen;
- Accessibility/Labels nicht entfernen;
- I18N-Verträge respektieren; keine neue umfassende I18N-Architektur beginnen.

# Tests

Regressionstests zuerst ergänzen/anpassen.

Mindestens soweit automatisiert sinnvoll beweisen:

## Button/Navigation

- zentrale Navigation verwendet den gemeinsamen Button-/Navigation-Vertrag;
- Light/Dark nutzen zentrale Tokens;
- aktive/inaktive Zustände bleiben eindeutig;
- Header-Actions verwenden konsistente zentrale Buttonvarianten;
- Fokuszustände bleiben sichtbar;
- Touchgrößen bleiben ausreichend;
- persönliche `App areas` bleiben funktional.

## Home-Icon

- `Start`-Text wird in der sichtbaren Navigation durch lokales Home-Icon ersetzt;
- accessible name bleibt vorhanden;
- Startnavigation funktioniert unverändert;
- aktiver Zustand funktioniert;
- keine externe Icon-Abhängigkeit.

## HTML

- simples `<h1>TEST</h1>` erhält vom Framework im Dark Mode keinen erzwungenen weißen Vollflächencontainer;
- freies Administrator-HTML wird nicht automatisch verändert;
- Warmstart/Cache bleibt funktionsfähig.

## Login

- `local workspace account` erscheint nicht mehr in der normalen User-App;
- redundante Standardhinweise sind entfernt;
- Username-/Password-Labels und Login-Aktion bleiben vorhanden;
- echte Authfehler bleiben darstellbar;
- Login-Funktionalität bleibt unverändert.

## Regression

- Theme-Schnellumschaltung;
- Theme-Persistenz/Offline;
- GPS;
- HTML-Homepage;
- Warmstart;
- Login;
- P1 User-/Admin-Sessiontrennung;
- Auth/CSRF;
- Service Worker;
- Packaging/Base Path;
- FTPS-/Smoke-Stabilisierung.

# Abschluss

Dokumentiere Root Causes und Änderungen vollständig in `CHATGPT.md`.

Aktualisiere dauerhafte Dokumentation nur, wenn tatsächlich ein neuer allgemeiner Vertrag entsteht.

Danach gemäß `WORKFLOW.md` vollständig:

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

`CHATGPT.md` soll einen kurzen Device-Retest liefern für:

1. Light Mode: Header-Buttons + Home/GPS-Navigation visuell prüfen.
2. Dark Mode: dieselben Elemente regressiv prüfen.
3. Home-Icon antippen und Startfunktion bestätigen.
4. HTML `<h1>TEST</h1>` in Dark prüfen.
5. Login-Seite auf reduzierte, nicht-technische Darstellung prüfen.
6. Warmstart, GPS und Theme-Switch kurz regressiv bestätigen.

Bis zu diesem Betreiber-Retest keine erfundene vollständige Live-Bestätigung.

# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG

# Aktueller Auftrag

## `Admin → Appearance` zum echten User-UI-Designeditor ausbauen

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
- alle relevanten Admin-Appearance-, Settings-/API-, User-App-, Theme-/Token-, Homepage-, CSS-, Cache-/Storage-, Service-Worker-, Security- und Testdateien

Übernimm danach den vollständigen Auftrag nach `CURRENT-TASK.md` und prüfe vor Implementierung:

`CODEX.md == CURRENT-TASK-Anforderungen`

# Ausgangslage / Betreiberentscheidung

P1 und P4 sind `LIVE BESTANDEN` und dürfen nicht zurückgebaut werden.

Der Betreiber hat `Admin → Appearance` nach der letzten Bereinigung live geprüft:

- der tote `Theme & Layout`-Block ist korrekt entfernt;
- `Global Start Page` bleibt sichtbar und funktionsfähig;
- die Adminansicht soll als Oberbereich weiterhin **`Appearance`** heißen;
- der Bereich soll jetzt gemäß `USER-UI-DESIGN.md` tatsächlich zur Gestaltung der **User-App** erweitert werden.

WICHTIGE TRENNUNG:

- Admin-Header-Light/Dark steuert ausschließlich die Admin-UI und bleibt unverändert.
- User-Header-Sonne/Mond steuert die persönliche Light/Dark-Auswahl des Endnutzers und bleibt unverändert/lokal/offline.
- Der neue Admin-Designeditor definiert, **wie die User-App in Light und Dark aussieht**, nicht welcher Modus beim einzelnen Nutzer aktiv ist.
- Keine Rückkehr zu einem konkurrierenden globalen `settings.theme`-State.

# Zielstruktur von `Admin → Appearance`

Der Oberbereich bleibt `Appearance`.

Darunter fachlich klar getrennte Bereiche:

1. **Start Page** – bestehende Global-Start-Page-Funktion, vollständig erhalten.
2. **User UI Design** – strukturierter Editor für zentrale User-App-Design-Tokens.
3. **Advanced Custom CSS** – optionaler Experten-Override nach dem strukturierten Designsystem.

Keine unnötige zusätzliche Navigationsebene bauen, wenn eine klare progressive Darstellung innerhalb von `Appearance` auf Tablet/Desktop und Mobile besser ist. UX gemäß bestehendem Admin-CMS-Vertrag.

# Arbeitspaket A – bestehende Appearance-Benennung konsistent machen

Der Admin-Seitentitel/Breadcrumb kann derzeit noch `Theme & Layout` heißen, obwohl dieser alte Block entfernt wurde.

Korrigiere die sichtbare Bezeichnung konsistent auf **`Appearance`**.

Keine alte `Theme & Layout`-Terminologie als aktiven Seitentitel stehen lassen.

# Arbeitspaket B – User UI Design als strukturierter Token-Editor

Implementiere eine erste produktiv nutzbare Version des in `USER-UI-DESIGN.md` dokumentierten Vertrags.

## Grundprinzip

Der Admin editiert keine einzelnen Modul-CSS-Dateien. Er editiert einen zentralen, validierten User-UI-Designzustand. Die User-App projiziert diesen Zustand auf veröffentlichte CSS Custom Properties/Design-Tokens. Framework-Komponenten und Module, die den zentralen Vertrag verwenden, erben die Änderung automatisch.

Bestehende Default-CSS-Werte bleiben die sichere Basis. Fehlt eine Konfiguration oder ist sie ungültig, fällt die User-App kontrolliert auf diese Defaults zurück.

## Erste konfigurierbare Bereiche

Die erste Version soll sinnvoll und überschaubar bleiben. Mindestens:

### Farben – getrennt für Light und Dark

- App/Page Background
- Surface/Card Background
- Primary/Accent
- Primary Text
- Muted Text
- Border

Nutze bestehende semantische Tokens, statt parallele Farbsysteme zu erfinden. Falls die aktuellen Tokenbezeichnungen anders heißen, mappe den Adminvertrag sauber auf die vorhandenen zentralen Variablen.

### Form / Geometrie – gemeinsame Werte, soweit fachlich sinnvoll

- Button-/Control-Radius
- Card/Surface-Radius
- zentrale Content-Max-Width bzw. geeigneter bestehender Layoutparameter, **nur wenn** er bereits sauber zentral abbildbar ist

### Typografie

Keine unsichere freie Font-URL- oder Remote-Font-Funktion einführen.

Für V1 nur solche Typografieparameter anbieten, die ohne externe Abhängigkeit robust zentral steuerbar sind, z. B. Basisschriftgröße bzw. vorhandene sichere Font-Stack-Auswahl, falls bereits im Framework vorgesehen. Wenn die bestehende Architektur dafür noch keinen sauberen Token besitzt, nicht künstlich eine halbfertige Fontverwaltung erfinden; Root Cause/Entscheidung dokumentieren.

## Light/Dark-Vertrag

- Designwerte für Light und Dark werden getrennt gespeichert, wo unterschiedliche Farben sinnvoll sind.
- User-Schalter wählt weiterhin nur `light` oder `dark`.
- Beim Umschalten werden die entsprechenden administrativ definierten Tokenwerte verwendet.
- User-Auswahl bleibt lokal persistent/offline.
- Admin-Designwerte sind Produkt-/App-Konfiguration und werden unabhängig davon zentral bereitgestellt/cachbar gemacht.

## Validierung

- Farben nur in klar unterstützten sicheren Formaten speichern, bevorzugt normalisierte Hexwerte, sofern bestehender Vertrag nichts Besseres vorgibt.
- Größen/Radien mit definierten Grenzen und Einheiten validieren.
- unbekannte Token/Properties nicht blind akzeptieren.
- API muss fail-closed gegen ungültige strukturierte Werte sein.
- keine beliebigen CSS-Property-Namen über den strukturierten Editor zulassen.

# Arbeitspaket C – Live Preview

Implementiere im Adminbereich eine brauchbare **User-UI-Vorschau**.

Sie soll mindestens typische zentrale Komponenten zeigen:

- App-Surface/Background;
- Header-/Navigationseindruck;
- Primary und Secondary Button;
- Card/Surface;
- Text und Muted Text;
- Input/Form-Control.

Anforderungen:

- Änderungen im Formular sollen in der Preview möglichst unmittelbar sichtbar werden, **bevor** gespeichert wird;
- Preview darf nicht versehentlich die Admin-UI selbst umstylen;
- Light/Dark-Preview muss gezielt umschaltbar bzw. getrennt prüfbar sein;
- Preview nutzt denselben Token-Mappingvertrag wie die User-App, keine unabhängige Fantasieimplementierung;
- Accessibility/Kontrast nicht automatisch als „bestanden“ behaupten; offensichtliche problematische Kontraste dürfen sinnvoll gewarnt werden, sofern dies robust umsetzbar ist.

# Arbeitspaket D – Persistenz, Projektion und Local-first

Implementiere einen versionierten zentralen Designkonfigurationsvertrag.

Anforderungen:

- Admin-Save über bestehende Auth-/CSRF-geschützte Settings-/Appearance-Infrastruktur oder einen sauber abgegrenzten bestehenden Servicevertrag;
- keine Secrets;
- öffentliche User-App erhält ausschließlich die für Darstellung notwendigen freigegebenen Designwerte, keine Admin-/Security-Daten;
- User-App kann den letzten gültigen Designzustand lokal verwenden, damit Warmstart/Offline nicht auf den Server warten;
- Serverabgleich aktualisiert den lokalen Designzustand kontrolliert im Hintergrund;
- ungültige/inkompatible Version fällt auf sichere Frameworkdefaults zurück;
- Designänderung darf den bereits live bestandenen homepage Local-first-Warmstart nicht wieder mit sichtbarem Loading/Flash blockieren;
- First Paint in bekanntem Dark Theme bleibt ohne White-Flash.

Prüfe, ob die bestehende öffentliche Settings-/Homepageprojektion sinnvoll erweitert werden kann oder ob eine eigene kleine Appearance-Projektion architektonisch sauberer ist. Keine Securitygrenzen nur aus Bequemlichkeit aufweichen.

# Arbeitspaket E – Reset auf Defaults

Im `User UI Design` einen klaren **Reset to Defaults** vorsehen.

- Reset betrifft strukturierte User-UI-Designwerte, nicht Start Page, Userdaten, Admin-Theme oder persönliche User-Theme-Auswahl.
- destructive Wirkung klar benennen/angemessen bestätigen, aber keine unnötige Dialogkaskade.
- nach Reset gelten wieder die Framework-/Produktdefaults.
- Preview und gespeicherter Zustand müssen konsistent sein.

# Arbeitspaket F – Advanced Custom CSS

Implementiere **Advanced Custom CSS** als ausdrücklich gekennzeichnete Expertenfunktion **nach** dem strukturierten Designsystem.

## Vertrag

- Custom CSS ist optional.
- leer = kein Override.
- es wird nach den strukturierten User-UI-Tokens angewendet und kann diese bewusst überschreiben.
- es betrifft ausschließlich die User-App, niemals die Admin-UI.
- Start Page HTML bleibt davon fachlich getrennt.

## Sicherheit / Robustheit

Custom CSS ist mächtig. Implementiere keinen falschen „CSS-Sanitizer“, der Sicherheit verspricht, die er nicht garantieren kann.

Prüfe stattdessen den realen Threat-/Deployment-Vertrag und setze mindestens robuste Grenzen:

- nur authentifizierter/autorisierten Admin darf speichern;
- keine HTML-/JavaScript-Injektion über dieses Feld; es wird ausschließlich als CSS behandelt;
- keine Veränderung von CSP/Sandbox/Auth-Grenzen;
- klare Größenbegrenzung;
- versionierte Persistenz;
- Reset/Clear möglich;
- bei technisch ungültigem oder nicht ladbarem Override muss die App auf strukturiertes Design/Defaults zurückfallen können;
- Custom CSS darf den Adminbereich nicht beeinflussen;
- keine Remote-Stylesheet-/Font-Infrastruktur zusätzlich erfinden.

Falls die aktuelle CSP oder der sichere Runtimevertrag ein direktes Inline-`<style>` aus gespeicherter Adminquelle problematisch macht, **nicht** die CSP schwächen. Wähle einen CSP-kompatiblen serverseitig/öffentlich ausgelieferten CSS-Asset-/Endpoint-Vertrag oder eine andere sichere Architektur. Dokumentiere die Entscheidung.

# Arbeitspaket G – bestehende Start Page vollständig erhalten

Die bereits live bestandene P4-Funktion darf nicht regressieren:

- Module-Modus;
- Text/HTML-Modus;
- unverändertes trusted Admin HTML;
- Preview;
- Save/Reload;
- Local-first Cache;
- Dark/Light-HTML-Adapter;
- kein Loading-/White-Flash beim Warmstart.

`Start Page` und `User UI Design` dürfen gemeinsam unter Appearance gespeichert werden, wenn der API-Vertrag das sauber und ohne Datenverlust erlaubt. Ein Save eines Bereichs darf den anderen nicht unbeabsichtigt zurücksetzen.

# Nicht Teil dieses Auftrags

- vollständige I18N-Implementierung;
- `Settings → Language`;
- automatische Übersetzungsprovider;
- Branding-/Logo-Upload;
- Remote Fonts;
- komplette visuelle Page-Builder-Funktion;
- pro-Modul-Designeditor;
- Store-App-spezifische Designkonfiguration.

Diese Punkte nicht nebenbei beginnen.

# Tests – test-first

Regressionstests vor bzw. zusammen mit Implementierung ergänzen.

Mindestens:

## Appearance / Navigation

- Admin-Seitentitel lautet `Appearance`, nicht `Theme & Layout`;
- Start Page bleibt vorhanden;
- User UI Design vorhanden;
- Advanced Custom CSS klar als Expertenfunktion getrennt.

## Strukturierter Designvertrag

- gültige Light-/Dark-Tokenwerte werden gespeichert und öffentlich korrekt projiziert;
- ungültige Farben/Größen/Token werden abgewiesen oder kontrolliert normalisiert;
- unbekannte strukturierte Properties werden nicht blind übernommen;
- fehlende Konfiguration ergibt Frameworkdefaults;
- Light und Dark bleiben getrennt;
- User-Theme-State wird nicht durch Admin-Save überschrieben;
- Admin-Theme-State bleibt unabhängig.

## Preview

- Formularänderung aktualisiert Preview ohne Save;
- Preview Light/Dark nutzt denselben Mappingvertrag;
- Preview verändert Admin-Shell nicht.

## User-App

- gespeicherte Designwerte wirken tatsächlich auf zentrale User-App-Komponenten;
- Header, Navigation, Buttons, Cards, Forms und zentrale Texte verwenden die betroffenen Tokens;
- GPS und bestehende Module regressieren nicht;
- Reload/Warmstart verwendet lokal letzten gültigen Designzustand;
- Offline verwendet letzten gültigen Designzustand;
- First Paint Dark bleibt ohne weißen Flash;
- Hintergrundrefresh aktualisiert neue Designkonfiguration kontrolliert.

## Reset

- Reset entfernt/neutralisiert nur User-UI-Designwerte;
- Start Page bleibt unverändert;
- Custom CSS nur dann zurücksetzen, wenn die UI dies ausdrücklich als gemeinsamen Reset kennzeichnet; bevorzugt strukturierter Reset und Custom-CSS-Clear getrennt halten;
- User-/Admin-Theme-Auswahl bleibt unverändert.

## Custom CSS

- nur Admin-Savepfad;
- Größenlimit;
- leeres CSS = kein Override;
- Override wird nur in User-App angewendet;
- Admin-UI bleibt unbeeinflusst;
- CSP wird nicht geschwächt;
- fehlerhafter/fehlender Override verhindert nicht das Laden des strukturierten Designs/Defaults;
- Clear/Reset funktioniert.

## Sicherheits-/Regression

- P1 Sessiontrennung;
- Auth/CSRF;
- P4 Homepage vollständig;
- Home/GPS;
- GPS;
- Login;
- User Theme Toggle;
- Admin Theme Toggle;
- Service Worker;
- Packaging/Base Path;
- FTPS-/Smoke-Stabilisierung;
- keine Secrets/unerwünschten Artefakte.

# Dokumentation

Nach erfolgreicher Implementierung:

- `USER-UI-DESIGN.md` vom reinen Zielbild auf den tatsächlich implementierten V1-Vertrag aktualisieren, ohne zukünftige Erweiterungen fälschlich als fertig zu markieren;
- `UI-UX.md`, `Functions.md`, `Architecture.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `CHANGELOG.md` und weitere relevante Dokumente nur soweit tatsächlich betroffen wahrheitsgemäß aktualisieren;
- I18N bleibt Zukunftsvertrag und darf nicht als implementiert markiert werden.

# Abschluss gemäß WORKFLOW.md

- fokussierte Tests;
- vollständige Test-Suite;
- PHP-Lint;
- JavaScript-Syntaxcheck;
- `git diff --check`;
- Produktionspaket;
- Secret-/Artefaktprüfung;
- Commit und Push nach `main`;
- `HEAD == origin/main`;
- Working Tree sauber;
- FTPS und CodeQL bis terminal abwarten;
- vollständigen Abschlussbericht nach `CHATGPT.md` schreiben;
- `CHATGPT.md` auf GitHub `main` verifizieren;
- erst danach Abschlussmeldung.

Keine selbst ausführbaren offenen Punkte zurücklassen.

# Betreiber-Device-Retest danach

`CHATGPT.md` soll einen kurzen, konkreten Retest liefern, mindestens:

1. `Admin → Appearance` öffnen: Titel `Appearance`, Bereiche Start Page / User UI Design / Advanced Custom CSS sichtbar.
2. Eine deutlich erkennbare Light-Farbe ändern, Preview prüfen, speichern, User-App Light prüfen.
3. Eine Dark-Farbe ändern, Preview prüfen, speichern, User-App Dark prüfen.
4. Radius/geeigneten Geometriewert ändern und reale User-App-Wirkung prüfen.
5. Reload/Warmstart und offline soweit praktikabel prüfen: Design bleibt erhalten, kein Loading-/White-Flash.
6. Reset to Defaults prüfen.
7. kleines harmloses Custom-CSS-Override setzen, Wirkung nur in User-App prüfen, anschließend Clear testen.
8. Start Page speichern und kurz regressiv prüfen.
9. Admin-Theme und User-Theme getrennt regressiv prüfen.

Automatisierte Tests dürfen diese reale visuelle Device-Abnahme nicht ersetzen.

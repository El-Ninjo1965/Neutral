# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG

# Aktueller Auftrag

## Local-first Warmstart-Performance + sichtbare App-Navigation prüfen und verbessern

Synchronisiere zuerst vollständig mit `origin/main`.

Seit deinem letzten Abschluss wurde `UI-UX.md` durch ChatGPT/Lea auf `main` um den verbindlichen **Local-first Warmstart-/Reload-Vertrag** erweitert. Diese Änderung ist Betreiber-/Projektvorgabe und darf nicht überschrieben oder durch eine ältere lokale Fassung ersetzt werden.

Lies vor Implementierung vollständig:

- `WORKFLOW.md`
- `DOCUMENTATION.md`
- `CODEX.md`
- `CURRENT-TASK.md`
- `UI-UX.md`
- `I18N.md`
- `VISION.md`
- `CORE-1.0.md`
- `Architecture.md`
- `Functions.md`
- `ModuleCreation.md`
- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- relevante User-App-, Startup-, Homepage-, Cache-/Storage-, Service-Worker-, Navigation-, CSS-, Settings-, Modul- und Testdateien

Übernimm danach den vollständigen Auftrag nach `CURRENT-TASK.md` und prüfe vor Implementierung:

`CODEX.md == CURRENT-TASK-Anforderungen`

## Aktueller Betreiber-Livebefund vom 2026-09-08

Der letzte Folgefix wurde auf dem realen Gerät erneut getestet.

### Jetzt live bestätigt

- `Appearance → Module → GPS` funktioniert.
- Nach Reload bleibt `Start` aktiv; GPS wird als Inhalt von `Start` dargestellt und nicht mehr als erzwungene eigenständige Modulnavigation geöffnet.
- Vor dem GPS-Inhalt erscheint kein alter `Welcome / Neutral Platform`-Inhalt mehr; stattdessen wird derzeit ein neutraler `Loading`-Zustand gezeigt.
- GPS-Genauigkeit ist jetzt menschenlesbar gerundet, z. B. etwa `6 m`/`± … m`.
- GPS-Zeitpunkt ist lokal und menschenlesbar.
- `Position teilen` funktioniert im Betreiber-Test.
- `Appearance → Text / HTML` funktioniert.
- `<h1>TEST</h1>` wird als alleiniger Startseiteninhalt dargestellt; der feste Welcome-/Neutral-Block ist entfernt.
- Username-/Developerinformationen sind weiterhin entfernt.
- Settings wirkt bereinigt.

Diese Punkte nicht erneut zurückbauen.

## Neuer Livebefund 1 – Warmstart/Reload ist zu langsam

Bei bereits konfigurierter HTML-Startseite sieht der Betreiber bei **jedem Browser-Reload bzw. erneuten App-Aufruf ungefähr zwei Sekunden `Loading`**, bevor der bereits bekannte HTML-Startinhalt erscheint. Die Internetverbindung ist dabei gut.

Für den Betreiber ist dies mit dem Offline-first-/App-first-Ziel nicht akzeptabel. Beim echten ersten Start ohne lokalen Stand ist ein kurzer Ladezustand verständlich. Nach einem bereits erfolgreichen Laden soll ein gültiger lokaler Startzustand jedoch unmittelbar erscheinen.

Der neue verbindliche Vertrag steht in `UI-UX.md` unter **Local-first Warmstart und Reload**.

### Auftrag

Finde die tatsächliche Root Cause der beobachteten ~2-Sekunden-Wartezeit. Nicht einfach `Loading` verstecken, keine künstlichen Timeouts verkürzen und keine Animation darüberlegen.

Prüfe insbesondere:

- ob Homepage-/Startseitenkonfiguration derzeit nur vom Server gelesen wird;
- ob ein geeigneter gültiger lokaler Cache bereits existiert und nur zu spät gelesen wird;
- ob Homepage-Konfiguration lokal persistent und versioniert gespeichert werden sollte;
- ob Server-Fetch vor dem ersten sinnvollen Render blockiert;
- ob Session-Restore, CoreStartup, IndexedDB, Modul-Discovery oder andere Tasks das Rendern unnötig blockieren;
- Service-Worker-/HTTP-Cache-Verhalten;
- HTML-Modus und Modulmodus getrennt;
- kalter Erststart versus Warmstart/Reload;
- Online- versus Offline-Warmstart;
- Berechtigungs-/Viewer-/Sessiongrenzen: keine veraltete authentifizierte Berechtigung als öffentliche Wahrheit verwenden.

### Zielverhalten

**HTML-Modus:**

- Nach mindestens einem erfolgreichen Laden soll der letzte gültige lokale HTML-Startinhalt bei Warmstart/Reload möglichst sofort dargestellt werden.
- Serverabgleich erfolgt danach im Hintergrund.
- Neuere gültige Serverkonfiguration aktualisiert den lokalen Stand kontrolliert.
- Offline bleibt der zulässige lokale Inhalt verfügbar.

**Modulmodus:**

- Shell und sicher lokal bekannte Darstellung erscheinen sofort.
- Modulinhalt wird so früh wie sicher möglich aus lokal verfügbaren, gültigen Informationen dargestellt.
- Permission-/Access-Fail-Closed-Vertrag darf nicht aufgeweicht werden.
- Server-/Discovery-Refresh läuft soweit möglich im Hintergrund.

Definiere keine willkürliche Millisekunden-Garantie, bevor reale Messungen vorliegen. Ergänze aber messbare Instrumentierung/Tests, soweit sinnvoll, und dokumentiere, was den bisherigen sichtbaren Delay verursacht hat.

## Neuer Livebefund 2 – Navigation/Buttons visuell noch nicht app-typisch genug

Im aktuellen User-App-Screenshot sind `Settings` und `Login` klar als Buttons erkennbar (Rahmen/Hintergrund). Die primären Navigationspunkte `Start` und `GPS` wirken dagegen eher wie schlichte Textlinks/Tabs und nicht wie deutlich erkennbare touchgerechte App-Aktionen.

Der Betreiber möchte eine **echte App-Anmutung**, keine Webseite mit Textlinks.

### Auftrag

Prüfe die bestehende zentrale User-App-Navigation und verbessere deren visuelle Affordance im Rahmen des vorhandenen Designsystems/CSS-Vertrags:

- `Start` und sichtbare/erlaubte Produktbereiche müssen eindeutig als bedienbare Navigation erkennbar sein;
- touchgerechte Größe/Abstände;
- klarer aktiver Zustand;
- konsistent mit Theme hell/dunkel;
- Hover darf Desktop ergänzen, aber Touch darf nicht davon abhängen;
- Fokuszustände accessibility-konform;
- keine Rückkehr zu Developer-/Webseitenoptik;
- nicht jedes Modul darf eigene Navigationsbutton-Stile erfinden;
- zentrale Framework-/Designregel verwenden, damit spätere Module dieselbe Navigation automatisch erben.

WICHTIG: Im HTML-Startseitenmodus ist der Administratorinhalt selbst frei. Erfinde keine automatischen Inhaltsbuttons innerhalb des frei eingegebenen HTML. Der Betreiberhinweis betrifft primär die **zentrale App-Navigation** (`Start`, `GPS`, spätere sichtbare Bereiche) und deren erkennbare Button-/App-Anmutung.

## Status des vorherigen Device-Retests

Die oben als live bestätigt genannten Folgefixes dürfen als positiv getestete Teilpunkte dokumentiert werden. P4 als Gesamtstatus darf nur dann auf `LIVE BESTANDEN` gesetzt werden, wenn die vorhandenen Statusregeln dies nach diesem neuen Auftrag und anschließendem Betreiber-Retest zulassen. Der neue Warmstart-Performancebefund ist ein echter noch offener UX-/Performancepunkt und darf nicht durch grüne Unit-Tests wegdefiniert werden.

## Nicht Bestandteil dieses Auftrags

- vollständige I18N-/Sprachpaket-/Providerarchitektur;
- neue Sync-Engine/Offline-Queue;
- Store-App-Wrapper;
- neues Produktmodul;
- komplette Neugestaltung des Adminbereichs;
- vollständiger Ersatz des bestehenden Designsystems;
- willkürliche UI-Animationen zur Kaschierung von Ladezeit.

## Tests

Regressionstests zuerst ergänzen/anpassen. Mindestens soweit automatisiert sinnvoll beweisen:

### Warmstart / Cache
- gültige lokal persistierte HTML-Homepage kann vor Abschluss des Serverrefreshs gerendert werden;
- Serverrefresh aktualisiert einen älteren lokalen Homepagezustand kontrolliert;
- Offline-Warmstart verwendet zulässigen lokalen Homepagezustand;
- fehlender lokaler Zustand fällt beim Erststart sauber auf Loading/Fallback zurück;
- ungültiger/inkompatibler Cache wird nicht blind verwendet;
- authentifizierte/permission-sensitive Daten werden nicht als unzulässiger anonymer Fallback verwendet;
- Modulmodus schwächt Permission-/Viewer-Fail-Closed nicht;
- bisherige P4-Startkontext-, HTML- und Login-Regressionen bleiben grün.

### Navigation
- `Start` und sichtbare Produktbereiche verwenden die zentrale app-typische Navigationskomponente/-Klasse;
- aktiver Zustand bleibt eindeutig;
- ausgeblendete/nicht erlaubte Bereiche erscheinen nicht;
- persönliche `App areas`-Auswahl bleibt funktional;
- Keyboard-Fokus bleibt sichtbar;
- Light/Dark-Theme bleibt kompatibel.

### Regression
- P1 User-/Admin-Sessiontrennung;
- Auth/CSRF;
- Appearance;
- GPS;
- HTML-Homepage;
- Offline-Fallback;
- Service Worker/Packaging/Base Path.

## Abschluss

Gemäß `WORKFLOW.md` vollständig:

- Root Cause dokumentieren;
- fokussierte Tests;
- vollständige Test-Suite unter unterstützter PHP-8.1+-Runtime;
- PHP-Lint;
- JavaScript-Syntaxcheck;
- `git diff --check`;
- Produktionspaket;
- Secret-/Artefaktprüfung;
- relevante Verträge/Status/TODO/CHANGELOG/Workflow wahrheitsgemäß aktualisieren;
- Commit und Push nach `main`;
- `HEAD == origin/main`;
- Working Tree sauber;
- FTPS, CodeQL und weitere erforderliche CI bis terminal abwarten;
- vollständigen Abschlussbericht nach `CHATGPT.md` schreiben und auf GitHub `main` verifizieren;
- erst danach Abschlussmeldung.

## Betreiber-Retest nach Deploy

`CHATGPT.md` soll kurze konkrete Schritte liefern, mindestens:

1. HTML-Startseite einmal laden, danach mehrfach reloaden/neu öffnen und sichtbares `Loading`-Verhalten prüfen.
2. Verbindung deaktivieren und Offline-Warmstart der bereits geladenen HTML-Startseite prüfen.
3. Wieder online gehen und Serverrefresh prüfen.
4. Modulmodus GPS setzen, Warmstart/Reload prüfen: `Start` bleibt aktiv, GPS erscheint korrekt und so früh wie sicher möglich.
5. Navigation `Start`/`GPS` optisch und per Touch prüfen: eindeutig als bedienbare App-Navigation erkennbar, aktiver Zustand klar.
6. Light/Dark prüfen.
7. persönliche `App areas`-Auswahl prüfen.
8. P1 User-/Admin-Sessiontrennung erneut bestätigen.

Bis zum erneuten Betreiber-Livetest keine erfundene Live-Bestätigung.

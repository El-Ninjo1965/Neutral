# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG

# Aktueller Auftrag

## Restfehler: `Loading…` wird beim Dark-Warmstart kurz weiß dargestellt

Synchronisiere zuerst vollständig mit `origin/main` und bewahre alle neueren Änderungen.

Lies vor Implementierung vollständig `WORKFLOW.md`, `DOCUMENTATION.md`, `CODEX.md`, `CURRENT-TASK.md`, `UI-UX.md`, `I18N.md`, `VISION.md`, `CORE-1.0.md`, `Architecture.md`, `Functions.md`, `ModuleCreation.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md` sowie alle relevanten User-App-, Bootstrap-/Startup-, Theme-, Homepage-, Loading-/Placeholder-, CSS-, Service-Worker-, Cache-/Storage- und Testdateien.

Übernimm danach den vollständigen Auftrag nach `CURRENT-TASK.md` und prüfe vor Implementierung:

`CODEX.md == CURRENT-TASK-Anforderungen`

## Neuer Betreiber-Device-Retest vom 2026-09-08

Der letzte iframe-Paint-Fix hat den sichtbaren Fehler weiter eingegrenzt.

Auf dem realen iPad/Safari ist jetzt feststellbar:

- Der endgültige HTML-Homepage-Zustand im Dark Mode ist korrekt dunkel.
- Der zuvor dauerhaft weiße iframe-Canvas ist behoben.
- Der zuletzt behandelte iframe-Paintpfad soll nicht erneut als primäre Ursache angenommen werden.
- Sichtbar ist stattdessen beim Reload/Warmstart kurz **`Loading…` auf einer weißen/hellen Fläche**, bevor die dunkle Homepage erscheint.

Der Betreiber beschreibt ausdrücklich: **„Loading …. wird immer kurz weiß angezeigt.“**

Damit liegt der verbleibende sichtbare Fehler vor bzw. außerhalb des finalen HTML-Frame-Paints: im Startup-/Placeholder-/Loading-Pfad.

## Bereits live bestätigt – nicht zurückbauen

- Local-first Homepagecache existiert und der Warmstart ist grundsätzlich deutlich schneller als vor den P4-Fixes.
- finaler HTML-Homepage-Zustand im Dark Mode ist dunkel.
- dokumentinterner Theme-Adapter und iframe-Visibility-/Paint-Gating nicht unnötig zurückbauen.
- Sonne-/Mond-Schnellumschaltung funktioniert.
- Appearance/Theme ist aus normalen User-Settings entfernt.
- Home-Icon und Home/GPS-Navigation funktionieren.
- GPS Dark Mode funktioniert.
- zentrales Buttonsystem und Login-Bereinigung nicht zurückbauen.
- FTPS-/Smoke-Stabilisierung nicht zurückbauen.

# Auftrag – Root Cause des weißen `Loading…`-Zwischenzustands

Finde den exakten Renderpfad, der beim Warmstart/Reload `Loading…` erzeugt, und kläre zwei getrennte Fragen:

1. **Warum erscheint bei vorhandenem gültigem lokalem Homepagezustand überhaupt noch `Loading…`?**
2. **Warum wird dieser Zustand im Dark Theme hell/weiß gepaintet, obwohl das persistierte Theme bereits bekannt sein sollte?**

Nicht einfach `Loading…` per CSS verstecken, keinen Timeout verkürzen und keine Animation darüberlegen.

Prüfe insbesondere:

- initiales statisches HTML vor JavaScript-Bootstrap;
- Zeitpunkt, zu dem `neutral.user.theme.v1` gelesen und auf `html/body` angewendet wird;
- ob Dark Theme erst nach dem ersten Browser-Paint gesetzt wird;
- initiale Klassen/Attribute auf `html`, `body`, App-Shell und Content-Host;
- `Loading…`-Markup und dessen Default-CSS vor Laden der Hauptstyles;
- Reihenfolge von CSS, Theme-Bootstrap, User-App-JavaScript, Homepagecache-Lesen und erstem Render;
- ob der Warmstart zunächst immer einen generischen Loading-State rendert und erst danach synchron/lokal den Homepagecache liest;
- ob IndexedDB/localStorage/anderer Storage tatsächlich synchron genug für den ersten sinnvollen Render verfügbar ist;
- ob ein früher Inline-/Bootstrap-Theme-Hinweis nötig ist, damit Dark bereits **vor First Paint** feststeht;
- CSP-/Security-Auswirkungen eines frühen Theme-Bootstraps;
- Service-Worker-/Cache-Versionierung, damit alte Shell/CSS/JS nicht den Zwischenzustand verursachen;
- Cold Start ohne lokalen Homepagezustand getrennt vom Warmstart mit gültigem lokalem Zustand.

# Zielvertrag

## Warmstart mit gültigem lokalem Homepagezustand

Wenn Theme und Homepage lokal bereits gültig bekannt sind, soll der sichtbare Ablauf sein:

`bereits korrekt thematisierte App-Surface → lokaler Homepageinhalt`

Im Idealfall erscheint **gar kein `Loading…`**, weil für den ersten sinnvollen Inhalt keine Netzantwort benötigt wird.

Nicht erlaubt:

`weiße/helle Loading-Fläche → Dark App → Dark Homepage`

und ebenfalls nicht:

`Dark Loading-Fläche für unnötige Zeit → lokaler Homepageinhalt`, wenn der lokale Inhalt unmittelbar verfügbar ist.

## Echter Cold Start ohne verwertbaren lokalen Homepagezustand

Falls ein Ladezustand fachlich wirklich notwendig ist, muss er vom **allerersten sichtbaren Paint** an das bereits lokal bekannte Theme respektieren. Ist noch kein Theme gespeichert, gilt der definierte Default.

Kein weißer Flash in bekanntem Dark Theme.

# Architekturhinweis

Der bestehende verbindliche Vertrag in `UI-UX.md` bleibt maßgeblich:

`UI zuerst → lokaler Zustand → Hintergrundinitialisierung`

und insbesondere der Local-first-Warmstartvertrag. Der Fix soll diesen Vertrag tatsächlich im ersten sichtbaren Paint erfüllen und nicht nur nachträglich kosmetisch herstellen.

# Tests

Regressionstests zuerst ergänzen/anpassen.

Mindestens soweit automatisiert sinnvoll beweisen:

- persistiertes Dark Theme wird vor dem ersten sichtbaren User-App-Paint angewendet;
- persistiertes Light Theme entsprechend;
- Warmstart mit gültigem lokalem HTML-Homepagecache rendert nicht zuerst einen generischen sichtbaren `Loading…`-Zustand, wenn dieser technisch vermeidbar ist;
- Cold Start ohne Homepagecache darf einen Loading-/Fallback-Zustand verwenden, dieser ist aber vom ersten Paint an theme-konform;
- initiales statisches Markup/CSS erzeugt bei gespeichertem Dark Theme keinen weißen Surface-Flash;
- Theme-Switch und Reload-Persistenz bleiben erhalten;
- iframe-Dokumentadapter und iframe-Paint-Gating bleiben regressionsfrei;
- Local-first Cache und Hintergrundrefresh bleiben erhalten;
- Service Worker liefert die aktuelle Shell-/Asset-Version;
- Appearance bleibt aus normalen User-Settings entfernt;
- Home/GPS, GPS, Login, Buttonsystem, P1 Sessiontrennung, Auth/CSRF, Packaging/Base Path und FTPS-/Smoke-Stabilisierung bleiben grün.

Falls die Umgebung keinen echten Safari-First-Paint-Test erlaubt, DOM-/Bootstrap-/Load-Order-Verträge so testen, dass der bekannte helle Loading-Pfad strukturell ausgeschlossen wird. Keine erfundene visuelle Bestätigung.

# Abschluss

Dokumentiere in `CHATGPT.md` exakt:

- welcher Code/Markup den sichtbaren `Loading…`-Zustand erzeugt hat;
- warum er trotz vorhandenem Local-first-Cache noch sichtbar wurde;
- warum er vor Anwendung des Dark Themes hell gepaintet wurde;
- wie der First-Paint-/Warmstartpfad jetzt funktioniert.

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

1. Dark Theme aktivieren und einmal vollständig laden.
2. Danach mehrfach Reload/Warmstart durchführen.
3. Prüfen: kein weißes `Loading…`, kein heller Flash; lokaler Homepageinhalt erscheint unmittelbar bzw. ohne unnötigen sichtbaren Loading-State.
4. echten Cold Start soweit praktikabel getrennt prüfen: notwendiger Loading-State muss theme-konform sein.
5. Light↔Dark und Reload-Persistenz prüfen.
6. Home/GPS/Settings/Warmstart kurz regressiv prüfen.

Bis zum positiven realen iPad/Safari-Retest keine vollständige P4-Livefreigabe erfinden.

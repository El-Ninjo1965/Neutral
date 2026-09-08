# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG

# Aktueller Auftrag

## Restfehler: weißer Initial-Paint/Flash der HTML-Homepage im Dark Mode

Synchronisiere zuerst vollständig mit `origin/main` und bewahre alle neueren Änderungen.

Lies vor Implementierung vollständig `WORKFLOW.md`, `DOCUMENTATION.md`, `CODEX.md`, `CURRENT-TASK.md`, `UI-UX.md`, `I18N.md`, `VISION.md`, `CORE-1.0.md`, `Architecture.md`, `Functions.md`, `ModuleCreation.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md` sowie alle relevanten User-App-, Theme-, Homepage-/iframe-/srcdoc-, CSS-, Service-Worker- und Testdateien.

Übernimm danach den vollständigen Auftrag nach `CURRENT-TASK.md` und prüfe vor Implementierung:

`CODEX.md == CURRENT-TASK-Anforderungen`

## Neuer Betreiber-Device-Retest vom 2026-09-08

Der letzte Safari/iPad-Fix ist **teilweise erfolgreich**:

- Die HTML-Homepage `<h1>TEST</h1>` bleibt im Dark Mode jetzt nicht mehr dauerhaft als große weiße Fläche stehen.
- Der endgültige gerenderte Zustand ist korrekt dunkel.
- Beim Öffnen/Rendern/Reload ist auf dem realen iPad/Safari jedoch weiterhin ein **kurzer deutlich sichtbarer weißer Flash/weißes Aufblitzen** zu sehen, bevor der dunkle HTML-Inhalt erscheint.

Damit ist der dauerhafte White-Canvas behoben, aber der **erste sichtbare Paint des isolierten HTML-Frames ist noch falsch**.

Der Betreiber beschreibt es sinngemäß: „Ist jetzt zwar schwarz, aber blinkt weiß, als ob im Hintergrund etwas geladen wird.“

## Bereits live bestätigt – nicht zurückbauen

- Local-first Warmstart ohne früheres sichtbares `Loading`.
- finaler HTML-Homepage-Zustand im Dark Mode ist jetzt dunkel.
- Sonne-/Mond-Schnellumschaltung funktioniert.
- Appearance/Theme-Block wurde aus normalen User-Settings entfernt bzw. diese Änderung des vorherigen Auftrags beibehalten.
- Home-Icon und Home/GPS-Navigation funktionieren.
- GPS Dark Mode funktioniert.
- zentrales Buttonsystem nicht zurückbauen.
- Login-Bereinigung nicht zurückbauen.
- FTPS-/Smoke-Stabilisierung nicht zurückbauen.

# Auftrag – First Paint / FOUC des sandboxed HTML-Frames beseitigen

Ermittle die tatsächliche Ursache des weißen Zwischen-Paints auf Safari/iPad und verhindere, dass ein unthematisierter iframe-/srcdoc-Zustand jemals sichtbar wird.

Nicht einfach eine künstliche Verzögerung oder Animation darüberlegen.

Prüfe insbesondere:

1. Reihenfolge von `createElement('iframe')`, DOM-Insertion, `srcdoc`-Zuweisung, Theme-Adapter-Anwendung und Sichtbarkeit.
2. Ob das iframe zunächst leer/`about:blank` sichtbar in den DOM eingefügt wird und Safari diesen initial weiß zeichnet, bevor das thematisierte `srcdoc` committed ist.
3. Ob `srcdoc` erst **vor** sichtbarer DOM-Insertion vollständig mit dem aktuellen Theme-Dokument aufgebaut werden kann.
4. Ob der Frame bis zu seinem ersten thematisierten `load`/ready-Zustand unsichtbar bleiben muss und der umgebende Frameworkbereich währenddessen bereits den korrekten aktuellen Theme-Hintergrund zeigen kann.
5. Falls Visibility-Gating verwendet wird: kein Layoutsprung, kein weißer Platzhalter, keine künstliche Wartezeit und kein erneutes altes `Loading`.
6. Ob Theme-Hintergrund/`color-scheme` bereits auf dem iframe-Element selbst **vor dessen erster DOM-Insertion** gesetzt werden muss, zusätzlich zum dokumentinternen Adapter.
7. Theme-Wechsel bei bereits vorhandenem Frame: kein weißer Zwischen-Paint beim Wechsel Light↔Dark.
8. Warmstart/Reload: lokal vorhandener HTML-Inhalt muss weiterhin sofort erscheinen; der Fix darf die Local-first-Performance nicht zurückbauen.
9. Safari/WebKit-spezifisches Paint-Verhalten berücksichtigen, aber möglichst standardsaubere Lösung ohne UA-Sniffing.
10. Sandbox-/Security-Vertrag unverändert restriktiv halten.

## Zielvertrag

Bei bereits bekanntem Dark Theme und lokal vorhandenem HTML-Homepage-Inhalt darf während des gesamten sichtbaren Renderpfads **kein weißer Browser-/iframe-Zwischenzustand** erscheinen.

Erlaubter sichtbarer Ablauf:

`Dark App-Surface → unmittelbar thematisierter Dark HTML-Inhalt`

Nicht erlaubt:

`Dark App-Surface → weißer iframe/about:blank/srcdoc Flash → Dark HTML-Inhalt`

Für Light entsprechend konsistent.

Wenn der HTML-Inhalt selbst ausdrücklich einen weißen Hintergrund definiert, darf dieser natürlich sichtbar sein; der Auftrag betrifft ausschließlich den vom Framework/Browser erzeugten unthematisierten Zwischenzustand.

# Tests

Regressionstests zuerst ergänzen/anpassen.

Mindestens soweit automatisiert möglich beweisen:

- iframe erhält thematisiertes `srcdoc`/Theme-Setup vor dem ersten sichtbaren Zustand;
- kein sichtbarer leerer/about:blank-Frame wird vor dem thematisierten Dokument erzeugt;
- falls Load-/Visibility-Gating genutzt wird, besitzt der Wrapper währenddessen bereits die korrekte Theme-Surface und zeigt kein `Loading`/weißes Placeholder;
- Dark-Warmstart behält korrekten Hintergrund während des gesamten Initialisierungspfads;
- Light-Warmstart entsprechend;
- Light↔Dark-Wechsel erzeugt keinen bewusst sichtbaren unthematisierten Zwischenzustand;
- Administrator-CSS bleibt maßgeblich;
- freies HTML wird weiterhin nicht heuristisch verändert;
- Sandboxattribute bleiben mindestens gleich restriktiv;
- Local-first Homepagecache und Warmstart bleiben erhalten;
- Appearance bleibt aus normalen User-Settings entfernt;
- Home/GPS, GPS, Login, Theme-Switch, P1 Sessiontrennung, Auth/CSRF, Service Worker, Packaging/Base Path und FTPS-/Smoke-Stabilisierung bleiben grün.

Falls ein echter visueller Safari-Test in der Umgebung technisch nicht möglich ist, das ausdrücklich dokumentieren und DOM-/Lifecycle-Verträge so testen, dass der bekannte White-Flash-Pfad strukturell ausgeschlossen wird. Keine erfundene visuelle Bestätigung.

# Abschluss

Dokumentiere Root Cause und exakte Paint-/Lifecycle-Korrektur in `CHATGPT.md`.

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

Nur noch kurz:

1. Dark Mode aktivieren.
2. HTML-Homepage `<h1>TEST</h1>` mehrfach öffnen/reloaden.
3. Bestätigen, dass weder beim ersten Paint noch beim Reload ein weißer Flash erscheint.
4. Light↔Dark über Header wechseln und ebenfalls auf Flash prüfen.
5. Settings kurz prüfen: Appearance bleibt entfernt.
6. Home/GPS/Warmstart kurz regressiv prüfen.

Bis zum positiven realen iPad/Safari-Retest keine vollständige P4-Livefreigabe erfinden.

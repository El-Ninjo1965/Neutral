# Task 5 Report: Lokaler App-Bootstrap

## RED

- Zuerst wurden sechs CLI-Vertragstests fuer belegte und leere Ziele, exakte
  App-ID-/Namensvalidierung, GPS-Auswahl, Secretfreiheit, Metadaten und
  optionales lokales Git geschrieben.
- `node --test tests/app-bootstrap.test.js` war erwartungsgemaess RED: 0 von 6
  Tests bestanden, weil `scripts/create-neutral-app.js` noch nicht existierte
  (`MODULE_NOT_FOUND`).
- Im Self-Review wurde die App-Modulliste als zusaetzliche
  Metadatenkonsistenz test-first ergaenzt. Der fokussierte Lauf war RED: 0 von
  2 Tests bestanden, weil `app-info.json` noch keine explizite `modules`-Liste
  enthielt.

## GREEN

- Die CLI akzeptiert
  `--target`, `--app-id`, `--app-name`, `--include-gps` und `--init-git`,
  verwirft unbekannte/doppelte Optionen und validiert App-ID und Anzeigename
  exakt nach dem Brief.
- Nur von Git versionierte Pfade werden in einen benachbarten Tempordner
  kopiert. Git-/Dependency-/Build-/Runtime-/Environment-/Deployment-,
  Testartefakt-, Worktree- und `.superpowers`-Pfade bleiben ausgeschlossen;
  `.env.example` und die versionierten Quelltests bleiben erhalten.
- App-ID und Anzeigename werden in Appmanifest, Appverzeichnis,
  Environmentvorlage, Package-Metadaten, Browser-Titel, App-Shell und
  Browser-Defaultkonfiguration konsistent gesetzt. Geheimwerte in
  `.env.example` bleiben leer.
- Ohne `--include-gps` werden nur das GPS-Referenzverzeichnis und sein
  Katalogeintrag aus der Kopie entfernt; das Quellmanifest bleibt bytegleich.
  Mit der Option werden Katalog, Modulmanifest und App-Modulliste an die neue
  App-ID gebunden.
- `--init-git` fuehrt nur `git init --quiet` im Tempbaum aus. Der Test bestaetigt
  ein leeres Remote-Inventar. Es gibt keinen GitHub-Aufruf.
- Ein nichtleeres Ziel wird vor jeder Kopierarbeit abgelehnt und sein Marker
  bleibt unveraendert. Ein vorhandenes leeres Ziel wird erst unmittelbar vor
  dem atomaren Rename entfernt und bei einem Rename-Fehler leer
  wiederhergestellt.
- `node --test tests/app-bootstrap.test.js tests/production-package.test.js`
  ist GREEN: 26 Tests, 26 bestanden, 0 fehlgeschlagen.
- `node --check scripts/create-neutral-app.js`, ein echter
  `npm run app:create -- ...`-Smoke-Test und `git diff --check` sind GREEN.

## Dateien

- `scripts/create-neutral-app.js`
- `tests/app-bootstrap.test.js`
- `package.json`
- `Install-README-Web-App.md`
- `.superpowers/sdd/2026-09-03-portable-installation/task-5-report.md`

## Commit

- `feat: add safe neutral app bootstrap`

## Self-Review

- Zielvalidierung geschieht vor dem Anlegen des Tempordners; die zweite
  Validierung direkt vor dem Rename schliesst eine zwischenzeitliche Belegung
  aus.
- Die Kopierliste stammt aus `git ls-files --cached`; unversionierte lokale
  Dateien koennen deshalb nicht in die neue App gelangen.
- Symlinks werden nicht dereferenziert, sondern als nicht regulaere
  versionierte Quellen abgelehnt.
- Der Secret-Scanner nennt nur relativen Pfad, Regel und `[MASKED]`. Zwei exakt
  bekannte synthetische Token-Canaries aus dem versionierten Scanner-Test
  werden nur in dieser Testdatei neutralisiert; alle anderen Dateien und
  Treffer werden geprueft.
- HTML- und JSON-Metadaten werden kontextgerecht escaped/serialisiert; die
  Quelldateien werden nicht transformiert.

## Bedenken

- Der Brief setzt einen sauberen Checkout voraus. Das Werkzeug beschraenkt die
  Pfadauswahl auf versionierte Dateien, kopiert deren aktuellen
  Working-Tree-Inhalt aber bewusst; lokale Aenderungen an bereits versionierten
  Dateien sollten daher vor dem Bootstrap committed oder verworfen werden.
- `git init` ist nur verfuegbar, wenn Git lokal installiert ist. Ohne
  `--init-git` besteht diese Laufzeitabhaengigkeit nicht; mit der Option bricht
  ein fehlgeschlagenes `git init` vor dem Publish ab und hinterlaesst keinen
  Teilbaum im Ziel.

## Fix-Runde 1

### RED

Die Reviewbefunde wurden einzeln vor der jeweiligen Aenderung reproduziert:

1. Der ohne GPS erzeugte Workflow behielt den zwingenden
   `gps/module.json`-Check; der fokussierte Test bestand mit GPS und scheiterte
   ohne GPS.
2. `.env.ftp.deploy.example` fehlte im neuen Projekt. Der anschliessende reale
   Lauf der kopierten Nicht-PHP-Tests zeigte zusaetzlich die starren
   Neutral-App-/GPS-Annahmen und die fehlende Git-Testquelle.
3. Drei Anzeigenamen mit Randspaces, einfachen/doppelten Quotes, Backslash und
   Gleichheitszeichen wurden unquoted in `.env.example` geschrieben. Ein
   secretfoermiger Anzeigename erreichte erst den spaeten Paket-Scanner statt
   der Argumentvalidierung.
4. Ein erzeugter Fallback-Probe fand weiterhin `neutral-app`, `Neutral App`
   beziehungsweise `Neutral Platform` in den operativen Node-, PHP-, Core-
   und Adminpfaden.
5. Ein veraenderter getrackter Quellbaum wurde akzeptiert; ein dangling
   Zielsymlink erreichte erst das abschliessende Rename und lieferte
   `ENOTDIR`.

Ein erster erzeugter Nicht-PHP-Gesamtlauf reproduzierte 12 Fehler. Nach dem
ersten Teilfix blieben genau die zwei rekursiven Bootstrapfehler uebrig, weil
die bereits GPS-freie Workflowkopie nochmals einen GPS-Check voraussetzte.

### GREEN

- Der GPS-Workflowcheck wird nur entfernt, wenn die Quellvariante GPS besitzt;
  bereits GPS-freie Projekte bleiben idempotent bootstrappbar. Mit GPS bleibt
  der Check erhalten.
- `.env.ftp.deploy.example` wird als wertfreie Entwicklungs-/Deployvorlage
  kopiert. Der Produktionsbuilder nimmt weiterhin nur `.env.example` auf; der
  reale Build der erzeugten App wird im Bootstraptest ausgefuehrt.
- Die kopierten Tests ermitteln aktive Appmetadaten und die vorhandene
  GPS-Variante. Bootstraptests erstellen auch ohne Git-Index der erzeugten App
  ein sauberes temporaeres Git-Fixture; `--init-git` bleibt rein optional.
- `APP_NAME` wurde in Fix-Runde 1 mit aeusseren einfachen Quotes und
  zusaetzlichem Quote-/Backslash-Escaping geschrieben; Fix-Runde 2 ersetzt
  dieses nicht loaderkompatible Zwischenverhalten. Secretfoermige Namen werden
  bereits
  durch die Argumentvalidierung vor Ziel-/Temparbeit abgelehnt; Hilfe und
  Installationsanleitung nennen die Grenze.
- Das einzelne aktuelle Appmanifest steuert die Metadatentransformation. Eine
  explizite Liste operativer Server-, PHP-, Core- und Admin-Dateien erhaelt
  daraus App-ID und Anzeigename; eine globale Repository-Textsubstitution wird
  nicht verwendet. Node-Settings und Admin-Settings wurden als reale
  Fallbackpfade ausgefuehrt.
- `git status --porcelain --untracked-files=no` erzwingt vor Ziel-/Temparbeit
  einen sauberen getrackten Quellstand. `lstatSync(...,
  {throwIfNoEntry:false})` erkennt auch dangling Zielsymlinks frueh.
- Der erzeugte Nicht-PHP-Lauf ist GREEN: 180 Tests, 170 ausgefuehrt
  beziehungsweise 10 varianten-/PHP-bedingt uebersprungen, 0 Fehler. Darin
  enthalten sind die rekursiven Bootstraptests ohne eigenen Git-Index und ein
  realer Produktionspaketbau ohne FTPS-Environmentvorlage.

### Geaenderte Dateien

- `scripts/create-neutral-app.js`
- `tests/app-bootstrap.test.js`
- `tests/master-framework.test.js`
- `tests/production-package.test.js`
- `tests/vision-framework.test.js`
- `Install-README-Web-App.md`
- `.superpowers/sdd/2026-09-03-portable-installation/task-5-report.md`

### Self-Review / verbleibende Bedenken

- Die Testquelle wird pro Testprozess aus den aktuellen Projektdateien in ein
  separates Git-Fixture kopiert und dort committed. Dadurch testet TDD die
  uncommitteten Implementierungsaenderungen, waehrend die produktive CLI ihren
  Clean-Checkout-Vertrag strikt einhaelt.
- Die GPS-Tests werden nur in einer tatsaechlich GPS-freien erzeugten Variante
  uebersprungen; im Neutral-Quellprojekt mit GPS laufen sie weiterhin.
- Node-Abhaengigkeiten bleiben wie gefordert aus der Kopie ausgeschlossen. Ein
  frisch erzeugtes Projekt benoetigt daher vor Node-Integrationstests wie jeder
  frische Checkout `npm install`; die Regression verwendet die bereits
  installierten identischen Abhaengigkeiten ueber `NODE_PATH`.
- Der Fix fuehrt keine GitHub-, Remote- oder Deploymentoperation aus.

### Fix-Commit

- `fix: harden generated app variants`

## Fix-Runde 2

### RED

Die drei Reviewpunkte wurden getrennt gegen reale erzeugte Projekte
reproduziert:

1. Ein mit `--init-git` erzeugtes Projekt hatte einen erfolgreichen, aber
   leeren `git ls-files`-Output. Seine kopierte Nicht-PHP-Suite scheiterte beim
   Aufbau des Bootstrap-Fixtures (`null !== 0`), weil keine Quelldateien in das
   temporaere Fixture gelangten.
2. Der echte Node-Konfigurationsloader lieferte fuer
   `O'Brien \ Tools & More` den veraenderten Wert
   `O\'Brien \\ Tools & More`. Ursache war das zusaetzliche Escaping des
   Bootstrap-Skripts, das der Loader nicht rueckgaengig macht.
3. Die kopierten Produktionspaket- und Visionstests scheiterten beide fuer
   `Amp & <Angle> "Double" 'Single'`: Sie verglichen den semantischen
   Anzeigenamen mit den rohen HTML-Entities aus dem `<title>`-Element.

### GREEN

- `sourceFiles()` verwendet `git ls-files` nur noch bei Status 0 und mindestens
  einem Pfad. Ein leerer Index faellt auf den vorhandenen sicheren Walk zurueck,
  der Git-, Dependency-, Build-, Runtime-, Worktree- und Testartefaktpfade nicht
  traversiert.
- Der neue `--init-git`-Integrationstest bestaetigt zuerst den leeren Index,
  baut danach das Produktionspaket und fuehrt anschliessend die vollstaendige
  kopierte Nicht-PHP-Suite aus. Es wird weiterhin kein Remote angelegt.
- `APP_NAME` erhaelt nur aeussere einfache Quotes; innere Apostrophe und
  Backslashes werden unveraendert geschrieben. Der reale Node-Loader roundtrippt
  den geforderten Namen bytegenau. Der entsprechende reale PHP-Loader-Test wird
  bei vorhandenem PHP ausgefuehrt und andernfalls explizit uebersprungen; der
  PHP-Loader entfernt nun ebenfalls nur die aeusseren Quotes.
- Produktionspaket- und Visionstest dekodieren genau die vom Bootstrap
  geschriebenen HTML-Entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`), bevor
  sie Anzeigenamen semantisch vergleichen.
- Der betroffene Lauf
  `node --test --test-concurrency=1 tests/app-bootstrap.test.js tests/production-package.test.js tests/vision-framework.test.js`
  ist GREEN: 42 Tests, 41 bestanden, 1 erwarteter PHP-Skip, 0 Fehler.
- Die gesamte Nicht-PHP-Regression ist GREEN: 184 Tests, 182 bestanden,
  2 erwartete PHP-bezogene Skips, 0 Fehler. Beide erzeugten Varianten wurden
  getestet; Standard- und init-git-Ausgaben wurden erfolgreich paketiert.
- `npm test` wurde ebenfalls ausgefuehrt. In dieser Umgebung ohne `php`
  scheitern ausschliesslich die bekannten PHP-pflichtigen Dateien
  (`admin-php-entry`, `php-backup`, `php-login-rate-limit`,
  `portability-config`); die separate Nicht-PHP-Regression ist deshalb der
  belastbare Gesamtnachweis fuer diese Umgebung.

### Geaenderte Dateien

- `scripts/create-neutral-app.js`
- `Server/php/src/EnvLoader.php`
- `tests/app-bootstrap.test.js`
- `tests/production-package.test.js`
- `tests/vision-framework.test.js`
- `.superpowers/sdd/2026-09-03-portable-installation/task-5-report.md`

### Self-Review / verbleibende Bedenken

- Der Walk-Fallback folgt keinen Symlinks und wird nur verwendet, wenn kein
  brauchbarer Git-Index existiert. Die produktive CLI selbst behaelt ihren
  strengeren Clean-Checkout-Vertrag unveraendert bei.
- Die HTML-Dekodierung ist bewusst nicht rekursiv. Ein Anzeigename, der selbst
  wie eine Entity aussieht, bleibt damit nach einmaligem HTML-Escaping und
  einmaligem Dekodieren unveraendert.
- PHP ist im aktuellen Runner nicht installiert. Der PHP-Roundtriptest ist
  vorhanden und korrekt bedingt, konnte hier aber nicht ausgefuehrt werden.
- Es wurden keine Server, Git-Remotes, GitHub- oder Deploymentoperationen
  gestartet.

### Fix-Commit

- `fix: preserve generated app metadata semantics`

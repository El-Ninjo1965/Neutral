# Task 6 Report: Paket-Preflight, Dokumentation und Abschluss

## RED

- Zuerst wurde `tests/portable-preflight.test.js` mit Fixtures für gültiges
  Root-/Unterpfadpaket, veränderten Hash, selbstkonsistentes verbotenes
  Inventar, fehlenden Einstiegspunkt, Manifest-Traversal, Payload-Symlink,
  Basispfadabweichungen, fehlende PHP-Binary und maskierten Secretbefund
  geschrieben.
- `node --test tests/portable-preflight.test.js` war erwartungsgemäß RED:
  21 Assertions scheiterten, weil das bisherige CLI Paket-, URL- und
  Basispfadargumente ignorierte und den alten Status
  `READY_FOR_C_PANEL_SETUP` samt booleschen Environment-/FTPS-Prüfungen
  ausgab.
- Eine zweite RED-Runde zeigte, dass der URL-Parser rohe leere Credentials,
  `/.` und `/%2e` zum scheinbar gültigen Ziel normalisierte. Eine weitere
  RED-Runde belegte denselben Effekt für führenden Leerraum.
- Der separate Scanner-Review war RED für direkte `../`- und Symlinkaufrufe:
  Der CLI-Pfad blockierte beides bereits, aber die neu gemeinsame
  Scannerfunktion schützte ihre eigene Dateigrenze noch nicht selbst.

## GREEN

- `scripts/cpanel-preflight.js` akzeptiert `--package`, `--public-url` und den
  optionalen `--base-path`. Fehlende, unbekannte, doppelte oder
  steuerzeichenhaltige Argumente werden ohne Wiedergabe des Werts blockiert.
- `verifyProductionPackage()` im gemeinsamen `portable-install`-Kern prüft
  Schema, sortiertes Manifest, `SHA256SUMS`, exaktes Dateiinventar, Größen,
  SHA-256, Produktions-Allowlist sowie Traversal-/Symlinkgrenzen.
- Der öffentliche URL-Vertrag verlangt HTTPS ohne Credentials, Query,
  Fragment, Prozentkodierung, rohe Punktsegmente oder Zusatzpfade. Der rohe
  Eingabepfad und der geparste `pathname` müssen exakt Root beziehungsweise
  Basispfad mit optional einem abschließenden Slash sein; Manifest, CLI und
  URL verwenden denselben normalisierten Basispfad.
- Root-`.htaccess`, Web-App-Einstieg, PHP-Bootstrap, Admin, Setup sowie API-
  `.htaccess` und Router sind Pflichtdateien. Der gemeinsame Scanner prüft
  Payload und Metadaten, maskiert erkannte Werte mit `[MASKIERT]` und schützt
  seine Traversal-/Symlinkgrenze auch unabhängig vom Aufrufer.
- JSON-Gesamt- und Einzelstatus verwenden ausschließlich `PASS`, `BLOCKED`
  und `NICHT_GEPRUEFT`. Lokale Paket-/Inventar-/Hash-/Pfad-/Einstiegs-/
  Secretfehler sind `BLOCKED` mit Fehlercode. Fehlende PHP-Binary und externes
  Apache-/LiteSpeed-Rewrite bleiben `NICHT_GEPRUEFT`; dadurch wird kein
  Gesamt-`PASS` vorgetäuscht.
- Beide Installationsanleitungen, Produktionsnachweis, Architektur, Status,
  TODO, Changelog und Workflow trennen Domain-Root, physischen DocumentRoot,
  URL-Unterpfad, wertfreie Environmentwerte, Setup-Sperre, Bootstrap, Paket
  und HTTP-Smoke-Tests.

## Tests

- RED: `node --test tests/portable-preflight.test.js` → 21 fehlschlagende
  Assertions gegen das alte CLI.
- GREEN: `node --test tests/portable-preflight.test.js
  tests/production-package.test.js` → 48/48 bestanden.
- Paket: `npm run package:production -- --base-path=/meine-app` → 92
  Nutzdateien erzeugt.
- Preflight: `npm run setup:preflight --
  --package=dist/neutral-production
  --public-url=https://example.test/meine-app/ --base-path=/meine-app` → lokale
  Paket-/Basis-/Einstiegs-/Secretprüfungen `PASS`, PHP und Rewrite sowie
  Gesamtstatus `NICHT_GEPRUEFT`, Exit 0.
- Gesamtsuite ohne PHP-Pflichttests: 212 erfasst, 210 bestanden, zwei
  erwartete PHP-Skips, 0 Fehler.
- `node --check` für beide geänderten Skripte und `git diff --check` ohne
  Befund.

## Dateien

- `scripts/cpanel-preflight.js`
- `scripts/lib/portable-install.js`
- `tests/portable-preflight.test.js`
- `Install-README-Server.md`
- `Install-README-Web-App.md`
- `PRODUCTION-VERIFICATION.md`
- `Architecture.md`
- `STATUS.md`
- `TODO.md`
- `CHANGELOG.md`
- `WORKFLOW.md`
- `.superpowers/sdd/2026-09-03-portable-installation/progress.md`
- `.superpowers/sdd/2026-09-03-portable-installation/task-6-report.md`

## Commit

- `docs: complete portable installation foundation`

## Separater Self-Review

- Spezifikationsabdeckung, Pfadtraversal, Symlinkgrenzen, Secretlecks,
  destruktive Dateiarbeit, Root-Kompatibilität und URL-Unterpfade wurden in
  einem getrennten Reviewpass gegen Code, Fixtures und Paketinhalt geprüft.
- Der Preflight schreibt oder löscht keine Paketdateien. Der Paketbuilder
  bleibt auf seinen validierten Temp-/Ausgabebaum beschränkt und ersetzt nur
  einen zuvor vollständig verifizierten Altstand.
- Scanner-/Fehlerausgaben enthalten keine Fixture-Secretwerte. Paketpfad und
  öffentliche URL werden in Fehlermeldungen nicht wiederholt.
- Der Lauf startete keine Server-, Datenbank-, FTP-/FTPS-, GitHub- oder
  Portscanoperation.

## Offene externe Nachweise

- PHP 8.x und erforderliche Erweiterungen im Zielhosting,
- Apache-/LiteSpeed-Rewrite einschließlich Root, API, Admin, Setup, Assets und
  SPA-Fallback,
- neuer physischer HTTPS-DocumentRoot und echter URL-Unterpfad,
- leere Datenbank, Setup/Migration/Betreiberanlage und Setup-Sperre,
- Login-/Session-/CSRF-/API-/Asset-/SPA-Smoke-Tests,
- Reproduktion aus einem neu angelegten Repository,
- CodeQL und ausdrücklich konfigurierter FTPS-Lauf für den Abschlusscommit.

Diese Punkte wurden weder ausgeführt noch als bestanden dokumentiert.

## Fix-Runde 1: URL-Rohformat und Paketdokumentation

### RED

- Der bestehende Negativtest wurde vor der Implementierung um
  `https:example.test/meine-app/`, `https:/example.test/meine-app/` sowie
  führenden und abschließenden Whitespace erweitert; der Root-Positivfall
  verwendet zusätzlich ein case-insensitives `HTTPS://`.
- `node --test tests/portable-preflight.test.js` war erwartungsgemäß RED:
  `https:example.test/meine-app/` wurde durch WHATWG normalisiert und vom CLI
  mit Exit 0 angenommen. Der Testlauf meldete 29 bestandene und zwei
  fehlschlagende Testknoten, davon den konkreten URL-Subtest und dessen
  übergeordneten Sammeltest.

### GREEN

- `validatePublicBase()` prüft den unveränderten Rohwert jetzt vor
  `new URL()`: kein führender oder abschließender Whitespace, exakter
  case-insensitiver Beginn mit `https://` und nichtleere Authority. Erst
  danach folgen weiterhin WHATWG-, Credential-, Query-, Fragment- und
  exakte Pfadprüfungen.
- Ein zusätzlicher leerer-Authority-Fall `https:///meine-app/` sichert die
  lexikalische Grenze ab. Alle Fehlermeldungen bleiben wertfrei; die
  erlaubten JSON-Statuswerte ändern sich nicht.
- Die Web-App-Anleitung bezeichnet ihren Gegenstand nun als Web-App-Anteil
  des einzigen verbindlichen Full-Stack-Produktionspakets. Die
  Serveranleitung ergänzt für dasselbe Paket PHP-, Datenbank-, Setup- und
  Sperrschritte; keine alternative Client-only-Artefaktart wurde eingeführt.
- `STATUS.md` und der weiterhin ausschließlich offene Task-6-Abschnitt in
  `TODO.md` nennen **Codex (ChatGPT Work / GitHub-Connector)**. Keine
  PHP-/Apache-/Live-/Repository-/Datenbankabnahme wurde geschlossen.

### Nachweise

- gezielter Preflight-GREEN-Lauf: 32/32 Tests bestanden,
- Paket plus Preflight: 52/52 Tests bestanden; die frühere 48er Basis wurde
  ausschließlich um vier URL-Rohformatfälle erweitert,
- Produktionspaket: 92 Nutzdateien für `/meine-app` erzeugt,
- CLI-Preflight: Paket, Basis, Einstiegspunkte und Secretprüfung `PASS`; PHP,
  Rewrite und Gesamtstatus `NICHT_GEPRUEFT`, Exit 0,
- vollständige PHP-ausgeschlossene Suite: 216 erfasst, 214 bestanden, zwei
  erwartete PHP-Skips, 0 Fehler,
- Doku-Suche und `git diff --check`: ohne widersprüchliche Client-only-Aussage
  beziehungsweise Whitespacebefund,
- keine Server-, Datenbank-, FTP-/FTPS-, GitHub- oder Portscanoperation.

### Commit

- `fix: validate portable preflight URL syntax`

### Weiterhin offene externe Nachweise

Die bereits oben aufgeführten PHP-/Apache-/Live-/neues-Repository-/DB-,
Smoke-Test-, CodeQL- und FTPS-Nachweise bleiben unverändert offen.

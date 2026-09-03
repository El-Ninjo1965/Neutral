# Task 3 Report: Reproduzierbares Produktionspaket

## Herkunft und Prüfung der übernommenen RED-Tests

Beim Start lagen ausschließlich uncommittete Änderungen in
`tests/production-package.test.js` und `tests/manual-deploy-manifest.test.js`
vor. Sie stammen laut Task-Brief vom technisch unterbrochenen Implementierer.

Die Tests wurden gegen Brief und Design geprüft und übernommen, weil sie die
geforderten Grenzen konkret erzwingen: stabile Allowlist, Ausschlüsse,
SHA-256, maskierte Scannerbefunde, Symlink-Ablehnung, unveränderte Quelle bei
der Base-Path-Injektion, atomarer Erhalt eines vorhandenen Pakets bei
Validierungsfehlern sowie die gemeinsame Builder-Nutzung in manuellem Deploy
und GitHub-Workflow. Ergänzt wurden ein expliziter Test für die weiterhin
verpflichtende `.env.example` und eine exakte Assertion, dass ein
Scannerbefund nur Datei, Regel und `[MASKIERT]` enthält.

## RED

`node --test tests/production-package.test.js` schlug vor der Implementierung
mit Exit 1 fehl. Einziger Grund war
`Cannot find module '../scripts/lib/portable-install.js'`. Damit war der Lauf
aus dem erwarteten Grund RED: Der Task-3-Builder fehlte vollständig.

## GREEN

`node --test tests/production-package.test.js tests/manual-deploy-manifest.test.js`
ist GREEN: 21 Tests, 21 bestanden, 0 fehlgeschlagen.

Syntaxprüfungen für alle drei betroffenen Skripte sowie `git diff --check`
sind ebenfalls erfolgreich.

Der vollständige Lauf `npm test` erreicht 155 bestandene Tests, scheitert aber
an 9 PHP-abhängigen Tests und bricht 24 weitere PHP-Tests ab, weil im
Ausführungsimage kein `php` vorhanden ist (`spawn php ENOENT`). Die fokussierten
Task-3-Tests bleiben darin erfolgreich.

## Implementierung und Dateien

- `scripts/lib/portable-install.js`: Base-Path-Normalisierung, striktes
  Pflichtinventar, Verbotsregeln, Symlink-Ablehnung, SHA-256 und maskierter
  Secret-Scanner, Paket-only-Meta-Injektion, Manifest/SHA256SUMS und validierter
  Austausch des Ausgabeverzeichnisses.
- `scripts/build-production-package.js`: CLI für `--base-path` und `--output`.
- `scripts/manual-ftps-deploy.js`: Staging ausschließlich über denselben
  Paketbuilder.
- `.github/workflows/ftp-upload.yml`: Paketbau über
  `npm run package:production`; Upload ausschließlich aus
  `dist/neutral-production`.
- `package.json`: Script `package:production`.
- `tests/production-package.test.js` und
  `tests/manual-deploy-manifest.test.js`: fokussierte Vertrags- und
  Deploymenttests.

`.gitignore` musste nicht geändert werden, weil `dist/` bereits ignoriert ist.

## Commit

`feat: build verified production packages` (dieser atomare Task-Commit).

## Self-Review

- Manifest und `SHA256SUMS` verwenden dieselbe sortierte Nutzdateiliste und
  listen weder sich selbst noch einander.
- Der normalisierte Basispfad wird ausschließlich in der temporären
  Paketkopie gesetzt; die Quell-HTML bleibt unverändert.
- Scannerfehler geben exakt Datei, Regel und `[MASKIERT]` aus.
- Sämtliche Symlinks innerhalb der Pflichtbäume werden abgelehnt.
- Ein neues Paket wird vollständig kopiert, transformiert, gescannt und
  gehasht, bevor ein zuvor verifiziertes Ausgabeziel ausgetauscht wird.
- Der Builder liest keine Deployment-Environmentdateien und die Arbeiten
  führten keine Serveroperationen aus.

## Bedenken / offene Abhängigkeiten

- Die reale `.env.example` wird gemäß Ruling erst in Task 4 angelegt. Bis dahin
  bricht ein realer Paketbau bewusst mit einem klaren Fehler ab; die Pflicht
  wurde nicht gelockert und wird durch eine Fixture sowie einen Negativtest
  abgesichert.
- Der Gesamtregressionslauf kann in dieser Umgebung erst mit installiertem PHP
  vollständig GREEN werden; die Fehler sind nicht durch Task 3 verursacht.

## Fix-Runde 1: Critical-Sicherheitsreview

### Test-first RED

Für jeden verifizierten Befund wurde vor dem Fix ein separat gefilterter
Testlauf mit `--test-name-pattern='[review-N]'` ausgeführt. Alle sieben Blöcke
waren aus dem erwarteten Grund RED:

1. `buildCleanupTargets` fehlte; absolute und traversierende Manifestpfade
   wurden normalisiert statt abgelehnt.
2. `quoteLftp` und zentrale Configvalidierung fehlten; Werte wurden teilweise
   ungequotet in LFTP-Code eingesetzt.
3. Ein Output `source/Server` erreichte erst die späte Fremdoutput-Prüfung;
   Symlink-Eltern wurden nicht kanonisiert.
4. Schema-, Payload- und SHA256SUMS-Manipulationen eines vorhandenen Pakets
   wurden vor dem Austausch nicht erkannt.
5. Ein Paketdateiname mit Newline wurde akzeptiert.
6. `data-name` beziehungsweise in Attributwerten eingebettetes `name=` wurde
   fälschlich als echtes Meta-Attribut erkannt.
7. Ein eindeutiger CLI-Parser fehlte; doppelte und leere destructive
   Outputoptionen wurden nicht verworfen.

### GREEN und Regression

`node --test tests/production-package.test.js tests/manual-deploy-manifest.test.js`
ist nach der Fix-Runde GREEN: 33 Tests, 33 bestanden, 0 fehlgeschlagen.

`node --check` ist für Paketbibliothek, Paket-CLI und manuelles Deployscript
GREEN; `git diff --check` ist ebenfalls GREEN. Der vollständige Lauf
`npm test` erreicht nun 167 bestandene Tests. Seine 9 Fehler, 24 Abbrüche und
der eine Skip bleiben ausschließlich PHP-abhängig; im Ausführungsimage fehlt
weiterhin `php` (`spawn php ENOENT`).

### Änderungen und Self-Review

- Explizite Cleanup-Ziele werden relativ unter `FTP_TARGET_DIR` aufgebaut.
  Manifest- und Delete-Pfade verwerfen absolute Schreibweisen, `.`/`..`,
  Backslashes und Steuerzeichen.
- `quoteLftp` escaped Backslash, Doppelquote, Dollar und Backtick. Sämtliche
  dynamischen LFTP-Werte werden doppelgequotet; Port, Protokoll und alle
  verbindungsrelevanten Felder werden vor einer LFTP-/Installationsoperation
  validiert. Der GitHub-Workflow enthält keine eigene LFTP-Heredoc-Logik mehr,
  sondern ruft das validierte manuelle Deployscript auf.
- Source und der tiefste existierende Output-Elternpfad werden per `realpath`
  kanonisiert. Jeder Pflichtpfad wird in beiden Überlappungsrichtungen geprüft;
  `source/dist/neutral-production` bleibt zulässig.
- Ein vorhandener Output wird nur ersetzt, wenn Manifest-Schema,
  eindeutige/sortierte Dateiliste, SHA256SUMS, tatsächliches Inventar, Größen
  und alle Nutzdateihashes konsistent sind. Fremde und manipulierte Bäume
  bleiben unangetastet.
- Paketpfade sind auf sichere ASCII-Segmente begrenzt. Dadurch bleibt jede
  SHA256SUMS-Zeile eindeutig; Metadateien listen sich weiterhin nicht selbst.
- Die Meta-Injektion tokenisiert echte Attribute und verändert weder
  `data-name`/`data-content` noch Attributwerte mit eingebettetem `name=`.
- Der CLI-Parser akzeptiert `--base-path=` eindeutig als Root-Installation,
  lehnt jedoch leere/steuerzeichenhaltige Outputs und doppelte Optionen ab.

Der portable Node-Dateisystem-API fehlt ein atomarer Austausch zweier
nichtleerer Verzeichnisse. Daher bleibt der verifizierte Altbaum während
`Temp -> Backup -> Output` vollständig als Rollback erhalten; zwischen den
beiden Renames besteht eine dokumentierte Namenslücke von typischerweise
wenigen Millisekunden. Scheitert das zweite Rename, wird der Altname aus dem
Backup wiederhergestellt.

### Fix-Commit

`fix: harden production package deployment` (atomarer Commit dieser Runde).

### Verbleibende Bedenken

- `.env.example` bleibt bis Task 4 absichtlich verpflichtend und fehlt im
  realen Quellbaum noch; ein realer Paketlauf bricht deshalb weiterhin sicher
  ab.
- Ein vollständiger grüner Gesamtregressionslauf erfordert ein PHP-fähiges
  Ausführungsimage.

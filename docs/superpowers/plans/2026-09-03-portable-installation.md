# Portable Installation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Neutral aus demselben Commit im Domain-Root, in einem eigenen Document-Root und unter einem konfigurierten URL-Unterpfad installieren und als geprüftes, secretfreies Produktionspaket weiterverwenden können.

**Architecture:** Ein identischer Basispfadvertrag wird in PHP und JavaScript umgesetzt und von allen öffentlichen URLs konsumiert. Ein gemeinsamer Paketmodul-Kern erzeugt Manifest und Prüfsummen; Deployment, Preflight und App-Bootstrap verwenden diesen Kern statt eigener Dateilisten.

**Tech Stack:** PHP 8.x ohne Composer-Abhängigkeit, Node.js CommonJS und `node:test`, Apache per-directory `.htaccess`, GitHub Actions, explizites FTPS.

**Spec:** `docs/superpowers/specs/2026-09-02-portable-installation-design.md`

## Global Constraints

- `NEUTRAL_BASE_PATH` ist `""` oder beginnt mit genau einem `/` und endet nicht mit `/`.
- Segmente enthalten nur ASCII-Buchstaben, Ziffern, `.`, `_`, `~`, `-`; `.`, `..`, Prozentkodierung, Backslash, Nullbyte, Schema, Host, Query und Fragment sind ungültig.
- Fehlende Basispfadkonfiguration bleibt rückwärtskompatibel zum Domain-Root.
- Physischer FTP-Zielordner und öffentlicher URL-Basispfad bleiben getrennt.
- Browserkonfiguration enthält nur `basePath` und `apiBase`.
- Produktionsumfang: `.htaccess`, vollständiges `Web-App/`, `Server/php/`, `Server/public/`, wertfreie `.env.example`, `manifest.json`, `SHA256SUMS`.
- Node-Server, Tests, Dokumentation, Git-Daten, Runtime, Backups, Logs, lokale `.env*` und Deployment-Secrets sind ausgeschlossen.
- FTPS nutzt Port 21 und Zertifikats-/Hostnamenprüfung standardmäßig; Secrets erscheinen nie in Ausgaben.
- Tests verändern keine Datenbank, versenden keine Mail, scannen keine Ports und erstellen kein GitHub-Repository.
- Materielle Änderungen aktualisieren `STATUS.md`, `TODO.md`, `CHANGELOG.md` und `WORKFLOW.md` mit Codex-Zuordnung.

## Dateistruktur

| Datei | Verantwortung |
|---|---|
| `Server/php/src/PublicPath.php` | PHP-Normalisierung und URL-Auflösung |
| `Web-App/public/public-path.js` | Browser-/Node-kompatibler URL-Resolver |
| `scripts/lib/portable-install.js` | Inventar, Hashing, Secretregeln, atomare Dateiarbeit |
| `scripts/build-production-package.js` | Produktionspaket-CLI |
| `scripts/create-neutral-app.js` | lokaler App-Bootstrap |
| `scripts/cpanel-preflight.js` | Paket-, Basis-, PHP- und Deployment-Vorabprüfung |
| `tests/*portable*.test.js` | Verträge, Paket, Bootstrap und Preflight |

### Task 1: Gemeinsamer Basispfadvertrag

**Files:** Create `Server/php/src/PublicPath.php`, `Web-App/public/public-path.js`, `tests/public-path.test.js`, `tests/php-public-path.test.js`; modify `Server/php/bootstrap.php`, `Server/php/src/AppConfig.php`.

**Interfaces:** PHP erzeugt `PublicPath::normalize(string): string`, `basePath(): string`, `publicUrl(string): string`, `apiBase(): string`. JavaScript erzeugt `NeutralPublicPath.normalize(value)`, `base()`, `join(path)`, `asset(path)`, `api(path)`, `admin()`, `setup()`.

- [x] **Step 1: JavaScript-Vertrag zuerst schreiben.**

```js
assert.equal(PublicPath.normalize('/meine-app/'), '/meine-app');
assert.equal(PublicPath.join('Web-App/public/style.css'), '/meine-app/Web-App/public/style.css');
assert.equal(PublicPath.api('auth/me'), '/meine-app/api/v1/auth/me');
for (const value of ['https://host/app', '/a/../b', '/a%2Fb', '/a?x=1', '/ä']) {
  assert.throws(() => PublicPath.normalize(value), /base path/i);
}
```

- [x] **Step 2: `node --test tests/public-path.test.js` ausführen.** Erwartet: FAIL wegen fehlendem Modul.
- [x] **Step 3: PHP-Prozesstest schreiben.** Bei `spawnSync`-Fehler `ENOENT` ausdrücklich SKIP; sonst Root, `/meine-app`, Asset und `/meine-app/api/v1` prüfen.
- [x] **Step 4: Beide Resolver minimal implementieren und in Bootstrap/AppConfig einbinden.** Ungültige Konfiguration wirft; es gibt keinen Root-Fallback.
- [x] **Step 5: `node --test tests/public-path.test.js tests/php-public-path.test.js` ausführen.** Erwartet: PASS beziehungsweise ausschließlich PHP-SKIP.
- [x] **Step 6: Commit `feat: add portable public path contract`.**

### Task 2: App-, Admin- und API-Pfade umstellen

**Files:** Modify `Web-App/public/index.html`, `api-client.js`, `user-app.js`, `admin-init.js`, `admin/index.js`, `Web-App/core/core-loader.js`, `Server/public/admin.php`, `Server/public/setup.php`, `Server/php/views/admin-ui.php`, `.htaccess` und zugehörige Tests.

**Interfaces:** Konsumiert Task 1. PHP liefert nur `window.NeutralConfig = {basePath, apiBase}` mit `json_encode(..., JSON_HEX_*)`; Browsercode nutzt ausschließlich `NeutralPublicPath`.

- [x] **Step 1: Root-/Unterpfad-Fixtures und Verbotstest zuerst ergänzen.**

```js
for (const source of productionSources) {
  assert.doesNotMatch(source.text, /["'`]\/(?:Web-App|admin\.php|setup\.php)(?:\/|["'`])/);
}
assert.equal(resolveWith('/meine-app', '/api/status'), '/meine-app/api/v1/status');
```

- [x] **Step 2: Gezielte Tests ausführen und vorhandene absolute Pfade als FAIL bestätigen.**
- [x] **Step 3: `public-path.js` vor API/Admin-Konsumenten laden; PHP-Konfiguration sicher injizieren.**
- [x] **Step 4: Asset-, API-, Login-, Logout-, Setup-, Navigation- und Modulkatalog-URLs auf Resolver umstellen.**
- [x] **Step 5: `.htaccess` ohne `RewriteBase` für per-directory Root und Unterpfad beibehalten; echte Dateien/Verzeichnisse bewahren.**
- [x] **Step 6: `node --test tests/public-path.test.js tests/api-client-performance.test.js tests/admin-cms-ui.test.js tests/manual-deploy-manifest.test.js` ausführen.** Erwartet: PASS.
- [x] **Step 7: Commit `feat: support root and subpath public URLs`.**

### Task 3: Reproduzierbares Produktionspaket

**Files:** Create `scripts/lib/portable-install.js`, `scripts/build-production-package.js`, `tests/production-package.test.js`; modify `package.json`, `.gitignore`, `scripts/manual-ftps-deploy.js`, `.github/workflows/ftp-upload.yml`.

**Interfaces:** `normalizeBasePath`, `collectProductionFiles`, `sha256File`, `scanFile`, `buildProductionPackage`; CLI `npm run package:production -- --base-path=/meine-app --output=<dir>`.

- [x] **Step 1: Inventar-, Ausschluss-, Hash- und Maskierungstests zuerst schreiben.**

```js
assert.equal(inventory.some((p) => p.startsWith('Server/node/')), false);
assert.equal(inventory.some((p) => /(^|\/)\.env(?:\.|$)/.test(p) && p !== '.env.example'), false);
assert.match(scannerError, /\[MASKIERT\]/);
assert.doesNotMatch(scannerError, secretFixtureValue);
```

- [x] **Step 2: `node --test tests/production-package.test.js` ausführen.** Erwartet: FAIL wegen fehlendem Builder.
- [x] **Step 3: Allowlist-Inventar, Symlink-Ablehnung, sicheren Scanner und atomaren Ausgabeaustausch implementieren.**
- [x] **Step 4: sortiertes `manifest.json` mit `{path,size,sha256}` und identisches `SHA256SUMS` erzeugen; beide listen sich nicht selbst.**
- [x] **Step 5: Manuelles Deployment und GitHub-Workflow ausschließlich das erzeugte Paket hochladen lassen.**
- [x] **Step 6: Paket- und Deploymenttests ausführen.** Erwartet: PASS.
- [x] **Step 7: Commit `feat: build verified production packages`.**

### Task 4: Wertfreie Konfiguration und FTPS-Standard

**Files:** Create `.env.example`; modify `.env.ftp.deploy.example`, `tests/production-package.test.js`, `Install-README-Server.md`, `Security.md`.

**Interfaces:** Konsumiert Task 3; produziert vollständige wertfreie Runtimevorlage und neutrale FTPS-Vorlage. Der bestehende Runtime-Schlüssel für das Bootstrap-Passwort heißt `CORE_BOOTSTRAP_PASSWORD`.

- [x] **Step 1: Tests für leere `DB_PASSWORD`, `CORE_BOOTSTRAP_PASSWORD`, `NEUTRAL_BACKUP_KEY`, neutralen Beispielhost und `FTP_SSL_CHECK_HOSTNAME=true` schreiben.**
- [x] **Step 2: Pakettest ausführen und aktuelle Beispielkonfiguration als FAIL bestätigen.**
- [x] **Step 3: Vorlagen erstellen; nur sichere öffentliche Standards wie `APP_ENV=production`, `FTP_PORT=21`, `FTP_PROTOCOL=ftps` vorbelegen.**
- [x] **Step 4: `node --test tests/production-package.test.js tests/manual-deploy-manifest.test.js` ausführen.** Erwartet: PASS ohne sensible Ausgabe.
- [x] **Step 5: Commit `security: add value-free deployment templates`.**

### Task 5: Lokaler App-Bootstrap

**Files:** Create `scripts/create-neutral-app.js`, `tests/app-bootstrap.test.js`; modify `package.json`, `Install-README-Web-App.md`.

**Interfaces:** CLI `npm run app:create -- --target=<dir> --app-id=sample-app --app-name="Sample App" [--include-gps] [--init-git]`. Es wird kein Git-Remote angelegt.

- [x] **Step 1: Tests für belegtes Ziel, unveränderten Marker, App-ID/-Name, GPS-Auswahl und Secretfreiheit schreiben.**
- [x] **Step 2: `node --test tests/app-bootstrap.test.js` ausführen.** Erwartet: FAIL wegen fehlender CLI.
- [x] **Step 3: Ziel-/ID-/Namensvalidierung und atomaren Aufbau im benachbarten temporären Ordner implementieren.** App-ID: `^[a-z0-9]+(?:-[a-z0-9]+)*$`; Name: 1–80 Zeichen ohne Steuerzeichen.
- [x] **Step 4: Öffentliche Metadaten ersetzen, GPS nur mit `--include-gps` behalten, mit `--init-git` nur `git init` ausführen.**
- [x] **Step 5: `node --test tests/app-bootstrap.test.js tests/production-package.test.js` ausführen.** Erwartet: PASS.
- [x] **Step 6: Commit `feat: add safe neutral app bootstrap`.**

### Task 6: Paket-Preflight, Dokumentation und Abschluss

**Files:** Modify `scripts/cpanel-preflight.js`; create `tests/portable-preflight.test.js`; modify beide Installationsanleitungen, `PRODUCTION-VERIFICATION.md`, `Architecture.md`, `STATUS.md`, `TODO.md`, `CHANGELOG.md`, `WORKFLOW.md`.

**Interfaces:** CLI `npm run setup:preflight -- --package=<dir> --public-url=https://example.test/meine-app/ --base-path=/meine-app`; JSON-Status ausschließlich `PASS`, `BLOCKED`, `NICHT_GEPRUEFT`.

- [x] **Step 1: Fixtures für gültiges Paket, manipulierte Datei, falsche Basis, fehlende PHP-Binary und maskierten Scannerfehler schreiben.**
- [x] **Step 2: Preflight-Test ausführen.** Erwartet: FAIL, weil Manifestparameter noch nicht unterstützt werden.
- [x] **Step 3: Argumente, HTTPS-/Pfadkonsistenz, Inventar, Hashes und Statusmodell implementieren.** Extern nicht prüfbares Rewrite/PHP ist `NICHT_GEPRUEFT`, niemals `PASS`.
- [x] **Step 4: Root-, DocumentRoot-, Unterpfad-, Secret-, Setup- und Smoke-Test-Anleitungen aktualisieren.** Nur belegte Punkte aus `TODO.md` entfernen.
- [x] **Step 5: Vollständige lokale Verifikation ausführen.**

```bash
npm run package:production -- --base-path=/meine-app
npm run setup:preflight -- --package=dist/neutral-production --public-url=https://example.test/meine-app/ --base-path=/meine-app
node --test --test-concurrency=1 $(rg --files tests | rg '\.test\.js$' | rg -v '(admin-php-entry|php-backup|php-login-rate-limit|portability-config)')
git diff --check
```

- [x] **Step 6: Unabhängiges Review auf Spezifikationsabdeckung, Traversal, Symlinkgrenzen, Secretlecks, destruktive Dateiarbeit, Root-Kompatibilität und Unterpfade durchführen; Befunde beheben.**
- [x] **Step 7: Abschlussstand nach GitHub `main` übertragen; CodeQL und FTPS prüfen.** Zertifikatsgültiger Host und geschütztes Ziel sind im Korrekturcommit `20583c25` abgesichert. CodeQL-Lauf `33802485847`, FTPS-Lauf `33802485499` und separater Read-only-Zielnachweis `33803384719` bestanden; `.htaccess`, `Web-App/` und `Server/` sind bestätigt. Die kurzzeitige falsche `/`-Zielannahme aus Lauf `33802090900` wurde unmittelbar zurückgenommen und in Status, TODO, Workflow und Changelog dokumentiert. Produktiver Unterpfad-/Datenbanktest bleibt offen.

  Read-only-Nachtrag: Der zertifikatsgültige Host `server.cpprotect5.de` wurde in Lauf `33800747981` mit explizitem FTPS auf Port 21 erfolgreich bis einschließlich Authentifizierung, `pwd` und Verzeichnislesbarkeit geprüft. Der virtuelle Root `/` enthält `.htaccess`, aber noch nicht `Web-App/` und `Server/`; kein Upload oder Remoteeingriff wurde ausgeführt.

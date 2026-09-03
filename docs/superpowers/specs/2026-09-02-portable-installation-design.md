# Portable Installation Design

**Status:** FREIGEGEBENES ARCHITEKTURDESIGN  
**Datum:** 2026-09-02  
**Verantwortlich:** Codex (ChatGPT Work / GitHub-Connector)

## 1. Ziel und Abgrenzung

Neutral soll ohne manuelle Codeänderung aus demselben Quellstand in drei Betriebsformen installierbar sein:

1. im Domain-Root, beispielsweise `https://example.test/`,
2. in einem eigenen physischen Document-Root einer Domain oder Subdomain,
3. unter einem URL-Unterpfad, beispielsweise `https://example.test/meine-app/`.

Diese Spezifikation liefert die portable Installationsbasis: einen zentralen öffentlichen Basispfad, ein reproduzierbares Produktionspaket, wertfreie Konfigurationsvorlagen, Vorabprüfungen und einen lokalen App-Bootstrap. Sie erstellt kein GitHub-Repository, schreibt keine Secrets und verändert keine produktiven Serverdaten. Modul-Lifecycle, Providerverwaltung sowie Backup/Restore/Update/Rollback bleiben eigenständige Folgepakete aus `TODO.md`.

## 2. Begriffe und verbindliche Konfiguration

`NEUTRAL_BASE_PATH` bezeichnet ausschließlich den öffentlichen URL-Präfix der Installation. Der physische FTPS-Zielordner bleibt davon unabhängig.

- Domain-Root und eigener Document-Root verwenden den normalisierten Wert `""`.
- Eine Unterpfadinstallation verwendet beispielsweise `"/meine-app"`.
- Ein einzelner abschließender Slash wird entfernt; ein führender Slash wird ergänzt.
- `/` wird zu `""` normalisiert.
- URL-Schemata, Hostnamen, Querystrings, Fragmente, Backslashes, Nullbytes sowie die Segmente `.` und `..` sind ungültig.
- Gültige Segmente bestehen aus URL-sicheren ASCII-Zeichen `A-Z`, `a-z`, `0-9`, Punkt, Unterstrich, Tilde und Bindestrich. Prozentkodierte oder Unicode-Segmente werden nicht stillschweigend umgeschrieben.
- Ein ungültiger konfigurierter Wert führt serverseitig und in Build-/Preflight-Werkzeugen zu einem klaren Abbruch. Es gibt keinen unsicheren Fallback.

Der Standard bleibt `""`, damit bestehende Root-Installationen kompatibel bleiben. Der Wert darf als öffentliche Laufzeitkonfiguration an den Browser ausgegeben werden; Zugangsdaten, Dateisystempfade und sonstige Environmentwerte dürfen nicht mit ausgegeben werden.

## 3. URL-Auflösung

### 3.1 PHP

Eine fokussierte PHP-Komponente normalisiert `NEUTRAL_BASE_PATH` und stellt mindestens diese Operationen bereit:

- `basePath(): string`
- `publicUrl(string $path): string`
- `apiBase(): string`

`publicUrl()` akzeptiert nur app-lokale Pfade, entfernt doppelte Trenner und gibt genau `basePath + '/' + path` aus. Dynamische Werte werden kontextgerecht escaped. Admin- und Setup-Seiten, Weiterleitungen sowie serverseitig erzeugte Asset-URLs verwenden ausschließlich diese Komponente.

### 3.2 Browser

Der Browser erhält genau eine nicht-sensitive Konfiguration mit `basePath` und daraus abgeleitetem `apiBase`. Ein kleines URL-Modul stellt `base()`, `join(path)`, `asset(path)`, `api(path)`, `admin()` und `setup()` bereit. Es ist vor allen konsumierenden Skripten verfügbar.

Die statische Startseite lädt ihre Bootdateien relativ zum aktuellen Dokument. Danach verwenden App, Service Worker und Admin-Client den Resolver. Root-absolute Literale für `/Web-App`, `/api`, `/admin.php` und `/setup.php` sind in produktivem Browser- und PHP-Code unzulässig; ein Regressionstest erzwingt diese Grenze. Externe absolute HTTPS-URLs sind von dieser Prüfung ausgenommen.

### 3.3 Rewrite-Verhalten

Die Root-`.htaccess` bleibt eine per-directory Apache-Konfiguration ohne fest verdrahtetes `RewriteBase`. Regeln arbeiten relativ zum Installationsverzeichnis und bewahren echte Dateien und Verzeichnisse. API-, Admin-, Setup- und SPA-Fallback-Routen müssen im Root und im Unterpfad identische interne Ziele erreichen. Der Preflight prüft die erwarteten Rewrite-Dateien und meldet fehlende Serverunterstützung als Installationsblocker, soweit sie lokal beziehungsweise per explizitem HTTP-Smoke-Test nachweisbar ist.

## 4. Produktionspaket

`scripts/build-production-package.js` erzeugt deterministisch ein neues Ausgabeverzeichnis unter `dist/neutral-production/`. Vorhandene Ausgaben werden nur innerhalb dieses fest definierten Verzeichnisses ersetzt.

Enthalten sind ausschließlich:

- Root-`.htaccess`,
- der vollständige Ordner `Web-App/`,
- `Server/php/`,
- `Server/public/`,
- eine wertfreie `.env.example`,
- `manifest.json` und `SHA256SUMS`.

Ausgeschlossen sind insbesondere `Server/node/`, `tests/`, `docs/`, Git-Metadaten, `node_modules/`, lokale Runtime-Daten, Backups, Logs, `.env`-Dateien, Deployment-Konfigurationen und bekannte Secret-/Schlüsseldateien.

`manifest.json` enthält Schema-Version, Produzentenkennung, Paketformat, App-/Frameworkversion, Quellcommit wenn verfügbar, Erzeugungszeit, normalisierten Basispfad, den booleschen Git-Arbeitsbaumstatus `sourceDirty` und die sortierte Dateiliste mit Größe und SHA-256. `sourceDirty=false` wird nur bei erfolgreich geprüftem, sauberem Git-Arbeitsbaum gesetzt; Änderungen, ein fehlendes Repository oder ein nicht prüfbarer Git-Status ergeben konservativ `true`. `SHA256SUMS` enthält dieselben Dateien in stabiler Sortierung. Manifest und Prüfsummendatei listen sich nicht selbst. Ein zweiter Lauf über unveränderte Eingaben muss dieselbe Nutzdateiliste und dieselben Nutzdatei-Hashes erzeugen; Zeitstempel, Quellcommit und Arbeitsbaumstatus sind Metadaten und werden getrennt geprüft.

Der Build bricht ab, wenn ein Pflichtpfad fehlt, ein verbotener Pfad enthalten wäre, ein Symlink das Repository verlässt oder ein einfacher Secret-Scanner bekannte Zugangsschlüsselmuster in Paketdateien erkennt. Scannerbefunde nennen nur Datei und Regel, niemals den verdächtigen Wert.

## 5. Konfigurationsvorlagen und Deployment-Sicherheit

Die produktive `.env.example` enthält ausschließlich Schlüssel und sichere Beispielwerte. Datenbankpasswort, Bootstrap-Passwort, Session-Secret und Provider-Secrets bleiben leer und werden als hostlokal erforderlich beschrieben. Die Anwendung darf beim fehlenden Pflichtsecret nicht mit einem veröffentlichten Standardwert starten.

Die versionierte FTPS-Beispielkonfiguration wird neutralisiert:

- keine reale Domain, kein realer Benutzer und kein reales Zielverzeichnis,
- explizites FTPS auf Port 21 als dokumentierte Voreinstellung,
- TLS-Zertifikats- und Hostnamenprüfung standardmäßig aktiviert,
- kein Passwortfeld mit einem echten oder plausiblen Wert.

Manueller und GitHub-basierter Deploy verwenden weiterhin ausschließlich sichere Secret-Konfiguration. Der Paketbau liest keine `.env.deploy` und gibt keine Verbindungsparameter aus.

## 6. App-Bootstrap

`scripts/create-neutral-app.js` erstellt aus einem sauberen Neutral-Checkout einen neuen lokalen Projektordner. Pflichtparameter sind Zielverzeichnis, maschinenlesbare App-ID und Anzeigename; optional kann das vorhandene GPS-Referenzmodul einbezogen werden. Das Werkzeug:

- validiert, dass das Ziel leer oder nicht vorhanden ist,
- kopiert nur versionierte Projektvorlagen,
- setzt öffentliche App-Metadaten an den dafür vorgesehenen Stellen,
- erzeugt keine Secrets,
- führt keinen GitHub-API-Aufruf aus,
- initialisiert Git nur nach einer expliziten Option,
- gibt anschließend eine kurze Checkliste für Repository, Secrets, Zielordner, Datenbank und Abnahme aus.

Ein Fehlschlag hinterlässt keinen halb überschriebenen bestehenden Zielordner. Neu erzeugte Dateien bleiben lokal nachvollziehbar und können ohne Neutral-spezifische absolute Pfade getestet werden.

## 7. Preflight und Installationsablauf

Der Preflight nimmt Paketpfad, öffentliche Basis-URL und optionalen Basispfad entgegen. Er prüft:

1. Paketmanifest und alle Prüfsummen,
2. erlaubte und verbotene Paketpfade,
3. Konsistenz von URL und `NEUTRAL_BASE_PATH`,
4. Vorhandensein der Rewrite-, PHP-, Public- und Web-App-Einstiegspunkte,
5. Secretfreiheit nach denselben maskierenden Regeln wie der Paketbau,
6. lokal prüfbare PHP-Mindestanforderungen; nicht lokal prüfbare Hosting-Fähigkeiten werden explizit als `NICHT_GEPRUEFT` ausgegeben.

Die Installationsdokumentation beschreibt getrennt:

- Deployment in einen eigenen physischen Document-Root mit leerem Basispfad,
- Deployment in ein Unterverzeichnis mit passendem `NEUTRAL_BASE_PATH`,
- hostlokales Anlegen der `.env`,
- Setup/Migration/Betreiberanlage,
- Sperrung des Setups,
- Login-, Session-, CSRF-, API-, Asset- und SPA-Smoke-Tests.

Kein Werkzeug lädt im Rahmen seiner Tests Dateien hoch, verändert Datenbanken oder scannt fremde Ports. Live-Schritte erfolgen nur durch den bestehenden, ausdrücklich konfigurierten Deployment-Ablauf.

## 8. Tests und Abnahmekriterien

Alle Implementierungsschritte erfolgen test-first. Erforderlich sind:

- PHP-Unit-Tests für gültige und ungültige Basispfade sowie erzeugte URLs,
- JavaScript-Tests für denselben Normalisierungsvertrag und alle Resolverfunktionen,
- statische Regressionstests gegen verbotene root-absolute App-Pfade,
- Fixture-Tests für Root, eigenen Document-Root und `/meine-app`,
- Paket-Inventar-, Ausschluss-, Manifest- und Prüfsummentests,
- Tests für wertfreie Vorlagen und maskierte Scannerfehler,
- Bootstrap-Tests für leeres Ziel, belegtes Ziel, Metadatenersetzung und optionales GPS-Modul,
- Preflight-Tests für gültiges Paket, manipulierte Datei, falschen Basispfad, fehlenden Pflichtpfad und verbotene Datei.

Die portable Installationsbasis gilt als bestanden, wenn:

1. alle lokal verfügbaren Test-Suiten ohne Fehler laufen,
2. das Produktionspaket aus einem sauberen Commit reproduzierbar erzeugt wird,
3. keine Secrets oder lokalen Runtime-Dateien enthalten sind,
4. Root- und Unterpfad-Fixtures dieselben öffentlichen Funktionen erreichen,
5. eine dokumentierte Neuinstallation in leerem Document-Root und eine unter `/meine-app/` ihre HTTP-Smoke-Tests bestehen,
6. GitHub Actions für CodeQL und den vorgesehenen Deploy erfolgreich sind,
7. `STATUS.md`, `TODO.md`, `CHANGELOG.md`, `WORKFLOW.md` und die Installationsanleitungen den belegten Stand ohne Vorwegnahme offener Live-Abnahmen wiedergeben.

## 9. Fehlerbehandlung und Rückwärtskompatibilität

Konfigurations-, Build-, Bootstrap- und Preflight-Fehler verwenden ungleich null endende Prozesse und kurze deutsche beziehungsweise technisch eindeutige Meldungen. Geheimwerte werden in Fehlern vollständig durch `[MASKIERT]` ersetzt. Fehler führen nicht zu einem stillen Wechsel auf den Root-Basispfad.

Bestehende Installationen ohne `NEUTRAL_BASE_PATH` verhalten sich wie bisher im Domain-Root. Bestehende API-Versionen und Legacy-Routen bleiben erhalten, solange `API.md` sie als kompatibel ausweist. Die Umstellung verändert keine Datenbankschemata und erfordert keine Datenmigration.

## 10. Folgepakete bis Core 1.0

Nach Abnahme dieser Spezifikation folgen jeweils mit eigener Spezifikation, Plan, Tests und Dokumentation:

1. vollständiger Modulvertrag mit PHP-Routen, Migrationen, Limits und sicherer Deinstallation,
2. Provideradapter und serverseitige Secretverwaltung,
3. Backup, Restore, Update, Rollback und Serverumzug,
4. abschließende Core-1.0-Matrix und reproduzierbare Produktionsabnahme.

Diese Reihenfolge verhindert, dass spätere Features erneut fest verdrahtete Installationspfade oder nicht paketierbare Zustände einführen.

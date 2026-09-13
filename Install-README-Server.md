# NEUTRAL – Server installieren

**Status:** VERBINDLICHE BETRIEBSANLEITUNG  
**Geprüft:** 2026-09-13

## Voraussetzungen

Der Serverteil ist für Shared Hosting mit PHP und MySQL/MariaDB ausgelegt. Node.js ist für Entwicklung, Tests und Paketbau nützlich, aber keine Voraussetzung für den produktiven PHP-Runtimepfad.

Erforderlich sind insbesondere:

- PHP in einer vom Projekt unterstützten Version;
- MySQL/MariaDB;
- HTTPS;
- Rewrite-Unterstützung;
- Schreibrechte nur für ausdrücklich benötigte Runtime-/Log-/Backupbereiche;
- ein nicht öffentlich zugänglicher Bereich für `.env`, Secrets und Backups.

## Verzeichnis- und Basis-Pfad

Die Installation kann im Webroot oder unter einem Basis-Pfad betrieben werden. Pfade werden nicht durch fest verdrahtete Hostnamen bestimmt. Öffentliche Web-App, Adminoberfläche, Setup und API müssen denselben konfigurierten Basisvertrag verwenden.

Die PHP-API liegt unter:

```text
<Basis>/api/v1/...
```

`<Basis>/api/status` bleibt der begrenzte öffentliche Statusendpunkt.

## Hostlokale Konfiguration

Produktive Konfiguration gehört in die hostlokale `.env`. Die Repositorydatei `.env.example` enthält ausschließlich sichere Platzhalter.

Mindestens prüfen bzw. setzen:

- `APP_ID`
- `APP_NAME`
- `APP_BASE_PATH`
- `APP_URL`
- Datenbankhost/-name/-user/-passwort
- Session-/Securitywerte
- Setup-/Recoverywerte nur bei tatsächlichem Bedarf
- Backup-Pfad und Backup-Schlüssel

Secrets dürfen niemals in Git, Browsercode, Dokumentation oder Logs gelangen.

## Datenbank

Migrationen sind die autoritative Schemaquelle. Core und installierte Module führen ihre Migrationen über den vorgesehenen Migrationsvertrag aus; produktiver Code darf fehlende Spalten oder Tabellen nicht still improvisieren.

Vor Migration oder Restore immer Datenbankziel und Backupzustand prüfen.

## Setup

`setup.php` und die Setup-API bilden die bestehende Setup-Grundlage. Sie prüfen Voraussetzungen, Datenbankverbindung, Migrationen, Core-Seeding und Bootstrap-Admin. Setup-/Recoveryzugang ist sicherheitsrelevant und darf nach erfolgreicher Aktivierung nicht dauerhaft offen bleiben.

Ein vorhandener aktiver Installationszustand darf nicht unbeabsichtigt überschrieben werden.

## Produktionspaket

Das Produktionspaket wird mit dem vorgesehenen Buildweg erzeugt. Es enthält den auslieferbaren Web-App-/PHP-Bestand, Manifest und Prüfsummen, aber keine Entwicklungsartefakte, Git-Historie oder hostlokalen Secrets.

Beispiel:

```bash
npm ci
npm test
npm run package:production -- --base-path="<Basis>" --output="dist/neutral-production"
```

Nur bei erfolgreichem Paket-/Preflight-Ergebnis deployen. Lokale Prüfung ersetzt nicht die Zielhost-Prüfung von PHP, Rewrite, HTTPS und Datenbank.

Das Produktionsmanifest führt `sourceDirty`. `false` bedeutet, dass Git/Arbeitsbaum erfolgreich geprüft und sauber bzw. unverändert war; `true` bedeutet lokale Änderungen oder einen nicht zuverlässig prüfbaren Git-Status. Ein Release soll aus einem sauberen Commit gebaut werden.

## Installation

1. Sauberen Commit verwenden.
2. Verifiziertes Paket vollständig und unverändert übertragen.
3. Hostlokale `.env` aus der Vorlage erzeugen und befüllen.
4. Root-`.htaccess` und `Server/public/api/.htaccess` unverändert übertragen.
5. Benötigte Runtime-/Log-/Backupverzeichnisse mit minimalen Schreibrechten anlegen.
6. `<Basis>/setup.php` über den autorisierten Setupweg öffnen.
7. Datenbank prüfen/anlegen, Migrationen und Core-Seeding ausführen und Bootstrap-Admin anlegen.
8. Nach Aktivierung nachweisen, dass Setup-Seite und Setup-API ohne Recoveryfreigabe nicht mehr öffentlich nutzbar sind.

Module werden durch Discovery sichtbar, aber nicht automatisch installiert oder aktiviert. Modul-Lifecycle erfolgt über den definierten Admin-/Runtime-Vertrag.

## Recovery

Eine geplante Recovery darf nur kurzzeitig über die hostlokalen Recovery-Einstellungen freigegeben werden. Recovery-Token gehören niemals in URL, Repository oder Log. Zusätzliche Hoster-Sperren wie Basic Auth oder IP-Begrenzung sind sinnvoll.

Nach Abschluss Recovery wieder deaktivieren.

## API-/Sicherheitsabnahme

Im Zielhosting prüfen:

1. Startseite und Assets laden unter der vorgesehenen Basis ohne 404.
2. `GET <Basis>/api/status` liefert nur öffentlichen Betriebsstatus.
3. Setup ist nach Aktivierung ohne autorisierte Recoveryfreigabe gesperrt.
4. Login setzt Serversession und CSRF-Kontext.
5. `GET <Basis>/api/auth/me` funktioniert nur mit gültiger Session.
6. `admin.php` unterscheidet unauthentifiziert, nicht autorisiert und Admin korrekt.
7. Schreibrequests ohne gültiges CSRF werden abgewiesen.
8. Health-/DB-/Diagnoseantworten enthalten keine Secrets.

## Deployment

`scripts/manual-ftps-deploy.js` und `.github/workflows/ftp-upload.yml` übertragen denselben Produktionsumfang. Web-App und PHP-Server bleiben getrennte Verzeichnisbereiche innerhalb eines gemeinsamen Pakets.

FTPS verwendet Zertifikats- und Hostnamenprüfung. `FTP_TARGET_DIR` muss ausdrücklich gesetzt sein. `FTP_SSL_CHECK_HOSTNAME=false` ist unzulässig und wird vom Deploymentweg abgelehnt. Hostlokale Deploymentkonfiguration und Repository-Secrets dürfen nie protokolliert oder committed werden.

Dokumentations-only-Änderungen lösen keinen Produktionsdeploy aus. Produktionsdeploys bauen, testen und prüfen den Paketstand vor dem Upload.

## Backup und Restore

Der aktuelle Vertrag steht in `BACKUP-CONTRACT.md`. Backup-Schlüssel und Pfade bleiben hostlokal. Ein Produktions-Restore ist niemals Smoke-Test; Restore-Abnahmen erfolgen ausschließlich in isolierter Test-/Stagingumgebung.

## Serverwechsel

1. Kompatibles Release bereitstellen.
2. Neue hostlokale `.env` und Secrets setzen.
3. Datenbank und Storage in isolierter Zielumgebung vorbereiten.
4. Verifiziertes Backup/Restore-Verfahren verwenden.
5. Rewrite, HTTPS, API, Login, Admin, Module und Backupstatus erneut abnehmen.

Anwendungscode bleibt aus Git bzw. dem verifizierten Produktionspaket reproduzierbar; hostlokale Secrets werden nicht aus dem Repository wiederhergestellt.
# NEUTRAL – Server installieren

**Status:** VERBINDLICHE BETRIEBSANLEITUNG  
**Geprüft:** 2026-09-13

Diese Anleitung beschreibt den produktiven PHP-/Datenbank-/Setup-Anteil des gemeinsamen Full-Stack-Pakets. Aktuelle Livefehler und Entwicklungszwischenstände gehören ausschließlich in `STATUS.md`.

## Produktionsmodell

Neutral Core 1.0 läuft auf normalem Shared Hosting mit PHP 8.1+, MySQL/MariaDB und HTTPS. Node.js wird nur lokal für Entwicklung, Tests und Paketbau benötigt; auf dem Produktionshost sind weder Passenger noch ein öffentlicher Node-Port oder permanente Worker erforderlich.

Produktion verwendet dasselbe verifizierte Paket wie die Web-App und enthält `Web-App/`, `Server/php/` und `Server/public/` in ihrer vorgesehenen Struktur.

## Voraussetzungen

- Linux Shared Hosting, z. B. cPanel;
- LiteSpeed oder Apache-kompatibles Rewrite;
- PHP 8.1+;
- PDO, `pdo_mysql`, JSON, Session und OpenSSL;
- MySQL/MariaDB mit InnoDB und utf8mb4;
- HTTPS;
- Schreibrechte nur für tatsächlich benötigte Runtime-/Log-/Backupbereiche.

Kein pauschales `777` verwenden.

## Serverstruktur

- `Server/php/bootstrap.php`, `Server/php/src/` – PHP-Core;
- `Server/public/api/index.php` – zentraler API-Router;
- `Server/public/api/.htaccess` – API-Rewrite;
- `Server/public/admin.php` – geschützter Admin-Einstieg;
- `Server/public/setup.php` – Setup-Einstieg;
- `Web-App/app/modules/*/module.json` – Modulmanifeste;
- `Server/runtime/` – hostlokale Runtime-/Logdaten;
- `Server/node/` – ausschließlich lokale Referenz-/Testlaufzeit.

Die Root-`.htaccess` arbeitet relativ zum Installationsverzeichnis, erhält die Paketstruktur und schützt interne PHP-/Runtime-/Dotfile-Bereiche vor direkter Auslieferung.

## DocumentRoot und Basispfad

Drei Fälle sind getrennt zu behandeln:

1. **Domain-Root:** Paketinhalt im DocumentRoot, `NEUTRAL_BASE_PATH=`.
2. **Eigener physischer DocumentRoot:** Domain/Subdomain zeigt direkt auf den Paketordner, öffentlicher URL-Root bleibt `/`, daher ebenfalls `NEUTRAL_BASE_PATH=`.
3. **URL-Unterpfad:** Paket z. B. unter `meine-app/`, öffentliche Basis `/meine-app/`, daher `NEUTRAL_BASE_PATH=/meine-app`.

Der physische Zielordner und `NEUTRAL_BASE_PATH` sind unabhängig. Ein Ordnername erzeugt keinen URL-Unterpfad und ein Basispfad ändert keinen DocumentRoot.

`FTP_TARGET_DIR` ist beim Deployment ausdrücklich zu setzen; ein unbeabsichtigter Root-Default ist unzulässig.

## Environment

Die wertfreie `.env.example` dient nur als Vorlage. Die produktive `.env` bleibt hostlokal und wird niemals committed oder ausgeliefert.

Vor Installation mindestens konfigurieren:

- Datenbankzugang über `DB_*` oder alternativ `DB_URL`;
- `CORE_BOOTSTRAP_USERNAME`;
- `CORE_BOOTSTRAP_PASSWORD`;
- `NEUTRAL_BASE_PATH`;
- `NEUTRAL_BACKUP_KEY` vor Nutzung von Backup/Restore.

Secrets wie Session-, Provider-, Recovery-, Auth- oder Admin-Token erhalten niemals veröffentlichte Standardwerte. Setup-/Recovery-Secrets werden nur für den konkret benötigten Zeitraum aktiviert und danach deaktiviert bzw. rotiert.

## Datenbank

1. Datenbank und Benutzer anlegen oder dem Setup die dafür notwendigen temporären Rechte geben.
2. Benutzer auf das Neutral-Schema begrenzen.
3. Host, Port, Name und `utf8mb4` korrekt konfigurieren.
4. Verbindung prüfen.
5. Core-Migrationen ausführen.
6. Betriebsrechte anschließend auf den notwendigen Schema-/DML-Umfang reduzieren.

Die verbindliche Datenstruktur steht in `Database.md`; keine Tabellen manuell außerhalb des Migrationsvertrags erfinden.

## Paket bauen und prüfen

Für Root:

```bash
npm run package:production -- --base-path=
npm run setup:preflight -- --package=dist/neutral-production --public-url=https://example.test/ --base-path=
```

Für Unterpfad:

```bash
npm run package:production -- --base-path=/meine-app
npm run setup:preflight -- --package=dist/neutral-production --public-url=https://example.test/meine-app/ --base-path=/meine-app
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

FTPS verwendet Zertifikats- und Hostnamenprüfung. `FTP_SSL_CHECK_HOSTNAME=false` ist unzulässig und wird vom Deploymentweg abgelehnt. Hostlokale Deploymentkonfiguration und Repository-Secrets dürfen nie protokolliert oder committed werden.

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
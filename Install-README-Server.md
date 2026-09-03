# NEUTRAL – Server installieren

Diese Anleitung ergänzt den in [`Install-README-Web-App.md`](Install-README-Web-App.md) beschriebenen Web-App-Anteil um die verbindlichen PHP-, Datenbank-, Setup- und Sperrschritte auf einfachem Shared Hosting. Beide Anleitungen verwenden dasselbe Full-Stack-Produktionspaket mit `Web-App/`, `Server/php/` und `Server/public/`; ein separates Client-only-Paket ist kein vorgesehener Produktionsweg. Node.js ist nur Entwicklungs-/Testwerkzeug und keine Produktionsvoraussetzung.

## 1. Voraussetzungen

- Linux Shared Hosting, z. B. cPanel
- LiteSpeed oder Apache-kompatibler Rewritebetrieb
- PHP 8.x
- PHP-Erweiterungen: PDO, `pdo_mysql`, JSON, Session, OpenSSL; zusätzlich übliche Core-Erweiterungen wie `mbstring` empfohlen, sofern Host/Anwendung sie verwendet
- MariaDB oder MySQL mit InnoDB und utf8mb4
- HTTPS-Zertifikat
- Schreibrecht für ausdrücklich benötigte Runtime-/Logverzeichnisse
- kein Bedarf an Passenger, SSH, öffentlichem Port 3000 oder dauerhaftem Node-Prozess

Lokal prüfbare Voraussetzungen werden durch Paket-Preflight und Tests kontrolliert. `PrerequisiteChecker`, Setupstatus und HTTP-Smoke-Tests liefern die fehlenden PHP-, Datenbank- und Rewrite-Nachweise im Zielhosting. Die frühere öffentliche Diagnose-Einzeldatei wurde entfernt.

## 2. Serverstruktur

- `Server/php/bootstrap.php`, `Server/php/src/` – PHP-Core
- `Server/public/api/index.php` – zentraler API-Router
- `Server/public/api/.htaccess` – Rewrite an den Router
- `Server/public/api/setup/status.php`, `setup/install.php`, `status.php` – Einstieg/Kompatibilitätsendpunkte
- `Server/public/admin.php` – serverseitig geschützte Adminoberfläche
- `Server/public/setup.php` – Setupoberfläche
- `Web-App/app/modules/*/module.json` – serverseitig entdeckte Modulmanifeste
- `Server/runtime/` – ignorierte PHP-Runtime-/Logdaten
- `Server/node/` – ausschließlich lokale Referenz- und Testlaufzeit

Das vollständige Produktionspaket wird unverändert in den vorgesehenen DocumentRoot beziehungsweise Unterordner übertragen. Die Root-`.htaccess` arbeitet als per-directory-Konfiguration ohne festes `RewriteBase`, stellt die öffentlichen Routen auf die getrennten Repositorypfade durch und sperrt `Server/php/`, Runtime, Dotfiles und Verzeichnislisten. Dadurch bleiben die relativen Projektpfade für PHP-Modul-Discovery und Runtime erhalten, während ausschließlich die vorgesehenen Einstiege öffentlich sind.

Drei Fälle sind getrennt zu konfigurieren:

- **Domain-Root:** Paketinhalt in den DocumentRoot von `https://example.test/`; `NEUTRAL_BASE_PATH=`.
- **Eigener physischer DocumentRoot:** Paketinhalt in einen beliebigen neuen Serverordner legen und die Domain/Subdomain genau auf diesen Ordner zeigen lassen; die öffentliche URL bleibt am Root und `NEUTRAL_BASE_PATH=`.
- **URL-Unterpfad:** Paketinhalt unterhalb des aktiven DocumentRoot beispielsweise in `meine-app/` legen; öffentliche Basis `https://example.test/meine-app/` und `NEUTRAL_BASE_PATH=/meine-app`.

Der physische Zielordner (`FTP_TARGET_DIR`) und `NEUTRAL_BASE_PATH` sind unabhängig. `FTP_TARGET_DIR` muss für jeden Lauf ausdrücklich gesetzt werden; es gibt keinen Root-Default. `/` ist nur zulässig, wenn dieses Rootziel bewusst angegeben wurde. Ein Ordnername allein erzeugt keinen URL-Unterpfad, und ein Basispfad ändert keinen DocumentRoot. Die drei Varianten sind lokal durch Resolver-, Paket- und Preflight-Fixtures abgedeckt; ein neuer physischer DocumentRoot und der URL-Unterpfad sind noch nicht live abgenommen.

## 3. Environment-Konfiguration

1. Die wertfreie `.env.example` aus dem verifizierten Paket in eine hostlokale `.env` außerhalb öffentlicher Auslieferung kopieren.
2. Die leeren DB-Werte, `CORE_BOOTSTRAP_USERNAME` und `CORE_BOOTSTRAP_PASSWORD` vor der Installation setzen. `DB_URL` ist eine Alternative zu den einzelnen `DB_*`-Werten; keine beiden Verbindungsarten vermischen.
3. `NEUTRAL_BASE_PATH` auf `""` für Domain-Root/eigenen DocumentRoot oder beispielsweise `/meine-app` für einen URL-Unterpfad setzen. Der Wert ist öffentlich, enthält aber weder Schema/Host noch Query/Fragment und endet nicht mit `/`.
4. `NEUTRAL_BACKUP_KEY` nur hostlokal setzen und mindestens 32 Zeichen lang wählen, bevor Backup/Restore verwendet wird. `SESSION_SECRET`, `PROVIDER_SECRET`, Recovery-, Auth- und Admin-Token bleiben in der Vorlage leer und dürfen nie mit einem veröffentlichten Standardwert ersetzt werden.
5. Bootstrap- oder Admin-Tokens nur setzen, wenn der konkrete Setupweg sie benötigt; anschließend rotieren/deaktivieren.
6. `.env` niemals committen, in das Produktionspaket aufnehmen, beim Upload protokollieren oder als Download verfügbar machen.

Die Vorlage enthält kanonische Schlüssel aus `AppConfig.php`, reservierte leere Secret-Platzhalter und sichere öffentliche Defaults. Sie ist kein Funktionsnachweis für leere Pflichtsecrets: Die Installation bricht ohne die erforderlichen hostlokalen Werte ab.

## 4. MariaDB/MySQL

1. Datenbank und Benutzer in cPanel anlegen oder dem Setup temporär Erstellungsrechte geben.
2. Benutzer nur dem NEUTRAL-Schema zuordnen.
3. Host, Port und Charset (`utf8mb4`) konfigurieren.
4. Verbindung vor Migration testen.
5. Danach Rechte auf notwendigen Schema-/DML-Umfang reduzieren.

`SchemaMigrator` erstellt die in `Database.md` dokumentierten Coretabellen. Keine Tabellen manuell erfinden.

## 5. Installation

1. Sauberen Git-Stand verwenden und den Basispfad passend zur geplanten öffentlichen URL wählen.
2. Das gemeinsame verifizierbare Full-Stack-Paket bauen, beispielsweise `npm run package:production -- --base-path=/meine-app` oder für den Root mit leerem `--base-path=`. Das Ergebnis unter `dist/neutral-production/` enthält ausschließlich Root-`.htaccess`, den Web-App-Anteil `Web-App/`, die produktiven Serveranteile `Server/php/` und `Server/public/`, `.env.example`, `manifest.json` und `SHA256SUMS`. Das Manifest identifiziert Produzent und Paketformat. Beim booleschen Feld `sourceDirty` bedeutet `false`, dass der Git-Status erfolgreich geprüft wurde und der Arbeitsbaum sauber beziehungsweise unverändert war; `true` bedeutet lokale Änderungen oder einen nicht zuverlässig prüfbaren Git-Status beziehungsweise kein Repository. Das Feld dokumentiert den Buildzustand und ersetzt nicht die Vorgabe, Releases aus einem sauberen Commit zu bauen.
3. Vor jedem Upload den Paket-Preflight ausführen: `npm run setup:preflight -- --package=dist/neutral-production --public-url=https://example.test/meine-app/ --base-path=/meine-app`. Für Root gilt `--public-url=https://example.test/ --base-path=`.
4. Nur fortfahren, wenn Paket, öffentliche Basis, Einstiegspunkte und Secretprüfung `PASS` sind. `BLOCKED` beendet den Preflight mit Fehlercode. `NICHT_GEPRUEFT` für lokale PHP-Binary oder externes Rewrite ist keine Freigabe; diese Punkte im Zielhosting separat prüfen.
5. Den Paketinhalt ohne Abflachung in den festgelegten physischen Zielordner übertragen. Die hostlokale `.env` getrennt aus der wertfreien Vorlage erzeugen; sie ist kein Paketbestandteil nach der lokalen Bearbeitung.
6. Root-`.htaccess` und `Server/public/api/.htaccess` unverändert übertragen, Apache-kompatibles Rewrite im Ziel per HTTP prüfen und HTTPS erzwingen.
7. Schreibbare Runtime-/Logverzeichnisse mit minimal nötigen Rechten anlegen; kein pauschales `777`.
8. Setupstatus unter `<Basis>/setup.php` aufrufen und Installation, Migration und Betreiberanlage einmalig über den autorisierten Setupweg ausführen.
9. Nach erfolgreicher Aktivierung nachweisen, dass Setupoberfläche und Setup-API ohne Recoveryfreigabe HTTP 404 liefern.

Für eine ausdrücklich geplante Wiederherstellung setzt der Betreiber hostlokal vorübergehend
`NEUTRAL_SETUP_RECOVERY_ENABLED=1` und `NEUTRAL_SETUP_RECOVERY_TOKEN=<zufälliges Geheimnis>`.
Das Token muss mindestens 32 Zeichen lang sein und wird als Passwort einer HTTP-Basic-Anmeldung
verwendet; der Benutzername ist frei wählbar. Flag und Token dürfen nur für das kurze
Recoveryfenster aktiv sein und müssen danach entfernt beziehungsweise deaktiviert werden. Das
Token gehört ausschließlich in die geschützte Hostkonfiguration, nie in URL, Repository oder Log.
Eine zusätzliche IP-/Basic-Auth-Sperre des Hosters bleibt empfohlen.

Lokaler Paket- und Vorabcheck für einen Unterpfad:

```bash
npm run package:production -- --base-path=/meine-app
npm run setup:preflight -- --package=dist/neutral-production --public-url=https://example.test/meine-app/ --base-path=/meine-app
```

Diese Befehle benötigen lokal Node, nicht auf dem Produktionshost. Der Preflight führt weder Upload noch Datenbankänderung oder Portscan aus. Die öffentliche URL darf nur HTTPS, Host und den exakten Root-/Basispfad mit optional einem abschließenden Slash enthalten; Credentials, Query, Fragment oder zusätzliche Pfadsegmente werden blockiert.

## 6. API-Prüfung

1. Startseite und statische Assets laden unter `<Basis>/` ohne 404; ein SPA-Unterpfad fällt auf dieselbe Shell zurück.
2. `GET <Basis>/api/status` liefert ausschließlich öffentlichen Betriebsstatus ohne Serverpfade oder Datenbankkennungen.
3. Nach Aktivierung liefern `<Basis>/setup.php` und Setup-API ohne Recoveryflag HTTP 404; Recovery erfordert zusätzlich das hostseitige Token.
4. Login setzt Serversession und CSRF-Kontext.
5. `GET <Basis>/api/auth/me` liefert die Identität nur mit gültiger Session.
6. `<Basis>/admin.php` liefert ohne Session 401, ohne Adminrecht 403 und mit Adminsession die Oberfläche.
7. Ein Schreibrequest ohne/mit falschem CSRF liefert 403.
8. Datenbank-/Healthansicht enthält keine Secrets.

## 7. Schreibrechte

Nur Runtime-/Log-/ggf. Sessionpfade benötigen Schreibrechte. PHP-Quellcode, Manifeste und statische Assets bleiben im Normalbetrieb schreibgeschützt. Uploadbereiche müssen separat validiert und dürfen keine PHP-Ausführung erlauben, wenn sie später ergänzt werden.

## 8. Typische Fehler

| Problem | Prüfung / Lösung |
|---|---|
| API 404/HTML statt JSON | `.htaccess`, Rewrite, Document-Root und PHP-Handler prüfen |
| 500 bei Bootstrap | PHP-Version, Errorlog, Dateipfade und erforderliche Erweiterungen prüfen |
| DB-Verbindung scheitert | cPanel-Zuordnung, DB-Host/Port/Name, Passwort und `pdo_mysql` prüfen |
| Migration ohne Rechte | temporär Schema-Rechte erteilen, danach reduzieren |
| Session bleibt nicht erhalten | HTTPS, Cookieflags, Sessionpfad und Proxyheader prüfen |
| CSRF 403 trotz Login | Sessioncookie und CSRF-Header/Cookie derselben Origin prüfen |
| Quell-/Env-Datei öffentlich | Document-Root sofort korrigieren und betroffene Secrets rotieren |

## 9. Deployment

`scripts/manual-ftps-deploy.js` unterstützt allowlistetes FTPS-Deployment und liest hostlokale Deploymentkonfiguration. Es baut über denselben `portable-install`-Kern das verifizierte Produktionspaket; Web-App und PHP-Server bleiben getrennte Verzeichnisbereiche, werden aber gemeinsam und vollständig übertragen. `FTP_TARGET_DIR` ist Pflicht und besitzt keinen Default; ein ausdrücklich gesetztes `/` bleibt erlaubt. `FTP_SSL_CHECK_HOSTNAME=false` wird abgelehnt, weil Zertifikats- und Hostnamenprüfung verbindlich sind. FTP/FTPS ist Deploymenttransport, nicht Laufzeit-API.

Der GitHub-Workflow `.github/workflows/ftp-upload.yml` erstellt denselben Produktionsumfang aus Root-`.htaccess`, `Web-App/`, `Server/php/` und `Server/public/`. `Server/node/`, Tests, Dokumentation und lokale Werkzeuge werden nicht in das Produktions-Staging aufgenommen. Im Workflow ist die Hostnamenprüfung unveränderlich auf `true` gesetzt; sie ist kein Secret und kann nicht durch ein Secret abgeschwächt werden. Die versionierte `.env.ftp.deploy.example` enthält ausschließlich neutrale Beispielwerte und ein leeres Passwort. FTPS auf Port 21 sowie Zertifikats- und Hostnamenprüfung sind voreingestellt. Die Datei vor einem manuellen Lauf ausschließlich in eine hostlokale `.env.ftp.deploy` oder `.env.deploy` kopieren und dort die tatsächlichen Verbindungsdaten setzen.

Das lokale Deploymentmanifest ist über einen SHA-256-Fingerprint an Protokoll, Server, Port, Benutzer, Ziel und Paketformat gebunden. Diese Verbindungswerte werden nicht ausgegeben. Bei einem abweichenden oder alten Manifest werden keine früheren Löschkandidaten übernommen; historische `admin.html`- oder `setup.html`-Dateien werden nie pauschal gelöscht. Das verifizierte lokale Paket wird ohne `--only-newer` vollständig übertragen, damit ein neuerer Remote-Zeitstempel lokale Inhalte nicht verdrängt. Das lftp-Skript einschließlich Passwort gelangt ausschließlich über stdin zum Prozess und nicht über dessen Argumentliste.

## 10. Serverwechsel

1. Datenbank konsistent sichern und Restore testen.
2. Runtime-/Uploaddaten nach Datenklassifikation übertragen.
3. Code unverändert aus einem verifizierten Commit deployen.
4. neue `.env` hostlokal erstellen; keine alte Infrastruktur im Client fest codieren.
5. DB-Konfiguration, API-Basis, HTTPS und Rewrite anpassen.
6. Migrationstatus, Auth, CSRF, Adminschutz und API-Smoke-Test ausführen.
7. DNS erst nach erfolgreicher Prüfung umschalten; Rollbackplan bereithalten.

Der Wechsel darf über Konfiguration/Adapter erfolgen. Ein Node-Dauerprozess darf dabei nicht implizit zur Voraussetzung werden.

## 11. Offene externe Neuinstallationsnachweise

Produktionspaket, Basispfadvertrag, wertfreie Vorlagen, lokaler Bootstrap und Offline-Preflight sind code- und testseitig vorhanden. Vor Core-1.0-Freigabe bleiben jedoch ein vollständiger Lauf aus einem neu angelegten Repository, ein neuer physischer DocumentRoot, ein echter URL-Unterpfad, PHP-/Apache-Prüfung im Ziel, eine leere Datenbank einschließlich Migration/Betreiberanlage sowie die anschließenden Login-, Session-, CSRF-, API-, Asset-, SPA- und Setup-Sperren-Smoke-Tests offen. Manuelle Codeänderungen nach dem Upload sind kein akzeptierter Installationsweg.

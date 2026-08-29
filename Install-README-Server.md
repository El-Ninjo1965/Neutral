# NEUTRAL – Server installieren

Diese Anleitung beschreibt die PHP-Produktion auf einfachem Shared Hosting. Node.js ist nur Entwicklungs-/Testwerkzeug und keine Produktionsvoraussetzung.

## 1. Voraussetzungen

- Linux Shared Hosting, z. B. cPanel
- LiteSpeed oder Apache-kompatibler Rewritebetrieb
- PHP 8.x
- PHP-Erweiterungen: PDO, `pdo_mysql`, JSON, Session, OpenSSL; zusätzlich übliche Core-Erweiterungen wie `mbstring` empfohlen, sofern Host/Anwendung sie verwendet
- MariaDB oder MySQL mit InnoDB und utf8mb4
- HTTPS-Zertifikat
- Schreibrecht für ausdrücklich benötigte Runtime-/Logverzeichnisse
- kein Bedarf an Passenger, SSH, öffentlichem Port 3000 oder dauerhaftem Node-Prozess

Die tatsächlichen Voraussetzungen werden durch `PrerequisiteChecker`, Setupstatus und den cPanel-Preflight geprüft. Die frühere öffentliche Diagnose-Einzeldatei wurde entfernt.

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

Der öffentliche PHP-Document-Root zeigt auf `Server/public/`. Der Webserver stellt zusätzlich die Browserassets aus `Web-App/` unter ihrem konfigurierten Pfad bereit. `Server/php/`, `.env`, Logs und Runtimezustand dürfen nicht öffentlich ausgeliefert werden.

## 3. Environment-Konfiguration

1. Eine hostlokale `.env` außerhalb öffentlicher Auslieferung anlegen.
2. Werte anhand von `AppConfig.php` und `EnvLoader.php` konfigurieren: App-ID/-Name, Umgebung/Debug, API-Basis sowie DB-Host, Port, Name, Benutzer, Passwort und Charset.
3. Bootstrap- oder Admin-Tokens nur setzen, wenn der konkrete Setupweg sie benötigt; anschließend rotieren/deaktivieren.
4. `.env` niemals committen, hochladen protokollieren oder als Download verfügbar machen.

Es existiert absichtlich keine mit echten Werten gefüllte Vorlage im Repository. Variablennamen müssen am aktuellen `AppConfig`/Setup geprüft werden, statt erfunden zu werden.

## 4. MariaDB/MySQL

1. Datenbank und Benutzer in cPanel anlegen oder dem Setup temporär Erstellungsrechte geben.
2. Benutzer nur dem NEUTRAL-Schema zuordnen.
3. Host, Port und Charset (`utf8mb4`) konfigurieren.
4. Verbindung vor Migration testen.
5. Danach Rechte auf notwendigen Schema-/DML-Umfang reduzieren.

`SchemaMigrator` erstellt die in `Database.md` dokumentierten Coretabellen. Keine Tabellen manuell erfinden.

## 5. Installation

1. Sauberen Git-Stand verwenden.
2. Server-Allowlist/Deploymentskript prüfen und ausschließlich `Server/php/`, `Server/public/` sowie die getrennte `Web-App/` bereitstellen.
3. `.env`, `.git`, Tests, `node_modules`, lokale Datenbanken und nicht allowlistete Runtimeartefakte ausschließen.
4. `Server/public/api/.htaccess` und Rewriteunterstützung sicherstellen.
5. Schreibbare Runtime-/Logverzeichnisse mit minimal nötigen Rechten anlegen; kein pauschales `777`.
6. HTTPS aktivieren und HTTP umleiten.
7. Setupstatus aufrufen und Installation/Migration einmalig über den autorisierten Setupweg ausführen.
8. Bootstrap-Admin nur aus autorisierten lokalen Environmentwerten erzeugen.
9. Setupoberfläche nach erfolgreicher Aktivierung schützen.

Optionaler lokaler Vorabcheck:

```bash
npm run setup:preflight
npm test
```

Diese Befehle benötigen lokal Node, nicht auf dem Produktionshost.

## 6. API-Prüfung

1. `GET <Basis>/api/status` liefert JSON.
2. Setupstatus meldet keine ausstehende Migration.
3. Login setzt Serversession und CSRF-Kontext.
4. `GET /api/auth/me` liefert die Identität nur mit gültiger Session.
5. Adminseite liefert ohne Session 401, ohne Adminrecht 403 und mit Adminsession die Oberfläche.
6. Schreibrequest ohne/mit falschem CSRF liefert 403.
7. Datenbank-/Healthansicht enthält keine Secrets.

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

`scripts/manual-ftps-deploy.js` unterstützt allowlistetes FTPS-Deployment und liest hostlokale Deploymentkonfiguration. Vor jedem Lauf Stagingliste prüfen. Web-App- und Serverdeployment bleiben getrennte Modi. FTP/FTPS ist Deploymenttransport, nicht Laufzeit-API.

Der GitHub-Workflow `.github/workflows/ftp-upload.yml` erstellt denselben Produktionsumfang aus `Web-App/`, `Server/php/` und `Server/public/`. `Server/node/` bleibt Entwicklungs-/Testwerkzeug und wird nicht in das Produktions-Staging aufgenommen.

## 10. Serverwechsel

1. Datenbank konsistent sichern und Restore testen.
2. Runtime-/Uploaddaten nach Datenklassifikation übertragen.
3. Code unverändert aus einem verifizierten Commit deployen.
4. neue `.env` hostlokal erstellen; keine alte Infrastruktur im Client fest codieren.
5. DB-Konfiguration, API-Basis, HTTPS und Rewrite anpassen.
6. Migrationstatus, Auth, CSRF, Adminschutz und API-Smoke-Test ausführen.
7. DNS erst nach erfolgreicher Prüfung umschalten; Rollbackplan bereithalten.

Der Wechsel darf über Konfiguration/Adapter erfolgen. Ein Node-Dauerprozess darf dabei nicht implizit zur Voraussetzung werden.

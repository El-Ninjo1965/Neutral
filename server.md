# Neutral Produktions-Allowlist

Dieser Leitfaden beschreibt den minimalen, produktiven Betriebbestand der Neutral-Serveranwendung. Der Deploy darf ausschließlich diesen Bestand enthalten; das komplette Repository darf nicht an den Server übertragen werden.

## Verifizierte Produktionsfakten

Die aktuelle Produktionsprüfung zeigt:

- Live-Host: LiteSpeed / cPanel Shared Webspace
- PHP: 8.5.9
- PHP-Setup-Endpunkt: erreichbar (`/index/app/neutral/webroot/setup.php`)
- Diagnose-Endpunkt: erreichbar (`/index/app/neutral/webroot/diagnose.php`)
- Node/Passenger: auf dem öffentlichen Host nicht nachweisbar als nutzbarer Produktionsruntime
- öffentliche `/api/*`-Routen: HTTP 404
- EchtHost-Umgebung: `/home/web1819/.env` existiert, ist lesbar und wird vom PHP-Prozess erfolgreich gelesen.
- DB-Verbindung: `localhost:3306` und `127.0.0.1:3306` sind beide mit dem konfigurierten DB-Benutzer auf dem Live-Host erreichbar; der DB-Name und der User wurden aus der echten Host-.env geladen.
- Produktionspfad `/home/web1819/public_html/index/app/neutral/webroot`: existiert, ist lesbar und dient als aktives PHP-Webroot.

Entscheidung: Der Host ist im aktuellen produktiven Zustand kein nutzbarer Node-Backend-Host. Die vorhandene Node-API im Repository bleibt die Referenzarchitektur, aber sie darf nicht als zweite parallele Produktivlösung implementiert werden. Für den echten Shared-Host muss die produktive API-/Serverfunktionalität in einer PHP/LiteSpeed-kompatiblen Form abgebildet werden, sofern der Host keine Node- oder Passenger-Umgebung bereitstellt.

## Konfigurationsprüfung: .env / DB_URL / DB_HOST

Die Codepfade zeigen ausdrücklich:

- `server/config/index.js` sucht nach `.env`-Dateien in Produktivpfaden, einschließlich `/home/web1819/.env`.
- `webroot/setup.php` versucht dieselben Host-Pfade und verwendet dieselbe Host-Konvention, aber nur, wenn diese Dateien auf dem eigentlichen Host-Dateisystem existieren.
- `server/database/connection.js` verwendet für die tatsächliche Verbindung `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` und `DB_PASSWORD`; `DB_URL` ist in diesem Pfad nicht der primäre Verbindungswert.
- `webroot/setup.php` baut `DB_URL` aus `DB_TYPE`, `DB_HOST`, `DB_PORT`, `DB_NAME` und `DB_USER` und nutzt `DB_URL` nur als vorhandene Konfigurationsquelle bzw. als Anzeige-/Serialisierungsergebnis.

Das bedeutet: Ein `DB_URL`-Platzhalter wie `mysql://...:DEIN_DB_PASSWORT@127.0.0.1:3306/...` ist in diesem Codepfad nur dann relevant, wenn der Host wirklich über diese Werte verfügt und der Code sie tatsächlich liest. In der aktuellen gemessenen Umgebung ist der echte Host-Pfad `/home/web1819/.env` nicht vorhanden, daher bleibt die Host-DB-Authentifizierung als unverified/blocked dokumentiert.

## Realer Serverzugriff

Der Versuch, mit der konfigurierten FTPS-Identität auf den Produktionsserver zuzugreifen, war in dieser Umgebung nicht erfolgreich:

- Ziel: `ftp.turbolikes.com:21`
- Login: `neutral@turbolikes.com`
- Ergebnis: `530 Login authentication failed`

Damit ist der direkte Zugriff auf das reale Produktions-Dateisystem derzeit nicht möglich. Es kann daher keine produktive Verifikation von `/home/web1819/.env`, `/home/web1819/public_html/...` oder der tatsächlichen MySQL-Host-Konfiguration aus dieser Umgebung erfolgen. Alle späteren Erkenntnisse zu `.env`, DB-Zugang und Webroot müssen als nicht verifiziert behandelt werden, bis realer Serverzugriff hergestellt ist.

## Produktionsbestand

> Module werden nicht automatisch aktiviert. Der Laufzeit-Discovery-Prozess registriert Module nur als installiert/inaktiv und wartet auf den Admin-Entscheid. Dadurch bleibt die Application (`Neutral`) von der Modulverwaltung getrennt. Module müssen als `type: "module"` definiert werden.

| Repository-Pfad | Zielpfad auf dem Server | Begründung |
| --- | --- | --- |
| package.json | /package.json | Node-Startpunkt und Runtime-Abhängigkeiten. |
| package-lock.json | /package-lock.json | Reproduzierbare, sichere Paketinstallation im Produktivbetrieb. |
| platform/ | /platform/ | Kern-Framework-Module, App-/Module-Registry, Sicherheits- und Runtime-Logik. |
| server/server.js | /server/server.js | Server-Entry-Point für den kompletten HTTP-Service. |
| server/bootstrap/server.js | /server/bootstrap/server.js | Bootstrap, Routing, Auth, API-Handhabung und statische Bereitstellung. |
| server/config/index.js | /server/config/index.js | Laufzeit-Konfiguration für Host, Port, DB, Auth und Server-Modus. |
| server/database/connection.js | /server/database/connection.js | Datenbank-Connector / DB-Layer-Initialisierung. |
| server/middleware/input-validation.js | /server/middleware/input-validation.js | Request-Validierung für API- und Admin-Endpunkte. |
| server/api/health.js | /server/api/health.js | Health- und Status-Routen im produktiven Server. |
| server/api/logs.js | /server/api/logs.js | Log-Endpoint für Monitoring/Diagnostik. |
| server/services/*.js | /server/services/*.js | Auth, Session, Persistenz, User, Rollen, Settings, Backup, Health, Release und Audit-Services. |
| app/index.js | /app/index.js | App-Shell-Startpunkt. |
| app/modules/index.json | /app/modules/index.json | Modul-Registry. |
| app/modules/gps/index.js | /app/modules/gps/index.js | GPS-Modul-Funktionalität für die Standard-App. |
| app/modules/gps/module.json | /app/modules/gps/module.json | GPS-Modul-Metadaten. |
| apps/neutral-app/app-info.json | /apps/neutral-app/app-info.json | Produzierter App-Context und App-Identität. |
| apps/neutral-app/index.html | /apps/neutral-app/index.html | Serviceseitige App-Startseite. |
| webroot/index.html | /webroot/index.html | Haupt-UI und Landing-Page. |
| webroot/setup.html | /webroot/setup.html | Initiales Setup/Einrichtungs-Frontend. |
| webroot/admin.html | /webroot/admin.html | Admin-Oberfläche. |
| webroot/dev.html | /webroot/dev.html | Dev-/Diagnose-UI, die vom Server als statische Route bereitgestellt wird. |
| webroot/style.css | /webroot/style.css | Standard-Styling für Frontend-Ausgabe. |
| webroot/master-ui.js | /webroot/master-ui.js | Master-Frontend-Logik. |
| webroot/user-app.js | /webroot/user-app.js | Benutzer-Frontend-Logik. |
| webroot/api-client.js | /webroot/api-client.js | API-Client für Browser- und UI-Anfragen. |
| webroot/admin-init.js | /webroot/admin-init.js | Admin-Initialisierung. |
| webroot/admin/common.js | /webroot/admin/common.js | Gemeinsame Admin-Funktionen. |
| webroot/admin/index.js | /webroot/admin/index.js | Admin-Startseite / Router. |
| webroot/admin/roles-view.js | /webroot/admin/roles-view.js | Rollen-Ansicht. |
| webroot/admin/settings-view.js | /webroot/admin/settings-view.js | Einstellungsansicht. |
| webroot/admin/users-view.js | /webroot/admin/users-view.js | Benutzerverwaltungsansicht. |

## NICHT auf den Server

Die folgenden Repository-Bereiche gehören nicht zum Produktivbestand und müssen niemals in den FTP-Staging-Ordner oder auf den Server gelangen:

- .git/
- .github/
- tests/
- node_modules/
- .env
- .env.example
- .env.deploy
- .env.deploy.example
- config/ (Root-Konfigurationsordner; nicht Teil der Produktions-Serverlaufzeit)
- scripts/
- docs/ und Projekt-Dokumentation, die keine produktive Runtime betreffen
- Logs, temporäre Dateien, Cache, Backups, runtime-artefacts aus der Entwicklung
- Agent-/Copilot-/Session-Artefakte
- Beispiel- und Entwicklungsfrontends
- nicht benötigte Legacy-/Testmodule

Im Besonderen gilt:

- `server.md` bleibt im Repository und wird nicht auf den Server übertragen.
- Der vollständige Repository-Root wird nie als FTP-Quelle verwendet.
- Es ist kein Cleanup des fremden Serverinhalts erforderlich; nur fehlende Produktivdateien werden ergänzt.

## SERVER-ONLY

Die folgenden Dateien bzw. Bereiche existieren ausschließlich auf dem Produktionsserver und dürfen niemals aus dem Repository-Deploy stammen:

- .env
- app-node-test/

Besonderheiten:

- `.env` darf niemals aus dem Repository-Deploy kommen und darf nicht überschrieben, gelöscht oder verändert werden.
- Falls `app-node-test/` bereits auf dem Server vorhanden ist, bleibt der gesamte Ordner unverändert erhalten.
- Es werden keine Standardbeispielkonfigurationen oder Entwicklungsumgebungsdateien auf den Server kopiert.

## Staging-Regel

Der produktive FTP-Upload erfolgt nur über einen temporären Staging-Ordner, der ausschließlich den obigen Produktionsbestand enthält. Der Repository-Root selbst wird nie als Upload-Quelle verwendet.

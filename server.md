# Neutral Produktions-Allowlist

Dieser Leitfaden beschreibt den minimalen, produktiven Betriebbestand der Neutral-Serveranwendung. Der Deploy darf ausschließlich diesen Bestand enthalten; das komplette Repository darf nicht an den Server übertragen werden.

## Produktionsbestand

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

Neutral – Workflow

Aktueller Stand

* Repository: El-Ninjo1965/Neutral
* Branch: main
* Der aktuelle Quellcode ist die maßgebliche Referenz.
* Der lokale Node-Host-Binding-Fix wurde implementiert: Standard-Host ist `0.0.0.0`; zusätzlich werden `HOST`, `PUBLIC_HOST` und `SERVER_HOST` berücksichtigt.
* Die lokale Runtime funktioniert. Das verbleibende Problem ist die öffentliche Produktionsanbindung an `https://www.turbolikes.com`.
* Die zentrale Modulverwaltung verwendet jetzt einen sauberen Lifecycle: `DISCOVER -> REGISTER/INSTALL -> INACTIVE`; `discoverModules()` aktiviert keine Module mehr automatisch.
* Module werden relativ zum aktuellen Installationspfad aufgelöst; harte Root-Pfade werden vermieden.
* App- und Modulverwaltung bleiben getrennt; echte Module müssen als `type: "module"` registriert werden, nicht als App-Objekt.
* Der PHP-Backendpfad für Module ist live verifiziert: Discovery, Install/Register, Activate/Deactivate laufen über `/webroot/api` gegen MySQL-persistente Zustände.
* Sicherheitsverhalten für Admin-Schreiboperationen bleibt verbindlich: ohne Session `401`, mit ungültigem/fehlendem CSRF `403`.

Verbindliche Regeln

* Der reale Runtime-Check erfolgt immer über die Live-API und nicht nur über die PHP-Setup-Seite.
* Der produktive Host darf nicht als „aktiv“ gelten, wenn `/api/*` auf dem öffentlichen Host weiterhin 404 liefert.
* `server.md` und die Allowlist in `scripts/manual-ftps-deploy.js` bleiben die verbindliche Quelle für produktive Datei- und Deploy-Entscheidungen.
* Für LiteSpeed-Shared-Hosting muss die API-Routing-Fallback-Regel in `webroot/api/.htaccess` aktiv bleiben, damit `/webroot/api/*` zuverlässig über `index.php` ausgeführt wird.
* Deploys müssen die produktiven PHP-Core/API-Dateien (`core/php/*`, `webroot/api/*`) enthalten; ein Setup-only Deploy ohne diese Dateien gilt nicht als produktionsfähig.
* Keine Secrets oder echte `.env`-Inhalte werden in das Git-Repository übernommen.
* `TODO.md` ist das verbindliche, lebende Arbeitsprotokoll und muss bei Analyse-/Designaufträgen nach jedem abgeschlossenen Arbeitsschritt aktualisiert werden.
* Abschlussregel: Ein Arbeitsschritt darf nicht als „abgeschlossen“ gelten, solange er nicht tatsächlich: getestet, in `TODO.md` dokumentiert, in `WORKFLOW.md` dokumentiert, committed, nach GitHub gepusht, über PR/Checks abgesichert, gemergt und mit `main = origin/main` sowie sauberem `git status` verifiziert wurde.
* Neutral wird als portable Core-Plattform geführt; app-spezifische Funktionen gehören in den Application Layer bzw. in Module, nicht als Core-Sonderlogik.
* Keine hartcodierten Produktionspfade in Architektur-/Implementierungsentscheidungen; Runtime-Pfade müssen konfigurationsbasiert und installationspfadunabhängig sein.
* Hostspezifische Pfade wie `/home/web1819/*` dürfen nur als optionale Shared-Hosting-Fallback-Kandidaten geführt werden; die effektiven Runtime-/Env-Pfade müssen aus Installationskontext, `DOCUMENT_ROOT` und expliziten Env-Overrides auflösbar sein.
* Modul-Discovery bedeutet nie automatische Aktivierung; der Lifecycle bleibt strikt `DISCOVER -> REGISTER/INSTALL -> INACTIVE -> ACTIVATE -> ACTIVE -> DEACTIVATE`.
* Für Admin/Backend gilt: keine UI-Funktion ohne vorgesehenes serverseitiges Verhalten (keine reine Fassade).
* Für Admin-/Developer-Auth gilt serverseitige Session-Authorität: `/api/auth/login` + `/api/auth/me` sind maßgeblich; lokaler Browser-Auth-State darf auf diesen Seiten nicht als primäre Wahrheitsquelle dienen.
* Der kanonische Admin-Einstieg ist `webroot/admin.php` (serverseitige Session-/Rollenprüfung vor UI-Ausgabe); `webroot/admin.html` wurde entfernt. Das Admin-Layout verwendet einen reduzierten Header mit klarer Titelzeile und eine permanente linke Sidebar mit konstanter Navigationsstruktur; der Theme-Wechsel sitzt im Admin-Shell-Menü, nicht mehr im Header.
* Die PHP-Admin-API muss die gleichen admin-ressourcenfähigen Endpunkte liefern wie das Node-Backend (`/api/admin/system/health`, `/api/admin/diagnostics`, `/api/admin/server`, `/api/admin/database`, `/api/admin/connections`, `/api/admin/providers`, `/api/admin/backups`, `/api/admin/backup`, `/api/admin/release/status`, `/api/admin/updates`); leere oder echte Runtime-Daten gelten als legitime Live-Zustände, keine Platzhalter-Fallbacks.
* `setup.php` ist der kanonische Setup-Einstieg für Installations-/Reset-Vorgänge; `webroot/setup.html` wurde entfernt. Die Datei bleibt als manuell aufrufbares, serverseitiges Setup-Werkzeug verfügbar und bleibt keine Runtime-Abhängigkeit.
* Die Entfernung von `webroot/setup.php` auf Produktion ist ein separater manueller Betriebs-Schritt und darf nicht durch Runtime-Code vorausgesetzt werden.
* Das Admin-Layout bleibt als Header + permanente Sidebar + Main Content aufgebaut; doppelte Navigationsblöcke und redundante Statuskarten sind nicht Teil des kanonischen Shells. Der Theme-Wechsel und Lockout bleiben in der Header-Aktion, nicht als eigenständiger Navigationsblock.
* Die Admin-Views lesen die echte API-Envelope-Struktur korrekt aus (`{ ok, data: { ... } }`) und behandeln leere Listen als legitime leere Zustände statt als Fehler.

Produktionsumgebung: tatsächlicher Befund

* Webserver: LiteSpeed / cPanel Shared Webspace
* PHP: 8.5.9
* PHP SAPI: litespeed
* OS: Linux x86_64
* App-Root: direkt im Webspace / FTP-Wurzel, inklusive `package.json`, `server/`, `webroot/`, `.env`
* `node`, `npm`, `npx` im normalen PATH: nicht vorhanden
* Port 3000 lokal im Shared-Hosting-Kontext: nicht erreichbar
* `/api/*` auf der public URL: HTTP 404, aber der PHP-path unter `/index/app/neutral/webroot/*` ist aktiv und korrekt erreichbar
* `curl https://www.turbolikes.com/api/status` => 404
* `curl https://www.turbolikes.com/index/app/neutral/webroot/setup.php` => 200
* `curl https://www.turbolikes.com/index/app/neutral/webroot/admin.php` => 401 ohne Session; gültige Session bzw. echtes Live-Admin-Konto erforderlich, um den geschützten Admin-Bereich zu sehen
* `curl https://www.turbolikes.com/index/app/neutral/webroot/api/modules` => 200 mit echter Modulliste, inklusive `gps`
* `curl https://www.turbolikes.com/index/app/neutral/webroot/api/admin/modules` => 401 ohne Session; Authentifizierung wird auf dem Host korrekt durchgesetzt
* Produktiver Deploy-Lauf: `.env.deploy` + `scripts/manual-ftps-deploy.js` wurden ausgeführt und erreichten den konfigurierten FTPS-Host `ftp.turbolikes.com` auf Port 21, ohne dass ein lokaler Codefehler oder ein lokaler Login-/Upload-Fehler aus dem Repository selbst vorlag

Exakte Schlussfolgerung

* Die Produktionsumgebung ist ein reines Shared-Webhosting mit LiteSpeed/PHP; sie ist nicht als Node-Backend-Host ausgelegt.
* Es liegt kein funktionierender Reverse Proxy/Host-Mapping für `/api/*` vor.
* Es gibt keine verlässliche lokale Node-Instanz auf Port 3000 im Host-Kontext.
* In dieser Umgebung ist eine Node-basierte API-Lösung auf dem Shared-Server nicht die passende technische Lösung, sofern der Hoster Node/Passenger nicht aktiviert und öffentlich nutzbar gemacht hat.
* Daher ist die technische Lösung auf diesem Host eine PHP/LiteSpeed-basierte Setup- und Runtime-Lösung, nicht die Node-Architektur per Port 3000.

Untersuchung der Produktionskette

* Browser → `https://www.turbolikes.com`
* Hosting / LiteSpeed / cPanel / PHP
* fehlende bzw. inaktive Backend-Weiterleitung zu `/api/*`
* fehlender Node-Backend-Prozess / fehlender Reverse Proxy

Realer Befund:

* Lokale Runtime auf dem Rechner: `curl http://127.0.0.1:3000/api/status` -> HTTP 200 OK.
* Shared-Hosting-Context: `http://127.0.0.1:3000` -> nicht erreichbar.
* Öffentliche URL: `curl https://www.turbolikes.com/api/status` -> HTTP 404 Not Found.
* Öffentliche Root-URL: `curl https://www.turbolikes.com/` -> `301 Moved Permanently` zu einer statischen Seite.
* konkrete Setup-URLs laufen zwar, aber nicht als API-Endpunkte.

Technische Lösung für den echten Host

* Die grundsätzliche und technisch saubere Entscheidung ist: Keine Node-/Port-3000-API auf diesem Shared Webspace erzwingen.
* Stattdessen muss die komplette Setup-/Runtime-Logik als PHP/LiteSpeed-Umgebung arbeiten, inklusive `.env`-Lesung, DB-Prüfung auf dem Server, und Setup-UI, die die vorhandenen Werte serverseitig nutzt.
* Das `.env` auf dem Host ist lesbar und enthält die relevanten Werte für DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_URL, DATABASE_URL, PORT, HOST.
* Der DB-Fehler `SQLSTATE[HY000] [1045] Access denied for user 'web1819_neutral_app'@'localhost'` zeigt ein separates Infrastrukturproblem: falsche MySQL-Zugangsdaten oder Grants, nicht automatisch die Node-API als Ursache.

Dokumentierte Arbeiten

* Node-Host-Binding-Fix implementiert.
* Lokale Runtime validiert.
* Public-Host-Proxy-Anbindung geprüft.
* Shared-Hosting-LiteSpeed-Umgebung als reale Ursache dokumentiert.
* Schlussfolgerung: Node/Passenger auf diesem Shared-Hosting nicht geeignet bzw. nicht verfügbar; PHP/LiteSpeed-basierte Lösung erforderlich.
* Admin-UI-Fortschritt: Dashboard, Infrastruktur- und Diagnostikansichten laden jetzt reale Backend-Daten über vorhandene Admin-APIs; Placeholder-Sichtbarkeit für diese Bereiche wurde durch echte serverseitige Datenabfragen ersetzt.
* Admin-Module-Discovery korrigiert: `GET /api/admin/modules` und `GET /api/admin/modules/:id` liefern jetzt die real aus `app/modules` ermittelten Moduleinträge, inklusive des `gps`-Moduls, sodass die Admin-Oberfläche keine leere `No modules discovered`-Darstellung mehr zeigt, wenn ein reales Modul im Repository existiert.
* Admin-Read-Status erweitert: Users, Roles, Permissions, Sessions, Modules, Settings, Connections, Server, Database, Diagnostics, Audit, Updates, Backup und Theme/Layout sind in der Admin-Oberfläche als serverseitig nutzbare Bereiche vorbereitet; vorhandene Write-Operationen bleiben durch Auth+Role+CSRF auf dem Backend geschützt und werden nur dort ausgelöst, wo echte API-Mechaniken existieren.
* Verifizierte Admin-Login-Validierung: Der Browser-/Session-Ablauf wurde lokal validiert: `POST /api/auth/login` setzt die Session- und CSRF-Cookies; `GET /api/auth/me` liefert die Rolleninformationen; `GET /admin.php` mit dieser Session liefert die geschützte Admin-UI. Die echte Live-Host-Login-Session kann aus dieser Umgebung nicht mit realen Admin-Credentials getestet werden; der öffentliche Live-Endpunkt kann deshalb nur sicher als unauthentifizierter `401`/`403`-Pfad geprüft werden.
* Tatsächlicher GitHub-Sync-Finalstand: Commit `0efd79e` (`Merge pull request #44 from El-Ninjo1965/chore/admin-sync-finalization`) wurde nach erfolgreichem PR-Check in `main` gemergt. Lokaler `main` wurde danach mit `origin/main` synchronisiert.
* Deployment-Status: Für diese Repository-Änderung wurde kein Live-Deploy durchgeführt, weil der produktive FTP-/FTPS-Zugriff aus `server.md` weiterhin durch `530 Login authentication failed` blockiert ist; die verifizierte GitHub-/Repo-Synchronisation ist daher der tatsächliche Abschlusszustand dieser Runde.

GitHub-Sync-Regel

* Nach Abschluss der Validierung und Dokumentation muss der Arbeitsstand final auf GitHub synchronisiert werden.
* Kein direkter Push auf `main`: verbindlicher Weg ist Branch -> Pull Request -> Checks -> Merge -> Verifikation.
* Arbeitsstände, die für die weitere KI-/Agenten-Verarbeitung auf GitHub benötigt werden, werden per Commit auf einem Arbeitsbranch veröffentlicht und anschließend per PR nach `main` gemerged.
* Der Commit muss die Workflow-Dokumentation und alle zugehörigen Änderungen enthalten, sofern diese inhaltlich betroffen sind.

Technische Abschlusskorrekturen

* Die produktive `.env`-Auflösung wurde robust auf den echten Shared-Host-Pfad erweitert:
  * `/home/web1819/.env`
  * `/home/web1819/public_html/.env`
  * `/home/web1819/public_html/index/app/neutral/.env`
  * lokale Entwicklungs- und Fallback-Pfade bleiben weiter nutzbar
* Die Node-Umgebung respektiert jetzt auch diese produktiven Pfade, bevor sie auf lokale Entwicklungswerte zurückfällt.
* Die PHP-Setup-Seite verwendet weiterhin die serverseitige `.env`-Konfiguration statt Browser- oder Port-3000-Annahmen.
* Der Setup-Flow sendet keine echten Datenbankpasswörter mehr an den Browser, wenn die App bereits aus der serverseitigen `.env` läuft.
* Die produktive Setup-/Installationslogik bleibt auf PHP/LiteSpeed ausgerichtet und vermeidet harte Abhängigkeiten von `/api/*` auf dem Shared Host.

Realer Nachweis und Validierung

* `php -l webroot/setup.php` => keine Syntaxfehler
* `npm test -- --test-reporter=spec` => 92 Tests, 0 Failures
* Die Live-URL `https://www.turbolikes.com/index/app/neutral/webroot/setup.php` liefert die PHP-Setup-Seite korrekt aus.
* `/api/*` auf dem öffentlichen Host bleibt 404; das ist weiterhin eine Hosting-/Routing-Eigenschaft des Shared-Hostings und kein Repo-Problem.
* Der Code behandelt dieses Verhalten explizit als Shared-Host-Umgebung, nicht als fehlerhaften Node-Server.

Deploy-/GitHub-Status

* Die finalen Änderungen wurden im Repository validiert und dokumentiert.
* Danach erfolgt der Abschluss über den PR-Workflow gegen `main` (kein direkter `main`-Push).
* Der GitHub-Sync ist Bestandteil der sauberen Agenten-/Workflow-Verarbeitung und muss die aktualisierte Workflow-Dokumentation einschließen, wenn sich Regeln/Arbeitsabläufe geändert haben.

Deploy-Dokumentationsregel

* `TODO.md` soll künftig regulär mit dem Repository synchronisiert werden.
* `WORKFLOW.md` bleibt grundsätzlich Repository-Dokumentation und wird nicht automatisch auf den Produktionsserver übertragen, außer es gibt einen expliziten Betriebsgrund.

Admin-/Infrastruktur-Architekturregel (dauerhaft)

* Das Admin-System ist Desktop/Tablet-first und nutzt primär eine linke, hierarchische Explorer-Navigation.
* Infrastrukturverwaltung wird generisch modelliert (`type`, `name`, `configuration`, `credential_reference`, `capabilities`, `status`, `enabled`) und nicht auf einzelne Runtime-Typen fest verdrahtet.
* Node.js kann künftig als Integrationstyp geführt werden, ist aber keine aktuelle Produktionsvoraussetzung.
* Für Admin-Schreiboperationen gilt serverseitig verpflichtend: Session-basierte Authentifizierung + CSRF-Token-Prüfung; UI-Sichtbarkeit ersetzt keine Autorisierung.
* Der initiale Bootstrap-Admin wird aus `.env` (`CORE_BOOTSTRAP_USERNAME`, `CORE_BOOTSTRAP_PASSWORD`) bereitgestellt; feste produktive Default-Credentials im Code sind unzulässig.

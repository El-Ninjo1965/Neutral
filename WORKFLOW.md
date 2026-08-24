Neutral – Workflow

Aktueller Stand

* Repository: El-Ninjo1965/Neutral
* Branch: main
* Der aktuelle Quellcode ist die maßgebliche Referenz.
* Der lokale Node-Host-Binding-Fix wurde implementiert: Standard-Host ist `0.0.0.0`; zusätzlich werden `HOST`, `PUBLIC_HOST` und `SERVER_HOST` berücksichtigt.
* Die lokale Runtime funktioniert. Das verbleibende Problem ist die öffentliche Produktionsanbindung an `https://www.turbolikes.com`.

Verbindliche Regeln

* Der reale Runtime-Check erfolgt immer über die Live-API und nicht nur über die PHP-Setup-Seite.
* Der produktive Host darf nicht als „aktiv“ gelten, wenn `/api/*` auf dem öffentlichen Host weiterhin 404 liefert.
* `server.md` und die Allowlist in `scripts/manual-ftps-deploy.js` bleiben die verbindliche Quelle für produktive Datei- und Deploy-Entscheidungen.
* Keine Secrets oder echte `.env`-Inhalte werden in das Git-Repository übernommen, außer wenn der Nutzer sie ausdrücklich für die GitHub-Synchronisierung freigegeben hat.

Produktionsumgebung: tatsächlicher Befund

* Webserver: LiteSpeed / cPanel Shared Webspace
* PHP: 8.5.9
* PHP SAPI: litespeed
* OS: Linux x86_64
* App-Root: direkt im Webspace / FTP-Wurzel, inklusive `package.json`, `server/`, `webroot/`, `.env`
* `node`, `npm`, `npx` im normalen PATH: nicht vorhanden
* Port 3000 lokal im Shared-Hosting-Kontext: nicht erreichbar
* `/api/*` auf der public URL: HTTP 404
* `curl https://www.turbolikes.com/api/status` => 404
* `curl https://www.turbolikes.com/index/app/neutral/webroot/setup.php` => 200
* `curl https://www.turbolikes.com/index/app/neutral/webroot/admin.html` => 200

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

GitHub-Sync-Regel

* Nach Abschluss der Validierung und Dokumentation muss der Arbeitsstand final auf GitHub synchronisiert werden.
* Arbeitsstände, die für die weitere KI-/Agenten-Verarbeitung auf GitHub benötigt werden, werden mit `git add`, `git commit` und `git push` veröffentlicht.
* Der Commit muss die Workflow-Dokumentation und alle zugehörigen Änderungen enthalten.

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
* Danach erfolgt der Abschluss mit `git add`, `git commit`, `git push` auf `main`.
* Der GitHub-Sync ist Bestandteil der sauberen Agenten-/Workflow-Verarbeitung und muss die aktualisierte Workflow-Dokumentation mit einschließen.

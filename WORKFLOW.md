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

Untersuchung der Produktionskette

* Browser → `https://www.turbolikes.com`
* Hosting / Apache / Nginx / Reverse Proxy / Host-Mapping
* Node-Backend auf Port `3000`
* `/api/status`

Realer Befund:

* Lokale Runtime: `curl http://127.0.0.1:3000/api/status` → HTTP 200 OK.
* Lokaler Portcheck: `ss -tulpn | grep 3000` → Node hört auf `0.0.0.0:3000`.
* Öffentliche URL: `curl https://www.turbolikes.com/api/status` → HTTP 404 Not Found.
* Öffentliche Root-URL: `curl https://www.turbolikes.com/` → `301 Moved Permanently` nach `http://www.turbolikes.com/index/index.html`.
* Öffentliche Setup-URL: `curl https://www.turbolikes.com/index/app/neutral/webroot/setup.php` → HTTP 200 OK.
* Öffentliche Admin-URL: `curl https://www.turbolikes.com/index/app/neutral/webroot/admin.html` → HTTP 200 OK.

Folgerung:

* Die öffentliche Domain dient aktuell dem statischen Hosting bzw. einem Apache-/Hosting-Layer, der `/api/*` nicht an den lokalen Node-Prozess weiterleitet.
* Der Node-Service läuft lokal korrekt, aber die Produktionsseite leitet `/api/status` nicht an Port 3000 weiter.
* Es gibt im Repository keine Apache-/Nginx-/cPanel-/Passenger-Konfiguration, die den öffentlichen Host auf Node weiterleiten würde.
* `server.md` und `.env.deploy` dokumentieren nur den FTP-Deploy der Projektdateien; sie bilden keine öffentliche Proxy-Regel auf dem Host ab.

Technische Schlussfolgerung

* Das Repository selbst ist für die Laufzeit-Logik und den Setup-Flow korrekt vorbereitet.
* Die verbleibende, echte Ursache liegt außerhalb des Git-Repositorys: Die öffentliche Produktionsumgebung hat keine funktionierende Host-/Proxy-Anbindung für `/api/*` auf den Node-Service.
* Der korrekte Fix auf dem Hosting-Server ist ein externer Apache/Nginx/cPanel- oder Reverse-Proxy-Eintrag, der `https://www.turbolikes.com/api/*` auf `http://127.0.0.1:3000` weiterleitet.
* Ein reiner Repo-/FTPS-Deploy kann diese Production-Proxy-Anbindung nicht ersetzen, wenn das Hosting-System außerhalb des Projekt-Repositorys verwaltet wird.

Durchgeführte Nachweise

* Node lokal erreichbar: JA
* `http://127.0.0.1:3000/api/status`: JA
* `https://www.turbolikes.com/api/status`: NEIN (HTTP 404)
* Reverse Proxy/Host-Mapping korrekt: NEIN
* Echte Produktiv-Deployment-Änderung im Repo: NEIN (nicht möglich, da die benötigte Host-Konfiguration außerhalb des Git-Repositorys und außerhalb der FTPS-Allowlist liegt)
* Setup-API auf public host erreichbar: NEIN
* Database Name/User im Live-Host public API erkannt: NEIN, weil `/api/*` nicht öffentlich erreichbar ist
* Passwort an Frontend übertragen: nicht verifiziert auf public host; im Repository werden keine Passwörter ins Frontend übertragen

Exakter externer Fix, der auf dem Produktionsserver erforderlich ist

* Apache-/Nginx-Rule / cPanel-Proxy-Setting:
  - `https://www.turbolikes.com/api/` -> `http://127.0.0.1:3000/`
  - `https://www.turbolikes.com/api/status` -> `http://127.0.0.1:3000/api/status`
* Zusätzlich muss der Vertrieb/Dispatcher auf dem Hosting-Server so konfiguriert sein, dass PHP-/HTML-Pfade weiterhin funktionieren, aber `/api/*` nicht mehr vom Webserver selbst mit 404 abgefangen wird.
* Wenn das Hosting cPanel/Passenger nutzt, muss der Reverse-Proxy oder ProxyPass/Rewrite in der cPanel-/Apache-Konfiguration gesetzt werden.

Dokumentierte Arbeiten

* Node-Host-Binding-Fix implementiert.
* Lokale Runtime validiert.
* Public-Host-Proxy-Anbindung geprüft.
* Externe Hosting-Konfiguration als verbleibende Ursache dokumentiert.
* Kein Scheinfix bzw. kein Blind-Deploy durchgeführt, da die öffentliche Routing-Konfiguration nicht im Projekt-Repo liegt.

GitHub-Sync-Regel

* Nach Abschluss der Validierung und Dokumentation muss der Arbeitsstand final auf GitHub synchronisiert werden.
* Arbeitsstände, die für die weitere KI-/Agenten-Verarbeitung auf GitHub benötigt werden, werden mit `git add`, `git commit` und `git push` veröffentlicht.
* Der Commit muss die Workflow-Dokumentation und alle zugehörigen Änderungen enthalten.

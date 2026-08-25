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
* Neutral wird als portable Core-Plattform geführt; app-spezifische Funktionen gehören in den Application Layer bzw. in Module, nicht als Core-Sonderlogik.
* Keine hartcodierten Produktionspfade in Architektur-/Implementierungsentscheidungen; Runtime-Pfade müssen konfigurationsbasiert und installationspfadunabhängig sein.
* Hostspezifische Pfade wie `/home/web1819/*` dürfen nur als optionale Shared-Hosting-Fallback-Kandidaten geführt werden; die effektiven Runtime-/Env-Pfade müssen aus Installationskontext, `DOCUMENT_ROOT` und expliziten Env-Overrides auflösbar sein.
* Modul-Discovery bedeutet nie automatische Aktivierung; der Lifecycle bleibt strikt `DISCOVER -> REGISTER/INSTALL -> INACTIVE -> ACTIVATE -> ACTIVE -> DEACTIVATE`.
* Für Admin/Backend gilt: keine UI-Funktion ohne vorgesehenes serverseitiges Verhalten (keine reine Fassade).

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

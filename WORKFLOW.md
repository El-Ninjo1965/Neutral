Neutral – Workflow

Aktueller Stand

* Repository: El-Ninjo1965/Neutral
* Branch: main
* Der aktuelle Quellcode ist die maßgebliche Referenz.
* Die Setup-Seite wurde auf einen reinen .env-Install-Flow umgestellt: Wenn die Serverkonfiguration auf dem Host vorhanden ist, zeigt die Seite nur noch den Install-Button und kein Formular mehr.
* Der Standard-Host der Node-Laufzeit wurde auf `0.0.0.0` korrigiert, damit der Server öffentlich erreichbar ist; `HOST`, `PUBLIC_HOST` und `SERVER_HOST` werden dabei korrekt berücksichtigt.

Verbindliche Regeln

* Der reale Runtime-Check erfolgt immer über die Live-API und nicht nur über die PHP-Setup-Seite.
* Der produktive Host darf nicht als „aktiv“ gelten, wenn `/api/*` auf dem öffentlichen Host weiterhin 404 liefert.
* `server.md` und die Allowlist in `scripts/manual-ftps-deploy.js` bleiben die verbindliche Quelle für produktive Datei- und Deploy-Entscheidungen.
* Keine Secrets oder echte `.env`-Inhalte werden in das Git-Repository übernommen, außer wenn der Nutzer sie ausdrücklich für die GitHub-Synchronisierung freigegeben hat.

Validierungsergebnisse

* Lokale Runtime-Validierung: `curl http://127.0.0.1:3000/api/status` -> HTTP 200 OK.
* Public-Host-Validierung: `curl https://www.turbolikes.com/api/status` -> HTTP 404 Not Found.
* Public-Host-Validierung: `curl https://www.turbolikes.com/index/app/neutral/webroot/setup.php` -> HTTP 200 OK.
* Public-Host-Validierung: `curl https://www.turbolikes.com/index/app/neutral/webroot/admin.html` -> HTTP 200 OK.
* Ergebnis: Die PHP-HTML-Seiten werden auf dem öffentlichen Host ausgeliefert, aber die eigentliche Node-/API-Laufzeit ist dort nicht an der öffentlichen URL angebunden. Der Host liefert statische Seiten, aber keine funktionierende `/api`-Runtime.

Technische Schlussfolgerung

* Das Repository selbst ist für die Laufzeit-Logik und den Setup-Flow korrekt vorbereitet.
* Die öffentliche Produktionsumgebung hat noch ein Infrastruktur-/Reverse-Proxy-/Host-Mapping-Problem: Der öffentliche Host zeigt nicht auf den laufenden Node-Service, obwohl die lokale Runtime auf Port 3000 funktioniert.
* Ursache für den bisherigen Fehler „Setup could not be saved“ war die JavaScript-Install-Logik, die auf den falschen API-Endpunkt gepostet hat. Der Fix nutzt jetzt die serverseitige PHP-Install-Route mit der vorhandenen Server-`.env` und schreibt den Setup-State in `server/runtime/setup-state.json` sowie in `server/runtime/setup-debug.log`.

Dokumentierte Arbeiten

* Setup-Page: `.env`-basierter Install-Flow, keine sichtbaren Konfigurationsfelder mehr, falls die Serverwerte bereits vorliegen.
* Install-Log: `server/runtime/setup-debug.log` wird für Installations-/Setup-Fehler protokolliert.
* Setup-State: `server/runtime/setup-state.json` wird mit Installationsstatus und Laufzeitkonfiguration aktualisiert.
* Deployment: Der FTPS-Deploy bleibt auf der Allowlist aus `server.md` und `scripts/manual-ftps-deploy.js` basierend.

GitHub-Sync-Regel

* Nach Abschluss der Validierung und Dokumentation muss der Arbeitsstand final auf GitHub synchronisiert werden.
* Arbeitsstände, die für die weitere KI-/Agenten-Verarbeitung auf GitHub benötigt werden, werden mit `git add`, `git commit` und `git push` veröffentlicht.
* Der Commit muss die Workflow-Dokumentation und alle zugehörigen Änderungen enthalten.

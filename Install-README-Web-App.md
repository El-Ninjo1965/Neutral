# NEUTRAL – Web-App installieren

Diese Anleitung beschreibt den Web-App-Anteil innerhalb des gemeinsamen Full-Stack-Produktionspakets. Der verbindliche Produktionsweg baut und überträgt genau ein verifiziertes Paket mit `Web-App/`, `Server/php/` und `Server/public/`; es gibt dafür keine alternative Client-only-Artefaktart. Die ergänzenden Server-, Datenbank- und Setupschritte stehen in [`Install-README-Server.md`](Install-README-Server.md).

## 1. Voraussetzungen

- moderner HTTPS-fähiger Webserver für statische Dateien
- Browser mit ES2018+-Grundfunktionen, Fetch, Promises, localStorage und IndexedDB
- für GPS: sichere HTTPS-Origin und Browser-Geolocation
- erreichbare NEUTRAL-PHP-API, wenn Login, zentrale Daten oder Adminfunktionen genutzt werden
- optional lokal: Node.js nur für Repositorytests/Entwicklungsserver, nicht für Produktion

## 2. Relevante Struktur

- `Web-App/public/index.html` – User-Einstieg
- `Web-App/public/style.css`, `Web-App/public/master-ui.js`, `Web-App/public/user-app.js`, `Web-App/public/api-client.js` – Client
- `Web-App/public/admin/*.js`, `Web-App/public/admin-init.js` – Admin-Client; der serverseitig geschützte Einstieg liegt in `Server/public/admin.php`
- `Web-App/core/*.js` – neutraler Browser-Core
- `Web-App/app/index.js` – App-Shell
- `Web-App/app/modules/index.json` und Modulverzeichnisse – Clientmodule
- `Web-App/apps/neutral-app/app-info.json` – Appmetadaten

Die Deployment-Allowlist in `scripts/manual-ftps-deploy.js` ist maßgeblich, wenn das vorhandene FTPS-Werkzeug genutzt wird.

## 3. Konfiguration

1. Keine `.env`-Datei oder Secrets in Browserdateien kopieren. Die serverseitige `.env` bleibt hostlokal und wird von der öffentlichen PHP-Laufzeit geschützt.
2. `NEUTRAL_BASE_PATH` ist `""` für Domain-Root und eigenen physischen DocumentRoot oder beispielsweise `/meine-app` für einen URL-Unterpfad. Er enthält keinen Host und keinen abschließenden Slash.
3. `Web-App/public/public-path.js` liest ausschließlich den konfigurierten `basePath` aus `NeutralConfig.basePath` beziehungsweise dem Meta-Element `neutral-base-path` und löst Assets, API, Admin und Setup zentral auf. Die API-Basis wird daraus abgeleitet; der Resolver liest kein separates `apiBase` als Eingabe. Produktiver Clientcode verwendet keine fest verdrahteten Domain-Root-Pfade.
4. Die statische Startdatei trägt denselben Basispfad im Meta-Element `neutral-base-path` und im Element `<base href>`. Die Quelle verwendet `<base href="/">`; der Paketbau setzt für Root ebenfalls `/` und für einen Unterpfad beispielsweise `/meine-app/`, ohne die Quelle zu verändern. Dadurch bleiben auch tiefe SPA-Routen wie `/meine-app/orders/42` auf derselben Installationsbasis. Der Basispfad wird niemals aus der aktuellen Browser-URL abgeleitet.
5. Die Root-`.htaccess` arbeitet relativ zu ihrem Installationsverzeichnis und leitet Root beziehungsweise URL-Unterpfad auf Browser- und PHP-Einstiege; die Paketstruktur darf nicht abgeflacht werden.
6. Same-Origin ist der unterstützte Standard, weil Sessions mit `credentials: same-origin` gesendet werden. Cross-Origin benötigt einen bewusst implementierten CORS-/Cookievertrag und ist derzeit nicht Standard.

Der physische DocumentRoot ist keine URL-Konfiguration: Eine Domain oder Subdomain kann auf einen beliebigen Paketordner zeigen und verwendet trotzdem den leeren Basispfad. Nur wenn die öffentliche Adresse tatsächlich beispielsweise mit `/meine-app/` beginnt, wird `/meine-app` gebaut und hostlokal konfiguriert. Root und Unterpfad sind durch lokale Fixtures abgedeckt; die produktive Unterpfadabnahme bleibt offen.

## 4. Lokaler Start

### Neue App lokal erzeugen

Aus einem sauberen Neutral-Checkout erzeugt der Bootstrap einen eigenständigen Projektbaum in einem noch nicht vorhandenen oder leeren Zielordner. Änderungen an bereits versionierten Dateien werden vor jeder Kopierarbeit abgelehnt; unversionierte Dateien werden nicht kopiert:

```bash
npm run app:create -- --target=../sample-app --app-id=sample-app --app-name="Sample App"
```

Die App-ID muss aus kleingeschriebenen Buchstaben und Ziffern mit einzelnen Bindestrichen als Trenner bestehen. Der Anzeigename muss 1–80 Zeichen lang, frei von Steuerzeichen und frei von secretförmigen Werten wie Zugangs- oder Private-Key-Mustern sein. Er wird in `.env.example` verlustfrei mit äußeren einfachen Anführungszeichen serialisiert. Das GPS-Referenzmodul ist standardmäßig nicht enthalten; `--include-gps` übernimmt es samt Katalogeintrag. `--init-git` führt ausschließlich ein lokales `git init` aus und richtet keinen Remote ein.

Das Werkzeug kopiert die versionierten Projektquellen einschließlich der Quelltests über einen benachbarten temporären Ordner und veröffentlicht das Ergebnis erst nach erfolgreicher Metadaten- und Secretprüfung. Ausgeschlossen bleiben Git-Metadaten, Abhängigkeiten, Build- und Runtime-Daten, hostlokale Environment-/Deploymentdateien, Testartefakte sowie Worktrees. Die wertfreien Vorlagen `.env.example` und `.env.ftp.deploy.example` bleiben im neuen Projekt erhalten; der Produktionspaketbau übernimmt weiterhin ausschließlich `.env.example`. Ein nichtleerer Zielordner und auch ein vorhandener oder defekter Zielsymlink werden nicht verändert. Ohne GPS wird zusätzlich nur der GPS-Pflichttest aus dem kopierten FTPS-Workflow entfernt.

Die kopierten Quelltests erzeugen für Bootstrap-Prüfungen selbst ein sauberes temporäres Git-Fixture; `--init-git` ist dafür nicht erforderlich. Ohne lokale PHP-Laufzeit kann die bekannte portable Teilsuite wie folgt ausgeführt werden:

```bash
node --test --test-concurrency=1 $(rg --files tests | rg '\.test\.js$' | rg -v '(admin-php-entry|php-backup|php-login-rate-limit|portability-config)')
```

Nach dem Lauf die ausgegebene Checkliste abarbeiten: Dateien prüfen und das gewünschte Repository separat anlegen, Secrets ausschließlich in einer hostlokalen `.env` setzen, physischen Zielordner festlegen, Datenbank mit eigenen Zugangsdaten einrichten und die Abnahme durchführen. Der Bootstrap ruft keine GitHub-API auf und erzeugt keine Zugangsdaten.

Für einen reinen statischen Sichttest einen lokalen HTTP-Server im Repository verwenden; Dateien nicht direkt über `file://` öffnen, da Fetch, Module und Browserrechte sonst abweichen können. Der Repositorybefehl `npm start` startet die Node-Entwicklungsruntime und ist kein Produktionsnachweis.

Beispiel nach Installation der Entwicklungsabhängigkeiten:

```bash
npm install
npm start
```

Danach die vom Prozess ausgegebene URL verwenden. Zugangsdaten bleiben ausschließlich in der lokalen `.env`.

## 5. Web-App-Anteil im Full-Stack-Deployment

1. Repository in sauberem Commit auschecken.
2. Für Root `npm run package:production -- --base-path=` oder für einen Unterpfad beispielsweise `npm run package:production -- --base-path=/meine-app` ausführen.
3. Das Paket vor dem Upload mit passender öffentlicher HTTPS-Basis prüfen, etwa `npm run setup:preflight -- --package=dist/neutral-production --public-url=https://example.test/meine-app/ --base-path=/meine-app`.
4. Nur das verifizierte gemeinsame Paket bereitstellen. Sein Web-App-Anteil enthält den vollständigen Ordner `Web-App/` mit `public/`, `core/`, `app/` und App-/Modulmanifesten; die getrennten produktiven PHP-Bereiche gehören verbindlich zum selben Paket. `.env`, Node-Runtime, Logs, Tests, `node_modules` und Git-Metadaten fehlen.
5. Die innere Paketstruktur unverändert erhalten, die wertfreie `.env.example` nicht als befüllte öffentliche Clientkonfiguration verwenden und Secrets ausschließlich hostlokal setzen.
6. HTTPS, exakten Basispfad und Same-Origin-Routing für den Web-App-Anteil prüfen und anschließend die Server-, Datenbank-, Setup- und Sperrschritte aus der Serveranleitung ausführen. Lokales `PASS` für Paket und Pfade ersetzt weder Apache-Rewrite- noch PHP-/Datenbanknachweis im Zielhosting.

Vorhandenes Werkzeug:

```bash
npm run deploy:manual -- --dry-run
```

Es verwendet hostlokale Deploymentkonfiguration. Vor Ausführung die Skripthilfe und Stagingliste prüfen; keine Credentials protokollieren.

## 6. Browser- und Speicheranforderungen

- JavaScript aktiviert
- Fetch/URL/Promise
- localStorage für kleine Konfigurations-/UI-Zustände
- IndexedDB für strukturierte lokale Daten
- Cookies für Serversessions
- Geolocation nur für GPS und nur nach Benutzerfreigabe

Mobile Safari und Chromium-basierte Androidbrowser sind primäre Ziele. Eine verbindliche Mindestversionsmatrix ist noch **FEHLT** und muss in P8 ermittelt werden.

## 7. Prüfung

```bash
npm test
```

Zusätzlich im Browser prüfen:

1. Grundoberfläche erscheint unter `<Basis>/` ohne unnötiges Warten auf API/DB/Module; ein SPA-Pfad fällt auf dieselbe Shell zurück.
2. DevTools zeigt keine fehlenden JS/CSS-/Manifestdateien; alle URLs bleiben unter dem konfigurierten Basispfad.
3. API-Status ist unter `<Basis>/api/status` erreichbar.
4. `<Basis>/admin.php`, Login → `auth/me` → Logout und ein abgewiesener CSRF-Schreibrequest funktionieren mit Serversession.
5. `<Basis>/setup.php` und Setup-API liefern nach Aktivierung ohne autorisierte Recoveryfreigabe HTTP 404.
6. Offlineumschaltung zeigt kontrollierten Zustand; keine lokalen Änderungen dürfen als synchronisiert behauptet werden.
7. IndexedDB wird ohne Fehler geöffnet.
8. GPS fragt nur nach Nutzeraktion/Berechtigung und bleibt bei Ablehnung kontrollierbar.

## 8. Typische Fehler

| Problem | Prüfung / Lösung |
|---|---|
| 404 für JS/CSS/Manifest | Document-Root und erhaltene Verzeichnisstruktur prüfen |
| API 404 | konfigurierte API-Basis und Rewrite des Servers prüfen; keinen alten absoluten Hostpfad übernehmen |
| Login bleibt anonym | HTTPS, Same-Origin, Cookieflags und `/api/auth/me` prüfen |
| CSRF 403 | Session-/CSRF-Cookie und `x-csrf-token` bei Schreibrequest prüfen |
| IndexedDB nicht verfügbar | Browsermodus, Storageberechtigung und private/alte Browser prüfen |
| GPS abgelehnt | HTTPS, Geräteberechtigung und Browserberechtigung prüfen; nicht automatisch erneut prompten |
| Oberfläche wartet auf Server | Startreihenfolge gegen `VISION.md` prüfen; langsame Arbeit in Hintergrund verschieben |

## 9. Sicherheitsregel

Clientdateien sind öffentlich. Niemals DB-Passwörter, API-Admin-Tokens, FTP-Zugangsdaten oder Sessiongeheimnisse einbauen. Browserseitige Rollenanzeigen ersetzen keine serverseitige Prüfung.

## 10. Startdiagnostik

`CorePerformance.snapshot()` liefert ausschließlich lokale monotone Phasenzeiten, keine Nutzer- oder Payloaddaten. Die statische Shell muss auch bei gedrosseltem/offline Netzwerk vor Hintergrundinitialisierung sichtbar bleiben. Externe Scripts werden ohne Buildzwang geordnet mit `defer` geladen.

Im Admin-Deployment muss `api-client.js` vor `master-ui.js` stehen; alle externen klassischen Scripts behalten mit `defer` ihre deklarierte Reihenfolge. `admin-init.js` wartet auf das bestätigte `neutral:auth-ready`-Event und verwendet kein Polling.

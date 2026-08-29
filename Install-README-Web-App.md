# NEUTRAL – Web-App installieren

Diese Anleitung installiert ausschließlich den statischen Browserclient. Sie installiert weder PHP-Core noch Datenbank.

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

1. Keine `.env`-Datei in den Browser-Document-Root kopieren.
2. API-Basis relativ zur Installation oder über die vorhandene Clientkonfiguration setzen. Keine Produktionsabhängigkeit zu `localhost`, privaten Hosts oder Port 3000 einführen.
3. Der Browserclient erwartet API-Pfade der Form `/api/...` relativ zur konfigurierten Basis.
4. Same-Origin ist der einfachste unterstützte Produktionsbetrieb, weil Sessions mit `credentials: same-origin` gesendet werden. Cross-Origin benötigt einen bewusst implementierten CORS-/Cookievertrag und ist derzeit nicht Standard.

## 4. Lokaler Start

Für einen reinen statischen Sichttest einen lokalen HTTP-Server im Repository verwenden; Dateien nicht direkt über `file://` öffnen, da Fetch, Module und Browserrechte sonst abweichen können. Der Repositorybefehl `npm start` startet die Node-Entwicklungsruntime und ist kein Produktionsnachweis.

Beispiel nach Installation der Entwicklungsabhängigkeiten:

```bash
npm install
npm start
```

Danach die vom Prozess ausgegebene URL verwenden. Zugangsdaten bleiben ausschließlich in der lokalen `.env`.

## 5. Statisches Deployment

1. Repository in sauberem Commit auschecken.
2. Den vollständigen Ordner `Web-App/` mit `public/`, `core/`, `app/` und den notwendigen App-/Modulmanifesten bereitstellen.
3. Keine `.env`, Serverruntime, Logs, Tests, `node_modules` oder Git-Metadaten hochladen.
4. Die innere `Web-App/`-Struktur unverändert erhalten.
5. HTTPS aktivieren.
6. API-Basis und Same-Origin-Routing prüfen.

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

1. Grundoberfläche erscheint ohne unnötiges Warten auf API/DB/Module.
2. DevTools zeigt keine fehlenden JS/CSS-/Manifestdateien.
3. API-Status ist unter der konfigurierten HTTPS-Basis erreichbar.
4. Login → `auth/me` → Logout funktioniert mit Serversession.
5. Offlineumschaltung zeigt kontrollierten Zustand; keine lokalen Änderungen dürfen als synchronisiert behauptet werden.
6. IndexedDB wird ohne Fehler geöffnet.
7. GPS fragt nur nach Nutzeraktion/Berechtigung und bleibt bei Ablehnung kontrollierbar.

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

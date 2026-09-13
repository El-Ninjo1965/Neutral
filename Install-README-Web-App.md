# NEUTRAL – Web-App installieren

**Status:** VERBINDLICHE BETRIEBSANLEITUNG  
**Geprüft:** 2026-09-13

Diese Anleitung beschreibt den Web-App-Anteil des gemeinsamen Full-Stack-Produktionspakets. Aktuelle Livefehler und Entwicklungszwischenstände gehören nicht hierher, sondern in `STATUS.md`.

## Grundsatz

Produktion verwendet ein gemeinsames verifiziertes Paket mit `Web-App/`, `Server/php/` und `Server/public/`. Es gibt keinen separaten Web-App-only-Produktionsvertrag. Node.js wird nur lokal für Entwicklung, Tests und Paketbau benötigt; Shared Hosting benötigt keinen dauerhaften Node-Prozess.

Module werden entdeckt, aber Discovery bedeutet weder Installation noch Aktivierung.

## Voraussetzungen

- moderner HTTPS-fähiger Webserver für statische Dateien;
- Browser mit Fetch, Promises, localStorage und IndexedDB;
- für GPS eine sichere HTTPS-Origin und Browser-Geolocation;
- erreichbare Neutral-PHP-API für Login, zentrale Daten und Adminfunktionen;
- lokal optional Node.js für Repositorytests und Paketbau.

## Relevante Struktur

- `Web-App/public/` – User- und Admin-Clientassets;
- `Web-App/core/` – neutraler Browser-Core;
- `Web-App/app/` – App-Shell und Module;
- `Web-App/apps/neutral-app/app-info.json` – Appmetadaten;
- `Server/public/admin.php` – serverseitig geschützter Admin-Einstieg.

Die Produktionspaketstruktur darf nicht abgeflacht werden.

## Basispfad

`NEUTRAL_BASE_PATH` ist leer für Domain-Root bzw. einen eigenen physischen DocumentRoot und z. B. `/meine-app` für einen echten URL-Unterpfad. Der Wert enthält keinen Host, Query oder Fragment und endet nicht mit `/`.

`Web-App/public/public-path.js` liest `basePath` als zentralen Resolver-Eingang. Produktiver Clientcode verwendet keine fest verdrahteten Domain-Root-Pfade.

Die statische Startdatei und das gebaute `<base href>` müssen denselben Basispfad verwenden. Der physische Serverordner und der öffentliche URL-Basispfad sind getrennte Konzepte.

Same-Origin ist Standard, damit Sessions mit `credentials: same-origin` funktionieren. Cross-Origin benötigt einen eigenen bewussten CORS-/Cookievertrag und ist nicht Standard.

## Neue App lokal erzeugen

Aus einem sauberen Neutral-Checkout kann ein eigenständiger Projektbaum erzeugt werden:

```bash
npm run app:create -- --target=../sample-app --app-id=sample-app --app-name="Sample App"
```

Optional:

- `--include-gps` übernimmt das GPS-Referenzmodul;
- `--init-git` führt nur ein lokales `git init` aus und richtet keinen Remote ein.

Nichtleere Zielordner oder vorhandene/defekte Zielsymlinks werden nicht verändert. Secrets und hostlokale Deploymentdateien werden nicht kopiert; wertfreie Beispielvorlagen bleiben erhalten.

## Lokaler Start

Für einen Browser-Sichttest einen lokalen HTTP-Server verwenden, nicht `file://`.

```bash
npm install
npm start
```

`npm start` ist Entwicklungsruntime und kein Produktionsnachweis.

## Produktionspaket

Für Domain-Root:

```bash
npm run package:production -- --base-path=
npm run setup:preflight -- --package=dist/neutral-production --public-url=https://example.test/ --base-path=
```

Für Unterpfad:

```bash
npm run package:production -- --base-path=/meine-app
npm run setup:preflight -- --package=dist/neutral-production --public-url=https://example.test/meine-app/ --base-path=/meine-app
```

Nur ein erfolgreich verifiziertes Paket bereitstellen. Es enthält Web-App und PHP-Produktionsanteile, jedoch keine lokale `.env`, Node-Runtime, Tests, `node_modules`, Logs oder Git-Metadaten.

Hostlokale Secrets bleiben ausschließlich in der Serverkonfiguration.

## Browser-/Speicheranforderungen

- JavaScript aktiviert;
- Fetch/URL/Promise;
- localStorage für kleine lokale Konfigurations-/UI-Zustände;
- IndexedDB für strukturierte lokale Daten;
- Cookies für Serversessions;
- Geolocation nur für GPS und nach Benutzerfreigabe.

## Abnahme

Automatisierte Repositorytests:

```bash
npm test
```

Im Zielbrowser zusätzlich prüfen:

1. Shell erscheint unter dem konfigurierten Basispfad ohne unnötiges Warten auf API/DB/Module.
2. Keine fehlenden JS/CSS-/Manifestdateien; URLs bleiben unter dem Basispfad.
3. API-Status ist unter `<Basis>/api/status` erreichbar.
4. Login, `auth/me`, Logout und CSRF-Schutz funktionieren mit Serversession.
5. Setup-Einstieg ist nach Aktivierung ohne autorisierte Recoveryfreigabe gesperrt.
6. Offlinezustand wird kontrolliert dargestellt; nichts wird fälschlich als synchronisiert behauptet.
7. IndexedDB öffnet ohne Fehler.
8. GPS respektiert HTTPS und Browserberechtigung.

## Typische Fehler

| Problem | Prüfung |
|---|---|
| 404 für Assets | DocumentRoot, Basispfad und unveränderte Paketstruktur prüfen |
| API 404 | API-Basis und Server-Rewrite prüfen |
| Login bleibt anonym | HTTPS, Same-Origin und Cookieflags prüfen |
| CSRF 403 | Session-/CSRF-Cookie und Header derselben Origin prüfen |
| IndexedDB fehlt | Browsermodus und Storageberechtigung prüfen |
| GPS abgelehnt | HTTPS und Geräte-/Browserberechtigung prüfen |
| UI wartet auf Server | Startreihenfolge gegen `VISION.md` prüfen |

## Sicherheitsregel

Clientdateien sind öffentlich. Niemals DB-Passwörter, Admin-/API-Tokens, FTP-Zugangsdaten oder Sessiongeheimnisse in Browserdateien einbauen. Browserseitige Rollenanzeigen ersetzen keine serverseitige Autorisierung.

## Startdiagnostik

Die statische Shell muss auch bei langsamem oder fehlendem Netzwerk vor Hintergrundinitialisierung sichtbar bleiben. Externe klassische Scripts werden geordnet geladen; Admininitialisierung wartet auf bestätigten Authzustand statt auf Polling.
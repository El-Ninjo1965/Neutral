# NEUTRAL – Lokale Entwicklungsumgebung

**Status:** VERIFIZIERTE WINDOWS-REFERENZUMGEBUNG  
**Geprüft:** 2026-09-13

Diese Datei beschreibt ausschließlich die lokale Entwicklungsumgebung. Aktuelle Livefehler und Operator-Retests stehen in `STATUS.md` und `CHATGPT.md`.

Neutral Core 1.0 muss weiterhin ohne Node.js auf PHP-/MySQL-Shared-Hosting funktionieren. Node.js bleibt Entwicklungs- und Testwerkzeug.

Die verbindliche Übersicht zu PC-, GitHub-, FTPS- und Webserververbindungen sowie deren Wiederherstellung steht in `CONNECTIONS.md`.

## Installierte Werkzeuge

| Werkzeug | Version | Zweck |
|---|---:|---|
| Git for Windows | 2.55.0.windows.3 | Versionsverwaltung und Credential Manager |
| GitHub CLI | 2.98.0 | GitHub-Anmeldung, Repository-, Actions- und Workflowzugriff |
| Node.js LTS | 24.19.0 | JavaScript-Tests und lokale Entwicklungswerkzeuge |
| npm | 11.17.0 | reproduzierbare Installation aus `package-lock.json` |
| PHP CLI | 8.5.8 | lokale Prüfung der PHP-Referenzproduktion |

Composer, Docker, Redis, WSL und lokale MySQL-Server sind keine Voraussetzung für den aktuellen Entwicklungsweg.

## PHP-Erweiterungen

Die lokale `php.ini` aktiviert die für Neutral relevanten Erweiterungen:

- `curl`
- `fileinfo`
- `intl`
- `mbstring`
- `openssl`
- `PDO`
- `pdo_mysql`
- `session`

Die Konfiguration liegt hostlokal außerhalb des Repositorys und enthält keine Projektsecrets.

## Git und GitHub

GitHub CLI ist über den Windows-Schlüsselbund mit dem Konto `El-Ninjo1965` verbunden. Git verwendet HTTPS und den Credential Manager; Tokens werden nicht in Repositorydateien oder Skripten gespeichert.

Globale Git-Regeln:

- Standardbranch `main`
- veraltete Remote-Refs beim Fetch entfernen
- lange Windows-Pfade aktiviert
- keine automatische CRLF-Umschreibung

## Projekt einrichten

```powershell
git clone https://github.com/El-Ninjo1965/Neutral.git
Set-Location Neutral
npm ci
npm test
```

`npm ci` installiert exakt den Lockfile-Stand. `node_modules` wird weder committed noch deployed. Node-Dateien bleiben aus dem PHP-Produktionspaket ausgeschlossen.

## Wahrheitsgrenze

Lokale Tests und Manifestaudits können Codeverträge belegen, ersetzen aber keinen ausdrücklich angeordneten Operator-Livetest. Der aktuelle Test- und Produktionsstand steht in `STATUS.md`.
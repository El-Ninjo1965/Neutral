# NEUTRAL – Lokale Entwicklungsumgebung

**Status:** VERIFIZIERTE WINDOWS-REFERENZUMGEBUNG

**Geprüft:** 2026-09-01

Diese Datei beschreibt die lokale Entwicklungsumgebung. Sie ändert nicht die Produktionsvoraussetzungen: Neutral Core 1.0 muss weiterhin ohne Node.js auf PHP-/MySQL-Shared-Hosting funktionieren.

## Installierte Werkzeuge

| Werkzeug | Version | Zweck |
|---|---:|---|
| Git for Windows | 2.55.0.windows.3 | Versionsverwaltung und Credential Manager |
| GitHub CLI | 2.98.0 | GitHub-Anmeldung, Repository-, Actions- und Workflowzugriff |
| Node.js LTS | 24.19.0 | JavaScript-Tests und lokale Entwicklungswerkzeuge |
| npm | 11.17.0 | reproduzierbare Installation aus `package-lock.json` |
| PHP CLI | 8.5.8 | lokale Prüfung der PHP-Referenzproduktion |

Composer, Docker, Redis, WSL und lokale MySQL-Server wurden bewusst nicht installiert, weil sie für den aktuellen Fertigstellungsblock keinen unmittelbaren Nutzen bringen.

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

Die Konfiguration liegt hostlokal außerhalb des Repositorys. Sie enthält keine Projektsecrets.

## Git und GitHub

Git verwendet global die bestehende Autorenidentität des Repository-Eigentümers. GitHub CLI ist über den Windows-Schlüsselbund mit dem Konto `El-Ninjo1965` verbunden. Git verwendet HTTPS und den Credential Manager; Tokens werden nicht in Repositorydateien oder Skripten gespeichert.

Zusätzliche globale Git-Regeln:

- Standardbranch `main`
- automatisches Entfernen veralteter Remote-Refs beim Fetch
- lange Windows-Pfade aktiviert
- keine automatische CRLF-Umschreibung

## Projekt einrichten

```powershell
git clone https://github.com/El-Ninjo1965/Neutral.git
Set-Location Neutral
npm ci
npm test
```

`npm ci` installiert exakt den Lockfile-Stand. `node_modules` darf nicht committed oder deployed werden. Node-Dateien bleiben aus dem PHP-Produktionspaket ausgeschlossen.

## Verifikationsstand

Am 2026-09-01 wurden GitHub-Anmeldung, Repositoryabfrage, Git-Push im Trockenlauf, PHP-Erweiterungen, `argon2` und die vollständige Testsuite geprüft. Der Teststand ist in [`STATUS.md`](STATUS.md) dokumentiert; fehlgeschlagene Tests sind Projektfehler und keine fehlenden lokalen Werkzeuge mehr.

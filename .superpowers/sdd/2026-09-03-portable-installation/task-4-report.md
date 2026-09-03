# Task 4 Report: Wertfreie Konfiguration und FTPS-Standard

## RED

- Zuerst wurde der Repository-Test fuer die wertfreie Runtime- und FTPS-Vorlage ergaenzt.
- `node --test tests/production-package.test.js` schlug erwartungsgemaess fehl, weil die erforderliche `.env.example` fehlte.

## GREEN

- `.env.example` enthaelt die kanonischen PHP-Laufzeitschluessel, sichere oeffentliche Defaults und ausschliesslich leere Geheimwerte.
- `.env.ftp.deploy.example` verwendet nur neutrale FTPS-Metadaten, Port 21, FTPS, Hostnamenpruefung und ein leeres Passwort.
- `node --test tests/production-package.test.js tests/manual-deploy-manifest.test.js` besteht mit 34 Tests.
- Der reale Produktionspaketbau besteht; das Manifest enthaelt 92 Dateien, die wertfreie Vorlage und keine geprueften verbotenen Kategorien.

## Dateien

- `.env.example`
- `.env.ftp.deploy.example`
- `tests/production-package.test.js`
- `Install-README-Server.md`
- `Security.md`

## Commit

- `security: add value-free deployment templates`

## Self-Review

- Geheimwerte werden weder vorbelegt noch in Testausgaben ausgegeben.
- Die Paketpruefung deckt Environment-Dateien, Runtime-/Log-/Backupdaten, Deployment- und Schluesseldateien ab.
- Die Dokumentation verlangt die hostlokale Kopie und Konfiguration der Vorlagen.

## Bedenken

- Der aktuelle PHP-Konfigurationsleser verwendet `CORE_BOOTSTRAP_PASSWORD`; ein abweichender `BOOTSTRAP_ADMIN_PASSWORD`-Alias wurde absichtlich nicht als wirkungslose Vorlage eingefuehrt.
- `SESSION_SECRET` und `PROVIDER_SECRET` bleiben als von der Spezifikation verlangte, leere Platzhalter reserviert; der aktuelle PHP-Produktionspfad konsumiert sie noch nicht.

## Nachbesserung Runde 1

### RED

- Die Sollwerttabelle wurde um alle vorhandenen hostlokalen und geheimen Runtimefelder erweitert, darunter Datenbankziel und -kennung, Bootstrap-Identitaet, Backup- und Recovery-Geheimnisse sowie Session-, Provider- und Admin-Tokenfelder.
- Der gezielte Test schlug erwartungsgemaess fehl, weil ein hostbezogenes DB-Feld vorbelegt war.

### GREEN

- Das betroffene DB-Feld ist nun leer; sichere oeffentliche Defaults werden in einer getrennten Tabelle geprueft.
- `CORE_BOOTSTRAP_PASSWORD` bleibt der alleinige, vom PHP-Produktionspfad konsumierte Bootstrap-Passwortschluessel.

### Commit

- `security: keep host config values empty`

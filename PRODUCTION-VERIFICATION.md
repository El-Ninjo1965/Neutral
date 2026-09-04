# NEUTRAL – Produktionsnachweis Shared Hosting

**Stand:** 2026-09-04
**Ziel:** `https://turbolikes.com/` (kanonischer Origin; `www` leitet dorthin weiter)
**Plattform:** PHP/MySQL auf Shared Hosting; Node.js ist keine Produktionsvoraussetzung.

## Bestätigter Minimalumfang

| Bereich | Ergebnis | Nachweis |
|---|---|---|
| Deployment | BESTANDEN | GitHub Actions `FTPS Deploy` bis zum Webspace erfolgreich |
| Portables Deployment-Hardening | BESTANDEN | Explizites Ziel, zwingende Hostnamenprüfung, zielgebundener SHA-256-Manifestfingerprint, vollständiger Transfer ohne `--only-newer` und lftp-Skript über stdin sind getestet; der produktive FTPS-Lauf `33802485499` und der Read-only-Zielnachweis `33803384719` bestanden. |
| HTTPS und Startseite | BESTANDEN | Öffentliche Seite über HTTPS geladen und vollständig gerendert |
| Root-Assets | BESTANDEN | `core`, `style.css` und `user-app.js` werden durch Root-Rewrite aus der Repositorystruktur ausgeliefert |
| Datenbank | BESTANDEN | Produktionsidentität bestätigt, Verbindung aktiv, 16 erwartete Tabellen und 2 Migrationen |
| Setupzustand | BESTANDEN | `setup_status=ACTIVE`; die Neuinstallation wurde persistiert |
| Admin ohne Sitzung | BESTANDEN | Öffentlicher Aufruf zeigt ausschließlich „Authentication required“ und das Anmeldeformular |
| Admin-CMS nach Anmeldung | BESTANDEN | echter Betreiberlogin und fortbestehende Sitzung; alle 15 Hauptansichten rein lesend geöffnet; alte Ansicht „FRAMEWORK DASHBOARD“ abwesend |
| Neutrale Loginfelder | BESTANDEN | Admin- und Benutzerlogin enthalten produktiv keine voreingestellte Kennung und keinen versteckten `Developer`-Fallback; Read-only-Lauf `33808897301` |
| Permanenter Post-Deployment-Smoke | CODE UND TEST BESTANDEN | Der FTPS-Job prüft danach rein lesend Root, SPA-Rewrite, Adminschutz, Status- und Modul-API, Viewer-GPS, internen PHP-Schutz und den ausgelieferten Referenzmodulvertrag. Der erste produktive Lauf dieses dauerhaften Gates bleibt bis zum Actions-Nachweis offen. |
| API-Version | BESTANDEN | `/api/v1` ist kanonisch; Legacy `/api` bleibt kompatibel; unbekannte Versionen werden abgewiesen |
| Logout-CSRF | CODE UND TEST BESTANDEN | Logout verlangt Sitzung und gültigen CSRF-Token; fehlender/falscher Token ergibt 403 |
| Dateischutz | CODE UND TEST BESTANDEN | Root-Rewrite verweigert versteckte Dateien sowie `Server/php` und `Server/runtime`; Verzeichnislisten sind deaktiviert |
| Secretprüfung | CODE UND TEST BESTANDEN | Wertfreie Runtime-/FTPS-Vorlagen, Paket- und Bootstrap-Scanner einschließlich verschlüsselter Private Keys sowie maskierte Preflight-Fehler sind lokal getestet; hostlokale Produktionswerte bleiben außerhalb von Repository und Browser. |
| Öffentlicher Basispfad | CODE UND TEST BESTANDEN | PHP- und Browserresolver, direktes API-Rewrite, Root-/`/meine-app`- sowie tiefe SPA-Fixtures und ein paketiertes `<base href>` decken Client, Admin, API, Assets und Setup ohne feste Domain-Root-Pfade ab. |
| Produktionspaket | CODE UND TEST BESTANDEN | Der gemeinsame `portable-install`-Kern erzeugt Produzenten-/Formatkennung, `sourceDirty`, exakte Allowlist, sortiertes Manifest und `SHA256SUMS`; fremde Ausgabe, Manipulation, Fremdinventar, Traversal und Symlinks werden blockiert. |
| Paket-Preflight | CODE UND TEST BESTANDEN | Exakte credential-/query-/fragmentfreie HTTPS-Basis, Manifestbasispfad, beide Resolver-Einstiege, Meta-/`base`-Markierungen, Inventar, Hashes und Secretfreiheit werden lokal geprüft. Fehlendes PHP und externes Rewrite bleiben `NICHT_GEPRUEFT`. |
| Lokaler App-Bootstrap | CODE UND TEST BESTANDEN | App-ID/-Name, optionale GPS-Auswahl, wertfreie Vorlagen, saubere Quelle, leeres Ziel und optionales lokales `git init` sind getestet; kein Remote wird angelegt. |

## Bewusste Shared-Hosting-Grenzen

- Der produktive Pfad benötigt nur Apache-kompatible Rewrite-Regeln, PHP und MySQL.
- Der Node-Referenzserver ist Entwicklung und Test, aber keine Voraussetzung auf dem Webspace.
- Hintergrunddienste, dauerhafte Worker und serverseitiges Node.js werden nicht vorausgesetzt.
- Automatisierte Deployments laufen über GitHub Actions und FTPS; ein erfolgreicher Lauf ersetzt keine Aussage über beliebige direkte PC-zu-FTP-Verbindungen.
- Sensible direkte Pfade wie `setup.php` und Server-Interna werden von der verwendeten Browser-Steuerung zusätzlich blockiert. Deshalb beruht ihr Schutz-Nachweis auf Serverregeln und Regressionstests, nicht auf einem umgangenen Schutzmechanismus.

## Noch einmalig mit Betreiberzugang abzunehmen

Der echte produktive Login und die fortbestehende Sitzung über alle 15 Admin-Hauptansichten wurden am 2026-09-03 im Browser bestätigt. Der ausgelöste Logout konnte nach einem CDP-/Browser-Recovery-Timeout nicht mehr belastbar beobachtet werden. Deshalb bleiben ausschließlich das sichtbare Sitzungsende und ein negativer CSRF-Livefall offen. Zugangsdaten wurden weder in Git noch in dieses Protokoll übernommen. Die Login-Drosselung wurde bewusst nicht durch Fehlversuchsserien belastet, um Betreiberkonto und Quell-IP nicht zu sperren.

Zusätzlich offen sind die reale responsive iPad-/Safari-Abnahme und die Neuinstallationsnachweise in einem neuen physischen DocumentRoot sowie unter einem URL-Unterpfad. Die zentrale Installationsbasis und der lokale Preflight sind vorhanden, wurden in diesem Änderungssatz aber weder hochgeladen noch gegen einen fremden Apache-/PHP-Host ausgeführt. Deshalb bleiben folgende Nachweise ausdrücklich offen:

- PHP 8.x samt PDO/`pdo_mysql`, JSON, Session und OpenSSL in der neuen Zielumgebung,
- Apache-/LiteSpeed-Rewrite für Root, API, Assets, Admin, Setup und SPA-Fallback,
- leere Datenbank, Migrationen, Betreiberanlage und anschließende Setup-Sperre,
- Login, Session, CSRF, API-, Asset- und SPA-Smoke-Tests im echten URL-Unterpfad,
- Reproduktion aus einem neu angelegten Repository,
- CodeQL und FTPS für den neuen portablen Abschlusscommit.

`NICHT_GEPRUEFT` im lokalen JSON-Preflight ist für diese externen Fähigkeiten keine Freigabe und wird nie zu einem Gesamt-`PASS` hochgestuft.

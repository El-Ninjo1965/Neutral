# NEUTRAL – Produktionsnachweis Shared Hosting

**Stand:** 2026-09-02  
**Ziel:** `https://www.turbolikes.com/`  
**Plattform:** PHP/MySQL auf Shared Hosting; Node.js ist keine Produktionsvoraussetzung.

## Bestätigter Minimalumfang

| Bereich | Ergebnis | Nachweis |
|---|---|---|
| Deployment | BESTANDEN | GitHub Actions `FTPS Deploy` bis zum Webspace erfolgreich |
| HTTPS und Startseite | BESTANDEN | Öffentliche Seite über HTTPS geladen und vollständig gerendert |
| Root-Assets | BESTANDEN | `core`, `style.css` und `user-app.js` werden durch Root-Rewrite aus der Repositorystruktur ausgeliefert |
| Datenbank | BESTANDEN | Produktionsidentität bestätigt, Verbindung aktiv, 16 erwartete Tabellen und 2 Migrationen |
| Setupzustand | BESTANDEN | `setup_status=ACTIVE`; die Neuinstallation wurde persistiert |
| Admin ohne Sitzung | BESTANDEN | Öffentlicher Aufruf zeigt ausschließlich „Authentication required“ und das Anmeldeformular |
| Admin-CMS nach Anmeldung | BESTANDEN | neue Shell und fünf Navigationsgruppen sichtbar; alte Ansicht „FRAMEWORK DASHBOARD“ abwesend; Users-/Dashboard-Navigation reagiert |
| API-Version | BESTANDEN | `/api/v1` ist kanonisch; Legacy `/api` bleibt kompatibel; unbekannte Versionen werden abgewiesen |
| Logout-CSRF | CODE UND TEST BESTANDEN | Logout verlangt Sitzung und gültigen CSRF-Token; fehlender/falscher Token ergibt 403 |
| Dateischutz | CODE UND TEST BESTANDEN | Root-Rewrite verweigert versteckte Dateien sowie `Server/php` und `Server/runtime`; Verzeichnislisten sind deaktiviert |
| Secretprüfung | TEILWEISE | Keine echten Passwörter, Schlüssel oder Zertifikatsdateien sind versioniert; die Deploy-Beispieldatei enthält jedoch umgebungsspezifische Server-/Kontometadaten und deaktiviert die Hostnamenprüfung. Neutralisierung bleibt offen. |

## Bewusste Shared-Hosting-Grenzen

- Der produktive Pfad benötigt nur Apache-kompatible Rewrite-Regeln, PHP und MySQL.
- Der Node-Referenzserver ist Entwicklung und Test, aber keine Voraussetzung auf dem Webspace.
- Hintergrunddienste, dauerhafte Worker und serverseitiges Node.js werden nicht vorausgesetzt.
- Automatisierte Deployments laufen über GitHub Actions und FTPS; ein erfolgreicher Lauf ersetzt keine Aussage über beliebige direkte PC-zu-FTP-Verbindungen.
- Sensible direkte Pfade wie `setup.php` und Server-Interna werden von der verwendeten Browser-Steuerung zusätzlich blockiert. Deshalb beruht ihr Schutz-Nachweis auf Serverregeln und Regressionstests, nicht auf einem umgangenen Schutzmechanismus.

## Noch einmalig mit Betreiberzugang abzunehmen

Ein echter produktiver Login und anschließender Logout muss einmal im Browser mit dem geheimen Betreiberkennwort durchgeführt werden. Dabei sind Sessioncookie, CSRF-Cookie und Sitzungsende zu bestätigen. Zugangsdaten werden dafür weder in Git noch in dieses Protokoll übernommen. Bis zu diesem Schritt ist der Authentifizierungsfluss durch automatisierte Tests, aber nicht mit einem echten Betreiberkennwort im Produktionsbrowser nachgewiesen.

Zusätzlich offen sind die reale responsive iPad-/Safari-Abnahme und die Neuinstallationsnachweise in einem neuen physischen Document-Root sowie unter einem URL-Unterpfad. Der bestehende FTPS-Lauf überträgt die getrennten Produktionsbereiche gemeinsam; root-absolute öffentliche Pfade blockieren jedoch URL-Präfixe wie `/meine-app/`. Diese Variante darf erst nach Einführung einer zentralen Installationsbasis und einem leeren End-to-End-Test als bestanden gelten.

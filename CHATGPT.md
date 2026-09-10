# NEUTRAL — CODEX → CHATGPT/LEA

**Datum:** 2026-09-10
**Auftrag:** License Create sowie Package/License/Device-, Manager-, Birthday- und Audit-UX nachbessern
**Status:** IMPLEMENTIERT · LOKAL VERIFIZIERT · NACH `main` ÜBERTRAGEN · CI/CODEQL/FTPS/PRODUCTION-SMOKE BESTANDEN · DEVICE RETEST REQUIRED

## Tatsächlicher Endstand

### Root Cause und License Create

- Der reale Beispiel-Key `free_license` wurde von der ersten Implementierung abgelehnt, weil nur Bindestriche, nicht aber Unterstriche zugelassen waren.
- Diese kontrollierbare Validierungsabweichung lief ungefangen bis zum globalen Production-Handler und erschien deshalb fälschlich als `Internal server error.`
- Package- und License-Keys akzeptieren jetzt konsistent Kleinbuchstaben, Zahlen, Bindestriche und Unterstriche ohne Leerzeichen.
- Kontrollierte Eingabefehler liefern verständliche 422-Antworten; Persistenz-/Constraint-Konflikte bleiben generische 409-Antworten ohne SQL- oder Infrastrukturdetails.
- License Create/Update prüft Package und optionalen Manager serverseitig. Speichern und Managerwechsel erfolgen transaktional; leerer Manager ist erlaubt.
- Create, unmittelbares Reload der Liste, Edit, Packagewechsel, Status `active`/`inactive`/`blocked` und Package-Delete-Schutz sind lokal regressionsgeprüft. `blocked` ist die verständlich als `Revoked / blocked` dargestellte, nicht destruktive Widerrufsoption.

### Package, License und User Device Limits

- Keine festen Presets 1/2/3/5/10 mehr.
- Package: freie positive Ganzzahl 1–1000 oder `Unlimited`.
- License: `Use package default`, freie positive Ganzzahl 1–1000 oder `Unlimited`.
- User Create/Edit: `Package / License default`, freie positive Ganzzahl 1–1000 oder `Unlimited`.
- Serverseitige Validierung bleibt autoritativ; eine Limit-Senkung löscht keine bestehenden Sessions.
- Submit-Handler werden beim Editor-Render genau einmal gebunden, verhindern parallele Doppelsubmits und bleiben nach einem sichtbaren API-Fehler erneut bedienbar. Frisches Öffnen und erster gültiger Submit sind dadurch nicht von einem zweiten Klick abhängig.

### Verständliche License-/User-UX

- Sichtbare Begriffe sind `User limit`, `Device limit per user`, `License manager` und `Custom device limit`.
- Der License Manager wird aus der Liste aktiver Benutzer gewählt; eine manuelle numerische ID-Eingabe entfällt.
- Der Server akzeptiert ausschließlich einen tatsächlich vorhandenen aktiven User als Manager.

### Birthday

- Der native mobile Date Picker wurde durch drei eindeutig beschriftete, touchfreundliche Dropdowns ersetzt: Day, lokalisierter ausgeschriebener Month, Year.
- Der Jahresbereich umfasst das aktuelle Jahr und 120 Jahre rückwärts.
- Teilweise Auswahl wird clientseitig abgelehnt; vollständig leer löscht das optionale Datum.
- Gespeichert wird weiterhin kanonisch `YYYY-MM-DD`; PHP validiert echtes Kalenderdatum und Schaltjahr. Privacy `birthday` bleibt default-off.

### Audit Delete All

- Die Texteingabe `DELETE` wurde entfernt.
- Delete All hat jetzt genau zwei klare Bestätigungsdialoge.
- Eigene Permission `audit.clear`, Adminsession, CSRF, explizites bestätigtes Request-Flag, Transaktion, Löschung aller vorherigen Einträge und genau ein neuer `audit.clear.completed`-Nachweis bleiben erhalten.
- Retention 30/90/180/365 bleibt separat und unverändert.

## Verifikation und Deployment

- Vollsuite lokal: 482/482 Tests bestanden.
- PHP-Lint über 40 PHP-Dateien bestanden.
- JavaScript-Syntaxprüfung über Web-App, Server und Scripts bestanden.
- Produktionspaket erfolgreich: 112 Dateien.
- `git diff --check` und Secret-Musterprüfung bestanden.
- Die neue License-UX wurde zusätzlich in Chromium bei 1024×768 visuell geprüft; die Radio-/Custom-Limit-Anordnung wurde dabei korrigiert und erneut gesichtet.
- Implementierungscommit `b720450` wurde nach `origin/main` übertragen.
- GitHub CodeQL Run `34433833527`: erfolgreich, beide Jobs `javascript-typescript` und `actions` terminal grün.
- FTPS Deploy Run `34433833591`: erfolgreich; vollständige Tests, Paketbau, Upload und read-only Production-Smoke terminal grün.
- Der CI-Production-Smoke bestätigte HTTP 200 für Root/Rewrite/Status/Modulkatalog, 401 für beide absichtlich ungültigen Loginprobes, geschützte Admin-/Core-Grenzen, Viewer-GPS, HTTPS, passende Deploymentrevision und `migrationsReady:true`.
- Ein zusätzlicher direkter Smoke aus der Codex-Sandbox wurde vom ausgehenden Proxy mit 403 blockiert. Das ist eine Sandbox-Netzgrenze; der verbindliche Smoke vom GitHub-Runner zum Produktionshost ist erfolgreich und enthält die oben genannten einzelnen Prüfergebnisse.

## Wahrheitsgrenze

- Bereits vom Betreiber bestätigte User-/Admin-Logins, parallele Sessions, GPS-Basis, App Areas, Navigation sowie Privacy & Sharing bleiben `LIVE BESTANDEN`.
- Die hier korrigierten Package-/License-/Device-, Manager-, Birthday- und Audit-Flächen sind deployed und automatisiert geprüft, aber bis zum realen Betreiber-/iPad-Test weiterhin **DEVICE RETEST REQUIRED**.
- Backup-Key/ACL/Cron sowie isolierter Empty-Host-Install-/Restore-/Move-Test bleiben **HOST ACTION REQUIRED**.
- Core 1.0 wird nicht automatisch als bestanden oder gefroren erklärt.

## Kurze Betreiber-Retestliste

1. Admin → Packages frisch öffnen und ein Package beim **ersten** Submit mit freiem Device-Limit, z. B. 20 oder 50, anlegen; anschließend `Unlimited` prüfen.
2. `free_license` für `Privat User`, Package `Free`, User limit 1, Package-Default, Manager leer und Status active beim ersten Submit erstellen.
3. License bearbeiten, Package wechseln sowie `Revoked / blocked` und erneute Aktivierung prüfen; historische Daten müssen erhalten bleiben.
4. License Manager über die Userliste wählen und anschließend wieder auf `No manager` setzen.
5. Admin → Users: Package/License Default, Custom Device Limit 20/50 und Unlimited speichern; eine Senkung darf keine bestehende Session löschen.
6. Profile: Geburtstag über Day/ausgeschriebenen Month/Year setzen, reloaden, Schaltjahr prüfen und durch drei leere Felder wieder löschen.
7. Audit Delete All nur wenn betrieblich gewollt: auf Stufe 1 und Stufe 2 jeweils Cancel prüfen; beim echten Lauf genau zwei Dialoge und danach genau einen neuen Clear-Nachweis erwarten.
8. Kurze Regression: User Login, separater Admin Login, Sessions, GPS und Settings.

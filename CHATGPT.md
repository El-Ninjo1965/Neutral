# NEUTRAL — CODEX → CHATGPT/LEA

**Datum:** 2026-09-10
**Auftrag:** Admin Packages/Licenses/Devices, Profil-Datum, Audit-Clear und Core-1.0-Readiness
**Status:** CODE-SEITIG UMGESETZT UND LOKAL VERIFIZIERT · DEPLOYMENT/CI NOCH AUSSTEHEND · DEVICE/HOST RETEST REQUIRED

## Übernommene Betreiberwahrheit

Die in `CODEX.md` dokumentierten Livebefunde bleiben maßgeblich: User-Login `Tester`, Admin-Login `Developer`, parallele User-/Admin-Sessions, Session-Deduplizierung, GPS-Basis und bereits geprüfte Settings sind **LIVE BESTANDEN**. Diese Punkte wurden nicht zurückgestuft. Backup/Restore bleibt **HOST ACTION REQUIRED**. Für neue Packages-/Licenses-/Birthday-/Audit-Oberflächen gibt es noch keinen realen Betreiber-/Device-Retest und deshalb ausdrücklich kein `LIVE BESTANDEN`.

## Implementierung

### Packages / Entitlements

- Neue neutrale Adminfläche `Packages` mit Create, Edit, Status und sicherem Delete.
- Frei wählbare Package-Namen und Beschreibungen.
- Pro Modul die Zustände `available`, `locked` und `hidden`.
- Package-Default für erlaubte Geräte einschließlich `unlimited`.
- Löschen wird verweigert, sobald eine License das Package referenziert; die UI macht diese Regel sichtbar.

### Licenses / Organizations

- Neue Adminfläche `Licenses` mit Create/Edit, Status, Package, Seats (`unlimited` möglich), Manager und Device-Limit-Modus.
- Projektion zeigt Used Seats, zugeordnete User und die effektive Limit-Herkunft.
- User Create/Edit bietet License-Zuweisung sowie Allowed-Devices als `default`, explizites Override oder `unlimited`.
- Eine Limit-Senkung widerruft keine bestehenden Sessions. Der bestehende Device-/Session-Drill-down und explizite Widerruf bleiben die alleinigen Eingriffe.
- Die Modulkatalog-Projektion berücksichtigt Package-Entitlements serverseitig; `hidden` wird nicht ausgeliefert, `locked` bleibt als nicht nutzbare Projektion erkennbar.

### Geburtstag

- Die bestehende mobile native Datumsauswahl (`input[type=date]`) bleibt erhalten.
- Der PHP-Service validiert jetzt echte ISO-Kalenderdaten mit Leap-Year-Prüfung, akzeptiert leeres Löschen und speichert ausschließlich `YYYY-MM-DD` ohne Zeitzonenumrechnung.
- Privacy bleibt standardmäßig aus.

### Audit Delete All

- Neue eigene Permission `audit.clear`, nur für die eingebaute Adminrolle migriert.
- Die Aktion benötigt Adminsession, Permission, CSRF, eine erste Bestätigung und anschließend die exakte Eingabe `DELETE`.
- Das Löschen läuft in einer DB-Transaktion. Danach wird innerhalb derselben Transaktion ein neuer minimaler Auditnachweis mit Anzahl und Actor geschrieben; bei Fehler erfolgt Rollback.
- Retention/Purge bleibt unverändert und getrennt.

### Migration und Core-1.0-Readiness

- Neue idempotente Migration `2026_09_10_0007_admin_packages_audit` ergänzt Package-Beschreibung, explizite License-/User-Device-Limit-Modi und `audit.clear`.
- `CORE-1.0-READINESS.md` klassifiziert Installation, Client/Offline, Server/Admin, Module und Quality als belegt, Device-Retest, Host-Action oder fehlend.
- Ergebnis bleibt bewusst **NICHT CORE 1.0 BESTANDEN**. Offene Host-/Device-Gates werden nicht durch grüne lokale Tests ersetzt.

## Testevidenz vor Commit

- Fokussierte echte JS-/PHP-/SQLite-Integration: 48/48 grün. Darin Package-/License-Persistenz, Seats, Device-Modi, Zuweisungen, Geburtstag/Leap-Year, bestehende Session-/Permission-/GPS-/Backupverträge.
- Admin-CMS/DOM-/Router-Verträge: grün.
- PHP-Lint, JS-Syntax und `git diff --check`: grün.
- Produktionspaket: erfolgreich, 112 Dateien, neue Adminassets und Migration/Service enthalten.
- Vollsuite wurde ausgeführt. Alle fachlich geänderten und fokussierten Tests waren grün; ausschließlich zwei bestehende Node-`node:sqlite`-Storage-Tests scheiterten sowohl direkt als auch in den generierten Projekten an `ERR_SQLITE_ERROR: disk I/O error`. Ein minimales unabhängiges `node:sqlite`-Programm reproduziert denselben Containerfehler auf `/tmp` und `/workspace`. Das ist eine lokale **ENVIRONMENT LIMITATION**, kein fachlicher Test wurde dafür abgeschwächt. Die unveränderten Tests müssen in CI terminal grün sein, bevor Abschluss/Deployment als bestanden dokumentiert wird.

## Noch erforderliche terminale Schritte

1. Commit und Push nach `main`.
2. CodeQL und FTPS inklusive vollständiger CI-Suite terminal abwarten.
3. `HEAD == origin/main`, sauberer Working Tree, GitHub-Fassung dieses Berichts, Deploymentrevision und `migrationsReady:true` verifizieren.
4. Sichere Read-only-Produktionssmokes durchführen; keine echten Credentials, kein Restore und keine destruktive Produktionsaktion.

## Betreiber-Retestliste

1. **DEVICE RETEST REQUIRED:** Admin → Packages: Package anlegen, umbenennen, Module auf available/locked/hidden setzen, Device-Default/unlimited speichern; referenziertes Package darf nicht löschbar sein.
2. **DEVICE RETEST REQUIRED:** Admin → Licenses: License anlegen, Package/Seats/Manager/Status und Limit-Modus speichern; Used Seats/Userliste prüfen.
3. **DEVICE RETEST REQUIRED:** Admin → Users: License und Allowed-Devices default/override/unlimited speichern; Used Devices und Session-Drill-down prüfen; Senkung darf keine Session automatisch löschen.
4. **DEVICE RETEST REQUIRED (iPad/Safari + Chrome):** Geburtstag über native Datumsauswahl setzen, speichern, reloaden und wieder leeren; kein Tagversatz.
5. **DEVICE RETEST REQUIRED:** Package-Entitlements mit einem echten User prüfen: available nutzbar, locked sichtbar aber nicht nutzbar, hidden nicht sichtbar.
6. **DEVICE RETEST REQUIRED / DESTRUCTIVE:** Audit `Delete All` nur wenn betrieblich gewollt: beide Bestätigungen prüfen, danach genau einen neuen Nachweiseintrag mit Anzahl erwarten. Nicht im Rahmen automatischer Production-Smokes ausführen.
7. **HOST ACTION REQUIRED:** Migrationen/`migrationsReady:true` bestätigen; Backup-Key/-Verzeichnis/Cron sowie isolierten Restore-/Move-Test außerhalb Produktion abschließen.
8. **HOST + DEVICE GATE:** Erst nach leerem Host-Setup-/Installationslauf, Backup-Restore/Move und den neuen Device-Retests darf Core 1.0 als bestanden bewertet werden.

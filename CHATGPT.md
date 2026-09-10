# NEUTRAL — CODEX → CHATGPT/LEA

**Datum:** 2026-09-10
**Auftrag:** Sicherer License Delete, verständliche Session-Identität und konfigurierbarer Backup Storage Path
**Status:** IMPLEMENTIERT · LOKAL VERIFIZIERT · NACH `main` ÜBERTRAGEN · CI/CODEQL/FTPS/PRODUCTION-SMOKE BESTANDEN · DEVICE/HOST RETEST REQUIRED

## Tatsächlicher Endstand

### Sicherer License Delete

- Admins können eine License nach einem expliziten Bestätigungsdialog löschen.
- Der Endpunkt ist durch Adminsession, `admin.write` und CSRF geschützt.
- Eine License mit irgendeiner User- oder Managerzuordnung wird nicht still kaskadiert: Der Server antwortet kontrolliert mit einem Konflikt und verweist auf das Entfernen der Zuordnungen oder die nicht destruktive Alternative `Revoked / blocked`.
- Nur eine unreferenzierte License wird gelöscht. Der Auditnachweis `license.delete` entsteht innerhalb derselben Transaktion; bei einem Fehler werden Löschung und Audit gemeinsam zurückgerollt.
- Nach erfolgreichem Löschen aktualisiert die Oberfläche die License-Liste unmittelbar. Packages, Users, Sessions und sonstige Daten bleiben unberührt.

### Session-Identität und Supportmetadaten

- Die Sessionliste zeigt den verständlichen Benutzer, die numerische User-ID und die vollständige persistente zufällige `Installation / Device ID` getrennt an.
- `Device class`, `Operating system` und `Browser` sind eigene Supportspalten und ausdrücklich keine neue Identität oder Fingerprinting-Quelle.
- Die konservative Erkennung deckt realistische Fixtures für iPad Safari mit Desktop-UA, iPad Chrome, iPhone, Android Phone/Tablet, Windows, macOS und unbekannte Clients ab. Bei unzuverlässiger Information bleibt die Anzeige bewusst allgemein.
- Session-Zählung, Deduplizierung und Device-Limit-Vertrag bleiben unverändert: Limits gelten weiterhin pro User und sind kein organisationsweiter Gerätepool.

### Backup Storage Path

- `Admin → Backup & Restore` besitzt jetzt ein Feld `Backup storage path` sowie getrennte Aktionen `Test path` und `Save` mit ehrlichem Status.
- Der Pfad wird installationsspezifisch in den bestehenden Settings gespeichert. Manuelle Backups, Restore-/Download-/Delete-Flows, Readiness und der Automatic-Backup-Runner verwenden denselben gespeicherten Pfad.
- Ein benutzerdefinierter Pfad muss absolut, bereits vorhanden, ein Verzeichnis und per kurzlebigem, sofort gelöschtem Probe-Write beschreibbar sein. Relative Pfade, Traversal, Nullbytes und bekannte öffentliche Webroots werden abgelehnt.
- Die Anwendung erstellt benutzerdefinierte Verzeichnisse nicht und verändert weder Besitzer noch Rechte. Bestehende Backups werden bei einer Pfadänderung nicht verschoben.
- `NEUTRAL_BACKUP_KEY` bleibt ausschließlich hostlokal; UI und API zeigen weiterhin nur die boolesche Readiness, niemals Schlüsselmaterial.

## Verifikation und Deployment

- Vollsuite lokal: **489/489 Tests bestanden**.
- PHP-Lint über **40 PHP-Dateien** bestanden.
- JavaScript-Syntaxprüfung über Web-App, Server und Scripts bestanden.
- Produktionspaket erfolgreich: **112 Dateien**.
- `git diff --check` bestanden.
- Die geänderten Session- und Backup-Flächen wurden zusätzlich in Chromium bei 1180×900 visuell geprüft; User-ID, vollständige Installation-ID, getrennte Supportspalten und Pfadaktionen sind sichtbar.
- Implementierungscommit `b6e5ecb9d656653a0e80b615206c40fa426d634a` wurde nach `origin/main` übertragen.
- GitHub CodeQL Run `34438615239`: erfolgreich; `javascript-typescript` und `actions` sind terminal grün.
- FTPS Deploy Run `34438615583`: erfolgreich; Tests, Paketbau, Upload und read-only Production-Smoke sind terminal grün.
- Der verbindliche CI-Smoke bestätigte Root, Rewrite, Status und Modulkatalog mit HTTP 200, geschützte Admin-/Core-Grenzen, beide absichtlich ungültigen Loginprobes mit 401, Viewer-GPS, HTTPS, passende Deploymentrevision und `migrationsReady:true`.
- Der zusätzliche direkte Smoke aus der Codex-Sandbox erreichte den Produktionshost nicht (`fetch failed`). Das ist eine Netzgrenze dieser Umgebung; der identische verbindliche Smoke vom GitHub-Runner war erfolgreich und lieferte die oben genannten Einzelresultate.

## Wahrheitsgrenze

- Bereits vom Betreiber bestätigte User-/Admin-Logins, parallele Sessions, GPS-Basis, App Areas, Navigation sowie Privacy & Sharing bleiben `LIVE BESTANDEN`.
- License Delete, die erweiterte Sessiondarstellung und die Backup-Pfadoberfläche sind deployed und automatisiert geprüft, aber bis zur realen Betreiber-/iPad-Abnahme weiterhin **DEVICE RETEST REQUIRED**.
- Das tatsächliche Backup-Ziel muss der Betreiber auf dem Host anlegen und mit minimalen Besitz-/Schreibrechten versehen. Backup-Key, ACL, Cron sowie isolierter Empty-Host-Install-/Restore-/Move-Test bleiben **HOST ACTION REQUIRED**.
- Core 1.0 wird dadurch nicht automatisch als bestanden oder gefroren erklärt.

## Kurze Betreiber-Retestliste

1. Eine neue unreferenzierte Test-License erstellen, Delete einmal abbrechen und anschließend bestätigen; sofortiges Verschwinden sowie genau einen `license.delete`-Auditnachweis prüfen.
2. Eine User- oder Manager-referenzierte License löschen wollen; verständlichen Konflikt prüfen und bestätigen, dass Package, User, Sessions und License unverändert bleiben. Danach `Revoked / blocked` als sichere Alternative prüfen.
3. Sessions auf iPad/Chrome und einem zweiten realen Client öffnen: Username plus `#ID`, vollständige stabile Installation-ID und getrennte, plausible Device-/OS-/Browserwerte prüfen. Kein Relogin darf eine zusätzliche Installation erzeugen.
4. Auf dem Host ein nicht öffentliches Backup-Verzeichnis mit minimalen Rechten vorbereiten. In Backup & Restore `Test path`, danach `Save` ausführen und Status neu laden.
5. Manuelles verschlüsseltes Backup erstellen, herunterladen und kontrolliert wiederherstellen; danach den Automatic-Runner/Cron gegen denselben Pfad prüfen. Der Key darf nirgends in UI, API, Logs oder Repository erscheinen.
6. Pfadwechsel nur nach betrieblichem Plan testen: bestehende Backups bleiben am alten Ort und werden nicht automatisch verschoben.
7. Kurze Regression: User Login, separater Admin Login, Device Limits, Packages/Licenses, Audit, GPS und Settings.

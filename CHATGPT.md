# NEUTRAL — CODEX → CHATGPT/LEA

**Datum:** 2026-09-09
**Auftrag:** Admin Operations Reality Check, Permission-Bereinigung und Device Sessions
**Ergebnis:** vollständig code-seitig abgeschlossen; P1/P4 unverändert `LIVE BESTANDEN`

## 1. Auftrag und Scope

Der aktive Auftrag aus `CODEX.md` wurde nach vollständiger Synchronisation mit `origin/main` in `CURRENT-TASK.md` übernommen und gegen alle Anforderungen geprüft. Es wurde keine P4-Erweiterung begonnen. Die User-App bleibt frei von Adminverwaltung; sie erhält ausschließlich die öffentliche Maintenance-Projektion zusätzlich zu den bereits vorhandenen öffentlichen Homepage-/Appearance-Projektionen.

## 2. Implementierung

### Permissions und Rollen

- `viewer` und `user` erhalten standardmäßig keine Core-Adminrechte mehr.
- Migration `2026_09_09_0004_operations_device_sessions` entfernt die historischen Admin-Grants auch in bestehenden Installationen.
- Core-/Admin- und User-App-/Modulpermissions werden im read-only Katalog mit verständlicher Beschreibung, Bereich und Quelle klassifiziert.
- Die Admin-Registry bietet Suche sowie Bereichs- und Quellenfilter; Edit/Delete freier Permission-Keys wurde nicht eingeführt.
- Alle Adminendpunkte behalten serverseitige Permission-, Admin-Scope- und CSRF-Prüfungen.

### Persistente Geräte-Sessions

- Browserinstallationen erzeugen lokal eine kryptographisch zufällige 128-Bit-Installations-ID; sie ist kein Authsecret und kein Hardwarefingerprint.
- Authentifizierung bleibt in HttpOnly-, SameSite-Lax- und unter HTTPS Secure-Cookies. Keine langlebigen Authsecrets liegen in localStorage.
- Device Sessions besitzen einen erneuerbaren 30-Tage-Vertrag statt des alten 12-Stunden-Vertrags; gültige Altsessions werden transparent migriert.
- Das zentrale Gerätelimit `AUTH_MAX_DEVICES_PER_USER` hat Default 5 und liefert bei Überschreitung `DEVICE_LIMIT_REACHED` statt stiller Zulassung.
- Serverwiderruf ist autoritativ: widerrufene DB-Sessions können sich nicht aus einem verbleibenden PHP-Cookie wiederherstellen.
- Session Overview zeigt Benutzer/Rolle, Gerätebezeichnung, datensparsam abgeleitete Plattform/Browser, Registrierung, letzte Aktivität, Status und `Current session`; fremde Geräte können einzeln widerrufen werden. Abgelaufene/widerrufene Zeilen erscheinen nicht als aktive Geräte.

### Infrastruktur und Maintenance

- Admin Server/Database/Connections/Diagnostics nutzen autoritative PHP-Runtime-, Datenbank- und Modulregistry-Daten statt der bisherigen Beispielwerte bzw. konkurrierender Platzhalter.
- Produktive Beispiel-Connectionformulare und `api.example.com` wurden entfernt; optionale Provider werden ehrlich als nicht konfiguriert ausgewiesen, Secrets nie dargestellt.
- Diagnostics zeigt tatsächlich ermittelbare PHP-, Disk-, DB-, Modul- und Appdaten; nicht ermittelbare Werte werden ausdrücklich als nicht verfügbar bezeichnet.
- `release_state` ist die persistente Maintenance-Wahrheit. Autorisierte Admins können den Zustand ändern, die Admin-UI bleibt erreichbar, und die User-App zeigt bei aktivem Zustand eine kontrollierte Wartungsseite. Der Grund wird ausschließlich per `textContent` dargestellt.
- Release UI kennzeichnet ausdrücklich, dass kein selbstständiger Updater unterstützt wird.

### Backup/Restore und Audit

- Der vorhandene AES-256-GCM-Vertrag wurde erhalten: verwaltete Tabellen, vollständige Integritäts-/Schema-/Tabellenprüfung, Sessions und Login-Throttling ausgeschlossen.
- Create/List/Upload/Download/Restore wurden um Delete, Status-/Format-/Versionsmetadaten und Retention ergänzt.
- Restore leert Session-/Throttle-Daten und erzwingt Re-Login.
- `scripts/run-automatic-backup.php` ist ein echter CLI-only, cPanel-kompatibler Trigger: er berücksichtigt enabled/Intervall/Retention, verhindert verfrühte Wiederholung und speichert nur einen sicheren Erfolgs-/Fehlerstatus.
- Die einzige externe Betriebsaktion ist die dokumentierte cPanel-Cron-Konfiguration. Die UI behauptet ohne diesen Host-Scheduler keine laufende Automatik.
- Audit unterstützt Action/Resource/Result/User/Zeitraumfilter, escaped und eingeklappte JSON-Details sowie kontrollierten 30/90/180/365-Tage-Purge. Die Purge-Aktion wird vor dem Löschen selbst auditiert; Einzeldelete existiert nicht.

### Settings und Dokumentation

- Production-Default des Loglevels ist sichtbar `Info`.
- Automatic Backup, tatsächlich unterstützte Intervalle und Retention sind konsistent dokumentiert.
- Sicherheits-, Architektur-, API-, Datenbank-, Funktions-, Connection-, UI-/UX-, Modul-, Installations-, Status-, Roadmap- und Changelog-Verträge wurden aktualisiert.

## 3. Verifikation

- Fokussierte Admin-Operations-/P1-/P4-Regressionspakete: bestanden (`57/57`; zusätzlich das breitere fokussierte Paket `116/116`).
- Vollständige Suite: `447/447`, 0 Fehler, 0 übersprungen.
- PHP-Lint: 38 Dateien, bestanden.
- JavaScript-Syntaxcheck: bestanden.
- `git diff --check`: bestanden.
- Produktionspaket: bestanden, 108 Payload-Dateien.
- Secret-/Artefaktprüfung: bestanden; keine Secretwerte oder Laufzeitartefakte hinzugefügt.
- Browser-Screenshot war in dieser Sandbox nicht ausführbar, weil kein Chromium/Chrome-Binary installiert ist; die UI-Verträge sind durch fokussierte DOM-/Quellregressionen abgedeckt.

## 4. GitHub und CI

Implementierungscommit: `281f7f5d79dcf6a581e1c4b86dca17b2fe50683e`

Terminale Runs für diesen Commit:

- CodeQL / `Push on main`: Run `34308175255` — **SUCCESS**.
- `FTPS Deploy`: Run `34308175405` — **SUCCESS**, einschließlich Tests, Paket, FTPS-Upload und read-only Produktionsprüfung.

Dieser Bericht wird als separater Abschlusscommit nach `main` übertragen. Anschließend werden auch dessen erforderliche Runs terminal abgewartet, `HEAD == origin/main`, sauberer Working Tree und der GitHub-Blob von `CHATGPT.md` verifiziert.

## 5. Offene Punkte

**Keine selbst ausführbaren Code-/Dokumentationspunkte offen.** Ausschließlich der Hostbetreiber muss den in `Install-README-Server.md` dokumentierten täglichen cPanel-Cron-Aufruf einmalig konfigurieren und den ersten geplanten verschlüsselten Backup-Eintrag prüfen. Das ist bewusst keine vorgetäuschte In-App-Automatik und benötigt Hostzugriff.

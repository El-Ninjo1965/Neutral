# NEUTRAL — CODEX → CHATGPT/LEA

**Datum:** 2026-09-09
**Auftrag:** Live Admin Reality Check — Phase 2 Reparatur
**Status:** CODE-SEITIG ERLEDIGT · DEPLOYED · DEVICE RETEST REQUIRED · Backup-Hostvoraussetzungen: HOST-CHECK REQUIRED

## Ergebnis

Die in Phase 1 belegten Root Causes wurden in der vorgeschriebenen Reihenfolge repariert, mit ausführbaren PHP-/JS-Integrationstests abgesichert und als Commit `9d0f7e16b17a4b5b1f713a94bca0377bd460fb47` produktiv ausgeliefert. P1 und P4 blieben in der vollständigen Regression grün; es wurde keine Appearance-/i18n-Neuentwicklung begonnen.

### 1. Device Sessions

- Das fehlerhafte, in mehrere PDO-Argumente zerlegte SQL wurde durch ein Nowdoc mit genau einem vollständigen Queryargument ersetzt.
- Der Test verwendet echte PHP-Klassen, injiziert einen PDO-Testadapter, führt `listPublic()` aus und prüft vollständiges SQL sowie `Current session`.
- Aktive Liste, autoritativer Widerruf, Expiryfilter, 30-Tage-Cleanup, zufällige Installations-ID und zentrales Device-Limit bleiben erhalten.
- Die Device-Migration toleriert nach Teilanläufen bereits vorhandene erwartete Spalten/Indizes; der zweite vollständige Lauf bleibt über die Migrationstabelle idempotent.

### 2. Admin-Envelope und Infrastruktur

- Alle Infrastructure-Payloads laufen nun zentral durch `AdminCommon.unwrapData`; der Integrationstest verwendet das reale doppelte PHP-Envelope `{ok:true,data:{...}}`.
- Verbindungs-, Provider-, Backup-, Release-, Setup-, DB-, Server- und Diagnosticsdaten werden nicht mehr durch `{}`/`[]` verworfen.
- Fehler bleiben als sichtbare Adminzustände erhalten. Optional fehlende Provider werden ausdrücklich als nicht konfiguriert dargestellt.
- Server- und DB-Test prüfen ausschließlich die aktuelle geschützte Runtimekonfiguration; die UI nimmt keine alternativen Ziele oder Passwörter mehr entgegen.
- Connection-Ping ist fehlertolerant. Diagnostics entpackt dieselbe autoritative Health-/Modulprojektion; GPS bleibt Teil der echten Registryzählung.

### 3. Migration und Deployment

- `scripts/run-core-migrations.php` ist ein CLI-only, idempotenter cPanel-Entrypoint mit sicheren Count-/Exit-Statusmeldungen.
- Beide Operationsrunner werden jetzt in das Produktionspaket aufgenommen.
- `GET /api/v1/system/readiness` liefert nur sichere DB-/Migrationsbereitschaft und Pending-Anzahl.
- Der permanente read-only Produktionssmoke verlangt `migrationsReady: true`; ein Deploy mit ausstehenden Coremigrationen kann nicht mehr still grün werden.

### 4. Backup/Restore

- Backupfehler besitzen stabile sichere Codes für Key, Crypto, DB/Schema, Storage, Export, Encryption und Write, ohne Werte oder Pfade auszugeben.
- `GET /api/admin/backups/readiness` projiziert nur fünf boolesche Voraussetzungen: Key, Crypto, DB, Managed Tables und Storage.
- Manuelle Backups sind weiterhin unabhängig vom externen Cron. AES-256-GCM, Format-/Integritätsprüfung, Sessions-/Throttle-Ausschluss, Upload/Download/Restore/Delete und Retention bleiben erhalten.
- `scripts/run-automatic-backup.php` liegt nun wirklich im Produktionspaket. Ob der Host-Key gesetzt, das Verzeichnis schreibbar und cPanel Cron eingerichtet ist, bleibt **HOST-CHECK REQUIRED**; keine Secretwerte wurden geprüft oder angefordert.

### 5. Release, Settings, Alerts und Audit

- Releaseversion, gekürzter Commit und Buildzeit kommen aus dem ausgelieferten `manifest.json`; Maintenance bleibt separater persistenter DB-State. Ein Self-Updater wird nicht suggeriert.
- Backup Interval (`daily|weekly|monthly`) und Backup Retention (**Anzahl Backups**) sind getrennt. Retention ist frei als Ganzzahl 1–100 validiert; bestehende 7/14/30 bleiben kompatibel und Reload erhält den exakten Wert.
- Alerts sind standardmäßig routenlokal und werden beim Viewwechsel entfernt. Nur explizit globale Alerts bleiben bestehen; Error-Timeouts wurden nicht als Kaschierung eingeführt.
- Auditfilter besitzen sichtbare Labels für Action, Resource, User, Result, From, To und Retention; ARIA/native Dateinputs und responsive Einspalten-Breakpoints bleiben erhalten.

## Verifikation

- Test-first Reproduktion: neue Phase-2-Tests waren vor der Reparatur 0/3 rot (PDO-TypeError, fehlender Export/Unwrap, fehlende Operationsrunner).
- Fokussierte Phase-2-/Backup-/Package-/Smoke-Tests: 42/42 grün; erweitertes Smoke-Paket 16/16 grün.
- Vollständige Suite: 453/453 grün, 0 Fehler, 0 übersprungen.
- PHP-Lint: 39 Dateien grün; JavaScript-Syntax vollständig grün; `git diff --check` grün.
- Produktionspaket: 110 Dateien; Coremigrator, Backup-Runner, SchemaMigrator, PHP-API und Admin-UI explizit enthalten.
- CodeQL Run `34314789156`: SUCCESS.
- FTPS Run `34314789330`: SUCCESS einschließlich Tests, Paket, Upload und read-only Smoke.
- Sicherer Produktionssmoke: Root 200, Status 200, Module 200, Admin unauthentifiziert 401, Revision bestätigt, `migrationsReady:true`, zwei Modulverträge, Viewer-GPS und HTTPS bestätigt.
- Keine destruktive Produktionsaktion und insbesondere kein Restore wurde ausgeführt.

## Kurzer iPad-/Safari-Retest

1. Sessions öffnen: aktuelle und weitere Geräte sichtbar; `Current session`; fremde Session widerrufen und deren Reload prüfen.
2. Connections/Providers: Primary DB real; optionale Provider klar `not configured`; kein `unknown` bei Erfolg.
3. Server/Database/Diagnostics: sichere Runtimewerte und korrekte GPS-Modulzahl.
4. Manuelles Backup erstellen, Liste aktualisieren und herunterladen; **kein Restore auf Produktion**.
5. Maintenance an/aus, Reason prüfen, Admin bleibt erreichbar.
6. Version, Commit und Buildzeit unter Maintenance & Updates prüfen.
7. Daily/Weekly/Monthly und freie Retention (z. B. 23 Backups) speichern und reloaden.
8. Backupfehler erzeugen nur falls ein sicherer Host-Prerequisite-Fehler besteht; zu Audit wechseln, Alert muss verschwinden.
9. Auditfilterlabels und Dateinputs im Hoch-/Querformat prüfen.
10. P1/P4 Kurzregression durchführen.

## Verbleibende externe Abnahme

- **HOST-CHECK REQUIRED:** In Admin → Backups die fünf Bereitschaftswerte prüfen; falls nötig Key/ACL/Cron ausschließlich hostseitig korrigieren. Keine Werte an Codex/Chat übermitteln.
- **DEVICE RETEST REQUIRED:** obige Liste auf iPad/Safari.
- Die reparierten Adminbereiche werden bis zu diesen Checks ausdrücklich **nicht** als `LIVE BESTANDEN` bezeichnet.

---

# Historische Evidenz — Phase-1-Diagnose und frühere Berichte

# NEUTRAL — CODEX → CHATGPT/LEA

**Datum:** 2026-09-09
**Auftrag:** Live Admin Reality Check — Phase 1 Diagnose / keine Fixes
**Status:** Diagnose vollständig; keine Produktcodeänderung; Phase 2 erforderlich

## Kurzfazit

Der Produktionsstand enthält nachweislich die Implementierungsdateien des Abschlusscommits: FTPS-Run `34308483460` für `30f5ef8` und der nachfolgende Run `34311095095` für `8b3cba3` endeten erfolgreich und bestätigten jeweils die Deploymentrevision. Der aktuelle Betreiber-Screenshot zeigt außerdem eindeutig die neue Backup-Oberfläche (`external-cron-required`, Retention-UI). Ein pauschaler alter Frontend-Deploy ist daher **nicht** die gemeinsame Ursache.

Die Hauptdiskrepanz entsteht aus mehreren konkreten Codefehlern und einem nicht nachweisbar ausgeführten Produktionsschema:

1. Die Infrastrukturansicht liest PHP-`JsonResponse`-Antworten eine Ebene zu flach und verwirft dadurch erfolgreiche Server-, DB-, Connection-, Provider-, Backup- und Releasepayloads.
2. Die Sessionabfrage zerlegt durch ein falsch begrenztes PHP-Stringliteral das SQL in zwei Argumente für `PDO::query`; zusätzlich führt das Deployment keine Coremigration aus. Bei einer weiterverwendeten Adminsession kann das neue Device-Schema daher fehlen.
3. Backup-GET-Fehler werden von der UI als leere Liste mit erfundenem Fallback-Scheduler dargestellt. Backup-POST reduziert jede konkrete Ursache auf dieselbe 503-Meldung. Der hostlokale Backup-Key und die Schreibbarkeit sind aus dieser Umgebung nicht prüfbar. Zudem wird der dokumentierte Cron-Runner vom Produktionspaket überhaupt nicht mitgeliefert.
4. Releaseinformationen sind statisch (`1.0.0`) beziehungsweise an `release_state.checked_at` gebunden, nicht an das Buildmanifest oder den Deployzeitpunkt.
5. Der sichtbare Wert 14 ist **Retention (Anzahl Backups)**, nicht Intervall/Tage. Es wurden nur feste Optionen 7/14/30 implementiert; eine freie manuelle Auswahl wurde nie umgesetzt.
6. Error-Alerts sind absichtlich ohne Timeout und werden beim Routerwechsel nicht entfernt. Audit-Datumsfelder besitzen nur ARIA-Namen, keine sichtbaren Labels.

## Befundtabelle

| Bereich | Live-Befund | Code-Stand | Produktionsstand | Root Cause | Evidenz / Sicherheit | Fix nötig? | Priorität |
|---|---|---|---|---|---|---|---|
| Sessions | Keine erwarteten Geräte-Sessions sichtbar | Device-Insert, Registry und UI vorhanden | Dateien deployed; Schema nicht verifiziert | **Codefehler:** `GROUP_CONCAT(... SEPARATOR ",")` liegt in einem PHP-Doppelquote-String und wird als zwei `PDO::query`-Argumente ausgewertet. **Zusätzlich mögliche Schemadrift:** Migration läuft nur bei Setup oder Login, nicht beim Deploy. | Stringauswertung lokal reproduziert: 2 Queryargumente. Workflow enthält keinen Migrationsschritt. Produktive Migrationstabelle ohne Host-/DB-Zugriff nicht prüfbar. | Ja | P0 |
| Connections & Providers | Keine verwertbaren Informationen | Admin-API liefert eine minimale DB-Connection; Provider absichtlich leer | Neue UI nachweislich deployed | **UI-Bindingfehler:** Zugriff auf `result.data.connections`, obwohl PHP `{ok,data:{connections}}` liefert. Provider besitzt zudem keine reale Registryquelle. DB-Ping im Connectionendpoint ist nicht fehlertolerant. | `JsonResponse::success` + `loadData()` direkt verglichen; Betreiberbild konsistent. | Ja | P0/P1 |
| Server | Erwartete Runtimeinformationen fehlen | `/api/admin/server` liefert sichere Runtimewerte | API/PHP und UI deployed | **UI-Bindingfehler:** `result.data.server` statt entpacktem `result.data.data.server`. Form-/Testpfad nutzt daneben andere Shapes. | Statischer End-to-End-Datenfluss eindeutig. Authentifizierte Liveantwort hier nicht abrufbar. | Ja | P0 |
| Database | Sichere DB-Metadaten fehlen | Endpoint pingt DB und liefert Status/Metadaten | API/PHP und UI deployed | Derselbe **Envelope-Bindingfehler**. Fehler werden im UI anschließend zu leerem Objekt/`unknown` normalisiert. | Codevergleich eindeutig; tatsächlicher produktiver Ping ohne Admincookie nicht prüfbar. | Ja | P0 |
| Backups & Restore | `Backup service temporarily unavailable`; gleichzeitig scheinbar leere Liste | Manueller Endpoint konstruiert AES-GCM-Service, exportiert DB und schreibt Runtime-Datei | Neue UI deployed; Cron-Datei **nicht** im 108-Dateien-Paket | **Nachgewiesen:** POST fängt alle Constructor-/DB-/Filesystem-/Tabellenfehler und verwirft Ursache. GET wird durch Envelopefehler unabhängig vom Ergebnis als leer gezeigt. **Nicht weiter auflösbar ohne Hostprüfung:** Der hostlokale `NEUTRAL_BACKUP_KEY` ist die erste Constructor-Prüfung; danach folgen OpenSSL, DB/Tabellen und Filesystem. Die generische 503-Antwort erlaubt keine belastbare Auswahl zwischen diesen Ursachen. **Deploymentfehler:** `scripts/run-automatic-backup.php` fehlt im Produktionsmanifest, daher kann dokumentierter Cronpfad nicht existieren. Cron blockiert manuelle Erstellung im Code nicht. | Constructor-Reihenfolge, Catch und Paketmanifest geprüft. Keywert, Directory-ACL und Tabellenbestand benötigen Hostdiagnose; keine Secrets abgefragt. | Ja | P0 |
| Maintenance & Updates | Keine verwertbaren Release-/Updatedaten | Maintenance-State persistent; Releaseversion hart `1.0.0`, Zeitpunkt ist DB-`checked_at` | Code deployed | Envelope-Bindingfehler leert Anzeige. Darüber hinaus existiert **keine** Verbindung von `manifest.json.sourceCommit/generatedAt` zu Release-DTO; Maintenance und Release werden semantisch vermischt. | Codepfad und Manifestmodell eindeutig. | Ja | P1 |
| Settings / 14 | Fester 14-Tage-Eindruck, gewünschte Auswahl fehlt | `backupRetention` bietet 7/14/30; `backupInterval` separat daily/weekly/monthly | UI deployed (Screenshot passt) | Wert 14 ist Default-Anzahl aufzubewahrender Backups, wird aber ohne Einheit erklärt. Freie/manuelle Retention wurde **nie implementiert**. Backend speichert nur generisches Settings-JSON, ohne eigenen Vertrag. | IDs, Optionen und Save-Payload geprüft. | Ja | P1 |
| Globaler Alert | Backupfehler bleibt nach Navigation zu Audit sichtbar | Error-Alert wird an `document.body` gehängt und hat absichtlich keinen Timeout | Verhalten entspricht deployed Code | **UI-State-Leak:** Router `showView()` räumt globale Alerts nicht ab; nur Nichtfehler verschwinden nach fünf Sekunden. Keine Seiten-/Owner-Zuordnung. | `AdminCommon.showAlert` und Routerfluss eindeutig. | Ja | P1 |
| Audit Filter/Labels | Datumsfelder nicht selbsterklärend | Inputs besitzen `aria-label`, aber keine sichtbaren `<label>`; gesamte Toolbar ist eine generische Gridzeile | UI deployed | **UX-Vertragslücke:** accessibility name ersetzt keine sichtbare Erklärung. Bei Tabletbreakpoint wird alles einspaltig, aber es entsteht trotzdem kein sichtbarer Feldname; native Safari-Date-Darstellung verstärkt das Problem. | Markup und Breakpoints geprüft; visueller Betreiberbefund bestätigt. | Ja | P1 |
| `CURRENT-TASK.md` | Alter Auftrag trotz Abschluss als „in Bearbeitung“ | Alle alten Punkte waren abgehakt | Dokumentationscommit auf main | **Dokumentationsfehler:** Statuskopf wurde im Abschlusscommit nicht auf abgeschlossen gesetzt. Für diesen Auftrag wurde die Datei korrekt durch die Diagnose-Arbeitsliste ersetzt und bleibt bis Abschluss als Diagnose markiert. | Git-Historie `30f5ef8`/`8b3cba3` und Dateiinhalt. | Ja, dokumentarisch | P2 |

## Code, Tests, Migration, Build und Livewahrheit

- **Code vorhanden:** Die beanspruchten Komponenten existieren überwiegend, aber mehrere End-to-End-Verträge sind fehlerhaft verdrahtet.
- **Tests:** Die neuen `admin-operations-contract`-Tests prüfen überwiegend reguläre Ausdrücke im Quelltext. Die Admin-CMS-Tests mocken Payloads und erkennen weder das doppelte PHP-Envelope noch den `PDO::query`-Argumentfehler. Es fehlt ein echter PHP-Integrationstest für Sessions, Infrastruktur, Release/Maintenance, Backup-Fehlerklassifikation und Migration gegen das produzierte Paket.
- **Migration vorhanden:** `2026_09_09_0004_operations_device_sessions` existiert im Paket. Ihre produktive Anwendung ist **nicht nachgewiesen**. Der FTPS-Workflow führt keine Migration aus; nur Setup und ein neuer Login rufen `migrate()` auf.
- **Build/Deploy:** Das Paket enthält API, RBAC, Migrator und Admin-JavaScript. FTPS und read-only Smoke bestätigten Revision und allgemeine öffentliche Endpunkte, prüfen aber keine authentifizierten Admin-DTOs, keine DB-Spalten und keine Backup-Erstellung.
- **Produktionsendpoint:** Direkte sichere HTTP-Probes aus dieser Sandbox wurden vom Netzwerk-Tunnel mit 403 blockiert; authentifizierte Adminprobes wären ohne Betreibercookie ohnehin nicht zulässig. Die Action-Smokes belegen Root/status/module/revision, nicht die betroffenen Adminpfade.
- **Dokumentation:** Der vorige Abschlussbericht war zu weitgehend. Er setzte Vorhandensein plus Source-Tests mit funktionierendem Live-Datenfluss gleich.

## Exakt betroffene Dateien für Phase 2

1. `Server/php/src/Phase4AuthRbac.php` — Session-SQL, Registryfehlerbehandlung, Cleanup-/Current-Vertrag.
2. `Server/php/src/SchemaMigrator.php` — migrationssichere/idempotente Device-Änderung und verifizierbarer Status.
3. `Server/public/api/index.php` — sichere Admin-Diagnose-DTOs, Fehlercodes, Backupursachen ohne Secret-/Pfadleak, Releasequelle.
4. `Web-App/public/admin/index.js` — einheitliches `AdminCommon.unwrapData`, echte Fehlerzustände statt `{}`/`[]`, Session/Infrastructure/Backup/Release-Binding.
5. `Web-App/public/admin/common.js`, `Web-App/public/admin/shell.js` — Alert-Lebenszyklus pro Route.
6. `Web-App/public/admin/audit-view.js`, `Web-App/public/style.css` — sichtbare Labels und tabletfähige Filtergruppen.
7. `Web-App/public/admin/settings-view.js`, `Server/php/src/Phase6AdminStorage.php` — eindeutiger Interval-/Retentionvertrag und Validierung.
8. `Server/php/src/DatabaseBackupService.php`, `scripts/run-automatic-backup.php`, `scripts/lib/portable-install.js` — sichere Diagnose, Runner-Paketierung und Runtime-Verzeichnisvertrag.
9. `.github/workflows/ftp-upload.yml`, `scripts/production-readonly-smoke.js` — nichtdestruktive Migrations-/Adminvertrag-Prüfung; kein automatischer Restore.
10. `tests/admin-operations-contract.test.js`, `tests/admin-cms-ui.test.js`, `tests/admin-php-entry.test.js`, `tests/php-backup.test.js` plus neue echte PHP-Operationsintegrationstests.
11. `CHATGPT.md`, `CURRENT-TASK.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `Security.md`, `API.md`, `Database.md`, `Install-README-Server.md` — erst nach realer Phase-2-Abnahme wahrheitsgemäß aktualisieren.

## Nötige Migrationen und Deploymentmaßnahmen

- Produktive Migrationstabelle read-only prüfen: Vorhandensein/Status von `2026_09_09_0004_operations_device_sessions` sowie Device-Spalten/Index, ohne Nutzdaten auszugeben.
- Migration nach Korrektur über einen expliziten, idempotenten, authentifizierten/CLI-Deployschritt ausführen; nicht von einem zufälligen nächsten Login abhängig machen.
- Hostlokal ausschließlich klassifizieren: Backup-Key vorhanden und Mindestlänge erfüllt; Backupverzeichnis erzeugbar/schreibbar; alle Managed Tables vorhanden. Keine Werte oder Pfade loggen.
- Cron-Runner in das Produktionspaket aufnehmen oder einen tatsächlich deployten geschützten Server-Entrypoint definieren; anschließend cPanel Cron mit diesem realen Pfad konfigurieren.
- Admin-DTO-Smoke mit sicherem kurzlebigem CI-/Hostmechanismus ergänzen, ohne Credentials oder Metadaten zu protokollieren.

## Erforderliche Live-Retests auf iPad/Safari

1. Neue und bestehende User-/Admin-Gerätesession sichtbar; `Current session`; Zweitgerät; Einzelwiderruf; Reload nach Widerruf.
2. Connections/Providers unterscheiden echte primäre DB, optional nicht konfiguriert und Fehler sichtbar.
3. Server/Database/Diagnostics zeigen reale sichere Werte und GPS-Modulanzahl, ohne `{}`, `unknown` oder falsche Null.
4. Manuelles Backup erstellen, Liste aktualisieren, Download; Upload/tampered rejection und Restore nur in sicherer Testinstanz — niemals destruktiv auf Produktion ausprobieren.
5. Maintenance an/aus, Reason, Admin erreichbar, reale Release-/Deployinformation.
6. Settings: Intervall und Retention mit sichtbarer Einheit und gewünschter Auswahl speichern/reloaden.
7. Fehleralert verschwindet beim Seitenwechsel; bewusst globale Meldungen bleiben nur gemäß neuem Vertrag.
8. Auditfilter mit sichtbaren Labels im Hoch-/Querformat und Safari-Date-Control prüfen.
9. P1 und P4 Kurzregression nach Deployment.

## Fehlerklassifikation und Reparaturreihenfolge

1. **P0 Codefehler:** Session-SQL und gemeinsames Envelope-Unwrapping beheben; echte Fehlerzustände rendern.
2. **P0 Deployment-/Schemadrift:** Migration explizit prüfen/ausführen und Sessionpfad live abnehmen.
3. **P0 Konfiguration/Filesystem:** Backup-Key/Directory/Managed-Tables hostseitig sicher klassifizieren; erst danach konkrete Serviceursache beheben. Cron-Runner paketieren.
4. **P1 Code-/Vertragsfehler:** Release aus Manifest ableiten, Connections/Provider ehrlich modellieren, Settingssemantik validieren.
5. **P1 UI-State/UX:** Alerts routenlokal machen, Auditfelder sichtbar beschriften.
6. **P1 Tests/CI:** End-to-End-PHP-DTO-, Migration- und paketierte Operationsregressionen ergänzen.
7. **Live-Abnahme:** oben genannte iPad-/Safari-Matrix; erst dann Dokumentation wieder als abgeschlossen markieren.

## Grenzen dieser Diagnose

**Nachgewiesen:** Code-/Envelope-/SQL-/Alert-/Label-/Paketierungsfehler, fehlender Deploy-Migrationsschritt, statische Releasequelle und Semantik des 14-Werts.
**Starke Evidenz:** Bei einer seit vor dem Deploy weiterverwendeten Session konnte die login-gebundene Migration noch nicht gelaufen sein; unabhängig davon bricht der nachgewiesene Session-SQL-Fehler die Liste.
**Nicht prüfbar ohne Betreiber-/Hostzugriff:** tatsächliche Migrationstabellenzeile, Backup-Key-Status, Verzeichnis-ACL, konkrete Managed-Table-Vollständigkeit und authentifizierte Produktionsantworten. Dafür sind ausschließlich read-only beziehungsweise nichtdestruktive Hostprüfungen erforderlich.

**Keine Reparatur oder destruktive Produktionsaktion wurde in Phase 1 vorgenommen.**

---

# Historische Evidenz — vorheriger Abschlussbericht

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

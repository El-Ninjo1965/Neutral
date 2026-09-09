# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG – PHASE 2 REPARATUR / TEST-FIRST  
**Datum:** 2026-09-09

# Aktueller Auftrag

## Live Admin Reality Check – Phase 2: Root Causes beheben und produktiv verifizieren

Phase 1 ist abgeschlossen. Die Root Causes sind in `CHATGPT.md` dokumentiert und gelten als verbindliche Ausgangslage für diesen Auftrag.

Ziel dieser Phase ist **nicht** neue Featurearbeit, sondern die nachgewiesenen Fehler aus dem Live-Admin-Reality-Check systematisch zu beheben, mit echten Integrationstests abzusichern, sauber zu deployen und den realen Produktionszustand soweit möglich zu verifizieren.

P1 und P4 bleiben `LIVE BESTANDEN` und dürfen nicht regressieren.

Keine Appearance-/i18n-Weiterentwicklung in diesem Auftrag.

---

# 1. Pflicht-Preflight

1. Vollständig mit `origin/main` synchronisieren.
2. Vollständig lesen:
   - `CHATGPT.md`
   - `CODEX.md`
   - `CURRENT-TASK.md`
   - `STATUS.md`
   - `TODO.md`
   - `ToDoNow.md`
   - `WORKFLOW.md`
   - `CHANGELOG.md`
   - `Architecture.md`
   - `Security.md`
   - `API.md`
   - `Database.md`
   - `Functions.md`
   - `CONNECTIONS.md`
   - `UI-UX.md`
   - `Install-README-Server.md`
   - relevante Backup-/Deployment-Dokumentation
3. Danach alle in der Phase-1-Diagnose genannten Implementierungs-, Test-, Migrations- und Deploymentdateien vollständig lesen.
4. Diesen Auftrag vollständig nach `CURRENT-TASK.md` übernehmen.
5. Vor Implementierung prüfen und dokumentieren:

`CODEX.md == CURRENT-TASK-Anforderungen`

6. Test-first arbeiten. Kein symptomatischer Schnellfix ohne reproduzierbaren Fehlerfall.
7. Keine Secrets, Credentials, Backup-Keys, internen sensitiven Pfade oder personenbezogenen Produktionsdaten ausgeben.

---

# 2. Reparaturreihenfolge – verbindlich

Arbeite in dieser Reihenfolge, weil spätere Punkte auf den früheren Datenverträgen aufbauen:

1. Session-SQL und Device-Session-Datenfluss
2. gemeinsames API-Envelope-Unwrapping / Admin-DTOs
3. Migration-/Deploymentvertrag
4. Backup/Restore + Cron-Paketierung + sichere Fehlerklassifikation
5. Release-/Updateinformationen
6. Settings-Vertrag für Intervall/Retention
7. Alert-Lebenszyklus
8. Audit-Filter/Labels
9. echte Integrationstests / CI-Smokes
10. vollständige Regression / Deploy / Live-Verifikation / Dokumentation

---

# 3. Device Sessions – P0

## Nachgewiesene Root Cause

In `Server/php/src/Phase4AuthRbac.php` liegt das Session-SQL mit `GROUP_CONCAT(... SEPARATOR ",")` in einem PHP-Doppelquote-String und wird dadurch falsch als mehrere Argumente an `PDO::query` übergeben.

Zusätzlich ist die produktive Anwendung der Device-Session-Migration nicht garantiert, weil der FTPS-Deploy selbst keine Coremigration ausführt.

## Auftrag

- Schreibe zuerst einen reproduzierenden PHP-Test für den fehlerhaften Session-Query-Pfad.
- Korrigiere das SQL robust und lesbar; keine fragilen Quote-Konstruktionen.
- Prüfe vollständigen Session-Datenfluss: create/register → persist → list → current marking → revoke → cleanup.
- Bestehende gültige Sessions nicht unnötig löschen.
- Current-Session-Markierung zuverlässig erhalten.
- Keine Hardwarefingerprints; keine langlebigen Authsecrets in localStorage.
- Serverwiderruf bleibt autoritativ.
- Device-Limitvertrag unverändert erhalten.
- Migration `2026_09_09_0004_operations_device_sessions` auf Idempotenz und Bestandsinstallationen prüfen.

## Abnahme

Mindestens Tests für:

- bestehende Sessionliste liefert Datensätze ohne PHP/PDO-Fehler;
- aktuelle Session korrekt markiert;
- widerrufene/abgelaufene Sessions nicht als aktiv dargestellt;
- einzelne fremde Device-Session widerrufbar;
- bestehende Installation mit altem Schema migriert sauber;
- erneutes Migrieren bleibt idempotent.

---

# 4. Gemeinsamer Admin-API-Datenvertrag – P0

## Nachgewiesene Root Cause

Mehrere Adminansichten lesen PHP-`JsonResponse`-Antworten eine Ebene zu flach. Dadurch werden erfolgreiche Payloads für Server, Database, Connections, Providers, Backups und Release verworfen bzw. als leer/unknown dargestellt.

## Auftrag

- Definiere einen einzigen klaren Admin-Response-Vertrag.
- Nutze bevorzugt eine gemeinsame zentrale Funktion wie `AdminCommon.unwrapData(...)` oder den bereits passenden vorhandenen Mechanismus.
- Keine Bereich-spezifischen Sonder-Unwrapper, wenn dasselbe Envelope vorliegt.
- Korrigiere alle betroffenen Views konsistent.
- API-Fehler dürfen nicht still zu `{}`, `[]`, `unknown` oder falscher Null normalisiert werden.
- UI soll sauber unterscheiden zwischen:
  - erfolgreich + Daten,
  - erfolgreich + optional nicht konfiguriert,
  - temporär nicht verfügbar,
  - echter API-/Runtimefehler.

## Betroffene Bereiche mindestens

- Sessions
- Connections & Providers
- Server
- Database
- Diagnostics
- Backups & Restore
- Maintenance & Release Information

## Abnahme

- Echte Fixture-/Integrationstests mit dem realen PHP-Envelope ergänzen.
- Tests müssen beweisen, dass doppelte/verschachtelte Shapes nicht mehr durch Mock-Abkürzungen verborgen werden.
- Kein produktiver Adminbereich darf erfolgreiche Payloads wegen falscher Ebene verwerfen.

---

# 5. Connections / Providers / Server / Database / Diagnostics – P0/P1

## Auftrag

Nach dem Envelope-Fix jeden Bereich fachlich prüfen:

### Connections & Providers

- primäre reale DB-/Systemconnection aus autoritativer Quelle anzeigen;
- optionale Provider ehrlich als `not configured` darstellen;
- keine Beispielwerte wie `api.example.com`;
- keine Secrets darstellen;
- DB-/Connection-Ping fehlertolerant und verständlich klassifizieren.

### Server

- reale sichere PHP-/Runtime-/Host-/Releaseinformationen aus autoritativer Quelle anzeigen;
- `Test server` muss echten sicheren Testpfad nutzen;
- keine statischen `unknown`-Füllwerte bei erfolgreicher Antwort.

### Database

- reale sichere DB-Metadaten und Status anzeigen;
- niemals Passwort oder sensitive Connectiondetails;
- DB-Fehler verständlich klassifizieren, ohne interne Pfade/Secrets zu leaken.

### Diagnostics

- reale Werte aus Runtime/DB/Modulregistry;
- installierte GPS-Modulanzahl korrekt;
- Werte, die Shared Hosting nicht sicher liefern kann, explizit `Unavailable on this runtime` statt falscher `0`/`N/A`-Semantik;
- keine vier konkurrierenden Wahrheiten zwischen Server/DB/Connections/Diagnostics.

---

# 6. Migration und Deployment – P0

## Nachgewiesene Lücke

FTPS-Deploy führt derzeit keine Coremigration aus. Migrationen dürfen nicht zufällig erst beim nächsten Login angewendet werden.

## Auftrag

- Entwirf einen expliziten, idempotenten und sicheren Migrationsschritt für Deployment/CLI/Hostbetrieb.
- Shared-Hosting/cPanel-Kompatibilität erhalten.
- Kein automatischer destruktiver Datenumbau ohne kontrollierten Migrator.
- Migrationserfolg/-fehler ohne Secrets protokollieren.
- Produktionsdeployment darf bei notwendiger fehlgeschlagener Migration nicht still als vollständig erfolgreich gelten.
- Bestehende Setup-/Login-Migration darf als zusätzliche Sicherheitslinie bestehen bleiben, aber nicht einzige Produktionsstrategie sein.

## Verifikation

- Testinstallation mit altem Schema → Deploy/Migrate → neues Schema korrekt.
- zweiter Migrationslauf → keine Änderung/kein Fehler.
- fehlgeschlagene Migration → klarer sicherer Fehlerzustand.

---

# 7. Backup & Restore – P0

## Nachgewiesene Probleme

- GET-Payload wird durch Envelopefehler als leere Liste dargestellt.
- POST reduziert unterschiedliche Ursachen auf dieselbe Meldung `Backup service temporarily unavailable.`
- `scripts/run-automatic-backup.php` fehlt im Produktionspaket.
- Hostlokaler Backup-Key, Directory-Schreibbarkeit und Managed Tables konnten in Phase 1 nicht verifiziert werden.

## Auftrag

### Manueller Backup-Pfad

- `Create backup` muss real funktionieren, sofern Runtimevoraussetzungen erfüllt sind.
- AES-256-GCM-Vertrag erhalten.
- Sessions/Login-Throttling weiterhin ausgeschlossen.
- sichere Integritäts-/Schema-/Tabellenprüfung erhalten.
- Liste, Download, Upload, Validate, Restore und Delete nicht regressieren.

### Sichere Fehlerklassifikation

Unterscheide intern mindestens:

- Backup-Key fehlt/ungültig,
- Crypto/OpenSSL nicht verfügbar,
- DB/Managed Tables nicht bereit,
- Backupverzeichnis nicht erzeugbar/schreibbar,
- Export-/Encrypt-/Write-Fehler,
- ungültiges Backupformat.

Nach außen nur sichere, handlungsfähige Meldungen/Codes ohne Secretwerte oder sensitive Pfade.

### Automatische Backups

- `scripts/run-automatic-backup.php` in das reale Produktionspaket aufnehmen.
- cPanel-kompatiblen CLI-only-Vertrag beibehalten.
- Schedulerstatus nicht vortäuschen.
- Wenn kein Host-Cron konfiguriert ist, UI klar `external cron required` anzeigen.
- Cron darf keine Voraussetzung für manuelles Backup sein.
- Retention tatsächlich anwenden.

### Host-Checks

Soweit ohne Secret-Ausgabe möglich, eine sichere Diagnosemöglichkeit bereitstellen für:

- Backup-Key vorhanden/ausreichend konfiguriert: ja/nein;
- Backupdirectory nutzbar: ja/nein;
- Managed Tables vollständig: ja/nein;
- Crypto verfügbar: ja/nein.

Keine Werte oder Pfade offenlegen.

---

# 8. Maintenance & Release Information – P1

## Nachgewiesene Probleme

- Releaseversion ist statisch `1.0.0`.
- `Updated` hängt an `release_state.checked_at`, nicht am tatsächlichen Build/Deploy.
- Buildmanifest enthält bereits `sourceCommit/generatedAt`, ist aber nicht mit dem Release-DTO verbunden.

## Auftrag

- Maintenance-State und Release-Information fachlich trennen.
- Wartungsmodus unverändert persistent, sicher und auditierbar halten.
- Release-/Buildinformationen aus einer belastbaren versionierten Quelle ableiten, bevorzugt Produktionsmanifest/Buildmanifest.
- Mindestens anzeigen, soweit verfügbar:
  - Release/App-Version,
  - Deployment-/Build-Commit kurz,
  - Build-/Generated-Zeitpunkt.
- Wenn kein Self-Updater existiert, weiterhin keinen Updater suggerieren.
- `Operational` nur aus realem Health-/Maintenancezustand ableiten, nicht statisch.

---

# 9. Settings – Backup Interval und Retention – P1

## Nachgewiesene Semantik

Der sichtbare Wert `14` ist **Retention = Anzahl aufzubewahrender Backups**, nicht 14 Tage. Der bisherige Code bietet 7/14/30; eine freie manuelle Auswahl wurde nie implementiert.

## Zielvertrag

- `Backup Interval` und `Backup Retention` visuell und technisch eindeutig trennen.
- Intervall nur tatsächlich unterstützte Schedulerwerte anbieten.
- Retention mit klarer Einheit darstellen: **Anzahl Backups**, nicht Tage.
- Zusätzlich die gewünschte manuelle Retention ermöglichen, sofern sicher sinnvoll.

## Manuelle Retention

Implementiere einen klaren Zahlenvertrag statt Freitext-Chaos:

- positive Ganzzahl;
- serverseitige Validierung;
- vernünftige Unter-/Obergrenzen auf Basis bestehender Runtime/Storage-Annahmen;
- UI zeigt Einheit und Validierungsfehler sichtbar;
- gespeicherter Wert wird nach Reload exakt wieder dargestellt;
- bestehende 7/14/30-Werte bleiben kompatibel.

Falls die bestehende Architektur einen zwingenden Grund gegen freie Retention enthält, diesen zuerst technisch belegen und einen gleichwertigen klaren Alternativvertrag implementieren; nicht still beim alten Dropdown bleiben.

---

# 10. Globaler Alert-Lebenszyklus – P1

## Nachgewiesene Root Cause

Error-Alerts werden global an `document.body` angehängt, besitzen absichtlich keinen Timeout und werden beim Routerwechsel nicht bereinigt.

## Auftrag

- Alert-Lebenszyklus an Route/View binden.
- Seitenlokale Fehler beim Wechsel der Adminansicht entfernen.
- Wirklich globale Systemmeldungen nur dann persistent lassen, wenn ihr Vertrag dies ausdrücklich verlangt.
- Keine bloße pauschale Timeout-Lösung für Fehler.
- Bestehende Accessibility-Ankündigungen erhalten.

## Abnahme

- Backupfehler sichtbar auf Backupseite.
- Wechsel zu Audit → Backupfehler verschwindet.
- global definierte Meldung bleibt nur gemäß explizitem Vertrag.

---

# 11. Audit Log Filter / sichtbare Labels – P1

## Nachgewiesene Lücke

Datumsfelder besitzen zwar ARIA-Namen, aber keine sichtbaren Labels. Auf iPad/Safari ist die Filterleiste dadurch nicht selbsterklärend.

## Auftrag

- sichtbare Labels für alle Filter, insbesondere From/To bzw. Zeitraum;
- ARIA-Zuordnung korrekt erhalten;
- Tablet-/Mobile-/Desktop-Layout klar gruppieren;
- keine Placeholder-only-Erklärung;
- native Safari-Dateinputs berücksichtigen;
- bestehende Auditfilter und Retention/Purge nicht regressieren.

---

# 12. Tests – diesmal echte End-to-End-Verträge

Die Phase-1-Diagnose hat gezeigt, dass bisherige grüne Tests viele Fehler nicht erkennen konnten, weil sie überwiegend Source-RegEx oder vereinfachte Mocks verwendeten.

## Verbindlich ergänzen

### PHP-Integration

Echte Tests gegen reale Klassen/DTOs für:

- Device Sessions und Session-SQL;
- SchemaMigrator/Bestandsmigration;
- Server/Database/Connections/Diagnostics Responses;
- Maintenance/Release DTO;
- Backup-Service Konstruktion und sichere Fehlercodes;
- Settingsvalidation für Interval/Retention.

### JS/Admin Integration

Mit realistischen PHP-Response-Envelopes testen:

- gemeinsames unwrap;
- erfolgreiche Daten;
- optional nicht konfiguriert;
- API-Fehler;
- Backup-Liste;
- Releaseanzeige;
- Sessionliste;
- Route-scoped Alerts;
- Auditlabels.

### Paket-/Deploymenttests

Produktionspaket muss enthalten:

- alle nötigen Migrationen;
- `scripts/run-automatic-backup.php`;
- Buildmanifest/Releasequelle;
- alle betroffenen PHP-/Adminassets.

### Smoke

Nichtdestruktive Smokes soweit technisch sicher für:

- Revision;
- Migrationsbereitschaft/status;
- reale öffentliche Basisendpunkte;
- sichere Admin-DTO-Vertragsprüfung nur wenn ohne Credential-Leak möglich.

Keine Restore-Aktion in Produktion.

---

# 13. Vollständige Regression

Nach fokussierten Tests vollständige Suite ausführen, mindestens inklusive:

- P1 User-App/Admin-Trennung;
- P4 Homepage module/html;
- Warmstart;
- Light/Dark Theme;
- Appearance V2 bestehender Stand;
- lokale Navigation;
- GPS;
- Login/Logout;
- Rollen/Permissions;
- Device Sessions;
- Maintenance;
- Backup/Restore Unit/Integration ohne destruktiven Produktionsrestore;
- Audit;
- Service Worker;
- Packaging/Base Path;
- FTPS/Revision Smoke;
- Secret-/Artefaktprüfung;
- PHP lint;
- JS syntax;
- `git diff --check`.

Keine bestehenden grünen Pfade opfern, um Adminseiten zu reparieren.

---

# 14. Deployment und Produktionsverifikation

Nach grüner Suite:

1. Produktionspaket bauen.
2. Paketinhalt explizit gegen Phase-2-Pflichtdateien prüfen.
3. Commit und Push nach `main` gemäß `WORKFLOW.md`.
4. Erforderliche CI-/Deploy-Runs terminal abwarten.
5. `HEAD == origin/main` und sauberer Working Tree.
6. Deploymentrevision verifizieren.
7. Soweit ohne Betreiberinteraktion möglich sichere Produktionschecks ausführen.
8. Keine destruktiven Produktionsaktionen.

## Hostabhängige Punkte

Wenn Backup-Key, ACL oder produktive Migration nur hostseitig endgültig verifizierbar sind:

- sichere read-only/diagnostische Prüfmöglichkeit bereitstellen;
- exakt dokumentieren, welchen Betreibercheck Lea/L anschließend durchführen soll;
- keine Secretwerte anfordern oder anzeigen.

---

# 15. Erforderlicher Betreiber-Retest nach Deployment

In `CHATGPT.md` eine kurze, klare iPad/Safari-Retestliste hinterlassen für:

1. Sessions sichtbar + Current session + Einzelwiderruf.
2. Connections/Providers reale/optionale Zustände.
3. Server/Database/Diagnostics reale sichere Werte + GPS-Modulanzahl.
4. Manuelles Backup erstellen + Liste/Download; kein destruktiver Restore auf Produktion.
5. Maintenance an/aus + Reason + Admin bleibt erreichbar.
6. Release-/Deployinformation sichtbar.
7. Settings: Interval + Retention mit klarer Einheit + manuelle Retention speichern/reloaden.
8. Backupfehler-Alert verschwindet beim Seitenwechsel.
9. Auditfilter mit sichtbaren Labels im Hoch-/Querformat.
10. P1/P4 Kurzregression.

---

# 16. Dokumentation und Abschluss

Erst nach tatsächlicher Verifikation aktualisieren:

- `CHATGPT.md`
- `CURRENT-TASK.md`
- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- `CHANGELOG.md`
- `Security.md`
- `API.md`
- `Database.md`
- `Architecture.md`
- `CONNECTIONS.md`
- `UI-UX.md`
- `Install-README-Server.md`
- relevante Backup-/Deploymentdokumentation.

Regeln:

- `CURRENT-TASK.md` am Ende korrekt auf abgeschlossen setzen, wenn wirklich abgeschlossen.
- Keine Behauptung `LIVE BESTANDEN` für Punkte, die nur code-seitig getestet wurden und noch Betreiber-Retest benötigen.
- Klar unterscheiden zwischen:
  - CODE-SEITIG ERLEDIGT,
  - DEPLOYED,
  - HOST-CHECK REQUIRED,
  - DEVICE RETEST REQUIRED,
  - LIVE BESTANDEN.
- Historische Phase-1-Diagnose nicht löschen; nur als überholte Evidenz einordnen.

---

# 17. Grenzen

- Keine Appearance-/i18n-Neuentwicklung.
- Keine neuen Produktfeatures außerhalb der genannten Reparaturen.
- Keine Fake-/Placeholder-Daten.
- Keine Secrets.
- Keine Hardwarefingerprints.
- Kein destruktiver Restore auf Produktion.
- Keine stillen Datenbankänderungen außerhalb des Migrators.
- Keine kosmetische Symptombehandlung ohne den belegten Daten-/Runtimevertrag zu korrigieren.
- Keine Abschlussmeldung, solange Tests/Deployment nicht terminal verifiziert sind.

**Ziel:** Die in Phase 1 nachgewiesenen Diskrepanzen zwischen Code, Deployment und realem Adminverhalten werden systematisch behoben, test-first abgesichert und so weit wie technisch möglich produktiv verifiziert. Danach erhält Lea einen präzisen Betreiber-Retest statt einer voreiligen "alles erledigt"-Meldung.

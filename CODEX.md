# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER NACHBESSERUNGSAUFTRAG – LICENSE DELETE + SESSION DEVICE UX + BACKUP STORAGE PATH  
**Datum:** 2026-09-10

# Betreiber-Livebefund nach Commit `b720450`

Der zuletzt deployte Stand wurde erneut real im Adminbereich auf iPad/Chrome geprüft.

## Positiv bestätigt

- User Login funktioniert.
- Admin Login funktioniert.
- parallele User-/Admin-Sessions funktionieren.
- GPS-Basismodul bleibt im geprüften Umfang funktionsfähig.
- `Packages / Entitlements` funktioniert nach der Nachbesserung beim ersten Submit.
- frei konfigurierbare Device-Limits (`Custom limit`) und `Unlimited` sind sichtbar.
- `Licenses / Organizations` lässt sich jetzt erfolgreich anlegen; der frühere `Internal server error` ist im Livecheck nicht mehr aufgetreten.
- License Manager wird als User-Auswahlliste angeboten.
- Package-Zuordnung und aktive License-Zählung werden sichtbar aktualisiert.

Diese bestätigten Bereiche nicht unnötig umbauen oder regressieren.

## Neue offene Punkte

1. `Licenses / Organizations`: in der Übersicht existiert aktuell nur `Edit`; der Betreiber möchte eine sichere **Delete**-Funktion.
2. `Sessions`: Useranzeige zeigt Namen, aber nicht die numerische User-ID (z. B. `#101`, `#102`).
3. `Sessions`: Spalten/Begriffe sind missverständlich. `Browser installation` ist keine Geräteklasse; die eindeutige persistente Installations-ID muss klarer als Geräte-/Installationsidentität sichtbar sein.
4. `Sessions`: aktuelle Plattformanzeige meldet auf einem realen iPad mit Chrome `macOS · Chrome`. Diese Information ist damit als tatsächliches Betriebssystem nicht zuverlässig. OS-/Device-Class nur anzeigen, wenn verlässlich; andernfalls neutral/Unknown statt falscher Gewissheit.
5. `Backup & Restore`: der Backup-Speicherpfad soll direkt auf der Backup-Seite konfigurierbar sein. Aktuelle reale Hostvorbereitung: `/home/web1819/backup_neutral/` außerhalb `public_html`, restriktive Rechte. Dieser konkrete Pfad ist nur Betreiberbeispiel und **kein Core-Default**.

Verbindliche Produkt-/UX-Entscheidungen stehen in `ADMIN-UX-DECISIONS.md` und sind vor Änderungen vollständig zu lesen.

---

# 1. Pflicht-Preflight

1. Mit `origin/main` synchronisieren.
2. Vollständig lesen: `CHATGPT.md`, `CODEX.md`, `CURRENT-TASK.md`, `VISION.md`, `CORE-1.0.md`, `CORE-1.0-READINESS.md`, `USER-ACCOUNT-LICENSE-MODEL.md`, `ADMIN-UX-DECISIONS.md`, `UI-UX.md`, `Architecture.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `WORKFLOW.md`, `Install-README-Server.md` und relevante Backup-/Session-/License-Implementierung.
3. Diesen Auftrag vollständig nach `CURRENT-TASK.md` übernehmen.
4. Keine CatchTrack-Fachlogik, kein GPS Pro, kein Marketplace, keine Community, kein Messaging-Ausbau.
5. Keine Secrets/PII ausgeben oder committen. Insbesondere niemals `NEUTRAL_BACKUP_KEY` anzeigen, zurückliefern oder loggen.
6. Keine destruktiven Produktionsaktionen in automatisierten Smokes.
7. Reale Produktionsbefunde haben Vorrang vor früheren grünen Tests.

---

# 2. Licenses / Organizations – sichere Delete-Funktion

## Ziel

Die License-/Organization-Übersicht benötigt neben `Edit` eine klar erkennbare `Delete`-Aktion.

## Vertrag

- Delete nur für entsprechend berechtigte System-Admins.
- klare Bestätigung vor Ausführung;
- CSRF-geschützt;
- serverseitige Autorisierung;
- keine stille Kaskade, die User, Sessions, Packages oder historische Daten unkontrolliert entfernt;
- referenzielle Abhängigkeiten vor Delete prüfen;
- wenn License noch User/Manager/sonstige aktive Referenzen besitzt und ein hartes Delete nach bestehendem Datenmodell unsicher wäre: Delete mit verständlichem 409/422 ablehnen und UI zeigt konkret, was vorher gelöst werden muss;
- `Revoked / blocked` bleibt die nicht-destruktive Alternative und darf durch Delete nicht ersetzt werden;
- erfolgreiche Löschung auditiert mindestens License-ID/Key, Actor und Zeitpunkt nach bestehendem sicheren Auditvertrag;
- keine SQL-/FK-Details im Client.

## Tests

Mindestens:

1. unreferenzierte License → Delete erfolgreich;
2. Cancel → keine Mutation;
3. fehlende Permission → 403;
4. falsches/fehlendes CSRF → 403;
5. referenzierte/zugewiesene License → definierter 4xx, keine Datenbeschädigung;
6. Package bleibt unverändert;
7. Auditnachweis nach erfolgreichem Delete;
8. Liste aktualisiert sich direkt nach Erfolg.

---

# 3. Sessions – User-ID und eindeutige Installationsidentität

## Useranzeige

Die Sessionübersicht muss neben dem menschenlesbaren Usernamen auch die persistente numerische User-ID anzeigen, z. B.:

- `Bootstrap Administrator · #101`
- `Tester · #102`

Keine E-Mail als primäre Identifikation verwenden.

## Installation / Device ID

Die persistente zufällige Installation-ID ist die verbindliche eindeutige Geräte-/Installationskennung. Sie muss in der Session-/Device-Ansicht klar sichtbar und benannt sein.

Die aktuelle UI-Bezeichnung darf nicht suggerieren, dass `Browser installation` selbst das physische Device ist.

Begrifflich sauber trennen:

- **Installation / Device ID** = eindeutige persistente Kennung
- **Device class** = iPad, iPhone, Android phone/tablet, desktop etc., nur soweit zuverlässig ableitbar
- **Operating system** = iPadOS/iOS/Android/Windows/macOS/Linux + Version, nur soweit zuverlässig ableitbar
- **Browser** = optionale Zusatzinformation, nicht primäre Geräteidentität

Falls bereits ein Installation-/Session-Drill-down existiert, dort die vollständige ID zeigen; in dichter Tabellenansicht darf eine gekürzte Darstellung mit Copy/Details verwendet werden, solange Verwechslungen ausgeschlossen sind.

---

# 4. Betriebssystem-/Device-Class-Erkennung – keine falsche Gewissheit

Aktueller Livebefund: reales iPad + Chrome wird als `macOS · Chrome` angezeigt.

Das ist für Supportzwecke irreführend.

## Auftrag

Prüfe die aktuelle Erkennungslogik und alle Quellen:

- `navigator.userAgent`
- `navigator.platform`
- `navigator.userAgentData` / Client Hints, falls verfügbar
- Touch-/Pointer-Signale nur ergänzend, niemals als alleinige sichere Identität
- bestehende Installationsmetadaten und frühere hardcodierte/Fixture-Werte

## Anforderungen

- Keine Hardware-Fingerprints bauen.
- OS-/Device-Metadaten niemals für Auth, Device-Limit oder Sessionidentität verwenden.
- iPadOS nicht als macOS ausgeben, wenn zusätzliche verlässliche Signale ein iPad erkennen lassen.
- Wenn eine genaue Unterscheidung technisch nicht zuverlässig möglich ist, lieber gröber oder `Unknown` anzeigen.
- OS-Version nur anzeigen, wenn tatsächlich belastbar vorhanden.
- Browser kann in der Webversion optional bleiben, soll aber nicht prominent sein; Architektur muss spätere native Store-App respektieren.
- bestehende Installation-ID bleibt unverändert und autoritativ.

## Tests

Mit realistischen Fixtures mindestens:

- iPadOS Safari-artiger Desktop-UA;
- iPadOS Chrome;
- iPhone/iOS;
- Android;
- Windows;
- macOS;
- unbekannter/gekürzter UA.

Abnahme ist nicht „möglichst viel erkennen“, sondern **keine klar falsche Plattform als sichere Tatsache anzeigen**.

---

# 5. Backup & Restore – konfigurierbarer Backup Storage Path

## Ziel

Auf `Admin → Backup & Restore` muss der Betreiber den physischen Backup-Speicherpfad der jeweiligen Installation konfigurieren können.

Der Pfad darf **nicht** im Neutral Core hardcodiert sein.

## Admin-UX

Direkt auf der Backup-Seite:

- Feld `Backup storage path`
- Aktion `Test path`
- Aktion `Save`
- boolesche/verständliche Statusanzeige

Beispiel des aktuellen Hosts nur für Betreiber-Retest:

`/home/web1819/backup_neutral/`

Diesen Pfad niemals als Default oder Fixture für andere Installationen hardcoden.

## Persistenz

- Pfad als normale installationsspezifische Server-/Systemkonfiguration persistent speichern;
- kein Secret;
- Admin darf ihn ändern;
- manueller und automatischer Backup-Lauf verwenden **denselben gespeicherten Pfad**;
- bestehende Backup-Metadaten/Retention/Download-Verträge weiterverwenden.

## `Test path`

Serverseitig mindestens prüfen:

1. Wert ist absoluter, syntaktisch plausibler Serverpfad;
2. keine Nullbytes/Traversal-/unsichere Auflösung;
3. Ziel existiert;
4. Ziel ist ein Verzeichnis;
5. PHP-Prozess kann dort tatsächlich schreiben (sicherer temporärer Probe-Write + sofortiges Entfernen, ohne sensible Daten);
6. Pfad ist nicht offensichtlich Teil eines öffentlich ausgelieferten Webroots bzw. erfüllt den bestehenden `Protected storage`-Vertrag soweit Neutral dies zuverlässig feststellen kann;
7. bei nicht sicher feststellbarer Webroot-Grenze keine falsche `Ready`-Behauptung; klarer `Needs host verification`-Status ist zulässig;
8. keine Server-Secrets oder unnötige Dateisystemdetails an nicht berechtigte Clients ausgeben.

## Backup-Key

- `NEUTRAL_BACKUP_KEY` bleibt ausschließlich hostlokal in `.env`.
- Wert niemals im Admin anzeigen, editieren, zurückliefern, persistieren, auditieren oder loggen.
- Admin zeigt nur `Encryption key: Ready/Not ready`.

## Sicherheit

- Backupziel darf keine PHP-Ausführung benötigen.
- kein `777` empfehlen oder automatisch setzen.
- keine automatischen chmod-/chown-Eingriffe aus der App.
- Path-Test darf außerhalb des Zielverzeichnisses nichts schreiben oder löschen.
- Download weiterhin nur autorisiert und kontrolliert.

## Tests

Mindestens:

- gültiger schreibbarer geschützter Pfad;
- nicht existierender Pfad;
- Datei statt Verzeichnis;
- nicht beschreibbar;
- Traversal-/Nullbyte-Versuche;
- klar öffentlicher Webroot-Pfad wird nicht als Protected/Ready akzeptiert;
- gespeicherter Pfad wird von manuellem Backup verwendet;
- gespeicherter Pfad wird vom Automatic-Backup-Runner verwendet;
- Änderung des Pfads wirkt auf nächste Backups, ohne vorhandene Backups still zu verschieben;
- Backup-Key bleibt vollständig secret-only.

---

# 6. Bestehende Device-Limit-Semantik nicht neu erfinden

Der Livecheck zeigte kurzfristige Begriffverwirrung, aber der bestehende Architekturvertrag bleibt bestehen:

- Package `Default Allowed Devices` = **Default pro User**.
- License `User limit` = maximale User/Seats der Organisation.
- License `Device limit per user` kann Package-Default übernehmen oder überschreiben.
- User kann Default übernehmen oder individuellen Device-Override erhalten.

Die UI soll diese Semantik deutlicher ausdrücken, z. B. `Default devices per user`, damit ein Package-Default von `5` nicht als globales Gesamtlimit aller Geräte der Organisation missverstanden wird.

Keine neue globale Organization-Device-Pool-Semantik in diesem Lauf einführen.

---

# 7. Regression / Freeze-Fortschritt

Nach Umsetzung vollständige Regression.

Mindestens prüfen:

- User/Admin Login;
- getrennte Sessions + Deduplizierung;
- Session-/Installation-ID unverändert stabil;
- Package Create/Edit;
- License Create/Edit/Revoked/Delete;
- Package→License→User-Zuweisung;
- Device-Limits freie Zahl/unlimited und Enforcement;
- Birthday Dropdowns unverändert;
- Audit Delete All unverändert;
- GPS unverändert;
- Settings unverändert;
- Backup Readiness ohne Secret-Leak;
- manueller Backup-Service verwendet konfigurierten Pfad in Testumgebung;
- Automatic-Backup-Runner verwendet denselben Pfad;
- PHP-Lint, JS-Syntax, `git diff --check`, vollständige Tests, Production package.

Danach `CORE-1.0-READINESS.md` nur wahrheitsgemäß aktualisieren. Der reale Backup-Hosttest bleibt `HOST/DEVICE RETEST REQUIRED`, bis der Betreiber auf dem tatsächlichen Hosting `Test path`, `Create Backup`, Download und optional Cron real bestätigt hat.

Keine automatische Core-Freeze-Erklärung.

---

# 8. Deployment / Übergabe

Gemäß `WORKFLOW.md`:

1. commit/push `main`;
2. CI/CodeQL/FTPS terminal abwarten;
3. `HEAD == origin/main`, sauberer Tree;
4. Deploymentrevision + `migrationsReady:true` prüfen;
5. keine manuellen Produktions-SQL-Eingriffe;
6. keine destruktiven Production-Smokes;
7. `CHATGPT.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `CORE-1.0-READINESS.md`, `ADMIN-UX-DECISIONS.md`, `Install-README-Server.md` sowie betroffene API/Security/Architecture/UI-Dokumentation aktualisieren;
8. kurze Betreiber-Retestliste ausgeben:
   - License Delete mit unreferenzierter License;
   - referenzierte License darf nicht unsicher verschwinden;
   - Sessions: User-ID + Installation/Device-ID prüfen;
   - OS/Device-Class auf iPad prüfen;
   - Backup Storage Path speichern und `Test path` auf realem Host ausführen;
   - anschließend manuellen Backup-Create/Download separat real testen.

Nichts ohne realen Betreibercheck als `LIVE BESTANDEN` markieren.

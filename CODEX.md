# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER NACHBESSERUNGSAUFTRAG – BACKUP CONTRACT COMPLETE + SETTINGS/PROFILE UX  
**Datum:** 2026-09-10

# Betreiber-Livebefund

Der aktuelle Produktionsstand wurde real auf iPad/Chrome geprüft.

## Positiv bestätigt

- `Backup storage path` ist auf dem realen Host gesetzt und erfolgreich getestet.
- realer Betreiberpfad: `/home/web1819/backup_neutral/` außerhalb `public_html`, Rechte 700.
- `Encryption key: Ready`, `Crypto: Ready`, `Database/schema: Ready`, `Protected storage: Ready`.
- ein manuelles verschlüsseltes Backup wurde erfolgreich erstellt.
- Download/Restore/Delete-Aktionen werden angezeigt.
- reale Backupgröße ca. 27.8 KB.
- Backup-Audit ergab: 21 verwaltete nichtflüchtige Coretabellen werden vollständig gesichert; Sessions/Login-Attempts werden bewusst ausgeschlossen und bei Restore geleert.
- isolierter Datenbank-Restore mit Testmarkern ist bestanden.
- falscher Key, manipuliertes Artefakt, falsche Schema-Version, unvollständige Tabellenmenge, Traversal-ID und Größenüberschreitung werden kontrolliert abgelehnt.
- Download-/Uploadartefakt wurde byteidentisch verifiziert.

## Kritischer Backup-Befund

Der aktuelle Backup-Vertrag ist weiterhin **BACKUP CONTRACT PARTIAL**.

Nicht vollständig abgedeckt sind derzeit insbesondere:

- physische Medien/User-Dateien aus `Server/runtime/user-media` bzw. vergleichbaren verwalteten Dateiablagen;
- moduldeklarierte persistente Nutzdatentabellen, z. B. `reference_notes_items`;
- damit kein vollständiger Empty-Host-Restore aller verwalteten App-/Moduldaten möglich.

Code, Release-Dateien, `.env`, Secrets, Logs, Caches und vergleichbare reproduzierbare/hostlokale Daten sollen bewusst **nicht** Bestandteil des Datenbackups werden.

## Neue Liveprobleme im User-Settings-Bereich

1. Geburtstag lässt sich auswählen und `Settings saved` wird angezeigt, ist nach erneutem Öffnen von Profile aber wieder leer. Das ist ein echter Persistenz-/Reload-/Hydration-Fehler.
2. Birthday-UI ist auf iPad unnötig groß. Die drei Felder Day / Month / Year sollen kompakt in einer Zeile stehen, mit sinnvoller Breitenverteilung und deutlich weniger Innenabstand.
3. Ausgeloggt sind unter Settings derzeit `Privacy & Sharing` und `Profile` als Tabs sichtbar, obwohl dort keine personenbezogene Verwaltung möglich ist. Ausgeloggt sollen nur `App Areas` und `Navigation` sichtbar sein. `Privacy & Sharing` und `Profile` erst nach erfolgreichem Login anzeigen.
4. Die Freigaben selbst bleiben weiterhin standardmäßig aus.

Reale Produktionsbefunde haben Vorrang vor früheren grünen Tests.

---

# 1. Pflicht-Preflight

1. Mit `origin/main` synchronisieren.
2. Vollständig lesen: `CHATGPT.md`, `CODEX.md`, `CURRENT-TASK.md`, `VISION.md`, `CORE-1.0.md`, `CORE-1.0-READINESS.md`, `BACKUP-CONTRACT.md`, `ADMIN-UX-DECISIONS.md`, `UI-UX.md`, `Architecture.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `WORKFLOW.md`, `Install-README-Server.md` sowie alle Backup-/Restore-, Media-, Modul-Data-, Settings-/Profile- und Auth-Dateien.
3. Auftrag vollständig nach `CURRENT-TASK.md` übernehmen.
4. Keine CatchTrack-Fachlogik, kein GPS Pro, kein Marketplace, keine Community-/Messaging-Erweiterung.
5. Keine Secrets/PII ausgeben oder committen. `NEUTRAL_BACKUP_KEY` niemals anzeigen, zurückliefern, loggen oder in Artefakte schreiben.
6. Keine destruktive Produktionsaktion und insbesondere keinen Restore auf Produktion.

---

# 2. Backup-Vertrag von PARTIAL auf belastbar vollständig bringen

## Ziel

Neutral Core 1.0 braucht einen generischen Backup-/Restore-Vertrag, der **alle verwalteten persistenten Core- und Modul-/App-Daten** umfasst, die für einen funktionalen Wiederaufbau einer Installation erforderlich sind, ohne Code oder Secrets mitzunehmen.

## Muss gesichert werden

Mindestens:

- alle bereits garantierten 21 Coretabellen vollständig mit allen Zeilen/Spalten;
- alle vom Framework generisch deklarierten persistenten Modultabellen/Nutzdatentabellen;
- alle verwalteten persistenten User-/Moduldateien und Medienbinärdateien samt notwendiger Metadaten;
- Modulstatus/-konfiguration;
- User/Profile/Rollen/Permissions;
- Packages/Licenses/Device-Limits/Installation-Presence;
- Settings/Appearance/Systemkonfiguration, soweit nicht secret-only;
- Auditdaten gemäß bestehendem Vertrag;
- Migrations-/Setup-/Releasezustand soweit bereits als verwaltete Daten vorgesehen.

Nicht hart auf konkrete Modulnamen oder Tabellen wie `reference_notes_items` verdrahten. Der Mechanismus muss generisch aus Framework-/Manifest-/Schema-Verträgen ableiten können, welche Moduldaten persistiert und gesichert werden müssen.

## Bewusst ausgeschlossen

Weiterhin ausdrücklich nicht sichern:

- Anwendungscode und Release-Dateien;
- `.env`;
- Keys/Tokens/Passwörter/Secrets außerhalb bereits sicher gehashter Datenbankwerte;
- Logs;
- Caches;
- temporäre Sessions/Login-Drosselzustände;
- sonstige reproduzierbare Runtime-Artefakte.

Diese Ausschlüsse in `BACKUP-CONTRACT.md` eindeutig dokumentieren.

---

# 3. Datei-/Medienbackup sicher implementieren

Wenn verwaltete Dateien/Medien außerhalb der DB liegen:

- Backup muss deren Binärinhalt einschließen, nicht nur Metadaten;
- Pfade müssen logisch/relativ und installationsneutral sein, keine absoluten Hostpfade im Artefakt;
- keine Path Traversal, Symlink-Escape oder Arbitrary File Read/Write;
- Restore schreibt ausschließlich in erlaubte verwaltete Storage-Ziele;
- Datei- und DB-Restore müssen so koordiniert sein, dass bei Fehler kein inkonsistenter Halbzustand bleibt;
- vorhandene Dateien nicht still überschreiben, wenn der Vertrag dies nicht ausdrücklich vorsieht;
- Größenlimits, Prüfsummen/Integrität und Fehlerbehandlung definieren;
- Backup bleibt vollständig verschlüsselt; keine Browserentschlüsselung.

Wenn dafür ein Containerformat erweitert werden muss, Versionierung und Rückwärtskompatibilität sauber definieren.

---

# 4. Generische Moduldaten-Discovery

Der Core darf modulbezogene Nutzdatentabellen nicht vergessen.

Prüfe, wie Module persistente Daten deklarieren bzw. wie Core/Schema/Migrationen sie erkennen können.

Ziel:

- jedes installierte/aktive Modul kann seine persistenten Tabellen/Storagebereiche über einen generischen Vertrag registrieren;
- Backup exportiert diese vollständig;
- Restore validiert, dass erwartete deklarierte Moduldaten vollständig vorhanden sind;
- ein Backup darf nicht als vollständig gelten, wenn deklarierte persistente Moduldaten fehlen;
- unbekannte/inkompatible Modulstände müssen sicher und verständlich behandelt werden.

Keine CatchTrack-spezifische Sonderlogik.

---

# 5. Isolierter vollständiger Empty-Host-Restore

Nach Erweiterung einen reproduzierbaren vollständigen Restore in isolierter Umgebung durchführen:

1. leere separate Datenbank;
2. leeres separates verwaltetes Storage-Verzeichnis;
3. passender hostlokaler Testschlüssel;
4. Testdaten in allen garantierten Coretabellen;
5. Testdaten in mindestens einer generisch deklarierten Modultabelle;
6. mindestens eine echte binäre Testdatei/Media-Datei plus Metadaten;
7. Backup erstellen;
8. Zielumgebung leer aufsetzen;
9. Restore ausführen;
10. jede DB-Markierung und Datei bytegenau prüfen;
11. Login nach Restore prüfen;
12. Sessions müssen weiterhin neu beginnen und dürfen nicht wiederhergestellt werden;
13. falscher Key, manipuliertes Artefakt, fehlende Datei, fehlende Tabelle, falsche Schema-/Formatversion und Schreibfehler müssen ohne Teilzustand scheitern.

Kein Produktions-Restore.

Ergebnis danach ehrlich einstufen:

- `BACKUP CONTRACT COMPLETE`
- `BACKUP CONTRACT PARTIAL`
- `BACKUP DEFECT`

Core 1.0 Freeze nur bei `COMPLETE` plus realen Host-Gates.

---

# 6. Birthday-Persistenzfehler beheben

Realer Fehler:

- User wählt Day / Month / Year;
- Save meldet `Settings saved`;
- nach erneutem Öffnen von Profile sind alle drei Felder leer.

End-to-end prüfen:

`Profile UI → Settings/Profile API → PHP Service/Repository → DB → GET/Reload → UI hydration`

Mindestens prüfen:

- Payload-Feldname und ISO-Konvertierung;
- DB-Persistenz;
- API-Rückgabe nach Reload;
- Parsing von `YYYY-MM-DD`;
- Re-Hydration der drei Selects;
- optionales Löschen durch drei leere Felder;
- Schaltjahr/unmögliche Daten;
- keine Zeitzonenverschiebung.

Abnahme:

- Geburtstag speichern;
- Profile verlassen/neu öffnen;
- Browser reloaden;
- erneut einloggen;
- gespeichertes Datum bleibt korrekt vorausgewählt;
- drei leere Felder löschen das Datum zuverlässig.

Keine Erfolgsmeldung zeigen, wenn serverseitig nicht tatsächlich gespeichert wurde.

---

# 7. Birthday-UI kompakter gestalten

Auf iPad ist der Birthday-Block aktuell deutlich zu groß.

Verbindliche UX:

- Day / Month / Year in einer kompakten horizontalen Zeile, soweit Viewport es zulässt;
- Day schmal;
- Month ausreichend breit für ausgeschriebene lokalisierte Monatsnamen;
- Year schmal/mittel;
- deutlich weniger Padding/Leerraum als aktuell;
- Labels eindeutig;
- Hilfetext kurz und unaufdringlich;
- responsive auf iPhone/kleinen Android-Geräten sauber umbrechen statt quetschen;
- Touch-Ziele weiterhin ausreichend groß.

Keine Rückkehr zum nativen Kalender.

---

# 8. Settings-Tabs nach Loginzustand steuern

Ausgeloggter Zustand:

- sichtbar: `App Areas`, `Navigation`;
- **nicht sichtbar**: `Privacy & Sharing`, `Profile`.

Eingeloggter Zustand:

- sichtbar: `App Areas`, `Navigation`, `Privacy & Sharing`, `Profile`.

Anforderungen:

- keine reine CSS-Verdeckung; Routing/Navigation muss Authzustand respektieren;
- direkter Aufruf eines auth-gebundenen Settings-Unterbereichs ohne Login darf keine personenbezogenen Daten liefern;
- nach Logout verschwinden die Tabs unmittelbar;
- nach Login erscheinen sie ohne unnötigen Reload;
- Privacy-Freigaben bleiben default-off;
- bestehende anonyme App-Areas-/Navigation-Funktion nicht regressieren.

---

# 9. Regression

Nach Umsetzung vollständige Regression.

Mindestens:

- User/Admin Login;
- Logout/Login-Tab-Sichtbarkeit;
- App Areas und Navigation anonym;
- Privacy & Sharing/Profile nur authenticated;
- Birthday Save/Reload/Re-Login/Delete;
- Birthday responsive Layout;
- Packages/Licenses/Device Limits;
- Sessions/Installation-ID;
- Audit;
- GPS;
- Backup Storage Path;
- Backup Create/Download/Upload in Testumgebung;
- vollständiger Core+Module+File Backup/Restore in isolierter Umgebung;
- falscher Key / manipuliertes Backup / inkompatible Version / fehlende Komponenten;
- PHP-Lint;
- JS-Syntax;
- `git diff --check`;
- vollständige Tests;
- Production package.

---

# 10. Dokumentation / Freeze-Fortschritt

Mindestens aktualisieren:

- `CHATGPT.md`
- `BACKUP-CONTRACT.md`
- `CORE-1.0-READINESS.md`
- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- `ADMIN-UX-DECISIONS.md`
- `UI-UX.md`
- `Architecture.md`
- `Security.md`
- `API.md`
- `Database.md`
- `Functions.md`
- `Install-README-Server.md`

Keine automatische Freeze-Erklärung.

Offene reale Host-Gates wie Cron/Automatic Backup und weitere isolierte Install-/Move-Tests nur dann als bestanden markieren, wenn tatsächlich belegt.

---

# 11. Deployment / Übergabe

Gemäß `WORKFLOW.md`:

1. commit/push `main`;
2. CI/CodeQL/FTPS terminal abwarten;
3. `HEAD == origin/main`, sauberer Tree;
4. Deploymentrevision + `migrationsReady:true` prüfen;
5. Production-Smokes ausschließlich read-only;
6. **keinen Production-Restore**;
7. `CHATGPT.md` mit tatsächlichem Ergebnis und klarer Restliste aktualisieren.

Kurze Betreiber-Retestliste danach:

- ausgeloggt: nur App Areas + Navigation sichtbar;
- eingeloggt: Privacy & Sharing + Profile sichtbar;
- Geburtstag speichern, Profile neu öffnen/reloaden und Persistenz prüfen;
- Birthday-Layout auf iPad prüfen;
- Backup erstellen und herunterladen;
- Status des vollständigen Backup-Vertrags mitteilen;
- Automatic Backup/Cron bleibt separater Hosttest, falls noch nicht real bestätigt.

# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG

# Aktueller Auftrag

## Admin Operations Reality Check + Access/Permission Cleanup + Device Sessions

Dies ist bewusst ein größeres, zusammenhängendes Arbeitspaket aus dem realen Betreiber-iPad-Retest. Nicht nur Screens kosmetisch korrigieren: bestehende Verträge und reale Runtime prüfen, Root Causes beheben und Adminseiten an autoritative Datenquellen anbinden.

Synchronisiere zuerst vollständig mit `origin/main` und bewahre alle neueren Änderungen.

Lies vollständig mindestens:

- `WORKFLOW.md`
- `DOCUMENTATION.md`
- `CODEX.md`
- `CURRENT-TASK.md`
- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- `CHANGELOG.md`
- `CORE-1.0.md`
- `Architecture.md`
- `Security.md`
- `API.md`
- `Database.md`
- `Functions.md`
- `ModuleCreation.md`
- `CONNECTIONS.md`
- `UI-UX.md`
- Install-/Deployment-/Backup-Dokumentation
- alle relevanten Auth-, Session-, Role-/Permission-, Module-, Admin-, Settings-, Backup-, Maintenance-, Health-/Diagnostics-, Runtime-, Database-, Audit-, PHP-/Node-, Migration- und Testdateien.

Übernimm den Auftrag vollständig nach `CURRENT-TASK.md` und prüfe vor Implementierung:

`CODEX.md == CURRENT-TASK-Anforderungen`

P1 und P4 bleiben `LIVE BESTANDEN` und dürfen nicht regressieren.

---

# 1. Architekturentscheidung: User-App hat keine Admin-Funktionen

Die User-App und die Admin-UI sind getrennte Produktebenen.

Verbindlicher Vertrag:

- **User-App enthält keinerlei Admin-Funktionen.**
- Adminverwaltung, Userverwaltung, Rollen, Permissions, Sessions, Audit, Infrastruktur, Backups, Maintenance und Diagnostics existieren ausschließlich in der Admin-UI/API-Sicherheitsdomäne.
- Normale User-/Viewer-Rollen dürfen nicht deshalb Admin-Leserechte erhalten, nur damit die User-App funktioniert.
- User-App-Permissions sind ausschließlich fachliche App-/Modulrechte.
- Admin-Permissions sind ausschließlich administrative/Betriebsrechte.

Prüfe Code, Seed-Daten, Defaultrollen, APIs und Dokumentation gegen diesen Vertrag.

---

# 2. Permission-Audit und Defaultrollen bereinigen

Realer Befund: Systemrolle `viewer` besitzt aktuell u. a. `admin.read`, `audit.read`, `auth.read`, `role.read`, `session.read`, `settings.read`, `user.read` zusätzlich zu GPS-Rechten. Das passt nicht mehr zur getrennten Architektur.

## Auftrag

- Audit aller Core- und Modulpermissions.
- Klassifiziere semantisch mindestens in `admin/system` und `user-app/module`.
- Entferne Adminrechte aus normalen User-/Viewer-Defaultrollen, sofern keine fachlich zwingende serverseitige Notwendigkeit besteht.
- Keine Security nur über versteckte Navigation: Serverendpunkte müssen weiterhin Permissionchecks erzwingen.
- Prüfe `auth.read`/ähnliche Altkeys kritisch: nur behalten, wenn ein realer, dokumentierter Zweck existiert.
- Bestehende Installationen sauber migrieren; keine bloße Änderung nur neuer Seeds.
- Systemrollen weiterhin geschützt.
- Modulrechte bleiben deklarativ durch Core/Modulvertrag registriert.

Keine manuelle freie Permission-Erstellung im normalen Admin-UI einführen. Permissions entstehen aus Core und installierten Modulen; Admin weist sie Rollen zu.

---

# 3. Permission Catalog UX neu ordnen

Realer Befund: Permission-Key, Beschreibung und Scope laufen optisch zusammen und sind kaum lesbar.

Baue eine klare read-only Registry, bevorzugt Tabelle/Responsive Cards mit mindestens:

- Permission Key
- verständliche Beschreibung
- Bereich/Scope (`Admin`, `User-App`, ggf. `System`)
- Quelle (`Core` oder konkretes Modul)

Ergänze sinnvolle Suche/Filter, mindestens nach Admin/User-App und Core/Module, sofern auf Tablet/Mobile sauber.

Keine Delete-/Edit-Funktion für Registry-Keys im normalen Adminbereich.

---

# 4. Device Sessions statt kurzlebiger 12h-Login-Sessions

Zielvertrag des Produkts:

- Ein Nutzer meldet sich auf einem Endgerät grundsätzlich einmal an und bleibt angemeldet, bis Logout, Widerruf oder ein relevantes Security-Ereignis die Geräte-Session beendet.
- Eine App-/Browserinstallation entspricht einer Geräte-Session.
- Keine invasive Hardware-ID/Fingerprinting-Lösung.
- Neutral erzeugt eine kryptographisch zufällige Installations-/Device-ID und bindet die serverseitige Session daran.
- Geräte-Sessions sind serverseitig widerrufbar.
- Ein Zweitgerät erzeugt eine zweite Geräte-Session.
- Tarif/Paket kann künftig/maximal eine bestimmte Anzahl aktiver Geräte erlauben. Implementiere mindestens einen sauberen zentralen Limitvertrag/Hook bzw. vorhandenen quantitativen Vertrag; keine verstreuten Hardcodes.
- Bei erreichtem Limit nicht still zusätzliche Geräte zulassen. Liefere einen klaren, sicheren Fehler-/Managementpfad.
- Logout beendet die aktuelle Geräte-Session.
- Admin kann einzelne Geräte-Sessions widerrufen.
- Security-Ereignisse müssen alle Sessions eines Users widerrufen können.

WICHTIG: Persistenter Login bedeutet nicht „unwiderrufbares Cookie für immer“. Entwirf einen sicheren persistenten Geräte-Session-/Remember-Vertrag mit Rotation/Erneuerung soweit nötig, serverseitigem Widerruf und sicheren Cookieflags. Keine langlebigen Secrets in localStorage.

Bestehende 12h-Sessions sicher migrieren/ablösen. Dokumentiere Threat Model und Entscheidung in `Security.md`.

---

# 5. Session Overview auf Geräteverwaltung umbauen

Realer Befund: viele nahezu identische Sessions, rohe Issued/Expires-Zeiten, keine Geräteinformation.

Adminansicht soll mindestens zeigen:

- User
- Rolle nur soweit hilfreich
- Gerät/Installation verständlich identifizierbar
- Plattform/Browser soweit datenschutzfreundlich aus vorhandenen Requestdaten ableitbar
- erstellt/registriert
- letzte Aktivität
- Status
- `Current session` eindeutig markieren
- einzelne fremde/andere Geräte-Session widerrufen

Keine IP unnötig prominent anzeigen/speichern; nur falls Securityvertrag dies wirklich benötigt, datensparsam behandeln.

Abgelaufene/widerrufene Alt-Sessions nicht als endlose aktive Liste darstellen. Retention/Cleanup definieren.

---

# 6. Infrastructure & Monitoring Reality Check

Die folgenden realen Adminseiten zeigen aktuell teilweise Gerüste/Platzhalter trotz funktionierender Installation:

## Connections & Providers

Befund:

- `No providers configured`
- Current connection `unknown`
- gleichzeitig Formularplatzhalter wie `default-connection`, `neutral-app`, `https://api.example.com`.

Auditieren:

- Welchen realen Zweck hat Connections/Providers in der aktuellen Architektur?
- Reale Provider/Connections aus autoritativer Konfiguration anzeigen.
- Beispielwerte nicht als produktive Konfiguration darstellen.
- Falls ein Teil nur zukünftiger Vertrag ist: klar als nicht konfiguriert/optional darstellen statt falschen Runtimezustand zu suggerieren.
- Secrets niemals anzeigen.

## Server

Befund:

- reale Domain vorhanden, aber Status `unknown`, Reachable `—`, Framework metadata `{}`.

An reale Health-/Runtimequelle anbinden. `Test server` muss einen echten sicheren Test ausführen und verständliches Ergebnis liefern.

## Database

Befund:

- MySQL wird real produktiv genutzt, Admin zeigt dennoch Status `unknown`, Host/Name/User `—`, Setup `{}`.

An autoritativen DB-/Setupstatus anbinden. Nur sichere Metadaten anzeigen; niemals Passwort/Secrets. Keine interne Fehler-/Pfadleaks.

## Diagnostics

Befund:

- Status `unknown`
- Memory/Disk `N/A`
- Modules `0` trotz installiertem GPS
- Apps `0`
- Framework Summary `{}`.

Diagnostics muss reale, sichere Daten zeigen. Werte, die auf Shared Hosting nicht zuverlässig verfügbar sind, lieber als `Unavailable on this runtime` erklären statt falsche Nullen/N/A. Modulanzahl aus realer Registry. Keine vertraulichen Environmentdetails.

## Gemeinsamer Vertrag

Server, Database, Connections und Diagnostics dürfen keine vier konkurrierenden Wahrheiten besitzen. Nutze gemeinsame autoritative Services/DTOs, wo fachlich sinnvoll.

---

# 7. Maintenance & Updates fertigstellen

Realer Befund:

- Status `Operational`
- Version `—`
- Updated `—`
- Maintenance-Schalter + Reason vorhanden
- unklar, ob realer Wartungsmodus/Updatevertrag dahinterliegt.

## Maintenance Mode

Prüfe und implementiere/finalisiere:

- persistenter serverseitiger Maintenance-State;
- normale User-App wird bei aktivem Maintenance Mode kontrolliert blockiert bzw. erhält eine klare Wartungsseite/Antwort;
- Admin-UI bleibt für autorisierte Admins erreichbar;
- optionaler Wartungsgrund wird sicher/escaped angezeigt;
- Zeitpunkt und ggf. auslösender Admin intern nachvollziehbar;
- klarer Active/Inactive-Status;
- keine Lockout-Falle, die Admin selbst aussperrt.

## Release/Updates

- reale Framework-/Release-/Buildversion und letzter Deploy-/Updatezeitpunkt anzeigen, sofern aus versionierter Build-/Releasequelle belastbar ableitbar;
- `Operational` nicht statisch vortäuschen;
- wenn kein selbstständiger Update-Mechanismus existiert, keinen funktionierenden Updater suggerieren;
- UI ehrlich zwischen Release Information und tatsächlich unterstützten Updateaktionen unterscheiden.

---

# 8. Backup & Restore vollständig auditieren/finalisieren

Security-Vertrag erhalten: verwaltete Neutral-Tabellen, Sessions/Login-Throttling ausgeschlossen, AES-256-GCM, hostlokaler Schlüssel, Integritäts-/Format-/Tabellenprüfung vor Restore.

Realer Befund:

- Settings zeigt seit Beginn `Enable Automatic Backups` aktiviert und Interval `Daily`.
- Backup-Seite zeigt trotzdem `No backups available yet`.

Das ist zu klären und zu beheben: Scheduler/Trigger läuft nicht oder Liste ist nicht mit realen Backups verbunden.

## Funktionaler Zielumfang

- `Create backup` erstellt real verschlüsseltes Backup.
- Liste zeigt reale Backups mit Datum/Zeit, Größe, Format-/Schema-/Appversion soweit sinnvoll und Status.
- Download vorhandener Backups.
- Restore nach Integritäts-/Kompatibilitätsprüfung und deutlicher Bestätigung.
- Upload eines verschlüsselten Neutral-Backups + sichere Validierung + Restore.
- Delete für nicht benötigte Backups mit Bestätigung.
- automatische Backups funktionieren tatsächlich.
- `Daily` darf in der Entwicklungsphase Default/aktiver Wert bleiben.
- konfigurierbare Retention, damit Backups nicht unbegrenzt wachsen; wähle einen sicheren vernünftigen Default und dokumentiere ihn.
- Fehler des letzten automatischen Backups im Admin sichtbar, ohne Secrets.
- Restore invalidiert erforderliche Sessions und erzwingt sauberen Re-Login gemäß Sicherheitsvertrag.

Wenn Shared Hosting keinen permanenten Scheduler besitzt, entwirf einen realistischen host-kompatiblen Triggervertrag (z. B. cPanel Cron/geschützter serverseitiger Trigger) und dokumentiere die Betriebsanforderung. Keine Fake-Automatik nur über UI-Checkbox.

---

# 9. Audit Log: lesbar + Retention/Purge

Audit Log bleibt grundsätzlich append-only/unveränderlich; keine normalen Einzel-Edit/Delete-Aktionen.

Verbessere UX:

- lesbare Spalten/Responsive Darstellung;
- Details/JSON standardmäßig kompakt/einklappbar und formatiert;
- Suche/Filter nach Zeitraum, Eventtyp, Bereich, Status/User soweit sinnvoll;
- keine Secret-/PII-Leaks in Details.

## Retention

Adminfunktion für kontrollierte Bereinigung:

- z. B. älter als 30/90/180/365 Tage bzw. konfigurierbarer Retentionvertrag;
- deutliche Bestätigung;
- Bereinigungsaktion selbst auditieren, bevor alte Einträge entfernt werden;
- optionaler vollständiger Clear ausschließlich für expliziten Development/Test-Kontext, nicht als normale Produktionsaktion;
- keine Möglichkeit, gezielt belastende einzelne Auditzeilen unbemerkt zu entfernen.

---

# 10. System Settings konsistent machen

Prüfe die vorhandenen Settings:

- Application Name
- unveränderliche Application ID
- Log Level Debug/Info/Warning/Error
- Automatic Backups
- Backup Interval

Anforderungen:

- Produktionsdefault Log Level sinnvoll (`Info` oder `Warning`; begründe anhand bestehender Loggingarchitektur), nicht unbeabsichtigt dauerhaft Debug.
- Automatic-Backup-UI muss dem realen Backupvertrag entsprechen.
- Interval nur Optionen anbieten, die tatsächlich ausführbar sind.
- Retention ergänzen, wenn dies hier UX-seitig am sinnvollsten ist.
- keine Einstellungen anbieten, die keinerlei Runtimewirkung besitzen.

---

# 11. Sicherheit / Datenschutz / Migration

- Auth, CSRF, Sessiontrennung und P1 nicht schwächen.
- keine Secrets in Adminstatus, Logs, Diagnostics oder Backups.
- keine Hardwarefingerprints.
- sichere Cookieflags unter HTTPS.
- langlebige Geräteauth serverseitig widerrufbar und rotierbar.
- Migrationen für bestehende Sessions, Rollenpermissions und neue Betriebsdaten test-first.
- Backup/Restore muss neue relevante persistente Konfiguration berücksichtigen, aber Sessiongeheimnisse weiterhin ausschließen.
- Admin-UI bleibt die einzige Verwaltungsoberfläche.

---

# 12. Test-first / Abnahme

Ergänze fokussierte Tests und vollständige Regression mindestens für:

## Permissions

- Viewer/User besitzt keine Adminrechte per Default.
- Adminendpunkte bleiben serverseitig geschützt.
- Modulpermissions registrieren sich deklarativ.
- Catalog klassifiziert Quelle/Scope korrekt.

## Device Sessions

- persistenter Login über normalen bisherigen 12h-Zeitraum hinaus;
- Logout widerruft aktuelle Geräte-Session;
- Admin widerruft einzelne Geräte-Session;
- Geräte-ID zufällig/installation-local, kein Hardwarefingerprint;
- Limitvertrag blockiert zusätzliches Gerät kontrolliert;
- Current session markiert;
- keine Authsecrets in localStorage.

## Infrastructure

- Server/DB/Diagnostics liefern reale sichere Daten aus autoritativer Quelle;
- GPS-Modul wird korrekt gezählt;
- keine `{}`/`unknown`/falsche `0` bei tatsächlich ermittelbarem Zustand;
- unavailable Werte ehrlich behandelt;
- Beispiel-URLs nicht als aktive Produktionsverbindung.

## Maintenance

- User-App bei aktivem Maintenance blockiert;
- Admin bleibt erreichbar;
- Reason escaped;
- State persistent;
- Deaktivierung stellt Normalbetrieb wieder her.

## Backup

- create/list/download/delete;
- encrypted upload/restore;
- falsches/tampered Backup abgewiesen;
- Automatic Backup Trigger;
- Retention;
- Sessions ausgeschlossen;
- Restore-Sessionverhalten korrekt.

## Audit

- Details lesbar/escaped;
- Filter;
- Retention purge;
- Purge selbst auditiert;
- kein willkürliches Einzeldelete.

## Regression

- P1 und P4;
- Homepage Local-first/Warmstart ohne Loading/White-Flash;
- User/Admin Theme;
- Appearance V2;
- Navigation-Personalisierung;
- GPS;
- Login;
- Userverwaltung;
- Rollen;
- Module Lifecycle;
- Service Worker;
- Packaging/Base Path;
- FTPS/Smoke;
- Secret-/Artefaktprüfung.

---

# 13. Dokumentation

Nach tatsächlicher Implementierung alle betroffenen Verträge wahrheitsgemäß aktualisieren, insbesondere:

- `Security.md`
- `Architecture.md`
- `API.md`
- `Database.md`
- `Functions.md`
- `CONNECTIONS.md`
- `UI-UX.md`
- `ModuleCreation.md`
- Backup-/Install-/Deploymentdokumentation
- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- `CHANGELOG.md`

Dokumentiere klar, was vollständig implementiert ist und welche hostseitige Betriebsanforderung (z. B. Cron) eventuell noch vom Betreiber konfiguriert werden muss. Keine UI-Funktion als aktiv behaupten, wenn sie nur vorbereitet ist.

---

# 14. Abschluss gemäß WORKFLOW.md

Vollständig:

- fokussierte Tests;
- vollständige Test-Suite;
- PHP-Lint;
- JavaScript-Syntaxcheck;
- `git diff --check`;
- Produktionspaket;
- Secret-/Artefaktprüfung;
- Commit + Push nach `main`;
- `HEAD == origin/main`;
- Working Tree sauber;
- FTPS + CodeQL terminal abwarten;
- vollständigen Abschlussbericht in `CHATGPT.md` schreiben und nach `main` pushen;
- `CHATGPT.md` auf GitHub verifizieren
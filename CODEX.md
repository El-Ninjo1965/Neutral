# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG – ADMIN PACKAGE/DEVICE MANAGEMENT + PROFILE UX + AUDIT + FINAL-FREEZE-READINESS  
**Datum:** 2026-09-10

# Aktueller Betreiberstand

Der reale Betreiber-Retest auf iPad/Chrome nach dem Auth-P0-Fix ist positiv:

- **User `Tester` Login: LIVE BESTANDEN.**
- **Admin `Developer` Login: LIVE BESTANDEN.**
- User- und Adminsession bestehen parallel korrekt.
- Dashboard zeigt genau zwei aktive Sessions (Tester + Admin); keine Dubletten beobachtet.
- GPS: Position korrekt, Zoom/Pan korrekt, Google Maps korrekt, OpenStreetMap öffnet separat, Share funktioniert. **GPS-Basismodul im geprüften Umfang LIVE BESTANDEN.**
- Settings: App Areas, Navigation, Privacy & Sharing im Livecheck korrekt.
- Admin: Dashboard, Apps/Modules, Settings, Appearance, User Management, Roles/Permissions, Permission Catalog, Sessions, Connections/Providers, Server, Database, Maintenance/Updates, Diagnostics und Audit grundsätzlich funktionsfähig.
- Backup `Create Backup` ist erwartungsgemäß deaktiviert, solange Host-Key/ACL/Cron nicht konfiguriert sind. Das ist weiterhin **HOST ACTION REQUIRED**, kein Anlass für einen unsicheren Software-Bypass.
- User Management zeigt inzwischen z. B. `Devices 1 of 5`, aber der Betreiber kann das Limit weder beim Erstellen noch beim Bearbeiten eines Users einstellen.

Der Core ist damit deutlich näher am Freeze, aber die im Zielbild bereits dokumentierte Package-/License-/Device-Verwaltung ist in der Admin-UX noch nicht vollständig bedienbar. Zusätzlich wurden zwei konkrete UX-/Adminwünsche live festgestellt.

---

# 1. Pflicht-Preflight und Wahrheitsvertrag

1. Mit `origin/main` synchronisieren.
2. Vollständig lesen: `CHATGPT.md`, `CODEX.md`, `CURRENT-TASK.md`, `VISION.md`, `CORE-1.0.md`, `USER-ACCOUNT-LICENSE-MODEL.md`, `Architecture.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md`, `ModuleCreation.md`, `UI-UX.md`, `I18N.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `WORKFLOW.md`, `ROADMAP.md` falls vorhanden, sowie relevante Install-/Deploymentdokumentation.
3. Diesen Auftrag vollständig nach `CURRENT-TASK.md` übernehmen.
4. Die oben genannten neuen Betreiberbestätigungen wahrheitsgemäß in Status-/Todo-/Übergabedokumenten nachziehen; historische Fehlbefunde nicht löschen, aber nicht mehr als aktuellen Status ausgeben.
5. Bestehende Live-Fixes dürfen nicht regressieren, insbesondere Auth, Session-Deduplizierung, GPS, Settings, P1/P4, Passwort 8–25 ohne Leerzeichen und Offline-First.
6. Keine CatchTrack-Fachlogik, kein GPS Pro, kein Marketplace, keine Community und kein vollständiges Messaging bauen.
7. Keine Secrets oder personenbezogenen Produktionsdaten ausgeben. Kein Restore und keine destruktive Produktionsaktion während automatisierter Tests/Smokes.

---

# 2. Bereits dokumentierte Architektur anerkennen: Rollen ≠ Packages ≠ Licenses ≠ Devices

`VISION.md` und `USER-ACCOUNT-LICENSE-MODEL.md` enthalten den Zielvertrag bereits. Nicht neu erfinden.

Verbindliche Trennung:

- **Role** = Sicherheits-/Administrationsrolle (`Admin`, `Developer`, `User`, `Viewer`, ...).
- **Permission** = technische Einzelberechtigung.
- **Package / Entitlement** = funktionaler/kommerzieller Umfang: Module, Fähigkeiten und Limits.
- **License / Organization** = konkrete Zuweisung eines Packages an Kunde/Organisation mit Seats.
- **Device limit** = zulässige persistente Installationen pro User bzw. aus License/Package abgeleiteter Default mit kontrolliertem Override.

Keine festen Verkaufsnamen wie Silver/Gold/Platinum in den Core hardcoden. Der Administrator muss Package-Namen später selbst konfigurieren können.

---

# 3. Admin – Package Management vollständig bedienbar machen

Backend-/Schema-Grundlagen für Packages/Entitlements existieren bereits, aber der Betreiber findet im Admin keine nutzbare Package-Verwaltung.

Implementiere eine neutrale Admin-Fläche **Packages / Entitlements**.

Mindestens:

- Packages auflisten;
- Package anlegen;
- Package bearbeiten;
- Package aktiv/inaktiv setzen, sofern der bestehende Datenvertrag dies unterstützt;
- Package nicht destruktiv entfernen, solange aktive Licenses/User daran hängen; klare sichere Regel verwenden;
- frei konfigurierbarer Name und optional kurze Beschreibung;
- Module pro Package konfigurieren als:
  - `available`
  - `locked` (sichtbar, aber nicht nutzbar)
  - `hidden`
- generische Capability-/Permission-nahe Entitlements nur dort anbieten, wo dies architektonisch bereits vorgesehen ist; keine Role-Permissions durch Package ersetzen;
- quantitative Limits konfigurierbar, mindestens Default **Allowed Devices per User**;
- `unlimited` sauber auswählbar und serverseitig autoritativ;
- keine CatchTrack-spezifischen Packagefelder.

Admin-UX muss mobile/tablet/desktop funktionieren und vorhandene UI-Komponenten/Tokens nutzen.

---

# 4. Admin – License / Organization Management sichtbar und bedienbar machen

Implementiere eine neutrale Admin-Fläche **Licenses / Organizations** auf Basis des vorhandenen Datenmodells.

Mindestens:

- License/Organization auflisten;
- anlegen/bearbeiten;
- Package zuweisen/wechseln;
- Seat-Limit konfigurieren (`unlimited` möglich, sofern Vertrag erlaubt);
- optionalen License-/Organization-Manager zuweisen;
- Anzahl verwendeter Seats anzeigen;
- zugeordnete User anzeigen;
- Package-/License-Herkunft der Device-Limits nachvollziehbar darstellen;
- Status Active/Blocked/Inactive nur soweit im bestehenden Lizenzvertrag fachlich sinnvoll; keine unnötige Statusinflation;
- fremde/gescoped Verwaltung weiterhin serverseitig schützen.

**Begriffstrennung in der UI:** Seats sind Nutzerplätze einer Organisation; Devices sind Installationen eines Users. Nicht als denselben Zähler darstellen.

Beispiel, das der generische Core unterstützen muss: Organisation mit 50 Seats, Package mit 1 Device pro User; einzelne User können, wenn Admin dies ausdrücklich erlaubt, einen kontrollierten Device-Override erhalten.

---

# 5. User Management – Package/License und Allowed Devices verwalten

Aktueller Livebefund: Userliste zeigt `1 of 5`, aber weder `Create New User` noch `Edit User` erlaubt die Verwaltung.

## Create New User

Bestehende Pflichtfelder bleiben:

- Username
- Initial Password
- Role

E-Mail/Display Name bleiben optional.

Ergänze je nach Scope sinnvoll:

- Package/License-Zuweisung bzw. License-Auswahl;
- **Allowed Devices** mit klarer Herkunft:
  - Package/License Default verwenden;
  - oder expliziter User-Override;
  - `unlimited` nur bei entsprechender Adminberechtigung/Architektur.

## Edit User

Mindestens anzeigen/bearbeiten:

- Role;
- Status Active/Blocked;
- optionale E-Mail/Display Name soweit bereits vorgesehen;
- zugewiesene License/Organization und daraus resultierendes Package;
- Allowed Devices und Herkunft (`Package default`, `License default`, `User override`, `Unlimited`);
- Used Devices read-only als Istwert;
- Link/Drill-down zu den tatsächlichen Installationen mit Revoke-Funktion.

Änderung eines Limits darf bestehende Installationen nicht stillschweigend löschen. Wenn ein Limit unter die aktuell verwendete Zahl gesenkt wird, klare sichere Policy implementieren und dokumentieren: vorhandene Sessions/Installationen nicht blind vernichten; weitere Aktivierung blockieren bzw. Admin explizit revoken lassen.

Server bleibt Autorität. UI-only-Checks reichen nicht.

---

# 6. Package-/Device-Vertrag end-to-end testen

Echte Integrationstests, nicht nur Source-RegEx.

Mindestens:

1. Package A Default Devices = 1.
2. User unter A ohne Override erhält Allowed = 1.
3. zweites Gerät → spezifisch blockiert.
4. Revoke erstes Gerät → zweites darf aktiviert werden.
5. User Override = 3 → drei Installationen zulässig.
6. Override entfernen → Default greift wieder.
7. `unlimited` funktioniert.
8. Packagewechsel aktualisiert effektive Entitlements/Limits ohne Role-Permissions zu verändern.
9. `available/locked/hidden` funktioniert aus echter Package-Zuweisung.
10. License Seat-Limit verhindert zusätzlichen User, ohne bestehende User zu beschädigen.
11. License Manager bleibt strikt im eigenen Scope.
12. User/Admin-Login und Session-Deduplizierung bleiben regressionsfrei.

---

# 7. User Profile – Geburtstag ohne freie Kauderwelsch-Eingabe

Livewunsch: `Birthday` soll nicht als freie Textzeile erscheinen.

Implementiere eine robuste, mobilefreundliche Datumsauswahl.

Bevorzugt:

- auf Browsern mit gutem nativen Date-Picker: `input type="date"` mit sauberer lokalisierter Bedienung;
- falls die vorhandene UI/Browserunterstützung auf iPad/Chrome unzuverlässig ist: klarer Fallback mit **Tag / Monat / Jahr**-Auswahlfeldern.

Vertrag:

- keine beliebige Texteingabe;
- serverseitig weiterhin echtes gültiges Datum prüfen, nicht nur Regex `YYYY-MM-DD`;
- unmögliche Daten wie 31.02. ablehnen;
- Leap-Year korrekt;
- optionales Feld, kann gelöscht werden;
- gespeicherter kanonischer Wert bleibt ISO-Datum ohne Zeitzonenverschiebung;
- Privacy-Freigabe für Geburtstag bleibt default-off und unverändert.

Auf iPad/Chrome real gut bedienbar gestalten.

---

# 8. Audit Log – „Delete All“ als kontrollierte Adminaktion

Aktuell existieren Retention-Aktionen für 30/90/180/365 Tage. Ein vollständiges Clear ist im vorhandenen Code absichtlich nur Development/Test erlaubt. Der Betreiber möchte im produktiven Adminbereich zusätzlich **Delete All**.

Implementiere dies nicht als leicht versehentlich auslösbaren Retention-Wert, sondern als separate hochkritische Aktion.

Vertrag:

- nur mit einer **eigenen expliziten Permission**, z. B. `audit.clear`/vergleichbar; nicht automatisch aus bloßem `audit.read` ableiten;
- System-Admin kann diese Permission über das bestehende Rollen-/Permissionmodell vergeben;
- separate Schaltfläche `Delete All` neben/unter Retention, nicht als versteckte 0-Tage-Semantik;
- deutliche Bestätigung vor Ausführung, mindestens zweite Bestätigung; gerne Eingabe eines kurzen Bestätigungswortes wie `DELETE`/lokalisiert, wenn konsistent mit UI;
- CSRF-geschützt, serverseitig autorisiert;
- löscht alle **vorherigen** Audit-Einträge;
- danach wird ein neuer Audit-Eintrag erzeugt, der dokumentiert, dass der Auditbestand vollständig geleert wurde, durch welchen Actor-ID/Username soweit nach bestehendem sicheren Auditvertrag zulässig und mit Zeitpunkt. Damit bleibt die Löschaktion selbst nachvollziehbar, ohne alte Einträge zu erhalten;
- keine Secrets/Request-Bodies mit sensitiven Inhalten loggen;
- API liefert Anzahl gelöschter Einträge zurück;
- Retention 30/90/180/365 bleibt erhalten.

Dokumentiere die bewusste Änderung der früheren Production-Sperre in `Security.md`/`API.md` und teste explizit Permission denied / CSRF / success.

---

# 9. Live-bestätigte Bereiche nicht erneut umbauen

Nur bei notwendiger Regressionkorrektur anfassen:

- User-/Admin-Auth;
- Session-Deduplizierung;
- GPS-Projektion/Zoom/Pan/Google/OSM/Share;
- Settings App Areas/Navigation/Privacy & Sharing;
- Dashboard/Modules/Appearance/Permission Catalog/Sessions/Server/Database;
- Passwortpolitik 8–25, keine Leerzeichen.

Die neuen Arbeiten sollen vorhandene stabile Verträge konsumieren, nicht neu erfinden.

---

# 10. Final-Freeze-Readiness-Audit gegen CORE-1.0.md

Nach Umsetzung der obigen Punkte **nicht automatisch den Core einfrieren**. Führe stattdessen einen ausführbaren Gap-Audit gegen jede Releaseanforderung in `CORE-1.0.md` durch.

Für jede Anforderung klassifizieren:

- `VORHANDEN + TEST/BELEG`
- `DEVICE RETEST REQUIRED`
- `HOST ACTION REQUIRED`
- `FEHLT`

Besonders prüfen:

### Installation / Portabilität

- Neuinstallation auf leerem kompatiblem Shared Hosting;
- Setup, DB, Migration, Erstbenutzer;
- reproduzierbares Produktionspaket;
- Updatepfad;
- Backup/Restore-/Umzugsvertrag.

Keine echten destruktiven Produktions-Restoretests ausführen. Wenn dafür isolierte CI-/Testumgebung existiert, dort testen; sonst sauber als externe Abnahme markieren.

### Client / Offline

- stabile öffentliche Coreverträge;
- Offlinezustand und lokale Speicherung;
- keine Secret-/Rechteentscheidung im Client;
- responsive zentrale UI.

### Server / Admin

- Auth, Sessions, CSRF, Autorisierung;
- User, Roles, Permissions;
- Packages/Licenses/Devices nach diesem Auftrag;
- Modules/Settings/Audit;
- DB/Migrationsstatus;
- Login-Throttle;
- Cookie/HTTPS.

### Module

- Manifest/Kompatibilität;
- Discovery → Installation inactive → Activation → Deactivation → Update → Uninstall;
- Permissions/Limits;
- modulbezogene Serverrouten ohne zentralen fachlichen Routerumbau;
- SQL-Migration/Rollbackstrategie;
- deklarative Adminsettings;
- Provideradapter;
- mindestens zwei fachlich verschiedene Referenzmodule (`gps`, `reference-notes`) tatsächlich ausreichend als Nachweis.

### Qualität

- vollständige positive/negative Tests;
- keine bekannten Critical/High Security-Gaps;
- Dokumentation konsistent.

Wenn ein **echter generischer Core-Blocker** gefunden wird, behebe ihn in diesem Lauf nur dann, wenn die Lösung klar, klein und aus dem bestehenden Releasevertrag zwingend folgt. Keine spekulativen Zukunftshooks und keine Fachfeatures ergänzen. Größere/unklare Restpunkte ausdrücklich in `CHATGPT.md` und `TODO.md` als nächsten Blocker dokumentieren, statt sie zu verstecken.

---

# 11. Dokumentation nach realem Betreiber-Retest korrigieren

Mindestens aktualisieren, soweit betroffen:

- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- `CURRENT-TASK.md`
- `CHATGPT.md`
- `API.md`
- `Database.md`
- `Security.md`
- `Architecture.md`
- `Functions.md`
- `UI-UX.md`
- `USER-ACCOUNT-LICENSE-MODEL.md` nur wenn Vertrag präzisiert werden muss
- `CORE-1.0.md` nur für belegte Freeze-Readiness, keine vorzeitige BESTANDEN-Markierung.

Explizit festhalten, dass User-Login, Admin-Login und GPS-Basis inzwischen real bestätigt wurden.

---

# 12. Verifikation, Deployment und Übergabe

1. Test-first für neue Funktionen.
2. Vollständige Regression.
3. PHP-Lint, JS-Syntax, `git diff --check`.
4. Produktionspaket + Secret-/Artefaktprüfung.
5. Commit/push `main`.
6. CI/CodeQL/FTPS terminal abwarten.
7. Deploymentrevision und `migrationsReady:true` prüfen.
8. Keine manuellen Produktions-SQL-Eingriffe; nötige Schemaänderungen über checksummed/idempotente Migrationen.
9. Read-only Produktionssmokes für neue API-Flächen, soweit ohne Produktionsmutation möglich.
10. `CHATGPT.md` mit vollständigem Ergebnis, gefundenen Restlücken und einer kurzen Betreiber-Retestliste schreiben.

## Betreiber-Retestliste nach diesem Lauf mindestens

- Packages/Entitlements Adminseite;
- License/Organization anlegen/bearbeiten und Package zuweisen;
- User Create/Edit: Package/License + Allowed Devices/Override;
- Device Drill-down/Revoke;
- Profile Birthday Date-Picker bzw. Tag/Monat/Jahr;
- Audit `Delete All` mit Permission + Bestätigung;
- kurzer Auth-/Session-/GPS-Regressioncheck;
- alle vom Freeze-Audit als `DEVICE RETEST REQUIRED` identifizierten Punkte.

**Kein `CORE 1.0 BESTANDEN` ohne die im Releasevertrag verlangte Evidenz und die noch nötigen Betreiber-/Host-Abnahmen.**

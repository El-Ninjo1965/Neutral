# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** P0 – PRODUKTIONSLOGIN WEITERHIN DEFEKT NACH ZWEI FEHLGESCHLAGENEN FIXVERSUCHEN  
**Datum:** 2026-09-09

# Aktueller Auftrag

## Ausschließlich den realen User- und Admin-Loginfehler vollständig diagnostizieren und beheben

Der Betreiber hat den zuletzt deployten Stand `151c4747f7363688ef89e0f911f055653dbe63dc` nach erfolgreichem CI/FTPS erneut **real auf demselben iPad mit Google Chrome** getestet.

### Verbindlicher Livebefund ca. 20:50 Asia/Manila

- User-Login mit bestehendem Tester-Account: **weiterhin** `Authentication service temporarily unavailable.`
- Vier reale User-Loginversuche: gleicher Fehler.
- Admin-Login mit bestehendem Developer/Admin-Account: **weiterhin** `Authentication service temporarily unavailable.`
- GPS wurde parallel geprüft: Kartenposition ist jetzt korrekt. Dieser Fix ist positiv bestätigt und darf nicht regressieren.
- Settings `App Areas`, `Navigation`, `Privacy & Sharing` wirken im Livecheck korrekt. `Profile` kann wegen defektem Login noch nicht geprüft werden.

Damit ist die im letzten Bericht behauptete Login-Root-Cause (`SchemaMigrator::migrate()`/`GET_LOCK` im Loginpfad) **nachweislich nicht die vollständige Ursache**. Nicht erneut dieselbe Hypothese als Abschlussgrund verwenden, sofern sie nicht mit neuer konkreter Produktionsevidenz belegt wird.

**Dieser Lauf hat nur P0 Auth zum Ziel.** Keine weiteren Features, kein Core-Freeze, kein GPS-Umbau, keine License-/Media-Erweiterung. Erst Login reparieren.

---

# 1. Arbeits- und Wahrheitsvertrag

1. Mit `origin/main` synchronisieren.
2. Vollständig lesen: `CHATGPT.md`, `CODEX.md`, `CURRENT-TASK.md`, `WORKFLOW.md`, `Architecture.md`, `Security.md`, `API.md`, `Database.md` und sämtliche Auth-/Bootstrap-/Router-/Client-/Rewrite-/Deploymentdateien.
3. Neuen P0-Auftrag nach `CURRENT-TASK.md` übernehmen.
4. Frühere grüne Unit-/Integrationstests und frühere Root-Cause-Berichte sind **keine Abnahme**, weil Produktion sie widerlegt.
5. Vor einer Änderung muss die **konkrete Exception/Fehlerquelle hinter `Authentication service temporarily unavailable.`** lokalisiert werden. Nicht nur den sichtbaren Text ändern.
6. Keine Passwörter, Tokens, Session-Cookies, DB-Credentials oder sonstige Secrets loggen/ausgeben/committen.
7. Keine Produktionsdaten verändern, keine Testuser in Produktion erzeugen, kein Restore, kein manuelles Produktions-SQL.
8. Sichere read-only Produktionsdiagnose ist erlaubt und ausdrücklich erforderlich, soweit sie ohne Secrets/PII möglich ist.
9. Kein Abschluss `LIVE BESTANDEN`. Nach Deployment bleibt `DEVICE RETEST REQUIRED`, bis der Betreiber selbst User- und Adminlogin bestätigt.

---

# 2. Fehlertext bis zur tatsächlichen Quelle rückwärts verfolgen

Suche jede Stelle, die exakt oder indirekt `Authentication service temporarily unavailable.` erzeugen kann.

Für **jeden** Pfad dokumentieren:

- welche Exception/Response dort abgefangen wird;
- welcher HTTP-Status entsteht;
- ob der Text serverseitig oder clientseitig erzeugt wird;
- ob User und Admin denselben Pfad verwenden;
- welche darunterliegende Exception derzeit verborgen wird.

Der generische Catch darf die Diagnose nicht dauerhaft verschlucken. Implementiere, falls nötig, eine **sichere technische Fehlerklassifikation/-ID** für Authfehler, die Ursache/Kategorie diagnostizierbar macht, ohne Secrets oder Credentialdetails an den Browser auszugeben. Beispiel: stabile Fehlercodes für DB unavailable, schema unavailable, session persistence failed, server configuration unavailable etc. Keine Stacktraces/SQL/Secrets an Clients.

---

# 3. Reale Produktionskette end-to-end prüfen

Nicht nur Repositorycode betrachten. Prüfe die tatsächlich deployte Kette:

## User

`Produktions-URL → ausgelieferte User-Shell → geladene JS-Dateien → ApiClient → POST Login → Rewrite → PHP Router → Auth-Service → DB/Userlookup → Password verify → Sessionpersistenz → Response/Cookies`

## Admin

`Produktions-Admin-URL → admin.php/Auth-Shell → geladene JS-Dateien → ApiClient → Admin-Scope → POST Login → Rewrite → PHP Router → Auth-Service → DB/Userlookup → Password verify → Role/Permission resolution → Admin-Sessionpersistenz → Response/Cookies`

Prüfe ausdrücklich:

- HTTP-Status und Response-Envelope des produktiven Login-Endpunkts **ohne gültige Credentials preiszugeben**;
- ob der Endpoint überhaupt den erwarteten aktuellen Code erreicht;
- Rewrite von `/api`, `/api/v1`, User- und Adminpfaden;
- PHP-Fatal/TypeError/RuntimeException vor/innerhalb Login;
- DB-Verbindung und Schema-Readiness read-only;
- Migration `0005`/`0006` und tatsächliche Tabellen-/Spaltenkompatibilität;
- ob bestehende Produktionsuser nach Schemaänderungen noch lesbar sind;
- nullable E-Mail/Username-/Status-/Role-Migrationen;
- Password-Hasher-Vertrag mit bestehenden Hashes; **keine Passwörter lesen oder ausgeben**;
- UserService/AuthService Rückgabestruktur;
- Rollen-/Permissionauflösung für Tester und Admin;
- Sessiontabellen, Spalten, Constraints und INSERT/UPDATE-Vertrag;
- Installation-ID/Device-Limit-Pfad: kann ein bestehender User wegen neuer License-/Device-Logik eine Exception werfen, die als 503 maskiert wird?;
- Audit-/Presence-Schreibvorgänge im Login: kann ein nachgelagerter INSERT/UPDATE den gesamten Login abbrechen?;
- CSRF-/Cookie-Erzeugung;
- PHP-Version/Extensions und Produktionskonfiguration;
- tatsächliche Deploymentrevision und Cache/Service Worker.

**Wichtig:** Weil User und Admin denselben sichtbaren Fehler haben, zuerst die gemeinsamen Serverpfade untersuchen, aber anschließend beide Shells separat verifizieren.

---

# 4. Diagnose ohne Kenntnis der Betreiberpasswörter

Der Agent darf nicht verlangen, dass der Betreiber Passwörter in GitHub/CODEX/Logs schreibt.

Baue/verwende stattdessen sichere Nachweise:

- read-only DB-/Schema-/Userstrukturtests ohne Passwortwerte;
- Testdaten ausschließlich in isolierter Testdatenbank;
- Auth-Service-Integration mit Testhashes lokal/CI;
- produktive HTTP-Probes mit absichtlich ungültigen Dummy-Credentials dürfen nur prüfen, ob der Endpoint korrekt **401 Invalid credentials** statt **503 service unavailable** liefert;
- produktive Health-/Readiness-/Schema-Smokes;
- falls serverseitiges Error-Logging erforderlich ist: nur Fehlerklasse/Code und Request-Correlation-ID, keine Credentials, Cookies, SQL-Parameter oder PII.

Ein absichtlich falscher Login muss in Produktion zuverlässig einen normalen 401-Vertrag erreichen. Wenn bereits Dummy-Credentials 503 erzeugen, ist der Fehler vor/innerhalb des Credentialpfads reproduziert und muss dort behoben werden.

---

# 5. Zielvertrag User-Login

Nach Fix muss code-/serverseitig gelten:

- Loginendpoint erreichbar;
- absichtlich falsche Credentials → normaler 401/Invalid-Credentials-Vertrag, niemals generischer 503;
- bestehender gültiger User kann nach Betreiber-Retest einloggen;
- User-Session und CSRF werden korrekt erzeugt;
- Installation-ID bleibt stabil;
- bestehende Session-Deduplizierung bleibt erhalten;
- Device-/License-Limit wirft nur den dafür vorgesehenen spezifischen 409-Vertrag, nicht Auth-503;
- Logout/Login derselben Installation erzeugt keine parallele aktive Session.

---

# 6. Zielvertrag Admin-Login

Nach Fix muss code-/serverseitig gelten:

- Adminloginendpoint erreichbar;
- absichtlich falsche Credentials → normaler 401-Vertrag;
- bestehender autorisierter Admin kann nach Betreiber-Retest einloggen;
- User- und Adminsession bleiben getrennt;
- Adminrolle/-permissions werden korrekt aufgelöst;
- Access-denied/Reauth-Vertrag bleibt erhalten;
- Device-ID/Deduplizierung bleibt erhalten;
- kein direkter Sonder-`fetch`, der den gemeinsamen ApiClient-Vertrag umgeht.

---

# 7. Tests müssen den bisherigen Blindspot schließen

Die bisherigen Tests waren grün, obwohl Produktion zweimal hintereinander nicht loginfähig war. Ergänze deshalb Tests, die genau diesen Blindspot adressieren.

Mindestens:

1. PHP-Router mit realistischem MySQL-Schema der aktuellen Migrationen.
2. User-Login mit existierendem Testuser + aktuellem Hash → 200.
3. Admin-Login mit existierendem Admin + Rollen/Permissions → 200.
4. falsche Credentials User/Admin → 401, nicht 503.
5. bestehender Legacy-/vor-0005-Userdatensatz nach Migration weiterhin loginfähig.
6. Presence-/Device-/License-/Audit-Nachschritte dürfen gültigen Login nicht wegen optionaler Telemetrie/Metadaten in generischen 503 verwandeln; kritische Sessionpersistenz darf dagegen sauber klassifiziert fehlschlagen.
7. Device-Limit → spezifisch 409 `DEVICE_LIMIT_REACHED`.
8. User- und Admin-Shell laden tatsächlich den deployten ApiClient und treffen den kanonischen produktiven Pfad.
9. Produktionspackage enthält exakt die für Login benötigten Assets/Rewrite-/PHP-Dateien.
10. Regression Session-Deduplizierung.

Keine reine Regex-/Sourceprüfung als Abnahme.

---

# 8. Deployment und Produktionssmoke

Nach Root-Cause-Fix:

1. vollständige Tests, PHP-Lint, JS-Syntax, `git diff --check`;
2. Produktionspaket + Secret-/Artefaktprüfung;
3. commit/push `main`;
4. CI/CodeQL/FTPS terminal abwarten;
5. Deploymentrevision verifizieren;
6. read-only Schema-/Readiness-Smoke;
7. **entscheidend:** produktiver Auth-Smoke mit absichtlich ungültigen Dummy-Credentials muss für User und Admin den erwarteten **401** liefern und darf nicht `Authentication service temporarily unavailable.`/503 liefern;
8. keine echten Betreibercredentials automatisiert verwenden;
9. `CHATGPT.md` muss konkrete Root Cause, betroffene Exception/Klasse, Fix und Smoke-Evidenz dokumentieren;
10. `CURRENT-TASK.md` bleibt bezüglich realem Login auf `DEVICE RETEST REQUIRED`.

---

# 9. Betreiber-Retest nach Deployment

Nur diese zwei Punkte zuerst anfordern:

1. User `Tester` real einloggen.
2. Admin `Developer` real einloggen.

Erst wenn beide vom Betreiber bestätigt sind, weitere Profile-/License-/Media-Retests fortsetzen und über Core-Freeze sprechen.

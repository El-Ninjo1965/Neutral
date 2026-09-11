# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** KRITISCHER LIVE-REGRESSION-RECOVERY – KEIN CORE FREEZE  
**Datum:** 2026-09-11

# Priorität

Der zuletzt deployte Batch `cf4513b329aabc4e12c79c46cf52e7ea205e198c` hat im Betreiber-Livetest eine **kritische Auth-/Session-Regression** erzeugt. Die vorher geplante Funktionsabnahme wird gestoppt. Zuerst muss ein stabiler Login-/Session-Baselinezustand wiederhergestellt werden.

Nicht zehn sichtbare Adminfehler einzeln patchen: Die Screenshots zeigen überwiegend denselben zentralen Zustand `Not authenticated`.

## Vor Arbeitsbeginn

1. `/workspace/Neutral`, `main`, `origin/main`, sauberer Tree.
2. `WORKFLOW.md`, `CHATGPT.md`, `CURRENT-TASK.md`, `STATUS.md`, `Security.md`, `API.md`, `Database.md`, `USER-ACCOUNT-LICENSE-MODEL.md`, `UI-UX.md` und diesen Auftrag lesen.
3. Diff **vor/nach `cf4513b3`** besonders für Auth, Sessions, Cookies, `expires_at`, Login, User-App und Admin-Session analysieren.
4. Root Cause zuerst beweisen. Keine weiteren großen Auth-Abstraktionen bauen.
5. Kein Production Restore, keine Secrets, kein Core Freeze.

---

# 1. KRITISCH: User Login ist live ohne Funktion

## Betreiber-Livebefund

Auf iPad/Chrome normal und Inkognito:

- User-Login-Seite wird angezeigt.
- Username/Passwort können eingegeben werden.
- Klick auf `Login` führt zu keinem erfolgreichen Login.
- Reload zeigt weiterhin Login; es wurde keine gültige User-Session hergestellt.
- Damit sind Profile/Privacy und weitere User-Abnahmen derzeit blockiert.

## Auftrag

End-to-end prüfen:

- Submit-/Click-Handler des User-Loginformulars;
- Request tatsächlich gesendet?;
- `/auth/login` Route, Response und Fehlerpfad;
- Cookie-Erzeugung/-Attribute;
- PHP-Session-ID / DB-Session-Zuordnung;
- nullable `expires_at` Migration `2026_09_11_0009`;
- Sessionvalidierung und `/auth/me`;
- User-/Admin-Scope-Trennung;
- Clientzustand nach erfolgreichem Login;
- Service Worker nur wenn nachweislich beteiligt.

**Ziel:** Ein normaler User muss sich wieder zuverlässig einloggen können. Erst danach Session-Persistenz weiter testen.

Wenn der neue Persistent-Session-Vertrag die Regression verursacht, zuerst eine **kleine sichere Korrektur oder Rücknahme des fehlerhaften Teils** vornehmen. Stabiler Login hat Vorrang vor der neuen Persistenzfunktion.

---

# 2. KRITISCH: Admin zeigt global `Not authenticated`

## Betreiber-Livebefund

Nach dem Deployment zeigen zahlreiche Adminseiten denselben Fehlerzustand:

- Licenses / Organizations → `Not authenticated`
- Packages / Entitlements → `Not authenticated`
- Sessions → `Not authenticated`
- Roles → `Not authenticated`
- Permission Catalog → `Not authenticated`
- App Modules → `Not authenticated`
- System Modules → `Not authenticated`
- Updates/Maintenance teilweise `Not authenticated`
- andere Seiten laden nur teilweise/inkonsistent.

Das ist als **zentrale Auth-/Session-Regression** zu behandeln, nicht als acht unabhängige Viewfehler.

## Auftrag

- Prüfen, ob der letzte User-Session-Umbau Admin-Cookie/Sessionstart/Scope/Expiry oder Auth-Requestverhalten beeinflusst hat.
- Admin-Login und Admin-Session gegen den letzten funktionierenden Stand vor `cf4513b3` vergleichen.
- Admin-Scope darf durch persistenten User-Session-Vertrag **nicht** verändert werden.
- Nach erfolgreichem Admin-Login müssen alle geschützten Adminendpoints wieder denselben gültigen Admin-Sessionkontext erhalten.
- Keine UI-Fallbacks bauen, die `Not authenticated` verstecken.

**Ziel:** Ein Admin-Login → eine stabile Admin-Session → alle berechtigten Adminseiten funktionieren wieder.

---

# 3. Sicherheitsmodell vereinfachen, nicht abschalten

## Produktentscheidung

Neutral ist ein allgemeines App-Framework, kein Banking-System. Sicherheitsmechanismen sollen robust, nachvollziehbar und dem Risiko angemessen sein; unnötige Auth-Komplexität darf weder UI noch Performance dominieren.

Verbindlicher Zielrahmen:

### Öffentliche/anonyme App-Funktionen

- Module/Funktionen, die ausdrücklich anonym freigegeben sind (z. B. GPS gemäß Modul-/Visibilityvertrag), dürfen **nicht auf User-Authentifizierung warten**, bevor Navigation/Inhalt erscheint.
- Auth-/Sessionabgleich darf öffentliche UI nicht unnötig blockieren.
- Keine Permission umgehen: anonym sichtbar nur, wenn Manifest/Serververtrag dies ausdrücklich erlaubt.

### Normaler User

- Einmal normal einloggen.
- Session soll danach praktisch persistent bleiben bis Logout/Revoke/Sicherheitsinvalidierung.
- Keine wiederholte Re-Authentifizierung im normalen Appbetrieb.
- Umsetzung so einfach wie möglich; keine komplexe mehrschichtige Client-Authmaschine.

### Admin

- Adminbereich behält **eigenen** Login, eigene Session und serverseitige RBAC/CSRF-Prüfung.
- Keine dauernden Re-Auths während einer gültigen Admin-Session.
- Der Betreiber plant für reale Produktinstallationen zusätzlich einen Webserver-Schutz des Admin-Verzeichnisses (z. B. HTTP Basic Auth/.htaccess). Dieser externe Schutz ist **zusätzliche Defense-in-Depth**, ersetzt aber nicht die interne Admin-Identität/RBAC.
- Entwicklungs-/Staginginstallation bleibt derzeit absichtlich ohne diesen externen Schutz, damit Codex/Tests/Deployment zugreifen können.

### Login-Schutz

- Bestehende Login-Throttling-/Fehlversuchsbegrenzung beibehalten bzw. einfach und klar halten.
- Keine unnötigen Sicherheitslayer hinzufügen, die keinen konkreten Threat-Vertrag bedienen.

**Wichtig:** Nicht als Auftrag verstehen, CSRF, Passwort-Hashing, RBAC, serverseitige Permissions oder Session-Revoke abzuschalten. Ziel ist **weniger Komplexität und weniger unnötige Auth-Abhängigkeit**, nicht unsichere Endpoints.

---

# 4. User Login Eye – live sichtbar, aber falsch positioniert und ohne Funktion

## Neuer Livebefund

Das Eye ist nach genauer Suche vorhanden, aber:

- weit rechts außerhalb des Passwortfelds positioniert;
- normal und Inkognito gleich;
- Hold-to-reveal funktioniert nicht;
- damit ist Cache als Hauptursache unwahrscheinlich.

## Auftrag

**Nicht wieder eine neue allgemeine Password-Enhancer-Architektur bauen.**

Nach Wiederherstellung des Loginflows:

- Eye direkt im Passwort-Control positionieren;
- statisches lokales Markup/CSS;
- 44px Touchziel ohne Containerverbreiterung;
- `pointerdown` → `type=text`;
- `pointerup`, `pointercancel`, Pointerverlust → `type=password`;
- keine globale Delegation, kein MutationObserver, kein zweiter Fallback gleichzeitig;
- iPad-/schmalen Viewport layoutnah testen.

Wenn dieser minimalistische lokale Mechanismus im echten User-Login weiterhin nicht zuverlässig funktioniert, **Eye entfernen und Passwortfeld vorübergehend `type=text` setzen**, wie bereits als akzeptierter Produktfallback beschlossen. Keine weitere Endlosschleife.

---

# 5. Vorheriger Batch: erst nach Auth-Recovery erneut bewerten

Folgende Punkte wurden in `cf4513b3` implementiert, konnten wegen der Auth-Regression aber nicht vollständig live abgenommen werden:

- User Session Persistenz;
- Profile/Privacy Settings Projection;
- Organization `Verein Bonn` in User Management;
- separate License List/Create/Edit Views;
- separate Package List/Create/Edit Views;
- Edit User mit read-only User ID + Username.

Diese Implementierungen **nicht pauschal zurückrollen**. Nur Änderungen zurücknehmen, die nachweislich die Auth-Regression verursachen. Nach Recovery die Punkte erneut operator-testbar machen.

Profile Lifecycle bleibt als letzter bestätigter Livebefund PASS.

---

# 6. Regressionstests müssen echte Login-/Session-Flows prüfen

Der letzte Batch bestand 538/538 Tests und Production Smoke, obwohl Login/Admin live brachen. Daher reicht der bisherige Testvertrag nicht.

Ergänze verhaltensnahe Tests mindestens für:

1. User Login Submit erzeugt serverseitig gültige User-Session.
2. Direkt folgender `/auth/me` Request mit erzeugtem Cookie ist authentifiziert.
3. User Login funktioniert mit nullable/persistenter Session, sofern dieser Vertrag erhalten bleibt.
4. User Logout invalidiert sie.
5. Admin Login erzeugt getrennte gültige Admin-Session.
6. Direkt danach mehrere repräsentative Adminendpoints mit demselben Admin-Cookie: Users, Licenses, Packages, Sessions, Roles, Permission Catalog, Modules.
7. User-Sessionänderung darf Admin-Session nicht beeinflussen.
8. Admin-Sessionänderung darf User-Session nicht beeinflussen.
9. Anonym freigegebenes GPS/Modul darf ohne User-Session sichtbar/erreichbar sein, entsprechend bestehendem Serververtrag.
10. Login-Eye lokal positioniert und Hold-to-reveal Eventfolge.
11. kompletter Regressionstest, PHP-Lint, JS-Syntax, `git diff --check`.

Tests dürfen nicht nur Source-Strings bestätigen. Mindestens die Auth-Kernfälle müssen Request/Cookie/Session-Verhalten end-to-end oder integrationsnah beweisen.

---

# 7. Deployment / Verifikation

1. Root Cause dokumentieren.
2. Minimalen Fix implementieren.
3. fokussierte Auth-/Sessiontests.
4. vollständige Suite.
5. Production Package.
6. Commit/Push `main`.
7. CodeQL/FTPS terminal abwarten.
8. Read-only Production Smoke erweitern, soweit sicher möglich, damit zumindest getrennte User-/Admin-Auth-Basics künftig nicht unbemerkt deployt werden. Keine echten Produktions-Credentials in CI erfinden oder ausgeben.
9. `CHATGPT.md`, `CURRENT-TASK.md`, `STATUS.md`, `Security.md`, `API.md`, `Database.md`, `UI-UX.md`, `CORE-1.0-READINESS.md` und `CHANGELOG.md` nur entsprechend tatsächlichem Ergebnis synchronisieren.

# Operator-Retest nach Recovery

**Zuerst nur diese Blocker:**

1. User Login funktioniert normal + Inkognito.
2. Admin Login funktioniert; Licenses, Packages, Sessions, Roles, Permission Catalog, App Modules und System Modules laden ohne `Not authenticated`.
3. User Eye korrekt am Passwortfeld; Hold-to-reveal funktioniert oder vereinbarter sichtbarer Fallback ist aktiv.

**Erst wenn 1–3 PASS sind**, setzen wir die unter Punkt 5 genannten Featuretests fort.

Kein Core Freeze.
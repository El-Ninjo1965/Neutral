# NEUTRAL – CURRENT TASK

## Gesamtauftrag

Der neue Auftrag konzentriert sich ausschließlich auf die tatsächliche Fehlerklärung und die vollständige Wiederherstellung der P1-Session-Trennung.

Dieser Auftrag ersetzt den bisherigen CURRENT-TASK vollständig.

## Verbindliche Arbeitsregel

Vor Änderungen:

- `git fetch origin --prune`
- Branch prüfen
- HEAD und `origin/main` vergleichen
- Working Tree prüfen
- `WORKFLOW.md` lesen
- `ToDoNow.md` lesen
- `STATUS.md` lesen
- `TODO.md` lesen
- `CHANGELOG.md` und relevante Auth-/Security-/API-Dokumentation lesen

Keine alte Chatdiagnose ungeprüft übernehmen.

## Arbeitspunkte

1. Repository-Stand und Git-/Dokumentationslage prüfen. Status: ERLEDIGT
2. Aktuelle Testfehler vollständig untersuchen und tatsächliche Ursache ermitteln. Status: ERLEDIGT
3. Für jeden Testfehler: PHP-Version, Ursache, Code-/Test-/Laufzeitproblem, kleinste fachlich korrekte Lösung. Status: ERLEDIGT
4. P1 User-/Admin-Session-Trennung anhand aktuellen Codes analysieren und Root Cause belegen. Status: ERLEDIGT
5. Produkionsnahen Regressionstest für parallelen User/Admin-Login-/Logout-/Scope-Flow erstellen. Status: ERLEDIGT
6. Codefehler beheben und fokussierte Regressionstests ausführen. Status: ERLEDIGT
7. Vollständige `npm test`-Suite unter unterstützter PHP-8.1+-Runtime ausführen. Status: ERLEDIGT (validiert mit `/usr/bin/php8.3` auf diesem Host; das systemweite `php` ist auf PHP 8.0 gesetzt)
8. PHP-Lint, relevante `node --check`, `git diff --check`, Secret-/Artefaktprüfung und Produktionspaketbau durchführen. Status: ERLEDIGT
9. Dokumentation aktualisieren (`CURRENT-TASK.md`, `ToDoNow.md`, `STATUS.md`, `TODO.md`, `WORKFLOW.md`, `CHANGELOG.md`, ggf. `Architecture.md`, `Functions.md`, `API.md`, `Security.md`). Status: ERLEDIGT
10. Commit erstellen, pushen, `HEAD == origin/main` prüfen, Working Tree sauber prüfen. Status: IN ARBEIT / PENDING
11. FTPS Deploy, CodeQL und alle relevanten CI-Jobs vollständig abwarten. Status: OFFEN / WAITING

## Verbindliche Anforderungen

### 1. Testfehler zuerst klären

Der vorherige Auftrag meldete PHP-Parse-/Runtime-Probleme, unter anderem in:

- `Server/php/src/LoginRateLimiter.php`
- `Server/php/src/ModuleContract.php`

Wichtig:

- Projektvertrag lautet PHP 8.1+.
- Tests müssen mit einer unterstützten PHP-8.1+-Runtime ausgeführt werden.
- Keine Rückkehr auf PHP 8.0-Kompatibilitätsänderungen.
- Kein Test wird deaktiviert, abgeschwächt oder übersprungen, nur um die Suite grün zu bekommen.

Ziel:
volle Testsuite unter der unterstützten PHP-Version grün.

### 2. P1 – User-/Admin-Session-Trennung

P1 ist NICHT live bestanden.

Letzter realer Device-Befund:

- User-App und Adminbereich bleiben nicht zuverlässig unabhängig.
- Admin-Login kann den User-Kontext beeinflussen.
- Login/Logout verhält sich teilweise inkonsistent.
- Beim Adminzugriff erschien: `Access denied – Administrative access requires an authorized role.`

Zielvertrag:

A) Adminbereich:
- Developer/Admin kann dort angemeldet sein.

B) User-App:
- gleichzeitig kann dort z.B. Tester angemeldet sein.

C) Parallelbetrieb:
- beide Sessions existieren gleichzeitig;
- Reload der Adminseite erhält Adminidentität;
- Reload der User-App erhält Useridentität;
- Adminlogin überschreibt Userlogin nicht;
- Userlogin überschreibt Adminlogin nicht.

D) Logout:
- User-Logout beendet ausschließlich User-Session;
- Admin bleibt angemeldet;
- Admin-Logout beendet ausschließlich Admin-Session;
- User bleibt angemeldet.

E) Auth:
- `/api/auth/me` muss den korrekten Scope zurückgeben;
- CSRF muss scope-spezifisch korrekt funktionieren;
- Sessioninvalidierung darf nicht versehentlich den anderen Scope zerstören;
- Admin-Autorisierung muss ausschließlich anhand des korrekten Admin-Kontexts erfolgen.

### 3. Produktionsnaher Regressionstest

Vor P1-Code-Seitigkeit muss ein Regressionstest den realen Ablauf abbilden:

1. Admin als Developer/Admin anmelden.
2. User-App als normaler User/Tester anmelden.
3. beide Sessions gleichzeitig vorhanden.
4. `/auth/me` User-Scope → User.
5. `/auth/me` Admin-Scope → Admin.
6. beide Kontexte reload-/request-stabil.
7. User ausloggen.
8. Admin bleibt authentifiziert.
9. User erneut anmelden.
10. Admin bleibt unverändert.
11. Admin ausloggen.
12. User bleibt authentifiziert.
13. falsche/fehlende CSRF-Werte werden korrekt abgewiesen.
14. keine Cross-Session-Invalidierung.

Soweit PHP Produktion und Node-Referenzpfad unterschiedliche Sessionmechanismen besitzen, darf ein Node-Test nicht als Beweis für PHP-Produktion ausgegeben werden.

Der produktive PHP-Pfad ist maßgeblich.

### 4. Keine UI-Arbeit in diesem Auftrag

Nicht bearbeiten:

- Startseitenkonfiguration
- Buttons/Navigation
- ACTIVE APPLICATION
- Benutzername im Header
- Theme-Schnellumschalter
- i18n
- Admin-Portrait-Menü
- sonstige P2–P11-UX-Arbeiten

Dieser Auftrag konzentriert sich ausschließlich auf:

1. Test-/Runtime-Konsistenz
2. P1 Session-/Auth-Trennung

### 5. Dokumentation

Nach gesicherter Root Cause und Implementierung aktualisieren:

- `CURRENT-TASK.md`
- `ToDoNow.md`
- `STATUS.md`
- `TODO.md`
- `WORKFLOW.md`
- `CHANGELOG.md`
- bei tatsächlicher Vertragsänderung zusätzlich relevante:
  - `Architecture.md`
  - `Functions.md`
  - `API.md`
  - `Security.md`

Historische Fehler nicht löschen.

P1 darf nach automatisierten Tests höchstens als:

`CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED`

geführt werden.

`LIVE BESTANDEN` darf ausschließlich nach einem von Betreiber tatsächlich durchgeführten erfolgreichen Device-Livetest gesetzt werden.

## Device-Retest #1 – FEHLGESCHLAGEN (2026-09-07)

Realer iPad-Test nach Commit `87bfc31` (FTPS Deploy erfolgreich) ergab einen weiterhin bestehenden kritischen Fehler:

FALL A (Tester): User-App-Login als Tester, danach Adminbereich aufgerufen → `Access denied – Administrative access requires an authorized role.` Für einen reinen Tester ohne separate Admin-Session ist dieses Verhalten grundsätzlich korrekt möglich, ABER es muss zunächst das Admin-Loginformular erscheinen, solange keine Admin-Scope-Session existiert.

FALL B (KRITISCH): Tester ausgeloggt, danach über die User-App als Developer/Admin angemeldet, danach Adminbereich aufgerufen. Kurz erschien das Admin-Loginformular, wurde aber sofort durch `Access denied` ersetzt. Ein Login über die USER-APP darf NICHT automatisch als Admin-Authentifizierung interpretiert werden; das ist ein separates Login.

### Root Cause (bewiesen, Stand 2026-09-07 zweite Analyse)

`Server/public/admin.php` prüfte beim Ermitteln der Identität nacheinander ZWEI Cookies: zuerst `neutral_admin_session`, und – falls dort keine Identität vorlag – fiel es zusätzlich auf das Legacy-Cookie `neutral_session` (die normale User-App-Session) zurück:

```php
foreach (array_values(array_unique([$adminCookieName, $legacyCookieName])) as $cookieName) {
    ...
    $candidate = $_SESSION['auth_identity'] ?? null;
    if (is_array($candidate)) { $identity = $candidate; break; }
}
```

Dadurch wurde eine ganz normale User-App-Session (z.B. Tester ODER Developer, angemeldet über die User-App, Cookie `neutral_session`) von `admin.php` als "vorhandene Authentifizierungs-Identität" behandelt. Da diese Identität in aller Regel keine ausreichende Admin-Rolle im Admin-Scope-Sinn trägt (bzw. selbst bei einer Developer-Rolle handelt es sich um die FALSCHE Scope-Session), führte das im Code direkt zum `render_access_denied_page()`-Zweig statt zum Admin-Loginformular.

Das erklärt exakt Fall A und Fall B: Sobald IRGENDEINE User-App-Session (`neutral_session`) vorhanden war, hat `admin.php` diese fälschlich als Admin-Identitäts-Kandidat akzeptiert und zeigte `Access denied` an, statt das separate Admin-Loginformular zu präsentieren.

### Fix (2026-09-07, zweite Iteration)

`Server/public/admin.php` liest jetzt AUSSCHLIESSLICH das Admin-Scope-Cookie (`neutral_admin_session`, konfigurierbar über `AUTH_ADMIN_SESSION_COOKIE_NAME`). Der Fallback auf das User-App-Cookie `neutral_session` wurde vollständig entfernt. Eine vorhandene User-App-Session hat damit keinerlei Einfluss mehr auf die Identitätsauflösung des Adminbereichs:

- keine Admin-Session vorhanden → Admin-Loginformular (401), unabhängig davon, ob eine User-App-Session existiert.
- gültige Admin-Session ohne Admin-Rolle → `Access denied` (403).
- gültige Admin-Session mit Admin-Rolle → Admin-UI (200), unabhängig von einer parallel bestehenden User-App-Session.

### Neue Regressionstests (`tests/admin-php-entry.test.js`)

- Fall B2: nur eine normale User-Scope-Session vorhanden (keine Admin-Session) → Admin-Loginformular, NICHT Access Denied.
- Fall B3: User-Scope-Session mit `admin`-Rolle, aber ohne separate Admin-Scope-Session → weiterhin Admin-Loginformular, kein automatischer Admin-Zugriff.
- Fall C3: gültige Admin-Scope-Session UND parallele unabhängige User-Scope-Session gleichzeitig vorhanden → Admin-UI wird korrekt angezeigt, keine Fehlinterpretation durch die User-Session.
- Fall B/C/C2 wurden auf das korrekte Admin-Scope-Cookie (`neutral_admin_session`) umgestellt, da sie Admin-Identitäten testen.

Alle 28 Tests in `tests/admin-php-entry.test.js` sowie die vollständige Suite (392/392) bestehen unter PHP 8.3.

## Abschlusskriterien

- Test-/Runtime-Konsistenz unter PHP 8.1+ hergestellt.
- P1 Root Cause im aktuellen Code identifiziert und fachlich korrekt behoben.
- Produktionsnaher Regressionstest vorhanden und grün.
- Dokumentation konsistent aktualisiert.
- Commit, Push, Deployment und CI erfolgreich abgeschlossen.
- Zweiter Device-Retest durch Betreiber steht noch aus (P1 bleibt `CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED`, NICHT `LIVE BESTANDEN`).

## Statuskonkretisierung der Arbeitspunkte

1. Repository-Stand und Git-/Dokumentationslage prüfen. Status: CODE-SEITIG ERLEDIGT
2. Aktuelle Testfehler vollständig untersuchen und tatsächliche Ursache ermitteln. Status: CODE-SEITIG ERLEDIGT
3. Für jeden Testfehler: PHP-Version, Ursache, Code-/Test-/Laufzeitproblem, kleinste fachlich korrekte Lösung. Status: CODE-SEITIG ERLEDIGT
4. P1 User-/Admin-Session-Trennung anhand aktuellen Codes analysieren und Root Cause belegen. Status: IN ARBEIT – zweite Root Cause (Legacy-Cookie-Fallback in `admin.php`) identifiziert und behoben; Device-Retest #1 war fehlgeschlagen, Fix jetzt code-seitig neu validiert.
5. Produkionsnahen Regressionstest für parallelen User/Admin-Login-/Logout-/Scope-Flow erstellen. Status: CODE-SEITIG ERLEDIGT (erweitert um Fall B2/B3/C3)
6. Codefehler beheben und fokussierte Regressionstests ausführen. Status: CODE-SEITIG ERLEDIGT
7. Vollständige `npm test`-Suite unter unterstützter PHP-8.1+-Runtime ausführen. Status: CODE-SEITIG ERLEDIGT (392/392 unter PHP 8.3)
8. PHP-Lint, relevante `node --check`, `git diff --check`, Secret-/Artefaktprüfung und Produktionspaketbau durchführen. Status: CODE-SEITIG ERLEDIGT
9. Dokumentation aktualisieren (`CURRENT-TASK.md`, `ToDoNow.md`, `STATUS.md`, `TODO.md`, `WORKFLOW.md`, `CHANGELOG.md`, ggf. `Architecture.md`, `Functions.md`, `API.md`, `Security.md`). Status: CODE-SEITIG ERLEDIGT
10. Commit erstellen, pushen, `HEAD == origin/main` prüfen, Working Tree sauber prüfen. Status: IN ARBEIT / PENDING
11. FTPS Deploy, CodeQL und alle relevanten CI-Jobs vollständig abwarten. Status: IN ARBEIT / PENDING

## P1 Gesamtstatus (nach zweitem Fix)

- Status: **IN ARBEIT** (zurückgesetzt nach Device-Retest #1 Fehlschlag) → nach Fix und Testvalidierung wieder **CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED**
- `LIVE BESTANDEN` bleibt gesperrt bis ein Betreiber den zweiten Device-Retest erfolgreich durchführt.

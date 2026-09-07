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

1. Repository-Stand und Git-/Dokumentationslage prüfen. Status: OFFEN
2. Aktuelle Testfehler vollständig untersuchen und tatsächliche Ursache ermitteln. Status: OFFEN
3. Für jeden Testfehler: PHP-Version, Ursache, Code-/Test-/Laufzeitproblem, kleinste fachlich korrekte Lösung. Status: OFFEN
4. P1 User-/Admin-Session-Trennung anhand aktuellen Codes analysieren und Root Cause belegen. Status: OFFEN
5. Produkionsnahen Regressionstest für parallelen User/Admin-Login-/Logout-/Scope-Flow erstellen. Status: OFFEN
6. Codefehler beheben und fokussierte Regressionstests ausführen. Status: OFFEN
7. Vollständige `npm test`-Suite unter unterstützter PHP-8.1+-Runtime ausführen. Status: OFFEN
8. PHP-Lint, relevante `node --check`, `git diff --check`, Secret-/Artefaktprüfung und Produktionspaketbau durchführen. Status: OFFEN
9. Dokumentation aktualisieren (`CURRENT-TASK.md`, `ToDoNow.md`, `STATUS.md`, `TODO.md`, `WORKFLOW.md`, `CHANGELOG.md`, ggf. `Architecture.md`, `Functions.md`, `API.md`, `Security.md`). Status: OFFEN
10. Commit erstellen, pushen, `HEAD == origin/main` prüfen, Working Tree sauber prüfen. Status: OFFEN
11. FTPS Deploy, CodeQL und alle relevanten CI-Jobs vollständig abwarten. Status: OFFEN

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

## Abschlusskriterien

- Test-/Runtime-Konsistenz unter PHP 8.1+ hergestellt.
- P1 Root Cause im aktuellen Code identifiziert und fachlich korrekt behoben.
- Produktionsnaher Regressionstest vorhanden und grün.
- Dokumentation konsistent aktualisiert.
- Commit, Push, Deployment und CI erfolgreich abgeschlossen.

## Statuskonkretisierung der Arbeitspunkte

1. Repository-Stand und Git-/Dokumentationslage prüfen. Status: CODE-SEITIG ERLEDIGT
2. Aktuelle Testfehler vollständig untersuchen und tatsächliche Ursache ermitteln. Status: CODE-SEITIG ERLEDIGT
3. Für jeden Testfehler: PHP-Version, Ursache, Code-/Test-/Laufzeitproblem, kleinste fachlich korrekte Lösung. Status: CODE-SEITIG ERLEDIGT
4. P1 User-/Admin-Session-Trennung anhand aktuellen Codes analysieren und Root Cause belegen. Status: CODE-SEITIG ERLEDIGT
5. Produkionsnahen Regressionstest für parallelen User/Admin-Login-/Logout-/Scope-Flow erstellen. Status: CODE-SEITIG ERLEDIGT
6. Codefehler beheben und fokussierte Regressionstests ausführen. Status: CODE-SEITIG ERLEDIGT
7. Vollständige `npm test`-Suite unter unterstützter PHP-8.1+-Runtime ausführen. Status: CODE-SEITIG ERLEDIGT
8. PHP-Lint, relevante `node --check`, `git diff --check`, Secret-/Artefaktprüfung und Produktionspaketbau durchführen. Status: CODE-SEITIG ERLEDIGT
9. Dokumentation aktualisieren (`CURRENT-TASK.md`, `ToDoNow.md`, `STATUS.md`, `TODO.md`, `WORKFLOW.md`, `CHANGELOG.md`, ggf. `Architecture.md`, `Functions.md`, `API.md`, `Security.md`). Status: CODE-SEITIG ERLEDIGT
10. Commit erstellen, pushen, `HEAD == origin/main` prüfen, Working Tree sauber prüfen. Status: IN ARBEIT / PENDING
11. FTPS Deploy, CodeQL und alle relevanten CI-Jobs vollständig abwarten. Status: IN ARBEIT / PENDING

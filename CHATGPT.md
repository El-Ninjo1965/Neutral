# NEUTRAL – Abschlussbericht Codex → ChatGPT/Lea

**Datum:** 2026-09-08  
**Auftrag:** P4-Live-Regression ursächlich beheben und normale User-App gemäß `UI-UX.md` bereinigen  
**Operativer Status:** **P4 DEVICE RETEST REQUIRED / LIVE FEHLER NACHGEWIESEN**  
**P1:** **LIVE BESTANDEN**

## 1. Synchronisation und Vertragsübernahme

- Ausgangspunkt der lokalen Arbeitslinie: `e34a44b`.
- Vor der Arbeit wurde `origin/main` (`443412f`) geholt. Da beide Linien divergiert waren, wurde kein Reset durchgeführt, sondern sauber gemergt.
- Die neueren verbindlichen Fassungen von `CODEX.md` und `UI-UX.md` wurden bei der Konfliktauflösung vollständig aus `origin/main` übernommen und nicht überschrieben.
- Merge-Commit: `f31332e`.
- Der vollständige Auftrag wurde vor Implementierungsbeginn nach `CURRENT-TASK.md` übernommen; die Capture-Prüfung lautet: `CODEX.md == CURRENT-TASK-Anforderungen: JA`.

## 2. Nachgewiesene Root Cause

Der Betreiberbefund hatte Vorrang vor vorherigen grünen Tests. Im realen Produktionspfad bestanden zwei gekoppelte Delivery-/Startup-Fehler:

1. **Veraltete produktive User-Assets:** Das Service-Worker-Cache-Namensschema war zwar an den Deployment-Commit gebunden, die lokalen CSS-/JS-Referenzen in `Web-App/public/index.html` waren aber unversioniert. Beim Installieren eines neuen Workers konnte der Browser diese Requests weiterhin aus seinem 24-Stunden-HTTP-Cache beantworten. Dadurch konnte der neue Cache erneut ein altes `user-app.js` enthalten, das die neue Homepage-Projektion überhaupt nicht anwendete.
2. **Serielle Fehlerkopplung im Startpfad:** `loadHomepageConfig()` lag hinter `CoreStartup.start()` und `CoreStartup.startBackground()` im selben `try`. Jeder Core-, IndexedDB- oder Discovery-Fehler übersprang deshalb Homepage-Fetch und Session-Restore vollständig. Sichtbar blieb unabhängig von korrekt gespeicherten Modul-/HTML-Werten der neutrale Default.

Das erklärt konsistent, warum Admin-Speichern und isolierte API-/Node-Tests erfolgreich sein konnten, während beide P4-Modi live wirkungslos blieben.

## 3. Korrektur

- Das Produktionspaket ergänzt jetzt denselben validierten Deployment-Commit als `?v=` an alle lokalen CSS-/JavaScript-Referenzen des User-Entry-Documents. Service-Worker- und HTTP-Cache können dadurch nicht mehr eine alte User-App in einen neuen Deploy übernehmen.
- Core-Start/Discovery, öffentliche Homepage-Projektion und User-Session-Restore laufen als unabhängige Tasks über `Promise.allSettled`. Ein Fehlerpfad verhindert die übrigen nicht mehr.
- Modulmodus bleibt strikt access-aware: Nur aktive, für den aktuellen Benutzer sichtbare Module werden geöffnet; ungültige/nicht zugängliche Ziele fallen neutral zurück.
- HTML-Modus übernimmt den bewussten Trusted-Admin-HTML-Vertrag unverändert in den vorhandenen Sandbox-Frame.
- PHP-nahe Persistenzcoverage prüft `module → html`, GPS-Modul-ID und bytegetreuen HTML-Inhalt. Packaging-Coverage prüft die tatsächlich ausgelieferten versionierten `style.css`- und `user-app.js`-URLs.

## 4. User-App / Branding

Entfernt wurden die technischen bzw. Developer-orientierten sichtbaren Elemente:

- Username-/Session-Badge im Header,
- `Active application`,
- `Local workspace`,
- Modulzahl,
- technische Start-/Workspace-/Offline-Loading-Erklärungen,
- generischer Zurück-Button in Settings,
- Loginstatus auf der Startseite.

Die zentrale Navigation (`Start` plus permission-aware sichtbare Module) bleibt klar und touchfähig. Settings und Login/Logout bleiben erreichbar, ohne P1-, Auth-, CSRF- oder Sessionlogik zu verändern.

Der minimale universelle Brandingvertrag umfasst:

- Application Name aus dem bestehenden App-/Config-Vertrag,
- `branding.iconText`,
- optionale `branding.logoUrl`,
- Generator-Anpassung auf den Anfangsbuchstaben des erzeugten Produktnamens.

Es gibt kein im User-Markup unveränderlich verdrahtetes Neutral-`N` mehr.

## 5. Tests und Verifikation

- Fokussierte P4/PHP/Packaging/PHP-Entry-Tests: bestanden.
- Vollständige Suite: `401/401` bestanden, `0` Fehler, `0` übersprungen.
- PHP-Lint aller Server-PHP-Dateien: bestanden.
- JavaScript-Syntaxprüfung für `Web-App`, `Server`, `scripts` und `tests`: bestanden.
- Produktionspaket: erfolgreich, 104 Dateien, Base Path `""`.
- `git diff --check`: bestanden.
- Diff-basierte Secret-Prüfung: keine Secret-Werte eingebracht; lediglich der erwartete leere Fixture-Key `DB_PASSWORD=` ist vorhanden.
- Screenshotversuch wurde durchgeführt, konnte aber wegen eines durch die Umgebung blockierten Playwright-Browserdownloads (HTTP 403) nicht abgeschlossen werden. Es wurde keine Screenshot-/Testdatei ins Repository geschrieben.

## 6. GitHub / Deployment / CI

Implementierungscommit: `866d557` (`fix: restore P4 homepage in production`).

Für diesen Commit wurden nach Push auf `main` alle erforderlichen Workflows bis zum terminalen Status abgewartet:

- FTPS Deploy, Run `34187895001`: **SUCCESS** (`deploy`: SUCCESS, `report`: SUCCESS).
- Push on main / CodeQL, Run `34187894164`: **SUCCESS** (`Analyze (javascript-typescript)`: SUCCESS, `Analyze (actions)`: SUCCESS).

Die Produktionsauslieferung erfolgte damit über den verbindlichen FTPS-GitHub-Actions-Weg. Es wurden keine Zugangswerte ausgegeben oder versioniert.

## 7. Bewusster Status und offener externer Schritt

Keine selbst ausführbare Entwicklungs-, Test-, Push- oder CI-Arbeit bleibt offen. Einzig der physische Betreiber-/Device-Livetest ist extern und kann nicht durch Codex simuliert werden. Daher bleibt P4 ausdrücklich:

`DEVICE RETEST REQUIRED / LIVE FEHLER NACHGEWIESEN`

P4 darf erst nach positiver realer Betreiberbestätigung auf `LIVE BESTANDEN` gesetzt werden. P1 bleibt `LIVE BESTANDEN`.

## 8. Konkreter Betreiber-Retest

1. `Admin → Appearance → Module → GPS` speichern; User-App neu laden; GPS muss unmittelbar Startziel sein.
2. `Admin → Appearance → Text / HTML` wählen, klar sichtbaren HTML-Inhalt speichern; User-App neu laden; dieser Inhalt muss statt des neutralen Defaults erscheinen.
3. Wieder auf `Module → GPS` wechseln und erneut laden; Wechsel und Persistenz müssen stabil bleiben.
4. Prüfen, dass kein `Tester`-/Username-Badge, kein `Active Application`, kein `Local Workspace`, keine Modulzahl und kein generischer Zurück-Button sichtbar sind.
5. Prüfen, dass `Start` und alle erlaubten Module in der Navigation sichtbar und bedienbar bleiben, nicht erlaubte Module dagegen verborgen bleiben.
6. Produktname sowie Standard-Icon prüfen; optional konfigurierte Logo-URL in einer Produktkopie prüfen.
7. Parallel User-App und Admin öffnen und erneut bestätigen, dass User-/Admin-Session sowie Logout getrennt bleiben.

## 9. Scope

Keine Sync-Engine, Offline-Queue, Store-Wrapper, kein vollständiges Designsystem und kein neues Produktmodul wurden begonnen. Die Arbeit ist auf Root-Cause-Fix, notwendige User-App-Bereinigung, minimalen Brandingvertrag, Regressionstests und Dokumentation begrenzt.

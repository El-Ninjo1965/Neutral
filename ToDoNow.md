# ToDoNow – Stabilisierung vor dem Core-Freeze

## Statuslegende
- OFFEN
- IN ARBEIT
- BLOCKIERT
- CODE-SEITIG ERLEDIGT
- LIVE BESTANDEN

## A. Kritische Funktionsfehler

### A1 – Rollen-/Permissions-Speicherung
- Status: CODE-SEITIG ERLEDIGT
- Ursache: Der Server-Updatepfad und die Admin-UI erlaubten das Speichern für integrierte Rollen nicht mehr; das UI blockierte Updates für Built-ins und der Node-Backend-Validator verhinderte schrittweise auch Kennzeichenänderungen an Standardrollen.
- Korrektur: Built-in-Rollen bleiben gesperrt für Create/Delete/Rename, aber die Beschreibung und das Permission-Set dürfen editiert werden; die Admin-UI ermöglicht nun bearbeitbare Standardrolle-Formulare.
- Hinweis: Produktive Live-Prüfung noch offen, da kein echter Host-/Admin-Live-Login im Codespace verfügbar.

### A2 – Normaler User-Login funktioniert nicht
- Status: CODE-SEITIG ERLEDIGT
- Ursache: `Web-App/core/local-auth.js` hat jeden Login mit einer lokalen Entwickler-Setup-Prüfung verworfen, obwohl der Benutzer nicht der lokale Developer-Account war.
- Korrektur: Die lokale Bootstrap-Guard greift nur mehr für den lokalen Developer-Account; normale Benutzerlogins laufen durch den normalen User-Loginpfad.
- Hinweis: Produktiver Live-Login gegen die reale API bleibt offen; die technische Ursache wurde im Code reproduzierbar korrigiert.

### A3 – Setup-/Developer-Bootstrap von normalem Login entkoppeln
- Status: CODE-SEITIG ERLEDIGT
- Ursache: Der lokale Setup-/Developer-Login war fälschlich in den allgemeinen Loginpfad eingebettet.
- Korrektur: Setup-/Bootstrap-Vertrag bleibt nur für den lokalen Developer-Account und den Installations-/Initialisierungspfad reserviert; normale User-Login- und Session-Checks bleiben getrennt.

### A4 – Auth/Session/RBAC nach Login verifizieren
- Status: LIVE BESTANDEN
- Ursache: Login-/Rollenpfad wurde code-seitig korrigiert und lokal sowie gegen die produktive API verifiziert: `Tester` konnte sich anmelden, `/api/auth/me` identifizierte den Nutzer als `user`, und `/api/admin/users` verweigerte den Zugriff mit `403 FORBIDDEN`; die Session wurde anschließend beendet.
- Nachweis: lokaler Serverlauf und produktiver Read-only-/Tester-Check; keine Admin- oder mutierende Produktivaktion wurde ausgeführt.

### A5 – Produktive Script-Delivery für `/api-client.js` reparieren
- Status: CODE-SEITIG ERLEDIGT
- Ursache: Die echte Live-User-App lud `api-client.js` als Root-Script `api-client.js`, aber die Host-Rewrite-Regeln in `.htaccess` mappten diesen Pfad nicht auf `Web-App/public/api-client.js`. In der Produktion fiel der Request deshalb auf den Shell-Fallback (`index.html`) zurück, und der Browser hatte keinen verifizierbaren `ApiClient`-Konstruktor im Runtime-Kontext. Das erzeugte exakt die Live-Meldung `Server authentication client is not available.`
- Korrektur: `.htaccess` enthält jetzt eine direkte Rewrite-Regel für `^api-client\.js$` nach `Web-App/public/api-client.js`; der Regressionstest `tests/user-app-server-auth.test.js` prüft dieses Deploy-/Runtime-Contract zusätzlich.
- Hinweis: Der reale Host-/Geräte-Login bleibt extern zu verifizieren; der Codepfad ist hier mit Produktions-Host-Korrespondenz und Runtime-Contract geprüft.

### A6 – PHP-Login-Envelope korrekt auslesen
- Status: CODE-SEITIG ERLEDIGT
- Ursache: `Web-App/public/user-app.js` und `master-ui.js` erwarteten bei `ApiClient.login()` / `me()` den User direkt unter `identityData.user` auf oberster Ebene. Die produktive PHP-API liefert über `JsonResponse::success()` jedoch die standardisierte Envelope-Struktur `{ ok: true, data: { via: 'session', user: {...}, roles: [...], permissions: [...], csrfToken: '...', expiresAt: '...' } }`. `ApiClient.request()` kapselt die geparste JSON-Response in `{ ok: true, status: 200, data: <parsed_json> }`. Dadurch lag das User-Objekt in `result.data.data.user`. Die User-App gab bei `extractServerAuthData(result)` nur `result.data` zurück und `normalizeServerUser()` suchte nach `identityData.user` (was `undefined` war). Das führte reproduzierbar zur Live-Fehlermeldung `No authenticated user was returned by the server.`. Ebenso extrahierte `ApiClient.login()` den CSRF-Token nicht aus `result.data.data.csrfToken`.
- Nachweis: `Server/public/api/index.php` liefert `JsonResponse::success(['via' => 'session', 'user' => ..., 'roles' => ..., 'permissions' => ..., 'csrfToken' => ..., 'expiresAt' => ...]);` mit `JsonResponse.php` (`['ok' => true, 'data' => $data]`).
- Korrektur:
  1. `Web-App/public/user-app.js`: `extractServerAuthData()` entpackt rekursiv verschachtelte Envelopes (`result.data.data`, `result.data` mit `ok/data`, flache Node-Form `result.data.user`). `normalizeServerUser()` sucht das `userRecord` robust auf allen Ebenen (`user`, `data.user`, `data.data.user` oder flach) und normalisiert `roles` und `permissions`.
  2. `Web-App/public/master-ui.js`: `extractApiData()` und `applyServerIdentity()` unterstützen gleichermaßen Envelopes und flache Payloads.
  3. `Web-App/public/api-client.js`: `extractEnvelopeData()` und `login()` extrahieren `csrfToken` und Daten aus PHP-Envelope und flachen Antworten.
  4. `Server/php/src/LoginRateLimiter.php` und `DatabaseBackupService.php`: PHP 8.0-Kompatibilität (`readonly`-Syntax bereinigt).
- Regressionstests: `tests/user-app-server-auth.test.js` prüft die exakte PHP-Response-Struktur für `/api/auth/login` und `/api/auth/me`, die CSRF-Token-Extraktion sowie das Node-Format (10/10 Tests bestanden). Gesamt-Suite: 387/387 Tests bestanden.

## B. Schreib-/Settings-Verträge

### B1 – Einheitliche Speicherbestätigungen
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: User-Settings zeigen bei erfolgreicher lokaler Persistenz einen sichtbaren Bestätigungsdialog und führen danach zur Startseite zurück; Fehler bleiben auf der Seite. Admin-Settings, Session-Invalidierung und bestehende Admin-Schreibaktionen zeigen Erfolg/Fehler über den gemeinsamen Admin-Hinweis.

### B2 – User Local Settings
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: Theme und User-Präferenzen werden lokal/offline gespeichert; Erfolg bestätigt und navigiert zurück, Fehler täuschen keinen Erfolg vor.

### B3 – Admin Settings
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: Admin-Settings behalten die Seite nach Bestätigung und verwenden sichtbare Erfolg-/Fehlerhinweise.

### B4 – Application ID technisch prüfen und schützen
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: Application ID ist readonly/disabled und serverseitig unveränderbar; direkte API-Manipulation wird abgewiesen.

### B5 – Weitere sensible Systemfelder prüfen
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: Technische Identitätswerte werden nicht als normale editierbare Felder angeboten; Application Name bleibt editierbar.

### B6 – Application Name als gefahrlos änderbaren Anzeigenamen prüfen
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: Application Name bleibt persistent änderbar und wird weiterhin als Anzeigename verwendet.

## C. Access-/Admin-Verwaltung

### C1 – Permission Catalog
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: Read-only-Katalog erklärt Zweck, Key, Beschreibung und Scope/Herkunft ohne gefährliche Edit/Delete-Aktionen.

### C2 – Session Overview
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: Session-Übersicht zeigt Display Name/Username, User-ID, Rollen, Status, Issued, Expires und End-Action aus einem API-Request.

### C3 – Sessions manuell invalidieren/löschen
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: Einzelne Sessions können nach Bestätigung serverseitig invalidiert werden; Erfolg/Fehler wird angezeigt.

## D. User-App UX / Modulvertrag

### D1 – User-App Light/Dark
- Status: CODE-SEITIG ERLEDIGT

### D2 – Theme persistent lokal speichern, Erststart Light
- Status: CODE-SEITIG ERLEDIGT

### D3 – User-Navigation/Button-States klar farbig
- Status: CODE-SEITIG ERLEDIGT

### D4 – redundanten `‹ Back`-Link entfernen
- Status: CODE-SEITIG ERLEDIGT

### D5 – technische Modulbeschreibung aus normaler Modulansicht entfernen
- Status: CODE-SEITIG ERLEDIGT

### D6 – allgemeinen Modul-UI-Vertrag dokumentieren
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: User-Module nutzen zentrale Navigation, keine automatische technische Beschreibung/Back-Navigation und bleiben Light/Dark-kompatibel.

## E. Live-Abnahme
- Status: TEILWEISE BESTANDEN
- Nachweis: Produktiver Read-only-Smoke gegen `https://turbolikes.com/` bestand für Root, Rewrite, geschützte Admin-/Core-Routen, Status, Modul-Katalog, Deployment-Revision und beide Modulverträge. Der produktive `Tester`-Login bestätigte `user`-RBAC und Logout.
- Offen: reale iPad/Safari-/Android-Abnahme, Offline-/Warmstart, neue Hosting-/Datenbankinstallation und URL-Unterpfad bleiben betreiber- bzw. geräteabhängig.

## F. Freeze-Bewertung
- Status: OFFEN
- Nachweis: 377/377 Node-Tests, vollständiger PHP-Lint mit PHP 8.4, JavaScript-Syntaxprüfungen, `git diff --check`, Produktionspaket und Secret-Scan bestanden. FTPS Deploy `34015306976` und CodeQL `34015306449` für Commit `8073d32e23ba8411643c758dcfcf36fe67205de1` bestanden.
- CI-Fix 2026-09-06: FTPS Deploy `34014196091` war an einem Node.js-internen `SIGABRT` in `tests/app-bootstrap.test.js` gescheitert (nativer `fs.cpSync`-Fast-Path-Absturz beim Kopieren eines `.git`-Baums, bekannter Upstream-Bug `nodejs/node#63970`; PHP 8.3.6 im Log war nur Korrelation, keine Ursache). Behoben durch manuelle Verzeichniskopie statt `cpSync({recursive:true})`; siehe `STATUS.md`/`WORKFLOW.md` für Details.
- Einschränkung: lokales Preflight bleibt wegen fehlender `pdo_mysql`-Erweiterung BLOCKIERT; die geforderten physischen Geräte-/Portabilitätsnachweise fehlen weiterhin. Daher kein Core-1.0-Freeze.

## Gesamtzustand
- Code-seitig verifiziert: A1, A2, A3, A4 (lokal im Codespace)
- Code-seitig verifiziert: B1–B6, C1–C3 und D1–D6
- Live-/Deployment-Abnahme: produktiver Smoke und Tester-RBAC (API-/Host-Ebene) bestanden; Device-, Offline-, Neuinstallations- und Unterpfadabnahmen offen
- Device-Livetest 2026-09-07: kritischer User-App-Login-Blocker gefunden und codeseitig behoben (siehe G-Login); Device-Retest steht aus. Weitere Beobachtungen (G-Performance, G-Navigation/UX, G-i18n, G-Permission-Catalog, G-Session-Overview, G-System-Settings, G-GPS-Pro) sind dokumentiert, nicht umgesetzt.
- Gesamtfreeze: OFFEN wegen der genannten externen Nachweise und lokaler `pdo_mysql`-Preflight-Blockade

## G. Device-Livetest 2026-09-07 (echtes iPad, privater/Inkognito-Modus)

Dieser Abschnitt dokumentiert ausschließlich die heutigen Betreiber-Beobachtungen aus dem realen Devicetest. Nur G-Login (kritisch) wurde codeseitig behoben; alle anderen Punkte sind bewusst nur dokumentiert, nicht implementiert.

### G-Login – KRITISCH – User-App-Login gegen echte Serverbenutzer schlug fehl
- Status: CODE-SEITIG BEHOBEN, DEVICE-RETEST AUSSTEHEND
- Befund: reale, serverseitig aktive Nutzer (`Tester`, ID 102, Rolle `user`, Status `active`; ein bereits eingerichteter `Developer`) konnten sich über die tatsächliche User-App-UI nicht anmelden (`User is not valid or not active.` / `Set up the local developer account before logging in.`).
- Root Cause: `Web-App/public/user-app.js` verband das Login-Formular ausschließlich mit dem lokalen, `localStorage`-basierten Entwickler-Bootstrap (`LocalAuth`), nie mit dem echten Server-Endpunkt `/api/auth/login`. `index.html` lud `api-client.js` nicht.
- Fix: `user-app.js` nutzt jetzt `ApiClient.login()/.logout()/.me()` gegen `/api/auth/*` (gleiches Muster wie die Admin-UI in `master-ui.js`); `index.html` lädt `api-client.js`; `service-worker.js` cached `api-client.js` zusätzlich. Kein Tester-/ID-102-/Developer-Sonderfall. `LocalAuth`/`core-auth.js` bleiben für den Setup-/Entwickler-Bootstrap-Fall unverändert bestehen, werden aber vom normalen Runtime-Login nicht mehr aufgerufen.
- Regressionstest: `tests/user-app-server-auth.test.js` (5 Tests, neu).
- Ausdrücklich offen: realer Retest von `Tester`- und `Developer`-Login über die echte Device-UI nach dem nächsten erfolgreichen Deployment.

### G-Performance – Startverhalten
- Status: OFFEN (nur beobachtet, nicht gemessen)
- Befund: gefühlt schneller Start (~1s) im realen Test; keine belastbare Messung mit den vorhandenen Performance-Marken durchgeführt. Kein Handlungsbedarf ohne konkrete Messdaten.

### G-Navigation/UX – mehrere kleinere Punkte
- Status: OFFEN (nur dokumentiert, nicht umgesetzt)
- Button-Stil/Icons/Active-/Normal-Zustände sollen überarbeitet werden.
- Das Label „ACTIVE APPLICATION“ soll entfernt werden.
- „Local Settings“ soll für angemeldete normale Benutzer zu „Settings“ umbenannt werden (Hinweis: `renderActions()` in `user-app.js` unterscheidet bereits nach `currentUser` zwischen „Local settings“ und „Settings“; zu prüfen bleibt, ob dies nach dem Login-Fix tatsächlich korrekt greift).

### G-i18n – Gerätesprache/Fallback/manuelle Übersteuerung
- Status: OFFEN (neuer langfristiger Punkt, nur dokumentiert)
- Wunsch: automatische Erkennung der Gerätesprache, Fallback auf Englisch, persistente manuelle Übersteuerung, keine feste Begrenzung auf aktuell drei Sprachen (EN/DE/ES in den Admin-Settings). Keine Google-Translate-Integration vorgesehen.
- Spannungspunkt: aktuelles Sprachdropdown in den System-Settings ist auf EN/DE/ES begrenzt (siehe G-System-Settings unten) – muss bei zukünftiger i18n-Arbeit mitbedacht werden.

### G-Permission-Catalog – funktional, aber UX redundant/unklar
- Status: OFFEN (nur dokumentiert, keine Architekturänderung)
- Befund: Permission Catalog funktioniert, wirkt in der Darstellung aber redundant/unklar für Endanwender.

### G-Session-Overview – positiv, neue Idee
- Status: OFFEN (Idee, keine Umsetzung)
- Befund: Session Overview funktioniert wie erwartet.
- Neue Idee: „alle anderen Sessions invalidieren“-Aktion. Benötigt vor Umsetzung eine Sicherheitsbetrachtung (z. B. Verhalten bei gleichzeitigem Self-Invalidate, CSRF/Race-Bedingungen); nicht umgesetzt.

### G-System-Settings – bestätigt korrekt
- Status: BESTÄTIGT KORREKT
- Befund: Application ID ist readonly, Application Name bleibt editierbar (wie in B5/B6 spezifiziert). Sprachdropdown aktuell nur EN/DE/ES – siehe Spannungspunkt unter G-i18n.

### G-GPS-Pro – Zukunftsidee, nicht Teil des aktuellen Core-Freeze
- Status: IDEE, AUSSERHALB DES AKTUELLEN SCOPES
- Befund: Betreiberidee für eine erweiterte „GPS-Pro“-Funktionalität. Ausdrücklich nicht Teil der aktuellen Core-1.0-Freeze-Kriterien; keine Architekturentscheidung getroffen.

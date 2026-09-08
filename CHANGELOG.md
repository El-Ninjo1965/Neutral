## 2026-09-08 – Theme-correct bootstrap and Loading-free homepage warmstart

- Root Cause of the remaining operator-visible flash: `index.html` always shipped a visible static `Loading…` panel before deferred JavaScript could synchronously read the homepage cache, and that panel used fixed Light colors. The early theme script set only `html[data-user-theme]`, while central Dark token overrides initially existed only on `body[data-theme]`, which is set later by `user-app.js`.
- The render-blocking stylesheet now consumes the synchronously selected root theme, so semantic Dark/Light tokens are established before body First Paint. The static content host is an empty, layout-stable themed surface and no longer invents a Loading state before local cache resolution.
- A true cold start can still render the dynamic accessible `Loading…` status, now using semantic surface/text/border tokens after the theme has been applied. No status is hidden, delayed, animated or timeout-shortened.
- Existing Local-first cache, iframe document defaults/load gate, Theme persistence, Service Worker versioning and security contracts remain unchanged.
- Executed and documented by Codex in `Neutral`; visual success requires the focused iPad/Safari retest.

## 2026-09-08 – Remove Safari HTML-homepage first-paint flash

- The iPad retest confirmed the document-level Dark defaults fixed the persistent white canvas but exposed a separate first-paint FOUC: Safari could paint the iframe's initial unthemed browsing context before the prepared `srcdoc` committed.
- Homepage frames now begin structurally hidden, register a one-shot revision-aware `load` gate, receive iframe color scheme/background and complete themed `srcdoc`, and are only then inserted into the DOM. The frame becomes visible only after the matching themed document load.
- The wrapper reserves the existing 60vh layout and paints the current semantic surface throughout the gate. There is no timeout, animation, Loading message, white placeholder or layout jump.
- Reapplying Light/Dark invalidates an older pending load revision, preventing an obsolete document load from revealing the next frame state. Administrator CSS, source preservation, sandbox restrictions and Local-first cache remain unchanged.
- Executed and documented by Codex in `Neutral`; visual success remains subject to the focused iPad/Safari retest.

## 2026-09-08 – Safari-safe homepage document defaults and compact User Settings

- Root Cause corrected after the iPad/Safari retest disproved iframe-element `color-scheme` as sufficient: the isolated `srcdoc` document had no author-level `html`/`body` background and text defaults, so WebKit could still paint its document canvas white.
- Added `NeutralHomepageDocument`: fragments receive a neutral complete document shell, complete documents receive the adapter at the beginning of `head`, and the adapter selects one Light/Dark scheme plus matching `html`/`body` defaults. The original administrator source remains exact and follows the adapter, so explicit author CSS continues to override framework defaults.
- The existing sandbox attributes are unchanged. The adapter is a versioned/offline shell asset and is reapplied from the persistent local theme whenever the homepage renders.
- Removed the redundant Appearance/Theme card from normal User Settings. Header sun/moon remains the sole normal theme control and the Settings save path retains the current local theme while App areas and Privacy remain intact.
- Executed and documented by Codex in `Neutral`; P4 remains device-retest-required until the five focused operator checks pass.

## 2026-09-08 – User-App visual cleanup after operator device retest

- Added a shared end-user button contract with central height, radius, border, spacing, Light/Dark, active, pointer-hover and keyboard-focus tokens; header actions and primary/navigation/icon variants now share that contract.
- Replaced the visible `Start` label with a local inline SVG home symbol while retaining the `Start` accessible name, tooltip, route and active-state behavior. `GPS` remains a text navigation item.
- Root Cause of the large light HTML homepage rectangle: the sandboxed `srcdoc` iframe advertised `light dark` without selecting the active app theme, so its independent user-agent canvas could remain light in Dark Mode. The embedding iframe now selects the current local theme through `color-scheme`; stored administrator HTML remains byte-for-byte unchanged and its explicit CSS still wins.
- Reduced the anonymous login view to Login, Username, Password and the action. Empty-state explanation text and workspace/framework terminology were removed; live status and error reporting and the server-auth flow remain unchanged.
- Executed and documented by Codex in `Neutral`; the code-side result requires the specified operator device retest before P4 may be called live passed.

## 2026-09-08 – Central Dark Theme and stable FTPS revision verification

- User-App, Header-Actions, Navigation, Settings, Inputs, GPS and Homepage-Container inherit semantic surface/text/muted/border/primary tokens in Light and Dark instead of component-local Light colors.
- Added an accessible sun/moon header control using the exact same persistent `neutral.user.theme.v1` state as Settings; switching is immediate and offline-capable.
- GitHub run history confirmed repeated post-upload smoke failures: runs `34204392812` and `34197224914` failed on a briefly stale public revision, while upload succeeded; a nearby run also observed an unavailable root during overlapping deploy activity.
- FTPS workflow now serializes production deploys. After a successful upload only revision mismatches receive bounded backoff verification; permanent mismatch, upload, URL, Base Path and other smoke errors remain failures.
- Executed and documented by Codex in `Neutral`; Theme UI remains device-retest-required and P1 remains live passed.

## 2026-09-08 – Local-first homepage warmstart and app navigation

- Root Cause der live beobachteten circa zweisekündigen Loading-Phase: Die öffentliche Homepageprojektion existierte nur im Arbeitsspeicher und wurde bei jedem Reload ausschließlich über den Server geladen. Der erste sinnvolle Render wartete daher trotz bereits bekannten Inhalts immer auf den Netzwerkpfad.
- Ein minimaler schema-versionierter `public-homepage`-Cache stellt gültiges HTML beim Warmstart synchron bereit, aktualisiert sich nach erfolgreichem Serverrefresh und funktioniert offline. Inkompatible, leere oder nicht öffentliche Records werden nicht verwendet; Session- und Berechtigungsdaten werden nicht persistiert.
- Die Performance-Marken `homepage-local-ready` und `homepage-refresh-ready` machen lokalen First Render und Serverrefresh getrennt messbar.
- Die zentrale User-App-Navigation besitzt nun touchgerechte 44px-Aktionen mit Rahmen, Fläche, eindeutigem aktiven Zustand sowie Light-/Dark-, Hover- und `:focus-visible`-Darstellung. Module erben den zentralen Stil automatisch.
- Ausgeführt und dokumentiert durch Codex in der Umgebung `Neutral`; bestehende live bestätigte P4-/GPS-/HTML-/P1-Fixes bleiben erhalten. Neuer Betreiber-Retest erforderlich.

## 2026-09-08 – P4 device follow-up: Start context, login race and readable GPS

- Ein konfiguriertes GPS-Homepage-Modul bleibt nun beim Reload im aktiven `Start`-Kontext, statt die eigenständige Modulnavigation zu aktivieren. Bis Homepage und Discovery bereit sind, verhindert ein neutraler Ladezustand den falschen Welcome-Flash.
- Gültiger HTML-Homepage-Inhalt wird ohne zusätzlichen statischen Welcome-/Neutral-Block gerendert.
- Der programmatische Fokus auf den Modulcontainer wurde als Ursache des persistenten blauen Reload-Rahmens entfernt; echte Tastaturnavigation behält explizite `:focus-visible`-Indikatoren.
- User-Login nutzt einen semantischen Formular-Submit. Eine Session-Revisionsprüfung verhindert, dass ein bereits laufender anonymer Restore die erfolgreiche Loginantwort überschreibt und dadurch einen zweiten Klick erforderlich macht.
- `Show all functions` samt Alert wurde entfernt; persönliche Bereichsauswahl und serverseitige Berechtigungen bleiben getrennt. Angefasste Bereichstexte tragen stabile I18N-Schlüssel, ohne die vollständige I18N-Architektur vorwegzunehmen.
- GPS zeigt Genauigkeit gerundet als `± … m` und Zeit localeabhängig über `Intl.DateTimeFormat`; präzise Rohwerte und ISO-Zeit bleiben intern unverändert.
- Ausgeführt und dokumentiert durch Codex in der Umgebung `Neutral`. P1 bleibt `LIVE BESTANDEN`; P4 benötigt den erneuten Betreiber-Device-Retest.

## 2026-09-08 – P4 live regression: deterministic startup and deploy-bound user assets

- Root Cause des Betreiber-Livefehlers beseitigt: unversionierte User-App-Assets konnten beim Installieren eines neuen Service Workers aus dem langlebigen HTTP-Cache übernommen werden; außerdem verhinderte ein Fehler im seriell davorliegenden Core-/Discovery-Start den Homepage-Fetch vollständig.
- Das Produktionspaket versioniert lokale CSS-/JavaScript-Verweise nun mit dem Deployment-Commit. Core-Start, Homepage-Fetch und User-Session-Restore laufen unabhängig über `Promise.allSettled`.
- PHP-Persistenztests sichern Modulmodus und bytegetreuen HTML-Inhalt; Packaging-Tests sichern die tatsächlichen versionierten User-Assets.
- Die normale User-App wurde von Username-Badge, technischen Workspace-/Discovery-Texten, Modulzahl und generischem Zurück-Button bereinigt. Navigation bleibt sichtbar und permission-aware; Produktname, Icon-Text und optionale Logo-URL bilden einen minimalen Brandingvertrag.
- P1 bleibt `LIVE BESTANDEN`; P4 bleibt bis zum positiven Betreiber-Livetest `DEVICE RETEST REQUIRED / LIVE FEHLER NACHGEWIESEN`.

## 2026-09-08 – P4 global homepage and Admin Appearance separation

- Split `Admin → Settings` and `Admin → Appearance` into independent technical and presentation views.
- Added central persistence and a public read-only projection for global homepage mode, module target, and trusted administrator HTML; writes remain protected by existing admin auth and CSRF controls.
- Added dynamic active/startable module selection, trusted HTML/inline-style/link/image/JavaScript preview and rendering, mode switching, startup loading, access-aware module opening, and robust default fallback.
- Added Node/PHP API, admin UI, startup, persistence, P1, and packaging regression coverage. P4 remains `CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED`; P1 remains `LIVE BESTANDEN`.

## 2026-09-07 – Codex environment operating path made persistent

- Documented Codex environment `Neutral` as the required secrets-safe operating environment for `El-Ninjo1965/Neutral` through project completion.
- Recorded the verified GitHub path through `GH_TOKEN`, the canonical HTTPS `origin`, the GitHub Actions and direct Explicit-FTPS endpoints, required secret names, and the recovery sequence for replaceable sandboxes without storing secret values.
- Added the environment preflight and Codex/ChatGPT handoff sequence to the binding workflow.
- Preserved `P1 = LIVE BESTANDEN`, deferred P4, and made no application or feature changes.

## 2026-09-07 – Workflow reset: operational truth hierarchy and live status corrected

- The project operating rules were reset so that the newest live operator finding, newest operator task, and `CURRENT-TASK.md` capture order are authoritative.
- Historical task states and failed device reports remain as evidence only and no longer override the current operative truth.
- P1 is recorded as `LIVE BESTANDEN` in the operational status; previous failed device tests remain archived as historical evidence only.
- Feature work remains deferred until the next dedicated task; this change is limited to governance, task capture, and documentation consistency.

## 2026-09-07 – Fix: Admin-Bereich fiel weiterhin auf die User-App-Session zurück (Device-Retest #1 Fehlschlag behoben)

- Realer iPad-Device-Retest #1 nach Commit `87bfc31` schlug fehl: Ein Login als Developer/Admin über die User-App führte im Adminbereich weiterhin zu `Access denied – Administrative access requires an authorized role.`, statt das separate Admin-Loginformular anzuzeigen. Für einen reinen Tester (ohne Adminrolle) erschien ebenfalls `Access denied`, statt korrekt das Admin-Loginformular zu zeigen, solange keine Admin-Session existiert.
- Root Cause (bewiesen): `Server/public/admin.php` prüfte bei fehlender Admin-Session (`neutral_admin_session`) zusätzlich das Legacy-Cookie der User-App-Session (`neutral_session`) und akzeptierte dessen Identität als Kandidat für die Admin-Zugriffsprüfung. Dadurch wurde jede vorhandene, ganz normale User-App-Session (Tester oder Developer, unabhängig vom Adminbereich) fälschlich als "vorhandene aber nicht ausreichend berechtigte" Identität interpretiert und löste den `Access denied`-Zweig aus, statt das Admin-Loginformular zu zeigen.
- Fix: `admin.php` liest die Identität jetzt ausschließlich aus dem Admin-Scope-Cookie (`neutral_admin_session`, konfigurierbar über `AUTH_ADMIN_SESSION_COOKIE_NAME`). Der Fallback auf `neutral_session` wurde vollständig entfernt. Eine User-App-Session hat damit keinerlei Einfluss mehr auf die Zugriffsentscheidung des Adminbereichs.
- Regressionscoverage: `tests/admin-php-entry.test.js` erweitert um Fall B2 (reine User-Session → Admin-Loginformular, nicht Access Denied), Fall B3 (User-Session mit Admin-Rolle, aber ohne separate Admin-Session → weiterhin Admin-Loginformular) und Fall C3 (parallele Admin- und User-Session → korrekte Admin-UI). Bestehende Fälle B/C/C2 wurden auf das korrekte Admin-Scope-Cookie umgestellt, da sie echte Admin-Identitäten testen.
- Validiert: vollständige Suite (392/392) unter PHP 8.3, PHP-Lint sauber, `node --check` sauber, `git diff --check` sauber, Produktionspaket-Build erfolgreich.
- Status: `P1 – User/Admin session separation: CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED`. Kein `LIVE BESTANDEN`, bis der Betreiber den zweiten Device-Retest erfolgreich durchführt.

## 2026-09-07 – Fix: PHP user/admin session separation completed in code

- Root cause identified and fixed in the PHP auth layer: the active logout path could destroy the wrong scope, and admin identity resolution could incorrectly fall back to the user session.
- Fix: logout now invalidates the currently active cookie scope instead of defaulting to the user singleton; admin and user identities resolve independently per cookie and CSRF namespace.
- Regression coverage: `tests/session-auth.test.js` adds the concurrent admin/user login/logout scenario and confirms the correct `/api/auth/me` responses and CSRF behavior for both scopes.
- Validation: full project suite passes under PHP 8.3, with PHP lint and JS syntax checks clean.
- Current status: `CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED` until a real operator device test confirms `LIVE BESTANDEN`.

## 2026-09-06 – Device-live confirmation and session-scope priority reset

- Real device test on the target app: Tester login through the normal user app succeeded, and the UI confirmed `Signed in as Tester (user)`.
- Real device test on the target app: Developer / Bootstrap Administrator login through the normal user app succeeded, and the UI confirmed `Signed in as Bootstrap Administrator (admin)`.
- These confirmations replace the earlier historical login path failures as the active device-live status.
- Current active priority: separate User-App and Admin-Interface session contexts so a logged-in admin does not overwrite the user app, and vice versa.
- Historical login anomalies (`User is not valid or active`, `Set up the local developer account before logging in`, `Server authentication client is not available`, `No authenticated user was returned by the server`) remain recorded as historical workflow evidence.

# NEUTRAL – Changelog

## 2026-09-07 – Documentation: Current-task initialization and repository status correction

- The repository was re-checked against the current git state, documentation set, and live device findings.
- The required `CURRENT-TASK.md` workflow record was created and the current task preserved as the active work ledger.
- Status docs were corrected to reflect the actual open state: P1 remains `IN ARBEIT / DEVICE RETEST REQUIRED`, with no claim of a successful live user/admin session split.
- This task was documentation-only and intentionally did not implement P1, P4, or UI changes beyond required status and workflow documentation.

## 2026-09-07 – Fix: User-App header wording normalized to `Settings`

- User-App header and settings entry now use the same wording in both signed-in and signed-out states.
- Regression coverage: `tests/user-module-access.test.js` verifies the user shell exposes consistent `Settings` wording without reintroducing the previous user/admin split issue.

## 2026-09-07 – Fix: User/Admin session scopes separated and validated

- Root cause: the runtime had been resolving a single shared session identifier for both user and admin contexts, so one login could overwrite the other and logout flows leaked across scopes.
- Fix: cookie/session resolution now treats user and admin contexts separately (`neutral_session` / `neutral_admin_session`), with matching CSRF handling and scope-aware `/api/auth/me` resolution.
- Regression coverage: `tests/session-auth.test.js` and `tests/admin-php-entry.test.js` confirm concurrent user/admin logins, isolated logout, and admin protection behavior.
- Validated: full project suite passes under the supported PHP 8.1 runtime. The earlier historic device error `No authenticated user was returned by the server.` remains documented as evidence of a different prior envelope bug; it is not the current active failure.

## 2026-09-07 – Fix: PHP-Login-Envelope-Parsing in `user-app.js` und `api-client.js` korrigiert

- Realer Device-Live-Befund auf iPad: Nach dem erfolgreichen `.htaccess`-/`api-client.js`-Delivery-Fix erschien beim Login für Developer und Tester die Meldung: `No authenticated user was returned by the server.`. Die vorherige Meldung `Server authentication client is not available.` trat nicht mehr auf.
- Root Cause (bewiesen): Die produktive PHP-API liefert für `/api/auth/login` und `/api/auth/me` über `JsonResponse::success()` eine standardisierte Envelope-Struktur `{ ok: true, data: { via: 'session', user: {...}, roles: [...], permissions: [...], csrfToken: '...', expiresAt: '...' } }`. `ApiClient.request()` parsed den Body in `result.data`, sodass `result.data` das Envelope `{ ok: true, data: {...} }` enthält. In `Web-App/public/user-app.js` gab `extractServerAuthData(result)` lediglich `result.data` zurück und `normalizeServerUser()` suchte direkt nach `identityData.user` (statt in `identityData.data.user` bzw. entpacktem Envelope). Dadurch war `user` stets `null` und löste exakt `No authenticated user was returned by the server.` aus. Ebenso las `ApiClient.login()` den CSRF-Token nur aus `result.data.csrfToken` statt aus `result.data.data.csrfToken`.
- Fix:
  1. `extractServerAuthData()` in `user-app.js` unwrappt rekursiv Envelopes (`result.data.data`, `result.data` mit `ok/data`, Node-Mock-Format `result.data.user` und flache Payloads).
  2. `normalizeServerUser()` in `user-app.js` und `applyServerIdentity()` in `master-ui.js` extrahieren das User-Objekt robust aus allen Envelope-Ebenen (`identityData.user`, `identityData.data.user`, `identityData.data.data.user` oder flachem Record) und normalisieren Rollen und Permissions.
  3. `extractEnvelopeData()` und `login()` in `api-client.js` extrahieren den CSRF-Token zuverlässig aus PHP-Envelope (`result.data.data.csrfToken`), flachem Result und Cookie.
  4. PHP 8.0-Kompatibilität in `LoginRateLimiter.php` und `DatabaseBackupService.php` sichergestellt (`readonly`-Properties durch explizite typisierte Properties ersetzt).
- Regressionstests: `tests/user-app-server-auth.test.js` erweitert um Tests mit realer PHP-`JsonResponse`-Envelope-Struktur für `/api/auth/login` und `/api/auth/me`, Node-Testbackend-Format und CSRF-Extraktion.
- Verifikation: 387/387 Tests bestanden, PHP-Lint aller Dateien fehlerfrei, `node --check` sauber, `git diff --check` sauber, Secret-Scan sauber, `npm run package:production` erfolgreich.

- Realer Device-Live-Befund: `Server authentication client is not available.` blieb trotz der vorherigen User-App-/Global-Export-Fixes weiterhin bestehen.
- Echte Root Cause: `.htaccess` mappt `api-client.js` nicht auf `Web-App/public/api-client.js`, sodass der Browser den Auth-Client über den Public-Root-Pfad nicht erhielt und der Login-Pfad keine valide Runtime-Instanz bekam. Das ist ein Host-/Delivery-Problem, nicht nur ein `window`- vs. `globalThis`-Problem.
- Fix: `^api-client\.js$` wird direkt auf `Web-App/public/api-client.js` gemappt; der Login-Pfad und die Export-Contract bleiben unverändert auf dem echten Server-Auth-Client. Neuer Regressionstest in `tests/user-app-server-auth.test.js` prüft das Public-Route-Contract zusätzlich.
- Verifiziert lokal: vollständige Suite, PHP-Lint, `node --check`, `git diff --check`, Secret-Scan und Produktionspaket-Build grün.
- Keine Live-Device-Abnahme als bestanden markiert; der verbleibende Host-/Geräte-Test muss im produktiven Browser/Host erneut erfolgen.

## 2026-09-07 – Kritischer User-App-Login-Blocker aus Device-Livetest behoben

- Realer iPad-Devicetest gegen die produktive User-App-UI ergab: reale, serverseitig aktive Nutzer (`Tester`, ID 102, Rolle `user`; ein bereits eingerichteter `Developer`) konnten sich nicht über die tatsächliche Login-Oberfläche anmelden (`User is not valid or not active.` / `Set up the local developer account before logging in.`).
- Root Cause (per Quelltextanalyse bewiesen): `Web-App/public/user-app.js` verband das Login-Formular ausschließlich mit dem rein lokalen, `localStorage`-basierten Entwickler-Bootstrap `LocalAuth`, nie mit dem echten Server-Endpunkt `/api/auth/login`; `index.html` lud den Server-Auth-Client `api-client.js` nicht. Die Admin-UI (`master-ui.js`) war bereits korrekt verdrahtet.
- Fix: `user-app.js` nutzt jetzt `ApiClient.login()/.logout()/.me()` gegen `/api/auth/*`, `index.html` lädt `api-client.js`, `service-worker.js` cached `api-client.js` zusätzlich, damit der Offline-/Warmstart-Vertrag bestehen bleibt. Kein Tester-/ID-102-/Developer-Sonderfall; `LocalAuth`/`core-auth.js` bleiben unverändert für den Setup-/Entwickler-Bootstrap-Fall bestehen.
- Neuer Regressionstest `tests/user-app-server-auth.test.js` (5 Tests) pinnt die Architektur. Vollständige Suite: 382/382 bestanden (377 vorher + 5 neue). PHP-Lint, `node --check`, `git diff --check`, Secret-Scan und Produktionspaket-Build erfolgreich.
- Weitere heutige Device-Live-Beobachtungen (Performance, Navigation/UX, i18n, Permission-Catalog-UX, Session-Overview-Idee, System-Settings-Bestätigung, GPS-Pro-Zukunftsidee) sind in `ToDoNow.md` Abschnitt G dokumentiert, aber bewusst nicht umgesetzt. Device-Retest des Logins steht noch aus; kein Core-1.0-Freeze erklärt.

## 2026-09-06 – CI-/FTPS-Fehler behoben: nativer Node-`SIGABRT` in `tests/app-bootstrap.test.js`

- FTPS Deploy [`34014196091`](https://github.com/El-Ninjo1965/Neutral/actions/runs/34014196091) für Commit `1e76a64` scheiterte an der Teststufe mit `SIGABRT`/`ERR_TEST_FAILURE`. Root Cause bewiesen (nicht vermutet): ein bekannter Upstream-Node.js-Bug (`nodejs/node#63970`) im nativen Fast-Path von `fs.cpSync({recursive:true})`, ausgelöst beim Kopieren des `.git`-Baums einer Test-Fixture in `tests/app-bootstrap.test.js`. Die im Log sichtbare PHP-Version 8.3.6 war nachweislich nur Korrelation, keine Ursache.
- Fix: beide betroffenen `fs.cpSync(cleanSourceRoot, ..., {recursive:true})`-Aufrufe durch eine manuelle, dateiweise `copyDirectoryTreeSync()`-Kopie ersetzt (Commit `8073d32`). Kein Test übersprungen/geschwächt, keine PHP-Mindestversion geändert.
- Lokal verifiziert: isolierter Test 3× 18/18 bestanden; vollständige Suite 377/377 (PHP 8.4.15); PHP-Lint, `node --check`, `git diff --check`, Secret-Scan und Produktionspaket-Build erfolgreich.
- Neuer FTPS Deploy [`34015306976`](https://github.com/El-Ninjo1965/Neutral/actions/runs/34015306976) und CodeQL [`34015306449`](https://github.com/El-Ninjo1965/Neutral/actions/runs/34015306449) für Commit `8073d32` erfolgreich; Produktion wieder auf aktuellstem `main`-Stand deploybar. Details siehe `STATUS.md`/`WORKFLOW.md`.

## 2026-09-06 – Settings-, Session- und User-App-Verträge

- Application ID im Admin-Settings-UI readonly gemacht und im PHP-Settings-Service gegen direkte Manipulation geschützt; Application Name bleibt persistent änderbar.
- User-Theme (Light/Dark) wird lokal vor dem ersten Paint geladen und gemeinsam mit lokalen Präferenzen offline persistent gespeichert. Erfolgsdialog navigiert nach Bestätigung zur Startseite, Fehler bleiben sichtbar.
- Permission Catalog um erklärenden read-only Vertrag erweitert; Session Overview zeigt Identität/User-ID/Rollen/Status/Issued/Expires und unterstützt bestätigte Einzelinvalidierung.
- Normale Modulansichten enthalten keine automatisch eingeblendete technische Beschreibung und keinen redundanten generischen Back-Link.
- Node-Syntax, PHP-Lint, `git diff --check` und fokussierte Admin-/Auth-/User-Regressionen geprüft; produktive LIVE-/Device-Abnahme bleibt offen.

## 2026-09-06 – Tester-Login / Session / RBAC lokal im Codespace live verifiziert

- Lokaler Live-Check gegen die Codespace-Instanz erfolgreich: `Tester` konnte sich mit einem nicht dokumentierten Testwert (`user`, Status `active`, ID `102`) anmelden; `/api/auth/login` setzte das Session-/CSRF-Cookie, `/api/auth/me` bestätigte die Session als `user`, und `/api/admin/users` verweigerte den Zugriff mit `403 FORBIDDEN`.
- Die authentifizierten Login-/Session-/RBAC-Regressionsprüfungen bleiben grün (`node --test tests/session-auth.test.js tests/admin-api.test.js tests/vision-framework.test.js`).
- Die realen Produktiv- und Deployment-Abnahmen für den Gesamtfreeze-Block (Geräte-, Host-, Smoke- und Deployment-Schritte) bleiben ausdrücklich offen; sie werden nicht als bestanden markiert.

## 2026-09-06 – Korrektur: Admin-CSS-Cache-Busting-Fix nach realem Live-Test-Widerspruch

- **Korrektur:** Der reale Live-Test nach Deployment `89a4178` widersprach den Einträgen vom 2026-09-05 „Offline-Root-Cause behoben“ und „Admin-UI-Regression: keine Abweichung gefunden“ — beide Probleme waren real weiterhin vorhanden. Diese Schlussfolgerungen werden zurückgenommen (siehe STATUS.md/WORKFLOW.md für Details).
- Reale Admin-UI-Root-Cause gefunden: `Server/public/admin.php`/`Server/php/views/admin-ui.php` referenzierten `style.css`/Admin-JS ohne Cache-Busting, während `.htaccess` diese Dateien pauschal 24h cached — nach Deployment blieb bei bereits geladenen Clients bis zu 24h die alte Version aktiv, während die HTML-Shell sofort frisch war. Neue `PublicPath::assetUrl()`/`AppConfig::assetUrl()` hängen `?v=<manifest.json sourceCommit>` an; `AppRuntime::detectAssetVersion()` liest die Version sicher (Fallback `null`) aus dem bereits vorhandenen Produktions-`manifest.json`.
- Service Worker als Ursache geprüft: `style.css` wird zwar SW-`cacheFirstWithRefresh`-behandelt, aber unter deploy-stamp-gebundenem Cache-Namen (selbstkorrigierend); `admin.php` selbst ist von SW-Caching ausgeschlossen. Keine SW-Änderung vorgenommen.
- Temporäre, klar markierte `CorePerformance`-Zeitmarkeninstrumentierung entlang der gesamten Startkette ergänzt (`core-startup.js`, `core-loader.js`, `module-manager.js`, `module-registry.js`, `master-ui.js`), um die reale Ursache der weiterhin unveränderten ~3,5s-Offline-Verzögerung bei der nächsten Gerätemessung zu bestimmen. Keine Performanceänderung ohne Messdaten vorgenommen.
- Neue rot→grün-Tests: `AppConfig::assetUrl` (`tests/php-public-path.test.js`) und `Fall C2` (`tests/admin-php-entry.test.js`).
- Vollständige Suite: 375/375 bestanden. PHP-Lint fehlerfrei. `node --check`/`git diff --check` bestanden.
- **Offen/weiterhin ungeklärt:** exakte ms-Aufschlüsselung der 3,5s-Verzögerung (erfordert reale Gerätemessung); reale iPad-Bestätigung, dass der CSS-Fix das Layout tatsächlich repariert; Online-Discovery-Performance (~5,5s); Safari; Android Chrome.

## 2026-09-05 – Offline-Warmstart-Delay behoben, Admin-UI-Regression geprüft und Local-Settings-Fehleranzeige ergänzt

- `Web-App/core/core-loader.js` blockiert nun Remote-Katalog-Refreshes bei `navigator.onLine === false`; das cached anonymous Catalog bleibt der sofort nutzbare Last-Known-Good-Status, statt in einem offline-Timeout zu hängen. Dies ist ein Code-Root-Cause-Fix mit Testbeleg (`tests/module-offline-catalog.test.js`), keine reale Chrome-/iPadOS-Neumessung der zuvor beobachteten ~3,5s.
- Online-Discovery-Kette (`CoreStartup` → `DatabaseManager`/Framework-Init → `ModuleManager.discoverModules` → `ModuleRegistry.discover` → `CoreLoader.discoverExternalModules`) getraced: kein hartcodierter Timeout oder blockierender Auth-Call gefunden; die Kette ist strukturell seriell. Keine Architekturänderung vorgenommen, da ohne reale Messung spekulativ.
- Admin-UI-Regression geprüft: `Web-App/public/admin/shell.js` und `Web-App/public/admin/navigation.js` sind seit dem letzten Admin-CMS-Commit `3bbee0b` unverändert; alle 14 Admin-CMS-Pflichttests bestehen weiterhin. Keine Wiederherstellung notwendig.
- `Web-App/public/user-app.js`: `saveUserPreferences()` liefert jetzt `persisted: boolean`; Save-/Reset-Button in den lokalen Settings zeigen bei fehlgeschlagener `localStorage`-Persistenz eine sichtbare Fehlermeldung statt fälschlich „Settings saved successfully.“ Neue CSS-Klasse `.user-settings-status.error` in `Web-App/public/style.css`.
- `tests/module-offline-catalog.test.js` ergänzt den Regressionstest für den echten Offline-Warmstart-Pfad; `tests/live-startup-regression.test.js` ergänzt zwei Tests für den Save-Error-/Save-Success-Pfad der lokalen Settings.
- Vollständige Suite `PATH="/usr/local/php/current/bin:$PATH" npm test`: 373/373 bestanden. PHP-Lint über alle 36 `Server/**/*.php`-Dateien mit `/usr/local/php/current/bin/php -l`: fehlerfrei. `git diff --check` bestanden.

## 2026-09-05 – Offline-First-Service-Worker, HTTPS-Erzwingung und Warmstart-Diagnose

- Neuer Core-Service-Worker `Web-App/public/service-worker.js`: versionierter App-Shell-Cache (`neutral-shell-v<Source-Commit>`, vom Produktionspaket-Build in die ausgelieferte Datei injiziert; Repo-Quelle bleibt generisch, Build bricht ohne gültigen Commit erkennbar ab), Precache von HTML/CSS/Core-Skripten, Navigation network-first mit Shell-Fallback, statische Assets cache-first mit Hintergrund-Refresh, einmal geladene Modul-Entries offline nutzbar, kontrollierte Entfernung alter Cacheversionen, strikte Sicherheitsgrenze (kein Caching von Nicht-GET, `/api/`, Auth/Admin/Setup);
- Registrierung in `Web-App/public/user-app.js` ausschließlich unter Secure Context, ohne First-Paint-Blockade;
- Root-`.htaccess`: permanente 301-HTTPS-Erzwingung (Pfad/Query erhalten), `service-worker.js`-Rewrite am Scope-Root, `no-cache` für den Service Worker, `Cache-Control: public, max-age=86400` für übrige JS/CSS-Assets;
- `scripts/production-readonly-smoke.js` weist die HTTPS-Live-Anforderung getrennt vom Code-Deployment aus (`httpsProbe`-Evidenz, `httpsEnforced`), statt fehlende HTTPS-Umleitung als vollen Erfolg zu melden;
- temporäre lokale Diagnosebereiche `Startup-Diagnose (temporär)` (Core-Performance-Marken) und `GPS-Diagnose (temporär)` (koordinatenfrei) für die reale Gerätemessung; beide nach erfolgreicher Diagnose wieder zu entfernen;
- Warmstart: Discovery hydriert local-first aus dem anonymen Katalogcache und rekonziliert remote im Hintergrund;
- `ModuleCreation.md` um den allgemeinen Offline-Vertrag für Module ergänzt; `Architecture.md` um den Service-Worker-/Offline-First-Abschnitt erweitert.

## 2026-09-05 – GPS-Benutzer-UI und persönliche Auto-Position ergänzt

- `Web-App/app/modules/gps/index.js` auf den realen Benutzerfluss korrigiert: einfache `GPS`-Übersicht, `Aktuelle Position` im normalen UI, echtes Modal/Popup bei noch offener Standortentscheidung, kein roher `Permission: prompt/granted/denied` im Standard-UI, `Position beim Öffnen automatisch ermitteln` als persistinges `moduleSettings.gps.autoRequestOnOpen`, und `Position teilen` mit validem Share-/Copy-Fallback ohne iOS-/Android-Hardcodierung;
- `Web-App/app/modules/gps/module.json` und `Web-App/app/modules/index.json` um die neue Auto-Position-Einstellung erweitert;
- `ModuleCreation.md` um den persönlichen `moduleSettings.<id>`-Namespace für nutzerbezogene Modulvoreinstellungen ergänzt; Installations-/Lifecycle-Verantwortung bleibt getrennt;
- `WORKFLOW.md` erweitert um den verifizierten GPS-UX-/Settings-Entscheidungsstand und die verbleibenden Live-Geräteabnahmen.

## 2026-09-05 – GPS-Referenzmodul und plattformneutraler Gerätevertrag konsolidiert

- `Web-App/app/modules/gps/index.js` auf den neutralen Gerätevertrag angehoben: kein automatischer Browser-Permissiondialog im `prompt`-Zustand, explizite Bestätigung mit `Ja/Nein`, kurze Fehlernachricht bei verweigertem Standort, kein unkontrollierter Repeat-Request beim Öffnen und ein `Position teilen`-Flow mit `navigator.share` sowie Copy-Fallback ohne iOS-/Android-Hardcodierung;
- `ModuleCreation.md` um den verbindlichen mobilen „Mobile-First / Capability-Detection / Fallback / Permission / Native-Wrapper“-Vertrag ergänzt;
- `Architecture.md` und `STATUS.md` auf den plattformneutralen GPS-/Gerätevertrag abgestimmt;
- GPS-Regressionsprüfung mit Fokus auf Zustimmungspfad, Permission-Flow und Share-API ergänzt und erfolgreich verifiziert.

## 2026-09-05 – PHP-Mindestversionen konsistent und Testnachweis persistiert

- aktive PHP-Mindestversionsangaben im produktiven Core auf `PHP 8.1+` vereinheitlicht (`PrerequisiteChecker`, modulare `compatibility.php`-Einträge und offene Installations-/Produktionsdokumentation);
- offene TODO-Punkte mit `AUTONOM IM CODESPACE`, `LIVE / BETREIBERABHÄNGIG` und gemischten Fällen klassifiziert;
- aktueller verifizierter Nachweis im Workflow dokumentiert: Codespace-PHP 8.4.15 über `/usr/local/php/current/bin/php`, kompletter PHP-Lint mit Exit 0, vollständiger `npm test`-Lauf mit 319/319 Tests und 0 Fehlern sowie erfolgreicher `git diff --check`.

## 2026-09-04 – PHP-Mindestversion und Dokumentationskonsistenz verifiziert

- reale PHP-Mindestversion im produktiven Code auf `PHP 8.1+` bestätigt (`readonly`-Eigenschaften und Constructor Property Promotion in `Server/php/src/LoginRateLimiter.php` und `DatabaseBackupService.php`);
- zentrale Dokumente auf die tatsächliche Mindestplattform `PHP 8.1+` mit MySQL/MariaDB und HTTPS präzisiert;
- widersprüchliche Aussagen zu API-Versionierung, `GPS`/`reference-notes` und Übergabekriterien gegen Code und höhere Dokumentation abgeglichen.

## 2026-09-04 – Dokumentationskonsistenz und Referenzmodularchitektur bereinigt

- Architektur- und Dokumentationswidersprüche in `Architecture.md` anhand von Code, Tests und vertraglicher Dokumentation korrigiert,
- `GPS` als technische Geräte-/Client-Referenz und `reference-notes` als zweites fachlich unabhängiges Server-/Modulvertragsbeispiel eindeutig getrennt,
- `reference-notes` als reine Vertragsreferenz beschrieben und dessen Entfernung bei neuen Produktkopien mit dem Bootstrap-Vertrag bestätigt,
- API-Versionierung und zentralen Timeout-Vertrag mit den tatsächlichen PHP-/Browserimplementierungen in Einklang gebracht,
- betroffene Prüfdatumsangaben auf 2026-09-04 aktualisiert und `WORKFLOW.md` um den Nachweis der Dokumentationsprüfung ergänzt.

## 2026-09-04 – Dauerhaften Produktions-Smoke an das Deployment gebunden

- bisherigen einmaligen HTTP-Nachweis als wiederholbaren, rein lesenden Node-Smoke umgesetzt,
- FTPS-Workflow führt den Smoke unmittelbar nach jedem erfolgreichen Upload aus,
- geprüft werden HTTPS-Root, SPA-Rewrite, unautorisierter Adminschutz, Status-API, anonymer Modulkatalog, Viewer-GPS-Rechte, Schutz des internen PHP-Cores und der ausgelieferte `reference-notes`-Serververtrag,
- Ausgaben enthalten ausschließlich begrenzte HTTP-/Bool-Statuswerte; keine Antwortinhalte, Sitzungen oder Zugangsdaten,
- Redirectziele werden auf HTTPS, erwarteten Origin und exakten Basispfad begrenzt; das öffentliche Paketmanifest muss zusätzlich denselben sauberen Git-Commit wie der Workflow ausweisen,
- Titel und Modulverträge werden aus dem jeweiligen Projekt abgeleitet; neue App-Kopien erhalten eine verpflichtend neu zu setzende öffentliche Zielvariable und keine Neutral-spezifische GPS-Viewer-Vorgabe,
- der abschließende Job veröffentlicht `production/ftps-http`; bei Fehlern hängt er nur die begrenzte Stufe `target`, `tests`, `package`, `client`, `upload` oder `smoke` an den Statuskontext an, damit der Push-Workflow ohne Log- oder Secretzugriff über den GitHub-Connector überprüfbar ist,
- nach dem ersten belegten Abbruch in `tests` wurde die Diagnose test-first auf den bereinigten Testdateinamen begrenzt; Testausgaben, Laufzeitwerte und Secrets werden nicht in den Commitstatus übernommen,
- der dadurch identifizierte Fehler in `app-bootstrap` stammte aus einer unvollständigen Auswahl der verschachtelten PHP-freien Kopientests; die Auswahl erkennt PHP-Prozessfälle nun am Inhalt und schließt sie vollständig aus, während die oberste GitHub-Suite diese Fälle weiterhin mit PHP ausführt,
- der nächste PHP-Lauf identifizierte im Serververtrag einen verkürzten, fälschlich als gültig markierten Migrations-Testschlüssel; die Testfixture verwendet nun wie Produktivvertrag und Referenzmodul das vollständige Format `Datum_Laufnummer_Beschreibung`, ohne die Validierung aufzuweichen,
- test-first durch **Codex (ChatGPT Work / GitHub-Connector)** umgesetzt; lokale ausführbare Gesamtsuite mit 283 Tests, 275 bestanden, acht erwarteten PHP-Skips und 0 Fehlern; Commit `8846c96aabe1abe143b8f84295d97c7369296a67` bestand anschließend vollständige GitHub-/PHP-Tests, Paketbau, explizites FTPS und den permanenten Read-only-HTTP-Smoke (`production/ftps-http`).

## 2026-09-03 – Allgemeinen Modul-Serververtrag vervollständigt

- strikten, versionierten Kompatibilitätsvertrag für Core `1.x`, API `v1` und PHP 8+ eingeführt,
- geschützte modul-eigene PHP-Entries, Services und relative API-Routen über einen einzigen fachneutralen Dispatcher angebunden; Auth, Permission und CSRF bleiben serverautoritativ,
- rollenspezifische quantitative Limits sowie SHA-256-gebundene, gesperrte SQL-Migrationen mit Kompensations- und sicherem Rollbackpfad umgesetzt,
- Modulupdate nur im inaktiven Zustand und ohne Downgrade; Deinstallation nur inaktiv, standardmäßig mit Datenerhalt und destruktiv ausschließlich für validierte eigene Tabellen,
- GPS auf den Vertrag gehoben und `reference-notes` als zweites unabhängiges, real ausführbares Vertragsreferenzmodul ergänzt; neue Produktkopien entfernen dieses reine Referenzmodul automatisch,
- zwei unabhängige Reviewrunden vollständig eingearbeitet: fremde/destruktive Rollbackziele geschlossen, reversible Eigene-Tabellen-Migrationen erhalten, Downgrades an allen Lifecycle-Einstiegen gesperrt, Migrationshistorie bei `retain` erhalten, Servicefactory erst nach Autorisierung, Updatekompensation und Permission-Pruning, limitweite DB-Sperre, vollständiges GPS-Opt-out und crashfester Core-DDL-Retry,
- test-first durch **Codex (ChatGPT Work)** umgesetzt; lokal 269/269 ausführbare Tests bestanden, acht PHP-Prozesstests mangels lokaler PHP-Binary übersprungen; GitHub-/PHP-/Produktionsnachweis folgt separat.

Abgeschlossene materielle Änderungen werden hier chronologisch dokumentiert. Offene Arbeit steht ausschließlich in [`TODO.md`](TODO.md).

## 2026-09-03 – Anonymen Offline-Modulzugriff und GPS-Startverhalten lokal abgeschlossen

- öffentliche Modulentscheidung serverseitig auf aktive, anhand der gespeicherten `viewer`-Modulrechte sichtbare Module begrenzt und nur als bereinigte Browserflags `canView`/`canUse` ausgeliefert; keine anonyme Admin- oder Serverberechtigung eingeführt,
- echten API-Umschlag im Loader verarbeitet, ausschließlich bestätigte anonyme Kataloge installationsbezogen gespeichert und Offlinezugriff ohne gültigen anonymen Cache fail-closed gehalten,
- `clientAccess` durch Loader, Interface und Registry erhalten; öffentliche Navigation, Direktaufrufe und lokale Sichtbarkeit ohne permissiven Fallback abgesichert sowie anonyme Settings eindeutig als „Local settings“ gekennzeichnet,
- persistiert aktive Module nach Discovery in den tatsächlichen Client-Lifecycle überführt; GPS zeigt den letzten lokalen Standort sofort, aktualisiert bei bereits erteilter Berechtigung höchstens einmal pro Mount und löst keinen automatischen Erst-Prompt aus,
- Adminhinweis erläutert, dass `viewer`-Sicht- und Nutzungsrecht den öffentlichen Modulzugriff steuern, ohne Serverrechte zu erteilen,
- abschließende Spezifikationsprüfung deckte zusätzlich öffentlich mitgelieferte Permissiondefinitionen, Datenbank- und Managementmetadaten auf; test-first entfernt, sodass der Clientkatalog nur Sicht-/Nutzungsdefinitionen behält,
- fokussierte RED/GREEN-Nachweise sowie die PHP-ausgeschlossene Gesamtsuite mit 261 Tests, 258 bestanden, drei erwarteten PHP-Skips und 0 Fehlern bestanden,
- sauberes Produktionspaket mit 93 Dateien gebaut; Manifest, Inventar, Größen, SHA-256, Einstiegspunkte, exakte HTTPS-Basis und Secretfreiheit bestanden. PHP-Binary und echtes Rewrite blieben wahrheitsgemäß `NICHT_GEPRUEFT`,
- über den bestätigten Connector für Konto `El-Ninjo1965` als Commit `a7af22953ec3af6accdf93c937025acfd69690c7` fast-forward nach GitHub `main` integriert,
- Live-Smoke deckte eine fehlende Root-Rewrite-Regel für `user-module-access.js` auf; test-first mit Commit `32564288d62bdf0dd84c0939141d4775e6c9bb15` behoben und erfolgreich ausgerollt,
- Deployment dauerhaft durch `npm ci`, PHP-CLI und die vollständige Testsuite vor Paketbau/Upload gesperrt. Die ersten beiden Gate-Läufe stoppten wegen zuvor verdeckter frischer-Runner-Probleme sicher vor dem Upload; Prozessvariablen werden nun PHP-portabel über `getenv()` geladen und der alte Loginpfad-Test folgt dem zentralen Resolver,
- finaler Codecommit `f1b1522b48f5605a20219d0cc57fb9eb2115ebb2`, CodeQL-Lauf `33815089560` sowie FTPS-Lauf `33815089715` einschließlich vollständiger Node-/PHP-Suite mit 296/296 Tests und Paketbau bestanden,
- finaler öffentlicher Read-only-Smoke: Root, Helper und Modulkatalog HTTP 200, Helper `text/javascript`, Admin ohne Sitzung 401; anonymer Katalog enthält ausschließlich aktives GPS mit `canView=true`, `canUse=true` und ohne Permissiondefinitions-, Datenbank-, Management- oder Adminmetadaten,
- implementiert und dokumentiert durch **Codex (ChatGPT Work / GitHub-Connector)**.

## 2026-09-03 – Produktiven Admin-Funktionstest und neutrale Loginfelder abgeschlossen

- echten Betreiberlogin sicher im geschützten Browserdialog ausgeführt und die fortbestehende Sitzung über alle 15 Admin-Hauptansichten ausschließlich lesend bestätigt; keine alte Dashboardansicht, sichtbare Anwendungsfehlermeldung, Warnbox oder hängende Ladeanzeige festgestellt,
- 62 Konsolenmeldungen als einheitliche Browser-Extension-Metadatenfehler und nicht als Neutral-Anwendungsfehler klassifiziert,
- voreingestellte Kennungen `admin` und `Developer` sowie den clientseitigen `Developer`-Fallback test-first entfernt; gezielter Regressionstest zunächst rot und danach mit allen 14 Admin-CMS-Tests grün,
- Codecommit `d31c870e83922ac518f127d8eccdecc42d5ea62f` auf `main`, FTPS-Lauf `33807649560` und CodeQL-Lauf `33807649227` erfolgreich,
- abschließender öffentlicher Read-only-Lauf `33808897301` bestätigt Root/Asset/Status-API mit HTTP 200, den unautorisierten Admin-Einstieg mit 401, interne PHP-Datei mit 403 und produktiv leere Login-Kennungsfelder,
- Logout ausgelöst, wegen anschließendem CDP-/Browser-Recovery-Timeout jedoch nicht als erfolgreich gewertet; sichtbares Sitzungsende, negativer CSRF-Livefall, Login-Drosselung und reale responsive iPad-/Safari-Abnahme bleiben offen,
- keine produktiven Schreib-, Lösch-, Datenbank- oder E-Mail-Operationen und keine Ausgabe von Zugangsdaten; ausgeführt und dokumentiert durch **Codex (ChatGPT Work / GitHub-Connector)**.

## 2026-09-03 – Zertifikatsgültiges Produktionsdeployment abgeschlossen

- produktiven Workflow test-first auf den zertifikatsgültigen FTPS-Host `server.cpprotect5.de` und Port 21 festgelegt; TLS-Zertifikats- und Hostnamenprüfung bleiben zwingend, Benutzer und Passwort ausschließlich GitHub Secrets,
- erstes erfolgreiches Deployment mit Lauf `33801527270` in das vorhandene geschützte Ziel ausgeführt; Betreiber-Screenshot bestätigte im geöffneten `public_html` die Ordner `Web-App` und `Server` sowie aktuelle Paketmetadaten,
- eine nach dem virtuellen FTP-Root-Nachweis getroffene falsche Codex-Annahme transparent korrigiert: Lauf `33802090900` zielte kurzzeitig auf Konto-Home `/`; anschließend wurde der Workflow test-first wieder auf `secrets.FTP_TARGET_DIR` zurückgestellt. Bestehende Konto-Home-Verzeichnisse wurden nicht gelöscht,
- Korrekturcommit `20583c251a9f6f5e069a6c089c01f99618aa2196` auf `main` übertragen; FTPS-Lauf `33802485499` und CodeQL-Lauf `33802485847` bestanden,
- abschließender separater Read-only-Lauf `33803384719` bestätigte Server, TLS, Authentifizierung, lesbares geschütztes Ziel und die drei Marker `.htaccess`, `Web-App` und `Server`; keine Upload-, Änderungs- oder Löschoperation im Diagnosejob,
- öffentliche Browserprüfung bestätigte „Neutral Platform“, die geschützte Admin-Anmeldeseite und das Fehlen der alten Ansicht „FRAMEWORK DASHBOARD“,
- fokussierte Deployment-/Paketprüfung mit 52/52 sowie abschließende PHP-freie Regression mit 230/230 bestanden; der ungekürzte lokale Testbefehl bleibt in dieser Cloud wegen fehlender PHP-Binary blockiert und wird nicht als grün ausgegeben,
- Zugangsdaten, Secretwerte und vollständige Verbindungsstrings wurden weder protokolliert noch dokumentiert,
- ausgeführt, korrigiert und dokumentiert durch **Codex (ChatGPT Work / GitHub-Connector)**.

## 2026-09-03 – Portable Installationsbasis lokal abgeschlossen

- zertifikatsgültigen Hostingnamen `server.cpprotect5.de` über Reverse-DNS, identische Ziel-IP und einen separaten expliziten FTPS-Read-only-Lauf bestätigt; Lauf `33800747981` akzeptierte TLS und Authentifizierung und las den virtuellen Startpfad `/`,
- vorhandenen Serverroot ohne Inhaltsausgabe klassifiziert: 64 sichtbare Einträge und `.htaccess`, jedoch keine Ordner `Web-App/` oder `Server/`; damit ist die alte Deploymentstruktur und der noch fehlende portable Upload belegt,
- Diagnose durch **Codex (ChatGPT Work / GitHub-Connector)** ohne Upload, Änderung, Löschung oder Secret-Ausgabe durchgeführt,

- öffentlicher Basispfad für Domain-Root, eigenen physischen DocumentRoot und URL-Unterpfad zentral in PHP und Browser umgesetzt; direkt abschließendes API-Rewrite, konfigurationsbasiertes PHP-Routing und paketiertes `<base href>` halten auch tiefe SPA-Routen unter demselben Vertrag,
- reproduzierbares Produktionspaket mit Produzenten-/Formatkennung, `sourceDirty`, exakter Allowlist, wertfreier `.env.example`, sortiertem Manifest und `SHA256SUMS` sowie gemeinsamem, maskierendem Secret-Scanner einschließlich verschlüsselter Private Keys eingeführt; fremde oder unvollständig verifizierte Ausgaben werden nicht ersetzt,
- FTPS-Deployment verlangt ein ausdrückliches Ziel, erzwingt Zertifikats-/Hostnamenprüfung, bindet verwaltete Löschungen per SHA-256-Fingerprint an Ziel und Paketformat, löscht keine historischen HTML-Dateien pauschal, überträgt das Paket ohne `--only-newer` vollständig und reicht das lftp-Skript nur über stdin weiter,
- lokaler App-Bootstrap für validierte Appmetadaten, optionale GPS-Auswahl und optionales `git init` ohne Remote ergänzt,
- paketbasierter Preflight prüft Hashes, Inventar, Symlink-/Traversalgrenzen, beide Resolver-Einstiege, exakte Meta-/`base`-Markierungen sowie eine rohe, whitespacefreie, case-insensitive `https://`-Basis mit nichtleerer Authority, bevor WHATWG-, Credential-, Query-, Fragment- und exakte Basispfadprüfungen folgen; Statuswerte sind ausschließlich `PASS`, `BLOCKED` und `NICHT_GEPRUEFT`,
- fehlende lokale PHP-Binary und externes Rewrite werden nicht als bestanden ausgegeben; Paket-/Inventar-/Hash-/Basispfad- und Secretfehler blockieren mit maskierten Ausgaben,
- alle finalen Reviewbefunde test-first reproduziert; die abschließende PHP-ausgeschlossene Gesamtsuite mit 239 bestandenen, zwei erwarteten PHP-Skips und 0 Fehlern verifiziert; keine Server-, DB-, FTP-, GitHub- oder sonstige externe Operation ausgeführt,
- den einzigen Restbefund der fokussierten Nachprüfung durch **Codex (ChatGPT Work)** geschlossen: auch Adminformulare, Connection-/Provider-Normalisierung und Setupzustände beziehen öffentliche API-Defaults nun aus `NeutralPublicPath`; der erweiterte Regressionstest und die unveränderte Gesamtsuite bestehen,
- Web-App- und Serveranleitung beschreiben denselben verbindlichen Full-Stack-Paketweg; die Web-App-Anleitung behandelt dessen Browseranteil und erfindet kein separates Client-only-Artefakt,
- GitHub-`main` über den Connector integriert; nach zwei test-first Deploymentkorrekturen ist `6b59ec68f980517fbbd49a5e8604a45b5acc1cdc` der finale Codecommit und CodeQL-Lauf `33716675598` erfolgreich,
- Hostnamenprüfung im GitHub-Workflow unveränderlich auf `true` gesetzt und lftp-Skript weiterhin geheimnisfrei über den vom installierten Client unterstützten argumentfreien stdin-Aufruf übergeben,
- finaler FTPS-Lauf `33716676051` baute das Paket und erreichte den Server, brach aber wegen nicht übereinstimmender Zertifikats-/Hostname-Identität vor Authentifizierung und Upload sicher ab; kein Deploymenterfolg wird behauptet,
- PHP-/Apache-/Live-/Datenbank-/neues-Repository- und erfolgreicher FTPS-Nachweis bleiben ausdrücklich offen,
- ausgeführt und dokumentiert durch **Codex (ChatGPT Work)**.

## 2026-09-02 – Portable Installationsarchitektur freigegeben

- die portable Installationsbasis als eigenständiges erstes Core-1.0-Arbeitspaket spezifiziert,
- Domain-Root, eigener physischer Document-Root und URL-Unterpfad über einen validierten `NEUTRAL_BASE_PATH` eindeutig getrennt,
- Produktionspaket, wertfreie Konfiguration, lokaler App-Bootstrap, Preflight, Sicherheitsgrenzen und testbare Abnahmekriterien verbindlich beschrieben,
- Modulvertrag, Providerverwaltung und Betriebsportabilität bewusst als nachgelagerte eigenständige Arbeitspakete abgegrenzt,
- spezifiziert und dokumentiert durch **Codex (ChatGPT Work / GitHub-Connector)**.

## 2026-09-02 – Core-1.0-Neuinstallationslücken präzisiert

- nachgewiesenen Domain-Root-Deploy, einen neuen physischen Document-Root und eine noch nicht bestandene Installation unter URL-Unterpfaden klar getrennt,
- root-absolute Client-, Admin- und API-Pfade als Blocker für URL-Unterpfade dokumentiert; das physische FTPS-Ziel bleibt eine separate Konfiguration,
- fehlendes Produktionspaket, Environment-Bootstrap, Neu-Repository-Verfahren sowie leere End-to-End-Installation als konkrete Abnahmepakete in `TODO.md` aufgenommen,
- verbindlich festgehalten, dass Root-`.htaccess`, der vollständige Ordner `Web-App/`, `Server/php/` und `Server/public/` gemeinsam und ohne Abflachung übertragen werden müssen,
- analysiert und dokumentiert durch **Codex (ChatGPT Work / GitHub-Connector)**.

## 2026-09-02 – Admin-CMS-Browserstart repariert

- sechs Admin-Komponenten veröffentlichen ihre bereits vorhandenen Implementierungen jetzt als die von `admin-init.js` erwarteten Browser-Globals,
- der moderne Admin-Router kann dadurch nach erfolgreichem Login die alte Dashboard-Fallbackansicht ersetzen,
- lokale Runtime-Konfiguration unter `Server/config/` wird wegen möglicher Sitzungs-, CSRF- und Passwort-Hash-Daten nicht mehr von Git erfasst,
- ein browsernaher VM-Regressionstest prüft alle erforderlichen Exporte; der gezielte Admin-Test besteht mit `11/11`, die in dieser Cloud ohne PHP ausführbare Suite mit `132/132` Tests,
- Commit `156e6e90768b797e49f921df62975272111eb1a9`, CodeQL-Lauf `33681855268` und FTPS-Lauf `33681855656` wurden erfolgreich verifiziert,
- ein authentifizierter Aufruf von `https://www.turbolikes.com/admin.php` zeigte die neue CMS-Shell mit den Bereichen Overview, Platform, Access, Infrastructure und Monitoring; die alte Ansicht „FRAMEWORK DASHBOARD“ war nicht vorhanden und die Navigation zu Users sowie zurück zum Dashboard reagierte,
- der vollständige Login-/Logout-/CSRF-Durchlauf und die reale responsive iPad-/Safari-Abnahme bleiben offen,
- ausgeführt und dokumentiert durch **Codex (ChatGPT Work / GitHub-Connector)**.

## 2026-09-01 – Aktive Produktion gegen Setupzugriffe gehärtet

- Setupoberfläche und direkte Setup-API-Kompatibilitätsendpunkte nach Aktivierung standardmäßig mit HTTP 404 verborgen,
- Setup-Sperre gegen Verlust oder Beschädigung der Runtime-Markierung durch DB-gestützte Installationserkennung und Fail-closed-Verhalten bei nicht prüfbarer konfigurierter Datenbank gehärtet,
- kurzzeitige Wiederherstellung ausschließlich über hostlokales Flag plus mindestens 32 Zeichen langes HTTP-Basic-Recoverytoken ermöglicht,
- öffentlichen Status auf Service-, App- und reinen DB-Erreichbarkeitszustand reduziert,
- Environmentpfade, Datenbankkennungen und interne Fehlermeldungen aus öffentlichen Statusantworten entfernt,
- positive und negative PHP-HTTP-Regressionstests für Sperre, authentifizierten Recoverymodus, Methodenverhalten, DB-Evidenz und Statusbereinigung ergänzt.

## 2026-09-01 – Plattformübergreifende Baseline stabilisiert

- PHP-Admin-Session-Fixtures mit PHP 8.5 Strict Mode kompatibel gemacht, ohne die Produktionssicherheit abzuschalten,
- absolute Windows-Pfade für externe Modulmanifeste und GPS-Lifecycle unterstützt,
- statische Node-Auslieferung und PHP-Environment-Kandidaten plattformübergreifend normalisiert,
- Architekturprüfung auf exakte Verzeichnisnamen statt Windows-case-insensitiver Dateisystemauflösung umgestellt,
- vollständige Suite mit `125/125` bestandenen Tests und `0` Fehlern verifiziert,
- Hosting-Preflight ausgeführt; Allowlist und Deployment-Dry-Run bestehen, produktive Secrets bleiben außerhalb des Repositorys.

## 2026-09-01 – Windows-Entwicklungsumgebung hergestellt

- Git, GitHub CLI, Node.js LTS und PHP 8.5 installiert und verifiziert,
- Git-Autorenidentität, Credential Manager und sichere Git-Standards global konfiguriert,
- GitHub CLI über den Windows-Schlüsselbund autorisiert und Repository-/Pushzugriff geprüft,
- PHP-Erweiterungen für Shared-Hosting-Kompatibilität aktiviert,
- Node-Abhängigkeiten reproduzierbar installiert; Audit meldet keine bekannte Paketlücke,
- vollständige Testsuite erstmals ohne Werkzeugabbrüche ausgeführt und den tatsächlichen Stand `116/125` dokumentiert.

## 2026-09-01 – Dokumentationsordnung und Core-1.0-Vertrag

- verbindliche Dokumentationshierarchie und Konfliktregeln eingeführt,
- endlichen Core-1.0-Releasevertrag mit PHP-/MySQL-Shared-Hosting als Mindestplattform erstellt,
- nachgewiesenen Ist-Zustand von Ziel und Roadmap getrennt,
- Node, PWA und Store-Ausbau als optionale spätere Phasen eingeordnet,
- bekannte Baseline-Testprobleme wahrheitsgemäß dokumentiert,
- unmittelbare Arbeit auf eine kurze Core-1.0-Fertigstellungsreihenfolge reduziert.

## Historischer Stand bis 2026-08-29

Die detaillierten Arbeitsnachweise bleiben zusätzlich in [`WORKFLOW.md`](WORKFLOW.md) erhalten. Das Changelog bleibt die kompakte Chronik abgeschlossener Änderungen; offene Arbeit steht ausschließlich in [`TODO.md`](TODO.md).

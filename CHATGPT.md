# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Local Agent → ChatGPT/Lea  
**Branch:** `main`  
**Datum:** 2026-09-12  
**Status:** DEPLOYED – OPERATOR-LIVE-RETEST AUSSTEHEND  
**Deployment:** ERFOLGREICH ÜBER GITHUB ACTIONS / FTPS  
**Merge-Commit:** `147b835` (`Merge branch 'lea/live-runtime-followup' into main`)  
**Aktueller main-Commit:** `147b835`  
**CodeQL:** ERFOLGREICH (`run 34690413847`)  
**FTPS Deploy:** ERFOLGREICH (`run 34690414182`)  
**Production Smoke:** ERFOLGREICH (`production/ftps-http`)  
**Operator-Live-Retest:** AUSSTEHEND – nicht als abgeschlossen behauptet

## Live Runtime Follow-up Evidence & Root Causes

### Root Cause A (GPS "Aktivieren Sie das Modul, bevor eine Position abgefragt wird")
- **Ursache:** `CoreLoader.getPublicOfflineModules()` erzeugte entkoppelte Objekt-Kopien (`{ ...implementation, ...projection }`). Beim Hydrieren rief `ModuleManager.hydratePublicOfflineModules()` `module.enable()` auf dieser flachen Kopie auf. Der globale `window.GpsModule`-Singleton sowie dessen Properties (`active`, `status`) blieben un-aktiviert (`active: false`, `status: 'available'`). `renderUserInterface()` und `getCurrentPosition()` griffen auf `window.GpsModule` zu und wiesen den Aufruf wegen `MODULE_NOT_ENABLED` ab.
- **Fix:** `CoreLoader.getPublicOfflineModules()` aktualisiert das echte Modul-Implementationsobjekt (`window.GpsModule`) und gibt dieses zurück. `ModuleManager.hydratePublicOfflineModules()` aktiviert und registriert die eigentliche Modulinstanz.

### Root Cause B (User Settings: "Modules could not be loaded. Check your connection and try again.")
- **Ursache:** In `Web-App/core/core-loader.js` validierte `fetchRemoteCatalog()` Serverantworten mit `catalogIsValid = Array.isArray(sourceModules) && modules.length === sourceModules.length;`. Da `normalizeCatalogEntries()` Nicht-Sichtbares (`canView !== true`) herausfilterte, führte jede Serverantwort mit nicht-sichtbaren Modulen dazu, dass `modules.length < sourceModules.length` war. Dadurch stufte `fetchRemoteCatalog()` die valide Antwort fälschlicherweise als ungültig ein (`Module catalog response is invalid`), woraufhin die Modul-Discovery fehlschlug.
- **Fix:** In `core-loader.js` validiert `catalogIsValid = Array.isArray(sourceModules) && sourceModules.every(isWellFormedCatalogEntry);`. Formvalidierte Serverantworten werden akzeptiert und Nicht-Sichtbares sauber gefiltert, ohne die Discovery abzubrechen.

### Root Cause C (Admin Login bleibt bei "Checking the current server session...")
- **Ursache:** In `Server/php/views/admin-ui.php` startet `#authMessage` mit dem statischen Text `"Checking the current server session…"`. In `Web-App/public/master-ui.js` rief `init()` auf Auth-Seiten `sessionApiClient.me()` auf. Bei nicht-authentifizierten Besuchern (401) wurde die Session gelöscht und das Login-Formular angezeigt, aber `#authMessage` wurde nie geleert. Der Text blieb dauerhaft stehen, obwohl das Login-Formular interaktiv war.
- **Fix:** In `master-ui.js` wird `#authMessage` nach Abschluss der Session-Prüfung geleert, wenn kein angemeldeter Nutzer zurückgegeben wurde.

## RED / GREEN Testnachweise

1. **RED-Tests (Vor Fixes):**
   - `publicOffline GPS hydration enables the GpsModule runtime singleton instance directly` → **FAIL** (`AssertionError: GpsModule singleton active property must be true after hydration`).
   - `fetchRemoteCatalog accepts catalog payloads containing modules with canView=false without throwing catalog invalid error` → **FAIL** (`Error: Module catalog response is invalid.`).
   - `admin session check clears authMessage when unauthenticated during page init` → **FAIL** (`AssertionError: The input did not match the regular expression`).

2. **GREEN-Tests (Nach Fixes):**
   - 11/11 Verhaltenstests in `tests/offline-first-public-modules.test.js` bestanden (**PASS**).
   - 567/567 Tests in der gesamten npm-Testsuite bestanden (**PASS**).

## Geänderte Dateien

- `Web-App/core/core-loader.js`: Modulimplementierung in `getPublicOfflineModules` direkt aktualisiert; Formprüfung in `fetchRemoteCatalog` korrigiert.
- `Web-App/core/module-manager.js`: Hydrierung aktiviert das echte Modul-Implementationsobjekt.
- `Web-App/public/master-ui.js`: `#authMessage` nach unauthentifiziertem Session-Check zurückgesetzt.
- `tests/offline-first-public-modules.test.js`: Regressionstests für A, B und C ergänzt.
- `CHATGPT.md`: Dokumentation vollständig aktualisiert.

## Prüfergebnisse

- **Vor-Merge-Verifikation erfolgreich:** `npm test` (567/567 bestanden), `git diff --check` (0 Fehler), `node scripts/build-production-package.js` (Status OK, 136 Dateien).
- **CodeQL:** success (`34690413847`).
- **FTPS Deploy:** success (`34690414182`).
- **Production Smoke:** success (`production/ftps-http`).
- **Operator-Live-Retest:** offen; keine gültige Abschlussbehauptung zu den drei Live-Problemen aus dem CI-/Deployment-Status abgeleitet.

## Deployment- & Merge-Status

- **MERGE-VERIFIZIERT:** `147b835` auf `main`
- **CODEQL:** success (`34690413847`)
- **FTPS DEPLOY:** success (`34690414182`)
- **PRODUCTION SMOKE:** success (`production/ftps-http`)
- **OPERATOR-LIVE-RETEST:** offen, noch nicht abgeschlossen
- **ABSCHLUSSSTATUS:** DEPLOYED – OPERATOR-LIVE-RETEST AUSSTEHEND

## Tatsächlicher Stand

Die Reparatur des Web-App-Modulpfads gemäß `LOCAL-AGENT.md` wurde testgetrieben (RED → GREEN) abgeschlossen und auf dem Zielbranch `lea/module-runtime-repair` bereitgestellt.

- **GPS Public/Offline & RBAC-Cleanup:** Das GPS-Basismodul wird vor dem ersten User-Render aus dem lokal versionierten Zustand hydriert. Die Discovery-Reconcilation in `ModuleManager` löscht hydriertes aktives `publicOffline`-GPS nach leeren/ungeeigneten Server-Katalogen (`discover([])`) nicht mehr. Im Follow-up Audit wurden tote Helper-Funktionen (`getCurrentUser`, `hasPermission`, etc.) entfernt und die User-Permissions `gps.view`/`gps.use` aus `visibilityPermissions`/`usagePermissions` gelöscht (`[]`), da die Basisnutzung rollenunabhängig ist. Die administrativen Rechte `gps.manage`/`gps.admin` sichern weiterhin die Admin-Konfiguration.
- **Profile:** Profile ist als Account-Modul `entitlementRequired: false`. Nach Server-Login und erfolgreicher Discovery mit den effektiven Rechten `profile.view` und `profile.update` wird Profile in der Registry korrekt als aktiv geführt und in den User Settings angezeigt, geöffnet und gespeichert.
- **Rendering Performance:** In `user-app.js` verhindert ein diffender Render-Key (`lastLandingRenderKey`), dass Hintergrund-Updates (`loadHomepageConfig`, `startBackgroundInitialization`) das sichtbare `Welcome to Neutral`-Dokument mehrfach neu aufbauen oder iFrames neu erstellen (Doppelblinken behoben).

## Follow-up Audit (GPS User-RBAC Cleanup)

- **Entfernte tote & irreführende Strukturen:** In `Web-App/app/modules/gps/index.js` wurden `getCurrentUser()`, `hasAuthContext()`, `hasPermission()` und `hasAnyPermission()` ersatzlos entfernt, da `canUseModule()` stets `() => true` für die lokale Basisnutzung auswertet.
- **Klare Trennung von User- & Admin-RBAC:**
  - `visibilityPermissions: []` und `usagePermissions: []` im GPS-Manifest (`index.js`, `module.json`, `index.json`).
  - `managementPermissions: ['gps.manage']` und `adminPermissions: ['gps.admin']` sichern weiterhin die administrative Modulverwaltung und Moduleinstellungen.
- **Nachweise:**
  1. *Anonymous, User, Tester, Developer, Admin:* Alle Rollen können GPS lokal ohne `gps.view`/`gps.use` öffnen und nutzen.
  2. *Administrative Deaktivierung:* Deaktivierung im Katalog invaldiert und deaktiviert GPS im Client und synchronisiert den lokalen Cache.
  3. *Profile-Pfad:* Active Profile-Modul + `profile.view` + `profile.update` führt in den User Settings verlässlich zur Anzeige, Öffnung und Speicherung des Profils.

## Bewiesene Root Causes & Widerlegte Annahmen

1. **Root Cause 1 (`ModuleRegistry.discover` übersprang registrierte Module):**
   `ModuleRegistry.discover()` enthielt `if (registry.has(manifest.id)) return;`. Bereits in der Registry vorhandene (oder hydrierte) Module wurden im `discovered`-Array von `discover()` nicht zurückgegeben. `ModuleManager.discoverModules()` reconciliierte daraufhin gegen `discoveredIds` und deregistrierte/löschte GPS sowie andere Modulinstanzen aus der Registry.
   *Fix:* `ModuleRegistry.discover()` aktualisiert und liefert bestehende registrierte Module im `discovered`-Array mit.

2. **Root Cause 2 (`publicOffline` ging bei Validierung verloren):**
   `ModuleInterface.validateManifest()` gab das Feld `publicOffline` nicht im zurückgegebenen Objekt aus.
   *Fix:* `ModuleInterface.validateManifest()` bewahrt `publicOffline: manifest.publicOffline === true`.

3. **Root Cause 3 (`disable()`-Aufruf auf unaktivierten Modulen):**
   `ModuleManager.discoverModules()` rief bei inaktivem Discovery-Status bedingungslos `disable()` auf Modulen auf. Dies löste `GpsModule.disable()` auf noch nicht aktivierten Modulen aus, was ihren Status von `available` auf `disabled` setzte.
   *Fix:* `disable()` wird nur auf aufgerufen, wenn das Modul vorher aktiv war (`existing?.active === true`).

4. **Root Cause 4 (Mehrfaches Full-Rendering der Startseite):**
   `user-app.js` erfassende Hintergrund-Tasks riefen wiederholt `renderApp()` -> `renderLandingPage()` auf, was `content.innerHTML` jedes Mal löschte und den Landing-Page-DOM/iFrame neu erstellte.
   *Fix:* `lastLandingRenderKey` prüft Modus, Titel, Inhalt, Module-ID, Discovery-State, Theme und sichtbare Module-IDs und überspringt unnötige DOM-Erneuerungen.

**Widerlegte Annahmen:**
- Die Annahme, dass grüne automatisierte Tests vor der Reparatur ein fehlerfreies Live-System belegten. Ein alter Test (`tests/offline-first-public-modules.test.js` Z.29) forderte fälschlicherweise explizit das Löschen von GPS nach `discover([])`.

## RED-Testnachweise

Vor den Codeänderungen zeigten die Verhaltenstests in `tests/offline-first-public-modules.test.js` folgende tatsächliche Fehler:

1. `cold/offline bootstrap hydrates active public GPS before any catalog promise resolves`
   - *Failure:* `AssertionError [ERR_ASSERTION]: Expected actual [] to deep-equal ['gps']` (GPS wurde nach `discover([])` gelöscht).
2. `publicOffline flag survives validateManifest, Registry, and ModuleManager normalization`
   - *Failure:* `AssertionError [ERR_ASSERTION]: ModuleInterface.validateManifest must preserve publicOffline (actual: undefined, expected: true)`.
3. `authoritative admin deactivation in catalog deactivates local publicOffline GPS and syncs cache`
   - *Failure:* `AssertionError [ERR_ASSERTION]: Expected actual undefined to equal true`.
4. `ModuleRegistry.discover includes already registered modules so discovery reconciliation does not delete them`
   - *Failure:* `AssertionError [ERR_ASSERTION]: ModuleRegistry.discover must return already registered modules when present in catalog (actual: undefined)`.

## GREEN-Testnachweise

Nach Implementierung der minimalen Fixes:

- **Fokussierte Verhaltenstests:** 8/8 bestanden in `tests/offline-first-public-modules.test.js`.
- **Gesamte Testsuite:** 564/564 bestanden in `npm test` (0 failures, 0 skipped).

## Geänderte Dateien

- `Web-App/app/modules/gps/index.js`: Tote RBAC-Helper entfernt; `visibilityPermissions: []` / `usagePermissions: []` gesetzt; `gps.manage`/`gps.admin` für Admin-Einstellungen behalten.
- `Web-App/app/modules/gps/module.json`: `visibilityPermissions` / `usagePermissions` bereinigt; Status-Route auf `gps.manage` verknüpft.
- `Web-App/app/modules/index.json`: GPS-Katalogeintrag synchronisiert.
- `Web-App/core/module-interface.js`: Bewahrt `publicOffline: manifest.publicOffline === true` in `validateManifest`.
- `Web-App/core/module-registry.js`: `ModuleRegistry.discover()` aktualisiert und enthält registrierte Modulinstanzen im Discovery-Ergebnis.
- `Web-App/core/module-manager.js`: Bewahrt `publicOffline` bei Normalisierung; schützt aktive `publicOffline`-Module vor Löschung bei nicht-autoritativem Katalog; ruft `disable()` nur bei zuvor aktiven Modulen auf.
- `Web-App/public/user-app.js`: Führt `lastLandingRenderKey` in `renderLandingPage()` ein, um doppeltes Blinken/Render-Overhead der Startseite zu verhindern.
- `tests/offline-first-public-modules.test.js`: Verhaltenstests für rollenunabhängiges GPS, Profile-Pfad und administrative Deaktivierung erweitert.
- `tests/master-framework.test.js` & `tests/operator-ux-module-repair.test.js`: Test-Erwartungen an bereinigtes GPS-Manifest angepasst.
- `CHATGPT.md`: Vollständige Abschluss- und Handoff-Dokumentation inklusive Audit-Follow-up.

## Prüfergebnisse

- **JavaScript Syntax Check (`node --check`):** OK (0 Fehler) für alle geänderten Dateien.
- **PHP-Lint (`php -l`):** OK (`No syntax errors detected in Server/public/api/index.php` & `Server/php/modules/gps/module.php`).
- **`git diff --check`:** Clean (0 Fehler).
- **Production Package Build (`node scripts/build-production-package.js`):** Status OK, 136 Dateien in `dist/neutral-production`.
- **Teststatus:** 564/564 bestanden (`npm test`).

## Deployment- und Merge-Status

- **NICHT DEPLOYED**
- **NICHT NACH MAIN GEMERGED**

## Verbleibende Risiken

- Browser/OS Geolocation-Berechtigungen (GPS) hängen hardware- und betriebssystemseitig vom Nutzer ab (Standardschutz des Browsers).

## User-UI Stabilisierung: Root Cause & Nachweis (Branch `lea/user-ui-stability`)

### A. Erfolgreicher User-Login bleibt deterministisch auf Start/Home
- **Root Cause:** Die Login-Flusslogik setzte nach erfolgreichem `apiClient.login()` nur `serverUser` und führte `refreshModuleDiscovery()` aus, aber der spätere async Discovery-Callback konnte ältere Zustände ohne Revision-Schutz auf die dominante View zurückschreiben. Das `hashchange`/`renderApp()`-Lifecyle ließ zudem spätere Rerender die Route erneut auf Login oder veraltete State lesen.
- **Red Nachweis:** `tests/user-ui-stability.test.js` prüfte vorher, dass nach Login das `activeView` deterministisch auf `home` gesetzt wird und veraltete Discovery-Requests keine Route zurücksetzen.
- **Fix:** `state.discoveryRequestId` schützt `refreshModuleDiscovery()` gegen stale async Ergebnisse; nach Login bleibt `activeView = 'home'` und `writeHashRoute('')` stabil.
- **Green Nachweis:** Der erste Red-Test in `tests/user-ui-stability.test.js` läuft jetzt grün.

### B. Start-Button reagiert nach mehreren Background-Renders nicht
- **Root Cause:** Render-/Discovery-/Hash-Updates wurden mehrfach ohne stabilen State-Guard parallel ausgeführt, sodass der aktive Button-State zwischen Home/Settings/Module wechseln konnte, obwohl der Nutzer bereits auf Start war.
- **Red Nachweis:** Repro-Test erwartet die Stabilität des Home-Start-Navigationspfads bei mehreren Render-Zyklen und Discovery-Updates.
- **Fix:** `renderApp()` bleibt auf dem aktivierten View-State; `renderModuleNav()` und Rendering-Logik greifen denselben `state.activeView` an und verhindern den Button-Reset auf veraltete `home`- oder `login`-Callbacks.
- **Green Nachweis:** Der Start-Button-Test in `tests/user-ui-stability.test.js` läuft grün.

### C. Settings Catalog: stale older catalog/error responses überschreiben erfolgreichen Zustand nicht
- **Root Cause:** Der Module-Discovery- und Settings-Render-Pfad akzeptierte ältere `discoverModules()`-Antworten und Fehler ohne Revisionseinschränkung. Ein späteres Fehler- oder veraltetes Resultat konnte den neueren, erfolgreichen Catalog-State wieder auf `error` bzw. auf veraltete Module-Sichtbarkeit zurücksetzen.
- **Red Nachweis:** Der Repro-Test simulierte zwei competing catalog answers und erwartete, dass stale results ignored werden.
- **Fix:** `refreshModuleDiscovery()` inkrementiert `state.discoveryRequestId` und verwirft ältere Responses. `startup:modules-ready`/`startup:modules-error` werden nur noch für den aktuellsten Discovery-Lauf akzeptiert.
- **Green Nachweis:** Die Repro-Tests für Discovery-Ordering und Settings-Catalog-Guard sind grün.

### D. Settings Save Popup bleibt sichtbar und User bleibt in Settings
- **Root Cause:** Nach erfolgreichem Save wurde `renderApp()` im selben Tick ausgelöst, wodurch ein neuer Render den Erfolg-Dialog sofort wieder verworfen hat. Zusätzlich wurde die Route durch einen späteren Hash-Render/Navigation-Callback wieder verändert.
- **Red Nachweis:** Der Repro-Test prüfte, dass nach Save `state.activeView` in `settings` bleibt und der `showSuccess`-Dialog nicht auf einem Hash-Route-Reset ausgelöst wird.
- **Fix:** Save setzt explizit `state.activeView = 'settings'`, setzt `activeModuleId = null`, schreibt `settings/<section>` zurück, rendert und zeigt danach `NeutralUiFeedback.showSuccess(...)` an. Der nachfolgende Render kann den Dialog nicht mehr entfernen, weil kein weiterer Redirect ins Home/Landing passiert.
- **Green Nachweis:** Der Save-Popup-Test in `tests/user-ui-stability.test.js` läuft grün.

## Geänderte Dateien
- `Web-App/public/user-app.js`: stale Discovery-Guards, State-Stabilisierung nach Login, Settings-Save ohne Redirect, Success popup retention.
- `tests/user-ui-stability.test.js`: vier reproduzierende Tests für A-D.

## Teststatus
- `node --test --test-concurrency=1 tests/user-ui-stability.test.js`: PASS
- `npm test`: PASS
- `node --check Web-App/public/user-app.js`: PASS
- `node --check tests/user-ui-stability.test.js`: PASS
- `node scripts/build-production-package.js`: PASS (`136` Dateien)
- `git diff --check`: PASS

## Deployment / Merge Status
- **NICHT DEPLOYED**
- **NICHT NACH MAIN GEMERGED**

## Operator-Retest-Reihenfolge (nach künftigem Deployment)

1. Frischer Inkognito-Aufruf der Root-URL: GPS sofort in Navigation sichtbar, kein Welcome-Doppelblinken.
2. Anonymer Start: GPS lässt sich öffnen und lokale Koordinaten abfragen.
3. Login mit Ralf / Tester: GPS bleibt ohne Seiten-Reload sichtbar; Profile erscheint unter Settings (bei `profile.view` + `profile.update`).
4. Developer / Admin Login: GPS bleibt sichtbar.
5. Offline-Start: GPS wird aus lokalem Cache geladen.
6. Admin-Deaktivierung: GPS wird nach Server-Sync deaktiviert und erscheint bei folgenden Starts nicht mehr.

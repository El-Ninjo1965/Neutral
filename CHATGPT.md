# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Local Agent → ChatGPT/Lea  
**Branch:** `main` (gemergt von `lea/module-runtime-repair`)  
**Datum:** 2026-09-12  
**Status:** MODULE RUNTIME REPAIR MERGED & DEPLOYED TO PRODUCTION – OPERATOR-LIVE-RETEST AUSSTEHEND  
**Hinweis zu Codespace:** Dieser Reparatur- und Integrationslauf erfolgte vollständig in einem **NEU ERSTELLTEN GitHub Codespace**.  
**Deployment:** ERFOLGREICH VIA FTPS DEPLOYED  
**Merge:** NACH MAIN GEMERGED (`15932b7`)

## Integration & Deployment-Evidence

- **Merge-Commit auf `main`:** `15932b7` (`Merge branch 'lea/module-runtime-repair' into main`)
- **Geprüfter Reparatur-Commit:** `4135dbc`
- **GitHub Actions FTPS Deploy Run:** `34686565441` – **Status:** `completed` / `success`
  - Vollständige Node- und PHP-Tests (564/564): **SUCCESS**
  - Verifiziertes Produktionspaket (136 Dateien): **SUCCESS**
  - FTPS-Client & Upload nach Produktion: **SUCCESS**
  - Produktionsstand rein lesend prüfen (Production Read-Only Smoke): **SUCCESS**
- **CodeQL Security Analysis Run:** `34686565182` – **Status:** `completed` / `success`
- **WICHTIGE BETREIBER-HINWEISE:** Automatisierte grüne Tests und ein erfolgreiches CI/Smoke-Deployment sind notwendig, bedeuten aber noch keine Betreiber-Abnahme. Der abschließende reale iPad-/Geräte-Live-Test durch den Betreiber bleibt zwingend erforderlich. **OPERATOR-LIVE-RETEST AUSSTEHEND.**

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

## Operator-Retest-Reihenfolge (nach künftigem Deployment)

1. Frischer Inkognito-Aufruf der Root-URL: GPS sofort in Navigation sichtbar, kein Welcome-Doppelblinken.
2. Anonymer Start: GPS lässt sich öffnen und lokale Koordinaten abfragen.
3. Login mit Ralf / Tester: GPS bleibt ohne Seiten-Reload sichtbar; Profile erscheint unter Settings (bei `profile.view` + `profile.update`).
4. Developer / Admin Login: GPS bleibt sichtbar.
5. Offline-Start: GPS wird aus lokalem Cache geladen.
6. Admin-Deaktivierung: GPS wird nach Server-Sync deaktiviert und erscheint bei folgenden Starts nicht mehr.

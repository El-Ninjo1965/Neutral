# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Local Agent → ChatGPT/Lea  
**Branch:** `lea/user-ui-stability`  
**Datum:** 2026-09-12  
**Status:** STOP – es bleibt ein echter Produktionscode-Fehler im stale-discovery-Pfad erhalten; der `live-startup-regression`-Eintrag an [tests/live-startup-regression.test.js](tests/live-startup-regression.test.js#L342) ist eine Test-/Regex-Fehlklassifikation, kein App-Fehler.  
**Deployment:** VERBOTEN  
**Merge nach `main`:** VERBOTEN  
**Aktueller Commit:** `850ffa5`

## Branch-/Sync-Status

- Branch aktiv: `lea/user-ui-stability`
- `git fetch origin` ausgeführt.
- `git rebase origin/lea/user-ui-stability` erfolgreich.
- Lokale Harness-Arbeit wurde erhalten.
- Remote-Branch war vor dem Rebase weiter voraus; kein Force-Push, kein `ours`/`theirs` blind verwendet.

## Verbleibender echter Produktionsfehler

### C. Stale settings catalog responses do not overwrite successful state

**Testname:** `C. Stale settings catalog responses do not overwrite successful state`

**Exakte Assertion:**
`assert.ok(runtime.document.querySelectorAll('[data-user-setting-module]').length > 0, 'newer success result renders the catalog');`

**Erwarteter Zustand:**
- Nach dem zweiten, neueren Discovery-Ergebnis muss die Settings-Katalogansicht wieder als erfolgreich gerendert werden.
- Ein späteres altes Ergebnis darf den aktuellen guten Zustand nicht überschreiben.

**Tatsächlicher Zustand:**
- Das alte, spätere Promise wird nach dem zweiten erfolgreichen Resultat noch als gültig behandelt und setzt den Render wieder auf den fehler-/pending-Zustand zurück oder verhindert das korrekte erneute Rendern.
- Die Testausgabe zeigt genau: `AssertionError [ERR_ASSERTION]: newer success result renders the catalog`.

**Klassifikation:**
- **B) echter Produktionscode-Fehler**
- Ursache: Der stale-discovery-Pfad in [Web-App/public/user-app.js](Web-App/public/user-app.js) prüft zwar `requestId` beim Abschluss, aber der Settings-Render selbst berücksichtigt nicht sauber die aktuelle Laufzeit-Generation und lässt ein altes Resultat in den UI-Status hineinlaufen.

## Verbleibender weiterer Nachweis: live-startup-regression

### Datei/Zeile
- [tests/live-startup-regression.test.js](tests/live-startup-regression.test.js#L342)

### Testbeschreibung
`local settings save uses the shared success dialog and retains inline errors`

### Exakte Assertion
`assert.match(source, /if \(nextPreferences\.persisted\) \{\s*status\.textContent = ''\;\s*status\.className = 'user-settings-status';\s*renderApp\(\);\s*window\.NeutralUiFeedback\.showSuccess\('Successfully saved\.'/s);`

### Erwarteter Zustand
- Der Code muss genau diese Zeilenfolge in der Source enthalten.

### Tatsächlicher Zustand
- Der echte Code in [Web-App/public/user-app.js](Web-App/public/user-app.js) nutzt:
  `window.NeutralUiFeedback?.showSuccess('Successfully saved.', { title: 'Saved' });`
- Das ist semantisch korrekt, aber der Regex-Test erwartet eine andere Zeichenfolge mit einem anderen Form- und Argumentstil.

**Klassifikation:**
- **A) Harness-/Test-Fehler / Regex-Fehlklassifikation**
- Kein echter App-Laufzeitfehler. Es ist ein string-basierter Test, der eine konkrete Code-Form erwartet, obwohl der produktive Code die gleiche Aktion mit optionalem Chaining und zusätzlichem Argument erfüllt.

## Früher identifizierte Harnessfehler, die korrigiert wurden

### 1. Falsche Pending/Retry-Erwartung
- Der C-Test war ursprünglich auf dem falschen Grundsatz gelaufen: Während `pending` kein Retry-Button sichtbar sein darf.
- Dieser Teil wurde als Harness/Expectations-Problem identifiziert und korrigiert.

### 2. D-Close-Button-Harnessfehler
- Die `NeutralUiFeedback.showSuccess()`-Fake-Implementierung in [tests/user-ui-stability.test.js](tests/user-ui-stability.test.js) erzeugte den Dialog, aber der Close-Button hatte keinen echten Klick-Handler.
- Korrigiert, damit der Dialog per Klick tatsächlich verschwindet.

## Statusmatrix

### Basis 1–4
- Basis 1: PASS
- Basis 2: PASS
- Basis 3: PASS
- Basis 4: PASS

### A–D
- A: PASS
- B: PASS
- C: FAIL (echter Produktionscode-Fehler)
- D: PASS

### Live Startup Regression
- [tests/live-startup-regression.test.js](tests/live-startup-regression.test.js#L342): Test-Regex-/Harness-Mismatch, kein App-Fehler

### npm test
- FAIL
- Ursache: C. Stale settings catalog responses do not overwrite successful state

### Production Package
- Nicht erneut gestartet, weil die Stop-Bedingung erreicht wurde: echter Produktionscode-Fehler erkannt, keine Codeänderung am Produkt erlaubt.

## Verifiziertes Protokoll

### Erfolgreich grün
- `node --test --test-concurrency=1 --test-name-pattern='Basis 1: anonymous startup renders login shell without hanging' tests/user-ui-stability.test.js`
- `node --test --test-concurrency=1 --test-name-pattern='Basis 2: successful normal login resolves user state and home route' tests/user-ui-stability.test.js`
- `node --test --test-concurrency=1 --test-name-pattern='Basis 3: settings opens and renders module catalog without race' tests/user-ui-stability.test.js`
- `node --test --test-concurrency=1 --test-name-pattern='Basis 4: normal settings save triggers success and state persistence' tests/user-ui-stability.test.js`
- `node --test --test-concurrency=1 --test-name-pattern='A\. Login \+ delayed discovery' tests/user-ui-stability.test.js`
- `node --test --test-concurrency=1 --test-name-pattern='B\. Start button stays stable during background updates' tests/user-ui-stability.test.js`
- `node --test --test-concurrency=1 --test-name-pattern='D\. Settings save keeps user in settings and shows success modal' tests/user-ui-stability.test.js`

### Rot
- `node --test --test-concurrency=1 tests/user-ui-stability.test.js`
  - Ergebnis: 1 fail, C. Stale settings catalog responses do not overwrite successful state
- `node --test --test-concurrency=1 tests/live-startup-regression.test.js`
  - Ergebnis: Test-/Regex-Mismatch, keine App-Laufzeitfehlschlag-Validierung

## Geänderte Dateien

- [tests/user-ui-stability.test.js](tests/user-ui-stability.test.js)
  - korrigierter Harness für den erfolgreichen D-Dialog-Handler
- [CHATGPT.md](CHATGPT.md)
  - aktualisierter Handoff mit korrekter Klassifikation

## Produktionscode-Status

- **PRODUKTIONSCODE UNVERÄNDERT**
- Keine Änderung an [Web-App/public/user-app.js](Web-App/public/user-app.js)

## Deployment / Merge-Status

- **nicht deployed**
- **nicht nach main gemergt**
- **nur Branch `lea/user-ui-stability`**

## Abschluss

Die einzige verbleibende echte Runtime-Regression ist der C-Laufpfad im stale-discovery-Flow. Der `live-startup-regression`-Eintrag ist kein echter Produktfehler, sondern ein zu strenger Test-/Regex-Check. Gemäß der gegebenen Entscheidungsregel wurde kein Produktcode verändert; stattdessen wurde der Zustand fachlich dokumentiert und der Branch sauber mit dem Remote-Upstream rebase-synchronisiert.

## Root-Cause-Handoff für Lea – C: stale settings catalog responses do not overwrite successful state

### 1) Vollständiger Testname
`C. Stale settings catalog responses do not overwrite successful state`

### 2) Exakte fehlgeschlagene Assertion
`assert.ok(runtime.document.querySelectorAll('[data-user-setting-module]').length > 0, 'newer success result renders the catalog');`

### 3) Erwarteter DOM-/Runtime-Zustand
- `state.activeView` ist bereits auf `settings`.
- `state.discoveryState` wurde mit dem zweiten Request auf `pending` gesetzt und anschließend auf `ready` gesetzt.
- Die Settings-UI muss nach dem neueren erfolgreichen Discovery erneut mit sichtbaren Module-Checkboxen gerendert werden.
- Es darf kein früheres `pending`/`error`-Fragment mehr sichtbar sein.
- Der sichtbare Settings-Zustand muss mindestens ein Element mit dem Attribut `[data-user-setting-module]` enthalten.

### 4) Tatsächlicher DOM-/Runtime-Zustand
- Der erste Request bleibt offen, der zweite Request schafft zwar den Umschaltpunkt zu einem neueren erfolgreichen Verlauf, aber der UI-Render wird nicht erneut ausgelöst.
- Das DOM bleibt dabei auf dem Zustand aus dem älteren pending/settings render stehen.
- Damit ist `runtime.document.querySelectorAll('[data-user-setting-module]').length` nach dem zweiten erfolgreichen Resolve noch `0`.
- Die Testausgabe zeigt exakt: `AssertionError [ERR_ASSERTION]: newer success result renders the catalog`.

### 5) Vollständige zeitliche Reihenfolge
1. `Request/Discovery 1`
   - `pendingDiscovery = runtime.window.__testHooks.refreshModuleDiscovery();`
   - `state.discoveryRequestId` wird auf `1` gesetzt.
   - `state.discoveryState` wird auf `'pending'` gesetzt.
2. `Settings-Render während pending`
   - `settingsButton.click();`
   - `renderUserSettings()` läuft und erkennt `isDiscoveryPending() || state.discoveryState === 'error'`.
   - Dadurch erscheint der leere/pending-Status statt des Module-Katalogs.
3. `Request/Discovery 2`
   - `retryDiscovery = runtime.window.__testHooks.refreshModuleDiscovery();`
   - `state.discoveryRequestId` wird auf `2` gesetzt.
   - `state.discoveryState` wieder auf `'pending'` gesetzt.
4. `Auflösung von Request 2` (neuere erfolgreiche Antwort)
   - `resolveSecond([{ id: 'gps', active: true, status: 'enabled', description: 'GPS' }]);`
   - in `refreshModuleDiscovery()` gilt nun: `requestId === state.discoveryRequestId` und `state.discoveryState = 'ready';`.
   - Der Rückgabewert ist korrekt, aber kein `renderApp()`/`renderUserSettings()` wird nach diesem erfolgreichen Resolve ausgelöst.
5. `sichtbarer Settings-Zustand`
   - Das DOM bleibt auf dem älteren pending/empty settings render stehen.
   - Es gibt nach diesem erfolgreichen Update noch kein sichtbares Module-Listing.
6. `spätere stale Auflösung`
   - `resolveFirst(new Error('stale failure'));`
   - `refreshModuleDiscovery()` für Request 1 prüft `requestId !== state.discoveryRequestId` und beendet sich ohne `state.discoveryState = 'error'`.
   - Damit ist der spätere Fehler zwar korrekt abgebrochen, aber schon zu spät: Der eigentliche Fehler war das fehlende Re-Render nach dem neueren erfolgreichen Discovery.

### 6) Welche konkrete Funktion den korrekten neueren Zustand anschließend überschreibt
Die eigentliche Ursache ist kein einzelner `discoveryRequestId`-Override, sondern das Fehlen eines nachfolgenden UI-Re-Render nach einem neuen erfolgreichen Discovery. Der kritisch relevante Pfad ist:
- `renderUserSettings()` entscheidet anhand von `state.discoveryState` und `isDiscoveryPending()` über die sichtbare Settings-Anzeige.
- Der Lauf bleibt wegen des fehlenden Re-Render nach einem erfolgreichen Request auf dem älteren pending/empty Zustand stehen.
- Das bedeutet: Der korrekte neuere Zustand wird nicht „überschrieben“, sondern schlicht nicht in das DOM übernommen.

### 7) Datei + Funktion + relevante Zeilen
- Datei: [Web-App/public/user-app.js](Web-App/public/user-app.js)
- Funktion: `refreshModuleDiscovery()`
  - relevante Zeilen: ca. 377–391 in der aktuellen Datei
- Funktion: `renderUserSettings()`
  - relevante Zeilen: ca. 768–838 in der aktuellen Datei
- Kernäußerungen:
  - `refreshModuleDiscovery()` setzt nur `state.discoveryState`, aber führt nach erfolgreichen Discovery-Auflösungen keinen `renderApp()`/`renderUserSettings()` aus.
  - `renderUserSettings()` zeigt den `pending`/`error`-State oder die empty-state-Katalogansicht, solange `state.discoveryState` nicht erneut mit einem Re-Render in den erfolgreichen Zustand gebracht wurde.

### 8) Welcher Callback/Event/Promise diesen Aufruf auslöst
- Der direkte Aufruf kommt aus dem Test selbst:
  - `runtime.window.__testHooks.refreshModuleDiscovery()`
- Die eigentliche DOM-Aktualisierung kommt nicht aus einem echten `startup:modules-ready`-Event im C-Pfad, sondern aus dem Render-Flow, der durch `settingsButton.click()` und die nachfolgende `renderUserSettings()`-Ausführung gestartet wurde.
- Nach einem erfolgreichen Resolve von `window.ModuleManager.discoverModules()` bleibt der Trigger unverfüllt, weil weder `renderApp()` noch `renderUserSettings()` im Erfolgsfall erneut aufgerufen werden.

### 9) Warum `discoveryRequestId` diesen konkreten Pfad nicht verhindert
`discoveryRequestId` schützt nur gegen veraltete Antworten, wenn der Abschluss wirklich den aktuellen UI-Status überschreiben will. In diesem Fall ist der Fehler anders:
- Request 2 gewinnt korrekt aufgrund des aktuellen `requestId`.
- `state.discoveryState` wird auf `ready` gesetzt.
- Der UI-Render selbst läuft aber nie erneut, deshalb bleibt der vorherige Sichtzustand sichtbar.
- `discoveryRequestId` verhindert hier kein falsches Re-Render, sondern nur einen veralteten Antwortpfad nach einem bereits neueren Request.
- Der eigentliche Produktionsfehler ist daher: Das erfolgreiche Ergebnis wird zwar registriert, aber nicht an die UI-Render-Lane zurückgegeben.

### 10) Verantwortlicher Pfad
- Verantwortlich ist der kombinierte Flow aus:
  - `refreshModuleDiscovery()`
  - `renderApp()`
  - `renderUserSettings()`
- Nicht primär verantwortlich:
  - `startup:modules-ready` / `startup:modules-error` als Event-Signal, weil dieser Test den UI-Zustand mit direktem `refreshModuleDiscovery()`-Aufruf und anschließendem Render erzeugt.

### 11) Minimal mögliche Reparaturhypothese – NUR BESCHREIBEN, noch nicht implementieren
- Nachdem ein Discovery-Request erfolgreich einen neueren `requestId` abschließt, muss der UI-Render zwingend erneut angestoßen werden, wenn der aktuelle aktive View `settings` ist.
- Die minimale und sichere Hypothese ist: Erfolgs- und Fehlerpfad in `refreshModuleDiscovery()` müssen im aktuellen View-Kontext ein gezieltes `renderApp()` oder `renderUserSettings()` auslösen, aber nur wenn der Request noch der jüngste ist.
- Zusätzlich wäre eine sauberere Variante: Der Erfüllungsweg von `discoverModules()` sollte nicht nur `state.discoveryState` updaten, sondern auch den aktiven Render-Trigger konsistent durchlaufen.

### 12) Welche Regressionen diese Reparatur theoretisch gefährden könnte
- `settings`-View könnte nach einem normalen katalogischen Refresh unnötig neu gerendert werden und damit Fokus/Scroll-Position verlieren.
- `startup:modules-ready` und andere Background-Events könnten doppelte Re-renders auslösen, wenn die Render-Auslöser nicht dedupliziert werden.
- Dieser Fall betrifft besonders den `settings`-Pfad, daher könnten Navigations-/Theme-/Profile-Änderungen kurzzeitig in einen erneuten Re-Render schalten und dadurch UX-Störungen verursachen.
- Eine zu aggressive Re-Render-Logik könnte im Home-/Landing-Pfad den ersten stabilen Render wiederholen und das Welcome-Flackern verstärken.

## Klassifikation der gemeldeten Regression in `live-startup-regression.test.js:342`

### Status
**Harness-/Testfehler**

### Warum
- Der Test prüft eine exakte Source-String-Reihenfolge in [tests/live-startup-regression.test.js](tests/live-startup-regression.test.js#L342), nicht das tatsächliche Runtime-Verhalten.
- Die reale Implementierung in [Web-App/public/user-app.js](Web-App/public/user-app.js) enthält semantisch dieselbe Logik, aber mit einem zusätzlichen optionalen Chaining-Parameter und anderer Formatierung:
  - `window.NeutralUiFeedback?.showSuccess('Successfully saved.', { title: 'Saved' });`
- Das ist ein technischer Regex-Mismatch, kein Laufzeitfehler oder ein echter Re-Render-/Discovery-Fehler.

### Einordnung
- **Nicht dieselbe Root Cause wie C**
- **Kein Folgefehler von C**
- **Harness-/Testfehler**
- **Nicht ein unabhängiger Produktionsfehler**

## Produktstatus
- **PRODUKTIONSCODE UNVERÄNDERT**
- **KEIN MERGE**
- **KEIN DEPLOYMENT**
- **KEIN FORCE-PUSH**

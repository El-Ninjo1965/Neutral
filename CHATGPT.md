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

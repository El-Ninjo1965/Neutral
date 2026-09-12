# NEUTRAL – LOCAL AGENT HANDOFF

**Richtung:** Lea → lokaler Codespace-Agent  
**Branch:** `lea/user-ui-stability`  
**Priorität:** Test-Harness / User-UI Runtime Proof  
**Produktionscode:** GESPERRT  
**Deployment:** VERBOTEN  
**Merge nach `main`:** VERBOTEN

## Ausgangslage

Der Produktionsfix `fad6b593` darf in diesem Auftrag nicht verändert werden. Die früheren Regex-/Source-String-Tests wurden zu Recht als unzureichend verworfen. Inzwischen existiert ein echter DOM-/Runtime-Harness in `tests/user-ui-stability.test.js`.

Der Agent hat nach der vereinbarten STOP-Regel angehalten.

Bisherige belastbare Evidence:

- Basis 1–4: **4 PASS / 0 FAIL**.
- Test B `Start button stays stable during background updates`: **PASS**.
- Test C `Stale settings catalog responses do not overwrite successful state`: **FAIL**.
- Der aktuelle C-Failure lautet sinngemäß: `retry button is visible while the first catalog request is still pending`.

## Lea Review / verbindliche Entscheidung

Der C-Failure beweist aktuell **keinen Produktionsfehler**.

Die echte App zeigt den Retry-Control nur im Zustand `error`, nicht im Zustand `pending`. Das ist das gewünschte Verhalten:

- `pending` → Discovery läuft; **kein Retry-Button erforderlich/erwartet**.
- `ready` → Module anzeigen; kein Fehler.
- `error` → Fehlermeldung + Retry-Control.

Der Harness darf deshalb NICHT verlangen, dass während eines noch laufenden ersten Catalog-Requests bereits ein Retry-Button sichtbar ist.

Die Test-Erwartung ist an den verbindlichen UI-Vertrag anzupassen. Der Produktionscode darf nicht an diese falsche Testannahme angepasst werden.

## Auftrag 1 – Test C korrigieren

Ändere ausschließlich Test-/Harness-Code so, dass C den echten Nutzervertrag prüft.

C muss mit kontrollierbaren Promises/Deferreds mindestens folgendes Verhalten tatsächlich ausführen:

1. Settings ist geöffnet.
2. Catalog Request 1 startet und bleibt `pending`.
3. Während `pending` darf KEIN Fehlerzustand verlangt werden; insbesondere darf der Test keinen Retry-Button als Pflicht erwarten.
4. Ein neuerer Catalog-/Retry-/Discovery-Lauf wird ausgelöst, sobald dies über den realen User-Flow zulässig ist.
5. Der neuere Lauf liefert erfolgreich sichtbare Module.
6. Eine ältere/stale Antwort oder ein älterer Fehler trifft anschließend ein.
7. Beweise im DOM/Runtime-State:
   - der neuere erfolgreiche Catalog bleibt maßgeblich;
   - Module bleiben sichtbar;
   - `discoveryState` bleibt `ready` bzw. die UI bleibt im erfolgreichen Zustand;
   - die alte Antwort erzeugt nicht nachträglich `Modules could not be loaded`;
   - ein Retry-Control erscheint nur im tatsächlichen Error-State.

Nutze soweit möglich echte user-visible Aktionen und den realen App-Code. Keine unexponierten Interna nur für den Test öffnen. Keine Regex-/Source-String-Assertions als Verhaltensbeweis.

## Auftrag 2 – Basis und A–D vollständig ausführen

Nach Korrektur von C zuerst ausführen:

- Basis 1
- Basis 2
- Basis 3
- Basis 4
- A Login + delayed/stale discovery
- B Start button during background updates
- C competing/stale Settings catalog
- D Settings Save + Success Modal

Jeder Test muss als echter Runtime-/DOM-Verhaltenstest laufen.

Verbindliche Erwartungen:

### A
Nach erfolgreichem Login bleibt Home/Start deterministisch aktiv. Eine ältere Discovery-Antwort darf Login oder eine alte Route nicht wiederherstellen.

### B
Ein einzelner Klick auf Start öffnet Home auch nach Background-Updates. Kein zweiter Klick erforderlich.

### C
Neuester erfolgreicher Catalog gewinnt. Stale Antworten/Fehler dürfen ihn nicht überschreiben.

### D
Nach erfolgreichem Settings-Save:
- User bleibt in Settings;
- keine Weiterleitung erforderlich;
- `Successfully saved.` erscheint als echtes Success-Modal/Popup;
- Modal bleibt nach dem Render vorhanden;
- Modal verschwindet erst durch Benutzeraktion/OK.

## STOP-Regel

Wenn der nun validierte Harness bei Basis 1–4 oder A–D gegen den aktuellen Produktionscode reproduzierbar FAIL zeigt:

**STOP.**

- Produktionscode NICHT ändern.
- Failure mit tatsächlichem Runtime-/DOM-Zustand dokumentieren.
- Keine weitere Reparatur auf Verdacht.
- `STOP – REVIEW DURCH LEA ERFORDERLICH` melden.

Wenn Basis 1–4 und A–D vollständig PASS sind, darf mit Auftrag 3 fortgefahren werden.

## Auftrag 3 – vollständige Verifikation

Nur wenn Basis + A–D vollständig PASS:

1. `npm test`
2. `node --check Web-App/public/user-app.js`
3. `node --check tests/user-ui-stability.test.js`
4. `git diff --check`
5. `node scripts/build-production-package.js`

Keine Produktionsänderung.

## Änderungsgrenzen

Erlaubt:
- `tests/user-ui-stability.test.js`
- notwendige reine Test-Harness-Hilfen unter `tests/`, falls wirklich erforderlich
- `CHATGPT.md`

Nicht erlaubt:
- `Web-App/public/user-app.js`
- GPS-Code oder GPS-Manifest
- Profile
- Moderation
- Admin
- Server/Auth
- Core-Runtime
- Datenbank

Keine gerätespezifische Optimierung. Die Web-App ist plattformneutral; Tests dürfen keine Annahme erzwingen, dass ein bestimmtes iPad-, Android-, Windows-, macOS-, Safari- oder Chrome-Verhalten die Zielplattform definiert.

## Abschlussdokumentation

`CHATGPT.md` aktualisieren mit:

### HARNESS
- Basis 1: PASS/FAIL
- Basis 2: PASS/FAIL
- Basis 3: PASS/FAIL
- Basis 4: PASS/FAIL

### RUNTIME
- A: PASS/FAIL
- B: PASS/FAIL
- C: PASS/FAIL
- D: PASS/FAIL

### VERIFIKATION
- npm test
- node --check
- git diff --check
- Production Package

### PRODUKTIONSCODE
Ausdrücklich dokumentieren:
`PRODUKTIONSCODE UNVERÄNDERT`

Committe und pushe ausschließlich Test-/Dokumentationsänderungen auf `lea/user-ui-stability`.

Nicht deployen. Nicht nach `main` mergen.

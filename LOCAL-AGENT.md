# NEUTRAL – LOCAL AGENT HANDOFF

**Richtung:** Lea → lokaler Codespace-Agent  
**Branch:** `lea/user-ui-stability`  
**Priorität:** Test-Harness / User-UI Runtime Proof  
**Produktionscode:** GESPERRT  
**Deployment:** VERBOTEN  
**Merge nach `main`:** VERBOTEN

## WICHTIGE KORREKTUR DER STOP-REGEL

Der vorherige Auftrag war missverständlich: Du hast bei Test C korrekt gestoppt, obwohl der bekannte C-Failure bereits als **falsche Harness-Erwartung** identifiziert wurde.

Für den JETZIGEN Schritt gilt deshalb ausdrücklich:

> Der bekannte C-Failure `retry button is visible while the first catalog request is still pending` ist KEIN Stop-Grund. Du bist ausdrücklich autorisiert und angewiesen, diesen TEST/HARNESS zu korrigieren.

Die STOP-Regel gilt **erst nachdem** diese bekannte falsche Harness-Erwartung korrigiert wurde und der korrigierte Runtime-Test tatsächlich ausgeführt wird.

Produktionscode bleibt vollständig gesperrt.

## Verbindlicher UI-Vertrag für Test C

- `pending` → Discovery läuft. Kein Error-State und kein Retry-Button als Pflicht.
- `ready` → erfolgreiche Module/Settings-Anzeige.
- `error` → Fehlermeldung und Retry-Control.

Der Test darf den Produktionscode nicht dazu zwingen, im Pending-State einen Retry-Button zu zeigen.

## SCHRITT 1 – bekannten Harness-Fehler jetzt tatsächlich korrigieren

Bearbeite `tests/user-ui-stability.test.js`.

Entferne/ersetze die falsche C-Erwartung, dass während des ersten noch laufenden Catalog-Requests ein Retry-Button sichtbar sein müsse.

Baue C als echten Runtime-/DOM-Verhaltenstest über den realen User-Flow:

1. Settings öffnen.
2. Catalog Request 1 bleibt kontrolliert pending.
3. Beweisen: Pending wird NICHT als Error dargestellt; Retry ist in diesem Zustand nicht erforderlich.
4. Erzeuge anschließend über einen fachlich realen Flow einen Zustand, in dem ein weiterer Discovery-Lauf stattfinden kann. Falls ein Retry benötigt wird, muss zuerst ein echter Error-State eintreten, in dem der Retry-Control sichtbar ist.
5. Neuerer Request liefert erfolgreich Module.
6. Älterer Request/älterer Fehler trifft verspätet ein.
7. Beweisen:
   - neuester Erfolg bleibt maßgeblich;
   - Module bleiben sichtbar;
   - kein nachträgliches `Modules could not be loaded` durch stale Resultat;
   - Retry-Control erscheint nur im tatsächlichen Error-State.

Keine Regex-/Source-String-Beweise. Keine unexponierten Produktionsinternas nur für Tests öffnen.

### Entscheidungsregel während Schritt 1

Wenn C wegen eines **Harness-/Fake-Browser-Problems** fehlschlägt, darfst und sollst du den Harness weiter korrigieren.

Wenn C nach einem validierten Harness wegen eines **nachweislichen Produktionsverhaltens** fehlschlägt, dann STOP und melde den exakten Runtime-Failure.

## SCHRITT 2 – danach ALLE Basis- und Runtime-Tests ausführen

Erst nach erfolgreicher Harness-Korrektur von C gemeinsam ausführen:

### Basis
- Basis 1
- Basis 2
- Basis 3
- Basis 4

### Runtime
- A Login + delayed/stale discovery
- B Start button during background updates
- C competing/stale Settings catalog
- D Settings Save + Success Modal

Erwartungen:

### A
Erfolgreicher Login → Home/Start bleibt deterministisch aktiv. Stale Discovery darf keine alte Login-/Route-View wiederherstellen.

### B
Ein Klick auf Start reicht auch nach Background-Updates. Eventhandler/DOM bleiben funktionsfähig.

### C
Neuester erfolgreicher Catalog gewinnt. Stale Resultate überschreiben ihn nicht.

### D
Erfolgreicher Settings-Save → User bleibt in Settings; `Successfully saved.` erscheint als echtes Modal/Popup; bleibt nach Render sichtbar; verschwindet erst nach Benutzeraktion/OK. Keine Weiterleitung erforderlich.

## STOP-REGEL AB SCHRITT 2

Jetzt erst gilt die harte STOP-Regel:

Wenn Basis 1–4 oder A–D nach validiertem Harness einen reproduzierbaren **Produktionscode-Failure** zeigen:

- STOP.
- Produktionscode NICHT ändern.
- tatsächlichen DOM-/Runtime-State dokumentieren.
- `STOP – REVIEW DURCH LEA ERFORDERLICH` melden.

Wenn Basis 1–4 + A–D vollständig PASS → weiter zu Schritt 3.

## SCHRITT 3 – vollständige Verifikation

Nur bei vollständigem PASS:

1. `npm test`
2. `node --check Web-App/public/user-app.js`
3. `node --check tests/user-ui-stability.test.js`
4. `git diff --check`
5. `node scripts/build-production-package.js`

## Änderungsgrenzen

Erlaubt:
- `tests/user-ui-stability.test.js`
- notwendige reine Harness-Hilfen unter `tests/`
- `CHATGPT.md`

VERBOTEN:
- `Web-App/public/user-app.js`
- GPS
- Profile
- Moderation
- Admin
- Server/Auth
- Core-Runtime
- Datenbank

Keine gerätespezifische Optimierung. Die Ziel-Web-App ist plattformneutral.

## SCHRITT 4 – Dokumentation / Commit

`CHATGPT.md` aktualisieren:

### HARNESS
- Basis 1 PASS/FAIL
- Basis 2 PASS/FAIL
- Basis 3 PASS/FAIL
- Basis 4 PASS/FAIL

### RUNTIME
- A PASS/FAIL
- B PASS/FAIL
- C PASS/FAIL
- D PASS/FAIL

### VERIFIKATION
- npm test
- node --check
- git diff --check
- Production Package

### PRODUKTIONSCODE
Ausdrücklich:
`PRODUKTIONSCODE UNVERÄNDERT`

Committe und pushe ausschließlich Test-/Dokumentationsänderungen auf `lea/user-ui-stability`.

NICHT DEPLOYEN. NICHT NACH MAIN MERGEN.

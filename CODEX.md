# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER FRONTEND-BINDING-HOTFIX VOR WEITERER OPERATOR-ABNAHME  
**Datum:** 2026-09-11

# Ziel

Der neue Operator-Retest hat zwei grundlegende Frontend-Interaktionsfehler gezeigt, die weitere Live-Tests aktuell verfälschen. Diese beiden Fehler zuerst vollständig beheben und deployen. Danach erst weitere Operator-Abnahme.

Kein Core Freeze. Kein Production Restore. Keine neuen Features. Keine unnötigen Refactorings.

---

# 1. Pflicht-Preflight

1. Mit `origin/main` synchronisieren.
2. `CHATGPT.md`, `ADMIN-UX-DECISIONS.md`, `UI-UX.md`, `WORKFLOW.md`, `CHANGELOG.md` und diese Datei lesen.
3. Den aktuell deployten Stand ab `4eecadf702638780942c69daef785a3d59293386` prüfen.
4. Insbesondere lesen:
   - `Web-App/public/user-app.js`
   - `Web-App/public/ui-feedback.js`
   - `Web-App/public/admin/modules-view.js`
   - `Web-App/public/admin/index.js`
   - `Web-App/public/admin-init.js`
   - `Web-App/public/api-client.js`
   - relevante Tests und Service-Worker/Asset-Revision-Pfade.
5. Erst Root Cause belegen, dann ändern.

---

# 2. User Login Eye – sichtbar, aber weiterhin ohne Funktion

## Reeller Livebefund

Auf Betreiber-iPad mit Chrome:

- Eye-Button ist sichtbar;
- Passwortfeld zeigt weiterhin Punkte;
- Klick auf Eye erzeugt sichtbaren Fokus-/Blau-Rahmen;
- Passwort wird **nicht** sichtbar;
- damit ist der vorherige Fix erneut LIVE FAILED.

Admin-Login-Passworttoggle funktioniert dagegen.

## Aktueller Codehinweis

`user-app.js` rendert das Passwortfeld und den statischen Eye-Button korrekt gemeinsam und ruft anschließend `NeutralUiFeedback.bindPasswordToggle(...)` auf.

`ui-feedback.js` enthält grundsätzlich den erwarteten Click-Handler mit `password ↔ text`.

Damit darf nicht nochmals nur behauptet werden, dass der Helper logisch korrekt aussieht. Der tatsächliche Browserpfad muss untersucht werden.

## Auftrag

Finde die konkrete Ursache, warum der Click live Fokus erzeugt, aber `input.type` nicht sichtbar auf `text` wechselt bzw. sofort wieder zurückgesetzt wird.

Prüfe mindestens:

- ob `bindPasswordToggle()` im User-Shell-Pfad zum Zeitpunkt des Renderns tatsächlich existiert und ausgeführt wird;
- ob der Button wirklich an **genau das aktuell sichtbare** `#userLoginPassword` gebunden wird;
- ob ein späterer Render/MutationObserver den Input oder Button ersetzt;
- ob mehrfaches Binding oder ein alter Listener gegeneinander arbeitet;
- ob ein übergeordnetes Click-/Submit-/Pointer-Handling eingreift;
- ob Service Worker / Asset-Versionierung eine gemischte Revision ausliefert;
- ob iOS/Chrome beim `input.type`-Wechsel eine Besonderheit zeigt und ein robuster browserkompatibler Weg nötig ist;
- ob Admin und User unterschiedliche Initialisierungsreihenfolgen haben.

## Verbindliche Lösung

- statisches User-Login-Markup beibehalten;
- genau ein Eye;
- Click muss auf realem DOM zuverlässig `password → text → password` schalten;
- Icon und ARIA synchron;
- Fokus erhalten;
- kein Reload;
- Admin-Login und andere Passwortfelder nicht regressieren.

## Tests

Kein reiner String-/Regex-Test.

Mindestens ein DOM-/browsernaher Test muss:

1. echten User-Login-Renderpfad aufbauen;
2. `ui-feedback.js` in derselben Reihenfolge wie Produktion laden;
3. Button klicken;
4. den **tatsächlichen sichtbaren Input** prüfen;
5. nach erstem Klick `type=text`, nach zweitem Klick `type=password` erwarten;
6. beweisen, dass kein Re-Render den Zustand sofort zurücksetzt.

Wenn im vorhandenen Teststack möglich zusätzlich WebKit-/browsernah testen.

---

# 3. App Modules / System Modules – Buttons sichtbar, Aktionen tot

## Reeller Livebefund

Die neuen getrennten Admin-Seiten **App Modules** und **System Modules** werden korrekt angezeigt.

Aber:

- `Install` ist sichtbar und aktiv;
- Klick bewirkt **gar nichts**;
- kein API-Request sichtbar für den Operator;
- kein Success;
- kein Error;
- keine Statusänderung.

Damit sind die neuen Modulansichten zwar optisch korrekt, aber funktional unbrauchbar.

## Sehr wahrscheinliche Root Cause im aktuellen Code

`admin/index.js` erzeugt getrennte Instanzen:

- `'app-modules': new AdminModulesView(apiClient, 'user')`
- `'system-modules': new AdminModulesView(apiClient, 'system')`

`modules-view.js` rendert die Lifecycle-Buttons aber weiterhin mit Inline-Handlern wie:

```js
onclick="adminModules.install('profile')"
```

sowie entsprechend `showDetails`, `activate`, `deactivate`, `uninstall`.

Nach der Aufteilung auf mehrere Views ist dieses alte globale `adminModules`-Kompatibilitätsobjekt offensichtlich nicht mehr zuverlässig die aktuell sichtbare View-Instanz.

## Auftrag

Diese alte globale Inline-Bindung entfernen bzw. sauber ersetzen.

Verbindliche Architektur:

- jede `AdminModulesView`-Instanz bindet ihre eigenen Buttons an ihre eigenen Methoden;
- bevorzugt `data-action` / `data-module-id` + `addEventListener` / Event Delegation innerhalb der View;
- **keine** Abhängigkeit von einem globalen `adminModules` für Lifecycleaktionen der getrennten Views;
- App Modules und System Modules verwenden dieselbe generische Viewklasse;
- keine doppelte Lifecyclelogik;
- Details, Install, Activate, Deactivate, Uninstall müssen für beide Kategorien funktionieren;
- Reload/Render darf Listener nicht verlieren oder duplizieren;
- Fehler müssen über bestehenden Admin-Alert sichtbar sein.

## Tests

Mindestens:

1. App-Modules-View rendern;
2. Install klicken;
3. Stub/Mock beweist `api.installModule(moduleId)` exakt einmal;
4. System-Modules-View dasselbe;
5. Activate/Deactivate/Uninstall/Details analog mindestens repräsentativ testen;
6. nach `reload()` funktionieren Buttons weiterhin;
7. kein `ReferenceError: adminModules is not defined` oder falsche Instanz;
8. keine Regression im früheren einheitlichen Modulvertrag.

---

# 4. Dokumentationsstatus

Nach dem Fix aktualisieren:

- `CHATGPT.md`
- `ADMIN-UX-DECISIONS.md`
- `STATUS.md`
- `WORKFLOW.md`
- `CHANGELOG.md` append-only

Wahrheitsgrenze:

- beide Punkte nach Codefix weiterhin `OPERATOR RETEST REQUIRED`;
- nicht als live bestanden markieren;
- bisher bestätigte PASS-Befunde unverändert lassen;
- Core Freeze weiterhin nicht erklären.

---

# 5. Verifikation und Deployment

Vor Abschluss:

1. fokussierte Tests für Eye und Module-Buttons;
2. vollständige Testsuite;
3. JS-Syntax;
4. PHP-Lint soweit betroffen;
5. `git diff --check`;
6. Production Package bauen;
7. prüfen, dass die tatsächlich paketierten User-/Admin-Assets die neue Revision enthalten;
8. commit/push `main`;
9. CodeQL/FTPS terminal abwarten;
10. read-only Production-Smoke und Deploymentrevision prüfen;
11. kein Production Restore.

Am Ende `CHATGPT.md` mit genau diesen beiden priorisierten Retests an erster Stelle aktualisieren:

1. User Login Eye auf iPad/Chrome normal + privat;
2. Install/Activate/Deactivate/Uninstall in App Modules und System Modules.

Erst nach deren erfolgreichem Operator-Test wird die restliche Live-Abnahme fortgesetzt.
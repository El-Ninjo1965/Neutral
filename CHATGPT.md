# NEUTRAL – CODEX ABSCHLUSSBERICHT

**Richtung:** Codex → ChatGPT/Lea
**Auftrag:** HTML-Dark-Frame auf iPad/Safari und redundante normale Theme-Settings
**Datum:** 2026-09-08
**Status:** CODE-SEITIG ERLEDIGT / BETREIBER-DEVICE-RETEST ERFORDERLICH

## 1. Übergabe und Scope

- Die austauschbare Sandbox wurde secretsicher mit `origin/main` verbunden und vollständig synchronisiert. Der neue Betreiberauftrag aus `CODEX.md` wurde unverändert erhalten, nach `CURRENT-TASK.md` übernommen und mit `CODEX.md == CURRENT-TASK-Anforderungen: JA` geprüft.
- Der aktuelle reale iPad/Safari-Befund hatte Vorrang vor dem früher grünen Test und der früheren Annahme zum iframe-Element-`color-scheme`.
- Der Scope blieb auf den HTML-Homepage-Frame und die normalen User Settings. Keine vollständige I18N-, Modul-Icon-, Sync-/Queue-, Admin- oder weitere P4-Architektur wurde begonnen.
- Live bestätigte Warmstart-, Home-, Button-, GPS-, Login-, Navigation- und FTPS-Stabilisierungen wurden nicht zurückgebaut. P1 bleibt `LIVE BESTANDEN`; P4 bleibt bis zum positiven Betreiber-Retest unterhalb `LIVE BESTANDEN`.

## 2. Tatsächliche Root Cause und Evidenz

Der vorherige Fix setzte ausschließlich `color-scheme` am äußeren `<iframe>`-Element. Der aktuelle reale Safari/iPad-Retest beweist, dass diese Information dort allein den Canvas des isolierten `srcdoc`-Dokuments nicht zuverlässig dunkel zeichnet.

Der Codepfad bestätigte die verbleibende Lücke: Das gespeicherte `<h1>TEST</h1>` wurde als nacktes `srcdoc`-Fragment verwendet. Innerhalb des dadurch erzeugten eigenständigen Dokuments gab es weder einen dokumenteigenen `meta name="color-scheme"` noch Author-Defaults für `html` und `body`. Der weiße Block war daher der vom isolierten Dokument gerenderte Default-Canvas, nicht ein gespeichertes Administrator-Background und nicht der bereits transparente äußere Frameworkcontainer.

Die primären WHATWG-/CSSWG-/WebKit-Seiten waren aus dieser Sandbox nicht abrufbar: sowohl die Websuche als auch direkte HTTPS-Aufrufe wurden von der Umgebung mit 401 beziehungsweise CONNECT-Proxy 403 blockiert. Deshalb wird keine externe Browserquelle als gelesen behauptet. Die Root Cause stützt sich auf den aktuellen realen Safari-Gegenbeweis, den vollständig geprüften Renderpfad und die konkret fehlenden dokumentinternen Defaults; eine erneute bloße Umformulierung des widerlegten Ansatzes wurde vermieden.

## 3. Safari-kompatibler Homepage-Dokumentadapter

- `NeutralHomepageDocument` erstellt für ein HTML-Fragment ein vollständiges `<!doctype html>`-/`html`-/`head`-/`body`-Gerüst und übernimmt die Administratorquelle exakt einmal unverändert in den Body.
- Ein bereits vollständiges HTML-Dokument behält seine Quelle; der Adapter wird am Anfang des vorhandenen `head` eingesetzt. Fehlt `head`, wird er direkt nach `html` ergänzt; ein Doctype-Dokument ohne explizites `html` erhält den Adapter direkt nach dem Doctype.
- Der Adapter setzt im isolierten Dokument genau einen Light- oder Dark-Farbraum sowie passende neutrale Defaults für `:root`, `html` und den mindestens viewport-hohen `body`.
- Diese Defaults stehen **vor** der unveränderten Administratorquelle. Ein späteres ausdrückliches `body { background: white; }`, eigene Textfarbe oder Inline-CSS besitzt dadurch nach normaler CSS-Cascade weiterhin Vorrang.
- `apply(frame, content, theme)` kann denselben bestehenden Frame bei einem Themewechsel neu aufbauen. Der User-App-Renderpfad verwendet bei jedem Render den aktuellen persistenten lokalen Theme-State.
- Die Sandbox bleibt exakt `allow-scripts allow-forms allow-popups`; `allow-same-origin` oder eine andere Lockerung wurde nicht hinzugefügt.
- Der neue Adapter wird vor `user-app.js` geladen, vom Service Worker versioniert vorgecached und über den Shared-Hosting-Root geroutet. Local-first-Homepagecache und Hintergrundrefresh bleiben unverändert.

## 4. Normale User Settings

- Der vollständige normale Block `Appearance`, Hilfetext, `Theme`-Label und Light/Dark-Select wurde entfernt.
- User Settings beginnen nun direkt mit `App areas`, gefolgt von `Privacy and sharing`; es bleibt kein leerer Appearance-Container zurück.
- Beim Speichern von App areas/Privacy wird der aktuell persistierte Theme-Wert nur mitgeführt. Es gibt keinen zweiten Themewechsel im Settings-Save-Pfad.
- Der Sonne-/Mond-Button im Header bleibt der normale unmittelbare Theme-Zugriff und verwendet unverändert `neutral.user.theme.v1`, `applyUserTheme`, Offlinepersistenz und Reload-Wiederherstellung.
- Separate Admin-/Developer-Themefunktionen wurden nicht verändert.

## 5. Tests und Verifikation

- Fokuspaket für Theme-Dokumentadapter, Fragment/Voll-Dokument, explizites Administrator-CSS, bestehenden Frame, Settings, Homepagecache, Service Worker und Packaging: **73/73 bestanden**.
- Vollständige Suite: **424/424 bestanden**, 0 Fehler, 0 übersprungen.
- PHP-Lint: **36 Dateien bestanden**.
- JavaScript-Syntaxcheck: bestanden.
- `git diff --check`: bestanden.
- Produktionspaket: erfolgreich, **106 Payload-Dateien**, Base Path `""`.
- Secret-Pattern-Prüfung: bestanden; keine Zugangswerte aufgenommen.
- Ein lokaler visueller Screenshot war nicht möglich, da diese Sandbox weder Chromium/Chrome noch einen Browserdriver enthält. Der reale iPad/Safari-Test bleibt deshalb ausdrücklich Teil der Betreiberabnahme.

## 6. GitHub und CI

- Implementierungscommit: `8a76d42` (`fix: theme sandboxed homepage documents`), nach GitHub `main` übertragen.
- CodeQL / `Push on main`: Run `34219386335` terminal `success`.
- FTPS Run `34219386338` baute, testete, paketierte und lud erfolgreich hoch, scheiterte anschließend jedoch terminal im read-only Smoke mit `Öffentlicher Root ist nicht erreichbar.`. Dieser nicht-revisionsbezogene Smoke-Fehler wurde vertragsgemäß nicht kaschiert oder automatisch als Erfolg behandelt. Der verwendete Fine-grained Token darf Actions-Runs nicht manuell erneut starten.
- Abschlussbericht-Commit `9e7c989` wurde nach `main` übertragen. Dessen vollständige Folgeprüfung war terminal erfolgreich:
  - `FTPS Deploy`: Run `34219973400` – `success`, einschließlich Upload und read-only Produktions-Smoke.
  - `Push on main` / CodeQL: Run `34219973622` – `success`.
- Die abschließende operative Statusmarkierung wird ebenfalls nach `main` übertragen und vor der externen Abschlussmeldung erneut bis zu terminaler CI, `HEAD == origin/main`, sauberem Working Tree und identischem GitHub-Blob verifiziert.

## 7. Noch notwendiger Betreiber-Retest

1. Dark aktivieren und HTML-Homepage `<h1>TEST</h1>` prüfen: keine künstliche große weiße Frameworkfläche.
2. Light aktivieren und denselben Inhalt auf passenden hellen Default prüfen.
3. Settings öffnen: Appearance/Theme-Block ist entfernt; App areas und Privacy bleiben vorhanden.
4. Theme ausschließlich über den Header wechseln, Reload durchführen und Persistenz bestätigen.
5. Home, GPS und Warmstart kurz regressiv prüfen.

Bis diese fünf realen Device-Schritte positiv bestätigt sind, bleibt der Status `CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED`.

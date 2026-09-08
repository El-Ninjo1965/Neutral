# NEUTRAL – CODEX ABSCHLUSSBERICHT

**Richtung:** Codex → ChatGPT/Lea
**Auftrag:** Weißer `Loading…`-Zwischenzustand beim Dark-Warmstart
**Datum:** 2026-09-08
**Status:** CODE-SEITIG ERLEDIGT / BETREIBER-DEVICE-RETEST ERFORDERLICH

## 1. Übergabe und Scope

- Die Sandbox wurde secretsicher mit `origin/main` synchronisiert. Der neuere Betreiberauftrag wurde vollständig aus `CODEX.md` nach `CURRENT-TASK.md` übernommen und mit `CODEX.md == CURRENT-TASK-Anforderungen: JA` geprüft.
- Der aktuelle Livebefund hatte Vorrang: Nicht mehr der iframe-Endzustand oder dessen Load-Gate, sondern ein vorgelagerter sichtbarer statischer `Loading…`-Zustand war der verbliebene helle Flash.
- Der Scope blieb auf Shell-First-Paint, frühen Theme-Bootstrap und echten Cold-Start-Status. iframe-Adapter/-Gate, Cache, Theme, Settings, Home/GPS, GPS, Login, Buttons, P1 und FTPS wurden nicht zurückgebaut.

## 2. Exakte Root Cause

### Warum erschien bei gültigem lokalem Homepagecache noch `Loading…`?

`Web-App/public/index.html` enthielt innerhalb von `#userAppContent` immer bereits statisches sichtbares Markup mit `<div class="user-app-status">Loading…</div>`. Dieses HTML konnte der Browser zeichnen, bevor die vielen deferred Shell-Skripte ausgeführt waren. Erst `homepage-cache.js` und danach `user-app.js` lasen synchron den gültigen Local-first-Cache und ersetzten das statische Markup durch die Homepage. Das Loading war daher kein notwendiger Netzwerk- oder Storagezustand, sondern ein pauschaler, vor dem Cache-Read ausgelieferter Shell-Placeholder.

### Warum war dieser Zustand im Dark Theme hell?

Der synchrone Head-Bootstrap las den Theme-Key zwar korrekt **vor** dem Stylesheet und setzte `html[data-user-theme]`. Die zentralen Dark-Tokens (`--surface`, `--text`, `--border` usw.) wurden zu diesem Zeitpunkt jedoch nur über `body[data-theme="dark"]` überschrieben. Dieses Body-Attribut setzt erst das deferred `user-app.js`. Zusätzlich verwendete `.user-app-status` feste helle Grün-/Weißwerte statt semantischer Tokens. Somit konnte Safari den statischen Loadingblock vor User-App-Ausführung mit Light-Defaults painten.

## 3. Neuer First-Paint-/Warmstartpfad

- Das statische `#userAppContent` ist jetzt leer, aber weiterhin layoutstabil und `aria-busy="true"`. Es behauptet vor Kenntnis des lokalen Zustands keinen generischen sichtbaren Ladebedarf.
- Der bestehende synchrone Head-Bootstrap bleibt vor dem render-blocking `style.css` und setzt aus `neutral.user.theme.v1` `html[data-user-theme]` auf `dark` oder den definierten Default `light`.
- Die semantischen Theme-Tokens reagieren nun bereits auf `:root[data-user-theme]`. Dadurch stehen Dark- oder Light-Surface, Text und Color-Scheme beim ersten Body-/Shell-Paint fest, ohne auf deferred JavaScript zu warten.
- Wenn `user-app.js` startet, ist der Homepagecache bereits synchron gelesen. Bei gültigem lokalen HTML rendert der erste Runtime-Render unmittelbar die lokale Homepage; das frühere statische `Loading…` existiert nicht mehr.
- Beim echten Cold Start ohne verwertbaren Cache erzeugt ausschließlich `renderLandingPage()` nach `applyUserTheme()` den zugänglichen Laufzeitstatus. `.user-app-status` verwendet nun `var(--surface-tertiary)`, `var(--text)` und `var(--border)` und ist deshalb ab seinem ersten sichtbaren Paint theme-konform.
- Kein Loading wurde per CSS versteckt. Es gibt keinen neuen Timeout, keine Animation, keine Verzögerung und keine Verkürzung fachlicher Hintergrundarbeit.

## 4. Erhaltene Verträge

- Local-first Cache und Hintergrundrefresh bleiben unverändert; es werden keine Session-/Berechtigungsdaten lokal ergänzt.
- iframe-Dokumentadapter und revisionsgebundenes iframe-Load-Gate bleiben unverändert aktiv.
- Service Worker und deploy-gestempelte Shellassets liefern die aktualisierte HTML-/CSS-Version.
- Appearance bleibt aus normalen User Settings entfernt; Header-Themewechsel und Reloadpersistenz bleiben erhalten.
- Home/GPS, GPS, Login, Buttonsystem, P1-Sessiontrennung, Auth/CSRF, Packaging/Base Path und FTPS-/Smoke-Stabilisierung blieben grün.

## 5. Verifikation

- Fokuspaket für Bootstrap/Loading, Homepagecache/-Dokument, iframe-Gate, Service Worker, Packaging und User-Auth: **87/87 bestanden**.
- Vollständige Suite: **427/427 bestanden**, 0 Fehler, 0 übersprungen.
- PHP-Lint: **36 Dateien bestanden**.
- JavaScript-Syntaxcheck: bestanden.
- `git diff --check`: bestanden.
- Produktionspaket: erfolgreich, **106 Payload-Dateien**, Base Path `""`.
- Secret-Pattern-Prüfung: bestanden; keine Zugangswerte aufgenommen.
- Ein echter Safari-First-Paint-Test war in der Sandbox mangels Safari/iPad sowie Chromium/Chrome/Browserdriver nicht möglich. Die DOM-, Bootstrap- und CSS-Load-Order-Verträge schließen den bekannten statischen hellen Loadingpfad strukturell aus; eine visuelle Livebestätigung wird nicht erfunden.

## 6. GitHub, FTPS und CodeQL

- Implementierungscommit: `0eaca99` (`fix: remove warmstart loading flash`), nach GitHub `main` übertragen.
- Implementierungs-CI terminal erfolgreich:
  - `FTPS Deploy`: Run `34228804571` – `success`, einschließlich Tests, Paketbau, Upload und read-only Produktions-Smoke.
  - `Push on main` / CodeQL: Run `34228804096` – `success`.
- Bericht-Commit `84f3138` wurde nach `main` übertragen; auch dessen Folgeprüfung war terminal erfolgreich:
  - `FTPS Deploy`: Run `34229356978` – `success`.
  - `Push on main` / CodeQL: Run `34229356719` – `success`.
- Die abschließende operative Statusmarkierung wird ebenfalls übertragen und vor der externen Abschlussmeldung erneut bis zu terminaler CI, `HEAD == origin/main`, sauberem Working Tree und identischem GitHub-Blob verifiziert.

## 7. Noch erforderlicher Betreiber-Retest

1. Dark Theme aktivieren und einmal vollständig laden.
2. Danach mehrfach Reload/Warmstart durchführen.
3. Prüfen: kein weißes `Loading…`, kein heller Flash; lokaler Homepageinhalt erscheint unmittelbar beziehungsweise ohne unnötigen sichtbaren Loading-State.
4. Echten Cold Start soweit praktikabel getrennt prüfen: Ein notwendiger Loading-State muss theme-konform sein.
5. Light↔Dark und Reload-Persistenz prüfen.
6. Home, GPS, Settings und Warmstart kurz regressiv prüfen.

Bis diese sechs realen iPad/Safari-Schritte positiv bestätigt sind, bleibt P4 `CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED`.

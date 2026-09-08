# NEUTRAL – Status

**Status:** DARK-WARMSTART-LOADING-FIX CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED · P1 LIVE BESTANDEN
**Geprüft:** 2026-09-08
**Reference:** Repository + live operator confirmation + workflow reset documentation

## Current device-live status

- P1 (User-App vs Admin-Interface separation): LIVE BESTANDEN.
- Real operational confirmation: user app and admin interface function independently; admin login does not overwrite the user session, and user login does not overwrite the admin session.
- Historical failed device reports remain stored as evidence only and are not shown as the active status.

## Active project state

- Workflow reset and governance correction: DONE / DOCUMENTED
- Codex environment `Neutral` and its secrets-safe GitHub/FTPS recovery path: DONE / DOCUMENTED
- P4 configurable landing page: DARK-WARMSTART-LOADING-FIX CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED
- Settings / Appearance separation: CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED
- Full i18n / other future feature work: PENDING
- Historical failures and older task states: retained as evidence only, not operative truth

## P4 implementation evidence

- `Admin → Settings` contains system and technical settings only; `Admin → Appearance` is an independent view for theme, layout, and the global start page.
- Appearance dynamically derives start-module choices from active modules with a client entry.
- The central settings service persists `module` or `html`, the selected module, and trusted administrator HTML without altering HTML, inline styles, links, images, or JavaScript.
- Root Cause des aktuellen Livefehlers: Die produktiv ausgelieferten, nicht versionierten User-App-Assets konnten trotz neuer Service-Worker-Version aus dem 24-Stunden-HTTP-Cache stammen. Außerdem lag der Homepage-Fetch seriell hinter dem Core-/Discovery-Start; dessen Fehler verhinderte den Fetch vollständig. Das Produktionspaket versioniert nun alle lokalen CSS-/JS-Referenzen mit dem Deployment-Commit und die drei unabhängigen Startpfade laufen über `Promise.allSettled`.
- Die User-App öffnet danach ein erlaubtes konfiguriertes Modul oder rendert das unveränderte Administrator-HTML. Automatisierte Regressionen sind grün; der nachgewiesene Livefehler bleibt bis zum positiven Betreiber-Retest die operative Wahrheit.
- Betreiber-Livebefund vom 2026-09-08 bestätigte Modul- und HTML-Modus grundsätzlich, zeigte aber Folgefehler bei Reload-/Startkontext, Default-Flash, statischem HTML-Welcome, Fokusrahmen, Login-Race, Settings-Reset und GPS-Darstellung. Diese Pfade sind code-seitig korrigiert und benötigen erneut den Device-Retest.
- Der anschließende Betreiber-Retest bestätigte diese Folgefixes live. Neuer Livebefund war eine circa zweisekündige Loading-Phase bei jedem Warmstart sowie eine zu schwache Textlink-Affordance der zentralen Navigation. Root Cause der Wartezeit war die ausschließlich serverseitig geladene Homepageprojektion; der neue öffentliche, schema-versionierte Local-first-Cache und die zentrale Buttonnavigation sind code-seitig umgesetzt und benötigen den nächsten Device-Retest.
- Der nächste Betreiber-Retest bestätigte Warmstart, Navigation, HTML und GPS live. Offen waren inkonsistente Dark-Flächen/Kontraste und fehlende Schnellumschaltung. Diese sind über zentrale Theme-Tokens und einen gemeinsamen persistenten Header-/Settings-State code-seitig korrigiert. Wiederkehrende FTPS-Fehlmeldungen wurden auf kurzfristige alte HTTP-Revisionsstände nach erfolgreichem Upload sowie überlappende Deployments zurückgeführt; bounded Revision-Retry und Workflow-Concurrency sind umgesetzt.
- Der aktuelle Betreiber-Retest bestätigte Warmstart, Theme-Switch, GPS, HTML und touchbare Navigation live. Das Folgepaket vereinheitlicht Buttons/Header-Actions, ersetzt den sichtbaren Starttext barrierefrei durch ein lokales Home-SVG, reduziert die Loginansicht und bindet den unabhängigen `srcdoc`-Canvas explizit an den aktuellen Theme-Farbraum. Der gespeicherte freie HTML-Inhalt wird weiterhin nicht verändert. Device-Retest bleibt erforderlich.
- Der folgende iPad/Safari-Retest widerlegte diese reine iframe-Element-Lösung: `<h1>TEST</h1>` blieb auf großem weißem Canvas. Der neue dokumenteigene Adapter liefert vor der unveränderten Administratorquelle explizite Light-/Dark-Defaults für `html`/`body`; Administrator-CSS folgt später und behält Vorrang. Der redundante normale User-Settings-Themeblock ist entfernt, während der persistente Header-Toggle bestehen bleibt. Device-Retest erforderlich.
- Der nächste iPad/Safari-Retest bestätigte den final dunklen HTML-Zustand, zeigte aber noch einen kurzen weißen Initial-Paint. Root Cause war der weiterhin sichtbare anfängliche iframe-Browsing-Context vor dem Commit des thematisierten `srcdoc`. Der Frame wird jetzt vor Insertion vollständig vorbereitet und erst nach seinem revisionsgebundenen thematisierten Load sichtbar; der Wrapper zeichnet ohne Loading oder Layoutsprung durchgehend die Theme-Surface. Device-Retest erforderlich.
- Der aktuelle Betreiber-Retest lokalisierte den verbliebenen hellen Flash außerhalb des iframe: Das statische `index.html` zeigte immer `Loading…` mit festen Light-Farben, bevor deferred Scripts den synchronen Homepagecache lasen; zentrale Dark-Tokens wurden erst am später gesetzten Body aktiv. Die statische Shell ist nun loadingfrei und `:root` erhält das persistierte Theme vor dem render-blocking CSS. Nur der echte cachelose Cold Start rendert danach einen tokenbasierten Status. Device-Retest erforderlich.

## Historical evidence retained

The following remain as historical evidence and must not be promoted to active status without a current live confirmation:

- `User is not valid or active`
- `Set up the local developer account before logging in`
- `Server authentication client is not available`
- `No authenticated user was returned by the server`
- earlier failed P1 device checks and prior root-cause reports

These entries remain in the archive and support root-cause analysis, but they do not override the current live operator confirmation.

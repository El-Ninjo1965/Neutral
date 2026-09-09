# NEUTRAL – Status

**Status:** P4 LIVE BESTANDEN · P1 LIVE BESTANDEN
**Geprüft:** 2026-09-08
**Reference:** Repository + live operator confirmation + workflow reset documentation

## Current device-live status

- P1 (User-App vs Admin-Interface separation): LIVE BESTANDEN.
- Real operational confirmation: user app and admin interface function independently; admin login does not overwrite the user session, and user login does not overwrite the admin session.
- Historical failed device reports remain stored as evidence only and are not shown as the active status.

## Active project state

- Workflow reset and governance correction: DONE / DOCUMENTED
- Codex environment `Neutral` and its secrets-safe GitHub/FTPS recovery path: DONE / DOCUMENTED
- P4 configurable landing page: LIVE BESTANDEN
- Settings / Appearance separation: LIVE BESTANDEN; obsolete Theme/Layout controls removed code-side
- Appearance UX V2 + local navigation personalization: CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED
- Full i18n / other future feature work: PENDING
- Historical failures and older task states: retained as evidence only, not operative truth

## P4 implementation evidence

- `Admin → Settings` contains system and technical settings only; `Admin → Appearance` is an independent view for the global start page. The obsolete server-backed Theme/Layout controls had no productive consumer and are no longer presented; the independent local Admin and User header theme controls remain.
- Appearance dynamically derives start-module choices from active modules with a client entry.
- The central settings service persists `module` or `html`, the selected module, and trusted administrator HTML without altering HTML, inline styles, links, images, or JavaScript.
- Root Cause des aktuellen Livefehlers: Die produktiv ausgelieferten, nicht versionierten User-App-Assets konnten trotz neuer Service-Worker-Version aus dem 24-Stunden-HTTP-Cache stammen. Außerdem lag der Homepage-Fetch seriell hinter dem Core-/Discovery-Start; dessen Fehler verhinderte den Fetch vollständig. Das Produktionspaket versioniert nun alle lokalen CSS-/JS-Referenzen mit dem Deployment-Commit und die drei unabhängigen Startpfade laufen über `Promise.allSettled`.
- Die User-App öffnet danach ein erlaubtes konfiguriertes Modul oder rendert das unveränderte Administrator-HTML. Automatisierte Regressionen sind grün; spätere Betreiber-Retests bestätigten die vollständige P4-Kette live.
- Betreiber-Livebefund vom 2026-09-08 bestätigte Modul- und HTML-Modus grundsätzlich, zeigte aber Folgefehler bei Reload-/Startkontext, Default-Flash, statischem HTML-Welcome, Fokusrahmen, Login-Race, Settings-Reset und GPS-Darstellung. Diese Pfade sind code-seitig korrigiert und benötigen erneut den Device-Retest.
- Der anschließende Betreiber-Retest bestätigte diese Folgefixes live. Neuer Livebefund war eine circa zweisekündige Loading-Phase bei jedem Warmstart sowie eine zu schwache Textlink-Affordance der zentralen Navigation. Root Cause der Wartezeit war die ausschließlich serverseitig geladene Homepageprojektion; der neue öffentliche, schema-versionierte Local-first-Cache und die zentrale Buttonnavigation sind code-seitig umgesetzt und benötigen den nächsten Device-Retest.
- Der nächste Betreiber-Retest bestätigte Warmstart, Navigation, HTML und GPS live. Offen waren inkonsistente Dark-Flächen/Kontraste und fehlende Schnellumschaltung. Diese sind über zentrale Theme-Tokens und einen gemeinsamen persistenten Header-/Settings-State code-seitig korrigiert. Wiederkehrende FTPS-Fehlmeldungen wurden auf kurzfristige alte HTTP-Revisionsstände nach erfolgreichem Upload sowie überlappende Deployments zurückgeführt; bounded Revision-Retry und Workflow-Concurrency sind umgesetzt.
- Der aktuelle Betreiber-Retest bestätigte Warmstart, Theme-Switch, GPS, HTML und touchbare Navigation live. Das Folgepaket vereinheitlicht Buttons/Header-Actions, ersetzt den sichtbaren Starttext barrierefrei durch ein lokales Home-SVG, reduziert die Loginansicht und bindet den unabhängigen `srcdoc`-Canvas explizit an den aktuellen Theme-Farbraum. Der gespeicherte freie HTML-Inhalt wird weiterhin nicht verändert. Device-Retest bleibt erforderlich.
- Der folgende iPad/Safari-Retest widerlegte diese reine iframe-Element-Lösung: `<h1>TEST</h1>` blieb auf großem weißem Canvas. Der neue dokumenteigene Adapter liefert vor der unveränderten Administratorquelle explizite Light-/Dark-Defaults für `html`/`body`; Administrator-CSS folgt später und behält Vorrang. Der redundante normale User-Settings-Themeblock ist entfernt, während der persistente Header-Toggle bestehen bleibt. Device-Retest erforderlich.
- Der nächste iPad/Safari-Retest bestätigte den final dunklen HTML-Zustand, zeigte aber noch einen kurzen weißen Initial-Paint. Root Cause war der weiterhin sichtbare anfängliche iframe-Browsing-Context vor dem Commit des thematisierten `srcdoc`. Der Frame wird jetzt vor Insertion vollständig vorbereitet und erst nach seinem revisionsgebundenen thematisierten Load sichtbar; der Wrapper zeichnet ohne Loading oder Layoutsprung durchgehend die Theme-Surface. Device-Retest erforderlich.
- Der aktuelle Betreiber-Retest lokalisierte den verbliebenen hellen Flash außerhalb des iframe: Das statische `index.html` zeigte immer `Loading…` mit festen Light-Farben, bevor deferred Scripts den synchronen Homepagecache lasen; zentrale Dark-Tokens wurden erst am später gesetzten Body aktiv. Die statische Shell ist nun loadingfrei und `:root` erhält das persistierte Theme vor dem render-blocking CSS. Nur der echte cachelose Cold Start rendert danach einen tokenbasierten Status. Der Betreiber-Retest vom 2026-09-08 bestätigte anschließend mehrfachen Dark-Warmstart ohne weißes `Loading…` oder hellen Flash und mit unmittelbarem lokalem Homepageinhalt. Zusammen mit den bereits bestätigten Modul-/HTML-, Navigation-, Theme- und P1-Pfaden enthält der definierte P4-Scope keinen offenen Pflichtpunkt mehr: **P4 = LIVE BESTANDEN**.

## Historical evidence retained

The following remain as historical evidence and must not be promoted to active status without a current live confirmation:

- `User is not valid or active`
- `Set up the local developer account before logging in`
- `Server authentication client is not available`
- `No authenticated user was returned by the server`
- earlier failed P1 device checks and prior root-cause reports

These entries remain in the archive and support root-cause analysis, but they do not override the current live operator confirmation.

- 2026-09-09: Admin operations implementation completed code-side: role cleanup migration, device sessions, classified registry, authoritative infrastructure, persistent maintenance, backup lifecycle/cron/retention and audited audit retention. P1/P4 remain `LIVE BESTANDEN`.

- 2026-09-09 Phase 2 Admin reality fixes: CODE-SEITIG ERLEDIGT; deployment/CI and host readiness checks tracked in `CHATGPT.md`; DEVICE RETEST REQUIRED. No new LIVE-BESTANDEN claim for these Admin paths. P1/P4 status unchanged.

## 2026-09-09 — Live-Retest-Follow-up

**CODE-SEITIG ERLEDIGT, DEPLOY/DEVICE/HOST-ABNAHME AUSSTEHEND:** Device-Relogin dedupliziert pro Installation, Admin-Reauth/Router stabilisiert, Dashboard/Infrastruktur/Audit bereinigt, Core-Freeze-Vertrag geprüft und GPS-Basis ergänzt. Automatisierte Regression ist grün. Reale iPad/Chrome-Abnahme und hostseitige Backup-Key/ACL/Cron-Aktivierung bleiben erforderlich; diese Bereiche sind nicht `LIVE BESTANDEN`. P1 und P4 bleiben unverändert `LIVE BESTANDEN` aus ihrer bestehenden Betreiberabnahme.

## 2026-09-09 — Device-/Responsive-Follow-up

**CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED / HOST ACTION REQUIRED:** Der verbliebene Sessionfehler lag im eigenständigen Admin-Login, das die persistente Installations-ID des API-Clients umging. Admin-Logins verwenden nun denselben lokalen Device-Vertrag; aktive Legacyzeilen ohne Device-ID werden nicht mehr gezählt und bei einem qualifizierten Relogin sicher ersetzt. Dashboardvorschau, Backup-Readiness, Audit-Ergebnisse, GPS-Öffnen/Teilen, interaktive OSM-Karte und das generische responsive User-Grid sind korrigiert. Alte zufällige, aber nicht leere Device-IDs können ohne Risiko für echte Zweitgeräte nicht automatisch zusammengeführt werden und müssen einmalig über die Sessionverwaltung geprüft werden. P1/P4 bleiben aufgrund ihrer bestehenden Liveabnahme unverändert; die neuen Flächen sind nicht als live bestanden erklärt.

## 2026-09-09 – Core-freeze account/license pass

**CODE-SEITIG ERLEDIGT / DEPLOYED / DEVICE RETEST REQUIRED / HOST ACTION REQUIRED:** Session-Deduplizierung bleibt erhalten; UTC/lokale Anzeige, GPS-I18N/interaktive OSM-Karte, Settings-Unterseiten/Active-State, Profile/Privacy/Passwort, vereinfachtes User Management und das generische Package-/License-/Device-/Presence-/Mediafundament sind umgesetzt. Migration `0005`, Deploymentrevision und `migrationsReady:true` sind im erfolgreichen Produktionssmoke bestätigt. P1/P4 bleiben aus ihrer bestehenden Abnahme `LIVE BESTANDEN`; die neuen Flächen sind ohne Betreibercheck nicht live bestanden. Hostaktion bleibt ausschließlich für Backup-Key/ACL/Cron erforderlich.

## 2026-09-09 P0/Core-freeze follow-up

The six code-side gaps in the active handoff are implemented and locally verified. User/Admin auth, GPS position and external OSM behavior remain **DEVICE RETEST REQUIRED** because the reported production failures require a real operator login/device check after deployment. Scoped license and media flows are code-side present; host/database and operator acceptance remain required before any `LIVE BESTANDEN` statement.

## 2026-09-09 — Authentication P0 follow-up

The repository now removes all known request-time auth DDL and safely classifies infrastructure failures. Code/test/CI evidence does not prove real credentials: both existing User `Tester` and Admin `Developer` remain **DEVICE RETEST REQUIRED** after deployment.

# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER LIVE-ROOT-CAUSE-REPARATURAUFTRAG VOR WEITERER OPERATOR-ABNAHME  
**Datum:** 2026-09-11

# Ziel

Der letzte Frontend-Hotfix hat die lokalen Tests und das Deployment bestanden, aber der reale Betreiber-Retest zeigt weiterhin zwei Blocker:

1. **User Login Eye fehlt live erneut vollständig**, obwohl der aktuelle Repository-Code das Eye statisch rendert.
2. **Module-Install-Button reagiert jetzt**, endet aber live mit `Install failed: Internal server error.`

Zusätzlich wurden zwei klare Admin-UX-Fehler festgestellt:

3. Sidebar lässt sich horizontal verschieben und wirkt beim Tippen „schwimmend“.
4. Logout soll ausschließlich `Logout` anzeigen, ohne `· Bootstrap Administrator` oder andere Benutzerbezeichnung.

Dieser Lauf darf nicht wieder nur symptomatisch am Eye-Helper arbeiten. Erst die **tatsächliche Live-Ursache** belegen, dann korrigieren.

Kein Core Freeze. Kein Production Restore. Keine neuen Features. Keine unnötigen Refactorings.

---

# 1. Pflicht-Preflight

Vor jeder Änderung:

1. Repository `/workspace/Neutral` verwenden.
2. Sicherstellen, dass Working Tree sauber ist.
3. GitHub-/Repository-/Actions-/Deployment-Verbindung gemäß separat ausgeführtem sicheren Preflight prüfen bzw. dessen Ergebnis übernehmen.
4. `origin/main` lesen/synchronisieren; erwarteter Stand mindestens `34911416752dc73d7f085ce1612161336a08462d`.
5. Folgende Dokumente vollständig lesen:
   - `CHATGPT.md`
   - `ADMIN-UX-DECISIONS.md`
   - `STATUS.md`
   - `UI-UX.md`
   - `WORKFLOW.md`
   - `CHANGELOG.md`
   - `CORE-1.0-READINESS.md`
   - diese Datei.
6. Relevanten Code lesen:
   - `Web-App/public/index.html`
   - `Web-App/public/user-app.js`
   - `Web-App/public/ui-feedback.js`
   - `Web-App/public/service-worker.js`
   - `Web-App/public/public-path.js`
   - Production-Package-/Asset-Revision-Code
   - `Server/public/admin.php`
   - `Web-App/public/admin/modules-view.js`
   - `Web-App/public/admin/index.js`
   - `Web-App/public/admin-init.js`
   - `Web-App/public/api-client.js`
   - Modul-Lifecycle-/Migration-/Registry-Servercode
   - relevante Tests.

Erst Root Cause belegen, dann ändern.

---

# 2. User Login Eye – LIVE fehlt erneut vollständig

## Reeller Livebefund

Betreiber-iPad, Chrome:

- User-Login zeigt Username und Password.
- Eye ist **nicht sichtbar**.
- Admin-Login-Eye funktioniert weiterhin.
- Dies trat nach einem Hotfix auf, dessen Repository-Code das Eye im User-Login statisch enthält und dessen lokale Tests erfolgreich waren.

Damit reicht keine weitere isolierte Änderung an `bindPasswordToggle()`.

## Zentrale Hypothese, die jetzt bewiesen oder widerlegt werden muss

Der reale User-Shell-Pfad liefert möglicherweise **nicht dieselbe öffentliche Assetrevision**, die in `main` und im Production-Package erwartet wird. Kandidaten:

- alter Service-Worker-Cache;
- gemischte Shell-/Scriptrevision;
- stale `index.html` oder `user-app.js`;
- falscher Base-Path/Public-Path;
- Cache-Control-/ETag-Verhalten;
- Production-Package enthält zwar neuen Code, aber der tatsächlich vom Browser verwendete Pfad zeigt auf einen anderen/stalen Assetpfad;
- Service Worker aktiviert neue Revision nicht sauber oder cached Shell falsch.

Admin-Login ist hiervon weitgehend getrennt und daher ein wichtiger funktionierender Vergleichspfad.

## Auftrag A – reale Auslieferungskette vollständig nachvollziehen

Prüfe konkret:

1. Welche HTML-Datei wird beim User-Login live wirklich ausgeliefert?
2. Welche `user-app.js`, `ui-feedback.js`, `style.css`, Service-Worker-Datei und Revision werden live wirklich geladen?
3. Stimmen diese Inhalte/Hashes/Revisionen mit dem aktuellen Production-Package und `main` überein?
4. Welche Dateien liegen tatsächlich im Deploymentartefakt?
5. Welche Cache-Strategie verwendet der Service Worker für Shell und öffentliche Scripts?
6. Wird `index.html` cache-first, network-first oder stale-while-revalidate geliefert?
7. Kann ein alter Service Worker nach Deployment alte `user-app.js` weiterreichen?
8. Wird beim neuen Deployment der Cache-Key/Revision-Key sicher geändert?
9. Werden alte Caches gelöscht?
10. Wird ein neu installierter Worker tatsächlich aktiviert/übernommen oder bleibt der alte Controller aktiv?
11. Gibt es unterschiedliche Pfade zwischen Browser normal/privat/PWA?
12. Gibt es doppelte/public-path-abweichende Kopien von `user-app.js` oder `ui-feedback.js` im Paket/Host?

## Auftrag B – Beweis statt Annahme

Baue eine **read-only verifizierbare Produktionsprüfung**, die nach Deployment ohne Login/Mutation zeigen kann:

- welche öffentliche Revision live ist;
- dass das live ausgelieferte User-Login-Markup bzw. `user-app.js` tatsächlich `password-visibility-toggle` enthält;
- dass die geladene `ui-feedback.js` die erwartete Toggle-Implementierung enthält;
- dass Service-Worker-/Cache-Version zur Deploymentrevision passt.

Dabei keine Secrets, keine Auth-Cookies und keine sensiblen Inhalte ausgeben.

Wenn direkte Produktions-HTTP-Abfragen im Workspace nicht möglich sind, die Prüfung in den bestehenden read-only GitHub-Actions-Smoke integrieren, ohne Deployment oder Login zu mutieren.

## Verbindliche Lösung

- Nicht einfach noch einen dritten Eye-Handler hinzufügen.
- Ursache muss nachweislich im Auslieferungs-/Cache-/Initialisierungspfad behoben werden.
- Genau ein Eye im User-Login.
- Nach normalem Deployment muss der aktuelle User-Shell-Code ohne manuellen Browsercache-Trick ausgeliefert werden.
- Bestehende PWA-/Offline-Funktion erhalten.
- Admin-Login nicht regressieren.
- Cache-Invalidierung darf nicht zu Endlosschleifen oder ständigem Voll-Reload führen.

## Tests

Mindestens:

- Production-Package-Test: tatsächlich enthaltene `user-app.js` besitzt statisches Eye.
- Service-Worker-Test: neue Revision invalidiert alte öffentliche Shell-/Script-Caches korrekt.
- Upgrade-Test: Simuliere alten Cache + neue Deploymentrevision und beweise, dass anschließend neuer User-Login-Code verwendet wird.
- Kein reiner Regex-Test als alleiniger Beweis.

Nach Deployment bleibt **OPERATOR RETEST REQUIRED**.

---

# 3. Module Install – Frontend reagiert, Backend liefert Internal Server Error

## Reeller Livebefund

Nach dem letzten Binding-Fix:

- App Modules/System Modules werden korrekt angezeigt.
- Install-Button reagiert jetzt.
- Es erscheint ein echter Fehler:
  `Install failed: Internal server error.`

Damit ist die frühere tote Button-Bindung behoben. Jetzt liegt ein **realer Backend-/Lifecycle-Fehler** vor.

## Auftrag

Keine weitere generische `catch`-Schicht als Hauptlösung. Finde die echte Exception.

Prüfe end-to-end:

1. konkreten HTTP-Request beim Install;
2. Route und Permission-/CSRF-Pfad;
3. `ModuleLifecycle` / Registry / MigrationRunner;
4. Manifest-/Serverentry-Auflösung;
5. DB-DDL/Migrationsstatus;
6. vorhandene partielle Registry-/State-Zeilen;
7. MySQL-Fehler / Constraint / Duplicate / fehlende Tabelle/Spalte;
8. Unterschiede zwischen Profile, Field Notes, Postbox, Media etc.;
9. ob ein generischer Fehler alle Module betrifft oder nur einzelne;
10. ob der aktuelle kompensierende Fehlerpfad die eigentliche Exception verschluckt.

## Logging / Diagnose

- In Dev/Test muss die konkrete Root-Cause sichtbar sein.
- In Production keine Secrets/SQL-Credentials ausgeben.
- Benutzer bekommt weiterhin kontrollierte Fehlermeldung.
- Audit/Serverlog darf einen sicheren Fehlercode/Korrelationseintrag enthalten.

## Verbindliches Verhalten

- Install ist retry-safe.
- Bei Fehler kein falsches `Registered: Yes`.
- Kein halb-installierter inkonsistenter Lifecycle.
- Erfolgreicher Install → Registered/Inactive konsistent.
- Activate → Active.
- Deactivate/Re-activate funktionieren.
- Uninstall gemäß bestehendem Retention-Vertrag.
- Modul-Permissions registrieren sich automatisch.
- keine modul-spezifische Core-Sonderlogik.

## Tests

Mindestens:

- ein erfolgreiches App Module;
- ein erfolgreiches System Module;
- Profile;
- Field Notes oder Postbox als zweites reales Referenzmodul;
- bewusst simulierte fehlschlagende Migration → kontrollierter rollback/kompensierter Zustand;
- erneuter Install danach erfolgreich;
- API liefert keine nackte 500 ohne sinnvolle interne Diagnose.

Nach Deployment Operator-Retest mit Install → Activate → Deactivate → Re-activate.

---

# 4. Admin Sidebar – horizontales „Schwimmen“ beseitigen

## Livebefund

Auf iPad lässt sich die linke Sidebar horizontal nach links/rechts verschieben. Beim Tippen bewegt sie sich leicht seitlich und wirkt schwimmend.

## Auftrag

- Sidebar horizontal vollständig fixieren;
- `overflow-x: hidden` bzw. korrekte Layoutlösung;
- nur vertikales Scrollen zulassen, falls nötig;
- keine horizontale Scrollbar / Overscroll;
- `touch-action`/Overscroll nur soweit nötig korrekt setzen;
- lange Menüeinträge dürfen die Sidebar nicht verbreitern;
- Texte sauber umbrechen oder innerhalb der festen Breite bleiben;
- keine `min-width`-/Intrinsic-Width-Regel darf Container verbreitern;
- Tap/Klick darf keine horizontale Verschiebung auslösen;
- Contentbereich darf dadurch nicht abgeschnitten werden.

Test auf iPad-/schmaler Viewportbreite.

---

# 5. Logout-Text vereinfachen

Aktuell zeigt die Sidebar sinngemäß:

`Logout · Bootstrap Administrator`

Verbindliches Ziel:

`Logout`

- keine Benutzer-/Rollenbezeichnung daneben;
- keine zusätzliche redundante Admin-Identität im Sidebar-Logout;
- Logout-Funktion unverändert.

---

# 6. Bereits funktionierende Bereiche nicht regressieren

Erhalten:

- Admin Login Eye funktioniert live;
- Module-Buttons sind jetzt grundsätzlich gebunden und reagieren;
- App Modules/System Modules getrennte Views;
- GPS live funktional;
- Media/Postbox/Sharing Lifecycle früher live bestanden;
- Audit Delete All;
- Maintenance State;
- User/Package/License/Session-UX-Reparaturen des letzten Batches soweit nicht von diesem Auftrag betroffen.

Keine erneute Architektur-Umschreibung dieser Bereiche.

---

# 7. Dokumentation

Nach tatsächlicher Reparatur aktualisieren:

- `CHATGPT.md`
- `ADMIN-UX-DECISIONS.md`
- `STATUS.md`
- `CORE-1.0-READINESS.md`
- `WORKFLOW.md`
- `CHANGELOG.md` append-only

Wahrheitsgrenzen:

- Eye bleibt bis realem iPad/Chrome-Test **OPERATOR RETEST REQUIRED**.
- Module Install/Lifecycle bleibt bis realem Operator-Test **OPERATOR RETEST REQUIRED**.
- Sidebar/Logout ebenfalls Retest erforderlich.
- Kein Core Freeze erklären.

---

# 8. Verifikation und Deployment

Vor Abschluss:

1. fokussierte Root-Cause-Tests;
2. vollständige Testsuite;
3. JS-Syntax;
4. PHP-Lint;
5. `git diff --check`;
6. Production Package bauen und Inhalt prüfen;
7. Service-Worker-/Asset-Revision-Upgrade-Szenario testen;
8. Modul-Lifecycle Integrationstests;
9. commit/push `main` gemäß Workflow;
10. CodeQL/FTPS terminal abwarten;
11. read-only Production-Smoke erweitern/prüfen, insbesondere tatsächliche User-Assetrevision und Modul-API-Readiness;
12. kein Production Restore;
13. keine Secrets/Tokenwerte ausgeben.

Am Ende `CHATGPT.md` mit folgender priorisierter Retest-Reihenfolge aktualisieren:

1. User Login Eye – normal + privat auf Betreiber-iPad/Chrome;
2. App/System Module Install/Activate/Deactivate/Re-activate;
3. Sidebar horizontal stabil;
4. Logout zeigt nur `Logout`;
5. danach restliche gesammelte Operator-Abnahme fortsetzen.

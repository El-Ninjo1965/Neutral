# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** P0 PRODUCTION MODULE LOADING FAILURE AFTER `ab3c488`  
**Datum:** 2026-09-12  
**Core Freeze:** NICHT erklärt

# WICHTIG: letzter Batch technisch grün, aber Production-Retest klar FAIL

Commit `ab3c488b6bedcbe1c9478d42f59aaba2ed0a9c15` wurde laut Agent mit 550/550 Tests, CodeQL, FTPS und Production Smoke erfolgreich deployed. Der direkte Operator-Retest zeigt jedoch reproduzierbar, dass der reale Browser-Modulpfad weiterhin bzw. neu fehlerhaft ist.

**Keine weiteren Source-String-PASS-Annahmen. Keine Permission-Experimente. Zuerst den echten Production-Request-/Bootstrap-Pfad beweisen.**

Referenz-PASS, nicht regressieren:

- User Login/Eye akzeptiert.
- Admin Login funktioniert.
- Organization `Verein Bonn` in User Management korrekt.
- User Block/Unblock funktioniert.
- App/System Module doppelte Überschrift entfernt.
- Module `Details` öffnet jetzt eigene Detailansicht; Save-Bestätigung + Rückkehr zur Übersicht funktioniert operator-live.

---

# P0 – MODULE CATALOG / DISCOVERY IST IN PRODUCTION KAPUTT

## Reproduzierbare Live-Evidence

### Anonym / ausgeloggt

- Neutral über Root `https://www.turbolikes.com/#/` frisch aufgerufen.
- GPS ist zunächst **nicht sichtbar**.
- Teilweise auch nach ~30 Sekunden nicht sichtbar; erst manueller Reload bringt GPS.
- Bei weiteren Versuchen erscheint GPS nach ca. 2–3 Sekunden.
- Währenddessen blinkt/re-rendert `Welcome to Neutral` etwa zweimal.

=> Anonymer Startup-Discovery-Pfad ist langsam/instabil und rendert mehrfach.

### Login als `Ralf` / `Tester`

Direkt nach erfolgreichem Login:

- kein GPS-Menüpunkt;
- Settings → Apps zeigt `Modules could not be loaded. Check your connection and try again.`;
- Module werden nicht nachträglich geladen;
- **erst manueller Browser-Reload** führt bei Ralf/Tester dazu, dass GPS wieder erscheint und Settings → Apps das Modul sieht;
- Profile erscheint weiterhin nicht, auch nach Reload.

### Login als `Developer` / `ElNino` (Administrator)

- kein GPS-Menüpunkt;
- Settings → Apps: Module konnten nicht geladen werden;
- selbst mehrere manuelle Reloads bringen GPS nicht zurück;
- Admin/Developer sehen damit weniger als anonyme bzw. normale User.

Operator hat im Admin die GPS Module Details geprüft:

- Visibility/Navigation für Admin, Developer, User, Viewer gesetzt;
- Admin/Developer besitzen GPS View/Use/Manage/Admin;
- User/Viewer besitzen vorgesehene View/Use-Rechte.

Änderungen an diesen Permissions verändern das Fehlverhalten nicht.

**Permissions als primäre Root Cause damit nicht weiter verfolgen, solange nicht konkrete Server-Evidence das Gegenteil beweist.**

---

# P0 – ECHTE FEHLERMELDUNG / TIMEOUT

Im Admin/System-Modules-Livetest trat auf:

`Failed to load modules, Request timeout after 10000 milliseconds`

Danach wurden Inhalte teilweise trotzdem verspätet sichtbar.

Weitere Symptome:

- Menü-/Detail-Links reagieren teilweise erst beim zweiten Tippen;
- Module laden merklich träge;
- Theme-Select reagiert ebenfalls erst nach einem zweiten Tap/erneuten Öffnen.

Das deutet auf einen tieferen Request-/State-/Render-/Event-Lifecycle-Fehler hin. Nicht jeden UI-Symptom einzeln mit zusätzlichen Listenern patchen.

---

# P0 – AUFTRAG: PRODUCTION REQUEST CHAIN INSTRUMENTIEREN UND ROOT CAUSE BEWEISEN

Untersuche den realen Ablauf für **anonym, Ralf/Tester, Developer und Admin**:

1. initialer HTML/JS-Bootstrap;
2. Service Worker / Cache nur soweit tatsächlich beteiligt;
3. Session Restore `/auth/me`;
4. Modul-Catalog-Request(s): exakte Route, Reihenfolge, Auth-Cookie, Responsecode, Dauer;
5. Core Loader Cache-Entscheidung;
6. authoritative discovery;
7. Registry reconciliation;
8. User-App projection/navigation/settings;
9. Re-render count / event lifecycle;
10. Admin Module-Requests und 10s timeout.

Für jede Rolle konkret feststellen:

- welcher Request wird gesendet;
- wann relativ zu Session Restore;
- mit welchem Scope/Cookie;
- HTTP-Status;
- Serverantwort;
- Laufzeit;
- ob Request doppelt/mehrfach läuft;
- ob ein Abort/Timeout den später erfolgreichen Response verwirft;
- ob anonymer/authentifizierter Cache falsch wiederverwendet wird;
- ob Admin/Developer aufgrund einer falschen Scope-/Permission-Projektion einen Fehler statt Katalog erhalten.

**Ziel:** Ein einziger deterministischer Startup-/Login-Vertrag ohne manuellen Reload.

---

# VERBINDLICHER MODUL-STARTVERTRAG

## Anonym

- App rendert Startseite sofort stabil, ohne sichtbares Doppelblinken.
- öffentlicher Modul-Catalog wird einmal zuverlässig geladen.
- GPS erscheint automatisch ohne manuellen Reload, sofern anonym sichtbar/aktiv.

## Nach Login

- erfolgreicher Login darf die UI nicht in einen Zustand mit leerem/fehlerhaftem Modulkatalog bringen.
- authentifizierter Catalog muss automatisch geladen/projiziert werden.
- kein manueller Browser-Reload nötig.
- User sieht alle aktiven, entitled und permitted Module.

## Admin / Developer

- Admin/Developer dürfen nicht wegen ihrer höheren Rolle weniger Module sehen als normale User, sofern sie die effektiven Modulrechte besitzen.
- Rollen-/Scope-Projektion muss additive/effective Permissions korrekt behandeln.
- Keine Sonderregel `admin sees all` hardcoden, wenn RBAC das nicht vorsieht; aber vorhandene effektive Rechte müssen funktionieren.

## Fehler

- kein pauschaler 10s Timeout, der einen noch laufenden gültigen Request künstlich als Fehler markiert, ohne Root Cause zu verstehen.
- Timeouts dürfen sinnvoll bleiben, aber Ursache für >10s Request beseitigen.
- bei echtem Fehler klare retry-fähige UI; keine stale Registry.

---

# P0 – PROFILE BLEIBT LIVE FAIL

Auch nach `ab3c488`:

- Profile Installed + Active;
- Profile Permissions vorhanden;
- Ralf/Tester sehen Profile weiterhin nicht;
- Settings enthält weiterhin nur Apps/Navigation.

Profile erst **nach Stabilisierung des Catalog-/Requestpfads** erneut debuggen. Dann vom tatsächlichen Production-API-Response bis zum DOM beweisen:

`active Profile` → server catalog → client registry → effective permissions → Settings/Profile entry → öffnen → speichern.

Nicht erneut nur Manifest/Source testen.

---

# P1 – MODERATION BLEIBT LIVE UNBESTÄTIGT/FAIL

Ralf/Moderator konnte Moderation vor diesem Batch nicht erreichen. Wegen des jetzt nachgewiesenen generellen Catalog-Fehlers Moderation erst nach P0 erneut testen.

Danach:

- System Module active;
- Ralf Rolle Moderator;
- effektive moderation permissions;
- vorgesehener User-Einstieg sichtbar/erreichbar;
- Self-Test tatsächlicher Status-Endpunkt.

Keine zusätzliche Moderatorrolle erfinden.

---

# P1 – USER SETTINGS SAVE FEEDBACK ERNEUT LIVE PRÜFEN

Vor `ab3c488` fehlte das Popup bei Apps/Navigation. Der Agent hat Timing geändert, aber wegen des Catalog-Fehlers konnte dieser Punkt noch nicht sauber bestätigt werden.

Nach P0 testen/reparieren:

- Apps Save → `Successfully saved.` + `OK` sichtbar;
- Navigation Save → gleich;
- kein Browser-Alert;
- Dialog darf nicht durch Re-render sofort verschwinden.

---

# P1 – APP/SYSTEM MODULE TABLE BORDER NOCH FEHLERHAFT

Operator-PASS:

- separate Detailansicht funktioniert;
- Save-Popup funktioniert;
- nach OK Rückkehr zur Übersicht funktioniert.

Noch offen:

- Tabellen-Trennlinie zwischen `Registered`/`Active` bzw. im Actions-Bereich ist vertikal versetzt;
- unter Actions existiert offenbar eine zusätzliche Border/Trennlinie, wodurch Zeilen optisch nicht durchgängig sind;
- gleicher Fehler bei App Modules und System Modules.

Nach P0 mit **einer** gemeinsamen Tabellenstruktur/CSS-Regel korrigieren. Keine per-Zelle Sonderlinien.

---

# P1 – THEME SELECT BRAUCHT TEILWEISE ZWEITEN TAP

Sidebar Light/Dark Pulldown ist vorhanden, aber operator-live:

- Auswahl `Light`/`Dark` führt teilweise nicht sofort zur Änderung;
- erst erneutes Antippen/Öffnen des Select löst die sichtbare Theme-Änderung aus.

Prüfe echten `change`-Event-/State-/Renderpfad auf iPad/Chrome. Kein künstlicher OK-Button. Auswahl soll beim normalen Select-Change einmalig sofort angewandt und gespeichert werden.

Da gleichzeitig Module-Links doppelte Taps/Timeouts zeigen, zuerst prüfen, ob dieselbe Render-/Event-Blockade beteiligt ist.

---

# GPS – STANDORT / MODUL SETTINGS

Vorheriger Vertrag bleibt:

- GPS darf ohne Reverse-Geocoder ehrliche kompakte Koordinaten anzeigen.
- Karten-/Positionsblöcke mit normalem Abstand.
- OSM bleibt Default.
- generische moduleigene Admin-Settings sollen später Provider/Geocoding/API-Key ermöglichen, ohne Google hart in Core einzubauen.

Dieser Punkt ist nach P0 zu operator-retesten; keine neue externe API in diesem Batch erzwingen.

---

# PERFORMANCE / RENDERING IST JETZT TEIL DES BUGS, NICHT NUR POLISH

Die früher notierten 1–2 Sekunden GPS-Ladezeit sind nun zusammen mit 2–3s+, Doppelblinken, 10s Timeout und fehlenden Catalogs ein funktionaler Befund.

Messe/instrumentiere:

- Anzahl Module-Catalog-Requests pro Start/Login;
- Dauer serverseitig/clientseitig;
- unnötige serielle Requests;
- doppelte Discovery;
- unnötige Full-Renders;
- Cache hit/miss getrennt anonym/authenticated;
- AbortController/Timeouts;
- Service Worker stale-while-revalidate Verhalten, falls beteiligt.

Ziel ist nicht Mikrooptimierung, sondern deterministisches Laden ohne Reload und ohne sichtbare Doppelinitialisierung.

---

# VERHALTENSTESTS – DIE 550 ALTEN TESTS REICHEN NICHT

Ergänze Tests, die den beobachteten Ablauf reproduzieren:

1. Cold anonymous start → Catalog delayed → GPS erscheint automatisch ohne Reload.
2. Anonymous start → Login Ralf → authenticated catalog replaces anonymous catalog → GPS/Profile erscheinen ohne Reload.
3. Login Tester entsprechend.
4. Login Developer mit GPS effective permissions → GPS sichtbar ohne Reload.
5. Login Admin mit GPS effective permissions → GPS sichtbar ohne Reload.
6. Catalog request failure → klare Retry-UI; erfolgreicher Retry aktualisiert Navigation/Settings ohne Full Reload.
7. Catalog response > bisherigem problematischen Timing darf nicht durch Race/stale render verloren gehen; gleichzeitig Serverlaufzeit optimieren.
8. Kein doppeltes Startseiten-Flackern durch konkurrierende Renders.
9. Module Admin request bleibt deutlich unter Timeout unter normalen Testbedingungen; keine parallelen unnötigen Detailloads.
10. Profile active/permitted → tatsächlicher User DOM entry.
11. Module Details separate view + Save/Back bleibt PASS.
12. Theme Select `change` einmal → Theme sofort geändert.
13. Tabellen-Borders strukturell einheitlich.
14. Vollsuite, JS Syntax, PHP Lint, `git diff --check`, Production Package.

Nutze Fake-Timer/delayed promises/integration harnesses, um Race Conditions deterministisch zu reproduzieren. Nicht nur Source-Regex.

---

# DEPLOYMENT / LIVE-EVIDENCE

- Root Cause konkret dokumentieren, inklusive warum `ab3c488` die Production-Symptome nicht verhindert hat.
- kleine Commits.
- Push `main` nach Tests.
- CodeQL + FTPS terminal.
- Production Smoke erweitern, soweit ohne echte User-Secrets möglich, um Catalog-Endpunkte/Antwortzeiten/Scope wenigstens strukturell zu prüfen.
- Keine Secrets ausgeben.
- Kein Core Freeze.

# NÄCHSTER OPERATOR-RETEST – EXAKTE REIHENFOLGE

1. Inkognito/frischer Root-Aufruf: GPS erscheint selbständig, kein Reload, kein Doppelblinken.
2. Ralf Login: GPS sofort/automatisch; Settings Modules lädt; Profile sichtbar.
3. Tester entsprechend.
4. Developer Login: GPS sichtbar.
5. Admin/ElNino Login: GPS sichtbar.
6. Profile öffnen/speichern.
7. Settings Apps/Navigation Save-Popup.
8. Moderation als Ralf.
9. App/System Module Tabellenborder.
10. Theme Select einmalige Reaktion.
11. Danach restliche frühere Retests (Sessions, Appearance, Diagnostics, Dashboard, Deployment).
# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG – DEVICE RETEST FOLLOW-UP + USER-UI RESPONSIVE PASS  
**Datum:** 2026-09-09

# Aktueller Auftrag

## Verbleibende Livefehler aus iPad/Chrome beheben und User-UI/GPS responsiv finalisieren

Der vorige gebündelte Auftrag wurde deployed. Der reale Betreiber-Retest auf **demselben iPad mit Google Chrome** zeigt weiterhin konkrete Abweichungen. Diese Livebefunde sind verbindliche Wahrheit und haben Vorrang vor grünen Tests.

Arbeite autonom, systematisch und test-first bis zum vollständigen Abschluss dieses gesamten Auftrags oder bis ein Punkt nachweislich externen Betreiber-/Hostzugriff benötigt. Nicht nach einzelnen Teilpunkten stoppen oder Rückfragen stellen, wenn die Antwort aus Repository, Tests, Dokumentation oder sicherer Diagnose selbst ermittelbar ist.

P1/P4 dürfen nicht regressieren. Kein GPS Pro, keine CatchTrack-spezifische Logik, keine allgemeine i18n-Phase.

---

# 1. Pflicht-Preflight und Arbeitsweise

1. Vollständig mit `origin/main` synchronisieren.
2. Vollständig lesen: `CHATGPT.md`, `CODEX.md`, `CURRENT-TASK.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `WORKFLOW.md`, `CORE-1.0.md`, `Architecture.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md`, `CONNECTIONS.md`, `UI-UX.md`, `ModuleCreation.md`, `Modules.md`, relevante Install-/Deployment-/Backup-Dokumentation und alle betroffenen Implementierungs-/Testdateien.
3. Auftrag vollständig nach `CURRENT-TASK.md` übernehmen und vor Implementierung dokumentieren: `CODEX.md == CURRENT-TASK-Anforderungen`.
4. Für jeden Fehler zuerst reproduzierenden Test oder belastbare Root-Cause-Evidenz herstellen. Root Causes beheben, keine symptomatischen Schnellfixes.
5. Die aktuellen iPad/Chrome-Livebefunde sind die verbindliche Wahrheit und haben Vorrang vor früheren grünen Tests.
6. Echte Integration-/DOM-/Contract-Tests ergänzen. Reine Source-/Regex-Checks gelten nicht als ausreichende Abnahme.
7. Keine Secrets/sensitiven Produktionsdaten ausgeben. Kein Restore auf Produktion. Keine destruktiven Produktionsaktionen.
8. Keine echte zweite Installation pauschal löschen oder verbieten. Keine Hardwarefingerprints.
9. Core nur dort ändern, wo eine nachgewiesene generische Frameworklücke besteht; keine produktspezifische Logik in Core.
10. Alle zusammengehörigen Punkte dieses Auftrags bearbeiten und anschließend vollständige Regression, Packaging, Deployment und Übergabe durchführen.

---

# 2. Device Sessions – P0, weiterhin live falsch

Realer Retest auf **einem einzigen iPad/Chrome**:

- Dashboard zeigt `10 Active sessions`.
- Session Overview zeigt zahlreiche parallele `active`-Zeilen für denselben Developer auf demselben Gerät.
- Tester wurde auf demselben iPad/Chrome ebenfalls mehrfach/inkonsistent dargestellt.
- Plattform erscheint weiterhin als `macOS · Chrome`, obwohl es ein iPad ist.
- Device erscheint teils `Browser installation`, teils `MacIntel`, obwohl dasselbe physische Gerät/Browser verwendet wurde.
- `Current session` funktioniert.

Der vorige Fix, der nur gleiche `installation_id` ersetzt, reicht live offensichtlich nicht. Root Cause vollständig rückwärts verfolgen: Woher kommt/ändert/verliert sich die Installation-ID? Prüfe Admin-Loginseite, localStorage/Storage-Scope, Base Path, Origin, private/public Adminshell, Logout/Access-denied, Browserstorage und Bootstrap-/Legacy-Sessions. Nicht einfach alle Sessions eines Users pauschal auf eine reduzieren, denn mehrere echte Installationen müssen weiterhin möglich sein.

## Zielvertrag

- Eine Browser-/App-Installation erzeugt pro User genau eine aktive Device-Session.
- Wiederholte Logins derselben Installation rotieren/ersetzen diese Session zuverlässig.
- Unterschiedliche User auf derselben Installation dürfen jeweils genau eine eigene aktive Session besitzen.
- Zweite echte Installation/Device-ID erzeugt zweite Session.
- Dashboard und Session Overview zählen dieselbe autoritative aktive Menge.
- Historische/ersetzte/legacy Zeilen werden nicht als aktiv dargestellt.
- Bestehende Alt-/Bootstrap-Sessions aus früheren Builds sicher klassifizieren und, soweit vertraglich möglich, einmalig bereinigen/migrieren, ohne fremde echte Geräte willkürlich zu widerrufen.

## Plattformdarstellung

Die serverseitige UA-Heuristik ist live noch falsch. Prüfe den **realen Chrome-iPad-UA**, nicht nur synthetische Annahmen. iPadOS kann Desktop-UA (`Macintosh`) liefern. Nutze nur datensparsame, nicht sicherheitsrelevante Client-Hints/Browserdaten, die bereits legitim im Browser verfügbar sind. Keine Hardwarefingerprints.

- Wenn Chrome sicher erkennbar: `Chrome`.
- Wenn iPadOS sicher/belastbar erkennbar: `iPadOS`.
- Wenn OS wegen Desktop-UA nicht belastbar unterscheidbar ist: keine falsche Gewissheit; neutraler sinnvoller Fallback statt `macOS`, sofern Clientkontext ein Tablet belegt.
- `MacIntel` darf nicht als Gerätebezeichnung erscheinen, wenn es nur ein Navigator-Kompatibilitätswert ist.

Echte JS/PHP-Integrationstests für Storage-Persistenz über Login/Logout/403/Reload, gleiche Installation mit zwei Usern, mehrfachen Login und iPad-Chrome-Desktop-UA ergänzen.

---

# 3. Admin-Login – positiver Retest erhalten

Live bestätigt:

- `Access denied` zeigt jetzt `Back to admin login`.
- Link führt korrekt zum Adminlogin.
- Danach erfolgreicher Adminlogin möglich.
- User-App bleibt getrennt.

Diesen Fix regressionsfrei erhalten. Kein Link von User-App zum Adminbereich erforderlich; diese Bereiche sind bewusst getrennt.

---

# 4. Dashboard / Session Overview

Solange Sessiondaten falsch sind, ist auch das Dashboard falsch.

Nach Sessionfix:

- Active Sessions = exakt autoritative aktive Device-Sessions.
- kompakte Übersicht darf begrenzt sein, muss dann aber sichtbar als Vorschau gekennzeichnet sein (`showing X of Y`) oder Link zur vollständigen Session Overview bieten; kein scheinbarer Widerspruch zwischen Zahl und sichtbaren Zeilen.
- gleiche Installation nicht redundant mehrfach darstellen.
- Gerät/Plattform verständlich statt generischer/inkonsistenter Werte.

Bestehende positive Fixes (`Database ok`, lokale Zeit, Backup-Warnung) erhalten.

---

# 5. Permission Catalog – Semantik finalisieren

Live:

- Registry, Area und Source funktionieren grundsätzlich.
- GPS zeigt deklarativ `User-App / Module: GPS` für `gps.view/use/manage/admin`.
- Corekeys wie `user.read` liegen unter Area `Admin`; das ist fachlich korrekt, **wenn** der Key bedeutet „Benutzerverwaltung lesen“ und nicht „User darf lesen“.
- Problem: Corebeschreibungen sind weiterhin teilweise nicht sprechend genug bzw. wirken wie technische Platzhalter.

## Auftrag

- Für **jeden** Corepermission-Key eine konkrete verständliche Beschreibung liefern, z. B. `user.read = View users in administration`, `user.write = Create or update users` entsprechend dem realen Vertrag.
- Area bezeichnet die Sicherheits-/Produktebene (`Admin`, `User-App`, `System`), nicht das Substantiv im Key; dokumentiere das klar in `Security.md`/`ModuleCreation.md`/UI-Hilfe soweit passend.
- GPS `gps.admin` darf als User-App-Permission existieren, wenn es modulinterne administrative/lifecycle Aktionen beschreibt; prüfe aber serverseitig, dass echte **Core-Adminverwaltung/Rollenzuweisung** nicht versehentlich über eine User-App-Permission freigegeben wird. Beschreibung ggf. präzisieren.
- Registry bleibt read-only; keine manuelle Permission-Erstellung.

---

# 6. Backup – fehlender Key, UI handlungsfähig

Live erneut bestätigt:

- Crypto ready.
- Database/schema ready.
- Protected storage ready.
- Encryption key: `Host configuration required`.
- `Create backup` endet erwartbar mit `runtime prerequisite is unavailable`.

## Auftrag

- Solange Readiness `encryptionKey=false`, `Create backup` deaktivieren oder unmittelbar als nicht ausführbar kennzeichnen; kein sinnloser POST, dessen Ergebnis bereits feststeht.
- Direkt bei Button/Readiness verständlich erklären: Host encryption key must be configured before manual or automatic encrypted backups can run.
- Nach Konfiguration muss Button automatisch nutzbar werden.
- Dokumentierte sichere Host-Schritte erhalten/prüfen.
- Kein Key in UI, Git, Logs oder Kommandozeile.
- Hostaktion bleibt `HOST ACTION REQUIRED`.

---

# 7. Audit Log – Clear-all für Setup/Development + präzisere Ergebnisse

Live positiv:

- Filter und Retention sind jetzt klar getrennt.
- `Delete entries older than 30 days` funktioniert; bei keinen passenden Einträgen wird nichts gelöscht.
- Actor zeigt Handle + ID.

## Verbesserungen

### Purge-Ergebnis

Statt generischem Erfolg soll die Rückmeldung die reale Anzahl nennen, z. B. `0 audit entries deleted` oder `12 audit entries deleted`.

### Clear all

Der Betreiber benötigt für neues Setup/Development die Möglichkeit, den Auditbestand vollständig zu leeren.

Implementiere kontrolliert:

- nur höchste autorisierte Adminrolle/Permission;
- deutliche separate destruktive Aktion, nicht mit Retention verwechseln;
- explizite Bestätigung mit klarer Aussage `Delete all audit entries`;
- Produktionssicherheit prüfen. Wenn vollständiges Clear im Production-Vertrag sicherheitspolitisch nicht vertretbar ist, dann nur explizit im Development/Test-Kontext erlauben und im Production-UI nicht anbieten. Diese Entscheidung technisch und in `Security.md` begründen; nicht einfach ungeprüft freischalten.
- Die Clear-Aktion selbst muss, soweit logisch möglich, vor Löschung auditierbar/anderweitig nachvollziehbar sein; wenn vollständiges Clear auch diesen Eintrag entfernt, dokumentiere die Grenze ehrlich.

No-op Settings-Audit und changedFields aus vorigem Fix regressionsfrei testen.

---

# 8. GPS – Bediensemantik korrigieren

Live-GPS funktioniert grundsätzlich: Koordinaten, Accuracy, Timestamp, OSM-Karte und Marker werden angezeigt.

Die Buttonsemantik ist aber falsch.

## Ziel-Buttons

Klar trennen:

1. `Update position`
2. `Open in Google Maps`
3. `Open in OpenStreetMap`
4. `Share position`

`Other apps` entfällt. **Share position** öffnet den nativen System-Share-Dialog und ermöglicht WhatsApp, Facebook, Messenger, Mail usw. entsprechend den auf dem Gerät verfügbaren Share Targets.

Google Maps und OpenStreetMap sind reine **Öffnen/Anzeigen**-Aktionen, keine Share-Aktionen.

## Google Maps – about:blank Bug

Live auf iPad/Chrome mit installierter Google-Maps-App:

- Klick öffnet Google Maps, hinterlässt aber zusätzlich einen leeren `about:blank`-Tab im Browser.

Root Cause ermitteln und beseitigen. Kein vorab geöffnetes leeres Fenster/Tab. Verwende einen geeigneten mobilen/deep/universal Link-Vertrag mit sauberem Webfallback, soweit browser-/plattformübergreifend möglich. Keine Google-Core-Abhängigkeit.

OpenStreetMap-Weböffnung funktioniert bereits; erhalten.

---

# 9. Eingebettete OSM-Karte – interaktiv, nicht selbst verlinkt

Live:

- Karte zeigt Marker korrekt.
- Zoom `+/-` ist sichtbar, aber Klick/Tap auf Karte/Controls öffnet stattdessen OpenStreetMap extern; dadurch kann innerhalb der eingebetteten Karte nicht sinnvoll gezoomt werden.

## Ziel

- Die eingebettete Karte ist **kein externer Link**.
- `+/-` zoomt ausschließlich die eingebettete Karte.
- Touch pinch/drag/pan, soweit die verwendete Kartenbibliothek dies unterstützt, funktioniert innerhalb der Karte.
- Externe OSM-Öffnung ausschließlich über `Open in OpenStreetMap`.
- Attribution bleibt korrekt und klickbar, soweit Lizenz/Library dies verlangt.
- Marker bleibt auf aktueller Position.
- Keine Trackingfunktion hinzufügen.

---

# 10. Responsives User-UI / Content-Card-System

Realer iPad-Befund:

- Hauptseite nutzt die Bildschirmbreite grundsätzlich gut.
- GPS-Contentkarten und OSM-Karte kleben jedoch schmal links; rechts bleibt viel ungenutzter Raum.
- Settings zeigt dasselbe Muster: schmale Karten links, große leere Fläche rechts.

Das ist kein GPS-Sonderproblem, sondern ein **generischer User-UI-Layoutvertrag**.

## Ziel

Definiere/verwende ein zentrales responsives Content-Card/Grid-System für User-App-Views und Module:

- Mobile/schmale Viewports: eine Spalte, Karten nahezu volle verfügbare Contentbreite.
- Tablet/iPad: verfügbare Breite sinnvoll nutzen; Karten können je nach Inhalt nebeneinander oder breiter angeordnet werden.
- Desktop: kontrollierte Maximalbreite/mehrspaltige Anordnung, keine extrem langen Textzeilen und keine riesigen sinnlosen Leerflächen.
- Keine festen gerätespezifischen Pixelhacks; CSS Grid/Flex + `minmax`, `auto-fit/auto-fill`, sinnvolle `max-width`/container queries/media queries gemäß bestehender Architektur.
- Karten eines Views bündig, konsistente Abstände und Höhen soweit sinnvoll.
- GPS: Koordinaten/Status und Karte auf Tablet sinnvoll ausbalancieren; Karte deutlich größer als aktuell. Auf schmalem Screen sauber untereinander.
- Settings: General/Privacy/Appearance bzw. vorhandene Karten nutzen denselben generischen Vertrag und verteilen sich auf Tablet sinnvoll statt links zu kleben.
- Andere vorhandene User-Views gegen Regression prüfen.

Wichtig: Dies ist eine **generische Framework-UI-Fähigkeit**, die vor Core-Freeze legitim ist. Module sollen künftig den zentralen Layoutvertrag verwenden können, statt eigene gerätespezifische Layoutlogik zu bauen. `UI-UX.md` und `ModuleCreation.md` entsprechend dokumentieren.

---

# 11. Core-Freeze-Vertrag erhalten

Der vorige Audit fand keine sonstige generische Modul-Lücke. Der neue responsive Content-Card-Vertrag darf als nachgewiesene generische UI-Lücke vor Freeze ergänzt werden.

Danach gilt weiterhin:

> Neue fachliche Module müssen ohne produktspezifische Coreänderungen implementierbar sein.

Keine spekulativen Hooks. Kein GPS Pro. Kein CatchTrack-Code.

---

# 12. Test-/Abnahmevertrag

Echte Integration-/DOM-/Contract-Tests ergänzen, nicht nur Source-RegEx.

Mindestens:

- Installation-ID bleibt über Adminlogin, Logout, 403, Reload und erneuten Login stabil, soweit Browserstorage nicht bewusst gelöscht wird.
- gleiche Installation + gleicher User mehrfach → genau eine aktive Session.
- gleiche Installation + Developer und Tester → je User genau eine aktive Session.
- zweite Installation-ID → zweite aktive Session.
- Legacy/ersetzte Sessions zählen nicht aktiv.
- Dashboardcount == Sessionregistry.
- iPad/Chrome-Darstellung verwendet reale Clientdaten ehrlich; kein `MacIntel` als Device-Name.
- Permissionbeschreibungen und Area-Vertrag.
- Backupbutton disabled/actionable entsprechend Readiness.
- Audit purge meldet Count; Clear-all-Sicherheitsvertrag.
- GPS Buttons exakt nach Öffnen-vs-Teilen-Vertrag.
- Google Maps erzeugt keinen absichtlich geöffneten Blank-Tab im implementierten Pfad.
- OSM-Karte ist kein Wrapper-Link; Zoom-/Mapcontrols erhalten Events.
- Responsive User-Grid bei Mobile/Tablet/Desktop; GPS und Settings nutzen zentrale Klasse/Komponente.
- Light/Dark, Touchziele, P1/P4, Homepage-Warmstart, Navigation und Appearance regressionsfrei.

Danach vollständige Suite, PHP-Lint, JS-Syntax, `git diff --check`, Produktionspaket, Secret-/Artefaktprüfung.

---

# 13. Deploy, CI, Produktionsprüfung und Übergabe – verbindlich

Nach Implementierung den Auftrag **nicht** nach lokalen grünen Tests beenden.

1. Vollständige Regression und Produktionspaket ausführen.
2. Gemäß `WORKFLOW.md` committen und nach `main` pushen.
3. Alle erforderlichen CI-, CodeQL- und FTPS-Läufe **terminal abwarten**; nicht nur starten.
4. `HEAD == origin/main` und sauberen Working Tree verifizieren.
5. Deploymentrevision und read-only Produktionssmoke verifizieren.
6. Sichere Produktionschecks durchführen, soweit ohne Betreiberinteraktion und ohne Secrets/destruktive Aktionen möglich.
7. `STATUS.md`, `TODO.md`, `ToDoNow.md`, `CHANGELOG.md` und relevante Verträge wahrheitsgemäß aktualisieren.
8. Nicht selbst prüfbare Punkte ausdrücklich als `DEVICE RETEST REQUIRED` bzw. `HOST ACTION REQUIRED` kennzeichnen.
9. Nichts als `LIVE BESTANDEN` melden, was nicht real durch den Betreiber bestätigt
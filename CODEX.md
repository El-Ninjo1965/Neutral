# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG – LIVE RETEST FOLLOW-UP + CORE-FREEZE + GPS BASIS  
**Datum:** 2026-09-09

# Aktueller Auftrag

## Admin-Livebefunde final bereinigen, Core 1.0 einfrierbar machen und GPS-Basismodul abrunden

Der Phase-2-Deploy ist erfolgt. Der anschließende reale iPad/Chrome-Betreibercheck hat mehrere verbleibende Fehler und UX-Lücken gezeigt. Diese Befunde sind verbindliche Live-Wahrheit und haben Vorrang vor zuvor grünen Tests.

Dieser Auftrag bündelt bewusst zusammengehörige Restarbeiten. Arbeite autonom und test-first. Keine GPS-Pro-Entwicklung und keine allgemeine i18n-Erweiterung.

P1/P4 dürfen nicht regressieren.

---

# 1. Pflicht-Preflight

1. Vollständig mit `origin/main` synchronisieren.
2. Vollständig lesen: `CHATGPT.md`, `CODEX.md`, `CURRENT-TASK.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `WORKFLOW.md`, `CORE-1.0.md`, `Architecture.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md`, `CONNECTIONS.md`, `UI-UX.md`, `ModuleCreation.md`, `Modules.md`, relevante Install-/Deployment-/Backup-Dokumentation sowie alle betroffenen Implementierungs-/Testdateien.
3. Auftrag vollständig nach `CURRENT-TASK.md` übernehmen und vor Implementierung dokumentieren: `CODEX.md == CURRENT-TASK-Anforderungen`.
4. Für jeden Livefehler zuerst reproduzierenden Test bzw. belastbare Root-Cause-Evidenz herstellen; keine symptomatischen Schnellfixes.
5. Keine Secrets oder sensitiven Produktionsdaten ausgeben. Keine destruktiven Restore-Tests auf Produktion.

---

# 2. Verbindliche Admin-Grundregel

Adminseiten und Felder existieren nur, wenn sie einen realen administrativen Nutzen besitzen.

- Keine dekorativen `{}`, `[object Object]`, `—`, `unknown`, `Not found` oder dauerhaft nutzlosen `Unavailable`-Felder.
- Wenn eine Information sicher und autoritativ ermittelbar ist: korrekt und menschenlesbar anzeigen.
- Wenn sie nicht sinnvoll ermittelbar ist und keinen Handlungswert besitzt: Feld/Panel entfernen.
- Wenn ein echter administrativ relevanter Fehler vorliegt: verständlich und handlungsfähig anzeigen.
- Keine Fake-/Placeholderdaten.

Diese Regel gilt insbesondere für Dashboard, Connections, Server, Database und Diagnostics.

---

# 3. Device Sessions – verbleibender P0-Livefehler

Realer iPad/Chrome-Befund:

- Ein einziger physischer iPad/Chrome-Betrieb erzeugt mehrere gleichzeitig `active` dargestellte Bootstrap-Administrator-Sessions.
- Dashboard meldet 8 aktive Sessions, Session Overview zeigt mehrfach denselben Developer und nur einen Teil der Gesamtzahl.
- Plattform wird fälschlich als `macOS · Safari` dargestellt, obwohl Betreiber ein iPad mit Google Chrome verwendet.
- Device-Bezeichnung ist teils generisch `Browser installation`, teils `MacIntel`.
- `Current session` funktioniert grundsätzlich.

## Zielvertrag

Eine Geräte-Session entspricht einer Browser-/App-Installation, nicht einem Loginversuch.

- Wiederholter Login derselben Installation darf nicht immer neue parallele aktive Device-Sessions erzeugen.
- Bestehende aktive Installation wiederverwenden/rotieren/ersetzen gemäß sicherem Authvertrag.
- Logout/Widerruf bleiben autoritativ.
- Mehrere echte Geräte/Installationen bleiben erlaubt bis zum zentralen Device-Limit.
- Dashboard und Session Overview müssen dieselbe autoritative aktive Anzahl verwenden.
- Historische/ersetzte Sessions dürfen nicht als aktiv zählen.
- Session Overview soll Geräte/Installationen sinnvoll unterscheiden.

## Browser-/Plattformerkennung

Safari auf iOS/iPadOS maskiert Browserengines; Chrome auf iOS/iPadOS nutzt ebenfalls WebKit. Trotzdem soll die UI aus dem verfügbaren User-Agent/Client-Kontext bestmöglich und ehrlich `iPadOS/iOS` sowie `Chrome` erkennen, wenn Chrome-identifizierende Tokens vorhanden sind. Keine Hardwarefingerprints. Wenn eine genaue Unterscheidung technisch nicht belastbar möglich ist, lieber `iPadOS · Browser` als nachweislich falsches `macOS · Safari`.

Tests für gleiche Installation/re-login, zweites echtes Installations-ID-Szenario, Current, Revoke, Logout, aktive Zählung und iPad Chrome UA ergänzen.

---

# 4. Admin-Login-Sackgasse – P0

Reproduzierter Livebefund:

- Nicht-administrativer Tester versucht Adminzugang.
- Korrekt erscheint `Access denied – Administrative access requires an authorized role.`
- Es existiert nur `Return to platform`.
- Dieser Link führt zur User-App statt zum Admin-Login.
- Reload lässt den Betreiber in der Access-denied-Sackgasse; er kann sich nicht unmittelbar wieder als Admin anmelden.
- User-App-Login/Logout ist korrekt getrennt und behebt den Adminzustand nicht.

## Zielvertrag

- Admin-Domäne bleibt von der User-App getrennt.
- Nach falschem Passwort, falschem Benutzer oder nicht autorisierter Rolle muss immer ein klarer Weg zurück zur **Admin-Anmeldung** bestehen.
- Kein verpflichtender Redirect zur User-App.
- Access-denied-Seite bietet `Back to admin login` / sinngemäß und löscht/invalidiert nur den ungeeigneten Admin-Authzustand soweit erforderlich.
- Ein nicht autorisierter User darf dadurch selbstverständlich keine Adminrechte erhalten.
- Refresh/Back/erneuter Adminlogin müssen deterministisch funktionieren.

Echte Integrationstests für falsches Passwort, gültiger User ohne Adminrolle, danach erfolgreicher Adminlogin sowie P1-Sessiontrennung ergänzen.

---

# 5. Admin-Navigation / Hänger

Betreiber beobachtet sporadisch: Wechsel über linke Adminnavigation reagiert sehr lange oder erst nach vollständigem Browserreload.

Root Cause systematisch untersuchen: Routerzustand, laufende Fetches, Fehlerpromises, View-Cleanup, Overlay/disabled state, Sessionrefresh und Eventhandler. Nicht durch pauschale Timeouts kaschieren.

Abnahme: wiederholtes schnelles Wechseln zwischen Dashboard, Sessions, Server, Database, Diagnostics, Audit und Settings bleibt responsiv; Fehler eines Views blockiert Navigation zu anderem View nicht.

---

# 6. Dashboard korrigieren

Realer Befund:

- `Database [object Object]` ist klarer Renderingfehler.
- `Active sessions 8` übernimmt den fehlerhaften Sessionzustand.
- Session Overview zeigt nur fünf Zeilen und mehrfach `Developer active`, ohne Gerätewert.
- `Last check` ist roher ISO-Zeitstempel.
- Dashboard verschweigt den administrativ wichtigen Zustand `Backup encryption key / host configuration required`.

## Ziel

- DB-Zustand menschenlesbar, keine Objektstringifizierung.
- Aktive Sessions aus derselben autoritativen Device-Sessionprojektion; kompakte sinnvolle Übersicht statt redundanter identischer Userzeilen.
- Zeit lokal/menschenlesbar darstellen, technischer ISO-Wert höchstens ergänzend.
- Relevante Warnungen/Action-needed-Zustände wie nicht betriebsbereites Backup sichtbar machen, ohne Dashboard zu überladen.
- Module 1/2 und Status nur aus realen Daten.

---

# 7. Server / Database / Diagnostics / Connections bereinigen

Livebefunde nach Phase 2:

### Server
- Status `healthy`, Target und API Base vorhanden.
- `Reachable` nur `—`.
- `Framework metadata` zeigt `{}`.

### Database
- Status ready, MySQL, localhost und DB-Name vorhanden.
- Username `—` kann aus Securitygründen legitim sein, soll dann aber nicht als leeres Informationsfeld wirken.
- `Setup state` zeigt `{}`.

### Diagnostics
- System check liefert reale Werte: status, PHP 8.5.9/litespeed, production, memory, disk, modules 2, apps 1.
- Direkt unter Überschrift steht fehlerhaft `Not found`.
- `Framework summary` zeigt `{}`.

### Connections
- Primary database und status ready sichtbar.
- `Type` ist `—`.
- `Default` ist `no`, obwohl die Verbindung `Primary database` heißt; Semantik prüfen.
- Optional providers not configured ist akzeptabel und ehrlich.
- `Save connection` ist fragwürdig, wenn die Seite laut eigener Beschreibung read-only aus autoritativer Host/runtime configuration kommt. Entweder reale sichere Funktion belegen oder entfernen.

## Auftrag

Gemäß Admin-Grundregel jedes Feld prüfen. Reale Informationen liefern oder nutzlose Felder/Buttons entfernen. Keine leeren JSON-Panels. `Not found` beseitigen. Widerspruch Primary/Default klären. Keine Secrets anzeigen.

---

# 8. Backup Host-Prerequisite und Betreiberführung

Live:

- Crypto Ready
- Database/schema Ready
- Protected storage Ready
- Encryption key: `Host configuration required`
- Create backup scheitert korrekt mit sicherer Meldung `runtime prerequisite is unavailable`.

Damit ist der Codepfad handlungsfähiger, aber Backup bleibt real nicht nutzbar.

## Auftrag

- Bestehende sichere Readiness beibehalten.
- Dokumentation/Betreiberführung so konkret machen, dass der Hostbetreiber den Encryption-Key sicher konfigurieren kann, ohne Schlüsselwert in UI/Logs/Git zu schreiben.
- Prüfen, ob vorhandene cPanel-/Installationsdokumentation den exakten sicheren Konfigurationsweg enthält; falls nicht ergänzen.
- Cron erst als betriebsbereit bezeichnen, wenn der reale deployte Runner und Hostkonfiguration zusammenpassen.
- Keine automatische Secretgenerierung in eine öffentlich/versionskontrollierte Datei.
- Kein Restore auf Produktion.

Falls Hostzugriff weiterhin nötig ist: `HOST ACTION REQUIRED` mit exakten sicheren Schritten dokumentieren.

---

# 9. Audit Log – Semantik und UX

Live positiv: Filterlabels und View Details funktionieren.

Verbleibende Probleme:

1. Filter-/Action-Layout überlappt auf iPad: `Apply` ragt in/über das `To date`-Eingabefeld. Das ist ein echter Layoutbug.
2. Dark Mode: Input-Borders sind zu schwach; Eingabefelder müssen klar erkennbar sein.
3. Light Mode: Apply/Reset/Purge Größen und Grid wirken uneinheitlich; keine Überlagerung, konsistente Höhen und sinnvolle inhalts-/gridgerechte Breiten.
4. `View details` JSON-Box soll Theme-Tokens folgen; Light darf hell und Dark dunkel sein, sofern Lesbarkeit/Codecharakter erhalten bleiben.
5. Mehrere Details dürfen geöffnet sein, aber Layout darf dadurch nicht brechen. Optional Accordion nur wenn UX klar besser, nicht zwingend.
6. Actor zeigt nur numerische ID. Ergänze einen verständlichen Benutzernamen/Handle soweit ohne PII-Leak und mit stabiler ID ergänzend.
7. Purge-UX ist unklar: From/To-Filter, `Apply`, Retention-Auswahl und `Purge older entries` wirken wie ein gemeinsamer Vorgang. Trenne Filterung klar von destruktiver Retention-Aktion. Vor Purge deutlich anzeigen: `Delete audit entries older than X days`; Bestätigung erforderlich. Kein `All`-Purge in Produktion.
8. Audit erzeugt offenbar mehrfach identische `settings.update`-Einträge mit Details, die nur denselben `appId/appName`-Zustand zeigen. Prüfe Root Cause. Kein Audit-/Write-Ereignis für echte No-op-Saves, sofern nichts geändert wurde. Bei Änderungen Details möglichst als `before`/`after` oder `changedFields` darstellen, ohne Secrets. Audit bleibt append-only außer kontrollierter Retention.

Tests für iPad-Breakpoint, Theme, Purge-Semantik, no-op update und echte Change-Details.

---

# 10. Permission Catalog – Registry bleibt read-only

Keine manuelle Permission-Erstellung einführen. Core und installierte Module liefern ihre Permission-Keys deklarativ über Registry/Manifest; Admin weist sie Rollen zu.

Verbesserungen:

- Platzhalterartige Beschreibungen wie `Permission admin.read` durch verständliche, konkrete Beschreibungen ersetzen.
- Core- und Modulpermissions gleicher Qualitätsstandard.
- Suche/Area/Source erhalten.
- Optional sortierbare Spalten und sticky table header, wenn tablet-/mobile-sicher und ohne unnötige Komplexität.
- Keine Delete/Edit-Funktion für Keys.

`ModuleCreation.md` muss klar dokumentieren, wie ein Modul eigene Permissions deklarativ registriert.

---

# 11. Core 1.0 – fachlicher Freeze-Vertrag

Ziel des Projekts: Nach Fertigstellung des Neutral Core sollen normale neue Produktfunktionen ausschließlich über Module entstehen.

Verbindliches Abnahmekriterium:

> Ein neues fachliches Modul muss vollständig implementierbar, registrierbar, installierbar, migrierbar, berechtigbar, aktivierbar/deaktivierbar und in die vorgesehenen UI-/API-Flächen integrierbar sein, ohne bestehende Core-Dateien für das konkrete Produktfeature ändern zu müssen.

## Auftrag

- `CORE-1.0.md`, `Architecture.md`, `ModuleCreation.md`, `Functions.md`, `API.md`, `Database.md`, Modulregistry, Hooks/Extension Points und vorhandene GPS-/Reference-Module gegen dieses Kriterium auditieren.
- Jetzt vor dem Freeze fehlende **generische** Extension Points identifizieren und nur wenn wirklich erforderlich ergänzen.
- Keine CatchTrack-spezifische oder zukünftige GPS-Pro-Logik in Core einbauen.
- Core darf später weiterhin aus echter technischer Notwendigkeit geändert werden (Security, Runtime-/Browser-/DB-Kompatibilität, Framework-Bug); nicht für normale Produktfeatures.
- Dokumentiere einen klaren `Core Freeze`-Vertrag und eine Entscheidungsregel: Core-Änderungswunsch zuerst darauf prüfen, ob generische Frameworkfähigkeit fehlt oder Modulvertrag verletzt wird.
- Ergänze einen automatisierten Referenz-/Contract-Test, der beweist, dass ein neues Beispielmodul über deklarative Verträge eingebunden werden kann, ohne Core-Featurecode zu patchen.

Nicht vorsorglich Dutzende unbenutzte Hooks hinzufügen. YAGNI: nur generische Lücken, die aus aktuellem Modulvertrag oder Referenztest nachweisbar sind.

---

# 12. GPS-Basismodul abrunden – kein GPS Pro

GPS ist das neutrale Basismodul/Referenzmodul und soll standardmäßig im Paket bleiben, aber über Admin → Apps & Modules aktivier-/deaktivierbar sein. Deaktivieren bedeutet nicht deinstallieren.

## Basisumfang

- aktuelle Position
- Genauigkeit soweit verfügbar
- `Position aktualisieren`
- `Position teilen`
- **kein Tracking hinzufügen**
- darunter einfache OpenStreetMap-Kartenanzeige mit Marker der aktuellen Position
- Klick/Tap auf Karte öffnet dieselbe Position in OpenStreetMap

## Teilen / Navigation

- Google Maps als **Default/erste Option**, nicht erzwungen.
- Weitere Optionen: OpenStreetMap und System-Share/andere Apps.
- Neutral übergibt nur die vom Nutzer bewusst gewählten Koordinaten/Location-Link; keine automatische Hintergrundweitergabe.
- `Allow Location Context Sharing` betrifft automatische/modulübergreifende Kontextweitergabe, nicht die bewusste manuelle Aktion `Position teilen`. UI-Hilfetext muss diese Trennung eindeutig erklären.
- Interne Karte bleibt providerneutral/OpenStreetMap; Google Maps wird nicht zur Core-Abhängigkeit.

## Wiederverwendung

Karten-/Location-Vertrag so gestalten, dass spätere Apps/Module ihn wiederverwenden können, ohne CatchTrack-Logik einzubauen.

`GPS Pro` ist ausschließlich Zukunftsplanung: separates erweitertes Modul, das später je App zusätzliche Funktionen haben kann. Nicht implementieren, nicht detailliert spezifizieren. Wenn GPS Pro später verwendet wird, können GPS und GPS Pro parallel installiert sein; Admin kann GPS deaktivieren und GPS Pro aktivieren.

---

# 13. Appearance / UI-Grundqualität

Keine große neue Appearance-Phase starten. Die in diesem Auftrag berührten Adminviews müssen aber in Light/Dark und iPad-Breakpoints konsistent sein:

- Inputs klar erkennbare Borders/Focusstates;
- keine Überlagerungen;
- Buttons konsistente Höhe und sinnvolle Breite;
- Theme-Tokens statt hartkodierter fremder Flächen;
- Touchziele ausreichend groß;
- keine Layoutregression in User-App/P4.

---

# 14. Test- und Abnahmevertrag

Verbindlich echte Integration/DOM/Contract-Tests ergänzen, nicht nur Regex-Sourcechecks.

Mindestens:

- gleiche Device-ID + mehrfacher Login → eine aktive Installation;
- zweite Device-ID → zweite aktive Installation;
- iPad Chrome wird nicht fälschlich als macOS Safari ausgegeben, sofern UA unterscheidbar;
- Dashboard-Sessioncount entspricht Sessionregistry;
- Admin access denied → zurück zum Adminlogin → erfolgreicher Adminlogin;
- Adminnavigation bleibt nach View-/Fetchfehler bedienbar;
- keine `[object Object]`, `{}`-Leerpanels
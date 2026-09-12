# NEUTRAL – LOCAL AGENT HANDOFF

**Richtung:** ChatGPT/Lea → lokaler Codespace-Agent  
**Branch:** `lea/module-runtime-repair`  
**Datum:** 2026-09-12  
**Priorität:** P0  
**Deployment:** VERBOTEN  
**Merge nach `main`:** VERBOTEN

## Ziel

Repariere den realen Web-App-Modulpfad testgetrieben. GPS ist ein öffentliches Offline-First-Basismodul und muss nach administrativer Installation/Aktivierung beim ersten stabilen Render sofort vorhanden bleiben. Profile muss nach Login bei Active + effektiven `profile.view`/`profile.update` zuverlässig in User Settings erscheinen. Keine weiteren symptomatischen Race-Patches.

## Zuerst vollständig lesen

- `VISION.md`
- `Architecture.md`
- `CORE-1.0.md`
- `CODEX.md`
- `docs/superpowers/specs/2026-09-12-offline-first-module-start-design.md`
- relevante aktuelle Tests

Danach den tatsächlichen Code lesen, insbesondere:

- `Web-App/public/index.html`
- `Web-App/public/user-app.js`
- `Web-App/public/public-module-state.js`
- `Web-App/public/user-module-access.js`
- `Web-App/public/service-worker.js`
- `Web-App/core/core-loader.js`
- `Web-App/core/module-interface.js`
- `Web-App/core/module-registry.js`
- `Web-App/core/module-manager.js`
- `Web-App/core/core-startup.js`
- `Web-App/app/modules/gps/*`
- `Web-App/app/modules/profile/*`
- serverseitige Module-Catalog-Projektion, soweit für die Root Cause erforderlich.

## Aktuelle Operator-Evidence – Production FAIL

Nach dem zuletzt als erfolgreich deployed gemeldeten Batch:

1. Frischer anonymer Aufruf: GPS ist kurz sichtbar.
2. `Welcome to Neutral`/Homepage rendert sichtbar mehrfach (etwa zweimaliges Blinken).
3. Danach verschwindet GPS wieder.
4. Settings zeigt anschließend `No active modules are available yet.`
5. Bei Reload ist GPS teilweise kurz sichtbar und verschwindet erneut.
6. Standalone-GPS funktioniert separat.
7. Profile bleibt nach Login nicht zuverlässig verfügbar.

Automatisierte grüne Tests sind daher kein Abnahmekriterium, solange sie dieses reale Verhalten nicht korrekt modellieren.

## Bereits durch Code-Review identifizierte Root-Cause-Kandidaten

Diese Punkte sind **zu beweisen oder zu widerlegen**, nicht blind vorauszusetzen.

### A. PublicOffline GPS wird bei Discovery wieder unregistert

`ModuleManager.discoverModules()` reconciliiert die Registry gegen `discoveredIds` und entfernt vorhandene Module, die im aktuellen Discovery-Ergebnis fehlen. Ein lokal vor dem First Render hydriertes GPS kann dadurch nach einem späteren leeren/ungeeigneten Server-Catalog wieder gelöscht werden.

Besonders kritisch: Der aktuelle Test `tests/offline-first-public-modules.test.js` erwartet nach lokalem GPS + anschließendem `discover([])` derzeit ausdrücklich eine leere Registry. Das widerspricht dem bestätigten Offline-First-Vertrag.

### B. `publicOffline` kann in Normalisierung/Registry-Projektion verloren gehen

Prüfe `ModuleInterface.validateManifest()`, `ModuleRegistry.discover()` und alle dazwischenliegenden Objektprojektionen. `publicOffline: true` muss durch den gesamten Modulpfad erhalten bleiben. Dasselbe gilt für die notwendigen Lifecycle-/Presentation-Felder.

### C. GPS enthält weiterhin User-RBAC-Gating

Das Basis-GPS enthält weiterhin `gps.view`, `gps.use`, `gps.manage`, `gps.admin`, Access-Definitionen und `canUseModule()`/`INSUFFICIENT_PERMISSIONS`-Prüfungen.

Verbindlicher Vertrag für das **GPS-Basismodul**:

- User-Sichtbarkeit und lokale Basisnutzung benötigen keine User-Rolle und keine User-Permission.
- Anonymous/User/Tester/Developer/Admin unterscheiden sich dafür nicht.
- Admin-Lifecycle Install/Activate/Deactivate und Admin-Konfiguration bleiben bestehen.
- Browser-/OS-Geolocation-Berechtigung bleibt selbstverständlich erforderlich.
- Serverseitig geschützte Aktionen bleiben serverseitig geschützt.

Entferne keine generischen Core-Security-Mechanismen; entferne nur die nicht mehr gewünschte User-RBAC-Abhängigkeit des GPS-Basismoduls.

### D. Mehrfache Full-Renders erklären Welcome-Flackern

Prüfe insbesondere `loadHomepageConfig()`, Maintenance/Appearance/Session-Startup, `startBackgroundInitialization()`, Startup-Events und `renderApp()`.

Der sichtbare Homepage-/Welcome-Inhalt darf nach dem ersten stabilen Render nicht wegen Catalog-/Session-/Appearance-Hintergrundarbeit komplett neu aufgebaut werden. Gezielte Navigation-/Settings-Aktualisierung ist erlaubt.

### E. Profile hängt am realen Registry-/Discovery-Zustand

`Profile` ist manifestseitig `entitlementRequired:false` und permission-sensitive. User Settings zeigt Profile nur, wenn das Modul real active in der Registry vorhanden ist und der User die effektiven Profile-Rechte besitzt.

Beweise den kompletten Pfad:

`server authenticated catalog -> manifest normalization -> registry -> active state -> effective permissions -> Settings Profile entry -> open -> save`

Keine weitere reine Manifest-/String-Prüfung als Beweis akzeptieren.

## Verbindliche Architektur

### GPS Public/Offline

Wenn administrativ installiert + aktiviert:

- beim ersten stabilen Render sofort sichtbar;
- kein Serverroundtrip als Voraussetzung;
- kein User-RBAC/Permission/Entitlement als Voraussetzung;
- späterer fehlgeschlagener, leerer oder scope-fremder Catalog darf den gültigen lokalen PublicOffline-Zustand nicht zerstören;
- eine **autoritative administrative Deaktivierung** muss den lokalen Zustand dagegen invalidieren/aktualisieren, sodass GPS bei zukünftigen Starts nicht erscheint.

Wichtig: Nicht einfach `GPS immer behalten`. Ownership der Entfernung sauber modellieren: nur eine autoritative Lifecycle-/PublicOffline-Synchronisierung darf den lokalen PublicOffline-Aktivierungszustand entfernen.

### Authentifizierte Module

Profile/Moderation bleiben permission-sensitive. Authentifizierte Kataloge dürfen den permission-sensitiven Bereich reconciliieren, aber nicht den unabhängigen PublicOffline-Bereich versehentlich zerstören.

### Rendering

Ein stabiler First Render. Background-Aktualisierungen dürfen Navigation/Settings gezielt aktualisieren. Kein sichtbares mehrfaches Neuaufbauen des Homepage-/Welcome-Dokuments.

## TDD – zwingende Reihenfolge

### RED

Vor Produktionscodeänderungen Verhaltenstests schreiben/ändern und tatsächlich ausführen. Mindestens:

1. Lokal hydriertes aktives `publicOffline` GPS existiert vor aufgelöstem Catalog.
2. Späteres `discover([])`/ungeeigneter Catalog entfernt dieses GPS **nicht**.
3. Catalog-Fehler entfernt GPS nicht und bleibt retryable.
4. `publicOffline` überlebt `validateManifest -> Registry -> Manager`.
5. Anonymous -> Login Ralf/Tester/Developer/Admin: GPS bleibt ohne Reload sichtbar.
6. GPS-Sichtbarkeit/lokale Basisnutzung ist unabhängig von User-RBAC.
7. Autoritative Admin-Deaktivierung entfernt/invaldiert PublicOffline-GPS korrekt.
8. Background Catalog/Session/Homepage-Auflösung verursacht keinen zweiten Full-Render des bereits sichtbaren Homepage-/Welcome-Dokuments.
9. Profile Active + `profile.view` + `profile.update` erreicht tatsächlich User Settings; fehlende Rechte tun es nicht.
10. Profile öffnen/speichern über echten User-Pfad.

Die Tests müssen **vor der Reparatur aus dem richtigen Grund FAIL** zeigen. RED-Ausgabe für den Abschlussbericht festhalten.

### GREEN

Danach minimalen Produktionscode ändern. Keine neue parallele Modullaufzeit, kein GPS-Neubau, keine neue Sonderarchitektur.

Nach jedem Fix fokussierte Tests ausführen.

### REFACTOR

Nur wenn nach GREEN nötig. Keine großflächige kosmetische Umstrukturierung.

## Zusätzliche Regressionen

Nicht beschädigen:

- User Login + Passwort-Auge
- Admin Login
- Module Details als eigene Seite
- Module Detail Save -> Erfolgsdialog -> Rückkehr
- Settings Apps/Navigation Save Feedback
- Theme-Wechsel
- App/System Module Tabellenstruktur
- GPS Standalone
- GPS Karten-/Positions-UI

## Abschlussprüfungen

Mindestens ausführen:

- alle neuen/fokussierten Verhaltenstests;
- vollständiges `npm test`;
- JS-Syntaxchecks für geänderte JS-Dateien;
- PHP-Lint für geänderte/relevante PHP-Dateien;
- `git diff --check`;
- falls ohne Deployment möglich: Production Package Build.

Kein Deployment. Kein Push/Merge nach `main`.

## Git

Arbeite ausschließlich auf `lea/module-runtime-repair`.

Vor Beginn prüfen:

`git branch --show-current`

Falls nicht exakt dieser Branch aktiv ist: wechseln und erst dann arbeiten.

Erstelle nach erfolgreicher GREEN-/Gesamtprüfung einen Commit auf diesem Branch. Nicht mergen.

## Abschlussdokumentation – verpflichtend in `CHATGPT.md`

`CHATGPT.md` am Ende vollständig als Handoff an Lea aktualisieren. Muss enthalten:

1. exakter Branch und Commit-SHA;
2. bewiesene Root Cause(s), getrennt von widerlegten Annahmen;
3. warum die vorherigen grünen Tests den Production-Fehler nicht erkannten;
4. Liste aller geänderten Dateien und Zweck;
5. RED-Testnachweise: Testname + erwarteter Failure;
6. GREEN-Testnachweise;
7. vollständiger Teststatus;
8. Syntax/PHP/diff/package Status;
9. ausdrücklich: **nicht deployed, nicht nach main gemergt**;
10. verbleibende Risiken/ungeprüfte Punkte;
11. genaue Operator-Retest-Reihenfolge.

Keine Erfolgsaussage ohne tatsächlich ausgeführte Nachweise.

## Operator-Retest nach späterem Merge/Deployment

1. frischer Inkognito-Root: GPS sofort vorhanden und bleibt vorhanden;
2. kein Welcome-Doppelblinken;
3. Settings zeigt GPS;
4. Ralf Login ohne Reload: GPS bleibt, Profile erscheint bei korrekten Rechten;
5. Tester entsprechend;
6. Developer/Admin: GPS bleibt;
7. GPS öffnen und Position lokal nutzen;
8. Profile öffnen/speichern;
9. Offline-Start;
10. Admin-Deaktivierung -> synchronisieren -> zukünftiger Start ohne GPS.
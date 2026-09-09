# NEUTRAL — CODEX → CHATGPT/LEA

**Datum:** 2026-09-09
**Auftrag:** Verbleibende iPad/Chrome-Livefehler und responsives User-UI/GPS
**Status:** CODE-SEITIG ERLEDIGT · DEVICE RETEST REQUIRED · HOST ACTION REQUIRED

## Kurzfazit

Der aktuelle Betreiberbefund wurde als Wahrheit behandelt. Die zentrale Root Cause der weiter wachsenden Device-Session-Liste war nicht die bereits reparierte DB-Ersetzungslogik, sondern der eigenständige Login in `admin.php`: Er verwendete direkten `fetch` und umging damit die persistente Installations-ID des gemeinsamen `ApiClient`. Jeder Adminlogin kam deshalb ohne Device-ID am Server an und erhielt eine neue Zufalls-ID. Der Login nutzt nun denselben persistenten Clientvertrag wie die übrige Anwendung. Echte Zweitinstallationen und verschiedene User bleiben getrennt.

Der Auftrag wurde ohne GPS Pro, CatchTrack-spezifische Logik, allgemeine i18n-Phase oder Appearance-Erweiterung umgesetzt. P1 und P4 bleiben auf ihrem bereits live bestätigten Stand. Die hier geänderten Device-, GPS-, Responsive- und Hostflächen werden ohne realen Betreiber-/Hosttest ausdrücklich **nicht** als `LIVE BESTANDEN` bezeichnet.

## Ergebnisse und Evidenz

### Device Sessions / Adminlogin

- `admin.php` lädt den versionierten `ApiClient`, setzt den isolierten Adminscope und meldet sich über dessen Loginpfad an. Damit bleibt `neutral.device.installation.v1` über Adminlogin, Logout, Access-denied-Navigation, Reload und Relogin erhalten, solange Browserstorage nicht bewusst gelöscht wird.
- Dieselbe Installation ersetzt beim Relogin nur die ältere aktive Session desselben Users. Developer und Tester auf derselben Installation erhalten jeweils genau eine eigene Zeile; eine echte zweite Device-ID bleibt eine zweite Installation.
- Aktive Legacyzeilen ohne Device-ID werden nicht mehr aufgelistet/gezählt und beim nächsten identifizierten Login dieses Users als `replaced` beendet. Bereits historisch erzeugte zufällige, aber nicht leere IDs können nicht sicher von echten Zweitinstallationen unterschieden werden. Sie werden deshalb nicht blind gelöscht und müssen einmalig in Session Overview geprüft/widerrufen werden.
- Der Client erkennt iPadOS auch bei Desktopmodus (`MacIntel` plus Touchfähigkeit), erkennt `CriOS`/Chrome und sendet eine datensparsame Anzeigehilfe. Der Server akzeptiert nur eine enge Plattform-/Browser-Allowlist; sie ist reine Anzeigeinformation und kein Authentifizierungsfaktor. `MacIntel` wird nicht als Gerätename persistiert.
- Die positive Admin-Reauth-Kette und die getrennte User-App-Session bleiben unverändert.

### Dashboard / Permission Catalog / Backup

- Dashboard und Session Overview verwenden weiterhin dieselbe aktive Registryprojektion. Die kompakte Liste ist nun sichtbar mit `Showing X of Y` gekennzeichnet und verlinkt bei Kürzung auf die vollständige Session Overview.
- Für jeden Corepermission-Key existiert eine verständliche Beschreibung. `Area` bezeichnet die Sicherheitsebene `Admin`, `User-App` oder `System`, nicht das Substantiv des Keys. `gps.admin` bleibt modulinterne User-App-Verwaltung; Core-Lifecycle und Rollenzuweisung erfordern weiterhin Core-Adminberechtigungen. Die Registry bleibt read-only.
- `Create backup` ist nur aktiv, wenn Key, Crypto, Database, Managed Tables und Protected Storage sämtlich `true` melden. Andernfalls erklärt die UI unmittelbar, dass der Host-Key vor manuellen oder automatischen verschlüsselten Backups konfiguriert werden muss. Es erfolgt kein vorhersehbar sinnloser POST.
- Host-Key, ACL und Cron bleiben **HOST ACTION REQUIRED**. Kein Key wurde gelesen, ausgegeben oder committed; kein Produktions-Restore wurde ausgeführt.

### Audit

- Retention zeigt die echte API-Anzahl, einschließlich `0 audit entries deleted`.
- Vollständiges Leeren ist eine getrennte, explizit bestätigte Aktion und wird ausschließlich in exakt `development` oder `test` angeboten/erlaubt. Production, Staging und unbekannte Umgebungen failen geschlossen; die API verlangt zusätzlich eine autorisierte Adminsession mit `admin.write`.
- Der Clear-Request wird vor der Löschung gezählt/geschrieben. Da ein vollständiges Clear definitionsgemäß auch diesen Eintrag entfernt, ist diese Grenze in UI und Security-Vertrag ausdrücklich dokumentiert. Der No-op-/`changedFields`-Vertrag bleibt regressionsgedeckt.

### GPS / responsive User-UI

- Die vier Aktionen lauten exakt `Update position`, `Open in Google Maps`, `Open in OpenStreetMap`, `Share position`. Google/OSM navigieren in derselben Browsing-Context über Universal-HTTPS-Links; es wird kein `window.open` und damit kein absichtlich erzeugter `about:blank`-Tab verwendet. Share nutzt den nativen System-Sharepfad mit vorhandenem Fallback.
- Das eingebettete OSM-iframe ist kein Linkwrapper mehr. Pointer-/Touchereignisse erreichen Karte, Zoom, Pan und Attribution; externes OSM wird ausschließlich über den separaten Button geöffnet. Marker und Tracking-freier Vertrag bleiben erhalten.
- Das neue zentrale `.user-content-grid` verwendet `auto-fit`/`minmax`; GPS und User Settings nutzen denselben Vertrag. Mobile rendert einspaltig, Tablet nutzt die verfügbare Breite für Status plus größere Karte, Desktop bleibt durch die zentrale Content-Maximalbreite kontrolliert.
- Dies ist die einzige neu belegte generische UI-Lücke vor dem Core-1.0-Freeze. Es wurden keine spekulativen Corehooks ergänzt.

## Test-first und lokale Verifikation

- Der neue echte JS-/DOM-/PHP-Integrationsvertrag startete rot: `0/3` bestanden, weil Adminlogin die persistente ID umging, GPS noch `window.open` verwendete und das zentrale Responsive-Grid fehlte. Nach der Root-Cause-Reparatur bestanden die Follow-up-Tests `9/9`.
- Fokussierte Admin-/DOM-/Core-Regression: `119/119` bestanden.
- Vollständige Regression: `463/463` bestanden, `0` Fehler, `0` übersprungen.
- PHP-Lint: `39` Dateien bestanden. JavaScript-Syntax und `git diff --check` bestanden.
- Produktionspaket: erfolgreich, `110` Dateien.
- Secret-/Artefaktprüfung: bestanden; keine künstliche Testdatei und keine Secret-Werte eingeführt.

## Deployment und CI

- Implementierungscommit `9e7a4d2757cef84358f0634fe4e2cd1655184ca0` wurde nach GitHub `main` übertragen.
- CodeQL Run `34326330930` endete terminal mit `success`.
- FTPS Run `34326331062` endete terminal mit `success`; Deploy- und Report-Job waren erfolgreich.
- Der darin enthaltene read-only Produktionssmoke meldete Root/Rewrite/Status/Modulcatalog erfolgreich, Admin/Core korrekt geschützt, HTTPS erzwungen, zwei Modulverträge, Viewer-GPS und `migrationsReady:true`. `deploymentRevision:true` bestätigt exakt den Implementierungscommit.
- Die endgültige Berichtsversion wird mit einem separaten Dokumentationscommit übertragen und dessen ausgelöste CI ebenfalls terminal abgewartet. `CHATGPT.md` wird danach direkt auf GitHub `main` verifiziert.
- Ein lokaler UI-Screenshot war nicht ausführbar, weil die Codex-Sandbox kein Chromium-/Chrome-Binary enthält. Das ist eine Werkzeuggrenze und ersetzt nicht den ausdrücklich offenen realen iPad/Chrome-Retest.

## Kurze Betreiber-Retestliste (iPad/Chrome)

1. In Session Overview alte eindeutig historische Browser-/MacIntel-Zeilen einmalig widerrufen; keine bekannte echte Zweitinstallation löschen.
2. Auf demselben iPad/Chrome zweimal als Developer anmelden: danach genau eine aktive Developer-Installation, `Current session` korrekt, Anzeige `iPadOS · Chrome`.
3. Auf derselben Installation als Tester anmelden: genau eine zusätzliche Testerzeile; erneuter Testerlogin erzeugt keine weitere aktive Zeile. Danach eine echte zweite Installation anmelden und als eigene Zeile erhalten.
4. Dashboard prüfen: `Active sessions` entspricht Session Overview; bei mehr als acht Einträgen zeigt die Vorschau `Showing 8 of Y` und den Link zur vollständigen Liste.
5. Bei fehlendem Host-Key prüfen: `Create backup` ist deaktiviert und erklärt die notwendige Hostkonfiguration. Nach sicherer Hostkonfiguration/Reload wird der Button automatisch aktiv.
6. Audit-Retention mit einem No-op ausführen und `0 audit entries deleted` prüfen. In Production darf `Delete all audit entries` nicht erscheinen.
7. GPS: Position aktualisieren; Google Maps und OSM jeweils ohne zurückbleibenden leeren Tab öffnen; `Share position` muss den nativen Share-Dialog anbieten.
8. OSM-iframe direkt zoomen, ziehen und Attribution bedienen. Nur der separate OSM-Button darf extern navigieren.
9. GPS und Settings im iPad-Hoch-/Querformat sowie schmalen Viewport prüfen: bündige volle Kartenbreite, sinnvolle Tablet-Spalten, größere Karte, keine Überlagerung; Light/Dark/Touchziele prüfen.
10. Kurze P1-/P4-Regression: parallele User-/Adminidentität sowie sofortiger Dark-Warmstart und Homepage erhalten.

## Externe Restpunkte

- **DEVICE RETEST REQUIRED:** Die zehn Punkte oben erfordern das reale Betreibergerät. Besonders historische zufällige Device-IDs werden aus Sicherheitsgründen nicht automatisch als Duplikate klassifiziert.
- **HOST ACTION REQUIRED:** Backup-Key, ACL und realen cPanel-Cron hostseitig sicher konfigurieren und anschließend boolesche Readiness/einen nicht-destruktiven Backup-Lauf bestätigen. Kein Produktions-Restore.

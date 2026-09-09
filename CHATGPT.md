# NEUTRAL — CODEX → CHATGPT/LEA

**Datum:** 2026-09-09
**Auftrag:** P0 Live-Auth/GPS und Core-Freeze-Nachbesserung
**Status:** CODE-SEITIG ERLEDIGT · DEPLOYMENT/CI IN PRÜFUNG · DEVICE RETEST REQUIRED · HOST/OPERATOR CHECK REQUIRED

## Root Causes und Korrekturen

1. **User- und Adminlogin / generischer 503:** Beide getrennten Browser-Shells verwenden korrekt denselben ausgelieferten `ApiClient`, den kanonischen `/api/v1`-Resolver und unterschiedliche Session-/CSRF-Cookies. Der gemeinsame PHP-Loginhandler führte jedoch innerhalb jedes Loginversuchs erneut den vollständigen `SchemaMigrator::migrate()` aus. Dieser nimmt einen MySQL-Advisory-Lock (`GET_LOCK`); Lockverweigerung/-konkurrenz wurde vom breiten Login-Catch als `Authentication service temporarily unavailable.` maskiert. Der API-Bootstrap besitzt bereits den idempotenten Migrationsvertrag. Der redundante Request-time-Migrationslauf wurde entfernt. Throttle, Credentials, Installation-ID, Deduplizierung, Session-Scope und CSRF bleiben unverändert. Falsche Credentials gelangen wieder zum normalen 401-Vertrag statt durch einen DDL-Lock zu 503 zu werden.
2. **GPS-Fehlprojektion:** Die alte Karte berechnete nur `floor(tileX/tileY)` und legte das gesamte Mitteltile geometrisch in die Viewportmitte. Der Subtile-Pixeloffset der tatsächlichen Koordinate ging verloren; der Marker blieb trotzdem in der Mitte. Zusätzlich approximierte Pan die Mercator-Y-Achse linear in Grad. Nun verwenden Kartenmittelpunkt, Kachelursprung und Marker dieselbe geklammerte Web-Mercator-Weltpixelprojektion. Pan wird invers aus Weltpixeln berechnet; Zoom projiziert den Mittelpunkt neu. Die Davao-Koordinate ist gegen unabhängige Pixel-/Tile-Referenzwerte getestet.
3. **OSM ersetzt Neutral:** `openCurrentPosition` verwendete für beide Provider `location.assign`. OSM nutzt jetzt direkt `window.open(url, '_blank', 'noopener,noreferrer')`, setzt zusätzlich `opener=null` und erzeugt kein vorläufiges `about:blank`. Das bestehende Google-Verhalten und System-Share bleiben separat.
4. **Delegierter License Admin:** Eine neue scoped Membership-Migration ergänzt `active/blocked`. Der Service bietet innerhalb exakt der eigenen Managerlizenz sichere Zuordnung entfernen (kein globales Account-Löschen), Status, Device-Liste und Einzel-Revoke. Die Organisationsprojektion enthält Used/Allowed/Last Activity und ausschließlich explizit freigegebene Profilfelder. Delegierte Anlage wird serverseitig immer zur normalen `user`-Rolle gezwungen. Mutationen sind CSRF-geschützt und auditiert.
5. **Medienworkflow:** Der vorhandene Tabellen-/Validator-Stub ist nun ein produktiver neutraler Workflow. Upload benötigt `profile.media.upload`, wird serverseitig dekodiert/MIME- und größenvalidiert, zufällig benannt unter dem nicht öffentlich ausführbaren `Server/runtime` mit privaten Rechten gespeichert und startet `pending`. Owner sieht Status/Ablehnungsgrund ohne Moderatornotiz. Kontrollierte Delivery prüft Status/Owner/Moderator. `media.moderate` darf approve/reject/delete; Reject verlangt Grund, jede Transition schreibt Historie und Audit. Viewer/anonym sowie Cross-user/ungeprüfte öffentliche Zugriffe bleiben fail-closed.

## Test- und Paketstand

- Test-first: neue GPS-Projektions-/OSM-Navigationstests waren zunächst rot und sind nach der Korrektur grün.
- Fokussierte Auth-Shell/PHP/User-App/GPS-Suite: 82/82 grün.
- License-/Media-Serviceintegration mit realem PHP, PDO-Testadapter, real dekodiertem PNG und privatem Filesystem: grün.
- Vollständige Regression, PHP-Lint, JavaScript-Syntax, `git diff --check` und Produktionspaket wurden ausgeführt; der finale CI-/Deploymentstand wird nach den terminalen GitHub-Läufen unten ergänzt.
- Keine Secrets, Testcredentials, Produktions-Personendaten oder künstliche öffentliche Testdatei wurden eingeführt. Kein Restore und keine destruktive Produktionsaktion wurde ausgeführt.

## Wahrheitsgrenze / Retest

Bis zur realen Bestätigung bleiben die vier Betreiberbefunde **DEVICE RETEST REQUIRED**, License/Media **HOST/OPERATOR CHECK REQUIRED** und werden nicht als `LIVE BESTANDEN` bezeichnet.

### Kurze Betreiber-Retestliste

1. Bestehenden normalen User auf iPad/Chrome anmelden; falsches Passwort muss normal abgelehnt werden, korrektes Passwort anmelden. Zweimal Logout/Login: nur eine aktive Installation dieses Geräts.
2. `admin.php` separat mit bestehendem Admin anmelden; User- und Adminsession parallel prüfen, Access Denied/Reauth weiterhin getrennt.
3. GPS bei `7.105691769982597, 125.63707611554916`: Marker exakt im Kartenmittelpunkt; `+/-`, Pan und danach `Position aktualisieren` prüfen.
4. `In OpenStreetMap öffnen`: OSM in neuem Tab/Fenster, Neutral bleibt offen; Google Maps und Teilen separat prüfen.
5. Testlizenz A: User anlegen, blockieren/reaktivieren, Zuordnung entfernen, Used/Allowed/Last Activity und Geräte sehen; Gerät revoken. Mit Manager A darf Lizenz B weder gelesen noch verändert werden. Limit 1 → zweites Gerät blockiert → altes revoken → neues möglich; `unlimited` prüfen.
6. Berechtigter Testuser lädt valides Bild hoch: `pending`, nicht öffentlich. Fake/zu groß ablehnen. Moderator approve/reject (mit Grund)/delete und Historie prüfen; normaler User darf nicht moderieren und sieht keine interne Notiz/fremde Medien.

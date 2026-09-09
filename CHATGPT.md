# NEUTRAL — CODEX → CHATGPT/LEA

**Datum:** 2026-09-09
**Auftrag:** Core-Freeze-Blocker User/Account/Lizenz plus GPS-/Settings-Livefixes
**Status:** CODE-SEITIG ERLEDIGT · DEPLOYED · DEVICE RETEST REQUIRED · HOST ACTION REQUIRED

## Kurzfazit

Der live bestätigte Session-Deduplizierungsvertrag bleibt erhalten. Die nachgewiesenen generischen Lücken vor dem Core-Freeze wurden ohne CatchTrack-Fachlogik, GPS Pro, Marketplace-, Community- oder Messaging-Feature geschlossen: eindeutige UTC-/lokale Zeitdarstellung, ehrliche iPad-Anzeige, einsprachiges GPS mit tatsächlich interaktiver OSM-Karte, klar gegliederte Settings, Profile/Privacy/Passwort, vereinfachte Benutzerverwaltung sowie ein neutrales Package-/License-/Organization-/Device-/Presence-/Mediafundament.

P1 und P4 bleiben auf dem bereits vom Betreiber bestätigten Stand. Keine der neuen Flächen wird ohne realen Geräte-/Hostcheck als `LIVE BESTANDEN` bezeichnet.

## Umsetzung

### Sessions, GPS und Settings

- Sessionzeit bleibt serverseitig UTC und wird als ISO-`Z` übertragen; Admin rendert sie mit `Intl.DateTimeFormat` in der Browserzeitzone. Die persistente Installation-ID bleibt Geräteidentität, Plattform bleibt reine Anzeige.
- GPS registriert Deutsch/Englisch über den vorhandenen Core-I18N-Vertrag. Alle sichtbaren Position-, Status-, Fehler-, Öffnen-, Teilen- und Privacy-Texte folgen derselben Locale.
- Das statische OSM-Export-iframe wurde durch einen kleinen OSM-Tile-Viewport ersetzt. `+/-` lädt reale Zoomstufen; Pointer-/Touch-Drag verschiebt den Kartenausschnitt. Marker, OSM-Attribution und separater externer OSM-Button bleiben erhalten; kein Tracking wurde ergänzt.
- Settings besitzt die vier responsiven Unterseiten App Areas, Navigation, Privacy & Sharing und Profile mit eigenem Active-State. Save bleibt auf derselben Unterseite und meldet das Ergebnis inline; der automatische Start-Redirect entfällt. Globale Login-/Settings-/Start-/Modulzustände sind getrennt.

### Account und User Management

- Username bleibt global eindeutig und im eigenen Profil zunächst bewusst read-only. E-Mail ist optional und eindeutig, wenn gesetzt; Login akzeptiert Username oder vorhandene E-Mail.
- Profilfelder Display Name, Public Nickname, Telefon, Adresse und Geburtstag sind optional. Organisationsfreigaben sind feldweise und standardmäßig `off`; Profileingaben werden serverseitig validiert.
- Passwortanlage, Bootstrap und Passwortwechsel verwenden exakt denselben Vertrag: 8–25 Zeichen, keine Leerzeichen, keine Kompositionspflicht. Sonderzeichen sind freiwillig. Das aktuelle Passwort wird beim Wechsel geprüft; gespeichert wird ausschließlich ein sicherer Hash.
- Admin User Management verlangt Username, Initial Password und Role; E-Mail/Display Name bleiben optional. Die normale Statusauswahl ist Active/Blocked. Übersicht zeigt lokale Created-/Last-Activity-Zeit sowie Used/Allowed Devices und führt zur Sessionverwaltung.

### Package, License, Device, Presence und Medien

- Migration `2026_09_09_0005_account_license_foundation` ergänzt normalisierte Profile, konfigurierbare Packages/Entitlements, Licenses/Organizations, License-User-Scope, servergesehene Installation Presence sowie User Media und Moderationshistorie. `NULL`-Limits repräsentieren `unlimited`; feste Verkaufsnamen existieren nicht im Core.
- `license.manage` ist eine eigene Systemfähigkeit ohne globale Adminrechte. Der Server löst die eigene Managerlizenz und erzwingt Seat-/User-Scope; fremde Lizenzen, Core-Rollen, Server, Backups und Audit werden dadurch nicht freigegeben.
- Device-Limits werden zuerst aus User-/Lizenzzuordnung, sonst aus dem sicheren Systemfallback bezogen. Ein erreichtes Limit blockiert ein neues Gerät bis zum Revoke; Admin/Developer können explizit konfiguriert `unlimited` sein. UA/Plattform wird nie Identität.
- Modulprojektionen unterscheiden `available`, `locked` und `hidden`. Locked zeigt einen neutralen Entitlement-Hinweis und startet das Modul nicht; Clientzustände erweitern niemals Serverrechte.
- Installationsmetriken zählen ausschließlich zufällige IDs, die den Server tatsächlich kontaktiert haben: total, heute, 7/30 Tage, anonym/viewer und authentifiziert. Keine IP-Historie, GPS-Daten, Hardwarefingerprints oder erfundene Offlinenutzung.
- Die neutrale Mediengrundlage validiert JPEG/PNG/WebP serverseitig bis 5 MB und modelliert `pending/approved/rejected/deleted` samt Reason, Moderatornotiz und Historie. Es gibt kein automatisches Public Publishing und keinen anonymen Uploadvertrag.
- Messaging und Marketplace bleiben ausschließlich dokumentierte spätere, eigenständige Fähigkeiten; keine UI oder spekulativen Hooks wurden gebaut.

## Verifikation

- Test-first wurden neue PHP-/JS-/DOM-/Contractfälle für Passwortgrenzen/Hashing, default-off Privacy, Entitlementzustände, exakten License-Scope, Bildvalidierung, Migration, lokale Sessionzeit und reale Karten-Zoom-Neuberechnung ergänzt.
- Fokussierter Account-/GPS-/Settings-/Admin-Satz: 99/99 bestanden.
- Vollständige Regression: 470/470 bestanden, 0 Fehler, 0 übersprungen.
- PHP-Lint, JavaScript-Syntax und `git diff --check`: bestanden.
- Produktionspaket: erfolgreich, 111 Dateien einschließlich neuem Account-/License-Service und Migration.
- Secret-/Artefaktprüfung: keine Secret-Werte oder künstlichen Artefakte eingeführt.

## Deployment und CI

- Implementierungscommit `4dbefaad76345bc298fd4de4df15172614daf065` wurde nach `main` übertragen. CodeQL `34339850269` endete erfolgreich. Der erste FTPS-Run `34339850744` lud das Paket hoch, scheiterte danach aber korrekt im read-only Smoke an der noch ausstehenden Migration `0005`.
- Root Cause des Deployfehlers: Der FTPS-Weg besitzt absichtlich keinen Host-Shell-/DB-Zugang; neue Migrationen wurden bisher erst beim nächsten erfolgreichen Login oder manuellen Hostrunner ausgeführt. Dadurch konnten Code und Schema zwischen Upload und erstem Login auseinanderliegen.
- Fixcommit `9f1a0fdbdda652504e8750d8d45884d8e75cfcfd` prüft am PHP-API-Bootstrap die checksummed, repository-definierten Migrationen und führt ausschließlich ausstehende additive/idempotente Definitionen unter dem bestehenden DB-Lock aus. Setup/Readiness bleibt bei nicht erreichbarer DB diagnostizierbar; beliebiges Request-SQL ist unmöglich.
- CodeQL `34340369880` und FTPS `34340370687` endeten terminal mit `success`. Deploy- und Report-Job waren grün. Der finale Produktionssmoke bestätigte Root/Rewrite/Status/Modulkatalog, geschützte Admin-/Corepfade, HTTPS, Viewer-GPS, zwei Modulverträge, exakt die Deploymentrevision sowie `migrationsReady:true`.
- Die verbleibende **HOST ACTION REQUIRED** betrifft nur die bereits dokumentierte Backup-Key-/ACL-/Cron-Konfiguration, nicht mehr Migration `0005`. Kein Restore und keine destruktive Produktionsaktion wurden ausgeführt.

## Kurze iPad/Chrome-Retestliste

1. Session Overview: `iPadOS · Chrome`, lokale Zeit statt UTC-Uhrzeit, Current korrekt; zweimal Logout/Login erzeugt weiterhin keine zweite aktive Installation.
2. GPS einmal auf Deutsch und einmal Englisch öffnen: keine Mischsprache; Position/Fehler/Buttons/Privacy jeweils vollständig in einer Sprache.
3. OSM `+/-`, Drag und Touch/Pinch prüfen; Marker/Attribution bleiben sichtbar, externer Wechsel erfolgt nur über `In OpenStreetMap öffnen`.
4. Settings auf Phone-/iPad-Hoch-/Querformat: vier Unterbuttons, genau einer aktiv, nur gewählter Inhalt primär sichtbar.
5. Navigation: Login, Start, GPS und Settings nacheinander öffnen; global darf exakt ein dargestellter Punkt aktiv sein, Settings-Subnavigation bleibt separat.
6. Navigation/Privacy ändern und speichern: Inline-Erfolg, kein Redirect zu Start, aktive Unterseite bleibt erhalten; `Standardnamen wiederherstellen` prüfen.
7. Profile: optionale Felder speichern/entfernen; Freigaben starten aus; Username read-only. Passwort mit 8 und 25 Zeichen funktioniert, 7/26/Leerzeichen werden abgelehnt.
8. Admin User Management: User ohne E-Mail anlegen, Username-/E-Mail-Duplikat ablehnen, Active/Blocked, lokale Last Activity und Used/Allowed Devices prüfen.
9. Mit Testpackage Modulzustände available/locked/hidden und Device-Limit 1 → zweites Gerät blockiert → Revoke → neues Gerät erlaubt prüfen; echte Zweitinstallation nicht pauschal löschen.
10. License Admin: nur eigene Organisationsuser/freigegebene Profildaten sichtbar und änderbar; globale Rollen, Server, Backup, Audit und fremde Lizenz bleiben verboten. Danach kurze P1-/P4-/Offline-Regression.

## Externe Restpunkte

- **DEVICE RETEST REQUIRED:** obige zehn Prüfungen auf dem realen iPad/Chrome; die neuen Pfade sind bis dahin nicht live bestanden.
- **HOST ACTION REQUIRED:** Migration `0005` idempotent anwenden und `migrationsReady:true` sowie bestehende Backup-Key/ACL/Cron-Punkte sicher bestätigen. Kein Produktions-Restore.

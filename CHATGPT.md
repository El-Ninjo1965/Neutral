# NEUTRAL – CHATGPT HANDOFF

**Richtung:** ChatGPT/Lea ↔ Local Agent
**Branch:** `main`
**Datum:** 2026-09-13
**Status:** DEPLOYED – OPERATOR-LIVE-RETEST DURCHGEFÜHRT; 3 USER-UI-FEHLER OFFEN
**Deployed main / Merge-Commit:** `b5b76f70d57fee982cee7eb397d37009debde001`

## Abgeschlossener User-UI-Stability-Block

Der frühere Branch `lea/user-ui-stability` wurde erfolgreich nach `main` integriert und deployed.

Verifiziert vor Deployment:
- Basis 1–4: PASS
- Runtime A–D: PASS
- Testsuite: 575/575 PASS
- Production Package: PASS
- CodeQL: PASS
- Deployment: PASS
- Production Read-Only Smoke: PASS

Der frühere stale-discovery-Fehler C ist behoben. Der aktuelle Discovery-Request aktualisiert bei sichtbaren Settings gezielt die Settings-UI. Es wurde bewusst kein globales `renderApp()` nach jeder Discovery eingeführt.

Frühere Harness-/Testprobleme sind ebenfalls abgeschlossen:
- `pending` ist kein `error`; Retry muss während eines laufenden Requests nicht sichtbar sein.
- Fake-Browser-Success-Dialog: Close-Button-Handler korrigiert.
- Zu enge Source-Regex-Assertions für `showSuccess()` korrigiert.

Diese Punkte dürfen nicht wieder als offene Produktionsfehler behandelt werden.

## Operator-Live-Retest – User UI

### Bestätigt funktionsfähig

Anonym / Inkognito:
- Start, GPS, Settings, Theme und Login sind sichtbar.
- konfigurierte Homepage-/Welcome-Inhalte werden angezeigt.
- GPS öffnet und bestimmt die Position.
- Positionsaktualisierung funktioniert.
- Google Maps öffnen funktioniert.
- Position teilen öffnet den nativen Share-Dialog.
- Settings zeigt Apps und Navigation.
- GPS kann aktiviert/deaktiviert werden; Navigation reagiert unmittelbar.
- Navigation Label Rename/Restore funktioniert.

Authentifiziert:
- Tester-Login funktioniert.
- Login-Success und Weiterleitung funktionieren.
- GPS bleibt sichtbar und funktionsfähig.
- Settings Apps/Navigation ist verfügbar.
- Settings-Änderungen werden gespeichert und übernommen.

### OFFEN 1 – Start/Home Navigation

Reproduzierbar anonym und authentifiziert:
- Klick/Tap auf `Start` setzt den Start-Button optisch aktiv/blau.
- Der sichtbare Content bleibt jedoch auf der vorherigen View, z. B. Settings oder GPS.
- Navigation-/Active-State und Content-View laufen auseinander.

Soll: Ein einzelner Klick/Tap auf Start muss den Home-/Start-Content tatsächlich rendern und Navigation, View-State und Route konsistent halten.

### OFFEN 2 – Settings Save Success Popup

Reproduzierbar anonym und authentifiziert:
- Settings-Änderungen werden korrekt gespeichert und sichtbar übernommen.
- User bleibt korrekt in Settings.
- Das erwartete Shared-Success-Popup `Successfully saved.` erscheint im realen Browser nicht.

Soll: Nach erfolgreichem Save erscheint das Success-Popup und bleibt bis zur Benutzeraktion sichtbar.

### OFFEN 3 – Passwort-Auge

Production Login:
- Einzelklick/Tap auf das Auge toggelt das Passwort nicht.
- Erst Doppelklick schaltet die Passwortsichtbarkeit.

Soll: Ein einzelner normaler Klick/Tap toggelt `password ↔ text`, plattformneutral und ohne gerätespezifische Sonderlösung.

## Operator-Live-Retest – Admin UI

### Bestätigt funktionsfähig
- Admin-Login → Dashboard
- App Modules
- System Modules
- Settings
- Appearance / Light-Dark
- Users
- Licenses / Organizations
- Packages / Entitlements; New Package öffnet
- Sessions
- Roles & Permissions; New Role öffnet
- Permission Catalog
- Connections & Providers
- Server-Test → Ready
- Database-Test → Successful
- Backup/Restore
- Storage Path Test
- Maintenance/Backup
- Diagnostics
- Audit Log; Delete-all mit Bestätigung funktioniert
- Logout

### Spätere Admin-Punkte – nicht Teil des nächsten User-UI-Fixes
- Dashboard-Darstellung weiter überarbeiten.
- Unlimited Device Limit später als `∞` darstellen.
- Viele alte `idle`-Sessions / Session-Lifecycle separat prüfen.

## Nächster technischer Arbeitsblock

Ausschließlich die drei bestätigten User-UI-Live-Fehler:
1. Start/Home: Active-State wechselt, Content rendert nicht.
2. Settings Save: Speicherung funktioniert, Success-Popup fehlt in Production.
3. Passwort-Auge: Doppelklick statt Einzelklick.

Keine Modularchitektur-, Profile-, Moderation-, Access- oder Admin-Reparaturen mit diesem Block vermischen.

## Danach – Modularchitektur-Audit

Nach Abschluss und Live-Abnahme der drei User-UI-Fehler folgt ein separater Architektur-/Modul-Audit.

Vorgehen:
1. Aktuellen Code als primäre Wahrheit lesen: Module Interface, Registry, Manager, Loader, Discovery, Manifeste, App Modules, System Modules, Admin-Lifecycle und User-Sichtbarkeit.
2. IST-Code gegen die gewünschte neutrale Architektur prüfen.
3. Verbindlichen Modulvertrag festlegen.
4. Erst danach Dokumentation wie `ModuleCreation.md`, `Architecture.md`, `CORE-1.0.md`, `VISION.md`, `SYSTEM-MODULES.md` usw. synchronisieren.
5. Anschließend erst Profile/Moderation und weitere Module reparieren.

Architekturgrundsatz: Ein optionales Modul muss deaktivierbar sein, ohne Core oder unabhängige Module funktionsunfähig zu machen. Eine systemnotwendige Komponente muss ausdrücklich als nicht deaktivierbare Core-/Required-Funktion modelliert werden statt als scheinbar optionales Modul.

## Aktueller Status

- `main` deployed: JA
- Automated Production Smoke: PASS
- Operator-Live-Retest: DURCHGEFÜHRT
- User-UI-Live-Abnahme: NICHT vollständig bestanden – 3 reproduzierbare Fehler offen
- Admin-Basis-Live-Test: weitgehend bestanden; spätere Feinheiten dokumentiert

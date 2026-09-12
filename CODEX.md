# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** LIVE RETEST FAILED – PROFILE / MODULE DISCOVERY / DETAILS / SETTINGS FEEDBACK  
**Datum:** 2026-09-12  
**Core Freeze:** NICHT erklärt

# Referenzstand – nicht regressieren

- User Login funktioniert operator-live; Browser-Autofill + einfacher Click-Eye akzeptiert. Nicht grundsätzlich umbauen.
- Admin Login funktioniert.
- User Management Organization-Fix ist operator-live **PASS**: `Verein Bonn` wird inzwischen korrekt in der Übersicht angezeigt.
- User blockieren/reaktivieren funktioniert.
- Doppelte Überschrift bei App Modules/System Modules ist entfernt und damit **PASS**.
- Google-Maps-/GPS-Grundfunktionen und eingebettete OSM-Karte grundsätzlich vorhanden.

Dieser Auftrag bearbeitet die beim direkten Produktions-Retest weiterhin fehlerhaften Punkte. Keine kosmetische Behauptung als Fix akzeptieren: die reale User-App muss das Ergebnis zeigen.

---

# P0 – PROFILE IST TROTZ INSTALL + ACTIVE + PERMISSIONS WEITERHIN NICHT SICHTBAR

## Neuer Live-Retest

Nach dem letzten Deployment wurde Profile ausdrücklich erneut:

1. installiert,
2. aktiviert,
3. gespeichert,
4. User ausgeloggt,
5. als `Ralf` neu eingeloggt.

Ergebnis weiterhin:

- Settings zeigt nur `Apps` und `Navigation`.
- Kein Profile.
- Profile erscheint auch nicht als nutzbarer User-App-Bereich.

Vorherige Evidence bleibt zusätzlich bestehen:

- `Profile` Installed + Active.
- `profile.view` + `profile.update` in Rolle/User vorhanden.
- Permission Catalog enthält beide Profile-Permissions.
- GPS funktioniert im gleichen User-App-Umfeld.

Der letzte Fix `presentation.userNavigation` war also **nicht ausreichend**. Nicht erneut denselben Source-String als Erfolg werten.

## Auftrag – echte End-to-End Root Cause

Profile und GPS vom Server bis zum realen User-Renderpfad instrumentiert vergleichen:

- Manifest
- installierter/aktiver Registry-Zustand
- serverseitige Module-/Visibility-Projektion für authentifizierten User
- effektive Permissions
- API-Response an den User-Browser
- User-App Discovery/Module Access
- Settings → Apps Projection
- Navigation Projection
- Route/Entry
- Profile Settings Projection

Verhaltensnah beweisen: **ein real authentifizierter Testuser mit aktiver Profile-Installation und `profile.view/profile.update` bekommt Profile in der tatsächlich gerenderten User-App und kann Profile öffnen/speichern.**

Wenn Profile fachlich bewusst kein Top-Level-App-Menü sein soll, muss es mindestens als klarer Profile-Bereich in Settings erscheinen. Aktuell erscheint es nirgends; das ist der Bug.

Keine Permission-Sonderbehandlung und keine hardcodierte `Tester`-/`Ralf`-Ausnahme.

---

# P0 – MODERATION ZEIGT DEN GLEICHEN GRUNDFEHLER

Neuer Operator-Test:

- System Module `Moderation` installiert + aktiviert.
- User `Ralf` besitzt bereits Rolle `Moderator`.
- zusätzliche Moderation-Rechte wurden operatorseitig vergeben.
- Trotzdem erscheint für Ralf keine Moderationsfunktion.
- Visibility/Navigation in den Module Details war nach Aktivierung leer.
- Module Self-Test war nicht nutzbar/erfolgreich.

## Auftrag

Nicht als separates UI-Einzelproblem behandeln. Prüfen, ob Profile und Moderation an demselben generischen Modul-Discovery-/Presentation-/Role-/Visibility-Vertrag scheitern.

- Module müssen ihre vorgesehenen Permissions/Visibility-/Navigation-Metadaten sauber mitbringen bzw. aus Manifest/Registry projizieren.
- Eine vorhandene Rolle `Moderator` darf nicht durch eine zweite künstliche Rolle ersetzt werden.
- Wenn Moderation laut Architektur nur für bestimmte Rollen/Permissions sichtbar sein soll, diesen Vertrag korrekt aus Manifest/Permission Catalog/effective permissions ableiten.
- Systemmodul darf nicht automatisch als normales User-App-Menü erscheinen, wenn sein Manifest das nicht vorsieht; aber berechtigte Moderationsfunktion muss dort erreichbar sein, wo der Modulvertrag sie definiert.
- Self-Test-Vertrag prüfen und klaren Erfolg/Fehler anzeigen.

Profile zuerst beweisen; danach Moderation mit Ralf als zweites End-to-End-Beispiel desselben Frameworkvertrags testen.

---

# P1 – USER SETTINGS SAVE FEEDBACK IST LIVE WEITERHIN NICHT VORHANDEN

Operator-Retest:

- Settings → Apps ändern + `Save Settings`: Speicherung funktioniert, **keine Bestätigung**.
- Settings → Navigation ändern + `Save Settings`: Speicherung funktioniert, **keine Bestätigung**.

Der letzte angebliche Feedback-Fix ist damit live FAIL.

## Verbindlicher Vertrag

Nach erfolgreichem Save:

- Framework-eigenes sichtbares Modal/Popup.
- Text sinngemäß `Successfully saved.`
- genau `OK` zum Schließen.
- kein Reset, keine Zusatzaktion.
- kein nativer Browser-Alert.

Bei Fehler: Framework-eigene klare Fehlermeldung.

Wichtig: Test muss den echten Settings-Save-Handler und den tatsächlich sichtbaren Dialog im User-App-DOM prüfen, nicht nur das Vorhandensein einer Feedback-Funktion im Source.

---

# P1 – APP MODULES / SYSTEM MODULES: DETAILS AUF EIGENE SEITE

## Livebefund

Die Übersichten selbst sind jetzt akzeptabel: schlanke Modulliste, doppelte Überschrift entfernt.

Aber Klick auf `Details` bei **App Modules** und **System Modules** rendert den kompletten Detailblock weiterhin **unterhalb der gesamten Modulliste auf derselben Seite**.

Das ist nicht gewünscht und verursacht unnötige lange Seiten/Lade- und Bedienballast.

## Zielvertrag für beide Modularten

### Übersicht

- Nur Modulliste/Tabelle + notwendige Übersichtsaktionen.
- Keine vorausgerenderten Detailblöcke unter der Liste.

### Klick `Details`

- öffnet eine **eigene Detailansicht/Route** für genau dieses Modul;
- dort: Status, Lifecycle-Actions, Visibility/Navigation, Permissions, Self-Test, Notes und künftig modul-eigene Settings soweit vorhanden;
- eindeutige `Back to App Modules` bzw. `Back to System Modules` Navigation.

### Save

- nach Save Framework-Popup `Successfully saved.` + `OK`;
- nach OK zurück zur passenden Modulübersicht, sofern der Save-Flow abgeschlossen ist;
- Fehler bleiben auf Detailseite mit klarer Meldung.

Keine Detaildaten für alle Module schon beim Laden der Übersicht unnötig rendern/fetchen, wenn sie erst auf Details gebraucht werden.

---

# P1 – GENERISCHER VERTRAG FÜR MODUL-EIGENE ADMIN SETTINGS

Produktentscheidung aus dem GPS-Test:

Neutral soll Module eigenständig halten. Ein Modul soll optional eigene Admin-Konfiguration deklarieren können, die in seiner **Module Detail**-Ansicht eingebunden wird, statt GPS-/Provider-Sondercode in den Core zu schreiben.

## Architekturauftrag

Bestehende Manifest-/Module-Contracts zuerst prüfen und möglichst erweitern statt neuen Parallelmechanismus bauen.

Ein Modul darf optional Admin-Settings definieren, z. B. für GPS künftig:

- Kartenanbieter/Map Provider
- Geocoding Provider
- API-Key/Provider Credential, falls ein Provider ihn benötigt
- provider-spezifische Optionen

Regeln:

- Core stellt nur generischen Settings-Host/Contract bereit.
- Modul besitzt Schema/Defaults/Validierung/Lesen/Speichern seiner Settings.
- Secrets niemals im Klartext wieder anzeigen; vorhandenes Secret-Handling nutzen.
- Keine Google-API oder andere kostenpflichtige externe API jetzt hart einbauen.
- OSM-Karte bleibt aktueller kostenloser Default.
- Spätere Module können denselben Settings-Contract nutzen.

Für diesen Batch reicht ein sauberer generischer Contract + nachweisbare Einbindung in Module Details, sofern noch kein solcher Vertrag existiert. Keine unnötige Provider-Plattform neu bauen.

---

# P1 – GPS: STANDORT IST KEINE STANDORTANGABE

## Livebefund

GPS zeigt unter `Standort` lediglich:

`Aktuelle Position ermittelt.`

Das ist eine Statusmeldung, keine Ortsangabe. Die Karte selbst erkennt/zeigt im Operator-Test `Red Knight Gardens`, während der Text keinerlei Ort, Straße, Stadt/Region oder Land nennt.

Zusätzlich kleben Positions-Contentblock und Kartenblock optisch direkt aneinander; ein klarer vertikaler Abstand fehlt.

## Ziel

1. Zwischen Positionsblock und Kartenblock sichtbaren normalen Section-Abstand setzen.
2. `Standort` muss eine tatsächliche nutzerverständliche Ortsangabe sein, **wenn sie zuverlässig verfügbar ist**.
3. Bevorzugte Information: POI/Adresse/Ort, Stadt/Gemeinde, Region/Provinz, Land – abhängig von verfügbarer Reverse-Geocoding-Antwort.
4. Wenn mit dem bestehenden kostenlosen Stack keine zuverlässige Reverse-Geocoding-Quelle vorhanden ist, **nicht halluzinieren und nicht `Aktuelle Position ermittelt` als Standort ausgeben**. Dann klarer Fallback, z. B. Koordinaten kompakt oder `Address unavailable`, während Google-Maps-Link und Marker weiterhin exakt funktionieren.
5. Prüfe, ob der vorhandene OSM-Stack/Nominatim bereits genutzt werden darf/konfiguriert ist. Nutzungsbedingungen/Rate-Limits respektieren; keine aggressive Requests.
6. Keine Google Developer API ohne explizite spätere Provider-Konfiguration/API-Key-Entscheidung einführen.

---

# P2 – MODUL-VISIBILITY/PERMISSIONS DEFAULTS

Bei frisch installierter/aktivierter Moderation waren Visibility/Navigation in Details leer. Prüfe generisch:

- Welche Werte kommen aus Manifest?
- Welche sind Installationsdefaults?
- Welche sind Admin-Overrides?
- Darf leeres Override den Manifestdefault versehentlich löschen?

Ziel: Installation/Aktivierung eines Moduls übernimmt seine deklarierten sinnvollen Defaults deterministisch. Admin kann danach bewusst überschreiben. Keine stillen leeren Werte, die das Modul trotz korrekter Permissions unsichtbar machen.

---

# Bereits bestätigte Punkte NICHT erneut umbauen

- Organization `Verein Bonn` in User Management: PASS.
- User Block/Unblock: PASS.
- App/System Modules doppelte Überschrift: PASS.
- User Login/Eye: akzeptierter Referenzstand.
- Primary DB Provider bleibt read-only/Setup-Vertrag; keine leicht editierbare Live-DB-Verbindung bauen.

Sessions, Appearance, Diagnostics, Dashboard, Sidebar Theme, Audit Dialoge, Deployment-Anzeige aus dem vorherigen Batch sind weiterhin operator-retest-pending, aber **nicht Gegenstand dieses fokussierten Reparaturbatches**, außer eine direkte Regression durch obige Änderungen entsteht.

---

# Tests – echte Verhaltenstests

Mindestens:

1. Profile: installed + active + User role + `profile.view/update` → API-Projektion enthält Profile → User DOM zeigt Profile → öffnen → speichern.
2. Profile deactivated → verschwindet wieder.
3. Moderation: installed + active + Ralf/Moderator + effektive Permission → vorgesehener Moderationsentry erreichbar.
4. Manifest defaults vs Admin overrides für Visibility/Navigation.
5. Settings Apps Save → sichtbares Framework-Modal; OK schließt.
6. Settings Navigation Save → sichtbares Framework-Modal; OK schließt.
7. App Modules Overview enthält keine gerenderten Details; Details navigiert eigene Route.
8. System Modules entsprechend.
9. Module Detail Save → sichtbare Bestätigung + Rücknavigation.
10. optionaler generischer Module-Admin-Settings-Contract ohne Core-Sonderfall.
11. GPS Standort zeigt echte Reverse-Geocoding-Daten oder ehrlichen Fallback; niemals Statussatz als Standort.
12. GPS Sections haben responsive spacing.
13. Vollsuite, JS-Syntax, PHP-Lint, `git diff --check`, Production Package.

Tests nicht auf bloße Source-Strings beschränken, wenn der letzte Batch genau dadurch live falsche PASS-Annahmen ermöglicht hat.

# Deployment / Dokumentation

- Root Causes konkret dokumentieren.
- kleine nachvollziehbare Commits.
- Push `main` erst nach Tests.
- CodeQL + FTPS terminal abwarten.
- read-only Production Smoke.
- `CHATGPT.md`, `CURRENT-TASK.md`, `STATUS.md`, `UI-UX.md`, ggf. `API.md`, `Security.md`, `CHANGELOG.md` entsprechend tatsächlichem Vertrag aktualisieren.
- Kein Core Freeze.
- Keine Secrets ausgeben.

# Nächster Operator-Retest

1. Profile als Tester/Ralf sichtbar → öffnen → speichern.
2. User Settings Apps/Navigation speichern → Popup sichtbar.
3. App Modules Details → eigene Seite → Save → Popup → zurück.
4. System Modules ebenso.
5. Moderation als Ralf erreichbar.
6. GPS Standorttext + Abstand zur Karte.
7. Erst danach Sessions/Appearance/Diagnostics/Dashboard/Sidebar/Deployment-Retest fortsetzen.
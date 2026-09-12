# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** OPERATOR UX / MODULE REPAIR BATCH – KEIN CORE FREEZE  
**Datum:** 2026-09-12

# Bestätigter Referenzstand

Der User-Login ist operator-live funktionsfähig. Browser-Autofill funktioniert und der aktuelle einfache lokale Click-Eye funktioniert ausreichend. **Diesen Login-Aufbau nicht grundsätzlich umbauen.** Ein gelegentlich nötiger zweiter Klick ist derzeit kein Blocker.

Admin-Login funktioniert ebenfalls.

Dieser Batch basiert auf einem vollständigen Operator-Rundgang durch User-App und Admin. Root Causes jeweils vor Änderung prüfen; keine großen Core-/Auth-Refactorings.

---

# PRIORITÄT 1 – Profile-Modul muss im User-Bereich erscheinen

## Live-Evidence

Für User `Tester` ist dreifach bestätigt:

- App Module `Profile` ist **Installed + Active**.
- Rolle `User` besitzt `profile.view` und `profile.update`.
- Permission Catalog führt `profile.view` und `profile.update` als User-App-Permissions des Moduls `Profile`.
- Trotzdem erscheint Profile weder im User-Grundmenü noch in Settings → Apps.
- GPS ist ebenfalls aktiv/berechtigt und erscheint korrekt.

## Auftrag

- GPS und Profile im vollständigen User-App-Discovery-/Visibility-/Navigation-Pfad direkt vergleichen.
- Exakt feststellen, wo Profile herausfällt: Manifest/Registry/Discovery/API/Projection/Visibility/Navigation/Settings-Apps/Route/Module-Entry.
- Kein Permission-Workaround; Permissions sind nach Operator-Evidence vorhanden.
- Kleinsten Root-Cause-Fix implementieren.
- Profile muss für einen berechtigten User tatsächlich aufrufbar und benutzbar sein.
- Profile View/Update funktional testen, nicht nur Sichtbarkeit.

Erst wenn Profile funktioniert, sind weitere Module wie Moderation/Postbox sinnvoll operator-testbar.

---

# PRIORITÄT 2 – Organization in User Management

## Live-Evidence

User `Tester` / User ID 102:

- Edit User zeigt unter `License or Organization`: `Verein Bonn — Verein`.
- Effective Package wird von `Verein Bonn` geerbt.
- In der User-Management-Übersicht steht in der Spalte `Organization` trotzdem `—`.

## Auftrag

- Organization-Projektion der User-Liste reparieren.
- Vorhandene Zuordnung aus derselben kanonischen Quelle anzeigen, die Edit User/Effective Package nutzt.
- Keine zweite Datenquelle/duplizierte Zuordnung erfinden.
- Regressionstest: User mit Organization zeigt diese in Übersicht; User ohne Organization bleibt leer/—.

---

# PRIORITÄT 3 – Sessions: echte aktive Sessions statt historischer Alt-Sessions

## Live-Evidence

Sessions-Seite zeigt denselben Administrator mehrfach als `Active`, obwohl alte Zeilen eine `Last Activity` vom 01.09. bzw. 11.09. haben und nicht die aktuelle Session sind. Aktuelle Session ist separat `Current`.

## Zielvertrag

- `Active` bedeutet tatsächlich aktive Session, nicht lediglich aktiver User-Account.
- Historische/beendete Sessions dürfen nicht als aktiv erscheinen.
- `Current` bezeichnet die Session des aktuellen Browser-/Admin-Kontexts.
- Wenn nur eine aktuelle Session existiert, darf die Übersicht nicht drei aktive Sessions melden.
- Wenn derselbe Account tatsächlich auf mehreren Geräten gültig eingeloggt ist, dürfen mehrere echte aktive Sessions existieren; nicht künstlich auf eine Session pro Account begrenzen.
- Sessions müssen administrativ beendet/revoked werden können, sofern das bestehende Sicherheits-/Sessionmodell dies vorsieht.
- Dashboard-Zähler `Active Sessions` muss denselben kanonischen Zustand verwenden.

Root Cause in DB-Sessionstatus, Revoke/Logout, Expiry/Persistenz und UI-Projektion prüfen; keine kosmetische Filterung über falsche Daten legen.

---

# PRIORITÄT 4 – GPS UX / Responsive Layout

## Bestätigter Funktionsstand

- Geolocation funktioniert.
- OSM-Karte/Marker funktioniert.
- Aktualisieren funktioniert.
- OpenStreetMap öffnet bereits in neuem Tab.
- Position teilen funktioniert technisch.

## Änderungen

1. `In Google Maps öffnen` muss in neuem Tab/Fenster öffnen (`target=_blank` + sichere rel-Attribute bzw. äquivalentes Verhalten).
2. `In OpenStreetMap öffnen` als separaten Action-Button **entfernen**. OSM bleibt als eingebettete Kartenbasis.
3. `Position teilen` soll standardmäßig einen **Google-Maps-Link** mit der aktuellen Position teilen, damit Empfänger direkt mit Google Maps navigieren können.
4. Layout neu ordnen, responsiv und einspaltig:
   - `Aktuelle Position`
   - nutzerfreundliche Standort-/Adressdarstellung
   - Genauigkeit
   - Zeitpunkt
   - `Position beim Öffnen automatisch ermitteln`
   - Actions: `Position aktualisieren`, `In Google Maps öffnen`, `Position teilen`
   - darunter die Karte über die verfügbare Breite.
5. Rohwerte Breitengrad/Längengrad nicht prominent als Hauptinformation zeigen. Wenn Reverse-Geocoding bereits sauber/zulässig vorhanden ist, bevorzugt lesbare Adresse/Ortsbezeichnung anzeigen. **Keine neue externe API-Abhängigkeit oder kostenpflichtige Geocoding-Abhängigkeit nur dafür einführen.** Falls keine verlässliche Adresse verfügbar ist, eine robuste nutzerfreundliche Fallbackdarstellung wählen und Koordinaten intern für Links/Map behalten.
6. Karte responsiv: auf iPad groß und deutlich; auf kleinen Handys ohne überlaufende Content-Blöcke.

---

# PRIORITÄT 5 – User Settings Save Feedback

Live funktionieren Settings-Speicherungen (Navigation Labels, GPS-App aktiv/deaktiv), aber es gibt **keinerlei sichtbare Bestätigung**.

Vertrag:

- Nach erfolgreichem Speichern einfache Framework-eigene Bestätigung: sinngemäß `Successfully saved.` + `OK`.
- Keine zusätzlichen Aktionen wie Reset.
- Bei Fehler entsprechend klare Fehlermeldung.
- Nicht native `alert()`/`confirm()` verwenden, wenn dadurch Browseroptionen wie `Dialogfelder unterdrücken` erscheinen.
- Einheitlichen kleinen Framework-Dialog/Modal verwenden.

Dasselbe Prinzip für relevante Admin-Speicher-/Bestätigungsaktionen anwenden, aber nicht jede harmlose Navigation mit Dialogen belasten.

---

# PRIORITÄT 6 – Admin App Modules / System Modules Layout

## Livebefund

- `App Modules` und `System Modules` zeigen die Seitenüberschrift doppelt.
- Ursache wirkt mit dem oberen Reload-Aktionsbereich gekoppelt; prüfen, nicht nur vermuten.
- Reload kann in den eigentlichen Inhalts-/Actionbereich unter die Überschrift verschoben werden; kein zusätzlicher Header.
- Tabellen wirken nicht wie eine durchgängige Tabelle: Border/Trennlinien bei `Actions` sind vertikal versetzt; unter letzter Actions-Zelle erscheint eine zusätzliche untere Linie.
- Inhaltsbreite ist gegenüber System Settings/Appearance unnötig zusammengedrückt.

## Ziel

- genau eine Seitenüberschrift;
- einheitliche nutzbare Contentbreite;
- Reload als normale Seitenaktion;
- saubere gemeinsame Tabellenzeilen/-border über alle Spalten;
- responsive ohne horizontales „Schwimmen“/unnötiges Zusammendrücken.

---

# PRIORITÄT 7 – Appearance strukturell aufräumen

## Global Start Page

- `Global Start Page` und `User UI Design` sollen klar **innerhalb** ihrer jeweiligen Container/Sections stehen, nicht optisch halb auf dem Border.
- Global-Start-Page-Preview soll dieselbe sinnvolle/dynamische Breite wie das Text/HTML-Eingabefeld nutzen; aktuelle schmale Preview erzeugt künstliche Zeilenumbrüche.

## User UI Design

Responsive Struktur:

1. Gemeinsamer äußerer Block `Light`:
   - Base Colors
   - Actions and Buttons
   - Navigation
   - Forms
2. Darunter eigener äußerer Block `Dark` mit denselben Unterbereichen.
3. `Geometry and Typography` separat als gemeinsamer, themeübergreifender Block.
4. Light/Dark nicht als zwei starre breite Spalten erzwingen; auf schmalen Screens sicher untereinander.
5. Gesamten `Preview Theme`-Bereich inklusive Theme-Auswahl, Header-Vorschau, Active/Inactive, Example Card und Primary/Secondary als klar zusammengehörigen Preview-Container einfassen.
6. `Advanced Custom CSS` danach separat.

Keine Funktionsänderung der Designwerte; nur Struktur/Responsiveness/Lesbarkeit.

---

# PRIORITÄT 8 – Diagnostics inkonsistenter Status

Live zeigt Diagnostics oben `Not found`, während darunter gültige Systemdaten (PHP-Version, Extensions, MySQL PDO Driver, Rewrite etc.) angezeigt werden.

- Root Cause des `Not found` bestimmen: falscher Endpoint, falsche Statusprojektion oder echter fehlender Teilservice.
- Keine Fehlermeldung anzeigen, wenn die Diagnose erfolgreich geladen wurde.
- Falls tatsächlich nur ein Teil fehlt, diesen Teil konkret benennen statt global `Not found`.

---

# PRIORITÄT 9 – Framework-eigene Dialoge statt Browserdialoge

Audit Log `Clear audit log` zeigt nativen Browser-Confirm mit zusätzlicher Browseroption `Dialogfelder unterdrücken`.

- Für solche bestätigungspflichtigen Adminaktionen eigenen simplen Framework-Dialog verwenden.
- Destruktiv: klare Meldung + `OK/Confirm` und `Cancel/Abbrechen`.
- Normale Erfolgsmeldung: Meldung + `OK`.
- Keine unnötigen Optionen.
- Bestehende zentrale UI-Feedback-Komponente nutzen/vereinfachen, falls vorhanden; keine neue Dialogbibliothek bauen.

---

# PRIORITÄT 10 – Admin Sidebar / Theme

1. `Neutral Administration` + `CORE 1.0` aus dem Navigationskopf entfernen und als Status-/Summary-Information sinnvoll im Dashboard/Summary anzeigen.
2. Theme-Umschalter nicht als konkurrierenden Navigationsbutton zwischen Statusinfo und Menü darstellen.
3. Stattdessen kompakte Theme-Auswahl, bevorzugt Select/Pulldown `Light / Dark` an sinnvoller Stelle der Sidebar.
4. Theme-Auswahl darf nicht wie aktiver Navigationspunkt hervorgehoben werden oder Dashboard-Active-State verschieben.
5. Navigation stabil; kein horizontales Verschieben/„Schwimmen“ beim Anklicken.

---

# PRIORITÄT 11 – Dashboard als echte Schnellübersicht

Aktuelle unklare Werte wie `Status OK`, `Known installations 16`, `Active 30 days 16` sind ohne Erklärung/Navigationsnutzen nicht ausreichend.

## Auftrag

- Zuerst fachlich klären, was diese bestehenden Metriken wirklich bedeuten. Keine Fantasiedefinitionen.
- Unklare/nutzlose Metriken entfernen oder eindeutig benennen/erklären.
- Dashboard als kompakte Schnellübersicht aus kanonischen Admin-Daten ausbauen, z. B. soweit Daten bereits vorhanden:
  - Core-Version
  - User gesamt / aktiv / inaktiv
  - echte aktive Sessions
  - App-/System-Module aktiv/gesamt
  - Rollen
  - Packages
  - Licenses
  - Organizations
  - Datenbankstatus, DB-Typ, Tabellenanzahl soweit sicher ermittelbar
  - letzter Check/Build in menschenlesbarer Darstellung.
- Keine gefährlichen DB-Lösch-/Editierfunktionen auf das Dashboard setzen. Optimierung/Wartung nur, wenn es bereits einen sicheren fachlichen Vertrag dafür gibt.
- Relevante Kennzahlen/Karten anklickbar machen: Users → User Management; Sessions → Sessions; Modules → passende Module-Seite; Rollen → Roles; Licenses/Organizations → entsprechender Bereich usw.
- Dashboard ist Übersicht/Navigation, nicht Diagnostics.

---

# PRIORITÄT 12 – Updates muss eine echte Funktion haben

## Livebefund

Maintenance funktioniert. Updates/Updater zeigt dagegen im Wesentlichen:

- `Releases`
- `Updater: Not supported; releases are deployed externally.`
- Commit
- Build Time als rohe ISO-Zeit wie `2026-09-11T12:36:57.488Z`.

Damit ist die Seite für einen Admin aktuell kaum handlungsfähig.

## Auftrag – zuerst Architektur prüfen

Neutral soll weiterhin modular bleiben und Core nicht unnötig verändern. Prüfe vorhandene Update-/Release-/Module-Discovery-Verträge und dokumentiere, was im Shared-Hosting-/GitHub-Deploymentmodell sicher möglich ist.

Zielbild:

- Build-/Release-Zeit menschenlesbar anzeigen (lokal/verständlich; keine rohe ISO-Zeichenfolge als primäre UI).
- Bezeichnungen fachlich korrekt; `Updater` nicht verwenden, wenn keine Updatefunktion existiert.
- Für neu entdeckte oder neuere Modulversionen soll Admin erkennen können, dass Installation/Update verfügbar ist, auf Basis vorhandener Manifest-/Versions-/Discovery-Daten.
- Wenn bestehende Architektur sichere Module-Updates unterstützt: entsprechende verfügbare Updates anzeigen und explizite Admin-Aktion anbieten.
- Core-Update nur dann anbieten, wenn ein sicherer bestehender Release-/Deploymentvertrag dies trägt. **Keinen unsicheren Self-Updater bauen, der GitHub/FTPS/Serverdateien aus dem Browser manipuliert.**
- Maintenance bleibt separat und funktionsfähig.
- Falls Updates in dieser Architektur bewusst extern deployed werden müssen, Seite ehrlich als Release-/Deployment-Status gestalten und nicht vortäuschen, dass der Admin dort updaten kann.

Vor Implementierung eines größeren Update-Mechanismus Architektur/Threat-Modell und bestehenden Deploymentweg respektieren.

---

# Zurückgestellte Folgeprüfung nach diesem Batch

Nach erfolgreichem Profile-Fix:

- Moderation-Modul installieren/aktivieren und mit User `Ralf`/Moderatorrolle operator-testen.
- Postbox installieren/aktivieren und User-Discovery/Permissions prüfen.
- Weitere Module nacheinander testen.

GPS-Menü erscheint beim frischen User-App-Load erst nach ca. 1–2 Sekunden trotz schneller Verbindung. **Performance als separates Folge-Thema notieren**, in diesem Batch nur optimieren, wenn eine klare kleine Ursache im ohnehin bearbeiteten Discovery-Pfad sichtbar wird. Keine riskante Startup-Neuarchitektur.

Connections/Providers: aktueller Read-only-Status mit Primary Database `Ready` und nicht konfigurierten optionalen Providern ist akzeptiert. Primären DB-Provider nicht als leicht editierbare Live-Adminfunktion öffnen.

---

# Tests / Verifikation

Für jeden Fix verhaltensnahe Regressionstests ergänzen. Besonders:

- Profile active + permissions → erscheint und ist aufrufbar.
- GPS vs Profile Discovery-Vertrag.
- User Organization list projection.
- Session active/current/revoked semantics + Dashboard count.
- GPS Google Maps `_blank`, Google-Maps-Share-Link, responsive structure.
- Settings Save Feedback.
- Modules/System Modules genau eine Überschrift + Tabellenstruktur.
- Appearance responsive Section-Struktur.
- Diagnostics kein falsches globales `Not found`.
- eigener Confirm/Feedback-Dialog statt nativer Browserdialoge.
- Sidebar Theme Select und stabiler Active-State.
- Dashboard canonical counts + Navigation.
- Update/Release UI entsprechend tatsächlich implementiertem Architekturvertrag.

Danach vollständige Suite, JS-Syntax, PHP-Lint, `git diff --check`, Production Package.

# Deployment

- Sinnvolle kleine Commits; keine Secrets.
- Push `main` erst nach Tests.
- CodeQL + FTPS terminal abwarten.
- read-only Production Smoke.
- `CHATGPT.md`, `CURRENT-TASK.md`, `STATUS.md`, `UI-UX.md`, ggf. `API.md`, `Database.md`, `Security.md`, `CHANGELOG.md` nur entsprechend tatsächlicher Änderungen synchronisieren.
- Kein Core Freeze.

# Operator-Retest danach – Reihenfolge

1. Profile beim Tester sichtbar + Profile View/Update.
2. Organization `Verein Bonn` in User Management sichtbar.
3. Sessions: nur echte aktive/current Sessions + Beenden/Revoke.
4. GPS Layout/Google Maps/Share.
5. User Settings Save Feedback.
6. App/System Modules Layout.
7. Appearance responsive Struktur + Preview.
8. Diagnostics.
9. Audit/Framework Dialoge.
10. Sidebar Theme + Dashboard.
11. Updates/Release-Verhalten.
12. Danach Moderation/Postbox als nächste Modulprüfung.
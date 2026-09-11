# NEUTRAL – Admin/User UX Decisions

## Aktueller bindender Nachtrag (2026-09-11, Operator-Retest)

### User UI

1. User-Login-Eye ist nun sichtbar, aber der Klick schaltet das Passwort **nicht** auf sichtbar. Der Button erhält lediglich Fokus/Blau-Rahmen. Damit weiterhin FEHLGESCHLAGEN.
2. Eingeloggte User/Admin sehen in Settings weiterhin nur `App Areas` und `Navigation`; Profile sowie Privacy/Social Sharing fehlen. Profile ist derzeit serverseitig nicht sauber installierbar, siehe Module-Livebefund.
3. `App Areas` soll im User-UI schlicht **Apps** heißen.
4. `Save Settings` persistiert Änderungen, zeigt aber keine Success-Bestätigung und aktualisiert die sichtbare Navigation erst nach Reload. Nach Save müssen Success-Dialog und sofortiger Re-Render erfolgen. Restore Defaults ebenso.
5. GPS wurde erneut live geprüft und funktioniert.

### Admin Shell / Navigation

6. Der globale Admin-Header ist redundant und soll entfallen. Jede Seite besitzt bereits ihren eigenen Titel. Theme-Umschaltung kommt links direkt unter `Neutral Administration`/Version und vor Dashboard; Logout kommt als letzter Menüpunkt unten in die Sidebar.
7. Menübezeichnung `Overview · Dashboard` wird auf **Dashboard** reduziert.
8. Der globale Content-/Scrollzustand ist fehlerhaft: Beim Seitenwechsel/Reload liegt der obere Seitenbereich oberhalb des sichtbaren Viewports; Header/Aktionsbuttons wie `New Package` sind erst nach Zurückscrollen sichtbar. Jede Route muss kontrolliert am Seitenanfang starten, ohne den Content unter/über die Navigation zu verschieben.
9. `Apps & Modules` wird nicht nur innerhalb einer Seite gruppiert, sondern als zwei eigenständige Admin-Ziele unter PLATFORM getrennt: **App Modules** und **System Modules**. Frühere Bezeichnung `User Modules` wird zu `App Modules`. Beide verwenden weiterhin dieselbe Registry/Lifecycle-Architektur.

### Dashboard

10. Dashboard bleibt nur als kompakte operative Summary. Der derzeitige `Module Status`-Block wird entfernt; er ist unvollständig/nicht interaktiv und dupliziert Module Administration. `Session Overview` wird ebenfalls entfernt; Sessions besitzen eine eigene Admin-Seite. Summary-Karten dürfen bleiben, sofern sie echte aktuelle Werte liefern.

### Create/Edit UX

11. Das bereits bei User Management funktionierende Muster wird verbindlich für Packages, Licenses/Organizations und Roles: Liste und Create/Edit sind **exklusive Seiten-/View-States**, niemals ein Formular unterhalb der Liste. Save/Cancel/Back führen kontrolliert zur Liste zurück. Keine versteckten Formulare, zu denen erst gescrollt werden muss.
12. Die fachliche Menü-Reihenfolge unter ACCESS soll **Users → Licenses/Organizations → Packages → Sessions → Roles → Permission Catalog** sein, weil Organisations-/Lizenzverwaltung vor nachgelagerten Package-/User-Zuordnungen verständlich erreichbar sein soll. Technische Abhängigkeiten dürfen dadurch nicht verfälscht werden.

### Users / Organizations / Packages

13. User Management Übersicht: E-Mail aus der Tabelle entfernen (bleibt in Edit). Stattdessen **Organization** anzeigen, z. B. `Verein Bonn`, getrennt vom Package-Namen `Verein`. Tabellenüberschriften sollen sortierbar sein, mindestens ID/User, Role, Status, Created, Last Activity, Devices, License/Package und Organization.
14. Default-Device-Anzeige muss aus realen Entitlements stammen. Unassigned User dürfen nicht unerklärlich `5` erhalten. Admin/Developer sollen nur dann Unlimited zeigen, wenn dies tatsächlich aus verbindlicher Policy/Package/User-Override folgt; keine UI-Erfindung. `Package/License default` muss nachvollziehbar auflösen.
15. Package/License Delete-Abhängigkeiten müssen fachlich korrekt und verständlich gemeldet werden. Sessions dürfen nicht irreführend als aktive License-Zuordnung erscheinen. Falls eine Session tatsächlich das Löschen blockiert, muss der Grund ausdrücklich `active session/device` heißen; ansonsten darf sie keine fachliche Package-/License-Referenz vortäuschen.

### Sessions

16. Sessions-Tabelle darf niemals horizontal durch lange IDs zerstört werden. Für die Standardübersicht genügen: **User, Role, Status, Registered, Last Activity**. `Installation / Device ID` wird aus der sichtbaren Tabelle entfernt; sie bleibt intern/audit-/supportseitig verfügbar.
17. `Device Class`, `Operating System` und `Browser` werden nur angezeigt, wenn die Werte server-/clientseitig zuverlässig bestimmt werden können. Der aktuelle Livebefund `Desktop · macOS · Chrome` auf einem iPad/Chrome zeigt, dass Device Class/OS derzeit nicht zuverlässig sind. Keine geratenen Werte und keine falsche Gewissheit; unzuverlässige Felder aus der Standardansicht entfernen bzw. `Unknown` nur dort zeigen, wo Supportdetails ausdrücklich benötigt werden.

### Roles / Permissions

18. Create New Role erhält eine eigene View wie Create User. Modul-Permissions müssen nach Installation/Registrierung des Moduls automatisch im Permission Catalog/Role Management verfügbar sein. Keine manuelle doppelte Anlage. Profile-Permissions sind im aktuellen Livezustand nicht nutzbar, solange Profile-Installation fehlschlägt.

### Database / Backup Feedback

19. `Test Database` braucht neben dem unmittelbaren Success-Dialog einen sichtbaren persistenten letzten Prüfstatus, z. B. `Last database test: successful · timestamp`; Test wird auditiert. Keine falsche Behauptung über dauerhafte DB-Gesundheit aus einem alten Test.
20. Backup `Test path` benötigt deutliches Success/Error-Feedback und einen sichtbaren `Last path test` mit Zeitpunkt/Ergebnis. Das derzeit kaum erkennbare Umschalten von `Ready` zu `Path status: Ready` reicht nicht.

### Module-Livebefund

21. **Profile:** Uninstall → Install endet live mit `Install failed: Internal Server Error`. Nach Reload erscheint teilweise `Registered: Yes`, Lifecycle bleibt `Inactive/Error`. Das ist ein inkonsistenter partieller Installationszustand und muss serverseitig atomar/retry-safe behoben werden. Profile ist NICHT live bestanden.
22. **Media & Upload:** Install → Activate → Deactivate → Uninstall live erfolgreich.
23. **Postbox:** Install → Activate → Deactivate → Uninstall live erfolgreich.
24. **Sharing & Visibility:** Install → Activate → Deactivate → Uninstall live erfolgreich.
25. GPS bleibt aktives Referenzmodul und live funktionsfähig. Field Notes wurde bewusst noch nicht operator-live getestet.

### Bestehende Verträge bleiben verbindlich

26. Module Visibility/Navigation bleibt getrennt von Permissions und Modulklassifikation.
27. `Unlimited` darf nie semantisch zu `0` werden. Der aktuelle Live-Test zeigte weiterhin Device-Limit-/Default-Unklarheiten; deshalb nicht bestanden.
28. Profile bleibt optional; Datenretention bei Deactivate/Re-activate bleibt Ziel.
29. Audit Delete All wurde erneut als grundsätzlich funktional betrachtet; keine erneute Verschärfung.
30. Kein Production Restore als Test. Core Freeze bleibt bis Reparatur + gesammelter Retest offen.

---

**Status:** VERBINDLICHE PRODUKT-/UX-ENTSCHEIDUNGEN FÜR CORE 1.0

## Grundverträge aus früheren Entscheidungen

- Package-Key technische eindeutige Kennung; Package-Name/Beschreibung frei; Status active/inactive; Device Default freie positive Ganzzahl oder unlimited.
- Seats/User limit und Devices per user bleiben getrennt.
- License Manager über User-Auswahl; sichere referenzgeprüfte Delete-Aktionen mit Audit.
- Birthday als Day/Month/Year, kanonisch `YYYY-MM-DD`.
- Audit Delete All: zwei Bestätigungen, danach ein Audit-Clear-Nachweis.
- Persistente Installation-ID bleibt technische Identität, aber nicht notwendiger Bestandteil der Standard-Admin-Tabelle.
- Backup Storage Path konfigurierbar; `NEUTRAL_BACKUP_KEY` bleibt hostlokales Secret.
- Organization Sharing nur bei autoritativ bestätigter Zuordnung.
- Success-Dialog ist gemeinsamer Vertrag für erfolgreiche Save/Create/Update-Aktionen.
- Password visibility verwendet ein gemeinsames Verhalten/ARIA/Icon-Schema.
- Aktivierung eines Moduls impliziert keine User-Navigation.
- Apps/App Modules/System Modules sind Präsentations-/Administrationsgruppierung; eine gemeinsame Runtime bleibt verbindlich.

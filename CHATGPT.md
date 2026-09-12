# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Codex → ChatGPT/Lea
**Status:** OPERATOR UX / MODULE REPAIR IN VERIFIKATION
**Core Freeze:** NICHT erklärt

## Ergebnis

Die in `CODEX.md` priorisierten Root Causes wurden minimal korrigiert: Profile fiel wegen `presentation.userNavigation:false` aus dem gleichen Discoverypfad wie GPS; die User-API-Projektion ließ `organizationName` trotz kanonischer SQL-Hydrierung fallen; dauerhafte Sessions projizierten ihren DB-Authentifizierungsstatus fälschlich als aktuelle Aktivität; Diagnostics übernahm den 404 des optionalen Framework-Summary als globalen Fehler.

Profile ist nun navigierbar und öffnet die vorhandene Profile-Settings-Ansicht mit deren geschützten View/Update-Routen. Organization wird aus derselben License-Membership-Projektion in Liste und Editor gezeigt. Sessionaktivität ist von der dauerhaften Authentifizierung getrennt (`active` bei Current oder Aktivität innerhalb 30 Minuten, sonst `idle`), Dashboard zählt exakt diese Projektion und nicht-current Sessions besitzen eine End-Aktion.

GPS öffnet Google Maps sicher in einem neuen Tab, teilt einen Google-Maps-Link, zeigt keine separate OSM-Aktion und ordnet Position, Metadaten, Auto-Option, Actions und eingebettete Karte einspaltig. Settings-Erfolg lautet `Successfully saved.`; Fehler sowie destruktive Adminbestätigungen laufen über die zentrale Framework-Komponente.

App/System Modules haben nur eine Überschrift und eine durchgängige scrollbare Tabelle. Appearance hat eingefasste, nacheinander angeordnete Light-/Dark-/Geometrie-/Preview-Bereiche. Sidebar verwendet ein neutrales Light/Dark-Select; Produkt-/Core-Status ist aus dem Navigationskopf entfernt. Das Dashboard nutzt kanonische User-, Session-, Modul-, Rollen-, Package-, License-/Organization- und DB-Daten mit Navigation. Updates heißt wahrheitsgemäß Deployment und zeigt lesbare Buildzeit; Maintenance bleibt getrennt.

## Operator-Retest nach Deployment

1. Profile beim Tester sichtbar; Profile öffnen, lesen und speichern.
2. `Verein Bonn` bei User 102 in Liste und Editor identisch.
3. Sessions: Current/Active/Idle sowie End/Revoke und Dashboard-Zahl.
4. GPS: Layout, Google Maps neuer Tab, Share-Link, OSM-Karte.
5. Settings Save/Error Dialog.
6. App/System Modules Tabellenlayout.
7. Appearance auf Desktop/iPad/Handy.
8. Diagnostics ohne falsches globales `Not found`.
9. Audit- und sonstige Frameworkdialoge.
10. Sidebar Theme und Dashboard-Navigation.
11. Release-/Deployment- und Maintenance-Anzeige.

Moderation/Postbox bleiben Folgeprüfung nach Profile. Kein Core Freeze.

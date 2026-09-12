# NEUTRAL – CHATGPT HANDOFF

## 2026-09-12 P0 production catalog repair

The live symptoms were not primarily permissions. The browser could return an anonymous cache online, discard the background result without registry reconciliation, race that request against post-login discovery, and turn request failures into an empty successful catalog. Profile was additionally filtered by package entitlements. The fix makes online discovery authoritative and credentialed, commits only the newest discovery, keeps failures retryable, removes repeated server visibility scans, normalizes authenticated visibility audiences, and exempts Profile through a generic module manifest contract. Production smoke now requires anonymous scope and Server-Timing evidence below ten seconds. Deployment and ordered operator retest remain mandatory; no Core Freeze.


## 2026-09-12 focused repair handoff

The authenticated module-catalog race has been repaired: session restoration now precedes startup discovery, login refreshes discovery, and omitted modules are removed from the browser registry. Profile and Moderation use the same permission-driven visibility path; Moderation now has a real User workspace and protected service self-test. Module details are separate views and consume optional manifest-owned Admin settings generically. Production/operator retest is still required; do not declare Core Freeze yet.

**Richtung:** Codex → ChatGPT/Lea
**Status:** OPERATOR UX / MODULE REPAIR DEPLOYED / OPERATOR RETEST REQUIRED
**Core Freeze:** NICHT erklärt

## Ergebnis

Die in `CODEX.md` priorisierten Root Causes wurden minimal korrigiert: Profile fiel wegen `presentation.userNavigation:false` aus dem gleichen Discoverypfad wie GPS; die User-API-Projektion ließ `organizationName` trotz kanonischer SQL-Hydrierung fallen; dauerhafte Sessions projizierten ihren DB-Authentifizierungsstatus fälschlich als aktuelle Aktivität; Diagnostics übernahm den 404 des optionalen Framework-Summary als globalen Fehler.

Profile ist nun navigierbar und öffnet die vorhandene Profile-Settings-Ansicht mit deren geschützten View/Update-Routen. Organization wird aus derselben License-Membership-Projektion in Liste und Editor gezeigt. Sessionaktivität ist von der dauerhaften Authentifizierung getrennt (`active` bei Current oder Aktivität innerhalb 30 Minuten, sonst `idle`), Dashboard zählt exakt diese Projektion und nicht-current Sessions besitzen eine End-Aktion.

GPS öffnet Google Maps sicher in einem neuen Tab, teilt einen Google-Maps-Link, zeigt keine separate OSM-Aktion und ordnet Position, Metadaten, Auto-Option, Actions und eingebettete Karte einspaltig. Settings-Erfolg lautet `Successfully saved.`; Fehler sowie destruktive Adminbestätigungen laufen über die zentrale Framework-Komponente.

App/System Modules haben nur eine Überschrift und eine durchgängige scrollbare Tabelle. Appearance hat eingefasste, nacheinander angeordnete Light-/Dark-/Geometrie-/Preview-Bereiche. Sidebar verwendet ein neutrales Light/Dark-Select; Produkt-/Core-Status ist aus dem Navigationskopf entfernt. Das Dashboard nutzt kanonische User-, Session-, Modul-, Rollen-, Package-, License-/Organization- und DB-Daten mit Navigation. Updates heißt wahrheitsgemäß Deployment und zeigt lesbare Buildzeit; Maintenance bleibt getrennt.

## Technische Verifikation

Commit `b737e2c` ist auf `main`. Lokal bestanden 546/546 Tests, JS-Syntax, PHP-Lint, Diff-Check und das 134-Datei-Production-Package. CodeQL `34667988356` sowie FTPS Deploy `34667988682` bestanden terminal einschließlich Tests, Production Package, FTPS-Client, Upload und read-only Production Smoke.

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
# Neutral status — offline-first startup recovery

**Stand:** 2026-09-12
**Code status:** Implementiert, lokal verifiziert und über GitHub Actions deployed
**Operator status:** RETEST REQUIRED

GPS wird aus dem generischen, sanitisierten Public/Offline-Aktivierungszustand vor dem ersten Render hydriert. Server-Catalog und Session Restore sind keine Sichtbarkeitsvoraussetzung mehr. Catalog-Sync aktualisiert gezielt Navigation/Settings; Profile und Moderation bleiben permission-sensitiv. Admin-Lifecycle synchronisiert den lokalen Zustand für folgende Starts. Kein Core Freeze.

**Stand:** 2026-09-12
**Code status:** Local implementation and 553-test suite PASS; deployment pending
**Operator status:** **RETEST REQUIRED**

## Proven root causes

`ab3c488` did not prevent the live failure because its online anonymous warmstart returned cached data while the background response was never reconciled, concurrent anonymous/login discoveries could commit out of order, and catalog failures were silently converted to an empty successful discovery. Separately, Profile was removed by commercial package entitlement projection even when its module permissions were valid. Server projection also repeated full module/visibility reads per module and classified custom authenticated roles inconsistently for navigation.

The repaired contract uses one authoritative online request with same-origin credentials, offline-only anonymous fallback, latest-request-wins registry commits, explicit retry errors, stable visibility audiences, and a generic entitlement-exemption manifest flag for account modules. Catalog responses expose bounded scope/timing evidence. Core Freeze is not declared.


**Stand:** 2026-09-12
**Code status:** Implemented; deployment verification pending
**Operator status:** **RETEST REQUIRED**

- Root cause: User bootstrap discovered modules concurrently with session restoration and could consume an anonymous cache that excludes permission-gated Profile/Moderation modules.
- Authenticated discovery, stale-registry reconciliation, Moderation reachability/self-test, dedicated Admin detail views, generic module settings, Settings confirmation timing, and honest GPS location fallback are implemented and behavior-tested.
- Core Freeze remains **not declared** pending production deployment and operator retest.

**Stand:** 2026-09-12
**Code status:** `b737e2c` auf `main`; lokal 546/546, CodeQL `34667988356` und FTPS/read-only Smoke `34667988682` bestanden
**Operator status:** **RETEST REQUIRED**
**Core Freeze:** nicht erklärt

## Implementierter Stand

- Profile ist als User-App-Modul navigierbar und führt berechtigte Benutzer direkt zur vorhandenen, API-gestützten Profile-Ansicht.
- Die Admin-User-Projektion transportiert die kanonische Organization-Zuordnung nun bis in die Übersicht.
- Session-Übersicht und Dashboard verwenden einen gemeinsamen Aktivitätsstatus; dauerhafte, aber seit 30 Minuten nicht gesehene Sessions werden als `idle` statt `active` projiziert und können beendet werden.
- GPS ist einspaltig, teilt Google Maps, öffnet Google Maps sicher in einem neuen Kontext und hält OSM ausschließlich als eingebettete Karte.
- Settings und bestätigungspflichtige Adminaktionen nutzen Frameworkdialoge; native Confirm-/Alert-Fallbacks wurden entfernt.
- Module, Appearance, Diagnostics, Sidebar, Dashboard und Release-/Deployment-Status wurden entsprechend dem aktuellen Operatorvertrag bereinigt.

## Wahrheitsgrenze

Automatisierte Tests und Deployment können die angeordneten realen Operator-Interaktionen nicht ersetzen. Alle Punkte aus `CURRENT-TASK.md` bleiben bis zum Produktionsdeployment und dem geordneten Betreiber-Retest **OPERATOR RETEST REQUIRED**. Moderation/Postbox wurden in diesem Batch nicht fachlich erweitert. Kein Core Freeze.

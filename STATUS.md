# Neutral status — operator UX / module repair

**Stand:** 2026-09-12
**Code status:** lokal in Verifikation
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

# Offline-First Module Startup Design

**Datum:** 2026-09-12
**Status:** vom Betreiber bestätigt
**Autorität:** konkretisiert VISION.md/Architecture.md/CORE-1.0.md für den aktuellen Startup-Recovery-Batch.

## Problem

Mehrere Reparaturversuche am Module-Catalog haben den Produktionsstart nicht stabilisiert. Live zeigt Neutral weiterhin: GPS erscheint anonym erst nach mehreren Sekunden, `Welcome to Neutral` rendert/blinkt mehrfach, nach Login fehlt GPS bis zum manuellen Reload, Profile fehlt trotz Active + Permissions, und Admin/Developer können Module teilweise gar nicht laden. Ein serverautoritativer Online-Katalog vor der sichtbaren GPS-Navigation widerspricht dem Offline-First- und Startperformance-Ziel.

## Verbindliche Entscheidung

### GPS Basismodul

GPS ist das öffentliche Offline-First-Referenzmodul. Wenn GPS administrativ installiert und aktiviert ist, muss seine lokale Client-Oberfläche beim ersten stabilen Rendern sofort verfügbar sein.

Für die Sichtbarkeit/Nutzung des GPS-Basismoduls gelten **keine User-Rollen, User-Permissions, Packages oder Entitlements**. Diese Prüfungen sind aus dem GPS-User-Sichtbarkeitspfad zu entfernen. Admin kontrolliert weiterhin Installation, Aktivierung/Deaktivierung und Modulkonfiguration. Ein administrativ deaktiviertes GPS erscheint nicht.

Die sichtbare GPS-Navigation darf nicht auf Session Restore, Server-Catalog, Permission- oder Entitlement-Requests warten. Kein nachträgliches Einblenden nach 2–4 Sekunden und kein dadurch ausgelöstes mehrfaches Rendering der Startseite.

### Lokaler Modulzustand

Der Client besitzt einen lokal verfügbaren, versionierten Zustand für administrativ aktivierte öffentliche Offline-First-Module. Dieser Zustand ist ausreichend, um GPS beim Start sofort zu registrieren/rendern. Der Serverabgleich erfolgt anschließend im Hintergrund und aktualisiert den lokalen Zustand für folgende Starts bzw. kontrolliert den aktuellen Zustand ohne sichtbares Flackern.

Der lokale Zustand erteilt niemals Serverrechte. Servergeschützte Aktionen bleiben serverseitig autorisiert.

### Authentifizierte Module

Profile, Moderation und andere permission-sensitive Module bleiben im authentifizierten Modulvertrag. Nach Login wird der authentifizierte Katalog im Hintergrund/koordiniert geladen und darf diese Module ergänzen oder entfernen. Ein fehlgeschlagener Request darf nicht als erfolgreicher leerer Katalog behandelt werden.

Profile ist ein Account-Modul und kein kommerzielles Package-Modul. Active + effektive Profile-Permissions müssen nach erfolgreicher authentifizierter Discovery zu einem erreichbaren Profile-Bereich führen.

### Rendering

Die Startseite besitzt einen einzigen stabilen initialen Render. Hintergrundinitialisierung darf gezielt Navigation/Module aktualisieren, aber nicht den gesamten sichtbaren Homepage-/Welcome-Bereich mehrfach neu aufbauen. `Welcome to Neutral` darf beim Modulstart nicht zweimal blinken.

### Cache/Scope

Öffentlicher Offline-First-Modulzustand und authentifizierter permission-sensitiver Katalog sind getrennte Zustände. Authentifizierte Kataloge werden niemals als anonymer/public Offline-Fallback verwendet. Race Conditions werden durch klaren Scope und generation/latest-request-wins verhindert, nicht durch zusätzliche konkurrierende Full-Renders.

## Nichtziele

- keine neue externe GPS-/Google-API;
- keine neuen GPS-Produktvarianten;
- kein `admin sees all`-Hardcode;
- keine Abschaffung serverseitiger Security für geschützte Modulaktionen;
- kein Core Freeze in diesem Batch.

## Erfolgskriterien

1. Frischer anonymer Start: GPS-Navigation sofort beim ersten stabilen Render, ohne Serverroundtrip als Voraussetzung.
2. Kein mehrfaches `Welcome to Neutral`-Blinken.
3. Login Ralf/Tester: GPS bleibt ohne Unterbrechung sichtbar; kein Reload nötig.
4. Developer/Admin: GPS bleibt ebenfalls sichtbar, da GPS-Basis keine User-RBAC-Sichtbarkeit besitzt.
5. Offline-Start mit zuvor aktivem GPS: GPS-Oberfläche erreichbar.
6. Admin deaktiviert GPS; nach sauberer lokaler Zustandsaktualisierung erscheint es nicht mehr.
7. Profile/Moderation bleiben permission-sensitive und werden nicht durch die GPS-Ausnahme öffentlich gemacht.
8. Catalog-Fehler bleibt echter Fehler/retryable und löscht nicht autoritativ die Registry.
9. Keine Regression von Module Details, Save/Back, User Login oder Admin Login.
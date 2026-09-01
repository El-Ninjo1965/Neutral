# NEUTRAL – Roadmap nach Core 1.0

**Status:** ZUKUNFTSPLANUNG  
**Geprüft:** 2026-09-01

Diese Datei enthält keine Abnahmepflichten für [`CORE-1.0.md`](CORE-1.0.md).

## Phase 2: Installierbare Web-App

- PWA-Manifest, Service Worker und kontrollierte Cacheupdates
- Offline-Synchronisation mit Konfliktbehandlung
- Push-Benachrichtigungen, soweit Hosting und Plattform dies erlauben
- reale Geräte- und Browsermatrix

## Phase 3: Store-Apps

- gemeinsame Web-Codebasis in einer gepflegten nativen Hülle
- Android- und iOS-Builds
- native Adapter für Gerätefunktionen
- Store-Signierung, Datenschutzangaben und Releaseprozess
- Produktmodule werden mit Store-Releases ausgeliefert; Rechte, Limits, Daten und Providerkonfiguration bleiben servergesteuert

## Phase 4: Professionelle Serveradapter

- optionale Node.js-Implementierung hinter demselben API-Vertrag
- Queue-Worker, Redis und geplante Jobs
- WebSockets/Echtzeit, wenn ein Produkt sie benötigt
- horizontal skalierbare Storage- und Datenbankadapter
- Observability, zentrale Metriken und Alarmierung

## Kompatibilitätsregel

Professionellere Infrastruktur ersetzt Adapter, nicht die Produktverträge. Client und Module dürfen nicht unnötig von PHP, Node, cPanel oder einem bestimmten Drittanbieter abhängen.

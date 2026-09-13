# NEUTRAL – API

**Status:** VERBINDLICHER DETAILVERTRAG
**Geprüft:** 2026-09-13

Die Produktions-API läuft über den PHP-Router unter `/api/v1`; `/api` bleibt kompatibel. Die Node-Implementierung ist Referenz- und Testpfad.

## Regeln

- User- und Admin-Sessions bleiben getrennt.
- Geschützte Mutationen benötigen CSRF.
- Berechtigungen werden serverseitig geprüft.
- UI-Sichtbarkeit erteilt keine Rechte.
- Schreibende Requests werden nicht blind wiederholt.
- Lokal validierte `publicOffline`-Module dürfen vor einem Server-Catalog-Roundtrip sichtbar sein.

## Modul-API

`GET /api/v1/modules` liefert den sichtbaren Modulkatalog. Admin-Routen verwalten Modulstatus, Permissions und Visibility. Fachliche Modulrouten laufen über `/api/v1/modules/<module-id>/<route>` und verwenden den validierten Modulvertrag.

## Admin-API

Geschützte API-Gruppen bestehen für Benutzer, Rollen, Permissions, Sessions, Settings, Audit, Module, Systemdiagnostik, Server/Datenbank, Connections/Providers, Release/Maintenance, Packages, Licenses, Installationsmetriken sowie Backup/Restore.

## Account und Geräte

Direktes und effektives Package werden getrennt projiziert. Eine aktive License-Mitgliedschaft bestimmt das effektive Package; danach greift ein direktes User-Package wieder.

Device-Limits unterscheiden Default, positiven numerischen Override und `unlimited`. Unlimited darf nicht als `0` dargestellt werden. Ein abgesenktes Limit widerruft bestehende Sessions nicht automatisch.

## Backup

Backup-/Restore-Endpunkte decken List/Create, Storage-Test/-Konfiguration, Download, Upload und Restore ab. Der vollständige Vertrag steht in `BACKUP-CONTRACT.md`.

## Erweiterung

Neue Core-Endpunkte benötigen Vertrag, Berechtigungsentscheidung, Validierung, definierte Fehler, Daten-/Transaktionskonzept und Tests.

Aktueller Live-/Fehlerstand steht ausschließlich in `STATUS.md` und `CHATGPT.md`.
# NEUTRAL – Core 1.0

**Status:** VERBINDLICHER RELEASEVERTRAG  
**Geprüft:** 2026-09-01  
**Fortschritt:** siehe [`STATUS.md`](STATUS.md)

## Ziel

Neutral Core 1.0 ist ein wiederverwendbares, fachneutrales Fundament für Web- und spätere Store-Apps. Es umfasst einen Client-Core, einen PHP-Server-Core, einen geschützten Admin-Bereich und einen stabilen Vertrag für Produktmodule.

Core 1.0 ist fertig, wenn eine neue Produkt-App auf leerem kompatiblem Shared Hosting installiert, konfiguriert, betrieben, gesichert, aktualisiert und auf einen anderen Server übertragen werden kann, ohne den Core für jedes Produkt neu zu entwickeln.

## Verbindliche Mindestplattform

- PHP 8.1+
- MySQL oder MariaDB über PDO
- HTTPS
- Apache/LiteSpeed-kompatibles Routing oder gleichwertige Hostkonfiguration
- normale Lese-/Schreibrechte eines Shared-Hosting-Pakets
- optionaler Hosting-Cron für zeitversetzte Arbeit

Node.js ist weder Installations- noch Laufzeitvoraussetzung. Eine spätere Node-Implementierung muss denselben versionierten API-Vertrag erfüllen.

## Releaseumfang

### Installation und Portabilität

- Setup auf leerem Webspace einschließlich Voraussetzungen, Konfiguration, Datenbank, Migration und Erstbenutzer.
- Hostlokale Secrets außerhalb von Repository und öffentlichen Clientdateien.
- Zentrale, dokumentierte Konfiguration für App- und API-Adressen.
- Reproduzierbares Installationspaket sowie dokumentierter Backup-, Restore- und Umzugsablauf.

### Client-Core

- versionierter öffentlicher Core-Vertrag,
- stabile Events und Services,
- zentrale API-Kommunikation mit Timeout und kontrollierten Fehlern,
- lokale, modulgetrennte Speicherung,
- responsive Browseroberfläche und definierter Offlinezustand,
- keine serverseitigen Secrets oder Rechteentscheidungen im Client.

### PHP-Server-Core und Admin

- Login, Logout, Sessions, CSRF und serverseitige Autorisierung,
- Benutzer-, Rollen- und Rechteverwaltung,
- Modulverwaltung, Moduleinstellungen und Audit,
- System-, Datenbank- und Migrationsstatus ohne Secret-Leaks,
- sichere, versionierte JSON-API,
- Login-Drosselung und produktiv überprüfte Cookie-/HTTPS-Einstellungen.

### Module

- versioniertes Manifest und Kompatibilitätsprüfung,
- Discovery, Installation im inaktiven Zustand, Aktivierung, Deaktivierung, Update und Deinstallation,
- modulbezogene Rollenrechte und serverseitig erzwungene Mengenlimits,
- allgemeine PHP-Routen und Services je Modul ohne Änderung des zentralen Routers,
- versionierte SQL-Migrationen mit Fehler- und Rollbackstrategie,
- deklarative Admin-Einstellungen,
- serverseitige Provideradapter mit geschützter Secret-Verwaltung,
- Nachweis der Allgemeingültigkeit durch mindestens zwei fachlich verschiedene Referenzmodule.

### Betrieb und Qualität

- automatisierte positive und negative Tests der sicherheitsrelevanten Verträge,
- Neuinstallations-, Update-, Backup-/Restore- und Umzugstest,
- keine bekannten kritischen oder hohen Sicherheitsfehler,
- konsistente Dokumentation gemäß [`DOCUMENTATION.md`](DOCUMENTATION.md).

## Bewusste Nichtziele von Core 1.0

- Node.js als verpflichtender Produktionsserver,
- Redis, WebSockets oder permanente Queue-Worker,
- App-Store-Veröffentlichung,
- vollständige native Geräteadapter,
- unbegrenzte Skalierung oder Microservices,
- dynamischer Download nicht geprüften ausführbaren Modulcodes aus dem Internet.

Diese Ziele dürfen später ergänzt werden, ohne die PHP-Referenzimplementierung oder den öffentlichen API-Vertrag unnötig zu brechen. Sie stehen in [`ROADMAP.md`](ROADMAP.md).

## Abnahmeentscheidung

Core 1.0 erhält den Status **BESTANDEN** ausschließlich, wenn alle Releaseanforderungen entweder nachweislich `VORHANDEN` sind oder ausdrücklich aus diesem Vertrag entfernt wurden. `TEILWEISE`, `GEPLANT`, `FEHLT` und `BLOCKIERT` reichen für die finale Abnahme nicht aus.

## Fachlicher Core-Freeze

Nach dem Core-1.0-Freeze werden normale Produktfähigkeiten ausschließlich als Module umgesetzt. Ein Modul muss über deklarierte Manifeste und die vorhandenen generischen Verträge vollständig entdeckt, registriert, installiert, migriert, berechtigt, aktiviert/deaktiviert sowie in User-UI und Modul-API eingebunden werden können, ohne fachlichen Code in bestehenden Core-Dateien oder im zentralen PHP-Router zu ergänzen.

Jeder spätere Wunsch nach einer Core-Änderung durchläuft vor Implementierung diese Entscheidung:

1. Kann das Ziel mit dem dokumentierten Manifest-, Lifecycle-, Service-, Route-, Permission-, Settings-, Event- oder Storagevertrag umgesetzt werden, gehört es ins Modul.
2. Fehlt nach einem ausführbaren neutralen Referenzfall eine allgemein nutzbare Frameworkfähigkeit, darf ein kleiner, versionierter und getesteter Extension Point vorgeschlagen werden.
3. Security-, Runtime-, Browser- und Datenbankkompatibilitätskorrekturen sowie echte Frameworkfehler bleiben zulässige Core-Arbeit.
4. Produktnamen, Produktworkflows und vorsorgliche Hooks sind kein zulässiger Core-Grund.

Der aktuelle Audit der fachlich verschiedenen Referenzen `gps` und `reference-notes` belegt Discovery, Cliententry, serverseitige Services/Routen, Permissions, Limits, Settings, Migration und Lifecycle bereits ohne fachlichen Routerzweig. Es wurde daher vor dem Freeze keine weitere generische Schnittstelle auf Vorrat ergänzt.

Der reale Tablet-Retest belegte als einzige zusätzliche generische UI-Lücke ein responsives Content-Card/Grid-System. Der zentrale `.user-content-grid`-Vertrag wurde deshalb vor dem Freeze ergänzt und steht allen Modulen zur Verfügung; GPS verwendet nur einen neutralen Proportionsmodifier. Dies ist kein neuer fachlicher Hook.

## Account/license freeze audit – 2026-09-09

The evidenced pre-freeze gaps now have generic contracts: account/profile/privacy, exact password policy, configurable entitlements/licenses, scoped organization administration, installation device limits, module available/locked/hidden projection, server-seen installation metrics, responsive Settings/Profile, and moderated user-media storage. Marketplace, Messaging, Community, GPS Pro and CatchTrack logic remain outside Core. Normal future product features must be implemented as modules without changing these Core files.
## Pre-freeze modularity boundary

The 1.0 Core contract includes module lifecycle/registry, identity/auth/permissions, generic settings/storage/events/routing/theme/security/API and generic backup discovery. Concrete profile, content, sharing, review, notification and messaging behavior is outside Core. See `SYSTEM-MODULES.md`. Existing Profile code is a migration compatibility bridge, not the target frozen boundary.

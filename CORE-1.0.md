# NEUTRAL – Core 1.0

**Status:** VERBINDLICHER RELEASEVERTRAG  
**Geprüft:** 2026-09-01  
**Fortschritt:** siehe [`STATUS.md`](STATUS.md)

## Ziel

Neutral Core 1.0 ist ein wiederverwendbares, fachneutrales Fundament für Web- und spätere Store-Apps. Es umfasst einen Client-Core, einen PHP-Server-Core, einen geschützten Admin-Bereich und einen stabilen Vertrag für Produktmodule.

Core 1.0 ist fertig, wenn eine neue Produkt-App auf leerem kompatiblem Shared Hosting installiert, konfiguriert, betrieben, gesichert, aktualisiert und auf einen anderen Server übertragen werden kann, ohne den Core für jedes Produkt neu zu entwickeln.

## Verbindliche Mindestplattform

- PHP 8.x
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

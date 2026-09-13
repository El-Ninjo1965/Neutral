# NEUTRAL – Core 1.0

**Status:** VERBINDLICHER RELEASEVERTRAG  
**Geprüft:** 2026-09-13  
**Core Freeze:** NICHT erklärt  
**Fortschritt:** siehe [`STATUS.md`](STATUS.md)

## Ziel

Neutral Core 1.0 ist ein wiederverwendbares, fachneutrales Fundament für Web- und spätere Store-Apps. Es umfasst Client-Core, PHP-Server-Core, geschützten Admin-Bereich und einen stabilen Vertrag für Produktmodule.

Core 1.0 ist fertig, wenn eine neue Produkt-App auf kompatiblem Shared Hosting installiert, konfiguriert, betrieben, gesichert, aktualisiert und auf einen anderen Server übertragen werden kann, ohne den Core für jedes Produkt neu zu entwickeln.

## Verbindliche Mindestplattform

- PHP 8.1+
- MySQL oder MariaDB über PDO
- HTTPS
- Apache/LiteSpeed-kompatibles Routing oder gleichwertige Hostkonfiguration
- normale Lese-/Schreibrechte eines Shared-Hosting-Pakets
- optionaler Hosting-Cron

Node.js ist weder Installations- noch Laufzeitvoraussetzung. Eine spätere Node-Implementierung muss denselben versionierten API-Vertrag erfüllen.

## Releaseumfang

### Installation und Portabilität

- Setup auf leerem Webspace einschließlich Voraussetzungen, Konfiguration, Datenbank, Migration und Erstbenutzer
- hostlokale Secrets außerhalb von Repository und öffentlichen Clientdateien
- zentrale Konfiguration für App- und API-Adressen
- reproduzierbares Installationspaket und dokumentierter Backup-/Restore-/Umzugsablauf

### Client-Core

- versionierter öffentlicher Core-Vertrag
- stabile Events und Services
- zentrale API-Kommunikation mit Timeout und kontrollierten Fehlern
- lokale modulgetrennte Speicherung
- responsive Browseroberfläche und definierter Offlinezustand
- keine serverseitigen Secrets oder endgültigen Rechteentscheidungen im Client

### Public/Offline-Modulprojektion

Core besitzt einen generischen `publicOffline`-Manifestvertrag. Eine versionierte, auf feste Metadaten reduzierte lokale Aktivierungsprojektion wird in dieselbe Registry hydriert; sie ist keine zweite Modullaufzeit. Sie darf öffentliche Module beim ersten stabilen Render verfügbar machen, ohne einen Serverroundtrip abzuwarten. Online-Synchronisierung aktualisiert den autoritativen Aktivierungsstand im Hintergrund. Permission-sensitive Module und Serveraktionen bleiben außerhalb dieses lokalen Vertrauensbereichs. GPS ist Referenz, aber der Core enthält dafür keinen GPS-Sonderpfad.

### PHP-Server-Core und Admin

- Login, Logout, Sessions, CSRF und serverseitige Autorisierung
- Benutzer-, Rollen- und Rechteverwaltung
- Modulverwaltung, Moduleinstellungen und Audit
- System-, Datenbank- und Migrationsstatus ohne Secret-Leaks
- sichere versionierte JSON-API
- Login-Drosselung und sichere Cookie-/HTTPS-Einstellungen

### Module

- versioniertes Manifest und Kompatibilitätsprüfung
- Discovery, Installation im inaktiven Zustand, Aktivierung, Deaktivierung, Update und Deinstallation
- modulbezogene Rollenrechte und serverseitig erzwungene Limits
- allgemeine PHP-Routen und Services je Modul ohne fachlichen zentralen Routerzweig
- versionierte SQL-Migrationen mit Fehler-/Rollbackstrategie
- deklarative Admin-Einstellungen
- serverseitige Provideradapter mit geschützter Secret-Verwaltung
- Nachweis der Allgemeingültigkeit durch fachlich verschiedene Referenzmodule

Optionale System-/Fachmodule sind keine vollständigen Core-Produkte. Core schuldet deren generische Lifecycle-, Sicherheits-, API-, Storage-, UI- und Backup-Verträge. Eine tatsächlich systemnotwendige Fähigkeit muss als Core-/Required-Funktion modelliert werden und darf nicht als scheinbar optionales Modul auftreten.

### Betrieb und Qualität

- automatisierte positive und negative Tests sicherheitsrelevanter Verträge
- Neuinstallations-, Update-, Backup-/Restore- und Umzugstest
- keine bekannten kritischen oder hohen Sicherheitsfehler
- konsistente Dokumentation gemäß [`DOCUMENTATION.md`](DOCUMENTATION.md)

## Bewusste Nichtziele von Core 1.0

- Node.js als verpflichtender Produktionsserver
- Redis, WebSockets oder permanente Queue-Worker
- App-Store-Veröffentlichung
- vollständige native Geräteadapter
- unbegrenzte Skalierung oder Microservices
- dynamischer Download nicht geprüften ausführbaren Modulcodes aus dem Internet
- vollständige Fachimplementierung optionaler Profile-, Media-, Sharing-, Moderation-, Notification-, Postbox-, Community- oder Referral-Module

Spätere Ziele stehen in [`ROADMAP.md`](ROADMAP.md).

## Abnahmeentscheidung

Core 1.0 erhält **BESTANDEN** ausschließlich, wenn alle Releaseanforderungen nachweislich vorhanden oder ausdrücklich aus diesem Vertrag entfernt wurden. `TEILWEISE`, `GEPLANT`, `FEHLT` und `BLOCKIERT` reichen für finale Abnahme nicht aus.

Der aktuelle technische und reale Abnahmestand wird nicht in diesem Vertrag fortgeschrieben, sondern ausschließlich in `STATUS.md`, `CURRENT-TASK.md` und `CHATGPT.md`. Ein Core Freeze wird niemals automatisch aus Code, Tests, CI oder Deployment abgeleitet; er benötigt eine separate ausdrückliche Entscheidung nach den erforderlichen Architektur- und Live-Gates.

## Fachlicher Core-Freeze

Nach dem Freeze werden normale Produktfähigkeiten ausschließlich als Module umgesetzt. Ein Modul muss über deklarierte Manifeste und generische Verträge entdeckt, registriert, installiert, migriert, berechtigt, aktiviert/deaktiviert sowie in User-UI und Modul-API eingebunden werden können, ohne produktspezifischen Code in bestehenden Core-Dateien oder dem zentralen PHP-Router zu ergänzen.

Jeder spätere Wunsch nach einer Core-Änderung durchläuft diese Entscheidung:

1. Kann das Ziel mit Manifest-, Lifecycle-, Service-, Route-, Permission-, Settings-, Event- oder Storagevertrag umgesetzt werden, gehört es ins Modul.
2. Fehlt nach einem ausführbaren neutralen Referenzfall eine allgemein nutzbare Frameworkfähigkeit, darf ein kleiner versionierter und getesteter Extension Point vorgeschlagen werden.
3. Security-, Runtime-, Browser- und Datenbankkompatibilitätskorrekturen sowie echte Frameworkfehler bleiben zulässige Core-Arbeit.
4. Produktnamen, Produktworkflows und vorsorgliche Hooks sind kein zulässiger Core-Grund.

`gps` und `field-notes` dienen als fachlich unterschiedliche Referenzen für die generische Modularchitektur. Der verbindliche Zielvertrag optionaler Module steht in `SYSTEM-MODULES.md`.
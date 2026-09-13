# NEUTRAL – Vision

**Status:** AKTUELLER VERBINDLICHER ZIELVERTRAG  
**Stand:** 2026-09-13

## Zweck

NEUTRAL ist ein fachneutrales, modulares Framework für mobile-first Web-Apps und spätere Store-Apps. Der Core enthält ausschließlich wiederverwendbare technische Mechanismen. Fachfunktionen gehören in Module.

## Systemgrenze

NEUTRAL besteht aus:

1. **Web-App** – Client-Core, Shell, lokale Speicherung, Offline-Funktionen und Module.
2. **Server** – Authentifizierung, Autorisierung, zentrale Persistenz, Administration und geschützte APIs.
3. **Datenbank** – ausschließlich über den Server erreichbar.

```text
Web-App → HTTPS/API → Server → MySQL/MariaDB
```

Der Client erteilt keine Serverrechte. Secrets bleiben serverseitig und außerhalb ausgelieferter Dateien.

## Minimaler Core

Der Core stellt generische Mechanismen bereit für:

- Initialisierung und Lifecycle;
- Events und Services;
- Konfiguration;
- lokale Speicherung und IndexedDB;
- Online-/Offline-Erkennung;
- API-Kommunikation;
- Authentifizierungs- und Benutzerkontext;
- Rollen-/Permission-Schnittstellen;
- Fehlerbehandlung und Diagnostik;
- Modul-Discovery, Registry und Lifecycle;
- zentrale UI-, Theme- und I18N-Grundlagen;
- sichere serverseitige Modul-, Storage-, Backup- und Migrationsverträge.

Profile, Media, Sharing, Notifications, Moderation, Postbox, Community, GPS und Fachfunktionen sind keine Core-Fachlogik.

## Module

Normale App- und Systemmodule sind optional und unabhängig. Ein fehlendes oder deaktiviertes optionales Modul darf Core und unabhängige Module nicht beschädigen.

- App Modules und System Modules verwenden dieselbe Runtime.
- `category` klassifiziert nur; sie erzeugt keine zweite Architektur.
- Harte Dependencies zwischen optionalen Modulen sind Ausnahmefälle.
- Optionale Erweiterungen verwenden Capability Detection und Fallbacks.
- Der verbindliche technische Modulvertrag steht in `ModuleCreation.md`.

## Offline-First und Start

Verbindliche Startreihenfolge:

```text
UI zuerst → minimal notwendiger Core → Hintergrundinitialisierung
```

Ein aktives `publicOffline`-Modul kann aus einer versionierten, sanitisierten lokalen Aktivierungsprojektion bereits beim ersten stabilen Render verfügbar sein. Diese Projektion ist keine zweite Runtime und enthält keine Session-, Permission- oder sonstigen Geheimnisse.

GPS ist das aktuelle öffentliche Offline-Referenzmodul. Seine lokale Basisfunktion hängt nicht von User-Rolle, User-Permission, Package oder Entitlement ab. Administrative Aktivierung bleibt autoritativ und wird im Hintergrund synchronisiert.

Permission-sensitive Module wie Profile oder Moderation werden nicht als öffentlicher Offline-Fallback behandelt. Lokaler Zustand erteilt niemals Serverrechte.

## Mobile-First

Primäre Zielgeräte sind Android-Telefone, iPhone, iPad und Tablets. Desktop bleibt unterstützt. Bedienung erfolgt touchfreundlich und plattformneutral über Capability Detection statt Browser-/OS-Sondercode.

## Server und Portabilität

Core 1.0 muss auf normalem Shared Hosting funktionieren:

- PHP 8.1+;
- MySQL/MariaDB über PDO;
- HTTPS;
- Apache/LiteSpeed-kompatibles Routing.

Node.js, Redis, WebSockets, SSH oder permanente Worker sind keine Produktionsvoraussetzung. Infrastrukturdetails bleiben konfigurierbar, damit ein späterer Hostingwechsel keinen fachlichen Core-Umbau erfordert.

## Sicherheit und Datenschutz

- endgültige Identitäts- und Rechteentscheidung ausschließlich serverseitig;
- HTTPS, sichere Sessions, CSRF, Eingabevalidierung und parametrisierte DB-Zugriffe;
- keine Secrets im Client oder Repository;
- Datenminimierung und nachvollziehbare Auditdaten;
- zufällige persistente Installations-ID statt Hardwarefingerprint;
- lokale Daten verleihen keine Serverautorität.

## Rollen, Permissions, Pakete und Lizenzen

Diese Konzepte bleiben getrennt:

- **Rolle** – administrative/sicherheitstechnische Identität;
- **Permission** – technische Fähigkeit;
- **Paket/Entitlement** – kommerzielle oder organisatorische Freischaltung und Limits;
- **Lizenz/Organisation** – besitzt Paket, Seats, Geräte und Nutzer innerhalb ihres Scopes.

Ein Organisationsverwalter erhält dadurch keine System-Adminrechte.

## GPS als Referenzmodul

GPS ist keine Core-Funktion, sondern Referenz für Gerätezugriff, Offline-Verhalten, Modul-Lifecycle und plattformneutrale UI. GPS-spezifische Daten und Regeln bleiben im Modul.

Eine vorhandene lokale Position kann sofort angezeigt werden. Eine neue Positionsabfrage darf beim Öffnen automatisch erfolgen, wenn die Browserberechtigung bereits besteht; eine erstmalige Berechtigungsanforderung benötigt eine ausdrückliche Benutzeraktion.

## Qualitätsregel

Aktive Dokumentation beschreibt nur den aktuellen Vertrag, aktuellen belegten IST-Stand oder weiterhin gültige Anforderungen. Abgeschlossene Reparaturgeschichten, alte Architekturvarianten und frühere Zwischenstände gehören nicht in aktive Vertragsdateien.

Eine Fähigkeit gilt erst als tragfähig, wenn ihr Vertrag dokumentiert, relevante Fehlerfälle definiert und erforderliche Tests einschließlich angeordneter Operator-Livetests bestanden sind.

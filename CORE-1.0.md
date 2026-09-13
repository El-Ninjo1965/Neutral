# NEUTRAL – Core 1.0

**Status:** VERBINDLICHER RELEASEVERTRAG – NOCH NICHT EINGEFROREN  
**Stand:** 2026-09-13  
**Fortschritt:** siehe `STATUS.md`

## Ziel

Neutral Core 1.0 ist ein wiederverwendbares, fachneutrales Fundament für Web- und spätere Store-Apps. Es umfasst Client-Core, PHP-Server-Core, geschützten Admin-Bereich und stabile Verträge für optionale Produktmodule.

Core 1.0 ist fertig, wenn eine neue Produkt-App auf kompatiblem leerem Shared Hosting installiert, konfiguriert, betrieben, gesichert, aktualisiert und übertragen werden kann, ohne den Core für das Produkt fachlich umzubauen.

## Mindestplattform

- PHP 8.1+
- MySQL/MariaDB über PDO
- HTTPS
- Apache/LiteSpeed-kompatibles Routing oder gleichwertige Hostkonfiguration
- normale Shared-Hosting-Lese-/Schreibrechte
- optional Hosting-Cron

Node.js ist keine Installations- oder Produktionsvoraussetzung.

## Releaseumfang

### Installation und Portabilität

- Setup auf leerem Webspace einschließlich Konfiguration, Datenbank, Migration und Erstbenutzer;
- hostlokale Secrets außerhalb von Repository und Clientdateien;
- zentrale App-/API-Konfiguration;
- reproduzierbares Produktionspaket;
- dokumentierter Backup-, Restore- und Umzugsablauf.

### Client-Core

- versionierter öffentlicher Core-Vertrag;
- stabile Events und Services;
- zentrale API-Kommunikation mit Timeout und kontrollierten Fehlern;
- lokale, modulgetrennte Speicherung;
- responsive mobile-first Oberfläche;
- Offlinezustand und `publicOffline`-Projektion;
- keine serverseitigen Secrets oder Rechteentscheidungen im Client.

### Public/Offline Module

Der Core besitzt einen generischen `publicOffline`-Manifestvertrag. Die lokale Projektion ist versioniert, sanitisiert und auf öffentliche Modulmetadaten begrenzt. Sie wird in dieselbe ModuleRegistry hydriert und bildet keine zweite Runtime.

Online-Synchronisierung aktualisiert den autoritativen Lifecycle. Permission-sensitive Module und Serveraktionen bleiben außerhalb dieses lokalen Vertrauensbereichs. GPS ist das aktuelle Referenzmodul dieses Vertrags.

### PHP-Server-Core und Admin

- Login, Logout, Sessions, CSRF und serverseitige Autorisierung;
- Benutzer-, Rollen- und Permissionverwaltung;
- Modulverwaltung und Moduleinstellungen;
- Audit, Diagnose, System-, Datenbank- und Migrationsstatus ohne Secret-Leaks;
- sichere versionierte JSON-API;
- Login-Drosselung und sichere Produktionskonfiguration.

### Modulvertrag

Der Core stellt generisch bereit:

- Manifest und Kompatibilitätsprüfung;
- Discovery und Registration/Installation;
- Inactive/Active Lifecycle;
- Aktivierung und Deaktivierung;
- Update und Deinstallation;
- Permissions und serverseitige Mengenlimits;
- allgemeine Modulrouten und Services ohne fachlichen zentralen Routerzweig;
- versionierte SQL-Migrationen;
- deklarative Settings;
- Provider-/Secret-Grenzen;
- UI-, Theme-, I18N-, Storage-, Event- und Backup-Verträge.

Normale App- und Systemmodule sind optional. Harte Abhängigkeiten zwischen optionalen Modulen sind Ausnahmefälle und benötigen Architekturprüfung. Der detaillierte Vertrag steht in `ModuleCreation.md`.

### Betrieb und Qualität

- automatisierte positive und negative Vertragstests;
- Syntax-/Lint-/Build-/Package-Prüfungen;
- Installations-, Update-, Backup-/Restore- und Umzugstests;
- keine bekannten kritischen oder hohen Sicherheitsfehler;
- konsistente aktuelle Dokumentation;
- erforderliche reale Operator-Livetests vor endgültiger Abnahme.

## Nichtziele von Core 1.0

- Node.js als verpflichtender Produktionsserver;
- Redis, WebSockets oder permanente Worker;
- App-Store-Veröffentlichung;
- vollständige native Geräteadapter;
- Microservice-Architektur;
- dynamischer Download ungeprüften ausführbaren Modulcodes;
- vollständige Fachprodukte wie Profile, Media, Moderation, Messaging, Community, Marketplace oder GPS Pro.

## Core-Freeze

Core 1.0 ist aktuell **nicht eingefroren**.

Der Freeze erfolgt erst nach technischer Abnahme und ausdrücklich erforderlichen Operator-Livetests. Offene aktuelle Punkte stehen ausschließlich in `STATUS.md`/`CHATGPT.md`, nicht als historische Fehlerliste in diesem Releasevertrag.

Nach dem Freeze gilt:

1. normale Produktfähigkeiten werden als Module umgesetzt;
2. eine Core-Änderung ist nur zulässig, wenn eine nachweislich allgemeine Frameworkfähigkeit fehlt oder ein echter Security-/Runtime-/Kompatibilitätsfehler vorliegt;
3. produktbezogene Sonderlogik, vorsorgliche Hooks und versteckte Modulabhängigkeiten sind kein Core-Grund;
4. Erweiterungen verwenden die veröffentlichten Manifest-, Lifecycle-, Service-, Route-, Permission-, Settings-, Event-, Storage- und UI-Verträge.

## Abnahme

Core 1.0 erhält den Status **BESTANDEN** nur, wenn alle Anforderungen dieses Dokuments nachweislich erfüllt oder ausdrücklich aus dem Releaseumfang entfernt wurden. Historische Zwischenstände und abgeschlossene Fehler sind keine Abnahmekriterien.

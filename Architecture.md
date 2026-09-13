# NEUTRAL – Architektur

**Status:** AKTUELLER TECHNISCHER VERTRAG  
**Stand:** 2026-09-13  
**Autorität:** `VISION.md` → `CORE-1.0.md` → diese Datei / `ModuleCreation.md`

## 1. Systemgrenze

```text
Mobile-first Web-App
        ↓ HTTPS/JSON
PHP-Server als Vertrauensgrenze
        ↓ PDO
MySQL/MariaDB
```

Web-App, Server und Datenbank sind getrennte Schichten. Die Web-App greift nie direkt auf die Serverdatenbank zu. Infrastrukturdetails werden über Konfiguration und Adapter entkoppelt.

## 2. Repositorystruktur

```text
Neutral/
├── Web-App/
│   ├── app/       # App-Shell und Module
│   ├── apps/      # App-Metadaten
│   ├── core/      # Browser-Core
│   └── public/    # User-/Admin-UI und Assets
├── Server/
│   ├── php/       # produktiver PHP-Core
│   ├── public/    # produktive Entrypoints/API
│   └── node/      # Entwicklung/Testreferenz
├── tests/
└── scripts/
```

Node ist keine Produktionsvoraussetzung.

## 3. Browser-Core

Der Browser-Core stellt generische Fähigkeiten bereit:

- Lifecycle und Initialisierung;
- Event-Bus und begrenzte Eventhistorie;
- Konfiguration;
- lokale Storage-/IndexedDB-Abstraktionen;
- Netzwerkstatus;
- Fehlerbehandlung/Logging;
- Service-Registry;
- Auth-/User-/Access-/Context-Fassaden;
- Module Interface, Registry, Manager und Loader;
- zentrale UI-, Theme- und I18N-Grundlagen.

Der Core enthält keine Fachlogik normaler Module.

## 4. Modulruntime

Clientseitig bilden `module-interface.js`, `module-registry.js`, `module-manager.js` und `core-loader.js` den generischen Modulpfad.

Verbindlich:

- Discovery, Registration/Installation und Activation sind getrennte Zustände;
- App Modules und System Modules verwenden dieselbe Runtime;
- `category: user|system` ist nur Klassifikation;
- `presentation` steuert Darstellung/Navigation, nicht Serverrechte;
- normale optionale Module dürfen Core oder unabhängige Module nicht voraussetzen;
- harte Dependencies sind Ausnahmefälle;
- optionale Enhancements verwenden `optionalDependencies`, Capability Detection und Fallback;
- Details siehe `ModuleCreation.md`.

## 5. Public/Offline-Start

Ein `publicOffline`-Modul kann aus einer versionierten, sanitisierten lokalen Projektion vor dem ersten stabilen User-Render in dieselbe ModuleRegistry hydriert werden.

Die Projektion:

- enthält nur erlaubte öffentliche Modulmetadaten;
- enthält keine Session-, User-Permission-, Package- oder Secret-Daten;
- ist keine zweite Runtime;
- verleiht keine Serverrechte;
- wird durch spätere autoritative Server-Synchronisierung aktualisiert.

GPS ist das aktuelle Referenzmodul. Permission-sensitive Module wie Profile und Moderation bleiben außerhalb dieses öffentlichen Offline-Vertrauensbereichs.

## 6. User-App Start und Rendering

Verbindliche Reihenfolge:

```text
Shell/UI → minimal notwendiger lokaler Zustand → Hintergrundinitialisierung
```

Homepage, Session-Restore und Modul-Discovery sind getrennte Pfade. Ein Fehler eines Pfads darf die anderen nicht unnötig blockieren.

Hintergrund-Discovery darf den stabilen sichtbaren Zustand nicht durch unnötige Full-Renders zurücksetzen. Navigation-State, aktive View und gerenderter Content müssen konsistent bleiben.

## 7. Homepage und Appearance

- Homepage ist zentral konfiguriertes vertrauenswürdiges Admin-HTML oder ein startbares Modul.
- öffentliche Homepage-Projektion wird unabhängig von geschützten Adminsettings gelesen;
- versionierter lokaler Homepagecache darf einen Warmstart ermöglichen;
- Sessionidentitäten und permission-sensitive Kataloge gehören nicht in diesen Cache;
- User- und Admin-Theme sind getrennte Zustände;
- Framework und Module verwenden zentrale semantische CSS-Tokens;
- Module bauen keine eigene parallele Theme-Infrastruktur.

## 8. PHP-Server

`Server/php/bootstrap.php` erzeugt die produktive Laufzeit. Der Server stellt unter anderem bereit:

- Authentifizierung, Sessions und CSRF;
- Rollen und Permissions;
- Modul-Lifecycle;
- Settings;
- Audit und Diagnostik;
- Datenbank/Migrationen;
- Backup-/Restore-Verträge;
- geschützte Modulrouten und Services.

`Server/public/api/index.php` ist der zentrale API-Einstieg. `Server/public/admin.php` schützt den Adminbereich serverseitig.

## 9. Server-Modulvertrag

Der Server lädt Modulcode ausschließlich aus geschützten Modulpfaden. Generische Verträge prüfen:

- Manifest-/Core-Kompatibilität;
- Modulidentität und Eigentum;
- aktiven Lifecycle;
- Authentifizierung;
- Permission;
- CSRF bei Mutationen;
- Mengenlimits;
- versionierte Migrationen und Checksums;
- sichere Update-/Uninstall-Bedingungen.

Fachmodule benötigen keinen eigenen Zweig im zentralen Router.

## 10. API und Sicherheit

Browserzugriffe verwenden den zentralen API-Client und Same-Origin-Sessions. Zustandsändernde Requests tragen CSRF. Der Server bleibt die endgültige Autorität für Identität, Permission, Entitlement und Datenzugriff.

Client-Sichtbarkeit ist niemals Autorisierung.

## 11. Deployment und Portabilität

Produktionsziel ist PHP 8.1+ mit MySQL/MariaDB auf normalem HTTPS-Shared-Hosting. `Web-App/` und `Server/` bleiben getrennte Komponenten im Deployment. Öffentliche Pfade werden über die Host-/Rewrite-Konfiguration abgebildet; PHP-Core, Runtimezustände und Secrets sind nicht öffentlich zugänglich.

Das Produktionspaket und statische Assets verwenden Deployment-/Revision-Metadaten, damit gemischte alte/neue Browsercaches vermieden werden.

## 12. UI-Vertrag

Framework- und Moduloberflächen verwenden gemeinsame Komponenten/Tokens für:

- Navigation;
- Buttons und Formulare;
- Dialoge/Success/Error Feedback;
- Tabellen und Content-Layout;
- Light/Dark;
- responsive Touch-Bedienung.

Module sollen UI-Verhalten nicht lokal duplizieren, wenn ein zentraler Vertrag existiert.

## 13. Aktuelle Architekturgrenze

Noch nicht vollständig vorhandene allgemeine Fähigkeiten werden als offene Arbeit dokumentiert, nicht durch produktspezifische Core-Hacks ersetzt. Dazu zählen insbesondere ein vollständiger generischer Sync-/Konflikt-Orchestrator und weitere noch nicht abgenommene Core-1.0-Verträge.

Aktuelle konkrete Fehler und Operator-Retests stehen ausschließlich in `STATUS.md` und `CHATGPT.md`.

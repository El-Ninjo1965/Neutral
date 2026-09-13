# NEUTRAL – Funktionskatalog

**Status:** NACHGEWIESENES FUNKTIONSINVENTAR  
**Stand:** 2026-09-13  
**Autorität:** Anforderungen in `CORE-1.0.md`; aktueller Live-Stand in `STATUS.md`.

Dieses Dokument beschreibt technische Fähigkeiten, keine historische Fehler- oder Retestchronik.

## Client/Core

Vorhanden sind insbesondere:

- Lifecycle und Event-System;
- Laufzeitkonfiguration;
- lokaler Storage und IndexedDB-Grundlagen;
- Netzwerkstatus;
- Service-Registry und zentrale Fehlerbehandlung;
- Manifest-/Modulladen;
- Module Interface, Registry und Lifecycle;
- zentraler API-Client;
- Theme-/Design-Grundlagen;
- generische clientseitige Medien-/Upload-Primitives.

## User-App

Vorhanden sind insbesondere:

- zentrale Navigation und Produktidentität;
- Homepage-Projektion mit lokalem Warmstart;
- User Settings;
- Light/Dark;
- zentrale I18N-/Intl-Grundlagen;
- User-Login gemäß `UI-UX.md`;
- GPS als `publicOffline`-Referenzmodul.

## Server/Core

Vorhanden sind insbesondere:

- PHP-Bootstrap und Environment-Konfiguration;
- PDO-Datenbankzugriff und Migrationen;
- Authentifizierung, Sessions, Logout und RBAC;
- Benutzer-, Rollen- und Permissionverwaltung;
- Settings und Audit;
- gemeinsame Modulruntime für Discovery, Installation, Aktivierung, Deaktivierung, Update und Uninstallation;
- Manifest-/Server-Contract-Validierung;
- generischer Modul-HTTP-Kernel mit Auth-/Permission-/CSRF-/Limitprüfung;
- versionierte Modulmigrationen;
- Packages/Entitlements und Lizenzen/Organisationen;
- Device-/Session-Grundlagen;
- Backup-/Restore- und Betriebsprimitives.

## Modulgrenze

Der Core stellt generische Mechanismen bereit. Konkrete Profile-, Media-, Sharing-, Notification-, Moderation- und Messaging-Semantik gehört in optionale Module.

Eine Manifestdeklaration oder ein Status-Service allein ist keine fertige Fachfunktion. Neue Module folgen `ModuleCreation.md`.

## Wahrheitsgrenze

Aktuelle Livefehler, Operator-Retests und Deploymentstatus werden ausschließlich in `STATUS.md` und `CHATGPT.md` geführt.
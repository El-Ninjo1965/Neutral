# NEUTRAL – Datenhaltung

**Status:** VERBINDLICHER DETAILVERTRAG
**Geprüft:** 2026-09-13

## Client

Browserlokale Speicherung dient Einstellungen, Cache und strukturierten Offline-Daten. IndexedDB darf den ersten stabilen UI-Render nicht blockieren. Lokale Daten erteilen keine Serverrechte.

Vorhandene Stores für Users, Modules, Logs, Sessions, Settings, Cache und Sync belegen nur die jeweilige technische Grundlage. Vollständige Sync-Queue, Retry/Backoff, Idempotenz, Konfliktauflösung und zentrale Cache-Invalidierung sind davon getrennte Fähigkeiten.

## Server

Produktion verwendet PDO mit MySQL/MariaDB. Datenbankzugriffe erfolgen ausschließlich serverseitig. Setup führt Core-Migrationen und Seed-Schritte aus; normaler Runtimebetrieb soll mit minimal erforderlichen Rechten arbeiten.

## Core-Schema

Der verwaltete Core umfasst Schema-/RBAC-/User-/Session-/Settings-/Module-/Setup-/Audit-/Backup-/Release-/Profile-/Package-/License-/Presence-/Media-Grundtabellen. Das Vorhandensein einer Coretabelle beweist nicht, dass ein optionales Fachmodul vollständig implementiert ist.

## Modul-Daten

Optionale Module besitzen ihre deklarierten Tabellen und Migrationen. Der Core nimmt keine neue produktspezifische Fachlogik in sein Basisschema auf.

Modultabellen werden über `database.tables` beschrieben. Installation und Update führen nur deklarierte Migrationen aus. Deaktivierung löscht Daten nicht automatisch. Uninstall respektiert den deklarierten Datenvertrag.

`field_notes_items` ist ein Beispiel für eine modul-eigene Tabelle und wird ausschließlich über diesen generischen Vertrag behandelt. Bestehende Profile-Daten bleiben nicht-destruktiv erhalten; neue Profile-Funktionalität gehört zum Profile-Modul.

## Migrationen

Core- und Modulmigrationen sind versioniert und nachvollziehbar. Modulmigrationen werden validiert, mit Checksummen geschützt und in `module_migrations` nachgewiesen. Nachträglich veränderte bereits angewendete Migrationen werden nicht still akzeptiert.

Updatefehler dürfen keinen scheinbar erfolgreichen Modulzustand hinterlassen. Automatische Downgrades sind nicht Teil des Vertrags.

## Sessions und Geräte

Sessions unterscheiden User- und Admin-Scope. User-Sessions dürfen persistent sein; Admin-Sessions dürfen endlich sein. Geräteidentität verwendet eine zufällige persistente Installations-ID. Browser-/OS-Angaben dienen nur Support und Anzeige.

Erneuter Login derselben Installation ersetzt ältere aktive Sessionzustände desselben Scopes. Device-Limits löschen bestehende Sessions nicht automatisch.

## Packages und Licenses

Direktes User-Package, License-Package und Device-Limit-Modus bleiben getrennte Daten. Effektive Werte werden serverseitig aufgelöst. `unlimited` darf nicht als numerisch `0` interpretiert werden.

## Backup

Backup V2 sichert den verwalteten Core-Tabellensatz, deklarierte Tabellen installierter Module und verwaltete Medien. Sessions und Loginversuche bleiben ausgeschlossen. Details stehen in `BACKUP-CONTRACT.md`.

## Betrieb

Datenbankzugriffe verwenden serverseitige Validierung und vorbereitete Statements. Explizite Readiness-/Migrationsprüfungen dürfen Deployment und Diagnose unterstützen, ersetzen aber keine Live-Abnahme.

Aktueller Implementierungs-/Live-Stand steht ausschließlich in `STATUS.md` und `CHATGPT.md`.
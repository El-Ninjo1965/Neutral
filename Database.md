# NEUTRAL – Datenhaltung

## Statuslegende

**VORHANDEN**, **TEILWEISE**, **FEHLT**, **GEPLANT** beziehen sich auf den aktuellen Code.

# CLIENT

## 1. IndexedDB

**VORHANDEN:** `platform/database-manager.js` konfiguriert standardmäßig Typ `indexeddb`, Name `CoreDB`, Version `1`. `init()` öffnet die Datenbank; `onupgradeneeded` erzeugt fehlende Stores. Öffentliche Operationen sind `save`, `get`, `insert`, `update`, `delete`, `clear`, `findByIndex`, `getAll` und `transaction`.

### Tatsächlich definierte Stores

| Store | Key | Indizes | Aktueller Zweck/Status |
|---|---|---|---|
| `users` | `id` | `email`, `role`, `active` | lokale Framework-/Entwicklungsdaten; VORHANDEN |
| `modules` | `id` | `name`, `version`, `status` | lokaler Modulzustand; VORHANDEN |
| `logs` | `id` | `timestamp`, `level`, `source` | lokale Logs; VORHANDEN |
| `sessions` | `id` | `userId`, `createdAt`, `expiresAt` | lokaler Sessionartefakt-Store; keine Serverautorität |
| `settings` | `key` | `category` | lokale Einstellungen; VORHANDEN |
| `cache` | `key` | `createdAt`, `ttl` | Cachegrundlage; TEILWEISE, keine zentrale Invalidierungspolitik |
| `sync` | `id` | `timestamp`, `status` | Sync-Grundlage; TEILWEISE, keine vollständige Queueengine |

## 2. localStorage

**VORHANDEN:** `CoreStorage`, Config-/Setup-/Theme-/Auth- und GPS-nahe Komponenten verwenden browserlokale Speicherung. Schlüssel und Payloads sind komponentenspezifisch; localStorage ist synchron und unverschlüsselt und darf keine Serverrechte oder hochsensiblen Geheimnisse tragen.

## 3. Clientmigrationen

**TEILWEISE:** IndexedDB nutzt die Datenbankversion und erzeugt fehlende Stores bei Upgrade. Ein versionierter, nachvollziehbarer Migrationskatalog mit Roll-forward-/Fehlerstrategie fehlt.

## 4. Cache

**TEILWEISE:** Store und TTL-Index existieren. Einheitliche Read-through/Write-through-, Invalidierungs- und Größenregeln fehlen.

## 5. Sync-Daten

**TEILWEISE/FEHLT:** Der Store `sync` belegt die geplante Richtung. Persistente Queueverarbeitung, Retry/Backoff, Idempotenzschlüssel, Änderungs-/Tombstone-Modell, Datenversionen und Konfliktauflösung fehlen als universelle Implementierung.

# SERVER

## 6. Engine und Zugriff

**VORHANDEN:** `core/php/src/Database.php` verwendet PDO mit MySQL/MariaDB-Konfiguration aus `AppConfig`. Verbindungen verwenden Exceptions und vorbereitete Statements in den Services. `ensureDatabaseExists()` kann die konfigurierte Datenbank anlegen. Produktion benötigt `pdo_mysql`.

Node-Entwicklung besitzt zusätzlich file-/memory-basierte Persistenzadapter. Diese sind keine MariaDB-Produktionstabellen.

## 7. Tatsächlich definierte Tabellen

Quelle ist `core/php/src/SchemaMigrator.php`; zusätzliche Tabellen dürfen nicht aus Zielvorstellungen abgeleitet werden.

| Tabelle | Zweck | Wesentliche Beziehungen |
|---|---|---|
| `schema_migrations` | angewendete Migrationen und Checksummen | eigenständig |
| `roles` | Rollenstamm | referenziert durch `user_roles`, `role_permissions` |
| `permissions` | Permissionkatalog, optionaler Scope | referenziert durch `role_permissions` |
| `users` | Benutzer und Passwort-Hash | Rollen/Sessions/Audit/Settings |
| `user_roles` | n:m Benutzer–Rolle | FK zu `users`, `roles`, Cascade |
| `role_permissions` | n:m Rolle–Permission | FK zu `roles`, `permissions`, Cascade |
| `sessions` | Session-ID, CSRF, Laufzeit/Clientmetadaten | FK zu `users`, Cascade |
| `settings` | JSON-Wert pro Setting-Key | optional `updated_by` → User |
| `modules` | registrierte Manifeste/Pfade/Version | 1:1 State, 1:n Migrationen |
| `module_state` | Status, Aktivierung, Version, Fehler | FK zu `modules`, Cascade |
| `module_migrations` | angewendete Modulmigrationskeys | FK zu `modules`, Cascade |
| `setup_status` | aktueller Installationsstand | eigenständig, optional updater |
| `audit_log` | Aktion, Ressource, Ergebnis, Details | optional Actor → User |
| `backups` | Backupmetadaten/-status | eigenständig |
| `release_state` | Version, Umgebung, Maintenance/Checks | eigenständig |

Das GPS-Manifest deklariert aktuell `database.tables: []`; es besitzt daher keine serverseitige GPS-Tabelle.

## 8. Migrationen

**VORHANDEN:** Migration `2026_08_25_0001_core_schema` erzeugt die genannten Tabellen. `status()` vergleicht bekannte und angewendete Keys; `migrate()` wendet ausstehende Statements an und speichert SHA-1-Checksummen.

**TEILWEISE:** Statements einer Migration werden nicht im aktuellen Code als eine explizite Gesamttransaktion umschlossen. Modul-Migrationsrecords existieren, ein allgemeiner sicherer SQL-Migrationsvertrag für Module ist noch nicht vollständig veröffentlicht.

## 9. Konfiguration

Hostlokale `.env`-Werte werden über `EnvLoader`/`AppConfig` gelesen. Erwartete Daten umfassen Host, Port, Datenbankname, Benutzer, Passwort und Charset gemäß Code. Werte werden nicht committed oder im Client ausgeliefert.

## 10. Rechte und Sicherheit

Der DB-Benutzer soll nur notwendige Rechte auf das NEUTRAL-Schema besitzen. Datenbankerstellung benötigt temporär weitergehende Rechte; der normale Betrieb soll ohne globale Administration auskommen. Zugriffe erfolgen serverseitig, nie direkt aus der Web-App. Backups, Rotation, Verschlüsselung und Datenschutzfristen sind betriebliche Pflichten und noch nicht vollständig automatisiert.

## 11. Ziel-/Fehlstellen

- **GEPLANT:** Adapterfähigkeit für Infrastrukturwechsel ohne Client-Core-Umbau.
- **FEHLT:** vollständiger clientseitiger Sync-/Konfliktvertrag.
- **FEHLT:** formale Clientmigrationen mit Tests für Versionssprünge.
- **FEHLT:** dokumentierte Backup-/Restore- und Aufbewahrungspolitik für Produktion.
- **FEHLT:** allgemeine Modul-Datenmigration mit Transaktions-/Rollbackvertrag.

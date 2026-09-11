# NEUTRAL – API

## Technischer Korrekturstand 2026-09-11

- **VORHANDEN (Code):** generischer authentifizierter Dispatcher `/api/v1/modules/<id>/<path>` mit registriert/aktiv, Permission und bei Mutationen CSRF; Profile deklariert `GET|PUT modules/profile/profile`. Der frühere feste Account-Profile-Zweig ist entfernt.
- **LIVE OFFEN:** Profile-Aktivierung schlägt vor Nutzung der Route mit HTTP 500 fehl; Media-Install liefert `Load failed`.
- **SCAFFOLDING:** Media, Sharing, Notifications, Moderation und Postbox veröffentlichen derzeit nur `GET .../status`. Die in ihren Manifesten beschriebenen Fachverträge sind keine vorhandenen Upload-, Sharing-, Delivery-, Review- oder Messaging-APIs.
- **GEPLANT:** rollenbezogene Modul-Visibility/Navigation besitzt noch keine eigenständige API. Permissions bleiben davon getrennt.
- **LIVE FEHLER:** Device-Limit-Auflösung behandelt einen Unlimited-Package-Fall in Produktion als `0`. Die dokumentierte Sollsemantik bleibt nullable/unbegrenzt; Ursache und API-Projektion sind zu reparieren.

---

**Status:** DETAILVERTRAG

**Geprüft:** 2026-09-03
**Autorität:** untergeordnet zu [`CORE-1.0.md`](CORE-1.0.md) und [`Architecture.md`](Architecture.md).

## 1. Geltungsbereich

Die Produktionsoberfläche ist der PHP-Router `Server/public/api/index.php`, erreichbar unter der zentral konfigurierten API-Basis. Der kanonische Produktionspräfix ist `/api/v1`; der bisherige Präfix `/api` bleibt vorerst kompatibel. Beim Shared-Hosting-Deployment leitet die Root-`.htaccess` alle öffentlichen `/api`-Pfade direkt und abschließend an diesen Router; Request-URI und Query bleiben für dessen kanonische Auswertung erhalten. `Web-App/public/api-client.js` nutzt `NeutralPublicPath`; der Resolver liest `basePath` aus `window.NeutralConfig` beziehungsweise `neutral-base-path` und leitet daraus `<Basis>/api/v1` ab.

`Server/node/bootstrap/server.js` bietet zusätzlich eine Node-Referenz- und Test-API. Sie ist tatsächlich vorhanden, aber keine Voraussetzung der Shared-Hosting-Produktion und nicht automatisch vertraglich identisch mit PHP.

Antworten der PHP-API verwenden grundsätzlich JSON-Umschläge von `JsonResponse`: Erfolg `{ "ok": true, "data": ... }`, Fehler `{ "ok": false, "error": { "message": ... }, "details": ... }` (Details abhängig vom Fehler).

## 2. Querschnittsverhalten

- **Auth:** PHP-Sessioncookie; optionaler Admin-Bootstrap-Token ist nur für autorisierte Setup-/Automationswege vorgesehen.
- **CSRF:** Zustandsändernde geschützte Requests benötigen `x-csrf-token`; `ApiClient` liest dazu `neutral_csrf`.
- **Rechte:** serverseitige Permissionprüfung; UI-Sichtbarkeit erteilt keine Rechte.
- **Request:** JSON-Body bei schreibenden API-Aufrufen; ungültiges JSON ergibt 400.
- **Versionierung:** **VORHANDEN** – `/api/v1` ist kanonisch, `/api` bleibt abwärtskompatibel; Antworten senden `X-Neutral-API-Version: 1`, unbekannte explizite Versionen wie `/api/v2` ergeben 404.
- **Timeout:** **VORHANDEN** – `ApiClient` beendet Requests kontrolliert über `AbortController`; `tests/api-timeout.test.js` prüft den Fehlerpfad.
- **Retry:** **FEHLT** – keine allgemeine Retry-/Backoff-Policy. Schreibrequests dürfen nicht blind wiederholt werden.
- **Offline:** **TEILWEISE** – Client erhält strukturierte Netzwerkfehler; ein validierter anonymer Modulkatalog wird installationsbezogen zwischengespeichert. Persistentes Schreibqueueing fehlt.

## 3. PHP-Endpunkte

Statuswerte: **VORHANDEN** bedeutet im PHP-Router nachweisbar. Die folgende Tabelle zeigt die kompatiblen Kurzpfade unter `/api`; für neue Aufrufer ist jeweils `/api/v1/...` verbindlich.

| Methode | Pfad | Zweck | Auth / Recht | Request | Response | Fehler / DB-Bezug | Status |
|---|---|---|---|---|---|---|---|
| GET | `/api/setup/status` | Setupstatus und Voraussetzungen | vor Aktivierung öffentlich; nach Aktivierung nur mit Recoveryflag und HTTP-Basic-Recoverytoken | – | Setupstatus | 404 ohne Flag, 401 ohne gültiges Token; 500 bei Runtime/DB | VORHANDEN |
| POST | `/api/setup/install` | DB anlegen, migrieren, Core-Daten seeden | vor Aktivierung öffentlich; nach Aktivierung nur mit Recoveryflag und HTTP-Basic-Recoverytoken | Installationsdaten/Environment | Installationsresultat | 404 ohne Flag, 401 ohne gültiges Token; 400/500; alle Coretabellen | VORHANDEN |
| GET | `/api/status` | öffentlicher Betriebs- und DB-Erreichbarkeitsstatus | öffentlich | – | Service, Umgebung, App und ausschließlich DB-Zustand | 500; DB-Ping | VORHANDEN |
| POST | `/api/auth/login` | Benutzer authentifizieren, Session starten | öffentlich, Credentials erforderlich | `username`, `password` | öffentliche Identität, CSRF/Sessionkontext | 400/401; `users`, `user_roles`, `roles`, `permissions`, `sessions` | VORHANDEN |
| POST | `/api/auth/logout` | aktive Session beenden | Session; CSRF | – | Logoutbestätigung | 401/403; `sessions` | VORHANDEN |
| GET | `/api/auth/me` | aktuelle Identität und effektive Rechte | Session | – | User/Rollen/Permissions | 401; Session/RBAC-Tabellen | VORHANDEN |
| GET | `/api/modules` | für Identität sichtbarer Modulkatalog | optional; ohne Session nur aktive Module gemäß gespeicherten `viewer`-Sichtrechten | – | `{modules, accessContext}`; je Modul bereinigtes `clientAccess` mit Modus/Sichtbarkeit/Nutzung | 500; `modules`, `module_state`, Rollenpermissions | VORHANDEN |
| GET | `/api/admin/sessions` | Sessions auflisten | `sessions.view` | Filter – | öffentliche Sessiondaten | 401/403; `sessions` | VORHANDEN |
| GET | `/api/admin/permissions` | Permissionkatalog | `roles.view` oder Adminberechtigung | – | Permissions | 401/403; `permissions` | VORHANDEN |
| GET | `/api/admin/users` | Benutzer suchen/listen | `users.view` | Queryfilter | Benutzerliste | 401/403; `users`, Rollen | VORHANDEN |
| POST | `/api/admin/users` | Benutzer anlegen | `users.manage`, CSRF | Username, E-Mail, Passwort, Rollen/Status | neuer öffentlicher User | 400/409/403; Benutzer/Rollen | VORHANDEN |
| GET | `/api/admin/users/{id}` | Benutzer lesen | `users.view` | – | User | 404/403; Benutzer/Rollen | VORHANDEN |
| PUT | `/api/admin/users/{id}` | Benutzer ändern | `users.manage`, CSRF | änderbare Userfelder | aktualisierter User | 400/404/409/403 | VORHANDEN |
| DELETE | `/api/admin/users/{id}` | Benutzer löschen | `users.manage`, CSRF | – | Bestätigung | 404/403; löscht abhängige Rollen/Sessions per FK | VORHANDEN |
| GET | `/api/admin/roles` | Rollen auflisten | `roles.view` | – | Rollen mit Rechten | 401/403; Rollen/Permissions | VORHANDEN |
| POST | `/api/admin/roles` | Rolle anlegen | `roles.manage`, CSRF | Rolle und Permissions | neue Rolle | 400/409/403 | VORHANDEN |
| GET | `/api/admin/roles/{id}` | Rolle lesen | `roles.view` | – | Rolle | 404/403 | VORHANDEN |
| PUT | `/api/admin/roles/{id}` | Rolle ändern | `roles.manage`, CSRF | Name/Beschreibung/Permissions | Rolle | 400/404/403; Systemrollenschutz | VORHANDEN |
| DELETE | `/api/admin/roles/{id}` | Rolle löschen | `roles.manage`, CSRF | – | Bestätigung | 400 für Systemrolle, 404/403 | VORHANDEN |
| GET | `/api/admin/settings` | Settings lesen | `settings.view` | – | Settingsobjekt | 401/403; `settings` | VORHANDEN |
| POST | `/api/admin/settings` | Settings aktualisieren | `settings.manage`, CSRF | Key-/Objektwerte | aktualisierte Settings | 400/403; `settings`, Audit | VORHANDEN |
| GET | `/api/admin/audit` | Audit filtern/listen | `audit.view` | Queryfilter | Auditeinträge | 401/403; `audit_log` | VORHANDEN |
| GET | `/api/admin/modules` | Admin-Modulkatalog | `modules.view` | – | Module/Lifecycle/Manifest | 401/403; Module/RBAC | VORHANDEN |
| GET | `/api/admin/modules/{id}` | Moduldetails | `modules.view` | – | Modul | 404/403 | VORHANDEN |
| GET | `/api/admin/modules/{id}/permissions` | Modulrechte/Rollenzuordnung | `modules.view`/Verwaltungsrecht | – | Definitionen/Zuweisungen | 404/403; RBAC | VORHANDEN |
| PUT | `/api/admin/modules/{id}/permissions` | Modulrechte Rollen zuweisen | Modulverwaltung, CSRF | Rollenzuordnungen | aktualisierte Zuordnung | 400/404/403; RBAC | VORHANDEN |
| POST | `/api/admin/modules/{id}/install` | entdecktes Modul registrieren | Modulverwaltung, CSRF | optional – | installiertes, inaktives Modul | 404/409/403; Module/Permissions | VORHANDEN |
| POST | `/api/admin/modules/{id}/activate` | Modul aktivieren | Modulverwaltung, CSRF | – | aktives Modul | 404/409/403; `module_state` | VORHANDEN |
| POST | `/api/admin/modules/{id}/deactivate` | Modul deaktivieren | Modulverwaltung, CSRF | – | inaktives Modul | 404/403 | VORHANDEN |
| POST | `/api/admin/modules/{id}/uninstall` | Modulregistrierung entfernen | Modulverwaltung, CSRF | – | Bestätigung | 404/403; Modulstate, modulbezogene Rechte/Settings; nur deklarierte sichere Tabellen | VORHANDEN |
| GET | `/api/admin/system/health` | System-/Voraussetzungszustand | Admin/Systemrecht | – | Healthchecks | 401/403/500; DB-Ping | VORHANDEN |
| GET | `/api/admin/diagnostics` | Runtimediagnostik | Admin/Systemrecht | – | Diagnoseobjekt | 401/403 | VORHANDEN |
| GET | `/api/admin/server` | Serverkonfiguration/-zustand | Admin/Systemrecht | – | sanitisiertes Serverobjekt | 401/403 | VORHANDEN |
| GET | `/api/server/test` | Verbindungsvoraussetzungen testen | geschützter Betriebskontext | – | Testresultat | 403/500 | VORHANDEN |
| GET | `/api/admin/database` | DB-Konfiguration/-status | Admin/Systemrecht | – | sanitisiertes DB-Objekt | 401/403; DB | VORHANDEN |
| GET | `/api/database/status` | DB-Erreichbarkeit/Migrationstatus | Betriebskontext | – | Status | 500; DB/Migrations | VORHANDEN |
| GET | `/api/admin/release/status` | Releasezustand | Admin/Systemrecht | – | Releaseobjekt | 401/403; `release_state` | VORHANDEN |
| GET | `/api/admin/providers`, `/api/providers` | konfigurierte Provider lesen | Adminvariante geschützt; öffentliche Variante gemäß Router | – | Providerliste | 403; Katalog/Runtime | VORHANDEN |
| GET | `/api/admin/connections`, `/api/connections` | Verbindungen lesen | Adminvariante geschützt | – | sanitiserte Verbindungen | 403; Runtimekonfiguration | VORHANDEN |
| GET | `/api/admin/system/inventory` | aggregiertes DB-Inventar für Portabilitätsprüfung | `backups.view` | – | Tabellenzahlen und Migrationszustand | 401/403/503; keine Zeileninhalte | VORHANDEN |
| POST | `/api/admin/modules/{id}/update` | inaktives registriertes Modul auf entdeckte Version aktualisieren | `role.write` oder Modul-Adminrecht + CSRF | – | aktualisiertes Modul | 404 nicht vorhanden; 409 aktiv/Downgrade | VORHANDEN |
| `GET/POST/PUT/PATCH/DELETE` | `/api/modules/{id}/{route}` | deklarierte Modulroute generisch ausführen | Route verlangt Auth + Modulrecht; Schreibwege zusätzlich CSRF | routenspezifisch | bereinigte Serviceantwort | 401/403/404/405/409/422 | VORHANDEN |
| GET | `/api/admin/backups` | verschlüsselte Backupmetadaten lesen | `backups.view` | – | ID, Erstellzeit, Größe | 401/403/503 | VORHANDEN |
| POST | `/api/admin/backups` | verschlüsseltes logisches Backup erzeugen | `backups.manage`, CSRF | – | Backup-ID und Metadaten | 401/403/503; verwaltete Coretabellen | VORHANDEN |
| POST | `/api/admin/backups/path/test` | konfigurierten Backup-Pfad sicher prüfen | Adminsession, `backups.manage`, CSRF | absoluter Pfad | Status + boolesche Existenz-/Verzeichnis-/Schreib-/Schutzwerte | 401/403/422 | VORHANDEN |
| POST | `/api/admin/backups/path` | installationsspezifischen Backup-Pfad speichern | Adminsession, `backups.manage`, CSRF | absoluter Pfad | gespeicherter Pfad | 401/403/422 | VORHANDEN |
| GET | `/api/admin/backups/{id}/download` | verschlüsseltes Backup laden | Adminsession, `backups.manage` | – | byteexaktes verschlüsseltes Binärartefakt | 400/401/403/404 | VORHANDEN |
| POST | `/api/admin/backups/upload` | verschlüsseltes Backup übertragen | `backups.manage`, CSRF | authentifiziertes Binärartefakt mit aktueller Schema-Version, vollständiger Core-Tabellenmenge und gültiger Zeilenstruktur; bis 100 MiB | gespeicherte Metadaten | 400/401/403/413 | VORHANDEN |
| POST | `/api/admin/backups/{id}/restore` | Backup validieren und transaktional wiederherstellen | `backups.manage`, CSRF | – | Restorestatus; Sitzung endet | 400/401/403; verwaltete Coretabellen | VORHANDEN |
| GET | `/api/admin/updates`, `/api/updates` | Updatezustand lesen | Adminvariante geschützt | – | Updateinformationen | 403; Runtime | VORHANDEN |

## 4. Node-Referenz-API

`Server/node/bootstrap/server.js` implementiert zusätzlich Status/Health/Logs, Frameworkdiagnostik, Release/Maintenance, Auth, Connections, Providers, Backups/Restore, Setup/Aktivierung, Server-/DB-Tests, Devices, Licenses, Updates, Module sowie Benutzer-, Rollen-, Audit- und Settings-CRUD. Diese Endpunkte werden in Node-Integrationstests verwendet. Nur Endpunkte, die auch im PHP-Router vorhanden und geprüft sind, dürfen als Produktionsvertrag vorausgesetzt werden.

## 5. Erweiterungsregel

Neue Core-Endpunkte benötigen vor Implementierung: dokumentierten Vertrag, Auth-/Permissionentscheidung, Requestvalidierung, Fehlercodes, Datenbank-/Transaktionskonzept, Datenschutzprüfung, Tests und Eintrag in diesem Dokument. Module deklarieren ausschließlich relative Routen, Methoden, Service/Action, Permission und optional ein Mengenlimit im Manifest; `ModuleHttpKernel` bleibt der einzige produktive Dispatcher. Direkte fachliche Zweige im zentralen Router sind verboten.

Der anonyme Zugriff auf `/api/modules` überträgt keine Viewer-Identität und keine effektive Permissionliste. Die Viewer-Zuordnung steuert nur den öffentlichen Modulkatalog. Jede serverseitige Modulaktion benötigt weiterhin eine eigene authentifizierte Autorisierungsentscheidung.

## Client-Timeout – P3 IST

`ApiClient.request()` begrenzt Requests standardmäßig auf 10 Sekunden; `timeoutMs` kann pro Request gesetzt oder mit `0` bewusst deaktiviert werden. Wenn `AbortController` vorhanden ist, wird der Fetch abgebrochen; ältere Browser erhalten einen Promise-Timeout-Fallback. Das Ergebnis ist `{ok:false,status:408,code:"API_TIMEOUT"}`. Es gibt keinen automatischen Retry für Login oder andere Schreiboperationen.

## Operations endpoints (2026-09-09)

Admin-only endpoints include device-session listing/revocation, the read-only classified permission registry, authoritative server/database/connection diagnostics, maintenance state changes, encrypted backup lifecycle (create/list/upload/download/restore/delete), and audit retention purge. Mutations require an Admin-scope cookie session, permission and CSRF. `GET /api/settings/maintenance` exposes only active state, display-safe reason and update time so the User-App can show a maintenance page; it exposes no actor or infrastructure metadata.

## Phase 2 Admin response and readiness contract

PHP responses retain the canonical `{ok,data}` envelope and all Admin views consume it through `AdminCommon.unwrapData`. `GET /api/v1/system/readiness` exposes only database/migration readiness and pending count for non-destructive deployment verification. `GET /api/admin/backups/readiness` is permission-protected and returns boolean key/crypto/database/schema/storage prerequisites. Backup errors provide stable safe codes without paths or values. Release status derives version, abbreviated commit and build time from the deployed `manifest.json`.

## 2026-09-09 Live follow-up contracts

- Admin session lists contain only active, unexpired installation sessions; successful re-login with the same installation ID replaces the preceding session.
- Audit entries may expose the actor username/handle together with stable numeric ID to authorized auditors. Settings no-op submissions create neither a persistence write nor a `settings.update` event; real changes report `changedFields` plus safe app-name before/after metadata.
- GPS remains a module. Explicit location sharing offers Google Maps, OpenStreetMap and system share without adding a Core provider dependency or automatic background disclosure.

## Account/license endpoints (2026-09-09)

- `GET /api/account/profile` – current session's private profile plus default-off sharing flags.
- `PUT /api/account/profile` – CSRF-protected update of optional e-mail/profile fields and sharing flags; username remains read-only.
- `POST /api/account/password` – CSRF-protected current-password verification and 8–25/no-whitespace password change.
- `GET|POST /api/license/users` – delegated `license.manage` operations, server-scoped to the actor's assigned organization license.
- `GET /api/admin/installations/metrics` – Admin-only server-seen installation totals and 1/7/30-day audience counts.

Package/module states are `available`, `locked` or `hidden`. They are display projections only; server permissions and license scope remain authoritative.

## License delegation and media workflow (2026-09-09)

`GET/POST /api/v1/license/users`, `PATCH/DELETE /api/v1/license/users/{id}`, `GET /api/v1/license/devices` and `POST /api/v1/license/users/{id}/devices/{sessionId}/revoke` are restricted to `license.manage`, the actor's own managed license, CSRF for mutations, and audit logging. Delegated user creation can create only ordinary `user` members.

`GET/POST /api/v1/account/media`, controlled `GET /api/v1/media/{id}`, and `POST /api/v1/admin/media/{id}/{approve|reject|delete}` implement the neutral media lifecycle. Upload requires `profile.media.upload`; moderation requires `media.moderate`; pending/rejected media is available only to its owner or a moderator and every decision is recorded.

## Authentication availability contract (2026-09-09)

`POST /api/v1/auth/login` and `POST /api/v1/admin/auth/login` share the authoritative authentication implementation but retain separate cookie/CSRF scopes. Invalid credentials return 401. Device exhaustion returns 409 with `DEVICE_LIMIT_REACHED`. Runtime infrastructure failures return 503 with a bounded safe code and random correlation ID. Production smoke exercises both canonical routes using intentionally invalid non-account credentials and requires 401.

## Admin commercial configuration (2026-09-10)

Admin-session routes `GET/POST /api/v1/admin/packages`, `PUT/DELETE /api/v1/admin/packages/{id}` and `GET/POST /api/v1/admin/licenses`, `PUT/DELETE /api/v1/admin/licenses/{id}` manage neutral packages and organizations. Mutations require CSRF and global Admin write permission. Assigned packages cannot be deleted. A License can be hard-deleted only with no User/Manager membership; otherwise the API returns a safe 409 and `blocked` remains the non-destructive alternative. Successful deletion and its key are audited in the same transaction. Package module states are `available|locked|hidden`; user limits are distinct from effective per-user device limits. Package and license keys accept lowercase letters, numbers, hyphens and underscores without spaces. Device inputs accept a positive integer through 1000 or `unlimited`; license inputs additionally accept the package default. A license manager is selected by an existing active user ID supplied by the UI's user list and is revalidated server-side. Controlled input failures return 422 and persistence conflicts return a generic 409 without SQL details. Admin user create/update accepts `licenseId` and `allowedDevices` (`default`, positive override, or `unlimited`) and never auto-revokes existing sessions.

Session projections expose the stable random `deviceId` separately from `deviceClass`, `operatingSystem` and `browser`. They also include the numeric User ID beside display name/username. Support metadata never participates in authentication or device-limit identity and falls back to `Unknown` when the user agent is insufficient.

Backup path configuration is ordinary installation settings, not a secret. The test endpoint performs no backup: it rejects non-absolute/traversing paths, requires an existing directory, performs and removes a bounded probe file, and refuses known public roots. Manual and automatic backup creation resolve the same persisted setting; the host-only encryption key is never returned.

The `.neutral-backup` download is the byte-exact stored AES-256-GCM JSON envelope (`application/octet-stream`); the browser never receives plaintext. Restore accepts exactly the 21 current portable Core tables and current schema version. Sessions/login attempts are absent and cleared; module-owned tables and media binaries are not part of the current v1 payload. The complete boundary is defined in `BACKUP-CONTRACT.md`.

`POST /api/v1/admin/audit/clear` requires the dedicated `audit.clear` permission, Admin session, CSRF and an explicit boolean confirmation produced after two UI confirmation dialogs. It returns the deleted count and transactionally creates `audit.clear.completed` after removing all prior entries. No confirmation word is collected.

Backup create now emits logical payload v2: the Core table set, installed-module tables declared through `database.tables`, and integrity-described managed media bytes. Upload/restore retain v1 compatibility but never claim legacy artifacts include module/file data. V2 validation occurs before inventory retention or restore mutation.

`GET/PUT /api/account/profile` includes `organizationSharingAvailable` as a non-identifying boolean. PUT rejects any true organization-sharing privacy flag with 422 unless the user currently has an active membership in an active License; omission preserves existing privacy values.
### Admin user write errors

`POST /api/admin/users` returns `201` only after user/role/license/audit work completes atomically. Invalid input and unknown role/license constraints return `422`; duplicate username/email returns `409`. `PUT /api/admin/users/{id}` likewise maps invalid input to `422`, duplicates to `409`, and missing users to `404` rather than a generic `500`.
Admin User create/update accepts nullable `packageId` independently of nullable `licenseId`. User projections include `directPackageId`, `effectivePackageId`, and `packageSource`. Active License membership always determines `effectivePackageId`; otherwise the direct Package applies. Invalid/inactive direct Packages return controlled `422`.
Module catalog payloads include normalized `presentation` (`userNavigation`, `adminNavigation`, `system`) and `optionalDependencies`. These are discovery/presentation metadata only; lifecycle state and permission checks remain authoritative.

### Optional Profile module

`GET /api/v1/modules/profile/profile` and `PUT /api/v1/modules/profile/profile` are authenticated permission-checked module routes. When Profile is inactive, the generic module kernel returns a controlled unavailable/not-found response; Core continues without a compatibility account-profile endpoint.

## Module visibility endpoint

`PUT /api/v1/admin/modules/{id}/visibility` requires `role.write`, Admin-session CSRF, accepts booleans for Admin/Developer/User/Viewer, persists presentation-only state and audits the change. `GET /api/v1/admin/modules/{id}` includes the resolved visibility map. This state never grants module API permissions.

## Field Notes module routes (code-present, operator retest pending)

The generic `/api/v1/modules/<module-id>/<route>` kernel exposes Field Notes only while the module is installed and active. `GET /api/v1/modules/field-notes/items` requires `field-notes.view`; `POST`, `PUT` and `DELETE` on the same path require `field-notes.use`, authenticated ownership and CSRF for browser-session mutations. POST accepts `title`/`body`; PUT additionally accepts `id`; DELETE accepts `id`. All reads and mutations bind `owner_user_id` to the authenticated server identity. These are declarative module routes, not central-router special cases.

## 2026-09-11 operator-retest repair endpoints

`POST /api/v1/admin/database/test` requires an Admin session, CSRF and `settings.write`; it performs a bounded ping, stores only `{testedAt,status}` as `lastDatabaseTest`, writes `database.connection.test` to Audit and never returns credentials. `GET /api/v1/admin/database` projects that historical result as `lastTest`; it is not a health guarantee.

`POST /api/v1/admin/backups/path/test` likewise stores only timestamp/status as `lastBackupPathTest` and audits `backup.storage.test`, including controlled failures. `GET /api/v1/admin/backups/readiness` projects it as `lastPathTest`; the key remains host-only. A failed generic module installation is returned as controlled failure after the runtime marks the module not present/inactive so retry/reload cannot claim `Registered: Yes`.

## Authentication projection (2026-09-11)

`POST /api/v1/auth/login` returns `expiresAt: null` for persistent User-scope sessions. Admin-scope login continues returning a finite timestamp. `/auth/me`, Logout, revocation, device-limit enforcement and CSRF remain unchanged in authority. Client module discovery continues projecting only active modules permitted to the current identity; Profile Settings additionally requires `profile.view` and `profile.update`.

## Auth-/Session-Recovery (2026-09-11)

`/api/v1/auth/*` und `/api/v1/admin/auth/*` lösen ihre getrennten Cookies ausschließlich gegen DB-Sessions desselben `session_scope` auf. Nach Verlust der PHP-Sessiondatei kann `/auth/me` eine weiterhin aktive, scopegleiche DB-Session wiederherstellen. User-/Admin-Login und Replacement verändern den jeweils anderen Scope nicht. Unauthentifizierte `auth/me`-Routen bleiben 401; ungültige Logins erzeugen keinen Auth-Cookie.

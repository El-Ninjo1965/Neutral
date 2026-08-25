# Neutral – Project TODO

This file is the current task ledger for the project. It must stay aligned with the actual repository state, production diagnosis, and workflow rules.

## Status legend
- [x] completed and verified
- [~] in progress
- [ ] open
- [?] unclear or blocked

## Completed and verified

[x] Module lifecycle repaired: discovery no longer auto-enables modules.
[x] Application and module semantics separated; Neutral remains an application.
[x] GPS module remains the reference module; no second GPS implementation created.
[x] Module metadata normalized so discovered modules are treated as modules, not app entries.
[x] Core loader path resolution improved for app-root portability.
[x] Framework tests for module lifecycle pass: `node --test tests/master-framework.test.js`.
[x] GitHub workflow for branch protection respected: feature branch + PR + CodeQL + merge.
[x] Branch protection issue resolved via valid PR workflow; PR #9 merged to main.
[x] Repository main synchronized with GitHub after merge.
[x] WORKFLOW.md and server.md updated to reflect the actual module lifecycle state.
[x] Production runtime determined: the real host is a LiteSpeed/PHP 8.5.9 shared-webspace environment, not a public Node runtime environment.
[x] Public API routing verified: `https://www.turbolikes.com/api/status` returns HTTP 404 and there is no active `/api` reverse-proxy layer on the live host.
[x] PHP setup surface verified: `https://www.turbolikes.com/index/app/neutral/webroot/setup.php` returns HTTP 200 with PHP/8.5.9.
[x] MySQL access issue verified: `SQLSTATE[HY000] [1045] Access denied for user 'web1819_neutral_app'@'localhost'` is a live server credential/grant problem, not a local repo bug.
[x] Node/Passenger runtime on the public production server is not available as an exposed runtime: no public Node route, no `node` in PATH, no reachable Port 3000, no active Passenger mapping.
[x] Production env path check: `/home/web1819/.env` is not present in this execution environment; the repo’s local `.env` is a different file and must not be treated as the live host config.
[x] Repository config loads `.env` candidates from `/home/web1819` and `resolveRuntimeEnvFile` in `webroot/setup.php` specifically checks those paths; this means the production host file is only active when present on the host filesystem.

## Current open work

### Production runtime and backend
[x] Determine the actual production backend mechanism for the real LiteSpeed/cPanel host.
  - Decision: the public host is PHP/LiteSpeed and does not expose a usable Node runtime.
[x] Verify whether a PHP/LiteSpeed integration can be used cleanly with the existing Node-based architecture.
  - Verified fact: the repo’s Node server remains the reference implementation, but it is not directly public on the production host. The live host still requires a PHP/LiteSpeed-compatible production path before API routing can be considered active.
[x] Check whether a usable Node/Passenger runtime is available on the production server.
  - Result: not available in the measurable host context.
[x] Establish the actual public API routing on the production server.
  - Result: missing / inactive. Public `/api/*` returns 404.
[x] Verify the server backend and runtime entry points used by the live host.
  - Result: the public host is serving PHP, not the repo’s Node server.

### Production environment and .env verification
[x] Implement a deployable PHP diagnostics page for real-host environment verification without exposing secrets.
 - Added `webroot/diagnose.php`, which reads the expected host env path when available, reports only status flags, masks credentials, checks DB connectivity without mutating data, and exposes a copyable report.
 - Deployed and verified through the live host URL: `https://www.turbolikes.com/index/app/neutral/webroot/diagnose.php`.
[x] Verify the real host .env file at `/home/web1819/.env` directly from the production host filesystem.
 - Verified through the deployed PHP diagnostics page: `/home/web1819/.env` exists, is readable, and is being loaded by the live PHP process.
[x] Validate the actual DB credentials, user grants, host, and port on the real production host.
 - Verified: both `localhost:3306` and `127.0.0.1:3306` succeed for the configured MySQL user on the live host; the DB name resolves and the app user is accepted.
[x] Confirm whether the public webroot path `PUBLIC_WEBROOT_PATH` resolves to the real app folder on the host.
 - Verified: `/home/web1819/public_html/index/app/neutral` exists and is readable; the production webroot is `/home/web1819/public_html/index/app/neutral/webroot`.
[x] Confirm whether `PUBLIC_URL` matches the live app root and serves the expected files on the production server.
 - Verified: `https://www.turbolikes.com/index/app/neutral/webroot/setup.php` and the deployed diagnostics page both respond with HTTP 200.
[x] Verify whether the hosted server is ignoring the .env values entirely because the HTTP requests are served by LiteSpeed/PHP instead of the Node process.
 - Result: the live PHP process reads the real host .env successfully; the runtime is PHP/LiteSpeed and the environment values are active on the host.

### Database and connectivity
[x] Clarify MySQL credentials, DB user, grants, host and port configuration.
  - Verified through live diagnostics: configured DB user authenticates successfully against MySQL on both `localhost:3306` and `127.0.0.1:3306`.
[x] Verify DB host and configuration values used by the production server.
  - Verified through live diagnostics: real host `.env` is readable and DB host/port are active in the running PHP process.
[x] Repair the actual server-to-DB connection for Neutral.
  - Current verification result: read-only connectivity check is successful; no schema or data mutation was performed.
[?] Verify server-side storage is usable for online data persistence.
  - Live diagnostics confirms DB connectivity (`localhost` and `127.0.0.1` both succeed), but storage viability for app persistence is not yet fully verified: `table_count` is currently `0` in the production DB and file-based config storage paths under `/home/web1819/public_html/index/app/neutral/config` are not present.
[ ] Validate browser vs server storage separation in actual runtime conditions.

### Application and module integration
[ ] Test the admin area against the real backend.
[ ] Test module discovery and administration against the real backend.
[ ] Test GPS module behavior on the real system.
[ ] Test module activation and deactivation persistence.
[ ] Ensure Neutral remains represented as an application, not as a module.

### Portability and configuration
[ ] Verify installation path portability across real server layouts.
[ ] Confirm env/config handling for production deployment.
[ ] Verify central config values for BASE_URL / API_BASE / DB_* remain portable.
[ ] Check whether the app can operate without hardcoded production paths.

### Diagnostics and deployment
[x] Extend developer diagnostics if needed for the actual Host/PHP/MySQL conditions.
  - Extended `webroot/diagnose.php` and verified on the live host with sanitized output, including safe DB host/port/name/user reporting and localhost vs 127.0.0.1 MySQL comparison.
[ ] Perform a complete end-to-end production test.
[ ] Update deployment documentation to reflect the actual host conditions.
[ ] Update WORKFLOW.md to reflect the current real-world server and deployment state.

## Dependency order

Production runtime
  ↓
Backend selection and routing
  ↓
Database connectivity
  ↓
Server storage / persistence
  ↓
Admin and module runtime
  ↓
GPS module validation
  ↓
End-to-end deployment test

## Notes

- The repository still contains a valid Node-based server architecture, but the live production host does not expose a usable Node runtime or public `/api` route.
- Code-level evidence confirms that the app is designed to read `/home/web1819/.env` and `/home/web1819/public_html/...` when those files exist on the host, but this execution environment does not expose those paths.
- The code also confirms that `DB_URL` is optional; `server/database/connection.js` uses `DB_HOST`, `DB_PORT`, `DB_NAME`, and `DB_USER`/`DB_PASSWORD` for the actual MySQL connection, while `webroot/setup.php` only reads `DB_URL` as a fallback display/serialization value.
- No parallel backend or duplicate module manager should be created while the live runtime stack remains unresolved.
- This TODO file is the live task registry and must stay aligned with host facts and code state.

## Dependency order

Production runtime
  ↓
Backend selection and routing
  ↓
Database connectivity
  ↓
Server storage / persistence
  ↓
Admin and module runtime
  ↓
GPS module validation
  ↓
End-to-end deployment test

## Notes

- The repository still contains a valid Node-based server architecture, but the live production host does not expose a usable Node runtime or public `/api` route.
- Decision based on verified evidence: the production path must be treated as PHP/LiteSpeed first, while the repo’s Node server remains the local reference backend until a supported host runtime is provided.
- The live MySQL failure is a production-host access issue; no database destructive work should be performed before the host credentials/grants are verified.
- No parallel backend or duplicate module manager should be created while the real runtime decision remains resolved by host evidence.
- This TODO file is the live task registry and must stay aligned with real host facts and code state.

## Dependency order

Production runtime
  ↓
Backend selection and routing
  ↓
Database connectivity
  ↓
Server storage / persistence
  ↓
Admin and module runtime
  ↓
GPS module validation
  ↓
End-to-end deployment test

## Notes

- The repository still contains a valid Node-based server architecture, but the live production host does not expose a usable Node runtime or public `/api` route.
- The verified host facts are: LiteSpeed/PHP 8.5.9, no normal Node runtime in PATH, no reachable port 3000, and public `/api/*` returning 404.
- The actual routing question is therefore host-level and must be solved in the live PHP/LiteSpeed environment before any API or storage changes are made.
- No parallel backend or duplicate module manager should be created while the real runtime decision remains unresolved.
- This TODO file is the live task registry and must stay aligned with real host facts and code state.

## Dependency order

Production runtime
  ↓
Backend selection and routing
  ↓
Database connectivity
  ↓
Server storage / persistence
  ↓
Admin and module runtime
  ↓
GPS module validation
  ↓
End-to-end deployment test

## Notes

- The repository currently contains a Node-based server architecture and a valid module lifecycle repair.
- The verified production host facts still show: LiteSpeed/PHP 8.5.9, no normal Node runtime in PATH, no reachable Port 3000, public /api/* returning 404, MySQL access denied for the configured app user.
- No code should be reimplemented or duplicated while the root runtime and host route remain unresolved.
- The next work must determine the actual viable production runtime and route before changing the architecture.
- This TODO file is the live task list; it must be kept current with each relevant technical step.

## Architecture decision and controlled PHP + MySQL migration roadmap

Decision gate: the currently verified production host is cPanel + LiteSpeed + PHP 8.5.9 with reachable MySQL on localhost:3306 and no usable Node/Passenger runtime. The target architecture for the production server is therefore PHP + MySQL as the authoritative server core, with browser-side LocalStorage/IndexedDB kept for genuine offline-first data only. No parallel Node/PHP/JSON/SQLite/MySQL hybrid server runtime is allowed.

### Phase ledger

#### PHASE 0 – Bestandsaufnahme
- [x] ERLEDIGT
- Description: Confirm current production reality, runtime constraints, auth/model/data flows, and failed Node runtime assumptions.
- Dependencies: none
- Affected components: WORKFLOW.md, TODO.md, server.md, package.json, package scripts, server bootstrap, PHP webroot, diagnose page
- Status: completed and documented with production facts
- Test criterion: Live diagnostics confirm LiteSpeed/PHP active, Node missing, MySQL reachable, /api/* 404
- Result/Notes: Production host is not a valid Node runtime host; Node app is not active in production.

#### PHASE 1 – Zielarchitektur
- [x] ERLEDIGT (Design finalisiert, keine Implementierung)
- Description: Define and confirm the target production architecture: PHP + MySQL as server core; browser LocalStorage/IndexedDB for offline-first; no Node production runtime; no Passenger requirement; no parallel server stack.
- Dependencies: PHASE 0
- Affected components: webroot, server runtime, documentation, app/frontend integration contracts, module API contracts
- Status: architecture definition completed as binding target for production on cPanel/LiteSpeed
- Test criterion: target architecture fits cPanel/LiteSpeed + PHP + MySQL host and does not require Node or a background server process
- Result/Notes:
  - Final productive chain is fixed: Browser/App -> LiteSpeed -> PHP -> MySQL.
  - PHP + MySQL is the only productive server core. Node/Passenger is explicitly not a production prerequisite.
  - No parallel Node/PHP/JSON/SQLite/MySQL server architecture is allowed.
  - Offline-first remains client-side only (LocalStorage/IndexedDB), not authoritative server persistence.
  - Authoritative online persistence is MySQL.
  - Production baseline remains the verified cPanel/LiteSpeed host with `/api/*` currently 404 on public host.
  - Existing Node assets are classified as follows:
    - **Fachlich übernehmen (domain logic):** auth/session/roles/users/settings/audit/backup/release semantics from `server/services/*`, module lifecycle semantics from `platform/module-*`, setup semantics from `webroot/setup.php` and setup APIs.
    - **Nach PHP portieren:** API routing in `server/bootstrap/server.js`, service logic in `server/services/*`, persistence semantics now in `config/*.json` and `server/runtime/*`.
    - **Ersetzen:** JSON/file persistence (`config/*.json`, `sessions.json`, `audit-log.json`) by MySQL tables; token-header-centric admin write flows by session + permission model on PHP side.
    - **Entfallen (produktiv):** Node HTTP runtime (`server/server.js`) as hosting requirement, file-authoritative admin state, Node-specific deploy assumptions.
    - **Nicht mehr benötigt nach Migration:** server-authoritative JSON/SQLite fallback storage paths and Node runtime dependency on public host.

#### PHASE 2 – Datenmodell / MySQL-Schema
- [x] ERLEDIGT (fachliches Schema-Design, keine DB-Ausführung)
- Description: Define authoritative server data model for users, roles, permissions, sessions, settings, audit, modules, module state, schema migrations, setup state, backups, release state, and CatchTrack data.
- Dependencies: PHASE 1
- Affected components: proposed PHP model layer, MySQL schema, migration scripts, deployment docs, admin contracts
- Status: conceptual schema completed; still pending implementation and migration approval
- Test criterion: every table maps to a concrete function; no unnecessary or speculative tables; user IDs retain reserved range 0-100 and real users start at 101
- Result/Notes:
  - No MySQL table is created in this phase.
  - User-ID convention is fixed and preserved: IDs 0-100 reserved; real users start at 101; first real admin user is 101.
  - Core table design (conceptual):
    - `users`: purpose=user accounts; key fields=`id BIGINT`, `username`, `email`, `password_hash`, `status`, `display_name`, timestamps; PK=`id`; indexes=`username unique`, `email unique`, `status`; supports login/admin user management.
    - `roles`: purpose=role definitions; key fields=`id BIGINT`, `role_key`, `name`, `description`, `is_system`, timestamps; PK=`id`; unique index on `role_key`; supports RBAC role model.
    - `permissions`: purpose=permission catalog; key fields=`id BIGINT`, `permission_key`, `description`, `scope`; PK=`id`; unique index on `permission_key`; supports server-side authorization.
    - `user_roles`: purpose=user-role assignment; key fields=`user_id`, `role_id`, `assigned_at`, `assigned_by`; PK composite (`user_id`,`role_id`); FK to `users`,`roles`; indexes on both FKs; supports many-to-many role assignment.
    - `role_permissions`: purpose=role-permission mapping; key fields=`role_id`,`permission_id`,`granted_at`; PK composite (`role_id`,`permission_id`); FK to `roles`,`permissions`; supports RBAC grants.
    - `sessions`: purpose=server sessions; key fields=`session_id`, `user_id`, `csrf_token`, `issued_at`, `last_seen_at`, `expires_at`, `status`, `ip`, `user_agent`; PK=`session_id`; FK=`user_id`; indexes on `user_id`,`expires_at`,`status`; supports auth lifecycle.
    - `settings`: purpose=system/app settings; key fields=`setting_key`, `setting_value_json`, `updated_by`, `updated_at`; PK=`setting_key`; FK `updated_by` -> `users.id` nullable; supports admin settings.
    - `modules`: purpose=module registry metadata; key fields=`id BIGINT`, `module_key`, `name`, `version`, `manifest_json`, `filesystem_path`, `is_present`, timestamps; PK=`id`; unique index on `module_key`; supports discovery/registry separation.
    - `module_state`: purpose=runtime/module status per module; key fields=`module_id`, `status`, `is_enabled`, `installed_version`, `last_error`, `changed_by`, `changed_at`; PK=`module_id`; FK=`module_id`->`modules.id`; supports activation/deactivation persistence.
    - `module_migrations`: purpose=module-specific migration history; key fields=`id`, `module_id`, `migration_key`, `applied_at`; unique (`module_id`,`migration_key`); FK to `modules`; supports module install/update lifecycle.
    - `schema_migrations`: purpose=core schema versioning; key fields=`id`, `migration_key`, `checksum`, `applied_at`; unique `migration_key`; supports deterministic setup/migration.
    - `setup_status`: purpose=installation/bootstrap status; key fields=`id` (singleton), `status`, `current_step`, `details_json`, `updated_at`, `updated_by`; supports setup state without JSON files.
    - `audit_log`: purpose=immutable operational audit; key fields=`id BIGINT`, `action`, `resource`, `resource_id`, `actor_user_id`, `details_json`, `result`, `created_at`; PK=`id`; FK `actor_user_id`; indexes on `action`, `resource`, `created_at`; supports traceability.
    - `backups`: purpose=backup metadata; key fields=`id BIGINT`, `backup_key`, `label`, `provider`, `status`, `file_ref`, `meta_json`, timestamps; unique `backup_key`; supports backup inventory.
    - `release_state`: purpose=release/health status; key fields=`id` (singleton), `version`, `environment`, `status`, `maintenance_mode`, `maintenance_reason`, `checks_json`, `checked_at`; supports release readiness endpoints.
  - Deferred/minimal now: CatchTrack domain tables and advanced sync queue tables remain out of core until exact functional requirements are approved in PHASE 9/10.

#### PHASE 3 – PHP-Core
- [~] IN ARBEIT (Implementierung gestartet)
- Description: Create the minimal PHP app/core foundation: bootstrap, config loading, environment validation, DB access layer, exception handling, response format, logging, security hooks, and app lifecycle.
- Dependencies: PHASE 1, PHASE 2
- Affected components: new PHP entry points, config/bootstrap files, shared DB layer, error handling, app bootstrap, security wrapper
- Status: base implementation started in repository (no production deploy, no DB migration)
- Test criterion: PHP core boots under LiteSpeed/PHP and reads env config without needing Node or Passenger
- Result/Notes:
  - The next implementation phase will treat Neutral as a portable platform core, not a single fixed app.
  - Implemented portable PHP core foundation under `core/php`:
    - `core/php/bootstrap.php`
    - `core/php/src/EnvLoader.php`
    - `core/php/src/AppConfig.php`
    - `core/php/src/AppLogger.php`
    - `core/php/src/Database.php`
    - `core/php/src/JsonResponse.php`
    - `core/php/src/Security.php`
    - `core/php/src/AppRuntime.php`
  - Added first PHP API status entry points for core bootstrap/runtime verification:
    - `webroot/api/status.php`
    - `webroot/api/index.php`
  - Extended PHASE-3 setup/runtime architecture to avoid duplicate logic and keep installation idempotent:
    - `core/php/src/SetupStateStore.php` (runtime setup status persistence abstraction)
    - `core/php/src/PrerequisiteChecker.php` (portable prerequisite/env/path/extension/db checks)
    - `core/php/src/SetupInstaller.php` (idempotent install activation flow from `.env`)
    - `core/php/src/InfrastructureCatalog.php` (generic future-ready connection/service contract baseline)
    - `webroot/api/setup/status.php` and `webroot/api/setup/install.php` (PHP setup API surface)
  - Updated `webroot/setup.php` to use the new core setup services:
    - keeps setup UI intentionally simple
    - reads authoritative configuration from `.env`
    - shows prerequisite check results directly in setup
    - performs install via centralized `SetupInstaller` instead of ad-hoc inline state payload building
    - keeps install idempotent (`ACTIVE` state guarded, no repeated destructive actions)
  - Validation executed:
    - `php -l` passed for all new/updated core files and existing `webroot/setup.php`, `webroot/diagnose.php`.
    - `php core/php/tests/smoke.php` passed (core bootstrap + setup status orchestration).
    - Existing Node test suite passed: `npm test -- --test-reporter=spec` (92/92).
    - Runtime smoke calls on `/api/status` and `/api/setup/status` return structured JSON state.
  - Local environment note:
    - local CLI currently lacks `pdo_mysql`; endpoint reports this explicitly as `database.state=error` instead of crashing.
    - setup prerequisite checks therefore expose DB connectivity as failed in local CLI until `pdo_mysql` is available.
  - No SQL execution, no schema migration, no production deploy, no production file deletion performed.
  - Core must expose reusable setup/admin/module/infrastructure management for future apps without core rewrites.

#### PHASE 4 – Auth / Users / Roles / Permissions
- [ ] OFFEN
- Description: Rebuild the server-side auth and authorization system using PHP + MySQL: users, login/logout, sessions, password hashing, RBAC, permissions, abuse protection, CSRF, and admin auth flows.
- Dependencies: PHASE 3
- Affected components: auth controllers, user model/service, role model/service, permission model/service, session handling, password hashing, middleware
- Status: not started
- Test criterion: authenticated requests resolve identity and authorization from MySQL-backed state; no file-based user store remains authoritative for production
- Result/Notes: must preserve user ID convention and role semantics from the current Neutral model

#### PHASE 5 – Setup / Migration / Bootstrap
- [ ] OFFEN
- Description: Implement a versioned setup and bootstrap sequence for environment validation, DB checks, schema version checks, initial schema creation, first admin creation, and migration execution.
- Dependencies: PHASE 2, PHASE 3, PHASE 4
- Affected components: setup pages, bootstrap controller, schema_migrations table, installation state logic, admin bootstrap logic
- Status: not started
- Test criterion: an empty production DB can be recognized as uninitialized, system schema can be created in a versioned way, and setup cannot safely run repeatedly without guarded state
- Result/Notes: setup remains read-only until the production DB is explicitly approved for schema creation under the migration plan

#### PHASE 6 – Admin-System
- [~] IN ARBEIT (Bedien-/Fachkonzept definiert, Implementierung offen)
- Description: Rebuild admin flows for users, roles, settings, system health, and config management using PHP/MySQL-backed server logic.
- Dependencies: PHASE 3, PHASE 4, PHASE 5
- Affected components: admin controllers, settings model, user management, role management, dashboard pages, security checks
- Status: interaction and information architecture defined for implementation
- Test criterion: admin workflows work from server-side state and enforce role-based access
- Result/Notes:
  - UI target is tablet/PC first with left explorer-style navigation as primary structure.
  - Required nav groups:
    - Dashboard
    - Benutzer
    - Rollen & Berechtigungen
    - Module
    - Einstellungen
    - System / Diagnose
    - Logs / Audit
    - Updates / Backup
  - Current gap analysis:
    - Existing admin UI (`webroot/admin/*`) currently exposes only users/roles/settings views.
    - No module management view exists yet in admin router.
    - Existing server route `/api/modules` is read-only module manifest listing; no register/activate/deactivate endpoints.
  - Required functional concept:
    - Benutzer: list/create/edit/status activate/deactivate/delete + role assignments.
    - Rollen & Rechte: role CRUD, permission catalog visibility, role-permission assignment, user-role assignment, server-enforced checks.
    - Module: discover file presence, register, install/migrate, activate/deactivate, detect missing/present, persist state, enforce lifecycle transitions.
  - GPS module diagnosis:
    - `app/modules/gps/module.json` and `/api/modules` discovery can expose module metadata.
    - Admin cannot currently activate/deactivate GPS because module control endpoints and module UI are missing.
    - Browser-side `ModuleManager.discoverModules()` intentionally re-registers discovered modules as `installed` + `active=false`; status is not persisted server-side.
  - Canonical module lifecycle for future implementation:
    - Discovery -> Registrierung -> Installation/Migration -> Aktivierung -> Nutzung -> Deaktivierung -> optionale Entfernung
    - Clear separation required between module files, registry metadata, runtime state, module-owned data, and migration history.

#### PHASE 7 – API / Routing
- [ ] OFFEN
- Description: Define the production API strategy for PHP-only hosting: central router or a small set of PHP endpoint handlers, request validation, auth checks, response format, and API versioning.
- Dependencies: PHASE 3, PHASE 4, PHASE 5, PHASE 6
- Affected components: /api routes, router logic, frontend API client contracts, compatibility layer, response schema
- Status: not started
- Test criterion: frontend requests hit stable PHP entry points and are not coupled to Node/Port 3000
- Result/Notes: prefer a clean PHP API layer over ad-hoc Node emulation

#### PHASE 8 – Module-System
- [ ] OFFEN
- Description: Rebuild the module registry, module status, install/enable/disable/update flows, and module migration support on top of PHP + MySQL without creating independent module storage silos.
- Dependencies: PHASE 2, PHASE 3, PHASE 7
- Affected components: module registry, module_state table, module migrations, app-level module registration, admin module UI
- Status: not started
- Test criterion: module installation, activation, and migrations are versioned and store authoritative state in MySQL
- Result/Notes: module storage remains centralized in the server-core data model

#### PHASE 9 – Offline-/Sync-System
- [ ] OFFEN
- Description: Define client-local offline first behavior separately from server-authoritative online data. Keep LocalStorage/IndexedDB for offline capture, GPS, and local caches; server handles online identities, settings, modules, and sync state.
- Dependencies: PHASE 1, PHASE 2, PHASE 7
- Affected components: browser storage, sync service, schema for sync queue, server sync endpoints, client data model
- Status: not started
- Test criterion: local browser state is clearly separated from central server state; no direct use of local JSON or SQLite as server-core persistence
- Result/Notes: LocalStorage/IndexedDB remain client-only, not server-authoritative persistence

#### PHASE 10 – Existing module migration
- [ ] OFFEN
- Description: Evaluate each current module and app feature for what can be ported as-is, what must be reimplemented, what can be removed, and what must be remapped to it. Ensure the old Node module semantics remain functionally preserved in the new server core.
- Dependencies: PHASE 8, PHASE 9
- Affected components: app modules, app shell, UI integration, module metadata, admin and GPS functionality
- Status: not started
- Test criterion: each module has a defined server-side state model and a migration plan; no orphaned modules remain
- Result/Notes: module behavior must be preserved as a functional requirement, not by copying the old implementation details 1:1

#### PHASE 11 – Frontend-Anbindung
- [ ] OFFEN
- Description: Adapt the browser/front-end code to the PHP-backed API and server state; maintain the app shell while removing dependence on Node-only routes or Port 3000 assumptions.
- Dependencies: PHASE 7, PHASE 9, PHASE 10
- Affected components: webroot UI, admin pages, app shell, API client, module loaders, browser state handling
- Status: not started
- Test criterion: app pages work against PHP endpoints and do not rely on public Node hosting or local-only API assumptions
- Result/Notes: this phase must be explicit and must not be treated as a hidden runtime fallback

#### PHASE 12 – Deployment / Env / Whitelist-Analyse
- [x] ERLEDIGT (Analyse/Design, read-only)
- Description: Audit the existing FTPS/cPanel deployment, env configuration, allow-list logic, and file comparison mechanics before changing any deployment behavior. The goal is to determine why near-all files appear as new on each deploy and to isolate the real causes before changing code.
- Dependencies: PHASE 3, PHASE 7, PHASE 11
- Affected components: `.env`, deploy whitelist, `scripts/manual-ftps-deploy.js`, FTP/FTPS upload logic, remote/local comparison, timestamps, file sizes, hash/checksum logic, file inventory, deployment policy
- Status: completed (read-only analysis executed on 2026-08-25; no deploy logic change)
- Test criterion: deploy analysis clearly explains the current file synchronization behavior, identifies any differential comparison bugs, and describes the required target state for the PHP migration
- Result/Notes: root cause documented. `scripts/manual-ftps-deploy.js` computes local hash diff (`upload/update/keep`) but ignores it during transfer and always runs `lftp mirror -R --only-newer` over the full staging tree. Because `.deploy-staging` is rebuilt on each run via `fs.copyFileSync`, staged mtimes become newer and `--only-newer` tends to re-upload unchanged files. No remote hash-based file-to-file comparison is performed.

#### PHASE 12A – Produktionsbereinigung / Altbestand
- [x] ERLEDIGT (Inventarisierung/Klassifizierung, read-only)
- Description: Create a controlled production cleanup plan for the legacy Node/JSON/SQLite/runtime architecture. Before any deletion, the production server must be inventoried and every file/dir must be classified as keep, migrate, replace, delete or manual-review. This phase is separate from ordinary deployment and MUST NOT be executed as a blind full wipe.
- Dependencies: PHASE 12, PHASE 13
- Affected components: live production webroot, runtime dirs, config dirs, server/runtime, SQLite files, JSON state files, Node app artifacts, old API routes, old setup/bootstrap files, backups, env files, uploads, persistent data directories
- Status: completed for analysis scope (inventory and classification created; no cleanup executed)
- Test criterion: a complete inventory exists before any deletion, sensitive files are protected and classified, and deletion is explicitly deferred until a controlled migration pass is approved
- Result/Notes: remote inventory was collected read-only via FTPS listing. No deletion, overwrite, migration, schema change, or deploy-script change was executed.

#### PHASE 12B – Erstinstallation vs. normales Deployment
- [x] ERLEDIGT (Soll-Design, no execution)
- Description: Distinguish the migration/first-install workflow from normal later deployments. First installation is a controlled migration of the live environment, while normal deployment is a Git-based code sync that must never touch production data or `.env` values.
- Dependencies: PHASE 12, PHASE 12A
- Affected components: installation scripts, deployment docs, production environment policy, deployment allowlist, config management, data protection rules
- Status: completed for design scope (policy separation defined)
- Test criterion: the process clearly separates initial migration steps from later standard deploy steps, and ensures `.env`, uploads, persistent data and production credentials are never overwritten by routine deploy logic
- Result/Notes: normal deployment is non-destructive sync only; first-install/migration and cleanup remain explicit, separate, approved procedures.

#### PHASE 13 – Produktionsinstallation
- [ ] OFFEN
- Description: Install the new PHP + MySQL target on the verified production host structure using the existing FTPS/cPanel deployment path; validate environment and initialize schema in a controlled workflow.
- Dependencies: PHASE 5, PHASE 12, PHASE 12A, PHASE 12B
- Affected components: real webroot, real app root, live env file, live DB schema, setup flow, admin bootstrap, runtime directories, production files to be migrated or replaced
- Status: not started
- Test criterion: app boots and setup completes without Node/Passenger, without port 3000, and without a background server process; production data and `.env` remain protected
- Result/Notes: production DB remains untouched until schema migration and setup are ready and approved

#### PHASE 14 – Tests
- [ ] OFFEN
- Description: Execute only relevant read-only and functional tests that validate PHP core, setup flow, MySQL schema, API routes, and module flows without altering production data.
- Dependencies: PHASE 11, PHASE 12, PHASE 12A, PHASE 12B, PHASE 13
- Affected components: test suite, PHP validation commands, API smoke tests, admin & module flow checks, MySQL schema verification, deployment validation
- Status: not started
- Test criterion: relevant tests pass in a safe environment; no production data mutation is performed
- Result/Notes: test commands must not create or modify live production data

#### PHASE 15 – Abschaltung / Entfernung des alten Node-Pfades
- [ ] OFFEN
- Description: Remove or retire the Node production runtime dependency once the PHP + MySQL path is validated. No hidden parallel runtime remains.
- Dependencies: PHASE 13, PHASE 14
- Affected components: package scripts, deployment docs, workflow docs, startup instructions, host assumptions, legacy runtime files and references
- Status: not started
- Test criterion: production runtime is defined by PHP + MySQL only; Node is no longer a required runtime for public hosting
- Result/Notes: this must be explicit and complete, not partial or mixed

#### PHASE 16 – Abschließende Produktionsprüfung
- [ ] OFFEN
- Description: Run final end-to-end verification of setup, admin, permissions, module registration, API routing, DB persistence, offline first sync behavior, and deployment safety.
- Dependencies: PHASE 14, PHASE 15
- Affected components: final production host, DB schema, PHP API, admin portal, module state, setup and migrations, deployment policy
- Status: not started
- Test criterion: live system works on cPanel + LiteSpeed + PHP + MySQL without Node or Passenger; no manual DB fixes required after deployment
- Result/Notes: final sign-off only after the architecture and migration plan have been validated in production conditions

### Deployment, env and whitelist requirement set
- [x] ERLEDIGT (Analyse abgeschlossen)
- Description: The deploy mechanism must be treated as a security and migration control surface, not an automatic file-flush. This analysis must be completed before any deployment or cleanup logic is modified.
- Dependencies: PHASE 12
- Affected components: `.env`, deployment whitelist, local file inventory, remote file inventory, FTP/FTPS sync logic, timestamp handling, file-size comparison, checksum comparison, new-file detection, modified-file detection, unchanged-file detection, deleted-file detection
- Status: completed (2026-08-25 analysis run)
- Test criterion: the deploy code is able to explain the reason why near-all files appear as new on each deployment and proposes a deterministic fix; no deploy change is made before root cause analysis is documented
- Result/Notes: root cause and target rules documented below; implementation intentionally deferred.

#### Required deploy analysis tasks
- Determine why the current deploy uploads almost all whitelisted files on each run.
- Confirm whether a real differential comparison exists or whether the logic is effectively comparing unreliable metadata.
- Verify whether local and remote files are compared using the same normalization, path representation, timestamp format and file-size semantics.
- Document whether time zone, OS-specific path casing, permissions, timestamps or empty files are causing false positives.
- Determine whether the current deploy is effectively rebuilding the remote state from scratch or simply re-uploading the full allowlist each time.
- Define a safe target behavior: new file -> upload, modified file -> upload, unchanged file -> skip, local deleted file -> do not auto-delete production file, production deletion -> only through a controlled cleanup/migration step.
- Decide whether the deploy logic must be changed only after the root cause is proven and agreed.

#### Analyseprotokoll 2026-08-25 (verbindlich, read-only)
- Schritt 0 [x]: `TODO.md` vollständig gelesen; `WORKFLOW.md` vollständig gelesen.
- Schritt 0 [x]: `WORKFLOW.md` auf GitHub `main` nachgewiesen (Datei vorhanden).
- Schritt 0 [x]: Produktionsserver-Prüfung via FTPS-Listing: `WORKFLOW.md` nicht vorhanden, `TODO.md` nicht vorhanden.
- Schritt 1 [x]: Bestandsvergleich erstellt (A=GitHub-main, B=lokale Arbeitskopie, C=Produktion).
  - A vs. B: identischer Track-Set (228 Dateien); lokal abweichend im Working Tree nur `.env` und `TODO.md`.
  - C: produktiv vorhanden 91 Dateien plus 18 Verzeichnisse (read-only erfasst).
- Schritt 1 [x]: Produktionsklassifizierung durchgeführt.
  - **BEHALTEN**: `app/`, `apps/`, `platform/`, `server/api/`, `server/bootstrap/`, `server/config/`, `server/database/`, `server/middleware/input-validation.js`, `server/services/`, `webroot/`, `package.json`, `package-lock.json`.
  - **PRODUKTIONSDATEN – NICHT ANFASSEN**: `.env` (server-only), `logs/`, `developer-logs/`, `.ftpquota`, host/runtime-generierte Logs.
  - **MANUELL PRÜFEN**: `developer.php`, `developer-diagnose.log`, `server/runtime/setup-debug.log`, `server/runtime/setup-state.json` (Betriebs-/Migrationsrelevanz vor Löschung prüfen).
  - **MIGRIEREN/ERSETZEN (bei PHP-Zielarchitektur, noch nicht ausführen)**: verbleibende Node-only Runtime-Komponenten unter `server/` und `platform/` gemäß späteren PHP-Core/API-Phasen.
  - **LÖSCHEN**: keine Datei freigegeben; Löschung ausdrücklich zurückgestellt bis kontrollierte Bereinigungsfreigabe.
- Schritt 2 [x]: FTPS Root-Cause Analyse abgeschlossen.
  - Ursache bestätigt: Uploadentscheidung im Transferpfad basiert nicht auf dem vorher berechneten Hash-Diff, sondern auf `mirror -R --only-newer` des gesamten Staging-Baums.
  - Ursache bestätigt: Staging-Rebuild setzt neuere mtimes, wodurch unveränderte Dateien als „newer“ erscheinen können.
  - Ursache wahrscheinlich: dadurch entsteht der Effekt „nahezu alles wird erneut übertragen“.
  - Ursache ausgeschlossen: fehlender Hash-Algorithmusfehler im lokalen Manifest-Hashing (SHA-256 ist korrekt für lokale Änderungsdetektion).
  - Weitere Prüfung erforderlich: Server-seitiges FTPS-Zeitstempelverhalten/Zeitzone pro Dateityp, falls nach Logikfix Restabweichungen bleiben.
- Schritt 3 [x]: Soll-Deploy-Logik definiert (nur Design).
  - lokal neu + remote fehlt => übertragen
  - lokal geändert => übertragen
  - unverändert => nicht übertragen
  - remote vorhanden, lokal gelöscht => standardmäßig nicht löschen
  - `.env`, Uploads, Backups, Produktionsdaten => nie überschreiben/löschen im normalen Deploy
  - Bereinigung/Löschung => separater, freigegebener Kontrollvorgang
- Schritt 4 [x]: `webroot/diagnose.php` bewertet.
  - Zweck: Host-/Runtime-/DB-Read-only Diagnoseoberfläche plus JSON-Report.
  - Risiko: liefert Infrastruktur-/Konfigurations-Metadaten; ohne gesetztes `NEUTRAL_DIAGNOSE_TOKEN` öffentlich aufrufbar.
  - Empfehlung: nicht dauerhaft offen lassen; nur geschützt (Token + Zugriffsbeschränkung) oder temporär für Supporteinsätze.
- Schritt 5 [x]: TODO/WORKFLOW/Whitelist-Deploy-Einordnung abgeschlossen.
  - Aktuelle Allowlist enthält weder `TODO.md` noch `WORKFLOW.md`.
  - Zielentscheidung: `TODO.md` künftig deploybar mitführen; `WORKFLOW.md` standardmäßig repository-only, außer explizit für Serverbetrieb benötigt.

#### Designprotokoll 2026-08-25 – Analyseauftrag (4 Aufgaben, ohne Implementierung)

##### Aufgabe 1 [x] – PHASE 1 Zielarchitektur finalisiert
- Prüfbasis: `TODO.md`, `WORKFLOW.md`, `server.md`, Repository-Stand, read-only Produktionschecks (`/api/status`=404, `/webroot/setup.php`=200, `/webroot/admin.html`=200, FTPS-Bestand bestätigt).
- Verbindliche Zielarchitektur:
  - Browser/App -> LiteSpeed -> PHP -> MySQL
  - keine Node/Passenger-Produktivvoraussetzung
  - keine parallele Hybrid-Serverarchitektur
  - Offline-first rein clientseitig
  - MySQL als einzige autoritative Online-Persistenz

##### Aufgabe 2 [x] – Admin- und Bedienkonzept definiert
- IA/UX-Entscheidung:
  - Primärnavigation links als Explorer-Struktur (tablet/PC-first), hierarchisch erweiterbar.
  - Mindeststruktur: Dashboard, Benutzer, Rollen & Berechtigungen, Module, Einstellungen, System/Diagnose, Logs/Audit, Updates/Backup.
- Benutzerverwaltung (soll später vollständig serverseitig durchsetzbar sein):
  - Anzeigen, Anlegen, Bearbeiten, Aktivieren/Deaktivieren, Löschen (berechtigungsabhängig), Rollenzuweisung, Statusanzeige.
- Rollen/Berechtigungen:
  - Rollen-CRUD, Berechtigungs-Katalog, Role-Permission-Zuweisung, User-Role-Zuweisung, serverseitige Enforcement.
- Modulverwaltung (verbindliche Soll-Funktion):
  - Discovery vorhandener Modulordner
  - Auswertung Modulmetadaten
  - Anzeige aller gefundenen/registrierten Module
  - Registrierung, Installation/Migration, Aktivierung, Deaktivierung
  - Persistenter Modulstatus
  - Erkennung vorhanden/fehlend
  - Kein Auto-Aktivieren nur durch Dateivorhandensein
- Root-Cause GPS im Admin:
  - GPS-Dateien/Manifest sind vorhanden (`app/modules/gps`), Discovery-Endpunkt ist read-only verfügbar.
  - Bestehende Admin-UI hat keine Modulansicht und keine Modul-Steuer-API für activate/deactivate.
  - Bestehender Browser-ModuleManager persistiert Aktivzustand nicht serverseitig; Discovery registriert auf `installed` + `active=false`.

##### Aufgabe 3 [x] – PHASE 2 Datenmodell / MySQL-Schema entworfen (fachlich)
- Kernentitäten finalisiert: users, roles, permissions, user_roles, role_permissions, sessions, settings, modules, module_state, module_migrations, schema_migrations, setup_status, audit_log, backups, release_state.
- Reservierte User-ID-Konvention bleibt unverändert:
  - 0-100 reserviert
  - erste reale Benutzer-ID: 101
- Keine spekulativen Zusatztabellen als Pflichtbestandteil:
  - CatchTrack-/Domänentabellen und erweiterte Sync-Tabellen nur nach fachlicher Detailfreigabe in späteren Phasen.

##### Aufgabe 4 [x] – Migration / Altbestand / Deployment-Design festgelegt
- Klassifikation des aktuellen Bestands (Designstand):
  - **BEHALTEN (bis Migration abgeschlossen):** `webroot/` Assets, Diagnose-/Setup-Oberflächen, relevante App-/Modulmetadaten, zentrale Dokumente (`TODO.md`).
  - **NACH PHP PORTIEREN:** Node-Serverrouten und Services aus `server/bootstrap/server.js` und `server/services/*`.
  - **ERSETZEN:** JSON-/Dateipersistenz (`config/*.json`, `sessions.json`, `audit-log.json`) durch MySQL.
  - **MIGRIEREN:** bestehende Rollen-, Nutzer-, Settings-, Modul-, Setup-, Audit-, Backup- und Release-Zustände in das MySQL-Modell.
  - **LÖSCHEN (später, freigegeben, kontrolliert):** Node-Produktivruntime-Artefakte erst nach verifizierter PHP-Inbetriebnahme.
  - **MANUELL PRÜFEN:** `developer.php`, `developer-diagnose.log`, `server/runtime/setup-debug.log`, `server/runtime/setup-state.json`, historische runtime/log-Artefakte.
  - **PRODUKTIONSDATEN – NICHT ANFASSEN:** `.env`, Uploads, Backups, host-generierte Logs/Serverdaten.
- Deploy-Sollregeln (verbindlich als Design):
  - neu lokal + remote fehlt -> upload
  - lokal geändert -> upload
  - identischer Inhalt -> skip
  - lokal gelöscht -> im normalen Deploy kein Auto-Delete remote
  - `.env`, Uploads, Backups, Produktionsdaten -> niemals überschreiben/löschen im Normal-Deploy
  - Bereinigung nur als separater, explizit freigegebener Vorgang
- Whitelist/Bestandskategorien für das künftige PHP-Deployment:
  - Repository-only: `WORKFLOW.md`, CI/Tooling, lokale Scripts, Tests
  - Normal deploybar: PHP-Core/API/Admin/Module/Assets/Setup/Migrationen/`TODO.md`
  - Produktiv geschützt (nie überschreiben): `.env`, Uploads, Backups, persistente Host-Daten
  - Nur Erstinstallation/Migration: einmalige Bootstrap-/Schema-Initialisierung
  - Nur kontrollierte Bereinigung: Legacy-Node-Artefaktentfernung
  - Niemals deployen: lokale Secret-/Entwicklungsartefakte, `node_modules/`, Git-Metadaten

#### Designprotokoll 2026-08-25 – Nächste Implementierungsphase (Architektur/Design only)

##### Bereits entschieden (übernommen und bestätigt)
- Produktionszielarchitektur bleibt verbindlich: Browser/App -> LiteSpeed -> PHP -> MySQL.
- Keine produktive Node/Passenger-Voraussetzung.
- Keine parallele Node/PHP/JSON/SQLite/MySQL-Serverarchitektur.
- Offline-first bleibt clientseitig (LocalStorage/IndexedDB), MySQL bleibt autoritative Online-Persistenz.
- Modul-Lifecycle bleibt verbindlich:
  - DISCOVER -> REGISTER/INSTALL -> INACTIVE -> ACTIVATE -> ACTIVE -> DEACTIVATE
  - Discovery bedeutet niemals automatische Aktivierung.

##### Neu entschieden (für die nächste Implementierungsphase verbindlich)

1) Portable Neutral-Plattformarchitektur
- Neutral wird als wiederverwendbarer Core festgeschrieben:
  - Setup/Installation
  - Konfiguration/ENV
  - Admin-System
  - Benutzer/Rollen/Berechtigungen
  - Modulverwaltung
  - Serververwaltung
  - API-Verwaltung
  - Datenbankverwaltung
  - Audit/Logs
  - Backup
  - Migration
  - Application Layer (app-spezifisch) + Module
- Strikte Schichtentrennung:
  - **Neutral Core** (plattformweit wiederverwendbar)
  - **Application Layer** (pro App variierend, ohne Core-Fork)
  - **Module Layer** (fachliche Erweiterungen über definierte Contracts)
- Installationsroutine für künftige Apps bleibt identisch:
  - Core deployen -> `.env` hinterlegen -> Setup -> DB-Check -> Core-Schema installieren/migrieren -> ersten Admin anlegen -> Module discovern -> gewünschte Module aktivieren -> App-Konfiguration laden.
- Portabilitätsregeln:
  - keine hartcodierten Produktionspfade
  - installationspfadunabhängig
  - ENV-/Konfig-Scopes getrennt (core/app/module)
  - app-spezifische Features nur im Application Layer oder Modul, nicht im Core-Hardcode

2) Professionelles Admin-Bedienkonzept (Tablet/PC-first)
- Primäre Informationsarchitektur: linke Explorer-Navigation mit einklappbaren Gruppen.
- Mindestbereiche:
  - Dashboard
  - Benutzer (Benutzer, Rollen, Berechtigungen)
  - Anwendungen (aktuelle App / App-Kontext)
  - Module (installiert, verfügbar, Migrationen)
  - Infrastruktur (Server, Datenbanken, APIs, Verbindungen)
  - System (Einstellungen, Diagnose, Logs, Audit, Backups)
  - Administration (Setup, Migrationen, Systemstatus)
- UX-Grundregeln:
  - klare aktive Position
  - keine überladene Top-Navigation
  - konsistente Abstände/Komponenten
  - sinnvolle Icons
  - tabletgerechte Klickflächen
  - Suche/Filter in größeren Listen
  - klare Success/Warning/Error-Zustände
  - Bestätigungsdialoge für destruktive Aktionen
  - keine toten Menüeinträge

3) Bedienbarkeit statt UI-Fassade (Funktionsverträge)
- Benutzer/Rollen/Rechte müssen später backendgestützt tatsächlich bedienbar sein:
  - Benutzer: create/read/update/deactivate/delete (policy-gesteuert), Rollen zuweisen
  - Rollen: create/read/update/delete (policy-gesteuert)
  - Berechtigungen: Katalog + role_permissions + serverseitige Enforcement
- Module müssen später vollständig administrierbar sein:
  - Discovery, Registrierung, Installation, Migration, Aktivierung, Deaktivierung, Status, Konfiguration, Fehlerstatus
  - optionale Entfernung erst als kontrollierte Admin-Aktion
- GPS als Referenzfall:
  - vorhandenes Modul muss im künftigen Modul-Admin sichtbar sein
  - aktueller Gap (nur read-only Discovery, keine persistente Aktivierung) ist bekannt und wird in PHASE 8 umgesetzt

4) Zukunftssichere Infrastrukturkonfiguration über Admin (Design now, no implementation)
- Aktuell bleibt Produktion Browser -> LiteSpeed -> PHP -> MySQL.
- Architektur wird vorbereitet, damit künftige Infrastruktur ohne Core-Umbau administrierbar wird:
  - Server-Targets (Typ, Host, Port, Base URL, Runtime, Status, Enable/Disable, Test)
  - Datenbankverbindungen (Typ, Host, Port, DB, User, Secret-Referenz, SSL, Test)
  - API-Verbindungen (Typ, Base URL, Auth-Modus, Endpoint-Profile, Timeout, Status, Test)
- Secrets-Prinzip:
  - keine unnötige Secret-Ausgabe im Frontend
  - nur Referenz/indirekte Verwaltung im UI, sichere Speicherung serverseitig

5) Generisches Infrastrukturmodell (konzeptionell)
- Einheitlicher Connection/Service-Ansatz:
  - `type`
  - `name`
  - `configuration`
  - `credential_reference`
  - `capabilities`
  - `status`
  - `enabled`
- Dieser Contract gilt als Basis für spätere Tabellen/API/Admin-UI in PHASE 7+.

##### Noch offen (fachlich zu entscheiden vor Implementierungsabschluss)
- Exakte API-Topologie in PHP (zentraler Router vs. modularisierte Endpoint-Gruppen hinter gemeinsamer Front-Controller-Struktur).
- Feingranulare Permission-Taxonomie (system/module/infrastructure scopes).
- Modul-Migrationsvertrag (Versionierung, Rollback-Policy, Fehlerbehandlung).
- Infrastruktur-Secret-Handling-Strategie (z. B. verschlüsselte Speicherung vs. externe Secret-Provider-Referenzen).
- Umfang der ersten Release-Welle für Infrastruktur-Admin (MVP vs. vollständiges Modell).

##### Bewusst später zu implementieren (nicht Teil dieses Auftrags)
- Jegliche PHP-Codeimplementierung.
- Jegliche SQL-Ausführung oder DB-Migration.
- Jegliche Produktionsänderung/Deploy-Anpassung/Löschung.
- Feinschliff-UI/CSS-Implementierung über die Architekturvorgaben hinaus.

#### Required whitelist redesign after PHP migration
- PHP application files
- API entry points / PHP routers / API handlers
- module files and module metadata
- CSS / JS / HTML assets
- setup / bootstrap / install flow
- migration scripts and migration manifests
- diagnosis scripts, only if deliberately retained
- runtime/config files that are explicitly managed by the application
- production data directories and files
- `.env` files outside the public webroot and excluded from regular deployment
- uploads and media files
- temporary/cache files
- backup storage

Rules:
- `.env` must never be overwritten by standard application deployment.
- production data must never be deleted or overwritten by standard deployment.
- uploads must never be deleted or overwritten by standard deployment.
- migration-generated files must be separated from user-created data and server-managed persistent state.
- the deploy allowlist must be reduced to the real runtime needs of the PHP app, not recycled from the Node architecture.

### Production cleanup requirement set
- [ ] OFFEN
- Description: Before deleting any legacy runtime artifacts, the production host must be inventoried and every item must be classified before removal. This is a separate, explicit migration step and not a side effect of deployment.
- Dependencies: PHASE 12A, PHASE 12B, PHASE 13
- Affected components: old Node files, legacy API structure, JSON persistence, SQLite files, config directories, server/runtime directories, legacy setup/bootstrap files, old runtime artifacts, other unneeded host-managed files
- Status: not started
- Test criterion: every production item is classified as keep/migrate/replace/delete/manual-review before any removal; sensitive files are excluded; no mass deletion occurs without approval
- Result/Notes: old neutral runtime artifacts are removed only in a controlled migration window and not by a general deploy process

#### Required cleanup inventory and classification
- Full production inventory of files and directories before any deletion.
- Categorization for each item: retain, migrate, replace, delete, manual review.
- Explicit protection for: `.env`, production data, user/account data, upload storage, backup storage, other host-managed files.
- Explicit review of: Node files, old API folder(s), legacy JSON storage, SQLite files, `config/`, `server/runtime/`, old setup files, old bootstrap files, runtime artefacts no longer required by PHP.
- Keep `diagnose.php` only if it is still intentionally required as a safe read-only diagnostic tool; otherwise classify it as retained for controlled diagnostics and explicitly document why.
- Deletion only after inventory and approval, never as a blind “delete everything not in whitelist” step.

### Required dependency order for implementation approval
- PHASE 0 – Bestandsaufnahme
- PHASE 1 – Zielarchitektur
- PHASE 2 – Datenmodell / MySQL-Schema
- PHASE 3 – PHP-Core
- PHASE 4 – Auth / Users / Roles / Permissions
- PHASE 5 – Setup / Migration / Bootstrap
- PHASE 6 – Admin-System
- PHASE 7 – API / Routing
- PHASE 8 – Module-System
- PHASE 9 – Offline-/Sync-System
- PHASE 10 – Existing module migration
- PHASE 11 – Frontend-Anbindung
- PHASE 12 – Deployment / Env / Whitelist-Analyse
- PHASE 12A – Produktionsbereinigung / Altbestand
- PHASE 12B – Erstinstallation vs. normales Deployment
- PHASE 13 – Produktionsinstallation
- PHASE 14 – Tests
- PHASE 15 – Abschaltung / Entfernung des alten Node-Pfades
- PHASE 16 – Abschließende Produktionsprüfung

This order is intentional: architecture and data model come first, deploy/path policy is evaluated before migration cleanup, the production migration is explicitly separated from normal deployment, and tests are performed only after the production migration path is defined and controlled.

### Core architecture summary
- Server runtime target: PHP + MySQL
- Client runtime target: browser LocalStorage/IndexedDB for offline-first only
- Authoritative online persistence: MySQL
- Node runtime: not required in production; retained only as a local reference implementation until formal deprecation
- SQLite/JSON: not accepted as authoritative production server storage for the long-term architecture
- Parallel runtime stacks: forbidden

### Hard constraints
- No production DB modifications before the schema plan is approved.
- No migration execution before the migration mechanism is versioned and documented.
- No Node/PHP/SQLite/JSON hybrid server stack after migration begins.
- No code-level implementation without updating this TODO to reflect the current phase and dependencies.

### Definition of migration completion
Migration is complete only when all of the following are true:
- PHP + MySQL is the only authoritative production server architecture
- Node is not a production requirement for the public host
- required MySQL schema is versioned and installed through a controlled migration process
- setup/bootstrap works without manual DB editing
- admin/user/auth/roles/permissions work from server-side MySQL storage
- module lifecycle uses the core registry + module state + module migrations
- API endpoints run through the PHP server path and not through Node/Port 3000
- offline-first browser behavior is clearly separated from server-authoritative state
- deployment on cPanel/LiteSpeed is deterministic and repeatable
- final production verification passes without data mutation or hidden runtime fallbacks

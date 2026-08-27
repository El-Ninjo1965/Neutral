# Neutral – Workflow

## Purpose

Neutral is a modular framework intended to support a reusable core, a neutral application shell, and installable modules. It is not a single hard-coded app and it should not be treated as such.

This file is the current operational workflow and architecture reference for future work. It is not a project history, issue log, or changelog.

## Current architecture

Neutral currently follows this model:

- Core framework services and shared infrastructure
- App-level shell and management surfaces
- Module-based extensions that are discovered and registered without being merged into the core by default

The codebase should remain structured around that separation. App-specific logic belongs in app and module layers; the core remains general-purpose infrastructure.

## Current runtime reality

The active production runtime is a shared-host PHP/LiteSpeed environment. The public host is not a public Node runtime and does not expose a working root /api/* proxy or a public Node port 3000 service.

The actual live app path is:

- /index/app/neutral/webroot/* (server-side Neutral runtime/API)
- public web-client deployment target: /index/web-app/
- FTP web-app root: / (chrooted to the dedicated web-app directory on the host)

The current verified state is: the dedicated web-app FTP account correctly contains the app bundle at the chrooted root `/`, including `index.html`, `style.css`, `user-app.js`, `api-client.js`, and `platform/`. The root cause was in the repository deploy script itself: `--web-app` mode was never honored and the script always staged the server allowlist, which caused the wrong files to be prepared for upload. That script bug has been corrected in `scripts/manual-ftps-deploy.js` so the public web-app bundle is now staged and uploaded to the dedicated FTP root and not the server path. The public URL `/index/web-app/` still serves the stale placeholder page and 404s for CSS/JS assets, which proves that the remaining blocker is the live host-side document-root or URL-mapping for `/index/web-app/`: the FTP content and public HTTP content are still not the same.

The current live diagnosis distinguishes two independent blockers:

- The public host is intercepting `/index/web-app/` and `/index/app/neutral/webroot/...` before the real Neutral app/API are served. The responses are the generic `One moment, please...` HTML challenge payload and `server: openresty/1.31.1.1`, confirming a host-side stop layer rather than a repo-side app error.
- The checked local origin PHP runtime responds with real Neutral JSON but fails when the database-backed auth/module flow is used because `pdo_mysql` is missing from the active PHP runtime. This is a production PHP runtime issue rather than a browser code issue.

The correct architectural path remains to keep the existing Neutral server API and web client and fix the environment around them instead of inventing a second auth system or duplicate module database. The minimum viable fix is:

1. correct public host document root / alias / rewrite / OpenResty mapping so `/index/web-app/` and `/index/app/neutral/webroot/` reach the real PHP app,
2. enable the actual production PHP runtime to load `pdo_mysql` or the matching MySQL PDO driver,
3. verify the DB connectivity and then re-run the auth/session/module tests against the real server API.

### Practical connection options that preserve the existing architecture

The repository work does not need a rewrite of the app core to reach the server. The following direct-connection options are valid and compatible with the existing Neutral architecture as long as they keep the public client on the server-backed API contract:

1. Preferred host-side fix: keep the same web app and API paths, but correct the live host mapping so `/index/web-app/` serves the web-app bundle and `/index/app/neutral/webroot/` serves the PHP app and API. This is the cleanest solution because it keeps the current API base and client contract stable.
2. Alternative public root mapping: if `/index/*` is blocked by an OpenResty/WAF layer or a challenge rule, point a clean public directory (for example a mapped root or a subdomain) to the same FTP-uploaded web-app bundle and keep the API base on the same PHP origin. The browser client still talks to the server API; only the public path changes.
3. Alternative public subdomain or domain-root deployment: if the host blocks a nested `/index/...` path but allows a root-domain or subdomain directory, deploy the same app bundle to the mapped root and point the client API meta to the real public neutral API path for that root. This avoids a parallel auth system and keeps the API contract intact.
4. FTP/SFTP-only delivery is acceptable as a deployment mechanism, but it must not become the runtime source of truth. The trusted runtime remains the public Neutral PHP API and server-side session/auth decisions. FTP or SFTP is only for publishing the static files to the correct public root.
5. No local auth fallback is acceptable as a production replacement, even if a temporary host fix is delayed. The server must remain the authority for user identity, session, permissions, and modules.

### Direct production origin test: new app subdomain

The public host was re-tested against the new subdomain `https://app.turbolikes.com/` using the dedicated FTPS deployment account and a disposable origin probe. The proven result is:

- FTP access to the host is working via explicit FTPS on port 21 with the dedicated `webapp@app.turbolikes.com` account.
- The FTP user resolves to the live document root for the site and is able to create and remove files in the root directory that corresponds to the cPanel document root for this subdomain.
- The real public HTTPS URL still does not reach the PHP origin. It responds with the same OpenResty challenge page (`One moment, please...`) and `server: openresty/1.31.1.1`, even for a directly uploaded `origin-test.php` file.
- This proves that the challenge layer is active before the application origin and is not resolved by the new subdomain alone.
- The temporary test file was removed and re-checking the URL still returned the same challenge page, confirming the file was removed and the host is still intercepting the request before PHP runs.

This means the remaining live blocker is not in the Neutral app code or in the FTP deploy itself. The blocker is the public host configuration, challenge/WAF layer, or vHost/document-root mapping that sits in front of the actual PHP origin. Until that layer is corrected, no browser-based production login or module validation can be considered valid in the public host environment.

The canonical public API path for the standalone web client is:

- https://www.turbolikes.com/index/app/neutral/webroot/api/...

The canonical runtime entry points are:

- webroot/admin.php
- webroot/setup.php
- webroot/api/.htaccess (must continue to route the LiteSpeed PHP API path correctly)

The repository must not assume that a root-domain Node API is the active production environment.

## Web app client contract

The web app is treated as a standalone public client and must not depend on localhost, 127.0.0.1, local dev ports, or private hostnames. All browser login, session, module loading and permission checks must operate through the public HTTPS API path above. The local auth/bootstrap flow remains a development convenience only and must not be the required production path.

## Module model

Modules remain discoverable, registrable, and installable without automatic activation.

The effective lifecycle is:

- DISCOVER
- REGISTER / INSTALL
- INACTIVE
- ACTIVATE
- ACTIVE
- DEACTIVATE
- UNINSTALL

Rules:

- Module discovery does not auto-enable modules.
- Module metadata must be treated as module metadata, not as app entries.
- Module paths should resolve relative to the active installation context; hard-coded root paths are not the preferred pattern.
- App and module management remain separate responsibilities.
- Module manifests may declare module-owned permissions, access metadata, optional standalone test entries, and explicitly owned database tables.
- Installing a module must not auto-activate it, but it may synchronize module-declared permissions into the shared RBAC catalog.
- Uninstall must remove module registration/state, module-scoped permissions, and the moduleSettings.<moduleId> namespace; database tables may only be dropped when the manifest explicitly declares them and marks them safe for destroy-on-uninstall cleanup.
- Built-in roles remain protected from general editing, but module-specific permission assignment may still grant or revoke a module's own permissions on those roles through the module-management flow.

## Admin, authentication, and sessions

The canonical admin entry point is:

- webroot/admin.php

Admin access must remain protected by server-side session checks and role validation; the browser should not be treated as the authority.

The authoritative server-side auth flow is:

- POST /api/auth/login
- GET /api/auth/me
- protected admin pages behind server-side session checks

The real session authority is the server. Local browser state may be used as a client artifact, but it cannot override the server’s auth decision.

The admin shell should remain minimal and consistent, with:

- a compact header
- a single top navigation menu as the only admin navigation
- no left sidebar or duplicate admin navigation surfaces
- a single main content area
- consistent light/dark design tokens and shared component styling

The active admin theme implementation is the shared theme-token system:

- `ThemeEngine` remains the single theme activator for admin light/dark switching.
- `body[data-theme]` and shared CSS custom properties are the canonical styling inputs.
- Dynamic admin views, injected admin router styles, cards, tables, forms, alerts, modals, and embedded module previews must consume those same tokens instead of hard-coded parallel palettes.

## Security requirements

The following rules are mandatory:

- No secrets, credentials, session tokens, or live admin identity data may be committed to the repository.
- .env values must remain host-local and must never be checked into git.
- Do not expose production credentials in logs, commits, screenshots, PRs, or documentation.
- Admin write operations remain session + role + CSRF protected.
- Unauthenticated requests must fail with the correct HTTP protection behavior; invalid CSRF must fail as a 403.
- Browser-local state must not be treated as a substitute for the server-side session.
- Module visibility in the user app must not be decided by browser state alone; the server-facing module catalog is responsible for filtering visibility when module permissions are declared.

## Change rules

Work must be minimal and evidence-driven.

- Do not make architectural changes without evidence that the current implementation is wrong.
- Do not invent modules, alternate admin systems, or duplicate runtime paths.
- Do not change production behavior to satisfy a stale assumption.
- Do not treat historical issues as current facts if they have been disproven by current code and runtime checks.
- If a change affects auth, session handling, deployment, or host runtime assumptions, confirm the actual runtime behavior before proceeding.

## Testing and validation

Before a change is considered complete, the smallest relevant validation must be performed.

Examples:

- targeted auth/session checks for changed login or session logic
- targeted admin/file-check validation for changed admin or setup flow
- relevant existing unit tests for the changed behavior
- module lifecycle checks covering discovery, install, activate, deactivate, uninstall, and public module-catalog state when module visibility depends on activation or permissions

Avoid broad, repeated test runs when the relevant target has already been validated.

## GitHub workflow

All work is expected to follow the repository’s standard branch and PR workflow:

- work on a feature branch
- commit the change
- push the branch to origin
- create or update a pull request against main
- wait for required checks to complete
- merge only after checks are green and the branch is ready
- sync local main with origin/main after merge
- verify a clean working tree

No direct push to main is permitted.

## Deployment

Production deployment follows the repository’s deployment rules and configuration, not a Node-port assumption.

Relevant references:

- server.md
- scripts/manual-ftps-deploy.js
- deployment allowlists and server configuration files used by the project

The current manual FTPS deploy script reads deployment credentials in this order:

- `.env.ftp.deploy`
- `.env.deploy`
- process environment overrides

The current shared-host FTPS deploy flow uses a host-safe mirror mode without remote permission synchronization and without parallel upload races; deployment reliability is more important than upload concurrency on this host.

Only the allowlisted production tree may be staged and uploaded; deploy credentials and host-local `.env` files are never committed.

The deployment path must include the actual production PHP files and API files required by the host; a setup-only deploy is not a valid production deployment.

## Authoritative references

The effective references for future work are:

- VISION.md
- TODO.md
- WORKFLOW.md
- server.md
- webroot/admin.php
- webroot/setup.php
- webroot/api/.htaccess
- scripts/manual-ftps-deploy.js
- package.json for local test commands

## Prohibited actions

Agents must not do the following without explicit evidence and a valid reason:

- invent new admin systems or duplicate entry points
- rewrite architecture based on stale bug history
- assume root /api/* is the public production route
- assume Node port 3000 is active in shared hosting
- commit secrets, real credentials, or host config values
- keep historical bug descriptions as if they were current state
- add features or modules without a concrete requirement
- auto-activate discovered modules or make install implicitly mean active

## .env and host data handling

- .env files are host-local runtime configuration and must not be committed.
- Credentials, DB values, session data, and live admin identity are operational secrets.
- Host-specific values must be treated as runtime state, not as repository content.
- Any actual production login verification must be performed only with the valid host credentials and only after confirming that the host-side user is real and authorized.

## Module runtime expectations

For browser-facing module discovery and the user app:

- `/api/modules` is the public module catalog endpoint.
- The public catalog must remain lifecycle-aware enough for the browser to distinguish discovered vs. installed vs. active modules.
- The browser runtime must not overwrite discovered lifecycle state by forcing modules into an installed/inactive status during discovery.
- Public/user-facing module UIs may only behave as active when the lifecycle is actually active; discovery alone is not activation.
- When a module declares visibility permissions, `/api/modules` must filter that module according to the server-resolved identity instead of exposing it to every client by default.
- Module permission declarations belong to the module manifest, not hard-coded core allowlists.
- If a module declares a standalone test entry, that entry is a developer validation surface only; it must not become a second production admin or alternate runtime authority.

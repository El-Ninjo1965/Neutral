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

The canonical production entry point is `webroot/index.php`; `webroot/index.html` remains a compatibility shell and must not be treated as the live app entry. The PHP entry point bootstraps the existing runtime before serving the user shell so the public URL continues to execute the server-backed app architecture instead of a static HTML shell. The public host must not expose the developer preview banner or any local-only bootstrap credentials in the non-localhost route.

The current verified state is: the dedicated web-app FTP account correctly contains the app bundle at the chrooted root `/`, including `index.html`, `style.css`, `user-app.js`, `api-client.js`, and `platform/`. The root cause was in the repository deploy script itself: `--web-app` mode was never honored and the script always staged the server allowlist, which caused the wrong files to be prepared for upload. That script bug has been corrected in `scripts/manual-ftps-deploy.js` so the public web-app bundle is now staged and uploaded to the dedicated FTP root and not the server path. The public URL `/index/web-app/` still serves the stale placeholder page and 404s for CSS/JS assets, which proves that the remaining blocker is the live host-side document-root or URL-mapping for `/index/web-app/`: the FTP content and public HTTP content are still not the same.

The canonical public API path for the standalone web client is:

- https://www.turbolikes.com/index/app/neutral/webroot/api/...

The canonical runtime entry points are:

- webroot/admin.php
- webroot/setup.php
- webroot/api/.htaccess (must continue to route the LiteSpeed PHP API path correctly)

The repository must not assume that a root-domain Node API is the active production environment.

### 2026-08 independent hosting revalidation

Fresh DNS/HTTP probes from a new codespace showed that the current public front door is not reaching the Neutral app directly. The following hostnames all resolved to `185.225.132.24` and all tested browser/API paths were intercepted first by `openresty/1.31.1.1`:

- `app.turbolikes.com`
- `www.app.turbolikes.com`
- `turbolikes.com`
- `www.turbolikes.com`
- `server.cpprotect5.de`
- direct IP `185.225.132.24`

Observed behavior:

- normal HTML requests return HTTP 200 with the Imunify360 anti-bot page (`One moment, please...`)
- API-shaped requests with `Accept: application/json` return HTTP 403 with `{"message":"Access denied by Imunify360 bot-protection. IPs used for automation should be whitelisted"}`
- the behavior is hostname-independent across the tested first-party names and also appears on direct-IP/server-host probes
- therefore the earlier theory "wrong app subdomain mapping only" was incomplete; the actual first blocker is the host-side Imunify360/OpenResty front layer

This does **not** prove that the application is impossible on the shared host. It does prove that browserless automation and native API clients cannot be treated as working until this bot-protection behavior is intentionally handled by configuration.

## Web app client contract

The web app is treated as a standalone public client and must not depend on localhost, 127.0.0.1, local dev ports, or private hostnames. All browser login, session, module loading and permission checks must operate through the public HTTPS API path above. The local auth/bootstrap flow remains a development convenience only and must not be the required production path. On non-localhost deployments, the server-side session/API is the only authoritative login source; the local developer bootstrap is explicitly disabled so that production users are not silently shadowed by a local-only identity source.

The public application entry point is the PHP bootstrap at `webroot/index.php`. Static `index.html` may remain as a compatibility surface, but the live production route must resolve to `index.php` and must not render the developer preview banner or any local-only bootstrap messaging. Live validation against the public route confirmed that the real admin and Tester accounts authenticate successfully through the same server-side session/RBAC chain and that invalid or unauthenticated requests correctly return 401 responses. The browser-side root cause for the stale developer/auth fallback was that the public app shell did not load `webroot/api-client.js`; without that client, `user-app.js` fell back to `LocalAuth.login()` on non-localhost runtime, which is not the production source of truth.

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

### Recommended shared-host deployment shape

The preferred cPanel-compatible production shape is now:

- one same-origin app host: `https://app.turbolikes.com/`
- docroot on disk: `/home/web1819/public_html/app`
- uploaded repository runtime kept in its current structure (`webroot/`, `platform/`, `app/`, `core/`)
- root rewrite via [`.htaccess`](/workspaces/Neutral/.htaccess) so `/`, `/api/*`, `/admin.php`, `/setup.php`, `/user-app.js`, `/style.css`, and `/admin/*` are internally served from [webroot/](/workspaces/Neutral/webroot)
- direct web access to [core/](/workspaces/Neutral/core), [server/](/workspaces/Neutral/server), root package files, and dotfiles blocked at the docroot layer

Why this shape is preferred:

- same-origin browser cookies and PHP sessions work without CORS complexity
- the existing PHP API keeps the server as the auth/session/RBAC authority
- the existing module loader can fetch `/api/modules` and load module entry scripts from `/app/modules/*`
- offline-capable public state can remain in LocalStorage/IndexedDB without becoming the authority for login or permissions

### Required cPanel configuration

1. **Domains / Subdomains**
   - location: cPanel -> Domains or Subdomains
   - required value: keep or create `app.turbolikes.com` with document root `/home/web1819/public_html/app`
   - effect: gives a dedicated same-origin host for the app, API, admin, and setup entry points
   - test after change: request `/`, `/api/status`, and `/admin.php`

2. **PHP Version / Extensions**
   - location: cPanel -> Select PHP Version
   - required value: PHP 8.3+ preferred, with at least `pdo`, `pdo_mysql`, `session`, `json`, `mbstring`, `openssl`
   - effect: enables the PHP auth/session/MySQL runtime already implemented in [core/php/](/workspaces/Neutral/core/php)
   - test after change: request `/setup.php` and `/api/status`; confirm no `pdo_mysql` runtime error

3. **MySQL database wiring**
   - location: cPanel -> Manage My Databases / Database Wizard
   - required value: one app database plus one app DB user with privileges on that database; credentials stored only in the host-local `.env`
   - effect: activates server-side users, sessions, roles, permissions, modules, and admin state
   - test after change: `/api/status`, `/api/auth/login`, `/api/auth/me`, `/api/modules`

4. **Imunify360 review (if the plugin is exposed to the account)**
   - location: cPanel -> Plugins -> Imunify360 -> Incidents / Firewall
   - required action: inspect whether the operator/test IP is blocked or greylisted; whitelist only for operator automation if appropriate
   - effect: may unblock administrative testing traffic
   - test after change: repeat `curl -H 'Accept: application/json' https://app.turbolikes.com/api/status`
   - limitation: IP whitelisting helps operator/test automation only; it does not make a public/native client API generally safe

5. **If Imunify360 plugin is absent or no per-host exemption is available**
   - action: ask the hosting provider to exempt the application/API host from the anti-bot challenge or to disable bot-protection for that application surface
   - why: the current challenge blocks non-browser API clients and would also block future native app traffic
   - test after change: repeat `/api/status`, `/api/auth/login`, and a real browser login flow

## Architecture decision matrix

| Option | Machbar | Aufwand | Risiko | Empfehlung |
| --- | --- | --- | --- | --- |
| Same-Origin on `app.turbolikes.com` | Ja | Mittel | Mittel (Imunify360 front layer) | **Beste Option** |
| Separate API subdomain | Bedingt | Mittel-Hoch | Hoch (CORS + cookies + same bot-protection risk) | Nein |
| Main-domain path deployment | Bedingt | Mittel | Mittel-Hoch (shared site coupling + same bot-protection risk) | Reserve |
| `public_html` root deployment | Ja | Mittel | Hoch (couples app to main site root) | Nein |
| PHP-only shared-host runtime | Ja | Niedrig-Mittel | Niedrig | **Ja** |
| Existing Neutral Node runtime as production host | Nein auf diesem Hosting | Hoch | Hoch | Nein |
| Targeted Neutral core refactor toward PHP authority | Ja | Mittel | Niedrig-Mittel | **Ja, bereits eingeleitet** |
| Other cPanel-based rewrite/proxy solution | Ja | Mittel | Mittel | Only if same-origin root route needs refinement |

Decision:

- production authority should be the existing PHP runtime, not the Node runtime
- deploy the app as a same-origin PHP/MySQL application on `app.turbolikes.com`
- keep offline storage for public/non-authoritative client state only

## Empirical live-hosting validation (2026-08-27)

The following findings were validated against the actual live host using FTP access and real HTTP responses. This section supersedes stale assumptions that were not tested in production.

### Verified hosting facts

- FTP login succeeded for the project account `neutral@turbolikes.com`, the OS-level root account `root@turbolikes.com`, and the webapp account `webapp@app.turbolikes.com`.
- `web-app@turbolikes.com` failed authentication and is not a valid live deployment target in this environment.
- The live document root reported by PHP is `/home/web1819/public_html`.
- The functional production app path is `/home/web1819/public_html/index/app/neutral/webroot`.
- Real PHP output confirms `SERVER_SOFTWARE: LiteSpeed`, `PHP version: 8.5.9`, and `PHP_SAPI: litespeed`.
- `PDO MySQL` and `mysqli` are both available; MySQL is reachable on `localhost:3306` and the app database `web1819_neutral_app` is active.
- `https://www.turbolikes.com/index/app/neutral/webroot/api/status` responds with JSON and `200 OK`.
- `https://www.turbolikes.com/index/app/neutral/webroot/api/auth/me` responds with `401` when unauthenticated, which is expected.
- `https://www.turbolikes.com/index/app/neutral/webroot/admin.php` responds with `401` without session auth.
- `https://app.turbolikes.com/` and `https://app.turbolikes.com/index/app/neutral/webroot/diagnose.php` both return `404` at the time of testing; `app.turbolikes.com` is not the active live app route in the current host configuration.
- The active working public route is `https://www.turbolikes.com/index/app/neutral/webroot/...`.

### Verified API and auth behavior

- `/index/app/neutral/webroot/api/status` returns JSON and confirms `service=neutral-core`, `environment=production`, and a live MySQL backend.
- `/index/app/neutral/webroot/api/modules` returns `{"ok":true,"data":{"modules":[]}}` and therefore the server-side module catalog is active.
- `/index/app/neutral/webroot/api/auth/me` returns `{"ok":false,"error":{"message":"Not authenticated."}}` without a valid session, proving server-side auth enforcement.
- A targeted PHP probe succeeded in storing a session and cookie across two sequential requests using the same browser cookie jar, with the session counter incrementing from 1 to 2 and `Set-Cookie` observed.
- A targeted PHP probe accepted both `application/x-www-form-urlencoded` and `application/json` POST bodies and echoed the parsed request data on the live host.

### Verified architecture recommendation

The empirically validated production architecture is:

- PHP runtime on LiteSpeed shared hosting
- document root `/home/web1819/public_html`
- actual app root `/home/web1819/public_html/index/app/neutral/webroot`
- public API under `https://www.turbolikes.com/index/app/neutral/webroot/api/*`
- public admin/setup under `https://www.turbolikes.com/index/app/neutral/webroot/admin.php` and `setup.php`
- same-origin browser traffic remains on the main domain path and does not require a separate Node service or CORS workarounds

### What did not work on this host

- `app.turbolikes.com` was not mapped to the active app runtime during the empirical test. It returned `404`.
- There is no evidence of a public Node runtime or a working Node API service on this host.
- Browserless automation must not assume direct subdomain access without confirmation; in this environment, the valid path is the current `www.turbolikes.com/index/...` route.

### Deployment rules derived from actual tests

- Keep the production app under the verified host path and do not force the legacy `app.turbolikes.com` assumption.
- Prefer same-origin PHP requests over cross-origin API workarounds.
- Treat the server-side session and RBAC as the authority; browser state is not enough.
- Keep live credentials host-local and never commit or log them.
- Use separate test tables or probe scripts for database validation and remove any temporary diagnostics after the verification step is complete.

- treat Imunify360 bot-protection as the remaining host-level go-live blocker for public/native API traffic

### Code changes made for this decision

- added root [`.htaccess`](/workspaces/Neutral/.htaccess) for cPanel/LiteSpeed same-origin routing into [webroot/](/workspaces/Neutral/webroot)
- added that file to the deploy allowlists in [scripts/manual-ftps-deploy.js](/workspaces/Neutral/scripts/manual-ftps-deploy.js) and [scripts/cpanel-preflight.js](/workspaces/Neutral/scripts/cpanel-preflight.js)
- updated [webroot/user-app.js](/workspaces/Neutral/webroot/user-app.js) so production login/logout/session bootstrap use the server API instead of requiring local-only auth fallback
- updated [platform/config-manager.js](/workspaces/Neutral/platform/config-manager.js) and [platform/core-loader.js](/workspaces/Neutral/platform/core-loader.js) so the browser resolves `/api` relative to the active deployment path instead of assuming the domain root
- updated deploy/preflight allowlists in [scripts/manual-ftps-deploy.js](/workspaces/Neutral/scripts/manual-ftps-deploy.js) and [scripts/cpanel-preflight.js](/workspaces/Neutral/scripts/cpanel-preflight.js) so `webroot/index.php` is always shipped with production deploys

### What is verified vs. not yet verified

Verified in this session:

- DNS resolution for the tested hostnames
- OpenResty/Imunify360 interception behavior
- repository PHP API/auth/session/module architecture
- local PHP runtime presence
- local PHP extensions include `PDO`, `pdo_sqlite`, `session`, `sqlite3`; local `pdo_mysql` is **not** present

Not yet verified in this session:

- live FTP upload through the new `webapp@app.turbolikes.com` account (password not provided in-session)
- live browser pass through Imunify360 on a human-operated browser
- live MySQL-backed login/session/role/module flow on the cPanel host
- live `/api/auth/login`, `/api/auth/me`, and `/api/modules` on `app.turbolikes.com` after deploy and host-side bot-protection adjustment

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
- The public catalog must provide canonical runtime asset URLs (`moduleUrl`, `manifestUrl`, `entryUrl`) that are valid for the active host path prefix (for example `/index/app/neutral/...`), instead of relying on client-side root-relative guesses.
- The browser runtime must not overwrite discovered lifecycle state by forcing modules into an installed/inactive status during discovery.
- Public/user-facing module UIs may only behave as active when the lifecycle is actually active; discovery alone is not activation.
- When a module declares visibility permissions, `/api/modules` must filter that module according to the server-resolved identity instead of exposing it to every client by default.
- Module permission declarations belong to the module manifest, not hard-coded core allowlists.
- If a module declares a standalone test entry, that entry is a developer validation surface only; it must not become a second production admin or alternate runtime authority.
- The same API surface should expose module lifecycle actions for the Lite client (`GET /api/modules/{id}`, `/download`, `/updates`, `POST install|activate|disable|uninstall`) instead of introducing a second parallel module API architecture.
- The normal user landing page is an end-user surface (welcome + available module entry points) and must not expose raw catalog/lifecycle management controls; technical module management remains in the admin/module-management UI.

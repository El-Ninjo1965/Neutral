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

## Repository synchronization record (2026-08-29)

The full local repository state was audited against `El-Ninjo1965/Neutral` on `origin/main` before synchronization. Local `main` and `origin/main` started at the same commit, the secondary local `work` branch contained no commit absent from `origin/main`, and there were no uncommitted project-source or documentation changes to recover. No reset, forced update, or replacement from an older remote file was used.

The audit found generated dependencies and three host-local environment files tracked by Git. They were removed from the Git index without deleting the local files. `.gitignore` now excludes `node_modules/`, `.env`, and `.env.*`, while allowing a future sanitized `.env.example`. This is required repository hygiene: generated dependencies and operational credentials must remain local and must not be transferred in synchronization commits.

The requested documentation inventory was also checked directly in the local tree and on `origin/main`. `VISION.md`, `WORKFLOW.md`, and `TODO.md` are present. `Architecture.md`, `Functions.md`, `API.md`, `Database.md`, `Security.md`, `Install-README-Web-App.md`, `Install-README-Server.md`, and `ModuleCreation.md` are absent and were not fabricated during synchronization.

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

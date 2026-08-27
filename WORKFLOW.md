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

- /index/app/neutral/webroot/*

The canonical runtime entry points are:

- webroot/admin.php
- webroot/setup.php
- webroot/api/.htaccess (must continue to route the LiteSpeed PHP API path correctly)

The repository must not assume that a root-domain Node API is the active production environment.

## Module model

Modules remain discoverable, registrable, and installable without automatic activation.

The effective lifecycle is:

- DISCOVER
- REGISTER / INSTALL
- INACTIVE
- ACTIVATE
- ACTIVE
- DEACTIVATE

Rules:

- Module discovery does not auto-enable modules.
- Module metadata must be treated as module metadata, not as app entries.
- Module paths should resolve relative to the active installation context; hard-coded root paths are not the preferred pattern.
- App and module management remain separate responsibilities.

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

## Security requirements

The following rules are mandatory:

- No secrets, credentials, session tokens, or live admin identity data may be committed to the repository.
- .env values must remain host-local and must never be checked into git.
- Do not expose production credentials in logs, commits, screenshots, PRs, or documentation.
- Admin write operations remain session + role + CSRF protected.
- Unauthenticated requests must fail with the correct HTTP protection behavior; invalid CSRF must fail as a 403.
- Browser-local state must not be treated as a substitute for the server-side session.

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

## .env and host data handling

- .env files are host-local runtime configuration and must not be committed.
- Credentials, DB values, session data, and live admin identity are operational secrets.
- Host-specific values must be treated as runtime state, not as repository content.
- Any actual production login verification must be performed only with the valid host credentials and only after confirming that the host-side user is real and authorized.

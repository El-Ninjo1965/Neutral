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

## Current open work

### Production runtime and backend
[x] Determine the actual production backend mechanism for the real LiteSpeed/cPanel host.
  - Verified fact: shared hosting is a PHP/LiteSpeed environment; `node`, `npm`, and `npx` are not available in the normal runtime path and Port 3000 is not reachable on the live host.
[x] Verify whether a PHP/LiteSpeed integration can be used cleanly with the existing Node-based architecture.
  - Verified fact: the public host is PHP/LiteSpeed-driven, and the repo’s Node server is only usable when a supported host runtime exists. No live `/api` route is attached to it.
[~] Check whether a usable Node/Passenger runtime is available on the production server.
  - Current evidence: no usable Node runtime is exposed in PATH and no public `/api` route is available; this remains a host-level check and cannot be assumed available.
[ ] Establish the actual public API routing on the production server.
[ ] Verify the server backend and runtime entry points used by the live host.

### Database and connectivity
[?] Clarify MySQL credentials, DB user, grants, host and port configuration.
  - Blocked: current live evidence shows access denied for the configured app user; credentials/grants are not yet verified on the host.
[ ] Verify DB host and configuration values used by the production server.
[ ] Repair the actual server-to-DB connection for Neutral.
[ ] Verify server-side storage is usable for online data persistence.
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
[ ] Extend developer diagnostics if needed for the actual Host/PHP/MySQL conditions.
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

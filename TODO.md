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

## Current open work

### Production runtime and backend
[ ] Determine the actual production backend mechanism for the real LiteSpeed/cPanel host.
[ ] Verify whether a PHP/LiteSpeed integration can be used cleanly with the existing Node-based architecture.
[ ] Check whether a usable Node/Passenger runtime is available on the production server.
[ ] Establish the actual public API routing on the production server.
[ ] Verify the server backend and runtime entry points used by the live host.

### Database and connectivity
[ ] Clarify MySQL credentials, DB user, grants, host and port configuration.
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

- The repository currently contains a Node-based server architecture and a valid module lifecycle repair.
- The verified production host facts still show: LiteSpeed/PHP 8.5.9, no normal Node runtime in PATH, no reachable Port 3000, public /api/* returning 404, MySQL access denied for the configured app user.
- No code should be reimplemented or duplicated while the root runtime and host route remain unresolved.
- The next work must determine the actual viable production runtime and route before changing the architecture.
- This TODO file is the live task list; it must be kept current with each relevant technical step.

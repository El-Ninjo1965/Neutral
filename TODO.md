# Neutral – Project TODO

This is the current operational task ledger for the repository. It is intentionally short and reflects only the active state of the project.

## Current project status

- Repository: El-Ninjo1965/Neutral
- Current branch: main
- GitHub sync: main is synchronized with origin/main.
- Neutral remains a modular framework with a core layer and module-based extensions.
- Canonical admin entry point: webroot/admin.php
- Canonical setup entry point: webroot/setup.php
- Current live runtime reality: shared-host PHP/LiteSpeed; the real production path is under /index/app/neutral/webroot/*.
- The root /api/* path is not the active public production API path on the live host.
- The admin workspace keeps the top header navigation as the only admin navigation surface; no left sidebar is part of the active admin UI.
- Admin light/dark mode is expected to flow through the shared theme tokens for header, content, cards, tables, forms, alerts, modals, and dynamic admin views.
- The last real browser check of the deployed admin UI was completed successfully by the project operator.
- The GPS module remains the existing reference module and now supports DISCOVER -> REGISTER / INSTALL -> INACTIVE -> ACTIVATE -> ACTIVE -> DEACTIVATE -> UNINSTALL.
- Module-specific permissions can now be declared by the module manifest, assigned in Admin -> Modules, and synchronized into the shared RBAC catalog on install.
- The public module catalog must expose lifecycle-aware module state and respect server-resolved module visibility permissions so active modules can appear in the user app without discovery implicitly activating them.
- Modules may declare a lightweight standalone test entry for isolated developer validation when they do not require the full app runtime.

## Current web app integration work

- [x] Consolidate the last three web-app prompts into a single live integration task without discarding the original assignment.
- [x] Confirm the active live public API contract and the correct transport path for the standalone web client.
- [x] Remove localhost/default-local assumptions from the public web-app config and client bootstrap logic.
- [x] Route the web app login/session flow through the public HTTPS API instead of required local dev auth fallback behavior.
- [x] Split the server deployment and public web-app deployment into separate FTP contexts and keep the web-app credentials local-only in `.env.web-app.deploy`.
- [x] Fix the repository deploy script so `--web-app` correctly stages the actual web-app bundle and does not fall back to the server allowlist.
- [x] Verify the dedicated web-app FTP root `/` and confirm that it contains the actual web-app bundle files for the public client.
- [x] Confirm that the repo-side client is correct: the app targets the canonical public API path and does not require a parallel local auth implementation.
- [x] Confirm that the public challenge page is not caused by the repo client itself; the public host is intercepting requests before the Neutral app/API is served.
- [x] Confirm that the local origin PHP app serves real Neutral JSON, but the local runtime still fails because `pdo_mysql` is missing in the checked PHP runtime.
- [ ] Fix the production host path mapping so `/index/web-app/` and `/index/app/neutral/webroot/...` reach the real PHP app instead of the OpenResty challenge page.
- [ ] Enable the production PHP runtime to load `pdo_mysql` (or the matching MySQL PDO driver) so API auth, DB reads, module visibility, and session-backed login can work.
- [ ] Request and complete the real browser/mobile live test with the project owner after the host mapping and PHP runtime are corrected.
- [x] Document the practical connection options that preserve the existing Neutral architecture without creating a second auth or module system: correct host mapping, alternative public root/subdomain mapping, and FTP/SFTP publishing only.
- [x] Verify the new public subdomain `https://app.turbolikes.com/` with FTPS deployment and confirm that the host still serves the OpenResty challenge page before the PHP origin is reached.
- [x] Confirm that a disposable runtime probe file can be uploaded and then removed from the live public root without leaving a lingering production artifact.
- [x] Evaluate the same-origin, API-subdomain, main-domain, public_html-root, and PHP-frontcontroller variants using the repo contract and the real live host observations.
- [x] Confirm that the repository already supports a portable API base and that the remaining blocker is the host-level OpenResty challenge layer, not the Neutral app code.
- [x] Confirm via live public testing that both static HTML and PHP files on `https://app.turbolikes.com/` are intercepted by the same OpenResty challenge before any application content can load.
- [x] Confirm that the OpenResty challenge is not limited to one subdomain or one URL path: it affects the root of `app.turbolikes.com`, the root of `turbolikes.com`, the `www` domain, the previous `/index/...` paths, and a direct API status URL.

## Current production blocker

- The minimal architectural path is to keep the existing Neutral web app and server API and fix the environment rather than re-architecting the app.
- The repo is not the final blocker; the live host still serves a challenge page and the checked PHP runtime is missing the MySQL PDO extension required for DB-backed auth and module data.
- The correct runtime path remains: public web client -> public HTTPS API base -> Neutral PHP runtime -> database -> auth/session/module responses.
- Any alternate auth or module system would duplicate the existing server source of truth and is therefore not compatible with the project rules.

## Open tasks

- [ ] Validate the new uninstall/permission/standalone contract with at least one additional module beyond GPS once another real module is ready for migration to the new manifest structure.
- [ ] Extend the module update path so installed modules can evolve their declared permissions and owned resources without requiring uninstall/reinstall.
- [ ] Add disposable-environment verification for PHP-side module permission assignment and uninstall/reinstall flows beyond the live GPS reference run.

## Known technical constraints

- No repository secrets, live credentials, or .env values are stored in this repo.
- Production credentials, session state, and live admin state are operational host data and must not be committed, logged, or documented in code.
- Browser-side auth state is not authoritative; server-side session + role checks decide admin access.
- Do not assume Node port 3000 is enabled or reachable on the shared host.
- The deploy path remains the repository’s production deployment configuration and FTPS flow, not a public Node runtime assumption.
- Use the existing canonical PHP entry points; do not create duplicate admin surfaces or alternate admin bootstraps.
- Browserless or GPS-less automation environments may verify HTTP/session/module state, but they cannot honestly claim a visual browser pass or a real device geolocation pass.

## Next sensible development state

- When adding module-owned storage, declare each owned table explicitly in the module manifest and only allow uninstall cleanup for entries that opt into safe destroy-on-uninstall handling.
- When adding module permissions, keep module-owned settings under moduleSettings.<moduleId> and re-check public /api/modules visibility plus role assignments after install, deactivate, uninstall, and reinstall.

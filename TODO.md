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
- Fresh independent probes show an OpenResty + Imunify360 anti-bot front layer in front of all tested public hostnames, including app.turbolikes.com and the current main-domain paths.
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
- [x] Verify the live API contract on the real host: `/api/status` returns HTTP 200 with JSON; `/api/auth/me` returns 401 without a session; `/api/modules` returns a valid module catalog payload.
- [x] Remove localhost/default-local assumptions from the public web-app config and client bootstrap logic.
- [x] Route the web app login/session flow through the public HTTPS API instead of required local dev auth fallback behavior.
- [x] Add a shared-host root rewrite so a same-origin app host can expose the existing `webroot/` runtime from the docroot root without flattening the repository structure.
- [ ] Deploy the full same-origin Neutral runtime to `/home/web1819/public_html/app` via the dedicated FTP account once the secret is available in-session.
- [ ] Verify that `https://app.turbolikes.com/`, `/api/status`, `/api/auth/me`, `/admin.php`, and `/setup.php` are served from the deployed app root and not from a stale placeholder.
- [ ] Inspect cPanel -> Plugins -> Imunify360 (if available) for incidents/firewall entries affecting operator/test traffic; otherwise request a per-host bot-protection exemption from the provider.
- [ ] Request and complete the real browser/mobile live test after deploy plus Imunify360 handling.

## Verified production scope (2026-08-27)

- [x] `/api/status` returns HTTP 200 with valid JSON on the real production route and confirms PHP/LiteSpeed and MySQL health.
- [x] `/api/auth/me` returns 401 when unauthenticated and rejects invalid credentials with 401 instead of leaking state.
- [x] `/api/modules` responds with a valid JSON module catalog on the live route.
- [x] Security hardening blocks direct access to internal PHP/runtime files while leaving the public API surface reachable.
- [x] Repository tests covering API, auth, storage, module lifecycle, and admin flow all pass locally.

## Open tasks

- [ ] Validate the new uninstall/permission/standalone contract with at least one additional module beyond GPS once another real module is ready for migration to the new manifest structure.
- [ ] Extend the module update path so installed modules can evolve their declared permissions and owned resources without requiring uninstall/reinstall.
- [ ] Add disposable-environment verification for PHP-side module permission assignment and uninstall/reinstall flows beyond the live GPS reference run.

## Known technical constraints

- No repository secrets, live credentials, or .env values are stored in this repo.
- Production credentials, session state, and live admin state are operational host data and must not be committed, logged, or documented in code.
- Browser-side auth state is not authoritative; server-side session + role checks decide admin access.
- Do not assume Node port 3000 is enabled or reachable on the shared host.
- Browserless automation currently hits Imunify360 bot-protection on the public hostnames; this must not be mistaken for missing PHP/MySQL capability.
- The deploy path remains the repository’s production deployment configuration and FTPS flow, not a public Node runtime assumption.
- Use the existing canonical PHP entry points; do not create duplicate admin surfaces or alternate admin bootstraps.
- Browserless or GPS-less automation environments may verify HTTP/session/module state, but they cannot honestly claim a visual browser pass or a real device geolocation pass.

## Next sensible development state

- When adding module-owned storage, declare each owned table explicitly in the module manifest and only allow uninstall cleanup for entries that opt into safe destroy-on-uninstall handling.
- When adding module permissions, keep module-owned settings under moduleSettings.<moduleId> and re-check public /api/modules visibility plus role assignments after install, deactivate, uninstall, and reinstall.

## Live hosting validation results (2026-08-27)

- [x] Confirm the real FTP layout and valid account mapping on the live host.
- [x] Confirm the real PHP/LiteSpeed runtime and document root using live HTTP responses.
- [x] Verify `PDO MySQL`, `mysqli`, and MySQL connectivity on the production host.
- [x] Verify `GET`, `POST`, `JSON`, session, and cookie handling using live PHP probes.
- [x] Verify the actual public API paths and the unauthenticated auth/RBAC enforcement state.
- [x] Confirm the active host path is `https://www.turbolikes.com/index/app/neutral/webroot/...`; `app.turbolikes.com` is not presently serving the active app.
- [x] Confirm that PHP-only hosting is the correct architecture for this environment and that Node is not required for the current production path.
- [ ] Remove all temporary live-host diagnostics once the final validation evidence is captured and the report is signed off.

## Final production recommendation

- Preferred runtime: PHP on LiteSpeed shared hosting.
- Preferred public route: `https://www.turbolikes.com/index/app/neutral/webroot/...`.
- Preferred document root: `/home/web1819/public_html`.
- Preferred app root: `/home/web1819/public_html/index/app/neutral/webroot`.
- Preferred same-origin flow: browser fetches to the same host path, with session/cookie auth enforced by PHP and not by client-side state.
- Avoid assuming a Node service or a dedicated `app.turbolikes.com` deployment until the host-level routing is explicitly configured and verified.

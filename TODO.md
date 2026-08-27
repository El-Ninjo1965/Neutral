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
- Automated synchronization is now implemented in the repository: `scripts/auto-sync.js` provides a safe local commit/push/deploy wrapper, and `.github/workflows/ftp-upload.yml` deploys the server bundle and the public web-app bundle as separate FTPS targets on main push or manual dispatch.
- Local deployment secrets remain excluded from git and must be kept in local `.env.*` files only.

## Current web app integration work

- [x] Consolidate the last three web-app prompts into a single live integration task without discarding the original assignment.
- [x] Confirm the active live public API contract and the correct transport path for the standalone web client.
- [x] Remove localhost/default-local assumptions from the public web-app config and client bootstrap logic.
- [x] Route the web app login/session flow through the public HTTPS API instead of required local dev auth fallback behavior.
- [x] Split the server deployment and public web-app deployment into separate FTP contexts and keep the web-app credentials local-only in `.env.web-app.deploy`.
- [x] Fix the repository deploy script so `--web-app` correctly stages the actual web-app bundle and does not fall back to the server allowlist.
- [x] Verify the dedicated web-app FTP root `/` and confirm that it contains the actual web-app bundle files for the public client.
- [x] Implement the repository-side automation guardrails for the separate deployment flow: `scripts/auto-sync.js`, `scripts/auto-watch.js`, and a GitHub workflow that deploys the server and web-app bundles independently.
- [x] Keep the server deployment and public web-app deployment separated in both the repository logic and the deployment target model.
- [x] Confirm the public web-app runtime path `/index/web-app/` resolves to the dedicated host directory `/home/web1819/public_html/index/web-app/` and remains separate from the Neutral server deployment path.
- [x] Correct the repository-side split deployment logic so the public web-app bundle is staged separately from the server bundle and not uploaded into the server app area.
- [ ] Refresh the live web-app FTPS credential used by the local `.env.web-app.deploy` to the current cPanel password for `web-app@turbolikes.com`; the active value still rejects authentication (`530 Login authentication failed`), so the live public web-app deploy remains blocked until that credential is updated.
- [ ] Request and complete the real browser/mobile live test with the project owner after the active FTPS credential is refreshed and the live web-app upload succeeds.

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

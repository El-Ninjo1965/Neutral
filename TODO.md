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

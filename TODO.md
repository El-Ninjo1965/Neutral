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

## Open tasks

- [ ] Confirm the actual live production admin credential/session state on the public PHP host before claiming a production admin login is working.
- [ ] Continue only after a valid live admin user or host-side session is available.

## Known technical constraints

- No repository secrets, live credentials, or .env values are stored in this repo.
- Production credentials, session state, and live admin state are operational host data and must not be committed, logged, or documented in code.
- Browser-side auth state is not authoritative; server-side session + role checks decide admin access.
- Do not assume Node port 3000 is enabled or reachable on the shared host.
- The deploy path remains the repository’s production deployment configuration and FTPS flow, not a public Node runtime assumption.
- Use the existing canonical PHP entry points; do not create duplicate admin surfaces or alternate admin bootstraps.

## Next sensible development state

- With a valid host-side admin account, verify the real production session flow: login -> Set-Cookie -> /api/auth/me -> admin.php -> protected admin UI.
- Until a valid live admin session is available, there is no urgent repo-wide feature task to pursue beyond keeping the operational documentation aligned with the actual runtime reality.

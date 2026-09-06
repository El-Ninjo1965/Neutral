# NEUTRAL – Consolidated rest work plan

## Status legend
- DONE
- IN PROGRESS
- PENDING
- BLOCKED
- DEVICE RETEST REQUIRED
- FUTURE

## Current device-live status (2026-09-06, authoritative)
- Tester login via the normal User-App: DONE / LIVE BESTANDEN
  - UI confirmation: `Signed in as Tester (user)`
- Developer / Bootstrap Administrator login via the normal User-App: DONE / LIVE BESTANDEN
  - UI confirmation: `Signed in as Bootstrap Administrator (admin)`

## Historical issues retained as evidence only
These are not current failures; they remain part of the historical workflow and changelog evidence:
- `User is not valid or active`
- `Set up the local developer account before logging in`
- `Server authentication client is not available`
- `No authenticated user was returned by the server`

## Critical new requirement: separate user and admin session contexts
- Status: DONE / LIVE BESTANDEN
- Requirement: User-App and Admin-Interface must keep independent parallel login contexts.
- Verified contract:
  - Admin login does not overwrite User-App login.
  - User login does not overwrite Admin login.
  - Admin logout does not log out the User-App.
  - User logout does not log out the Admin interface.
  - `/api/auth/me` resolves the identity for the active scope.
  - CSRF and session invalidation remain scope-aware.
- Implementation direction: separate cookie namespaces (`neutral_session` vs `neutral_admin_session`) with scope-aware resolution and validation.
- Required validation: targeted auth/session regression tests plus full suite; completed successfully under PHP 8.1.

## Priority work list

### P1 – User/Admin session separation
- Status: IN PROGRESS
- Scope: inspect current PHP SessionRegistry + AuthManager; identify cookie/session namespace design; separate user and admin contexts without breaking shared role/auth database.
- Acceptance: parallel logins; independent logout; correct `/auth/me`; correct CSRF; session invalidation remains scoped.

### P2 – User-App header cleanup
- Status: PENDING
- Remove `ACTIVE APPLICATION` from user app header.
- Rename `Local settings` to `Settings` in logged-out state to match logged-in state.
- Keep the user-facing contract consistent in both states.

### P3 – Navigation as real buttons/tabs
- Status: PENDING
- Make navigation entries visibly interactive with clear default, active, hover, focus, and touch-friendly sizing.
- Use clear icon semantics: home, location, settings.
- Make module icons resolvable via manifest metadata when available.

### P4 – Configurable landing page
- Status: PENDING
- Replace hard-coded home content with a configurable homepage contract using safe persisted settings.
- Required modes: Standard, Text/HTML, Module.
- Validate permission checks for start-page modules.

### P5 – i18n / language system
- Status: PENDING
- On first start, detect device language and use it if supported; otherwise default to English.
- Allow persisted user override.
- Avoid hardcoded English/German/Spanish-only assumptions; keep extensible package-based structure.

### P6 – Permission catalog UX
- Status: PENDING
- Functional contract already exists; improve layout and responsive readability.
- Keep permissions architecture intact; only improve display and sorting semantics.

### P7 – Session overview
- Status: PENDING
- Keep single-session invalidation.
- Add `End all other sessions` action with safeguards.
- Verify RBAC, CSRF, audit, race conditions, and confirmation handling.

### P8 – User settings device acceptance
- Status: PENDING
- After fix implementation: open settings, modify, save, reload, verify persistence, and re-test in a fresh session/device context.
- Add/extend automated regression tests before final acceptance.

### P9 – Light / Dark theme verification
- Status: PENDING
- Check switch, immediate render, reload, persistence, warm-start, and system theme alignment as applicable.

### P10 – Navigation / GPS device test
- Status: PENDING
- Validate start, GPS, navigation back, permission prompts, permission denial, re-request flow, and role-specific module visibility.

### P11 – Offline / airplane mode / warm start
- Status: PENDING
- Validate online load, offline use, reload offline, full restart offline, warm start, and recovery when connectivity returns.
- This remains a key core contract.

### GPS Pro
- Status: FUTURE
- Separate extended GPS-Pro module concept and map capability research is deferred.
- Not in the current Core 1.0 scope.

## Final cleanup and hardening
- Status: FUTURE
- Must happen only after session separation, UI tasks, i18n, settings, GPS, and offline/warm-start work are completed.
- Scope: remove dead code and legacy workarounds only after reference checks, tests, and regression validation.

## Core-1.0 freeze gate
- Status: FUTURE
- Freeze only after:
  - all critical open tasks cleared;
  - tests green;
  - deployment green;
  - device-live checks passed;
  - offline contract passes;
  - docs consistent;
  - working tree clean;
  - HEAD == origin/main.

## Documentation update rule during execution
After each completed block:
- update ToDoNow.md
- update STATUS.md
- update WORKFLOW.md
- update TODO.md
- update CHANGELOG.md
- when architecture changes materially, update Architecture.md and Functions.md
- update CORE-1.0.md only when freeze-relevant criteria change

## Execution rule
- Begin immediately with priority 1 after the required docs commit/push.
- Keep moving through each remaining self-executable block without waiting for additional prompts.
- Only pause if there is a true external blocker that is not in the repository or codebase.

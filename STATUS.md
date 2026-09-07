# NEUTRAL – Status

**Status:** NACHGEWIESENER IST-STAND
**Geprüft:** 2026-09-07
**Reference:** Repository + real device evidence + GitHub `main`

## Current device-live status
- User-App and Admin-Interface are not yet reliably separated.
- Real device evidence from the last retest shows the following active failures:
  - Admin login can still influence the User-App identity context.
  - Login/logout behavior is partially inconsistent.
  - The admin access flow can still show: `Access denied – Administrative access requires an authorized role.`
- The previous claim `User/Admin session separation: DONE / LIVE BESTANDEN` is invalid and must not remain in the current state.
- P1 status: IN ARBEIT / DEVICE RETEST REQUIRED

## Critical new issue now in scope
- User-App and Admin-Interface session contexts remain unresolved and require a fresh real-device validation pass.
- Verified behavior from the current retest:
  - user and admin login states can still interfere with one another;
  - cookie/session scope handling is not yet reliable across the user/admin split;
  - logout/login cases are still inconsistent in live use;
  - browser-side identity resolution cannot be treated as accepted until real device evidence passes.
- This issue is not cleared and must remain active until a successful real device retest confirms a stable separation.

## Historical root-cause evidence retained
The following historical conditions remain as documentation evidence and must not be deleted or rewritten:
- `User is not valid or active`
- `Set up the local developer account before logging in`
- `Server authentication client is not available`
- `No authenticated user was returned by the server`

These conditions are historic and part of the workflow evidence trail; they are not the current active state.

## Core work status
- User- and admin-session separation: IN ARBEIT / DEVICE RETEST REQUIRED
- User-App header cleanup: DONE / DOCUMENTED
- Navigation as true buttons/tabs: DONE / DOCUMENTED
- Configurable landing page: PENDING
- i18n: PENDING
- Permission catalog UX improvements: PENDING
- Session overview enhancements: PENDING
- Settings/device acceptance: PENDING
- Light/Dark validation: PENDING
- GPS/device flow: PENDING
- Offline / airplane-mode / warm-start: PENDING
- Final cleanup and freeze gate: FUTURE

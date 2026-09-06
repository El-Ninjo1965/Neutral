# NEUTRAL – Status

**Status:** NACHGEWIESENER IST-STAND
**Geprüft:** 2026-09-06
**Reference:** Repository + live device evidence + GitHub `main`

## Current device-live status
- Tester login via the normal User-App: LIVE BESTANDEN
  - Confirmed UI: `Signed in as Tester (user)`
- Developer / Bootstrap Administrator login via the normal User-App: LIVE BESTANDEN
  - Confirmed UI: `Signed in as Bootstrap Administrator (admin)`

## Critical new issue now in scope
- User-App and Admin-Interface session contexts are now independently validated and no longer overwrite one another.
- Verified behavior:
  - separate `neutral_session` / `neutral_admin_session` cookies are issued;
  - user and admin logins coexist without overwriting each other;
  - `/api/auth/me` resolves the correct scope for the active cookie/session;
  - admin logout does not invalidate the user session, and vice versa.
- This issue is resolved and now recorded as the secured session-scope fix, with the historical login regressions retained only as evidence of prior problems.

## Historical root-cause evidence retained
The following historical conditions remain as documentation evidence and must not be deleted or rewritten:
- `User is not valid or active`
- `Set up the local developer account before logging in`
- `Server authentication client is not available`
- `No authenticated user was returned by the server`

These conditions are historic and part of the workflow evidence trail; they are not the current active state.

## Core work status
- User- and admin-session separation: DONE / LIVE BESTANDEN
- User-App header cleanup: DONE / LIVE BESTANDEN
- Navigation as true buttons/tabs: PENDING
- Configurable landing page: PENDING
- i18n: PENDING
- Permission catalog UX improvements: PENDING
- Session overview enhancements: PENDING
- Settings/device acceptance: PENDING
- Light/Dark validation: PENDING
- GPS/device flow: PENDING
- Offline / airplane-mode / warm-start: PENDING
- Final cleanup and freeze gate: FUTURE

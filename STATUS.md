# NEUTRAL – Status

**Status:** CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED
**Geprüft:** 2026-09-07
**Reference:** Repository + PHP 8.3 validation + full `npm test` suite

## Current device-live status
- The user/admin session-root-cause fix is implemented and validated in code under the supported PHP 8.1+ runtime.
- The actual second-level live validation for a real operator device remains required before any claim of `LIVE BESTANDEN`.
- Current code-side state: `CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED`.

## Active issue status
- Root cause identified and fixed in the server-side session and logout logic:
  - admin/user scopes are resolved separately;
  - logout invalidates only the active session scope;
  - admin identity does not fall back to the user session.
- Productive regression coverage confirms concurrent user/admin login/logout behavior and scoped CSRF handling.
- A real browser/iPad retest is still required to mark the project `LIVE BESTANDEN`.

## Historical root-cause evidence retained
The following historical conditions remain as documentation evidence and must not be deleted or rewritten:
- `User is not valid or active`
- `Set up the local developer account before logging in`
- `Server authentication client is not available`
- `No authenticated user was returned by the server`

These conditions are historic evidence of earlier failures; they are not the current active status.

## Core work status
- User- and admin-session separation: CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED
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

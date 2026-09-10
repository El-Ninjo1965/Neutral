# Current Task — Profile lifecycle repair

**Source of truth:** `TODO.md`, 2026-09-11.

## Objective

Reproduce and fix the live Profile activation `Internal Server Error` without broad feature work. Audit the Core `user_profiles` baseline versus the Profile module migration and lifecycle persistence. Preserve existing profile data.

## Acceptance

- Profile installs/registers/activates without HTTP 500.
- Profile can be deactivated and reactivated; retained data returns.
- Login/Core/Admin/Packages/Licenses/Sessions/GPS/Backup still work while Profile is inactive.
- Errors remain controlled and contain no SQL/secrets.
- Full tests plus a real operator lifecycle retest; local green is not a live pass.
- No Field Notes and no production restore.

After this task continue strictly with Media install, Unlimited devices, User Login eye, mobile User list/edit, role visibility, retests, then Field Notes.

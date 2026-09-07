# NEUTRAL – TODO

## Current status
- Device-live user login: DEVICE RETEST REQUIRED
- Device-live admin login: DEVICE RETEST REQUIRED
- Session separation (User-App vs Admin): CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED (second fix after Device-Retest #1 failure)
- Remaining UX/framework cleanup: PENDING
- Final cleanup / Core 1.0 gate: FUTURE

## Action list
1. Separate user and admin session contexts without breaking shared RBAC/database contracts. (CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED – second fix: removed admin.php fallback to the User-App session cookie)
2. Clean up user-app header wording and settings label. (DONE / documented)
3. Make navigation entries clearly interactive tabs/buttons. (DONE / documented)
4. Implement configurable homepage modes and admin controls.
5. Add i18n with device detection and persistent override.
6. Improve permission catalog UX.
7. Expand session overview with end-other-sessions semantics.
8. Re-test settings persistence and theme flows on device.
9. Validate offline / warm-start / GPS device flows.
10. Final cleanup and hardening; then freeze assessment.

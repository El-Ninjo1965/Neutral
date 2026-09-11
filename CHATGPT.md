# Neutral handoff — one collected operator acceptance round

**Code state 2026-09-11:** The User Login password control now contains its Eye button directly in rendered markup; the shared helper binds it without adding a duplicate. The optional module Self-Test entry is validated as a safe module-local HTML path, and Admin shows a test action only for modules that declare one. Field Notes is implemented solely in new module/test files, using the generic lifecycle, route, permission, migration, limit, navigation and backup contracts.

## Truth boundaries

- Code, focused tests and the complete regression suite are not an operator-live pass.
- The previous dynamic Eye implementation failed on operator iPad/Chrome normal and private. The replacement remains **OPERATOR RETEST REQUIRED**.
- Profile, Media, Unlimited, User Management, module visibility/grouping and Field Notes remain **OPERATOR RETEST REQUIRED**.
- Media remains lifecycle/capability scaffolding, not a complete upload product.
- A module Self-Test proves only its declared isolated path; it does not prove lifecycle, API, DB, permissions, integration or production behavior.
- Referral/Rewards and automatic setup were not implemented. Core Freeze was not declared.
- No Production Restore or destructive production action was performed.

## Single collected operator retest

1. User Login Eye — iPad/Chrome normal and private: Eye is visible immediately; operate Show/Hide and confirm focus/touch behavior.
2. Profile — Install/Activate/Deactivate/Re-activate; Profile/Privacy visibility and retained data.
3. Media — Install/Register/Activate/Deactivate/Re-activate without `Load failed`.
4. Unlimited — direct Package with multiple sessions and, where practical, License Package/User override; never display or enforce `0`; confirm numeric limits still block correctly.
5. User Management — List/Create/Edit/Save/Cancel/Back on a small screen, including Package/License/roles/device limits and success dialog.
6. Apps / User Modules / System Modules — grouping and lifecycle details remain complete.
7. Module Visibility/Navigation — test Admin/Developer/User/Viewer independently and confirm hidden navigation does not grant or remove API permission.
8. Self-Test — GPS action visible and functional; Profile, Media and Field Notes show no false test action.
9. Field Notes — Install/Activate; create/list/edit/delete own notes; confirm another user cannot access them; Deactivate/Re-activate retains data and navigation follows visibility.
10. Moderation/Notifications/Postbox/Sharing — lifecycle regression.
11. GPS — normal product-function regression.
12. Complete remaining host gates from `CORE-1.0-READINESS.md`, including protected backup-path/key/read-only checks; never restore Production as a test.

Only after every required result is recorded may the operator start a separate Core-Freeze decision.

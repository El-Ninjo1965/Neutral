# Current Task — Global Save Confirmation + User Create P0 + Access Navigation

Source of truth: `CODEX.md` (2026-09-11 active follow-up).

## Checklist

- [x] Synchronize and inspect the complete UI → API → service → database create-user flow.
- [x] Fix User/Admin creation and controlled validation/duplicate responses; cover audit and refresh.
- [x] Add one shared, accessible success-dialog contract used by User and Admin save/create/update actions.
- [x] Add one shared accessible password visibility helper to every User/Admin password field.
- [x] Add responsive spacing between User Management and Create New User panels.
- [x] Reorder ACCESS navigation without changing routes, permissions, labels, or active-state behavior.
- [x] Preserve organization-sharing gating, birthday, navigation, commercial, session, audit, GPS, and backup behavior.
- [x] Add focused automated coverage and run the full test/lint/package suite.
- [x] Update required documentation with the verified result.
- [x] Commit, push `main`, await CodeQL/FTPS, run bounded read-only production smoke, and record the actual outcome in `CHATGPT.md`.

## Safety

- Never print or commit secrets/PII.
- No destructive production action and no production restore.

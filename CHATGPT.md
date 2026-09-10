# Neutral handoff — optional Profile/system contracts

**Actual state (2026-09-11):** The Profile account API is now owned by the optional, invisible `profile` system module and served through the generic module HTTP kernel. It is activated once for existing installations as a compatibility default; an explicit later Admin deactivation remains authoritative. The User settings shell checks the active capability before loading or rendering Profile/Privacy and therefore remains usable without it. Profile data is retained across disable/re-enable.

Profile owns display name, email/profile contacts, birthday, gender, organization-sharing profile flags and a bounded square avatar data asset. The migration is additive and non-destructive. Avatar payloads are authenticated, MIME/image verified, limited to 256×256 and 256 KiB, and included in encrypted database backup. The browser-facing upload/crop workflow and visual default-avatar acceptance remain an operator/device retest gate; do not mark them live passed without that test.

Independent inactive system contracts now exist for `media`, `sharing`, `notifications`, `moderation`, and `postbox`. Every manifest has zero mandatory module dependencies and declares only optional enhancement relationships. Their generic policy/capability surfaces are contract scaffolding, not a claim that their full product UIs are complete. Field Notes was intentionally not created.

The shared password helper remains the sole User/Admin eye implementation; User Login invokes it after dynamic rendering and `ui-feedback.js` is part of the offline shell. iPad/Chrome remains a live retest.

## Verification still required

- Profile enabled: existing fields persist and update.
- Profile disabled: Login/Core/Admin/Packages/Licenses/Sessions/GPS/Backup remain stable.
- Profile re-enabled: retained data returns.
- Avatar crop/replace/delete/default avatar and round display on target devices.
- User Login eye on iPad/Chrome, including a refreshed offline shell.
- Field Notes later, without changing Core.

No production restore or destructive production action is permitted.

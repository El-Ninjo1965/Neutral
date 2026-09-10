# Neutral handoff — documentation-consistent state

**Stand 2026-09-11:** Documentation has been reconciled with code and the operator report. Core Freeze is blocked.

## Truth that the next agent must preserve

- Profile is code-side an optional invisible module with a generic GET/PUT route, but live activation fails with `Internal Server Error`; do not claim it operational.
- Media install fails live with `Load failed`. Media, Sharing, Notifications, Moderation and Postbox manifests mostly provide contract/status scaffolding, not complete products.
- Moderation, Notifications, Postbox and Sharing completed lifecycle operations live and were disabled afterward; this proves lifecycle only. GPS remains active.
- Unlimited device semantics fail live (`2 of 0`, login blocked).
- User Login Eye remains absent on the operator iPad normal/private despite code-side helper/precache.
- Role-specific module Visibility/Navigation and mobile-separated User list/edit are missing.
- Avatar target is not complete: the server only accepts an already-square bounded Data URL; crop/optimization/UI/defaults/cache/live proof are open.
- Field Notes has not been built. It follows repairs/retests as the separate no-Core-change freeze proof.
- Automatic environment-detecting setup is planned for immediately after freeze, not implemented today.

## Next order

Profile activation → Media install → Unlimited devices → User Login Eye → mobile User list/edit → role Visibility/Navigation → live lifecycle/Profile/avatar retest → Field Notes. Never use a production restore as a test.

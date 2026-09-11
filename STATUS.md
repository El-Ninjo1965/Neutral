# Neutral status — pre-freeze code completion

**Stand:** 2026-09-11
**Code status:** VORHANDEN and locally tested
**Operator status:** RETEST REQUIRED
**Core Freeze:** NOT declared

## Code-/test-verified

- Profile partial-DDL migration recovery, optional capability gating and data-retaining deactivate/reactivate contract.
- Media server entry/package presence and generic lifecycle scaffold; this is not a complete Media product.
- Unlimited device limits preserve SQL/JSON `null` across direct Package, License and User override resolution instead of displaying/enforcing zero.
- User Management has exclusive list/create/edit states with controlled Save/Cancel return.
- Module Admin separates Apps, User Modules and System Modules and stores role navigation visibility independently of permissions.
- User Login now renders its password field and exactly one Eye button together in static login markup. The shared helper binds state and remains a fallback for other dynamic forms.
- Optional module `standalone` is a validated, module-local HTML Self-Test entry. GPS remains the only bundled module declaring one.
- Field Notes is present as an independent User Module with its own manifest, PHP service, retained table migration, permissions, limit, responsive UI and owner-scoped CRUD. Its implementation introduced no Field-Notes reference into Core/shared routing.
- Backup V2 discovers the Field Notes table through the existing module database declaration; no backup special case was added.

## Operator-live status

The earlier iPad finding remains authoritative: the dynamic User Login Eye was not visible in normal or private Chrome. The new static-markup replacement has not yet been operator-retested. Profile, Media, Unlimited, User Management, module grouping/visibility and Field Notes likewise require one collected live acceptance round. Moderation, Notifications, Postbox and Sharing previously passed lifecycle checks but require regression confirmation; GPS remains the active reference.

## Deliberately not implemented

- Referral/Rewards remains a later optional System Module.
- The automatic setup/installation routine remains post-freeze work.
- No production restore or destructive production action is an acceptance test.

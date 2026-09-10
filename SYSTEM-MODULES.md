# Neutral optional system-module boundary

**Status:** Binding pre-freeze architecture; extraction work remains explicitly tracked.

## Core boundary

Core owns mechanisms only: module lifecycle/manifest validation, identity and authorization, settings/storage/event/routing/theme primitives, safe HTTP/file primitives, and generic backup discovery. It must not know profile fields, sharing audiences, moderation states, notification channels, or message semantics.

Every concrete system feature is optional. Absence or deactivation must produce capability absence—not an exception, implicit installation, or `500`. Hard module dependencies are allowed only when operation is impossible without them. Enhancements use `optionalDependencies` and feature detection.

## Manifest presentation

`presentation.userNavigation=false` keeps an active module out of User navigation. `presentation.adminNavigation=false` suppresses a dedicated Admin destination. `presentation.system=true` labels a capability/system module. Lifecycle state and presentation are independent.

## Extraction map

| Optional module | Owns | Must not require |
| --- | --- | --- |
| `profile` | display name, gender, birthday, avatar, profile visibility and organization-sharing preferences | Sharing, Community, Notifications |
| `media` | safe IDs, MIME/size policy enforcement, protected storage, image resize/optimization, replace/delete and backup declaration | Profile, Community, Moderation |
| `sharing` | generic resource/field visibility with private default and server authorization | Profile or any domain module |
| `moderation` | generic review queue/status and reviewer edits/actions | Community, Postbox, Notifications |
| `notifications` | popup/mail channels, preferences and optional batching | Moderation, Postbox |
| `postbox` | permission-scoped inbox/sent/reply/recipient expansion and audited broadcasts | Profile, Media, Notifications, Moderation |

Profile avatar policy belongs to `profile`: square processed output up to 256×256, original discarded, round rendering, replace/delete, and gender-derived non-persisted defaults. Secure storage and transformation are consumed from `media` when present or a narrowly defined Core storage primitive; Profile cannot make Media mandatory until that primitive boundary is complete.

## Compatibility and extraction sequencing

The deployed account/profile endpoints and tables remain a compatibility bridge until the Profile module owns them. This bridge is not part of the freeze target. Extraction must first add capability registration and route/settings extension points, then move UI/API/schema ownership without changing stored data or silently dropping birthday/privacy/avatar records. A Neutral app without Profile must retain login, technical user identity, permissions, Packages/Licenses, module loading and independent modules.

## Field Notes freeze proof

`field-notes` is the immediate post-boundary acceptance module. It must add manifest, route/navigation, permissions, table/migrations, settings, i18n, theme UI, offline behavior and backup declaration without edits to existing Core files. Media and Sharing integrations must be optional. If Core edits are needed, Core 1.0 is not freeze-ready.

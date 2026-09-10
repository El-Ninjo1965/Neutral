# NEUTRAL – TODO

## Current status

- P1 (User-App vs Admin-Interface separation): LIVE BESTANDEN
- Workflow reset: DONE
- P4 configurable landing page: LIVE BESTANDEN
- Settings / Appearance separation: LIVE BESTANDEN; obsolete Theme/Layout controls removed code-side
- Theme consistency and quick toggle: LIVE BESTANDEN
- Appearance UX V2 + local navigation personalization: CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED
- Full i18n / other feature work: PENDING

## Action list

1. Maintain the documented truth hierarchy, `Neutral` environment preflight, and CURRENT-TASK capture process for all future work. Status: DONE
2. Keep historical failures as evidence only; do not allow them to override newer live operator findings. Status: DONE
3. Record the positive iPad/Safari Dark-warmstart retest and close P4 after confirming no remaining required P4 acceptance point. Status: DONE / LIVE BESTANDEN
4. Remove obsolete Theme/Layout controls from Admin Appearance while preserving local header themes and homepage settings. Status: DONE CODE-SIDE / SHORT OPERATOR VISUAL CONTROL RECOMMENDED

- [ ] Operator: configure the documented daily cPanel Cron command for automatic backups and confirm the first encrypted inventory entry; this is host configuration, not an application-code gap.

- [ ] DEVICE RETEST REQUIRED: Phase-2 Admin sessions, infrastructure, release, settings, alerts and Audit labels on iPad/Safari.
- [ ] HOST-CHECK REQUIRED: run packaged Core migrator and verify boolean backup prerequisites; configure external backup cron without exposing values.

## Externe Abnahme nach Live-Follow-up

- **DEVICE RETEST REQUIRED:** iPad/Chrome-Retest für Session-Re-Login, Admin-Reauth, schnelle Navigation, Dashboard/Infrastruktur, Audit-Tablet-Layout und GPS-Karte/Share.
- **HOST ACTION REQUIRED:** Backup-Key, geschützte Dateirechte und cPanel-Cron gemäß `Install-README-Server.md` hostseitig aktivieren und nur über boolesche Readiness bestätigen; kein Produktions-Restore.

## Externe Abnahme nach Device-/Responsive-Follow-up

- [ ] **DEVICE RETEST REQUIRED:** Auf demselben iPad/Chrome alte eindeutig historische Sessions einmalig widerrufen, zweimal neu anmelden und bestätigen, dass danach genau eine aktive Installation mit `iPadOS · Chrome` bleibt; echte Zweitgeräte dürfen nicht gelöscht werden.
- [ ] **DEVICE RETEST REQUIRED:** GPS-Öffnen ohne `about:blank`, nativen Share, interaktive OSM-Karte sowie das responsive GPS-/Settings-Grid in Hoch-/Querformat prüfen.
- [ ] **HOST ACTION REQUIRED:** Host-Key/ACL/Cron konfigurieren und danach ausschließlich die boolesche Backup-Readiness und einen nicht-destruktiven Backup-Lauf bestätigen; kein Produktions-Restore.

## Core-freeze external acceptance

- [ ] **DEVICE RETEST REQUIRED:** iPad/Chrome – lokale Sessionzeit/iPadOS-Anzeige, einsprachiges GPS, echte Karten-Zoom-/Pan-Interaktion, Settings-Unterseiten, genau ein Active-State, In-place Save und Profile/Password prüfen.
- [x] Migration `2026_09_09_0005_account_license_foundation` wurde über den idempotenten Deployvertrag angewendet; Produktionssmoke bestätigt `migrationsReady:true`.
- [ ] Product configuration later: packages/licenses and organization managers are neutral foundations; no commercial tiers, Marketplace, Community, Messaging or CatchTrack features are configured by this task.

## External acceptance after 2026-09-09 follow-up

- **DEVICE RETEST REQUIRED:** user login, separate admin login, Davao GPS marker/center through zoom/pan/refresh, and OSM opening without replacing Neutral.
- **HOST/OPERATOR CHECK REQUIRED:** exercise a test license's scoped block/remove/device revoke and a test media pending/approve/reject/delete lifecycle; no destructive production restore.

## P0 external acceptance

- **DEVICE RETEST REQUIRED:** after the auth deployment, first test only existing User `Tester`, then existing Admin `Developer`. Do not proceed to broader freeze acceptance until both are operator-confirmed.

## External freeze acceptance after 2026-09-10

- **DEVICE RETEST REQUIRED:** Package first-submit, `free_license` creation/deactivation, free/unlimited Package/License/User device limits, manager selection, Birthday Day/Month/Year, Audit Delete All's two dialogs, plus short Auth/Session/GPS regression.
- **HOST ACTION REQUIRED:** backup key/ACL/cron and isolated empty-host install/update/restore/move acceptance; never restore on production.

## Backup completeness follow-up

- [ ] Define and implement a generic portable-data contract for installed module-owned tables (currently e.g. `reference_notes_items`) without discovering or exporting arbitrary database tables.
- [ ] Add authenticated encrypted file payload support for media binaries referenced by `user_media`, including size/retention/atomic restore rules; never include secrets or arbitrary host paths.
- [ ] After both gaps close, execute and document an isolated Empty-Host restore with Core, module records and media files. Never perform this acceptance test on production.
- Re-evaluate Core 1.0 only after every external row in `CORE-1.0-READINESS.md` has evidence.

## External acceptance after license/session/backup-path follow-up

- **DEVICE RETEST REQUIRED:** Delete an unreferenced test License; verify a referenced License is blocked and `Revoked / blocked` remains available.
- **DEVICE RETEST REQUIRED:** Confirm Session User ID, full Installation/Device ID and honest iPad/OS metadata on the real iPad.
- **HOST ACTION REQUIRED:** Enter the prepared external Backup Storage Path, run `Test path`, save it, then separately create/download one backup and verify a scheduled runner use; no production restore.

- [ ] Operator: verify V2 create/download and Automatic Backup/Cron; restore only on isolated staging, never production.
- [ ] Device: verify anonymous/authenticated Settings tabs and Birthday save/reopen/reload/re-login/delete plus iPad layout.

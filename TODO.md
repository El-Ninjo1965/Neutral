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

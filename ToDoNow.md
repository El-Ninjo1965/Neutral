# NEUTRAL – ToDoNow

## Current operational status

- P1 (User-App vs Admin-Interface separation): LIVE BESTANDEN
- Workflow reset: DONE / DOCUMENTED
- P4 (configurable landing page): LIVE BESTANDEN
- Settings / Appearance separation: LIVE BESTANDEN; obsolete Theme/Layout controls removed code-side
- Theme consistency and quick toggle: LIVE BESTANDEN
- Appearance UX V2 + local navigation personalization: CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED
- Full i18n / other feature work: PENDING

## Active priority list

1. Keep the truth hierarchy and CURRENT-TASK capture contract in force for all future work.
2. Keep historical device failures as evidence only; they do not overwrite the newest live operator result.
3. Preserve the operator-confirmed P4 live state: Dark warmstart has no white Loading or flash, and the previously confirmed module/HTML, theme, navigation and P1 paths remain authoritative.
4. Perform only the short visual control that Admin Appearance now starts with Global Start Page and both local header theme toggles remain functional.

## Historical evidence retained

- Earlier failed P1 device reports remain as historical evidence only.
- They are not the current active status once the real operator live test is successful.

- [ ] Host operator only: configure `scripts/run-automatic-backup.php` as documented in cPanel Cron and verify first scheduled run.

- [ ] DEVICE RETEST REQUIRED: execute the concise Admin Phase-2 checklist in `CHATGPT.md`.
- [ ] HOST-CHECK REQUIRED: migration readiness and backup prerequisite booleans must be green before live Admin completion.

- DEVICE RETEST REQUIRED: gebündelten iPad/Chrome-Live-Follow-up prüfen.
- HOST ACTION REQUIRED: Backup-Key/ACL/Cron sicher gemäß Installationsanleitung aktivieren; kein Restore auf Produktion.

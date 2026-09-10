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

## Aktuelle externe Abschlusskontrollen

- **DEVICE RETEST REQUIRED:** Einmalige Sichtung/Widerruf historischer zufälliger Session-IDs, danach Relogin-Deduplizierung und ehrliche iPadOS-/Chrome-Anzeige auf dem Betreibergerät prüfen.
- **DEVICE RETEST REQUIRED:** Google-/OSM-Öffnen, System-Share, eingebettete Karteninteraktion und responsive GPS-/Settings-Karten auf iPad prüfen.
- **HOST ACTION REQUIRED:** Verschlüsselungs-Key, geschützte Ablage und Cron hostseitig aktivieren; der UI-Button wird erst bei vollständig grüner Readiness aktiv.

## Current external checks

- **DEVICE RETEST REQUIRED:** gebündelte iPad/Chrome-Liste aus `CHATGPT.md` vollständig durchführen; neue Flächen bis dahin nicht `LIVE BESTANDEN` nennen.
- Migration/Readiness des Account-License-Fundaments ist deployed und bestätigt. **HOST ACTION REQUIRED** bleibt ausschließlich für Backup-Key/ACL/Cron; kein Produktions-Restore.

## Current external checks

- Real iPad/Chrome retest for the four live regressions after the follow-up deployment.
- Controlled operator acceptance for scoped license management and media moderation. Code/CI/smoke do not by themselves constitute `LIVE BESTANDEN`.

## Current acceptance boundary

Corrected Package first-submit, License create/deactivate, free/unlimited Device limits, manager selection, Birthday dropdowns and two-dialog Audit Clear require operator device acceptance. Backup and fresh-host portability require host action. Do not mark Core 1.0 passed before both groups are complete.

Current follow-up is code-side complete: License Delete reference protection, Session User/Installation identity and configurable Backup Storage Path await the concise real Device/Host acceptance in `CHATGPT.md`. Do not hardcode the operator's host path and do not run a production restore.

Backup content audit result: **BACKUP CONTRACT PARTIAL**. The 21 non-ephemeral Core tables are isolated-round-trip and rollback verified, while module-owned data and media binaries are outside v1. Next code gate is the generic module/file portability contract followed by an isolated Empty-Host restore; production restore remains prohibited.

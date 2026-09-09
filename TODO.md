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

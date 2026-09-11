# NEUTRAL – nachgewiesener Stand

**Stand:** 2026-09-11
**Status:** CORE FREEZE BLOCKIERT

## VORHANDEN (Code/Test)

- PHP/MySQL-Produktionsbasis, getrennte User-/Admin-Sessions, RBAC/CSRF, Module Discovery/Registration/Activation, generischer Modul-HTTP-Kernel, Modulmigrationen und Admin-Lifecycle.
- Manifestpräsentation für User-/Admin-Navigation und Systemmodule sowie nicht blockierende `optionalDependencies`-Metadaten.
- Packages/Licenses, direkte User-Packages, License-Priorität/Fallback, numerische/default/unlimited Modellierung, Sessions/Installation-ID, Audit, Backup-V2 und konfigurierbarer Backup-Pfad.
- Profile-Manifest, Permissions, generische GET/PUT-Route, Gender-/Avatar-Schemaabsicht und capability-gated User-Settings.
- Systemmodul-Manifeste und Status-Services für Media, Sharing, Notifications, Moderation und Postbox.
- GPS als aktives Referenzmodul mit deklariertem Standalone-Test.

## LIVE BESTANDEN (Betreibergerät, nach Commit `4dae2b5`, 2026-09-11)

- Moderation, Notifications, Postbox und Sharing: Install → Activate → Deactivate → Activate. Danach wieder deaktiviert.
- Dieser Nachweis betrifft ausschließlich Lifecycle, nicht vollständige Fachfunktion oder UI.
- GPS blieb aktiv.

## TEILWEISE / LIVE NICHT BESTANDEN

1. **Profile:** registered/inactive; Activate → `Activation failed: Internal Server Error`. Profile/Privacy deshalb nicht live verfügbar, obwohl `profile.view`/`profile.update` vorhanden waren.
2. **Media:** discovered/not registered; Install → `Install failed: Load failed`.
3. **Unlimited Devices:** zweiter Session-/Loginfall wurde trotz wirksamem Unlimited-Package blockiert; UI sinngemäß `2 of 0 sessions`. Nullable-Unlimited-Auflösung ist End-to-End fehlerhaft.
4. **User Login Eye:** auf Betreiber-iPad im normalen und privaten Browsermodus nicht sichtbar, obwohl Shared Helper, SVG und Precache code-seitig vorhanden sind.
5. **Profile Avatar:** Service akzeptiert bereits quadratische Data-URLs ≤256 px/256 KiB; Auswahl/Crop/Optimierung/Replace/Delete/runde Anzeige/Gender-Defaults/Cache und Liveprüfung fehlen.
6. **Systemmodule:** Sharing/Notifications/Moderation/Postbox sind Scaffolding mit Statusroute, keine fertigen Fachprodukte; Media ist ebenfalls kein vollständiger Modulservice.
7. **Module Visibility:** globale Manifestpräsentation und Permissionfilter vorhanden; getrennte rollenbezogene Visibility-/Navigation-Verwaltung fehlt.
8. **User Management mobil:** Liste und Edit/Create sind noch nicht als getrennte mobile States umgesetzt.
9. **Setup:** aktuelle Paket-/Preflight-/Setupwege vorhanden; weitgehend automatische Selbsterkennung ist erst Post-Freeze geplant.

## Freeze-Gates

Core Freeze bleibt blockiert bis die vier Livefehler repariert und erneut live geprüft, die beiden UX-/Administrationslücken geschlossen, Profile/Media/Systemmodule korrekt eingeordnet und Field Notes später ohne fachliche Core-Änderung umgesetzt wurde. Kein Produktions-Restore wurde als Test durchgeführt.

## Code repairs 2026-09-11 — operator retest required

Profile partial-DDL retry, Media packaged entry verification, Unlimited JSON-null handling, User Login DOM self-healing/visibility CSS, exclusive User list/edit states, role navigation visibility and User/System grouping are implemented and locally tested. None supersedes the previous live failure until operator retest. Referral/Rewards and Field Notes remain unimplemented.

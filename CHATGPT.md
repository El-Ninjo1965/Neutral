# NEUTRAL — CODEX → CHATGPT/LEA

**Datum:** 2026-09-10
**Auftrag:** Organization Sharing und routenbasierter Active-State
**Status:** CODE-SEITIG IMPLEMENTIERT · LOKAL VERIFIZIERT · DEVICE RETEST REQUIRED

## Tatsächlicher Endstand

- `Share with my organization` beruht jetzt ausschließlich auf einer autoritativ serverseitig ermittelten aktiven `license_users`-Zuordnung zu einer aktiven License. Das Profil liefert nur das Boolean `organizationSharingAvailable`, keine Organisationsdetails.
- Einzeluser sehen das Organization-Sharing-Fieldset nicht. Manipulierte Requests, die dennoch eine Freigabe aktivieren, werden vor jeder Profilmutation mit 422 abgelehnt. Fehlende Privacy-Payloads erhalten bestehende Werte; Default bleibt vollständig off.
- Nach Entfernen, Widerruf oder Deaktivierung der Zuordnung liefert die nächste Profilhydration `false` und die Option verschwindet.
- Hauptnavigation, Settings-Hauptaktion und Settings-Untertabs leiten Active-State aus View und URL-Hashroute ab. Reload, Back/Forward und direkte Hash-Links werden unterstützt; `aria-current="page"` markiert genau den aktuellen Eintrag.
- Active Styles verwenden ausschließlich `--nav-active-*`-Tokens und gelten stabil bei Hover; Light, Dark und Custom Design bleiben autoritativ.
- Die vorherigen Birthday- und Auth-Tab-Fixes bleiben erhalten und sind regressionsgeprüft.

## Verifikation

- Vollsuite 496/496, PHP-Lint 40 Dateien, JS-Syntax 91 Dateien und Produktionspaket 112 Dateien bestanden.
- Chromium-Sichtprüfung bei 1024×768 durchgeführt.

## Wahrheitsgrenze und Betreiber-Retest

Kein neuer Live-/Freeze-Claim. Zu prüfen: Einzeluser ohne Organization-Option; zugeordneter User mit Option; Entfernung der Zuordnung; Settings-/Modul-/Untertab-Active-State nach Klick, Reload und Deep-Link; Logout auf Profile; Birthday-Persistenz erneut real. Keine destruktive Produktionsaktion wurde ausgeführt.


## Deployment

Implementierungscommit `410a5474b0703edffadc065c450aca79a99923b0` ist nach `origin/main` übertragen. CodeQL Run `34472190168` und FTPS Deploy Run `34472190459` sind terminal erfolgreich; der ausschließlich lesende Produktionssmoke bestätigte Deploymentrevision und `migrationsReady:true`.
# 2026-09-11 implementation handoff

The active Global Save Confirmation + User Create P0 + ACCESS Navigation follow-up is implemented locally. The shared User/Admin success dialog replaces success-only inline feedback on covered save/create/update paths, and a shared observer-based helper equips static and dynamic password inputs with accessible visibility controls. Admin user creation now wraps user/roles, optional license assignment and audit in one transaction and maps validation/duplicate failures to controlled 422/409 responses; update errors are likewise controlled. ACCESS order and User Management spacing match the operator decision. No destructive production action or production restore was performed.

Implementation commit `52aeb7c` was pushed to `origin/main`. Both CodeQL jobs completed successfully. FTPS deployment runs `34525791655` and `34525793434` completed successfully, including their full test/package gates and permanent read-only production checks. The workflow confirmed the deployed revision and readiness contract. A redundant direct smoke attempt from this workspace could not reach the public host because its outbound CONNECT proxy returned 403; no production mutation was attempted. The CI runner's bounded read-only production smoke is therefore the authoritative production evidence. Operator/device acceptance for actual User/Admin creation, modal focus and iPad spacing remains explicitly open; no Final Freeze is declared.
# 2026-09-11 password/direct-package follow-up

Implemented and deployed in `595fc21`: shared recognizable open/crossed eye SVGs including explicit User Login enhancement; direct individual-user Package persistence; active License Package precedence; retained direct fallback after License removal; consistent entitlement/device-limit resolution and source labels. Full local suite passed 503/503; production package contained 113 files. CodeQL run `34530057224` and FTPS run `34530057526` completed successfully. The workflow's bounded read-only production smoke verified the deployed revision and `migrationsReady:true`. No destructive production action or production restore was performed. Still `DEVICE/OPERATOR RETEST REQUIRED`: User/Admin Login eye, direct individual Package, License Package precedence/removal fallback, device limit, and Success Modal.

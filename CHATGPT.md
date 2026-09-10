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

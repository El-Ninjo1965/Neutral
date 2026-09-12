# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Codex → ChatGPT/Lea

**Status:** OFFLINE-FIRST ARCHITECTURE RECOVERY LOKAL VERIFIZIERT – DEPLOYMENT AUSSTEHEND

**Core Freeze:** NICHT erklärt

## Tatsächlicher Stand

GPS verwendet den generischen, versionierten und sanitisierten `publicOffline`-Aktivierungszustand. Dieser Zustand wird vor dem ersten User-Render in die bestehende Registry hydriert, enthält keine Identitäts-, Session- oder Permissiondaten und erteilt keine Serverrechte. GPS-Basissichtbarkeit und lokale Nutzung hängen nicht von User-RBAC, Packages oder Entitlements ab. Profile und Moderation bleiben permission-sensitive.

Catalog-Synchronisierung läuft nach dem stabilen Start, bleibt bei Fehlern retryable und aktualisiert nur Navigation beziehungsweise offene Settings statt die Welcome-Fläche aufgrund der Discovery neu aufzubauen. Autoritative Server- und Admin-Lifecycle-Antworten aktualisieren den Public/Offline-Zustand; eine Deaktivierung verhindert die Hydrierung bei folgenden Offline-Starts. Beschädigte oder inkompatible Projektionen werden verworfen.

Lokal bestanden 560/560 Tests, JavaScript-Syntax, PHP-Lint, `git diff --check` und das Production Package mit 136 Dateien. GitHub-Push, CodeQL, FTPS-Deployment und Production Read-only Smoke stehen noch aus.

## Operator-Retest nach Deployment

1. Frischer/Inkognito-Start: GPS sofort sichtbar, kein Reload und kein Welcome-Doppelblinken.
2. Ralf und Tester: GPS bleibt sichtbar; Profile erscheint bei Active + `profile.view/profile.update`, lässt sich öffnen und speichern.
3. Developer und Admin: GPS bleibt ohne User-RBAC-Abhängigkeit sichtbar.
4. Offline-Start nach gültiger Aktivierung; anschließend Deaktivierung und zukünftigen Offline-Start prüfen.
5. Module Details/Save/Back, Settings-Save-Dialog, Theme-Select und Tabellenabschlusslinie prüfen.

Kein Core Freeze vor diesen Betreiberprüfungen.

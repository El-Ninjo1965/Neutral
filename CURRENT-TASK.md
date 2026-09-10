# CURRENT TASK — Organization Sharing + Active Navigation UX

**Quelle:** `CODEX.md`, Betreiber-Livebefund 2026-09-10
**Status:** IN ARBEIT

1. [x] `origin/main` synchronisieren, vorgeschriebene Dokumentation und Settings/Auth/License/Organization/Navigation-Pfade vollständig lesen, Auftrag erfassen.
2. [x] Autoritativen Organization-Kontext im Profilvertrag ergänzen; Organization-Sharing nur bei aktiver License-Zuordnung anzeigen und serverseitig erlauben, ohne Organisationsdaten zu leaken oder Privacy-Defaults zu verändern.
3. [x] Manipulierte Organization-Sharing-Aktivierung für Einzeluser kontrolliert mit 4xx und ohne Mutation ablehnen; Entfernung/Widerruf der Zuordnung muss nach Hydration die Option entfernen.
4. [x] Zentralen routenbasierten Active-State für Hauptnavigation, Settings-Hauptaktion und genau einen Settings-Untertab implementieren; Deep-Link/Reload/Login/Logout sowie `aria-current` korrekt halten.
5. [x] Active-State ausschließlich aus bestehenden Theme-Tokens gestalten; Light/Dark/Custom, Hover/Focus und Touch respektieren, keine hartcodierte aktive Farbe.
6. [x] Birthday Persistenz/Reopen/Reload/Re-Login/Delete sowie kompakte responsive Selects und anonyme Settings-Sichtbarkeit regressionsprüfen.
7. [x] Vollständige Regression, PHP-Lint, JS-Syntax, Diff-/Secretprüfung, Production Package und visuelle Prüfung ausführen.
8. [x] Geforderte Dokumentation wahrheitsgemäß aktualisieren; kein automatischer Freeze/LIVE-Claim.
9. [ ] Commit/PR/Push main, CodeQL/FTPS/read-only Smoke terminal abwarten, `HEAD == origin/main` und sauberen Tree prüfen; keine destruktive Produktion.

**Capture-Prüfung:** `CODEX.md + Betreiberauftrag == CURRENT-TASK-Anforderungen` — bestanden.

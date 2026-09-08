# NEUTRAL – CURRENT TASK

## Gesamtauftrag

Die beim Betreiber live beobachtete circa zweisekündige `Loading`-Phase bei jedem Warmstart/Reload ursächlich beheben und die zentrale User-App-Navigation app-typisch/touchgerecht gestalten. Der neue Local-first-Vertrag aus `UI-UX.md` ist verbindlich. Bereits live bestätigte P4-, GPS-, HTML-, Login- und P1-Fixes bleiben erhalten; keine vollständige I18N- oder neue Sync-/Offline-Queue-Architektur.

## Nummerierte, überprüfbare Arbeitspunkte

1. Vollständig mit `origin/main` synchronisieren und neuere `CODEX.md`-/`UI-UX.md`-Verträge unverändert übernehmen. **Status: ERLEDIGT**
2. Alle in `CODEX.md` geforderten Verträge, Status-, User-App-, Startup-, Cache-, Service-Worker-, Navigation-, Modul- und Testpfade vollständig lesen. **Status: ERLEDIGT**
3. Root Cause der sichtbaren Warmstartwartezeit im tatsächlichen Homepage-/Startup-/Storage-Datenfluss bestimmen und dokumentieren; nicht durch Animation, Timeout oder Verstecken kaschieren. **Status: ERLEDIGT**
4. Regressionstests zuerst ergänzen: gültige lokale HTML-Homepage rendert vor Serverrefresh; Refresh aktualisiert Cache; Offline-Warmstart; Erststart; invalider/inkompatibler Cache. **Status: ERLEDIGT**
5. Einen minimalen versionierten, ausschließlich öffentlichen Homepage-Cache implementieren; keine Session-/Permission-/authentifizierten Katalogdaten als öffentliche Wahrheit persistieren. **Status: ERLEDIGT**
6. HTML-Warmstart sofort aus gültigem lokalen Stand rendern und Serverprojektion danach im Hintergrund abgleichen. **Status: ERLEDIGT**
7. Modul-Warmstart so früh wie sicher ermöglichen, ohne Permission-/Viewer-Fail-Closed oder Startkontext zu schwächen; Discovery-/Serverrefresh im Hintergrund erhalten. **Status: ERLEDIGT**
8. Kaltstart ohne gültigen Cache sowie Online-/Offline-Fehler kontrolliert auf Loading/Fallback führen. **Status: ERLEDIGT**
9. Messbare Startup-Instrumentierung bzw. belastbare Tests für Local-first Render vor verzögertem Serverrefresh ergänzen. **Status: ERLEDIGT**
10. Zentrale Navigation (`Start`, GPS, spätere erlaubte Bereiche) als klar erkennbare touchgerechte App-Aktionen mit eindeutigem Active-, Hover- und `:focus-visible`-Zustand gestalten. **Status: ERLEDIGT**
11. Navigation zentral/theme-kompatibel halten; keine Modul-eigenen Navigationsstile und keine Änderungen an freiem HTML-Inhalt. **Status: ERLEDIGT**
12. Persönliche `App areas`-Auswahl, ausgeblendete/nicht erlaubte Bereiche, P1, Auth/CSRF, Appearance, GPS, HTML, Offline, Service Worker, Packaging und Base Path regressionsfrei halten. **Status: ERLEDIGT**
13. Keine Scope-Ausweitung auf vollständige I18N-/Providerarchitektur, Sync-/Offline-Queue, Store-Wrapper, neue Module, Admin-Redesign oder Designsystemersatz. **Status: ERLEDIGT**
14. Relevante Verträge, `STATUS.md`, `TODO.md`, `CHANGELOG.md` und Workflow-Arbeitsprotokoll wahrheitsgemäß aktualisieren; keine erfundene Live-Bestätigung. **Status: ERLEDIGT**
15. Fokussierte Tests, vollständige Suite unter PHP 8.1+, PHP-Lint, JS-Syntax, `git diff --check`, Produktionspaket sowie Secret-/Artefaktprüfung ausführen. **Status: ERLEDIGT**
16. Vollständigen Abschlussbericht mit Root Cause, Änderungen, Tests, Commits, CI und konkretem Betreiber-Retest in `CHATGPT.md` erstellen. **Status: ERLEDIGT**
17. Committen, nach GitHub `main` pushen, `HEAD == origin/main`, sauberen Working Tree und `CHATGPT.md` auf GitHub verifizieren sowie FTPS, CodeQL und weitere CI terminal abwarten. **Status: ERLEDIGT**

## Capture-Prüfung

`CODEX.md == CURRENT-TASK-Anforderungen: JA`

## Operative Wahrheit und Grenzen

- Live bestätigt bleiben: GPS/HTML-P4-Inhalt, Startkontext, kein Welcome-Flash, GPS-Formatierung/Share, bereinigte Settings und P1.
- Aktuell offen und live nachgewiesen: Warmstart zeigt ungefähr zwei Sekunden `Loading`; zentrale Navigation wirkt zu sehr wie Textlinks/Tabs.
- Öffentliche Homepage darf lokal gecacht werden; authentifizierte Berechtigungsdaten dürfen nicht als anonymer Fallback persistiert werden.
- P4 bleibt bis erneutem Betreiber-Retest unterhalb `LIVE BESTANDEN`.

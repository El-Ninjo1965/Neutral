# NEUTRAL – CURRENT TASK

## Gesamtauftrag

Die durch den Betreiber am 2026-09-08 live nachgewiesene P4-Regression im realen
Produktionspfad ursächlich beheben und die normale User-App gemäß dem aktuellen
verbindlichen `UI-UX.md` von Developer-/Framework-UI bereinigen. Neuere
`UI-UX.md`- und `CODEX.md`-Änderungen von `origin/main` bleiben vollständig
erhalten. P1 und die getrennten User-/Admin-Sessions dürfen nicht zurückgebaut
werden.

## Nummerierte, überprüfbare Arbeitspunkte

1. Mit `origin/main` synchronisieren, ohne neuere Betreiber-/ChatGPT-Änderungen oder fremde Arbeit zu verwerfen. **Status: ERLEDIGT**
2. `CODEX.md`, `WORKFLOW.md`, `UI-UX.md` und alle verpflichtend genannten Verträge, Statusdateien, Implementierungs- und Testpfade vollständig lesen. **Status: ERLEDIGT**
3. Live-Produktionsfluss vollständig verfolgen: Admin Save → PHP-Persistenz → öffentliche Projektion → Base-Path/API → User-App Fetch/Fallback → Startup/Discovery/Access → sichtbares Home-Rendering → Service Worker/Produktionspaket. **Status: ERLEDIGT**
4. Root Cause des live wirkungslosen Modul- und HTML-Modus konkret beweisen und in Regressionstests reproduzieren; grüne Mock-/Node-Tests nicht als Gegenbeweis verwenden. **Status: ERLEDIGT**
5. PHP-nahe End-to-End-Tests ergänzen: Adminpersistenz und öffentliche Projektion stimmen für `module` und `html` strukturell überein; freies HTML bleibt unverändert. **Status: ERLEDIGT**
6. Produktions-/Base-Path-/Packaging-Test ergänzen, der den tatsächlich ausgelieferten User-App-Endpoint und die benötigten versionierten Assets prüft. **Status: ERLEDIGT**
7. Startup-Regressionstests ergänzen: gültige Konfiguration wird nach Discovery/Access wirklich sichtbar angewendet und nicht später durch Default-Rendering überschrieben. **Status: ERLEDIGT**
8. P4 ursächlich korrigieren: Modulmodus öffnet ein gespeichertes aktives und zugängliches Modul (insbesondere GPS im Betreiberfall); ungültig/nicht zugänglich fällt kontrolliert neutral zurück. **Status: ERLEDIGT**
9. P4 ursächlich korrigieren: gültiger HTML-Modus ersetzt nach Start/Reload sichtbar den Defaultinhalt und bewahrt den bewussten Administrator-HTML-Vertrag. **Status: ERLEDIGT**
10. Wechsel `module → html → module`, Reload/Warmstart, bestehende Offline-Fallbacks sowie zentrale Persistenz ohne parallele Architektur erhalten. **Status: ERLEDIGT**
11. User-App von technischem Username im Header, `Active Application`, `Local Workspace`, Modulzahl, Framework-/Discovery-/Workspace-Text und generischem sichtbaren Zurück-Standardbutton bereinigen. **Status: ERLEDIGT**
12. Vorhandene zentrale Navigation app-typisch, touchgerecht und sichtbar nutzbar machen, ohne den Permission-/Module-Access-Vertrag zu umgehen oder eine große neue Navigationsarchitektur zu erfinden. **Status: ERLEDIGT**
13. Produktbranding minimal universell machen: sichtbaren Application Name aus bestehendem Produktvertrag beziehen und Neutral-`N` über austauschbaren Logo/Icon-Konfigurations-/Assetvertrag ersetzen können; Generator/Produktkopie erhält den Vertrag. **Status: ERLEDIGT**
14. Login-/Session-UX bereinigen, ohne P1, sichere Serversessions, Auth/CSRF oder Passwortregeln zu verändern; erfolgreicher Login darf keinen technisch unnötigen Namen im Header erzwingen. **Status: ERLEDIGT**
15. Mindestregressionen abdecken: P1, Auth/CSRF, anonymer Viewer, Offline-Fallback, Theme, Modul-Lifecycle, Permissionfilter, UX-Bereinigung, Branding und Generator. **Status: ERLEDIGT**
16. Keine Scope-Ausweitung auf Sync-Engine, Offline-Queue, Store-Wrapper, vollständiges Designsystem oder neue Produktmodule. **Status: ERLEDIGT**
17. Relevante Architektur-, Funktions-, Status-, TODO- und Changelog-Dokumentation auf tatsächlichen Endstand aktualisieren; P4 bleibt `DEVICE RETEST REQUIRED / LIVE FEHLER NACHGEWIESEN`, bis ein neuer positiver Betreiber-Livetest vorliegt. **Status: ERLEDIGT**
18. Fokussierte Tests, vollständige `npm test`-Suite unter PHP 8.1+, PHP-Lint, JS-Syntaxcheck, `git diff --check`, Produktionspaket und Secret-/Artefaktprüfung ausführen. **Status: ERLEDIGT**
19. `CHATGPT.md` mit Root Cause, Ausgangs/finalem Commit, Dateien, Tests, offenen Punkten, Device-Retest, Push, CI, HEAD/origin-main, Working Tree und konkreten Retestschritten aktualisieren. **Status: ERLEDIGT**
20. Committen, authentifiziert nach GitHub `main` pushen, `CHATGPT.md` dort verifizieren, `HEAD == origin/main` und sauberen Working Tree prüfen sowie FTPS, CodeQL und weitere CI bis terminal abwarten. **Status: IN ARBEIT**

## Capture-Prüfung

`CODEX.md == CURRENT-TASK-Anforderungen: JA`

## Operative Wahrheiten und Grenzen

- Höchste Wahrheit: P4 funktioniert im aktuellen Betreiber-Livetest nicht.
- P4-Status bis positivem Retest: `DEVICE RETEST REQUIRED / LIVE FEHLER NACHGEWIESEN`.
- P1 zeigt keine neue Live-Regression und bleibt `LIVE BESTANDEN`.
- Keine symptomatischen Timeouts/Reloads und kein stiller Default-Fallback bei gültiger Konfiguration.
- Keine Secrets; keine neueren Betreiberänderungen überschreiben; keine unrelated Refactorings.

## Betreiber-Retest nach Deploy

1. Appearance → `Module` → GPS speichern → User-App neu laden → GPS muss Startziel sein.
2. Appearance → `Text / HTML` → sichtbaren Testinhalt speichern → User-App neu laden → Inhalt muss Startseite sein.
3. Wieder `Module` wählen → Reload → Persistenz und Startziel prüfen.
4. User-App prüfen: kein `Tester`, kein `Active Application`, kein `Local Workspace`, keine Modulzahl, kein generischer Zurück-Button.
5. Sichtbare, app-typische und permission-aware Navigation prüfen.
6. Produktname, Logo-Default und Austauschbarkeit prüfen.
7. User-/Admin-Sessiontrennung erneut bestätigen.

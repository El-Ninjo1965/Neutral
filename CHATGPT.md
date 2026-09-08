# NEUTRAL – Abschlussbericht Codex → ChatGPT/Lea

**Datum:** 2026-09-08  
**Auftrag:** Dark Theme, Theme-Schnellumschaltung und stabile FTPS-Verifikation  
**Status:** **CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED** · **P1 LIVE BESTANDEN**

## Synchronisation / Capture

`origin/main` (`679da3f`) wurde zuerst synchronisiert; der neue `CODEX.md`-Auftrag wurde über Merge `f9d6dff` unverändert übernommen. Danach wurde der vollständige Auftrag in `CURRENT-TASK.md` erfasst (`CODEX.md == CURRENT-TASK-Anforderungen: JA`).

## Root Cause Theme

Die globale Tokenbasis existierte, die später angefügten User-App-/GPS-Regeln verwendeten jedoch erneut feste Light-Farben (`#fff`, helle Flächen, feste Text-/Borderfarben). Diese Regeln übersteuerten bzw. umgingen den zentralen Themevertrag. Deshalb blieben Header-Actions, GPS-Karte, Settings-Texte und Container im Dark Theme hell oder kontrastarm.

### Korrektur

- Zentrale User-Surface-Regeln verwenden nun `--bg`, `--surface`, `--surface-secondary`, `--surface-tertiary`, `--text`, `--text-muted`, `--border`, `--line-strong` und `--primary`.
- Header-Actions, Navigation, Settings, Inputs, GPS-Flächen/-Texte/-Buttons und der Frameworkcontainer des HTML-Inhalts erben diese Tokens.
- Freies Administrator-HTML wird nicht umgeschrieben; der umgebende Frameworkcontainer ist transparent/theme-neutral.
- Der kompakte Sonne-/Mond-Button im Header ist touchgerecht, beschriftet und nutzt exakt `readUserTheme()`/`applyUserTheme()` sowie `neutral.user.theme.v1` wie die Settings-Auswahl. Es gibt keinen zweiten Theme-State; Wechsel ist sofort, persistent und offline.

## Root Cause FTPS-Fehlmeldungen

Die GitHub-Historie wurde geprüft. Unter den letzten Läufen waren u. a.:

- Run `34204392812` / Commit `f4437b4`: Upload erfolgreich, anschließend Revision-Smoke mit alter öffentlicher Revision fehlgeschlagen.
- Run `34197224914`: gleicher Revisions-Mismatch nach Upload.
- Run `34197320536`: öffentlicher Root im Smoke kurzfristig nicht erreichbar.
- Kurz darauf folgende Runs waren erfolgreich.

Damit waren mindestens zwei wiederkehrende Failures post-upload HTTP-Propagation/Cache-Zustände, keine Git-/Build-/Uploadfehler. Außerdem starteten einzelne Main-Deployments nahezu gleichzeitig und konnten öffentlich sichtbare Mischzustände erzeugen.

### Korrektur

- Produktionsdeployments sind durch `concurrency.group: neutral-production-ftps` mit `cancel-in-progress: false` serialisiert.
- Der Smoke läuft weiterhin ausschließlich nach erfolgreichem Upload.
- Nur ein gültiges, aber noch altes `sourceCommit` erhält begrenzte Wiederholungen: vier Versuche mit 2s/5s/10s Backoff im Workflow.
- Code erzwingt maximal fünf Versuche, maximal 15s pro Pause und maximal 30s Gesamtdauer.
- Permanenter Revision-Mismatch bleibt FAILURE.
- Uploadfehler, unerreichbares Manifest, falsche URL/Base Path, Dirty-Manifest, Redirect-, Security-, Viewer- und Modulvertragsfehler werden nicht durch Retry kaschiert.
- Diagnoseausgabe enthält nur Versuch und nächste Wartezeit, keine Secrets.

## Tests

- Fokussierte Theme-/FTPS-/P4-/Packaging-Tests: 58/58 bestanden.
- Gesamtsuite: 416/416 bestanden, 0 Fehler, 0 übersprungen.
- PHP-Lint: bestanden.
- JavaScript-Syntax: bestanden.
- `git diff --check`: bestanden.
- Produktionspaket: erfolgreich, 105 Dateien.
- Secretprüfung: keine Secret-Werte eingebracht.
- Screenshot konnte mangels ausführbarem Browser in der Containerumgebung nicht erstellt werden; kein Artefakt committed.

## GitHub / CI

Implementierungscommit: `2539745` (`fix: unify dark theme and stabilize deploy smoke`).

Eigener Abschlussdeploy mit korrigiertem Workflow:

- FTPS Deploy Run `34210138068`: **SUCCESS**.
- Push on main / CodeQL Run `34210137946`: **SUCCESS**.

Der Bericht wird ebenfalls nach `main` übertragen; dessen CI wird terminal abgewartet und `CHATGPT.md` anschließend per GitHub-Blob-Hash verifiziert.

## Betreiber-Retest

1. Header-Schnellumschaltung Sonne/Mond in anonymer und angemeldeter User-App testen; Reload und Offline prüfen.
2. Settings → Appearance prüfen: Auswahl zeigt denselben Zustand und schaltet denselben State.
3. Dark prüfen: Header-Actions, Start/GPS-Navigation, GPS-Karte, GPS-Texte/Buttons, Settings-Karten/Labels/Inputs sowie HTML-Frameworkfläche.
4. Light erneut prüfen.
5. Tastaturfokus und Touchgrößen prüfen.
6. Warmstart, HTML-Homepage, GPS, App areas und Login kurz regressiv prüfen.
7. User-/Admin-Sessiontrennung erneut bestätigen.

Keine vollständige I18N-, Sync-/Queue-, Modul-, Admin- oder neue Designsystemarchitektur wurde begonnen. Theme/P4 bleibt bis zum positiven Device-Retest unterhalb `LIVE BESTANDEN`; P1 bleibt `LIVE BESTANDEN`.

## Abschlussberichtslauf

Der Berichtslauf bestätigte die Stabilisierung erneut: FTPS Deploy Run `34210739835` und Push on main / CodeQL Run `34210739409` endeten terminal mit **SUCCESS**. Der reine Checklist-Abschlusslauf wird ebenfalls vor der externen Antwort abgewartet.

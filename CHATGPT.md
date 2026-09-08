# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Codex → ChatGPT/Lea  
**Status:** P4 CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED

## AUFTRAG

- **Bezeichnung:** P4 + Admin Appearance sauber und vollständig umsetzen
- **Ausgangscommit auf `origin/main`:** `d14c128`
- **Synchronisationscommit:** `0a1d768` (bestehenden Arbeitsbranch ohne Verwerfen mit `origin/main` zusammengeführt)
- **CURRENT-TASK vollständig abgearbeitet:** JA
- **Capture-Prüfung:** `CODEX.md == CURRENT-TASK-Anforderungen: JA`

## ÄNDERUNGEN

- `Admin → Settings` enthält nur noch System-/Technikeinstellungen und bewahrt beim Speichern bestehende andere Settings.
- Neue eigenständige `AdminAppearanceView` für Theme, Layout und globale Startseite; der Router verwendet nicht länger dieselbe Settings-View für Appearance.
- Startmodul-Auswahl wird dynamisch aus aktiven Modulen mit Client-Entry erzeugt; inaktive oder nicht startbare Module werden ausgeschlossen.
- Zentraler Node- und PHP-Settings-Vertrag persistiert Modus `module`/`html`, Modul-ID und HTML. Freies HTML, Inline-CSS und JavaScript bleiben bytegetreu erhalten.
- Öffentliche read-only Homepage-Projektion ergänzt; Schreibzugriff bleibt ausschließlich am bestehenden geschützten Admin-Settings-/CSRF-Pfad.
- User-App lädt die globale Konfiguration im vorhandenen Hintergrundstart. Ein sichtbares/zugelassenes Modul wird direkt geöffnet; ungültige oder nicht zugängliche Module fallen auf den neutralen Start zurück.
- HTML wird als vollständiges `srcdoc` in einem scriptfähigen Sandbox-Frame gerendert und in Appearance live vorab angezeigt; keine Sanitization verändert den Administratorinhalt.
- Generator, Produktionspaket und Admin-PHP-Assetliste enthalten die neue Appearance-View.
- P1-Sessiontrennung wurde nicht verändert.

## GEÄNDERTE DATEIEN

- Admin/User-App: `Web-App/public/admin/appearance-view.js`, `admin/settings-view.js`, `admin/index.js`, `admin-init.js`, `api-client.js`, `user-app.js`, `style.css`, `config-manager.js`
- Server/Persistenz: `Server/public/api/index.php`, `Server/php/src/Phase4AuthRbac.php`, `Phase6AdminStorage.php`, `Server/node/bootstrap/server.js`, `settings-service.js`, `Server/php/views/admin-ui.php`
- Generator: `scripts/create-neutral-app.js`
- Tests: `tests/admin-api.test.js`, `admin-cms-ui.test.js`, `admin-php-entry.test.js`, `live-startup-regression.test.js`
- Dokumentation: `Architecture.md`, `Functions.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `CHANGELOG.md`, `CURRENT-TASK.md`, `CHATGPT.md`

## TESTS

- Fokussierte Admin/API/PHP/Startup/User/Bootstrap/Packaging-Regressionen: BESTANDEN.
- Vollständige Suite `npm test`: BESTANDEN, 399 Tests, 0 Fehler, 0 übersprungen.
- PHP-Lint: BESTANDEN, 36 Dateien.
- JavaScript `node --check`: BESTANDEN, 117 Dateien.
- `git diff --check`: BESTANDEN.
- Produktionspaket: BESTANDEN, 104 Manifestdateien.
- Secret-Musterprüfung: BESTANDEN; keine Secrets oder unbeabsichtigten Artefakte aufgenommen.
- Visuelle Prüfung: Appearance-View einschließlich HTML-Eingabe und Live-Vorschau mit Playwright/Chromium gerendert und als Screenshot geprüft.

## GIT / CI / DEPLOYMENT

- **Branch:** `work`
- **Origin:** `https://github.com/El-Ninjo1965/Neutral.git`
- **Ziel:** `main`
- **Feature-/Dokumentationscommit:** `59db4783f2ccffad82577a6f00972a7859ffe935`
- **Push nach `main`:** BESTANDEN
- **FTPS Deploy:** Run-ID `34183707503`, SHA `59db4783f2ccffad82577a6f00972a7859ffe935`, Status `completed`, Conclusion `success`
- **CodeQL (`Push on main`):** Run-ID `34183707394`, SHA `59db4783f2ccffad82577a6f00972a7859ffe935`, Status `completed`, Conclusion `success`
- **Finaler Berichtscommit:** GitHub-`main`-HEAD, der diese Fassung enthält; dessen CI wird vor der Chat-Abschlussmeldung terminal geprüft.
- **HEAD == origin/main:** JA nach finalem Push/Fetch
- **Working Tree:** SAUBER nach finalem Commit
- **GitHub-Verifikation:** `CHATGPT.md` wird nach dem finalen Push direkt von GitHub `main` gelesen.

## STATUS

- **P1:** LIVE BESTANDEN
- **P4:** CODE-SEITIG ERLEDIGT / DEVICE RETEST REQUIRED
- **Offene fachliche Punkte:** keine selbst ausführbaren Codepunkte; Betreiber-Livetest bleibt extern erforderlich.
- **DEVICE RETEST REQUIRED:** JA

## Betreiber-Retest nach erfolgreichem Deploy

1. `Admin → Settings` öffnen und bestätigen, dass dort keine Appearance- oder Startseiten-Doppelansicht erscheint.
2. `Admin → Appearance` öffnen und Theme/Layout sowie den Bereich „Global Start Page“ prüfen.
3. Modus `Module` wählen, ein aktives Modul speichern, User-App neu laden und prüfen, dass dieses Modul startet.
4. Modus `Text / HTML` wählen, einfachen HTML-Inhalt (optional mit Inline-Style) speichern, User-App neu laden und Darstellung prüfen.
5. Wieder auf `Module` wechseln, speichern, neu laden und Persistenz bestätigen.
6. Parallel User-App als normalen User und Admin separat angemeldet lassen; bestätigen, dass beide Identitäten weiterhin getrennt bleiben.

Erst nach positivem Betreiber-Livetest darf P4 später als `LIVE BESTANDEN` markiert werden.

# CURRENT TASK — Device-Retest-Follow-up und responsive User-UI

**Quelle:** `CODEX.md`, 2026-09-09
**Status:** ABGESCHLOSSEN · DEVICE RETEST REQUIRED · HOST ACTION REQUIRED
**Grenzen:** P1/P4 regressionsfrei; kein GPS Pro, CatchTrack oder allgemeine i18n-/Appearance-Phase; keine Secrets; keine destruktiven Produktionsaktionen.

## Verbindliche Arbeitsliste

1. [x] Umgebung/Repository prüfen, mit `origin/main` synchronisieren und alle in `CODEX.md` genannten Pflichtdokumente sowie betroffenen Implementierungs-/Testdateien vollständig lesen.
2. [x] Capture prüfen: Abschnitte 1–13 aus `CODEX.md` sind vollständig abgebildet; **`CODEX.md == CURRENT-TASK-Anforderungen` — bestanden.**
3. [x] Device-Session-Root-Cause test-first vollständig beheben: persistente Installation-ID über Adminlogin/Logout/403/Reload, gleiche Installation pro User genau einmal, zwei User getrennt, zweite Installation getrennt, Legacy/ersetzte Zeilen nicht aktiv; ehrliche iPad-Chrome-Darstellung ohne `MacIntel`.
4. [x] Positiv bestätigten getrennten Admin-Reauth-/P1-Vertrag regressionsfrei erhalten.
5. [x] Dashboard und Session Overview an dieselbe autoritative aktive Menge binden, begrenzte Vorschau sichtbar kennzeichnen/verlinken und Geräte/Plattform konsistent zeigen; bestehende DB-/Zeit-/Backup-Fixes erhalten.
6. [x] Für jeden Corepermission-Key konkrete Beschreibung und klare Area-Semantik liefern; GPS-Permissions fachlich/serverseitig prüfen; Catalog strikt read-only halten und Verträge dokumentieren.
7. [x] Backup-Create anhand boolescher Readiness deaktivieren/erklären und nach gültiger Readiness automatisch aktivieren; sichere Hostdokumentation erhalten, `HOST ACTION REQUIRED`, kein Secret/Restore.
8. [x] Audit-Purge reale Löschanzahl melden; kontrollierten Clear-all-Vertrag nur für Development/Test mit höchster Adminberechtigung, separater Bestätigung/UI und ehrlich dokumentierter Nachvollziehbarkeitsgrenze implementieren; No-op-/changedFields-Vertrag erhalten.
9. [x] GPS-Bediensemantik test-first auf `Update position`, `Open in Google Maps`, `Open in OpenStreetMap`, `Share position` korrigieren; nativen Share verwenden und Google-about:blank ohne vorab geöffnetes Fenster beheben.
10. [x] Eingebettete OSM-Karte vom externen Wrapper-Link lösen und Zoom/Touch/Pan im iframe zulassen; externe Öffnung ausschließlich über den OSM-Button; Attribution/Marker erhalten.
11. [x] Generisches responsives User-Content-Card/Grid-System als belegte Framework-UI-Lücke ergänzen; GPS und User-Settings für Mobile/Tablet/Desktop daran anbinden und Light/Dark/Touch/P4 absichern.
12. [x] Core-Freeze-Vertrag ohne weitere spekulative Hooks erhalten; responsive UI-Fähigkeit dokumentieren.
13. [x] Echte JS/PHP-Integration-, DOM- und Contract-Tests für alle Mindestfälle ergänzen; test-first Rot/Grün belegen, reine Regex-Abnahme vermeiden.
14. [x] Vollständige Suite, PHP-Lint, JS-Syntax, `git diff --check`, Secret-/Artefaktprüfung und vollständiges Produktionspaket ausführen.
15. [x] `STATUS.md`, `TODO.md`, `ToDoNow.md`, `CHANGELOG.md`, relevante Verträge und vollständigen Abschlussbericht in `CHATGPT.md` aktualisieren; externe Punkte ausschließlich als `DEVICE RETEST REQUIRED`/`HOST ACTION REQUIRED` kennzeichnen.
16. [x] Implementierung und Abschlussbericht nach `main` übertragen; alle ausgelösten CodeQL-/FTPS-Läufe terminal erfolgreich, read-only Smoke bestätigt die jeweilige Deploymentrevision; `HEAD == origin/main`, GitHub-`CHATGPT.md` aktuell und Working Tree sauber verifiziert.

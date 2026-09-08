# NEUTRAL – CODEX ABSCHLUSSBERICHT

**Richtung:** Codex → ChatGPT/Lea
**Auftrag:** P4 live abschließen und `Admin → Appearance` bereinigen
**Datum:** 2026-09-08
**Status:** P4 `LIVE BESTANDEN` · APPEARANCE-BEREINIGUNG CODE-SEITIG ABGESCHLOSSEN

## 1. Übergabe und Synchronisation

- Die Sandbox wurde zuerst auf den aktuellen Stand von GitHub `main` (`cc90867`) synchronisiert. Die neueren verbindlichen Fassungen von `CODEX.md`, `USER-UI-DESIGN.md` und `I18N.md` wurden vollständig erhalten.
- Der Auftrag wurde vor Implementierungsarbeit vollständig nach `CURRENT-TASK.md` übernommen und mit `CODEX.md == CURRENT-TASK-Anforderungen: JA` geprüft.
- Der Scope blieb auf den P4-Liveabschluss und die Entfernung der toten Appearance-Controls begrenzt. Weder der künftige User-UI-Designeditor noch die vollständige I18N-Architektur wurden begonnen.

## 2. P4-Liveabschluss

- Der neue Betreiberbefund bestätigt auf dem realen iPad/Safari bei aktivem Dark Theme und mehreren Reloads/Warmstarts: kein weißes `Loading…`, kein heller/weißer Flash und unmittelbares Erscheinen des lokalen Homepageinhalts.
- Frühere negative Device-Befunde bleiben in der zeitlichen P4-Evidenz erhalten, sind aber kein aktiver Status mehr.
- Die bereits vorher bestätigten Pflichtpfade umfassen Modul- und HTML-Modus, Moduswechsel, unverändertes Administrator-HTML, Local-first-Warmstart, Dark/Light-Umschaltung, Home/GPS-Navigation und die unveränderte P1-Sessiontrennung.
- Die Abnahmelogik aus den geltenden P4-/Core-Verträgen enthält damit keinen weiteren offenen P4-Pflichtpunkt. Vollständige I18N und der zukünftige User-UI-Designeditor sind Folgearchitektur und keine rückwirkenden P4-Blocker.
- Operative Wahrheit: **P4 = LIVE BESTANDEN** und **P1 = LIVE BESTANDEN**.

## 3. Appearance-Codeprüfung und Änderung

- Die erneute repositoryweite Prüfung fand keinen produktiven Consumer, der `settings.theme` auf die aktuelle Admin- oder User-Oberfläche anwendet. Admin und User verwenden stattdessen ihre getrennten lokalen Zustände `neutral-admin-theme` beziehungsweise `neutral.user.theme.v1`.
- Ebenso existiert kein produktiver Consumer für `settings.layout = default|compact`.
- Deshalb wurde der vollständige sichtbare Block `Theme & Layout` einschließlich beider Selects aus `Admin → Appearance` entfernt. Die Ansicht beginnt nun fachlich mit `Global Start Page`.
- Der Save-Pfad fragt `theme` und `layout` nicht mehr aus dem Formular ab. Er führt jedoch weiterhin das vollständige bestehende `settings`-Objekt mit und ersetzt ausschließlich `homepage`. Vorhandene Altwerte und andere Settings werden deshalb weder gelöscht noch auf `null` gesetzt.
- Global Start Page, HTML-/Modulmodus, dynamische Liste startbarer Module, Preview, Reload und geschützter Save bleiben erhalten.
- Admin-Header-Theme und User-Header-Theme wurden nicht verändert.

## 4. Regressionstests

- Der Appearance-Vertrag prüft jetzt ausdrücklich das Fehlen von `Theme & Layout`, `name="theme"`, `name="layout"` und entsprechender `FormData`-Abfragen.
- Ein neuer Save-Test beweist, dass Homepage-HTML exakt übertragen wird und fremde sowie historische Settings (`language`, `theme`, `layout`) unverändert erhalten bleiben.
- Fokussiertes Paket aus Appearance, Settings API, Homepage, Theme/Warmstart, Service Worker, Packaging, Auth und FTPS-Smoke: **148/148 bestanden**.
- Vollständige Suite: **428/428 bestanden**, 0 Fehler, 0 übersprungen.
- PHP-Lint: **36 Dateien bestanden**.
- JavaScript-Syntaxcheck, `git diff --check`, Secret-Pattern-Prüfung und Produktionspaket bestanden; das Paket enthält **106 Dateien** bei Base Path `""`.
- In der Sandbox steht kein Chromium-/Chrome-Browser zur Verfügung. Daher wurde keine künstliche visuelle Bestätigung erzeugt; der verbleibende kurze Kontrolltest ist unten benannt.

## 5. GitHub und CI

- Implementierungscommit `4c8c626` (`fix: remove obsolete Appearance controls`) wurde nach GitHub `main` übertragen.
- CodeQL / `Push on main`: Run `34282252971` – terminal `success`.
- FTPS Deploy: Run `34282253189` – terminal `success`, einschließlich Test-, Paket-, Upload- und Read-only-Smoke-Pfad.
- Berichtcommit `d97eba0` wurde ebenfalls nach `main` übertragen. CodeQL / `Push on main` Run `34282751925` und FTPS Deploy Run `34282753416` erreichten terminal `success`.
- Die abschließende Checklist-Markierung wird als letzter Dokumentationscommit übertragen und vor der externen Abschlussmeldung erneut auf terminale CI, `HEAD == origin/main`, sauberen Working Tree und identischen GitHub-Blob geprüft.

## 6. Kurzer Betreiber-Kontrolltest

Dies ist kein verbleibender P4-Blocker, sondern die kurze visuelle Kontrolle der neu bereinigten Adminansicht:

1. `Admin → Appearance` öffnen.
2. Prüfen: `Theme & Layout` ist entfernt.
3. Prüfen: `Global Start Page` ist weiterhin vorhanden.
4. HTML-Inhalt speichern und die User-App kurz prüfen.
5. Admin-Header-Theme und User-Header-Theme kurz regressiv prüfen.

## 7. Ergebnis

- Keine selbst ausführbaren fachlichen Punkte offen.
- Keine Secret-Werte, künstlichen Testdateien oder generierten Paketartefakte committed.
- Keine P4-fremde I18N- oder User-UI-Designimplementierung begonnen.
- P4 und P1 bleiben entsprechend der aktuellen realen Betreiberbefunde `LIVE BESTANDEN`.

# CURRENT TASK — License Create und Admin-/Profil-/Audit-UX Nachbesserung

**Quelle:** `CODEX.md` und `ADMIN-UX-DECISIONS.md`, 2026-09-10
**Status:** IN ARBEIT

1. [x] Verbindliche Umgebung/Repository/`origin/main`, Zugang und sauberen Ausgangsstand prüfen; Pflichtdokumente vollständig lesen; Auftrag ohne Secrets erfassen.
2. [x] `Create License` end-to-end reproduzieren und den tatsächlichen UI/API/PHP/DB-/Migrationsfehler beheben; gültiger First Submit, verständliche 4xx, Refresh sowie Edit/Status/Package-/Delete-Schutz regressionsfest testen.
3. [x] möglichen Package-First-Submit-/Mount-/Auth-/State-Fehler prüfen und den ersten gültigen Submit zuverlässig machen.
4. [x] Device-Limits in Package, License und User auf Default, freie positive Ganzzahl und `unlimited` umstellen; autoritative Servervalidierung und bestehende Sessions erhalten.
5. [x] License-/User-Begriffe verständlich machen, Manager über geeignete Userauswahl statt numerischer ID bedienen und Deaktivieren/Widerrufen sicher erhalten.
6. [x] Geburtstag als drei touchfreundliche Dropdowns Tag/ausgeschriebener lokalisierter Monat/Jahr implementieren; ISO, Löschen, Leap-Year und Privacy-default-off sichern.
7. [x] Audit Delete All auf genau zwei Dialogbestätigungen ohne `DELETE`-Eingabe umstellen; Permission, Adminsession, CSRF, Transaktion, Nachweis und Retention regressionsfest testen.
8. [x] Auth-/Session-, Packages-/Licenses-/Users-/Limits-, GPS-, Settings-, PHP-/JS-, Diff-, Vollsuite- und Produktionspaket-Regression ausführen.
9. [x] Vertrags-, Status-, Todo-, Readiness- und Übergabedokumentation wahrheitsgemäß aktualisieren; keine automatische Freeze-/Live-Erklärung.
10. [x] Änderungen committen, nach `origin/main` pushen und CI/CodeQL/FTPS terminal abwarten.
11. [x] Deploymentrevision und `migrationsReady:true` sowie sichere Production-Smokes prüfen; keine destruktiven Aktionen, Secrets oder PII.
12. [x] `CHATGPT.md` mit tatsächlichem Endstand und kurzer Betreiber-Retestliste aktualisieren; finalen Dokumentationsstand committen/pushen, terminal abwarten und sauberen `HEAD == origin/main` verifizieren.

**Capture-Prüfung:** `CODEX.md + ADMIN-UX-DECISIONS.md + neuer Betreiberauftrag == CURRENT-TASK-Anforderungen` — bestanden.

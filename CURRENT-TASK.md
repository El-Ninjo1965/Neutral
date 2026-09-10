# CURRENT TASK — Backup-Inhalt, Vollständigkeit und Restore-Sicherheit

**Quelle:** `CODEX.md`, Betreiber-Livebefund 2026-09-10
**Status:** ABGESCHLOSSEN UND DEPLOYED · BACKUP CONTRACT PARTIAL · KEIN PRODUKTIONS-RESTORE

1. [x] Verbindliche Umgebung `Neutral`/Repository prüfen, `origin/main` synchronisieren und alle vorgeschriebenen Architektur-, Security-, API-, Datenbank-, Installations- sowie Backup-/Restore-/Schema-/Migration-/Upload-/Download-/Automatic-Backup-Pfade vollständig lesen.
2. [x] Den tatsächlichen Create→Export→Serialize→Encrypt→Persist-Vertrag und sämtliche enthaltenen sowie ausgeschlossenen Tabellen/Datenbereiche gegen das verwaltete Schema exakt auditieren.
3. [x] Die reale Größe von ca. 27,8 KB fachlich anhand Format, Datenumfang, fehlender Kompression, Verschlüsselungs-Overhead und möglicher stiller Ausschlüsse eingeordnet, ohne Produktionsdaten oder Secrets auszulesen.
4. [x] Reproduzierbaren isolierten End-to-End-Test mit bekannten Records in allen 21 Coretabellen implementiert: Backup, Mutation, Restore, exakte Wiederkehr, Sessionausschluss sowie Schema-/Security-Vertrag.
5. [x] Falschen Schlüssel, Manipulation und absichtlichen Importfehler auf kontrolliertes, atomisches Scheitern geprüft; Restore hinterlässt keinen Teilzustand.
6. [x] Download-/Upload-Vertrag einschließlich byteidentischem Artefakt, Content-Type/Dateiname, Auth/Permission/CSRF, Größenlimit, Fehlerhygiene und Traversal geprüft; Upload validiert nun Schema, exakte Tabellenmenge und Zeilenstruktur vor finalem Speichern.
7. [x] Core-1.0-Backupvertrag in `BACKUP-CONTRACT.md` verbindlich definiert: Muss-Inhalt, bewusste Ausschlüsse, Medien-/Dateivertrag und Neuaufbau aus Release + hostlokaler Umgebung + Datenrestore.
8. [x] Evidenzbasierte Einstufung: `BACKUP CONTRACT PARTIAL`, weil Modul-Nutzdatentabellen und Medienbinärdateien nicht in v1 enthalten sind; kein Live-/Freeze-Claim.
9. [x] Vollständige Regression 491/491, PHP-Lint 40 Dateien, JS-Syntax 91 Dateien, `git diff --check`, Secret-Prüfung und Production Package mit 112 Dateien bestanden; keine Produktionsmutation und kein Produktions-Restore.
10. [x] `CHATGPT.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `CORE-1.0-READINESS.md`, `Install-README-Server.md`, `Architecture.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md` und `BACKUP-CONTRACT.md` mit tatsächlichem Stand und sicherer isolierter Betreiber-Restore-Anleitung aktualisiert.
11. [x] Implementierungsänderungen committet, PR-Metadaten erstellt und nach `origin/main` gepusht; CodeQL/FTPS und ausschließlich read-only Production-Smoke terminal erfolgreich. Abschlussdokumentation separat committet; finaler sauberer Remote-Gleichstand wird nach deren Push verifiziert.

**Capture-Prüfung:** `CODEX.md + aktueller Betreiberauftrag == CURRENT-TASK-Anforderungen` — bestanden.

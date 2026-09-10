# CURRENT TASK — License Delete, Session Device UX und Backup Storage Path

**Quelle:** `CODEX.md` und `ADMIN-UX-DECISIONS.md`, 2026-09-10
**Status:** IMPLEMENTIERT UND DEPLOYED · DEVICE/HOST RETEST REQUIRED

1. [x] `origin/main` synchronisieren; verbindliche Dokumentation und relevante License-/Session-/Backup-Implementierung vollständig lesen; Auftrag secretsicher erfassen.
2. [x] Sicheren License Delete mit Adminpermission, CSRF, Bestätigung, Referenzprüfung, verständlichem 4xx, Auditnachweis und sofortigem Listenrefresh implementieren; Revoked/blocked erhalten.
3. [x] Sessions um menschenlesbaren Usernamen plus numerische User-ID und klar benannte persistente Installation/Device ID ergänzen.
4. [x] Device class, Operating system und Browser als reine Supportmetadaten konservativ trennen; iPadOS Safari/Desktop-UA, Chrome iPad, iPhone, Android, Windows, macOS und Unknown test-first abdecken; keine Fingerprints oder Identitätsänderung.
5. [x] Backup storage path auf Backup & Restore konfigurierbar machen: Test path, Save, persistente installationsspezifische Konfiguration, geschützter serverseitiger Probe-Write und ehrliche Protected/Needs-host-verification-Auswertung.
6. [x] Manuellen Backup-Service und Automatic-Backup-Runner denselben gespeicherten Pfad verwenden lassen; bestehende Backups nicht verschieben; `NEUTRAL_BACKUP_KEY` ausschließlich hostlokal und boolesch darstellen.
7. [x] Device-Limit-Semantik ausdrücklich als Default pro User bewahren und keine Organization-Device-Pool-Semantik einführen.
8. [x] Pflichtregression vollständig ausführen: Auth/scoped Sessions/Deduplizierung, IDs/Plattformfixtures, Packages, License CRUD/Referenzschutz/Audit, User-Limits, Birthday, Audit Clear, GPS, Settings, Backuppfad/Runner/Secret-Grenzen, PHP/JS/Diff/Vollsuite/Produktionspaket.
9. [x] `CHATGPT.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `CORE-1.0-READINESS.md`, `ADMIN-UX-DECISIONS.md`, `Install-README-Server.md` und betroffene API/Security/Architecture/UI-Dokumentation wahrheitsgemäß aktualisieren; kein automatischer Freeze/LIVE-Status.
10. [x] Implementierungscommit nach `origin/main` gepusht; CodeQL und FTPS Deploy terminal erfolgreich; verbindlicher read-only Production-Smoke bestätigt Deploymentrevision und `migrationsReady:true`. Abschlussdokumentation folgt als eigener Commit; finaler Remote-Gleichstand wird danach verifiziert.

**Capture-Prüfung:** `CODEX.md + ADMIN-UX-DECISIONS.md + Betreiberauftrag == CURRENT-TASK-Anforderungen` — bestanden.

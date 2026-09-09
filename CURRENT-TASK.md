# CURRENT TASK — Admin Operations, Permissions and Device Sessions

**Quelle:** `CODEX.md` (aktiver Betreiberauftrag)
**Status:** in Bearbeitung
**Scope:** P1/P4 regressionsfrei; User-App ohne Adminfunktionen; keine Geheimnisse.

## Verbindliche Arbeitsliste

1. [x] Umgebung `Neutral`, `GH_TOKEN`, Repository, `origin/main` und GitHub-Schreibweg secretsicher prüfen; vollständig mit `origin/main` synchronisieren.
2. [x] `CODEX.md` und `WORKFLOW.md` vollständig lesen; Auftrag vollständig erfassen und Gleichheit `CODEX.md == CURRENT-TASK-Anforderungen` prüfen.
3. [x] Alle ausdrücklich geforderten Projekt-, Installations-, Deployment-, Backup- und relevanten Implementierungs-/Testdateien vollständig auditieren.
4. [x] Architekturgrenze durchsetzen: User-App enthält keine Adminfunktionen; Admin-/Systemrechte und User-App-/Modulrechte in Defaults, Seeds, APIs und Dokumentation sauber trennen.
5. [x] Permission-Defaults bestehender Installationen migrieren; Viewer/User von Adminrechten bereinigen; deklarative Core-/Modulregistry und serverseitige Checks erhalten.
6. [x] Permission Catalog als lesbare, responsive, read-only Registry mit Key, Beschreibung, Scope und Quelle sowie sinnvollen Filtern umsetzen.
7. [x] Sichere persistente Geräte-Sessions implementieren: zufällige Installations-ID, serverseitige Bindung/Widerruf/Rotation, sichere Cookies, zentrales Gerätelimit, Migration alter 12h-Sessions, Logout und Security-Revoke-all; keine Hardwarefingerprints/Secrets in localStorage.
8. [x] Admin Session Overview zur datensparsamen Geräteverwaltung mit verständlicher Plattform, Registrierung, letzter Aktivität, Status, Current-Markierung, Einzelwiderruf und Cleanup/Retention umbauen.
9. [x] Connections, Server, Database und Diagnostics an gemeinsame autoritative sichere Runtime-/Healthdaten anbinden; Beispiel-/Fakewerte entfernen und nicht verfügbare Werte ehrlich kennzeichnen.
10. [x] Persistenten Maintenance Mode mit sicherer User-Sperre, erreichbarer Admin-UI, escaptem Grund und Auditdaten fertigstellen; reale Release-/Buildinformationen statt statischer Updatebehauptung zeigen.
11. [x] Backup/Restore vollständig auditieren und finalisieren: verschlüsselte create/list/download/upload/validate/restore/delete-Flows, automatische hostkompatible Trigger, Retention, Fehlerstatus und Sessioninvalidierung bei Restore.
12. [x] Audit Log lesbar/filterbar und detailsicher darstellen; kontrollierten Retention-Purge mit Bestätigung und eigener Auditspur, ohne Einzeldelete, implementieren.
13. [x] System Settings auf wirksame Optionen ausrichten: Production-Loglevel, echte Backup-Automatik/Intervalle/Retention, unveränderliche App-ID; tote Einstellungen entfernen.
14. [x] Sicherheit, Datenschutz und Migrationen test-first absichern (CSRF, getrennte Sessions, Cookieflags, keine Secrets/PII/Fingerprints, Backupausschlüsse); P1/P4 unverändert erhalten.
15. [x] Fokussierte Abnahmetests für Permissions, Device Sessions, Infrastructure, Maintenance, Backup und Audit ergänzen und ausführen.
16. [x] Vollständige Regression inklusive P1/P4, Homepage-Warmstart, Themes, Appearance V2, Navigation, GPS, Login, User/Rollen/Module, Service Worker, Packaging/Base Path, FTPS/Smoke und Secret-/Artefaktprüfung ausführen.
17. [x] Betroffene Verträge wahrheitsgemäß aktualisieren: `Security.md`, `Architecture.md`, `API.md`, `Database.md`, `Functions.md`, `CONNECTIONS.md`, `UI-UX.md`, `ModuleCreation.md`, Backup-/Install-/Deploymentdokumentation, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `CHANGELOG.md`; externe Cron-Anforderung klar markieren.
18. [x] Abschluss gemäß `WORKFLOW.md`: diff/static checks, Produktionspaket, Commit und Push `main`, `HEAD == origin/main`, sauberer Working Tree, alle erforderlichen CI-Läufe terminal abwarten.
19. [x] Vollständigen Abschlussbericht in `CHATGPT.md` schreiben, separat nach `main` pushen und Datei/Blob auf GitHub `main` verifizieren.

## Capture-Prüfung

Die Punkte 1–19 decken alle Abschnitte 1–14 des aktiven Auftrags ab, einschließlich Architektur, Permission-Audit/-UX/-Migration, Geräte-Sessions/-Verwaltung/-Limit, Infrastrukturwahrheit, Maintenance/Release, Backup/Restore/Automation, Audit-Retention, wirksamen Settings, Sicherheits-/Datenschutzregeln, Testmatrix, Dokumentation und vollständigem GitHub-/CI-/Übergabeabschluss. Damit gilt vor Implementierungsbeginn: **`CODEX.md == CURRENT-TASK-Anforderungen` — BESTANDEN.**

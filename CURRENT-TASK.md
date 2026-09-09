# CURRENT TASK — Live-Retest-Follow-up, Core Freeze und GPS-Basis

**Quelle:** `CODEX.md`, 2026-09-09
**Status:** CODE-SEITIG ERLEDIGT · COMMIT/DEPLOY/CI AUSSTEHEND · DEVICE RETEST REQUIRED · HOST ACTION REQUIRED
**Grenzen:** P1/P4 regressionsfrei; kein GPS Pro; keine CatchTrack-Logik; keine i18n-/Appearance-Neuentwicklung; keine Secrets; kein destruktiver Produktions-Restore.

## Verbindliche Arbeitsliste

1. [x] Umgebung/Repository prüfen, vollständig mit `origin/main` synchronisieren und sämtliche in `CODEX.md` genannten Pflichtdokumente, Implementierungs- und Testpfade vollständig lesen.
2. [x] Capture prüfen: alle Abschnitte 1–14 aus `CODEX.md` sind in dieser Liste abgebildet; **`CODEX.md == CURRENT-TASK-Anforderungen` — bestanden.**
3. [x] Device-Session-P0 test-first beheben: dieselbe Installations-ID bei Re-Login deduplizieren/rotieren, zweite ID getrennt halten, Current/Revoke/Logout/Cleanup und autoritative Zählung erhalten sowie iPad-Chrome ehrlich erkennen.
4. [x] Admin-Login-Sackgasse test-first beheben: falsches Passwort bzw. User ohne Adminrolle führt deterministisch zurück zur getrennten Admin-Anmeldung und danach zum erfolgreichen Adminlogin, ohne P1-Sessionvermischung.
5. [x] Sporadische Admin-Navigationshänger über Router-, Fetch-, Promise-, Cleanup-, Overlay-, Sessionrefresh- und Handlerfluss reproduzieren und ursächlich beheben; ein fehlerhafter View darf Navigation nicht blockieren.
6. [x] Dashboard bereinigen: keine Objektstringifizierung, autoritativer Sessioncount und sinnvolle Geräteübersicht, menschenlesbare Zeit, reale Modul-/Statuswerte und handlungsfähige Backupwarnung.
7. [x] Server/Database/Diagnostics/Connections gemäß Admin-Grundregel bereinigen: echte menschenlesbare Werte oder nutzlose Felder/Buttons entfernen, kein `{}`/`Not found`/widersprüchliches Primary-Default, keine Secrets.
8. [x] Backup-Readiness erhalten und die sichere hostseitige Key-/ACL-/Cron-Betreiberführung vervollständigen; extern Notwendiges exakt als `HOST ACTION REQUIRED`, kein Produktions-Restore.
9. [x] Audit test-first korrigieren: iPad-Layout, Light/Dark-Borders und Details-Tokens, klare getrennte bestätigungspflichtige Retention-Purge-UX, Actor-Handle plus ID, No-op-Saves ohne Write/Audit und echte Änderungen mit sicheren Change-Details.
10. [x] Permission Catalog read-only halten, verständliche Core-/Modulbeschreibungen liefern sowie deklarative Modul-Permissionregistrierung dokumentieren; keine Key-Erstellung/-Bearbeitung/-Löschung.
11. [x] Core-1.0-Vertrag und Modulpfade auditieren, nur nachgewiesene generische Extension-Point-Lücken schließen, Freeze-/Entscheidungsregel dokumentieren und echten Referenzmodul-Contract-Test ergänzen.
12. [x] GPS-Basismodul ohne GPS Pro abrunden: Position/Genauigkeit/Refresh, bewusste Share-Auswahl mit Google Maps zuerst, OSM und System Share, klickbare OSM-Karte/Marker sowie klare Context-Sharing-Abgrenzung; wiederverwendbarer neutraler Location-Vertrag.
13. [x] Berührte UI-Flächen in Light/Dark und iPad-Breakpoints auf erkennbare Inputs/Focus, konsistente Buttons, Touchziele, Tokens und überlagerungsfreie Layouts absichern; keine P4-Regressions.
14. [x] Echte PHP-/JS-Integration-, DOM- und Contract-Tests für alle Mindestfälle ergänzen und test-first rot/grün belegen; keine reine Source-RegEx-Abnahme.
15. [x] Vollständige Regression, PHP-/JS-Syntax, Diff-/Secretprüfung und Produktionspaket inklusive erforderlicher Operations-/Moduldateien ausführen.
16. [x] Verträge, Status, TODO/ToDoNow, Changelog, Workflow und vollständigen Abschlussbericht in `CHATGPT.md` wahrheitsgemäß aktualisieren; externe Punkte nur als `HOST ACTION REQUIRED`/`DEVICE RETEST REQUIRED`, nichts ungeprüft `LIVE BESTANDEN` nennen.
17. [x] Commit und Push nach `main`; erforderliche FTPS-/CodeQL-/CI-Läufe terminal abwarten; sichere Produktionschecks, Deploymentrevision, `HEAD == origin/main`, GitHub-`CHATGPT.md` und sauberen Working Tree verifizieren.

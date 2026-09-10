# CURRENT TASK — Backup Contract Complete + Settings/Profile UX

**Quelle:** `CODEX.md`, Betreiber-Livebefund 2026-09-10
**Status:** IMPLEMENTIERT UND LOKAL VERIFIZIERT · DEPLOYMENT AUSSTEHEND · KEIN PRODUKTIONS-RESTORE

1. [x] `origin/main` synchronisieren und sämtliche vorgeschriebenen Verträge sowie Backup/Restore-, Moduldata-, Media-, Settings/Profile- und Authpfade lesen.
2. [ ] Generische deklarierte Modultabellen und verwaltete Datei-/Medienbereiche in ein versioniertes, verschlüsseltes Backupformat aufnehmen; sichere relative Pfade, Integrität, Limits und kompatible v1-Behandlung gewährleisten.
3. [ ] DB- und Dateirestore gegen Traversal/Symlinks/Überschreiben schützen und ohne inkonsistenten Teilzustand koordinieren; fehlende Komponenten, falsche Version/Key und Schreibfehler fail-closed testen.
4. [ ] Vollständigen isolierten Empty-Host-Restore mit 21 Coretabellen, generisch deklarierter Modultabelle und echter Binärdatei bytegenau prüfen; neue Sessions erzwingen und Loginvertrag erhalten.
5. [ ] Birthday-End-to-end-Persistenz/Hydration korrigieren: Save-Antwort autoritativ übernehmen, bei Login/Logout Cache invalidieren, Reload/Re-Login/Delete/Schaltjahr testen und keine falsche Erfolgsmeldung zeigen.
6. [ ] Birthday Day/Month/Year auf iPad kompakt horizontal gestalten und auf kleinen Viewports sauber umbrechen; Touchziele erhalten.
7. [ ] Settings-Routing authabhängig machen: anonym ausschließlich App Areas/Navigation, authentifiziert zusätzlich Privacy/Profile; direkter anonymer Aufruf fail-closed, sofortige Login/Logout-Aktualisierung, Privacy default-off.
8. [ ] Vollständige Regression, PHP-Lint, JS-Syntax, Diff-/Secretprüfung, Production Package und visuelle Browserprüfung ausführen.
9. [ ] Alle in CODEX.md genannten Dokumente mit tatsächlicher Backupklassifikation, Freeze-Grenze und Betreiber-Retestliste aktualisieren.
10. [ ] Commit/PR/Push `main`, CodeQL/FTPS/read-only Production-Smoke terminal abwarten, sauberen `HEAD == origin/main` prüfen; niemals Produktions-Restore.

**Capture-Prüfung:** `CODEX.md + Betreiberauftrag == CURRENT-TASK-Anforderungen` — bestanden.

# CURRENT TASK – PROFILE / MODERATION END-TO-END REPAIR

**Status:** IMPLEMENTIERT – TEST/DEPLOYMENT AUSSTEHEND
**Datum:** 2026-09-12
**Quelle:** aktueller fokussierter Auftrag in `CODEX.md`

- [ ] Profile-vs-GPS vom aktiven Serverzustand bis zum tatsächlichen User-DOM instrumentieren und Root Cause beheben.
- [ ] Reales Verhalten testen: authentifizierter berechtigter User sieht Profile, öffnet es und speichert über die geschützte Route; Deaktivierung entfernt es.
- [ ] Moderation über denselben generischen Discovery-/Presentation-/Permission-Vertrag für die Moderatorrolle erreichbar machen und Self-Test prüfen.
- [ ] Manifestdefaults und Admin-Overrides für Visibility/Navigation deterministisch zusammenführen.
- [ ] User Settings Apps- und Navigation-Save im echten Handler mit sichtbarem Frameworkdialog und schließendem OK testen/reparieren.
- [ ] App-/System-Modulübersichten von eigenen Detailrouten trennen; Detail-Save bestätigt und navigiert zurück.
- [ ] Optionalen generischen moduleigenen Admin-Settings-Vertrag prüfen/ergänzen, ohne Provider-Sondercode oder Secret-Leak.
- [ ] GPS-Standorttext auf reale verfügbare Ortsangabe oder ehrlichen Koordinaten-/Unavailable-Fallback ändern und Section-Abstand ergänzen.
- [ ] Verhaltensnahe DOM/API-End-to-End-Tests, Vollsuite, Syntax, PHP-Lint, Diff und Production Package.
- [ ] Dokumentation, Commit/Push, CodeQL, FTPS und read-only Production Smoke terminal prüfen; kein Core Freeze.

Operator-Retest bleibt erforderlich.

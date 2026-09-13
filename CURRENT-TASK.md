# CURRENT TASK – USER UI HOME ROUTING REVIEW FOLLOW-UP

**Status:** TECHNISCH REPARIERT · PR-CI BESTANDEN · OPERATOR-PRÜFUNG OFFEN
**Datum:** 2026-09-13
**Core Freeze:** NICHT erklärt

Behebe ausschließlich den offenen P2-Fund aus dem Codex Review von PR #66:

- [x] Root Cause für Home → Settings → Browser Back/hashchange → Home reproduziert.
- [x] Regressionstest für den Hashchange-/Browser-Back-Pfad ergänzt.
- [x] Alle Übergänge nach Home verwenden dieselbe Cache-Invalidierung.
- [x] Direkter Start-Klick, Settings-Erfolgsdialog und Passwort-Auge bleiben testgesichert.
- [x] Fokussierte Tests, Vollsuite, JS-/PHP-Syntax, Production Package und `git diff --check` bestanden.
- [x] PR #66 auf dem neuen Branch-HEAD erneut durch CI/CodeQL geprüft.
- [ ] Gezielter Operator-Live-Retest der drei User-UI-Reparaturen im realen Browser/Endgerät.

## Grenzen

- Nicht mergen und nicht auf `main` schreiben.
- Keine anderen Entwicklungsaufgaben oder unnötigen Refactorings.
- Kein Production Restore; produktiver Deploy ausschließlich über den vorgesehenen GitHub-Actions-Pfad.
- Kein Core Freeze vor den ausdrücklich erforderlichen technischen und realen Abnahmen.

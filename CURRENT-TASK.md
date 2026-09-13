# CURRENT TASK – USER UI LIVE REPAIR

**Status:** OFFEN  
**Datum:** 2026-09-13  
**Core Freeze:** NICHT erklärt

Bearbeite ausschließlich die drei im Operator-Live-Retest reproduzierten User-UI-Fehler:

- [ ] Start/Home: Ein einzelner Klick/Tap auf `Start` muss den Home-/Start-Content tatsächlich rendern; Active-State, View-State und Route müssen konsistent bleiben.
- [ ] Settings Save: Nach erfolgreichem Speichern muss das gemeinsame `Successfully saved.`-Popup im realen Browser erscheinen und bis zur Benutzeraktion sichtbar bleiben.
- [ ] Passwort-Auge: Ein einzelner normaler Klick/Tap muss `password ↔ text` toggeln; kein Doppelklick und keine gerätespezifische Sonderlösung.

## Grenzen

- Keine Modularchitektur-, Profile-, Moderation-, Access- oder Admin-Reparaturen in diesen Block mischen.
- Root Cause vor Reparatur belegen.
- Vor Änderungen passende Failing-Tests ergänzen oder vorhandene reproduzierbare Tests nachweisen.
- Danach fokussierte Tests, Vollsuite, Syntax/Lint/Build/Package, `git diff --check`, Deployment und read-only Production Smoke.
- Anschließend gezielter Operator-Live-Retest genau dieser drei Punkte.
- Erst nach deren Abschluss folgt der separate Modularchitektur-Audit.

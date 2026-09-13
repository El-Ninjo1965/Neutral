# CURRENT TASK – USER UI LIVE REPAIR

**Status:** TECHNISCH REPARIERT · OPERATOR-LIVE-RETEST OFFEN
**Datum:** 2026-09-13  
**Core Freeze:** NICHT erklärt

Bearbeite ausschließlich die drei im Operator-Live-Retest reproduzierten User-UI-Fehler:

- [x] Start/Home technisch: Ein einzelner Klick/Tap invalidiert den Landing-Rendercache und rendert den Home-/Start-Content; Active-State, View-State und Route bleiben konsistent.
- [x] Settings Save technisch: Das gemeinsame `Successfully saved.`-Popup wird unmittelbar nach erfolgreicher Persistenz vor dem nicht notwendigen Rerender geöffnet und bleibt bis zur Benutzeraktion sichtbar.
- [x] Passwort-Auge technisch: Das statische Login-Auge verwendet ausschließlich den gemeinsamen Single-Click-Bindingpfad; kein zweiter konkurrierender Click-Handler.
- [ ] Gezielter Operator-Live-Retest aller drei Punkte auf dem realen Browser/Endgerät.

## Grenzen

- Keine Modularchitektur-, Profile-, Moderation-, Access- oder Admin-Reparaturen in diesen Block mischen.
- Root Cause vor Reparatur belegen.
- Vor Änderungen passende Failing-Tests ergänzen oder vorhandene reproduzierbare Tests nachweisen.
- Danach fokussierte Tests, Vollsuite, Syntax/Lint/Build/Package, `git diff --check`, Deployment und read-only Production Smoke.
- Anschließend gezielter Operator-Live-Retest genau dieser drei Punkte.
- Erst nach deren Abschluss folgt der separate Modularchitektur-Audit.

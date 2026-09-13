# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Codex → Lea/ChatGPT  
**Branch:** `main`  
**Datum:** 2026-09-14  
**Status:** START/HOME LIVE BESTÄTIGT · 2 USER-UI-LIVE-FEHLER OFFEN  
**Letzter verifiziert deployter Code-Stand:** `e930c2ad045e6dbc275a9d776e6b56504ba13490`  
**Core Freeze:** NICHT erklärt

## Verifizierter Live-Stand nach PR #66

PR #66 wurde gemergt. CodeQL und FTPS-Deploy einschließlich Production-Smoke waren erfolgreich.

Der anschließende Operator-Live-Retest auf dem realen Browser/Endgerät ergab:

- **Start/Home:** funktioniert jetzt. Start/Home gilt live als bestätigt.
- **Settings Save Success:** Speichern funktioniert weiterhin, aber es erscheint **kein sichtbares `Successfully saved.`-Popup**.
- **Passwort-Auge:** Auge ist sichtbar, aber Tap/Klick zeigt das Passwort weiterhin **nicht** an.

Damit sind die beiden zuletzt genannten Punkte trotz zuvor grüner automatisierter Tests **nicht live repariert**. Die bisherigen Tests/Harnesses bilden den real ausgelieferten Browserpfad für diese beiden Funktionen nicht ausreichend ab.

## Nächster technischer Arbeitsblock

Ausschließlich:

1. tatsächlichen Runtime-/DOM-/Event-Pfad des Settings-Save-Popups im ausgelieferten Production-Package nachweisen und korrigieren;
2. tatsächlichen Runtime-/DOM-/Event-Pfad des sichtbaren Login-Passwortauges und des echten Passwortfeldes nachweisen und korrigieren.

Root Cause vor Änderung. Keine erneute Arbeit an Start/Home ohne nachgewiesene Regression. Keine Modularchitektur-/Profile-/Moderation-/Access-/Admin-Arbeit in diesen Block mischen.

## Verbindlicher Abschluss

Nach technischer Reparatur, Tests, PR, CI/CodeQL, Merge, FTPS-Deploy und Production-Smoke bleibt ein gezielter Operator-Live-Retest erforderlich:

- Settings Save → sichtbares `Successfully saved.` bis Benutzeraktion;
- Passwort-Auge → ein einzelner Tap/Klick toggelt das sichtbare echte Passwortfeld `password ↔ text`.

Erst wenn beide Punkte live bestätigt sind, ist der User-UI-Reparaturblock abgeschlossen. Danach folgt separat der Modularchitektur-Audit.

# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Codex → ChatGPT/Lea  
**Status:** OPERATOR RETEST / AKTUELLER REPARATURAUFTRAG OFFEN  
**Core Freeze:** NICHT erklärt

## Letzter bestätigter technischer Stand

- GitHub-/Repository-/Deploymentkette ist grundsätzlich funktionsfähig.
- Letzter dokumentierter Deploymentlauf absolvierte Tests, Production Package, FTPS-Upload und read-only Production Smoke erfolgreich.
- Lokale Tests, CI und Smoke ersetzen keinen realen Betreiber-Livetest.
- Kein Production Restore und keine destruktive Produktionsaktion als Test.

## Aktueller Betreiber-Livebefund

1. **User Login Eye:** live auf iPad/Chrome nicht sichtbar; Admin-Login-Eye funktioniert.
2. **Module Install:** Button reagiert, Backend antwortet mit `Install failed: Internal server error.`
3. **Admin Sidebar:** horizontal verschiebbar/„schwimmend“ auf iPad.
4. **Logout:** soll ausschließlich `Logout` anzeigen.

Der aktive Reparaturauftrag steht in `CODEX.md` und `CURRENT-TASK.md`.

## Verbindliche nächste Operator-Abnahme

Nach Abschluss und Deployment durch Codex in dieser Reihenfolge testen:

1. User Login Eye – iPad/Chrome normal + privat.
2. App/System Module Install/Activate/Deactivate/Re-activate.
3. Sidebar horizontal stabil.
4. Logout zeigt nur `Logout`.

Codex muss diese Datei nach seinem nächsten Arbeitslauf mit dem **tatsächlichen technischen Ergebnis**, CI-/Deploymentstatus und den weiterhin offenen Live-Tests ersetzen. Bis zur Betreiberbestätigung kein automatischer Core Freeze.
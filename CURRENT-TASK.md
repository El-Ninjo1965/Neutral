# CURRENT TASK – LIVE ROOT-CAUSE REPAIR

**Status:** AKTIV  
**Datum:** 2026-09-11  
**Quelle:** `CODEX.md`

Bearbeite ausschließlich diesen aktuellen Auftrag. Kein Core Freeze, kein Production Restore, keine neuen Features und keine unnötigen Refactorings.

## Arbeitspunkte

- [ ] **User Login Eye:** reale Live-Auslieferungs-/Cache-/Asset-Ursache belegen und minimal beheben. Genau ein Eye; Admin-Login und PWA/Offline nicht regressieren. Production read-only verifizieren.
- [ ] **Module Install 500:** konkrete Backend-/Lifecycle-/Migration-/DB-Ursache finden und generisch beheben. Retry-safe; kein falscher Registered-State; Lifecycle Install → Activate → Deactivate → Re-activate testen.
- [ ] **Admin Sidebar:** horizontales Verschieben/Overscroll auf iPad/schmalem Viewport beseitigen; vertikales Scrollen erhalten.
- [ ] **Logout:** ausschließlich `Logout` anzeigen; Funktion unverändert.
- [ ] Fokussierte Regressionstests ausführen.
- [ ] Vollständige Testsuite, JS-Syntax, PHP-Lint und `git diff --check` ausführen.
- [ ] Production Package, Service-Worker-/Asset-Upgrade und Modul-Lifecycle prüfen.
- [ ] Commit/Push nach `main`; erforderliche CI/CodeQL/FTPS bis terminal abwarten.
- [ ] Read-only Production Smoke prüfen.
- [ ] `CHATGPT.md` mit tatsächlichem Ergebnis und verbleibender Operator-Retestliste aktualisieren.

## Operator-Retest nach technischer Fertigstellung

1. User Login Eye – iPad/Chrome normal + privat.
2. App/System Module Install/Activate/Deactivate/Re-activate.
3. Sidebar horizontal stabil.
4. Logout zeigt nur `Logout`.

Bis zur realen Bestätigung bleiben diese Punkte **OPERATOR RETEST REQUIRED**.
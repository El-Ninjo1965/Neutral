# CURRENT TASK – LIVE ROOT-CAUSE REPAIR

**Status:** AKTIV  
**Datum:** 2026-09-11  
**Quelle:** `CODEX.md`

Bearbeite ausschließlich diesen aktuellen Auftrag. Kein Core Freeze, kein Production Restore, keine neuen Features und keine unnötigen Refactorings. Simple first.

## Arbeitspunkte

- [ ] **User Login Eye:** zuerst funktionierende Admin-Login-Lösung prüfen und denselben einfachen Mechanismus für den User-Login übernehmen, soweit technisch möglich. Genau ein Eye direkt am Passwortfeld; Klick `password ↔ text`; kein Server-/Backend-Sonderweg. Nur bei nachgewiesener technischer Notwendigkeit minimal abweichen. Danach lokal testen, deployen und Operator-Retest abwarten.
- [ ] **Module Install 500:** konkrete Backend-/Lifecycle-/Migration-/DB-Ursache finden und generisch beheben. Retry-safe; kein falscher Registered-State; Lifecycle Install → Activate → Deactivate → Re-activate testen.
- [ ] **Admin Sidebar:** horizontales Verschieben/Overscroll auf iPad/schmalem Viewport beseitigen; vertikales Scrollen erhalten.
- [ ] **Logout:** ausschließlich `Logout` anzeigen; Funktion unverändert.
- [ ] Fokussierte Regressionstests ausführen.
- [ ] Vollständige Testsuite, JS-Syntax, PHP-Lint und `git diff --check` ausführen.
- [ ] Production Package und Modul-Lifecycle prüfen.
- [ ] Commit/Push nach `main`; erforderliche CI/CodeQL/FTPS bis terminal abwarten.
- [ ] Read-only Production Smoke prüfen.
- [ ] `CHATGPT.md` mit tatsächlichem Ergebnis und verbleibender Operator-Retestliste aktualisieren.

## Operator-Retest nach technischer Fertigstellung

1. User Login Eye – iPad/Chrome normal + privat.
2. App/System Module Install/Activate/Deactivate/Re-activate.
3. Sidebar horizontal stabil.
4. Logout zeigt nur `Logout`.

Bis zur realen Bestätigung bleiben diese Punkte **OPERATOR RETEST REQUIRED**.
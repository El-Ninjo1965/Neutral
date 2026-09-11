# CURRENT TASK – OPERATOR REPAIR BATCH

**Status:** AKTIV
**Datum:** 2026-09-11
**Quelle:** `CODEX.md`

Kein Core Freeze, kein Production Restore, keine neuen Features außerhalb dieses Auftrags und keine unnötigen Refactorings.

## Arbeitspunkte

- [x] User Login: genau ein statisches Hold-to-reveal-Eye; `pointerdown` zeigt, `pointerup`/`pointercancel`/Verlassen verbirgt; Touch/Maus; keine Helper-/Observer-Kaskade und kein gleichzeitiger Fallback.
- [x] User Sessions: normale User-Session bleibt bis Logout/Revoke/Sicherheitsinvalidierung aktiv; Browserneustart überleben; Adminscope getrennt halten; Device-Limits erhalten; bestehende Sessions sicher migrieren.
- [x] Profile Settings: aktive und berechtigte Profile-Capability projizieren; Profile/Privacy ohne Cache-/Reload-Trick zeigen; inaktiv oder unberechtigt ausblenden; Lifecycle nicht ändern.
- [x] Organization Projection: aktive Lizenzmitgliedschaft als `organizationName` in der User-Liste liefern; Package getrennt; `—` ohne Organisation; Sortierung erhalten.
- [x] Licenses: List/Create/Edit als exklusive, routing-/back-stabile Viewstates; kein Inlineformular; Save/Cancel zurück zur Liste und Contentanfang.
- [x] Packages: List/Create/Edit als exklusive, routing-/back-stabile Viewstates; kein Inlineformular; Save/Cancel zurück zur Liste und Contentanfang.
- [x] Edit User: User ID und Username oben eindeutig read-only; Display Name/E-Mail danach editierbar.
- [x] Bereits live bestandene Lifecycle-/Sidebar-/Logout-/GPS-/Adminpunkte regressionsfrei erhalten.
- [x] Verhaltensnahe fokussierte Tests für alle obigen Verträge ausführen.
- [x] Vollständige Suite, JS-Syntax, PHP-Lint, responsive Prüfung und `git diff --check` ausführen.
- [x] Production Package bauen und prüfen.
- [x] Betroffene Dokumentation synchronisieren; `CHANGELOG.md` nur append-only ergänzen.
- [x] Commit/Push nach `main`; CodeQL/FTPS/read-only Production Smoke terminal abwarten.
- [x] `CHATGPT.md` mit tatsächlichem Commit, CI-/Deploymentstatus und genau einer Operator-Retestliste abschließen.

## Operator-Retest nach technischer Fertigstellung

1. User Login Hold-to-reveal – iPad/Chrome normal + privat.
2. User eingeloggt lassen; Browser/App neu öffnen und später erneut prüfen.
3. Profile aktiv + berechtigt: Profile/Privacy sichtbar und benutzbar.
4. User Management: Tester zeigt `Organization = Verein Bonn`.
5. Licenses: List → New/Edit als separate Views.
6. Packages: List → New/Edit als separate Views.
7. Edit User: User ID + Username eindeutig read-only.
8. Regression der bereits bestandenen Lifecycle-/GPS-/Adminpunkte.

Bis zur realen Betreiberbestätigung **OPERATOR RETEST REQUIRED**. Kein automatischer Core Freeze.

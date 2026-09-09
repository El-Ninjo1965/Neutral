# CURRENT TASK — P0 Produktionsauthentifizierung

**Quelle:** `CODEX.md`, 2026-09-09
**Status:** IN ARBEIT · DEVICE RETEST REQUIRED
**Scope:** Ausschließlich User-/Admin-Login; keine GPS-, License-, Media-, Appearance-, i18n- oder Core-Freeze-Featurearbeit.

1. [x] Mit `origin/main` synchronisieren und Pflichtdokumente sowie Auth-/Bootstrap-/Router-/Client-/Rewrite-/Deploymentpfade vollständig lesen.
2. [x] Auftrag vollständig erfasst und geprüft: **`CODEX.md == CURRENT-TASK-Anforderungen` bestanden.**
3. [x] Beide Erzeugungspfade des generischen 503 sowie gemeinsame/separate User-/Admin-Flows rückwärts verfolgen.
4. [x] Konkrete verborgene Produktionsursache identifizieren: zweistufig klassifiziert: Request-time-DDL im Throttle-Store entfernt; danach produktiv `AUTH_USER_LOOKUP_UNAVAILABLE` belegt und native PDO-MySQL-Exception `HY093` durch doppelt verwendeten `:username`-Placeholder identifiziert.
5. [x] Test-first sicherstellen, dass Login-Throttle-Reads kein DDL ausführen; Schema ausschließlich über checksummed Migrationen bereitstellen.
6. [x] Authfehler sicher nach Throttle, Userlookup, Permissionauflösung und kritischer Sessionpersistenz klassifizieren; nur Code + zufällige Correlation-ID, keine Secrets/SQL/PII.
7. [x] Erfolgreiche Authentifizierung von nichtkritischem Throttle-Cleanup entkoppeln; Device-Limit bleibt spezifischer 409.
8. [x] Echte User-/Admin-Routerintegration, falsche Credentials 401, aktuelle/Legacy-Hashes, getrennte Scopes, CSRF, Sessionpersistenz und Deduplizierung vollständig prüfen.
9. [x] Produktionspaket, PHP-Lint, JS-Syntax, vollständige Regression, `git diff --check` und Secret-/Artefaktcheck ausführen.
10. [ ] Commit/push `main`, CodeQL/FTPS terminal abwarten, Revision/Readiness und produktiven Dummy-Auth-Smoke User+Admin mit 401 verifizieren.
11. [ ] `CHATGPT.md` mit Root Cause, Exception/Klasse, Fix, CI-/Smoke-Evidenz und ausschließlich zwei Betreiber-Retestpunkten aktualisieren; GitHub-main-Version verifizieren.
12. [ ] `HEAD == origin/main`, sauberer Working Tree; reale Logins bleiben bis Betreiberbestätigung `DEVICE RETEST REQUIRED`.

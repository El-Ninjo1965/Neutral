# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Codex → ChatGPT/Lea
**Status:** AUTH-/SESSION-RECOVERY IMPLEMENTIERT / DEPLOYMENT PENDING
**Core Freeze:** NICHT erklärt

## Root Cause und Reparatur

Die getrennten Browsercookies waren nicht durchgehend als getrennte serverseitige Session-Scopes modelliert. `replaceActiveInstallation()` ersetzte bei einem User- oder Admin-Login auch die Session des jeweils anderen Scopes für dasselbe Konto/Gerät. Zusätzlich hing `/auth/me` ausschließlich an der vergänglichen PHP-Sessiondatei, obwohl die weiterhin gültige Session bereits in der Datenbank registriert war. Hostseitige PHP-Session-GC führte daher trotz gültigem Cookie und DB-Eintrag zu `Not authenticated`.

Die Datenbank-Session besitzt nun einen dauerhaften `session_scope`. Validierung, Recovery und Installation-Replacement verlangen denselben Scope; User-Device-Limits zählen nur User-Sessions. Fehlt lediglich die PHP-Sessiondatei, wird die Identität samt CSRF-Kontext aus der gültigen DB-Session rekonstruiert. Öffentliche/anonyme Requests bleiben bei nicht verfügbarem Recovery-Storage unabhängig erreichbar. User- und Admin-Login können sich nicht mehr gegenseitig invalidieren.

Das User-Eye verwendete die falsche Wrapperklasse und erhielt deshalb die vorhandene absolute Control-Positionierung nicht. Es nutzt nun lokal den bereits definierten `password-input-wrap`; Hold-/Release-Logik bleibt unverändert.

## Technische Verifikation

Fokussierte Auth-/Scope-/Recovery-, PHP-Entry-, Read-only-Smoke- und Eye-Tests sind erfolgreich. Vollsuite, Package, Commit, CI und Produktionsdeployment werden unten erst nach terminalem Abschluss als Ergebnis eingetragen.

## Priorisierter Operator-Retest nach Deployment

1. User Login funktioniert normal und Inkognito.
2. Admin Login funktioniert; Licenses, Packages, Sessions, Roles, Permission Catalog, App Modules und System Modules laden ohne `Not authenticated`.
3. User Eye sitzt im Passwortfeld; Hold-to-reveal funktioniert.

Erst nach Betreiber-PASS dieser drei Blocker werden die zurückgestellten Featuretests fortgesetzt. Kein Core Freeze.

# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Codex → ChatGPT/Lea
**Status:** AUTH-/SESSION-RECOVERY DEPLOYED / OPERATOR RETEST REQUIRED
**Core Freeze:** NICHT erklärt

## Root Cause und Reparatur

Die getrennten Browsercookies waren nicht durchgehend als getrennte serverseitige Session-Scopes modelliert. `replaceActiveInstallation()` ersetzte bei einem User- oder Admin-Login auch die Session des jeweils anderen Scopes für dasselbe Konto/Gerät. Zusätzlich hing `/auth/me` ausschließlich an der vergänglichen PHP-Sessiondatei, obwohl die weiterhin gültige Session bereits in der Datenbank registriert war. Hostseitige PHP-Session-GC führte daher trotz gültigem Cookie und DB-Eintrag zu `Not authenticated`.

Die Datenbank-Session besitzt nun einen dauerhaften `session_scope`. Validierung, Recovery und Installation-Replacement verlangen denselben Scope; User-Device-Limits zählen nur User-Sessions. Fehlt lediglich die PHP-Sessiondatei, wird die Identität samt CSRF-Kontext aus der gültigen DB-Session rekonstruiert. Öffentliche/anonyme Requests bleiben bei nicht verfügbarem Recovery-Storage unabhängig erreichbar. User- und Admin-Login können sich nicht mehr gegenseitig invalidieren.

Das User-Eye verwendete die falsche Wrapperklasse und erhielt deshalb die vorhandene absolute Control-Positionierung nicht. Es nutzt nun lokal den bereits definierten `password-input-wrap`; Hold-/Release-Logik bleibt unverändert.

## Technische Verifikation

Fokussierte Auth-/Scope-/Recovery-, PHP-Entry-, Read-only-Smoke- und Eye-Tests sind erfolgreich. Lokal bestanden 539/539 Tests, PHP-/JavaScript-Syntax, Diff-Check und das Production Package mit 135 Dateien.

Der erste Deploymentlauf `34587606641` lud erfolgreich hoch, scheiterte aber ausschließlich an einer neu hinzugefügten Smoke-Annahme: PHP setzt bereits beim anonymen Sessionstart einen nicht authentifizierten Session-Cookie. Das ist kein erfolgreicher Login. Die zu strenge Cookie-Annahme wurde entfernt; die getrennten `/auth/me`-401-Grenzen bleiben als sichere credentialfreie Prüfung erhalten.

Recovery-Commit `8366d37eb33b39c0bb9e248ff2d6256faeb278c3` und begrenzte Smoke-Korrektur `7c18f22ed7c6b9543a893dffd08edbc3655426d8` sind auf `main`. CodeQL `34588007633` und FTPS Deploy `34588007680` waren terminal erfolgreich. Tests, 135-Datei-Paket, FTPS-Client, Upload von 137 Dateien und read-only Production Smoke bestanden; `migrationsReady:true`, Deploymentrevision korrekt sowie User-/Admin-Invalid-Login und unauthentifizierte `/auth/me` jeweils sicher 401.

## Priorisierter Operator-Retest nach Deployment

1. User Login funktioniert normal und Inkognito.
2. Admin Login funktioniert; Licenses, Packages, Sessions, Roles, Permission Catalog, App Modules und System Modules laden ohne `Not authenticated`.
3. User Eye sitzt im Passwortfeld; Hold-to-reveal funktioniert.

Erst nach Betreiber-PASS dieser drei Blocker werden die zurückgestellten Featuretests fortgesetzt. Kein Core Freeze.

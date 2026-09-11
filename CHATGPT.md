# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Codex → ChatGPT/Lea
**Status:** USER-LOGIN SICHTBARES PASSWORT DEPLOYED / OPERATOR RETEST REQUIRED
**Core Freeze:** NICHT erklärt

## Ergebnis

Der Betreiberentscheid aus `CODEX.md` ist minimal umgesetzt: Das User-Login-Passwortfeld ist dauerhaft `type="text"`. Eye-Markup, Hold-Bindelogik, das ausschließlich dafür benötigte `password-hold-reveal.js` sowie dessen Shell-/Service-Worker-Referenzen wurden aus dem User-Pfad entfernt. Der Login-Submit-Flow blieb unverändert. Admin-Login, globale Admin-Passworthelfer sowie Auth-/Sessioncode wurden nicht angefasst.

Wichtig zur Einordnung: `type="password"` verschlüsselt das Passwort nicht, sondern maskiert nur die Darstellung im Browser. `type="text"` verändert weder Passwort-Hashing noch Transportverschlüsselung oder Serverauthentifizierung; es macht lediglich die Eingabe sichtbar.

Lokal bestanden 539/539 Tests, JavaScript-Syntax, PHP-Lint, Diff-Check und das Production Package mit 134 Dateien. Ein Verhaltenstest führt den echten User-Login-Submit aus und bestätigt, dass Username und Passwort an den API-Client gehen und der erfolgreiche Renderpfad erreicht wird. Weitere Tests bestätigen genau ein sichtbares Eingabefeld und kein User-Eye/Reveal-Binding.

Commit `c17dbef013f8983e84d5faea0bc87a9dc7ab2f91` ist auf `main`. CodeQL `34597276656` und FTPS Deploy `34597276742` waren terminal erfolgreich. Tests, 134-Datei-Produktionspaket, FTPS-Client, Upload von 136 Dateien und read-only Production Smoke bestanden; Deploymentrevision und `migrationsReady:true` wurden bestätigt.

## Operator-Retest nach Deployment

1. User Login normal funktioniert.
2. User Login Inkognito funktioniert.
3. Passwort ist während der Eingabe dauerhaft sichtbar.
4. Kein Eye wird angezeigt.

Danach ist das User-Eye-Thema beendet. Kein Core Freeze.

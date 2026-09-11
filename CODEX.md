# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** USER-LOGIN PASSWORD SICHTBAR – KEIN CORE FREEZE  
**Datum:** 2026-09-11

# Neuer Betreiberentscheid

Der User-Login funktioniert operator-live wieder.

Der Eye-/Hold-to-reveal-Mechanismus funktioniert trotz mehrerer Reparaturversuche weiterhin nicht zuverlässig. Dieser Punkt wird **nicht weiter verfolgt**.

Verbindliche Produktentscheidung:

- User-Login-Passwortfeld wird dauerhaft sichtbar angezeigt.
- Kein Eye mehr.
- Kein Hold-to-reveal mehr.
- Kein `password-hold-reveal.js` im User-Loginpfad notwendig.
- Login-Funktion hat Vorrang vor Passwortmaskierung.
- Admin-Login bleibt unverändert.

Das ist bewusst ein pragmatischer UX-Fallback für die Entwicklungs-/App-Umgebung.

---

# 1. User Login vereinfachen

Im User-Login:

- Passwortfeld von `type="password"` auf `type="text"` ändern.
- Eye-Button vollständig aus dem User-Login-Markup entfernen.
- zugehörige User-Login-Bindelogik für `NeutralPasswordHoldReveal` entfernen.
- keine Ersatz-Toggle-Logik bauen.
- keine globalen Password-Helper anfassen, wenn sie noch für Admin oder andere Bereiche benötigt werden.
- Login-Submit-Flow unverändert lassen.

Wichtig:

- User Login muss weiter normal und Inkognito funktionieren.
- Admin Login darf nicht regressieren.
- Auth-/Sessioncode nicht ändern.
- Keine weiteren offenen Admin-/UX-Themen anfassen.

---

# 2. Tests

Mindestens:

1. User Login rendert genau ein Passwort-Eingabefeld mit `type="text"`.
2. User Login enthält keinen Eye-Button mehr.
3. User Login ruft `NeutralPasswordHoldReveal` nicht mehr auf.
4. User Login Submit bleibt funktionsfähig.
5. normaler User Login funktioniert im bestehenden Integrationstest weiterhin.
6. Admin Login Regressionstest bleibt grün.
7. vollständige Testsuite.
8. JavaScript-Syntax.
9. PHP-Lint.
10. `git diff --check`.
11. Production Package bauen.

Bestehende Tests, die ausdrücklich Eye/Hold-to-reveal für den User-Login verlangen, auf den neuen verbindlichen Produktvertrag anpassen oder entfernen. Admin-bezogene Passwortsichtbarkeit nicht unnötig verändern.

---

# 3. Deployment

1. Minimalfix implementieren.
2. fokussierte Tests.
3. vollständige Suite.
4. Production Package.
5. Commit/Push nach `main`.
6. CodeQL und FTPS terminal abwarten.
7. read-only Production Smoke prüfen.
8. `CHATGPT.md`, `CURRENT-TASK.md`, `UI-UX.md` und weitere wirklich betroffene MD-Dateien wahrheitsgemäß aktualisieren.

Kein Production Restore.
Keine Secrets ausgeben.
Kein Core Freeze.

---

# Operator-Retest danach

Nur:

1. User Login normal funktioniert.
2. User Login Inkognito funktioniert.
3. Passwort ist während der Eingabe dauerhaft sichtbar.
4. Kein Eye wird mehr angezeigt.

Danach gilt das Eye-Thema als beendet.
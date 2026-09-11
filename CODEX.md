# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** USER-LOGIN BRANCH VERIFY / MERGE – KEIN CORE FREEZE  
**Datum:** 2026-09-11

# Ausgangslage

Der User-Login funktioniert operator-live weiterhin nicht. Admin-Login ist wieder erreichbar.

Lea/ChatGPT hat deshalb selbst einen isolierten Fix vorbereitet auf:

`chatgpt/user-login-fix`

Der Branch basiert auf dem aktuellen `main` und enthält ausschließlich:

- `Web-App/public/index.html`
- `tests/user-login-bootstrap-fallback.test.js`

## Hypothese / vermutete Root Cause

Im User-Login wird vor dem eigentlichen Submit-Handler direkt

`window.NeutralPasswordHoldReveal.bind(password, reveal)`

aufgerufen.

Wenn `password-hold-reveal.js` live fehlt, verzögert/aus Cache falsch geliefert wird oder `window.NeutralPasswordHoldReveal` aus irgendeinem Grund nicht initialisiert ist, entsteht dort ein JavaScript-Abbruch. Dann werden die danach folgenden Login-Bindings – insbesondere der `submit`-Handler – gar nicht mehr registriert.

Das passt exakt zum Livebefund:

- Eye sichtbar/teilweise vorhanden, aber ohne Funktion;
- Login-Button wirkt komplett ohne Funktion;
- Admin-Login funktioniert separat wieder.

Der vorbereitete Branch ergänzt deshalb einen kleinen lokalen Bootstrap-Fallback, damit `NeutralPasswordHoldReveal.bind(...)` im User-Pfad nicht mehr den gesamten Login initialisieren kann, falls der Helper nicht verfügbar ist.

WICHTIG: Diese Hypothese ist noch **nicht als live bewiesen**. Der Codex-Agent muss sie technisch verifizieren und darf den Branch nicht blind mergen.

---

# 1. Branch zuerst prüfen

1. Repository `/workspace/Neutral`, Branch `main`, `origin/main`, sauberen Working Tree prüfen.
2. Branch `chatgpt/user-login-fix` holen/prüfen.
3. Diff `main...chatgpt/user-login-fix` vollständig lesen.
4. Sicherstellen, dass tatsächlich nur die oben genannten zwei Dateien geändert wurden.
5. Keine anderen offenen Admin-/UX-Themen anfassen.

---

# 2. Root-Cause-Hypothese technisch prüfen

Verifiziere konkret:

- Wird `password-hold-reveal.js` vor `user-app.js` geladen?
- Kann `window.NeutralPasswordHoldReveal` trotzdem im realen Browserpfad fehlen oder noch nicht existieren?
- Wird `window.NeutralPasswordHoldReveal.bind(...)` im Login-Renderpfad ausgeführt, bevor der `userLoginForm`-Submit-Handler gebunden wird?
- Würde ein Fehler an genau dieser Stelle die restliche Login-Bindung abbrechen?
- Passt das zum beobachteten Liveverhalten „Eye tot + Login tot“?

Wenn **ja**, Hypothese als Root Cause bestätigen.

Wenn **nein**, den Branch nicht blind übernehmen. Dann die tatsächliche Ursache anhand des echten User-Login-Pfades finden und nur den kleinsten notwendigen Fix vornehmen.

---

# 3. Branch-Fix kritisch bewerten

Prüfe den vorbereiteten Fallback in `Web-App/public/index.html`:

- syntaktisch korrekt;
- läuft vor `user-app.js`;
- greift nur, wenn `window.NeutralPasswordHoldReveal` nicht bereits vorhanden ist;
- kollidiert nicht mit dem regulären `password-hold-reveal.js`;
- verändert Admin nicht;
- erzeugt keine zweite konkurrierende Eye-Implementierung;
- verhindert zuverlässig, dass ein fehlender Helper den User-Login-Submit-Handler blockiert.

Keine neue allgemeine Auth-/UI-Abstraktion bauen.

---

# 4. TDD / Verifikation

Zuerst den neuen fokussierten Regressionstest ausführen:

`tests/user-login-bootstrap-fallback.test.js`

Danach relevante Tests für:

- User Login;
- Eye / Password Hold Reveal;
- Frontend Binding;
- Auth / User Session;
- Admin Login Regression.

Danach:

- vollständige Testsuite;
- JavaScript Syntax;
- PHP Lint;
- `git diff --check`;
- Production Package bauen.

Tests dürfen nicht nur Strings zählen. Der neue Regressionstest muss das tatsächliche Bootstrap-Verhalten sinnvoll abdecken.

---

# 5. Merge-/Fix-Entscheidung

## Falls Branch-Fix korrekt und Tests grün

- nur die notwendigen Änderungen nach `main` übernehmen;
- keine Zusatzrefactorings;
- keine anderen Baustellen;
- Commit/Push nach `main`;
- CodeQL und FTPS bis terminal abwarten;
- read-only Production Smoke prüfen.

## Falls Branch-Fix nicht korrekt

- nicht mergen;
- konkrete Gegen-Evidenz dokumentieren;
- kleinsten nötigen Fix auf Basis der tatsächlich gefundenen Root Cause vornehmen;
- erneut fokussiert + vollständig testen;
- erst dann nach `main` übernehmen.

---

# 6. Dokumentation

Nur tatsächlich notwendige Dateien aktualisieren, insbesondere:

- `CHATGPT.md`
- `CURRENT-TASK.md`

Weitere MD-Dateien nur wenn der tatsächliche technische Vertrag verändert wurde.

Kein Core Freeze.
Kein Production Restore.
Keine Secrets ausgeben.

---

# Abschlussbericht

Kurz und konkret berichten:

- Root Cause bestätigt: ja/nein
- Branch-Fix unverändert übernommen oder angepasst
- betroffene Dateien
- fokussierte Tests
- vollständige Testsuite
- Production Package
- Commit auf `main`
- CodeQL Status
- FTPS Status
- Production Smoke
- verbleibender Operator-Retest

# Nächster Operator-Retest

Ausschließlich:

1. User Login normal.
2. User Login Inkognito.
3. Eye Hold-to-reveal.

Admin nur regressionsfrei halten.
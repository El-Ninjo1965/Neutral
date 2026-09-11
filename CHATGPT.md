# NEUTRAL – CHATGPT HANDOFF

**Richtung:** Codex → ChatGPT/Lea
**Status:** USER-LOGIN BOOTSTRAP-FIX IMPLEMENTIERT / DEPLOYMENT PENDING
**Core Freeze:** NICHT erklärt

## Ergebnis

Root-Cause-Hypothese technisch bestätigt: `password-hold-reveal.js` ist im regulären HTML zwar als `defer` vor `user-app.js` angeordnet, aber ein fehlendes/fehlerhaft ausgeliefertes Helper-Asset lässt `window.NeutralPasswordHoldReveal.bind(...)` werfen. Dieser Aufruf lag vor der Registrierung des Login-Submit-Handlers; Eye und Login waren danach beide tot.

Der vorbereitete Branch `chatgpt/user-login-fix` änderte exakt die angekündigten zwei Dateien. Sein Inline-Fallback hätte den Abbruch verhindert, duplizierte aber die komplette Hold-Implementierung im HTML. Er wurde deshalb nicht unverändert übernommen. Stattdessen behandelt der bestehende User-Login den Eye-Helper als optionale Abhängigkeit: vorhanden → genau einmal binden; nicht vorhanden → Eye ausblenden und anschließend immer den echten Submit-Handler registrieren. Regulärer Helper, Admin-Login, Auth-/Sessioncode und Backend bleiben unverändert.

Lokal bestanden 541/541 Tests sowie JavaScript-Syntax, PHP-Lint, Diff-Check und das Production Package mit 135 Dateien. Der neue Verhaltenstest führt den tatsächlichen `showLoginForm`-Bootstrap einmal ohne und einmal mit Helper aus. Ohne Helper bleibt der Submit-Listener gebunden; mit Helper erfolgt genau ein Bind und das Eye bleibt sichtbar.

## Operator-Retest nach Deployment

1. User Login normal.
2. User Login Inkognito.
3. Eye Hold-to-reveal.

Kein Core Freeze.

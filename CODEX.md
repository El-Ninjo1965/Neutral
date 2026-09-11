# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** USER-LOGIN BLOCKER – KEIN CORE FREEZE  
**Datum:** 2026-09-11

# Aktueller Livebefund

Nach dem letzten Auth-/Session-Recovery-Deployment:

- **Admin Login funktioniert wieder.** Adminbereich kann wieder betreten werden und die zuvor globalen `Not authenticated`-Fehler sind damit aktuell kein Hauptblocker mehr.
- **User Login funktioniert weiterhin nicht.** Auf iPad/Chrome normal und Inkognito können Username/Passwort eingegeben werden, aber `Login` führt nicht zu einer gültigen Anmeldung.
- **User Eye ist weiterhin ohne Funktion.** Es ist vorhanden, aber Hold-to-reveal funktioniert live nicht zuverlässig.

Dieser Auftrag bearbeitet **nur User Login + User Eye**. Andere Admin-/UX-Punkte bewusst nicht anfassen, außer eine direkte technische Abhängigkeit ist nachgewiesen.

---

# 1. User Login – echte Live-Root-Cause finden

## Ziel

Ein normaler User muss sich auf der ausgelieferten User-App zuverlässig einloggen können.

## Prüfkette

End-to-end, im realen User-Pfad:

1. Wird das Loginformular tatsächlich submitted?
2. Wird der Click/Submit durch Eye-/Pointer-/Form-Handling verhindert?
3. Wird der Request an `/api/v1/auth/login` wirklich gesendet?
4. Welche Response kommt tatsächlich zurück?
5. Wird der User-Cookie korrekt gesetzt?
6. Wird die DB-Session mit `session_scope=user` korrekt erzeugt?
7. Funktioniert direkt danach `/api/v1/auth/me` mit demselben Cookie?
8. Wird der Clientzustand nach erfolgreichem Login auf authenticated gesetzt?
9. Wird die Loginansicht anschließend sicher verlassen/neu gerendert?
10. Verhindert Service Worker / Cache / alte Assetversion tatsächlich etwas? Nur prüfen, wenn durch Netzwerk-/Asset-Evidence begründet.

## Wichtig

- Admin-Login **nicht regressieren**.
- User-/Admin-Scope-Trennung aus dem letzten Recovery-Batch erhalten.
- Nicht wieder den gesamten Auth-Stack umbauen.
- Kleinsten bewiesenen Fix implementieren.
- Wenn der Fehler rein frontendseitig ist, Backend nicht unnötig ändern.
- Wenn der Backend-Request korrekt ist, den tatsächlichen Client-Post-Login-Fehler beheben.

---

# 2. User Eye – maximal simple Lösung

Der Eye-Mechanismus darf den User-Login **unter keinen Umständen blockieren**.

## Bevorzugte Variante

- Eye bleibt lokal direkt im Passwortfeld.
- `pointerdown` → Passwort sichtbar.
- `pointerup` / `pointercancel` / Pointerverlust → Passwort wieder verborgen.
- Der Eye-Button muss `type="button"` sein.
- Keine Submit-/Form-Interaktion darf dadurch ausgelöst oder verhindert werden.
- Kein globales Delegationssystem, kein MutationObserver, keine mehrfachen Listener.

## Harte Fallback-Regel

Wenn der Hold-to-reveal-Mechanismus nach einer **einmaligen** gezielten Korrektur im realen User-Pfad nicht zuverlässig funktioniert:

- Eye vollständig entfernen.
- User-Passwortfeld vorübergehend als `type="text"` rendern.
- Loginfunktion hat Vorrang vor Passwortmaskierung.
- Dokumentieren, dass dies bewusster temporärer UX-Fallback ist.

Keine weitere Endlosschleife um das Eye.

---

# 3. Tests – diesmal verhaltensnah

Mindestens:

1. DOM-naher User Login Submit mit ausgefülltem Username/Password.
2. Sicherstellen, dass Eye-Button keinen Submit blockiert und selbst kein Submit auslöst.
3. Request an Login-Endpoint wird ausgelöst.
4. Erfolgreiche Login-Response → Cookie/Session vorhanden.
5. Direktes `/auth/me` danach → authentifiziert.
6. Client wechselt aus Loginansicht in eingeloggten Zustand.
7. Inkognito-/frischer Storage-Pfad soweit testbar.
8. Eye Hold/Release nur wenn Eye beibehalten wird.
9. Admin Login Regressionstest.
10. Vollsuite, PHP-Lint, JS-Syntax, `git diff --check`.

Tests dürfen nicht nur Quelltextmuster bestätigen.

---

# 4. Deployment

1. Root Cause dokumentieren.
2. Minimalfix implementieren.
3. fokussierte Tests.
4. komplette Suite.
5. Production Package.
6. Commit/Push `main`.
7. CodeQL/FTPS terminal abwarten.
8. read-only Smoke prüfen.
9. `CHATGPT.md` und `CURRENT-TASK.md` nur mit tatsächlichem Ergebnis aktualisieren.

---

# Operator-Retest danach

Nur zwei Punkte:

1. **User Login** normal + Inkognito: Username/Passwort → Login → tatsächlich eingeloggt.
2. **User Eye**: Hold-to-reveal funktioniert; falls Fallback eingesetzt wurde, Passwortfeld bewusst sichtbar und Login funktioniert.

Adminbereich gilt aktuell als wieder erreichbar und wird in diesem Batch nur regressionsfrei gehalten.

Kein Core Freeze.
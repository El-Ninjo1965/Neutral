# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER OPERATOR-REPAIR-BATCH – KEIN CORE FREEZE  
**Datum:** 2026-09-11

## Vor Arbeitsbeginn

1. Repository `/workspace/Neutral`, Branch `main`, `origin/main` und sauberen Working Tree prüfen.
2. `WORKFLOW.md`, `CURRENT-TASK.md`, `CHATGPT.md`, `VISION.md`, `CORE-1.0.md`, `USER-ACCOUNT-LICENSE-MODEL.md`, `UI-UX.md`, `ADMIN-UX-DECISIONS.md` sowie die für diesen Auftrag relevanten Codepfade vollständig lesen.
3. Diesen Auftrag gegen den tatsächlichen Live-/Code-Stand prüfen. Bereits live bestätigte Reparaturen nicht unnötig wieder anfassen.
4. Simple first: kleinste robuste Lösung bevorzugen. Keine unnötigen neuen Abstraktionen.
5. Keine Secrets ausgeben, kein Production Restore, keine neuen Features außerhalb dieses Auftrags, kein automatischer Core Freeze.

---

# 1. User Login Password Visibility – letzter robuster Ansatz

## Livebefund

- Admin-Login-Eye funktioniert.
- User-Login-Eye fehlt weiterhin vollständig auf Betreiber-iPad/Chrome, obwohl mehrere Helper-/Delegation-/Enhancer-Ansätze lokal getestet wurden.
- Ziel ist nicht länger, komplexe Toggle-Architektur zu retten, sondern eine robuste mobile Kontrolle der Eingabe zu ermöglichen.

## Verbindliche UX-Entscheidung

Bevorzugte Lösung für **User Login**:

- Passwort bleibt standardmäßig verborgen (`type=password`).
- Direkt am Passwortfeld genau ein Eye-Button.
- **Gedrückt halten** (`pointerdown`) → Passwort sichtbar (`type=text`).
- **Loslassen / Abbruch / Pointer verlässt Control** (`pointerup`, `pointercancel`, sinnvolles Fallback) → sofort wieder verborgen (`type=password`).
- Touch/iPad/Chrome muss primär funktionieren; Maus/Pointer ebenso.
- Kein Backend, keine Sessionlogik, kein dynamischer Serverweg dafür.
- Keine doppelte Listener-/MutationObserver-Kaskade bauen.

Wenn dieser einfache statische Hold-to-reveal-Mechanismus technisch im User-Login-Livepfad nachweislich weiterhin nicht zuverlässig gerendert oder ausgeführt werden kann, ist der akzeptierte **Fallback**: User-Login-Passwortfeld vorübergehend dauerhaft sichtbar (`type=text`) statt weitere komplexe Eye-Mechanismen zu bauen. Der Fallback ist nur zulässig, wenn die Ursache sauber dokumentiert wird.

Admin-Login nicht regressieren.

---

# 2. User Sessions dürfen nicht normal zeitlich verfallen

## Livebefund

Der Betreiber muss sich in der User-App wiederholt neu einloggen. Code verwendet derzeit `expires_at` und ein PHP-Session-Cookie mit endlicher Laufzeit.

## Produktentscheidung

Für normale User-Sessions gilt künftig:

- Session bleibt aktiv **bis expliziter Logout, manuelles Revoking oder sicherheitsrelevante Invalidierung**.
- Kein normales Idle-/Kalender-Ablaufdatum, das einen regelmäßigen neuen Login erzwingt.
- Browser-/App-Neustart darf bei bestehender gültiger Session keinen erneuten Login erzwingen.
- `last_seen_at` bleibt reine Aktivitätsinformation.
- Account-Deaktivierung, Passwort-/Security-Ereignis oder expliziter Admin-/Lizenzmanager-Revoke darf Sessions weiterhin beenden.
- Bestehende Device-Limits und Revocation-Verträge bleiben erhalten.
- Keine automatische Löschung aktiver Sessions durch allgemeine Cleanup-Logik.

Aufgabe:

- komplette User-Session-Kette prüfen: Login, DB `sessions`, `expires_at`, Cookie-Lifetime, Session-Validierung, Cleanup, User-App-Session-Refresh, Logout/Revoke.
- Admin- und User-Sessions nicht versehentlich vermischen; falls Admin aus Sicherheitsgründen einen anderen Vertrag braucht, getrennt behandeln und dokumentieren.
- Persistenz über Browser-Neustart testen.
- Bestehende aktive Sessions bei Migration möglichst sicher behandeln.

---

# 3. Profile Lifecycle ist live PASS – User Settings Projection bleibt FAIL

## Neuer Livebefund

Profile wurde operator-live erfolgreich durchlaufen:

- Uninstall → PASS
- Install → PASS
- Activate → PASS
- Deactivate → PASS
- erneute Aktivierung → PASS

Damit ist der frühere Profile-Install-/Migration-500 in diesem Pfad **behoben** und soll nicht erneut als Hauptursache behandelt werden.

Trotz aktivem Profile-Modul und vorhandenen User-Rechten `profile.view` und `profile.update` erscheint in der User-App unter Settings weiterhin **kein Profile-/Privacy-Bereich**.

## Auftrag

Root Cause ausschließlich in der Projection-/Capability-/Settings-Kette finden:

- aktive Modulregistry/Capability,
- aktuelle User-Rollen/Permissions,
- Session-/Identity-Payload,
- User Settings Endpoint/Projection,
- Frontend-Rendering/Tabs/Sections,
- Cache/Service Worker nur falls tatsächlich beteiligt.

Verbindlich:

- keine zusätzlichen künstlichen Permissions vergeben, wenn `profile.view`/`profile.update` bereits wirksam sind;
- Profile/Privacy nur zeigen, wenn Modul aktiv und Berechtigung vorhanden;
- wenn aktiv + berechtigt, muss es ohne Reload-/Cache-Trick sichtbar sein;
- Lifecycle nicht regressieren.

---

# 4. Organization Projection im User Management

## Livebefund

User `Tester` ist sichtbar einer Lizenz/Organisation zugeordnet:

- License #3
- Package `Verein`
- Edit User zeigt `License / Organization: Verein Bonn — Verein`

In der User-Management-Liste bleibt die separate Spalte **Organization** trotzdem `—`.

## Auftrag

- Backend-/Projection-Root-Cause finden, nicht UI hart verdrahten.
- `organizationName` muss aus der tatsächlich aktiven Lizenzmitgliedschaft zuverlässig in die User-Listenprojektion gelangen.
- Organization und Package bleiben getrennte Felder.
- Bei `Tester` muss in der Liste `Verein Bonn` erscheinen, wenn dieselbe Zuordnung im Editor bereits korrekt aufgelöst wird.
- Fälle ohne Organisation zeigen weiterhin `—`.
- Sortierung nach Organization muss weiter funktionieren.

---

# 5. Licenses/Organizations – Create/Edit wirklich separieren

## Livebefund

`New License` öffnet `Create License` weiterhin unterhalb der bestehenden License-Liste.

## Vertrag

Wie bereits beim User Management:

- Listenansicht separat;
- `New License` öffnet eigene View/Seite;
- `Edit` öffnet eigene View/Seite;
- kein Formular unterhalb der Liste;
- Save → Success → zurück zur Liste;
- Cancel/Back → Liste;
- Refresh/Deep-Link/Back stabil;
- Route startet am Contentanfang.

---

# 6. Packages/Entitlements – Create/Edit wirklich separieren

Gleicher Livebefund wie bei Licenses: `Create Package` hängt weiterhin unter der Paketliste.

Vertrag identisch:

- separate List/Create/Edit-Views;
- kein Inline-/Unterlistenformular;
- Save/Cancel/Back sauber;
- bestehende Package-/Entitlement-Logik unverändert.

---

# 7. Edit User – Identität oben eindeutig anzeigen

## Livebefund

Edit User beginnt derzeit mit E-Mail und Display Name. Die eigentliche Accountidentität ist nicht eindeutig sichtbar.

## Ziel

Oben im Edit-User-Formular vor E-Mail/Display Name klar anzeigen:

- **User ID** – read-only;
- **Username** – standardmäßig read-only, sofern der bestehende Produktvertrag keine explizite Username-Änderung vorsieht;
- danach Display Name und E-Mail editierbar.

Username und Display Name dürfen nicht semantisch vermischt werden. Beispiel: `ralf1965` ist Accountname, `Ralf Müller` ist Anzeigename.

Keine unnötige Möglichkeit schaffen, systemkritische IDs zu ändern.

---

# 8. Bereits live bestandene Punkte nicht regressieren

Erhalten:

- Profile Install/Activate/Deactivate/Uninstall/Re-activate: jetzt live funktionsfähig.
- Module-Lifecycle-Buttons reagieren.
- Admin Sidebar horizontal stabil, sofern aktueller Betreiber-Retest dies bestätigt; nur regressionsfrei halten.
- Logout soll ausschließlich `Logout` zeigen.
- GPS Produktfunktion, Media/Postbox/Sharing Lifecycle, Audit Delete All, Maintenance State – frühere PASS-Befunde erhalten.

---

# 9. Tests

Mindestens:

1. User Login Hold-to-reveal mit echten Pointer-/Touch-nahen DOM-Events testen;
2. Fallback nicht gleichzeitig mit Eye aktiv;
3. User Session bleibt über künstlich fortgeschrittene Zeit / erneute Requests gültig, bis expliziter Logout/Revoke;
4. Logout/Revoke beendet sie weiterhin;
5. Device Limits bleiben wirksam;
6. Profile aktiv + `profile.view/profile.update` → Settings zeigt Profile/Privacy;
7. Profile inaktiv oder ohne Permission → nicht sichtbar;
8. Organization Projection aus License Membership;
9. License-/Package Create/Edit separate Viewstates;
10. Edit User zeigt User ID + Username read-only;
11. vollständige Regression Suite;
12. JS-Syntax, PHP-Lint, `git diff --check`;
13. responsive iPad/mobile prüfen.

Keine Tests, die nur Implementierungsstrings statt Verhalten bestätigen.

---

# 10. Dokumentation

Nach tatsächlichem Code-Endstand synchronisieren:

- `CHATGPT.md`
- `CURRENT-TASK.md`
- `STATUS.md`
- `ADMIN-UX-DECISIONS.md`
- `UI-UX.md`
- `USER-ACCOUNT-LICENSE-MODEL.md`
- `Security.md`
- `API.md`
- `Database.md`
- `Functions.md`
- `CORE-1.0-READINESS.md`
- `CHANGELOG.md` append-only
- weitere betroffene MD-Dateien nur wenn tatsächlich notwendig.

Wahrheitsgrenzen:

- Profile Lifecycle darf als aktueller operator-live PASS dokumentiert werden.
- Profile/Privacy UI, Organization Projection, Session-Persistenz, User-Eye und separierte Create/Edit-Flows bleiben bis Betreiberprüfung **OPERATOR RETEST REQUIRED**.
- Kein Production Restore.
- Kein automatischer Core Freeze.

---

# 11. Abschluss / Deployment

1. fokussierte Tests;
2. komplette Suite;
3. Production Package;
4. Commit/Push nach `main` gemäß `WORKFLOW.md`;
5. CodeQL/FTPS bis terminal abwarten;
6. read-only Production Smoke;
7. `CHATGPT.md` mit tatsächlichem Commit, CI-/Deploymentstatus und einer **einzigen priorisierten Operator-Retestliste** aktualisieren.

## Operator-Retest-Reihenfolge danach

1. User Login: Hold-to-reveal auf iPad/Chrome normal + privat; falls Fallback verwendet wurde, sichtbares Passwortfeld prüfen.
2. User eingeloggt lassen, Browser/App neu öffnen und später erneut testen: Session muss ohne Logout aktiv bleiben.
3. Profile aktiv + Tester mit `profile.view/profile.update`: Profile/Privacy in Settings sichtbar und benutzbar.
4. User Management: Tester zeigt `Organization = Verein Bonn`.
5. Licenses: List → New/Edit als separate Views.
6. Packages: List → New/Edit als separate Views.
7. Edit User: User ID + Username eindeutig read-only sichtbar.
8. Regression der bereits bestandenen Lifecycle-/GPS-/Adminpunkte.

Bis zur realen Betreiberbestätigung kein Core Freeze.
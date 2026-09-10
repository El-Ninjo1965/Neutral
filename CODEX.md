# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER NACHBESSERUNGSAUFTRAG – ORGANIZATION SHARING + ACTIVE NAVIGATION UX  
**Datum:** 2026-09-10

# Betreiber-Livebefund

Der aktuelle Produktionsstand wurde erneut real auf iPad/Chrome geprüft.

## Bereits bestätigt / nicht unnötig regressieren

- User- und Admin-Login funktionieren.
- parallele User-/Admin-Sessions funktionieren.
- GPS-Basismodul funktioniert im geprüften Umfang.
- Packages/Licenses/Device-Limits sind funktionsfähig.
- Backup Storage Path auf realem Host funktioniert; manuelles Backup wurde erfolgreich erstellt.
- Backup V2 ist code-/isoliert als `BACKUP CONTRACT COMPLETE` verifiziert und deployed.
- ausgeloggt sind in Settings nur `App Areas` und `Navigation` sichtbar; `Privacy & Sharing` und `Profile` erscheinen erst nach Login.
- Birthday Save/Persistenz und kompaktere Tablet-UI wurden im letzten Auftrag implementiert und müssen im Betreiber-Retest noch bestätigt werden.

## Neue UX-Befunde

1. `Share with my organization` darf nicht jedem eingeloggten Einzeluser angezeigt werden. Der Eintrag ist nur sinnvoll, wenn der Account tatsächlich einer Organization/License mit Organisationskontext zugeordnet ist.
2. Navigation besitzt keinen durchgängig klaren Active-State. Wenn eine Seite/Unterseite aktiv ist, soll der entsprechende Navigationsbutton visuell eindeutig aktiv sein. Im aktuellen Theme ist das blau; technisch darf die Farbe nicht hart als Blau verdrahtet werden, sondern muss aus dem bestehenden Theme-/Active-State-Token kommen.

Reale Betreiberbefunde haben Vorrang vor früheren grünen Tests.

---

# 1. Pflicht-Preflight

1. Mit `origin/main` synchronisieren.
2. Vollständig lesen: `CHATGPT.md`, `CODEX.md`, `CURRENT-TASK.md`, `VISION.md`, `CORE-1.0.md`, `CORE-1.0-READINESS.md`, `ADMIN-UX-DECISIONS.md`, `USER-ACCOUNT-LICENSE-MODEL.md`, `UI-UX.md`, `Architecture.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `WORKFLOW.md` sowie relevante Settings/Auth/License/Organization/Navigation-Dateien.
3. Auftrag vollständig nach `CURRENT-TASK.md` übernehmen.
4. Keine CatchTrack-Fachlogik, kein GPS Pro, kein Marketplace, keine Community-/Messaging-Erweiterung.
5. Keine Secrets/PII ausgeben oder committen.
6. Keine destruktiven Produktionsaktionen.

---

# 2. `Share with my organization` nur bei echter Organisationszugehörigkeit

## Ziel

Der Privacy-/Profile-Bereich darf `Share with my organization` nur rendern, wenn der eingeloggte User tatsächlich einen gültigen Organisationskontext besitzt.

## Verbindliche Semantik

- Einzeluser / privater Payment-User ohne Organization-/License-Zuordnung: **Option nicht anzeigen**.
- User mit gültiger Organization-/License-Zuordnung: Option anzeigen.
- Nicht aus Rollenname, UI-Text oder Clientannahme ableiten, sondern aus autoritativer serverseitiger Zuordnung.
- Falls mehrere Organisationsbezüge möglich sind, vorhandenen Datenvertrag respektieren und keine neue Mehrfachorganisationslogik erfinden.
- Wenn eine Organisation/Lizenz entfernt, widerrufen oder die User-Zuordnung gelöst wird, muss die Option nach Refresh bzw. Auth-State-Hydration verschwinden.
- Bestehender Privacy-Default bleibt `off`.

## Sicherheit / API

Nicht nur UI ausblenden:

- API/Service muss serverseitig prüfen, ob der User überhaupt organisationsbezogene Freigaben setzen darf.
- Ein Einzeluser darf eine Organization-Sharing-Freigabe nicht durch manipulierten Clientrequest aktivieren.
- Keine Organisationsdaten an unberechtigte User leaken.
- Bestehende individuelle Privacy-Einstellungen nicht unnötig verändern.

## Tests

Mindestens:

1. eingeloggter Einzeluser ohne Organization → Option fehlt;
2. User mit gültiger Organization-Zuordnung → Option sichtbar;
3. Logout → Privacy/Profile verschwinden weiterhin vollständig;
4. Organization-Zuordnung entfernen → Option verschwindet;
5. manipulierter Request eines Einzelusers → definierter 4xx, keine Mutation;
6. Privacy default-off bleibt erhalten.

---

# 3. Globaler Active-State für Navigation

## Ziel

Jeder Navigationsbereich zeigt eindeutig, welche Seite aktuell aktiv ist.

## Hauptnavigation

Wenn ein Hauptbereich geöffnet ist, muss sein Button aktiv dargestellt werden.

Beispiele:

- Settings geöffnet → `Settings` aktiv.
- GPS geöffnet → `GPS` aktiv.
- andere Hauptmodule analog.

Der Active-State muss aus Route/aktuellem View-State abgeleitet werden und nach Reload sowie direktem Deep-Link weiterhin stimmen.

## Settings-Unternavigation

Innerhalb Settings gilt dasselbe für:

- App Areas
- Navigation
- Privacy & Sharing
- Profile

Beispiele:

- Settings → Profile: `Settings` bleibt als Hauptbereich aktiv und `Profile` ist in der Unterebene aktiv.
- Wechsel auf `Navigation`: `Settings` bleibt aktiv, `Navigation` wird aktiv, `Profile` verliert den Active-State.

## UX-Vertrag

- pro Navigationsebene genau **ein** aktiver Eintrag;
- aktiver Zustand klar sichtbar;
- aktuelles Theme verwendet dafür blau, aber **keine hartcodierte blaue Farbe**;
- bestehende Theme-/Design-Tokens bzw. zentrale Active-/Selected-State-Variable verwenden oder sauber zentral ergänzen;
- Light/Dark und kundenspezifische Themes respektieren;
- Active-State muss mindestens Hintergrund, Text/Icon-Kontrast und Accessibility-Zustand (`aria-current`/äquivalent) korrekt setzen;
- Hover/Focus/Disabled dürfen Active nicht optisch überschreiben;
- Touch-UX auf iPad/iPhone/Android beachten.

## Routing / Auth

- Active-State aus realem Router-/View-State, nicht nur zuletzt geklicktem Button.
- direkter Seitenaufruf/Reload muss korrekt markieren.
- nach Login/Logout muss die sichtbare Settings-Unternavigation neu berechnet werden.
- ausgeblendete auth-gebundene Tabs dürfen niemals als Active-State zurückbleiben.

## Tests

Mindestens:

1. Hauptnavigation mehrere Bereiche durchklicken;
2. Settings-Untertabs durchklicken;
3. Reload auf aktivem Untertab;
4. Deep-Link/direkter Aufruf;
5. Login/Logout bei aktivem Privacy/Profile;
6. Light/Dark bzw. vorhandene Theme-Tokens;
7. Accessibility-Attribut für aktuellen Eintrag.

---

# 4. Betreiber-Retest der letzten Settings-Fixes mit absichern

Die bereits implementierten letzten Änderungen nicht neu erfinden, aber Regressionstests aufnehmen:

- Birthday speichern → Profile verlassen → erneut öffnen → Reload → Logout/Login → Datum bleibt korrekt;
- Birthday Day/Month/Year auf iPad kompakt;
- ausgeloggt nur `App Areas` + `Navigation`;
- eingeloggt zusätzlich `Privacy & Sharing` + `Profile`;
- Organization-Sharing nur bei tatsächlich zugeordnetem User.

---

# 5. Regression / Freeze-Fortschritt

Nach Umsetzung vollständige Regression mindestens für:

- User/Admin Login und Logout;
- Settings Auth-Sichtbarkeit;
- Organization-Sharing-Gating;
- Birthday Persistenz/Layout;
- globale Hauptnavigation Active-State;
- Settings-Untertabs Active-State;
- Packages/Licenses/Organization-Zuordnungen;
- Device Limits;
- Sessions/Installation-ID;
- Audit;
- GPS;
- Backup Storage Path und Backup Create/Download ohne Secret-Leak;
- PHP-Lint;
- JS-Syntax;
- `git diff --check`;
- vollständige Tests;
- Production package.

`CORE-1.0-READINESS.md` nur wahrheitsgemäß aktualisieren. Kein automatischer Final Freeze.

---

# 6. Dokumentation

Mindestens aktualisieren, soweit betroffen:

- `CHATGPT.md`
- `ADMIN-UX-DECISIONS.md`
- `UI-UX.md`
- `USER-ACCOUNT-LICENSE-MODEL.md`
- `CORE-1.0-READINESS.md`
- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- `Architecture.md`
- `Security.md`
- `API.md`
- `Functions.md`

Die beiden neuen Produktentscheidungen dauerhaft festhalten:

1. Organization-Sharing ist **kontextabhängig** und nur für tatsächlich organisationszugeordnete User sichtbar/verwendbar.
2. Navigation verwendet einen zentralen, routenbasierten Active-State auf Haupt- und Unterebene; konkrete Farben kommen aus Theme-Tokens, nicht aus hardcodierten Komponentenwerten.

---

# 7. Deployment / Übergabe

Gemäß `WORKFLOW.md`:

1. commit/push `main`;
2. CI/CodeQL/FTPS terminal abwarten;
3. `HEAD == origin/main`, sauberer Tree;
4. Deploymentrevision + `migrationsReady:true` prüfen;
5. Production-Smokes ausschließlich read-only;
6. keine destruktiven Produktionsaktionen;
7. `CHATGPT.md` mit tatsächlichem Endstand und kurzer Betreiber-Retestliste aktualisieren.

Betreiber-Retestliste danach kurz halten:

- Einzeluser: kein `Share with my organization`;
- Organization-User: Option sichtbar;
- Settings-Hauptbutton aktiv;
- aktiver Settings-Untertab aktiv;
- Active-State nach Reload/Deep-Link korrekt;
- Birthday-Persistenz nochmals real prüfen.

Nichts ohne realen Betreibercheck als `LIVE BESTANDEN` markieren.

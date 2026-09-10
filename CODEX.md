# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER NACHBESSERUNGSAUFTRAG – GLOBAL SAVE CONFIRMATION + USER CREATE P0 + ACCESS NAV UX  
**Datum:** 2026-09-11

# Betreiber-Livebefund

Der aktuelle Produktionsstand wurde erneut real auf iPad/Chrome geprüft.

## Bereits bestätigt / nicht unnötig regressieren

- User- und Admin-Login funktionieren.
- parallele User-/Admin-Sessions funktionieren.
- GPS-Basismodul funktioniert im geprüften Umfang.
- Packages/Licenses/Device-Limits sind funktionsfähig.
- Backup Storage Path funktioniert auf dem realen Host.
- Backup V2 ist code-/isoliert als `BACKUP CONTRACT COMPLETE` verifiziert und deployed.
- ausgeloggt sind in Settings nur `App Areas` und `Navigation` sichtbar; `Privacy & Sharing` und `Profile` erscheinen erst nach Login.
- Birthday Save/Persistenz und kompaktere Tablet-UI sind implementiert; realer Betreibercheck läuft.
- Organization-Sharing ist serverseitig gated und nur bei aktiver License-/Organization-Zuordnung verfügbar.
- routenbasierte Active-States für Hauptnavigation und Settings-Untertabs sind implementiert.

Reale Betreiberbefunde haben Vorrang vor früheren grünen Tests.

## Neue Liveprobleme / UX-Wünsche

1. Erfolgreiche Speicheraktionen zeigen aktuell teilweise nur grünen Inline-Text wie `Settings saved successfully.`. Der Betreiber möchte stattdessen **global in User-UI und Admin-UI ein einheitliches Bestätigungs-Popup/Modal**.
2. Diese Regel soll **für jede erfolgreiche Save-/Speicher-/Update-Aktion** gelten, nicht nur in Settings.
3. Im Adminbereich kann aktuell kein neuer User/Admin angelegt werden. Realer Fehler: `Failed to create user: Internal server error.` → **P0-Funktionsfehler**.
4. In `User Management` kleben die Content-Blöcke `User Management` und `Create New User` optisch zusammen; etwas vertikaler Abstand ist gewünscht.
5. Alle Passwortfelder in User-UI und Admin-UI sollen einen sichtbaren **Eye-Toggle** zum Ein-/Ausblenden des Passworts erhalten.
6. In der Admin-Sidebar unter `ACCESS` sollen die technischen Berechtigungsbereiche ans Ende. Gewünschte Reihenfolge:
   - Users
   - Packages / Entitlements
   - Licenses / Organizations
   - Sessions
   - Roles & Permissions
   - Permission Catalog

---

# 1. Pflicht-Preflight

1. Mit `origin/main` synchronisieren.
2. Vollständig lesen: `CHATGPT.md`, `CODEX.md`, `CURRENT-TASK.md`, `VISION.md`, `CORE-1.0.md`, `CORE-1.0-READINESS.md`, `ADMIN-UX-DECISIONS.md`, `UI-UX.md`, `Architecture.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `WORKFLOW.md` sowie relevante User-/Auth-/Form-/Modal-/Navigation-Dateien.
3. Auftrag vollständig nach `CURRENT-TASK.md` übernehmen.
4. Keine CatchTrack-Fachlogik, kein GPS Pro, kein Marketplace, keine Community-/Messaging-Erweiterung.
5. Keine Secrets/PII ausgeben oder committen.
6. Keine destruktiven Produktionsaktionen.

---

# 2. P0 – Admin `Create New User` liefert Internal Server Error

## Realer Befund

Im Adminbereich unter `Users` schlägt die Erstellung eines neuen Users/Admins mit folgender sichtbarer Meldung fehl:

`Failed to create user: Internal server error.`

Das ist ein echter Produktionsfehler und muss end-to-end diagnostiziert werden.

## Auftrag

Prüfe vollständig:

`Admin UI → Form State → ApiClient → POST User API → PHP Router → Service → Repository/DB → Audit → Response`

Insbesondere:

- Payload-Feldnamen/-typen;
- Pflicht-/Optionalfelder;
- Rollenarray / Adminrolle / Userrolle;
- License-/Package-Zuordnung, falls optional;
- Allowed Devices / Default / Custom / Unlimited;
- Passwortvalidierung;
- leere optionale Felder;
- DB-Constraints / FKs / unique username/email;
- Audit nach Create;
- generische Catch-Blöcke, die echte 4xx-Ursachen als 500 maskieren;
- mögliche Regression aus den letzten License-/Organization-/Profile-Änderungen.

## Abnahme

- gültiger neuer User lässt sich beim ersten Versuch erstellen;
- gültiger neuer Admin lässt sich beim ersten Versuch erstellen;
- invalides Input → verständlicher 4xx, kein 500;
- Duplicate Username/Email → definierter Konflikt, kein 500;
- Liste aktualisiert sich unmittelbar nach Erfolg;
- Auditnachweis korrekt;
- keine Regression bestehender User.

---

# 3. Globale Save-/Success-Bestätigung als Modal/Popup

## Produktentscheidung

Jede **erfolgreiche Speicher-/Änderungsaktion** in User-UI und Admin-UI soll nicht mehr nur als grüner Inline-Text unter einem Formular erscheinen, sondern über eine **zentrale einheitliche Success-Modal-Komponente** bestätigt werden.

Beispiele:

- `Settings saved successfully.`
- `Profile saved successfully.`
- `User created successfully.`
- `User updated successfully.`
- `License saved successfully.`
- `Backup path saved successfully.`

## Anforderungen

- zentrale Core-Komponente, nicht pro Seite neu implementieren;
- gilt mindestens für Create/Save/Update-Aktionen, die bisher Inline-Success-Text nutzen;
- Modal mittig, klar, touchfreundlich;
- `OK`-Button zum Schließen;
- Escape/Backdrop nur wenn mit bestehender Modal-Konvention konsistent;
- Fokusmanagement und Accessibility (`role="dialog"`, sinnvolle `aria-*`-Attribute, Fokus ins Modal und zurück zum Auslöser);
- keine grünen Success-Inline-Texte zusätzlich stehen lassen;
- Fehler bleiben klar getrennt als Error-State/Fehlermeldung und werden nicht als Success-Modal dargestellt;
- keine Modal-Spam-Kaskaden: pro erfolgreicher Benutzeraktion genau eine Bestätigung;
- Text lokalisierbar/i18n-fähig;
- User-UI und Admin-UI sollen dieselbe zentrale Komponente bzw. denselben UI-Vertrag verwenden.

## Nicht gemeint

- keine Popups bei reinem Tabwechsel;
- keine Popups bei automatischen Hintergrund-Refreshes;
- keine Popups bei jeder einzelnen Feldänderung;
- destruktive Bestätigungsdialoge bleiben eigene Confirmation-Flows.

## Tests

Mindestens Settings Save, Profile Save, User Create/Edit, License Save/Edit, Backup Path Save sowie Fehlerfall ohne Success-Modal.

---

# 4. Passwortfelder – globaler Eye-Toggle

Alle Passwortfelder in User-UI und Admin-UI sollen konsistent einen Show/Hide-Toggle erhalten.

## Anforderungen

- Standardzustand: Passwort verborgen (`type=password`);
- Eye-Icon rechts im Feld;
- Tap/Klick → sichtbar (`type=text`), erneuter Tap → wieder verborgen;
- keine Änderung am Feldwert;
- funktioniert mindestens bei:
  - User Login
  - Admin Login
  - Create New User
  - Edit User / Reset Password, falls vorhanden
  - Profile `Current password`
  - Profile `New password`
  - sonstigen bestehenden Passwortfeldern
- touchfreundliche Fläche;
- Tastatur-/Screenreader-bedienbar;
- `aria-label` bzw. zugänglicher Name wechselt sinngemäß zwischen Show/Hide password;
- keine Security-Logs oder Passwortwerte nach außen;
- kein Autofill-Vertrag unnötig brechen.

Zentrale wiederverwendbare Input-Komponente oder Helper bevorzugen, keine Copy/Paste-Implementierung auf jeder Seite.

---

# 5. User Management – vertikaler Abstand zwischen Content-Blöcken

Zwischen dem oberen `User Management`-Listen-/Filterblock und dem darunterliegenden `Create New User`-Block soll sichtbar etwas Luft liegen.

Anforderungen:

- moderater vertikaler Abstand entsprechend bestehendem Spacing-System;
- keine übergroße Leerfläche;
- responsive stabil auf iPad/Desktop/Phone;
- kein Spezial-Pixelhack nur für eine Auflösung;
- bestehende Card-/Panel-Radien und Borders beibehalten.

---

# 6. Admin Sidebar – Reihenfolge unter ACCESS

Gewünschte verbindliche Reihenfolge:

1. `Users`
2. `Packages / Entitlements`
3. `Licenses / Organizations`
4. `Sessions`
5. `Roles & Permissions`
6. `Permission Catalog`

Ziel: operative Access-Verwaltung zuerst, technische Berechtigungsdefinitionen zuletzt.

Anforderungen:

- nur Reihenfolge ändern, keine Routen/Permissions/Labels regressieren;
- Active-State weiterhin korrekt;
- Responsive-/Collapsed-Navigation weiterhin korrekt;
- Tests/Snapshots ggf. aktualisieren.

---

# 7. Bestehende Active-State- und Organization-Sharing-Regeln nicht regressieren

Regression sicherstellen:

- Hauptnavigation/Settings-Untertabs bleiben routenbasiert aktiv;
- Theme-Tokens weiterhin autoritativ;
- `aria-current="page"` korrekt;
- `Share with my organization` nur bei echter aktiver Organization-/License-Zuordnung;
- Einzeluser sehen diese Option nicht;
- serverseitige 422-Sperre gegen manipulierte Sharing-Requests bleibt erhalten.

---

# 8. Regression / Freeze-Fortschritt

Nach Umsetzung vollständige Regression mindestens für:

- User/Admin Login;
- Create New User und Create New Admin;
- User Edit;
- Passwortfelder Show/Hide;
- Settings/Profile Save → Success Modal;
- Admin Save/Create/Update → Success Modal;
- Fehlerfälle ohne falsches Success Modal;
- Sidebar ACCESS-Reihenfolge;
- User-Management-Spacing;
- Organization-Sharing-Gating;
- Birthday Persistenz/Layout;
- Hauptnavigation/Settings-Untertab Active-State;
- Packages/Licenses/Device Limits;
- Sessions/Installation-ID;
- Audit;
- GPS;
- Backup Storage Path / Backup Create / Download ohne Secret-Leak;
- PHP-Lint;
- JS-Syntax;
- `git diff --check`;
- vollständige Tests;
- Production package.

`CORE-1.0-READINESS.md` nur wahrheitsgemäß aktualisieren. Kein automatischer Final Freeze.

---

# 9. Dokumentation

Mindestens aktualisieren, soweit betroffen:

- `CHATGPT.md`
- `ADMIN-UX-DECISIONS.md`
- `UI-UX.md`
- `CORE-1.0-READINESS.md`
- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- `Architecture.md`
- `Security.md`
- `API.md`
- `Functions.md`

Dauerhaft festhalten:

1. Save-/Success-Bestätigungen verwenden zentralisierte Modals in User- und Admin-UI.
2. Passwortfelder besitzen global einen zugänglichen Show/Hide-Toggle.
3. ACCESS-Reihenfolge entspricht der oben definierten Reihenfolge.
4. User-Management-Panels verwenden konsistentes vertikales Spacing.

---

# 10. Deployment / Übergabe

Gemäß `WORKFLOW.md`:

1. commit/push `main`;
2. CI/CodeQL/FTPS terminal abwarten;
3. `HEAD == origin/main`, sauberer Tree;
4. Deploymentrevision + `migrationsReady:true` prüfen;
5. Production-Smokes ausschließlich read-only;
6. keine destruktiven Produktionsaktionen;
7. `CHATGPT.md` mit tatsächlichem Endstand und kurzer Betreiber-Retestliste aktualisieren.

Betreiber-Retestliste danach kurz halten:

- neuen User erstellen;
- neuen Admin erstellen;
- Save-Aktion in User-UI → Modal;
- Save/Create/Update in Admin-UI → Modal;
- Passwort-Eye in Login/Create/Profile prüfen;
- ACCESS-Reihenfolge prüfen;
- Abstand zwischen User Management und Create New User prüfen.

Nichts ohne realen Betreibercheck als `LIVE BESTANDEN` markieren.

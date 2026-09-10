# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER NACHBESSERUNGSAUFTRAG – LOGIN PASSWORD TOGGLE + USER PACKAGE ASSIGNMENT + LIVE RETEST  
**Datum:** 2026-09-11

# Betreiber-Livebefund

Der aktuelle Produktionsstand wurde erneut real auf iPad/Chrome geprüft.

## Bereits positiv bestätigt / nicht unnötig regressieren

- User- und Admin-Login funktionieren grundsätzlich.
- parallele User-/Admin-Sessions funktionieren.
- GPS-Basismodul funktioniert im geprüften Umfang.
- Backup Storage Path funktioniert auf dem realen Host.
- Backup V2 ist code-/isoliert als `BACKUP CONTRACT COMPLETE` verifiziert und deployed.
- ausgeloggt sind in Settings nur `App Areas` und `Navigation` sichtbar; `Privacy & Sharing` und `Profile` erscheinen erst nach Login.
- Birthday Save/Persistenz ist im aktuellen Livecheck sichtbar: gespeichertes Datum wird erneut korrekt angezeigt.
- Organization-Sharing ist serverseitig gated und nur bei aktiver License-/Organization-Zuordnung verfügbar.
- routenbasierte Active-States für Hauptnavigation und Settings-Untertabs sind implementiert.
- ACCESS-Reihenfolge wurde angepasst.
- User-Management-Spacing wurde angepasst.
- zentrale Success-Modal-Logik und Passwort-Show/Hide-Helper sind grundsätzlich implementiert.

Reale Betreiberbefunde haben Vorrang vor früheren grünen Tests.

## Neue Liveprobleme

1. **Admin-Login Passworttoggle unverständlich:** Rechts im Passwortfeld erscheint lediglich ein kleiner Punkt/Kreis. Das ist als Show/Hide-Passwortfunktion nicht verständlich. Gewünscht ist ein echtes, allgemein erkennbares Eye-Icon.
2. **User-UI Login ohne Passworttoggle:** Im normalen User-Login fehlt der Show/Hide-Toggle vollständig.
3. **User Edit ohne direkte Package-Auswahl:** Im Adminbereich `Edit User` gibt es `License / Organization`, aber keine direkte `Package`-Auswahl. Ein Einzeluser ohne Organization/License muss dennoch direkt einem Package zugeordnet werden können.
4. Die bestehende Package-/License-/Device-Limit-Semantik darf dabei nicht widersprüchlich werden.

---

# 1. Pflicht-Preflight

1. Mit `origin/main` synchronisieren.
2. Vollständig lesen: `CHATGPT.md`, `CODEX.md`, `CURRENT-TASK.md`, `VISION.md`, `CORE-1.0.md`, `CORE-1.0-READINESS.md`, `USER-ACCOUNT-LICENSE-MODEL.md`, `ADMIN-UX-DECISIONS.md`, `UI-UX.md`, `Architecture.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `WORKFLOW.md` sowie relevante User-/Auth-/Password-/Package-/License-Dateien.
3. Auftrag vollständig nach `CURRENT-TASK.md` übernehmen.
4. Keine CatchTrack-Fachlogik, kein GPS Pro, kein Marketplace, keine Community-/Messaging-Erweiterung.
5. Keine Secrets/PII ausgeben oder committen.
6. Keine destruktiven Produktionsaktionen.

---

# 2. Passwort-Show/Hide global wirklich konsistent machen

## Livebefund

### Admin Login

Der Toggle ist technisch vorhanden, erscheint auf iPad/Chrome aber nur als kleiner Punkt/Kreis. Das ist UX-seitig nicht akzeptabel.

### User Login

Im normalen Plattform-Login fehlt der Toggle vollständig.

## Verbindlicher UI-Vertrag

Alle Passwortfelder in User-UI und Admin-UI verwenden dieselbe zentrale Password-Field-/Toggle-Komponente bzw. denselben Helper.

Anforderungen:

- Standardzustand `type=password`;
- rechts im Feld ein **echtes Eye-Icon**, allgemein verständlich;
- verborgen: geschlossenes bzw. durchgestrichenes Auge;
- sichtbar: offenes Auge;
- keine Darstellung als bloßer Punkt/Kreis;
- Toggle rechts im Feld, visuell klar vom Text getrennt;
- Touchfläche mindestens ungefähr 44×44 CSS-Pixel, Symbol selbst klar sichtbar;
- Tap/Klick toggelt ausschließlich `password` ↔ `text`, ohne Wertänderung;
- zugänglich per Tastatur/Screenreader;
- `aria-label` wechselt sinngemäß `Show password` / `Hide password`;
- i18n-fähige Beschriftung;
- kein Passwortwert in Logs/Audit/Analytics;
- Autofill nicht unnötig brechen.

Mindestabdeckung:

- normaler User Login;
- Admin Login;
- Create New User;
- Edit/Reset Password, falls vorhanden;
- Profile `Current password`;
- Profile `New password`;
- dynamisch erzeugte Passwortfelder.

Tests müssen explizit sicherstellen, dass der User-Login nicht vergessen wird und der Admin-Login ein tatsächliches Eye-Symbol rendert.

---

# 3. User muss unabhängig von Organization/License direkt einem Package zugeordnet werden können

## Livebefund

In `Admin → Users → Edit User` ist derzeit nur `License / Organization` auswählbar. Eine direkte Package-Auswahl fehlt.

Das ist für Einzeluser fachlich unvollständig: Ein privater/normaler Payment-User kann keinem Verein/keiner Organisation angehören, braucht aber dennoch ein Package/Entitlement.

## Verbindliche Semantik

Die UI und das Datenmodell müssen klar zwischen **Package** und **License / Organization** unterscheiden.

### Einzeluser

- darf direkt ein Package erhalten;
- keine Organization/License erforderlich;
- Package bestimmt die verfügbaren Entitlements und den Package-Default für Devices pro User.

### Organization-/License-User

- kann einer License/Organization zugeordnet sein;
- diese License verweist auf ein Package;
- die UI muss klar und widerspruchsfrei zeigen, welches Package dadurch effektiv gilt.

## Konflikt-/Prioritätsregel

Prüfe den bereits vorhandenen Datenvertrag in `USER-ACCOUNT-LICENSE-MODEL.md` und bestehender Implementierung. Keine neue Semantik frei erfinden, wenn bereits festgelegt.

Falls bislang nicht eindeutig geregelt, dann als Produktvertrag sauber definieren und dokumentieren:

- direkte User-Package-Zuordnung gilt für Einzeluser;
- sobald eine aktive License/Organization zugeordnet ist, darf es **keinen stillen widersprüchlichen zweiten effektiven Package-Zustand** geben;
- entweder License-Package ist dann autoritativ oder direkte Package-Auswahl wird gesperrt/als abgeleitet angezeigt;
- UI muss die Quelle des effektiven Packages deutlich machen (`Direct package` vs `From license/organization` oder äquivalent);
- Wechsel zwischen Einzeluser und Organization-User muss kontrolliert und nachvollziehbar sein;
- bestehende Device-Limit-Vererbung muss dazu konsistent bleiben:
  - Package default devices per user;
  - License device limit per user kann Package-Default übernehmen/überschreiben;
  - User kann gemäß bestehendem Vertrag Default übernehmen oder User-Override besitzen.

## UI-Anforderungen

In Create/Edit User mindestens klar trennen:

- `Package`
- `License / Organization`

Wenn eine License gewählt ist und deren Package autoritativ ist:

- direkte Package-Auswahl entweder deaktivieren und das geerbte Package anzeigen;
- oder die direkte Auswahl kontrolliert entfernen/ersetzen;
- niemals zwei unterschiedliche Packages gleichzeitig als scheinbar aktiv darstellen.

Wenn `License / Organization = Unassigned`:

- `Package` muss frei auswählbar sein.

## API/DB

End-to-end prüfen:

- Create User mit direktem Package und ohne License;
- Edit User Package-Wechsel ohne License;
- Zuordnung einer License mit Package;
- Entfernung der License → definierter Fallback auf direktes Package oder klar dokumentierter Zustand;
- keine FK-/Referenzfehler;
- Audit nachvollziehbar;
- keine stillen Entitlement-Verluste.

## Tests

Mindestens:

1. Einzeluser + direktes Package → erfolgreich;
2. Einzeluser Package wechseln → erfolgreich;
3. User ohne License hat sichtbares/eindeutiges effektives Package;
4. License zuweisen → effektives Package entspricht dem definierten Vertrag;
5. Konflikt zwischen direktem Package und License-Package kann nicht still entstehen;
6. License entfernen → definierter Package-Zustand;
7. Device-Limits bleiben konsistent;
8. User-Liste zeigt verständlich das effektive Package bzw. die License-/Package-Quelle.

---

# 4. Bestehende globale Success-Modal-Regel nicht regressieren

Weiterhin verbindlich:

- erfolgreiche Save/Create/Update-Aktionen in User- und Admin-UI verwenden die zentrale Success-Modal-Komponente;
- keine zusätzlichen grünen Inline-Erfolgstexte;
- Fehler bleiben separate Error-States;
- pro Benutzeraktion genau ein Success-Modal;
- Fokusmanagement, Touch-UX und i18n bleiben erhalten.

Beim Package-/User-Edit entsprechend mitprüfen.

---

# 5. Bestehende Navigation/Organization/Birthday-Regeln nicht regressieren

Regression sicherstellen:

- ACCESS-Reihenfolge bleibt:
  1. Users
  2. Packages / Entitlements
  3. Licenses / Organizations
  4. Sessions
  5. Roles & Permissions
  6. Permission Catalog
- Hauptnavigation und Settings-Untertabs behalten routenbasierten Active-State;
- `Share with my organization` nur bei echter aktiver Organization-/License-Zuordnung;
- Einzeluser ohne Organization sehen diese Option nicht;
- Birthday-Persistenz bleibt korrekt;
- ausgeloggt nur `App Areas` + `Navigation`.

---

# 6. Regression / Freeze-Fortschritt

Nach Umsetzung vollständige Regression mindestens für:

- User Login inkl. Eye-Toggle;
- Admin Login inkl. korrekt sichtbarem Eye-Toggle;
- Create New User/Admin;
- User Edit;
- direktes Package für Einzeluser;
- License-/Organization-Zuordnung und effektives Package;
- Device-Limit-Vererbung;
- Success-Modal auf User/Admin Save/Create/Update;
- Organization-Sharing-Gating;
- Birthday Persistenz/Layout;
- Navigation Active-State;
- ACCESS-Reihenfolge;
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

# 7. Dokumentation

Mindestens aktualisieren, soweit betroffen:

- `CHATGPT.md`
- `USER-ACCOUNT-LICENSE-MODEL.md`
- `ADMIN-UX-DECISIONS.md`
- `UI-UX.md`
- `CORE-1.0-READINESS.md`
- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- `Architecture.md`
- `Security.md`
- `API.md`
- `Database.md`
- `Functions.md`

Dauerhaft festhalten:

1. Passwortfelder verwenden global ein klar erkennbares Eye-Icon, nicht nur irgendeinen Toggle-Indikator.
2. User-Login und Admin-Login verwenden denselben Password-Visibility-Vertrag.
3. Einzeluser können direkt einem Package zugeordnet werden, unabhängig von Organization/License.
4. Organization-/License-Package und direktes User-Package dürfen keinen widersprüchlichen effektiven Zustand erzeugen.

---

# 8. Deployment / Übergabe

Gemäß `WORKFLOW.md`:

1. commit/push `main`;
2. CI/CodeQL/FTPS terminal abwarten;
3. `HEAD == origin/main`, sauberer Tree;
4. Deploymentrevision + `migrationsReady:true` prüfen;
5. Production-Smokes ausschließlich read-only;
6. keine destruktiven Produktionsaktionen;
7. `CHATGPT.md` mit tatsächlichem Endstand und kurzer Betreiber-Retestliste aktualisieren.

Betreiber-Retestliste danach kurz halten:

- User-Login: echtes Auge sichtbar und funktionsfähig;
- Admin-Login: echtes Auge statt Punkt/Kreis;
- Einzeluser ohne License: Package direkt auswählbar;
- Organization-User: effektives Package eindeutig und widerspruchsfrei;
- Device-Limits weiterhin korrekt;
- Save/Create/Update → Success-Modal.

Nichts ohne realen Betreibercheck als `LIVE BESTANDEN` markieren.

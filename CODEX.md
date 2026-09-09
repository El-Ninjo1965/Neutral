# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER AUFTRAG – CORE-FREEZE BLOCKER: USER/ACCOUNT/LIZENZ + GPS/SETTINGS LIVE-FIXES  
**Datum:** 2026-09-09

# Aktueller Auftrag

## Core vor CatchTrack finalisieren: Livefehler beheben und generisches Benutzer-/Lizenzfundament ergänzen

Der letzte Session-Fix wurde real auf iPad/Chrome geprüft: Wiederholtes Login/Logout erzeugt **keine neuen parallelen Sessions mehr**. Dieser Vertrag ist jetzt zu erhalten. Offen sind jedoch weitere Livefehler und vor dem Core-Freeze nachgewiesene generische Plattformlücken.

Arbeite autonom, systematisch und test-first bis zum vollständigen Abschluss. Nicht nach Teilaufgaben stoppen, wenn Repository, Dokumentation oder sichere Diagnose die Antwort liefern.

**Verbindliche Architekturquellen:** `VISION.md`, `CORE-1.0.md`, `USER-ACCOUNT-LICENSE-MODEL.md`, `Architecture.md`, `Security.md`, `ModuleCreation.md`, `UI-UX.md`.

Keine CatchTrack-Fachlogik. Kein GPS Pro. Marketplace, vollständige Community und vollständiges Messaging in diesem Auftrag **nicht** als Fachfeature implementieren.

---

# 1. Pflicht-Preflight

1. Vollständig mit `origin/main` synchronisieren.
2. Vollständig lesen:
   - `CHATGPT.md`
   - `CODEX.md`
   - `CURRENT-TASK.md`
   - `VISION.md`
   - `CORE-1.0.md`
   - `USER-ACCOUNT-LICENSE-MODEL.md`
   - `Architecture.md`
   - `Security.md`
   - `API.md`
   - `Database.md`
   - `Functions.md`
   - `ModuleCreation.md`
   - `Modules.md`
   - `UI-UX.md`
   - `I18N.md`
   - `STATUS.md`
   - `TODO.md`
   - `ToDoNow.md`
   - `WORKFLOW.md`
   - relevante Install-/Deploymentdokumentation
3. Diesen Auftrag vollständig nach `CURRENT-TASK.md` übernehmen und dokumentieren: `CODEX.md == CURRENT-TASK-Anforderungen`.
4. Echte Integration-/DOM-/PHP-Tests ergänzen. Reine Regex-Sourcechecks sind keine ausreichende Abnahme.
5. P1/P4 sowie der nun live bestätigte Session-Deduplizierungsvertrag dürfen nicht regressieren.
6. Keine Secrets, Passwörter, Tokens oder personenbezogenen Produktionsdaten ausgeben.
7. Kein Restore und keine destruktiven Produktionsaktionen.

---

# 2. Device Sessions – bestätigten Fix erhalten, Anzeige korrigieren

## Live bestätigt

- Gleiche Installation + gleicher User erzeugt nach Logout/Login keine zusätzliche aktive Session mehr.
- Tester auf derselben Installation verhält sich ebenfalls stabil.
- `Current session` funktioniert.

## Noch live falsch

### Zeit

Sessionzeit wird als ca. `08:24` angezeigt, während lokale iPad-Zeit `16:24` ist.

Ziel:

- Server speichert/überträgt Zeit weiterhin eindeutig in UTC/ISO.
- User-/Admin-UI rendert Zeit in **lokaler Browserzeitzone**.
- Keine serverseitige lokale Zeitzonenannahme.
- Optional technischer UTC-Wert nur in Details, nicht als primäre Anzeige.

### Plattform

Auf iPad/Chrome erscheint weiterhin `macOS · Chrome`.

Ziel:

- Plattforminformation ist nur Anzeige, niemals Geräteidentität.
- iPad/iPadOS soll bei belastbarer Clientinformation als `iPadOS · Chrome` erscheinen.
- Wenn iPadOS wegen Desktop-UA technisch nicht sicher ermittelbar ist, ehrlicher neutraler Tablet-/Apple-Fallback statt nachweislich falschem `macOS`.
- `MacIntel` niemals als Gerätename anzeigen.
- Keine Hardwarefingerprints.

---

# 3. GPS – Sprache vollständig konsistent

Realer Screenshot zeigt Sprachmischung: deutsche Überschriften/Statuswerte, englische Buttons und englischer Privacy-Hilfetext.

## Auftrag

- GPS vollständig an den vorhandenen I18N-Vertrag anbinden.
- Keine sichtbaren hartkodierten Mischsprachen.
- Wenn App-Sprache Deutsch: alle GPS-Texte Deutsch.
- Wenn Englisch: alle GPS-Texte Englisch.
- Keine neue parallele I18N-Architektur bauen; vorhandenen Vertrag verwenden.
- Hilfetext zu manuellem Teilen und `Allow Location Context Sharing` kurz, verständlich und vollständig übersetzbar formulieren.

Semantik erhalten:

- Position aktualisieren
- In Google Maps öffnen
- In OpenStreetMap öffnen
- Position teilen

---

# 4. GPS – OSM-Karte real interaktiv machen

Live:

- externer Linkwrapper ist entfernt – positiv.
- Zoom `+/-` reagiert trotzdem nicht.
- Karte lässt sich nicht ziehen/pannen.

## Ziel

- eingebettete Karte innerhalb der User-App wirklich zoombar und verschiebbar;
- Touch/Pan/Pinch auf iPad/Chrome soweit Browser erlaubt;
- `+/-` muss real funktionieren, sonst darf es nicht angezeigt werden;
- Marker bleibt auf aktueller Position;
- externe OSM-Navigation ausschließlich über separaten Button;
- Attribution/Lizenzvertrag erhalten;
- keine Trackingfunktion.

Root Cause prüfen: aktuelles iframe/embed-Format kann ggf. absichtlich statisch sein. Falls mit dem aktuellen OSM-Embed echte Interaktion nicht zuverlässig möglich ist, ersetze es durch eine leichte, Core-kompatible interaktive Kartenlösung auf Basis von OSM-Tiles, ohne Google-Abhängigkeit und ohne unnötig schwere Frameworkabhängigkeit.

---

# 5. Settings – klare Unter-Navigation statt endloser Kartenübersicht

Die aktuelle Kartenübersicht wird mit zunehmenden Einstellungen unübersichtlich.

## Zielstruktur

Unter der Überschrift `Settings` erscheint eine sichtbare interne Buttonnavigation, analog zum klaren Navigationserlebnis der App, aber **nur innerhalb Settings**:

1. App Areas
2. Navigation
3. Privacy & Sharing
4. Profile

Keine Dropdowns. Diese Unterpunkte gehören nicht in die globale Hauptnavigation.

- Beim Öffnen von Settings sinnvoller Default-Unterpunkt.
- Aktiver Unterpunkt eindeutig hervorgehoben.
- Nur der gewählte Settings-Bereich wird primär angezeigt; keine endlose Mischung aller Blöcke.
- Responsive auf Phone, Tablet, Landscape und Desktop.

---

# 6. Settings – Save-Verhalten und Texte

Live:

- Save funktioniert.
- Erfolgsmeldung erscheint.
- danach wird der User aber auf Start zurückgeleitet.

## Ziel

- Speichern bleibt auf aktueller Settings-Unterseite.
- kurze Erfolgsmeldung/Toast/Dialog; User entscheidet danach selbst, wohin er navigiert.
- kein automatischer Redirect auf Start.
- Reset-Texte verständlich und kurz. Technische Formulierungen wie `Reset all navigation labels` auf benutzerfreundliche I18N-Texte prüfen, z. B. sinngemäß `Standardnamen wiederherstellen`.

---

# 7. Globale Navigation – Active State korrigieren

Live:

- Login bleibt teilweise blau hervorgehoben, obwohl Settings oder Start aktiv ist.
- zeitweise Start und Login gleichzeitig blau.

## Ziel

- Genau der aktuell dargestellte globale Navigationspunkt besitzt Active-State.
- Login ist nur aktiv, wenn die Login-Seite tatsächlich dargestellt wird.
- Nach Navigation zu Start/GPS/Settings darf Login nicht hervorgehoben bleiben.
- Settings-Subnavigation ist davon separat und besitzt ihren eigenen Active-State.
- Light/Dark identisch logisch.

---

# 8. Profile – generische Settings-Grundfunktion implementieren

`USER-ACCOUNT-LICENSE-MODEL.md` ist verbindlich.

Implementiere eine neutrale Profile-Unterseite als Core-/User-Funktion, keine CatchTrack-Sonderlogik.

## Mindestens

Account:

- Username anzeigen; global eindeutig; Änderung nur, wenn bestehender Sicherheitsvertrag dies sauber erlaubt, sonst zunächst read-only mit dokumentierter Entscheidung.
- Passwort ändern.
- optionale E-Mail hinterlegen/ändern/entfernen.
- Login weiterhin per Username; falls E-Mail vorhanden, optional zusätzlich per E-Mail.

Profil:

- Display Name optional.
- Public Nickname/Handle optional und klar vom echten/privaten Profil getrennt.
- Telefon optional.
- Adresse optional.
- Geburtstag optional.

Privacy:

- Feldweise Freigaben standardmäßig `off`.
- mindestens Scope `organization/license owner` vorbereiten.
- öffentliche Freigabe nicht implizit aus Vereinsfreigabe ableiten.

Server validiert und autorisiert alle zentral gespeicherten Werte.

---

# 9. Passwortpolitik – einfache UX, aber nicht unsicher

Der Betreiber möchte keine unnötigen Sonderzeichen-/Groß-/Kleinschreibungszwänge.

Das ist umzusetzen, aber **kein dauerhaft unsicheres 6-Zeichen-/Geburtsdatums-Schema fest verdrahten**.

Ziel:

- keine Kompositionsregeln wie `muss Sonderzeichen enthalten`;
- serverseitig konfigurierbare Mindestlänge mit sicherem Default;
- bestehende Hashing-/Throttle-Sicherheit erhalten;
- klare UX für temporäres Initialpasswort und spätere Änderung;
- niemals Klartextpasswort speichern oder erneut anzeigen.

Dokumentiere die konkrete Default-Mindestlänge mit technischer Begründung in `Security.md`.

---

# 10. User Management vereinfachen und erweitern

## Create New User

Pflichtfelder:

- Username
- Initial Password
- Role

E-Mail ist optional.

Display Name ist nicht Pflicht und kann vom User später im Profil gepflegt werden.

## Status

Normale Admin-UX primär:

- Active
- Blocked

`Inactive` wird aus Last Activity abgeleitet, nicht manuell gesetzt. Legacy-/interne Zustände nur zeigen, wenn betrieblich wirklich nötig.

## Übersicht ergänzen

Mindestens:

- Username
- optionale E-Mail
- Rolle
- Active/Blocked
- Created
- Last Activity in lokaler Browserzeit
- Used Devices / Allowed Devices

Drill-down zu den Device Sessions/Installationen des Users.

---

# 11. Packages / Entitlements / Licenses – generisches Fundament vor Core-Freeze

Rollen, Permissions und Pakete nicht vermischen.

Implementiere die **generische Grundlage**, nicht konkrete Verkaufsnamen.

## Datenmodell/Vertrag

- Package/Entitlement Definition
- License/Organization Assignment
- Modul-/Capability-Freigaben
- quantitative Limits, insbesondere Device-/Seat-Limit
- `unlimited` sauber repräsentierbar

Keine festen Corebegriffe `Silver/Gold/Platinum`; diese sind spätere Konfiguration.

## User-App

Ein Modul darf je Entitlement:

- vollständig verfügbar,
- sichtbar aber gesperrt,
- oder unsichtbar sein.

Wenn sichtbar aber gesperrt: klarer generischer Hinweis auf benötigtes Paket/Entitlement, ohne Fachcode im Core.

Server bleibt Autorität.

---

# 12. Delegierter License/Organization Admin

Generische Rolle/Permission-Scope ergänzen, ohne System-Adminrechte zu vergeben.

Ein Lizenz-/Organisationsverwalter darf ausschließlich innerhalb seiner eigenen Lizenz:

- User anlegen;
- initiale Passwörter vergeben;
- Seats/Geräte einsehen und freigeben;
- ausgeschiedene Nutzer blockieren/entfernen;
- Last Activity und erlaubte/verwendete Geräte sehen;
- nur vom User freigegebene Profildaten sehen.

Er darf keine globalen Rollen, Corepermissions, Server, Backups, Audit oder fremde Lizenzen verwalten.

Scope serverseitig zwingend erzwingen; UI-Verstecken allein reicht nicht.

---

# 13. Device Limits an Lizenz/Entitlement binden

Das bestehende stabile Installations-ID-Modell verwenden.

- Allowed Devices pro User/Lizenz konfigurierbar.
- Used Devices aus realen registrierten Installationen.
- Limit erreicht → verständliche Ablehnung mit Option, altes Gerät durch berechtigten Verwalter freizugeben.
- Admin/Developer können konfigurierbar `unlimited` erhalten.
- Keine Plattform-/UA-Werte als Identität verwenden.

Echte Tests: 1 erlaubt, zweites Gerät blockiert; nach Revoke neues Gerät möglich; unlimited funktioniert; Organisationsadmin kann nur eigene Seats verwalten.

---

# 14. Anonymous / Viewer Installation Statistics

Implementiere datensparsame Installationsstatistik ohne Trackingzwang.

Gezählt wird ausschließlich eine zufällige Installation, die tatsächlich online den Server kontaktiert. Offline-Nutzung ohne Serverkontakt wird nicht behauptet oder nachträglich erfunden.

Admin-Kennzahlen mindestens:

- Known installations total
- Active today
- Active 7 days
- Active 30 days
- Anonymous/viewer
- Authenticated

Keine IP-Historie, Hardwarefingerprints, GPS-Daten oder unnötige personenbezogene Analyticsdaten.

Dokumentiere klar: `installation seen by server`, nicht App-Store-Downloadzahl.

---

# 15. Profilbild / Medien / Moderation – nur generische Grundlage

Keine Community-/Marketplace-Oberfläche bauen.

Aber prüfe vor Core-Freeze, ob der generische Vertrag für spätere serverseitige User-Medien fehlt. Falls ja, implementiere nur die notwendige neutrale Grundlage:

- Upload-Entitlement/Permission;
- `pending/approved/rejected/deleted`;
- sichere serverseitige Bildvalidierung und Größenlimits;
- clientseitige Optimierung soweit sinnvoll, serverseitige Validierung bleibt autoritativ;
- Rejection reason + optionale Moderatornotiz;
- Moderationshistorie/Zähler;
- kein automatisches Public Publishing.

Viewer ohne Login besitzt keinen Serverupload.

Lokale Profilbilder ohne Upload bleiben lokal und benötigen keine Moderation.

Keine automatische KI-Inhaltsmoderation in diesem Auftrag.

---

# 16. Messaging / Marketplace – dokumentieren, nicht als Feature bauen

`USER-ACCOUNT-LICENSE-MODEL.md` enthält die Zukunftsverträge.

In diesem Auftrag:

- keine komplette Inbox/Chat-UI;
- kein Marketplace;
- keine CatchTrack-Community.

Nur sicherstellen, dass Core-/Modularchitektur später generische Messaging-/Moderationsservices als eigenständige Fähigkeit ergänzen kann, ohne Produktfeaturebranches. Keine spekulativen Hooks hinzufügen, wenn aktuell kein nachgewiesener Bedarf im Vertrag besteht.

---

# 17. Core-Freeze-Prüfung nach Umsetzung

Nach Umsetzung erneut prüfen:

> Kann CatchTrack mit neuen fachlichen Modulen auf diesem Core aufgebaut werden, ohne für normale Produktfeatures Core-Dateien zu ändern?

Insbesondere müssen generisch vorhanden bzw. vertraglich sauber vorbereitet sein:

- Auth/User
- Profile/Privacy
- Roles/Permissions
- Entitlements/Licenses
- Device Limits
- User-/License Administration
- Module visibility/locked state
- responsive Settings/Profile UI
- anonymous installation metrics
- generic media moderation foundation, soweit tatsächlich implementiert

Keine CatchTrack-spezifische Umsetzung zur „Beweisführung“ einbauen.

---

# 18. Test- und Abnahmevertrag

Mindestens echte Tests für:

- Session-Deduplizierung bleibt stabil.
- lokale Zeitdarstellung aus UTC-Timestamps.
- iPad/Chrome-Plattformdarstellung ohne `MacIntel`.
- GPS komplett einsprachig gemäß aktueller Locale.
- GPS-Karte reagiert real auf Zoom/Pan-Vertrag.
- Settings-Subnavigation responsive und Active-State korrekt.
- Save bleibt auf aktueller Settings-Seite.
- globale Navigation hat genau einen Active-State.
- User ohne E-Mail anlegbar.
- Username global eindeutig.
- Login via Username und optional via vorhandene E-Mail.
- Passwortänderung/Validierung/Hashing.
- Profilfelder + default-off Sharing.
- Organisation sieht nur freigegebene Felder.
- Active/Blocked und Last Activity.
- Device Used/Allowed und Limits.
- License Admin kann nur eigenen Scope verwalten.
- Entitlement steuert visible/locked/available ohne Rechteerweiterung im Client.
- anonyme Installationsstatistik ohne PII/Fingerprint.
- P1/P4 und Offline-First regressionsfrei.

Danach vollständige Suite, PHP-Lint, JS-Syntax, `git diff --check`, Produktionspaket, Secret-/Artefaktprüfung.

---

# 19. Deploy und Übergabe

Gemäß `WORKFLOW.md`:

1. Commit/push `main`.
2. CI/CodeQL/FTPS terminal abwarten.
3. `HEAD == origin/main`, Working Tree sauber.
4. Deploymentrevision und read-only Produktionssmoke prüfen.
5. Migrationen idempotent und `migrationsReady:true`.
6. Relevante Dokumente wahrheitsgemäß aktualisieren, insbesondere `Architecture.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md`, `UI-UX.md`, `ModuleCreation.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `CHANGELOG.md`.
7. Vollständigen Übergabebericht in `CHATGPT.md` schreiben.
8. Klare kurze Retestliste für iPad/Chrome liefern.
9. Nicht real getestete Flächen als `DEVICE RETEST REQUIRED`; Hostabhängiges als `HOST ACTION REQUIRED`.
10. Nichts ohne realen Betreibercheck als `LIVE BESTANDEN` melden.

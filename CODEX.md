# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER NACHBESSERUNGSAUFTRAG – LICENSE CREATE + DEVICE/PROFILE/AUDIT UX  
**Datum:** 2026-09-10

# Betreiber-Livebefund

Der aktuelle Produktionsstand wurde erneut real auf iPad/Chrome geprüft.

## Positiv bestätigt

- User Login funktioniert.
- Admin Login funktioniert.
- parallele User-/Admin-Sessions funktionieren.
- GPS-Basismodul funktioniert vollständig im geprüften Umfang: Position, Zoom/Pan, Google Maps, OSM separat, Share.
- Packages / Entitlements ist sichtbar und grundsätzlich bedienbar.
- Audit `Delete All` funktioniert technisch: alte Einträge werden gelöscht und ein neuer `Audit Clear Complete`-Nachweis bleibt bestehen.

Diese bestätigten Bereiche nicht unnötig umbauen oder regressieren.

## Neue Liveprobleme / UX-Lücken

1. **P0 für den neuen Adminbereich:** `Create License` liefert trotz plausibel ausgefüllter Felder `Internal server error.`
2. Package Create funktionierte im Livecheck erst beim zweiten Speicherversuch. Ursache für möglichen First-Submit-/Init-/State-Bug prüfen.
3. Device-Limits sind in mehreren UI-Stellen auf feste Werte 1/2/3/5/10 beschränkt. Das widerspricht dem Ziel, beliebige Werte wie 20 oder 50 sowie `unlimited` zu erlauben.
4. User Edit zeigt kryptische Optionen wie `Override: 1`, `Override: 2`, ... statt einer klaren freien Device-Limit-Eingabe.
5. License UI ist unnötig technisch: `Seat limit`, `License device limit`, `Manager user ID`.
6. Geburtstag über nativen Kalender ist auf iPad für weit zurückliegende Jahre praktisch unbrauchbar; der Nutzer müsste sehr lange zurückscrollen.
7. Audit `Delete All` ist funktional, aber die zusätzliche Pflicht, exakt `DELETE` einzugeben, ist zu aufwendig. Zwei klare Bestätigungsdialoge reichen.

Verbindliche UX-Entscheidungen stehen zusätzlich in `ADMIN-UX-DECISIONS.md`. Diese Datei vor jeder Änderung vollständig lesen.

---

# 1. Pflicht-Preflight

1. Mit `origin/main` synchronisieren.
2. Vollständig lesen: `CHATGPT.md`, `CODEX.md`, `CURRENT-TASK.md`, `VISION.md`, `CORE-1.0.md`, `CORE-1.0-READINESS.md`, `USER-ACCOUNT-LICENSE-MODEL.md`, `ADMIN-UX-DECISIONS.md`, `UI-UX.md`, `Architecture.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `WORKFLOW.md` und relevante Implementierungs-/Testdateien.
3. Diesen Auftrag vollständig nach `CURRENT-TASK.md` übernehmen.
4. Keine CatchTrack-Fachlogik, kein GPS Pro, kein Marketplace, keine Community, kein Messaging-Ausbau.
5. Keine Secrets/PII ausgeben. Keine destruktiven Produktionsaktionen außer explizit vom Betreiber später getesteten Adminfunktionen.
6. Reale Produktionsbefunde haben Vorrang vor früheren grünen Tests.

---

# 2. P0 – Create License: Internal Server Error vollständig beheben

Reproduziere die reale Eingabesituation aus dem Livecheck:

- Key: z. B. `free_license`
- Organization: `Privat User`
- Package: bestehendes `Free`
- User/Seat limit: `1`
- Device limit mode: Package default
- Manager: leer
- Status: active

## Auftrag

Den Fehler end-to-end diagnostizieren:

`Admin UI → ApiClient → POST/PUT License API → PHP Router → Service → DB/Migration → Response`

Prüfe insbesondere:

- Payload-Feldnamen/-typen zwischen UI und API;
- `null`/leer bei Manager;
- Package-ID/Key-Auflösung;
- Seat-/Userlimit-Konvertierung;
- Device-Limit-Modus;
- Statuswerte;
- neue Migration `0007` tatsächlich produktiv angewendet;
- MySQL native prepared statements / Placeholder;
- Constraints/FKs/defaults/not-null;
- Audit-Logging nach Create;
- generische Catch-Blöcke, die die echte Ursache als bloßen 500 maskieren.

Fehler sicher klassifizieren; keine SQL-Details oder Secrets im Client anzeigen.

## Abnahme

- gültige License lässt sich beim ersten Versuch erstellen;
- fehlerhafte Nutzereingaben → 4xx mit verständlichem Fehler, kein 500;
- UI aktualisiert Liste unmittelbar nach Erfolg;
- Edit/Status/Packagewechsel funktionieren regressionsfrei;
- referenziertes Package bleibt geschützt vor unsicherem Löschen.

---

# 3. Package Create – First-submit-Bug prüfen

Der Betreiber beobachtete: New Package ließ sich beim ersten Speicherversuch scheinbar nicht speichern, beim zweiten Versuch funktionierte es.

Nicht vorschnell als Zufall abtun. Prüfe:

- Event-Listener nur einmal und rechtzeitig gebunden;
- initialer Form-State;
- CSRF/Auth-Refresh-Race;
- erstes Rendern/Router-Mount;
- Button disabled/loading state;
- doppelte Submit-Handler;
- API-Client-Initialisierung;
- Fehlermeldung, die eventuell nicht sichtbar war.

Abnahme: Package muss nach frischem Öffnen der Seite **beim ersten gültigen Submit** zuverlässig gespeichert werden.

---

# 4. Device-Limits – freie Zahl + Unlimited statt fester Presets

Verbindliche Architektur bleibt:

- Package kann Default Allowed Devices definieren.
- License kann Package-Default übernehmen oder eigenen Default setzen.
- User kann Package/License-Default übernehmen oder expliziten Override besitzen.
- `unlimited` ist möglich, wenn berechtigt.

## UX-Ziel

Keine fest verdrahteten Auswahlwerte 1/2/3/5/10 mehr als einzige Möglichkeit.

Implementiere jeweils eine klare Bedienung:

- `Use package/license default`
- `Custom limit` → freie positive Ganzzahl, z. B. 1, 2, 20, 50, 250
- `Unlimited`

Das gilt mindestens für:

- Package Default Allowed Devices
- License Device Limit per User
- User Create/Edit Allowed Devices

Server validiert autoritativ. Sinnvolle Obergrenze nur dann einführen, wenn technisch notwendig und dokumentiert; keine willkürliche kleine Grenze.

Bestehende Sessions werden bei Limit-Senkung nicht automatisch gelöscht.

---

# 5. License-/User-UI verständlicher benennen

Interne technische Feldnamen dürfen bleiben, aber die sichtbare Admin-UX soll klar sein.

Bevorzugte sichtbare Begriffe:

- `User limit` statt `Seat limit` (sofern exakt dieselbe Semantik)
- `Device limit per user` statt `License device limit`
- `License manager` statt `Manager user ID`
- `Custom device limit` statt `Override: N`
- `Package / License default` bleibt als Default-Herkunft verständlich

## License Manager

Keine manuelle numerische User-ID als normale UX.

- Dropdown/Search-Auswahl vorhandener geeigneter User.
- optional leer möglich.
- intern weiterhin ID speichern.
- Scope/Permission serverseitig prüfen.

## License widerrufen/deaktivieren

Eine Lizenz muss sicher administrativ deaktivierbar/widerrufbar sein, ohne historische Daten oder Auditbezug unkontrolliert zu löschen. Bestehenden Statusvertrag dafür verwenden/sauber ergänzen; Verhalten dokumentieren und testen.

---

# 6. Birthday – drei eindeutige Dropdowns

Native Date-Picker-Lösung verwerfen für dieses Feld, da sie im realen iPad-Usecase für ältere Geburtsjahre zu umständlich ist.

Verbindliche User-UX:

1. **Tag** – Dropdown 1–31
2. **Monat** – ausgeschriebener Monatsname gemäß aktueller I18N-Sprache
3. **Jahr** – Dropdown, sinnvoller Bereich für reale Geburtstage

Anforderungen:

- Reihenfolge eindeutig sichtbar;
- keine MM/DD/YYYY- oder DD/MM/YYYY-Verwechslungsgefahr;
- Tagliste darf optional passend zu Monat/Jahr eingeschränkt werden;
- unmögliche Daten serverseitig ablehnen;
- Schaltjahr korrekt;
- optionales Feld vollständig löschbar;
- Speicherung weiterhin kanonisch `YYYY-MM-DD` ohne Zeitzonenverschiebung;
- Privacy `birthday` bleibt default-off;
- responsive/touchfreundlich auf iPad, iPhone, Android und Desktop.

---

# 7. Audit Delete All – UX vereinfachen, Sicherheitsvertrag erhalten

Technische Funktion ist live bestätigt und darf nicht regressieren.

Ändere nur die Bestätigungs-UX:

- erste Bestätigung: klarer Warntext + Cancel/Delete
- zweite Bestätigung: `Are you sure?` / lokalisierte Entsprechung + Cancel/Confirm
- **keine zusätzliche Texteingabe `DELETE`**

Erhalten:

- eigene Permission `audit.clear`
- Adminsession
- CSRF
- Transaktion
- alle bisherigen Einträge löschen
- danach genau ein neuer Auditnachweis mit Anzahl/Actor/Zeit gemäß bestehendem Vertrag
- Retention 30/90/180/365 separat

Tests für Cancel auf Stufe 1, Cancel auf Stufe 2, Permission denied, CSRF denied und Erfolg.

---

# 8. Regression / Freeze-Fortschritt

Nach den Fixes vollständige Regression.

Mindestens prüfen:

- User/Admin Login
- getrennte Sessions + Deduplizierung
- Packages Create/Edit/Delete-Schutz
- Licenses Create/Edit/Deactivate
- Package→License→User-Zuweisung
- freie Device-Limits und `unlimited`
- Device-Limit Enforcement
- Birthday Dropdown → korrekter ISO-Wert
- Privacy default-off
- Audit Retention + vereinfachtes Delete All
- GPS unverändert funktionsfähig
- Settings unverändert
- PHP-Lint, JS-Syntax, `git diff --check`, vollständige Tests, Production package

Danach `CORE-1.0-READINESS.md` nur wahrheitsgemäß aktualisieren. Keine automatische Freeze-Erklärung. Offene Host-Gates wie Backup/Restore/Move bleiben offen, bis sie real/isoliert geprüft sind.

---

# 9. Deployment / Übergabe

Gemäß `WORKFLOW.md`:

1. commit/push `main`;
2. CI/CodeQL/FTPS terminal abwarten;
3. `HEAD == origin/main`, sauberer Tree;
4. Deploymentrevision + `migrationsReady:true` prüfen;
5. keine manuellen Produktions-SQL-Eingriffe;
6. `CHATGPT.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `CORE-1.0-READINESS.md` und betroffene Architektur/API/UI-Dokumentation aktualisieren;
7. kurze Betreiber-Retestliste ausgeben:
   - Package beim ersten Submit erstellen
   - License erstellen
   - License deaktivieren/widerrufen
   - Device-Limits freie Zahl/unlimited
   - User License + Custom Device Limit
   - Birthday Dropdowns
   - Audit Delete All mit genau zwei Bestätigungen

Nichts ohne realen Betreibercheck als `LIVE BESTANDEN` markieren.

# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER ARCHITEKTURAUFTRAG – PROFILE EXTRAHIEREN + SYSTEMMODULE VERTRÄGE VERVOLLSTÄNDIGEN  
**Datum:** 2026-09-11

# Ziel

Neutral soll vor dem Core-Freeze den nächsten entscheidenden Modularisierungsschritt machen.

Verbindliches Architekturprinzip:

> **Core = nur zwingend notwendige technische Mechanismen. Konkrete Funktionen = optionale Module.**

Eine Neutral-App muss ohne Profile, Sharing, Media, Notifications, Moderation, Postbox oder Community vollständig lauffähig bleiben. Keine unnötigen Modul-zu-Modul-Abhängigkeiten erzeugen.

Field Notes ist weiterhin der spätere harte Beweis für die Neutral-Vision, wird aber **erst nach Abschluss dieses Auftrags** als separates Testmodul gebaut.

---

# 1. Pflicht-Preflight

1. Mit `origin/main` synchronisieren.
2. Vollständig lesen: `CHATGPT.md`, `CODEX.md`, `CURRENT-TASK.md`, `VISION.md`, `CORE-1.0.md`, `CORE-1.0-READINESS.md`, `SYSTEM-MODULES.md`, `ADMIN-UX-DECISIONS.md`, `USER-ACCOUNT-LICENSE-MODEL.md`, `UI-UX.md`, `Architecture.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `WORKFLOW.md`, `BACKUP-CONTRACT.md` sowie alle relevanten Module/Registry/Profile/Settings/Privacy/Media/Auth/Event-Dateien.
3. Auftrag vollständig nach `CURRENT-TASK.md` übernehmen.
4. Keine CatchTrack-Fachlogik in Core oder Systemmodule einbauen.
5. Keine Secrets/PII ausgeben oder committen.
6. Keine destruktiven Produktionsaktionen und keinen Production-Restore.

---

# 2. Profile tatsächlich als optionales Systemmodul extrahieren

Der bisherige Compatibility-Bridge-Zustand reicht nicht für Core Freeze.

## Ziel

`Profile` muss als eigenständiges optionales Systemmodul existieren. Der Core darf Profile fachlich nicht mehr voraussetzen.

## Profile-Modul enthält mindestens

- `display_name`
- `gender` mit stabilen Werten mindestens `male`, `female`, `unspecified`
- `birthday`
- Profilbild/Avatar
- profilbezogene Privacy-/Visibility-Einstellungen
- Organization-Sharing-bezogene Profileinstellungen, soweit fachlich tatsächlich Profile zugehörig

## Verbindliche Regeln

- Neutral Core muss mit deaktiviertem oder nicht installiertem Profile-Modul funktionieren.
- Kein Core-Pfad darf `display_name`, Geburtstag, Geschlecht oder Profilbild voraussetzen.
- Andere Module dürfen Profile optional nutzen, aber müssen ohne Profile sauber weiterlaufen.
- Fallbacks: technische User-ID / Username / neutraler generischer Anzeigename, soweit nötig.
- Profile kann als aktives **unsichtbares Systemmodul** laufen, ohne eigenen Hauptnavigationseintrag.
- bestehende Profile-Daten müssen nicht-destruktiv migriert/übernommen werden.
- bestehende User dürfen durch die Extraktion keine Daten verlieren.

## Abnahme

- Profile aktiviert → bestehende Funktionen weiterhin verfügbar.
- Profile deaktiviert → Core, Login, Admin, Packages, Licenses, Sessions, GPS, Backup usw. funktionieren weiter.
- Profile wieder aktiviert → vorhandene Profildaten bleiben erhalten.
- kein 500/JS-Fehler durch fehlende Profile-Fähigkeit.

---

# 3. Profilbild als erste konkrete Media-Anwendung

Profilbild-Upload ist Bestandteil des Profile-Moduls, soll aber auf generischer Media-/Upload-Infrastruktur beruhen.

## Profilbild-Vertrag

- Bild auswählen/hochladen
- quadratischer Zuschnitt
- optimierte gespeicherte Version max. **256×256 px**
- effizientes Webformat bevorzugen
- Original nach Verarbeitung nicht dauerhaft speichern
- serverseitig persistent speichern
- lokal cachen
- Darstellung immer rund
- ersetzen/löschen möglich
- Backup/Restore muss Datei + Metadaten mitführen
- kein eigenes Bild:
  - `male` → neutraler männlicher Default-Avatar
  - `female` → neutraler weiblicher Default-Avatar
  - `unspecified` → neutraler allgemeiner Default-Avatar
- Default-Avatare nicht pro User speichern, sondern dynamisch rendern

Keine Community-spezifische Darstellung in Profile einbauen.

---

# 4. Generische Media-/Upload-Fähigkeit vervollständigen

Uploads sollen nicht profilspezifisch verdrahtet werden.

Prüfe und implementiere die sauberste modulare Grenze:

- Core nur minimal zwingende sichere File-/Storage-Primitives
- darüber optionales Media-/Upload-Systemmodul bzw. klarer generischer Modulservice

Benötigt werden mindestens:

- Upload-Endpunkt/API
- Auth/Permission-Prüfung
- MIME-/Dateityp-Prüfung
- Größenlimits
- sichere IDs/Namen
- erlaubte Storage-Ziele
- Bildoptimierung/Resize
- Metadaten
- Ersetzen/Löschen
- Backup/Restore-Integration
- lokale Cache-Unterstützung
- Schutz gegen Traversal, Symlink-Escape, ausführbare Uploads und manipulierte Dateien

Das jeweilige Fachmodul entscheidet selbst über zulässige Anzahl, Größen, Verwendungszweck und fachliche Zuordnung.

---

# 5. Sharing / Visibility als optionales Systemmodul sauber definieren

Sharing ist **keine Core-Fachlogik**.

Das optionale Systemmodul soll generisch ermöglichen:

- Module registrieren teilbare Ressourcen/Felder selbst.
- Default immer `private`.
- generische Sichtbarkeitsstufen, z. B. `private`, `organization`, `community`, `public`, erweiterbar.
- serverseitige Autorisierung zwingend.
- Sharing funktioniert ohne Profile.
- andere Module funktionieren auch ohne Sharing; Funktionen werden dann sauber ausgeblendet/fallen zurück.
- Core/Sharing kennt keine Begriffe wie catch, fish, location, note usw.

Sensitivitäts-/Approximation-Logik bleibt Sache des Fachmoduls. Beispiel: exakte vs. ungefähre Location darf nicht im Core oder Sharing-Modul fachlich verdrahtet werden.

---

# 6. Notifications, Moderation und Postbox als unabhängige optionale Module kontraktfest machen

## Notifications

- In-App-Notification/Popup
- E-Mail
- Kanalwahl pro berechtigtem User/Admin
- keine Pflichtabhängigkeit zu anderen Modulen
- optional sofort/gebündelt, falls sauber machbar

## Moderation / Content Review

- Review-Queue für Texte/Bilder
- `pending`, `approved`, `rejected`
- Texte editierbar
- Bilder ansehen/freigeben/ablehnen/löschen
- Filter nach User, Modul, Datum, Typ, Status
- Module können Reviewpflicht deklarieren
- optional Auto-Approval
- funktioniert ohne Notifications/Postbox

## Postbox

Modul-Key `postbox`, Anzeigename **Postbox**.

Funktionen:

- Inbox / Sent
- lesen/schreiben/antworten
- gelesen/ungelesen
- optional Anhänge/Bilder
- Einzeluser
- mehrere User
- Rollen/Gruppen
- eigene Organization/License
- Broadcast/Rundmail nur mit eigener Permission

Admin-Konfiguration:

- maximale Nachrichtenlänge
- Bilder/Anhänge an/aus
- maximale Anzahl/Dateigröße/Dateitypen
- Rollenrechte für read/write/reply/attachments/group-send/broadcast
- maximale Empfängerzahl
- optional Bestätigung vor Rundsendung
- optional Aufbewahrungsdauer

Organization-Manager dürfen ausschließlich Mitglieder ihrer eigenen Organisation erreichen. Plattform-Admins nur mit entsprechender Permission organisationsübergreifend.

Postbox muss ohne Profile, Community, Moderation und Notifications funktionieren. Media/Notifications dürfen optional genutzt werden.

---

# 7. Modulabhängigkeiten strikt minimieren

Verbindliche Regel:

> **Module sollen Core-Fähigkeiten konsumieren, nicht andere Module voraussetzen.**

Nur fachlich zwingende Abhängigkeiten dürfen existieren. Dann müssen sie explizit im Manifest deklariert und im Admin/Installer sichtbar sein.

Mindestens sicherstellen:

- Profile ≠ Core-Abhängigkeit
- Sharing ≠ Profile-Abhängigkeit
- Media ≠ Profile-Abhängigkeit
- Postbox ≠ Notifications-Abhängigkeit
- Moderation ≠ Notifications/Postbox-Abhängigkeit

Fehlt ein optional genutztes Modul:

- betreffende Zusatzfunktion ausblenden oder Fallback verwenden
- keine Fehlerkaskade
- kein 500
- Hauptfunktion bleibt nutzbar

---

# 8. Unsichtbare/Systemmodule praktisch absichern

Manifest/Registry muss sauber unterscheiden können:

- installiert
- aktiviert
- sichtbar in User-Navigation
- sichtbar im Admin
- unsichtbares System-/Capability-Modul

Admin muss Module aktivieren/deaktivieren können. Ein aktives Modul darf **keinen sichtbaren User-Menüpunkt** benötigen.

Profile ist das erste reale Abnahmebeispiel dafür.

---

# 9. User-Login-Eye Restfehler erneut prüfen

Betreiber-Livecheck nach letztem Deployment:

- alles andere bestätigt
- **User-Login-Auge weiterhin offen**

Daher:

- User-Login muss denselben zentralen Password-Visibility-Helper wie Admin/andere Felder verwenden
- echtes Eye-Icon
- iPad/Chrome explizit prüfen
- Offline-/Precache-Pfad mitprüfen

Diesen kleinen Restfehler im selben Lauf beheben, ohne die Architekturarbeit zu verwässern.

---

# 10. Bestehende bestätigte Funktionen nicht regressieren

Mindestens regressionsprüfen:

- User/Admin Login
- Admin-Login-Auge
- Success-Modals
- direkte Package-Zuordnung für Einzeluser
- License-Package-Priorität
- Fallback auf direktes User-Package nach License-Entfernung
- Device-Limits
- Packages/Licenses/Organization
- Sessions/Installation-ID
- Birthday-Persistenz
- Organization-Sharing-Gating
- Settings Auth-Sichtbarkeit
- Navigation Active-State
- GPS
- Audit
- Backup Storage Path
- Backup V2 / Backup Contract Complete

Kein Production-Restore.

---

# 11. Field Notes bewusst noch nicht als eigentlichen Beweistest bauen

`Field Notes` bleibt das nächste separate Freeze-Gate nach diesem Auftrag.

Geplanter Testumfang bleibt:

- eigenes Manifest
- eigene Route/Navigation
- eigene Permissions
- eigene DB-Tabelle
- Create/Edit/Delete
- Settings
- i18n
- Theme
- Backup/Restore
- Offline-Grundvertrag
- optional Media/Sharing nutzen, ohne davon abhängig zu sein

**Harte Regel für den späteren Auftrag:** Keine Änderung bestehender Core-Dateien. Falls Field Notes Core-Änderungen benötigt, ist Neutral noch nicht freeze-reif.

In diesem Auftrag nur die Architektur so vorbereiten, dass dieser Test anschließend realistisch möglich ist.

---

# 12. Dokumentation / Readiness

Mindestens aktualisieren, soweit betroffen:

- `CHATGPT.md`
- `SYSTEM-MODULES.md`
- `VISION.md`
- `Architecture.md`
- `UI-UX.md`
- `Security.md`
- `API.md`
- `Database.md`
- `Functions.md`
- `BACKUP-CONTRACT.md`
- `CORE-1.0-READINESS.md`
- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- `ADMIN-UX-DECISIONS.md`

Keine automatische Freeze-Erklärung.

Core Freeze bleibt blockiert, bis mindestens:

1. Profile wirklich optional extrahiert ist und deaktiviert getestet wurde.
2. Systemmodul-Verträge belastbar sind.
3. Field Notes später ohne Core-Änderung implementiert wurde.
4. offene Host-/Operator-Gates ehrlich abgeschlossen sind.

---

# 13. Verifikation / Deployment

Gemäß `WORKFLOW.md`:

1. vollständige Tests
2. PHP-Lint
3. JS-Syntax
4. `git diff --check`
5. Production package
6. commit/push `main`
7. CI/CodeQL/FTPS terminal abwarten
8. `HEAD == origin/main`, sauberer Tree
9. Deploymentrevision + `migrationsReady:true` prüfen
10. Production-Smokes nur read-only
11. keine destruktiven Produktionsaktionen
12. `CHATGPT.md` mit tatsächlichem Endstand und klarer Betreiber-Retestliste aktualisieren

Betreiber-Retestliste danach kurz halten:

- Profile aktiviert → Daten/Funktionen vorhanden
- Profile deaktiviert → Core/App weiterhin stabil
- Profile wieder aktiviert → Daten erhalten
- Profilbild Upload/Replace/Delete/runde Darstellung
- Gender + Default-Avatar
- User-Login-Auge auf iPad
- keine Regression bei Packages/Licenses/Device-Limits/Success-Modals

Nichts ohne echten Test als `LIVE BESTANDEN` markieren.

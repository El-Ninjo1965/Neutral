# NEUTRAL – CODEX HANDOFF

**Richtung:** ChatGPT/Lea → Codex  
**Status:** AKTIVER ARCHITEKTUR-/NACHBESSERUNGSAUFTRAG – MINIMALER CORE + OPTIONALE SYSTEMMODULE + USER-LOGIN-EYE  
**Datum:** 2026-09-11

# Betreiber-Livebefund / Produktentscheidungen

Der aktuelle Produktionsstand wurde real auf iPad/Chrome geprüft.

## Bereits live bestätigt / nicht regressieren

- Admin-Login-Auge funktioniert.
- direkte Package-Zuordnung für Einzeluser funktioniert.
- aktive License-Package-Priorität funktioniert.
- nach Entfernen der License greift das direkte User-Package wieder.
- Device-Limit-Vererbung funktioniert.
- Success-Modal funktioniert.
- User-/Admin-Login funktionieren grundsätzlich.
- Packages/Licenses/Organization-Zuordnungen funktionieren im geprüften Umfang.
- Backup Storage Path funktioniert auf realem Host.
- Backup V2 ist code-/isoliert als `BACKUP CONTRACT COMPLETE` verifiziert und deployed.
- Birthday-Persistenz funktioniert im Betreibercheck.
- Organization-Sharing ist serverseitig gated.
- Active-State-Navigation ist implementiert.

## Noch offener Livefehler

- Im normalen **User-Login** fehlt der Passwort-Eye-Toggle weiterhin. Admin-Login und andere Passwortfelder funktionieren.

## Neue verbindliche Architekturentscheidung

Neutral soll vor dem Core-Freeze stärker modularisiert werden:

> **Core = ausschließlich notwendige technische Mechanismen. Konkrete Funktionen = Module.**

Eine Neutral-App muss vollständig lauffähig sein, auch wenn optionale Module wie Profile, Sharing, Community, Postbox, Moderation oder Notifications nicht installiert/aktiviert sind.

Keine unnötigen Modul-zu-Modul-Abhängigkeiten erzeugen. Module dürfen Core-Fähigkeiten nutzen, aber unabhängige Module dürfen sich nicht gegenseitig voraussetzen, sofern fachlich nicht zwingend.

---

# 1. Pflicht-Preflight

1. Mit `origin/main` synchronisieren.
2. Vollständig lesen: `CHATGPT.md`, `CODEX.md`, `CURRENT-TASK.md`, `VISION.md`, `CORE-1.0.md`, `CORE-1.0-READINESS.md`, `ADMIN-UX-DECISIONS.md`, `USER-ACCOUNT-LICENSE-MODEL.md`, `UI-UX.md`, `Architecture.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md`, `STATUS.md`, `TODO.md`, `ToDoNow.md`, `WORKFLOW.md`, `BACKUP-CONTRACT.md` sowie relevante Module/Registry/Settings/Profile/Privacy/Media/Auth/Event/Notification-Dateien.
3. Auftrag vollständig nach `CURRENT-TASK.md` übernehmen.
4. Keine CatchTrack-spezifische Fachlogik in den Core aufnehmen.
5. Keine Secrets/PII ausgeben oder committen.
6. Keine destruktiven Produktionsaktionen und keinen Production-Restore.

---

# 2. Sofortiger Restfix – User-Login Passwort-Auge

Der User-Login besitzt weiterhin keinen sichtbaren Show/Hide-Toggle.

Anforderungen:

- denselben zentralen Password-Visibility-Vertrag verwenden wie Admin-Login und übrige Passwortfelder;
- echtes Eye-Icon, nicht Punkt/Kreis;
- hidden = durchgestrichen/geschlossen, visible = offen;
- Touchfläche ausreichend groß;
- `aria-label` Show/Hide password;
- i18n-fähig;
- keine Sonderimplementierung nur für diesen Screen, sondern denselben wiederverwendbaren Helper/Component-Pfad verwenden;
- iPad/Chrome explizit regressionsprüfen.

---

# 3. Core-Grenze neu prüfen und minimalisieren

## Ziel

Der Core soll nur Mechanismen enthalten, die praktisch jede Neutral-App benötigt oder ohne die das Modulsystem nicht funktionieren kann.

Im Core dürfen bleiben bzw. generisch bereitgestellt werden:

- Modul-Loader / Registry / Manifest-Vertrag;
- Auth-/Account-Grundlage, soweit Core-Betrieb erforderlich;
- User-ID / technische Identität;
- Rollen-/Permission-Engine;
- generische Settings-Infrastruktur;
- generische DB-/Storage-Schnittstellen;
- Event-/Hook-/Capability-System;
- Navigation-/Routing-Grundlage;
- Theme-/UI-Basis;
- Backup-/Restore-Mechanismus und generische Moduldaten-Discovery;
- Sicherheits-/API-Grundverträge;
- minimal notwendige File-/Storage-Sicherheitsmechanismen, falls sonst kein Upload-Modul sicher implementierbar ist.

Alles, was eine konkrete fachliche Funktion darstellt, soll – soweit technisch sauber möglich – als Modul realisiert werden.

Wichtig:

- keine versteckten Abhängigkeiten;
- deaktiviertes/fehlendes Modul darf Core und unabhängige Module nicht beschädigen;
- Module dürfen unsichtbar sein: technisch aktiv, aber ohne User-Menüpunkt;
- Admin entscheidet, welche Module aktiv/sichtbar sind;
- `visibleInUserNavigation=false` bzw. äquivalenter Manifestvertrag muss möglich sein.

---

# 4. Profile aus dem Core lösen / als optionales Systemmodul vorbereiten

## Produktentscheidung

`Profile` soll **kein Core-Zwang** sein. Jede App muss ohne Profile-Modul funktionieren können.

Profile-Modul enthält bzw. soll enthalten:

- `display_name`;
- `gender` mit stabilen Werten mindestens `male`, `female`, `unspecified`;
- `birthday`;
- Profilbild / Avatar;
- Profil-Privacy/Visibility;
- ggf. Organization-Sharing-bezogene Profileinstellungen;
- spätere Community-Nutzung der freigegebenen Profilfelder.

## Profilbild

Profilbild-Upload nicht vergessen.

Verbindlicher Vertrag:

- User kann Bild auswählen/hochladen;
- quadratischer Zuschnitt;
- optimierte gespeicherte Version max. **256×256 px**;
- bevorzugt effizientes Webformat, ohne unnötige Qualitätsverluste;
- Original nach Verarbeitung nicht dauerhaft behalten;
- serverseitig persistent speichern, lokal cachen;
- Darstellung immer rund;
- Bild ersetzen/löschen möglich;
- Backup/Restore muss die gespeicherte Datei mitführen;
- kein eigenes Bild → Default-Avatar abhängig von `gender`:
  - male → neutraler männlicher Avatar;
  - female → neutraler weiblicher Avatar;
  - unspecified → neutraler allgemeiner Avatar.
- Default-Avatar selbst nicht pro User speichern; dynamisch anhand des Feldes rendern.

Wichtig:

- Core darf `display_name`, birthday, gender oder profile image nicht voraussetzen;
- fehlen Profildaten, müssen andere Module mit technischen Fallbacks funktionieren;
- Profilmodul kann aktiv sein, ohne als eigener sichtbarer User-Menüpunkt aufzutauchen.

---

# 5. Generische Upload-/Media-Fähigkeit so modular wie möglich

## Ziel

Uploads/Bilder/Dateien sollen generisch nutzbar sein, ohne dass der Core konkrete Profilbild-, Community- oder Fangfoto-Logik kennt.

Prüfe die sauberste Grenze:

- Core nur minimal notwendige sichere Storage-/File-Primitives;
- darüber optionales **Media/Upload-Systemmodul** oder generischer Modulservice.

Benötigte Fähigkeiten:

- Upload-Endpunkt/API;
- Auth/Permission-Prüfung;
- MIME-/Dateityp-Prüfung;
- Größenlimits;
- sichere Datei-IDs/-namen;
- erlaubte Storage-Ziele;
- Bildoptimierung/Resize;
- Metadaten;
- Ersetzen/Löschen;
- Backup/Restore-Integration;
- lokale Cache-Unterstützung;
- Schutz gegen Traversal, Symlink-Escape, ausführbare Uploads und manipulierte Dateien.

Das jeweilige Fachmodul entscheidet:

- welche Dateien/Bilder erlaubt sind;
- wie viele;
- welche Maximalgröße innerhalb Core/Systemgrenzen;
- fachliche Zuordnung/Owner;
- Darstellung/Verwendung;
- Sharing-Regeln.

Damit müssen später Texte/strukturierte Daten und Bilder/Dateien beliebig kombinierbar sein.

---

# 6. Sharing / Visibility als optionales Systemmodul, nicht als Fachlogik im Core

## Produktentscheidung

Der Core soll keine fachlichen Sharing-Felder kennen. Wenn Sharing nicht zwingend Core sein muss, als optionales **Sharing/Visibility-Systemmodul** realisieren.

Anforderungen:

- generischer Mechanismus, keine Begriffe wie catch, fish, location, note usw.;
- Module können teilbare Ressourcen/Felder registrieren;
- Default immer `private`;
- mögliche Sichtbarkeitsstufen generisch, z. B. `private`, `organization`, `community`, `public` bzw. erweiterbar;
- serverseitige Autorisierung zwingend;
- Sharing-Modul muss ohne Profile funktionieren;
- andere Module sollen Sharing optional nutzen können, aber bei fehlendem Sharing-Modul weiterhin funktionieren;
- Modul entscheidet selbst, was fachlich eine eingeschränkte/ungefähre Freigabe bedeutet.

Beispiel nur zur Architekturprüfung, **nicht als CatchTrack-Corelogik implementieren**:

- genaue vs. ungefähre Location wäre Sache des jeweiligen Fachmoduls;
- exakte sensible Position nur nach ausdrücklicher Zustimmung;
- Core/Sharing kennt lediglich den generischen Freigabevertrag.

---

# 7. Moderation / Content Review als optionales Modul

Eigenständiges Modul `Moderation` oder `Content Review`.

Admin-Funktionen:

- Review-Queue für hochgeladene Texte und Bilder;
- Status mindestens `pending`, `approved`, `rejected`;
- Texte im Admin editierbar;
- Bilder ansehen, freigeben, ablehnen, optional löschen;
- Filter nach User, Modul, Datum, Content-Typ, Status;
- Module können deklarieren, ob ihre Inhalte reviewpflichtig sind;
- optional Auto-Approval konfigurierbar;
- keine Pflichtabhängigkeit zu Community.

Moderation soll Notifications/Postbox nutzen können, wenn vorhanden, aber ohne diese Module weiterhin funktionieren.

---

# 8. Notifications als optionales Modul

Eigenständiges Modul `Notifications`.

Mindestens:

- In-App-Popup/Notification;
- E-Mail;
- pro Admin/User konfigurierbar, soweit Rolle/Permission es erlaubt;
- Kanalwahl: Mail, Popup, beides, nichts;
- später erweiterbar um weitere Kanäle;
- optional sofort oder gebündelt (z. B. stündlich/täglich), falls bestehende Infrastruktur dies sauber trägt;
- keine Pflichtabhängigkeit zu Moderation oder Postbox.

Moderation kann darüber z. B. neue Content-Items melden.
Postbox kann neue Nachrichten darüber ankündigen.

---

# 9. Postbox als optionales, rollenbasiertes Messaging-Modul

Modul-Key: `postbox`  
Anzeigename: **Postbox**

## Ziel

Generisches internes Postfach für alle Benutzer, gesteuert ausschließlich über Rollen/Permissions.

Funktionen:

- Inbox / Sent;
- Nachricht lesen;
- Nachricht schreiben;
- antworten;
- gelesen/ungelesen;
- optional Bilder/Anhänge;
- Einzeluser anschreiben;
- mehrere ausgewählte User;
- Rollen/Gruppen;
- alle Mitglieder einer eigenen Organization/License;
- Broadcast/Rundmail nur mit eigener Permission.

## Rollen/Permissions

Mindestens getrennt steuerbar:

- read;
- write;
- reply;
- attachments;
- send-to-role/group;
- organization broadcast;
- global broadcast;
- admin/system messages.

Ein Vereins-/Organization-Manager darf ausschließlich User der eigenen Organisation erreichen. Plattform-Admins dürfen organisationsübergreifend senden, aber nur mit entsprechender Permission.

## Admin-Konfiguration

- maximale Nachrichtenlänge;
- Bilder/Anhänge erlaubt an/aus;
- maximale Anzahl Bilder/Anhänge;
- maximale Dateigröße;
- erlaubte Dateitypen;
- Rollen mit Lese-/Schreib-/Antwortrechten;
- Rollen mit Broadcast-Rechten;
- maximale Empfängerzahl für Rundsendungen;
- optional Bestätigung vor Massenversand;
- optional Aufbewahrungsdauer.

Broadcasts sollen auditiert werden.

Postbox muss ohne Profile, Community, Moderation und Notifications funktionieren. Sind Media/Notifications vorhanden, darf Postbox diese optional nutzen.

---

# 10. Modulabhängigkeiten strikt minimieren

Verbindliche Regel:

> **Module sollen Fähigkeiten des Core konsumieren, nicht andere Module voraussetzen.**

Nur wenn fachlich zwingend, darf eine explizite Modulabhängigkeit existieren. Dann muss sie im Manifest eindeutig deklariert und vom Admin/Installer verständlich angezeigt werden.

Beispiele:

- Profile darf nicht Voraussetzung für Core sein.
- Sharing darf nicht Profile voraussetzen.
- Postbox darf nicht Notifications voraussetzen.
- Moderation darf nicht Notifications/Postbox voraussetzen.
- Media darf nicht Profile voraussetzen.

Fehlt ein optional verwendetes Modul:

- Funktion sauber ausblenden oder Fallback nutzen;
- keine Fehlerkaskade;
- kein 500;
- unabhängige Hauptfunktion bleibt nutzbar.

---

# 11. Unsichtbare/Systemmodule unterstützen

Admin muss Module aktivieren/deaktivieren können, ohne dass jedes aktive Modul zwingend als User-Menüpunkt erscheint.

Manifest/Registry soll mindestens unterscheiden können zwischen:

- installiert;
- aktiviert;
- für User-Navigation sichtbar;
- ggf. nur Admin sichtbar;
- ggf. komplett unsichtbares System-/Capability-Modul.

Beispiel: `Profile` kann aktiv sein und Settings/Profile-Funktionen liefern, ohne als eigener Modul-Button in der Hauptnavigation aufzutauchen.

---

# 12. Field Notes als verbindliches Testmodul für die Neutral-Vision vormerken

Testmodul: **Field Notes**

Zweck: beweisen, dass ein neues neutrales Modul ohne Core-Änderung erstellt werden kann.

Geplanter Funktionsumfang:

- eigene Modulmanifest-Datei;
- eigene Route/Navigation;
- eigene Permissions (`fieldnotes.view/create/edit/delete` oder äquivalent);
- eigene DB-Tabelle;
- Notiztitel;
- Notiztext;
- Datum/Uhrzeit;
- optional Standort;
- Create/Edit/Delete;
- eigene Settings;
- i18n;
- Theme/Core-Komponenten;
- Backup/Restore;
- Offline-tauglicher Grundvertrag;
- optional Media/Sharing nutzen, falls diese Module vorhanden sind, aber nicht davon abhängig sein.

**Harte Abnahmeregel:** Field Notes soll nach Abschluss der Architekturarbeit ohne Änderung bestehender Core-Dateien implementierbar sein. Wenn dafür Core-Sonderänderungen nötig sind, ist die Modularchitektur noch nicht freeze-reif.

Field Notes jetzt nur dann implementieren, wenn der Architekturauftrag es zur Verifikation sinnvoll benötigt; andernfalls als unmittelbar folgenden Freeze-Test dokumentieren.

---

# 13. Bestehende funktionierende Bereiche nicht regressieren

Mindestens regressionsprüfen:

- User/Admin Login;
- User-Login-Eye;
- Admin-Login-Eye;
- User Create/Edit;
- direkte User-Package-Zuordnung;
- License-Package-Priorität/Fallback;
- Device Limits;
- Success-Modals;
- Birthday;
- Organization-Sharing-Gating;
- Settings Auth-Sichtbarkeit;
- Navigation Active-State;
- ACCESS-Reihenfolge;
- Sessions/Installation-ID;
- Audit;
- GPS;
- Backup Storage Path;
- Backup V2 Create/Download/isolierter Restore-Vertrag;
- PHP-Lint;
- JS-Syntax;
- `git diff --check`;
- vollständige Tests;
- Production package.

---

# 14. Dokumentation / Architekturvertrag

Mindestens aktualisieren:

- `CHATGPT.md`
- `VISION.md`
- `CORE-1.0.md`
- `CORE-1.0-READINESS.md`
- `ADMIN-UX-DECISIONS.md`
- `UI-UX.md`
- `Architecture.md`
- `Security.md`
- `API.md`
- `Database.md`
- `Functions.md`
- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- `WORKFLOW.md`
- Modul-/Manifest-Dokumentation, falls vorhanden

Dauerhaft festhalten:

1. Core = technische Mechanismen, konkrete Funktionen = Module.
2. Apps müssen ohne Profile/Sharing/Postbox/Moderation/Notifications/Community funktionieren.
3. Module können aktiv aber userseitig unsichtbar sein.
4. Modulabhängigkeiten sind Ausnahme, nicht Standard.
5. Profile ist optionales Systemmodul.
6. Sharing/Visibility ist optionales generisches Systemmodul, sofern technisch möglich.
7. Media/Upload wird so modular wie sicher vertretbar realisiert.
8. Postbox ist optionales rollenbasiertes Messaging-Modul.
9. Moderation und Notifications sind eigenständige optionale Module.
10. Field Notes ist der vorgesehene Neutralitäts-/Modularitätstest vor Freeze.

Keine automatische Freeze-Erklärung.

---

# 15. Deployment / Übergabe

Gemäß `WORKFLOW.md`:

1. commit/push `main`;
2. CI/CodeQL/FTPS terminal abwarten;
3. `HEAD == origin/main`, sauberer Tree;
4. Deploymentrevision + `migrationsReady:true` prüfen;
5. Production-Smokes ausschließlich read-only;
6. keine destruktiven Produktionsaktionen;
7. keinen Production-Restore;
8. `CHATGPT.md` mit tatsächlichem Endstand, Architekturentscheidungen und Restliste aktualisieren.

## Betreiber-Retestliste danach kurz halten

- User-Login-Auge sichtbar/funktional;
- bestehende User/Admin/Package/License-Funktionen unverändert;
- falls bereits modularisiert: Profile deaktivierbar ohne Core-/App-Fehler;
- unsichtbares aktives Modul ohne User-Menüpunkt verifizieren;
- optionale Module deaktivieren → Core bleibt stabil;
- ggf. Status des Field-Notes-Freeze-Tests mitteilen.

Nichts ohne realen Betreibercheck als `LIVE BESTANDEN` markieren.

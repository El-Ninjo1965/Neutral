# NEUTRAL – Betreiberentscheidungen und Livebefunde 2026-09-11

**Status:** VERBINDLICHER INPUT FÜR DEN NÄCHSTEN DOKUMENTATIONS-KONSISTENZLAUF  
**Zweck:** Produkt-/UX-Entscheidungen und reale Betreiberbefunde festhalten, bevor technische Vertragsdateien gegen den Code synchronisiert werden.

Diese Datei ist bewusst ein Übergabedokument. Sie ersetzt nicht `VISION.md`, `Architecture.md`, `ModuleCreation.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md` oder andere autoritative Verträge. Codex muss die hier festgehaltenen Entscheidungen im nächsten Dokumentationslauf an die jeweils richtige autoritative Stelle überführen und diese Übergabedatei danach entweder als historisches Protokoll kennzeichnen oder nach vollständiger Übernahme entfernen.

## 1. Verbindliches Neutral-Prinzip

- Core enthält nur zwingend notwendige technische Mechanismen.
- Konkrete Funktionen werden soweit technisch sauber möglich als Module realisiert.
- Eine App muss ohne optionale Funktions-/Systemmodule lauffähig bleiben.
- Keine unnötigen Modul-zu-Modul-Abhängigkeiten.
- Module dürfen Core-Fähigkeiten konsumieren; optionale Zusatzmodule dürfen nur als Enhancement genutzt werden.
- Fehlt ein optionales Modul, muss die unabhängige Hauptfunktion weiterlaufen; Zusatzfunktion ausblenden oder kontrollierter Fallback, kein 500/Fehlerkaskade.
- Aktive Module müssen nicht automatisch einen User-Menüpunkt besitzen. Unsichtbare System-/Capability-Module sind ausdrücklich vorgesehen.

## 2. Profile als optionales Systemmodul

Profile ist kein Core-Zwang. Eine Neutral-App muss ohne Profile funktionieren.

Profile soll fachlich mindestens besitzen:

- `display_name`;
- `gender` mit mindestens `male`, `female`, `unspecified`;
- `birthday`;
- Profilbild/Avatar;
- profilbezogene Privacy-/Visibility-Einstellungen;
- Organization-Sharing-bezogene Profileinstellungen, soweit tatsächlich profilbezogen.

Kein Core-Pfad darf diese Felder voraussetzen. Andere Module dürfen Profile optional verwenden.

### Profilbild

- Upload durch User;
- quadratischer Zuschnitt;
- gespeicherte optimierte Version maximal 256×256 px;
- Original nach Verarbeitung nicht dauerhaft speichern;
- serverseitig persistent, lokal cachebar;
- immer rund darstellen;
- ersetzen/löschen möglich;
- Backup/Restore berücksichtigen;
- ohne eigenes Bild dynamischer neutraler Default-Avatar nach Gender: male/female/unspecified;
- Default-Avatar nicht pro User speichern.

## 3. Generische optionale Systemmodule

Folgende Funktionen sollen als eigenständige optionale Module/Systemmodule behandelt werden, nicht als Fachlogik im Core:

- Profile
- Media / Upload
- Sharing / Visibility
- Notifications
- Moderation / Content Review
- Postbox

Community und spätere Fachmodule bleiben ebenfalls Module.

### Media / Upload

Generischer Upload-/Medienvertrag; keine Profilbild-, Community- oder CatchTrack-Sonderlogik. Sichere Uploadprüfung, MIME/Dateityp, Limits, sichere IDs, Storage, Bildoptimierung, Metadaten, Replace/Delete, Backup/Restore und Cachefähigkeit. Fachmodule definieren Verwendung und fachliche Limits.

### Sharing / Visibility

Generischer Freigabemechanismus; Core kennt keine fachlichen Begriffe. Default `private`. Sichtbarkeitsstufen generisch/erweiterbar. Serverautorisierung zwingend. Module definieren selbst, was geteilt wird und wie fachliche Reduktionen wie ungefähre statt exakte Position funktionieren.

### Moderation / Content Review

Admin-Review für Texte/Bilder mit mindestens pending/approved/rejected. Texte editierbar, Bilder ansehen/freigeben/ablehnen/löschen. Filter nach User, Modul, Datum, Typ und Status. Notifications/Postbox optional nutzbar, aber keine Pflichtabhängigkeit.

### Notifications

In-App/Popup und E-Mail als optionale Kanäle. Berechtigte User/Admins können Kanäle konfigurieren. Keine Pflichtabhängigkeit zu Moderation oder Postbox.

### Postbox

Allgemeines rollenbasiertes Postfach für User/Admin/Organisationen:

- Inbox/Sent, lesen, schreiben, antworten, gelesen/ungelesen;
- Einzeluser, mehrere User, Rollen/Gruppen, eigene Organisation;
- Broadcast/Rundmail nur mit separater Permission;
- Organization-Manager nur innerhalb eigener Organisation;
- Plattform-Admin organisationsübergreifend nur mit Permission;
- Nachrichtenlänge, Anhänge/Bilder, Anzahl, Dateigröße/-typen, Empfängerlimit und ggf. Aufbewahrung administrativ konfigurierbar;
- Broadcast auditieren;
- funktioniert ohne Profile, Community, Moderation und Notifications.

## 4. Module Administration: Visibility getrennt von Permissions

Verbindliche UX-/Architekturentscheidung:

- Permissions regeln, **was** eine Rolle technisch darf.
- Visibility/Navigation regelt getrennt, **ob** ein Modul bzw. dessen User-Navigation für eine Rolle sichtbar ist.
- Module Administration benötigt dafür einen eigenen Bereich `Visibility` / `Navigation` oder äquivalent.
- Steuerung mindestens pro Rolle Admin, Developer, User, Viewer, soweit die Rolle für die jeweilige UI relevant ist.
- Ein Modul kann aktiv und technisch nutzbar sein, aber für bestimmte Rollen keinen sichtbaren Navigationseintrag besitzen.
- Systemmodule können vollständig ohne User-Navigation aktiv sein.
- Visibility darf niemals serverseitige Permissions ersetzen oder Rechte erteilen.

## 5. Standalone-/Self-Test-Vertrag

GPS besitzt aktuell als einziges reales Modul einen deklarierten Standalone-Test. Die bestehende Infrastruktur soll als Referenz geprüft werden.

Entscheidung:

- `ModuleCreation.md` muss klar dokumentieren, wann ein Standalone-/Self-Test sinnvoll bzw. erforderlich ist.
- Für neue Systemmodule ist zu prüfen, ob ein standardisierter Testentry sinnvoll und sicher möglich ist.
- Ein Standalone-Test ersetzt keine Server-, Permission-, DB-, Lifecycle- oder Live-Prüfung.
- Field Notes bleibt der spätere harte Neubau-/Freeze-Test: neues unabhängiges Modul ohne Core-Sonderänderung.

## 6. User Management UX

Auf kleinen Screens ist die gleichzeitige Darstellung von `User Management`-Liste und `Edit User` unpraktisch.

Gewünschter Vertrag:

- Userliste und User-Edit als getrennte Ansichten/States;
- Klick auf Edit öffnet die Edit-Ansicht ohne die komplette Liste darüber;
- nach erfolgreichem Save zurück zur Userliste;
- Cancel/Back ebenfalls kontrolliert zurück;
- keine unnötig lange Scrollstrecke durch doppelte Content-Blöcke;
- responsive/mobile-first.

## 7. Reale Livebefunde nach Commit 4dae2b5a

Diese Befunde stammen aus realen Betreiberchecks auf iPad/Browser und haben Vorrang vor lokalen grünen Tests.

### Nicht bestanden

1. **User-Login Eye:** Im normalen User-Login fehlt der Passwort-Show/Hide-Eye-Toggle weiterhin, sowohl im normalen als auch privaten Browsermodus.
2. **Unlimited Devices:** Ein User mit direkt wirksamem Package `Admin`, dessen `Default devices per user` = Unlimited ist, wurde bei zwei aktiven Sessions wegen überschrittenem Device-Limit am Login gehindert. Die UI zeigte sinngemäß `2 of 0 sessions`. Verdacht: Unlimited/Null-Semantik wird an mindestens einem Pfad fälschlich als 0 erlaubte Geräte interpretiert. Ursache technisch prüfen, nicht nur UI patchen.
3. **Profile Lifecycle:** `Profile` ist registered/inactive; Aktivierung über Module Administration schlägt live mit `Activation failed: Internal Server Error` fehl. Profile/Privacy erscheinen deshalb im User-Settings-Test nicht. Permissions waren vorhanden (`profile.view`, `profile.update` für Admin/Developer/User), daher ist ein bloß fehlendes Rollenrecht keine ausreichende Erklärung.
4. **Media & Upload Lifecycle:** Ausgang `Discovered / Not registered`; `Install` schlägt live mit `Install failed: Load failed` fehl.

### Lifecycle live bestanden

Folgende Module konnten real jeweils installiert, aktiviert, deaktiviert und erneut aktiviert werden:

- Moderation
- Notifications
- Postbox
- Sharing & Visibility

Nach dem Test wurden diese Module wieder deaktiviert; GPS blieb als einziges aktives Produkt-/Referenzmodul stehen. Diese Aussage betrifft den technischen Lifecycle, **nicht** die vollständige Fachfunktion oder UI dieser Systemmodule.

### Beobachtung Module Details

- Modul-Details zeigen Lifecycle, Registration, Pfad, Permissions und ggf. Standalone-Test.
- Profile zeigt keinen Standalone-Test.
- Sharing & Visibility zeigt keinen Standalone-Test.
- GPS besitzt einen funktionierenden deklarierten Standalone-Test und dient als Referenz für diesen Vertrag.

## 8. Setup-Routine nach Final Freeze

Die bereits in `ROADMAP.md` dokumentierte Entscheidung bleibt verbindlich: Unmittelbar nach Final Freeze soll eine weitgehend automatische Setup-/Installationsroutine folgen.

Ziel:

`Paket bereitstellen → Setup-Seite öffnen → Umgebung automatisch erkennen → nur unvermeidbare Daten eingeben → prüfen → installieren → Setup sperren.`

Automatisch ableiten, soweit zuverlässig: PHP/Extensions, Installationsroot, Base-Path/öffentliche Basis, HTTPS, Runtime-/Storage-Pfade, Schreibrechte, Routing/Rewrite, Module, Installations-/Migrationsstatus und weitere eindeutig erkennbare Umgebungswerte.

Manuell nur nicht sicher ableitbare bzw. geheime Werte wie DB-Zugang, erster Admin, App-Name und tatsächlich benötigte Providerdaten. Interne generierbare Secrets bevorzugt sicher automatisch erzeugen.

Absolute hostabhängige Pfade vermeiden, wenn sie relativ zum Installationsroot sicher ableitbar sind. Serverwechsel sollen keine erneute manuelle Suche aller Pfade erfordern.

## 9. Dokumentationsauftrag vor nächster Implementierungsrunde

Vor dem nächsten großen Codeauftrag muss Codex einen vollständigen technischen Dokumentations-Konsistenzlauf durchführen.

Mindestens gegen tatsächlichen Code und diese Betreiberentscheidungen prüfen/aktualisieren:

- `DOCUMENTATION.md`
- `VISION.md`
- `CORE-1.0.md`
- `CORE-1.0-READINESS.md`
- `Architecture.md`
- `ModuleCreation.md`
- `SYSTEM-MODULES.md`
- `UI-UX.md`
- `ADMIN-UX-DECISIONS.md`
- `USER-ACCOUNT-LICENSE-MODEL.md`
- `API.md`
- `Database.md`
- `Security.md`
- `Functions.md`
- `BACKUP-CONTRACT.md`
- `Install-README-Server.md`
- `Install-README-Web-App.md`
- `DEVELOPMENT.md`
- `STATUS.md`
- `TODO.md`
- `ToDoNow.md`
- `ROADMAP.md`
- `WORKFLOW.md`
- `CHATGPT.md`

`CHANGELOG.md` bleibt historisches Protokoll und darf nicht rückwirkend umgeschrieben werden; neue dokumentarische Änderungen werden normal ergänzt.

Technische Dateien dürfen nur als `VORHANDEN` dokumentiert werden, wenn Code/Test dies trägt. Die oben genannten Livefehler bleiben offen, bis nach einem späteren Fix ein neuer Betreibercheck bestanden ist.

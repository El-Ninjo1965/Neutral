# NEUTRAL – Admin/User UX Decisions

**Status:** VERBINDLICHE PRODUKT-/UX-ENTSCHEIDUNGEN FÜR CORE 1.0  
**Datum:** 2026-09-10

Dieses Dokument hält Entscheidungen fest, die im Betreiber-Livecheck getroffen wurden und künftig nicht erneut aus Gesprächen rekonstruiert werden sollen. Es ergänzt `VISION.md`, `USER-ACCOUNT-LICENSE-MODEL.md` und `UI-UX.md`.

## 1. Packages / Entitlements

- Package-Key = technische, eindeutige Kennung ohne Leerzeichen; menschenlesbarer Name separat.
- Package-Name und Beschreibung sind frei konfigurierbar.
- Package-Status: `active` / `inactive`.
- Modulzustände: `available`, `locked`, `hidden`.
- Default Allowed Devices darf **nicht** auf feste Auswahlwerte 1/2/3/5/10 begrenzt sein.
- Gewünschte UX: freie positive Ganzzahl **oder** `unlimited`.
- Beispiel: Free Package kann 1 Device erlauben; Vereins-/Businesspakete müssen z. B. 20, 50 oder andere Werte ohne Codeänderung erlauben.
- Der bestehende Vertrag bleibt eindeutig: `Default Allowed Devices` im Package ist ein **Default pro User**, nicht ein globales Gesamt-Gerätelimit der gesamten Organisation. Die UI soll dies ausdrücklich als `Default devices per user` / `Default device limit per user` kenntlich machen, damit Package-, User- und License-Limits nicht verwechselt werden.

## 2. Licenses / Organizations

- License-Key = technische eindeutige Kennung.
- Organization = menschenlesbarer Kunden-/Organisationsname.
- Package wird der Lizenz zugeordnet.
- `Seats` und `Devices` bleiben fachlich getrennt:
  - Seats = Anzahl Nutzerplätze einer Organisation.
  - Devices = erlaubte Installationen pro User.
- UI-Begriffe sollen möglichst verständlich sein. Bevorzugt:
  - `User limit` statt `Seat limit`, sofern die Semantik unverändert bleibt.
  - `Device limit per user` statt `License device limit`.
  - `License manager` statt `Manager user ID`.
- License Manager soll über eine Benutzer-Auswahlliste gewählt werden, nicht über manuelle numerische User-ID-Eingabe.
- Eine Lizenz muss administrativ deaktivierbar/widerrufbar sein, ohne historische/auditrelevante Daten unkontrolliert zu löschen.
- Zusätzlich muss eine License/Organization aus dem Adminbereich **löschbar** sein, wenn dies referenziell sicher möglich ist. Die UI benötigt eine klare `Delete`-Aktion mit Bestätigung. Der Server muss referenzielle Abhängigkeiten prüfen; keine stillen Kaskaden oder verwaisten User/Zuordnungen. Wenn Löschen wegen aktiver Zuordnungen nicht zulässig ist, verständliche 4xx-Antwort und UI-Hinweis statt 500. Jeder erfolgreiche Löschvorgang wird auditiert.
- Package-/License-Defaults und User-Overrides müssen für den Admin nachvollziehbar angezeigt werden.

## 3. User Management / Device Limits

- Allowed Devices im User Create/Edit muss flexibel sein:
  - Package/License Default
  - freie positive Ganzzahl als User-Override
  - `unlimited` als expliziter Override, wenn berechtigt
- Feste UI-Auswahlwerte wie `Override: 1/2/3/5/10` sind nicht das Ziel.
- Das Wort `Override` darf technisch intern bleiben, soll aber in der UI verständlicher formuliert werden, z. B. `Custom device limit` / `Eigenes Gerätelimit`.
- Used Devices bleibt read-only Istwert.
- Eine Limit-Senkung löscht bestehende Sessions nicht automatisch.

## 4. Birthday / Profile

- Geburtstag darf **kein Freitextfeld** sein.
- Der native iPad-Kalender ist für weit zurückliegende Geburtsjahre unpraktisch, weil der Nutzer sonst viele Monate/Jahre zurücknavigieren muss.
- Verbindliche gewünschte UX: **drei Auswahlfelder**:
  1. Tag
  2. Monat – ausgeschriebener Monatsname gemäß aktueller Sprache
  3. Jahr
- Reihenfolge sichtbar und eindeutig; keine kulturabhängige Mehrdeutigkeit wie MM/DD/YYYY vs. DD/MM/YYYY.
- Serverseitig weiterhin echtes Kalenderdatum validieren, inklusive Schaltjahr und unmöglicher Daten.
- Speicherung kanonisch als `YYYY-MM-DD`, ohne Zeitzonenverschiebung.
- Feld bleibt optional und kann gelöscht werden.

## 5. Audit Delete All

- `Delete All` bleibt eine separate, hochkritische Adminaktion mit eigener Permission.
- Gewünschte Bedienung: **zwei klare Bestätigungsdialoge reichen aus**.
- Keine Pflicht, zusätzlich `DELETE` in Großbuchstaben einzutippen.
- Nach erfolgreichem Löschen aller bisherigen Audit-Einträge wird genau ein neuer Nachweiseintrag erzeugt, der die vollständige Löschung dokumentiert.
- Retention 30/90/180/365 bleibt unverändert separat verfügbar.

## 6. Sessions / Installationsidentität

- Die Session-/Device-Verwaltung soll sich auf **serverseitig verlässliche Identitäten** konzentrieren.
- Useranzeige enthält menschenlesbaren Namen **und User-ID**, z. B. `Tester · #102`.
- Die persistente Installations-/Device-ID ist die eindeutige technische Kennung des Endgeräts/der Installation und muss im Drill-down bzw. in der Sessionansicht klar sichtbar sein.
- Die bisherige Bezeichnung `Device`, wenn darunter lediglich Texte wie `Browser installation` erscheinen, ist missverständlich. Sichtbare Begriffe müssen unterscheiden zwischen:
  - Installation / Device ID = eindeutige persistente Kennung
  - Device class = z. B. iPad, iPhone, Android phone/tablet, desktop, soweit zuverlässig ableitbar
  - Operating system = iPadOS/iOS/Android/Windows/macOS/Linux inklusive Version nur soweit zuverlässig ermittelbar
- Browser ist für die spätere Store-App nicht zentral und muss nicht prominent angezeigt werden.
- Betriebssystem-/Geräteinformationen sind Support-Metadaten, **niemals** Authentifizierungs- oder Device-Identitätsquelle.
- Wenn Browser-/Clientsignale nicht zuverlässig zwischen iPadOS und macOS oder zwischen Geräteklassen unterscheiden können, darf die UI **keine falsche Gewissheit** anzeigen. Dann neutral `Unknown`/leer oder nur die verlässlichere gröbere Information anzeigen.
- Keine Hardware-Fingerprints. Keine heimliche Identifikation. Die zufällige persistente Installations-ID bleibt der verbindliche Device-Vertrag.

## 7. Backup & Restore – konfigurierbarer Speicherpfad

- Der Backup-Speicherpfad darf **nicht hardcodiert** sein und muss pro Installation/App konfigurierbar sein.
- Gewünschte Stelle: direkt auf `Admin → Backup & Restore`.
- Feld: `Backup storage path` mit frei eingebbarem absolutem Serverpfad.
- Beispiel der aktuellen Installation: `/home/web1819/backup_neutral/`.
- Der konkrete Beispielpfad ist **keine Core-Vorgabe** und darf nicht in neutralen Defaults hardcodiert werden.
- Aktionen auf derselben Seite:
  - `Test path`
  - `Save`
- `Test path` prüft mindestens: Pfad vorhanden, Verzeichnis, PHP-Schreibbarkeit, keine offensichtliche öffentliche Auslieferung / Protected-Storage-Vertrag soweit serverseitig zuverlässig prüfbar, keine Path-Traversal-/unsichere Pfadauflösung.
- Manueller und automatischer Backup-Lauf verwenden denselben persistent gespeicherten Pfad.
- `NEUTRAL_BACKUP_KEY` bleibt ausschließlich hostlokales Secret in `.env`; Wert niemals im Admin anzeigen, zurückliefern, loggen oder speichern. Im Admin nur boolesche Readiness (`Encryption key: Ready/Not ready`).
- Der aktuell vorbereitete reale Hostordner liegt außerhalb von `public_html` und hat restriktive Rechte; die konkrete Host-Abnahme erfolgt vor Final Freeze.

## 8. Livebefunde 2026-09-10

Positiv bestätigt:

- User Login funktioniert.
- Admin Login funktioniert.
- parallele User-/Admin-Sessions funktionieren.
- GPS-Basismodul inklusive Position, Zoom/Pan, Google Maps, OSM in separatem Fenster und Teilen funktioniert.
- Audit `Delete All` löscht bestehende Einträge und erzeugt anschließend den neuen `Audit Clear Complete`-Nachweis.
- Package Create funktioniert nach der Nachbesserung beim ersten Submit.
- License Create funktioniert nach der Nachbesserung beim ersten Submit.
- freie Custom-Device-Limits und `Unlimited` sind in Package/License sichtbar.
- License Manager ist als User-Auswahl verfügbar.

Neu offen:

- License/Organization besitzt in der Übersicht aktuell nur `Edit`; eine sichere `Delete`-Aktion fehlt.
- Sessions zeigen Usernamen ohne User-ID.
- Session-/Device-Spalten sind semantisch missverständlich; `Browser installation` ist keine Geräteklasse.
- Produktionsanzeige meldet für iPad/Chrome derzeit `macOS · Chrome`; diese Information ist als tatsächliches Betriebssystem des Endgeräts unzuverlässig und darf nicht als sichere Geräteidentifikation behandelt werden.
- Backup Storage Path ist noch nicht direkt auf der Backup-Seite konfigurierbar.

## 9. Code-seitiger Follow-up-Stand

License Delete mit Referenzsperre/Audit, Session-User-ID und vollständiger Installation-ID, getrennte konservative Supportmetadaten sowie Backup Storage Path mit Test/Save sind implementiert und lokal testbar. Diese Aussage ist kein neuer Livebefund: License Delete, reale iPad-Klassifikation und der vorbereitete Hostpfad bleiben bis zum Betreibercheck `DEVICE/HOST RETEST REQUIRED`.

## 10. Settings/Profile und Backup-V2

Ausgeloggt sind ausschließlich App Areas und Navigation sichtbar; Privacy & Sharing/Profile benötigen eine bestätigte User-Session. Birthday bleibt Day/Month/Year, kompakt auf Tablet und responsiv auf Telefon. Save übernimmt ausschließlich die autoritative Serverantwort. Backup V2 umfasst deklarierte Modultabellen und verwaltete Medienbytes; V1 bleibt als historischer Teilvertrag lesbar. Kein Produktions-Restore als Test.

## 11. Organization Sharing und Navigation Active-State

Organization Sharing ist nur bei autoritativ bestätigter aktiver User→License/Organization-Zuordnung sichtbar und serverseitig aktivierbar; Rollen oder Clientannahmen reichen nicht. Navigation hat pro Ebene genau einen routenbasierten `aria-current`-Active-State. Farben stammen ausschließlich aus den zentralen `nav-active`-Theme-Tokens.

## 12. Globale Erfolgsbestätigung, Passwörter und ACCESS-Reihenfolge

Erfolgreiche Save/Create/Update-Aktionen verwenden in User- und Admin-UI den gemeinsamen zugänglichen Success-Dialog mit genau einer OK-Aktion und Fokusrückgabe; Fehler bleiben Inline-/Alert-Fehler. Alle dynamischen und statischen Passwortfelder erhalten über denselben Core-Helper einen Show/Hide-Toggle. Unter ACCESS stehen operative Bereiche in der Reihenfolge Users, Packages, Licenses, Sessions vor Roles und Permission Catalog.

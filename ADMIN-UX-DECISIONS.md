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

## 6. Livebefunde 2026-09-10

Positiv bestätigt:

- User Login funktioniert.
- Admin Login funktioniert.
- parallele User-/Admin-Sessions funktionieren.
- GPS-Basismodul inklusive Position, Zoom/Pan, Google Maps, OSM in separatem Fenster und Teilen funktioniert.
- Audit `Delete All` löscht bestehende Einträge und erzeugt anschließend den neuen `Audit Clear Complete`-Nachweis.

Offen/fehlerhaft:

- `Create License` liefert trotz plausibel ausgefüllter Felder `Internal server error.`
- Package Create benötigte im Livecheck beim ersten Aufruf offenbar einen zweiten Speicherversuch; Ursache prüfen.
- Device-Limit-Auswahl ist zu stark auf feste Werte begrenzt.
- User-Device-Override-UI ist technisch verständlich, aber unnötig kryptisch.
- Birthday-UX ist für ältere Geburtsjahre unpraktisch.
- Audit `Delete All` ist funktional korrekt, aber die zusätzliche Texteingabe `DELETE` ist unerwünscht.

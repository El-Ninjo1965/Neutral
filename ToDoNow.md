# ToDoNow – Stabilisierung vor dem Core-Freeze

## Statuslegende
- OFFEN
- IN ARBEIT
- BLOCKIERT
- CODE-SEITIG ERLEDIGT
- LIVE BESTANDEN

## A. Kritische Funktionsfehler

### A1 – Rollen-/Permissions-Speicherung
- Status: CODE-SEITIG ERLEDIGT
- Ursache: Der Server-Updatepfad und die Admin-UI erlaubten das Speichern für integrierte Rollen nicht mehr; das UI blockierte Updates für Built-ins und der Node-Backend-Validator verhinderte schrittweise auch Kennzeichenänderungen an Standardrollen.
- Korrektur: Built-in-Rollen bleiben gesperrt für Create/Delete/Rename, aber die Beschreibung und das Permission-Set dürfen editiert werden; die Admin-UI ermöglicht nun bearbeitbare Standardrolle-Formulare.
- Hinweis: Produktive Live-Prüfung noch offen, da kein echter Host-/Admin-Live-Login im Codespace verfügbar.

### A2 – Normaler User-Login funktioniert nicht
- Status: CODE-SEITIG ERLEDIGT
- Ursache: `Web-App/core/local-auth.js` hat jeden Login mit einer lokalen Entwickler-Setup-Prüfung verworfen, obwohl der Benutzer nicht der lokale Developer-Account war.
- Korrektur: Die lokale Bootstrap-Guard greift nur mehr für den lokalen Developer-Account; normale Benutzerlogins laufen durch den normalen User-Loginpfad.
- Hinweis: Produktiver Live-Login gegen die reale API bleibt offen; die technische Ursache wurde im Code reproduzierbar korrigiert.

### A3 – Setup-/Developer-Bootstrap von normalem Login entkoppeln
- Status: CODE-SEITIG ERLEDIGT
- Ursache: Der lokale Setup-/Developer-Login war fälschlich in den allgemeinen Loginpfad eingebettet.
- Korrektur: Setup-/Bootstrap-Vertrag bleibt nur für den lokalen Developer-Account und den Installations-/Initialisierungspfad reserviert; normale User-Login- und Session-Checks bleiben getrennt.

### A4 – Auth/Session/RBAC nach Login verifizieren
- Status: LIVE BESTANDEN
- Ursache: Login-/Rollenpfad wurde code-seitig korrigiert und in einem lokalen Live-Check gegen die Codespace-Instanz verifiziert: `Tester` konnte sich mit `dw445566dw` anmelden, die Session wurde als `neutral_session` gesetzt, `/api/auth/me` identifizierte den Nutzer als `user`, und `/api/admin/users` verweigerte den Zugriff mit `403 FORBIDDEN`.
- Nachweis: lokaler Serverlauf im Codespace; keine Host-/Deployment-Umgebung im Repository als produktive Live-Umgebung verfügbar.
- Hinweis: Produktive Host-/Live-Abnahme für Deployment-/Geräteökosystem bleibt weiterhin offen; dieser Punkt ist hier aber im Codespace-Serverlauf verifiziert.

## B. Schreib-/Settings-Verträge

### B1 – Einheitliche Speicherbestätigungen
- Status: OFFEN
- Ursache: Allgemeiner UI-/Save-Vertrag muss noch im realen Produktivfluss für alle Schreibaktionen geprüft werden.
- Hinweis: Kein generischer Save-Dialog-Mechanismus in diesem Fixblock verändert.

### B2 – User Local Settings
- Status: OFFEN
- Ursache: Live-/UI-Regression mit echten User-Settings-Saves im produktiven Ablauf noch offen.

### B3 – Admin Settings
- Status: OFFEN
- Ursache: Verifizierte Backend-/UI-Korrektur nur für Rollen- und Loginpfad; allgemeiner Admin-Settings-Save-Flow weiterhin offen.

### B4 – Application ID technisch prüfen und schützen
- Status: OFFEN

### B5 – Weitere sensible Systemfelder prüfen
- Status: OFFEN

### B6 – Application Name als gefahrlos änderbaren Anzeigenamen prüfen
- Status: OFFEN

## C. Access-/Admin-Verwaltung

### C1 – Permission Catalog
- Status: OFFEN

### C2 – Session Overview
- Status: OFFEN

### C3 – Sessions manuell invalidieren/löschen
- Status: OFFEN

## D. User-App UX / Modulvertrag

### D1 – User-App Light/Dark
- Status: OFFEN

### D2 – Theme persistent lokal speichern, Erststart Light
- Status: OFFEN

### D3 – User-Navigation/Button-States klar farbig
- Status: OFFEN

### D4 – redundanten `‹ Back`-Link entfernen
- Status: OFFEN

### D5 – technische Modulbeschreibung aus normaler Modulansicht entfernen
- Status: OFFEN

### D6 – allgemeinen Modul-UI-Vertrag dokumentieren
- Status: OFFEN

## E. Live-Abnahme
- Status: OFFEN
- Hinweis: lokale Tester-/Session-/RBAC-Prüfung ist bestanden; reale Deployment-/Browser-/Geräteabnahme und die geforderten Produktivsmokes bleiben offen.

## F. Freeze-Bewertung
- Status: OFFEN
- Hinweis: In der aktuellen Codespace-Validierung sind Auth-/Session-/RBAC-Härtung und die relevanten Regressionstests grün; der vollständige Freeze-Block inklusive Deployment-/Smoke-/HEAD-Check bleibt offen.

## Gesamtzustand
- Code-seitig verifiziert: A1, A2, A3, A4 (lokal im Codespace)
- Live-/Deployment-Abnahme: teilweise lokal validiert, Gesamtfreeze und reale Host-/Device-Checks offen
- Operativer Auftrag bleibt aktiv; kein Abschluss-Status „DONE“ solange die Pflichtpunkte B–F und die vollständige Freeze-/Head-/Deployment-Prüfung nicht erfüllt sind

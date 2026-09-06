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
- Ursache: Login-/Rollenpfad wurde code-seitig korrigiert und lokal sowie gegen die produktive API verifiziert: `Tester` konnte sich anmelden, `/api/auth/me` identifizierte den Nutzer als `user`, und `/api/admin/users` verweigerte den Zugriff mit `403 FORBIDDEN`; die Session wurde anschließend beendet.
- Nachweis: lokaler Serverlauf und produktiver Read-only-/Tester-Check; keine Admin- oder mutierende Produktivaktion wurde ausgeführt.

## B. Schreib-/Settings-Verträge

### B1 – Einheitliche Speicherbestätigungen
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: User-Settings zeigen bei erfolgreicher lokaler Persistenz einen sichtbaren Bestätigungsdialog und führen danach zur Startseite zurück; Fehler bleiben auf der Seite. Admin-Settings, Session-Invalidierung und bestehende Admin-Schreibaktionen zeigen Erfolg/Fehler über den gemeinsamen Admin-Hinweis.

### B2 – User Local Settings
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: Theme und User-Präferenzen werden lokal/offline gespeichert; Erfolg bestätigt und navigiert zurück, Fehler täuschen keinen Erfolg vor.

### B3 – Admin Settings
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: Admin-Settings behalten die Seite nach Bestätigung und verwenden sichtbare Erfolg-/Fehlerhinweise.

### B4 – Application ID technisch prüfen und schützen
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: Application ID ist readonly/disabled und serverseitig unveränderbar; direkte API-Manipulation wird abgewiesen.

### B5 – Weitere sensible Systemfelder prüfen
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: Technische Identitätswerte werden nicht als normale editierbare Felder angeboten; Application Name bleibt editierbar.

### B6 – Application Name als gefahrlos änderbaren Anzeigenamen prüfen
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: Application Name bleibt persistent änderbar und wird weiterhin als Anzeigename verwendet.

## C. Access-/Admin-Verwaltung

### C1 – Permission Catalog
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: Read-only-Katalog erklärt Zweck, Key, Beschreibung und Scope/Herkunft ohne gefährliche Edit/Delete-Aktionen.

### C2 – Session Overview
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: Session-Übersicht zeigt Display Name/Username, User-ID, Rollen, Status, Issued, Expires und End-Action aus einem API-Request.

### C3 – Sessions manuell invalidieren/löschen
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: Einzelne Sessions können nach Bestätigung serverseitig invalidiert werden; Erfolg/Fehler wird angezeigt.

## D. User-App UX / Modulvertrag

### D1 – User-App Light/Dark
- Status: CODE-SEITIG ERLEDIGT

### D2 – Theme persistent lokal speichern, Erststart Light
- Status: CODE-SEITIG ERLEDIGT

### D3 – User-Navigation/Button-States klar farbig
- Status: CODE-SEITIG ERLEDIGT

### D4 – redundanten `‹ Back`-Link entfernen
- Status: CODE-SEITIG ERLEDIGT

### D5 – technische Modulbeschreibung aus normaler Modulansicht entfernen
- Status: CODE-SEITIG ERLEDIGT

### D6 – allgemeinen Modul-UI-Vertrag dokumentieren
- Status: CODE-SEITIG ERLEDIGT
- Ergebnis: User-Module nutzen zentrale Navigation, keine automatische technische Beschreibung/Back-Navigation und bleiben Light/Dark-kompatibel.

## E. Live-Abnahme
- Status: TEILWEISE BESTANDEN
- Nachweis: Produktiver Read-only-Smoke gegen `https://turbolikes.com/` bestand für Root, Rewrite, geschützte Admin-/Core-Routen, Status, Modul-Katalog, Deployment-Revision und beide Modulverträge. Der produktive `Tester`-Login bestätigte `user`-RBAC und Logout.
- Offen: reale iPad/Safari-/Android-Abnahme, Offline-/Warmstart, neue Hosting-/Datenbankinstallation und URL-Unterpfad bleiben betreiber- bzw. geräteabhängig.

## F. Freeze-Bewertung
- Status: OFFEN
- Nachweis: 377/377 Node-Tests, vollständiger PHP-Lint mit PHP 8.4, JavaScript-Syntaxprüfungen, `git diff --check`, Produktionspaket und Secret-Scan bestanden. FTPS Deploy `34013190332` und CodeQL `34013190264` für Commit `410d4aca1dd264d7c2b59c4d0abbb24f76eb648e` bestanden.
- Einschränkung: lokales Preflight bleibt wegen fehlender `pdo_mysql`-Erweiterung BLOCKIERT; die geforderten physischen Geräte-/Portabilitätsnachweise fehlen weiterhin. Daher kein Core-1.0-Freeze.

## Gesamtzustand
- Code-seitig verifiziert: A1, A2, A3, A4 (lokal im Codespace)
- Code-seitig verifiziert: B1–B6, C1–C3 und D1–D6
- Live-/Deployment-Abnahme: produktiver Smoke und Tester-RBAC bestanden; Device-, Offline-, Neuinstallations- und Unterpfadabnahmen offen
- Gesamtfreeze: OFFEN wegen der genannten externen Nachweise und lokaler `pdo_mysql`-Preflight-Blockade

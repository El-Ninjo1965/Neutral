# NEUTRAL – TODO

## PRIORITÄT 1 – FUNKTIONIERENDE GRUNDARCHITEKTUR

### 1. Server/API-Verbindung

- [ ] zentrale API-/Server-Konfiguration definieren
- [ ] prüfen, welche Konfigurationsdatei außerhalb des Public Webroot liegen kann
- [ ] User-App über eine zentrale Konfiguration mit dem Server verbinden
- [ ] API-Erreichbarkeit testen
- [ ] Health-/Status-Endpunkt testen
- [ ] Auth-Endpunkte testen
- [ ] Datenbankverbindung testen
- [ ] Live-Verbindung testen

Ziel:

Die User-App darf Serverinformationen nicht über zahlreiche Dateien verteilt enthalten.

---

### 2. User-Authentifizierung

- [ ] User-Login vollständig funktionsfähig machen
- [ ] User-Session vollständig funktionsfähig machen
- [ ] User-Logout vollständig funktionsfähig machen
- [ ] Rollen aus der User-Session korrekt bestimmen
- [ ] Session nach Reload korrekt wiederherstellen
- [ ] Offline-Verhalten definieren

---

### 3. Admin-Authentifizierung

- [ ] Admin-Login vollständig funktionsfähig machen
- [ ] Admin-Session unabhängig von User-Session machen
- [ ] Admin-Logout vollständig funktionsfähig machen
- [ ] Admin-Rechte ausschließlich aus Admin-Session ableiten

---

### 4. User/Admin-Trennung

- [x] Admin-Session über separates Cookie (`neutral_admin_session`) vom User-Session-Namespace trennen
- [ ] prüfen, warum Admin-Login aktuell die User-App beeinflusst
- [ ] User- und Admin-Session technisch trennen
- [ ] prüfen, ob separate Admin-Tabelle erforderlich ist
- [ ] gegebenenfalls Admin-Tabelle erstellen
- [ ] gegebenenfalls Admin-Sessions-Tabelle erstellen
- [ ] bestehende Sessions sauber migrieren
- [ ] sicherstellen, dass User "Tester" bleibt, wenn nur Admin-Login erfolgt
- [ ] sicherstellen, dass Admin-Login keine Admin-Funktion in der User-App erzeugt
- [ ] sicherstellen, dass User-App keinen Admin-Link benötigt

---

## PRIORITÄT 2 – USER-APP

### 5. User-App bereinigen

- [ ] alle administrativen Funktionen aus der User-App entfernen
- [ ] Admin-Menü aus der User-App entfernen
- [ ] Admin-Link aus der normalen User-Navigation entfernen
- [ ] User-App auf reine User-Funktionen reduzieren
- [ ] User-Einstellungen erhalten
- [ ] User-Rollen/Berechtigungen erhalten
- [ ] User-Module erhalten

---

### 6. Admin-Bereich separat

- [ ] separaten Admin-Einstieg erhalten
- [ ] Admin-Bereich nicht über die User-Navigation öffnen
- [ ] Admin-Bereich separat öffnen können
- [ ] Admin-Login ausschließlich im Admin-Bereich
- [ ] Admin-Session ausschließlich im Admin-Bereich
- [ ] bestehende Admin-Funktionen weiterverwenden

---

## PRIORITÄT 3 – MODULE

### 7. Modularchitektur

- [ ] Modulstruktur überprüfen
- [ ] Modul-Lifecycle überprüfen
- [ ] automatische Modulerkennung überprüfen
- [ ] Modulinstallation überprüfen
- [ ] Modulaktivierung überprüfen
- [ ] Moduldeaktivierung überprüfen
- [ ] Modulupdates überprüfen
- [ ] Modulrollen überprüfen
- [ ] Modulberechtigungen überprüfen
- [ ] Modulversionen überprüfen

---

### 8. User-Modulverwaltung

- [ ] verfügbare Module vom Server laden
- [ ] installierte Module erkennen
- [ ] aktive Module erkennen
- [ ] deaktivierte Module erkennen
- [ ] neue Module erkennen
- [ ] Updates erkennen
- [ ] Download-Bestätigung anzeigen
- [ ] Modul lokal installieren
- [ ] Modul lokal entfernen können
- [ ] Core nach Installation automatisch registrieren

---

### 9. Starter-/Gastfunktionen

- [ ] definieren, welche Module ohne Login verfügbar sind
- [ ] GPS als öffentliches Starter-Modul ermöglichen
- [ ] prüfen, dass öffentliche Module ohne User-Login funktionieren

---

### 10. Nutzungslimits

- [ ] Modul-Limits technisch unterstützen
- [ ] Beispiel-Limit für kostenlose Nutzung unterstützen
- [ ] Limit serverseitig prüfen
- [ ] Limit im User-Interface anzeigen
- [ ] Upgrade-Hinweis unterstützen

---

## PRIORITÄT 4 – ROLLEN UND BERECHTIGUNGEN

### 11. Rollenmodell

- [ ] bestehende Rollenstruktur prüfen
- [ ] User-Rollen und Admin-Rollen sauber trennen
- [ ] Rollenberechtigungen prüfen
- [ ] modulbezogene Berechtigungen prüfen
- [ ] unterschiedliche Modul-Funktionen abhängig von Rolle ermöglichen

---

## PRIORITÄT 5 – DATENBANK

### 12. Bestehende Datenbank

Bestehende Tabellen prüfen:

- Audit Log
- Backups
- Modules
- Module Integration
- Module State
- Permissions
- Release State
- Roles
- Role Permission
- Schema Migration
- Sessions
- Settings
- Setup Status
- Users
- User Roles

- [ ] tatsächliche Struktur prüfen
- [ ] Foreign Keys prüfen
- [ ] Sessions prüfen
- [ ] User-Rollen prüfen
- [ ] Modulbeziehungen prüfen
- [ ] Migrationen prüfen
- [ ] Admin-Struktur prüfen
- [ ] entscheiden, ob Admin und Admin Sessions getrennte Tabellen benötigen
- [ ] Migrationen für notwendige Änderungen erstellen
- [ ] bestehende Daten erhalten

---

## PRIORITÄT 6 – OFFLINE-FIRST

### 13. Offline-Funktion

- [ ] User-App ohne Serververbindung starten können
- [ ] installierte Module offline verfügbar machen
- [ ] lokale Daten speichern
- [ ] Synchronisation implementieren/prüfen
- [ ] Konfliktbehandlung prüfen
- [ ] Online/Offline-Zustand korrekt erkennen

---

## PRIORITÄT 7 – GPS

### 14. GPS-Grundmodul

- [ ] GPS-Seite korrekt laden
- [ ] aktuelle Position beim Öffnen automatisch ermitteln
- [ ] Position in der UI anzeigen
- [ ] Get Current Position funktionsfähig machen
- [ ] Start Tracking funktionsfähig machen
- [ ] Stop Tracking funktionsfähig machen
- [ ] Permission State korrekt erkennen
- [ ] aktives GPS nicht fälschlicherweise als deaktiviert anzeigen
- [ ] Fehlerzustände korrekt anzeigen
- [ ] Live-Browser-Test durchführen
- [ ] mobilen Live-Test durchführen

GPS Plus ist NICHT Teil dieser Aufgabe.

---

## PRIORITÄT 8 – PORTABILITÄT

### 15. Backup-/Restore-System

- [ ] vollständiges Backup-ZIP definieren
- [ ] Serverinstallation aus ZIP ermöglichen
- [ ] zentrale ENV-Konfiguration definieren
- [ ] Konfiguration außerhalb des Public Webroot ermöglichen
- [x] Repository-Struktur in [webapp/](/workspaces/Neutral/webapp) und [server/](/workspaces/Neutral/server) sauber trennen
- [ ] neue Serverinstallation testen
- [ ] Datenbankinstallation testen
- [ ] API-Verbindung nach Neuinstallation testen

Ziel:

ZIP entpacken → ENV anpassen → Datenbank konfigurieren → Neutral läuft.

---

## PRIORITÄT 9 – WEITERE MODULE

Erst beginnen, wenn die Core-Architektur funktioniert.

Geplante Beispiele:

- GPS
- Wetter
- weitere Module

GPS Plus später:

- gespeicherte Koordinaten
- Sketchbook-Anbindung
- zusätzliche rollen-/paketabhängige Funktionen

---

## PRIORITÄT 10 – DESIGN

Erst nach funktionaler Stabilität:

- [ ] User-App Design
- [ ] Admin Design
- [ ] Navigation
- [ ] Anzeigen
- [ ] Responsive Optimierung
- [ ] Mobile Optimierung
- [ ] Icons
- [ ] Animationen

Design darf keine funktionierenden Komponenten destabilisieren.

---

## ABSCHLUSS-KRITERIUM

Neutral gilt erst dann als technisch fertig, wenn:

- User-App funktioniert
- Admin-Bereich funktioniert
- User- und Admin-Login unabhängig funktionieren
- User- und Admin-Sessions unabhängig funktionieren
- API funktioniert
- Datenbank funktioniert
- Module funktionieren
- Rollen funktionieren
- Offline-Grundfunktion funktioniert
- GPS funktioniert
- Installation auf einem neuen Server reproduzierbar möglich ist

Danach beginnt die nächste Entwicklungsphase.

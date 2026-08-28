# NEUTRAL – VISION

## 1. Zweck

Neutral ist eine modulare, portable und offline-first Web-App.

Die Anwendung besteht aus zwei klar getrennten Einheiten:

1. User-App
2. Administrationsbereich

Diese beiden Bereiche müssen technisch und sicherheitstechnisch voneinander getrennt sein.

Die User-App ist die eigentliche Anwendung für den Endanwender.

Der Administrationsbereich dient ausschließlich der Verwaltung der Anwendung, Benutzer, Rollen, Module, Berechtigungen, Releases und Systemdaten.

Administrative Funktionen gehören NICHT in die User-App.

Die physische Struktur folgt dieser Trennung:

- [webapp/](/workspaces/Neutral/webapp) enthält die komplette Browser-/User-App inklusive Plattform, Modulen und statischen Assets.
- [server/](/workspaces/Neutral/server) enthält Backend, Admin-Server, PHP-Entrypoints und serverseitige Dienste.
- Das Root bleibt auf Projektdateien wie Docs, Package-Metadaten und Deployment-Konfiguration beschränkt.

---

## 2. Grundprinzip

Die wichtigste Zielsetzung lautet:

FUNKTIONIEREN VOR DESIGN.

Die Anwendung muss zunächst technisch vollständig funktionieren.

Optische Verbesserungen, Animationen, Layoutoptimierungen und sonstige Designarbeiten werden erst vorgenommen, wenn die grundlegende Funktionalität stabil ist.

Es ist ausdrücklich erlaubt, bestehende Dateien, Strukturen oder technische Lösungen zu verändern oder zu ersetzen, wenn dies erforderlich ist, um eine funktionierende und saubere Architektur zu erreichen.

Es gibt keine Verpflichtung, eine bestehende technische Lösung beizubehalten.

---

## 3. User-App

Die User-App ist schlank.

Sie enthält:

- Core
- User-Login
- User-Session
- User-Einstellungen
- User-Rollen und daraus resultierende Berechtigungen
- verfügbare Module
- installierte Module
- Modulverwaltung für den User
- Offline-Funktionalität
- Synchronisation mit dem Server
- Zugriff auf die vom Server bereitgestellten Daten und Module

Die User-App enthält KEIN:

- Admin-Menü
- Admin-Login
- Admin-Session
- Benutzerverwaltung
- Rollenverwaltung für andere Benutzer
- Moduladministration
- Releaseadministration
- Systemadministration
- Datenbankadministration

Die User-App muss nicht wissen, wo sich der Administrationsbereich befindet.

Es darf in der normalen User-Oberfläche keinen unnötigen Admin-Link geben.

---

## 4. Administrationsbereich

Der Administrationsbereich bleibt separat.

Er wird über eine eigene URL bzw. einen separaten Einstieg aufgerufen.

Der Admin-Bereich darf nicht Bestandteil der normalen User-Navigation sein.

Der Admin-Bereich darf in einem separaten Browserfenster bzw. Tab geöffnet werden.

Der Administrationsbereich enthält unter anderem:

- Admin-Login
- Admin-Session
- Benutzerverwaltung
- Rollenverwaltung
- Berechtigungsverwaltung
- Modulverwaltung
- Modulinstallation
- Modulaktivierung
- Moduldeaktivierung
- Modulupdates
- Releaseverwaltung
- Systemkonfiguration
- Datenbank-/Schemaverwaltung
- Audit-/Systeminformationen
- Backup-/Restore-Funktionen

Der Admin-Bereich ist eine eigenständige administrative Oberfläche.

---

## 5. User- und Admin-Authentifizierung

User- und Admin-Authentifizierung sind vollständig voneinander zu trennen.

Ein Admin-Login darf NICHT automatisch dazu führen, dass die User-App den Benutzer als Admin betrachtet.

Ein User-Login darf NICHT automatisch eine Admin-Session erzeugen.

Beide Sessions müssen unabhängig voneinander funktionieren.

Beispiel:

Ein Benutzer kann im Administrationsbereich als Admin angemeldet sein und gleichzeitig in der User-App als normaler User angemeldet sein.

Wenn sich derselbe Benutzer in der User-App als "Tester" anmeldet, bleibt er dort "Tester", unabhängig davon, ob im Administrationsbereich eine Admin-Session existiert.

Die User-App darf niemals allein aufgrund einer vorhandenen Admin-Session administrative Rechte erhalten.

Administrative Berechtigungen werden ausschließlich durch die Admin-Authentifizierung bestimmt.

---

## 6. Server und API

Der Server ist das Backend der Anwendung.

Er stellt unter anderem bereit:

- Authentifizierung
- Sessions
- Benutzer
- Rollen
- Berechtigungen
- Module
- Modulstatus
- Modulversionen
- Updates
- Einstellungen
- Daten
- Synchronisation
- Datenbankzugriff
- Audit-Daten
- Releaseinformationen

Die User-App kommuniziert über eine definierte API mit dem Server.

Die Verbindungsinformationen sollen zentral und portabel konfigurierbar sein.

Ziel:

Bei einer neuen Installation soll möglichst nur eine zentrale Konfigurationsdatei bzw. ENV-Datei angepasst werden müssen.

Diese Konfiguration darf sich außerhalb des öffentlich erreichbaren Webroots befinden.

Die User-App soll daraus bzw. über die definierte API den Server erreichen können.

---

## 7. Portable Installation

Neutral soll möglichst einfach auf einen anderen Server übertragen werden können.

Zielstruktur:

- Backup-ZIP erstellen
- ZIP auf neuen Server übertragen
- Dateien entpacken
- zentrale Server-/ENV-Konfiguration anpassen
- Datenbank konfigurieren
- Anwendung starten

Danach soll Neutral ohne manuelle Anpassung zahlreicher Dateien funktionieren.

Serverpfade, URLs, Datenbankzugänge und sonstige Umgebungsdaten dürfen nicht hart in zahlreichen Dateien verteilt sein.

---

## 8. Offline-first

Die User-App muss auch ohne permanente Internetverbindung funktionieren.

Installierte und freigegebene Module müssen lokal verwendet werden können.

Wenn keine Verbindung zum Server besteht, darf die Anwendung nicht unnötig unbrauchbar werden.

Bei bestehender Verbindung kann die App:

- Updates erkennen
- neue Module erkennen
- Daten synchronisieren
- Konfiguration aktualisieren
- verfügbare Module anzeigen

---

## 9. Module

Module sind eigenständige Funktionseinheiten.

Ein Modul kann unter anderem enthalten:

- Code
- UI
- Konfiguration
- Datenbankdefinitionen
- Migrationen
- Berechtigungen
- Rollenabhängigkeiten
- Version
- Installationsinformationen
- Updateinformationen

Module müssen vom Core automatisch erkannt und integriert werden können.

Der Core darf nicht für jedes einzelne Modul individuell geändert werden müssen.

---

## 10. Modulstatus

Ein Modul kann verschiedene Zustände besitzen:

- vorhanden
- installiert
- aktiviert
- deaktiviert
- verfügbar
- update verfügbar
- für Rolle freigegeben
- eingeschränkt verfügbar

Die konkrete technische Umsetzung darf angepasst werden, solange dieses Verhalten erreicht wird.

---

## 11. Module für nicht registrierte Benutzer

Auch ohne Login können bestimmte Module verfügbar sein.

Diese Module sind öffentlich bzw. Starter-Funktionen.

Beispielsweise kann GPS grundsätzlich für nicht registrierte Benutzer verfügbar sein.

Andere Module können dagegen ausschließlich bestimmten User-Rollen zur Verfügung stehen.

---

## 12. Eingeschränkte Module

Ein Modul muss nicht nur "freigeschaltet" oder "gesperrt" sein.

Es kann auch eine eingeschränkte Nutzung geben.

Beispiel:

Ein Benutzer darf fünf Einträge erstellen.

Nach Erreichen des Limits kann die Anwendung beispielsweise anzeigen:

"Sie haben das kostenlose Nutzungslimit erreicht. Bitte upgraden Sie Ihr Paket."

Die Limits müssen vom Server bzw. von der jeweiligen Rollen-/Paketkonfiguration steuerbar sein.

---

## 13. Modul-Store / Modul-Download

Die User-App soll langfristig wie ein kleines CMS für Module funktionieren.

Der Core bleibt möglichst schlank.

Module können abhängig von:

- Rolle
- Paket
- Berechtigung
- Verfügbarkeit
- Installation

heruntergeladen werden.

Ein neues Modul wird serverseitig bereitgestellt.

Die User-App erkennt beim nächsten Online-Kontakt:

"Neues Modul verfügbar."

Der Benutzer muss den Download grundsätzlich selbst bestätigen.

Updates müssen ebenfalls erkannt und dem Benutzer angeboten werden.

---

## 14. Modul-Deinstallation

Ein Benutzer soll Module, die er nicht benötigt, aus seiner lokalen User-App entfernen können, soweit die jeweilige Modul-/Paketlogik dies erlaubt.

Dadurch bleibt die lokale App möglichst klein.

Die serverseitige Verfügbarkeit eines Moduls und die lokale Installation eines Moduls sind zwei unterschiedliche Zustände.

---

## 15. Admin-Modulverwaltung

Der Administrator kann Module serverseitig:

- installieren
- aktivieren
- deaktivieren
- aktualisieren
- für bestimmte Rollen freigeben
- für bestimmte Pakete freigeben
- zur Verfügung stellen
- zurückziehen

Wenn ein neues Modul serverseitig korrekt installiert und freigegeben wurde, muss die User-App dieses Modul über die API erkennen können.

Der Core soll nicht für jedes neue Modul manuell geändert werden müssen.

---

## 16. Rollen

Rollen bestimmen, welche Funktionen ein Benutzer nutzen darf.

Ein Modul kann für unterschiedliche Rollen unterschiedliche Funktionen bereitstellen.

Daher ist nicht nur die Frage relevant:

"Hat der Benutzer Zugriff auf das Modul?"

sondern auch:

"Welche Funktionen dieses Moduls darf dieser Benutzer verwenden?"

Beispiel:

GPS:

- Starter: grundlegende GPS-Funktion
- normale User: erweiterte Funktionen
- später GPS Plus: zusätzliche Funktionen für entsprechende Rollen/Pakete

---

## 17. Datenbank

Die Datenbank ist zentraler Bestandteil des Backends.

Bereits vorhandene Datenbankstrukturen müssen weiterverwendet werden, sofern sie zur Zielarchitektur passen.

Aktuell existieren unter anderem Tabellen für:

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

Die endgültige Tabellenstruktur darf verändert oder erweitert werden, wenn dies für die saubere Trennung von User- und Admin-Authentifizierung erforderlich ist.

Insbesondere muss geprüft werden, ob separate Admin- und Admin-Session-Strukturen sinnvoll und technisch notwendig sind.

---

## 18. Sicherheit

Alles, was an den Browser ausgeliefert wird, ist grundsätzlich einsehbar.

Daher dürfen Geheimnisse, Passwörter oder private Serverinformationen niemals im Client-Code gespeichert werden.

Administrative Sicherheitsmechanismen dürfen nicht davon abhängen, dass Client-Code verborgen bleibt.

Die eigentliche Autorisierung muss serverseitig erfolgen.

---

## 19. Technologie

Die konkrete Wahl zwischen HTML, PHP, JavaScript oder einer Kombination daraus ist zweitrangig.

Es gilt:

FUNKTIONIERENDE LÖSUNG VOR TECHNOLOGISCHER DOGMATIK.

Wenn HTML die technisch bessere Lösung ist, darf HTML verwendet werden.

Wenn PHP die technisch bessere Lösung ist, darf PHP verwendet werden.

Wenn JavaScript erforderlich ist, darf JavaScript verwendet werden.

Nicht funktionierende statische Lösungen müssen ersetzt werden.

Keine Technologie darf ausschließlich aus Prinzip eingesetzt werden.

---

## 20. GPS

Das GPS-Modul ist eines der ersten wichtigen Funktionsmodule.

Beim Öffnen der GPS-Seite soll nach Möglichkeit automatisch die aktuelle Position ermittelt werden.

Der Benutzer soll nicht zwingend zuerst "Get Current Position" drücken müssen.

"Get Current Position" bleibt als manuelle Aktualisierung verfügbar.

"Start Tracking" und "Stop Tracking" müssen tatsächlich funktionieren.

Die Berechtigungen des Browsers/Geräts müssen korrekt erkannt und verarbeitet werden.

Ein aktiver GPS-/Standortzugriff darf nicht fälschlicherweise als deaktiviert angezeigt werden.

GPS Plus ist später vorgesehen.

GPS Plus wird auf dem funktionierenden GPS-Modul aufbauen und später zusätzliche Funktionen wie gespeicherte Koordinaten für das Sketchbook bereitstellen.

GPS Plus ist NICHT Bestandteil des aktuellen Prioritätsumfangs.

---

## 21. Priorität

Die Entwicklungsreihenfolge lautet grundsätzlich:

1. Architektur
2. Server-/API-Verbindung
3. Authentifizierung
4. getrennte User-/Admin-Sessions
5. User-App
6. Admin-Bereich
7. Modulverwaltung
8. Rollen/Berechtigungen
9. Datenpersistenz
10. Offline-Funktion
11. GPS
12. weitere Module
13. Designoptimierung

Die Reihenfolge darf angepasst werden, wenn technische Abhängigkeiten dies erfordern.

Das Endziel bleibt:

Eine funktionierende, unabhängige, portable und modulare Anwendung.

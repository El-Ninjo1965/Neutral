# Neutral - Zielarchitektur

## 1. Verbindliche Grundsaetze

- User-Web-App und Admin-Bereich sind strikt getrennt.
- User-Session und Admin-Session sind technisch und logisch getrennt.
- User-Rechte und Admin-Rechte sind nicht dasselbe.
- Core ist nicht Administration.
- Server/API ist die zentrale Daten- und Diensteschicht.
- Module sind eigenstaendige Funktionseinheiten.
- Installation und Konfiguration sollen portabel bleiben.
- Offline-first ist ein Grundprinzip.

## 2. User-Web-App

Die User-Web-App ist die eigentliche Anwendung fuer normale Benutzer.
Sie enthaelt nur:

- Core der Anwendung
- Benutzerfunktionen
- Benutzer-Einstellungen
- Module fuer Benutzer
- Benutzer-Login
- rollenbasierte Benutzerfunktionen
- Offline-Funktionalitaet
- Synchronisation mit dem Server
- Update-Erkennung
- Download und Entfernung von Benutzer-Modulen

Die User-Web-App enthaelt keine administrativen Funktionen.
Insbesondere gibt es dort kein Admin-Menue, keinen Admin-Link, kein Admin-Login, kein Admin-Dashboard und keine System-, Rollen-, Benutzer-, Datenbank-, Release- oder Backupverwaltung.

## 3. Admin-Bereich

Der Admin-Bereich ist eine separate Verwaltungsoberflaeche mit eigener URL und eigener Session.
Er darf nicht aus dem normalen User-Menue heraus geoeffnet werden.

Der Admin-Bereich verantwortet unter anderem:

- Benutzerverwaltung
- Rollen und Berechtigungen
- Module und Modul-Lifecycle
- Modulinstallation und -deinstallation
- Modulaktivierung und -deaktivierung
- Modulupdates und Versionen
- Modulabhaengigkeiten
- Datenbankmigrationen
- Systemkonfiguration
- Releases
- Backups
- Serverstatus
- Audit Log
- Setup und Wartung

Ein Admin-Login darf die User-Web-App nicht in eine Admin-Ansicht verwandeln.
Umgekehrt darf ein User-Login keine administrativen Rechte erzeugen.

## 4. Server und API

Der Server ist die zentrale Backend-Schicht.
Die User-Web-App benoetigt nur eine geeignete Server-/API-Konfiguration, nicht feste Installationspfade oder eine bestimmte Domain.

Die API liefert unter anderem:

- Serverstatus
- Benutzerstatus
- Rollen und Berechtigungen
- Module und Modulstatus
- Modulversionen und Updates
- Konfiguration
- Synchronisationsdaten
- weitere benoetigte Laufzeitdaten

Serverseitige Geheimnisse bleiben ausserhalb des oeffentlichen Webroots.

## 5. Authentifizierung und Sessions

- User-Login und Admin-Login sind voneinander unabhaengig.
- Eine Admin-Session ist niemals eine User-Session.
- Eine User-Session erzeugt keine Admin-Rechte.
- Browser-Lokalspeicher ist kein Autoritaetsersatz fuer serverseitige Sessions.
- Rechtepruefungen erfolgen serverseitig.

## 6. Module

Module sind eigenstaendige funktionale Einheiten.
Der Core soll ein Modul erkennen und integrieren koennen, ohne fuer jedes neue Modul grundlegend angepasst werden zu muessen.

Grundsaetzlicher Lifecycle:

- DISCOVER
- INSTALL
- REGISTER
- INACTIVE
- ACTIVATE
- ACTIVE
- DEACTIVATE
- UNINSTALL
- UPDATE

Module duerfen eigene Datenstrukturen, Migrationen, Berechtigungen, Standalone-Einstiege und Limits mitbringen.
Installieren bedeutet nicht automatisch Aktivieren.

## 7. Module fuer Benutzer

Module koennen je nach Rolle oder Paket unterschiedlich freigeschaltet sein.
Freigaben koennen funktional begrenzt sein, zum Beispiel durch:

- Anzahl Datensaetze
- Anzahl Aktionen
- Speicher
- Zeit
- einzelne Funktionen
- Synchronisation

## 8. Offline-first und Portabilitaet

Neutral soll auch ohne permanente Serververbindung sinnvoll nutzbar bleiben, soweit die konkrete Funktion dies erlaubt.

Ein portables Paket soll auf einer anderen tauglichen Hostumgebung mit moeglichst wenigen serverseitigen Anpassungen lauffaehig sein.
Keine harten Abhaengigkeiten von lokaler Entwicklungsumgebung, Codespace oder einer bestimmten Domain.

## 9. GPS

Das bestehende GPS-Modul ist ein Referenzmodul und muss funktional korrekt arbeiten.

Verbindlich:

- Position beim Oeffnen automatisch anstossen, wenn Berechtigung und Browser dies erlauben
- Get Current Position bleibt erhalten
- Start Tracking muss funktionieren
- Stop Tracking muss funktionieren
- Permission-Status und Anzeige muessen synchron bleiben

GPS Plus ist nicht Teil dieses Schritts.

## 10. Geltung

Diese Vision beschreibt die Zielarchitektur.
Alle aelteren, widersprechenden Uebergangsbeschreibungen sind durch diese Zielarchitektur ersetzt.

# Neutral - Prioritaeten

## Prioritaet 1 - Funktionsbasis

- [ ] User-Web-App und Admin-Bereich strikt trennen
- [ ] User-Login und Admin-Login mit getrennten Sessions absichern
- [ ] zentrale API- und Serverkonfiguration portabel machen
- [ ] Datenbankanbindung und serverseitige Auth pruefen
- [ ] Modul-Erkennung und Grund-Lifecycle stabil halten
- [ ] Offline-Grundfunktion und lokale Datenhaltung sichern

## Prioritaet 2 - Bestehende Module

- [ ] GPS beim Oeffnen automatisch initialisieren
- [ ] aktuelle Position verlaesslich abrufen
- [ ] Tracking Start funktional reparieren
- [ ] Tracking Stop funktional reparieren
- [ ] Permission-Status und Anzeige synchron halten
- [ ] rollenbasierte GPS-Freigaben sauber pruefen

## Prioritaet 3 - Modulsystem

- [ ] Server-Modulkatalog und Modulstatus bereitstellen
- [ ] Modulinstallation und Registrierung sauber umsetzen
- [ ] Modulaktivierung und -deaktivierung zentral verwalten
- [ ] Modulupdates und Versionen pruefbar machen
- [ ] Moduldeinstallation und Aufraeumen absichern
- [ ] User-Modulverwaltung mit Download-Bestaetigung bereitstellen
- [ ] Paket- und Rollenfreigaben fuer Module abbilden
- [ ] Modulabhaengigkeiten und Modul-Limits unterstuetzen

## Prioritaet 4 - Portabilitaet

- [ ] portable Installation ohne feste Domain vorbereiten
- [ ] zentrale Server- und API-Konfiguration ausserhalb des Public Webroots halten
- [ ] Backup- und Restore-Prozess pruefbar machen
- [ ] Datenbank-Setup und Wiederherstellung dokumentieren
- [ ] Deployment fuer neue Hosts robust halten

## Prioritaet 5 - Qualitaet

- [ ] UI und UX nur dort verbessern, wo Funktion bereits stabil ist
- [ ] Accessibility und Bedienbarkeit nachziehen
- [ ] Performance und Ladezeit optimieren
- [ ] Komfortfunktionen erst nach der Funktionsbasis ergaenzen

## Laufende Regel

- Keine historische Architektur konservieren, wenn sie der Zielarchitektur widerspricht.
- Keine Parallelimplementierungen ohne technischen Grund.
- Keine toten Dateien oder Placebo-Funktionen behalten.

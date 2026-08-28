# Neutral - Arbeitsworkflow

## 1. Reihenfolge der Arbeit

1. Repository und Branch pruefen
2. VISION.md, WORKFLOW.md und TODO.md lesen
3. aktuelle Architektur und Laufzeit verstehen
4. betroffene Dateien eingrenzen
5. bestehende Komponenten bevorzugen
6. nur gezielte Aenderungen vornehmen
7. Tests und Validierung ausfuehren
8. Fehler beheben
9. Datenbankmigrationen sauber umsetzen, falls noetig
10. Deployment oder Live-Verhalten pruefen, soweit technisch moeglich
11. Dokumentation aktualisieren
12. Git-Status pruefen
13. Aenderungen committen
14. Aenderungen nach GitHub uebertragen

## 2. Architekturregeln fuer Aenderungen

- Keine parallelen Systeme ohne klaren technischen Grund.
- Keine doppelten Einstiegspunkte, wenn ein vorhandener reicht.
- Keine Placebo-Funktionen und keine toten Dateien.
- Keine harten Annahmen ueber lokale Pfade, Hosts oder Ports.
- Keine stillen Fallbacks, wenn dadurch Auth, Sessions oder Deployment verwischen.
- Funktionierende, bestehende Komponenten sollen bevorzugt wiederverwendet werden.
- Wenn Architekturreste die Zielarchitektur stoeren, duerfen sie ersetzt oder entfernt werden.

## 3. User- und Admin-Trennung

- User-Web-App und Admin-Bereich werden getrennt betrachtet.
- User- und Admin-Authentifizierung werden getrennt behandelt.
- Browserlokaler Zustand darf serverseitige Sessions nicht ersetzen.
- Admin-Funktionen gehoeren nicht in den User-Core.

## 4. Module und Datenhaltung

- Module werden ueber den vorhandenen Modul-Lifecycle bewertet.
- Modulinstallationen, Aktivierungen und Updates werden nicht blind angenommen, sondern verifiziert.
- Modul-eigene Datenstrukturen und Migrationen werden sauber behandelt.
- Limits und Berechtigungen sollen moeglichst modular bleiben.

## 5. Validation

Vor Abschluss einer Aenderung sind die kleinsten passenden Pruefschritte auszufuehren:

- gezielte Unit- oder Integrationstests fuer die betroffene Funktion
- Session- oder Auth-Pruefungen bei Login-Aenderungen
- Datei- oder Endpunkt-Pruefungen bei PHP- und Webroot-Aenderungen
- Live-Checks nur, wenn der Host dies wirklich zulaesst

Wenn ein gezielter Test den Fehler bereits eindeutig zeigt oder behebt, wird nicht automatisch die gesamte Suite ohne Grund erneut gestartet.

## 6. Deployment und GitHub

- Aenderungen werden auf einem Feature-Branch entwickelt.
- Danach werden sie committed und nach GitHub gepusht.
- Wenn Direkt-Push auf main durch Repo-Regeln verhindert wird, wird der vorhandene PR-Workflow benutzt.
- Nach Merge oder Sync wird der Arbeitsbaum sauber gehalten.

## 7. Dokumentationspflicht

Wenn Architektur, Auth, Sessions, Module, Deployment oder Portabilitaet geaendert werden, muessen die zentralen Dokumente konsistent bleiben:

- VISION.md
- WORKFLOW.md
- TODO.md

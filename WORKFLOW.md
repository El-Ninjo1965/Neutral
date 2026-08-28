# NEUTRAL – WORKFLOW

## 1. Grundregel

Funktion vor Design.

Es wird nicht an optischen Details gearbeitet, solange grundlegende Funktionen fehlerhaft sind.

Der Agent darf Dateien verändern, ersetzen, verschieben oder löschen, wenn dies erforderlich ist.

Bestehender Code ist keine Garantie dafür, dass er beibehalten werden muss.

---

## 2. GitHub ist die Quelle

Das Repository

El-Ninjo1965/Neutral

ist die verbindliche Quelle des Projekts.

Branch:

main

Bestehende Projektdateien müssen vor Änderungen geprüft werden.

Nicht raten.

Keine neuen Repositories.

Keine neuen GitHub-Konten.

---

## 3. Vor jeder größeren Änderung

Zuerst prüfen:

- VISION.md
- WORKFLOW.md
- TODO.md
- relevante Moduldateien
- Serverstruktur
- API
- Datenbankstruktur
- Authentifizierung
- vorhandene Tests

Danach erst Änderungen durchführen.

---

## 4. Keine Architekturannahmen

Nicht automatisch davon ausgehen, dass bestehende HTML-, PHP- oder JavaScript-Strukturen richtig sind.

Nicht automatisch HTML in PHP umwandeln.

Nicht automatisch PHP in HTML umwandeln.

Entscheidend ist die funktionierende Architektur.

---

## 5. User-App und Admin-Bereich

Diese Bereiche sind strikt zu trennen.

User-App:

- User-Funktionen
- User-Login
- User-Session
- User-Rollen
- User-Module
- User-Einstellungen

Admin:

- Admin-Login
- Admin-Session
- Verwaltung
- Module
- Rollen
- Berechtigungen
- Releases
- System

Die User-App darf keine administrativen Funktionen enthalten.

---

## 6. Sessions

Admin-Session und User-Session sind unabhängig.

Ein Admin-Login darf keinen User-Login ersetzen.

Ein User-Login darf keinen Admin-Login ersetzen.

Ein Benutzer kann gleichzeitig eine Admin-Session und eine User-Session besitzen.

Die jeweiligen Bereiche müssen ausschließlich ihre eigene Session verwenden.

---

## 7. API

Die User-App verwendet eine zentrale API-Konfiguration.

Serverinformationen dürfen nicht über zahlreiche Dateien verteilt sein.

Die Verbindung soll möglichst über eine zentrale Konfiguration erfolgen.

Ziel:

Bei einem Serverwechsel möglichst nur eine ENV-/Konfigurationsdatei anpassen.

---

## 8. Server

Der Server übernimmt:

- Auth
- Sessions
- Datenbank
- Module
- Rollen
- Berechtigungen
- Releases
- Updates
- Synchronisation

Clientseitige UI darf keine serverseitige Autorisierung ersetzen.

---

## 9. Module

Module werden dynamisch verwaltet.

Der Core muss neue Module erkennen können.

Ein neues Modul darf nicht zwingend eine Core-Codeänderung benötigen.

Module können eigene:

- Rechte
- Rollenabhängigkeiten
- Migrationen
- Einstellungen
- Daten
- Versionen

besitzen.

---

## 10. Modul-Lifecycle

Typischer Ablauf:

Admin stellt Modul bereit.

↓

Server installiert Modul.

↓

Server aktiviert Modul.

↓

Server ordnet Modul Rollen/Paketen zu.

↓

User-App fragt Server nach verfügbaren Modulen.

↓

User-App erkennt neues Modul.

↓

Benutzer erhält Hinweis.

↓

Benutzer bestätigt Download.

↓

Modul wird lokal installiert.

↓

Core registriert Modul.

↓

Modul ist verfügbar.

Updates funktionieren nach demselben Prinzip.

---

## 11. Offline

Installierte Module müssen offline nutzbar bleiben, soweit sie keine zwingende Serververbindung benötigen.

Bei erneuter Online-Verbindung:

- Synchronisation
- Modulprüfung
- Updateprüfung
- Datenabgleich

---

## 12. Eingeschränkte Nutzung

Module können Nutzungslimits besitzen.

Beispiel:

5 Einträge kostenlos.

Danach Limit erreicht.

Die User-App muss das Limit verständlich anzeigen.

Die eigentliche Limitentscheidung muss serverseitig nachvollziehbar und nicht ausschließlich clientseitig erfolgen.

---

## 13. Tests

Nach Änderungen:

1. Syntax prüfen
2. relevante Tests ausführen
3. vollständige Tests ausführen, soweit möglich
4. Git-Diff prüfen
5. keine unbeabsichtigten Dateien zurücklassen

Tests dürfen keine produktiven Daten zerstören.

Generierte Test-/Runtime-Dateien müssen anschließend sauber behandelt werden.

---

## 14. Live-Test

Automatisierte Tests allein reichen nicht aus.

Wenn ein Problem nur im echten Browser, auf einem mobilen Gerät oder auf dem Live-Server auftritt, muss dies berücksichtigt werden.

Bei GPS insbesondere prüfen:

- aktuelle Position
- Permission State
- Get Current Position
- Start Tracking
- Stop Tracking
- Statusanzeige

---

## 15. Änderungen

Keine unnötigen Parallelstrukturen.

Keine Ersatzdateien ohne Grund.

Keine alten Versionen als "Backup" im Produktivcode liegen lassen.

Keine Leichen.

Wenn eine Datei ersetzt wird und nicht mehr benötigt wird, soll sie entfernt werden.

---

## 16. Dokumentation

VISION.md beschreibt:

Was Neutral langfristig sein soll.

WORKFLOW.md beschreibt:

Wie Neutral entwickelt und geändert wird.

TODO.md beschreibt:

Was als Nächstes konkret erledigt werden muss.

Diese drei Dateien müssen konsistent bleiben.

---

## 17. Priorisierung

Priorität:

1. funktionierende Serververbindung
2. funktionierende API
3. getrennte Sessions
4. funktionierende User-App
5. funktionierender Admin-Bereich
6. Module
7. Rollen
8. Datenbank
9. Offline
10. GPS
11. weitere Funktionen
12. Design

---

## 18. Abschluss einer Aufgabe

Eine Aufgabe gilt erst als abgeschlossen, wenn:

- Code funktioniert
- relevante Tests funktionieren
- keine offensichtlichen Regressionen vorhanden sind
- Dokumentation aktualisiert ist
- Git-Diff geprüft ist
- Änderung committed ist
- Änderung auf dem vorgesehenen Branch gesichert ist

Nicht behaupten, etwas sei fertig, wenn es nur kompiliert oder ein Test grün ist.

# NEUTRAL – Vision

**Status:** LANGFRISTIGES ZIELBILD

**Geprüft:** 2026-09-03
**Einordnung:** Umfang und Abnahme der ersten stabilen Version stehen in [`CORE-1.0.md`](CORE-1.0.md). Der aktuelle Stand steht in [`STATUS.md`](STATUS.md).

## 1. Identität und Zweck

NEUTRAL ist ein neutrales Entwicklungsframework und eine technische Grundlage für zukünftige Anwendungen. NEUTRAL ist selbst keine Fachanwendung und enthält keine fachliche Produkt-Roadmap. Der Core bleibt unabhängig von jeder späteren Anwendung; fachliche Funktionen werden ausschließlich über definierte Erweiterungsschnittstellen angebunden.

Diese Vision beschreibt nur die langfristige Zielarchitektur. Sie ist weder Projektchronik noch Fehler-, Deployment- oder Betriebsprotokoll.

## 2. Zwei Hauptkomponenten

NEUTRAL besteht aus zwei klar getrennten Hauptkomponenten:

1. **Web-App** – enthält den neutralen Client-Core, die sichtbare Oberfläche und alle Funktionen, die auf dem Endgerät ausgeführt werden.
2. **Server** – enthält ausschließlich serverseitige Funktionen wie zentrale Authentifizierung, Autorisierung, Datenzugriff, Synchronisationsendpunkte und Administration serverseitiger Ressourcen.

Der verbindliche Datenfluss lautet:

```text
Web-App
   ↓ definierte HTTPS/API-Schnittstelle
Server
   ↓ kontrollierter Datenzugriff
Datenbank
```

Die Web-App greift niemals direkt auf die Serverdatenbank zu. Transport, Serverimplementierung und Datenbank werden über Verträge, Konfiguration und Adapter entkoppelt.

## 3. Verantwortungsgrenzen

### 3.1 Web-App und Client-Core

Der Client-Core stellt universelle technische Fähigkeiten bereit:

- Initialisierung und Lifecycle
- Event-System
- Konfiguration
- lokale Speicherung und lokale Datenbank
- Online-/Offline-Erkennung
- API-Kommunikation
- Authentifizierungsclient und Benutzerkontext
- Rollen- und Berechtigungsschnittstellen
- Grundlage für Synchronisation, Queue und Konfliktbehandlung
- Fehlerbehandlung, Logging und Diagnostik
- Caching
- abstrahierte Gerätefunktionen
- Services und Erweiterungspunkte
- Modul-Discovery und Modul-Lifecycle

Der Core stellt Verträge bereit, aber keine fachlichen Funktionen. **Der Core wird nicht für einzelne Features umgebaut.** Eine Erweiterung darf nur dann eine Core-Änderung erfordern, wenn eine nachweislich universelle, sauber abstrahierte Fähigkeit fehlt.

### 3.2 Server

Der Server ist die Vertrauens- und Persistenzgrenze für zentrale Daten. Zu seinen Aufgaben gehören:

- HTTPS/API-Endpunkte
- serverseitige Identitäts-, Session-, Rollen- und Rechteprüfung
- CSRF-Schutz für zustandsändernde Browseranfragen
- validierter Datenbankzugriff
- Migrationen und serverseitige Konfiguration
- Audit-, Diagnose- und Betriebsfunktionen
- künftige Synchronisations- und Konfliktendpunkte

Der Server enthält keine endgerätespezifische UI-Logik und darf den Client-Core nicht duplizieren.

## 4. Entkopplung und Erweiterbarkeit

Erweiterungen sind möglichst unabhängig voneinander. Sie verwenden veröffentlichte Core-Services, Events, Konfiguration, Storage- und API-Verträge statt interner Core-Implementierungen. Direkte Änderungen an fremden Modulen oder privaten Core-Dateien sind untersagt.

Abhängigkeiten müssen im Manifest deklariert, versionierbar und vor Aktivierung validiert werden. Kommunikation zwischen Erweiterungen erfolgt über dokumentierte Events, Services oder explizite APIs. Ein Fehler in einer Erweiterung soll diagnostizierbar bleiben und den Core nicht dauerhaft funktionsunfähig machen.

Der Modul-Lifecycle umfasst als Ziel mindestens Discovery, Registration/Installation, Inactive, Activation, Active, Deactivation, Update und Uninstallation. Discovery oder Installation bedeutet niemals automatische Aktivierung.

## 5. Offline-First

Offline-First ist verbindliches Architekturziel. Grundlegende Clientfunktionen müssen ohne permanente Serververbindung weiterarbeiten können, soweit ihre fachliche Funktion keinen aktuellen Serverzustand zwingend erfordert.

Die Zielarchitektur umfasst:

- lokale persistente Speicherung
- eine lokale Datenbank mit versioniertem Schema
- eine persistente Sync-Queue
- Änderungsstatus pro synchronisierbarem Datensatz
- idempotente Übertragung und kontrollierte Wiederholungen
- Retry mit Begrenzung und Backoff
- explizite Konflikterkennung und definierte Konfliktstrategien
- Cache mit Gültigkeit und Invalidierung
- lokale Migrationen
- Daten- und Schema-Versionierung
- Online-/Offline-Erkennung und Wiederanlauf nach Verbindungswechsel

Lokale Änderungen dürfen nicht stillschweigend verloren gehen. Der Benutzer muss relevante Sync- und Konfliktzustände erkennen können. Authentifizierungs-, Rechte- und Datenschutzregeln gelten auch für lokal gespeicherte Daten.

Für die öffentliche, nicht angemeldete Nutzung bildet der Server ausschließlich die im Adminbereich für die Systemrolle `viewer` vergebenen Modulrechte auf einen bereinigten Clientkontext ab. Sichtbarkeit und lokale Nutzung bleiben getrennt; daraus entstehen niemals Admin-, Datenbank- oder sonstige Serverrechte. Ein erfolgreich geladener anonymer Modulkatalog darf lokal als Offlinefallback gespeichert werden. Authentifizierte Kataloge dürfen nicht als anonymer Fallback dienen; ohne bestätigten anonymen Katalog bleibt die Modulnavigation geschlossen.

## 6. Mobile-First

Primäre Zielgeräte sind Android-Telefone, iPhone, iPad und Tablets. Desktop-Unterstützung bleibt vorgesehen, ist zunächst jedoch nachrangig.

Bedienung, Layout, Touch-Ziele, Geräteschnittstellen, Speichergrenzen, instabile Netze und Energieverbrauch werden mobile-first geplant. Ältere, noch sinnvoll verbreitete Browser- und Gerätegenerationen werden berücksichtigt; die unterstützte Mindestmatrix wird gemessen, dokumentiert und regelmäßig überprüft. Progressive Enhancement ist gegenüber unnötiger Geräteausgrenzung zu bevorzugen.

## 7. Startperformance

Die sichtbare Grundoberfläche soll möglichst sofort dargestellt werden. Vor dem First Paint dürfen insbesondere folgende Vorgänge nicht unnötig blockieren:

- Netzwerkzugriffe
- serverseitige Authentifizierungsprüfung
- lokale Datenbankinitialisierung
- Synchronisation
- Modul-Discovery
- weitere langsame Initialisierung

Verbindliche Reihenfolge:

```text
UI zuerst → notwendiger minimaler Core → Hintergrundinitialisierung
```

Die Anwendung zeigt belastbare Lade-, Offline- und Fehlerzustände. Startzeit, First Paint und Interaktionsbereitschaft werden auf realistischen Mobilgeräten gemessen. Nicht benötigte Module und Daten werden verzögert geladen.

## 8. Server-Minimalarchitektur und Portabilität

Die verbindliche Mindestplattform für Core 1.0 ist PHP 8.x mit MySQL/MariaDB und HTTPS auf normalem Shared Hosting. Node.js, permanente Worker, Redis und WebSockets dürfen später als leistungsfähigere Adapter ergänzt werden, sind aber keine Voraussetzung für die Grundfunktion. Ein Infrastrukturwechsel soll den öffentlichen App-/API-Vertrag nicht unnötig verändern.

Die erste Produktionsversion muss auf einfachem Shared Hosting lauffähig sein. Referenzumgebung:

- Linux
- cPanel
- LiteSpeed oder kompatibler Apache-Betrieb
- PHP 8.x
- MariaDB oder MySQL
- HTTPS

Keine Produktionsvoraussetzung sind Node.js, npm, npx, Passenger, SSH, ein öffentlicher Port 3000 oder ein dauerhaft laufender Node-Prozess. Node-basierte Werkzeuge dürfen Entwicklung und Tests unterstützen, aber nicht zwingende Laufzeitbedingung der ersten Produktion sein.

Der Core wird nicht auf diesen Host fest verdrahtet. API-Basis, Datenbank, Dateipfade, Transport und Provider werden konfiguriert oder adaptiert. Ein späterer Wechsel von Shared Hosting zu leistungsfähigerem Hosting, einem anderen Server oder einer anderen Infrastruktur muss ohne fachlichen Umbau des Client-Core möglich bleiben.

## 9. Sicherheit und Datenschutz

Der Server ist für die endgültige Identitäts- und Berechtigungsentscheidung verantwortlich. Der Browserzustand allein erteilt keine Serverrechte. Produktion verwendet HTTPS, sichere Session-Cookies, CSRF-Schutz, validierte Eingaben, parametrisierte Datenbankzugriffe, minimale Rechte und nachvollziehbare Auditdaten.

Secrets bleiben außerhalb des Repositorys und außerhalb ausgelieferter Clientdateien. Lokal gespeicherte personenbezogene oder gerätebezogene Daten werden minimiert, zweckgebunden behandelt und mit Lösch-, Export- und Schutzkonzepten versehen. Logging darf keine Passwörter, Session-Geheimnisse oder unnötigen personenbezogenen Inhalte enthalten.

## 10. GPS als technische Referenzerweiterung

GPS ist keine Kernfunktion und keine fachliche Ausrichtung von NEUTRAL. GPS ist derzeit die konkrete technische Referenzerweiterung zur Validierung von:

- Geräteberechtigungen und Geolocation
- Core-Schnittstellen und Modul-Lifecycle
- lokaler Speicherung und Offline-Verhalten
- künftiger Synchronisation
- API- und Datenbankintegration

Erkenntnisse werden nur dann in den Core übernommen, wenn sie universell abstrahiert sind. GPS-spezifische Daten, UI und Regeln bleiben im GPS-Modul.

Der aktuelle Referenzvertrag zeigt eine vorhandene lokale Position sofort. Eine neue Positionsabfrage erfolgt beim Öffnen genau einmal automatisch, wenn die Browserberechtigung bereits erteilt ist; ein erstmaliger Berechtigungsdialog wird weiterhin nur durch eine ausdrückliche Benutzeraktion ausgelöst.

## 11. Qualitätsziel

Eine Fähigkeit gilt erst als tragfähig, wenn ihr Vertrag dokumentiert, ihre Fehlerfälle definiert und relevante Tests bestanden sind. Architekturstatus wird ehrlich als **IST**, **GEPLANT** oder **FEHLT** dokumentiert. Zielbeschreibungen dürfen nicht als bereits implementiert ausgegeben werden.

NEUTRAL erreicht sein Ziel, wenn neue Erweiterungen über stabile Verträge ergänzt, betrieben, aktualisiert und entfernt werden können, ohne den neutralen Core für einzelne Features umzubauen und ohne die Web-App an eine konkrete Serverinfrastruktur zu binden.

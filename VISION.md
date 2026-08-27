VISION.md

Kapitel 1 – Ziel und Grundvision

1.1 Zweck dieses Dokuments

Diese Datei ist die zentrale Master-Vision für das neutrale Framework `Neutral`.

Sie ersetzt langfristig die bisher verteilten Einzelbeschreibungen, sofern deren Inhalte vollständig in diese Vision übernommen und konsolidiert wurden.

Dieses Dokument beschreibt das gewünschte Endziel des Systems. Es ist keine Einschränkung auf den derzeit vorhandenen Entwicklungsstand.

`Neutral` ist das allgemeine Master-/Entwicklungsframework für modulare Anwendungen. Das Framework selbst soll nicht als eine einzelne Fachanwendung festgeschrieben werden.

Der aktuelle Codebestand ist als Ausgangspunkt zu betrachten. Wenn die bestehende Architektur geändert, erweitert oder teilweise ersetzt werden muss, ist dies ausdrücklich zulässig.

Vorhandene Dateien, Strukturen und Implementierungen sind kein Selbstzweck.

Entscheidend ist ausschließlich, dass das definierte Endziel technisch sauber, stabil, wartbar und langfristig erweiterbar erreicht wird.

⸻

1.2 Die eigentliche Vision

`Neutral` soll nicht lediglich eine einzelne Fach-App werden.

`Neutral` ist das grundlegende, neutrale und wiederverwendbare Framework, auf dem spätere Anwendungen und Module aufbauen können.

Von diesem Zeitpunkt an sollen zukünftige Anwendungen und Funktionen möglichst ausschließlich als Module bzw. eigenständige Erweiterungen hinzugefügt werden.

Beispiele:

* Angel-App
* Camping-App
* Wetter-App
* modulare Referenz-/Validierungsbeispiele ohne feste Core-Anbindung
* Foto-/Medienmodul
* Benutzerverwaltung
* Rollen- und Rechteverwaltung
* Synchronisation
* Benachrichtigungen
* Werbung
* Marketplace
* Informationsaustausch
* Community-Funktionen
* weitere zukünftige Anwendungen und Fachmodule

Diese Beispiele dienen der Architektur- und Funktionsidee zukünftiger Anwendungen.

Der Core soll dafür nicht jedes Mal grundlegend verändert werden müssen.

⸻

1.3 Grundprinzip

Die Architektur folgt dem Prinzip:

CORE + FINAL FRAMEWORK + MODULE

Dabei gilt:

CORE

Der Core stellt die technische Grundlage und die universellen Schnittstellen bereit.

Er enthält nur Funktionen, die für das Framework selbst notwendig oder als universelle Infrastruktur sinnvoll sind.

FINAL FRAMEWORK

Der Core wird durch die grundlegenden, optional nutzbaren Framework-Bereiche ergänzt, insbesondere User- und Administrationsfunktionen.

Diese Bereiche sollen nicht mit einer konkreten Fachanwendung verheiratet sein.

MODULE

Alles, was eine konkrete fachliche Funktion erfüllt, soll möglichst außerhalb des Core liegen.

Ein Modul soll seine eigene Funktionalität, Oberfläche, Konfiguration, Datenstrukturen und erforderlichen Ressourcen möglichst selbst mitbringen.

⸻

1.4 Keine künstlichen Grenzen

Die Vision darf nicht dadurch eingeschränkt werden, dass bestehende Dateien oder die derzeitige Architektur unverändert bleiben müssen.

Wenn eine bestehende Core-Datei technisch neu aufgebaut werden muss, darf sie geändert oder ersetzt werden.

Wenn bestehende Module neu strukturiert werden müssen, darf dies ebenfalls geschehen.

Wenn bestehende Architekturentscheidungen dem Endziel widersprechen, sind sie zu korrigieren.

Dabei ist jedoch darauf zu achten, dass funktionierende Bestandteile nicht ohne technischen Grund zerstört werden.

⸻

1.5 Ziel der Entkopplung

Der wichtigste architektonische Grundsatz ist die maximale sinnvolle Entkopplung.

Der Core soll möglichst wenig über konkrete Module wissen.

Module sollen möglichst wenig über interne Implementierungsdetails des Core wissen.

Die Kommunikation erfolgt über definierte Schnittstellen, Services, APIs, Hooks, Events oder vergleichbare Erweiterungspunkte.

Dadurch soll erreicht werden:

* Fehler in einem Modul beschädigen den Core möglichst nicht.
* Ein Modul kann unabhängig weiterentwickelt werden.
* Module können installiert, entfernt oder ersetzt werden.
* Funktionen können erweitert werden, ohne den gesamten Core umzubauen.
* unterschiedliche Apps können unterschiedliche Module verwenden.
* unterschiedliche Apps können unterschiedliche Designs verwenden.
* nicht benötigte Funktionen müssen nicht Bestandteil jeder Anwendung sein.

### Web-App als eigenständiger Client

Die Web-App ist als eigenständiger öffentlicher Client zu verstehen, der mit der Neutral-API über öffentliche HTTPS-Endpunkte kommuniziert. Sie darf nicht von localhost, 127.0.0.1, internen Ports, lokalen Entwicklungsservern oder hostinternen Annahmen abhängen.

Die maßgebliche Public-API-Basis ist:

* https://www.turbolikes.com/index/app/neutral/webroot/api/

Der konkrete Web-App-Client-Pfad für Entwicklung und Test bleibt separat:

* https://www.turbolikes.com/index/web-app/

Dieser Pfad muss auf den tatsächlichen Web-App-Document-Root des Hostings verweisen. Er darf nicht durch den Neutral-Serverpfad `/index/app/neutral/webroot/` ersetzt werden. Der Web-App-Einstiegspunkt ist ein eigener öffentlich erreichbarer Clientpfad; der Server-/Anwendungsbereich von Neutral bleibt getrennt davon.

Der aktuelle Live-Check hat den tatsächlichen Stand bestätigt: Der Web-App-FTP-Account liefert das echte Web-App-Bundle im chrooted Root `/`; die öffentliche URL `/index/web-app/` liefert dagegen weiterhin den veralteten Platzhalter und 404s für CSS/JS-Assets. Die eigentliche Ursache im Repository war der deploy-side Fehler: `--web-app` wurde nie richtig ausgewertet, sodass das Script immer den Server-Allowlist-Pfad statt des Web-App-Bundles vorbereitet hat. Dieser Fehler wurde im Deploy-Skript behoben. Dennoch bleibt die Live-Host-Mapping für diese URL der entscheidende offene Punkt, denn der öffentliche HTTP-Pfad muss noch auf denselben Dokument-Root wie der FTP-Root verweisen, bevor ein echter Browser-/Mobiltest als erfolgreich gelten kann.

Der Client muss Login, Session, RBAC, Module, GPS und Logout auf Basis dieser öffentlichen API verarbeiten. Lokale Entwickler- oder Preview-Pfade sind nur als lokale Hilfsmechanik zu behandeln, nicht als Produktionsvoraussetzung.

⸻

1.6 Offline First

Das Framework soll grundsätzlich Offline First unterstützen.

Eine Anwendung soll auch ohne permanente Serververbindung sinnvoll funktionieren können, sofern ihre konkrete Funktionalität dies zulässt.

Der Server ist daher nicht grundsätzlich Bestandteil jeder lokalen Funktion.

Die lokale Anwendung soll ihre notwendigen Daten und Funktionen lokal verwalten können.

Eine Online-Anbindung wird nur dort verwendet, wo sie tatsächlich benötigt wird, beispielsweise für:

* Synchronisation
* zentrale Speicherung
* Benutzerkonten
* gemeinsame Daten
* Medien
* Benachrichtigungen
* Backups
* serverseitige Dienste
* andere ausdrücklich online erforderliche Funktionen

Eine reine Offline-App soll nicht gezwungen werden, ein vollständiges Server-, Benutzer- oder Administrationssystem zu verwenden.

⸻

1.7 Eine Anwendung statt getrennter Oberflächen

Die Benutzeroberfläche und die Administrationsoberfläche sollen grundsätzlich Bestandteil derselben Anwendung sein können.

Ein Benutzer sieht seine normale Anwendung.

Ein Benutzer mit entsprechenden Rechten kann zusätzlich einen Admin-Bereich erhalten.

Beispiel:

Normale Ansicht

App-Menü

Bei berechtigtem Benutzer zusätzlich:

Admin

Beim Wechsel in den Admin-Bereich:

* normales App-Menü wird ausgeblendet,
* Administrationsmenü wird angezeigt,
* eine Zurück-Navigation ermöglicht die Rückkehr zur normalen App.

Dadurch wird keine zweite separate Admin-Anwendung benötigt.

Der Server bleibt für serverseitige Aufgaben zuständig, muss aber nicht zwingend die komplette Administrationsoberfläche hosten.

⸻

1.8 Server als Dienstebene

Bei einer Online-Version soll der Server primär die Aufgaben übernehmen, die eine zentrale oder externe Infrastruktur benötigen.

Beispiele:

* zentrale Datenspeicherung
* Synchronisation
* Medien-/Dateispeicherung
* Benutzerkonten, sofern benötigt
* Push-/Benachrichtigungsdienste
* API-Dienste
* Backups
* zentrale Kommunikation
* andere serverseitig notwendige Funktionen

Die konkrete Übertragungstechnologie ist nicht fest auf FTP festgelegt.

Für jeden Anwendungsfall soll das technisch sinnvollste und sicherste Verfahren verwendet werden, bevorzugt moderne API-basierte Übertragung, wenn dies fachlich sinnvoll ist.

Die Anwendung soll die Serververbindung über den Administrationsbereich konfigurieren können.

⸻

1.9 Medien und Bilder

Medien sollen möglichst bereits auf dem Endgerät optimiert werden, bevor sie übertragen werden.

Für Bilder soll der Upload-Prozess beispielsweise ermöglichen:

* automatische Größenanpassung
* Komprimierung
* Auswahl bzw. Konfiguration erlaubter Formate
* maximale Zielauflösung
* maximale Dateigröße
* Qualitätsstufe
* optional keine Optimierung
* unterschiedliche Optimierungsprofile

Die konkreten Werte sollen administrativ konfigurierbar sein.

Die Anwendung soll dabei auch Bilder von mobilen Endgeräten akzeptieren können, ohne den Benutzer mit unnötigen technischen Einschränkungen zu belasten.

Die Optimierung soll nach Möglichkeit vor der Übertragung erfolgen, um:

* Datenvolumen
* Server-Traffic
* Speicherplatz
* Upload-Zeit

zu reduzieren.

⸻

1.10 Designfreiheit

Der Core schreibt nicht das konkrete Erscheinungsbild einer Anwendung vor.

Jede Anwendung bzw. jedes größere Modul soll ein eigenes Design bzw. Theme verwenden können.

Beispiele:

* Fishing-Domain Design
* Camping Design
* Weather Design
* zukünftige App Designs

Das Design soll möglichst unabhängig von der technischen Core-Logik geändert werden können.

Das GPS-Modul ist deshalb kein verbindliches Design für das gesamte Framework.

⸻

1.11 Zukunftsfähigkeit

Das Ziel ist ein Core, der langfristig nicht für jede neue Anwendung erneut grundlegend verändert werden muss.

„Zukunftssicher“ bedeutet dabei nicht, dass zukünftige Anforderungen vorhersehbar sein müssen.

Es bedeutet:

Der Core stellt so viele allgemeine Erweiterungspunkte, Schnittstellen und technische Grundlagen bereit, dass neue Anforderungen möglichst durch Module, Konfiguration oder Erweiterungen umgesetzt werden können, ohne den zentralen Core erneut architektonisch umzubauen.

Der Core soll deshalb nicht versuchen, jede denkbare Fachfunktion selbst zu implementieren.

Er soll vielmehr die technischen Voraussetzungen dafür schaffen, dass neue Funktionen integriert werden können.

⸻

1.12 Oberstes Ziel

Am Ende soll ein Entwickler in der Lage sein, eine neue Anwendung möglichst nach folgendem Prinzip aufzubauen:

Core auswählen → benötigte Module hinzufügen → eigenes Design hinzufügen → konfigurieren → Anwendung betreiben

Ohne für jede neue Anwendung den Core neu entwickeln zu müssen.

⸻

Kapitel 2 – Architektur und Verantwortungsgrenzen

2.1 Grundstruktur

Das Framework wird grundsätzlich in drei Ebenen gedacht:

1. Core
2. Final Framework
3. Module

Diese Ebenen dürfen technisch sauber voneinander getrennt werden.

Die konkrete Verzeichnisstruktur darf vom Agenten angepasst werden, sofern dadurch eine bessere, stabilere und wartbarere Architektur entsteht.

Die funktionale Trennung bleibt jedoch erhalten.

⸻

2.2 Der Core

Der Core ist der technische Motor des Frameworks.

Er stellt die universellen Funktionen bereit, die eine Anwendung benötigt, um Module, Benutzeroberflächen und Erweiterungen zuverlässig auszuführen.

Der Core soll insbesondere geeignete Grundlagen für folgende Bereiche bereitstellen:

* Initialisierung
* Lifecycle
* Routing
* Navigation
* Konfiguration
* Modul-Erkennung
* Modul-Lifecycle
* Service-Registrierung
* Event-System
* Hooks bzw. Erweiterungspunkte
* API-Kommunikation
* lokale Datenhaltung
* Datenbank-/Storage-Abstraktion
* Migrationen
* Logging
* Fehlerbehandlung
* Diagnostik
* Security-Grundlagen
* Berechtigungs-Schnittstellen
* Theme-/Design-Erkennung
* Asset-Verwaltung
* Benachrichtigungs-Schnittstellen
* Serververbindung
* Synchronisations-Schnittstellen
* Update-Schnittstellen
* Erweiterungsmechanismen

Die konkrete technische Umsetzung entscheidet der Agent anhand der vorhandenen Architektur und der Anforderungen dieser Vision.

⸻

2.3 Der Core darf nicht fachlich abhängig sein

Der Core darf keine direkte Abhängigkeit zu einer bestimmten Fachanwendung besitzen.

Beispielsweise darf der Core nicht voraussetzen, dass eine Anwendung:

* GPS verwendet,
* Angeldaten besitzt,
* Campingdaten besitzt,
* Wetterdaten besitzt,
* Fotos verwendet,
* Benutzerkonten benötigt,
* Rollen benötigt,
* einen Server benötigt,
* online betrieben wird.

Stattdessen muss der Core solche Funktionen unterstützen können, ohne sie zwingend vorauszusetzen.

⸻

2.4 Final Framework

Das Final Framework besteht aus dem Core und den grundlegenden Framework-Funktionen, die für eine vollständige verwaltbare Anwendung sinnvoll sind.

Dazu gehören insbesondere:

* User Interface
* Administrationsoberfläche
* Konfiguration
* Benutzerverwaltung
* Rollenverwaltung
* Rechteverwaltung
* Modulverwaltung
* Systemverwaltung
* Diagnose
* Updates
* Serverkonfiguration
* Sicherheitsverwaltung

Diese Bereiche sollen technisch so integriert werden, dass sie nicht mit einer einzelnen Fachanwendung gekoppelt sind.

⸻

2.5 User Interface

Die Anwendung besitzt eine zentrale Benutzeroberfläche.

Sie besteht grundsätzlich aus:

* Header
* Navigation
* Main Content
* Footer

Die konkrete Gestaltung wird durch das jeweilige Design bzw. Theme bestimmt.

Der Core stellt dafür die erforderlichen Erweiterungspunkte bereit.

Module können eigene Menüpunkte, Ansichten und Inhalte registrieren.

Nicht benötigte Bereiche sollen nicht automatisch sichtbar sein.

⸻

2.6 Administrationsoberfläche

Die Administrationsoberfläche ist Bestandteil derselben Anwendung.

Ein Benutzer mit entsprechender Berechtigung kann aus der normalen Anwendung in den Admin-Bereich wechseln.

Beispiel:

App → Admin

Innerhalb des Admin-Bereichs wird die normale App-Navigation ersetzt oder entsprechend ausgeblendet.

Eine eindeutige Zurück-Navigation führt wieder zur normalen Anwendung.

Die Berechtigung für den Admin-Bereich darf nicht allein durch das Vorhandensein eines Buttons bestimmt werden.

Der Zugriff muss tatsächlich durch das Berechtigungs- und Authentifizierungssystem abgesichert sein.

⸻

2.7 Rollen und Benutzer

Benutzer, Rollen und Rechte sind keine zwingende Voraussetzung für jede Anwendung.

Sie sollen als optionaler Framework-Bereich bzw. Erweiterungsbereich konzipiert werden.

Eine reine Offline-App ohne Benutzerverwaltung soll nicht gezwungen werden, ein vollständiges Account- und Rollensystem zu laden.

Wenn Benutzerverwaltung benötigt wird, muss der Core jedoch die dafür notwendigen Schnittstellen bereitstellen.

Dadurch können unterschiedliche Anwendungen unterschiedliche Sicherheitsmodelle verwenden.

⸻

2.8 Module

Module sind die primäre Erweiterungsmöglichkeit des Frameworks.

Ein Modul kann grundsätzlich eigene:

* Funktionalität
* UI
* Menüpunkte
* Konfiguration
* Datenstrukturen
* Datenbanktabellen
* Migrationen
* Services
* Events
* Berechtigungen
* Assets
* Themes
* Serveranbindungen
* Updateinformationen

mitbringen.

Ein Modul darf nicht unnötig interne Core-Dateien verändern.

Die Kommunikation mit dem Core erfolgt über definierte Schnittstellen.

⸻

2.9 Modul-Lifecycle

Das Framework soll einen einheitlichen Lifecycle für Module unterstützen.

Mindestens folgende Zustände sollen vorgesehen werden:

* entdeckt
* installiert
* aktiviert
* deaktiviert
* aktualisiert
* deinstalliert

Je nach technischer Notwendigkeit können weitere Zustände ergänzt werden.

Der Lifecycle muss so gestaltet sein, dass ein Modul seine notwendigen Installations-, Migrations- und Deinstallationsschritte selbst definieren kann.

⸻

2.10 Modul-Isolation

Ein Fehler in einem einzelnen Modul darf den Core möglichst nicht beschädigen.

Module sollen deshalb möglichst isoliert arbeiten.

Fehlerhafte Module müssen diagnostizierbar sein.

Der Core soll erkennen können:

* welches Modul betroffen ist,
* welche Version installiert ist,
* welche Abhängigkeiten bestehen,
* welcher Lifecycle-Schritt fehlgeschlagen ist,
* welche Fehler protokolliert wurden.

Wenn technisch sinnvoll, soll ein fehlerhaftes Modul deaktiviert werden können, ohne das gesamte Framework außer Betrieb zu setzen.

⸻

2.11 Module dürfen umfangreich sein

Modular bedeutet nicht, dass jede einzelne Kleinigkeit ein separates Modul werden muss.

Ein Modul darf mehrere logisch zusammengehörige Funktionen enthalten.

Beispielsweise kann ein Benutzer-Modul enthalten:

* Benutzer
* Rollen
* Rechte
* Sessions
* Benutzerprofil

Ebenso kann ein Medien-Modul enthalten:

* Upload
* Bildoptimierung
* Medienverwaltung
* Speicherverwaltung

Die Entscheidung über die sinnvolle Modulgröße soll anhand funktionaler Zusammengehörigkeit und Wartbarkeit getroffen werden.

⸻

2.12 Theme- und Design-System

Design und Funktionalität müssen voneinander getrennt bleiben.

Ein Theme soll möglichst ausschließlich für Darstellung und Benutzererlebnis verantwortlich sein.

Der Core darf nicht von einem bestimmten Theme abhängig sein.

Ein Theme kann beispielsweise definieren:

* Farben
* Typografie
* Layout
* Komponenten
* Navigation
* Icons
* Abstände
* Responsive Verhalten
* Modul-Darstellung

Die technischen Funktionen der Module bleiben davon getrennt.

⸻

2.13 App-spezifische Menüs

Jede konkrete Anwendung darf ihr eigenes Menü besitzen.

Der Core stellt lediglich die Navigationstechnologie bereit.

Ein Modul kann Menüeinträge registrieren.

Das Theme entscheidet über deren konkrete Darstellung.

Damit können unterschiedliche Apps vollständig unterschiedliche Benutzeroberflächen besitzen, während derselbe Core verwendet wird.

⸻

2.14 Serverunabhängigkeit

Der Core darf nicht fest auf einen bestimmten Hostinganbieter, Server oder Übertragungsweg zugeschnitten werden.

Eine Serververbindung wird über eine standardisierte Schnittstelle abstrahiert.

Die konkrete Verbindung kann abhängig von der jeweiligen Anwendung beispielsweise über:

* HTTPS/API
* WebSocket
* andere geeignete Protokolle

realisiert werden.

FTP oder ähnliche Verfahren dürfen verwendet werden, wenn sie für einen konkreten Verwaltungszweck sinnvoll sind, sollen aber nicht ohne technischen Grund die zentrale Kommunikationsarchitektur bestimmen.

⸻

2.15 Lokale und serverseitige Daten

Die Anwendung soll zwischen lokalen und serverseitigen Daten unterscheiden können.

Lokale Daten können beispielsweise sein:

* Einstellungen
* Offline-Daten
* Cache
* lokale Arbeitsstände

Serverdaten können beispielsweise sein:

* zentrale Benutzer
* synchronisierte Daten
* gemeinsam genutzte Inhalte
* Medien
* Backups

Der Core stellt die dafür erforderlichen Abstraktionen bereit.

Die konkrete Entscheidung, welche Daten lokal oder serverseitig gespeichert werden, trifft das jeweilige Modul bzw. die Anwendungskonfiguration.

⸻

2.16 Keine unnötigen Abhängigkeiten

Eine zentrale Architekturregel lautet:

So wenig Abhängigkeiten wie möglich.

Wenn eine Funktion unabhängig implementiert werden kann, soll sie unabhängig bleiben.

Wenn zwei Komponenten miteinander kommunizieren müssen, soll die Verbindung über einen klar definierten Vertrag erfolgen.

Interne Implementierungsdetails dürfen nicht unnötig nach außen gelangen.

⸻

2.17 Zielarchitektur

Die gewünschte Richtung lautet:

FINAL FRAMEWORK
│
├── CORE
│   ├── Lifecycle
│   ├── Routing
│   ├── Navigation
│   ├── Storage
│   ├── API
│   ├── Events
│   ├── Hooks
│   ├── Services
│   ├── Security-Grundlagen
│   ├── Logging
│   ├── Diagnostics
│   ├── Module Engine
│   └── Theme Engine
│
├── FRAMEWORK MODULES
│   ├── User
│   ├── Administration
│   ├── Server
│   ├── Notifications
│   └── weitere optionale Framework-Bereiche
│
└── APPLICATION MODULES
    ├── GPS (historisches Test-Referenzmodul)
    ├── Camping
    ├── Weather
    ├── Marketplace
    ├── Advertising
    └── zukünftige Module

Diese Struktur ist ein architektonisches Zielmodell, keine zwingende Vorgabe für konkrete Dateinamen oder Programmiersprachen.

Die tatsächliche Implementierung darf davon abweichen, wenn dadurch das gleiche Ziel technisch besser erreicht wird.

⸻

Kapitel 3 – User Interface, Navigation und Admin-Bereich

3.1 Grundaufbau der Anwendung

Die Anwendung soll grundsätzlich aus einer gemeinsamen Benutzeroberfläche bestehen.

Die Oberfläche wird nicht in eine separate User-App und eine separate Admin-App aufgeteilt.

Stattdessen existieren innerhalb derselben Anwendung unterschiedliche Ansichten und Funktionsbereiche.

Grundsätzlich vorgesehen sind:

* normaler Benutzerbereich
* Administrationsbereich
* optionaler Developer-/Systembereich
* Setup-/Installationsbereich
* Fehler-/Diagnosebereich

Welche Bereiche tatsächlich vorhanden und sichtbar sind, hängt von den aktivierten Funktionen und den Berechtigungen des Benutzers ab.

⸻

3.2 Hauptlayout

Das grundlegende Layout besteht aus:

┌──────────────────────────────┐
│            HEADER            │
├──────────────────────────────┤
│           NAVIGATION         │
├──────────────────────────────┤
│                              │
│         MAIN CONTENT         │
│                              │
├──────────────────────────────┤
│            FOOTER            │
└──────────────────────────────┘

Die konkrete Darstellung wird durch das jeweilige Theme bestimmt.

Der Core stellt lediglich die notwendigen Strukturen und Schnittstellen bereit.

⸻

3.3 Dynamische Navigation

Die Navigation darf nicht statisch auf eine einzelne Anwendung festgelegt sein.

Module müssen Menüpunkte registrieren können.

Ein Menüeintrag kann beispielsweise enthalten:

* Titel
* Icon
* Route
* Zielbereich
* Priorität
* erforderliche Berechtigung
* Sichtbarkeitsregel
* Modulzugehörigkeit

Der Core baut daraus die tatsächlich sichtbare Navigation.

Nicht aktivierte oder nicht installierte Module dürfen keine funktionslosen Menüeinträge hinterlassen.

⸻

3.4 App-spezifische Navigation

Jede Anwendung darf ihr eigenes Menü besitzen.

Beispielsweise könnten eine Fishing-App und eine Camping-App unterschiedliche Menüpunkte verwenden.

Der Core stellt lediglich die technische Navigation bereit.

Die konkrete Zusammenstellung des Menüs wird von der jeweiligen Anwendung bzw. ihren Modulen bestimmt.

Dadurch kann ein Modul vollständig eigene Menüstrukturen mitbringen.

⸻

3.5 Dynamischer Footer

Der Footer soll ebenfalls modular erweiterbar sein.

Ein Modul kann Inhalte für den Footer registrieren.

Wenn kein Modul einen entsprechenden Inhalt bereitstellt, bleibt der entsprechende Bereich leer oder wird abhängig vom Theme vollständig ausgeblendet.

Mögliche Inhalte sind beispielsweise:

* Banner
* Werbung
* Informationen
* Links
* Copyright
* Statusinformationen
* Modulhinweise

Ein zukünftiger Werbe- oder Marketplace-Bereich muss deshalb nicht Bestandteil des Core sein.

⸻

3.6 Wechsel in den Admin-Bereich

Ein Benutzer mit ausreichenden Rechten kann innerhalb der Anwendung einen Menüpunkt bzw. Button wie beispielsweise:

Admin

sehen.

Beim Wechsel in den Admin-Bereich wird die normale Navigation durch die Administrationsnavigation ersetzt.

Beispiel:

Normale Anwendung
       │
       ▼
     ADMIN
       │
       ▼
Administrationsbereich

Der Admin-Bereich bleibt dabei Bestandteil derselben Anwendung.

⸻

3.7 Rückkehr aus dem Admin-Bereich

Im Admin-Bereich soll eine eindeutig erkennbare Zurück-Navigation vorhanden sein.

Beispielsweise:

← Zurück

Durch diese Navigation gelangt der Benutzer wieder in die normale Anwendung.

Der Wechsel darf nicht zu einem vollständigen Neustart der Anwendung führen, sofern dies technisch nicht erforderlich ist.

⸻

3.8 Berechtigungsprüfung

Die Sichtbarkeit eines Admin-Buttons darf nicht die einzige Sicherheitsmaßnahme sein.

Jede geschützte Route und jede geschützte Funktion muss server- bzw. lokal-seitig entsprechend den verfügbaren Berechtigungsmechanismen geprüft werden.

Ein Benutzer darf eine geschützte Funktion nicht allein dadurch erreichen können, dass er deren URL oder Route manuell aufruft.

Die Berechtigungsprüfung muss möglichst zentral über definierte Core-Schnittstellen erfolgen.

⸻

3.9 Rollenabhängige Navigation

Die Navigation kann abhängig von Rolle und Berechtigung unterschiedlich aussehen.

Beispiel:

USER
├── Start
├── Module
└── Profil
DEVELOPER
├── Start
├── Module
├── Profil
└── Admin
ADMIN
├── Start
├── Module
├── Profil
└── Admin

Die konkrete Rollenstruktur ist nicht fest vorgegeben.

Das Framework muss jedoch in der Lage sein, beliebige Rollen und Berechtigungen abzubilden, wenn das entsprechende Modul aktiviert ist.

⸻

3.10 Login

Wenn eine Anwendung Benutzerkonten verwendet, muss der Login vollständig funktional sein.

Der Login-Prozess muss mindestens:

1. Benutzer identifizieren,
2. Zugangsdaten bzw. Authentifizierungsinformationen prüfen,
3. eine gültige Session bzw. einen entsprechenden Authentifizierungszustand erzeugen,
4. Berechtigungen laden,
5. den vorgesehenen Benutzerbereich bestimmen,
6. den Benutzer korrekt weiterleiten.

Ein erfolgreicher Login darf nicht lediglich zu einer statischen Startseite führen, wenn für den Benutzer ein anderer Zielbereich vorgesehen ist.

⸻

3.11 Rollenabhängige Weiterleitung

Nach erfolgreicher Anmeldung muss eine korrekte Weiterleitung erfolgen.

Beispielsweise:

Login
 │
 ├── normaler Benutzer → User Interface
 │
 ├── Developer → User Interface + Admin-Zugriff
 │
 └── Administrator → User Interface + Admin-Zugriff

Die tatsächliche Struktur hängt vom aktivierten Benutzer-/Rollenmodul ab.

Die Weiterleitungslogik muss zentral und zuverlässig funktionieren.

⸻

3.12 Logout

Logout muss den Authentifizierungszustand korrekt beenden.

Dazu gehören abhängig von der eingesetzten Architektur:

* Session beenden
* Tokens invalidieren
* lokale Authentifizierungsdaten entfernen
* geschützte Bereiche sperren
* Rückkehr zur vorgesehenen öffentlichen Ansicht

Nach dem Logout darf ein geschützter Bereich nicht durch einfache Navigation oder Browser-History ohne erneute Authentifizierung erreichbar sein.

⸻

3.13 Setup-Bereich

Das Framework soll einen Setup-/Installationsbereich besitzen, sofern die jeweilige Anwendung einen solchen benötigt.

Der Setup-Prozess soll beispielsweise erkennen können:

* Erstinstallation
* fehlende Konfiguration
* fehlende Datenbankstrukturen
* fehlende Migrationen
* fehlende Pflichtmodule
* fehlende Serververbindung

Der Setup-Bereich darf nur dann aktiv sein, wenn dies tatsächlich erforderlich ist.

Nach erfolgreichem Setup muss die Anwendung automatisch in den normalen Betriebszustand wechseln.

⸻

3.14 Admin-Dashboard

Der Admin-Bereich soll über ein zentrales Dashboard verfügen.

Das Dashboard kann Informationen aus verschiedenen Modulen zusammenführen.

Beispielsweise:

* Systemstatus
* aktive Module
* Updatehinweise
* Benutzerinformationen
* Serverstatus
* Speicherstatus
* Fehler
* Warnungen
* Synchronisationsstatus
* Benachrichtigungen

Das Dashboard selbst soll generisch bleiben.

Module sollen eigene Widgets oder Informationen registrieren können.

⸻

3.15 Administration von Modulen

Der Admin-Bereich soll die zentrale Verwaltung installierter Module ermöglichen.

Mindestens vorgesehen sind:

* Module anzeigen
* Modulstatus anzeigen
* Modul aktivieren
* Modul deaktivieren
* Modul konfigurieren
* Modul aktualisieren
* Modul deinstallieren
* Modulversion anzeigen
* Modulabhängigkeiten anzeigen
* Fehlerzustand anzeigen

Ein Modul soll möglichst seine eigenen administrativen Einstellungen registrieren können.

⸻

3.16 Administrative Einstellungen

Module sollen ihre administrativen Einstellungen nicht in beliebigen Core-Dateien hinterlegen müssen.

Stattdessen soll das Framework eine zentrale Konfigurationsschnittstelle bereitstellen.

Ein Modul kann dadurch beispielsweise eigene Einstellungen definieren für:

* Bildoptimierung
* Upload-Größen
* erlaubte Dateiformate
* Synchronisation
* Serververbindung
* Benachrichtigungen
* Anzeigeoptionen
* Datenhaltung

Der Admin-Bereich stellt die entsprechende Oberfläche bereit oder ermöglicht dem Modul, eine eigene Konfigurationsoberfläche einzubinden.

⸻

3.17 Bildverwaltung und Upload-Konfiguration

Die Bildverarbeitung soll administrativ konfigurierbar sein.

Mögliche Einstellungen:

* Optimierung aktiv/deaktiviert
* maximale Auflösung
* maximale Dateigröße
* Zielformat
* Qualitätsstufe
* Komprimierung
* automatische Rotation
* Metadatenbehandlung
* Thumbnail-Erstellung
* Vorschaugröße

Die tatsächliche technische Verarbeitung soll nach Möglichkeit bereits auf dem Endgerät stattfinden.

Dadurch werden unnötige Upload-Daten vermieden.

⸻

3.18 Benachrichtigungen

Die Anwendung soll ein generisches Benachrichtigungssystem unterstützen.

Benachrichtigungen können beispielsweise ausgelöst werden durch:

* neue Benutzerregistrierung
* neue Inhalte
* Fehler
* Serverprobleme
* Updates
* Synchronisationsprobleme
* Modulereignisse
* administrative Ereignisse

Beispiel:

Neue Benutzer-Registrierung

oder

Fehler bei der Daten-Synchronisation

Das Benachrichtigungssystem soll nicht auf eine einzelne Anwendung beschränkt sein.

⸻

3.19 Admin und Offline First

Die Administrationsfunktionen sollen grundsätzlich auch lokal funktionieren können, soweit die konkrete Funktion keine Serververbindung benötigt.

Beispielsweise können lokal verwaltet werden:

* Module
* Themes
* Einstellungen
* Benutzer, sofern lokal vorgesehen
* Rollen
* Rechte
* Bildoptimierung
* lokale Daten

Serverabhängige Funktionen benötigen dagegen eine konfigurierte Verbindung.

⸻

3.20 Serververbindung im Admin-Bereich

Der Administrator bzw. Developer soll die Serververbindung innerhalb der Anwendung konfigurieren können.

Mögliche Konfigurationsdaten:

* Serveradresse
* API-Endpunkt
* Zugangsdaten bzw. Authentifizierungsinformationen
* Speicherpfad
* Synchronisationsoptionen
* Uploadoptionen
* Verbindungseinstellungen

Sensible Zugangsdaten müssen sicher gespeichert werden.

Die konkrete technische Speicherung und Übertragung entscheidet der Agent anhand der Sicherheitsanforderungen.

⸻

3.21 Keine zweite Administrationsanwendung

Es soll keine zwingende separate Admin-Webseite benötigt werden, nur um die lokale Anwendung administrieren zu können.

Die zentrale Administration soll Bestandteil der Anwendung sein.

Eine zusätzliche serverseitige Verwaltung kann später als optionales Modul oder separates Werkzeug ergänzt werden, falls dies erforderlich wird.

⸻

3.22 Responsive und geräteunabhängige Oberfläche

Das User Interface und der Admin-Bereich sollen responsive aufgebaut sein.

Die Anwendung soll insbesondere auf mobilen Geräten sinnvoll bedienbar sein.

Das Layout darf nicht von einer Desktopauflösung abhängig sein.

Die Darstellung auf größeren Bildschirmen soll trotzdem funktionieren.

Die konkrete maximale Medienauflösung ist unabhängig davon konfigurierbar.

⸻

3.23 Grundsatz für zukünftige Module

Jedes zukünftige Modul soll sich in die bestehende Benutzeroberfläche integrieren können, ohne die grundlegende Navigation oder das Layout des Core umzubauen.

Das Modul liefert seine fachliche Funktion.

Der Core stellt die Integrationsmechanismen bereit.

Das Theme bestimmt die Darstellung.

Der Admin-Bereich stellt die Verwaltungsmechanismen bereit.

Damit entsteht folgende Trennung:

CORE
    technische Infrastruktur
MODULE
    fachliche Funktion
THEME
    Darstellung
ADMIN
    Verwaltung
SERVER
    zentrale Online-Dienste

Diese Trennung ist eines der zentralen Ziele der gesamten Architektur.

⸻

Kapitel 4 – Modul-System und Erweiterbarkeit

4.1 Grundprinzip

Module sind die wichtigste Erweiterungsmöglichkeit des Frameworks.

Ein Modul erweitert das Framework, ohne den Core unnötig verändern zu müssen.

Das Ziel ist:

Neue fachliche Funktionen sollen möglichst durch das Hinzufügen, Aktivieren und Konfigurieren eines Moduls entstehen können.

Der Core stellt dafür die notwendigen technischen Schnittstellen bereit.

4.2 Selbstständigkeit eines Moduls

Ein Modul soll möglichst alle für seine Funktion erforderlichen Bestandteile selbst mitbringen.

Dazu können gehören:

* Programmcode
* UI
* Konfiguration
* Assets
* Datenbankdefinitionen
* Migrationen
* Berechtigungen
* Menüpunkte
* Events
* Services
* API-Endpunkte
* Serverfunktionen
* Updateinformationen
* Dokumentation

Ein Modul soll nicht voraussetzen, dass für jede neue Funktion Core-Dateien manuell verändert werden.

4.3 Modulstruktur

Die konkrete Verzeichnisstruktur ist nicht verbindlich.

Ein Modul soll jedoch logisch voneinander getrennte Bereiche besitzen können, beispielsweise Manifest, Konfiguration, Quellcode, UI, Assets, Datenbank, Migrationen, Routen, Services, Berechtigungen, Updates und Dokumentation.

Der Agent darf die tatsächliche Struktur verbessern, wenn die gleiche funktionale Trennung dadurch besser erreicht wird.

4.4 Modul-Manifest

Jedes installierbare Modul soll eine eindeutige Beschreibung besitzen.

Das Manifest soll mindestens Informationen bereitstellen können über:

* Modulname
* technische ID
* Version
* Beschreibung
* Hersteller bzw. Autor
* benötigte Core-Version
* Abhängigkeiten
* optionale Abhängigkeiten
* bereitgestellte Services
* bereitgestellte Routen
* bereitgestellte Berechtigungen
* benötigte Migrationen
* Updateinformationen
* Aktivierungsstatus

Weitere Metadaten dürfen ergänzt werden.

4.5 Modul-ID

Jedes Modul benötigt eine eindeutige technische Identifikation.

Die ID darf nicht von einem sichtbaren Namen abhängen.

Der sichtbare Name darf sich ändern, ohne dass dadurch interne Referenzen beschädigt werden.

4.6 Modul-Versionierung

Module müssen versionierbar sein.

Eine Version soll eindeutig feststellen lassen, welcher Entwicklungsstand installiert ist.

Das Framework muss erkennen können:

* installierte Version
* verfügbare Version
* erforderliche Core-Version
* erforderliche Modulabhängigkeiten

Updates müssen nachvollziehbar durchgeführt werden können.

4.7 Modul-Abhängigkeiten

Ein Modul kann andere Module benötigen.

Das Framework muss solche Abhängigkeiten erkennen können.

Eine Installation darf nicht in einen inkonsistenten Zustand führen.

Abhängigkeiten müssen vor Installation bzw. Aktivierung geprüft werden.

4.8 Optionale Abhängigkeiten

Ein Modul darf optionale Funktionen unterstützen.

Wenn ein optionales Modul installiert ist, kann das Hauptmodul zusätzliche Funktionen aktivieren.

Wenn es nicht installiert ist, muss das Hauptmodul grundsätzlich weiterhin funktionieren, sofern die betreffende Funktion nicht zwingend erforderlich ist.

4.9 Modul-Installation

Die Installation eines Moduls soll möglichst automatisiert erfolgen.

Der Installationsprozess soll insbesondere:

1. das Modul erkennen,
2. das Manifest prüfen,
3. die Core-Kompatibilität prüfen,
4. Abhängigkeiten prüfen,
5. Dateien installieren,
6. Datenbankmigrationen ausführen,
7. Services registrieren,
8. Routen registrieren,
9. Berechtigungen registrieren,
10. Menüpunkte registrieren,
11. Konfiguration initialisieren,
12. das Modul aktivieren.

Bei Fehlern muss der Prozess nachvollziehbar abbrechen bzw. soweit technisch möglich zurückgesetzt werden.

4.10 Aktivierung

Installation und Aktivierung sind getrennte Zustände.

Ein installiertes Modul kann deaktiviert sein.

Bei Aktivierung werden seine aktiven Bestandteile registriert.

Ein deaktiviertes Modul darf keine aktiven Funktionen bereitstellen.

4.11 Deaktivierung

Ein Modul muss deaktivierbar sein, ohne dass seine Daten zwangsläufig gelöscht werden.

Deaktivierung bedeutet grundsätzlich:

* keine aktiven UI-Funktionen
* keine aktiven Routen
* keine aktiven Hintergrundprozesse
* keine aktiven Events
* keine aktiven Services

Die gespeicherten Daten bleiben grundsätzlich erhalten.

4.12 Deinstallation

Bei der Deinstallation muss zwischen Deaktivierung, Entfernen des Moduls und Löschen der Moduldaten unterschieden werden.

Der Benutzer bzw. Administrator soll, soweit sinnvoll, erkennen können, welche Daten bei einer Deinstallation betroffen sind.

Eine versehentliche Datenlöschung soll möglichst verhindert werden.

4.13 Migrationen

Module dürfen eigene Datenbankmigrationen mitbringen.

Migrationen müssen versionierbar sein.

Das Framework soll feststellen können:

* welche Migrationen bereits ausgeführt wurden,
* welche noch fehlen,
* welche Version des Moduls die Datenstruktur benötigt.

Core- und Modulmigrationen müssen voneinander getrennt bleiben.

4.14 Modul-Datenbank

Ein Modul soll seine eigenen Datenstrukturen verwalten können.

Der Core stellt die technische Datenbank-/Storage-Schnittstelle bereit.

Die fachliche Datenstruktur gehört zum Modul.

4.15 Modul-Konfiguration

Jedes Modul soll eigene Konfigurationswerte besitzen können.

Beispiele:

* aktiv/inaktiv
* Anzeigeoptionen
* Grenzwerte
* Uploadparameter
* Synchronisation
* externe Dienste
* API-Zugang
* Speicheroptionen

Die Konfiguration soll über eine zentrale Framework-Schnittstelle verwaltet werden.

4.16 Modul-Adminoberfläche

Ein Modul kann einen eigenen Administrationsbereich bereitstellen.

Der Core stellt die Integration bereit.

Das Modul liefert seine fachlichen Einstellungen.

Dadurch muss der Core nicht wissen, welche spezifischen Einstellungen ein Modul besitzt.

4.17 Modul-Menüs

Ein Modul darf eigene Menüpunkte registrieren.

Diese können sowohl im normalen User Interface als auch im Admin-Bereich erscheinen.

Die Sichtbarkeit kann abhängig sein von:

* Modulstatus
* Rolle
* Berechtigung
* Konfiguration
* Kontext
* Gerät

4.18 Modul-Routen

Module sollen eigene Routen registrieren können.

Der Core stellt Routing und Zugriffskontrolle bereit.

Das Modul definiert seine fachlichen Routen.

4.19 Modul-Services

Ein Modul kann Services registrieren.

Beispiele:

* GPS-Service
* Image-Service
* Sync-Service
* Notification-Service

Services sollen über definierte Schnittstellen erreichbar sein.

Interne Implementierungsdetails bleiben innerhalb des Moduls.

4.20 Events und Hooks

Das Framework soll ein Event-/Hook-System bereitstellen.

Module können auf relevante Ereignisse reagieren.

Beispiele:

* user.login
* user.logout
* module.installed
* module.updated
* module.enabled
* module.disabled
* data.created
* data.updated
* data.deleted
* sync.started
* sync.completed
* upload.started
* upload.completed

Die tatsächlichen Eventnamen sind vom Agenten sinnvoll festzulegen.

Events sollen möglichst lose Kopplung ermöglichen.

4.21 Fehlerisolierung

Fehler innerhalb eines Moduls sollen möglichst auf das betroffene Modul begrenzt bleiben.

Das Framework soll Fehler protokollieren und möglichst eindeutig zuordnen können.

Beispielsweise müssen Modul, Version, Ereignis und Fehler nachvollziehbar sein.

Dadurch soll die Fehlersuche auf das betroffene Modul konzentriert werden können.

4.22 Modul-Updates

Ein Modul muss unabhängig aktualisiert werden können.

Ein Update kann beispielsweise enthalten:

* neue Dateien
* geänderten Code
* neue Datenbankmigrationen
* geänderte Konfiguration
* neue Berechtigungen
* neue UI-Komponenten

Der Updateprozess muss die vorhandene Installation berücksichtigen.

4.23 Update-Sicherheit

Vor einem Update soll das Framework soweit technisch möglich prüfen:

* Core-Kompatibilität
* Abhängigkeiten
* installierte Version
* erforderliche Migrationen
* Konflikte
* Voraussetzungen

Bei kritischen Fehlern soll das Update keinen unbekannten Zwischenzustand erzeugen.

4.24 Rollback

Für kritische Updatevorgänge soll nach Möglichkeit ein Rollback-Mechanismus vorgesehen werden.

Wenn ein vollständiges automatisches Rollback technisch nicht möglich ist, müssen zumindest vorheriger Zustand, Sicherungsinformationen, ausgeführte Migrationen und Updateprotokoll nachvollziehbar sein.

4.25 Modul-Entfernung ohne Core-Umbau

Das Entfernen eines Moduls darf grundsätzlich keinen manuellen Umbau des Core erfordern.

Nach Entfernung müssen insbesondere dessen:

* Routen
* Menüpunkte
* Services
* Events
* Berechtigungen
* UI-Komponenten

nicht mehr aktiv sein.

Das Framework muss mit dem Fehlen des Moduls sauber umgehen.

4.26 Module als eigenständige Entwicklungseinheiten

Ein zukünftiges Modul soll möglichst unabhängig entwickelt und getestet werden können.

Ein Entwickler soll ein Modul erstellen können, ohne dafür jedes Mal den Core-Code verstehen oder verändern zu müssen.

Der Core stellt dafür dokumentierte Verträge bereit.

4.27 Kein Zwang zur Modularisierung jeder Kleinigkeit

Nicht jede technische Hilfsfunktion muss ein eigenes Modul sein.

Gemeinsame technische Infrastruktur gehört in den Core, wenn sie tatsächlich universell benötigt wird.

Fachliche Funktionalität gehört in Module.

Die Grenze soll anhand von Wiederverwendbarkeit, Abhängigkeiten, Wartbarkeit, Lebenszyklus und fachlicher Zugehörigkeit bestimmt werden.

4.28 Zukünftige Anwendungen

Eine zukünftige Anwendung soll möglichst aus vorhandenen Core-Funktionen und Modulen zusammengesetzt werden können.

Eine Camping-App könnte beispielsweise den Core mit einem Camping-Theme sowie GPS-, Wetter-, Karten-, optionalem User- und optionalem Sync-Modul kombinieren.

Eine reine Offline-App könnte dagegen ausschließlich den Core, ein eigenes Theme und ein lokales Datenmodul verwenden.

Benutzerverwaltung, Server und weitere Funktionen sollen nicht zwingend geladen werden müssen, wenn sie nicht benötigt werden.

4.29 Grundziel des Modul-Systems

Das Modul-System soll ermöglichen:

Einmal Core bauen – anschließend Funktionen durch Module hinzufügen, entfernen und verändern, ohne den Core ständig neu entwickeln zu müssen.

Das ist ein zentrales Ziel der gesamten VISION.md.

⸻

Kapitel 5 – Datenhaltung, Offline-First und Serveranbindung

5.1 Grundprinzip

Die Anwendung soll grundsätzlich so aufgebaut sein, dass lokale Nutzung und Online-Nutzung voneinander getrennt werden können.

Der Core darf nicht davon ausgehen, dass jederzeit eine Internet- oder Serververbindung vorhanden ist.

Eine Anwendung muss auch vollständig offline betrieben werden können, wenn ihre Module dies unterstützen.

Die Serveranbindung ist eine optionale Erweiterung und darf den grundlegenden Betrieb einer Offline-Anwendung nicht unnötig belasten.

5.2 Offline First

Offline First bedeutet:

* lokale Funktionen funktionieren ohne Internetverbindung,
* lokale Daten bleiben verfügbar,
* Eingaben können lokal gespeichert werden,
* Synchronisation erfolgt erst bei vorhandener Verbindung,
* ein temporärer Serverausfall darf die lokale Anwendung nicht unbrauchbar machen.

Der Core stellt dafür die notwendigen technischen Schnittstellen bereit.

5.3 Lokale Datenhaltung

Lokale Daten können beispielsweise enthalten:

* Anwendungseinstellungen
* Modulkonfiguration
* Benutzerinformationen
* lokale Arbeitsdaten
* Offline-Inhalte
* zwischengespeicherte Serverdaten
* Medien
* Synchronisationsinformationen

Die konkrete Speichertechnologie wird anhand der bestehenden Projektarchitektur und der Zielplattform ausgewählt.

5.4 Serverdaten

Serverseitige Speicherung wird nur für Daten verwendet, die zentral benötigt werden.

Beispiele:

* gemeinsam genutzte Inhalte
* Online-Benutzer
* synchronisierte Daten
* zentrale Backups
* Medien
* serverseitige Statistiken
* Nachrichten
* Marketplace-/Info-Share-Inhalte
* zentrale Systeminformationen

Nicht jede lokale Funktion muss serverseitig gespeichert werden.

5.5 Trennung von lokal und online

Module sollen selbst definieren können, welche Daten:

* ausschließlich lokal,
* ausschließlich serverseitig,
* lokal mit Server-Synchronisation

gespeichert werden.

Der Core stellt dafür die Infrastruktur bereit.

5.6 Synchronisation

Wenn ein Modul Synchronisation benötigt, soll es die vorhandene Synchronisationsschnittstelle des Frameworks verwenden.

Die Synchronisation muss grundsätzlich berücksichtigen können:

* neue Datensätze
* Änderungen
* Löschungen
* Konflikte
* Zeitstempel
* Versionen
* Wiederholungen nach Verbindungsabbruch

Die konkrete Konfliktstrategie wird vom jeweiligen Modul bzw. seiner Konfiguration bestimmt.

5.7 Verbindungsabbrüche

Ein Verbindungsabbruch darf nicht dazu führen, dass bereits lokal gespeicherte Daten verloren gehen.

Fehlgeschlagene Übertragungen sollen soweit möglich erneut versucht werden können.

Das Framework soll den Synchronisationsstatus nachvollziehbar machen.

5.8 Serververbindung

Die Verbindung zu einem Server soll über eine abstrahierte Schnittstelle erfolgen.

Die konkrete Kommunikation soll bevorzugt über moderne, sichere und für den jeweiligen Anwendungsfall geeignete Protokolle erfolgen.

Eine direkte Abhängigkeit des Core von FTP ist nicht vorgesehen.

FTP/SFTP kann für spezielle Verwaltungs- oder Dateiübertragungsaufgaben verwendet werden, sofern dies technisch sinnvoll und sicher ist.

Für normale Anwendungsdaten und Authentifizierung soll eine geeignete API-basierte Kommunikation bevorzugt werden.

5.9 Serverkonfiguration

Der Developer bzw. Administrator soll die Serververbindung über den integrierten Admin-Bereich konfigurieren können.

Konfigurierbar können unter anderem sein:

* Serveradresse
* API-Endpunkt
* Authentifizierungsverfahren
* Zugangsdaten
* Upload-Endpunkte
* Speicherbereiche
* Synchronisation
* Verbindungseinstellungen
* Timeout-Werte
* Übertragungsoptionen

Sensible Zugangsdaten müssen geschützt gespeichert werden.

5.10 Serverseitige Speicherung von Medien

Medien wie Bilder sollen bei einer Online-Anwendung auf dem vorgesehenen Server gespeichert werden können.

Der genaue Übertragungsweg wird durch die Serverarchitektur bestimmt.

Die Anwendung soll nicht davon abhängig sein, dass ein Benutzer manuell Dateien per FTP hochlädt.

Der Upload muss aus der Anwendung heraus automatisiert erfolgen können.

5.11 Bildoptimierung vor dem Upload

Bilder sollen möglichst vor der Übertragung optimiert werden.

Dabei können insbesondere folgende Parameter berücksichtigt werden:

* maximale Breite
* maximale Höhe
* Dateigröße
* Dateiformat
* Kompressionsqualität
* Metadaten
* Thumbnail-Größe

Dadurch werden:

* Uploadzeit,
* Datenverkehr,
* Server-Speicher

reduziert.

5.12 Maximale Bildgröße

Das Framework soll eine konfigurierbare maximale Bildauflösung unterstützen.

Ein sinnvoller Ausgangswert kann beispielsweise 1024 × 768 Pixel sein.

Dieser Wert ist jedoch keine unveränderbare technische Grenze.

Der Administrator soll die Zielauflösung konfigurieren können.

5.13 Maximale Dateigröße

Zusätzlich zur Auflösung soll eine maximale Dateigröße konfigurierbar sein.

Damit können beispielsweise Uploads auf eine bestimmte Kilobyte- oder Megabyte-Grenze begrenzt werden.

Die tatsächlichen Werte müssen administrativ veränderbar sein.

5.14 Optimierung abschaltbar

Die Bildoptimierung soll optional deaktiviert werden können.

Mögliche Einstellung:

* automatische Optimierung: aktiv
* automatische Optimierung: deaktiviert

Wenn die Optimierung deaktiviert ist, soll das System die Datei entsprechend den weiterhin geltenden Sicherheits- und Uploadregeln unverändert übertragen können.

5.15 Erlaubte Dateiformate

Der Administrator soll definieren können, welche Bildformate akzeptiert werden.

Beispielsweise:

* JPEG
* PNG
* WebP
* weitere technisch unterstützte Formate

Die endgültige Liste wird durch die vorhandene Plattform und die implementierte Bildverarbeitung bestimmt.

5.16 Endgerät und Upload

Ein Bild kann von unterschiedlichen Geräten stammen.

Die Anwendung darf deshalb nicht davon ausgehen, dass ein Bild bereits optimal für den Upload vorbereitet wurde.

Die Optimierung soll nach Möglichkeit auf dem Endgerät durchgeführt werden.

Wenn dies technisch nicht möglich ist, kann ein serverseitiger Fallback vorgesehen werden.

5.17 Serverzugriff und Rechte

Die Serveranbindung muss mit klar definierten Zugriffsrechten arbeiten.

Eine Anwendung soll nur auf die Bereiche zugreifen können, die sie tatsächlich benötigt.

Serverzugänge dürfen nicht unnötig weitreichende Schreib- oder Löschrechte besitzen.

5.18 Keine direkte Datenbankabhängigkeit

Die App soll nach Möglichkeit nicht direkt mit einer entfernten MySQL-Datenbank kommunizieren.

Stattdessen soll eine kontrollierte Server/API-Schicht verwendet werden.

Dadurch bleiben:

* Datenbank,
* Geschäftslogik,
* Authentifizierung,
* Sicherheitsregeln

auf dem Server kontrollierbar.

5.19 Server als Backend

Der Server übernimmt bei einer Online-Anwendung nur die Aufgaben, die zentral benötigt werden.

Dazu können gehören:

* zentrale Datenspeicherung
* Benutzerverwaltung
* Synchronisation
* Medienverwaltung
* zentrale Kommunikation
* Backup
* serverseitige Verarbeitung
* API

Die lokale App bleibt dennoch funktionsfähig, soweit ihre Module offlinefähig sind.

5.20 Serverunabhängigkeit

Das Framework darf nicht fest auf einen bestimmten Anbieter zugeschnitten sein.

Ein gemieteter Server, Shared Hosting, eigener Server oder später ein anderer Hostinganbieter soll grundsätzlich verwendet werden können, sofern die benötigte technische Umgebung bereitgestellt wird.

5.21 API-Abstraktion

Module sollen nicht direkt von einer konkreten Serverimplementierung abhängig sein.

Sie kommunizieren über definierte Schnittstellen.

Dadurch kann die Serverimplementierung später geändert werden, ohne jedes Modul neu entwickeln zu müssen.

5.22 Sicherheitsgrundsatz

Alle Serverkommunikationen müssen nach aktuellem technischem Sicherheitsstandard umgesetzt werden.

Insbesondere dürfen:

* Passwörter nicht ungeschützt übertragen werden,
* sensible Zugangsdaten nicht unverschlüsselt gespeichert werden,
* Serverzugänge nicht unnötig offen sein,
* unautorisierte API-Aufrufe nicht möglich sein.

Die konkrete Sicherheitsarchitektur muss der Agent anhand der verwendeten Plattform und Technologien festlegen.

5.23 Backup

Das Framework soll die Möglichkeit berücksichtigen, Daten vor kritischen Vorgängen zu sichern.

Dies betrifft insbesondere:

* Modulupdates
* Migrationen
* Konfigurationsänderungen
* Deinstallationen
* Systemupdates

Die konkrete Backupstrategie kann durch die Server- bzw. Storage-Architektur bestimmt werden.

5.24 Datenverlust vermeiden

Ein Framework- oder Modulupdate darf nicht leichtfertig bestehende Daten zerstören.

Kritische Operationen sollen möglichst:

* validiert,
* protokolliert,
* abgesichert

durchgeführt werden.

Bei nicht reversiblen Vorgängen muss der Administrator möglichst eindeutig darauf hingewiesen werden.

5.25 Ziel

Das Ergebnis soll eine Architektur sein, bei der folgende Betriebsarten möglich sind:

Reine Offline-App

Core + benötigte lokale Module

Online-App

Core + lokale Module + Serveranbindung

Hybrid-App

Core + Offline-Funktionen + optionale Synchronisation + serverseitige Dienste

Damit bleibt das Framework für unterschiedliche zukünftige Anwendungen verwendbar.

⸻


Kapitel 6 – Administration, Benutzer, Rollen und Berechtigungen

6.1 Grundprinzip

Benutzerverwaltung, Rollen und Berechtigungen sind optionale Framework-Funktionen.

Der Core muss die dafür erforderlichen technischen Schnittstellen bereitstellen, darf aber keine konkrete Benutzerstruktur erzwingen.

Eine reine Offline-Anwendung ohne Benutzerkonten soll ohne diese Funktionen betrieben werden können.

Wenn Benutzerverwaltung benötigt wird, muss sie vollständig integriert werden können.

6.2 Benutzerverwaltung

Die Benutzerverwaltung soll administrativ folgende Funktionen ermöglichen:

* Benutzer anzeigen
* Benutzer anlegen
* Benutzer bearbeiten
* Benutzer deaktivieren
* Benutzer aktivieren
* Benutzer löschen
* Benutzer suchen
* Benutzer filtern
* Benutzerstatus anzeigen
* Benutzerinformationen verwalten
* Sessions verwalten
* Authentifizierungsstatus anzeigen

Weitere Funktionen können abhängig vom eingesetzten Benutzer-Modul ergänzt werden.

6.3 Benutzerprofil

Ein Benutzer kann ein eigenes Profil besitzen.

Mögliche Profilinformationen:

* Name
* Benutzername
* E-Mail
* Profilbild
* Sprache
* Einstellungen
* Präferenzen
* Benachrichtigungseinstellungen

Welche Felder tatsächlich benötigt werden, bestimmt das jeweilige Benutzer-Modul.

6.4 Rollen

Das Framework soll beliebige Rollen unterstützen können.

Beispiele:

* User
* Developer
* Moderator
* Administrator
* Super Administrator

Diese Namen sind nur Beispiele.

Rollen sollen administrativ erstellt, geändert und gelöscht werden können, sofern sie nicht als geschützte Systemrollen definiert sind.

6.5 Berechtigungen

Berechtigungen sollen granular definiert werden können.

Beispiele:

* Modul ansehen
* Modul konfigurieren
* Modul installieren
* Modul aktualisieren
* Benutzer ansehen
* Benutzer bearbeiten
* Benutzer löschen
* Server konfigurieren
* Daten exportieren
* Daten löschen
* Administration öffnen

Module können eigene Berechtigungen registrieren.

6.6 Rollen-Berechtigungs-Zuordnung

Rollen erhalten eine Menge von Berechtigungen.

Ein Benutzer erhält seine effektiven Berechtigungen über seine Rolle bzw. seine Rollen.

Die Architektur soll bei Bedarf auch mehrere Rollen pro Benutzer unterstützen können.

6.7 Admin-Zugriff

Der Zugriff auf den Admin-Bereich muss über Berechtigungen geschützt werden.

Das Vorhandensein eines Admin-Menüpunkts allein ist keine Sicherheitsmaßnahme.

Auch direkte Aufrufe geschützter Routen müssen geprüft werden.

6.8 Developer-Konto

Das Framework soll einen speziellen Developer-/Systemzugang unterstützen können.

Der Developer kann abhängig von der Konfiguration zusätzliche Funktionen erhalten.

Beispielsweise:

* Administration
* Diagnose
* Modulverwaltung
* Serverkonfiguration
* Updateverwaltung
* Systeminformationen

Der Developer-Zugang darf nicht automatisch mit uneingeschränkten Rechten gleichgesetzt werden.

Die tatsächlichen Rechte müssen über das Berechtigungsmodell kontrollierbar sein.

6.9 Einziger Administrator

Für die aktuelle Anwendung kann zunächst ein einziger administrativer Benutzer verwendet werden.

Die Architektur darf dadurch jedoch nicht dauerhaft auf nur einen Administrator beschränkt werden.

Das Framework muss später mehrere Administratoren unterstützen können.

6.10 Rollen als optionales Modul

Eine Anwendung ohne Benutzerverwaltung soll nicht unnötig mit Rollen- und Berechtigungslogik belastet werden.

Das Rollen-/Berechtigungssystem soll deshalb möglichst modular aufgebaut sein.

Der Core stellt die Schnittstellen bereit.

Das entsprechende Modul stellt die konkrete Funktion bereit.

6.11 Authentifizierung

Das Framework muss eine saubere Authentifizierungsarchitektur unterstützen.

Je nach Anwendung können beispielsweise vorgesehen werden:

* lokale Authentifizierung
* serverseitige Authentifizierung
* Token-basierte Authentifizierung
* Session-basierte Authentifizierung
* andere geeignete Verfahren

Die konkrete Implementierung entscheidet der Agent anhand der vorhandenen Plattform und Sicherheitsanforderungen.

6.12 Login-Weiterleitung

Nach erfolgreicher Authentifizierung muss der Benutzer zuverlässig an den vorgesehenen Zielbereich weitergeleitet werden.

Dabei müssen insbesondere berücksichtigt werden:

* Benutzerrolle
* Berechtigungen
* ursprüngliches Ziel
* aktivierte Module
* Offline-/Online-Zustand
* Setup-Status

Eine Weiterleitung auf nicht verfügbare oder nicht autorisierte Bereiche darf nicht erfolgen.

6.13 Geschützte Routen

Geschützte Bereiche müssen zentral überprüft werden.

Eine Route kann beispielsweise folgende Anforderungen besitzen:

* Login erforderlich
* bestimmte Rolle erforderlich
* bestimmte Berechtigung erforderlich
* bestimmtes Modul erforderlich
* Onlineverbindung erforderlich

Diese Informationen sollen über definierte Routing-/Authorization-Schnittstellen verwaltet werden.

6.14 Session-Verwaltung

Sessions müssen kontrolliert verwaltet werden können.

Das Framework soll mindestens berücksichtigen:

* Session-Erstellung
* Session-Status
* Session-Ablauf
* Logout
* Session-Wiederherstellung
* gegebenenfalls Session-Widerruf

6.15 Benutzerstatus

Benutzer können unterschiedliche Zustände besitzen.

Beispiele:

* aktiv
* deaktiviert
* gesperrt
* ausstehend
* gelöscht

Die konkrete Statuslogik wird durch das Benutzer-Modul bestimmt.

6.16 Registrierung

Wenn eine Anwendung Registrierung unterstützt, muss diese über das Benutzer-Modul steuerbar sein.

Administrativ konfigurierbar können beispielsweise sein:

* Registrierung aktiv/inaktiv
* E-Mail erforderlich
* Freigabe erforderlich
* automatische Aktivierung
* Bestätigung
* Benachrichtigung des Administrators

6.17 Neue Benutzer

Neue Benutzerregistrierungen können Benachrichtigungen erzeugen.

Beispielsweise:

Neue Benutzerregistrierung erfolgreich

Der Administrator soll die Benachrichtigung über das integrierte Benachrichtigungssystem erhalten können.

6.18 Rechte für Module

Ein Modul darf eigene Berechtigungen definieren.

Beispielsweise könnte ein Marketplace-Modul folgende Rechte besitzen:

* Inhalte ansehen
* Inhalte erstellen
* Inhalte bearbeiten
* Inhalte löschen
* Inhalte moderieren
* Einstellungen verwalten

Der Core muss solche Berechtigungen nicht fachlich kennen.

Er muss lediglich ihre Registrierung und Prüfung unterstützen.

6.19 Administrationsrechte

Administrative Funktionen sollen ebenfalls granular abgesichert werden.

Beispielsweise muss es möglich sein, einem Benutzer:

* Modulverwaltung,
* aber keine Benutzerverwaltung

zu erlauben.

Oder:

* Benutzerverwaltung,
* aber keine Serververwaltung.

6.20 Super-Administrator

Für die Systemverwaltung soll optional ein besonders privilegierter Benutzer vorgesehen werden können.

Dieser kann beispielsweise:

* alle Module verwalten,
* Systemkonfiguration ändern,
* Benutzer verwalten,
* Rollen verwalten,
* Server konfigurieren,
* Updates durchführen.

Ein solcher Zugang muss besonders geschützt werden.

6.21 Berechtigungsprüfung im Modul

Module sollen Berechtigungen nicht selbst über verstreute Sonderlogik prüfen müssen.

Sie sollen die zentrale Authorization-Schnittstelle des Frameworks verwenden.

Dadurch bleibt das Berechtigungsmodell konsistent.

6.22 Kein Hardcoding von Benutzern

Benutzer, Rollen und Berechtigungen dürfen nicht unnötig fest im Anwendungscode kodiert werden.

Systemrollen oder technische Mindestberechtigungen können geschützt definiert werden.

Alle normalen administrativen Einstellungen sollen jedoch konfigurierbar sein.

6.23 Rechteänderungen

Änderungen an Rollen oder Berechtigungen sollen möglichst unmittelbar wirksam werden.

Bereits bestehende Sessions müssen dabei entsprechend berücksichtigt werden.

Sicherheitskritische Rechteänderungen sollen gegebenenfalls eine erneute Authentifizierung verlangen können.

6.24 Audit und Protokollierung

Administrative Aktionen sollen, soweit sinnvoll, protokolliert werden können.

Beispiele:

* Login
* Logout
* Benutzer angelegt
* Benutzer gelöscht
* Rolle geändert
* Berechtigung geändert
* Modul installiert
* Modul aktualisiert
* Modul deinstalliert
* Serverkonfiguration geändert

Das Audit-System soll modular bzw. optional sein.

6.25 Datenschutz

Das Framework darf keine unnötigen personenbezogenen Daten sammeln.

Welche Daten gespeichert werden, soll durch die jeweilige Anwendung und deren Module bestimmt werden.

Administrative Funktionen sollen eine kontrollierte Löschung bzw. Bereinigung personenbezogener Daten unterstützen können.

6.26 Offline-Benutzerverwaltung

Wenn eine Anwendung Benutzerverwaltung vollständig lokal benötigt, soll dies möglich sein.

Der Core darf eine lokale Benutzerverwaltung nicht ausschließen.

Ebenso muss eine Online-Anwendung Benutzerinformationen serverseitig verwalten können.

6.27 Ziel

Das Benutzer- und Berechtigungssystem soll gleichzeitig:

* leistungsfähig,
* flexibel,
* modular,
* optional,
* sicher,
* erweiterbar

sein.

Eine Anwendung soll nur die tatsächlich benötigten Funktionen aktivieren müssen.

⸻


Kapitel 7 – Administration, Konfiguration und Systemverwaltung

7.1 Grundprinzip

Der integrierte Admin-Bereich soll eine zentrale Verwaltungsoberfläche für das gesamte Framework bereitstellen.

Er soll neutral gegenüber verschiedenen Anwendungen sein.

Die Administration muss grundsätzlich in der Lage sein, unterschiedliche zukünftige Anwendungen und Module zu verwalten.

Der Core stellt dafür die technische Infrastruktur bereit.

Fachliche Einstellungen werden von den jeweiligen Modulen bereitgestellt.

7.2 Admin-Dashboard

Das Admin-Dashboard dient als zentrale Übersicht.

Es soll relevante Informationen aus dem gesamten System zusammenführen können.

Mögliche Bereiche:

* Systemstatus
* Core-Version
* App-Version
* installierte Module
* aktive Module
* verfügbare Updates
* Fehler
* Warnungen
* Benutzer
* Serverstatus
* Speicher
* Synchronisation
* Benachrichtigungen
* Diagnose

Das Dashboard soll dynamisch aufgebaut sein.

Module können eigene Widgets oder Statusinformationen registrieren.

7.3 Zentrale Systemkonfiguration

Die Anwendung soll eine zentrale Konfigurationsverwaltung besitzen.

Diese kann Einstellungen enthalten für:

* Anwendung
* Core
* Theme
* Sprache
* Region
* Zeitformat
* Benachrichtigungen
* Speicher
* Netzwerk
* Server
* Synchronisation
* Sicherheit
* Module

Die Konfiguration muss versionierbar und nachvollziehbar sein.

7.4 Modulkonfiguration

Jedes Modul soll eigene Konfigurationen registrieren können.

Der Core stellt hierfür eine einheitliche Konfigurationsschnittstelle bereit.

Das Modul definiert:

* Einstellung
* Datentyp
* Standardwert
* erlaubte Werte
* Beschreibung
* gegebenenfalls Berechtigung

Die Admin-Oberfläche kann daraus automatisch passende Eingabefelder erzeugen.

7.5 Dynamische Admin-Oberfläche

Der Admin-Bereich soll nicht für jedes Modul manuell programmiert werden müssen.

Wenn ein Modul seine Konfigurationsdefinition korrekt bereitstellt, soll die Administration daraus möglichst automatisch eine passende Oberfläche generieren können.

Das betrifft insbesondere:

* Textfelder
* Zahlen
* Schalter
* Auswahlfelder
* Mehrfachauswahl
* Datei-/Medienauswahl
* Passworteingaben
* Bereiche
* Tabellen
* Listen

Komplexe Module dürfen zusätzlich eigene Admin-Komponenten bereitstellen.

7.6 Einstellungen validieren

Konfigurationswerte müssen vor Speicherung validiert werden.

Mögliche Prüfungen:

* Datentyp
* Mindestwert
* Höchstwert
* Pflichtfeld
* erlaubte Werte
* Format
* Abhängigkeiten
* Sicherheitsanforderungen

Fehler sollen verständlich angezeigt werden.

7.7 Standardwerte

Module sollen Standardwerte definieren können.

Bei Erstinstallation werden diese automatisch angelegt.

Der Administrator kann sie anschließend ändern.

Eine Deinstallation soll die Entscheidung berücksichtigen, ob Modulkonfigurationen vollständig entfernt oder für eine spätere Neuinstallation erhalten werden sollen.

7.8 Konfigurationsgruppen

Viele Einstellungen können in logische Gruppen unterteilt werden.

Beispiele:

* Allgemein
* Darstellung
* Datenschutz
* Upload
* Synchronisation
* Server
* Sicherheit
* Benachrichtigungen

Die Struktur soll vom jeweiligen Modul definiert werden können.

7.9 Suchfunktion

Der Admin-Bereich soll eine zentrale Suche besitzen können.

Damit sollen Einstellungen, Module, Benutzer und andere administrative Bereiche schnell gefunden werden können.

Beispielsweise soll ein Suchbegriff wie „Upload“ relevante Upload-Einstellungen verschiedener Module auffinden können.

7.10 Modulverwaltung

Die Modulverwaltung soll eine zentrale Übersicht bereitstellen.

Angezeigt werden können:

* Name
* Version
* Status
* Autor
* Beschreibung
* Core-Kompatibilität
* Abhängigkeiten
* Updates
* Fehler
* Konfigurationsmöglichkeiten

Mögliche Aktionen:

* installieren
* aktivieren
* deaktivieren
* konfigurieren
* aktualisieren
* deinstallieren

7.11 Installationsquellen

Das Framework soll unterschiedliche Installationsquellen unterstützen können.

Beispielsweise:

* lokales Modulpaket
* Server
* offizielles Repository
* Marketplace
* manuelles Importieren

Die konkrete Quelle ist optional.

Ein Marketplace darf deshalb als eigenes Modul realisiert werden.

Der Core darf nicht von einem Marketplace abhängig sein.

7.12 Marketplace

Der Marketplace ist ausdrücklich kein zwingender Bestandteil des Core.

Er kann als eigenständiges Modul realisiert werden.

Das Marketplace-Modul kann beispielsweise:

* Module suchen
* Module anzeigen
* Module herunterladen
* Module installieren
* Module aktualisieren
* Informationen bereitstellen

Der Core muss lediglich die dafür notwendigen Modul- und Update-Schnittstellen bereitstellen.

7.13 Advertising

Werbung ist ebenfalls kein Core-Bestandteil.

Sie soll über ein optionales Advertising-/Advertisement-Modul realisiert werden können.

Das Modul kann beispielsweise:

* Banner verwalten
* Banner anzeigen
* Positionen verwalten
* Zeiträume verwalten
* Aktivierung steuern
* Zielgruppen berücksichtigen

Der Footer kann dafür einen entsprechenden Integrationspunkt bereitstellen.

7.14 Dynamische Footer-Inhalte

Der Footer soll einen oder mehrere definierte Erweiterungspunkte besitzen.

Ein Modul kann dort Inhalte bereitstellen.

Wenn kein entsprechender Inhalt vorhanden ist, kann der Bereich automatisch ausgeblendet werden.

Dadurch muss für Werbung oder andere Zusatzinformationen der Core nicht verändert werden.

7.15 Serververwaltung

Die Serververwaltung soll innerhalb des Admin-Bereichs konfigurierbar sein.

Mögliche Funktionen:

* Server hinzufügen
* Server bearbeiten
* Verbindung testen
* Server aktivieren
* Server deaktivieren
* Zugangsdaten verwalten
* Speicherpfade verwalten
* API-Endpunkte verwalten
* Upload-Einstellungen verwalten
* Synchronisation konfigurieren

Die konkrete Anzahl unterstützter Server ist nicht fest vorgegeben.

7.16 Verbindungstest

Nach Eingabe einer Serverkonfiguration soll ein Verbindungstest möglich sein.

Der Test soll möglichst unterscheiden können zwischen:

* Server nicht erreichbar
* Authentifizierung fehlgeschlagen
* keine Berechtigung
* falscher Endpunkt
* Server verfügbar
* API verfügbar

Die konkrete Diagnose hängt von der verwendeten Serverarchitektur ab.

7.17 Systeminformationen

Der Admin-Bereich soll technische Informationen anzeigen können.

Beispielsweise:

* Core-Version
* App-Version
* Modulversionen
* Plattform
* Datenbankversion
* Speicher
* verfügbare Ressourcen
* Serverstatus
* Synchronisationsstatus

Nicht benötigte Informationen sollen ausgeblendet werden können.

7.18 Diagnose

Das Framework soll eine zentrale Diagnosefunktion besitzen.

Sie soll beispielsweise prüfen können:

* Core-Zustand
* Modulzustand
* Konfiguration
* Datenbank
* Storage
* Serververbindung
* Berechtigungen
* Migrationen
* Updates
* kritische Fehler

Die Diagnose soll möglichst konkrete Hinweise auf die Ursache eines Problems geben.

7.19 Logging

Das Framework soll ein zentrales Logging-System bereitstellen.

Logeinträge sollen möglichst enthalten:

* Zeit
* Ebene
* Modul
* Ereignis
* Nachricht
* technische Zusatzinformationen

Mögliche Ebenen:

* Debug
* Info
* Warning
* Error
* Critical

Das Logging muss konfigurierbar sein.

7.20 Fehleranzeige

Technische Fehler sollen nicht unkontrolliert im normalen User Interface erscheinen.

Der Benutzer soll eine verständliche Meldung erhalten.

Technische Details gehören in das Diagnose-/Logging-System.

Administratoren sollen bei Bedarf detailliertere Informationen abrufen können.

7.21 Konfigurationsimport und -export

Die Systemkonfiguration soll möglichst exportiert und wieder importiert werden können.

Dies kann beispielsweise für:

* Backups
* Migrationen
* neue Installationen
* Testumgebungen
* Wiederherstellung

verwendet werden.

Sensible Werte müssen dabei besonders berücksichtigt werden.

7.22 Systemweite Einstellungen

Der Admin-Bereich kann systemweite Einstellungen verwalten.

Beispiele:

* Anwendungstitel
* Sprache
* Zeitzone
* Standard-Theme
* Startseite
* Benachrichtigungseinstellungen
* Speicher
* Netzwerk
* Datenschutz
* Updateverhalten

Diese Einstellungen müssen nicht fachlich an eine spezifische Anwendung gebunden sein.

7.23 Theme-Verwaltung

Themes sollen verwaltet werden können.

Mögliche Funktionen:

* Theme anzeigen
* Theme aktivieren
* Theme deaktivieren
* Theme konfigurieren
* Theme aktualisieren
* Theme entfernen

Ein Theme darf keine direkte Abhängigkeit zu einer bestimmten Fachanwendung besitzen.

7.24 Theme-Auswahl pro Anwendung

Wenn mehrere Anwendungen oder App-Konfigurationen unterstützt werden, soll für jede Anwendung ein eigenes Theme verwendet werden können.

Beispielsweise:

* Fishing-Domain → Fishing Theme
* Camping → Camping Theme
* Weather → Weather Theme

Der Core bleibt unverändert.

7.25 Sprachverwaltung

Das Framework soll Mehrsprachigkeit berücksichtigen können.

Module können eigene Übersetzungen mitbringen.

Das System soll möglichst automatisch erkennen, welche Übersetzungen verfügbar sind.

Nicht vorhandene Übersetzungen sollen sinnvoll auf eine Standardsprache zurückfallen.

7.26 Zeit und Region

Anwendungen können regionale Einstellungen benötigen.

Dazu gehören:

* Sprache
* Zeitzone
* Datumsformat
* Uhrzeitformat
* Zahlenformat
* Einheiten

Diese Funktionen sollen möglichst zentral bereitgestellt werden.

7.27 Admin-Sicherheit

Der Admin-Bereich muss besonders geschützt werden.

Dazu gehören abhängig von der Plattform:

* sichere Authentifizierung
* Berechtigungsprüfung
* Session-Schutz
* sichere Speicherung sensibler Daten
* Schutz gegen unautorisierte API-Aufrufe
* Audit-Logging
* gegebenenfalls zusätzliche Authentifizierung

7.28 Keine unnötige Core-Abhängigkeit

Der Admin-Bereich darf nicht dazu führen, dass jede Anwendung zwingend sämtliche Administrationsfunktionen laden muss.

Nicht benötigte Funktionen sollen deaktivierbar bzw. modular sein.

Der Core stellt nur die erforderlichen Integrationspunkte bereit.

7.29 Ziel der Administration

Die Administration soll sich langfristig wie ein modernes modulares CMS verhalten.

Der Administrator soll möglichst viele Aufgaben über die Benutzeroberfläche durchführen können, ohne Dateien manuell bearbeiten zu müssen.

Dazu gehören insbesondere:

* Module verwalten
* Einstellungen verwalten
* Benutzer verwalten
* Rollen verwalten
* Rechte verwalten
* Themes verwalten
* Server verwalten
* Updates verwalten
* Fehler diagnostizieren
* Systemstatus überwachen

Die konkrete Funktionalität kann durch Module erweitert werden.

7.30 Grundziel

Der Admin-Bereich soll nicht nur für eine einzelne Anwendung funktionieren.

Er soll die Verwaltungsgrundlage für zukünftige Anwendungen bilden.

Das Ziel ist ein generisches, modulares Administrationssystem, das durch Module erweitert werden kann, ohne den Core grundsätzlich neu entwickeln zu müssen.

⸻


Kapitel 8 – Updates, Migrationen, Backups und Wiederherstellung

8.1 Grundprinzip

Das Framework muss langfristig aktualisierbar sein, ohne dass für jede neue Funktion der Core manuell umgebaut werden muss.

Updates können betreffen:

* Core
* Module
* Themes
* Konfiguration
* Datenbankstrukturen
* Serverkomponenten

Jede dieser Ebenen soll möglichst unabhängig verwaltet werden können.

8.2 Update-System

Das Framework soll ein zentrales Update-System bereitstellen.

Es muss erkennen können:

* aktuelle Version
* verfügbare Version
* Updatequelle
* Kompatibilität
* Abhängigkeiten
* erforderliche Migrationen
* mögliche Konflikte

Updates sollen über den Admin-Bereich verwaltbar sein.

8.3 Modul-Updates

Module müssen unabhängig vom Core aktualisiert werden können.

Ein Modulupdate darf den Core nicht unnötig verändern.

Das Modul liefert die für das Update notwendigen Informationen und Migrationen.

8.4 Core-Updates

Der Core soll ebenfalls aktualisierbar sein.

Da der Core die zentrale Infrastruktur darstellt, müssen Core-Updates besonders sorgfältig behandelt werden.

Vor einem kritischen Core-Update sollen nach Möglichkeit:

* Kompatibilität geprüft,
* Backups erstellt,
* Abhängigkeiten geprüft,
* aktive Module berücksichtigt

werden.

8.5 Theme-Updates

Themes sollen unabhängig aktualisiert werden können.

Ein Themeupdate darf die fachlichen Daten eines Moduls nicht verändern.

Nach einem Themeupdate muss die Anwendung weiterhin mit den vorhandenen Modulen funktionieren.

8.6 Update-Mitteilungen

Der Administrator soll über verfügbare Updates informiert werden können.

Beispielsweise:

* Core-Update verfügbar
* Modulupdate verfügbar
* Themeupdate verfügbar
* Sicherheitsupdate verfügbar

Die Anzeige kann über:

* Admin-Dashboard
* Benachrichtigungen
* optional Push Notifications

erfolgen.

8.7 Update-Informationen

Ein Update soll möglichst Informationen bereitstellen können über:

* Version
* Änderungen
* Fehlerbehebungen
* neue Funktionen
* Sicherheitsrelevanz
* erforderliche Migrationen
* Voraussetzungen

Der Administrator soll vor einem kritischen Update erkennen können, was sich verändert.

8.8 Sicherheitsupdates

Sicherheitsrelevante Updates sollen entsprechend gekennzeichnet werden können.

Das System darf Sicherheitsupdates nicht wie gewöhnliche Funktionsupdates behandeln, wenn dadurch eine notwendige Warnung verloren gehen würde.

8.9 Update-Prüfung

Vor der Durchführung eines Updates soll das Framework möglichst prüfen:

* Core-Kompatibilität
* Modulabhängigkeiten
* verfügbare Ressourcen
* Datenbankstatus
* erforderliche Migrationen
* vorhandene Sicherungen
* laufende Prozesse

8.10 Update-Lock

Während kritischer Updatevorgänge soll verhindert werden, dass gleichzeitig inkompatible Änderungen durchgeführt werden.

Beispielsweise sollen nicht gleichzeitig:

* Modulupdate,
* Migration,
* Deinstallation

für dasselbe Modul laufen.

8.11 Atomare Update-Schritte

Wo technisch möglich, sollen kritische Updatevorgänge atomar oder transaktionssicher durchgeführt werden.

Wenn ein Vorgang vollständig nicht atomar umgesetzt werden kann, muss der Zwischenzustand kontrolliert und nachvollziehbar sein.

8.12 Migrationen

Datenbankänderungen sollen über versionierte Migrationen erfolgen.

Migrationen müssen:

* eindeutig identifizierbar,
* geordnet,
* nachvollziehbar,
* wiederholungsfest

sein.

Eine bereits erfolgreich ausgeführte Migration darf nicht unbeabsichtigt erneut ausgeführt werden.

8.13 Migrationen pro Modul

Jedes Modul darf eigene Migrationen besitzen.

Diese werden vom Modul bereitgestellt.

Der Core führt sie über die zentrale Migration-Infrastruktur aus.

8.14 Migrationen und Updates

Wenn ein Modulupdate eine neue Datenstruktur benötigt, muss die entsprechende Migration Bestandteil des Updateprozesses sein.

Die Anwendung darf nicht dauerhaft Code und Datenstruktur in unterschiedlichen inkompatiblen Zuständen betreiben.

8.15 Backup vor kritischen Vorgängen

Vor kritischen Änderungen soll automatisch ein Backup oder eine geeignete Sicherung erstellt werden können.

Dazu gehören insbesondere:

* Core-Updates
* Datenbankmigrationen
* Modulupdates
* Deinstallationen
* größere Konfigurationsänderungen

8.16 Backup-Konfiguration

Der Administrator soll Backup-Einstellungen verwalten können.

Mögliche Einstellungen:

* Speicherort
* Häufigkeit
* Anzahl aufzubewahrender Backups
* Datenbank einschließen
* Medien einschließen
* Konfiguration einschließen
* lokale Daten einschließen
* Serverdaten einschließen

Die tatsächlichen Möglichkeiten hängen von der Plattform ab.

8.17 Wiederherstellung

Das Framework soll eine kontrollierte Wiederherstellung unterstützen können.

Mögliche Wiederherstellungsobjekte:

* Konfiguration
* Datenbank
* Modul
* Theme
* gesamte Anwendung

Die Wiederherstellung muss möglichst eindeutig anzeigen, welche Daten überschrieben werden.

8.18 Rollback nach fehlgeschlagenem Update

Wenn ein Update fehlschlägt, soll das Framework nach Möglichkeit automatisch auf den vorherigen stabilen Zustand zurückkehren.

Wenn dies nicht vollständig automatisiert möglich ist, müssen geeignete Wiederherstellungsinformationen bereitgestellt werden.

8.19 Update-Protokoll

Jeder Updatevorgang soll protokolliert werden können.

Das Protokoll kann enthalten:

* Zeitpunkt
* Ausgangsversion
* Zielversion
* betroffene Komponente
* Migrationen
* Ergebnis
* Fehler
* Rollbackstatus

8.20 Modul-Kompatibilität

Das Framework muss erkennen können, ob ein Modul mit einer bestimmten Core-Version kompatibel ist.

Ein inkompatibles Modul darf nicht einfach aktiviert werden.

8.21 Abhängigkeiten bei Updates

Wenn ein Modulupdate eine neue Version eines anderen Moduls benötigt, muss das Framework dies erkennen.

Abhängigkeiten müssen vor dem Update geprüft werden.

Wenn mehrere Updates notwendig sind, soll das Framework nach Möglichkeit die korrekte Reihenfolge bestimmen.

8.22 Update-Reihenfolge

Eine mögliche Reihenfolge kann sein:

1. Backup
2. Kompatibilitätsprüfung
3. Abhängigkeiten prüfen
4. Dateien aktualisieren
5. Migrationen ausführen
6. Services aktualisieren
7. Cache aktualisieren
8. Modul aktivieren
9. Funktionstest
10. Update abschließen

Die tatsächliche Reihenfolge entscheidet der Agent anhand der verwendeten Architektur.

8.23 Cache und temporäre Daten

Nach Updates müssen möglicherweise Caches oder temporäre Daten erneuert werden.

Das Framework soll entsprechende Mechanismen bereitstellen.

Ein Update darf nicht daran scheitern, dass veraltete Cacheinformationen verwendet werden.

8.24 Datenintegrität

Nach einem Update sollen wichtige Systemkomponenten validiert werden.

Beispielsweise:

* Datenbank erreichbar
* Migrationen vollständig
* Module geladen
* Routen registriert
* Konfiguration gültig
* Berechtigungen vorhanden
* Theme geladen

8.25 Update bei Offline-Nutzung

Offline-Anwendungen müssen Updates gegebenenfalls lokal durchführen können.

Eine permanente Serververbindung darf keine technische Voraussetzung für ein lokales Modulupdate sein.

8.26 Online-Updates

Bei bestehender Serververbindung können Updates automatisch aus einer konfigurierten Quelle bezogen werden.

Die konkrete Quelle kann beispielsweise ein Server, Repository oder Marketplace-Modul sein.

Der Core bleibt dabei unabhängig von der konkreten Quelle.

8.27 Manuelle Updates

Zusätzlich soll ein Modul oder Theme manuell importiert bzw. aktualisiert werden können, sofern die Plattform dies unterstützt.

Dies ermöglicht beispielsweise die Installation eines lokal bereitgestellten Modulpakets.

8.28 Update-Berechtigungen

Updates dürfen nur von entsprechend berechtigten Benutzern durchgeführt werden.

Die Berechtigung soll möglichst getrennt sein für:

* Core-Updates
* Modulupdates
* Themeupdates
* Konfigurationsänderungen

8.29 Keine automatische Datenlöschung

Ein Update darf nicht ohne klare technische Notwendigkeit bestehende Nutzerdaten löschen.

Nicht mehr benötigte Datenstrukturen sollen nur über definierte Migrationen entfernt werden.

8.30 Ziel

Das Update-System soll langfristig verhindern, dass die Anwendung mit jeder Erweiterung technisch immer schwerer wartbar wird.

Das gewünschte Ergebnis ist:

* Core unabhängig aktualisierbar
* Module unabhängig aktualisierbar
* Themes unabhängig aktualisierbar
* Datenbankmigrationen kontrolliert
* Backups verfügbar
* Wiederherstellung möglich
* Fehler nachvollziehbar
* Updates administrierbar

⸻


Kapitel 9 – Sicherheit, Fehlerbehandlung, Diagnose und Stabilität

9.1 Grundprinzip

Das Framework soll von Anfang an auf Stabilität, Sicherheit und nachvollziehbare Fehlerbehandlung ausgelegt werden.

Fehler sollen nicht einfach versteckt werden.

Das System soll möglichst erkennen, protokollieren und anzeigen können:

* was passiert ist,
* wo es passiert ist,
* welches Modul betroffen ist,
* welche Version betroffen ist,
* welche Aktion den Fehler ausgelöst hat,
* ob das System weiterhin sicher betrieben werden kann.

9.2 Zentrale Fehlerbehandlung

Der Core stellt eine zentrale Fehlerbehandlungs-Infrastruktur bereit.

Module sollen diese Infrastruktur verwenden.

Dadurch sollen Fehler möglichst einheitlich behandelt und protokolliert werden.

9.3 Fehlerisolierung

Ein Fehler in einem Modul darf möglichst nicht den gesamten Core beschädigen.

Wenn ein Modul fehlerhaft ist, soll das Framework nach Möglichkeit:

* den Fehler erkennen,
* das Modul identifizieren,
* die betroffene Funktion bestimmen,
* den Fehler protokollieren,
* die Funktion kontrolliert abbrechen,
* das Modul gegebenenfalls deaktivieren.

9.4 Benutzerfreundliche Fehlermeldungen

Normale Benutzer sollen keine unnötigen technischen Details sehen.

Statt einer internen Fehlermeldung soll beispielsweise eine verständliche Meldung angezeigt werden.

Technische Informationen werden separat im Logging- und Diagnosebereich gespeichert.

9.5 Entwickler- und Admin-Informationen

Administratoren bzw. Developer sollen bei Bedarf detailliertere Informationen erhalten können.

Dazu gehören:

* Fehler-ID
* Modul
* Version
* Route
* Event
* Zeitpunkt
* technische Fehlermeldung
* Stacktrace, sofern verfügbar
* relevante Systeminformationen

9.6 Fehler-ID

Fehler sollen möglichst eindeutig identifizierbar sein.

Dadurch kann ein Administrator einen Fehler beispielsweise melden als:

Fehler-ID: ABC-123456

Die genaue technische Umsetzung bleibt dem Agenten überlassen.

9.7 Logging

Das Framework benötigt ein zentrales Logging-System.

Mögliche Logebenen:

* Debug
* Info
* Notice
* Warning
* Error
* Critical

Das Logging soll pro Umgebung konfigurierbar sein.

9.8 Modulbezogenes Logging

Logeinträge sollen nach Möglichkeit einem Modul zugeordnet werden.

Beispiel:

Modul: Media
Aktion: Image Optimization
Version: 1.3.2
Ergebnis: Fehler

Damit wird die Fehlersuche deutlich vereinfacht.

9.9 Audit-Logging

Administrative und sicherheitsrelevante Aktionen sollen optional separat protokolliert werden können.

Beispielsweise:

* Login
* Logout
* Benutzeränderung
* Rollenänderung
* Rechteänderung
* Modulinstallation
* Modulupdate
* Moduldeinstallation
* Serverkonfigurationsänderung

9.10 Diagnosebereich

Der Admin-Bereich soll einen Diagnosebereich besitzen.

Dieser soll das System möglichst automatisiert überprüfen können.

Mögliche Prüfungen:

* Core
* Module
* Themes
* Datenbank
* Storage
* Migrationen
* Konfiguration
* Berechtigungen
* Serververbindung
* Synchronisation
* Updates

9.11 Diagnoseergebnis

Diagnoseprüfungen sollen möglichst klar zwischen verschiedenen Zuständen unterscheiden.

Beispielsweise:

* OK
* Hinweis
* Warnung
* Fehler
* kritisch

Zusätzlich sollen möglichst konkrete Handlungsempfehlungen angezeigt werden.

9.12 Selbstprüfung

Das Framework soll grundlegende Selbstprüfungen unterstützen.

Beispielsweise:

* Core-Dateien vorhanden
* Konfiguration lesbar
* Storage verfügbar
* Datenbank erreichbar
* Migrationen vollständig
* Module kompatibel
* erforderliche Services verfügbar

9.13 Gesundheitsstatus

Das System soll einen allgemeinen Gesundheitsstatus anzeigen können.

Dieser kann aus mehreren Prüfungen zusammengesetzt werden.

Beispielsweise:

Systemstatus: Gut

oder

Systemstatus: Warnung – 1 Modul benötigt Aufmerksamkeit

9.14 Sicherheitsgrundlagen

Der Core muss grundlegende Sicherheitsmechanismen bereitstellen.

Dazu gehören abhängig von der Plattform:

* sichere Authentifizierung
* Autorisierung
* sichere Sessionverwaltung
* sichere Datenübertragung
* Eingabevalidierung
* Schutz sensibler Daten
* sichere Speicherung von Geheimnissen
* Schutz gegen unautorisierte Zugriffe

9.15 Eingabevalidierung

Alle externen Eingaben müssen validiert werden.

Das betrifft unter anderem:

* Formulare
* API-Daten
* Uploads
* Konfiguration
* URL-Parameter
* Modulmanifest
* Importdateien

Keine Eingabe darf ungeprüft als vertrauenswürdig behandelt werden.

9.16 Dateiuploads

Dateiuploads müssen sicher verarbeitet werden.

Zu berücksichtigen sind unter anderem:

* Dateityp
* Dateigröße
* Dateiendung
* tatsächlicher Dateityp
* Speicherort
* Dateiname
* Zugriffsrechte

Hochgeladene Dateien dürfen nicht automatisch ausführbar sein.

9.17 Bildverarbeitung

Bilddateien sollen vor Speicherung bzw. Weiterverarbeitung validiert werden.

Die Bildoptimierung soll nach Möglichkeit auf dem Endgerät erfolgen.

Serverseitig muss trotzdem eine sichere Prüfung erfolgen, wenn Dateien dort angenommen werden.

9.18 Zugangsdaten

Passwörter und andere Geheimnisse dürfen nicht ungeschützt gespeichert werden.

Die konkrete sichere Speichertechnik bestimmt der Agent anhand der verwendeten Plattform.

9.19 Serverkommunikation

Serverkommunikation soll ausschließlich über geeignete sichere Verfahren erfolgen.

Unsichere Übertragungsverfahren dürfen nicht als Standard für sensible Daten verwendet werden.

9.20 API-Sicherheit

Server-APIs müssen Zugriffe authentifizieren und autorisieren.

Ein gültiger Endpunkt darf nicht automatisch bedeuten, dass jeder Benutzer jede Aktion ausführen darf.

9.21 Rollen und Rechte

Administrative Aktionen müssen über das Berechtigungsmodell geschützt werden.

Dies gilt sowohl für die sichtbare Benutzeroberfläche als auch für direkte technische Aufrufe.

9.22 Schutz gegen Fehlkonfiguration

Das Framework soll kritische Fehlkonfigurationen erkennen können.

Beispiele:

* ungültiger Server
* fehlende Zugangsdaten
* fehlende Berechtigungen
* inkompatibles Modul
* fehlende Migration
* ungültige Konfiguration

9.23 Sichere Defaults

Bei einer Erstinstallation sollen möglichst sichere Standardwerte verwendet werden.

Unsichere Funktionen sollen nicht standardmäßig aktiviert werden, wenn dies vermeidbar ist.

9.24 Debug-Modus

Ein Debug-Modus darf vorhanden sein.

Er muss jedoch bewusst aktiviert werden können.

Produktivsysteme sollen keine unnötigen technischen Informationen an normale Benutzer ausgeben.

9.25 Diagnose ohne Datenverlust

Diagnosefunktionen dürfen grundsätzlich keine Nutzerdaten verändern oder löschen.

Prüfungen sollen möglichst read-only sein.

Wenn eine Reparaturfunktion Daten verändern muss, muss dies eindeutig erkennbar sein.

9.26 Reparaturfunktionen

Der Admin-Bereich kann kontrollierte Reparaturfunktionen bereitstellen.

Beispiele:

* Cache leeren
* Migration erneut prüfen
* Konfiguration validieren
* Modul neu registrieren
* Synchronisation erneut starten

Solche Funktionen müssen entsprechend geschützt sein.

9.27 Systemweite Fehler

Wenn ein Fehler den Core selbst betrifft, muss das Framework möglichst einen kontrollierten Fehlerzustand herstellen.

Die Anwendung soll nicht ohne nachvollziehbare Fehlermeldung vollständig abstürzen, sofern eine kontrollierte Fehlerbehandlung technisch möglich ist.

9.28 Modulfehler

Wenn ein Modul fehlerhaft ist, soll der Administrator möglichst:

* Fehler sehen,
* Modul deaktivieren,
* Logs ansehen,
* Konfiguration prüfen,
* Update durchführen,
* Modul gegebenenfalls entfernen

können.

9.29 Sicherheitsereignisse

Sicherheitsrelevante Ereignisse sollen erkannt und protokolliert werden können.

Beispiele:

* fehlgeschlagene Logins
* ungewöhnliche Authentifizierungsfehler
* unautorisierte Zugriffe
* ungültige Tokens
* manipulierte Moduldateien
* ungültige Uploads

9.30 Stabilitätsziel

Das Framework soll so aufgebaut werden, dass Änderungen möglichst lokal bleiben.

Ein Fehler in einem Modul soll möglichst nicht zu Änderungen an zahlreichen unabhängigen Komponenten führen.

Das zentrale Ziel lautet:

Fehler finden, betroffene Komponente isolieren, korrigieren und testen, ohne unnötig andere Systembereiche verändern zu müssen.

9.31 Technische Freiheit des Agenten

Die konkrete Sicherheits- und Fehlerarchitektur darf der Agent anhand der vorhandenen Plattform, Programmiersprache und Projektstruktur festlegen.

Die Anforderungen dieser Vision sind funktionale und architektonische Ziele.

Sie schreiben keine unnötigen Implementierungsdetails vor.

⸻


Kapitel 10 – Routing, Navigation, Benutzerfluss und UI-Struktur

10.1 Grundprinzip

Die Navigation muss zentral, zuverlässig und modular funktionieren.

Jede Anwendung und jedes Modul kann eigene Menüs und eigene Oberflächen besitzen.

Der Core stellt dafür das Routing- und Navigationssystem bereit.

Der Core darf nicht von einem bestimmten Menüaufbau oder einem bestimmten Design abhängig sein.

10.2 Grundstruktur der Anwendung

Die Anwendung besitzt grundsätzlich eine gemeinsame Rahmenstruktur.

Diese kann aus folgenden Bereichen bestehen:

* Header
* Navigation
* Main Content
* Footer

Diese Struktur dient als grundlegender Rahmen.

Module können innerhalb dieser Struktur ihre eigenen Oberflächen darstellen.

10.3 Index-/Shell-Struktur

Die Anwendung soll eine zentrale Einstiegsebene besitzen.

Diese übernimmt insbesondere:

* Laden des Core
* Initialisierung
* Routing
* Laden der aktiven Module
* Aufbau des Grundlayouts
* Benutzerstatus
* Navigation

Die konkrete technische Umsetzung kann beispielsweise über eine zentrale Index-/Shell-Komponente erfolgen.

10.4 Eigenes Design pro Anwendung

Eine Anwendung soll ihr eigenes Erscheinungsbild mitbringen können.

Dazu gehören:

* Farben
* Schriften
* Icons
* Layout
* Menüs
* Abstände
* Komponenten
* Seitenstruktur

Der Core stellt nur die technischen Möglichkeiten bereit.

10.5 Eigenes Menü pro Anwendung

Jede Anwendung kann ihr eigenes Menü definieren.

Das Menü soll nicht fest im Core kodiert sein.

Module können zusätzliche Menüeinträge registrieren.

10.6 Eigenes Menü pro Modul

Ein Modul darf eigene Menüpunkte besitzen.

Beispielsweise kann ein Angel-Modul folgende Bereiche bereitstellen:

* Gewässer
* Fang
* Statistik
* Angeltreffen

Der Core registriert diese Bereiche und stellt die Navigation bereit.

10.7 Dynamische Navigation

Menüs sollen dynamisch erzeugt werden können.

Dabei können berücksichtigt werden:

* aktive Module
* Benutzerrechte
* Benutzerrolle
* Gerätezustand
* Online-/Offline-Zustand
* verfügbare Funktionen

Ein Menüpunkt darf nicht angezeigt werden, wenn die entsprechende Funktion nicht verfügbar oder nicht autorisiert ist.

10.8 Admin-Navigation

Der Admin-Bereich soll innerhalb derselben App erreichbar sein.

Wenn ein Benutzer die entsprechende Berechtigung besitzt, kann im normalen Menü ein Eintrag wie:

Admin

angezeigt werden.

Nach Auswahl dieses Bereichs wird die normale Navigation durch die administrative Navigation ersetzt.

10.9 Wechsel zwischen User und Admin

Der Wechsel soll eindeutig und einfach funktionieren.

Beispiel:

Normales Menü → Admin → Admin-Menü

Im Admin-Bereich befindet sich oben eine Zurück-Funktion.

← Zurück

Dadurch kann der Benutzer wieder zum normalen Menü zurückkehren.

10.10 Kein zweites Admin-System

Der Admin-Bereich soll nicht als vollständig getrennte Anwendung umgesetzt werden müssen.

Er ist Bestandteil der gemeinsamen App-Struktur.

Damit können Core, User Interface und Administration gemeinsame Infrastruktur verwenden.

10.11 Direkte Navigation

Jede relevante Ansicht muss direkt adressierbar sein können.

Eine direkte Navigation auf eine geschützte Ansicht muss dabei dieselben Prüfungen durchführen wie eine Navigation über das Menü.

10.12 Login

Beim Login muss das Routing den Benutzer korrekt weiterleiten.

Dabei muss berücksichtigt werden:

* Benutzerstatus
* Rolle
* Berechtigungen
* gewünschtes Ziel
* Setup-Status
* Online-/Offline-Zustand

10.13 Login-Weiterleitung

Wenn ein Benutzer beispielsweise versucht, eine geschützte Seite aufzurufen und noch nicht angemeldet ist, soll das System:

1. den Benutzer zum Login führen,
2. den ursprünglich gewünschten Zielbereich merken,
3. die Authentifizierung durchführen,
4. anschließend zum erlaubten Ziel zurückkehren.

Wenn das Ziel nicht erlaubt oder nicht mehr verfügbar ist, muss eine sichere alternative Zielseite gewählt werden.

10.14 Logout

Nach dem Logout müssen geschützte Bereiche nicht mehr zugänglich sein.

Ein Zurück-Navigieren im Browser bzw. in der Navigation darf nicht dazu führen, dass geschützte Inhalte unautorisiert sichtbar werden.

10.15 Rollenabhängige Navigation

Navigationselemente können abhängig von Berechtigungen angezeigt oder ausgeblendet werden.

Dies ist jedoch nur eine Komfortfunktion.

Die eigentliche Berechtigungsprüfung muss zusätzlich technisch erfolgen.

10.16 Nicht verfügbare Module

Wenn ein Modul deaktiviert oder nicht installiert ist, dürfen seine Navigationspunkte nicht aktiv bleiben.

Das Framework soll veraltete oder ungültige Routen möglichst erkennen.

10.17 Modulrouten

Module können eigene Routen registrieren.

Die Route kann beispielsweise enthalten:

* Pfad
* Name
* Komponente
* Berechtigungen
* Authentifizierungsanforderung
* Onlineanforderung
* Modulabhängigkeit

10.18 Routenregistrierung

Module sollen ihre Routen über eine definierte Schnittstelle registrieren.

Der Core muss nicht wissen, welche fachliche Funktion hinter einer Route steckt.

Er verwaltet nur die technische Registrierung und Ausführung.

10.19 Routenauflösung

Das Framework muss zuverlässig erkennen können, welche Komponente für eine angeforderte Route zuständig ist.

Ungültige Routen sollen kontrolliert behandelt werden.

10.20 404-/Fehlerseite

Für nicht vorhandene Bereiche soll eine definierte Fehleransicht vorhanden sein.

Diese kann beispielsweise anzeigen:

Seite nicht gefunden

Zusätzlich kann eine Rückkehr zum Hauptbereich angeboten werden.

10.21 Redirect-System

Das Framework benötigt eine zentrale Möglichkeit für Weiterleitungen.

Weiterleitungen können beispielsweise notwendig sein bei:

* Login
* Logout
* Setup
* Modulaktivierung
* Adminwechsel
* Berechtigungsfehler
* nicht vorhandener Route
* Migration
* Serverwechsel

10.22 Weiterleitungsregeln

Weiterleitungen müssen sicher erfolgen.

Insbesondere dürfen keine beliebigen externen Weiterleitungsziele ungeprüft übernommen werden, wenn dadurch Sicherheitsprobleme entstehen können.

10.23 Deep Links

Wenn die Plattform dies unterstützt, sollen direkte Links auf bestimmte Ansichten funktionieren.

Das betrifft insbesondere:

* Modulansichten
* Detailseiten
* Admin-Seiten
* Benutzerbereiche
* Einstellungen

10.24 Navigation innerhalb eines Moduls

Ein Modul darf eine eigene interne Navigation besitzen.

Der Core muss nicht jede einzelne Unterseite kennen.

Das Modul verwaltet seine fachliche Navigation innerhalb des ihm zugewiesenen Bereichs.

10.25 Zurück-Navigation

Die Anwendung soll eine zuverlässige Zurück-Navigation besitzen.

Dabei muss zwischen:

* Browser-/App-History
* Modulnavigation
* Admin-/User-Wechsel

unterschieden werden können.

10.26 UI-Zustand

Beim Navigieren soll der notwendige UI-Zustand erhalten bleiben können.

Beispielsweise:

* geöffneter Tab
* Filter
* Sortierung
* Scrollposition
* Formulardaten

Dies ist abhängig von der jeweiligen Anwendung.

10.27 Responsive Design

Die Oberfläche muss dynamisch auf unterschiedliche Bildschirmgrößen reagieren.

Insbesondere müssen berücksichtigt werden:

* Smartphone
* Tablet
* größere Tablets
* Desktop

Die Anwendung soll nicht zwingend eine spezielle Desktop-Version benötigen.

10.28 Mobile First

Da die Anwendung primär auf mobilen Geräten eingesetzt werden kann, soll das UI entsprechend optimiert werden.

Die Oberfläche muss dennoch auf größeren Displays sinnvoll funktionieren.

10.29 Footer

Der Footer ist ein optional erweiterbarer Bereich.

Er kann beispielsweise enthalten:

* Copyright
* Informationen
* Werbung
* Modulhinweise
* Banner
* Statusinformationen

Wenn kein Inhalt vorhanden ist, soll der Footerbereich möglichst automatisch entfallen oder reduziert werden.

10.30 Dynamische Inhalte

Header, Menü, Main Content und Footer sollen Erweiterungspunkte besitzen können.

Module können dort Inhalte registrieren, ohne die zentrale Shell manuell verändern zu müssen.

10.31 UI-Isolierung

Ein Modul soll seine eigenen UI-Komponenten möglichst unabhängig verwalten können.

Ein Fehler in einer Modulansicht darf möglichst nicht die gesamte Navigation beschädigen.

10.32 Einheitliche Core-Schnittstellen

Auch wenn Module unterschiedliche Designs besitzen, sollen sie für grundlegende Funktionen gemeinsame Schnittstellen verwenden.

Beispielsweise:

* Navigation
* Routing
* Authentifizierung
* Berechtigungen
* Storage
* API
* Benachrichtigungen
* Logging
* Konfiguration

10.33 Ziel

Das Navigationssystem soll gleichzeitig:

* flexibel
* modular
* sicher
* einfach
* erweiterbar
* zuverlässig

sein.

Der Benutzer soll jederzeit nachvollziehbar erkennen können, wo er sich befindet und wie er wieder zum vorherigen Bereich gelangt.

⸻

Kapitel 11 – Module, Schnittstellen und Entkopplung

11.1 Grundprinzip

Nach Fertigstellung des Frameworks sollen Anwendungen und Funktionen grundsätzlich als Module betrachtet werden.

Der Core ist die technische Grundlage.

Module liefern die konkrete Funktionalität.

Das Ziel ist eine möglichst klare Trennung zwischen:

* Core
* User Interface
* Administration
* Themes
* Modulen
* Serverdiensten
* Daten

11.2 Core als neutrales Framework

Der Core soll vollständig neutral gegenüber einzelnen Fachanwendungen sein.

Er darf keine unnötige Abhängigkeit zu einer bestimmten Anwendung enthalten.

Der Core stellt allgemeine Fähigkeiten bereit, die von beliebigen zukünftigen Anwendungen verwendet werden können.

11.3 Core-Funktionen

Der Core soll unter anderem grundlegende Infrastruktur für folgende Bereiche bereitstellen können:

* Initialisierung
* Lifecycle
* Routing
* Navigation
* UI-Shell
* Module
* Themes
* Konfiguration
* Storage
* Events
* Services
* Authentifizierung
* Autorisierung
* Benachrichtigungen
* Logging
* Fehlerbehandlung
* Diagnose
* Updates
* Migrationen
* Serverkommunikation
* Synchronisation
* Medien
* Sicherheit

Nicht jede Anwendung muss jede Funktion aktivieren.

11.4 Module als unabhängige Einheiten

Ein Modul soll möglichst eine klar abgegrenzte Aufgabe besitzen.

Beispiele:

* Angeln
* Angeltreffen
* Wetter
* Karten
* Marketplace
* Werbung
* Medien
* Benutzerverwaltung
* Rollen
* Synchronisation

Ein Modul soll nicht unnötig in andere Module eingreifen.

11.5 Modulstruktur

Ein Modul soll möglichst alle zu seiner Funktion gehörenden Bestandteile selbst mitbringen können.

Dazu gehören beispielsweise:

* UI
* Routen
* Menüpunkte
* Konfiguration
* Datenmodelle
* Services
* Übersetzungen
* Berechtigungen
* Migrationen
* Tests
* Dokumentation

Dadurch soll die Installation eines Moduls möglichst vollständig und nachvollziehbar sein.

11.6 Modulmanifest

Jedes Modul soll über eine definierte Beschreibung verfügen.

Diese kann enthalten:

* Modulname
* eindeutige ID
* Version
* Beschreibung
* Autor
* Core-Anforderungen
* Abhängigkeiten
* Berechtigungen
* Routen
* Menüs
* Konfiguration
* Migrationen
* benötigte Services

Das konkrete Format wird anhand der vorhandenen Projektstruktur festgelegt.

11.7 Modul-Lifecycle

Module sollen einen definierten Lebenszyklus besitzen.

Beispielsweise:

* erkannt
* installiert
* registriert
* aktiviert
* initialisiert
* verwendet
* deaktiviert
* aktualisiert
* deinstalliert

Der Core verwaltet diesen Lifecycle.

11.8 Modulaktivierung

Ein installiertes Modul muss nicht automatisch aktiv sein.

Der Administrator soll Module aktivieren und deaktivieren können.

Deaktivierte Module dürfen keine aktiven Routen oder Menüpunkte hinterlassen.

11.9 Modulinstallation

Die Installation soll möglichst kontrolliert erfolgen.

Dabei müssen insbesondere geprüft werden:

* Manifest
* Version
* Core-Kompatibilität
* Abhängigkeiten
* Dateistruktur
* Berechtigungen
* Migrationen

11.10 Moduldeinstallation

Die Deinstallation soll kontrolliert erfolgen.

Dabei muss zwischen folgenden Dingen unterschieden werden können:

* Moduldateien
* Konfiguration
* lokale Daten
* serverseitige Daten
* Datenbankstrukturen

Eine Deinstallation darf nicht ohne klare technische Definition sämtliche Nutzerdaten löschen.

11.11 Modulabhängigkeiten

Module dürfen Abhängigkeiten besitzen.

Diese müssen explizit definiert werden.

Der Core soll Abhängigkeiten erkennen und deren Voraussetzungen prüfen.

Zyklische oder ungültige Abhängigkeiten müssen erkannt werden.

11.12 Optionale Abhängigkeiten

Ein Modul kann optionale Funktionen besitzen, die nur aktiviert werden, wenn ein anderes Modul vorhanden ist.

Das Basismodul soll trotzdem funktionieren, sofern die optionale Funktion nicht benötigt wird.

11.13 Kommunikation zwischen Modulen

Module sollen über definierte Schnittstellen miteinander kommunizieren.

Direkte Manipulation fremder Moduldateien soll vermieden werden.

Bevorzugt werden:

* Events
* Services
* APIs
* definierte Interfaces

11.14 Events

Der Core soll ein Event-System bereitstellen.

Module können Ereignisse auslösen oder darauf reagieren.

Beispiele:

* Benutzer angemeldet
* Benutzer registriert
* Modul installiert
* Bild hochgeladen
* Datensatz erstellt
* Synchronisation abgeschlossen
* Fehler erkannt

11.15 Services

Für allgemeine technische Funktionen soll der Core zentrale Services bereitstellen.

Module greifen auf diese Services über definierte Schnittstellen zu.

Dadurch muss ein Modul beispielsweise keinen eigenen Server-Client entwickeln, wenn der Core bereits einen geeigneten Service bereitstellt.

11.16 Keine gegenseitige Core-Manipulation

Module dürfen den Core nicht direkt verändern.

Wenn eine Erweiterung benötigt wird, soll sie über:

* Interface
* Event
* Hook
* Service
* Extension Point

erfolgen.

11.17 Extension Points

Der Core soll gezielt Erweiterungspunkte besitzen.

Beispiele:

* Header
* Navigation
* Main Content
* Footer
* Dashboard
* Admin
* Settings
* Login
* User Profile

Damit können Module Funktionalität hinzufügen, ohne Core-Dateien ändern zu müssen.

11.18 Core-Erweiterbarkeit

Der Core selbst muss so geplant werden, dass bekannte Erweiterungsbereiche bereits berücksichtigt werden.

Das Ziel ist nicht, jede zukünftige Funktion vorherzusagen.

Das Ziel ist eine flexible Infrastruktur, mit der zukünftige Funktionen integriert werden können, ohne die Core-Architektur grundsätzlich neu bauen zu müssen.

11.19 Kein unnötiges Hardcoding

Fachliche Regeln sollen nicht unnötig im Core festgeschrieben werden.

Beispielsweise darf der Core nicht wissen, was ein „Angeltreffen“ fachlich bedeutet.

Er stellt lediglich die technischen Möglichkeiten bereit.

11.20 Module bringen ihre Regeln mit

Fachliche Regeln gehören grundsätzlich in das jeweilige Modul.

Das Modul definiert:

* Daten
* Logik
* UI
* Berechtigungen
* Konfiguration
* Fachregeln

Der Core stellt die Infrastruktur bereit.

11.21 Modul-UI

Ein Modul darf sein eigenes Design und seine eigenen UI-Komponenten mitbringen.

Es muss nicht das Design eines anderen Moduls übernehmen.

Es muss jedoch die technischen Core-Schnittstellen verwenden.

11.22 Modul-Menü

Ein Modul kann eigene Menüeinträge registrieren.

Diese sollen automatisch erscheinen, wenn das Modul aktiv und für den aktuellen Benutzer verfügbar ist.

11.23 Modul-Admin

Ein Modul kann einen eigenen administrativen Bereich bereitstellen.

Dieser soll sich automatisch in den zentralen Admin-Bereich integrieren können.

11.24 Modul-Konfiguration

Module sollen eigene Einstellungen definieren können.

Der Core speichert und verwaltet diese über die zentrale Konfigurationsinfrastruktur.

11.25 Modul-Berechtigungen

Module können eigene Berechtigungen registrieren.

Diese werden vom zentralen Berechtigungssystem verwaltet.

11.26 Modul-Daten

Module sollen möglichst selbst bestimmen können, welche Daten sie benötigen.

Der Core stellt Storage- und Datenzugriffsmöglichkeiten bereit.

11.27 Modul-Synchronisation

Wenn ein Modul Online-Synchronisation benötigt, soll es die zentrale Synchronisationsinfrastruktur verwenden können.

Ein rein lokales Modul muss keine Synchronisation implementieren.

11.28 Modul-Medien

Module können Medienfunktionen verwenden.

Beispielsweise:

* Bild auswählen
* Bild optimieren
* Bild speichern
* Bild hochladen
* Bild abrufen
* Thumbnail erzeugen

Diese Funktionen sollen möglichst zentral bereitgestellt werden.

11.29 Modul-Updates

Module sollen unabhängig aktualisiert werden können.

Ein Modulupdate soll möglichst keine Änderungen an anderen Modulen erzwingen, außer wenn eine explizite Abhängigkeit besteht.

11.30 Modulfehler

Ein Modulfehler soll möglichst isoliert behandelt werden.

Der Core soll nicht wegen eines einzelnen fehlerhaften Moduls vollständig unbrauchbar werden.

11.31 Modul-Testbarkeit

Module sollen möglichst unabhängig getestet werden können.

Dazu gehören:

* Unit-Tests
* Integrations-Tests
* UI-Tests
* gegebenenfalls E2E-Tests

Die Teststrategie richtet sich nach der Komplexität des jeweiligen Moduls.

11.32 Modulverzeichnis

Die Projektstruktur soll eine klare Trennung zwischen Core und Modulen ermöglichen.

Die konkrete Ordnerstruktur wird anhand des vorhandenen Repositories festgelegt.

Wichtig ist die logische und technische Entkopplung.

11.33 Keine künstliche Modularisierung

Modularisierung darf nicht nur aus vielen Ordnern bestehen.

Ein Modul gilt nur dann als wirklich unabhängig, wenn seine Schnittstellen und Abhängigkeiten klar definiert sind.

Ziel ist echte Entkopplung, nicht lediglich eine andere Dateiorganisation.

11.34 Marketplace als Modul

Der Marketplace ist ein konkretes Beispiel für diese Architektur.

Er soll nicht Bestandteil des Core sein.

Wenn kein Marketplace installiert ist, muss der Core vollständig funktionieren.

Wenn der Marketplace installiert wird, nutzt er die vorhandenen Modul- und Update-Schnittstellen.

11.35 Advertisement als Modul

Werbung wird ebenfalls als eigenständiges Modul betrachtet.

Der Core stellt lediglich geeignete Extension Points bereit.

Das Advertising-Modul entscheidet selbst, welche Inhalte angezeigt werden.

11.36 Rollen und Benutzer als Module

Auch Benutzerverwaltung, Rollen und Berechtigungen sollen soweit technisch sinnvoll modular aufgebaut werden.

Der Core stellt dafür die notwendigen Interfaces bereit.

Eine reine Offline-App soll nicht gezwungen werden, sämtliche Benutzerfunktionen zu aktivieren.

11.37 Ziel der Entkopplung

Die zentrale Zielvorstellung lautet:

Der Core bleibt stabil. Module verändern sich.

Wenn ein Fehler in einem Modul gefunden wird, soll möglichst nur dieses Modul geändert werden müssen.

Wenn ein neues Modul entwickelt wird, soll möglichst kein Umbau bestehender Module erforderlich sein.

11.38 Zukunftssicherheit

Das Framework soll so aufgebaut werden, dass zukünftige Module hinzugefügt werden können, ohne dass dafür regelmäßig grundlegende Core-Dateien umgeschrieben werden müssen.

Eine absolute Garantie, dass der Core niemals erweitert werden muss, ist technisch nicht realistisch.

Das Ziel ist jedoch, die Wahrscheinlichkeit grundlegender Core-Umbauten durch eine möglichst vollständige und saubere Architektur stark zu reduzieren.

11.39 Endziel

Nach Fertigstellung des Frameworks soll folgende Struktur bestehen:

Core

Neutrale technische Grundlage.

User Interface

Zentrale Anwendungsshell und Benutzerzugang.

Administration

Integrierte Verwaltungsoberfläche.

Themes

Austauschbare Darstellung.

Module

Eigenständige fachliche Erweiterungen.

Server

Optionale zentrale Dienste und Datenspeicherung.

Damit soll aus dem Core + User Interface + Administration ein stabiles Final Framework entstehen, auf dem zukünftige Anwendungen möglichst ausschließlich durch Module aufgebaut werden.

⸻

Kapitel 12 – Medien, Uploads, Speicher und Übertragung

12.1 Grundprinzip

Medienverwaltung ist eine zentrale technische Fähigkeit des Frameworks, aber keine fachliche Funktion des Core.

Der Core stellt die notwendigen Schnittstellen bereit.

Konkrete Anwendungen und Module entscheiden, welche Medien sie benötigen.

12.2 Unterstützte Medien

Das Framework soll grundsätzlich unterschiedliche Medientypen unterstützen können.

Beispiele:

* Bilder
* Dokumente
* Audio
* Video
* sonstige Dateien

Nicht jede Anwendung muss sämtliche Medientypen aktivieren.

12.3 Medienmodul

Die eigentliche Medienverwaltung soll möglichst über ein eigenständiges Medienmodul erfolgen.

Dieses kann Funktionen bereitstellen für:

* Auswahl
* Upload
* Optimierung
* Speicherung
* Abruf
* Löschung
* Metadaten
* Vorschau
* Thumbnails

12.4 Bild-Upload

Bilder sollen direkt aus der Anwendung heraus hochgeladen werden können.

Der Benutzer soll keinen manuellen FTP-Prozess durchführen müssen.

Der technische Übertragungsweg wird durch die Serverarchitektur bestimmt.

12.5 Upload vor Verarbeitung

Vor einem Upload soll das System prüfen, welche Verarbeitung vorgesehen ist.

Dabei können insbesondere berücksichtigt werden:

* maximale Auflösung
* maximale Dateigröße
* erlaubte Formate
* Kompression
* Zielqualität
* Metadaten

12.6 Clientseitige Optimierung

Wenn möglich, soll die Bildoptimierung bereits auf dem Endgerät erfolgen.

Dies reduziert:

* Datenverkehr
* Uploadzeit
* Serverlast
* Speicherbedarf

Die Optimierung darf jedoch nicht zu einem Verlust der eigentlichen Nutzbarkeit des Bildes führen.

12.7 Konfigurierbare Bildoptimierung

Der Administrator soll die Bildoptimierung konfigurieren können.

Mögliche Einstellungen:

* Optimierung aktiv/inaktiv
* maximale Breite
* maximale Höhe
* maximale Dateigröße
* Qualitätsstufe
* Zielformat
* Thumbnail-Größe
* Metadaten entfernen

12.8 Keine Optimierung

Es muss eine Option geben, die automatische Optimierung abzuschalten.

Dann wird das Original grundsätzlich erhalten bzw. übertragen, sofern es die Sicherheits- und Uploadregeln zulassen.

12.9 Maximale Bildauflösung

Die Anwendung soll eine konfigurierbare maximale Bildauflösung besitzen.

Ein sinnvoller Standard kann beispielsweise:

1024 × 768 Pixel

sein.

Dieser Wert darf administrativ geändert werden.

12.10 Dateigrößenlimit

Zusätzlich zur Auflösung soll ein Dateigrößenlimit konfigurierbar sein.

Beispielsweise kann ein Modul festlegen:

* maximale Größe 500 KB
* maximale Größe 1 MB
* maximale Größe 2 MB

Die konkreten Werte sind abhängig vom Anwendungsfall.

12.11 Automatische Skalierung

Wenn ein Bild größer als die konfigurierte maximale Auflösung ist, soll es automatisch proportional verkleinert werden können.

Das Seitenverhältnis muss dabei erhalten bleiben.

12.12 Formatkonvertierung

Das System soll Bilder bei Bedarf in ein einheitliches Zielformat konvertieren können.

Beispielsweise:

* JPEG
* WebP
* PNG

Das Zielformat soll konfigurierbar sein, soweit die Plattform dies unterstützt.

12.13 Originaldatei

Ob das Original zusätzlich zur optimierten Version gespeichert wird, soll konfigurierbar sein.

Bei Anwendungen mit starkem Speicherbedarf kann das Original nach erfolgreicher Optimierung verworfen werden.

12.14 Thumbnails

Das Medienmodul soll automatisch Vorschaubilder erzeugen können.

Mögliche Größen:

* kleines Thumbnail
* mittlere Vorschau
* große Vorschau

Die tatsächlichen Größen können konfiguriert werden.

12.15 Dateinamen

Originale Dateinamen sollen nicht ungeprüft als serverseitige Dateinamen verwendet werden.

Das System soll sichere interne Dateinamen erzeugen können.

Originalinformationen können als Metadaten erhalten bleiben.

12.16 Medien-Metadaten

Je nach Medientyp können Metadaten gespeichert werden.

Bei Bildern können beispielsweise relevant sein:

* Originalname
* Dateityp
* Dateigröße
* Auflösung
* Erstellungszeit
* Uploadzeit
* Besitzer
* Modul
* Datensatz
* Speicherort

12.17 EXIF-Daten

Das System soll berücksichtigen können, dass Bilddateien EXIF-Daten enthalten.

Je nach Datenschutzanforderung können diese entfernt werden.

Dies soll konfigurierbar sein.

12.18 Speicherorte

Medien sollen unterschiedliche Speicherorte unterstützen können.

Beispiele:

* lokaler Gerätespeicher
* interner App-Speicher
* Server
* externer Storage
* CDN oder vergleichbarer Dienst

Die konkrete Implementierung richtet sich nach der Zielplattform.

12.19 Storage-Abstraktion

Module dürfen nicht fest auf einen bestimmten Speicheranbieter programmiert werden.

Der Core bzw. das Medienmodul stellt eine Storage-Abstraktion bereit.

Dadurch kann der Speicher später gewechselt werden.

12.20 Server-Speicher

Bei einer Online-Anwendung können Medien auf einem konfigurierten Server gespeichert werden.

Die App kommuniziert dafür mit einer definierten Server-/API-Schnittstelle.

12.21 Übertragungsprotokoll

Der konkrete Übertragungsweg ist nicht Bestandteil der Vision.

Er soll anhand von:

* Sicherheit
* Zuverlässigkeit
* Geschwindigkeit
* Serverkompatibilität
* Wartbarkeit

ausgewählt werden.

Für normale App-Kommunikation soll eine moderne API-basierte Lösung bevorzugt werden.

SFTP kann für spezielle Dateiübertragungsaufgaben eingesetzt werden.

12.22 Upload-Fortschritt

Bei größeren Dateien soll der Benutzer nach Möglichkeit den Upload-Fortschritt sehen können.

Beispielsweise:

Upload 65 %

Bei kleinen Dateien kann dies entfallen.

12.23 Upload-Abbruch

Ein laufender Upload soll nach Möglichkeit abgebrochen werden können.

Der Benutzer soll anschließend nicht mit einer scheinbar erfolgreichen Datei zurückgelassen werden.

12.24 Fehlgeschlagene Uploads

Wenn ein Upload fehlschlägt, soll die lokale Datei nicht automatisch verloren gehen.

Das System soll einen erneuten Versuch ermöglichen können.

12.25 Offline-Upload

Bei Offline-Nutzung kann ein Medienupload zunächst lokal gespeichert werden.

Sobald eine Verbindung verfügbar ist, kann die Übertragung automatisch oder manuell nachgeholt werden.

12.26 Upload-Warteschlange

Für Offline-/Online-Synchronisation soll eine Upload-Warteschlange möglich sein.

Diese kann enthalten:

* Datei
* Ziel
* Modul
* Status
* Fehler
* Wiederholungsversuche
* Zeitstempel

12.27 Synchronisationsstatus

Der Benutzer bzw. Administrator soll erkennen können, ob ein Medium:

* lokal vorhanden
* hochgeladen
* synchronisiert
* ausstehend
* fehlgeschlagen

ist.

12.28 Serverrechte

Die App darf auf dem Server nur die für ihre Aufgaben erforderlichen Rechte erhalten.

Ein Medienupload darf nicht automatisch vollständigen Serverzugriff benötigen.

12.29 Direkter FTP-Zugriff

Ein direkter FTP-Zugriff aus der App ist nicht grundsätzlich vorgesehen.

Wenn ein Server nur bestimmte Dateiübertragungsmechanismen anbietet, kann eine entsprechende Integration als Modul bzw. Storage-Adapter umgesetzt werden.

Sicherheit und technische Eignung haben Vorrang.

12.30 Medienlöschung

Das Löschen eines Mediums muss kontrolliert erfolgen.

Vor einer endgültigen Löschung soll geprüft werden können, ob das Medium noch von anderen Datensätzen oder Modulen verwendet wird.

12.31 Medienberechtigungen

Medien können ebenfalls Berechtigungen unterliegen.

Beispielsweise:

* ansehen
* hochladen
* bearbeiten
* löschen
* öffentlich freigeben

Die konkrete Berechtigungsstruktur wird vom Medienmodul bereitgestellt.

12.32 Öffentliche Medien

Ein Medium kann je nach Anwendung öffentlich oder geschützt sein.

Geschützte Medien dürfen nicht allein durch Kenntnis eines Dateipfades zugänglich sein.

12.33 Medienzugriff

Der Zugriff auf Medien soll möglichst über definierte IDs bzw. Ressourcen erfolgen.

Direkte physische Speicherpfade sollen nicht unnötig in der Benutzeroberfläche verwendet werden.

12.34 Cache

Häufig verwendete Medien können lokal oder serverseitig zwischengespeichert werden.

Das Cache-System muss berücksichtigen, dass sich Medien ändern oder gelöscht werden können.

12.35 Speicherverwaltung

Der Admin-Bereich soll den Speicherstatus anzeigen können.

Mögliche Informationen:

* verwendeter Speicher
* verfügbarer Speicher
* Anzahl Dateien
* Mediengröße
* lokale Daten
* Serverdaten

12.36 Bereinigung

Nicht mehr benötigte temporäre Dateien sollen automatisch oder administrativ bereinigt werden können.

Dabei dürfen keine noch benötigten Nutzerdaten gelöscht werden.

12.37 Medien als unabhängiger Dienst

Das Medienmodul soll von verschiedenen Fachmodulen verwendet werden können.

Beispielsweise:

* Fishing-Domain
* Angeltreffen
* Benutzerprofile
* Marketplace
* Werbung

Alle verwenden dieselbe technische Medieninfrastruktur.

12.38 Ziel

Das Framework soll Medien möglichst:

* sicher
* sparsam
* zuverlässig
* modular
* offlinefähig
* serverfähig
* konfigurierbar

verwalten können.

Die Fachmodule entscheiden, wofür Medien verwendet werden.

Der Core stellt nur die notwendigen technischen Schnittstellen und Infrastruktur bereit.

⸻

Kapitel 13 – Benachrichtigungen, Events, Services und Kommunikation

13.1 Grundprinzip

Das Framework benötigt eine zentrale Kommunikationsinfrastruktur, über die Core, Module, Benutzeroberfläche und optionale Serverdienste miteinander kommunizieren können.

Diese Kommunikation soll möglichst über klar definierte Schnittstellen erfolgen.

Direkte Abhängigkeiten zwischen einzelnen Modulen sollen vermieden werden.

13.2 Event-System

Der Core stellt ein zentrales Event-System bereit.

Module können Events:

* auslösen
* abonnieren
* verarbeiten

Ein Modul muss dafür nicht direkt in den Code eines anderen Moduls eingreifen.

13.3 System-Events

Das Framework soll grundlegende Systemereignisse unterstützen können.

Beispiele:

* App gestartet
* App beendet
* Benutzer angemeldet
* Benutzer abgemeldet
* Modul installiert
* Modul aktiviert
* Modul deaktiviert
* Modul aktualisiert
* Konfiguration geändert
* Server verbunden
* Server nicht erreichbar
* Synchronisation gestartet
* Synchronisation abgeschlossen
* Upload abgeschlossen
* Fehler erkannt

13.4 Modul-Events

Module dürfen eigene Events definieren.

Beispielsweise könnte ein Angel-Modul Ereignisse bereitstellen wie:

* Fang erstellt
* Fang geändert
* Fang gelöscht
* Treffen erstellt
* Treffen geändert

Der Core muss die fachliche Bedeutung dieser Events nicht kennen.

13.5 Event-Payload

Events können zusätzliche Informationen übergeben.

Die Struktur muss eindeutig definiert sein.

Sensible Informationen dürfen nicht unnötig in Events enthalten sein.

13.6 Event-Sicherheit

Nicht jedes Modul darf automatisch jedes Event auslösen oder verändern können.

Sicherheitsrelevante Events müssen entsprechend geschützt werden.

13.7 Services

Der Core soll zentrale technische Services bereitstellen.

Beispiele:

* Storage
* Netzwerk
* Routing
* Konfiguration
* Logging
* Authentifizierung
* Autorisierung
* Benachrichtigungen
* Medien
* Synchronisation
* Updates

Module verwenden diese Services über definierte Schnittstellen.

13.8 Service-Abstraktion

Module dürfen nicht unnötig an eine konkrete Implementierung gebunden werden.

Ein Modul soll beispielsweise nicht direkt eine bestimmte HTTP-Bibliothek voraussetzen, wenn der Core bereits einen entsprechenden Netzwerk-Service anbietet.

13.9 Austauschbare Implementierungen

Technische Services sollen bei Bedarf austauschbar sein.

Beispielsweise kann der Storage-Service später eine andere Speichertechnik verwenden, ohne dass alle Module geändert werden müssen.

13.10 Benachrichtigungssystem

Das Framework soll ein zentrales Benachrichtigungssystem besitzen.

Benachrichtigungen können lokal oder online bereitgestellt werden.

Mögliche Formen:

* In-App
* Push
* Systembenachrichtigung
* Admin-Hinweis
* E-Mail, sofern ein entsprechendes Modul vorhanden ist

13.11 In-App-Benachrichtigungen

Benachrichtigungen sollen innerhalb der App angezeigt werden können.

Beispiele:

* neue Registrierung
* neues Modulupdate
* Fehler erkannt
* Synchronisation abgeschlossen
* Server nicht erreichbar

13.12 Push-Benachrichtigungen

Wenn die Zielplattform dies unterstützt, soll das Framework Push-Benachrichtigungen ermöglichen.

Die konkrete Push-Infrastruktur ist plattformabhängig und kann über einen entsprechenden Dienst bzw. ein Modul angebunden werden.

13.13 Admin-Benachrichtigungen

Der Developer bzw. Administrator soll wichtige Ereignisse erhalten können.

Beispiele:

Neue Benutzerregistrierung

Server nicht erreichbar

Fehler erkannt

Update verfügbar

13.14 Benachrichtigungsprioritäten

Benachrichtigungen können unterschiedliche Prioritäten besitzen.

Beispielsweise:

* Information
* Hinweis
* Warnung
* Fehler
* kritisch

Die Darstellung kann abhängig von der Priorität erfolgen.

13.15 Benachrichtigungseinstellungen

Benutzer sollen ihre Benachrichtigungseinstellungen verwalten können, soweit dies für die jeweilige Benachrichtigung sinnvoll ist.

Der Administrator soll systemweite Regeln definieren können.

13.16 Benachrichtigungsmodul

Die konkrete Zustellung von Benachrichtigungen soll möglichst modular erfolgen.

Beispielsweise:

Core

stellt Notification-Interface bereit.

Push-Modul

übernimmt Push-Zustellung.

E-Mail-Modul

übernimmt E-Mail.

In-App-Modul

zeigt Benachrichtigungen innerhalb der Anwendung.

Damit bleibt der Core unabhängig vom konkreten Übertragungsweg.

13.17 Kommunikation zwischen Modulen

Module sollen über Events und Services kommunizieren.

Beispiel:

Das Benutzer-Modul erkennt eine neue Registrierung.

Es löst ein Event aus.

Das Notification-Modul reagiert darauf und erstellt eine Benachrichtigung.

Das Benutzer-Modul muss nicht wissen, wie die Benachrichtigung tatsächlich zugestellt wird.

13.18 Entkopplung

Die Kommunikation soll möglichst nach folgendem Prinzip funktionieren:

Auslöser → Event → Reaktion

statt:

Modul A → direkter Aufruf von Modul B

Dadurch werden Module austauschbarer.

13.19 Asynchrone Verarbeitung

Aufwendige Vorgänge sollen nach Möglichkeit asynchron ausgeführt werden können.

Beispiele:

* Upload
* Bildoptimierung
* Synchronisation
* Benachrichtigung
* Datenimport
* Update

Die konkrete technische Umsetzung wird vom Agenten anhand der Plattform bestimmt.

13.20 Aufgabenwarteschlange

Für längere oder wiederholbare Aufgaben soll eine Task-/Job-Infrastruktur unterstützt werden können.

Eine Aufgabe kann beispielsweise besitzen:

* ID
* Typ
* Status
* Priorität
* Erstellzeit
* Startzeit
* Abschlusszeit
* Fehler
* Wiederholungszähler

13.21 Wiederholungen

Fehlgeschlagene Aufgaben sollen nach Möglichkeit erneut ausgeführt werden können.

Dabei müssen Endlosschleifen vermieden werden.

Die maximale Anzahl von Wiederholungen soll konfigurierbar sein können.

13.22 Offline-Aufgaben

Auch Offline-Anwendungen können Aufgaben lokal zwischenspeichern.

Beispielsweise:

* Upload ausstehend
* Synchronisation ausstehend
* Datenexport ausstehend

Nach Wiederherstellung der Verbindung können diese Aufgaben abgearbeitet werden.

13.23 Serverkommunikation

Serverkommunikation soll über eine abstrahierte API-Schicht erfolgen.

Module sollen nicht direkt mit einzelnen Serverimplementierungen gekoppelt sein.

13.24 API-Fehler

Serverfehler müssen kontrolliert behandelt werden.

Beispielsweise:

* keine Verbindung
* Timeout
* Authentifizierung fehlgeschlagen
* keine Berechtigung
* ungültige Anfrage
* Serverfehler

Der Benutzer soll eine verständliche Rückmeldung erhalten.

13.25 Kommunikation mit externen Diensten

Externe Dienste sollen über eigene Adapter bzw. Module eingebunden werden.

Beispiele:

* Wetterdienst
* Kartenanbieter
* Push-Dienst
* E-Mail
* Storage
* Analyse
* Marketplace

Der Core bleibt unabhängig vom konkreten Anbieter.

13.26 Anbieterwechsel

Wenn ein Modul einen externen Dienst verwendet, soll der Dienst möglichst austauschbar sein.

Ein späterer Wechsel des Anbieters soll nicht zwingend einen Core-Umbau erfordern.

13.27 Konfiguration externer Dienste

Externe Dienste sollen über den Admin-Bereich konfigurierbar sein.

Beispielsweise:

* API-Adresse
* API-Key
* Zugangsdaten
* Optionen
* Limits
* Aktivierung

Sensible Daten müssen geschützt gespeichert werden.

13.28 Service-Zustand

Der Admin-Bereich soll bei Bedarf anzeigen können, ob technische Services verfügbar sind.

Beispielsweise:

* Storage: OK
* API: OK
* Push: nicht konfiguriert
* Synchronisation: ausstehend

13.29 Ziel

Die Kommunikationsarchitektur soll ermöglichen, dass Module miteinander und mit externen Diensten arbeiten können, ohne sich gegenseitig unnötig abhängig zu machen.

Das gewünschte Grundprinzip lautet:

Core stellt Infrastruktur bereit.

Module stellen Fachfunktion bereit.

Events verbinden Funktionen.

Services stellen technische Fähigkeiten bereit.

Externe Dienste werden über Adapter/Module eingebunden.

⸻

Kapitel 14 – Online-/Offline-Betrieb, Synchronisation und Serveranbindung

14.1 Grundprinzip

Das Framework soll sowohl vollständig offline als auch online betrieben werden können.

Eine Anwendung soll nicht grundsätzlich einen Server benötigen.

Der Server ist eine optionale Erweiterung für Anwendungen, die zentrale Speicherung, Synchronisation oder andere Online-Dienste benötigen.

14.2 Offline First

Offline-Fähigkeit ist ein wichtiges Architekturprinzip.

Wenn eine Anwendung ohne Server auskommen kann, soll sie dies auch tun können.

Eine reine Offline-Anwendung soll keine unnötigen Funktionen für:

* Server
* Benutzerkonten
* Rollen
* zentrale Administration
* Online-Synchronisation

laden müssen.

14.3 Lokale Daten

Offline-Anwendungen speichern ihre Daten lokal.

Der Core stellt dafür eine geeignete Storage-Abstraktion bereit.

Die konkrete Speichertechnik wird anhand der Zielplattform ausgewählt.

14.4 Online-Erweiterung

Eine Anwendung kann später um Online-Funktionen erweitert werden.

Dabei sollen möglichst keine grundlegenden Änderungen an der Fachlogik erforderlich sein.

Das Online-Modul ergänzt die lokale Anwendung um:

* Serverkommunikation
* Synchronisation
* zentrale Speicherung
* gegebenenfalls Benutzerkonten

14.5 Server als optionaler Dienst

Der Server ist kein zwingender Bestandteil des Core.

Er wird nur aktiviert, wenn eine Anwendung ihn benötigt.

Damit kann dieselbe Framework-Grundlage sowohl für:

* reine Offline-Apps
* Online-Apps
* hybride Apps

verwendet werden.

14.6 Serveranbindung

Die Serveranbindung erfolgt über klar definierte Schnittstellen.

Die App muss im Admin-/Developer-Bereich konfigurierbare Verbindungsdaten besitzen können.

Beispielsweise:

* Serveradresse
* API-Endpunkt
* Authentifizierungsinformationen
* Storage-Konfiguration
* weitere technische Parameter

14.7 Keine festen Serverdaten

Serveradressen und Zugangsdaten dürfen nicht fest im Core programmiert sein.

Sie müssen konfigurierbar sein.

14.8 Serverwechsel

Ein Wechsel des Servers soll möglichst ohne Änderung der eigentlichen Fachmodule möglich sein.

Dazu müssen Serverkommunikation und Storage entsprechend abstrahiert werden.

14.9 Online-/Offline-Erkennung

Die Anwendung soll erkennen können, ob eine Onlineverbindung verfügbar ist.

Dabei darf „Netzwerk vorhanden“ nicht automatisch mit „Server erreichbar“ gleichgesetzt werden.

Es sollen mindestens folgende Zustände unterschieden werden können:

* offline
* Netzwerk verfügbar
* Server erreichbar
* Server nicht erreichbar
* Authentifizierung fehlgeschlagen

14.10 Synchronisationssystem

Für Anwendungen mit Online-Funktionalität soll der Core bzw. ein Synchronisationsmodul eine zentrale Synchronisationsinfrastruktur bereitstellen.

Diese soll unter anderem ermöglichen:

* lokale Änderungen erkennen
* Änderungen zum Server übertragen
* Serveränderungen abrufen
* Konflikte erkennen
* Synchronisationsstatus speichern

14.11 Lokale Priorität

Bei Offline-Nutzung müssen lokale Änderungen erhalten bleiben.

Ein fehlender Serverzugriff darf nicht dazu führen, dass lokale Arbeit verloren geht.

14.12 Synchronisationswarteschlange

Nicht übertragene Änderungen können in einer lokalen Warteschlange gespeichert werden.

Beispielsweise:

* Datensatz erstellt
* Datensatz geändert
* Datensatz gelöscht
* Bild hochgeladen
* Profil geändert

14.13 Automatische Synchronisation

Wenn die Anwendung wieder online ist, soll die Synchronisation automatisch erfolgen können.

Der Benutzer soll jedoch nicht gezwungen sein, die Anwendung dauerhaft online zu betreiben.

14.14 Manuelle Synchronisation

Zusätzlich kann eine manuelle Synchronisation angeboten werden.

Beispielsweise:

Jetzt synchronisieren

14.15 Synchronisationsstatus

Der Benutzer soll erkennen können, ob Daten:

* synchronisiert
* ausstehend
* lokal geändert
* fehlgeschlagen
* konfliktbehaftet

sind.

14.16 Konfliktbehandlung

Wenn dieselben Daten lokal und serverseitig verändert wurden, muss ein Konflikt erkannt werden können.

Die konkrete Konfliktstrategie hängt von der jeweiligen Anwendung ab.

Mögliche Strategien:

* lokale Version gewinnt
* Serverversion gewinnt
* neueste Änderung gewinnt
* manuelle Entscheidung
* fachliche Zusammenführung

Der Core soll die technische Möglichkeit bereitstellen, die Entscheidung trifft das jeweilige Modul bzw. die Anwendung.

14.17 Löschen und Synchronisation

Auch Löschvorgänge müssen synchronisierbar sein.

Ein lokal gelöschter Datensatz darf nicht einfach beim nächsten Serverabgleich wieder erscheinen.

Dafür kann eine geeignete Tombstone-/Delete-Markierung oder ein vergleichbarer Mechanismus verwendet werden.

14.18 Serverdaten

Der Server kann zentrale Daten speichern, wenn dies für die Anwendung erforderlich ist.

Beispiele:

* Benutzer
* Profile
* gemeinsame Inhalte
* Bilder
* Treffen
* öffentliche Informationen

14.19 Trennung von Daten und UI

Die Benutzeroberfläche darf nicht direkt vom physischen Speicherort der Daten abhängig sein.

Daten können lokal oder serverseitig gespeichert werden, ohne dass die UI grundsätzlich geändert werden muss.

14.20 Server als Backend

Der Server soll möglichst nur die Aufgaben übernehmen, die tatsächlich serverseitig erforderlich sind.

Beispielsweise:

* zentrale Datenspeicherung
* Authentifizierung
* Synchronisation
* Medien
* gemeinsame Daten
* Push-Kommunikation
* serverseitige Verarbeitung

14.21 Admin-Funktion in der App

Der administrative Bereich bleibt Bestandteil der App.

Der Developer kann sich innerhalb der App anmelden und den Admin-Bereich öffnen.

Dort können Servereinstellungen verwaltet werden.

14.22 Admin ohne permanente Serverabhängigkeit

Die App soll nicht grundsätzlich auf einen Server angewiesen sein, nur weil ein Admin-Bereich existiert.

Serverabhängige Funktionen werden nur aktiviert, wenn sie tatsächlich benötigt werden.

14.23 Developer-Account

Der Developer-/Administratorzugang ist Bestandteil des Frameworks.

Der entsprechende Benutzer kann administrative Funktionen erhalten.

Die konkreten Rollen und Berechtigungen werden über das Berechtigungssystem verwaltet.

14.24 Serverkonfiguration im Admin-Bereich

Der Admin-Bereich soll beispielsweise ermöglichen:

* Server aktivieren/deaktivieren
* Serveradresse konfigurieren
* API konfigurieren
* Storage konfigurieren
* Verbindungsprüfung durchführen
* Verbindung testen
* Synchronisation prüfen

14.25 Verbindungstest

Eine Serverkonfiguration soll vor der Aktivierung getestet werden können.

Der Admin soll erkennen können:

Verbindung erfolgreich

oder

Verbindung fehlgeschlagen

mit möglichst verständlicher Fehlerursache.

14.26 Serverrechte

Die App soll nur die notwendigen Rechte auf dem Server erhalten.

Es soll kein unnötiger Vollzugriff erforderlich sein.

14.27 Medien auf dem Server

Wenn ein Modul Bilder oder andere Dateien zentral speichern muss, kann dies über die Server-/Storage-Schnittstelle erfolgen.

Die App muss dabei nicht direkt auf die physische Serverstruktur zugreifen.

14.28 FTP/SFTP

Ein klassischer FTP-Zugriff ist nicht zwingend Teil des Frameworks.

Wenn ein bestimmter Server dies erfordert, kann ein entsprechender Storage-Adapter bzw. ein Übertragungsmodul eingesetzt werden.

Für sensible Daten sollen sichere Übertragungswege bevorzugt werden.

14.29 Serverausfall

Wenn der Server ausfällt, soll eine Offline-fähige Anwendung möglichst weiter funktionieren.

Lokale Funktionen dürfen nicht unnötig blockiert werden.

Serverabhängige Funktionen sollen entsprechend gekennzeichnet werden.

14.30 Wiederherstellung

Nach Wiederherstellung des Servers soll die Synchronisation fortgesetzt werden können.

Bereits erfolgreich synchronisierte Daten dürfen nicht unnötig erneut übertragen werden.

14.31 Serverwartung

Der Admin soll erkennen können, wenn der Server vorübergehend nicht verfügbar ist.

Die App soll in diesem Zustand möglichst sinnvoll weiterarbeiten.

14.32 Datenintegrität

Synchronisation darf nicht dazu führen, dass Daten stillschweigend verloren gehen.

Vor kritischen Änderungen müssen geeignete Prüfungen und Zustandsinformationen vorhanden sein.

14.33 Zukunftssicherheit

Die Serverarchitektur soll austauschbar bleiben.

Das Framework darf nicht unnötig von einem bestimmten Hostinganbieter, Servertyp oder Übertragungsprotokoll abhängig werden.

14.34 Zielarchitektur

Die gewünschte Struktur lautet:

Core → technische Infrastruktur

User Interface → Benutzeroberfläche

Administration → Verwaltung

Module → fachliche Funktionen

Serveranbindung → optionale Online-Funktion

Storage → austauschbare Datenspeicherung

Damit kann eine kleine Offline-App mit minimalem Funktionsumfang betrieben werden, während komplexere Anwendungen dieselbe Grundlage um Online-, Server- und Synchronisationsfunktionen erweitern können.

⸻

Kapitel 15 – Finales Framework, Qualitätsziele und Umsetzungsvorgaben

15.1 Ziel des gesamten Projekts

Das Ergebnis soll kein einzelnes fertiges Fachmodul sein, sondern ein dauerhaft verwendbares Framework.

Dieses Framework bildet die technische Grundlage für aktuelle und zukünftige Anwendungen.

Nach Fertigstellung soll die Architektur grundsätzlich folgende Ebenen besitzen:

Core

User Interface

Administration

Themes

Module

optionale Serverdienste

15.2 Final Framework

Der fertiggestellte Core zusammen mit User Interface und Administration bildet das sogenannte Final Framework.

Dieses Final Framework soll unabhängig von einer konkreten Fachanwendung funktionieren.

Eine Fachanwendung wird anschließend als Modul bzw. als Kombination mehrerer Module integriert.

15.3 Neutralität

Der Core darf keine unnötige Abhängigkeit zu einer konkreten Anwendung enthalten.

Der Core ist unabhängig von spezifischen Fachanwendungen und stellt nur allgemeine Infrastruktur bereit.

15.4 Vollständiger technischer Funktionsumfang

Der Core soll alle technischen Fähigkeiten bereitstellen, die für zukünftige Module sinnvollerweise benötigt werden können.

Dazu gehören insbesondere:

* Lifecycle
* Routing
* Navigation
* UI-Shell
* Themes
* Module
* Extension Points
* Events
* Services
* Konfiguration
* Storage
* Medien
* Authentifizierung
* Autorisierung
* Rollen
* Berechtigungen
* Benachrichtigungen
* Logging
* Diagnose
* Fehlerbehandlung
* Updates
* Migrationen
* Synchronisation
* Serverkommunikation
* Sicherheitsmechanismen

Nicht jede Anwendung muss diese Funktionen aktivieren.

15.5 Keine unnötige Funktionalität laden

Eine kleine Anwendung soll nur die tatsächlich benötigten Module und Dienste verwenden.

Eine reine Offline-App soll beispielsweise nicht gezwungen sein, Server-, Push- oder Marketplace-Funktionen zu laden.

15.6 Erweiterbarkeit

Neue Funktionen sollen nach Möglichkeit als Module entwickelt werden.

Der Core soll dafür geeignete Schnittstellen und Extension Points bereitstellen.

Ein zukünftiges Modul soll nicht den Core verändern müssen, nur weil es eine neue fachliche Funktion besitzt.

15.7 Core-Änderungen

Es ist ausdrücklich nicht verboten, Core-Dateien zu ändern.

Wenn sich bei der Analyse herausstellt, dass eine Änderung notwendig ist, darf der Core entsprechend umgebaut oder neu strukturiert werden.

Vorhandene Backups sind zu berücksichtigen.

Entscheidend ist nicht, vorhandene Dateien um jeden Preis unverändert zu lassen.

Entscheidend ist ein technisch sauberer und zukunftsfähiger Core.

15.8 Keine künstliche Rücksicht auf den Ist-Zustand

Der aktuelle Zustand des Repositories ist keine unveränderbare Vorgabe.

Bestehender Code darf:

* umgebaut
* verschoben
* ersetzt
* zusammengeführt
* aufgeteilt
* entfernt

werden, wenn dies für die Zielarchitektur sinnvoll ist.

15.9 Bestehende Funktionalität

Bereits vorhandene sinnvolle Funktionen sollen erhalten und in die neue Architektur integriert werden.

Funktionen, die der neuen Architektur widersprechen, dürfen entsprechend angepasst oder ersetzt werden.

15.10 Daten und Inhalte

Bestehende Daten und Inhalte dürfen durch einen Architekturumbau nicht unnötig verloren gehen.

Wenn Datenmigrationen erforderlich sind, müssen diese entsprechend berücksichtigt werden.

15.11 Rückwärtskompatibilität

Rückwärtskompatibilität ist wünschenswert, aber kein Selbstzweck.

Wenn eine alte Struktur der neuen Zielarchitektur fundamental widerspricht, soll die technisch bessere Lösung bevorzugt werden.

15.12 Admin als Bestandteil des Frameworks

Der Admin-Bereich ist Bestandteil der gemeinsamen App.

Der Developer-Account kann innerhalb derselben Anwendung administrative Funktionen aufrufen.

Die normale Benutzeroberfläche wird dabei nicht zwingend parallel angezeigt.

15.13 Admin-Navigation

Beim Wechsel in den Admin-Bereich soll eine klare administrative Navigation erscheinen.

Ein Zurück-Element führt wieder in die normale Benutzeroberfläche.

Dieser Wechsel muss zuverlässig funktionieren.

15.14 Benutzerflüsse

Alle relevanten Benutzerflüsse müssen durchgängig funktionieren.

Insbesondere:

* Start
* Registrierung
* Login
* Logout
* Weiterleitung
* Navigation
* Modulwechsel
* Adminwechsel
* Zurück-Navigation
* Berechtigungsprüfung
* Fehlerbehandlung
* Offlinebetrieb
* Onlinebetrieb
* Synchronisation

15.15 Weiterleitungen

Weiterleitungen sind ein ausdrücklicher Bestandteil der Funktionsanforderungen.

Es reicht nicht, dass einzelne Seiten technisch vorhanden sind.

Die Übergänge zwischen ihnen müssen funktionieren.

Beispielsweise:

Login → korrektes Ziel

Logout → öffentlicher Bereich

Admin → Admin-Bereich

Admin zurück → User-Bereich

geschützte Route → Login → ursprüngliches Ziel

15.16 Berechtigungen

Sichtbare Menüpunkte und tatsächliche Zugriffsrechte müssen konsistent sein.

Das Ausblenden eines Buttons ersetzt keine technische Zugriffskontrolle.

15.17 Tests

Die Umsetzung muss durch geeignete Tests abgesichert werden.

Je nach vorhandener Projektstruktur sollen insbesondere berücksichtigt werden:

* Unit-Tests
* Integrations-Tests
* Routing-Tests
* Authentifizierungs-Tests
* Berechtigungstests
* Modul-Tests
* UI-Tests
* E2E-Tests

15.18 Kritische Tests

Besonders wichtig sind Tests für:

* App-Start
* Login
* Logout
* Registrierung
* Weiterleitungen
* Rollen
* Berechtigungen
* Adminzugriff
* Modulaktivierung
* Moduldeaktivierung
* Serververbindung
* Offlinebetrieb
* Synchronisation
* Medienupload
* Fehlerfälle

15.19 Build und Laufzeit

Das Projekt muss nach dem Umbau tatsächlich ausführbar sein.

Es genügt nicht, dass die Dateien logisch korrekt aussehen.

Zu prüfen sind insbesondere:

* Build
* Start
* Abhängigkeiten
* Routing
* Assets
* Module
* Konfiguration
* Datenzugriff
* Serverkommunikation

15.20 Keine Scheinimplementierungen

Funktionen dürfen nicht lediglich durch Platzhalter, leere Methoden oder scheinbar funktionierende UI dargestellt werden.

Wenn eine Funktion als implementiert gilt, muss sie technisch tatsächlich funktionieren oder eindeutig als nicht implementiert gekennzeichnet sein.

15.21 Keine unnötigen Workarounds

Die Zielarchitektur soll nicht durch immer neue Sonderlösungen umgangen werden.

Wenn ein strukturelles Problem erkannt wird, soll die Ursache behoben werden.

15.22 Codequalität

Der Code soll:

* nachvollziehbar
* wartbar
* modular
* testbar
* konsistent
* möglichst wenig redundant

sein.

15.23 Dokumentation

Die Architektur und wichtigen Schnittstellen sollen dokumentiert werden.

Insbesondere sollen nachvollziehbar sein:

* Core-Schnittstellen
* Modulstruktur
* Modulmanifest
* Lifecycle
* Routing
* Events
* Services
* Storage
* Serverkommunikation
* Konfiguration

15.24 Versionsverwaltung

Änderungen müssen nachvollziehbar bleiben.

Backups und Versionskontrolle sollen genutzt werden, bevor größere strukturelle Änderungen vorgenommen werden.

15.25 Arbeitsweise des ausführenden Agenten

Der ausführende Coding-Agent soll die vorhandenen Projektdateien, die bestehende Architektur und diese Vision vollständig analysieren.

Er soll anschließend selbstständig die technisch beste Umsetzung bestimmen.

Er soll nicht bei jedem einzelnen Architekturentscheid eine Freigabe einholen.

Wenn mehrere technisch sinnvolle Möglichkeiten bestehen, soll er diejenige wählen, die am besten zu dieser Vision, zur vorhandenen Plattform und zum langfristigen Wartungsziel passt.

15.26 Umgang mit unklaren Details

Nicht jede technische Einzelheit ist in dieser Vision vorgeschrieben.

Wo konkrete Implementierungsdetails fehlen, soll der Agent anhand von:

* bestehendem Code
* Plattform
* Framework
* Sicherheitsanforderungen
* Wartbarkeit
* Performance
* Zukunftssicherheit

eine sinnvolle Entscheidung treffen.

15.27 Keine falsche technische Sicherheit

Der Agent darf nicht behaupten, dass eine Lösung garantiert zukunftssicher oder fehlerfrei ist.

Er soll stattdessen technisch belastbare Entscheidungen treffen und diese durch Tests und Validierung absichern.

15.28 Arbeitsauftrag als Ganzes

Diese Vision beschreibt das gewünschte Zielsystem.

Die Umsetzung darf intern in beliebig viele technische Arbeitsschritte, Migrationen und Tests aufgeteilt werden.

„In einem Arbeitsgang“ bedeutet nicht, dass der Agent sämtliche Änderungen in einer einzigen Dateioperation durchführen muss.

Es bedeutet, dass der Agent den vollständigen Auftrag eigenständig bearbeiten und bis zu einem technisch validierten Ergebnis durchführen soll, ohne für normale Zwischenentscheidungen auf eine Benutzerfreigabe zu warten.

15.29 Priorität der Anforderungen

Bei Konflikten gilt folgende Priorisierung:

1. Sicherheit
2. Datenintegrität
3. funktionierende Core-Architektur
4. funktionierende Benutzer- und Admin-Flows
5. Modularität und Entkopplung
6. Wartbarkeit
7. Performance
8. Komfortfunktionen
9. optische Optimierung

15.30 Abweichungen

Wenn eine Anforderung technisch nicht sinnvoll oder mit der vorhandenen Plattform nicht umsetzbar ist, soll der Agent dies erkennen und die bestmögliche Alternative wählen.

Er soll keine technisch unsinnige Lösung nur deshalb implementieren, weil sie wörtlich in dieser Vision steht.

15.31 Abschlusskriterium

Das Projekt gilt erst dann als technisch fertig, wenn:

* der Core funktionsfähig ist,
* User Interface und Administration funktionieren,
* Routing und Weiterleitungen funktionieren,
* Module registriert und verwaltet werden können,
* Berechtigungen funktionieren,
* Offlinebetrieb funktioniert, soweit vorgesehen,
* Onlinefunktionen funktionieren, soweit aktiviert,
* relevante Tests erfolgreich sind,
* Build und Laufzeit funktionieren,
* keine bekannten kritischen Fehler bestehen.

15.32 Endgültiges Architekturziel

Das endgültige Ziel ist eine stabile Plattform, bei der die grundlegende Struktur einmal sauber aufgebaut wird.

Danach sollen neue fachliche Funktionen möglichst ausschließlich durch neue oder aktualisierte Module hinzugefügt werden.

Der Core soll dadurch möglichst selten verändert werden müssen.

15.33 Grundsatz

Die zentrale Architekturidee dieser Vision lautet:

Ein neutraler, vollständig ausgereifter Core bildet den Motor. User Interface und Administration bilden zusammen mit dem Core das Final Framework. Alles Fachliche wird darüber möglichst unabhängig als Modul aufgebaut.

15.34 Schlussdefinition

Das Framework soll nicht für eine einzige Anwendung optimiert werden.

Es soll eine allgemeine technische Grundlage darstellen, auf der unterschiedliche Anwendungen aufgebaut werden können.

Eine kleine Offline-Anwendung soll genauso möglich sein wie eine umfangreiche Online-Anwendung mit:

* Benutzerkonten
* Rollen
* Berechtigungen
* Administration
* Medien
* Synchronisation
* Server
* Benachrichtigungen
* externen Diensten
* beliebigen zusätzlichen Modulen.

Der Core stellt dafür die gemeinsame technische Grundlage bereit.

Die konkrete Fachlichkeit bleibt außerhalb des Core.

⸻


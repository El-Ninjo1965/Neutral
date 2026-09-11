# NEUTRAL – Vision

## Verbindliche Modularitätsentscheidung (2026-09-11)

Neutral Core enthält ausschließlich zwingende technische Mechanismen. Profile, Media/Upload, Sharing/Visibility, Notifications, Moderation, Postbox, Community und Fachfunktionen sind optionale Module. Ein fehlendes optionales Modul darf unabhängige Funktionen nicht blockieren; Zusatzfunktionen werden ausgeblendet oder fallen kontrolliert zurück. Aktive unsichtbare System-/Capability-Module ohne User-Navigation sind ausdrücklich Teil des Zielbilds. Field Notes ist der implementierte code-seitige Nachweis, dass ein neues Fachmodul ohne produktspezifische Core-Änderung entstehen kann; seine Betreiber-Liveabnahme und der Core Freeze stehen noch aus.

---

**Status:** LANGFRISTIGES ZIELBILD

**Geprüft:** 2026-09-09
**Einordnung:** Umfang und Abnahme der ersten stabilen Version stehen in [`CORE-1.0.md`](CORE-1.0.md). Der aktuelle Stand steht in [`STATUS.md`](STATUS.md). Der detaillierte Benutzer-/Lizenz-/Privacy-Vertrag steht in [`USER-ACCOUNT-LICENSE-MODEL.md`](USER-ACCOUNT-LICENSE-MODEL.md).

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

Die verbindliche Mindestplattform für Core 1.0 ist PHP 8.1+ mit MySQL/MariaDB und HTTPS auf normalem Shared Hosting. Node.js, permanente Worker, Redis und WebSockets dürfen später als leistungsfähigere Adapter ergänzt werden, sind aber keine Voraussetzung für die Grundfunktion. Ein Infrastrukturwechsel soll den öffentlichen App-/API-Vertrag nicht unnötig verändern.

Die erste Produktionsversion muss auf einfachem Shared Hosting lauffähig sein. Referenzumgebung:

- Linux
- cPanel
- LiteSpeed oder kompatibler Apache-Betrieb
- PHP 8.1+
- MariaDB oder MySQL
- HTTPS

Keine Produktionsvoraussetzung sind Node.js, npm, npx, Passenger, SSH, ein öffentlicher Port 3000 oder ein dauerhaft laufender Node-Prozess. Node-basierte Werkzeuge dürfen Entwicklung und Tests unterstützen, aber nicht zwingende Laufzeitbedingung der ersten Produktion sein.

Der Core wird nicht auf diesen Host fest verdrahtet. API-Basis, Datenbank, Dateipfade, Transport und Provider werden konfiguriert oder adaptiert. Ein späterer Wechsel von Shared Hosting zu leistungsfähigerem Hosting, einem anderen Server oder einer anderen Infrastruktur muss ohne fachlichen Umbau des Client-Core möglich bleiben.

## 9. Sicherheit und Datenschutz

Der Server ist für die endgültige Identitäts- und Berechtigungsentscheidung verantwortlich. Der Browserzustand allein erteilt keine Serverrechte. Produktion verwendet HTTPS, sichere Session-Cookies, CSRF-Schutz, validierte Eingaben, parametrisierte Datenbankzugriffe, minimale Rechte und nachvollziehbare Auditdaten.

Secrets bleiben außerhalb des Repositorys und außerhalb ausgelieferter Clientdateien. Lokal gespeicherte personenbezogene oder gerätebezogene Daten werden minimiert, zweckgebunden behandelt und mit Lösch-, Export- und Schutzkonzepten versehen. Logging darf keine Passwörter, Session-Geheimnisse oder unnötigen personenbezogenen Inhalte enthalten.

**Passwort-UX folgt dem Prinzip „einfach, aber kontrolliert“:** keine erzwungene Mischung aus Groß-/Kleinschreibung, Zahlen oder Sonderzeichen, keine Leerzeichen, klar begrenzte Länge, ausschließlich sichere serverseitige Hash-Speicherung und Rate-Limiting gegen automatisierte Loginversuche. Die konkrete verbindliche Passwortspanne und Validierungsregel steht im `USER-ACCOUNT-LICENSE-MODEL.md` und in `Security.md`, damit die Vision nicht mit Implementierungsdetails überladen wird.

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

## 12. Benutzeridentität, Profil und Privacy

NEUTRAL trennt künftig drei Ebenen strikt:

1. **Login-Identität** – technisch für Authentifizierung; Benutzername ist Pflicht und global eindeutig. E-Mail ist optional und darf, wenn vorhanden, zusätzlich als Login-Identifier dienen. Passwörter werden ausschließlich gehasht gespeichert.
2. **Privates/Vereinsprofil** – optionale Kontaktdaten wie E-Mail, Telefon, Adresse und Geburtstag. Jedes Feld ist standardmäßig privat und wird nur nach expliziter, widerrufbarer Freigabe an einen berechtigten Lizenz-/Organisationsverwalter sichtbar.
3. **Öffentliches Profil** – verwendet ausschließlich einen frei wählbaren öffentlichen Nickname/Handle und ausdrücklich freigegebene öffentliche Angaben. Reale Namen, E-Mail, Adresse und andere private Daten werden nicht automatisch veröffentlicht.

Das User-Settings-Konzept erhält einen eigenen Bereich `Profile`. Lokale, nur auf dem Gerät gespeicherte Profilinformationen bleiben privat und interessieren den Server nicht. Serverseitige Speicherung erfolgt nur für Funktionen, die eine zentrale Nutzung tatsächlich benötigen.

## 13. Rollen, Permissions, Pakete und Lizenzen

Rollen, Permissions und kommerzielle/organisatorische Pakete sind getrennte Konzepte:

- **Rolle:** administrative/sicherheitstechnische Identität, z. B. Admin oder User.
- **Permission:** einzelne technische Fähigkeit, die serverseitig geprüft wird.
- **Paket/Entitlement:** definiert, welche Module/Funktionen und Mengenlimits ein Kunde nutzen darf.
- **Lizenz/Organisation:** besitzt ein Paket und eine bestimmte Anzahl von Seats/Geräten/Nutzern.

Nicht freigeschaltete Module dürfen optional sichtbar bleiben, aber klar als gesperrt dargestellt werden und auf das benötigte Paket hinweisen. Die App enthält die Module bereits; Freischaltung geschieht über serverseitige Entitlements, nicht durch Nachinstallation aus einem Store.

Ein Lizenz-/Organisationsverwalter erhält **keine System-Adminrechte**. Er darf ausschließlich die eigenen Seats, Nutzer und Geräte innerhalb seiner Lizenz verwalten. Beispiel: Ein Angelverein mit 50 Lizenzen kann selbst Mitglieder anlegen, Geräte freigeben und ausgeschiedene Mitglieder entfernen, ohne den Systemadministrator zu benötigen.

## 14. Geräte- und Installationsmodell

Geräteidentität basiert auf einer zufälligen, persistenten Installations-ID und niemals auf Betriebssystemnamen, User-Agent oder Hardwarefingerprints. Plattform-/Browserangaben sind reine Anzeigeinformationen.

Paket/Lizenz kann ein maximales Geräte-/Seat-Limit definieren. Admin-/Developer-Sonderrollen können unbegrenzt sein. User Management zeigt mindestens:

- erlaubte Geräte/Seats,
- verwendete Geräte/Seats,
- letzte Aktivität,
- Drill-down zu den registrierten Installationen,
- Freigeben/Widerrufen innerhalb des jeweiligen Administrationsscopes.

## 15. Anonyme Nutzung und Installationsstatistik

Viewer ohne Login bleiben Offline-First. NEUTRAL soll keine versteckten Onlinezwänge einführen. Eine anonyme Installation darf erst gezählt werden, wenn sie tatsächlich freiwillig/technisch notwendig den Server kontaktiert.

Datensparsame Kennzahlen können sein:

- bekannte Installationen gesamt,
- aktive Installationen heute / 7 / 30 Tage,
- angemeldete Installationen,
- anonyme Viewer-Installationen.

Diese Statistik ist keine Personenverfolgung. Keine Hardwarefingerprints, keine Standortdaten und keine unnötigen personenbezogenen Daten für Analytics.

## 16. Medien, Moderation und Freigabe

Serverseitig veröffentlichte Nutzerbilder und späterer Community-/Marketplace-Content durchlaufen einen generischen Moderationsstatus: `pending → approved/rejected/deleted`.

- Bilder sollen clientseitig vor Upload soweit sinnvoll optimiert und serverseitig zusätzlich validiert/normalisiert werden.
- Ein Upload wird nicht automatisch öffentlich.
- Admin/Moderator kann freigeben, ablehnen oder löschen.
- Ablehnung besitzt standardisierte Gründe plus optionale Notiz für den Nutzer.
- System führt nachvollziehbare Moderationshistorie und Zähler für abgelehnte Inhalte/Verwarnungen.
- Wiederholter Missbrauch kann zur Accountsperre führen.

Viewer ohne Login erhalten keine serverseitige Uploadfunktion. Ein Paket kann Uploadrechte zusätzlich einschränken. Ein lokal ausgewähltes Bild ohne Serverupload bleibt private Endgerätedaten.

## 17. Messaging / Inbox als generische Zukunftsfähigkeit

Eine spätere Inbox/Community-Kommunikation soll als generische Plattformfähigkeit entstehen, nicht als CatchTrack-Sondercode. Grundvertrag:

- private Nachrichten standardmäßig Text,
- serverseitige Längen- und Rate-Limits gegen Spam,
- Nutzer können andere Nutzer blockieren/melden,
- Admin/Organisation darf Moderations- und Rundnachrichten senden,
- Anhänge/Bilder nur bei expliziter Paket-/Permissionfreigabe und unter denselben Moderationsregeln wie andere Medien.

Marketplace, Ranglisten, Vereinsfunktionen oder andere Fachmodule verwenden diesen Vertrag, implementieren aber ihre Fachlogik selbst.

## 18. Zukunftsmodule bleiben Module

Ein Marketplace, CatchTrack-spezifische Fangbilder, Ranglisten, GPS Pro und Vereinsfachfunktionen sind **keine Core-Fachlogik**. Sie werden später als Module entwickelt und nutzen lediglich die generischen Coreverträge für Identität, Entitlements, Geräte, Privacy, Messaging, Medien und Moderation.
## Minimal Core rule

Core provides reusable technical mechanisms only. Profile, Media, Sharing, Moderation, Notifications, Postbox and Community are optional modules; an app and unrelated modules must run without them. Active modules may be system-only and absent from User navigation. Hard module dependencies are exceptional; optional enhancements use capability detection.

Profile is an optional invisible module, not a prerequisite for identity, login, licensing, or other application modules.

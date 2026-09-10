# NEUTRAL – Roadmap nach Core 1.0

**Status:** ZUKUNFTSPLANUNG  
**Geprüft:** 2026-09-11

Diese Datei enthält keine Abnahmepflichten für [`CORE-1.0.md`](CORE-1.0.md).

## Unmittelbar nach Final Freeze: geführte Setup-/Installationsroutine

Nach dem Final Freeze ist der nächste priorisierte Schritt eine weitgehend automatische Setup-Routine für neue Installationen und Serverwechsel.

### Zielbild

Der Betreiber soll das verifizierte Neutral-Paket auf den Zielserver übertragen, anschließend eine einmalige Setup-Seite öffnen und nur Daten eingeben müssen, die Neutral nicht zuverlässig selbst erkennen oder sicher selbst erzeugen kann.

Leitprinzip:

> Dateien bereitstellen → Setup öffnen → Umgebung automatisch erkennen → nur unvermeidbare Daten eingeben → prüfen → installieren → Setup automatisch sperren.

Die Routine soll insbesondere vermeiden, dass bei einer neuen App oder einem Serverwechsel technische Pfade, URLs, PHP-Eigenschaften oder andere ableitbare Werte manuell gesucht und erneut zusammengesetzt werden müssen.

### Automatisch erkennen / ableiten

Soweit auf dem jeweiligen Hosting zuverlässig und sicher möglich:

- PHP-Version und benötigte Extensions;
- HTTPS-/Request-Kontext;
- Installationsroot / physischer Projektpfad;
- öffentliche Basis-URL und möglicher Base-Path;
- Server-/Runtime-/Storage-Pfade relativ zum Installationsroot;
- notwendige Schreibrechte und Verzeichnisverfügbarkeit;
- Rewrite-/Routing-Fähigkeit durch kontrollierte Prüfung;
- vorhandene bzw. entdeckbare Module und Systemmodule;
- Datenbanktreiber/-Erweiterung;
- bestehender Installations-/Migrationsstatus;
- weitere technisch eindeutig ableitbare Umgebungswerte.

Ableitbare Werte sollen nicht unnötig als manuelle Pflichtfelder erscheinen. Wo automatische Erkennung nicht eindeutig ist, zeigt das Setup den erkannten Vorschlag und lässt ihn kontrolliert bestätigen oder korrigieren.

### Manuelle Eingaben

Nur Werte, die nicht zuverlässig automatisch erkannt oder aus Sicherheitsgründen nicht erraten werden dürfen, insbesondere:

- Datenbankname;
- Datenbankbenutzer;
- Datenbankpasswort;
- DB-Host/Port nur wenn nicht zuverlässig ableitbar bzw. Default nicht zutrifft;
- erster Administrator / Betreiberaccount und Passwort;
- gewünschter App-Anzeigename bzw. installationsspezifische Identität;
- externe Provider-Zugangsdaten nur für tatsächlich aktivierte Provider;
- sonstige echte Secrets, die nicht automatisch erzeugt werden sollen/können.

Generierbare interne Secrets sollen bevorzugt kryptografisch sicher durch Neutral erzeugt werden. Sie dürfen nicht im Browser, Log oder Repository offengelegt werden.

### Setup-Ablauf

1. Setup-Seite nur bei noch nicht abgeschlossener Installation bzw. explizit autorisiertem Recoverymodus erreichbar machen.
2. Umgebung automatisch analysieren.
3. Verständlichen Environment Check anzeigen (`OK`, Warnung, Fehler) statt Rohdiagnostik/Serverinternas offenzulegen.
4. Nur notwendige manuelle Eingaben anfordern.
5. Vor Installation Datenbankverbindung, Rechte, Pfade, Rewrite/Routing und Mindestvoraussetzungen prüfen.
6. Sichere hostlokale Konfiguration erzeugen bzw. kontrolliert schreiben, ohne Secrets öffentlich zugänglich zu machen.
7. Datenbankschema und Migrationen ausführen.
8. Core initialisieren, installierte Module registrieren und den ersten Administrator anlegen.
9. Installation end-to-end prüfen.
10. Setup nach Erfolg automatisch sperren; erneuter Zugriff nur über den bestehenden ausdrücklich autorisierten Recoveryvertrag.

Fehler müssen vor destruktiven Folgeschritten möglichst früh erkannt werden. Ein fehlgeschlagenes Setup darf keine fälschlich erfolgreiche oder halb aktivierte Installation behaupten.

### Portabilität / Serverwechsel

- Absolute hostabhängige Pfade nicht dauerhaft speichern, wenn sie zur Laufzeit sicher aus dem Installationsroot abgeleitet werden können.
- Interne Pfade bevorzugt relativ zum Installationsroot auflösen.
- Ein Wechsel z. B. von `/home/alt/...` nach `/home/neu/...` soll keine manuelle Suche/Änderung aller internen Pfade erfordern.
- Physischer Installationspfad und öffentlicher Base-Path bleiben getrennte Konzepte.
- Hostabhängige Werte müssen beim Setup/Recovery erneut erkennbar oder kontrolliert überschreibbar sein.
- Daten-/Backup-Restore und neue Installation sind getrennte Vorgänge; die Setup-Routine darf keinen ungefragten Production-Restore durchführen.

### UX-/Sicherheitsanforderungen

- mobile/touchfreundliche Setup-Oberfläche;
- keine unnötigen technischen Eingaben;
- keine Secrets in URL, HTML-Quelltext, Logs oder Diagnoseantworten;
- Passwortfelder mit dem zentralen Show/Hide-Vertrag;
- klare Prüfung vor finalem Installationsschritt;
- Setup nach erfolgreicher Installation standardmäßig nicht mehr öffentlich erreichbar;
- bestehender Recoverymechanismus bleibt die kontrollierte Ausnahme.

### Dokumentationsziel

Bei Umsetzung müssen mindestens `Install-README-Server.md`, `Install-README-Web-App.md`, `Architecture.md`, `Security.md`, `API.md`, `Database.md`, `Functions.md`, `STATUS.md` und die Setup-/Recovery-Dokumentation mit dem tatsächlich implementierten Verhalten synchronisiert werden.

## Phase 2: Installierbare Web-App

- PWA-Manifest, Service Worker und kontrollierte Cacheupdates
- Offline-Synchronisation mit Konfliktbehandlung
- Push-Benachrichtigungen, soweit Hosting und Plattform dies erlauben
- reale Geräte- und Browsermatrix

## Phase 3: Store-Apps

- gemeinsame Web-Codebasis in einer gepflegten nativen Hülle
- Android- und iOS-Builds
- native Adapter für Gerätefunktionen
- Store-Signierung, Datenschutzangaben und Releaseprozess
- Produktmodule werden mit Store-Releases ausgeliefert; Rechte, Limits, Daten und Providerkonfiguration bleiben servergesteuert

## Phase 4: Professionelle Serveradapter

- optionale Node.js-Implementierung hinter demselben API-Vertrag
- Queue-Worker, Redis und geplante Jobs
- WebSockets/Echtzeit, wenn ein Produkt sie benötigt
- horizontal skalierbare Storage- und Datenbankadapter
- Observability, zentrale Metriken und Alarmierung

## Kompatibilitätsregel

Professionellere Infrastruktur ersetzt Adapter, nicht die Produktverträge. Client und Module dürfen nicht unnötig von PHP, Node, cPanel oder einem bestimmten Drittanbieter abhängen.

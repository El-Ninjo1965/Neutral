# NEUTRAL – Roadmap nach Core 1.0

**Status:** ZUKUNFTSPLANUNG  
**Geprüft:** 2026-09-13

Diese Datei enthält ausschließlich bewusst auf später verschobene Ziele. Aktuelle Fehler, Tasks und Core-Freeze-Gates stehen in `STATUS.md`, `TODO.md` und `CHATGPT.md`.

## 1. Geführte Setup-/Installationsroutine

Nach dem Core-Freeze soll eine weitgehend automatische Setup-Routine neue Installationen und Serverwechsel vereinfachen.

Leitprinzip:

> Paket bereitstellen → Setup öffnen → Umgebung erkennen → nur unvermeidbare Daten eingeben → prüfen → installieren → Setup sperren.

Automatisch erkennen oder ableiten, soweit zuverlässig möglich:

- PHP-Version und benötigte Extensions;
- HTTPS-/Request-Kontext;
- Installationsroot und öffentlicher Base-Path;
- Storage-/Runtimepfade;
- Schreibrechte;
- Rewrite-/Routing-Fähigkeit;
- vorhandene Module;
- Datenbanktreiber;
- Installations-/Migrationsstatus.

Manuell nur nicht sicher ableitbare oder geheime Werte anfordern, insbesondere Datenbankzugang, erster Administrator, App-Identität und tatsächlich benötigte externe Provider-Secrets.

Setup muss Voraussetzungen vor destruktiven Schritten prüfen, sichere hostlokale Konfiguration erzeugen, Migrationen ausführen, den ersten Administrator anlegen, die Installation prüfen und sich danach standardmäßig sperren. Recovery bleibt ein separat autorisierter Pfad.

## 2. Referral / Rewards

Optionales generisches Systemmodul für Empfehlungen und Belohnungen:

- Referral-Code/-Link pro werbendem User;
- Pay-Referral erst nach serverseitig bestätigtem Zahlungseingang belohnen;
- Free-Referral erst nach konfigurierbaren Aktivitätskriterien qualifizieren;
- Punkte und administrativ definierter Reward-Katalog;
- Premium-Zeit als möglicher Reward;
- konfigurierbare Schwellen, Limits und Cooldowns;
- Audit, Idempotenz und Missbrauchsschutz;
- keine CatchTrack-spezifische Fachlogik;
- keine Pflichtabhängigkeit zu Profile, Postbox oder Notifications.

## 3. Installierbare Web-App / PWA

- PWA-Manifest und kontrollierter Service Worker;
- Offline-Synchronisation mit Konfliktbehandlung;
- Push-Benachrichtigungen, soweit Plattform und Hosting dies erlauben;
- reale Geräte- und Browsermatrix.

## 4. Store-Apps

- gemeinsame Web-Codebasis in einer gepflegten nativen Hülle;
- Android- und iOS-Builds;
- native Adapter für Gerätefunktionen;
- Store-Signierung, Datenschutzangaben und Releaseprozess;
- Produktmodule werden mit Releases ausgeliefert; Rechte, Limits, Daten und Providerkonfiguration bleiben servergesteuert.

## 5. Professionelle Serveradapter

Später optional:

- Node.js-Implementierung hinter demselben API-Vertrag;
- Queue-Worker und Redis;
- WebSockets/Echtzeit, wenn ein Produkt sie benötigt;
- horizontal skalierbare Storage-/Datenbankadapter;
- Observability, zentrale Metriken und Alarmierung.

## Kompatibilitätsregel

Leistungsfähigere Infrastruktur ersetzt Adapter, nicht Produktverträge. Client und Module dürfen nicht unnötig von PHP, Node, cPanel oder einem bestimmten Drittanbieter abhängen.
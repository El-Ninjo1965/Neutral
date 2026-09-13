# NEUTRAL – Roadmap nach Core 1.0

**Status:** ZUKUNFTSPLANUNG  
**Geprüft:** 2026-09-13

Diese Datei enthält ausschließlich bewusst auf später verschobene Ziele. Aktuelle Fehler, Tasks und Core-Freeze-Gates stehen in `STATUS.md`, `TODO.md` und `CHATGPT.md`.

## 1. Ausbau der Setup-/Installationsroutine

Eine funktionierende Setup-Grundlage ist bereits vorhanden, einschließlich Prerequisite-Prüfung, Setup-API, Migrationen, Bootstrap-Admin und Sperr-/Recovery-Mechanismen. Nach dem Core-Freeze soll diese bestehende Grundlage weiter automatisiert und für neue Installationen und Serverwechsel vereinfacht werden.

Leitprinzip:

> Paket bereitstellen → Setup öffnen → Umgebung erkennen → nur unvermeidbare Daten eingeben → prüfen → installieren → Setup sperren.

Weiter auszubauen sind insbesondere automatische Erkennung oder Ableitung von:

- PHP-Version und benötigten Extensions;
- HTTPS-/Request-Kontext;
- Installationsroot und öffentlichem Base-Path;
- Storage-/Runtimepfaden;
- Schreibrechten;
- Rewrite-/Routing-Fähigkeit;
- vorhandenen Modulen;
- Datenbanktreiber;
- Installations-/Migrationsstatus.

Manuell sollen nur nicht sicher ableitbare oder geheime Werte erforderlich bleiben, insbesondere Datenbankzugang, erster Administrator, App-Identität und tatsächlich benötigte externe Provider-Secrets.

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

Eine kontrollierte Service-Worker-/Offline-Grundlage ist bereits vorhanden und getestet. Noch offen sind die vollständige PWA-Produktisierung und reale Geräteabnahme, insbesondere:

- vollständiges PWA-Manifest und Installierbarkeit;
- Offline-Synchronisation mit Konfliktbehandlung;
- Push-Benachrichtigungen, soweit Plattform und Hosting dies erlauben;
- reale Geräte- und Browsermatrix;
- Installations-, Update- und Recovery-Verhalten als Produkt-App.

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
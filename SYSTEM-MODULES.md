# Neutral – optionale Systemmodule

**Status:** VERBINDLICHER ZIELVERTRAG  
**Geprüft:** 2026-09-13

## Gemeinsame Grenze

Neutral Core enthält nur generische technische Mechanismen. Optionale Module dürfen deaktiviert oder nicht installiert sein, ohne Core oder unabhängige Module funktionsunfähig zu machen. Eine tatsächlich systemnotwendige Fähigkeit muss ausdrücklich als Core-/Required-Funktion modelliert werden und darf nicht als scheinbar optionales Modul auftreten.

Permissions autorisieren Aktionen. Visibility/Navigation steuert getrennt, ob ein Einstieg sichtbar ist, und erteilt niemals Serverrechte.

## Eine gemeinsame Modularchitektur

Die Admin-Oberfläche unterscheidet **App Modules** und **System Modules** ausschließlich zur Klassifikation und Darstellung. Beide verwenden denselben:

- Manifestvertrag
- Registry-/Discovery-Pfad
- Install-/Register-Lifecycle
- Activate-/Deactivate-Lifecycle
- Permission-Vertrag
- API-/Service-/Event-Vertrag
- Update-/Uninstall-Vertrag

Die Manifestklassifikation lautet `category: user|system`; der kompatible Default ist `user`. Daraus entsteht keine zweite Runtime und keine automatische User-Sichtbarkeit.

Beispiele für App Modules: `gps`, `profile`, `postbox`, `field-notes`.  
Beispiele für System Modules: `media`, `sharing`, `notifications`, `moderation`; später `referral`/`referral-rewards`.

## Optionale Module

### Profile

Profile ist optional und keine Voraussetzung für Login, Identität, Lizenzierung oder unabhängige Module. Zielumfang: Displayname, Gender (`male`, `female`, `unspecified`), Geburtstag, Avatar sowie profilbezogene Privacy-/Organization-Sharing-Einstellungen. Daten sollen bei Deaktivierung erhalten bleiben.

Avatar-Zielvertrag: User wählt ein Bild und schneidet es quadratisch zu; gespeichert wird nur eine optimierte Version bis 256×256 px. Das Original wird nicht dauerhaft gespeichert. Darstellung rund, Replace/Delete möglich, lokal cachebar und in Backup/Restore berücksichtigt. Ohne eigenes Bild wird ein neutraler dynamischer Default nach Gender verwendet.

### Media / Upload

Generischer sicherer Medienvertrag: MIME-/Typprüfung, Größenlimits, sichere IDs und Ziele, Bildoptimierung, Metadaten, Replace/Delete, Cache und Backup/Restore sowie Schutz vor Traversal, Symlinks und ausführbaren Uploads. Fachmodule definieren Nutzung und fachliche Limits.

### Sharing / Visibility

Generischer serverautorisierter Freigabevertrag mit Default `private`. Fachmodule registrieren ihre Ressourcen und bestimmen fachliche Reduktionen, beispielsweise ungefähre statt exakter Position. Sharing darf Permissions nicht ersetzen.

### Notifications

Optionale In-App- und E-Mail-Kanäle mit konfigurierbaren Präferenzen. Notifications darf keine Pflichtabhängigkeit für unabhängige Module erzeugen.

### Moderation / Content Review

Generische Review-Queue für Texte/Bilder mit mindestens `pending`, `approved`, `rejected`; Review/Edit/Delete und Filter nach User, Modul, Datum, Typ und Status. Notifications/Postbox dürfen optional genutzt werden, sind aber keine Voraussetzung.

### Postbox

Generisches rollenbasiertes Postfach mit Inbox/Sent, read/unread, compose/reply sowie adressierbaren Usern, Gruppen/Rollen und eigener Organisation. Broadcast benötigt eine separate Permission und Audit. Organization-Manager bleiben auf die eigene Organisation begrenzt. Anhänge dürfen optional Media nutzen, ohne eine harte Modulabhängigkeit zu erzeugen.

## Abhängigkeiten

Optionale Module besitzen grundsätzlich keine Pflichtabhängigkeit untereinander. Erweiterungen verwenden Capability Detection und kontrollierte Fallbacks. Fehlt ein Enhancement, bleibt die unabhängige Hauptfunktion nutzbar.

`field-notes` dient als Referenz für ein unabhängiges Fachmodul ohne produktspezifische Core-Sonderintegration.

## Referral / Rewards

`referral` bzw. `referral-rewards` bleibt ein späteres optionales Systemmodul und blockiert den Core Freeze nicht.

Verbindliche Zielregeln:

- Pay-Referral: Reward erst nach serverseitig bestätigtem Zahlungseingang; keine zusätzliche Aktivitätsprüfung.
- Free-Referral: Registrierung allein genügt nicht; Punkte erst nach administrativ konfigurierbaren qualifizierenden Aktivitäten.
- Fachmodule liefern nur standardisierte Qualifying Events/Counts; Referral kennt keine CatchTrack-Fachbegriffe.
- Punkte können gegen administrativ definierte Rewards bzw. Premium-Zeit eingelöst werden.
- Bei Pay-Usern wird verdiente Zeit angehängt; bei Free-Usern nach konfigurierbarer Regel aktiviert.
- Punktwerte, Schwellen, Reward-Katalog, Umtauschraten, Limits und Cooldowns sind administrierbar.
- Rewardvergabe ist serverseitig verifiziert, idempotent und auditiert; Selbstwerbung/Duplikate und spätere Refund-/Chargeback-Fälle benötigen klare Regeln.
- Profile, Community, Postbox und Notifications bleiben optionale Enhancements, keine Pflichtabhängigkeiten.

Aktueller Implementierungs- und Live-Stand gehört ausschließlich in `STATUS.md` und `CHATGPT.md`, nicht in diesen Zielvertrag.
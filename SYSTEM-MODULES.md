# NEUTRAL – APP MODULES UND SYSTEM MODULES

**Status:** VERBINDLICHER KLASSIFIKATIONS- UND ABHÄNGIGKEITSVERTRAG  
**Geprüft:** 2026-09-13

## 1. Eine Modularchitektur

`App Modules` und `System Modules` sind administrative Kategorien derselben Modulplattform. Es gibt keine zweite Registry, keinen zweiten Loader und keinen getrennten Lifecycle.

Beide Kategorien verwenden denselben Manifest-, Discovery-, Registry-, Install-, Activate-, Deactivate-, Update- und Uninstall-Vertrag.

Die Manifest-Klassifikation ist `category: user|system`; fehlende ältere Angaben werden backward-kompatibel als `user` behandelt.

## 2. Bedeutung der Kategorien

**App Module:** typischerweise direkt benutzbare Funktion mit möglichem Navigationseintrag, z. B. GPS oder Profile.

**System Module:** technische oder querschnittliche Fähigkeit, die ohne eigenen Navigationseintrag aktiv sein kann, z. B. Media, Sharing oder Notifications.

Die Kategorie entscheidet nicht über Berechtigungen und nicht automatisch über Sichtbarkeit. Ein System Module darf User-UI anbieten; ein App Module darf für bestimmte Kontexte unsichtbar sein.

## 3. Unabhängigkeit

Alle hier beschriebenen Module sind optional, sofern sie nicht ausdrücklich als Core-/Required-Funktion modelliert werden.

Daraus folgt:
- Deaktivieren eines optionalen Moduls darf Core nicht beschädigen.
- Unabhängige Module müssen weiter funktionieren.
- Neue Module sollen standardmäßig keine harte Modulabhängigkeit erhalten.
- Erweiterungen durch andere Module werden bevorzugt über `optionalDependencies` plus kontrollierten Fallback modelliert.
- Eine harte Dependency ist ein Ausnahmefall und muss vor Einführung architektonisch geprüft werden.

Wichtig: Die aktuelle Runtime kann deklarierte Dependencies validieren. Das allein garantiert jedoch keinen vollständigen Schutz davor, eine bereits benötigte Dependency später zu deaktivieren. Deshalb dürfen harte Abhängigkeiten nicht beiläufig eingeführt werden.

Der vollständige operative Vertrag steht in `ModuleCreation.md`.

## 4. Permissions und Visibility

Permissions autorisieren geschützte Aktionen. Visibility/Navigation entscheidet separat über sichtbare Einstiege und darf niemals zusätzliche Serverrechte verleihen.

`publicOffline` ist ein eigener Modulvertrag für öffentliche/offline nutzbare Basisfunktion. Ein lokal verfügbarer Public/Offline-Zustand erteilt keine Serverrechte.

GPS ist derzeit das Referenzmodul für diesen öffentlichen Offline-First-Vertrag.

## 5. Aktuelle Modulklassifikation

| Modul | Kategorie | Einordnung |
|---|---|---|
| `gps` | App Module | öffentliches `publicOffline`-Referenzmodul |
| `profile` | App Module | Account-/Profilfunktion; geschützte Aktionen bleiben autorisiert |
| `postbox` | App Module | optionale Nachrichtenfunktion |
| `field-notes` | App Module | unabhängiges Referenz-/Fachmodul |
| `media` | System Module | optionale Medienfähigkeit |
| `sharing` | System Module | optionale Sharing-/Visibility-Erweiterung |
| `notifications` | System Module | optionale Benachrichtigungsfähigkeit |
| `moderation` | System Module | optionale Moderationsfähigkeit |
| `referral` / `referral-rewards` | System Module, geplant | optionale Referral-/Reward-Fähigkeit |

Diese Tabelle ist Klassifikation, kein Beweis für vollständige fachliche Implementierung oder Live-Abnahme eines Moduls.

## 6. Fachliche Zielverträge

### Profile

Optionales Account-Modul für Profilangaben und spätere Avatar-/Privacy-Funktionen. Profile ist keine allgemeine Voraussetzung für andere Apps oder Module und kein kommerzielles Pflicht-Package.

### Media

Optionale generische Medienfähigkeit für sichere Upload-/Dateifunktionen. Fachmodule müssen ohne Media kontrolliert weiterarbeiten, sofern ihre Kernfunktion keinen zwingenden Medieninhalt voraussetzt.

### Sharing

Optionale generische Visibility-/Sharing-Erweiterung. Default für neue private Ressourcen bleibt restriktiv; Fachmodule registrieren ihre Ressourcen über veröffentlichte Verträge statt Core-Sondercode.

### Notifications

Optionale In-App-/E-Mail-Benachrichtigungsfähigkeit. Fehlt das Modul, darf dies die Kernaktion eines unabhängigen Moduls nicht blockieren.

### Moderation

Optionale Moderationsfähigkeit für Inhalte. Aktivierung und konkrete Nutzung richten sich nach dem jeweiligen Produkt-/Permission-Vertrag.

### Postbox

Optionale Nachrichtenfunktion. Media und Notifications dürfen Erweiterungen liefern, sind aber keine stillschweigenden Pflichtabhängigkeiten.

### Referral / Referral Rewards

Geplantes optionales System Module. Keine Pflichtabhängigkeit zu Profile, Community, Postbox oder Notifications. Spätere Rewardvergabe muss serverseitig nachvollziehbar und idempotent sein.

## 7. Modulbau und Prüfung

Bei Erstellung oder Reparatur eines Moduls immer `ModuleCreation.md` verwenden. Besonders zu prüfen:

1. Manifest und Kategorie;
2. keine unbeabsichtigte harte Dependency;
3. Activate/Deactivate/Re-enable;
4. Verhalten bei fehlenden optionalen Erweiterungen;
5. Navigation und Visibility getrennt von Autorisierung;
6. keine produktspezifischen Core-Änderungen ohne universelle Core-Begründung.

Historische Livefehler einzelner Module gehören in `STATUS.md`, `CHATGPT.md` oder Git-History und nicht dauerhaft in diesen Architekturvertrag.

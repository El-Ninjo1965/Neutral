# NEUTRAL – Verbindlicher Modulvertrag

**Status:** AKTUELL / VERBINDLICH  
**Geprüft:** 2026-09-13

Dieses Dokument definiert den dauerhaften Modulvertrag. Aktueller Implementierungs- und Live-Stand steht in `STATUS.md` und `CHATGPT.md`.

## Architekturgrundsatz

Ein normales App- oder Systemmodul ist ein eigenständiges optionales Feature.

- Der Core muss ohne optionale Module funktionieren.
- Deaktivierung eines optionalen Moduls darf Core und unabhängige Module nicht beschädigen.
- Ein Modul besitzt seine Fachlogik, Dateien, Einstellungen und Daten selbst.
- Ein Modul ändert keine Coredatei nur zu seiner eigenen Integration.
- Profile, Media, Moderation, Notifications, Sharing, Postbox und GPS sind keine impliziten Voraussetzungen für andere normale Module.

Eine tatsächlich systemnotwendige Fähigkeit muss ausdrücklich als Core-/Required-Funktion modelliert werden und darf nicht als frei deaktivierbares optionales Modul erscheinen.

## Dependencies

Für neue normale Module gilt grundsätzlich `dependencies: []`. Nicht zwingende Erweiterungen gehören in `optionalDependencies` und benötigen Capability Detection sowie kontrollierte Fallbacks.

Eine harte Modulabhängigkeit benötigt vor Verwendung eine Architekturprüfung und einen generisch abgesicherten Lifecycle für Deaktivierung und Uninstall.

## Eine Runtime, zwei Kategorien

`category: user|system` ist Klassifikation und Präsentation, keine zweite Runtime. App Modules und System Modules verwenden dieselbe Registry, Discovery und denselben Lifecycle. Kategorie entscheidet nicht automatisch über User-Sichtbarkeit.

## Manifestvertrag

Der gemeinsame Manifestvertrag umfasst je nach Modul unter anderem:

- `id`, `appId`, `name`, `version`, `apiVersion`, `type`, `description`;
- `dependencies`, `optionalDependencies`;
- `permissions`, `permissionDefinitions`, `capabilities`;
- `presentation.userNavigation`, `presentation.adminNavigation`, `presentation.system`;
- `category`;
- `source`, `entry`, `main`, `globalName`;
- `modulePath`, `mountPath`, `manifestPath`, `autoload`;
- `lifecycle`, `requirements`;
- `access.visibilityPermissions`, `usagePermissions`, `managementPermissions`, `adminPermissions`;
- `clientAccess`, `publicOffline`, `standalone`;
- `database.tables` und `admin`.

Vor Verwendung eines Feldes ist der aktuelle Consumer im Runtime-Code zu prüfen; Dokumentation allein ist kein Implementierungsbeweis.

## Typische Struktur

```text
Web-App/app/modules/<module-id>/
├── module.json
├── index.js
└── index.html        # optionaler Standalone-/Self-Test
```

Optionale Serverfähigkeit:

```text
Server/php/modules/<module-id>/module.php
```

`reference-notes` ist eine interne Framework-/Testfixture für Modulverträge. Es ist kein Produktmodul und wird beim Erzeugen einer Produkt-App durch `create-neutral-app` entfernt. `field-notes` bleibt davon getrennt und dient als unabhängiges Fachmodul-Referenzbeispiel.

## Lifecycle

Grundmodell:

`DISCOVERED/AVAILABLE → INSTALLED/INACTIVE → ENABLED/ACTIVE → DISABLED/INACTIVE → ENABLED/ACTIVE → UNINSTALL`

Discovery aktiviert kein normales Modul. Lifecycle-Aufrufe müssen wiederholbar sein. Bei Deaktivierung beendet das Modul eigene Listener, Timer und Ressourcen. Re-enable darf unabhängigen Zustand nicht beschädigen.

## Discovery

Discovery normalisiert Manifeste, reconciliiert Registry und Runtimezustand und darf keine fachliche Kopplung zwischen Modulen erzeugen. Nur der aktuell gültige Discovery-Lauf darf den Registry-Zustand bestimmen.

## Public/Offline

`publicOffline: true` erlaubt, bereinigte Client-Metadaten eines administrativ aktiven Moduls aus einer versionierten lokalen Projektion bereits vor dem späteren Online-Abgleich zu verwenden.

Lokale Sichtbarkeit erteilt keine Serverrechte. Online-Abgleich reconciliiert den Lifecycle; ein Netzwerkfehler darf nicht als autoritativer leerer Katalog behandelt werden. Es gibt keine modulspezifische Sonderruntime für diesen Vertrag.

## Standalone

`standalone` ist optional und nur ein isolierter Self-Test. Es ersetzt weder Integration noch Lifecycle. Voraussetzungen wie Server, Datenbank oder Auth werden deklarativ beschrieben.

Integriert übernimmt ein Modul zentrale Framework-Theme-/Appearance-Verträge. Eigenes Fachlayout ist erlaubt, eine unabhängige globale Designwelt nicht.

## Access und Sichtbarkeit

Sichtbarkeit, Nutzung, Verwaltung und Administration sind getrennte Entscheidungen:

- `access.visibilityPermissions` – Sichtbarkeit;
- `access.usagePermissions` – Nutzung;
- `access.managementPermissions` – Verwaltung;
- `access.adminPermissions` – Administration;
- `presentation.userNavigation` – User-Navigation;
- `presentation.adminNavigation` – Admin-Navigation.

UI-Sichtbarkeit erteilt niemals Serverrechte.

## Settings und Daten

Modulsettings liegen im eigenen Namespace, grundsätzlich `moduleSettings.<module-id>`. Installation/Aktivierung ist davon getrennt.

Ein Modul mit eigenen Daten deklariert und besitzt diese selbst. Direkter Zugriff auf interne Daten eines anderen optionalen Moduls ist keine zulässige Kopplung.

## Verbotene Integrationsmuster

Nicht zulässig sind insbesondere:

- Core-Dateien nur für ein einzelnes Fachmodul ändern;
- fremde Moduldateien verändern;
- private Zustände anderer Module als Vertrag verwenden;
- Profile oder Login pauschal als Voraussetzung annehmen;
- deaktivierte Module im Corepfad weiter voraussetzen;
- Laufzeitverhalten ausschließlich durch Quelltextmuster statt echte Tests beweisen.

## Pflichtprüfung für optionale Module

Ein optionales Modul muss mindestens beweisen:

1. App startet mit Modul aktiv.
2. Modul funktioniert.
3. Modul lässt sich deaktivieren.
4. Core/App funktioniert danach weiter.
5. Unabhängige Module funktionieren weiter.
6. Navigation hinterlässt keinen Restzustand.
7. Re-enable funktioniert gemäß Lifecycle.

Wenn 4 oder 5 fehlschlägt, ist die Implementierung nicht als optionales Modul akzeptiert.

## Agentenregel

Vor Moduländerungen aktuellen Runtime-Code und diesen Vertrag lesen, generische Verträge wiederverwenden, Deaktivierbarkeit prüfen und keine Core-Erweiterung auf Verdacht einführen. Notwendige harte Dependencies benötigen Architekturreview. Runtime-/Lifecycle-Tests sind Pflicht; erforderliche reale Betreiber-Livetests bleiben separat.
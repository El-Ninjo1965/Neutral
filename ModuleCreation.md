# NEUTRAL – Verbindlicher Modulvertrag

**Stand:** 2026-09-13  
**Status:** AKTUELL / VERBINDLICH

Diese Fassung ersetzt ältere Modulbau-Annahmen. Technische Primärquelle ist der aktuelle Runtime-Code in `Web-App/core/module-interface.js`, `module-registry.js`, `module-manager.js` und `core-loader.js` sowie die aktuelle Server-Modulruntime.

## 1. Architekturgrundsatz

Ein normales App- oder Systemmodul ist ein eigenständiges optionales Feature.

- Der Core muss ohne optionale Module funktionieren.
- Deaktivierung eines optionalen Moduls darf Core und unabhängige Module nicht beschädigen.
- Ein Modul besitzt seine Fachlogik, Dateien, Einstellungen und Daten selbst.
- Ein Modul ändert keine Coredatei nur zu seiner eigenen Integration.
- Profile, Media, Moderation, Notifications, Sharing, Postbox und GPS sind keine impliziten Voraussetzungen für andere normale Module.

Wenn eine Komponente für das Gesamtsystem zwingend erforderlich ist, darf sie nicht wie ein frei deaktivierbares optionales Modul behandelt werden. Der aktuelle Runtime-Code besitzt noch keinen vollständig abgesicherten generischen Required-Dependency-Lifecycle. Ein Agent darf deshalb keine versteckte Pflichtabhängigkeit als normales Modul einführen.

## 2. Dependencies

Der aktuelle Code kann `dependencies` technisch lesen und bei Installation/Aktivierung prüfen. Das ist noch keine Freigabe für harte Kopplungen zwischen normalen optionalen Modulen.

Für neue normale Module gilt:

- Standard: `dependencies: []`.
- Nicht zwingende Erweiterungen gehören in `optionalDependencies`.
- Fehlt eine optionale Erweiterung, muss die Hauptfunktion weiterlaufen.
- Capability Detection und Fallback statt harter Kopplung.

Eine harte Modulabhängigkeit benötigt vor Verwendung eine Architekturprüfung. Insbesondere muss generisch geklärt sein, was bei Deaktivierung oder Uninstall der benötigten Komponente geschieht. Solange dies nicht vollständig abgesichert ist, keine neue harte Dependency zwischen optionalen Modulen einführen.

## 3. Eine Runtime, zwei Kategorien

`category: user|system` ist nur Klassifikation und Präsentation.

App Modules und System Modules verwenden dieselbe Registry, Discovery und denselben Lifecycle. Es gibt keine zweite Systemmodul-Runtime. Kategorie entscheidet nicht über User-Sichtbarkeit.

## 4. Aktueller Client-Manifestvertrag

`ModuleInterface.validateManifest()` normalisiert aktuell unter anderem:

- `id`, `appId`, `name`, `version`, `apiVersion`, `type`, `description`
- `dependencies`, `optionalDependencies`
- `permissions`, `permissionDefinitions`, `capabilities`
- `presentation.userNavigation`, `presentation.adminNavigation`, `presentation.system`
- `category`
- `source`, `entry`, `main`, `globalName`
- `modulePath`, `mountPath`, `manifestPath`, `autoload`
- `lifecycle`, `requirements`
- `access.visibilityPermissions`, `usagePermissions`, `managementPermissions`, `adminPermissions`
- `clientAccess`
- `publicOffline`
- `registered`, `status`, `lifecycleState`, `active`, `enabled`
- `standalone`
- `database.tables`
- `admin`

Client- und Servermanifest können unterschiedliche zusätzliche Felder konsumieren. Vor Verwendung eines Feldes ist der aktuelle Consumer zu prüfen; ältere Dokumentation allein ist kein Implementierungsbeweis.

## 5. Typische Struktur

```text
Web-App/app/modules/<module-id>/
├── module.json
├── index.js
└── index.html        # optionaler Standalone-/Self-Test
```

Serverfähigkeit, falls benötigt:

```text
Server/php/modules/<module-id>/
└── module.php
```

## 6. Lifecycle

Grundmodell:

`DISCOVERED/AVAILABLE → INSTALLED/INACTIVE → ENABLED/ACTIVE → DISABLED/INACTIVE → ENABLED/ACTIVE → UNINSTALL`

Discovery allein aktiviert kein normales Modul. Lifecycle-Aufrufe müssen wiederholbar und sauber sein. Bei Deaktivierung müssen modul-eigene Listener, Timer und Ressourcen beendet werden. Re-enable darf unabhängigen Zustand nicht beschädigen.

## 7. Discovery

Aktueller Clientpfad:

1. Loader liefert Katalog/Module.
2. `ModuleInterface.validateManifest()` normalisiert.
3. `ModuleRegistry.discover()` kombiniert Discoveryquellen.
4. `ModuleManager.discoverModules()` reconciliert die Registry.
5. Nur der jüngste Discovery-Lauf darf den aktuellen Registry-Zustand bestimmen.

Discovery darf keine fachliche Kopplung zwischen Modulen erzeugen.

## 8. Public/Offline

`publicOffline: true` ist ein generischer Vertrag für Module, deren bereinigte Client-Metadaten vor dem späteren Online-Abgleich lokal verfügbar sein dürfen.

- lokale Sichtbarkeit ersetzt keine serverseitige Zugriffsentscheidung;
- Online-Abgleich reconciliiert später den Lifecycle;
- ein Online-Fehler ist kein erfolgreicher leerer Katalog;
- keine GPS-Sonderruntime einführen.

GPS ist derzeit die live bestätigte Referenz dieses Vertrags.

## 9. Standalone

`standalone` ist optional und nur ein isolierter Self-Test.

- Nicht jedes Modul braucht Standalone.
- Standalone ersetzt nicht den normalen Lifecycle.
- `requires.server`, `requires.database`, `requires.auth` beschreiben Voraussetzungen.
- Integriert übernimmt ein Modul das zentrale Framework-Theme/Appearance. Ein eigenes Fachlayout ist erlaubt, eine widersprüchliche globale Designwelt nicht.

## 10. Access und Sichtbarkeit

Modulbezogene Zugriffsregeln und Navigation sind getrennte Aspekte.

- `access.visibilityPermissions`: Sichtbarkeit
- `access.usagePermissions`: Nutzung
- `access.managementPermissions`: Verwaltung
- `access.adminPermissions`: Administration
- `presentation.userNavigation`: User-Navigation
- `presentation.adminNavigation`: Admin-Navigation

Ein Modul darf nicht allein deshalb Profile/User-Account voraussetzen, weil es optional personalisierte Funktionen anbieten kann. Anonyme und authentifizierte Nutzung werden entsprechend dem eigenen Fachvertrag behandelt.

## 11. UI und Appearance

Module verwenden zentrale Theme-/Appearance-Werte und Framework-Komponenten. Änderungen zentraler Appearance-Einstellungen sollen integrierte Module automatisch erreichen. Module definieren ihr Fachlayout, nicht eine unabhängige globale Farb-/Theme-Architektur.

## 12. Settings und Daten

Modulbezogene Einstellungen liegen im eigenen Namespace, grundsätzlich `moduleSettings.<module-id>`. Installation/Aktivierung ist davon getrennt.

Ein Modul mit eigenen Daten besitzt und deklariert diese selbst. Direkter Zugriff auf interne Daten eines anderen optionalen Moduls ist keine zulässige Kopplung.

## 13. Verbotene Integrationsmuster

Nicht zulässig:

- Core-Dateien nur für ein einzelnes Fachmodul ändern;
- fremde Moduldateien verändern;
- private Zustände anderer Module als Vertrag verwenden;
- Profile als allgemeine Voraussetzung für Apps verwenden;
- Login als Voraussetzung annehmen, wenn die Fachfunktion anonym möglich sein soll;
- deaktivierte Module weiterhin als Voraussetzung im Corepfad referenzieren;
- UI-Tests ausschließlich über Quelltextmuster als Laufzeitbeweis behandeln.

## 14. Pflichtprüfung für optionale Module

Jedes optionale Modul muss mindestens beweisen:

1. App startet mit Modul aktiv.
2. Modul funktioniert.
3. Modul deaktivieren.
4. App/Core funktioniert weiterhin.
5. Unabhängige Module funktionieren weiterhin.
6. Navigation besitzt keinen Restzustand.
7. Re-enable funktioniert entsprechend dem Lifecycle.

Wenn Punkt 4 oder 5 fehlschlägt, ist die Implementierung nicht als optionales Modul akzeptiert.

## 15. Referenzen

- GPS: Public/Offline, Gerätefunktion und Standalone.
- `reference-notes`/Field Notes: fachlich unabhängiges Modulbeispiel, soweit im aktuellen Repository vorhanden.
- Profile, Media, Sharing, Notifications, Moderation und Postbox: optionale Fachmodule bzw. Scaffolds; sie dürfen keine Voraussetzung für Core oder voneinander werden.

Der konkrete Live-/Implementierungsstatus gehört in `SYSTEM-MODULES.md` und `STATUS.md`.

## 16. Entscheidungsregel für Agenten

Vor Moduländerungen:

1. aktuellen Runtime-Code lesen;
2. diesen Vertrag lesen;
3. Deaktivierbarkeit und Unabhängigkeit prüfen;
4. vorhandene generische Verträge verwenden;
5. keine Core-Erweiterung auf Verdacht;
6. bei notwendiger harter Dependency Architekturreview durch Lea anfordern;
7. Runtime-/Lifecycle-Tests durchführen;
8. realer Betreiber-Live-Test bleibt für UI-/Geräteverhalten maßgeblich.

## 17. Nächster Architektur-Audit

Nach dem aktuellen User-UI-Live-Fix werden alle vorhandenen Module separat gegen diesen Vertrag geprüft. Profile/Moderation werden erst danach repariert. Historische Implementierungen dürfen diesen Vertrag nicht stillschweigend aufweichen.

# NEUTRAL – Allgemeiner Modul-Serververtrag

**Status:** FREIGEGEBENE UMSETZUNGSSPEZIFIKATION  
**Grundlage:** `VISION.md`, `CORE-1.0.md`, `TODO.md`, `ModuleCreation.md`  
**Ausgeführt und dokumentiert durch:** Codex (ChatGPT Work)

## Ziel und Grenze

Ein installiertes Modul kann eigene PHP-Services, versionierte Datenmigrationen und API-Routen bereitstellen, ohne dass für das einzelne Modul der zentrale Router oder eine Coreklasse geändert wird. Der Server erzwingt Aktivierungszustand, Kompatibilität, Session, Permission, CSRF und quantitative Limits. GPS und ein zweites fachlich unabhängiges Referenzmodul müssen denselben Vertrag bestehen.

Provideradapter, generische Offline-Synchronisation, dynamische Downloads und eine Modul-Sandbox sind nicht Teil dieses Pakets.

## Komponenten

### Öffentlicher Manifestvertrag

`module.json` erhält ausschließlich deklarative Metadaten:

- `compatibility.core`: unterstützter Core-Versionsbereich,
- `compatibility.api`: unterstützte API-Hauptversion,
- `compatibility.php`: minimale PHP-Version,
- `server.entry`: relativer Einstieg unter `Server/php/modules/<module-id>/`,
- `server.routes`: Methode, relativer Pfad, Serviceaktion, Permission, CSRF-Anforderung und optionaler Limitkey,
- `server.services`: angebotene Servicenamen,
- `database.migrations`: geordnete Schlüssel mit Version und serverseitiger Definition,
- `limits`: quantitative Grenzen mit sicherem Standard und rollenbezogenen Obergrenzen,
- `uninstall.dataPolicy`: `retain` oder `destroy`.

IDs, Pfade, Versionswerte, Permissionkeys und Service-/Limitnamen werden streng normalisiert. Unbekannte oder unvereinbare Verträge verhindern Installation beziehungsweise Aktivierung fail-closed.

### Geschützte PHP-Moduldefinition

Der Einstieg liegt ausschließlich unter `Server/php/modules/<module-id>/` und liefert eine Definition mit Servicefabriken und Migrationen. Der Loader akzeptiert weder absolute Pfade noch Traversal, Symlinks außerhalb des Modulverzeichnisses oder eine abweichende Modul-ID. PHP-Modulcode liegt nicht im öffentlichen `Server/public/`.

### Ein universeller Router-Hook

Der zentrale Router erhält genau einen generischen Delegationspunkt für `/api/v1/modules/<module-id>/<route>`. Ein `ModuleServerRegistry` löst ausschließlich installierte und aktive Module auf. Die Route wird erst nach Methoden-, Kompatibilitäts-, Permission-, CSRF- und Limitprüfung an die deklarierte Serviceaktion übergeben. Antworten bleiben strukturierte, bereinigte JSON-Daten; interne Exceptions werden nicht ausgegeben.

### Migration und Rollback

Migrationen werden pro Modul geordnet, mit SHA-256-Prüfsumme und Zielversion registriert. Installation/Update führt ausstehende `up`-Statements unter einem modulbezogenen Datenbank-Lock aus. Bei Fehlern werden die in diesem Lauf bereits angewendeten Schritte in umgekehrter Reihenfolge durch ihre zwingenden `down`-Statements kompensiert; ein unvollständiger Rollback sperrt Aktivierung und wird ohne SQL-Inhalt als Modulfehler gespeichert. Geänderte Prüfsummen bereits angewendeter Migrationen werden abgelehnt.

### Rechte und quantitative Limits

Jede Modulroute deklariert genau einen modul-eigenen Permissionkey. Zustandsändernde Sessionrouten verlangen CSRF. Ein optionales Limit besitzt einen nichtnegativen Rollenstandard; `null` bedeutet ausschließlich bei ausdrücklich genannter Rolle unbegrenzt. Vor der Mutation liefert die Serviceaktion den aktuellen Verbrauch, der Kernel prüft `current + cost <= effectiveLimit`. Der Browser kann diese Entscheidung niemals erweitern.

### Deinstallation

Deinstallation ist nur im inaktiven Zustand möglich. Standard ist `retain`: fachliche Tabellen und Migrationsergebnisse bleiben erhalten, Registrierung, Rechte und Settings werden entfernt. `destroy` ist nur erlaubt, wenn jede Tabelle exakt dem Modul gehört und mit dem aus der Modul-ID gebildeten Präfix beginnt (Bindestriche werden zu Unterstrichen), und wenn jede angewandte Migration eine Rückwärtsdefinition besitzt. Rollback läuft rückwärts; bei jedem Fehler bleibt die Registrierung bestehen. Fremde oder Coretabellen dürfen nie gelöscht werden.

## Zweites Referenzmodul

`reference-notes` ist bewusst klein und fachlich unabhängig von GPS. Es besitzt eine eigene Tabelle, Listen-/Anlege-/Löschrouten, modulbezogene Rechte und ein maximales Notizlimit. Es dient nur als Vertragsnachweis, nicht als Produktvorgabe. GPS nutzt denselben Kompatibilitäts- und Serverregistrierungsvertrag, bleibt aber ohne serverseitige Fachdaten.

## Abnahme

- Manifest-, Pfad-, Kompatibilitäts- und Registrytests,
- Route ohne Sitzung, ohne Permission, ohne CSRF, bei inaktivem Modul und über Limit wird abgelehnt,
- Migration ist idempotent; Checksumkonflikt und fehlerhafte Migration lösen Rollback aus,
- Deinstallation behält Daten standardmäßig und zerstört nur nach vollständig sicherem Vertrag,
- GPS und `reference-notes` bestehen Discovery, Installation/inaktiv, Aktivierung, Route, Deaktivierung und Deinstallation,
- vollständige Node-/PHP-Suite, Paketbau, Secretprüfung und Git-Diff bestehen vor Push/Deployment.

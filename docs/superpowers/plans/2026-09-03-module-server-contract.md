# Module Server Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Module können eigene sichere PHP-Routen, Services, Migrationen und Limits ohne modulspezifische Änderung am zentralen Router bereitstellen.

**Architecture:** Ein strenger Manifestnormalisierer und ein geschützter Servermodul-Loader speisen eine generische Registry. Der API-Router delegiert über einen einzigen Kernel, der Zustand, Kompatibilität, Auth, CSRF und Limits vor jeder Serviceaktion erzwingt; Migration und Deinstallation bleiben transaktional beziehungsweise kompensierend und eigentumsgebunden.

**Tech Stack:** PHP 8.x, PDO MySQL/MariaDB, JavaScript/Node-Testläufer, JSON-Manifeste.

**Spec:** `docs/superpowers/specs/2026-09-03-module-server-contract-design.md`

## Global Constraints

- Shared Hosting benötigt nur PHP 8.x, PDO MySQL/MariaDB und HTTPS.
- Keine Secrets, absoluten Hostingpfade oder modulspezifischen Routerzweige.
- Installation bleibt inaktiv; Aktivierung ist fail-closed.
- Jede Produktionsänderung folgt RED → GREEN → Refactor.
- Der Server entscheidet Auth, Permission, CSRF und Limits.
- Deinstallation löscht standardmäßig keine Fachdaten.

---

### Task 1: Manifest und Kompatibilität

**Files:**
- Create: `Server/php/src/ModuleContract.php`
- Modify: `Server/php/src/Phase7ModuleRuntime.php`
- Modify: `Server/php/bootstrap.php`
- Test: `tests/php-module-server-contract.test.js`

**Interfaces:**
- Produces: `ModuleContract::normalize(array $manifest): array`, `ModuleContract::assertCompatible(array $contract): void`.

- [ ] Test lehnt ungültige Modul-IDs, Traversal, fremde Permissionkeys und inkompatible Core-/API-/PHP-Versionen ab.
- [ ] Test ausführen und den erwarteten fehlenden Vertrag bestätigen.
- [ ] Minimalen Normalisierer und Versionsvergleich implementieren.
- [ ] Fokussierten Test grün ausführen.
- [ ] Commit `feat: define module server contract`.

### Task 2: Geschützte Services und generische Routen

**Files:**
- Create: `Server/php/src/ModuleServerRegistry.php`
- Create: `Server/php/src/ModuleHttpKernel.php`
- Modify: `Server/public/api/index.php`
- Modify: `Server/php/bootstrap.php`
- Test: `tests/php-module-server-contract.test.js`

**Interfaces:**
- Consumes: normalisierter `server`-Vertrag aus Task 1.
- Produces: `ModuleServerRegistry::resolve(string $moduleId): array`, `ModuleHttpKernel::dispatch(string $route, string $method, ?array $identity, array $headers): ?array`.

- [ ] Test für Loader-Pfadgrenze, aktiven Zustand, Methodenmismatch, Permission und CSRF schreiben.
- [ ] RED ausführen.
- [ ] Registry, Servicefabrik und einen einzigen Router-Delegationspunkt implementieren.
- [ ] GREEN und bestehende API-Vertragstests ausführen.
- [ ] Commit `feat: dispatch protected module routes`.

### Task 3: Versionierte Migrationen und Rollback

**Files:**
- Create: `Server/php/src/ModuleMigrationRunner.php`
- Modify: `Server/php/src/Phase7ModuleRuntime.php`
- Modify: `Server/php/src/SchemaMigrator.php`
- Test: `tests/php-module-migrations.test.js`

**Interfaces:**
- Produces: `ModuleMigrationRunner::migrate(array $module, array $definition): array`, `rollback(array $module, array $definition): array`.

- [ ] Test für Reihenfolge, Idempotenz, SHA-256-Konflikt, Lock und kompensierenden Rücklauf schreiben.
- [ ] RED ausführen.
- [ ] Runner und notwendige Core-Schema-Erweiterung implementieren.
- [ ] GREEN und Schema-/Installtests ausführen.
- [ ] Commit `feat: add transactional module migrations`.

### Task 4: Limits und sichere Deinstallation

**Files:**
- Create: `Server/php/src/ModuleLimitGuard.php`
- Modify: `Server/php/src/ModuleHttpKernel.php`
- Modify: `Server/php/src/Phase7ModuleRuntime.php`
- Test: `tests/php-module-limits-uninstall.test.js`

**Interfaces:**
- Produces: `ModuleLimitGuard::effectiveLimit(array $limits, string $key, array $roles): ?int`, `assertAllows(...): void`.

- [ ] Test für Rollenlimit, Überschreitung, fehlendes Limit, inaktive Deinstallation und fremde Tabelle schreiben.
- [ ] RED ausführen.
- [ ] Limitprüfung vor Mutation und retain/destroy-Deinstallationsgrenzen implementieren.
- [ ] GREEN sowie Permission-/Lifecycletests ausführen.
- [ ] Commit `feat: enforce module limits and safe uninstall`.

### Task 5: Zweites Referenzmodul und Abschluss

**Files:**
- Create: `Web-App/app/modules/reference-notes/module.json`
- Create: `Web-App/app/modules/reference-notes/index.js`
- Create: `Server/php/modules/reference-notes/module.php`
- Modify: `Web-App/app/modules/index.json`
- Modify: `Web-App/app/modules/gps/module.json`
- Test: `tests/module-contract-acceptance.test.js`
- Modify: `ModuleCreation.md`, `Architecture.md`, `Functions.md`, `API.md`, `Database.md`, `Security.md`, `STATUS.md`, `TODO.md`, `WORKFLOW.md`, `CHANGELOG.md`

**Interfaces:**
- Consumes: alle Verträge aus Tasks 1–4.
- Produces: GPS und `reference-notes` als zwei unabhängige Vertragsfixtures.

- [ ] End-to-End-Vertragstest für beide Module schreiben und RED bestätigen.
- [ ] Minimales Referenzmodul und GPS-Vertragsmetadaten ergänzen.
- [ ] Fokussierte und vollständige Suite, Produktionspaket, Diff- und Secretscan ausführen.
- [ ] Dokumentation ausschließlich nach nachgewiesenem Stand aktualisieren.
- [ ] Commit `feat: complete generic module contract` und nach GitHub `main` integrieren.

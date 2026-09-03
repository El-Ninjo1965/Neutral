# Anonymous Offline Module Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aktive, vom Admin für `viewer` freigegebene Module ohne Login und nach erfolgreicher Erstladung auch offline sicher nutzbar machen.

**Architecture:** Der PHP-Server bildet Viewer-Modulrechte nur für den öffentlichen Modulkatalog auf einen anonymen Zugriffskontext ab und liefert bereinigte `clientAccess`-Entscheidungen. Der Browser speichert ausschließlich anonyme Kataloge, übernimmt die Entscheidung in Registry und User-Shell und nutzt sie für lokale Module; Serverrechte bleiben unverändert geschützt.

**Tech Stack:** PHP 8.x, Browser-JavaScript, `node:test`, Shared Hosting, IndexedDB/localStorage-kompatibler Offlinebetrieb.

**Spec:** `docs/superpowers/specs/2026-09-03-anonymous-offline-module-access-design.md`

## Global Constraints

- Fehlende oder unklare Rechte bleiben fail-closed.
- Nur aktive Module gelangen in den Clientkatalog.
- Nur anonyme Katalogantworten werden als anonymer Offlinefallback gespeichert.
- `clientAccess` erteilt keine Serverberechtigung.
- Keine Standortdaten, Identitäten, Cookies oder Secrets werden im Katalog oder in Logs gespeichert.
- Jede Produktionsänderung folgt einem beobachteten RED/GREEN-Zyklus.

---

### Task 1: Serverseitige anonyme Viewer-Modulentscheidung

**Files:**
- Modify: `Server/php/src/Phase7ModuleRuntime.php`
- Modify: `Server/public/api/index.php`
- Test: `tests/module-public-access.test.js`

**Interfaces:**
- Consumes: `Phase4RoleService::permissionsForRoles(['viewer'])`
- Produces: `Phase7ModuleRuntime::listForClient(?array $identity)` mit `clientAccess.mode`, `clientAccess.canView`, `clientAccess.canUse`

- [x] **Step 1: Failing source-contract and PHP-process tests write.** Test inactive module exclusion, anonymous viewer visibility, separate usage decision and absence of admin permissions in the response.
- [x] **Step 2: Run `node --test tests/module-public-access.test.js`.** Expected: FAIL because anonymous viewer permissions are not resolved and `clientAccess` is absent.
- [x] **Step 3: Implement minimal access resolver.** In the route create an anonymous module-only identity from the persisted viewer permissions; in the runtime require active state and compute only view/use booleans.
- [x] **Step 4: Run `node --test tests/module-public-access.test.js`.** Expected: PASS or explicit PHP-SKIP when no PHP binary exists; static contract assertions must pass.
- [x] **Step 5: Commit `feat: expose viewer-approved modules anonymously`.**

### Task 2: Sicherer anonymer Offlinekatalog

**Files:**
- Modify: `Web-App/core/core-loader.js`
- Modify: `Web-App/core/module-interface.js`
- Modify: `Web-App/core/module-registry.js`
- Test: `tests/module-offline-catalog.test.js`

**Interfaces:**
- Consumes: API response `{data:{modules,accessContext:{mode}}}` and module `clientAccess`
- Produces: local key `neutral.module-catalog.anonymous.v1:<basePath>` and normalized `manifest.clientAccess`

- [x] **Step 1: Failing browser-context tests write.** Cover successful anonymous cache, offline fallback, no-cache fail-closed and authenticated-response non-persistence.
- [x] **Step 2: Run `node --test tests/module-offline-catalog.test.js`.** Expected: FAIL because no cache or `clientAccess` propagation exists.
- [x] **Step 3: Implement minimal catalog envelope parsing and anonymous-only cache.** Validate array entries, mode and access booleans; never fall back to an authenticated response.
- [x] **Step 4: Propagate `clientAccess` through manifest validation, loaded implementation and registry normalization.**
- [x] **Step 5: Run `node --test tests/module-offline-catalog.test.js tests/master-framework.test.js`.** Expected: PASS.
- [x] **Step 6: Commit `feat: cache anonymous module catalog offline`.**

### Task 3: Öffentliche User-Shell und lokale Einstellungen

**Files:**
- Modify: `Web-App/public/user-app.js`
- Modify: `Web-App/public/admin/modules-view.js`
- Test: `tests/user-module-access.test.js`
- Test: `tests/admin-cms-ui.test.js`

**Interfaces:**
- Consumes: registry module `clientAccess`
- Produces: fail-closed anonymous visibility and label `Local settings`

- [x] **Step 1: Failing UI contract tests write.** Verify no permissive `module.public !== false`, anonymous `canView`, blocked direct opening, authenticated permission handling, local-settings label and viewer explanation.
- [x] **Step 2: Run focused tests.** Expected: FAIL on the old permissive fallback and missing labels.
- [x] **Step 3: Implement minimal filtering and direct-open guard.** Never fall back from invisible module lookup to the unfiltered registry.
- [x] **Step 4: Rename only the anonymous settings action and heading to `Local settings`; keep signed-in wording unchanged.**
- [x] **Step 5: Add the module-rights explanation to the admin permission editor.**
- [x] **Step 6: Run `node --test tests/user-module-access.test.js tests/admin-cms-ui.test.js`.** Expected: PASS.
- [x] **Step 7: Commit `fix: enforce anonymous module visibility in user shell`.**

### Task 4: GPS sofortige lokale Anzeige und automatische Aktualisierung

**Files:**
- Modify: `Web-App/app/modules/gps/index.js`
- Test: `tests/master-framework.test.js`

**Interfaces:**
- Consumes: `GpsModule.clientAccess.canUse`, `navigator.permissions`, locally stored `gps:lastPosition`
- Produces: one automatic `getCurrentPosition()` call per UI mount only when permission is already `granted`

- [x] **Step 1: Failing GPS tests write.** Cover anonymous view-only denial, anonymous use allow, immediate cached render, granted auto-refresh exactly once and no automatic prompt.
- [x] **Step 2: Run focused GPS tests.** Expected: FAIL because anonymous use has no client context and render never refreshes.
- [x] **Step 3: Implement minimal anonymous use resolver and one-shot mount refresh guard.**
- [x] **Step 4: Run `node --test tests/master-framework.test.js`.** Expected: PASS.
- [x] **Step 5: Commit `feat: refresh permitted gps position on open`.**

### Task 5: Dokumentation und Abschlussprüfung

**Files:**
- Modify: `VISION.md`
- Modify: `ModuleCreation.md`
- Modify: `API.md`
- Modify: `Functions.md`
- Modify: `Security.md`
- Modify: `Architecture.md`
- Modify: `STATUS.md`
- Modify: `TODO.md`
- Modify: `CHANGELOG.md`
- Modify: `WORKFLOW.md`

**Interfaces:**
- Consumes: completed Tasks 1-4 and their fresh test evidence
- Produces: documented IST contract and remaining Core-1.0 work only

- [x] **Step 1: Update all affected contracts with explicit IST/security/offline limits and Codex attribution.**
- [x] **Step 2: Run focused tests and the PHP-excluded complete suite.**
- [x] **Step 3: Build and verify the production package; run `git diff --check` and secret-pattern checks without printing secret values.**
- [x] **Step 4: Review the specification line by line against code and tests; correct gaps test-first.**
- [x] **Step 5: Commit `docs: record anonymous offline module contract`.**
- [x] **Step 6: Push/integrate to GitHub `main`, verify CodeQL and deploy only after successful checks.**
- [x] **Step 7: Run read-only public module and protected-admin smoke tests; reuse the existing authenticated-admin evidence and do not claim an unavailable device-position test.**

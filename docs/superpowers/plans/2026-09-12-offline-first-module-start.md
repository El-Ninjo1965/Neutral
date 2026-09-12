# Offline-First Module Startup Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore Neutral's approved offline-first startup so active GPS renders immediately without user RBAC/server-catalog gating while authenticated modules remain secure and dynamically projected.

**Architecture:** Separate the locally trusted public/offline module activation projection from authenticated permission-sensitive catalogs. Render GPS from the local public activation projection during the first stable shell render, then reconcile server state in the background without full-page rerenders. Keep Profile/Moderation on authenticated discovery and server authorization.

**Tech Stack:** Browser JavaScript, PHP 8.1+, MySQL/MariaDB, IndexedDB/local storage as already used, Node test harness, GitHub Actions/FTPS.

**Spec:** `docs/superpowers/specs/2026-09-12-offline-first-module-start-design.md`

## Global Constraints

- GPS visibility/use must not depend on user roles, user permissions, packages or entitlements.
- Admin still controls GPS installation and activation/deactivation.
- No server roundtrip before initial GPS navigation render.
- Server authorization remains authoritative for protected server actions.
- Profile/Moderation remain permission-sensitive.
- No new external GPS provider/API.
- No Core Freeze.

---

### Task 1: Audit current startup and write failing behavior tests

**Files:** inspect `Web-App/public/user-app.js`, `Web-App/core/core-loader.js`, module registry/manager, GPS manifest/module, PHP modules endpoint, existing startup/catalog tests.

- [ ] Trace first render → local state → session restore → catalog → registry → navigation with explicit event/request ordering.
- [ ] Write failing test: active locally-known GPS exists at first stable anonymous render before catalog promise resolves.
- [ ] Write failing test: `Welcome to Neutral` is not fully rerendered by delayed module discovery.
- [ ] Write failing tests for Ralf/Tester/Admin/Developer login retaining GPS without reload.
- [ ] Write failing offline test with server catalog unavailable.
- [ ] Run focused tests and record the failures/root cause before implementation.

### Task 2: Define local public/offline activation projection

**Files:** modify existing module cache/registry/storage contracts; do not create a parallel product-specific framework if an existing cache contract can be extended.

- [ ] Persist only sanitized public/offline module metadata needed for safe local rendering: id, version, client entry/presentation, installed/active/public-offline state and schema/version marker.
- [ ] Never persist authenticated permissions/session identity into this public projection.
- [ ] Make GPS manifest explicitly declare the generic public/offline capability required by the approved spec.
- [ ] Remove GPS User-RBAC/package/entitlement visibility gating from client projection while preserving admin lifecycle control.
- [ ] Test corrupted/stale/incompatible local projection fails closed rather than executing arbitrary data.

### Task 3: Make first render deterministic

**Files:** `Web-App/public/user-app.js`, core loader/registry as required.

- [ ] Hydrate valid public/offline module projection before first navigation render.
- [ ] Render shell/homepage once with immediately available GPS navigation.
- [ ] Start session restore/catalog synchronization after the stable initial render.
- [ ] Reconcile navigation incrementally; do not full-rerender Welcome/Home solely because catalog arrived.
- [ ] Ensure delayed/failed requests cannot remove locally valid GPS until an authoritative administrative state update is received.
- [ ] Verify no manual reload is needed.

### Task 4: Preserve authenticated module security and Profile behavior

**Files:** existing catalog endpoint, client access projection, Profile manifest/entry only where necessary.

- [ ] Keep Profile/Moderation outside the public offline projection.
- [ ] After login, load authenticated catalog once per generation/scope and reconcile permission-sensitive modules.
- [ ] Keep request failure retryable; never translate failure into authoritative empty success.
- [ ] Confirm Profile is not package/entitlement gated.
- [ ] Behavior test Active + profile.view/update → Profile visible/open/save; missing permission → hidden/denied as contract requires.

### Task 5: Administrative activation synchronization

- [ ] On GPS install/activate/deactivate, update/invalidate the public activation projection through the existing safe mechanism.
- [ ] Test activation makes GPS available for subsequent offline start.
- [ ] Test deactivation removes it after authoritative synchronization and prevents future offline presentation.
- [ ] Do not require every anonymous start to contact server merely to rediscover unchanged activation.

### Task 6: Retain/retest accepted UI fixes

- [ ] Module Details remains separate view.
- [ ] Module detail Save → framework confirmation → Back remains working.
- [ ] Settings Apps/Navigation Save feedback works.
- [ ] Module table final borders remain aligned.
- [ ] Theme select changes on one semantic change event.
- [ ] GPS content/map spacing remains correct; coordinate fallback remains honest until a configured geocoder exists.

### Task 7: Full verification and deployment

- [ ] Focused delayed-promise/race/offline tests.
- [ ] Full `npm test`.
- [ ] JS syntax checks.
- [ ] PHP lint.
- [ ] `git diff --check`.
- [ ] Production package.
- [ ] Update Architecture/API/UI-UX/STATUS/CURRENT-TASK/CHATGPT/CHANGELOG to actual implementation, not aspirations.
- [ ] Push main.
- [ ] Wait for CodeQL + FTPS terminal.
- [ ] Production read-only smoke.
- [ ] Do not interpret Codex-container Connect-proxy 403 as Neutral production failure if independent GitHub Actions smoke succeeds.

## Operator acceptance after deployment

- [ ] Fresh/incognito anonymous root: GPS visible immediately, no reload, no Welcome double blink.
- [ ] Ralf login: GPS remains; Profile appears if active/permitted.
- [ ] Tester login: same.
- [ ] Developer/Admin login: GPS remains without RBAC dependency.
- [ ] Offline start after prior valid activation: GPS usable locally.
- [ ] Module details/save/back and Settings save dialogs remain PASS.
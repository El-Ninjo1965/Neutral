# Windows Baseline Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the verified Windows development baseline portable and restore all 125 automated tests without weakening production security.

**Architecture:** Keep production authentication strict and correct only the synthetic PHP session fixture. Normalize filesystem paths at the boundaries where browser-style paths enter Node/PHP code, preserve exact-case architecture assertions, and leave Linux/shared-hosting behavior unchanged.

**Tech Stack:** Node.js 24, Node test runner, PHP 8.5, browser JavaScript, GitHub Actions compatible JavaScript/PHP.

**Spec:** `CORE-1.0.md`

## Global Constraints

- Core 1.0 must run on PHP 8.x, MySQL/MariaDB and HTTPS shared hosting without Node.js.
- Node.js remains an optional development and future professional runtime.
- Production session strict mode must not be disabled.
- The repository layout remains exactly `Web-App/` plus `Server/` at the top level.
- No credentials or deployment secrets may enter source control.

---

### Task 1: PHP Session Fixture Compatibility

**Files:**
- Modify: `tests/admin-php-entry.test.js`
- Test: `tests/admin-php-entry.test.js`

**Interfaces:**
- Consumes: PHP CLI configuration and the existing `createSessionIdentity()` helper.
- Produces: Deterministic synthetic PHP sessions while production strict mode remains enabled.

- [x] **Step 1: Verify the existing regression is red**

Run: `node --test --test-concurrency=1 tests/admin-php-entry.test.js`

Expected: viewer/admin fixture cases return `401` instead of `403`/`200`.

- [x] **Step 2: Apply the minimal fixture-only correction**

Pass `-d session.use_strict_mode=0` only to the PHP CLI process that creates the already-authorized synthetic session ID.

- [x] **Step 3: Verify the focused test is green**

Run: `node --test --test-concurrency=1 tests/admin-php-entry.test.js`

Expected: 5 cases pass and production code remains unchanged.

### Task 2: Absolute Windows Module Paths

**Files:**
- Modify: `Web-App/core/core-loader.js`
- Test: `tests/master-framework.test.js`

**Interfaces:**
- Consumes: `CoreLoader.loadModuleManifest(moduleRootPath)` with browser, POSIX or Windows paths.
- Produces: Correct manifest and entry paths for absolute Windows module directories.

- [x] **Step 1: Verify the GPS discovery regression is red**

Run: `node --test --test-concurrency=1 --test-name-pattern="gps|module-declared" tests/master-framework.test.js`

Expected: the GPS module is not discovered.

- [x] **Step 2: Normalize absolute Windows bases minimally**

In `toAbsolutePath`, recognize `^[A-Za-z]:[\\/]` and join the base and candidate using the separator already present in the base.

- [x] **Step 3: Verify GPS discovery and lifecycle are green**

Run: `node --test --test-concurrency=1 --test-name-pattern="gps|module-declared" tests/master-framework.test.js`

Expected: manifest metadata, lifecycle and permission cases pass.

### Task 3: Cross-platform Static Request Resolution

**Files:**
- Modify: `Server/node/bootstrap/server.js`
- Test: `tests/master-framework.test.js`

**Interfaces:**
- Consumes: URL paths such as `/index.html`.
- Produces: A path confined to `webRootDir` on Windows and Unix.

- [x] **Step 1: Verify the activation regression is red**

Run: `node --test --test-concurrency=1 --test-name-pattern="supports setup, database, and activation flow" tests/master-framework.test.js`

Expected: the activated root request returns `403`.

- [x] **Step 2: Strip both URL and Windows leading separators**

Change the `safeResolve` leading-separator expression from `^\/+` to `^[/\\]+` before `path.resolve` performs its containment check.

- [x] **Step 3: Verify setup activation is green**

Run the focused test again; expected status is `200` and the HTML shell is returned.

### Task 4: Portable PHP Environment Candidate Paths

**Files:**
- Modify: `Server/php/src/EnvLoader.php`
- Test: `tests/portability-config.test.js`

**Interfaces:**
- Consumes: an active installation root on Windows or Unix.
- Produces: ordered, native candidate paths with active-root `.env` first.

- [x] **Step 1: Verify the portability regression is red**

Run: `node --test --test-concurrency=1 tests/portability-config.test.js`

Expected: the PHP candidate contains mixed path separators.

- [x] **Step 2: Build candidate suffixes with `DIRECTORY_SEPARATOR`**

Append `.env`, `.env.local`, `.env.production` and `.env.development` using the native separator.

- [x] **Step 3: Verify both Node and PHP portability tests are green**

Run the focused portability test file; expected: 2 passing tests.

### Task 5: Exact-case Architecture Assertion

**Files:**
- Modify: `tests/vision-framework.test.js`
- Test: `tests/vision-framework.test.js`

**Interfaces:**
- Consumes: exact top-level directory names returned by `fs.readdirSync`.
- Produces: A case-sensitive assertion on Windows and Unix.

- [x] **Step 1: Verify the architecture regression is red**

Run: `node --test --test-concurrency=1 --test-name-pattern="two-component layout" tests/vision-framework.test.js`

Expected: Windows treats `server` as the existing `Server` directory.

- [x] **Step 2: Compare exact directory entries**

Read the root entries once and assert that none of the obsolete lowercase names is included exactly.

- [x] **Step 3: Verify the focused architecture test is green**

Run the focused test again; expected: pass.

### Task 6: Full Verification, Documentation and Delivery

**Files:**
- Modify: `STATUS.md`
- Modify: `TODO.md`
- Modify: `CHANGELOG.md`
- Modify: this plan

**Interfaces:**
- Consumes: all corrected runtime and test boundaries.
- Produces: a documented, reproducible green baseline on `main`.

- [x] **Step 1: Run the complete suite**

Run: `npm test`

Expected: 125 tests, 125 pass, 0 fail.

- [x] **Step 2: Run deployment preflight**

Run: `npm run setup:preflight`

Expected: command completes successfully without exposing secrets.

- [x] **Step 3: Update project truth documents**

Record the verified counts, resolved Windows portability causes and next remaining Core 1.0 work in `STATUS.md`, `TODO.md` and `CHANGELOG.md`.

- [x] **Step 4: Review and commit**

Run `git diff --check`, inspect `git diff`, then commit only the files in this plan with message `fix: stabilize cross-platform development baseline`.

- [ ] **Step 5: Push and verify remote synchronization**

Push `main`, then verify local `HEAD` equals `origin/main`.

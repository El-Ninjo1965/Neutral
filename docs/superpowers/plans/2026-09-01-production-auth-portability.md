# Production Authentication and Portability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add fail-closed PHP login throttling, encrypted logical database backup/restore, protected inventory APIs, and complete a non-destructive production installation/portability acceptance.

**Architecture:** Authentication throttling is a focused MySQL-backed service invoked around the existing PHP authenticator. Portability is a separate encrypted logical-backup service over the managed Neutral tables, exposed only through existing session/RBAC/CSRF boundaries. Production acceptance first inventories and backs up the live instance, then installs and restores into an isolated target whenever the host supports it.

**Tech Stack:** PHP 8.x, PDO MySQL/MariaDB, AES-256-GCM via OpenSSL, Node.js built-in test runner, GitHub Actions, FTPS, curl.

**Spec:** `docs/superpowers/specs/2026-09-01-production-auth-portability-design.md`

## Global Constraints

- Never print or commit passwords, tokens, password hashes, session identifiers, database rows, `.env` values, or backup plaintext.
- No production reset until an encrypted backup, SHA-256 checksum, and aggregate inventory have all been verified.
- Production authentication fails closed with HTTP 503 when the configured throttle backend cannot be evaluated.
- All new behavior follows RED → GREEN → REFACTOR and receives security review before deployment.
- Existing production remains authoritative; no automatic DNS or domain switch.

---

### Task 1: Persistent PHP login throttling

**Files:**
- Modify: `Server/php/src/SchemaMigrator.php`
- Create: `Server/php/src/LoginRateLimiter.php`
- Modify: `Server/php/bootstrap.php`
- Modify: `Server/public/api/index.php`
- Modify: `tests/session-auth.test.js`

**Interfaces:**
- Produces: `LoginRateLimiter::check(string $identifier, string $ip): array{allowed:bool,retryAfter:int}`
- Produces: `LoginRateLimiter::registerFailure(string $identifier, string $ip): array{allowed:bool,retryAfter:int}`
- Produces: `LoginRateLimiter::registerSuccess(string $identifier, string $ip): void`
- Consumes: `AppConfig`, `Database`, the normalized client IP, and the existing `Phase4AuthManager::authenticate()` result.

- [ ] **Step 1: Write failing integration tests**

Add real PHP-API tests proving attempts 1–5 return 401, attempt 6 returns 429 with `Retry-After`, rotating usernames reaches the IP-wide limit, success clears only the relevant counters, and a configured-but-unavailable limiter returns 503 rather than authenticating unthrottled.

- [ ] **Step 2: Run the focused tests and confirm RED**

Run: `node --test tests/session-auth.test.js`  
Expected: limit cases return 401 instead of 429 and the backend-failure case does not return 503.

- [ ] **Step 3: Add the migration and minimal limiter**

Create the managed `login_attempts` table with `scope_key`, `attempt_count`, `window_started_at`, `last_attempt_at`, `locked_until`, and indexes. Hash lowercase trimmed identifier plus IP with SHA-256, use atomic MySQL upserts, default to 5 combined attempts, 20 IP attempts, 900-second window and lock, and opportunistically delete expired rows.

- [ ] **Step 4: Integrate the limiter at the login route**

Check before password verification; record generic failures after failed authentication; clear matching scopes after success; return generic 429 plus `Retry-After`; catch backend exceptions and return sanitized 503 in production.

- [ ] **Step 5: Run focused and full tests**

Run: `node --test tests/session-auth.test.js` then `npm test`  
Expected: all tests pass with zero failures.

- [ ] **Step 6: Commit Task 1**

```powershell
git add -- Server/php/src/SchemaMigrator.php Server/php/src/LoginRateLimiter.php Server/php/bootstrap.php Server/public/api/index.php tests/session-auth.test.js
git commit -m "feat: throttle PHP login attempts"
```

### Task 2: Encrypted logical backup service

**Files:**
- Create: `Server/php/src/DatabaseBackupService.php`
- Modify: `Server/php/src/AppConfig.php`
- Modify: `Server/php/bootstrap.php`
- Create: `tests/php-backup.test.js`

**Interfaces:**
- Produces: `DatabaseBackupService::create(): array`
- Produces: `DatabaseBackupService::list(): array`
- Produces: `DatabaseBackupService::restore(string $backupId): array`
- Produces: `DatabaseBackupService::storeUpload(string $bytes): array`
- Produces: `DatabaseBackupService::pathForDownload(string $backupId): string`

- [ ] **Step 1: Write failing service-level tests**

Use an isolated MySQL fixture when available and deterministic injected crypto/storage fixtures otherwise. Prove round-trip restoration of literal records, exclusion of `sessions` and `login_attempts`, rejection of wrong keys/tampered ciphertext/unknown tables/path traversal, and no mutation after validation failure.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test tests/php-backup.test.js`  
Expected: the backup service/class is missing and required observable behaviors fail.

- [ ] **Step 3: Implement encrypted versioned artifacts**

Export only `SchemaMigrator::managedTables()` excluding ephemeral tables, canonicalize JSON, hash plaintext with SHA-256, encrypt using `openssl_encrypt(..., 'aes-256-gcm', ...)`, generate server-side IDs, and store under `Server/runtime/backups` with restrictive permissions. Reject `NEUTRAL_BACKUP_KEY` shorter than 32 characters.

- [ ] **Step 4: Implement fail-safe restore**

Authenticate/decrypt/validate the complete envelope before opening a transaction. Disable FK checks only inside the transaction with guaranteed restoration, clear in reverse dependency order, insert in forward order with prepared statements, roll back on every exception, and never restore sessions or throttle state.

- [ ] **Step 5: Run focused and full tests**

Run: `node --test tests/php-backup.test.js` then `npm test`  
Expected: all tests pass with zero failures.

- [ ] **Step 6: Commit Task 2**

```powershell
git add -- Server/php/src/DatabaseBackupService.php Server/php/src/AppConfig.php Server/php/bootstrap.php tests/php-backup.test.js
git commit -m "feat: add encrypted database portability backups"
```

### Task 3: Protected inventory and backup APIs

**Files:**
- Modify: `Server/public/api/index.php`
- Modify: `Server/php/src/Phase4AuthRbac.php`
- Modify: `Server/php/src/CoreDataSeeder.php`
- Modify: `tests/session-auth.test.js`
- Modify: `tests/admin-api.test.js`
- Modify: `API.md`
- Modify: `Security.md`

**Interfaces:**
- Produces the six API routes specified in the design.
- Consumes existing session identity, `Security::validateCsrfToken()`, permission checks, `DatabaseBackupService`, and managed-table inventory.

- [ ] **Step 1: Write failing HTTP contract tests**

Prove unauthenticated 401, insufficient-role 403, missing/wrong CSRF 403, safe aggregate inventory, backup create/list/download/upload/restore success, sanitized failures, and audit entries without payload or secret material.

- [ ] **Step 2: Run focused HTTP tests and confirm RED**

Run: `node --test tests/session-auth.test.js tests/admin-api.test.js`  
Expected: routes are missing or return the old placeholder payload.

- [ ] **Step 3: Seed and enforce `backups.view` / `backups.manage`**

Add permissions to the authoritative PHP permission catalog and admin role, retaining server-side enforcement independent of UI visibility.

- [ ] **Step 4: Implement inventory and backup route handlers**

Use exact route parsing, generated backup IDs, bounded upload size, `application/octet-stream` download, CSRF on every mutation, and generic errors. Inventory returns table name/count plus migration state only.

- [ ] **Step 5: Update API/security documentation and run tests**

Run: `node --test tests/session-auth.test.js tests/admin-api.test.js` then `npm test` and PHP lint on every changed PHP file.  
Expected: zero failures and zero syntax errors.

- [ ] **Step 6: Commit Task 3**

```powershell
git add -- Server/public/api/index.php Server/php/src/Phase4AuthRbac.php Server/php/src/CoreDataSeeder.php tests/session-auth.test.js tests/admin-api.test.js API.md Security.md
git commit -m "feat: expose protected portability APIs"
```

### Task 4: Security review and release verification

**Files:**
- Modify only files required by verified review findings.

**Interfaces:**
- Consumes Tasks 1–3 and the approved design.
- Produces a review with no open Critical, Important, or Minor security findings.

- [ ] **Step 1: Run complete local verification**

Run: `npm test`, `npm run setup:preflight`, PHP lint for changed PHP files, `git diff --check`, and secret-pattern inspection of the diff.

- [ ] **Step 2: Request independent security review**

Review auth enumeration, race conditions, IP spoofing, rate-limit fail-open behavior, crypto/key handling, artifact traversal, unsafe SQL identifiers, transaction/FK recovery, authorization, CSRF, information leakage and destructive scope.

- [ ] **Step 3: Fix findings test-first and re-review**

For each valid finding, add a failing regression test, verify RED, implement the minimal fix, verify GREEN, then repeat review until clean.

- [ ] **Step 4: Commit review fixes**

```powershell
git add -u
git add -- Server/php/src Server/public/api tests
git commit -m "fix: close portability security review findings"
```

### Task 5: Production inventory, deployment and live auth/write acceptance

**Files:**
- Modify: `.github/workflows/ftps-deploy.yml` only if a non-versioned one-time acceptance probe must be injected.
- Create temporarily at workflow runtime only: a filename consisting of `neutral-acceptance-`, 32 lowercase hexadecimal characters, and `.php`.
- Modify: `STATUS.md`, `CONNECTIONS.md`, `CHANGELOG.md`.

**Interfaces:**
- Consumes GitHub repository secrets, FTPS deployment, the production API, and a runtime-generated one-time token.
- Produces only aggregate inventory and HTTP/status assertions.

- [ ] **Step 1: Generate one-time secret without logging it**

Generate 32 random bytes in the same process that sets the GitHub secret and invokes the temporary probe; never print the value or place it in Git.

- [ ] **Step 2: Inventory before mutation**

Deploy the temporary authenticated probe through the Actions staging directory, query only managed-table counts/migration state, store the aggregate result locally, and remove the probe immediately.

- [ ] **Step 3: Deploy reviewed code**

Push the feature commits, wait for FTPS and CodeQL success, then verify public status/setup/admin protections remain unchanged.

- [ ] **Step 4: Verify live login and reversible write**

Use a controlled admin credential without displaying it; assert Secure/HttpOnly/SameSite session cookie, `/auth/me`, 403 without CSRF, success with CSRF, restoration of the original setting, logout, and invalidated session.

- [ ] **Step 5: Verify live throttling**

Use a synthetic nonexistent identifier so no valid account is locked; confirm five generic 401 responses, sixth 429 plus `Retry-After`, and no username-enumeration difference.

### Task 6: Isolated install, backup/restore and move acceptance

**Files:**
- Create runtime-only acceptance target through the FTPS workflow; do not commit secrets or generated backup files.
- Modify: `Install-README-Server.md`, `STATUS.md`, `TODO.md`, `CONNECTIONS.md`, `CHANGELOG.md`.

**Interfaces:**
- Consumes the encrypted production backup and aggregate inventory from Task 5.
- Produces a clean target installation, restored data, successful target login and a dated acceptance record.

- [ ] **Step 1: Create target safely**

Attempt a separate database and web subdirectory using existing host permissions. If database creation is denied, use the approved fallback only after confirming no business rows and a verified encrypted backup.

- [ ] **Step 2: Install on the empty target**

Run prerequisite checks, migrations and controlled bootstrap-user creation; verify setup locks itself afterward and status remains sanitized.

- [ ] **Step 3: Transfer and restore the encrypted backup**

Upload the artifact through the protected API, restore transactionally, and compare every ported table count with the source inventory.

- [ ] **Step 4: Prove moved-instance behavior**

Log in on the target, verify old source sessions fail, exercise and revert one protected setting write, log out, and verify Setup remains hidden.

- [ ] **Step 5: Clean temporary acceptance resources**

Remove the temporary web directory, temporary database only when its resolved exact name is known, one-time probe, transient GitHub secret and local sensitive material. Keep the encrypted backup only according to the documented operator policy.

- [ ] **Step 6: Document evidence and final verification**

Update the five operational documents with dates, commit SHAs, Action URLs, non-sensitive counts and remaining gaps. Run `npm test`, PHP lint, `git diff --check`, confirm clean Git, push, wait for final FTPS/CodeQL success, and recheck production health.

- [ ] **Step 7: Commit documentation**

```powershell
git add -- Install-README-Server.md STATUS.md TODO.md CONNECTIONS.md CHANGELOG.md
git commit -m "docs: record production portability acceptance"
```

# Neutral Admin/CMS UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current single-column technical administration page with the approved responsive classic-CMS shell and expose every existing PHP administration capability through a clear navigation destination.

**Architecture:** Keep `Server/public/admin.php` as the authenticated server entry and retain the existing feature views. Add a small navigation contract and shell component between the PHP view and `AdminRouter`; the shell owns layout, active navigation, drawer state, focus, and logout delegation, while each feature view continues to own its API data and mutations.

**Tech Stack:** PHP 8 shared-hosting entry, browser-native JavaScript, HTML/CSS, Node.js built-in test runner for regression tests, GitHub Actions FTPS deployment.

**Spec:** `docs/superpowers/specs/2026-09-02-admin-cms-ui-design.md`

## Global Constraints

- Production must require only Apache-compatible rewrites, PHP, MySQL, and browser JavaScript; Node.js remains development/test-only.
- The canonical API prefix is `/api/v1`; legacy `/api` compatibility may remain but new UI code must use `ApiClient` normalization.
- Server sessions, permissions, and CSRF remain authoritative; UI visibility never grants access.
- No secret, password hash, CSRF secret, database identity, or server path may be rendered or logged.
- The layout must work at desktop width and at 320px/iPad widths without hover-only functionality.
- Existing feature behavior must remain intact while the shell is replaced.

---

### Task 1: Define the Admin Navigation Contract

**Files:**
- Create: `Web-App/public/admin/navigation.js`
- Create: `tests/admin-cms-ui.test.js`

**Interfaces:**
- Produces: `AdminNavigation.groups`, a frozen array of `{ id, label, items }`.
- Produces: `AdminNavigation.flatten()` returning frozen `{ id, label, groupId }` items.
- Consumes: no DOM and no API, so the contract is independently testable.

- [ ] **Step 1: Write the failing navigation-contract test**

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

test('admin navigation groups every supported management destination exactly once', () => {
  const AdminNavigation = require('../Web-App/public/admin/navigation.js');
  assert.deepEqual(AdminNavigation.groups.map((group) => group.id), [
    'overview', 'platform', 'access', 'infrastructure', 'monitoring'
  ]);
  const ids = AdminNavigation.flatten().map((item) => item.id);
  assert.deepEqual(ids, [
    'dashboard', 'modules', 'settings', 'theme', 'users', 'roles', 'permissions',
    'sessions', 'connections', 'server', 'database', 'backups', 'updates',
    'diagnostics', 'audit'
  ]);
  assert.equal(new Set(ids).size, ids.length);
});
```

- [ ] **Step 2: Run the test and verify the missing-module failure**

Run: `node --test tests/admin-cms-ui.test.js`  
Expected: FAIL because `Web-App/public/admin/navigation.js` does not exist.

- [ ] **Step 3: Implement the immutable navigation contract**

```js
'use strict';

const groups = [
  { id: 'overview', label: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard' }] },
  { id: 'platform', label: 'Platform', items: [
    { id: 'modules', label: 'Apps & Modules' },
    { id: 'settings', label: 'Settings' },
    { id: 'theme', label: 'Appearance' }
  ] },
  { id: 'access', label: 'Access', items: [
    { id: 'users', label: 'Users' },
    { id: 'roles', label: 'Roles & Permissions' },
    { id: 'permissions', label: 'Permission Catalog' },
    { id: 'sessions', label: 'Sessions' }
  ] },
  { id: 'infrastructure', label: 'Infrastructure', items: [
    { id: 'connections', label: 'Connections & Providers' },
    { id: 'server', label: 'Server' },
    { id: 'database', label: 'Database' },
    { id: 'backups', label: 'Backups & Restore' },
    { id: 'updates', label: 'Maintenance & Updates' }
  ] },
  { id: 'monitoring', label: 'Monitoring', items: [
    { id: 'diagnostics', label: 'Diagnostics' },
    { id: 'audit', label: 'Audit Log' }
  ] }
].map((group) => Object.freeze({
  ...group,
  items: Object.freeze(group.items.map(Object.freeze))
}));

const AdminNavigation = Object.freeze({
  groups: Object.freeze(groups),
  flatten: () => Object.freeze(groups.flatMap((group) =>
    group.items.map((item) => Object.freeze({ ...item, groupId: group.id }))))
});

if (typeof window !== 'undefined') window.AdminNavigation = AdminNavigation;
if (typeof module !== 'undefined' && module.exports) module.exports = AdminNavigation;
```

- [ ] **Step 4: Run the focused test**

Run: `node --test tests/admin-cms-ui.test.js`  
Expected: PASS, one navigation-contract test.

- [ ] **Step 5: Commit the contract**

```bash
git add Web-App/public/admin/navigation.js tests/admin-cms-ui.test.js
git commit -m "feat: define admin CMS navigation"
```

---

### Task 2: Build the Semantic CMS Shell

**Files:**
- Create: `Web-App/public/admin/shell.js`
- Modify: `tests/admin-cms-ui.test.js`

**Interfaces:**
- Consumes: `AdminNavigation.groups`.
- Produces: `AdminShell.render({ groups, userLabel }) -> string`.
- Produces: `new AdminShell(container, options)` with `mount()`, `setActive(viewId)`, `setTitle(title)`, `openDrawer()`, `closeDrawer()`, and `destroy()`.
- Calls: `options.onNavigate(viewId)` and `options.onLogout()`; it performs no API requests.

- [ ] **Step 1: Add a failing shell-markup test**

```js
test('admin shell renders a semantic sidebar, drawer controls and content target', () => {
  const AdminNavigation = require('../Web-App/public/admin/navigation.js');
  const AdminShell = require('../Web-App/public/admin/shell.js');
  const html = AdminShell.render({ groups: AdminNavigation.groups, userLabel: 'Developer' });
  assert.match(html, /class="admin-cms-sidebar"/);
  assert.match(html, /aria-label="Administration"/);
  assert.match(html, /aria-controls="admin-cms-sidebar"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /data-admin-view="backups"/);
  assert.match(html, /id="admin-main"/);
  assert.match(html, />Developer</);
});
```

- [ ] **Step 2: Run the test and verify the missing-module failure**

Run: `node --test tests/admin-cms-ui.test.js`  
Expected: FAIL because `shell.js` does not exist.

- [ ] **Step 3: Implement the renderer and controller**

Implement `AdminShell.render()` with `<aside id="admin-cms-sidebar">`, grouped `<nav><ul>`, a `<button id="admin-menu-toggle">`, `<header class="admin-cms-header">`, `<h1 id="admin-page-title" tabindex="-1">`, user label, logout button, backdrop, and `<main id="admin-main">`. Escape every label before insertion.

Implement `mount()` so delegated clicks on `[data-admin-view]` call `onNavigate`, close the drawer, and leave authorization to the requested view/API. `openDrawer()` and `closeDrawer()` must synchronize `body.admin-drawer-open`, `aria-expanded`, and the backdrop `hidden` state. `setActive()` must set exactly one `aria-current="page"`.

```js
setActive(viewId) {
  this.container.querySelectorAll('[data-admin-view]').forEach((button) => {
    const active = button.dataset.adminView === viewId;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}
```

- [ ] **Step 4: Run the focused test**

Run: `node --test tests/admin-cms-ui.test.js`  
Expected: PASS for navigation and semantic shell tests.

- [ ] **Step 5: Commit the shell**

```bash
git add Web-App/public/admin/shell.js tests/admin-cms-ui.test.js
git commit -m "feat: add responsive admin CMS shell"
```

---

### Task 3: Integrate the Shell with the Existing Admin Router

**Files:**
- Modify: `Server/php/views/admin-ui.php`
- Modify: `Web-App/public/admin/index.js`
- Modify: `Web-App/public/admin-init.js`
- Modify: `tests/admin-php-entry.test.js`
- Modify: `tests/admin-cms-ui.test.js`

**Interfaces:**
- Consumes: `window.AdminNavigation`, `window.AdminShell`, existing view classes, and `ApiClient`.
- Produces: `AdminRouter.showView(viewId)` as the single view-transition path.
- Preserves: `window.adminRouter` and the existing `adminUsers`, `adminRoles`, `adminSettings`, `adminAudit`, and `adminModules` compatibility globals.

- [ ] **Step 1: Add failing integration assertions**

In `tests/admin-php-entry.test.js`, extend Fall C:

```js
assert.match(result.body, /src="\/Web-App\/public\/admin\/navigation\.js"/);
assert.match(result.body, /src="\/Web-App\/public\/admin\/shell\.js"/);
```

In `tests/admin-cms-ui.test.js`:

```js
test('admin router delegates layout and navigation to AdminShell', () => {
  const fs = require('node:fs');
  const source = fs.readFileSync(path.join(__dirname, '../Web-App/public/admin/index.js'), 'utf8');
  assert.match(source, /new window\.AdminShell/);
  assert.match(source, /onNavigate:\s*\(viewId\)\s*=>\s*this\.showView\(viewId\)/);
  assert.doesNotMatch(source, /admin-top-nav/);
});
```

- [ ] **Step 2: Run both tests and verify they fail for the missing integration**

Run: `node --test tests/admin-cms-ui.test.js tests/admin-php-entry.test.js`  
Expected: FAIL on missing script tags and the old `admin-top-nav` layout.

- [ ] **Step 3: Load the new modules before `admin/index.js`**

Add to `Server/php/views/admin-ui.php`:

```html
<script defer src="/Web-App/public/admin/navigation.js"></script>
<script defer src="/Web-App/public/admin/shell.js"></script>
```

Add both globals to `admin-init.js` `dependenciesReady()`.

- [ ] **Step 4: Replace `AdminRouter.renderLayout()` with shell mounting**

In `AdminRouter.init(container)`, construct the shell and use its content target:

```js
this.shell = new window.AdminShell(container, {
  groups: window.AdminNavigation.groups,
  userLabel: 'Developer',
  onNavigate: (viewId) => this.showView(viewId),
  onLogout: () => this.logout()
});
this.shell.mount();
await this.showView('dashboard');
```

Update `showView()` to call `shell.setActive(viewName)`, `shell.setTitle(formatViewName(viewName))`, initialize the selected view in `#admin-main`, then focus `#admin-page-title`. Remove the old top navigation markup and inline shell styles.

- [ ] **Step 5: Run the focused integration tests**

Run: `node --test tests/admin-cms-ui.test.js tests/admin-php-entry.test.js`  
Expected: PASS with the PHP entry still protected and the new shell loaded.

- [ ] **Step 6: Commit the integration**

```bash
git add Server/php/views/admin-ui.php Web-App/public/admin/index.js Web-App/public/admin-init.js tests/admin-php-entry.test.js tests/admin-cms-ui.test.js
git commit -m "refactor: mount admin views in CMS shell"
```

---

### Task 4: Add the Desktop and iPad Visual System

**Files:**
- Modify: `Web-App/public/style.css`
- Modify: `tests/admin-cms-ui.test.js`
- Modify: `tests/vision-framework.test.js`

**Interfaces:**
- Consumes: the class names produced by `AdminShell.render()`.
- Produces: desktop sidebar layout above 980px and modal drawer layout at or below 980px.
- Preserves: existing form, table, card, badge, light-theme, and dark-theme tokens.

- [ ] **Step 1: Write failing CSS-contract tests**

```js
test('admin CMS CSS provides desktop sidebar and iPad drawer behavior', () => {
  const fs = require('node:fs');
  const css = fs.readFileSync(path.join(__dirname, '../Web-App/public/style.css'), 'utf8');
  assert.match(css, /\.admin-cms-layout\s*\{/);
  assert.match(css, /grid-template-columns:\s*260px\s+minmax\(0,\s*1fr\)/);
  assert.match(css, /@media\s*\(max-width:\s*980px\)/);
  assert.match(css, /body\.admin-drawer-open\s+\.admin-cms-sidebar/);
  assert.match(css, /\.admin-table-container\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(css, /min-height:\s*44px/);
});
```

Replace the obsolete `admin shell stays single-column and sidebar-free` assertion in `tests/vision-framework.test.js` with assertions for `.admin-cms-sidebar`, `.admin-cms-content`, and the 980px drawer breakpoint.

- [ ] **Step 2: Run the visual-contract tests and verify failure**

Run: `node --test tests/admin-cms-ui.test.js tests/vision-framework.test.js`  
Expected: FAIL because the CMS classes and drawer breakpoint are absent.

- [ ] **Step 3: Implement the CMS layout styles**

Add styles using the existing CSS custom properties:

```css
.admin-cms-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  min-height: 100vh;
  background: var(--background);
}
.admin-cms-sidebar { background: var(--panel); border-right: 1px solid var(--line); }
.admin-cms-content { min-width: 0; }
.admin-cms-nav-button { min-height: 44px; }
.admin-table-container { max-width: 100%; overflow-x: auto; }
@media (max-width: 980px) {
  .admin-cms-layout { grid-template-columns: minmax(0, 1fr); }
  .admin-cms-sidebar { transform: translateX(-100%); }
  body.admin-drawer-open .admin-cms-sidebar { transform: translateX(0); }
}
```

Complete these selectors with existing theme variables, visible focus states, a backdrop, sticky-but-not-fixed desktop sidebar behavior, compact header, active navigation, responsive one-column forms, and reduced-motion handling. Do not introduce a new color system.

- [ ] **Step 4: Run the visual-contract tests**

Run: `node --test tests/admin-cms-ui.test.js tests/vision-framework.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit the responsive visual system**

```bash
git add Web-App/public/style.css tests/admin-cms-ui.test.js tests/vision-framework.test.js
git commit -m "feat: style responsive admin CMS layout"
```

---

### Task 5: Complete Management Coverage and Correct API Routes

**Files:**
- Modify: `Web-App/public/admin/index.js`
- Modify: `Web-App/public/admin/common.js`
- Modify: `tests/admin-cms-ui.test.js`
- Modify: `tests/api-client-performance.test.js`

**Interfaces:**
- Consumes: existing `AdminInfrastructureView(apiClient, kind)` and PHP `/api/v1/admin/*` routes.
- Produces: independently navigable `backups` and `updates` destinations.
- Produces: shared `AdminCommon.renderState(container, { type, message, retry })` for loading, empty, forbidden, unavailable, and server-error states.

- [ ] **Step 1: Add failing coverage and canonical-route tests**

```js
test('every navigation destination has a router view', () => {
  const fs = require('node:fs');
  const source = fs.readFileSync(path.join(__dirname, '../Web-App/public/admin/index.js'), 'utf8');
  for (const id of require('../Web-App/public/admin/navigation.js').flatten().map((item) => item.id)) {
    assert.match(source, new RegExp(`\\b${id}:`), `missing router view: ${id}`);
  }
});

test('backup mutations use protected admin API routes', () => {
  const fs = require('node:fs');
  const source = fs.readFileSync(path.join(__dirname, '../Web-App/public/admin/index.js'), 'utf8');
  assert.match(source, /post\('\/api\/admin\/backups'/);
  assert.doesNotMatch(source, /post\('\/api\/backups'/);
});
```

- [ ] **Step 2: Run the focused tests and verify missing `backups` view and legacy mutation route failures**

Run: `node --test tests/admin-cms-ui.test.js tests/api-client-performance.test.js`  
Expected: FAIL because the router lacks a `backups` key and posts to `/api/backups`.

- [ ] **Step 3: Separate backup and update presentation without duplicating data access**

Add `backups: new AdminInfrastructureView(apiClient, 'backups')`. Make `title()`, `render()`, and event binding select the backup-only panel for `kind === 'backups'`, while `kind === 'updates'` shows release/update and maintenance controls. Both may load the shared infrastructure snapshot once per view initialization.

Use protected routes for mutations:

```js
await this.api.post('/api/admin/backups', {});
await this.api.post('/api/admin/release/maintenance', payload);
```

Keep provider and connection pages read-only where the PHP router exposes only reads. Label them `Read only on this host` instead of rendering a false edit affordance.

Make dashboard aggregation use `Promise.allSettled()` and map each rejected request to its own `AdminCommon.renderState()` block so a failed audit or backup request does not suppress server, database, user, session, or module status.

- [ ] **Step 4: Add shared state rendering**

Implement `AdminCommon.renderState()` so 401 dispatches the existing logout/session-expired path, 403 renders `Permission required`, 404 renders `Not available on this host`, and 5xx renders a retry button wired only to the current view reload. Use `role="status"` for loading/success and `role="alert"` for actionable failures.

- [ ] **Step 5: Run focused and full test suites**

Run: `node --test tests/admin-cms-ui.test.js tests/api-client-performance.test.js tests/admin-php-entry.test.js`  
Expected: PASS.  
Run: `npm test`  
Expected: all tests PASS with zero failures.

- [ ] **Step 6: Commit management coverage**

```bash
git add Web-App/public/admin/index.js Web-App/public/admin/common.js tests/admin-cms-ui.test.js tests/api-client-performance.test.js
git commit -m "feat: expose complete admin management navigation"
```

---

### Task 6: Add Safe Backup Transfer and Destructive-Action Confirmation

**Files:**
- Modify: `Web-App/public/api-client.js`
- Modify: `Web-App/public/admin/common.js`
- Modify: `Web-App/public/admin/index.js`
- Modify: `Web-App/public/admin/users-view.js`
- Modify: `Web-App/public/admin/roles-view.js`
- Modify: `Web-App/public/admin/modules-view.js`
- Modify: `tests/api-client-performance.test.js`
- Modify: `tests/admin-cms-ui.test.js`

**Interfaces:**
- Produces: `ApiClient.download(endpoint, options) -> { ok, status, blob?, filename?, error? }`.
- Produces: `ApiClient.upload(endpoint, file, options) -> JsonResponse result`, sending the file as `application/octet-stream` with CSRF.
- Produces: `AdminCommon.confirmAction({ action, target, impact }) -> boolean`.
- Consumes: PHP routes `GET /api/v1/admin/backups/{id}/download`, `POST /api/v1/admin/backups/upload`, and `POST /api/v1/admin/backups/{id}/restore`.

- [ ] **Step 1: Write failing binary-transfer and confirmation tests**

```js
test('API client downloads binary backups without JSON parsing', async () => {
  const previousFetch = global.fetch;
  const previousDocument = global.document;
  global.document = { cookie: 'neutral_csrf=test-csrf', querySelector: () => null };
  global.fetch = async () => ({
    ok: true,
    status: 200,
    headers: { get: (name) => name.toLowerCase() === 'content-disposition' ? 'attachment; filename="neutral-backup.enc"' : 'application/octet-stream' },
    blob: async () => new Blob(['encrypted'])
  });
  try {
    const result = await new ApiClient().download('/api/admin/backups/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/download');
    assert.equal(result.ok, true);
    assert.equal(result.filename, 'neutral-backup.enc');
    assert.equal(await result.blob.text(), 'encrypted');
  } finally {
    global.fetch = previousFetch;
    global.document = previousDocument;
  }
});

test('destructive admin actions use the shared explicit confirmation', () => {
  const fs = require('node:fs');
  for (const file of ['users-view.js', 'roles-view.js', 'modules-view.js', 'index.js']) {
    const source = fs.readFileSync(path.join(__dirname, '../Web-App/public/admin', file), 'utf8');
    assert.match(source, /AdminCommon\.confirmAction/);
  }
});
```

- [ ] **Step 2: Run tests and verify the missing-method failures**

Run: `node --test tests/api-client-performance.test.js tests/admin-cms-ui.test.js`  
Expected: FAIL because `download()`, `upload()`, and shared confirmation do not exist.

- [ ] **Step 3: Implement binary download and upload**

Factor the existing timeout and header preparation into private-compatible helpers without changing `request()`. `download()` must call `fetch`, reject non-2xx responses through the existing structured error parser, call `response.blob()` only on success, and derive a sanitized basename from `Content-Disposition`. `upload()` must omit the JSON content type, send the `File`/`Blob` body unchanged, and attach `X-CSRF-Token` from the existing cookie reader.

```js
async upload(endpoint, file, options = {}) {
  return this.request(endpoint, {
    ...options,
    method: 'POST',
    rawBody: file,
    contentType: 'application/octet-stream'
  });
}
```

Extend `request()` so `rawBody` is assigned directly and is never passed to `JSON.stringify()`.

- [ ] **Step 4: Implement one explicit confirmation contract**

```js
confirmAction({ action, target, impact }) {
  return window.confirm(`${action}\n\nTarget: ${target}\nImpact: ${impact}`);
}
```

Require this result before user deletion, role deletion, module uninstallation, backup restore, and any other irreversible action. Cancellation must return before the API call.

- [ ] **Step 5: Complete backup controls**

In the `backups` view, render:

- `Create encrypted backup`, posting `{}` to `/api/admin/backups`;
- `Upload encrypted backup`, accepting one file and using `ApiClient.upload('/api/admin/backups/upload', file)`;
- a `Download` action using `ApiClient.download()` and a temporary object URL;
- a `Restore` action that shows backup ID and the impact `Replaces managed data and ends the current session`, then posts to `/api/admin/backups/{id}/restore` only after confirmation.

Revoke every object URL after triggering the browser download. On successful restore, invoke the existing session-expired/logout path rather than keeping stale admin state visible.

- [ ] **Step 6: Run focused and full tests**

Run: `node --test tests/api-client-performance.test.js tests/admin-cms-ui.test.js tests/admin-php-entry.test.js`  
Expected: PASS.  
Run: `npm test`  
Expected: all tests PASS with zero failures.

- [ ] **Step 7: Commit safe management actions**

```bash
git add Web-App/public/api-client.js Web-App/public/admin/common.js Web-App/public/admin/index.js Web-App/public/admin/users-view.js Web-App/public/admin/roles-view.js Web-App/public/admin/modules-view.js tests/api-client-performance.test.js tests/admin-cms-ui.test.js
git commit -m "feat: add safe backup and destructive admin actions"
```

---

### Task 7: Verify Accessibility, Production Deployment, and Live Layout

**Files:**
- Modify: `PRODUCTION-VERIFICATION.md`
- Modify: `TODO.md`
- Test: `tests/admin-cms-ui.test.js`

**Interfaces:**
- Consumes: completed CMS shell, all feature views, GitHub Actions workflows, and production URL.
- Produces: dated evidence for desktop and iPad-width behavior without storing credentials.

- [ ] **Step 1: Add final accessibility assertions**

```js
test('admin shell exposes keyboard and drawer accessibility state', () => {
  const AdminNavigation = require('../Web-App/public/admin/navigation.js');
  const AdminShell = require('../Web-App/public/admin/shell.js');
  const html = AdminShell.render({ groups: AdminNavigation.groups, userLabel: 'Developer' });
  assert.match(html, /aria-current="page"/);
  assert.match(html, /aria-label="Close administration menu"/);
  assert.match(html, /id="admin-page-title" tabindex="-1"/);
  assert.match(html, /role="status"/);
});
```

- [ ] **Step 2: Run complete local verification**

Run: `git diff --check`  
Expected: no output.  
Run: `npm test`  
Expected: all tests PASS with zero failures.  
Run: `git status --short`  
Expected: only the intentional documentation updates before commit.

- [ ] **Step 3: Update production documentation with measured results**

Record in `PRODUCTION-VERIFICATION.md`: test count, commit, desktop navigation result, 980px drawer result, 320px reflow result, authenticated Developer login, CSRF logout result, and any host-read-only controls. Mark only observations actually performed.

Remove the completed modern Admin/CMS UI item from `TODO.md` or strike it through with the verification date. Do not mark provider writes complete if the server contract remains read-only.

- [ ] **Step 4: Commit and push the verified implementation**

```bash
git add PRODUCTION-VERIFICATION.md TODO.md tests/admin-cms-ui.test.js
git commit -m "docs: verify modern admin CMS production UI"
git push origin main
```

- [ ] **Step 5: Wait for both required workflows**

Run: `gh run list --repo El-Ninjo1965/Neutral --branch main --limit 4`  
Expected: the commit has `Push on main` and `FTPS Deploy` runs.  
Run: `gh run watch RUN_ID --repo El-Ninjo1965/Neutral --exit-status` for each run.  
Expected: both complete successfully.

- [ ] **Step 6: Perform live browser verification**

Open `https://www.turbolikes.com/admin.php?verify=COMMIT` and verify:

- unauthenticated access shows only the login screen;
- Developer login reaches the CMS shell;
- desktop view shows one grouped sidebar and all fifteen destinations;
- 980px and 320px widths show the closed drawer, working menu toggle, one-column forms, and usable tables;
- switching views updates the active item, title, content, and focus;
- logout invokes the protected API flow and returns to login;
- no secret or internal path appears in visible content or browser diagnostics.

- [ ] **Step 7: Verify repository alignment**

Run: `git status --short`  
Expected: no output.  
Run: `git rev-parse HEAD` and `git rev-parse origin/main`  
Expected: identical commit hashes.

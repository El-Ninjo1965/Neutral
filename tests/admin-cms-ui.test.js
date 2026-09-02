'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
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

test('admin router delegates layout and navigation to AdminShell', () => {
  const source = fs.readFileSync(path.join(__dirname, '../Web-App/public/admin/index.js'), 'utf8');
  assert.match(source, /new window\.AdminShell/);
  assert.match(source, /onNavigate:\s*\(viewId\)\s*=>\s*this\.showView\(viewId\)/);
  assert.doesNotMatch(source, /admin-top-nav/);
});

test('admin CMS CSS provides desktop sidebar and iPad drawer behavior', () => {
  const css = fs.readFileSync(path.join(__dirname, '../Web-App/public/style.css'), 'utf8');
  assert.match(css, /\.admin-cms-layout\s*\{/);
  assert.match(css, /grid-template-columns:\s*260px\s+minmax\(0,\s*1fr\)/);
  assert.match(css, /@media\s*\(max-width:\s*980px\)/);
  assert.match(css, /body\.admin-drawer-open\s+\.admin-cms-sidebar/);
  assert.match(css, /\.admin-table-container\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(css, /min-height:\s*44px/);
});

test('every navigation destination has a router view', () => {
  const source = fs.readFileSync(path.join(__dirname, '../Web-App/public/admin/index.js'), 'utf8');
  for (const id of require('../Web-App/public/admin/navigation.js').flatten().map((item) => item.id)) {
    assert.match(source, new RegExp(`\\b${id}:`), `missing router view: ${id}`);
  }
});

test('backup mutations use protected admin API routes', () => {
  const source = fs.readFileSync(path.join(__dirname, '../Web-App/public/admin/index.js'), 'utf8');
  assert.match(source, /post\('\/api\/admin\/backups'/);
  assert.doesNotMatch(source, /post\('\/api\/backups'/);
});

test('shared admin safeguards provide explicit confirmation and recoverable states', () => {
  const { AdminCommon } = require('../Web-App/public/admin/common.js');
  const previousWindow = global.window;
  let prompt = '';
  global.window = { confirm: (message) => { prompt = message; return true; } };
  try {
    assert.equal(AdminCommon.confirmAction('Replace managed data?'), true);
    assert.equal(prompt, 'Replace managed data?');
    const container = { innerHTML: '', querySelector: () => null };
    AdminCommon.renderState(container, { type: 'forbidden' });
    assert.match(container.innerHTML, /role="alert"/);
    assert.match(container.innerHTML, /Permission required/);
  } finally {
    global.window = previousWindow;
  }
});

test('destructive admin actions use the shared explicit confirmation', () => {
  for (const file of ['users-view.js', 'roles-view.js', 'modules-view.js', 'index.js']) {
    const source = fs.readFileSync(path.join(__dirname, `../Web-App/public/admin/${file}`), 'utf8');
    assert.doesNotMatch(source, /\bconfirm\(/, file);
    assert.match(source, /AdminCommon\.confirmAction/, file);
  }
});

test('admin shell exposes a persistent light and dark theme control', () => {
  const AdminShell = require('../Web-App/public/admin/shell.js');
  const html = AdminShell.render({ groups: [], userLabel: 'Developer' });
  assert.match(html, /data-admin-theme/);
  assert.match(html, /Switch to dark mode/);
});

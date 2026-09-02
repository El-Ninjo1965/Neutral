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

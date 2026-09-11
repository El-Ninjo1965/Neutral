'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('operator admin shell, navigation, dashboard and sessions follow the compact contract', () => {
  const nav = require('../Web-App/public/admin/navigation.js');
  const shell = read('Web-App/public/admin/shell.js');
  const admin = read('Web-App/public/admin/index.js');
  assert.deepEqual(nav.groups.find((group) => group.id === 'access').items.map((item) => item.id), ['users', 'licenses', 'packages', 'sessions', 'roles', 'permissions']);
  assert.deepEqual(nav.groups.find((group) => group.id === 'platform').items.slice(0, 2).map((item) => item.id), ['app-modules', 'system-modules']);
  assert.doesNotMatch(shell, /admin-cms-header|admin-view-title/);
  assert.match(shell, /admin-sidebar-theme[\s\S]*<nav[\s\S]*admin-sidebar-logout/);
  assert.match(shell, /data-admin-logout>Logout<\/button>/);
  assert.doesNotMatch(shell, /Logout ·/);
  assert.match(shell, /main\.scrollTop = 0/);
  assert.doesNotMatch(admin, /<h3>Module Status<\/h3>|<h3>Session Overview<\/h3>/);
  assert.doesNotMatch(admin, /<th>Installation \/ Device ID<\/th>|<th>Operating system<\/th>/);
});

test('admin sidebar permits vertical pan without horizontal overflow or intrinsic widening', () => {
  const css = read('Web-App/public/style.css');
  assert.match(css, /\.admin-cms-sidebar\s*\{[^}]*overflow-x:\s*hidden[^}]*overflow-y:\s*auto[^}]*overscroll-behavior-x:\s*none[^}]*touch-action:\s*pan-y/s);
  assert.match(css, /\.admin-cms-nav-button\s*\{[^}]*min-width:\s*0[^}]*max-width:\s*100%[^}]*overflow-x:\s*hidden[^}]*overflow-wrap:\s*anywhere/s);
  assert.doesNotMatch(css, /\.admin-cms-nav-button\s*\{[^}]*overflow-x:\s*auto/s);
});

test('packages, licenses and roles hide their list while editing and restore it on cancel', () => {
  const commerce = read('Web-App/public/admin/commercial-view.js');
  const roles = read('Web-App/public/admin/roles-view.js');
  assert.ok((commerce.match(/\.card-grid'\)\.hidden = true/g) || []).length >= 2);
  assert.ok((commerce.match(/data-cancel-editor/g) || []).length >= 4);
  assert.match(roles, /roles-table-container'\)\.hidden = true/);
  assert.match(roles, /roles-table-container'\)\?\.removeAttribute\('hidden'/);
});

test('user overview is sortable, separates organization, and exposes device limit source', () => {
  const users = read('Web-App/public/admin/users-view.js');
  const auth = read('Server/php/src/Phase4AuthRbac.php');
  assert.doesNotMatch(users, /<th>Email<\/th>/);
  assert.match(users, /data-user-sort/);
  assert.match(users, /Organization/);
  assert.match(users, /System default|User override|Package \$\{user\.packageName/);
  assert.match(auth, /AS organization_name/);
  assert.match(auth, /AUTH_MAX_DEVICES_PER_USER'\] \?\? 1/);
  assert.doesNotMatch(auth, /u\.package_id IS NULL THEN 5/);
});

test('module install failure is projected as not registered and remains retry-safe', () => {
  const runtime = read('Server/php/src/Phase7ModuleRuntime.php');
  assert.match(runtime, /catch \(\\Throwable \$exception\) \{[\s\S]*markInstallFailed/);
  assert.match(runtime, /UPDATE modules SET is_present = 0/);
  assert.match(runtime, /Installation failed; retry is safe/);
});

test('database and backup path tests persist timestamped results and are audited', () => {
  const api = read('Server/public/api/index.php');
  const ui = read('Web-App/public/admin/index.js');
  assert.match(api, /admin\/database\/test/);
  assert.match(api, /lastDatabaseTest/);
  assert.match(api, /database\.connection\.test/);
  assert.match(api, /lastBackupPathTest/);
  assert.match(api, /backup\.storage\.test/);
  assert.match(ui, /Last database test/);
  assert.match(ui, /Last path test/);
});

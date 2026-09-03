'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('admin dependencies publish the browser globals required by admin-init', () => {
  const dependencies = [
    ['common.js', 'AdminCommon', 'object'],
    ['users-view.js', 'AdminUsersView', 'function'],
    ['roles-view.js', 'AdminRolesView', 'function'],
    ['settings-view.js', 'AdminSettingsView', 'function'],
    ['audit-view.js', 'AdminAuditView', 'function'],
    ['modules-view.js', 'AdminModulesView', 'function']
  ];

  for (const [file, globalName, expectedType] of dependencies) {
    const context = vm.createContext({ window: {} });
    const source = fs.readFileSync(path.join(__dirname, `../Web-App/public/admin/${file}`), 'utf8');
    vm.runInContext(source, context, { filename: file });
    assert.equal(typeof context.window[globalName], expectedType, `${file} must publish window.${globalName}`);
  }
});

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
  assert.match(source, /window\.AdminRouter\s*=\s*AdminRouter/);
  assert.match(source, /onNavigate:\s*\(viewId\)\s*=>\s*this\.showView\(viewId\)/);
  assert.doesNotMatch(source, /admin-top-nav/);
});

test('admin logout returns to the deployed root entry', () => {
  const source = fs.readFileSync(path.join(__dirname, '../Web-App/public/admin/index.js'), 'utf8');
  assert.match(source, /location\.replace\(window\.NeutralPublicPath\.admin\(\)\)/);
  assert.doesNotMatch(source, /location\.replace\('\/Server\/public\/admin\.php'\)/);
});

test('public consumers use the central resolver instead of root-absolute public URLs', () => {
  const projectRoot = path.resolve(__dirname, '..');
  const sourceFiles = [
    'Web-App/public/user-app.js',
    'Web-App/public/admin-init.js',
    'Web-App/public/admin/index.js',
    'Web-App/public/master-ui.js',
    'Web-App/core/core-loader.js',
    'Server/public/admin.php',
    'Server/public/setup.php',
    'Server/php/views/admin-ui.php'
  ];

  for (const relativePath of sourceFiles) {
    const source = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
    assert.doesNotMatch(
      source,
      /["'`]\/(?:Web-App|Server\/public|admin\.php|setup\.php)(?:\/|["'`])/,
      relativePath
    );
  }

  for (const relativePath of ['Web-App/public/master-ui.js', 'Web-App/core/core-loader.js', 'Server/public/admin.php']) {
    const source = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
    assert.doesNotMatch(source, /(?:fetchJson|postJson|readModuleCatalog|fetch)\(\s*["'`]\/api(?:\/|["'`])/, relativePath);
  }

  for (const relativePath of [
    'Web-App/core/config-manager.js',
    'Web-App/core/core-admin.js',
    'Web-App/core/master-framework.js',
    'Web-App/core/provider-manager.js',
    'Web-App/public/admin/index.js',
    'Web-App/public/master-ui.js'
  ]) {
    const source = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
    assert.match(source, /NeutralPublicPath\.api\(\s*['"]{2}\s*\)/, relativePath);
    assert.doesNotMatch(source, /(?:\|\||:)\s*['"]\/api['"]/, relativePath);
    assert.doesNotMatch(source, /\$\{(?:getRuntimeOrigin|runtimeOrigin)[^}]*\}\/api/, relativePath);
  }
});

test('entries load the resolver before consumers and PHP injects only safe public config', () => {
  const projectRoot = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(projectRoot, 'Web-App/public/index.html'), 'utf8');
  const adminEntry = fs.readFileSync(path.join(projectRoot, 'Server/public/admin.php'), 'utf8');
  const adminView = fs.readFileSync(path.join(projectRoot, 'Server/php/views/admin-ui.php'), 'utf8');

  assert.match(indexHtml, /<meta name="neutral-base-path" content=""\s*\/?>/);
  assert.ok(indexHtml.indexOf('public-path.js') < indexHtml.indexOf('core-loader.js'));
  assert.ok(indexHtml.indexOf('public-path.js') < indexHtml.indexOf('user-app.js'));
  const publicConfig = adminEntry.match(/\$publicConfig\s*=\s*\[([\s\S]*?)\];/);
  assert.ok(publicConfig, 'admin entry must define the public browser configuration');
  assert.deepEqual(
    [...publicConfig[1].matchAll(/'([^']+)'\s*=>/g)].map((match) => match[1]),
    ['basePath', 'apiBase']
  );
  assert.match(adminEntry, /'basePath'\s*=>\s*\$runtime->config\(\)->basePath\(\)/);
  assert.match(adminEntry, /'apiBase'\s*=>\s*\$runtime->config\(\)->apiBase\(\)/);
  for (const flag of ['JSON_HEX_TAG', 'JSON_HEX_AMP', 'JSON_HEX_APOS', 'JSON_HEX_QUOT']) {
    assert.match(adminEntry, new RegExp(flag));
  }
  assert.doesNotMatch(adminEntry, /NeutralConfig[\s\S]{0,200}->env\(/);
  assert.ok(adminView.indexOf('window.NeutralConfig') < adminView.indexOf('public-path.js'));
  assert.ok(adminView.indexOf('public-path.js') < adminView.indexOf('api-client.js'));
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

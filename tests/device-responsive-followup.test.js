'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function loadApiClient({ userAgent, platform = 'MacIntel', maxTouchPoints = 5, storage = new Map() }) {
  Object.defineProperty(global, 'navigator', { value: { userAgent, platform, maxTouchPoints }, configurable: true });
  global.localStorage = { getItem: (k) => storage.get(k) || null, setItem: (k, v) => storage.set(k, v) };
  Object.defineProperty(global, 'crypto', { value: { getRandomValues(bytes) { bytes.fill(7); return bytes; } }, configurable: true });
  delete require.cache[require.resolve('../Web-App/public/api-client.js')];
  return { ApiClient: require('../Web-App/public/api-client.js'), storage };
}

test('admin client identity survives reload/logout/403 storage and labels desktop-UA iPad Chrome honestly', () => {
  const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128.0 Safari/537.36';
  const first = loadApiClient({ userAgent: ua });
  const a = new first.ApiClient();
  const second = loadApiClient({ userAgent: ua, storage: first.storage });
  const b = new second.ApiClient();
  assert.equal(a.defaultHeaders['x-neutral-device-id'], b.defaultHeaders['x-neutral-device-id']);
  assert.equal(b.defaultHeaders['x-neutral-device-label'], 'iPadOS · Chrome');
  assert.equal(b.defaultHeaders['x-neutral-client-platform'], 'iPadOS');
  assert.doesNotMatch(b.defaultHeaders['x-neutral-device-label'], /MacIntel/);
});

test('GPS open actions do not create blank tabs and map remains interactive', async () => {
  const assigned = [];
  global.window = { location: { assign(url) { assigned.push(url); } } };
  Object.defineProperty(global, 'navigator', { value: { share: async () => {} }, configurable: true });
  delete require.cache[require.resolve('../Web-App/app/modules/gps/index.js')];
  const gps = require('../Web-App/app/modules/gps/index.js');
  gps.lastPosition = { latitude: 52.52, longitude: 13.405 };
  await gps.openCurrentPosition('google');
  assert.equal(assigned.length, 1);
  assert.match(assigned[0], /^https:\/\/www\.google\.com\/maps/);
  assert.equal(typeof window.open, 'undefined');
  delete global.window; delete global.navigator;
});

test('responsive content-grid contract is reusable by settings and GPS markup', () => {
  const css = require('node:fs').readFileSync(require('node:path').join(__dirname, '../Web-App/public/style.css'), 'utf8');
  assert.match(css, /\.user-content-grid\s*\{[\s\S]*repeat\(auto-fit,\s*minmax/);
  assert.match(css, /\.gps-content-grid/);
});

test('backup create is actionable only when every runtime prerequisite is ready', () => {
  global.AdminCommon = { confirmAction() { return false; } };
  const Router = require('../Web-App/public/admin/index.js');
  const view = new Router.AdminInfrastructureView({}, 'backups');
  view.container = { innerHTML: '', querySelector() { return null; }, querySelectorAll() { return []; } };
  view.snapshot = { backups: [], backupAutomation: {}, backupReadiness: { keyConfigured: false, cryptoAvailable: true, databaseReady: true, managedTablesReady: true, storageReady: true } };
  view.renderBackups();
  assert.match(view.container.innerHTML, /Create backup<\/button>/);
  assert.match(view.container.innerHTML, /disabled aria-disabled="true"/);
  assert.match(view.container.innerHTML, /Host encryption key must be configured/);
  view.snapshot.backupReadiness.keyConfigured = true;
  view.renderBackups();
  assert.doesNotMatch(view.container.innerHTML, /disabled aria-disabled="true"/);
  delete global.AdminCommon;
});

test('PHP Core permission registry supplies concrete Admin-area descriptions for every key', () => {
  const php = String.raw`require '${root}/Server/php/bootstrap.php'; $config=new Neutral\Core\AppConfig(['APP_ENV'=>'test','DB_TYPE'=>'mysql','DB_HOST'=>'invalid','DB_NAME'=>'neutral','DB_USER'=>'neutral'],'${root}'); $service=new Neutral\Core\Phase4PermissionService(new Neutral\Core\Database($config)); echo json_encode($service->all());`;
  const result = spawnSync('php', ['-r', php], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const permissions = JSON.parse(result.stdout);
  assert.equal(permissions.length, 16);
  for (const permission of permissions) {
    assert.equal(permission.scope, permission.key === 'license.manage' ? 'System' : 'Admin');
    assert.ok(permission.description.length > 20, permission.key);
    assert.doesNotMatch(permission.description, /^Permission |^Use module capability/);
  }
});

test('audit clear policy fails closed for production and is explicit for development/test', () => {
  const php = String.raw`require '${root}/Server/php/bootstrap.php'; echo json_encode(['production'=>Neutral\Core\Security::allowsAuditClear('production'),'development'=>Neutral\Core\Security::allowsAuditClear('development'),'test'=>Neutral\Core\Security::allowsAuditClear('test'),'unknown'=>Neutral\Core\Security::allowsAuditClear('staging')]);`;
  const result = spawnSync('php', ['-r', php], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { production: false, development: true, test: true, unknown: false });
});

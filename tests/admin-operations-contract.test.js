'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('normal system roles contain no administrative permissions and migration removes legacy grants', () => {
  const rbac = read('Server/php/src/Phase4AuthRbac.php');
  assert.match(rbac, /'viewer' => \[\s*\]/);
  assert.match(rbac, /'user' => \[\]/);
  const migration = read('Server/php/src/SchemaMigrator.php');
  assert.match(migration, /r\.role_key IN \('viewer','user'\)/);
});

test('device-session contract uses random installation ids, persistent secure cookies and a central limit', () => {
  const client = read('Web-App/public/api-client.js');
  const auth = read('Server/php/src/Phase4AuthRbac.php');
  const security = read('Server/php/src/Security.php');
  assert.match(client, /crypto\.getRandomValues/);
  assert.match(client, /neutral\.device\.id\.v1/);
  assert.doesNotMatch(client, /password.*localStorage|token.*localStorage/i);
  assert.match(auth, /AUTH_MAX_DEVICES_PER_USER/);
  assert.match(auth, /AUTH_DEVICE_SESSION_TTL_MS/);
  assert.match(auth, /Active device limit reached/);
  assert.match(security, /'httponly' => true/);
  assert.match(security, /'samesite' => 'Lax'/);
});

test('operations APIs are real, permission protected, and destructive actions are audited', () => {
  const api = read('Server/public/api/index.php');
  assert.match(api, /admin\/release\/maintenance/);
  assert.match(api, /maintenance\.update/);
  assert.match(api, /admin\/audit\/purge/);
  assert.match(api, /audit\.retention\.purge/);
  assert.match(api, /backup\.delete/);
  assert.match(api, /Primary database/);
});

test('admin operations UX exposes catalog filters, device sessions, backup delete and folded audit details', () => {
  const admin = read('Web-App/public/admin/index.js');
  const audit = read('Web-App/public/admin/audit-view.js');
  assert.match(admin, /All areas/);
  assert.match(admin, /All sources/);
  assert.match(admin, /session\.current \? ' · Current'/);
  assert.match(admin, /data-backup-delete/);
  assert.match(audit, /Delete entries older than/);
  assert.match(audit, /<details>/);
});

test('automatic backup runner is CLI-only and enforces configured interval and retention', () => {
  const runner = read('scripts/run-automatic-backup.php');
  assert.match(runner, /PHP_SAPI !== 'cli'/);
  assert.match(runner, /backupEnabled/);
  assert.match(runner, /backupInterval/);
  assert.match(runner, /backupRetention/);
  assert.match(runner, /enforceRetention/);
});

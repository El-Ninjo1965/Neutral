'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

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

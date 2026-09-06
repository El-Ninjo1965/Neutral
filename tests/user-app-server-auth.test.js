'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

// Regression test for the device-live finding "Tester/Developer cannot log in
// through the real User-App UI". Root cause: user-app.js only ever called the
// local, storage-only developer bootstrap (LocalAuth), never the real,
// database-backed server session endpoint used by the Admin UI. This test
// pins the architecture so the User-App login path can never silently regress
// back to the local-only bootstrap.

test('User-App login submit calls the real server auth endpoint, not the local developer bootstrap', () => {
  const source = read('Web-App/public/user-app.js');

  const submitBlock = source.match(/submit\.addEventListener\('click', async \(\) => \{[\s\S]*?\n  \};/);
  assert.ok(submitBlock, 'login submit handler must exist');
  const handler = submitBlock[0];

  assert.match(handler, /apiClient\.login\(username, password\)/);
  assert.match(handler, /getServerApiClient\(\)/);
  assert.doesNotMatch(handler, /window\.LocalAuth\.login/);
  assert.doesNotMatch(handler, /LocalAuth/);
});

test('User-App logout ends the real server session, not just local state', () => {
  const source = read('Web-App/public/user-app.js');

  const logoutBlock = source.match(/logoutButton\.addEventListener\('click', async \(\) => \{[\s\S]*?\n\s*\}\);/);
  assert.ok(logoutBlock, 'logout handler must exist');
  assert.match(logoutBlock[0], /apiClient\.logout\(\)/);
  assert.doesNotMatch(logoutBlock[0], /LocalAuth/);
});

test('User-App restores an existing session via the server /api/auth/me endpoint on load', () => {
  const source = read('Web-App/public/user-app.js');

  assert.match(source, /const restoreServerSession = async \(\) => \{/);
  assert.match(source, /apiClient\.me\(\)/);
  assert.match(source, /await restoreServerSession\(\);/);
});

test('User-App getCurrentUser only reflects the confirmed server identity', () => {
  const source = read('Web-App/public/user-app.js');

  assert.match(source, /const getCurrentUser = \(\) => serverUser;/);
});

test('index.html loads the server API client before the User-App shell so login can reach the server', () => {
  const indexHtml = read('Web-App/public/index.html');

  assert.ok(indexHtml.includes('api-client.js'), 'index.html must load api-client.js');
  assert.ok(
    indexHtml.indexOf('api-client.js') < indexHtml.indexOf('user-app.js'),
    'api-client.js must load before user-app.js'
  );
});

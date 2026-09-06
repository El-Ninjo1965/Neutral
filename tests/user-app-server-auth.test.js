'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

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

test('ApiClient exports to the global runtime surface used by app shells and user contexts', () => {
  const apiClientSource = read('Web-App/public/api-client.js');
  assert.match(apiClientSource, /globalThis\.ApiClient\s*=\s*ApiClient/);

  const userAppSource = read('Web-App/public/user-app.js');
  assert.match(userAppSource, /globalThis\s*!==\s*'undefined'\s*\?\s*globalThis\s*:\s*\(typeof window/);
});

test('Production host rewrite exposes api-client.js at the public root so the User-App can access the real auth client', () => {
  const htaccess = read('.htaccess');

  assert.match(htaccess, /RewriteRule \^api-client\\\.js\$ Web-App\/public\/api-client\.js \[L\]/);
  assert.match(htaccess, /RewriteRule \^user-app\\\.js\$/);
  assert.match(htaccess, /RewriteRule \^public-path\\\.js\$/);
});

test('User-App unwraps the real PHP /api/auth/login response envelope before applying the authenticated user', () => {
  const source = read('Web-App/public/user-app.js');
  const extractMatch = source.match(/const extractServerAuthData = \(result\) => \{[\s\S]*?\n  \};/);
  const normalizeMatch = source.match(/const normalizeServerUser = \(identityData\) => \{[\s\S]*?\n  \};/);

  assert.ok(extractMatch, 'extractServerAuthData helper must exist');
  assert.ok(normalizeMatch, 'normalizeServerUser helper must exist');

  const sandbox = {
    console,
    Array,
    Date,
    Map,
    Set,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    JSON
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;

  vm.runInNewContext(`${extractMatch[0]}\n${normalizeMatch[0]}\nsandbox.extractServerAuthData = extractServerAuthData;\nsandbox.normalizeServerUser = normalizeServerUser;`, { ...sandbox, sandbox });

  // 1. Exact structure returned by ApiClient.post('/api/auth/login') against the PHP backend
  const phpHttpResult = {
    ok: true,
    status: 200,
    data: {
      ok: true,
      data: {
        via: 'session',
        user: {
          id: '102',
          username: 'tester',
          displayName: 'Tester',
          email: 'tester@example.com',
          status: 'active',
          roles: ['user'],
          permissions: ['user:read'],
          createdAt: '2026-03-24T18:00:00Z',
          updatedAt: '2026-03-24T18:00:00Z'
        },
        roles: ['user'],
        permissions: ['user:read'],
        csrfToken: 'php-csrf-token-abc',
        expiresAt: '2026-09-06T12:00:00Z'
      }
    }
  };

  // 2. Exact structure returned by ApiClient.me() against PHP backend
  const phpMeHttpResult = {
    ok: true,
    status: 200,
    data: {
      ok: true,
      data: {
        via: 'session',
        user: {
          id: '102',
          username: 'tester',
          displayName: 'Tester',
          email: 'tester@example.com',
          status: 'active',
          roles: ['user'],
          permissions: ['user:read']
        },
        roles: ['user'],
        permissions: ['user:read']
      }
    }
  };

  // 3. Node test backend structure
  const nodeHttpResult = {
    ok: true,
    status: 200,
    data: {
      ok: true,
      user: {
        id: '101',
        username: 'developer',
        displayName: 'Developer',
        email: 'dev@example.com',
        roles: ['developer'],
        permissions: ['system:view', 'module:read']
      },
      roles: ['developer'],
      permissions: ['system:view', 'module:read']
    }
  };

  const phpUser = sandbox.normalizeServerUser(sandbox.extractServerAuthData(phpHttpResult));
  assert.ok(phpUser, 'PHP login response must yield an authenticated user');
  assert.equal(phpUser.username, 'tester');
  assert.deepEqual(phpUser.roles, ['user']);
  assert.deepEqual(phpUser.permissions, ['user:read']);

  const phpMeUser = sandbox.normalizeServerUser(sandbox.extractServerAuthData(phpMeHttpResult));
  assert.ok(phpMeUser, 'PHP /api/auth/me response must yield an authenticated user');
  assert.equal(phpMeUser.username, 'tester');

  const nodeUser = sandbox.normalizeServerUser(sandbox.extractServerAuthData(nodeHttpResult));
  assert.ok(nodeUser, 'Node login response must yield an authenticated user');
  assert.equal(nodeUser.username, 'developer');
  assert.deepEqual(nodeUser.roles, ['developer']);
});

test('ApiClient extracts CSRF token from PHP JsonResponse envelope upon login', async () => {
  const ApiClient = require('../Web-App/public/api-client.js');
  const client = new ApiClient();

  const phpEnvelopeResult = {
    ok: true,
    status: 200,
    data: {
      ok: true,
      data: {
        via: 'session',
        user: { id: '102', username: 'tester' },
        roles: ['user'],
        csrfToken: 'csrf-token-from-php-envelope',
        expiresAt: '2026-09-06T12:00:00Z'
      }
    }
  };

  // Stub post to return the PHP envelope
  client.post = async () => phpEnvelopeResult;
  await client.login('tester', 'password123');

  assert.equal(client.csrfToken, 'csrf-token-from-php-envelope');
});

test('Master-UI unwraps the real PHP /api/auth/login response envelope and sets up authenticated admin/developer identity', () => {
  const source = read('Web-App/public/master-ui.js');
  const extractMatch = source.match(/const extractApiData = \(result\) => \{[\s\S]*?\n  \};/);
  const applyMatch = source.match(/const applyServerIdentity = \(identityData\) => \{[\s\S]*?\n  \};/);

  assert.ok(extractMatch, 'extractApiData helper must exist');
  assert.ok(applyMatch, 'applyServerIdentity helper must exist');

  const sandbox = {
    console,
    Array,
    Date,
    Map,
    Set,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    JSON,
    serverAuthenticatedUser: null,
    window: {}
  };
  sandbox.globalThis = sandbox;

  vm.runInNewContext(`
    let serverAuthenticatedUser = null;
    ${extractMatch[0]}
    ${applyMatch[0]}
    sandbox.extractApiData = extractApiData;
    sandbox.applyServerIdentity = applyServerIdentity;
  `, { ...sandbox, sandbox });

  const phpLoginResult = {
    ok: true,
    status: 200,
    data: {
      ok: true,
      data: {
        via: 'session',
        user: {
          id: '101',
          username: 'developer',
          displayName: 'Developer',
          email: 'dev@example.com',
          status: 'active',
          roles: ['developer'],
          permissions: ['system:view', 'module:read']
        },
        roles: ['developer'],
        permissions: ['system:view', 'module:read'],
        csrfToken: 'csrf-token-php',
        expiresAt: '2026-09-06T12:00:00Z'
      }
    }
  };

  const extracted = sandbox.extractApiData(phpLoginResult);
  assert.ok(extracted, 'PHP envelope must be extracted');
  const user = sandbox.applyServerIdentity(extracted);
  assert.ok(user, 'User must be authenticated');
  assert.equal(user.username, 'developer');
  assert.deepEqual(user.roles, ['developer']);
});

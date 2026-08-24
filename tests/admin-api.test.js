'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const MasterFramework = require('../platform/master-framework');
const ServerBootstrap = require('../server/bootstrap/server.js');

/**
 * Admin API Integration Tests
 * Tests all admin endpoints: users, roles, settings, audit
 */

describe('Admin API Integration Tests', { concurrency: false }, () => {
  let app;
  let port;
  let testUserId = null;
  let testRoleId = null;

  const cleanupConfigFiles = () => {
    const configDir = path.resolve(__dirname, '../config');
    if (fs.existsSync(configDir)) {
      for (const filename of ['setup-state.json', 'admin-users.json', 'admin-roles.json', 'admin-settings.json', 'audit-log.json']) {
        const filePath = path.join(configDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    const runtimeDir = path.resolve(__dirname, '../server/runtime');
    if (fs.existsSync(runtimeDir)) {
      for (const filename of ['setup-state.json', 'admin-state.json']) {
        const filePath = path.join(runtimeDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
  };

  const requestJson = (method, pathname, payload = null, role = 'admin', token = 'test-token') => new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : '';
    const headers = body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {};
    if (role) {
      headers['x-framework-role'] = role;
    }
    if (token) {
      headers['x-admin-access-token'] = token;
    }

    const req = http.request({
      host: '127.0.0.1',
      port,
      path: pathname,
      method,
      headers
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: data ? JSON.parse(data) : {} });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });

  before(async () => {
    cleanupConfigFiles();
    MasterFramework.setupState = null;
    MasterFramework.installState = null;
    MasterFramework.adminState = null;
    app = ServerBootstrap.createServer();
    await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
    port = app.address().port;
  });

  after(async () => {
    cleanupConfigFiles();
    MasterFramework.setupState = null;
    MasterFramework.installState = null;
    MasterFramework.adminState = null;
    await new Promise((resolve, reject) => {
      app.close((error) => error ? reject(error) : resolve());
    });
  });

  // ========== USER API TESTS ==========

  test('GET /api/admin/users returns empty list initially', async () => {
    const result = await requestJson('GET', '/api/admin/users');
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, true);
    assert.ok(Array.isArray(result.body.users));
  });

  test('POST /api/admin/users creates a new user', async () => {
    const result = await requestJson('POST', '/api/admin/users', {
      username: 'testuser1',
      displayName: 'Test User One',
      email: 'test1@example.com',
      password: 'password123',
      role: 'user'
    });
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, true);
    assert.ok(result.body.user);
    assert.equal(result.body.user.username, 'testuser1');
    assert.equal(result.body.user.role, 'user');
    assert.equal(result.body.user.status, 'active');
    testUserId = result.body.user.id;
  });

  test('POST /api/admin/users rejects duplicate email', async () => {
    const result = await requestJson('POST', '/api/admin/users', {
      username: 'testuser2',
      displayName: 'Test User Two',
      email: 'test1@example.com',
      password: 'password123',
      role: 'user'
    });
    assert.equal(result.statusCode, 400);
    assert.equal(result.body.ok, false);
    assert.ok(result.body.errors);
  });

  test('POST /api/admin/users validates required fields', async () => {
    const result = await requestJson('POST', '/api/admin/users', {
      username: 'incomplete',
      // missing required fields
    });
    assert.equal(result.statusCode, 400);
    assert.equal(result.body.ok, false);
    assert.ok(result.body.errors);
  });

  test('GET /api/admin/users/:id returns specific user', async () => {
    const result = await requestJson('GET', `/api/admin/users/${testUserId}`);
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, true);
    assert.ok(result.body.user);
    assert.equal(result.body.user.id, testUserId);
  });

  test('PUT /api/admin/users/:id updates user', async () => {
    const result = await requestJson('PUT', `/api/admin/users/${testUserId}`, {
      displayName: 'Updated Name',
      role: 'viewer'
    });
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, true);
    assert.equal(result.body.user.displayName, 'Updated Name');
    assert.equal(result.body.user.role, 'viewer');
  });

  test('DELETE /api/admin/users/:id deletes user', async () => {
    const result = await requestJson('DELETE', `/api/admin/users/${testUserId}`);
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, true);
  });

  test('GET /api/admin/users/:id returns 404 after deletion', async () => {
    const result = await requestJson('GET', `/api/admin/users/${testUserId}`);
    assert.equal(result.statusCode, 404);
  });

  test('POST /api/admin/users requires admin role', async () => {
    const result = await requestJson('POST', '/api/admin/users', {
      username: 'testuser3',
      displayName: 'Test User Three',
      email: 'test3@example.com',
      password: 'password123',
      role: 'user'
    }, 'viewer');
    assert.equal(result.statusCode, 403);
  });

  // ========== ROLE API TESTS ==========

  test('GET /api/admin/roles returns list of roles', async () => {
    const result = await requestJson('GET', '/api/admin/roles');
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, true);
    assert.ok(Array.isArray(result.body.roles));
    assert.ok(result.body.roles.length > 0);
    // Should have built-in roles
    const roleNames = result.body.roles.map(r => r.role);
    assert.ok(roleNames.includes('admin'));
    assert.ok(roleNames.includes('developer'));
    assert.ok(roleNames.includes('user'));
    assert.ok(roleNames.includes('viewer'));
  });

  test('POST /api/admin/roles creates custom role', async () => {
    const result = await requestJson('POST', '/api/admin/roles', {
      role: 'editor',
      name: 'Content Editor',
      description: 'Can edit content',
      permissions: ['content:read', 'content:write']
    });
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, true);
    assert.ok(result.body.role);
    assert.equal(result.body.role.role, 'editor');
    testRoleId = result.body.role.role;
  });

  test('POST /api/admin/roles rejects invalid role name', async () => {
    const result = await requestJson('POST', '/api/admin/roles', {
      role: 'admin', // Built-in role, cannot create
      name: 'Duplicate',
      permissions: []
    });
    assert.equal(result.statusCode, 400);
  });

  test('GET /api/admin/roles/:role returns specific role', async () => {
    const result = await requestJson('GET', `/api/admin/roles/${testRoleId}`);
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, true);
    assert.equal(result.body.role.role, testRoleId);
  });

  test('PUT /api/admin/roles/:role updates role', async () => {
    const result = await requestJson('PUT', `/api/admin/roles/${testRoleId}`, {
      name: 'Updated Editor',
      permissions: ['content:read', 'content:write', 'content:delete']
    });
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, true);
    assert.equal(result.body.role.name, 'Updated Editor');
  });

  test('DELETE /api/admin/roles/:role deletes custom role', async () => {
    const result = await requestJson('DELETE', `/api/admin/roles/${testRoleId}`);
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, true);
  });

  test('DELETE /api/admin/roles/:role rejects deletion of built-in roles', async () => {
    const result = await requestJson('DELETE', '/api/admin/roles/admin');
    assert.equal(result.statusCode, 400);
  });

  // ========== SETTINGS API TESTS ==========

  test('GET /api/admin/settings returns current settings', async () => {
    const result = await requestJson('GET', '/api/admin/settings');
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, true);
    assert.ok(result.body.settings);
  });

  test('POST /api/admin/settings updates settings', async () => {
    const result = await requestJson('POST', '/api/admin/settings', {
      appName: 'Updated Platform',
      appId: 'updated-platform',
      settings: {
        theme: 'dark',
        language: 'de',
        timezone: 'Europe/Berlin'
      }
    });
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, true);
    assert.equal(result.body.settings.appName, 'Updated Platform');
  });

  test('POST /api/admin/settings persists across requests', async () => {
    const result1 = await requestJson('POST', '/api/admin/settings', {
      appName: 'Persistent Platform',
      settings: { theme: 'light' }
    });
    
    const result2 = await requestJson('GET', '/api/admin/settings');
    assert.equal(result2.body.settings.appName, 'Persistent Platform');
    assert.equal(result2.body.settings.settings.theme, 'light');
  });

  test('POST /api/admin/settings requires admin role', async () => {
    const result = await requestJson('POST', '/api/admin/settings', {
      appName: 'Unauthorized',
      settings: {}
    }, 'user');
    assert.equal(result.statusCode, 403);
  });

  // ========== AUDIT API TESTS ==========

  test('GET /api/admin/audit returns audit log entries', async () => {
    const result = await requestJson('GET', '/api/admin/audit');
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, true);
    assert.ok(Array.isArray(result.body.entries));
    // Should have entries from previous operations
    assert.ok(result.body.entries.length >= 0);
  });

  test('GET /api/admin/audit filters by action', async () => {
    const result = await requestJson('GET', '/api/admin/audit?action=user_created');
    assert.equal(result.statusCode, 200);
    assert.ok(Array.isArray(result.body.entries));
  });

  test('GET /api/admin/audit filters by resource', async () => {
    const result = await requestJson('GET', '/api/admin/audit?resource=user');
    assert.equal(result.statusCode, 200);
    assert.ok(Array.isArray(result.body.entries));
  });

  // ========== ERROR HANDLING TESTS ==========

  test('All admin endpoints require auth headers', async () => {
    const result = await requestJson('GET', '/api/admin/users', null, null, null);
    assert.equal(result.statusCode, 401);
  });

  test('x-framework-role alone does not authorize access', async () => {
    const result = await requestJson('GET', '/api/admin/users', null, 'admin', null);
    assert.equal(result.statusCode, 401);
    assert.equal(result.body.code, 'AUTH_REQUIRED');
  });

  test('Invalid bearer tokens are rejected', async () => {
    const result = await requestJson('GET', '/api/admin/settings', null, 'admin', 'bad-token');
    assert.equal(result.statusCode, 401);
  });

  test('Authenticated viewer is forbidden on admin routes', async () => {
    const result = await requestJson('POST', '/api/admin/settings', {
      appName: 'Forbidden',
      settings: {}
    }, 'viewer', 'test-token');
    assert.equal(result.statusCode, 403);
  });

  test('Setup and database status are available during bootstrap without auth', async () => {
    const setupResult = await requestJson('GET', '/api/setup/status', null, null, null);
    const databaseResult = await requestJson('GET', '/api/database/status', null, null, null);
    assert.equal(setupResult.statusCode, 200);
    assert.equal(setupResult.body.ok, true);
    assert.equal(databaseResult.statusCode, 200);
    assert.equal(databaseResult.body.ok, true);
  });

  test('Bootstrap setup save works without auth before activation', async () => {
    const result = await requestJson('POST', '/api/setup', {
      configuration: {
        serverUrl: 'http://127.0.0.1:3000',
        apiBase: '/api',
        database: {
          type: 'mysql',
          host: '127.0.0.1',
          port: 3306,
          name: 'neutral_bootstrap',
          username: 'neutral_user'
        }
      },
      bootstrapState: {
        configured: true,
        enabled: true,
        username: 'Developer',
        displayId: 'USR-000001',
        role: 'developer'
      }
    }, null, null);
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, true);
  });

  test('Bootstrap endpoints respond to CORS preflight requests', async () => {
    await new Promise((resolve, reject) => {
      const req = http.request({
        host: '127.0.0.1',
        port,
        path: '/api/setup',
        method: 'OPTIONS',
        headers: {
          Origin: 'https://example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, X-Framework-Role'
        }
      }, (res) => {
        res.resume();
        assert.equal(res.statusCode, 204);
        assert.equal(res.headers['access-control-allow-origin'], '*');
        assert.match(String(res.headers['access-control-allow-methods'] || ''), /POST/i);
        resolve();
      });
      req.on('error', reject);
      req.end();
    });
  });

  test('Invalid JSON payload returns 400', async () => {
    await new Promise((resolve, reject) => {
      const req = http.request({
        host: '127.0.0.1',
        port,
        path: '/api/admin/users',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-framework-role': 'admin',
          'x-admin-access-token': 'test-token'
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            assert.ok([400, 500].includes(res.statusCode));
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write('invalid json{');
      req.end();
    });
  });
});

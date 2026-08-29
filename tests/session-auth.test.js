'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const ServerBootstrap = require('../Server/node/bootstrap/server.js');
const userService = require('../Server/node/services/user-service');
const authService = require('../Server/node/services/auth-service');
const loginRateLimiter = require('../Server/node/services/login-rate-limiter');
const { MemorySessionStore, FileSessionStore } = require('../Server/node/services/session-store');

/**
 * Phase 5B Integration Tests
 *
 * Covers the session-based authentication layer added alongside the
 * existing static-token auth from Phase 5A: login, session validation,
 * logout, expiry, roles, CSRF, and session-store swap-ability
 * (memory vs. file vs. two app "instances" sharing a store).
 */

describe('Phase 5B - Session Auth Integration Tests', { concurrency: false }, () => {
  let app;
  let port;

  const configDir = path.resolve(__dirname, '../Server/config');

  const cleanupConfigFiles = () => {
    if (!fs.existsSync(configDir)) {
      return;
    }
    for (const filename of ['setup-state.json', 'admin-users.json', 'admin-roles.json', 'admin-settings.json', 'audit-log.json', 'sessions.json']) {
      const filePath = path.join(configDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  };

  const parseSetCookies = (res) => {
    const raw = res.headers['set-cookie'] || [];
    const jar = {};
    raw.forEach((entry) => {
      const [pair] = entry.split(';');
      const index = pair.indexOf('=');
      if (index === -1) {
        return;
      }
      jar[pair.slice(0, index).trim()] = decodeURIComponent(pair.slice(index + 1).trim());
    });
    return jar;
  };

  const rawRequest = (method, pathname, { payload = null, cookies = {}, headers = {} } = {}) => new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : '';
    const cookieHeader = Object.entries(cookies).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('; ');

    const reqHeaders = { ...headers };
    if (body) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(body);
    }
    if (cookieHeader) {
      reqHeaders.Cookie = cookieHeader;
    }

    const req = http.request({ host: '127.0.0.1', port, path: pathname, method, headers: reqHeaders }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : {},
            cookies: parseSetCookies(res)
          });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });

  const requestJson = (method, pathname, payload = null, role = 'admin', token = 'test-token') => new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : '';
    const headers = body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {};
    if (role) headers['x-framework-role'] = role;
    if (token) headers['x-admin-access-token'] = token;

    const req = http.request({ host: '127.0.0.1', port, path: pathname, method, headers }, (res) => {
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

  const createTestUser = async (overrides = {}) => requestJson('POST', '/api/admin/users', {
    username: 'sessuser',
    displayName: 'Session User',
    email: 'sessuser@example.com',
    password: 'correct-horse-battery-staple',
    role: 'admin',
    ...overrides
  });

  before(async () => {
    cleanupConfigFiles();
    process.env.CORE_BOOTSTRAP_USERNAME = 'bootstrap-login-user';
    process.env.CORE_BOOTSTRAP_PASSWORD = 'correct-horse-battery-staple';
    app = ServerBootstrap.createServer();
    await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
    port = app.address().port;
  });

  after(async () => {
    cleanupConfigFiles();
    await new Promise((resolve, reject) => {
      app.close((error) => error ? reject(error) : resolve());
    });
  });

  beforeEach(() => {
    loginRateLimiter.reset();
  });

  test('1. Login succeeds with valid credentials and sets session + CSRF cookies', async () => {
    await createTestUser({ username: 'login-ok', email: 'login-ok@example.com' });
    const result = await rawRequest('POST', '/api/auth/login', { payload: { username: 'login-ok', password: 'correct-horse-battery-staple' } });

    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, true);
    assert.ok(result.cookies.neutral_session);
    assert.ok(result.cookies.neutral_csrf);
  });

  test('2. Bootstrap admin is created from env values when no seeded admin exists', async () => {
    const username = process.env.CORE_BOOTSTRAP_USERNAME || 'bootstrap-login-user';
    const password = process.env.CORE_BOOTSTRAP_PASSWORD || 'correct-horse-battery-staple';
    const result = await rawRequest('POST', '/api/auth/login', { payload: { username, password } });

    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, true);
    assert.ok(result.cookies.neutral_session);
    assert.ok(result.cookies.neutral_csrf);
    assert.equal(result.body.user.username, username);
  });

  test('3. Login fails with wrong password', async () => {
    await createTestUser({ username: 'login-bad', email: 'login-bad@example.com' });
    const result = await rawRequest('POST', '/api/auth/login', { payload: { username: 'login-bad', password: 'wrong-password' } });

    assert.equal(result.statusCode, 401);
    assert.equal(result.body.ok, false);
    assert.equal(result.body.code, 'INVALID_CREDENTIALS');
  });

  test('4. Session is created and reflected in /api/auth/me', async () => {
    await createTestUser({ username: 'sess-create', email: 'sess-create@example.com' });
    const login = await rawRequest('POST', '/api/auth/login', { payload: { username: 'sess-create', password: 'correct-horse-battery-staple' } });

    const me = await rawRequest('GET', '/api/auth/me', { cookies: { neutral_session: login.cookies.neutral_session } });
    assert.equal(me.statusCode, 200);
    assert.equal(me.body.ok, true);
    assert.equal(me.body.via, 'session');
    assert.equal(me.body.user.username, 'sess-create');
  });

  test('4. Session validation rejects unknown session ids', async () => {
    const me = await rawRequest('GET', '/api/auth/me', { cookies: { neutral_session: 'not-a-real-session' } });
    assert.equal(me.statusCode, 401);
  });

  test('5. Logout invalidates the session', async () => {
    await createTestUser({ username: 'logout-user', email: 'logout-user@example.com' });
    const login = await rawRequest('POST', '/api/auth/login', { payload: { username: 'logout-user', password: 'correct-horse-battery-staple' } });

    const logout = await rawRequest('POST', '/api/auth/logout', {
      cookies: { neutral_session: login.cookies.neutral_session },
      headers: { 'x-csrf-token': login.cookies.neutral_csrf }
    });
    assert.equal(logout.statusCode, 200);

    const me = await rawRequest('GET', '/api/auth/me', { cookies: { neutral_session: login.cookies.neutral_session } });
    assert.equal(me.statusCode, 401);
  });

  test('6. Expired session is rejected', async () => {
    await createTestUser({ username: 'expire-user', email: 'expire-user@example.com' });
    const user = userService.getByUsername('expire-user');

    const store = authService.getSessionStore();
    const expiredSession = {
      sessionId: 'expired-session-id',
      userId: user.id,
      csrfToken: 'csrf-expired',
      roles: ['admin'],
      issuedAt: Date.now() - 10000,
      lastSeenAt: Date.now() - 10000,
      expiresAt: Date.now() - 1000,
      status: 'active',
      ip: 'test'
    };
    await store.create(expiredSession);

    const result = await authService.validateSession('expired-session-id');
    assert.equal(result.ok, false);
    assert.equal(result.code, 'SESSION_EXPIRED');
  });

  test('7. Invalid/tampered session id is rejected', async () => {
    const result = await authService.validateSession('totally-made-up-id');
    assert.equal(result.ok, false);
    assert.equal(result.code, 'SESSION_INVALID');
  });

  test('8. Role check: admin session can access admin routes', async () => {
    await createTestUser({ username: 'role-admin', email: 'role-admin@example.com', role: 'admin' });
    const login = await rawRequest('POST', '/api/auth/login', { payload: { username: 'role-admin', password: 'correct-horse-battery-staple' } });

    const result = await rawRequest('GET', '/api/admin/users', { cookies: { neutral_session: login.cookies.neutral_session } });
    assert.equal(result.statusCode, 200);
  });

  test('9. Role check: viewer session is forbidden on admin write routes', async () => {
    await createTestUser({ username: 'role-viewer', email: 'role-viewer@example.com', role: 'viewer' });
    const login = await rawRequest('POST', '/api/auth/login', { payload: { username: 'role-viewer', password: 'correct-horse-battery-staple' } });

    const result = await rawRequest('POST', '/api/admin/settings', {
      payload: { appName: 'x', settings: {} },
      cookies: { neutral_session: login.cookies.neutral_session },
      headers: { 'x-csrf-token': login.cookies.neutral_csrf }
    });
    assert.equal(result.statusCode, 403);
  });

  test('10. Role check: developer session can access admin routes', async () => {
    await createTestUser({ username: 'role-developer', email: 'role-developer@example.com', role: 'developer' });
    const login = await rawRequest('POST', '/api/auth/login', { payload: { username: 'role-developer', password: 'correct-horse-battery-staple' } });

    const result = await rawRequest('GET', '/api/admin/settings', { cookies: { neutral_session: login.cookies.neutral_session } });
    assert.equal(result.statusCode, 200);
  });

  test('11. Role check: admin session can write admin settings with CSRF token', async () => {
    await createTestUser({ username: 'role-admin-write', email: 'role-admin-write@example.com', role: 'admin' });
    const login = await rawRequest('POST', '/api/auth/login', { payload: { username: 'role-admin-write', password: 'correct-horse-battery-staple' } });

    const result = await rawRequest('POST', '/api/admin/settings', {
      payload: { appName: 'CSRF OK', settings: {} },
      cookies: { neutral_session: login.cookies.neutral_session },
      headers: { 'x-csrf-token': login.cookies.neutral_csrf }
    });
    assert.equal(result.statusCode, 200);
  });

  test('12. CSRF protection: state-changing request without CSRF token is rejected', async () => {
    await createTestUser({ username: 'csrf-user', email: 'csrf-user@example.com', role: 'admin' });
    const login = await rawRequest('POST', '/api/auth/login', { payload: { username: 'csrf-user', password: 'correct-horse-battery-staple' } });

    const result = await rawRequest('POST', '/api/admin/settings', {
      payload: { appName: 'No CSRF', settings: {} },
      cookies: { neutral_session: login.cookies.neutral_session }
      // Deliberately no x-csrf-token header.
    });
    assert.equal(result.statusCode, 403);
    assert.equal(result.body.code, 'CSRF_INVALID');
  });

  test('13. x-framework-role header alone (no session, no token) is rejected', async () => {
    const result = await requestJson('GET', '/api/admin/users', null, 'admin', null);
    assert.equal(result.statusCode, 401);
  });

  test('14. Session survives a server restart when using the file-backed store', async () => {
    await createTestUser({ username: 'restart-user', email: 'restart-user@example.com', role: 'admin' });
    const login = await rawRequest('POST', '/api/auth/login', { payload: { username: 'restart-user', password: 'correct-horse-battery-staple' } });

    // Simulate a "server restart" by creating a brand new server instance
    // (fresh in-process wiring) while keeping the same on-disk session store.
    const restarted = ServerBootstrap.createServer();
    await new Promise((resolve) => restarted.listen(0, '127.0.0.1', resolve));
    const restartedPort = restarted.address().port;

    const me = await new Promise((resolve, reject) => {
      const req = http.request({
        host: '127.0.0.1',
        port: restartedPort,
        path: '/api/auth/me',
        method: 'GET',
        headers: { Cookie: `neutral_session=${login.cookies.neutral_session}` }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(data || '{}') }));
      });
      req.on('error', reject);
      req.end();
    });

    await new Promise((resolve, reject) => restarted.close((error) => error ? reject(error) : resolve()));

    assert.equal(me.statusCode, 200);
    assert.equal(me.body.user.username, 'restart-user');
  });

  test('15. Session store adapter is swappable (memory vs file implement the same interface)', async () => {
    const memoryStore = new MemorySessionStore();
    const fileStore = new FileSessionStore({ configDir: path.join(configDir, 'tmp-session-store-test') });

    for (const store of [memoryStore, fileStore]) {
      const session = { sessionId: 'swap-test', userId: 'u1', csrfToken: 'c1', roles: ['admin'], issuedAt: Date.now(), lastSeenAt: Date.now(), expiresAt: Date.now() + 60000, status: 'active' };
      await store.create(session);
      const fetched = await store.get('swap-test');
      assert.equal(fetched.userId, 'u1');
      await store.touch('swap-test', { lastSeenAt: Date.now() });
      const destroyed = await store.destroy('swap-test');
      assert.equal(destroyed, true);
    }

    fs.rmSync(path.join(configDir, 'tmp-session-store-test'), { recursive: true, force: true });
  });

  test('16. No sensitive session data (password hash, csrf secret) leaks via /api/auth/me', async () => {
    await createTestUser({ username: 'leak-check', email: 'leak-check@example.com' });
    const login = await rawRequest('POST', '/api/auth/login', { payload: { username: 'leak-check', password: 'correct-horse-battery-staple' } });

    const me = await rawRequest('GET', '/api/auth/me', { cookies: { neutral_session: login.cookies.neutral_session } });
    assert.equal(me.body.user.passwordHash, undefined);
    assert.equal(me.body.csrfToken, undefined);
  });

  test('17. Existing admin API remains protected for both token and session auth', async () => {
    const noAuth = await rawRequest('GET', '/api/admin/users');
    assert.equal(noAuth.statusCode, 401);

    const tokenAuth = await requestJson('GET', '/api/admin/users');
    assert.equal(tokenAuth.statusCode, 200);
  });

  test('18. Brute-force protection: repeated failed logins get rate-limited', async () => {
    await createTestUser({ username: 'bruteforce-user', email: 'bruteforce-user@example.com' });

    let lastResult;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      lastResult = await rawRequest('POST', '/api/auth/login', { payload: { username: 'bruteforce-user', password: 'wrong' } });
    }

    assert.equal(lastResult.statusCode, 429);
    assert.equal(lastResult.body.code, 'RATE_LIMITED');
  });

  test('19. Two application "instances" against the same file-backed session store see the same session', async () => {
    await createTestUser({ username: 'multi-instance', email: 'multi-instance@example.com', role: 'admin' });

    // Instance A: normal running server (already has the default file store).
    const login = await rawRequest('POST', '/api/auth/login', { payload: { username: 'multi-instance', password: 'correct-horse-battery-staple' } });

    // Instance B: independently created server bound to a different port,
    // sharing the same on-disk Server/config/sessions.json file.
    const instanceB = ServerBootstrap.createServer();
    await new Promise((resolve) => instanceB.listen(0, '127.0.0.1', resolve));
    const portB = instanceB.address().port;

    const meOnB = await new Promise((resolve, reject) => {
      const req = http.request({
        host: '127.0.0.1',
        port: portB,
        path: '/api/auth/me',
        method: 'GET',
        headers: { Cookie: `neutral_session=${login.cookies.neutral_session}` }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(data || '{}') }));
      });
      req.on('error', reject);
      req.end();
    });

    await new Promise((resolve, reject) => instanceB.close((error) => error ? reject(error) : resolve()));

    assert.equal(meOnB.statusCode, 200);
    assert.equal(meOnB.body.user.username, 'multi-instance');
  });
});

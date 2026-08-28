'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn, spawnSync } = require('node:child_process');
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');

const projectRoot = path.resolve(__dirname, '..');
const webrootDir = path.join(projectRoot, 'webroot');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Could not resolve free port.')));
        return;
      }
      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
    server.on('error', reject);
  });
}

function request(pathname, { port, cookies = {} }) {
  return new Promise((resolve, reject) => {
    const cookieHeader = Object.entries(cookies).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('; ');
    const req = http.request({
      host: '127.0.0.1',
      port,
      path: pathname,
      method: 'GET',
      headers: cookieHeader ? { Cookie: cookieHeader } : {}
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data, headers: res.headers }));
    });
    req.on('error', reject);
    req.end();
  });
}

function createSessionIdentity(sessionSavePath, sessionId, identity, cookieName = 'neutral_admin_session') {
  const script = `
session_name(getenv('NEUTRAL_TEST_SESSION_COOKIE_NAME'));
session_id(getenv('NEUTRAL_TEST_SESSION_ID'));
session_start();
$_SESSION['auth_identity'] = json_decode((string) getenv('NEUTRAL_TEST_IDENTITY_JSON'), true);
session_write_close();
`;
  const result = spawnSync('php', [
    '-d', `session.save_path=${sessionSavePath}`,
    '-r', script
  ], {
    env: {
      ...process.env,
      NEUTRAL_TEST_SESSION_ID: sessionId,
      NEUTRAL_TEST_IDENTITY_JSON: JSON.stringify(identity),
      NEUTRAL_TEST_SESSION_COOKIE_NAME: cookieName
    },
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    throw new Error(`Could not prepare PHP session fixture: ${result.stderr || result.stdout}`);
  }
}

function startPhpServer({ docroot, port, sessionSavePath }) {
  const processHandle = spawn('php', [
    '-d', `session.save_path=${sessionSavePath}`,
    '-S', `127.0.0.1:${port}`,
    '-t', docroot
  ], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  return processHandle;
}

function waitForServerReady(port, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const probe = () => {
      const req = http.request({
        host: '127.0.0.1',
        port,
        path: '/api/status',
        method: 'GET'
      }, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error('PHP server did not become ready in time.'));
          return;
        }
        setTimeout(probe, 100);
      });
      req.end();
    };
    probe();
  });
}

describe('Admin PHP entry protection', { concurrency: false }, () => {
  let serverPort;
  let serverProcess;
  let sessionSavePath;
  let tempRuntimeRoot;
  let setuplessServerPort;
  let setuplessServerProcess;

  before(async () => {
    sessionSavePath = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-admin-php-session-'));
    serverPort = await getFreePort();
    serverProcess = startPhpServer({ docroot: webrootDir, port: serverPort, sessionSavePath });
    await waitForServerReady(serverPort);

    tempRuntimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-admin-php-runtime-'));
    const tempWebroot = path.join(tempRuntimeRoot, 'webroot');
    const tempCore = path.join(tempRuntimeRoot, 'core');
    fs.cpSync(webrootDir, tempWebroot, { recursive: true });
    fs.cpSync(path.join(projectRoot, 'core'), tempCore, { recursive: true });
    fs.rmSync(path.join(tempWebroot, 'setup.php'));

    setuplessServerPort = await getFreePort();
    setuplessServerProcess = startPhpServer({ docroot: tempWebroot, port: setuplessServerPort, sessionSavePath });
    await waitForServerReady(setuplessServerPort);
  });

  after(async () => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
    }
    if (setuplessServerProcess && !setuplessServerProcess.killed) {
      setuplessServerProcess.kill('SIGTERM');
    }
    if (sessionSavePath) {
      fs.rmSync(sessionSavePath, { recursive: true, force: true });
    }
    if (tempRuntimeRoot) {
      fs.rmSync(tempRuntimeRoot, { recursive: true, force: true });
    }
  });

  test('Fall A: /admin.php without session returns 401 and no admin shell', async () => {
    const result = await request('/admin.php', { port: serverPort });
    assert.equal(result.statusCode, 401);
    assert.match(result.body, /Authentication required/i);
    assert.match(result.body, /id="loginBtn"/);
    assert.match(result.body, /api\/auth\/login/);
    assert.doesNotMatch(result.body, /id="appShell"/);
  });

  test('Fall B: /admin.php with non-admin session returns 403 and no admin shell', async () => {
    createSessionIdentity(sessionSavePath, 'viewer-session', {
      userId: '102',
      username: 'viewer-user',
      roles: ['viewer'],
      permissions: ['auth.read'],
      issuedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      status: 'active'
    });
    const result = await request('/admin.php', {
      port: serverPort,
      cookies: { neutral_admin_session: 'viewer-session' }
    });
    assert.equal(result.statusCode, 403);
    assert.match(result.body, /Access denied/i);
    assert.doesNotMatch(result.body, /id="appShell"/);
  });

  test('Fall C: /admin.php with admin session returns admin UI and assets', async () => {
    createSessionIdentity(sessionSavePath, 'admin-session', {
      userId: '101',
      username: 'admin-user',
      roles: ['admin'],
      permissions: ['admin.read', 'admin.write'],
      issuedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      status: 'active'
    });
    const result = await request('/admin.php', {
      port: serverPort,
      cookies: { neutral_admin_session: 'admin-session' }
    });
    assert.equal(result.statusCode, 200);
    assert.match(result.body, /id="appShell"/);
    assert.match(result.body, /src="master-ui\.js"/);
    assert.match(result.body, /src="admin-init\.js"/);
  });

  test('Fall D: User session cookie does not unlock admin.php', async () => {
    createSessionIdentity(sessionSavePath, 'mixed-session', {
      userId: '101',
      username: 'admin-user',
      roles: ['admin'],
      permissions: ['admin.read', 'admin.write'],
      issuedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      status: 'active'
    }, 'neutral_admin_session');

    const result = await request('/admin.php', {
      port: serverPort,
      cookies: { neutral_session: 'mixed-session' }
    });
    assert.equal(result.statusCode, 401);
    assert.match(result.body, /Authentication required/i);
  });

  test('Fall E: Runtime remains bootstrappable without setup.php', async () => {
    const result = await request('/admin.php', { port: setuplessServerPort });
    assert.equal(result.statusCode, 401);
    assert.match(result.body, /Authentication required/i);
  });

  test('Fall F: Existing PHP API endpoints remain functional', async () => {
    const status = await request('/api/status', { port: serverPort });
    assert.equal(status.statusCode, 200);
    assert.match(status.body, /"ok"\s*:\s*true/);

    const me = await request('/api/auth/me', { port: serverPort });
    assert.equal(me.statusCode, 401);
  });
});

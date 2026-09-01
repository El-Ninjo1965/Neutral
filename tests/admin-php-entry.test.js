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
const webrootDir = path.join(projectRoot, 'Server', 'public');

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

function request(pathname, { port, cookies = {}, method = 'GET', body = '', headers: extraHeaders = {} }) {
  return new Promise((resolve, reject) => {
    const cookieHeader = Object.entries(cookies).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('; ');
    const headers = { ...extraHeaders };
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }
    if (body !== '') {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(body);
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
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data, headers: res.headers }));
    });
    req.on('error', reject);
    if (body !== '') {
      req.write(body);
    }
    req.end();
  });
}

function createSessionIdentity(sessionSavePath, sessionId, identity) {
  const script = `
session_name('neutral_session');
session_id(getenv('NEUTRAL_TEST_SESSION_ID'));
session_start();
$_SESSION['auth_identity'] = json_decode((string) getenv('NEUTRAL_TEST_IDENTITY_JSON'), true);
session_write_close();
`;
  const result = spawnSync('php', [
    '-d', `session.save_path=${sessionSavePath}`,
    '-d', 'session.use_strict_mode=0',
    '-r', script
  ], {
    env: {
      ...process.env,
      NEUTRAL_TEST_SESSION_ID: sessionId,
      NEUTRAL_TEST_IDENTITY_JSON: JSON.stringify(identity)
    },
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    throw new Error(`Could not prepare PHP session fixture: ${result.stderr || result.stdout}`);
  }
}

function startPhpServer({ docroot, port, sessionSavePath, env = {}, router = '' }) {
  const args = [
    '-d', `session.save_path=${sessionSavePath}`,
    '-S', `127.0.0.1:${port}`,
    '-t', docroot
  ];
  if (router !== '') {
    args.push(router);
  }
  const processHandle = spawn('php', args, {
    cwd: projectRoot,
    env: { ...process.env, ...env },
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

function writeActiveSetupState(root) {
  const runtimeDir = path.join(root, 'Server', 'runtime');
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.writeFileSync(path.join(runtimeDir, 'setup-state.json'), JSON.stringify({
    status: 'ACTIVE',
    installation: { active: true, state: 'ACTIVE' }
  }));
}

describe('Admin PHP entry protection', { concurrency: false }, () => {
  let serverPort;
  let serverProcess;
  let sessionSavePath;
  let tempRuntimeRoot;
  let setuplessServerPort;
  let setuplessServerProcess;
  let activeSetupRoot;
  let lockedSetupPort;
  let lockedSetupProcess;
  let recoverySetupPort;
  let recoverySetupProcess;
  let routedSetupPort;
  let routedSetupProcess;
  const recoveryToken = 'test-recovery-token-32-characters';

  before(async () => {
    sessionSavePath = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-admin-php-session-'));
    serverPort = await getFreePort();
    serverProcess = startPhpServer({
      docroot: webrootDir,
      port: serverPort,
      sessionSavePath,
      env: {
        APP_ENV: 'development',
        NEUTRAL_BACKUP_KEY: 'test-backup-key-32-characters-long'
      }
    });
    await waitForServerReady(serverPort);

    tempRuntimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-admin-php-runtime-'));
    const tempServer = path.join(tempRuntimeRoot, 'Server');
    const tempWebroot = path.join(tempServer, 'public');
    const tempPhp = path.join(tempServer, 'php');
    fs.mkdirSync(tempServer, { recursive: true });
    fs.cpSync(webrootDir, tempWebroot, { recursive: true });
    fs.cpSync(path.join(projectRoot, 'Server', 'php'), tempPhp, { recursive: true });
    fs.rmSync(path.join(tempWebroot, 'setup.php'));

    setuplessServerPort = await getFreePort();
    setuplessServerProcess = startPhpServer({ docroot: tempWebroot, port: setuplessServerPort, sessionSavePath });
    await waitForServerReady(setuplessServerPort);

    activeSetupRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-active-setup-'));
    const activeServer = path.join(activeSetupRoot, 'Server');
    const activeWebroot = path.join(activeServer, 'public');
    const activePhp = path.join(activeServer, 'php');
    fs.cpSync(webrootDir, activeWebroot, { recursive: true });
    fs.cpSync(path.join(projectRoot, 'Server', 'php'), activePhp, { recursive: true });
    writeActiveSetupState(activeSetupRoot);

    lockedSetupPort = await getFreePort();
    lockedSetupProcess = startPhpServer({
      docroot: activeWebroot,
      port: lockedSetupPort,
      sessionSavePath,
      env: { NEUTRAL_SETUP_RECOVERY_ENABLED: '0' }
    });
    await waitForServerReady(lockedSetupPort);

    recoverySetupPort = await getFreePort();
    recoverySetupProcess = startPhpServer({
      docroot: activeWebroot,
      port: recoverySetupPort,
      sessionSavePath,
      env: {
        NEUTRAL_SETUP_RECOVERY_ENABLED: '1',
        NEUTRAL_SETUP_RECOVERY_TOKEN: recoveryToken
      }
    });
    await waitForServerReady(recoverySetupPort);

    routedSetupPort = await getFreePort();
    routedSetupProcess = startPhpServer({
      docroot: activeWebroot,
      port: routedSetupPort,
      sessionSavePath,
      env: { NEUTRAL_SETUP_RECOVERY_ENABLED: '0' },
      router: path.join(activeWebroot, 'api', 'index.php')
    });
    await waitForServerReady(routedSetupPort);
  });

  after(async () => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
    }
    if (setuplessServerProcess && !setuplessServerProcess.killed) {
      setuplessServerProcess.kill('SIGTERM');
    }
    if (lockedSetupProcess && !lockedSetupProcess.killed) {
      lockedSetupProcess.kill('SIGTERM');
    }
    if (recoverySetupProcess && !recoverySetupProcess.killed) {
      recoverySetupProcess.kill('SIGTERM');
    }
    if (routedSetupProcess && !routedSetupProcess.killed) {
      routedSetupProcess.kill('SIGTERM');
    }
    if (sessionSavePath) {
      fs.rmSync(sessionSavePath, { recursive: true, force: true });
    }
    if (tempRuntimeRoot) {
      fs.rmSync(tempRuntimeRoot, { recursive: true, force: true });
    }
    if (activeSetupRoot) {
      fs.rmSync(activeSetupRoot, { recursive: true, force: true });
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
      cookies: { neutral_session: 'viewer-session' }
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
      cookies: { neutral_session: 'admin-session' }
    });
    assert.equal(result.statusCode, 200, result.body);
    assert.match(result.body, /id="appShell"/);
    assert.match(result.body, /src="\/Web-App\/public\/master-ui\.js"/);
    assert.match(result.body, /src="\/Web-App\/public\/admin-init\.js"/);
  });

  test('Fall D: Runtime remains bootstrappable without setup.php', async () => {
    const result = await request('/admin.php', { port: setuplessServerPort });
    assert.equal(result.statusCode, 401);
    assert.match(result.body, /Authentication required/i);
  });

  test('Fall E: Existing PHP API endpoints remain functional', async () => {
    const status = await request('/api/status', { port: serverPort });
    assert.equal(status.statusCode, 200);
    assert.match(status.body, /"ok"\s*:\s*true/);

    const me = await request('/api/auth/me', { port: serverPort });
    assert.equal(me.statusCode, 401);
  });

  test('Fall F: public status omits runtime paths and database identifiers', async () => {
    const result = await request('/api/status', { port: serverPort });
    assert.equal(result.statusCode, 200, result.body);
    const payload = JSON.parse(result.body);
    assert.deepEqual(Object.keys(payload.data).sort(), ['app', 'database', 'environment', 'service', 'status']);
    assert.deepEqual(Object.keys(payload.data.database), ['state']);
    assert.equal(payload.data.runtime, undefined);
  });

  test('Fall F2: compatibility status endpoint omits runtime paths and database identifiers', async () => {
    const result = await request('/api/status.php', { port: serverPort });
    assert.equal(result.statusCode, 200);
    const payload = JSON.parse(result.body);
    assert.deepEqual(Object.keys(payload.data).sort(), ['app', 'database', 'environment', 'service', 'status']);
    assert.deepEqual(Object.keys(payload.data.database), ['state']);
    assert.equal(payload.data.runtime, undefined);
  });

  test('Fall G: active installation hides setup and reset controls by default', async () => {
    const result = await request('/setup.php', { port: lockedSetupPort });
    assert.equal(result.statusCode, 404);
    assert.doesNotMatch(result.body, /Neutral setup/i);
    assert.doesNotMatch(result.body, /reset application state/i);
  });

  test('Fall H: recovery flag alone does not expose setup without operator credentials', async () => {
    const result = await request('/setup.php', { port: recoverySetupPort });
    assert.equal(result.statusCode, 401);
    assert.doesNotMatch(result.body, /Neutral setup|reset application state/i);
  });

  test('Fall H2: recovery requires the host-side token through HTTP Basic auth', async () => {
    const authorization = `Basic ${Buffer.from(`recovery:${recoveryToken}`).toString('base64')}`;
    const result = await request('/setup.php', {
      port: recoverySetupPort,
      headers: { Authorization: authorization }
    });
    assert.equal(result.statusCode, 200);
    assert.match(result.body, /Neutral setup/i);
  });

  test('Fall I: active installation hides setup API status by default', async () => {
    writeActiveSetupState(activeSetupRoot);
    const result = await request('/api/setup/status.php', { port: lockedSetupPort });
    assert.equal(result.statusCode, 404);
    assert.doesNotMatch(result.body, /installationEvidence|databaseState|envFile/i);
  });

  test('Fall J: active installation rejects setup API installation by default', async () => {
    writeActiveSetupState(activeSetupRoot);
    const result = await request('/api/setup/install.php', {
      port: lockedSetupPort,
      method: 'POST',
      body: '{}'
    });
    assert.equal(result.statusCode, 404);
    assert.doesNotMatch(result.body, /installationEvidence|databaseState|envFile/i);
  });

  test('Fall K: active installation hides setup install API before method validation', async () => {
    for (const method of ['GET', 'OPTIONS']) {
      const result = await request('/api/setup/install.php', { port: lockedSetupPort, method });
      assert.equal(result.statusCode, 404);
      assert.doesNotMatch(result.body, /Method not allowed|installationEvidence|databaseState|envFile/i);
    }
  });

  test('Fall K2: routed setup endpoints are hidden before global OPTIONS handling', async () => {
    for (const pathname of ['/api/setup/status', '/api/setup/install']) {
      for (const method of ['GET', 'OPTIONS']) {
        const result = await request(pathname, { port: routedSetupPort, method });
        assert.equal(result.statusCode, 404, `${method} ${pathname}`);
      }
    }
  });

  test('Fall L: database-backed evidence restores the setup lock when runtime state is missing', () => {
    const evidenceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-setup-evidence-'));
    try {
      const script = `
require getenv('NEUTRAL_TEST_BOOTSTRAP');
$runtime = neutral_bootstrap(['project_root' => getenv('NEUTRAL_TEST_ROOT'), 'register_error_handler' => false]);
$store = new \\Neutral\\Core\\SetupStateStore(\\Neutral\\Core\\SetupStateStore::defaultStateFile(getenv('NEUTRAL_TEST_ROOT')));
$checker = new \\Neutral\\Core\\PrerequisiteChecker($runtime->config(), $runtime->database());
$installer = new \\Neutral\\Core\\SetupInstaller($runtime, $store, $checker, static fn (): array => ['installed' => true]);
echo json_encode(['locked' => $installer->hasInstallationEvidence(), 'persisted' => $store->isInstalled()]);
`;
      const result = spawnSync('php', ['-r', script], {
        cwd: projectRoot,
        env: {
          ...process.env,
          NEUTRAL_TEST_BOOTSTRAP: path.join(projectRoot, 'Server', 'php', 'bootstrap.php'),
          NEUTRAL_TEST_ROOT: evidenceRoot
        },
        encoding: 'utf8'
      });
      assert.equal(result.status, 0, result.stderr || result.stdout);
      assert.deepEqual(JSON.parse(result.stdout), { locked: true, persisted: true });
    } finally {
      fs.rmSync(evidenceRoot, { recursive: true, force: true });
    }
  });

  test('Fall M: configured but unreadable database fails closed when runtime state is missing', () => {
    const evidenceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-setup-unknown-'));
    try {
      const script = `
require getenv('NEUTRAL_TEST_BOOTSTRAP');
$runtime = neutral_bootstrap(['project_root' => getenv('NEUTRAL_TEST_ROOT'), 'register_error_handler' => false]);
$store = new \\Neutral\\Core\\SetupStateStore(\\Neutral\\Core\\SetupStateStore::defaultStateFile(getenv('NEUTRAL_TEST_ROOT')));
$checker = new \\Neutral\\Core\\PrerequisiteChecker($runtime->config(), $runtime->database());
$installer = new \\Neutral\\Core\\SetupInstaller($runtime, $store, $checker, static fn (): array => ['installed' => false, 'error' => 'database unavailable']);
echo json_encode(['locked' => $installer->hasInstallationEvidence(), 'persisted' => $store->isInstalled()]);
`;
      const result = spawnSync('php', ['-r', script], {
        cwd: projectRoot,
        env: {
          ...process.env,
          NEUTRAL_TEST_BOOTSTRAP: path.join(projectRoot, 'Server', 'php', 'bootstrap.php'),
          NEUTRAL_TEST_ROOT: evidenceRoot,
          DB_HOST: 'database.internal',
          DB_NAME: 'neutral',
          DB_USER: 'neutral_user'
        },
        encoding: 'utf8'
      });
      assert.equal(result.status, 0, result.stderr || result.stdout);
      assert.deepEqual(JSON.parse(result.stdout), { locked: true, persisted: false });
    } finally {
      fs.rmSync(evidenceRoot, { recursive: true, force: true });
    }
  });

  test('Fall N: PHP login fails closed when the throttle backend is unavailable', async () => {
    const result = await request('/api/auth/login', {
      port: serverPort,
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'wrong-password' })
    });
    assert.equal(result.statusCode, 503);
    assert.match(result.body, /Authentication service temporarily unavailable/i);
    assert.doesNotMatch(result.body, /PDO|database|SQL|password_hash|stack/i);
  });

  test('Fall O: portability inventory and backup metadata require authentication', async () => {
    for (const pathname of ['/api/admin/system/inventory', '/api/admin/backups']) {
      const result = await request(pathname, { port: serverPort });
      assert.equal(result.statusCode, 401, pathname);
    }
  });

  test('Fall P: admin token can list encrypted backup metadata without database details', async () => {
    const result = await request('/api/admin/backups', {
      port: serverPort,
      headers: { 'X-Admin-Access-Token': 'test-token' }
    });
    assert.equal(result.statusCode, 200, result.body);
    const payload = JSON.parse(result.body);
    assert.deepEqual(payload.data.backups, []);
    assert.equal(payload.data.status, 'available');
    assert.doesNotMatch(result.body, /DB_HOST|password|runtime|file_ref/i);
  });

  test('Fall Q: bootstrap tokens cannot mutate portability backups without a session', async () => {
    const result = await request('/api/admin/backups', {
      port: serverPort,
      method: 'POST',
      body: '{}',
      headers: {
        'X-Admin-Access-Token': 'test-token',
        'X-Framework-Role': 'viewer'
      }
    });
    assert.equal(result.statusCode, 401, result.body);
  });

  test('Fall R: even admin bootstrap tokens cannot bypass session and CSRF for backups', async () => {
    const result = await request('/api/admin/backups', {
      port: serverPort,
      method: 'POST',
      body: '{}',
      headers: { 'X-Admin-Access-Token': 'test-token' }
    });
    assert.equal(result.statusCode, 401, result.body);
    assert.match(result.body, /Admin session required/i);
  });

  test('Fall S: bootstrap tokens cannot download encrypted backup artifacts', async () => {
    const result = await request(`/api/admin/backups/${'e'.repeat(32)}/download`, {
      port: serverPort,
      headers: { 'X-Admin-Access-Token': 'test-token' }
    });
    assert.equal(result.statusCode, 401, result.body);
    assert.match(result.body, /Admin session required/i);
  });
});

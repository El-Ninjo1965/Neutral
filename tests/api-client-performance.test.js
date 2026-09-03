const test = require('node:test');
const assert = require('node:assert/strict');
const ApiClient = require('../Web-App/public/api-client');

test('API client returns a controlled timeout instead of blocking indefinitely', async () => {
  const previousFetch = global.fetch;
  const previousDocument = global.document;
  global.document = { cookie: '' };
  global.fetch = () => new Promise(() => {});
  try {
    const client = new ApiClient('https://example.invalid');
    const result = await client.get('/status', { timeoutMs: 5 });
    assert.equal(result.ok, false);
    assert.equal(result.status, 408);
    assert.equal(result.code, 'API_TIMEOUT');
  } finally {
    global.fetch = previousFetch;
    global.document = previousDocument;
  }
});

test('API client uses the canonical v1 base while accepting legacy endpoint strings', async () => {
  const previousFetch = global.fetch;
  const previousDocument = global.document;
  const previousWindow = global.window;
  let requestedUrl = null;
  global.window = {};
  global.document = { cookie: '', querySelector: () => null };
  global.fetch = async (url) => {
    requestedUrl = url;
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ ok: true, data: {} })
    };
  };
  try {
    const client = new ApiClient();
    const result = await client.get('/api/status');
    assert.equal(result.ok, true);
    assert.equal(requestedUrl, '/api/v1/status');
  } finally {
    global.fetch = previousFetch;
    global.document = previousDocument;
    global.window = previousWindow;
  }
});

test('API client resolves legacy endpoint strings below the configured subpath', async () => {
  const previousFetch = global.fetch;
  const previousDocument = global.document;
  const previousWindow = global.window;
  const previousConfig = global.NeutralConfig;
  let requestedUrl = null;
  global.NeutralConfig = { basePath: '/meine-app' };
  global.window = { NeutralConfig: global.NeutralConfig, NeutralPublicPath: global.NeutralPublicPath };
  global.document = { cookie: '', querySelector: () => null };
  global.fetch = async (url) => {
    requestedUrl = url;
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ ok: true, data: {} })
    };
  };
  try {
    const client = new ApiClient();
    const result = await client.get('/api/status');
    assert.equal(result.ok, true);
    assert.equal(requestedUrl, '/meine-app/api/v1/status');
  } finally {
    global.fetch = previousFetch;
    global.document = previousDocument;
    global.window = previousWindow;
    if (previousConfig === undefined) delete global.NeutralConfig;
    else global.NeutralConfig = previousConfig;
  }
});

test('API client preserves endpoint query strings after subpath resolution', async () => {
  const previousFetch = global.fetch;
  const previousDocument = global.document;
  const previousWindow = global.window;
  const previousConfig = global.NeutralConfig;
  let requestedUrl = null;
  global.NeutralConfig = { basePath: '/meine-app' };
  global.window = { NeutralConfig: global.NeutralConfig, NeutralPublicPath: global.NeutralPublicPath };
  global.document = { cookie: '', querySelector: () => null };
  global.fetch = async (url) => {
    requestedUrl = url;
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ ok: true, data: {} })
    };
  };
  try {
    const result = await new ApiClient().get('/api/admin/users?role=admin');
    assert.equal(result.ok, true);
    assert.equal(requestedUrl, '/meine-app/api/v1/admin/users?role=admin');
  } finally {
    global.fetch = previousFetch;
    global.document = previousDocument;
    global.window = previousWindow;
    if (previousConfig === undefined) delete global.NeutralConfig;
    else global.NeutralConfig = previousConfig;
  }
});

test('API client normalizes API base endpoints before preserving query strings', async () => {
  const previousFetch = global.fetch;
  const previousDocument = global.document;
  const previousWindow = global.window;
  const previousConfig = global.NeutralConfig;
  const requestedUrls = [];
  global.NeutralConfig = { basePath: '/meine-app' };
  global.window = { NeutralConfig: global.NeutralConfig, NeutralPublicPath: global.NeutralPublicPath };
  global.document = { cookie: '', querySelector: () => null };
  global.fetch = async (url) => {
    requestedUrls.push(url);
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ ok: true, data: {} })
    };
  };
  try {
    assert.equal((await new ApiClient().get('/api?probe=1')).ok, true);
    assert.equal((await new ApiClient().get('/api/v1?probe=1')).ok, true);
    assert.deepEqual(requestedUrls, [
      '/meine-app/api/v1?probe=1',
      '/meine-app/api/v1?probe=1'
    ]);
  } finally {
    global.fetch = previousFetch;
    global.document = previousDocument;
    global.window = previousWindow;
    if (previousConfig === undefined) delete global.NeutralConfig;
    else global.NeutralConfig = previousConfig;
  }
});

test('admin login uses the authoritative login response without a duplicate me roundtrip', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '../Web-App/public/master-ui.js'), 'utf8');
  const loginStart = source.indexOf("loginBtn.addEventListener('click'");
  const logoutStart = source.indexOf("logoutBtn.addEventListener('click'", loginStart);
  const loginHandler = source.slice(loginStart, logoutStart);
  assert.match(loginHandler, /serverApiClient\.login/);
  assert.doesNotMatch(loginHandler, /serverApiClient\.me/);
  assert.match(loginHandler, /Session established\. Opening workspace/);
});

test('admin startup is event-driven and delegates discovery to CoreStartup once', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const adminInit = fs.readFileSync(path.join(__dirname, '../Web-App/public/admin-init.js'), 'utf8');
  const masterUi = fs.readFileSync(path.join(__dirname, '../Web-App/public/master-ui.js'), 'utf8');
  const startup = fs.readFileSync(path.join(__dirname, '../Web-App/core/core-startup.js'), 'utf8');
  assert.doesNotMatch(adminInit, /setInterval|30000|setTimeout/);
  assert.match(adminInit, /neutral:auth-ready/);
  assert.doesNotMatch(masterUi, /ModuleManager\.discoverModules/);
  assert.match(masterUi, /CoreStartup\.startBackground/);
  assert.equal((startup.match(/\.discoverModules\(\)/g) || []).length, 1);
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');

const createStorage = (seed = new Map()) => ({
  get length() { return seed.size; },
  getItem(key) { return seed.has(String(key)) ? seed.get(String(key)) : null; },
  setItem(key, value) { seed.set(String(key), String(value)); },
  removeItem(key) { seed.delete(String(key)); },
  key(index) { return Array.from(seed.keys())[index] || null; },
  seed
});

const moduleEntry = {
  id: 'gps',
  name: 'GPS',
  version: '1.0.0',
  type: 'module',
  entry: 'index.js',
  modulePath: '/Web-App/app/modules/gps',
  globalName: 'GpsModule',
  permissions: [
    { key: 'gps.view', defaultRoles: [] },
    { key: 'gps.use', defaultRoles: [] }
  ],
  access: {
    visibilityPermissions: ['gps.view'],
    usagePermissions: ['gps.use']
  },
  registered: true,
  status: 'active',
  lifecycleState: 'ACTIVE',
  active: true,
  enabled: true,
  clientAccess: { mode: 'anonymous', canView: true, canUse: true }
};

const loadContext = ({ storage, catalogResponse, catalogError = null }) => {
  const requests = [];
  const sandbox = {
    console,
    URL,
    navigator: { onLine: true },
    localStorage: storage,
    location: { pathname: '/', origin: 'https://example.test' },
    document: {
      readyState: 'complete',
      addEventListener() {}
    },
    NeutralPublicPath: {
      base() { return ''; },
      join(value) { return `/${String(value).replace(/^\/+/, '')}`; },
      api(value) { return `/api/v1/${String(value).replace(/^\/+/, '')}`; }
    },
    fetch: async (url, options = {}) => {
      requests.push({ url: String(url), options });
      if (String(url).includes('/api/v1/modules')) {
        if (catalogError) throw catalogError;
        return {
          ok: true,
          status: 200,
          async json() { return catalogResponse; }
        };
      }
      if (String(url).endsWith('/Web-App/app/modules/gps/index.js')) {
        return {
          ok: true,
          async text() {
            return 'window.GpsModule = { id: "gps", name: "GPS", status: "available", active: false };';
          }
        };
      }
      return { ok: false, async text() { return ''; } };
    }
  };
  sandbox.window = sandbox;
  sandbox.requests = requests;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  for (const file of ['Web-App/core/module-interface.js', 'Web-App/core/core-loader.js']) {
    vm.runInContext(fs.readFileSync(path.join(projectRoot, file), 'utf8'), sandbox, { filename: file });
  }
  return sandbox;
};

test('successful anonymous catalog is cached and propagates access plus active state', async () => {
  const storage = createStorage();
  const context = loadContext({
    storage,
    catalogResponse: { ok: true, data: { modules: [moduleEntry], accessContext: { mode: 'anonymous' } } }
  });

  const modules = await context.CoreLoader.discoverExternalModules();
  assert.equal(modules.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(modules[0].clientAccess)), moduleEntry.clientAccess);
  assert.equal(modules[0].active, true);
  assert.equal(modules[0].lifecycleState, 'ACTIVE');
  assert.equal(context.requests[0].options.credentials, 'same-origin');
  assert.deepEqual(JSON.parse(JSON.stringify(context.CoreLoader.getCatalogDiagnostics())), {
    requestId: 1, mode: 'anonymous', status: 200, durationMs: context.CoreLoader.getCatalogDiagnostics().durationMs, moduleCount: 1
  });

  const cacheKeys = Array.from(storage.seed.keys()).filter((key) => key.startsWith('neutral.module-catalog.anonymous.v1:'));
  assert.equal(cacheKeys.length, 1);
  assert.doesNotMatch(storage.seed.get(cacheKeys[0]), /admin\.write|session\.read|cookie|token/i);
});

test('offline API failure reuses only the last valid anonymous catalog', async () => {
  const storage = createStorage();
  const online = loadContext({
    storage,
    catalogResponse: { ok: true, data: { modules: [moduleEntry], accessContext: { mode: 'anonymous' } } }
  });
  await online.CoreLoader.discoverExternalModules();

  const offline = loadContext({ storage, catalogError: new Error('offline') });
  const modules = await offline.CoreLoader.discoverExternalModules();
  assert.equal(modules.length, 1);
  assert.equal(modules[0].id, 'gps');
  assert.equal(modules[0].clientAccess.canUse, true);
});

test('online warmstart waits for the authoritative catalog instead of exposing stale cache state', async () => {
  const storage = createStorage();
  const online = loadContext({
    storage,
    catalogResponse: { ok: true, data: { modules: [moduleEntry], accessContext: { mode: 'anonymous' } } }
  });
  await online.CoreLoader.discoverExternalModules();

  let remoteStarted = false;
  const slow = loadContext({ storage });
  slow.fetch = (url) => {
    if (String(url).includes('/api/v1/modules')) {
      remoteStarted = true;
      return new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        async json() { return { ok: true, data: { modules: [moduleEntry], accessContext: { mode: 'anonymous' } } }; }
      }), 400));
    }
    if (String(url).endsWith('/Web-App/app/modules/gps/index.js')) {
      return Promise.resolve({
        ok: true,
        async text() { return 'window.GpsModule = { id: "gps", name: "GPS", status: "available", active: false };'; }
      });
    }
    return Promise.resolve({ ok: false, async text() { return ''; } });
  };

  const discovery = slow.CoreLoader.discoverExternalModules();
  const fastResult = await Promise.race([
    discovery,
    new Promise((resolve) => setTimeout(() => resolve('still-waiting'), 300))
  ]);
  assert.equal(fastResult, 'still-waiting');
  const modules = await discovery;
  assert.equal(modules.length, 1);
  assert.equal(modules[0].id, 'gps');
  assert.equal(remoteStarted, true);
});

test('offline warmstart reuses cached catalog and skips the remote refresh entirely', async () => {
  const storage = createStorage();
  const online = loadContext({
    storage,
    catalogResponse: { ok: true, data: { modules: [moduleEntry], accessContext: { mode: 'anonymous' } } }
  });
  await online.CoreLoader.discoverExternalModules();

  let remoteStarted = false;
  const offline = loadContext({ storage });
  offline.navigator.onLine = false;
  offline.fetch = (url) => {
    if (String(url).includes('/api/v1/modules')) {
      remoteStarted = true;
      return new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        async json() { return { ok: true, data: { modules: [moduleEntry], accessContext: { mode: 'anonymous' } } }; }
      }), 5000));
    }
    if (String(url).endsWith('/Web-App/app/modules/gps/index.js')) {
      return Promise.resolve({
        ok: true,
        async text() { return 'window.GpsModule = { id: "gps", name: "GPS", status: "available", active: false };'; }
      });
    }
    return Promise.resolve({ ok: false, async text() { return ''; } });
  };

  const modules = await offline.CoreLoader.discoverExternalModules();
  assert.equal(modules.length, 1);
  assert.equal(modules[0].id, 'gps');
  assert.equal(remoteStarted, false);
});

test('warmstart caches the module entry for offline reuse', async () => {
  const storage = createStorage();
  const online = loadContext({
    storage,
    catalogResponse: { ok: true, data: { modules: [moduleEntry], accessContext: { mode: 'anonymous' } } }
  });
  await online.CoreLoader.discoverExternalModules();

  const offline = loadContext({ storage, catalogError: new Error('offline') });
  const modules = await offline.CoreLoader.discoverExternalModules();
  assert.equal(modules.length, 1);
  assert.equal(modules[0].id, 'gps');
  assert.equal(modules[0].clientAccess.canUse, true);
});

test('first offline load without anonymous cache fails closed', async () => {
  const context = loadContext({ storage: createStorage(), catalogError: new Error('offline') });
  await assert.rejects(context.CoreLoader.discoverExternalModules(), /offline/);
});

test('authenticated catalog is usable online but never persisted as anonymous fallback', async () => {
  const storage = createStorage();
  const context = loadContext({
    storage,
    catalogResponse: {
      ok: true,
      data: {
        modules: [{ ...moduleEntry, clientAccess: { mode: 'authenticated', canView: true, canUse: true } }],
        accessContext: { mode: 'authenticated' }
      }
    }
  });
  context.CoreAuth = { currentUser: { id: '7' } };

  const modules = await context.CoreLoader.discoverExternalModules();
  assert.equal(modules.length, 1);
  assert.equal(Array.from(storage.seed.keys()).some((key) => key.startsWith('neutral.module-catalog.anonymous.v1:')), false);

  const offline = loadContext({ storage, catalogError: new Error('offline') });
  await assert.rejects(offline.CoreLoader.discoverExternalModules(), /offline/);
});

test('authenticated discovery bypasses a stale anonymous warm-start catalog', async () => {
  const storage = createStorage();
  const anonymous = loadContext({
    storage,
    catalogResponse: { ok: true, data: { modules: [moduleEntry], accessContext: { mode: 'anonymous' } } }
  });
  await anonymous.CoreLoader.discoverExternalModules();

  const profile = {
    ...moduleEntry,
    id: 'profile',
    name: 'Profile',
    entry: 'index.js',
    modulePath: '/Web-App/app/modules/profile',
    globalName: 'NeutralProfileModule',
    clientAccess: { mode: 'authenticated', canView: true, canUse: true }
  };
  const authenticated = loadContext({
    storage,
    catalogResponse: { ok: true, data: { modules: [profile], accessContext: { mode: 'authenticated' } } }
  });
  authenticated.CoreAuth = { currentUser: { id: '7', permissions: ['profile.view', 'profile.update'] } };
  authenticated.fetch = async (url) => {
    if (String(url).includes('/api/v1/modules')) return { ok: true, async json() { return { ok: true, data: { modules: [profile], accessContext: { mode: 'authenticated' } } }; } };
    if (String(url).endsWith('/Web-App/app/modules/profile/index.js')) return { ok: true, async text() { return 'window.NeutralProfileModule = { id: "profile", name: "Profile", status: "available", active: false, presentation: { userNavigation: true } };'; } };
    return { ok: false, async text() { return ''; } };
  };

  const modules = await authenticated.CoreLoader.discoverExternalModules();
  assert.deepEqual(Array.from(modules, (module) => module.id), ['profile']);
  assert.equal(modules[0].clientAccess.mode, 'authenticated');
});

test('malformed anonymous access entries are not cached or loaded', async () => {
  const storage = createStorage();
  const context = loadContext({
    storage,
    catalogResponse: {
      ok: true,
      data: {
        modules: [{ ...moduleEntry, clientAccess: { mode: 'anonymous', canView: 'yes', canUse: true } }],
        accessContext: { mode: 'anonymous' }
      }
    }
  });

  await assert.rejects(context.CoreLoader.discoverExternalModules(), /invalid/);
  assert.equal(storage.seed.size, 0);
});

test('catalog failure is observable and a later retry succeeds without a page reload', async () => {
  const context = loadContext({ storage: createStorage(), catalogError: new Error('temporary catalog failure') });
  await assert.rejects(context.CoreLoader.discoverExternalModules(), /temporary catalog failure/);
  assert.match(context.CoreLoader.getCatalogDiagnostics().error, /temporary catalog failure/);

  context.fetch = async (url) => {
    if (String(url).includes('/api/v1/modules')) return { ok: true, status: 200, async json() { return { ok: true, data: { modules: [moduleEntry], accessContext: { mode: 'anonymous' } } }; } };
    if (String(url).endsWith('/Web-App/app/modules/gps/index.js')) return { ok: true, async text() { return 'window.GpsModule = { id: "gps", name: "GPS", status: "available", active: false };'; } };
    return { ok: false, async text() { return ''; } };
  };
  const modules = await context.CoreLoader.discoverExternalModules();
  assert.deepEqual(Array.from(modules, (module) => module.id), ['gps']);
  assert.equal(context.CoreLoader.getCatalogDiagnostics().moduleCount, 1);
});

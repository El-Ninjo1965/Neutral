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
  const sandbox = {
    console,
    URL,
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
    fetch: async (url) => {
      if (String(url).includes('/api/v1/modules')) {
        if (catalogError) throw catalogError;
        return {
          ok: true,
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

test('first offline load without anonymous cache fails closed', async () => {
  const context = loadContext({ storage: createStorage(), catalogError: new Error('offline') });
  assert.deepEqual(JSON.parse(JSON.stringify(await context.CoreLoader.discoverExternalModules())), []);
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

  const modules = await context.CoreLoader.discoverExternalModules();
  assert.equal(modules.length, 1);
  assert.equal(Array.from(storage.seed.keys()).some((key) => key.startsWith('neutral.module-catalog.anonymous.v1:')), false);

  const offline = loadContext({ storage, catalogError: new Error('offline') });
  assert.deepEqual(JSON.parse(JSON.stringify(await offline.CoreLoader.discoverExternalModules())), []);
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

  assert.deepEqual(JSON.parse(JSON.stringify(await context.CoreLoader.discoverExternalModules())), []);
  assert.equal(storage.seed.size, 0);
});

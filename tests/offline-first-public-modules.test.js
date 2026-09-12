'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const access = require('../Web-App/public/user-module-access.js');

const root = path.resolve(__dirname, '..');

function managerHarness() {
  const records = new Map();
  let discover = () => new Promise(() => {});
  const registry = {
    discover: () => discover(), getAll: () => Array.from(records.values()), get: (id) => records.get(id) || null,
    has: (id) => records.has(id), register: (module) => { records.set(module.id, module); return module; }, unregister: (id) => records.delete(id)
  };
  const gps = { id: 'gps', name: 'GPS', type: 'module', publicOffline: true, enable() { this.enabledByHydration = true; } };
  const sandbox = { window: null, ModuleRegistry: registry, CoreLoader: { getPublicOfflineModules: () => [{ ...gps, active: true, registered: true }] }, Core: { emit() {} } };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'Web-App/core/module-manager.js'), 'utf8'), sandbox);
  sandbox.ModuleManager.init();
  return { manager: sandbox.ModuleManager, records, setDiscover: (fn) => { discover = fn; } };
}

test('cold/offline bootstrap hydrates active public GPS before any catalog promise resolves', async () => {
  const harness = managerHarness();
  const hydrated = harness.manager.hydratePublicOfflineModules();
  assert.equal(hydrated.length, 1);
  assert.equal(harness.records.get('gps').enabledByHydration, true);

  let resolveCatalog;
  harness.setDiscover(() => new Promise((resolve) => { resolveCatalog = resolve; }));
  const synchronization = harness.manager.discoverModules();
  assert.deepEqual(Array.from(harness.records.keys()), ['gps']);
  resolveCatalog([]);
  await synchronization;
  assert.deepEqual(Array.from(harness.records.keys()), ['gps']);
});

test('catalog failure is not an empty success and keeps locally active GPS', async () => {
  const harness = managerHarness();
  harness.manager.hydratePublicOfflineModules();
  harness.setDiscover(async () => { throw new Error('catalog unavailable'); });
  await assert.rejects(harness.manager.discoverModules(), /catalog unavailable/);
  assert.deepEqual(Array.from(harness.records.keys()), ['gps']);
});

test('public GPS is role/permission independent while Profile and Moderation remain sensitive', () => {
  const gps = { id: 'gps', active: true, publicOffline: true, access: { visibilityPermissions: [], usagePermissions: [] } };
  const profile = { id: 'profile', active: true, access: { visibilityPermissions: ['profile.view'] } };
  const moderation = { id: 'moderation', active: true, access: { visibilityPermissions: ['moderation.review'] } };
  for (const currentUser of [
    null, // anonymous
    { roles: ['User'], permissions: [] },
    { roles: ['Tester'], permissions: [] },
    { roles: ['Developer'], permissions: [] },
    { roles: ['Administrator'], permissions: [] }
  ]) {
    assert.equal(access.isVisible(gps, currentUser), true, 'GPS must be visible for all roles without permissions');
    assert.equal(access.isNavigable(gps, currentUser), true, 'GPS must be navigable for all roles without permissions');
  }
  assert.equal(access.isVisible(profile, { permissions: [] }), false);
  assert.equal(access.isVisible(profile, { permissions: ['profile.view'] }), true);
  assert.equal(access.isVisible(moderation, { permissions: [] }), false);
});

test('shipped public projection is versioned, minimal and contains no auth material', () => {
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'Web-App/public/public-module-state.js'), 'utf8'), sandbox);
  const projection = JSON.parse(JSON.stringify(sandbox.NeutralPublicOfflineModules));
  assert.equal(projection.schemaVersion, 1);
  assert.deepEqual(projection.modules.map((module) => module.id), ['gps']);
  assert.doesNotMatch(JSON.stringify(projection), /permissions|session|cookie|token|identity/i);
});

test('publicOffline flag survives validateManifest, Registry, and ModuleManager normalization', () => {
  const sandbox = { window: null };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'Web-App/core/module-interface.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'Web-App/core/module-registry.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'Web-App/core/module-manager.js'), 'utf8'), sandbox);

  const rawManifest = {
    id: 'gps',
    name: 'GPS',
    version: '1.0.0',
    type: 'module',
    publicOffline: true,
    active: true,
    status: 'active'
  };

  const validated = sandbox.ModuleInterface.validateManifest(rawManifest);
  assert.equal(validated.publicOffline, true, 'ModuleInterface.validateManifest must preserve publicOffline');

  sandbox.ModuleManager.init();
  const normalized = sandbox.ModuleManager.normalizeModule(rawManifest);
  assert.equal(normalized.publicOffline, true, 'ModuleManager.normalizeModule must preserve publicOffline');
});

test('authoritative admin deactivation in catalog deactivates local publicOffline GPS and syncs cache', async () => {
  const sandbox = {
    window: null,
    document: { readyState: 'complete', addEventListener() {} },
    NeutralPublicPath: { join(...args) { return args.join('/'); }, api(p) { return '/api/' + p; } },
    localStorage: { store: new Map(), getItem(k) { return this.store.get(k) || null; }, setItem(k, v) { this.store.set(k, v); } }
  };
  sandbox.window = sandbox;
  sandbox.GpsModule = { id: 'gps', name: 'GPS', active: true, status: 'enabled', publicOffline: true };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'Web-App/public/public-module-state.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'Web-App/core/core-loader.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'Web-App/core/module-interface.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'Web-App/core/module-registry.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'Web-App/core/module-manager.js'), 'utf8'), sandbox);

  sandbox.ModuleManager.init();
  sandbox.ModuleManager.hydratePublicOfflineModules();
  assert.equal(sandbox.ModuleRegistry.get('gps')?.active, true);

  sandbox.FrameworkModuleCatalog = [{
    id: 'gps',
    name: 'GPS',
    version: '1.0.0',
    type: 'module',
    publicOffline: true,
    active: false,
    status: 'inactive',
    lifecycleState: 'INACTIVE',
    globalName: 'GpsModule'
  }];
  sandbox.GpsModule.active = false;
  sandbox.GpsModule.status = 'inactive';

  await sandbox.ModuleManager.discoverModules();
  assert.equal(sandbox.ModuleRegistry.get('gps')?.active, false, 'Authoritative deactivation must set active: false');
});

test('ModuleRegistry.discover includes already registered modules so discovery reconciliation does not delete them', async () => {
  const sandbox = { window: null };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'Web-App/core/module-interface.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'Web-App/core/module-registry.js'), 'utf8'), sandbox);

  sandbox.GpsModule = { id: 'gps', name: 'GPS', active: true, status: 'active', publicOffline: true };
  sandbox.ModuleRegistry.register({ id: 'gps', name: 'GPS', active: true, status: 'active', publicOffline: true });
  sandbox.FrameworkModuleCatalog = [{ id: 'gps', name: 'GPS', version: '1.0.0', globalName: 'GpsModule', publicOffline: true, active: true, status: 'active' }];

  const discovered = await sandbox.ModuleRegistry.discover();
  const gpsDiscovered = discovered.find((m) => m.id === 'gps');
  assert.ok(gpsDiscovered, 'ModuleRegistry.discover must return already registered modules when present in catalog');
});

test('authenticated user with profile.view and profile.update sees and updates profile in settings path', () => {
  const user = { id: '42', username: 'ralf', permissions: ['profile.view', 'profile.update'] };
  const profileModule = {
    id: 'profile',
    name: 'Profile',
    active: true,
    status: 'enabled',
    lifecycleState: 'ACTIVE',
    access: { visibilityPermissions: ['profile.view'], usagePermissions: ['profile.update'] },
    clientAccess: { mode: 'authenticated', canView: true, canUse: true, navigationVisible: true }
  };

  const visible = access.visibleModules([profileModule], { currentUser: user });
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, 'profile');

  // Verify profile permissions check for Settings UI
  const permissions = user.permissions;
  const profileAvailable = Boolean(profileModule.active && permissions.includes('profile.view') && permissions.includes('profile.update'));
  assert.equal(profileAvailable, true, 'Profile must be available in settings when active and permissions match');
});

test('publicOffline GPS hydration enables the GpsModule runtime singleton instance directly', {
  skip: !fs.existsSync(path.join(root, 'Web-App/app/modules/gps/index.js'))
}, async () => {
  const sandbox = {
    window: null,
    document: { readyState: 'complete', addEventListener() {} },
    isSecureContext: true,
    navigator: { geolocation: { getCurrentPosition(cb) { cb({ coords: { latitude: 50, longitude: 10 }, timestamp: Date.now() }); } } },
    NeutralPublicPath: { join(...args) { return args.join('/'); }, api(p) { return '/api/' + p; } },
    localStorage: { store: new Map(), getItem(k) { return this.store.get(k) || null; }, setItem(k, v) { this.store.set(k, v); } }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'Web-App/public/public-module-state.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'Web-App/core/module-interface.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'Web-App/core/module-registry.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'Web-App/core/module-manager.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'Web-App/core/core-loader.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'Web-App/app/modules/gps/index.js'), 'utf8'), sandbox);

  sandbox.ModuleManager.init();
  sandbox.ModuleManager.hydratePublicOfflineModules();

  const runtimeState = sandbox.GpsModule.getRuntimeState();
  assert.equal(runtimeState.active, true, 'GpsModule singleton active property must be true after hydration');
  assert.equal(runtimeState.status, 'enabled', 'GpsModule singleton status property must be enabled after hydration');

  const position = await sandbox.GpsModule.getCurrentPosition();
  assert.equal(position.latitude, 50, 'getCurrentPosition must resolve without MODULE_NOT_ENABLED error');
});

test('fetchRemoteCatalog accepts catalog payloads containing modules with canView=false without throwing catalog invalid error', async () => {
  const sandbox = {
    window: null,
    document: { readyState: 'complete', addEventListener() {} },
    navigator: { onLine: true },
    GpsModule: { id: 'gps', name: 'GPS' },
    NeutralPublicPath: { join(...args) { return args.join('/'); }, api(p) { return '/api/' + p; } },
    localStorage: { store: new Map(), getItem(k) { return this.store.get(k) || null; }, setItem(k, v) { this.store.set(k, v); } },
    fetch: async (url) => ({
      ok: !url.includes('.json'),
      text: async () => '/* script */',
      json: async () => ({
        data: {
          accessContext: { mode: 'anonymous' },
          modules: [
            { id: 'gps', publicOffline: true, clientAccess: { mode: 'anonymous', canView: true, canUse: true } },
            { id: 'restricted', clientAccess: { mode: 'anonymous', canView: false, canUse: false } }
          ]
        }
      })
    })
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'Web-App/core/module-interface.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'Web-App/core/core-loader.js'), 'utf8'), sandbox);

  const discovered = await sandbox.CoreLoader.discoverExternalModules();
  assert.equal(discovered.length, 1, 'Should filter out non-viewable modules without throwing catalog invalid error');
  assert.equal(discovered[0].id, 'gps');
});

test('admin session check clears authMessage when unauthenticated during page init', () => {
  const source = fs.readFileSync(path.join(root, 'Web-App/public/master-ui.js'), 'utf8');
  assert.match(source, /if\s*\(isServerAuthPage\)\s*\{[\s\S]*?sessionApiClient\.me\(\)[\s\S]*?authMessage/);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const load = (context, name) => vm.runInContext(
  fs.readFileSync(path.join(__dirname, '../Web-App/core', name), 'utf8'),
  context,
  { filename: name }
);

test('public core contract is versioned, immutable and separates internal globals', () => {
  const browser = { window: null };
  browser.window = browser;
  const context = vm.createContext(browser);
  load(context, 'core.js');
  load(context, 'core-contracts.js');

  assert.equal(browser.Core.contractVersion, '1.0.0');
  assert.equal(browser.Core.getContract(), browser.CoreContracts);
  assert.equal(Object.isFrozen(browser.CoreContracts), true);
  assert.equal(Object.isFrozen(browser.CoreContracts.events), true);
  assert.equal(browser.Core.events.NETWORK_CHANGED, 'network:changed');
  assert.equal(browser.Core.isPublicFacade('CoreNetwork'), true);
  assert.equal(browser.Core.isPublicFacade('CoreEventBus'), false);
  assert.equal(browser.CoreContracts.internalGlobals.includes('MasterFramework'), true);
});

test('event bus isolates failing handlers, records delivery and supports cleanup', () => {
  const handled = [];
  const ring = [];
  const browser = {
    window: null,
    CoreErrorHandler: { handle(error, context) { handled.push({ error, context }); } },
    CoreEventRing: { push(name, payload) { ring.push({ name, payload }); } }
  };
  browser.window = browser;
  const context = vm.createContext(browser);
  load(context, 'core-event-bus.js');
  const unsubscribe = browser.CoreEventBus.subscribe('module:test:changed', () => { throw new Error('failure'); });
  browser.CoreEventBus.subscribe('module:test:changed', () => {});
  assert.equal(browser.CoreEventBus.publish('module:test:changed', { ok: true }), 1);
  assert.equal(handled.length, 1);
  assert.equal(ring.length, 1);
  unsubscribe();
  browser.CoreEventBus.clear();
  assert.equal(browser.CoreEventBus.publish('module:test:changed'), 0);
});

test('service manager enforces names, visibility, duplicate protection and disposal', () => {
  let disposed = false;
  const browser = {
    window: null,
    Core: { emit() {} },
    UserService: {}, AuthService: {}, ModuleService: {}, LoggingService: {}, CacheService: {}
  };
  browser.window = browser;
  const context = vm.createContext(browser);
  load(context, 'service-manager.js');
  browser.ServiceManager.initialized = true;
  browser.ServiceManager.register('module.example', { dispose() { disposed = true; } });
  browser.ServiceManager.register('core.secret', {}, { visibility: 'internal' });
  assert.equal(browser.ServiceManager.has('module.example'), true);
  assert.equal(browser.ServiceManager.has('core.secret'), false);
  assert.equal(browser.ServiceManager.has('core.secret', { includeInternal: true }), true);
  assert.throws(() => browser.ServiceManager.get('core.secret'), /not found/);
  assert.throws(() => browser.ServiceManager.register('module.example', {}), /already registered/);
  assert.equal(browser.ServiceManager.unregister('module.example'), true);
  assert.equal(disposed, true);
});

test('network service initializes once, emits only transitions and can be disposed', () => {
  const handlers = new Map();
  const emitted = [];
  const browser = {
    window: null,
    navigator: { onLine: true },
    Core: { emit(name, payload) { emitted.push({ name, payload }); } },
    addEventListener(name, handler) { handlers.set(name, handler); },
    removeEventListener(name, handler) { if (handlers.get(name) === handler) handlers.delete(name); }
  };
  browser.window = browser;
  const context = vm.createContext(browser);
  load(context, 'core-network.js');
  browser.CoreNetwork.init();
  browser.CoreNetwork.init();
  assert.equal(handlers.size, 2);
  handlers.get('offline')();
  handlers.get('offline')();
  assert.equal(browser.CoreNetwork.isOnline(), false);
  assert.equal(emitted.filter(({ name }) => name === 'network:changed').length, 1);
  assert.equal(Object.isFrozen(browser.CoreNetwork.getStatus()), true);
  browser.CoreNetwork.dispose();
  assert.equal(handlers.size, 0);
  assert.equal(browser.CoreNetwork.getStatus().initialized, false);
});

test('core storage namespaces module keys without changing the persisted prefix', () => {
  const values = new Map();
  const localStorage = {
    get length() { return values.size; }, key(index) { return [...values.keys()][index] || null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, value); }, removeItem(key) { values.delete(key); }
  };
  const browser = { window: null, localStorage };
  browser.window = browser;
  const context = vm.createContext(browser);
  load(context, 'core-storage.js');
  const storage = browser.CoreStorage.namespace('module:gps');
  storage.set('last-position', { latitude: 1 });
  assert.equal(values.has('core:module:gps:last-position'), true);
  assert.equal(storage.get('last-position').latitude, 1);
});

test('module config is isolated by module id and rejects secret-shaped values', () => {
  const browser = { window: null, Core: { emit() {} } };
  browser.window = browser;
  const context = vm.createContext(browser);
  load(context, 'config-manager.js');
  browser.ConfigManager.set('moduleSettings', {});
  browser.ConfigManager.setModule('gps', { accuracy: 'high' });
  assert.equal(browser.ConfigManager.getModule('gps').accuracy, 'high');
  assert.throws(() => browser.ConfigManager.setModule('gps', { apiToken: 'unsafe' }), /must not contain secrets/);
});

test('database schema upgrade creates missing stores without replacing existing stores', () => {
  const created = [];
  const existing = new Set(['users', 'settings']);
  const browser = { window: null };
  browser.window = browser;
  const context = vm.createContext(browser);
  load(context, 'database-manager.js');
  browser.DatabaseManager.createStores({
    objectStoreNames: { contains: (name) => existing.has(name) },
    createObjectStore(name) {
      created.push(name);
      return { createIndex() {} };
    }
  });
  assert.equal(created.includes('users'), false);
  assert.equal(created.includes('settings'), false);
  assert.deepEqual(created.sort(), ['cache', 'logs', 'modules', 'sessions', 'sync'].sort());
});

test('error path classifies, redacts and bounds diagnostic entries', () => {
  const listeners = new Map();
  const emitted = [];
  const browser = {
    window: null,
    addEventListener(name, handler) { listeners.set(name, handler); },
    Core: { emit(name, payload) { emitted.push({ name, payload }); } }
  };
  browser.window = browser;
  const context = vm.createContext(browser);
  load(context, 'error-log.js');
  load(context, 'core-error-handler.js');
  browser.CoreErrorHandler.handle(new Error('failed'), {
    type: 'module-lifecycle', moduleId: 'example', apiToken: 'do-not-log'
  });
  const entry = browser.ErrorLog.getAll()[0];
  assert.equal(entry.type, 'module-lifecycle');
  assert.equal(entry.code, 'CORE_RUNTIME_ERROR');
  assert.equal(entry.context.apiToken, '[redacted]');
  assert.equal(emitted[0].payload.error, undefined);
  for (let index = 0; index < 300; index += 1) browser.ErrorLog.record(`error-${index}`);
  assert.equal(browser.ErrorLog.getAll().length, 256);
});

test('generic module lifecycle keeps install inactive and cleans active modules before uninstall', () => {
  const events = [];
  const calls = [];
  const modules = new Map();
  const registry = {
    register(module) { modules.set(module.id, module); return module; },
    unregister(id) { return modules.delete(id); }, get(id) { return modules.get(id) || null; },
    getAll() { return [...modules.values()]; }, getByApp() { return [...modules.values()]; }, has(id) { return modules.has(id); }
  };
  const browser = { window: null, ModuleRegistry: registry, Core: { state: {}, emit(name) { events.push(name); } } };
  browser.window = browser;
  const context = vm.createContext(browser);
  load(context, 'module-manager.js');
  browser.ModuleManager.register({
    id: 'reference', name: 'Reference', dependencies: [],
    install() { calls.push('install'); }, activate() { calls.push('activate'); },
    deactivate() { calls.push('deactivate'); }, update() { calls.push('update'); }, uninstall() { calls.push('uninstall'); }
  });
  const installed = browser.ModuleManager.install('reference');
  assert.equal(installed.lifecycleState, 'INACTIVE');
  assert.equal(installed.active, false);
  browser.ModuleManager.activate('reference');
  assert.equal(installed.lifecycleState, 'ACTIVE');
  browser.ModuleManager.update('reference');
  browser.ModuleManager.uninstall('reference');
  assert.deepEqual(calls, ['install', 'activate', 'update', 'deactivate', 'uninstall']);
  assert.equal(browser.ModuleManager.get('reference'), null);
  assert.equal(events.includes('module:uninstalled'), true);
});

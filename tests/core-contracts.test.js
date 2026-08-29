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

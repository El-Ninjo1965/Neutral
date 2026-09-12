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
  assert.deepEqual(Array.from(harness.records.keys()), []);
});

test('catalog failure is not an empty success and keeps locally active GPS', async () => {
  const harness = managerHarness();
  harness.manager.hydratePublicOfflineModules();
  harness.setDiscover(async () => { throw new Error('catalog unavailable'); });
  await assert.rejects(harness.manager.discoverModules(), /catalog unavailable/);
  assert.deepEqual(Array.from(harness.records.keys()), ['gps']);
});

test('public GPS is role/permission independent while Profile and Moderation remain sensitive', () => {
  const gps = { id: 'gps', active: true, publicOffline: true };
  const profile = { id: 'profile', active: true, access: { visibilityPermissions: ['profile.view'] } };
  const moderation = { id: 'moderation', active: true, access: { visibilityPermissions: ['moderation.review'] } };
  for (const currentUser of [null, { roles: ['Tester'], permissions: [] }, { roles: ['Developer'], permissions: [] }, { roles: ['Administrator'], permissions: [] }]) {
    assert.equal(access.isVisible(gps, currentUser), true);
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

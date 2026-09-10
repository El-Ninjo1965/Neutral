'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('active system modules can expose capabilities without entering User navigation', () => {
  global.window = {};
  require('../Web-App/core/module-interface.js');
  const ModuleInterface = global.window.ModuleInterface;
  const access = require('../Web-App/public/user-module-access.js');
  const module = ModuleInterface.create({ id: 'profile', version: '1.0.0', permissions: [], capabilities: ['profile'], dependencies: [], optionalDependencies: ['media', 'sharing'], presentation: { userNavigation: false, adminNavigation: false, system: true } });
  module.status = 'active'; module.active = true;
  assert.equal(access.isVisible(module, { permissions: [] }), true, 'capability remains available');
  assert.equal(access.isNavigable(module, { permissions: [] }), false, 'system module stays out of User navigation');
  assert.deepEqual(access.visibleModules([module], { currentUser: { permissions: [] } }), []);
  assert.deepEqual(module.optionalDependencies, ['media', 'sharing']);
  delete global.window;
});

test('server and browser normalize the same optional presentation contract', () => {
  const server = fs.readFileSync(path.join(root, 'Server/php/src/ModuleContract.php'), 'utf8');
  const runtime = fs.readFileSync(path.join(root, 'Server/php/src/Phase7ModuleRuntime.php'), 'utf8');
  assert.match(server, /optionalDependencies/);
  assert.match(server, /'userNavigation'/);
  assert.match(runtime, /'presentation'/);
});

test('offline shell includes shared password feedback helper', () => {
  const worker = fs.readFileSync(path.join(root, 'Web-App/public/service-worker.js'), 'utf8');
  assert.match(worker, /PUBLIC_SCRIPTS[\s\S]*ui-feedback\.js/);
  assert.match(worker, /public-path\|api-client\|ui-feedback/);
});

test('architecture keeps concrete system features optional and Field Notes core-neutral', () => {
  const contract = fs.readFileSync(path.join(root, 'SYSTEM-MODULES.md'), 'utf8');
  for (const key of ['profile', 'media', 'sharing', 'moderation', 'notifications', 'postbox', 'field-notes']) assert.match(contract, new RegExp('`' + key + '`'));
  assert.match(contract, /without edits to existing Core files/);
  assert.match(contract, /compatibility bridge/);
});

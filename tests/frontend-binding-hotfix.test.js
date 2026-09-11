'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const AdminModulesView = require('../Web-App/public/admin/modules-view.js');

global.AdminCommon = {
  showAlert() {},
  confirmAction() { return true; },
  unwrapData(result, key, fallback) { return result?.data?.[key] ?? fallback; }
};

const createBoundView = (category) => {
  const calls = [];
  const api = {
    installModule: async (id) => { calls.push(['install', id]); return { ok: true }; },
    activateModule: async (id) => { calls.push(['activate', id]); return { ok: true }; },
    deactivateModule: async (id) => { calls.push(['deactivate', id]); return { ok: true }; },
    uninstallModule: async (id) => { calls.push(['uninstall', id]); return { ok: true }; }
  };
  const listeners = {};
  const root = { addEventListener(type, handler) { listeners[type] = handler; }, contains() { return true; } };
  const container = { querySelector(selector) { return selector === '.admin-modules-view' ? root : null; } };
  const view = new AdminModulesView(api, category);
  view.container = container;
  view.reload = async () => { calls.push(['reload']); };
  view.showDetails = async (id) => { calls.push(['details', id]); };
  view.bindLifecycleActions();
  const click = async (action, moduleId = '') => {
    const button = { dataset: { moduleAction: action, moduleId }, disabled: false };
    listeners.click({ target: { closest: () => button } });
    await new Promise((resolve) => setImmediate(resolve));
  };
  return { calls, click };
};

for (const category of ['user', 'system']) {
  test(`${category} module view owns lifecycle button actions`, async () => {
    const { calls, click } = createBoundView(category);
    await click('install', category === 'user' ? 'profile' : 'media');
    assert.deepEqual(calls.slice(0, 3), [['install', category === 'user' ? 'profile' : 'media'], ['reload'], ['details', category === 'user' ? 'profile' : 'media']]);
  });
}

test('module actions remain instance-scoped across every lifecycle action and reload', async () => {
  const { calls, click } = createBoundView('user');
  for (const action of ['details', 'activate', 'deactivate', 'uninstall', 'reload']) await click(action, 'gps');
  assert.equal(calls.filter(([action]) => action === 'activate').length, 1);
  assert.equal(calls.filter(([action]) => action === 'deactivate').length, 1);
  assert.equal(calls.filter(([action]) => action === 'uninstall').length, 1);
  assert.ok(calls.some(([action]) => action === 'reload'));
});

test('module markup contains no global inline lifecycle binding', () => {
  const view = new AdminModulesView({}, 'user');
  const markup = view.renderRow({ id: 'gps', registered: false, lifecycleState: 'DISCOVERED' });
  assert.doesNotMatch(markup, /onclick=|adminModules/);
  assert.match(markup, /data-module-action="install" data-module-id="gps"/);
  assert.doesNotMatch(fs.readFileSync(path.join(__dirname, '../Web-App/public/admin-init.js'), 'utf8'), /adminModules/);
});

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('production script order toggles the currently visible User Login input twice without replacement', async () => {
  const documentListeners = {};
  const document = {
    readyState: 'loading', body: { appendChild() {} },
    addEventListener(type, handler, options) { (documentListeners[type] ||= []).push({ handler, capture: options === true }); },
    querySelectorAll() { return []; }, createElement() { return {}; }
  };
  const sandbox = { document, window: {}, module: { exports: {} }, MutationObserver: class { observe() {} } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../Web-App/public/ui-feedback.js'), 'utf8'), sandbox);

  const wrapper = { querySelector() { return input; } };
  const buttonListeners = {};
  const input = {
    type: 'password', dataset: {}, isConnected: true,
    setAttribute(name, value) { if (name === 'type') this.type = value; }, focus() { this.focused = true; }
  };
  const button = {
    type: 'button', dataset: { neutralPasswordToggle: 'true' }, classList: { add() {} }, attributes: {}, innerHTML: '',
    addEventListener(type, handler) { buttonListeners[type] = handler; },
    setAttribute(name, value) { this.attributes[name] = value; },
    closest(selector) { return selector === '.password-input-wrap' ? wrapper : this; }
  };
  sandbox.window.NeutralUiFeedback.bindPasswordToggle(input, button);
  const visibleInput = input;
  const click = () => {
    const event = { target: { closest: () => button }, preventDefault() {} };
    for (const { handler, capture } of documentListeners.click || []) if (capture) handler(event);
    buttonListeners.click(event);
  };
  click();
  await Promise.resolve();
  assert.equal(input, visibleInput);
  assert.equal(input.type, 'text');
  assert.equal(button.attributes['aria-pressed'], 'true');
  click();
  await Promise.resolve();
  assert.equal(input, visibleInput);
  assert.equal(input.type, 'password');
  assert.equal(button.attributes['aria-pressed'], 'false');
});

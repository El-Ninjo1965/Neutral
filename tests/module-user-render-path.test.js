'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const access = require('../Web-App/public/user-module-access.js');
const Moderation = require('../Web-App/app/modules/moderation/index.js');
const AdminModulesView = require('../Web-App/public/admin/modules-view.js');

const activeModule = (id, permission, navigationVisible = true) => ({
  id,
  name: id === 'profile' ? 'Profile' : 'Moderation',
  active: true,
  lifecycleState: 'ACTIVE',
  access: { visibilityPermissions: [permission], usagePermissions: [permission] },
  presentation: { userNavigation: true },
  clientAccess: { mode: 'authenticated', canView: true, canUse: true, navigationVisible }
});

test('authenticated Profile projection reaches the User render list and deactivation removes it', () => {
  const user = { id: '7', permissions: ['profile.view', 'profile.update'] };
  const profile = activeModule('profile', 'profile.view');
  const rendered = access.visibleModules([profile], { currentUser: user });
  assert.deepEqual(rendered.map((module) => module.id), ['profile']);
  assert.equal(access.findVisibleModule(rendered, 'profile', { currentUser: user }), profile);

  profile.active = false;
  profile.lifecycleState = 'INACTIVE';
  assert.deepEqual(access.visibleModules([profile], { currentUser: user }), []);
});

test('Moderator permission reaches and renders the actual Moderation entry', async () => {
  const user = { id: '7', roles: ['Moderator'], permissions: ['moderation.review'] };
  const module = activeModule('moderation', 'moderation.review');
  assert.equal(access.findVisibleModule([module], 'moderation', { currentUser: user }), module);

  const status = { textContent: '' };
  const container = { innerHTML: '', querySelector(selector) { return selector === '[data-moderation-status]' ? status : null; } };
  global.window = { ApiClient: class { async get(path) { assert.equal(path, '/api/modules/moderation/status'); return { ok: true, data: { data: { available: true } } }; } } };
  Moderation.renderUserInterface(container);
  await new Promise((resolve) => setImmediate(resolve));
  assert.match(container.innerHTML, /<h1>Moderation<\/h1>/);
  assert.equal(status.textContent, 'Moderation service ready.');
  delete global.window;
});

test('module overview is lightweight and Details replaces it with its own view', async () => {
  const nodes = new Map();
  const container = {
    _html: '',
    set innerHTML(value) {
      this._html = value;
      nodes.clear();
      if (value.includes('id="modules-table"')) nodes.set('#modules-table', { innerHTML: '' });
      if (value.includes('id="module-details"')) nodes.set('#module-details', { style: {}, innerHTML: '', querySelector() { return null; }, querySelectorAll() { return []; } });
      if (value.includes('data-module-back')) nodes.set('[data-module-back]', { addEventListener() {} });
      nodes.set('.admin-modules-view', { addEventListener() {} });
    },
    get innerHTML() { return this._html; },
    querySelector(selector) { return nodes.get(selector) || null; }
  };
  global.AdminCommon = { unwrapData: (result, key, fallback) => result?.data?.[key] ?? fallback, showAlert() {} };
  const module = { id: 'profile', name: 'Profile', category: 'user', registered: true, active: true, lifecycleState: 'ACTIVE', permissionDefinitions: [] };
  const api = {
    async getAdminModules() { return { ok: true, data: { modules: [module] } }; },
    async getAdminModule() { return { ok: true, data: { module } }; },
    async getAdminModulePermissions() { return { ok: true, data: { modulePermissions: {} } }; },
    async getSettings() { return { ok: true, data: { settings: {} } }; }
  };
  const view = new AdminModulesView(api, 'user');
  await view.init(container);
  assert.match(container.innerHTML, /id="modules-table"/);
  assert.doesNotMatch(container.innerHTML, /id="module-details"/);
  await view.showDetails('profile');
  assert.match(container.innerHTML, /module-detail-view/);
  assert.match(container.innerHTML, /Back to App Modules/);
  assert.doesNotMatch(container.innerHTML, /id="modules-table"/);
});

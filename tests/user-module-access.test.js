'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const accessPath = path.join(projectRoot, 'Web-App/public/user-module-access.js');

const loadAccess = () => require(accessPath);

const modules = [
  {
    id: 'gps',
    active: true,
    access: { visibilityPermissions: ['gps.view'], usagePermissions: ['gps.use'] },
    clientAccess: { mode: 'anonymous', canView: true, canUse: true }
  },
  {
    id: 'private',
    active: true,
    access: { visibilityPermissions: ['private.view'], usagePermissions: ['private.use'] },
    clientAccess: { mode: 'anonymous', canView: false, canUse: false }
  },
  {
    id: 'inactive',
    active: false,
    status: 'inactive',
    access: { visibilityPermissions: ['inactive.view'] },
    clientAccess: { mode: 'anonymous', canView: true, canUse: true }
  }
];

test('anonymous visitors see only active modules approved by anonymous client access', () => {
  const access = loadAccess();
  assert.deepEqual(access.visibleModules(modules, { currentUser: null }).map((module) => module.id), ['gps']);
  assert.equal(access.findVisibleModule(modules, 'private', { currentUser: null }), null);
});

test('missing anonymous access metadata fails closed instead of using legacy public guesses', () => {
  const access = loadAccess();
  const ambiguous = [{ id: 'ambiguous', active: true, public: true, access: { visibilityPermissions: [] } }];
  assert.deepEqual(access.visibleModules(ambiguous, { currentUser: null }), []);
});

test('authenticated users use their effective module permissions', () => {
  const access = loadAccess();
  const currentUser = { id: 'u1', permissions: ['private.view'] };
  assert.deepEqual(access.visibleModules(modules, { currentUser }).map((module) => module.id), ['private']);
});

test('local visibility preferences can only narrow server-approved modules', () => {
  const access = loadAccess();
  assert.deepEqual(access.visibleModules(modules, {
    currentUser: null,
    visibleModuleIds: []
  }), []);
  assert.deepEqual(access.visibleModules(modules, {
    currentUser: null,
    visibleModuleIds: ['private']
  }), []);
});

test('user shell delegates visibility and never falls back to an unfiltered direct module lookup', () => {
  const source = fs.readFileSync(path.join(projectRoot, 'Web-App/public/user-app.js'), 'utf8');
  const index = fs.readFileSync(path.join(projectRoot, 'Web-App/public/index.html'), 'utf8');

  assert.match(source, /NeutralUserModuleAccess\.visibleModules/);
  assert.match(source, /NeutralUserModuleAccess\.findVisibleModule/);
  assert.doesNotMatch(source, /module\.public\s*!==\s*false/);
  assert.doesNotMatch(source, /getVisibleModules\(\)\.find[\s\S]{0,120}\|\|\s*getModules\(\)\.find/);
  assert.ok(index.indexOf('user-module-access.js') < index.indexOf('user-app.js'));
});

test('anonymous settings and viewer permission behavior are explained accurately', () => {
  const userSource = fs.readFileSync(path.join(projectRoot, 'Web-App/public/user-app.js'), 'utf8');
  const adminSource = fs.readFileSync(path.join(projectRoot, 'Web-App/public/admin/modules-view.js'), 'utf8');

  assert.match(userSource, /Local settings/);
  assert.match(adminSource, /without login/i);
  assert.match(adminSource, /visibility.*usage|usage.*visibility/i);
});


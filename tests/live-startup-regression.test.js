'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
const gpsReferenceAvailable = fs.existsSync(path.join(projectRoot, 'Web-App/app/modules/gps/index.js'));

test('user shell distinguishes pending discovery from an empty module catalog', () => {
  const source = read('Web-App/public/user-app.js');

  assert.match(source, /discoveryState/);
  assert.match(source, /startup:modules-ready/);
  assert.match(source, /Discovery läuft|Discovery in progress|Loading available modules/i);
  assert.doesNotMatch(source, /modules\.length \? modules\.map[\s\S]{0,300}No modules are active yet/);
});

test('user shell rerenders settings and navigation after discovery completes', () => {
  const source = read('Web-App/public/user-app.js');

  assert.match(source, /Core\.on\(['"]startup:modules-ready['"]/);
  assert.match(source, /renderApp\(\)/);
});

test('GPS module owns its title while the generic shell does not duplicate it', { skip: gpsReferenceAvailable ? false : 'GPS reference is not included' }, () => {
  const userSource = read('Web-App/public/user-app.js');
  const gpsSource = read('Web-App/app/modules/gps/index.js');

  assert.match(gpsSource, /<h1>GPS<\/h1>/);
  assert.doesNotMatch(userSource, /user-app-eyebrow">Module<\/span>[\s\S]{0,160}<h1>\$\{escapeHtml\(getModuleDisplayName\(module\)\)\}<\/h1>/);
});

test('navigation shows Start instead of the app name', () => {
  const source = read('Web-App/public/user-app.js');

  assert.match(source, /id:\s*['"]home['"],\s*label:\s*['"]Start['"]/);
  assert.doesNotMatch(source, /id:\s*['"]home['"],\s*label:\s*getAppName\(\)/);
});

test('navigation derives active state from the current view', () => {
  const source = read('Web-App/public/user-app.js');

  assert.match(source, /class="user-app-nav-item \$\{state\.activeView === item\.id \? 'active' : ''\}"/);
  assert.match(source, /state\.activeView = nextView/);
  assert.match(source, /state\.activeView = `module:\$\{moduleId\}`/);
  assert.doesNotMatch(source, /class="user-app-nav-item active"/);
});

test('module card open path sets the same view state as the nav button', () => {
  const source = read('Web-App/public/user-app.js');

  // The landing-page card path must run through renderModule, which sets
  // state.activeView = `module:<id>`; it must not render module content while
  // leaving state.activeView on 'home'.
  const cardBlock = source.match(/data-module-card[\s\S]{0,400}?renderModule\(button\.dataset\.moduleCard\)/);
  assert.ok(cardBlock, 'module card click must call renderModule');
  const renderModuleBody = source.match(/const renderModule = \(moduleId\) => \{[\s\S]*?\n  \};/);
  assert.ok(renderModuleBody);
  assert.match(renderModuleBody[0], /state\.activeView = `module:\$\{moduleId\}`/);
  assert.match(renderModuleBody[0], /state\.activeModuleId = moduleId/);
});

test('static shell placeholder nav carries no fake active state', () => {
  const source = read('Web-App/public/index.html');

  assert.doesNotMatch(source, /class="user-app-nav-item active" aria-current="page"/);
});

test('GPS view does not render the redundant module description text', { skip: gpsReferenceAvailable ? false : 'GPS reference is not included' }, () => {
  const gpsSource = read('Web-App/app/modules/gps/index.js');

  assert.doesNotMatch(gpsSource, /Neutral GPS tracking module\./);
});

test('GPS consent has modal presentation and focus management', { skip: gpsReferenceAvailable ? false : 'GPS reference is not included' }, () => {
  const gpsSource = read('Web-App/app/modules/gps/index.js');
  const css = read('Web-App/public/style.css');

  assert.match(gpsSource, /role="dialog"/);
  assert.match(gpsSource, /focus\(\)/);
  assert.match(css, /\.gps-confirmation-modal\s*\{[\s\S]*position:\s*fixed/);
  assert.match(css, /\.gps-confirmation-modal\s*\{[\s\S]*z-index/);
});

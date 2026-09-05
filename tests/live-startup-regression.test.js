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

test('startup diagnostics are kept internal and removed from the default user UI', () => {
  const source = read('Web-App/public/user-app.js');
  const startupSource = read('Web-App/core/core-startup.js');

  assert.doesNotMatch(source, /Startup-Diagnose \(temporär\)/);
  assert.doesNotMatch(source, /renderStartupDiagnostics/);
  assert.match(startupSource, /mark\('module-discovery-complete'\)/);
  assert.doesNotMatch(source, /window\.NeutralPublicPath\.admin\(\).*Admin/);
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

test('homepage config defaults to neutral content mode and stores central metadata', () => {
  const configSource = read('Web-App/core/config-manager.js');
  const settingsSource = read('Server/node/services/settings-service.js');

  assert.match(configSource, /this\.set\('homepage', \{\s*mode:\s*'content',\s*title:\s*'',\s*content:\s*'',\s*moduleId:\s*''\s*\}\);/s);
  assert.match(settingsSource, /const defaultHomepage = Object\.freeze\(\{\s*mode:\s*'content',\s*title:\s*'',\s*content:\s*'',\s*moduleId:\s*''\s*\}\);/s);
  assert.match(settingsSource, /moduleId\s*:\s*''|moduleId\s*=\s*typeof candidate\.moduleId/);
});

test('user home view falls back to neutral content when configured module is invalid', () => {
  const source = read('Web-App/public/user-app.js');

  assert.match(source, /if \(homepage\.mode === 'module'\) \{\s*const moduleId = homepage\.moduleId;/s);
  assert.match(source, /state\.activeView = 'home';\s*state\.activeModuleId = null;\s*content\.innerHTML = `/s);
  assert.match(source, /const heading = homepage\.title \? homepage\.title : appName;/);
  assert.match(source, /const message = homepage\.content\s*\?\s*homepage\.content\s*:\s*'<p class="user-app-intro">Welcome to the workspace\.<\/p>'/);
});

test('admin settings UI exposes the Startseite contract', () => {
  const source = read('Web-App/public/admin/settings-view.js');

  assert.match(source, /<legend>Startseite<\/legend>/);
  assert.match(source, /id="homepageMode"/);
  assert.match(source, /id="homepageTitle"/);
  assert.match(source, /id="homepageContent"/);
  assert.match(source, /id="homepageModuleId"/);
});

test('local settings save surfaces both success and error status without admin hints', () => {
  const source = read('Web-App/public/user-app.js');
  const css = read('Web-App/public/style.css');

  assert.match(source, /persisted = false;/);
  assert.match(source, /return \{ \.\.\.nextPreferences, persisted \};/);
  assert.match(source, /if \(nextPreferences\.persisted\) \{\s*status\.textContent = 'Settings saved successfully\.';\s*status\.className = 'user-settings-status success';\s*\} else \{\s*status\.textContent = 'Settings could not be saved\. Local storage is unavailable or restricted\.';\s*status\.className = 'user-settings-status error';/s);
  assert.match(source, /if \(nextPreferences\.persisted\) \{\s*status\.textContent = 'All functions are visible again\.';\s*status\.className = 'user-settings-status success';\s*\} else \{\s*status\.textContent = 'Reset could not be saved\. Local storage is unavailable or restricted\.';\s*status\.className = 'user-settings-status error';/s);
  assert.match(css, /\.user-settings-status\.error\s*\{/);
  assert.doesNotMatch(source, /Settings saved successfully\.'[\s\S]{0,200}[Aa]dmin/);
});

test('local settings persist across navigation and reload via localStorage', () => {
  const source = read('Web-App/public/user-app.js');

  assert.match(source, /const USER_SETTINGS_KEY = 'neutral\.user\.preferences\.v1';/);
  assert.match(source, /localStorage\.setItem\(USER_SETTINGS_KEY, JSON\.stringify\(nextPreferences\)\);/);
  assert.match(source, /localStorage\.getItem\(USER_SETTINGS_KEY\)/);
  assert.match(source, /Show all functions<\/button>/);
  assert.doesNotMatch(source, /userSettingsResetButton[\s\S]{0,400}[Aa]dmin/);
});

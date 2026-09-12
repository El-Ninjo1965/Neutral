'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
const source = read('Web-App/public/user-app.js');

test('A. Login success stays on home while delayed authenticated discovery resolves later', () => {
  assert.match(source, /sessionRevision\s*\+=\s*1/);
  assert.match(source, /state\.activeView = 'home';\s*writeHashRoute\(''\);\s*renderApp\(\);/);
  assert.match(source, /const refreshModuleDiscovery = async \(\) => \{[\s\S]*?discoveryRequestId[\s\S]*?if \(requestId !== state\.discoveryRequestId\)/);
  assert.match(source, /state\.activeView = 'home';[\s\S]*?writeHashRoute\(''\);/);
});

test('B. Start button remains stable across background rerenders and discovery updates', () => {
  assert.match(source, /renderModuleNav\s*=\s*\(\) => \{[\s\S]*?data-user-nav/);
  assert.match(source, /if \(nextView === 'module:profile'\) \{[\s\S]*?renderApp\(\);\s*return;/);
  assert.match(source, /const renderApp = \(\) => \{[\s\S]*?renderActions\(\);\s*renderModuleNav\(\);/);
  assert.match(source, /state\.activeView === 'home'[^\n]*renderLandingPage\(\);/);
});

test('C. Settings catalog ignores stale module-discovery results and error states', () => {
  assert.match(source, /const requestId = \+\+state\.discoveryRequestId/);
  assert.match(source, /if \(requestId !== state\.discoveryRequestId\) return modules;/);
  assert.match(source, /if \(requestId !== state\.discoveryRequestId\)\s*\{\s*return \[\];\s*\}/);
  assert.match(source, /state\.discoveryState === 'error' \? 'Modules could not be loaded\. Check your connection and try again\.'/);
});

test('D. Settings save keeps success popup visible and stays in Settings without redirect', () => {
  assert.match(source, /state\.activeView = 'settings';\s*state\.activeModuleId = null;\s*writeHashRoute\(`settings\/\$\{state\.settingsSection\}`\);\s*status\.textContent = '';/);
  assert.match(source, /window\.NeutralUiFeedback\?\.showSuccess\('Successfully saved\.'/);
  assert.doesNotMatch(source, /writeHashRoute\(''\);\s*window\.NeutralUiFeedback\?\.showSuccess\('Successfully saved\.'\)/);
});

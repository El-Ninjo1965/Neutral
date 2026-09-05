'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

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

test('GPS module owns its title while the generic shell does not duplicate it', () => {
  const userSource = read('Web-App/public/user-app.js');
  const gpsSource = read('Web-App/app/modules/gps/index.js');

  assert.match(gpsSource, /<h1>GPS<\/h1>/);
  assert.doesNotMatch(userSource, /user-app-eyebrow">Module<\/span>[\s\S]{0,160}<h1>\$\{escapeHtml\(getModuleDisplayName\(module\)\)\}<\/h1>/);
});

test('GPS consent has modal presentation and focus management', () => {
  const gpsSource = read('Web-App/app/modules/gps/index.js');
  const css = read('Web-App/public/style.css');

  assert.match(gpsSource, /role="dialog"/);
  assert.match(gpsSource, /focus\(\)/);
  assert.match(css, /\.gps-confirmation-modal\s*\{[\s\S]*position:\s*fixed/);
  assert.match(css, /\.gps-confirmation-modal\s*\{[\s\S]*z-index/);
});

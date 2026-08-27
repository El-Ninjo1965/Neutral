'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, describe } = require('node:test');
const assert = require('node:assert');

describe('Web app integration contract', () => {
  test('public web app includes the canonical server API and browser auth contract', () => {
    const htmlPath = path.resolve(__dirname, '../webroot/index.html');
    const userAppPath = path.resolve(__dirname, '../webroot/user-app.js');
    const apiClientPath = path.resolve(__dirname, '../webroot/api-client.js');

    const html = fs.readFileSync(htmlPath, 'utf8');
    const userApp = fs.readFileSync(userAppPath, 'utf8');
    const apiClient = fs.readFileSync(apiClientPath, 'utf8');

    assert.match(html, /meta name="neutral-api-base" content="\/index\/app\/neutral\/webroot"/);
    assert.match(html, /<script src="api-client\.js"><\/script>/);

    assert.match(userApp, /resolveServerApiBase/);
    assert.match(userApp, /apiClient\.login\(|apiClient\.me\(|apiClient\.discoverModules\(/);
    assert.doesNotMatch(userApp, /LocalAuth\.login|LocalAuth\.|Local authentication is not available/);

    assert.match(apiClient, /this\.post\('\/api\/auth\/login'/);
    assert.match(apiClient, /this\.get\('\/api\/auth\/me'/);
    assert.match(apiClient, /this\.get\('\/api\/modules'/);
  });

  test('web app default API base stays on the existing server runtime instead of localhost', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../webroot/user-app.js'), 'utf8');
    assert.match(source, /https:\/\/www\.turbolikes\.com|index\/app\/neutral\/webroot/);
    assert.doesNotMatch(source, /localhost|127\.0\.0\.1|3000/);
  });
});

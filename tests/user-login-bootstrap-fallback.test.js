'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'Web-App/public/user-app.js'), 'utf8');

test('visible User password field still registers and executes the real submit flow', async () => {
  const match = source.match(/const showLoginForm = \(\) => \{[\s\S]*?\n  \};/);
  assert.ok(match);
  const listeners = {};
  const calls = [];
  const elements = {
    userLoginUsername: { value: ' tester ' },
    userLoginPassword: { type: 'text', value: 'secret' },
    userLoginSubmit: { disabled: false },
    userLoginStatus: { className: '', textContent: '' },
    userLoginForm: { addEventListener(name, handler) { listeners[name] = handler; } },
  };
  const sandbox = {
    window: {}, document: { getElementById(id) { return elements[id]; } },
    content: { innerHTML: '' }, state: {}, sessionRevision: 0,
    writeHashRoute() {}, renderApp() { calls.push('render'); },
    getServerApiClient() { return { async login(username, password) { calls.push([username, password]); return { ok: true }; } }; },
    extractServerAuthData() { return { user: { id: '7' } }; },
    applyServerUser() { return { id: '7' }; },
  };
  vm.runInNewContext(`${match[0]}\nshowLoginForm();`, sandbox);
  assert.equal(typeof listeners.submit, 'function');
  await listeners.submit({ preventDefault() {} });
  assert.deepEqual(calls[0], ['tester', 'secret']);
  assert.equal(calls[1], 'render');
  assert.equal(elements.userLoginPassword.type, 'text');
});

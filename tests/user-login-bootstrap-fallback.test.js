'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'Web-App/public/user-app.js'), 'utf8');

function runLoginForm() {
  const match = source.match(/const showLoginForm = \(\) => \{[\s\S]*?\n  \};/);
  assert.ok(match);
  const formListeners = {};
  const eyeListeners = {};
  const calls = [];
  const password = { type: 'password', value: 'browser-password', focus() { this.focused = true; } };
  const eye = {
    attributes: {},
    addEventListener(name, handler) { eyeListeners[name] = handler; },
    setAttribute(name, value) { this.attributes[name] = value; },
  };
  const elements = {
    userLoginUsername: { value: ' browser-user ' }, userLoginPassword: password,
    userLoginPasswordReveal: eye, userLoginSubmit: { disabled: false },
    userLoginStatus: { className: '', textContent: '' },
    userLoginForm: { addEventListener(name, handler) { formListeners[name] = handler; } },
  };
  const sandbox = {
    document: { getElementById(id) { return elements[id]; } }, content: { innerHTML: '' },
    state: {}, sessionRevision: 0, writeHashRoute() {}, renderApp() { calls.push('render'); },
    getServerApiClient() { return { async login(username, value) { calls.push([username, value]); return { ok: true }; } }; },
    extractServerAuthData() { return { user: { id: '7' } }; }, applyServerUser() { return { id: '7' }; },
  };
  vm.runInNewContext(`${match[0]}\nshowLoginForm();`, sandbox);
  return { formListeners, eyeListeners, calls, password, eye };
}

test('User Eye click reveals and conceals the same browser-filled password', () => {
  const runtime = runLoginForm();
  runtime.eyeListeners.click();
  assert.equal(runtime.password.type, 'text');
  assert.equal(runtime.password.value, 'browser-password');
  assert.equal(runtime.eye.attributes['aria-label'], 'Hide password');
  assert.equal(runtime.eye.attributes['aria-pressed'], 'true');
  assert.equal(runtime.password.focused, true);
  runtime.eyeListeners.click();
  assert.equal(runtime.password.type, 'password');
  assert.equal(runtime.password.value, 'browser-password');
  assert.equal(runtime.eye.attributes['aria-label'], 'Show password');
});

test('User Login submits the browser-filled password while revealed', async () => {
  const runtime = runLoginForm();
  runtime.eyeListeners.click();
  await runtime.formListeners.submit({ preventDefault() {} });
  assert.deepEqual(runtime.calls[0], ['browser-user', 'browser-password']);
  assert.equal(runtime.calls[1], 'render');
});

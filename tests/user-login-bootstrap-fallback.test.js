'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'Web-App/public/user-app.js'), 'utf8');

test('missing password helper leaves the real User Login submit binding operational', () => {
  const match = source.match(/const showLoginForm = \(\) => \{[\s\S]*?\n  \};/);
  assert.ok(match, 'User Login renderer must exist');
  const listeners = {};
  const elements = {
    userLoginPassword: { type: 'password' },
    userLoginPasswordReveal: { hidden: false },
    userLoginSubmit: { disabled: false },
    userLoginForm: { addEventListener(name, handler) { listeners[name] = handler; } },
  };
  const sandbox = {
    window: {},
    document: { getElementById(id) { return elements[id]; } },
    content: { innerHTML: '' },
    state: {},
    writeHashRoute() {},
  };
  vm.runInNewContext(`${match[0]}\nshowLoginForm();`, sandbox);
  assert.equal(elements.userLoginPasswordReveal.hidden, true);
  assert.equal(typeof listeners.submit, 'function', 'submit handler must bind even without the optional Eye helper');
});

test('available password helper is bound once without hiding the Eye', () => {
  const match = source.match(/const showLoginForm = \(\) => \{[\s\S]*?\n  \};/);
  const calls = [];
  const elements = {
    userLoginPassword: { type: 'password' },
    userLoginPasswordReveal: { hidden: false },
    userLoginSubmit: { disabled: false },
    userLoginForm: { addEventListener() {} },
  };
  const sandbox = {
    window: { NeutralPasswordHoldReveal: { bind(input, button) { calls.push([input, button]); } } },
    document: { getElementById(id) { return elements[id]; } },
    content: { innerHTML: '' }, state: {}, writeHashRoute() {},
  };
  vm.runInNewContext(`${match[0]}\nshowLoginForm();`, sandbox);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], elements.userLoginPassword);
  assert.equal(calls[0][1], elements.userLoginPasswordReveal);
  assert.equal(elements.userLoginPasswordReveal.hidden, false);
});

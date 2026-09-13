'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('login Eye has a direct delegated click handler in the delivered page', () => {
  const index = read('Web-App/public/index.html');
  const user = read('Web-App/public/user-app.js');

  assert.match(user, /id="userLoginPassword" name="password" type="password"/);
  assert.match(user, /id="userLoginPasswordReveal"/);
  assert.match(index, /document\.addEventListener\('click'/);
  assert.match(index, /closest\('#userLoginPasswordReveal'\)/);
  assert.match(index, /getElementById\('userLoginPassword'\)/);
  assert.match(index, /input\.type = input\.type === 'password' \? 'text' : 'password'/);
  assert.match(index, /event\.stopPropagation\(\)/);
});

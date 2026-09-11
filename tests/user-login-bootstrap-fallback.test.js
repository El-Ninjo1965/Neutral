'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'Web-App/public/index.html'), 'utf8');

test('User login has a built-in password reveal bootstrap before user-app starts', () => {
  const bootstrapIndex = index.indexOf('window.NeutralPasswordHoldReveal = window.NeutralPasswordHoldReveal ||');
  const appIndex = index.indexOf('<script defer src="user-app.js"></script>');

  assert.notEqual(bootstrapIndex, -1, 'index.html must provide a local fallback for the password reveal binder');
  assert.notEqual(appIndex, -1, 'user-app.js script must exist');
  assert.ok(bootstrapIndex < appIndex, 'password reveal fallback must exist before user-app.js executes');
});

test('Password reveal bootstrap is self-contained and supports hold/release behavior', () => {
  assert.match(index, /pointerdown/);
  assert.match(index, /pointerup/);
  assert.match(index, /pointercancel/);
  assert.match(index, /input\.type\s*=\s*['"]text['"]/);
  assert.match(index, /input\.type\s*=\s*['"]password['"]/);
});

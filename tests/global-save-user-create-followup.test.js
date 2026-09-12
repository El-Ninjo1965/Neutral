'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('shared success dialog is accessible, focus-safe and password toggles are centralized', () => {
  const helper = read('Web-App/public/ui-feedback.js');
  assert.match(helper, /role=\"dialog\"/);
  assert.match(helper, /aria-modal=\"true\"/);
  assert.match(helper, /returnFocus/);
  assert.match(helper, /Show password/);
  assert.match(helper, /Hide password/);
  assert.match(helper, /MutationObserver/);
  assert.match(read('Web-App/public/index.html'), /ui-feedback\.js/);
  assert.match(read('Server/php/views/admin-ui.php'), /ui-feedback\.js/);
  assert.match(read('Server/public/admin.php'), /ui-feedback\.js/);
});

test('save surfaces use the shared success contract while errors remain alerts', () => {
  const common = read('Web-App/public/admin/common.js');
  const user = read('Web-App/public/user-app.js');
  const commerce = read('Web-App/public/admin/commercial-view.js');
  assert.match(common, /type === 'success'[\s\S]*NeutralUiFeedback\.showSuccess/);
  assert.match(user, /NeutralUiFeedback\?\.showSuccess\('Successfully saved\.'/);
  assert.doesNotMatch(user, /status\.textContent = 'Settings saved successfully\.'/);
  assert.match(commerce, /License (updated|created) successfully/);
  assert.match(common, /alert-\$\{type\}/);
});

test('user create route is atomic and maps invalid and duplicate requests to controlled responses', () => {
  const api = read('Server/public/api/index.php');
  const block = api.slice(api.indexOf("if ($route === 'admin/users' && $method === 'POST')"), api.indexOf("if (preg_match('#^admin/users/"));
  assert.match(block, /beginTransaction\(\)/);
  assert.match(block, /assignUserToLicense/);
  assert.match(block, /user\.create/);
  assert.match(block, /rollBack\(\)/);
  assert.match(block, /409/);
  assert.match(block, /422/);
  const users = read('Server/php/src/Phase4AuthRbac.php');
  const duplicateQuery = users.match(/SELECT id FROM users WHERE LOWER\(username\)[^;]+/);
  assert.ok(duplicateQuery);
  assert.equal((duplicateQuery[0].match(/:email/g) || []).length, 1, 'native MySQL prepares require a unique e-mail marker');
});

test('ACCESS navigation keeps operational areas first and permission definitions last', () => {
  const nav = require('../Web-App/public/admin/navigation.js');
  const access = nav.groups.find((group) => group.id === 'access');
  assert.deepEqual(access.items.map((item) => item.id), ['users', 'licenses', 'packages', 'sessions', 'roles', 'permissions']);
  assert.match(read('Web-App/public/style.css'), /admin-users-view \.create-form-container[\s\S]*margin-top/);
});

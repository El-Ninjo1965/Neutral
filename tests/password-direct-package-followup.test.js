'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('User Login has one autofill password field and one local click Eye', () => {
  const user = read('Web-App/public/user-app.js');
  assert.equal((user.match(/id="userLoginPassword"/g) || []).length, 1);
  assert.equal((user.match(/id="userLoginPasswordReveal"/g) || []).length, 1);
  assert.match(user, /name="password" type="password" autocomplete="current-password"/);
  assert.match(user, /passwordReveal\.addEventListener\('click'/);
  assert.doesNotMatch(user, /NeutralPasswordHoldReveal|enhancePasswordFields\(content\)|pointerdown/);
});

test('shared password helper toggles the actual input type on a dispatched click', () => {
  const helper = require('../Web-App/public/ui-feedback.js');
  const listeners = {};
  const input = { type: 'password', dataset: {}, focus() { this.focused = true; } };
  const button = {
    dataset: {}, attributes: {}, classList: { add() {} }, innerHTML: '',
    addEventListener(type, listener) { listeners[type] = listener; },
    setAttribute(name, value) { this.attributes[name] = value; },
    dispatchEvent(event) { listeners[event.type]?.(event); }
  };
  helper.bindPasswordToggle(input, button);
  button.dispatchEvent({ type: 'click' });
  assert.equal(input.type, 'text');
  assert.equal(button.attributes['aria-pressed'], 'true');
  assert.equal(input.focused, true);
  button.dispatchEvent({ type: 'click' });
  assert.equal(input.type, 'password');
  assert.equal(button.attributes['aria-pressed'], 'false');
});

test('direct package survives license precedence and becomes fallback after license removal', () => {
  const result = spawnSync('php', ['-r', `require '${root}/Server/php/bootstrap.php';
    $c=new Neutral\\Core\\AppConfig(['APP_ENV'=>'test','DB_TYPE'=>'mysql','DB_HOST'=>'x','DB_NAME'=>'x','DB_USER'=>'x'],'${root}');
    $d=new Neutral\\Core\\Database($c);$pdo=new PDO('sqlite::memory:');$pdo->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
    $pdo->exec("CREATE TABLE users(id INTEGER PRIMARY KEY,package_id INTEGER,device_limit INTEGER,device_limit_mode TEXT);CREATE TABLE packages(id INTEGER PRIMARY KEY,status TEXT,entitlements_json TEXT,limits_json TEXT);CREATE TABLE licenses(id INTEGER PRIMARY KEY,package_id INTEGER,status TEXT,seat_limit INTEGER,device_limit INTEGER,device_limit_mode TEXT);CREATE TABLE license_users(license_id INTEGER,user_id INTEGER,license_role TEXT,membership_status TEXT,device_limit INTEGER,device_limit_mode TEXT,assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(license_id,user_id));INSERT INTO users VALUES(7,NULL,NULL,'default');INSERT INTO licenses VALUES(9,2,'active',10,NULL,'package');");
    $insert=$pdo->prepare("INSERT INTO packages VALUES(:id,'active',:entitlements,:limits)");$insert->execute([':id'=>1,':entitlements'=>json_encode(['modules'=>['gps'=>'available']]),':limits'=>json_encode(['allowedDevices'=>3])]);$insert->execute([':id'=>2,':entitlements'=>json_encode(['modules'=>['gps'=>'locked']]),':limits'=>json_encode(['allowedDevices'=>8])]);
    $r=new ReflectionProperty($d,'pdo');$r->setAccessible(true);$r->setValue($d,$pdo);$s=new Neutral\\Core\\AccountLicenseService($d);
    $s->assignDirectPackage(7,1,'default');$direct=$s->moduleEntitlementsForUser(7);$pdo->exec("INSERT INTO license_users(license_id,user_id,license_role,membership_status,device_limit,device_limit_mode) VALUES(9,7,'member','active',NULL,'default')");$licensed=$s->moduleEntitlementsForUser(7);$s->assignUserToLicense(7,null,'default');$fallback=$s->moduleEntitlementsForUser(7);echo json_encode(compact('direct','licensed','fallback'));`], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { direct: { gps: 'available' }, licensed: { gps: 'locked' }, fallback: { gps: 'available' } });
});

test('User editor separates direct and license packages and API persists both atomically', () => {
  const users = read('Web-App/public/admin/users-view.js');
  const api = read('Server/public/api/index.php');
  const schema = read('Server/php/src/SchemaMigrator.php');
  assert.match(users, /for="packageId">Package/);
  assert.match(users, /packageSelect\.disabled = true/);
  assert.match(users, /From license \/ organization|Effective package is inherited/);
  assert.match(api, /assignDirectPackage/);
  assert.match(api, /directPackageId/);
  assert.match(schema, /2026_09_11_0008_direct_user_packages/);
});

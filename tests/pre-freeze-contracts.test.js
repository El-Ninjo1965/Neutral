'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

class Element {
  constructor(tag, className = '') { this.tagName = tag; this.className = className; this.children = []; this.parentNode = null; this.dataset = {}; this.attrs = {}; this.listeners = {}; this.type = ''; this.classList = { add: (name) => { if (!this.className.split(' ').includes(name)) this.className = `${this.className} ${name}`.trim(); } }; }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  insertBefore(child, before) { child.parentNode = this; this.children.splice(this.children.indexOf(before), 0, child); return child; }
  setAttribute(name, value) { this.attrs[name] = value; }
  getAttribute(name) { return this.attrs[name]; }
  addEventListener(name, listener) { this.listeners[name] = listener; }
  focus() { this.focused = true; }
  closest(selector) { let node = this; while (node) { if (selector === '.password-input-wrap' && node.className.includes('password-input-wrap')) return node; node = node.parentNode; } return null; }
  querySelector(selector) { return selector === '.password-visibility-toggle' ? this.walk().find((node) => node.className.includes('password-visibility-toggle')) || null : null; }
  querySelectorAll(selector) { return selector.includes('password') ? this.walk().filter((node) => node.tagName === 'input') : []; }
  walk() { return this.children.flatMap((child) => [child, ...child.walk()]); }
  set innerHTML(value) { this.html = value; }
  get innerHTML() { return this.html || ''; }
  click() { this.listeners.click?.({}); }
}

test('User Login delegates its plain password field to the shared Admin-style enhancer', () => {
  const source = read('Web-App/public/user-app.js');
  assert.match(source, /id="userLoginPassword" type="password"/);
  assert.match(source, /enhancePasswordFields\(content\)/);
  assert.doesNotMatch(source, /data-password-control="user-login"/);

  const wrapper = new Element('span', 'password-input-wrap');
  const input = wrapper.appendChild(new Element('input')); input.type = 'password';
  const button = wrapper.appendChild(new Element('button', 'password-visibility-toggle'));
  const document = { readyState: 'loading', createElement: (tag) => new Element(tag), addEventListener() {}, querySelectorAll() { return []; }, body: new Element('body') };
  const sandbox = { document, module: { exports: {} }, window: {}, MutationObserver: class { observe() {} } };
  vm.runInNewContext(read('Web-App/public/ui-feedback.js'), sandbox);
  sandbox.module.exports.enhancePasswordFields(wrapper);
  assert.equal(wrapper.walk().filter((node) => node.className.includes('password-visibility-toggle')).length, 1);
  assert.equal(button.getAttribute('aria-label'), 'Show password');
  button.click();
  assert.equal(input.type, 'text');
  assert.equal(button.getAttribute('aria-label'), 'Hide password');
  assert.equal(button.getAttribute('aria-pressed'), 'true');
  assert.match(button.innerHTML, /<circle/);
  button.click();
  assert.equal(input.type, 'password');
  assert.equal(button.getAttribute('aria-pressed'), 'false');
  assert.doesNotMatch(button.innerHTML, /<circle/);
  assert.match(read('Web-App/public/style.css'), /\.password-visibility-toggle \{[^}]*display:flex !important;[^}]*visibility:visible !important;[^}]*opacity:1 !important;/);
});

test('server module contract accepts optional safe self-test and rejects unsafe entries', () => {
  const php = String.raw`<?php
require ${JSON.stringify(path.join(root, 'Server/php/src/ModuleContract.php'))};
$base=['id'=>'demo-module','version'=>'1.0.0','permissions'=>['demo-module.view'],'compatibility'=>['core'=>'>=1.0.0 <2.0.0','api'=>1,'php'=>'>=8.1.0'],'server'=>['entry'=>'Server/php/modules/demo-module/module.php','services'=>['module.demo-module.status'],'routes'=>[['method'=>'GET','path'=>'status','service'=>'module.demo-module.status','action'=>'status','permission'=>'demo-module.view','csrf'=>false]]],'database'=>['tables'=>[],'migrations'=>[]],'limits'=>[],'uninstall'=>['dataPolicy'=>'retain']];
$contract=new Neutral\Core\ModuleContract();
$none=$contract->normalize($base); if($none['standalone']!==null) exit(2);
$safe=$base; $safe['standalone']=['entry'=>'self-test/index.html','requires'=>['server'=>false]]; $normalized=$contract->normalize($safe); if($normalized['standalone']['entry']!=='self-test/index.html') exit(3);
$unsafe=$base; $unsafe['standalone']=['entry'=>'../admin.php']; try{$contract->normalize($unsafe);exit(4);}catch(RuntimeException $e){}
echo 'ok';`;
  const result = spawnSync('php', { input: php, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'ok');
});

test('GPS keeps the generic self-test contract while modules without one remain null', () => {
  const gps = JSON.parse(read('Web-App/app/modules/gps/module.json'));
  const media = JSON.parse(read('Web-App/app/modules/media/module.json'));
  assert.equal(gps.standalone.entry, 'index.html');
  assert.deepEqual(gps.standalone.requires, { server: false, database: false, auth: false });
  assert.equal(media.standalone, undefined);
  const admin = read('Web-App/public/admin/modules-view.js');
  assert.match(admin, /if \(!standalone \|\| !standalone\.entry \|\| !module\.modulePath\)/);
});

test('device-limit resolver preserves numeric and unlimited precedence plus license fallback', () => {
  const php = String.raw`<?php
require getenv('NEUTRAL_ROOT').'/Server/php/bootstrap.php';
$config=new Neutral\Core\AppConfig(['APP_ENV'=>'test','DB_TYPE'=>'mysql','DB_HOST'=>'x','DB_NAME'=>'x','DB_USER'=>'x'],getenv('NEUTRAL_ROOT'));$database=new Neutral\Core\Database($config);
$pdo=new PDO('sqlite::memory:');$pdo->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);$pdo->sqliteCreateFunction('JSON_TYPE',static fn($value):string=>$value===null?'NULL':(is_numeric($value)?'INTEGER':'TEXT'),1);$pdo->sqliteCreateFunction('JSON_UNQUOTE',static fn($value)=>$value,1);
$pdo->exec("CREATE TABLE users(id INTEGER PRIMARY KEY,package_id INTEGER,device_limit INTEGER,device_limit_mode TEXT);CREATE TABLE packages(id INTEGER PRIMARY KEY,limits_json TEXT,status TEXT);CREATE TABLE licenses(id INTEGER PRIMARY KEY,package_id INTEGER,device_limit INTEGER,device_limit_mode TEXT,status TEXT);CREATE TABLE license_users(license_id INTEGER,user_id INTEGER,membership_status TEXT,device_limit INTEGER,device_limit_mode TEXT);INSERT INTO packages VALUES(1,'{\"allowedDevices\":2}','active'),(2,'{\"allowedDevices\":null}','active');INSERT INTO users VALUES(10,1,NULL,'package'),(11,2,NULL,'package'),(12,1,NULL,'unlimited'),(13,2,NULL,'package');INSERT INTO licenses VALUES(7,1,NULL,'package','active'),(8,2,NULL,'package','active');");
$property=new ReflectionProperty($database,'pdo');$property->setAccessible(true);$property->setValue($database,$pdo);$registry=new Neutral\Core\Phase4SessionRegistry(new Neutral\Core\Phase4JsonStore(sys_get_temp_dir().'/neutral-limit-'.bin2hex(random_bytes(3))),$database);
$numeric=$registry->licensedDeviceLimit(10,5);$directUnlimited=$registry->licensedDeviceLimit(11,5);$overrideUnlimited=$registry->licensedDeviceLimit(12,5);
$pdo->exec("INSERT INTO license_users VALUES(8,10,'active',NULL,'default')");$licenseUnlimited=$registry->licensedDeviceLimit(10,5);$pdo->exec("DELETE FROM license_users WHERE user_id=10");$fallbackNumeric=$registry->licensedDeviceLimit(10,5);
echo json_encode(compact('numeric','directUnlimited','overrideUnlimited','licenseUnlimited','fallbackNumeric'));`;
  const result = spawnSync('php', { input: php, encoding: 'utf8', env: { ...process.env, NEUTRAL_ROOT: root } });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { numeric: 2, directUnlimited: null, overrideUnlimited: null, licenseUnlimited: null, fallbackNumeric: 2 });
  assert.match(read('Web-App/public/admin/users-view.js'), /allowedDevices == null \? 'Unlimited' : Number\(user\.allowedDevices\)/);
});

test('Profile and Media protected server entries resolve through the generic registry', () => {
  const php = String.raw`<?php
require getenv('NEUTRAL_ROOT').'/Server/php/bootstrap.php';$contract=new Neutral\Core\ModuleContract();$registry=new Neutral\Core\ModuleServerRegistry(getenv('NEUTRAL_ROOT'),$contract);$out=[];
foreach(['profile','media'] as $id){$manifest=json_decode(file_get_contents(getenv('NEUTRAL_ROOT').'/Web-App/app/modules/'.$id.'/module.json'),true,512,JSON_THROW_ON_ERROR);$module=['id'=>$id,'manifest'=>$manifest,'registered'=>true,'active'=>true];$resolved=$registry->resolve($module);$out[$id]=['services'=>array_keys($resolved['serviceFactories']),'migrations'=>count($resolved['migrations']),'retain'=>$resolved['contract']['uninstall']['dataPolicy']];}echo json_encode($out,JSON_THROW_ON_ERROR);`;
  const result = spawnSync('php', { input: php, encoding: 'utf8', env: { ...process.env, NEUTRAL_ROOT: root } });
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout);
  assert.deepEqual(data.profile.services, ['module.profile.account']); assert.equal(data.profile.retain, 'retain'); assert.equal(data.profile.migrations, 1);
  assert.deepEqual(data.media.services, ['module.media.capability']); assert.equal(data.media.retain, 'retain');
});

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

test('User Login renders one static password toggle and shared binding controls it', () => {
  const source = read('Web-App/public/user-app.js');
  const control = source.match(/<span class="password-input-wrap" data-password-control="user-login">([\s\S]*?)<\/span>/)?.[0] || '';
  assert.match(control, /id="userLoginPassword" type="password"/);
  assert.equal((control.match(/password-visibility-toggle/g) || []).length, 1);
  assert.match(control, /type="button"/);

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

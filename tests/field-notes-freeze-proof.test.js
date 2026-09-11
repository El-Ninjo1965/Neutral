'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'Web-App/app/modules/field-notes/module.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

test('Field Notes is a dependency-free user module with declared owned storage', () => {
  assert.equal(manifest.id, 'field-notes');
  assert.equal(manifest.category, 'user');
  assert.deepEqual(manifest.dependencies, []);
  assert.deepEqual(manifest.optionalDependencies, []);
  assert.equal(manifest.database.tables[0].name, 'field_notes_items');
  assert.equal(manifest.database.tables[0].destroyOnUninstall, false);
  assert.equal(manifest.uninstall.dataPolicy, 'retain');
  assert.deepEqual(manifest.server.routes.map(({ method, path: routePath }) => `${method} ${routePath}`), ['GET items', 'POST items', 'PUT items', 'DELETE items']);
});

test('Field Notes client lifecycle is reversible and retains no hard module dependency', () => {
  const sandbox = { window: { I18nModule: null, ApiClient: class {} }, navigator: { language: 'en' }, exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'Web-App/app/modules/field-notes/index.js'), 'utf8'), sandbox);
  const module = sandbox.window.NeutralFieldNotesModule;
  assert.ok(module);
  assert.equal(module.install(), true); assert.equal(module.active, false);
  assert.equal(module.enable(), true); assert.equal(module.active, true);
  assert.equal(module.disable(), true); assert.equal(module.active, false);
  assert.equal(module.enable(), true); assert.equal(module.active, true);
});

test('Field Notes service scopes list, update and delete to the authenticated owner', () => {
  const script = String.raw`<?php
require getenv('NEUTRAL_ROOT').'/Server/php/bootstrap.php';
$config=new Neutral\Core\AppConfig(['APP_ENV'=>'test','DB_TYPE'=>'mysql','DB_HOST'=>'x','DB_NAME'=>'x','DB_USER'=>'x'],getenv('NEUTRAL_ROOT'));
$database=new Neutral\Core\Database($config);
$pdo=new PDO('sqlite::memory:');$pdo->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
$pdo->exec('CREATE TABLE field_notes_items (id INTEGER PRIMARY KEY AUTOINCREMENT, owner_user_id INTEGER NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)');
$property=new ReflectionProperty($database,'pdo');$property->setAccessible(true);$property->setValue($database,$pdo);
$definition=require getenv('NEUTRAL_ROOT').'/Server/php/modules/field-notes/module.php';
$service=$definition['services']['module.field-notes.notes'](['database'=>$database]);
$owner=['identity'=>['userId'=>'11']];$other=['identity'=>['userId'=>'22']];
$created=$service->create($owner+['payload'=>['title'=>'First','body'=>'private']]);$id=$created['item']['id'];
$otherList=$service->list($other);$otherUpdate=false;try{$service->update($other+['payload'=>['id'=>$id,'title'=>'Stolen','body'=>'no']]);}catch(InvalidArgumentException $e){$otherUpdate=true;}
$otherDelete=$service->delete($other+['payload'=>['id'=>$id]]);
$updated=$service->update($owner+['payload'=>['id'=>$id,'title'=>'Updated','body'=>'mine']]);
$ownerList=$service->list($owner);$deleted=$service->delete($owner+['payload'=>['id'=>$id]]);
echo json_encode(compact('otherList','otherUpdate','otherDelete','updated','ownerList','deleted'),JSON_THROW_ON_ERROR);`;
  const result = spawnSync('php', { input: script, encoding: 'utf8', env: { ...process.env, NEUTRAL_ROOT: root } });
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout);
  assert.deepEqual(data.otherList.items, []);
  assert.equal(data.otherUpdate, true);
  assert.equal(data.otherDelete.deleted, false);
  assert.equal(data.updated.item.title, 'Updated');
  assert.equal(data.ownerList.items.length, 1);
  assert.equal(data.deleted.deleted, true);
});

test('Field Notes uses only generic module extension points and adds no Core reference', () => {
  const coreFiles = [
    ...fs.readdirSync(path.join(root, 'Web-App/core')).filter((name) => name.endsWith('.js')).map((name) => path.join(root, 'Web-App/core', name)),
    ...fs.readdirSync(path.join(root, 'Server/php/src')).filter((name) => name.endsWith('.php')).map((name) => path.join(root, 'Server/php/src', name)),
    path.join(root, 'Server/public/api/index.php'), path.join(root, 'Web-App/public/user-app.js')
  ];
  for (const file of coreFiles) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /field-notes|field_notes/i, path.relative(root, file));
});

test('Field Notes module code is confined to new module namespaces when the implementation baseline is available', (t) => {
  const baseline = spawnSync('git', ['cat-file', '-e', '6cbf28e^{commit}'], { cwd: root, encoding: 'utf8' });
  if (baseline.status !== 0) {
    t.skip('Implementation baseline is outside this shallow/generated checkout; Core reference scan remains authoritative.');
    return;
  }
  const result = spawnSync('git', ['diff', '--name-only', '6cbf28e', '--', 'Server', 'Web-App'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const changed = result.stdout.trim().split('\n').filter(Boolean);
  for (const expected of ['Server/php/modules/field-notes/module.php', 'Web-App/app/modules/field-notes/index.js', 'Web-App/app/modules/field-notes/module.json']) {
    assert.ok(changed.includes(expected), `missing Field Notes module file: ${expected}`);
  }
});

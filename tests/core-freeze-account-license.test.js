'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

const runPhp = (body) => spawnSync('php', ['-r', `require '${root}/Server/php/bootstrap.php'; ${body}`], { encoding: 'utf8' });

test('password contract accepts any 8–25 non-whitespace characters and hashing never stores plaintext', () => {
  const result = runPhp(`$values=['12345678','alllower','!@#$%^&*',str_repeat('x',25)]; $ok=[]; foreach($values as $v){Neutral\\Core\\Phase4PasswordHasher::assertValid($v);$h=Neutral\\Core\\Phase4PasswordHasher::hash($v);$ok[]=Neutral\\Core\\Phase4PasswordHasher::verify($v,$h)&&$h!==$v;} $bad=0; foreach(['1234567',str_repeat('x',26),'with space'] as $v){try{Neutral\\Core\\Phase4PasswordHasher::assertValid($v);}catch(RuntimeException $e){$bad++;}} echo json_encode(['ok'=>$ok,'bad'=>$bad]);`);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { ok: [true, true, true, true], bad: 3 });
});

test('profile privacy defaults off and entitlement states never grant hidden modules', () => {
  const result = runPhp(`$privacy=Neutral\\Core\\AccountLicenseService::normalizePrivacy([]); $available=Neutral\\Core\\AccountLicenseService::moduleState(['key'=>'package-a','entitlements'=>['modules'=>['gps'=>'available']]],'gps'); $locked=Neutral\\Core\\AccountLicenseService::moduleState(['key'=>'package-a','entitlements'=>['modules'=>['gps'=>'locked']]],'gps'); $hidden=Neutral\\Core\\AccountLicenseService::moduleState(['entitlements'=>[]],'gps'); echo json_encode(compact('privacy','available','locked','hidden'));`);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout);
  assert.ok(Object.values(data.privacy).every((value) => value === false));
  assert.equal(data.available.state, 'available');
  assert.deepEqual(data.locked, { state: 'locked', requiredEntitlement: 'package-a' });
  assert.equal(data.hidden.state, 'hidden');
});

test('account modules explicitly outside commercial entitlement remain projected', () => {
  const result = runPhp(`$modules=[['id'=>'gps','entitlementRequired'=>true],['id'=>'profile','entitlementRequired'=>false]];$projected=Neutral\\Core\\AccountLicenseService::applyModuleEntitlements($modules,['gps'=>'hidden']);echo json_encode($projected);`);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).map((module) => [module.id, module.entitlementState]), [['profile', 'available']]);
});

test('license manager scope is exact and profile-media validation rejects non-images', () => {
  const result = runPhp(`$scope=[Neutral\\Core\\AccountLicenseService::allowsLicenseScope(7,7),Neutral\\Core\\AccountLicenseService::allowsLicenseScope(7,8)]; $rejected=false; try{Neutral\\Core\\AccountLicenseService::validateProfileImage('not an image');}catch(RuntimeException $e){$rejected=true;} echo json_encode(compact('scope','rejected'));`);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { scope: [true, false], rejected: true });
});

test('module entitlement projection distinguishes available, locked and hidden', () => {
  const access = require('../Web-App/public/user-module-access.js');
  const base = { id: 'gps', active: true, access: { visibilityPermissions: [] } };
  assert.equal(access.accessState({ ...base, entitlementState: 'available' }, { permissions: [] }), 'available');
  assert.equal(access.accessState({ ...base, entitlementState: 'locked' }, { permissions: [] }), 'locked');
  assert.equal(access.accessState({ ...base, entitlementState: 'hidden' }, { permissions: [] }), 'hidden');
});

test('schema migration contains normalized account, license, presence and moderation foundations', () => {
  const result = runPhp(`$config=new Neutral\\Core\\AppConfig(['APP_ENV'=>'test','DB_TYPE'=>'mysql','DB_HOST'=>'invalid','DB_NAME'=>'neutral','DB_USER'=>'neutral'],'${root}'); $m=new Neutral\\Core\\SchemaMigrator(new Neutral\\Core\\Database($config)); $r=new ReflectionMethod($m,'definitions');$r->setAccessible(true);echo json_encode(array_column($r->invoke($m),'key'));`);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(JSON.parse(result.stdout).includes('2026_09_09_0005_account_license_foundation'));
});

test('UTC session timestamps render through browser-local Intl formatting', async () => {
  global.AdminCommon = {};
  const Router = require('../Web-App/public/admin/index.js');
  const container = { innerHTML: '', querySelectorAll() { return []; } };
  const api = { getSessions: async () => ({ ok: true, data: { data: { sessions: [{ username:'u', roles:[], issuedAt:'2026-09-09T08:24:00Z', lastSeenAt:'2026-09-09T08:25:00Z' }] } } }) };
  global.AdminCommon.unwrapData = (result, key, fallback) => result.data?.data?.[key] || fallback;
  await new Router.AdminSessionsView(api).init(container);
  assert.match(container.innerHTML, /<time datetime="2026-09-09T08:24:00Z">/);
  assert.doesNotMatch(container.innerHTML, />2026-09-09T08:24:00Z<\/time>/);
  delete global.AdminCommon;
});

test('interactive GPS map zoom controls rerender OSM tiles without external navigation', () => {
  const listeners = {};
  const tiles = { innerHTML: '' };
  const zoom = { textContent: '' };
  const plus = { addEventListener(type, fn) { listeners.plus = fn; } };
  const minus = { addEventListener(type, fn) { listeners.minus = fn; } };
  const host = { innerHTML: '', querySelector(selector) { return selector === '.gps-map-tiles' ? tiles : selector === '[data-map-zoom]' ? zoom : selector === '[data-map-in]' ? plus : minus; }, addEventListener(type, fn) { listeners[type] = fn; } };
  global.window = {};
  Object.defineProperty(global, 'navigator', { value: { language: 'en' }, configurable: true });
  delete require.cache[require.resolve('../Web-App/app/modules/gps/index.js')];
  const gps = require('../Web-App/app/modules/gps/index.js');
  gps.mountInteractiveMap(host, { latitude: 52.52, longitude: 13.405 });
  assert.equal(zoom.textContent, '15');
  const before = tiles.innerHTML;
  listeners.plus();
  assert.equal(zoom.textContent, '16');
  assert.notEqual(tiles.innerHTML, before);
  assert.match(host.innerHTML, /© OpenStreetMap contributors/);
  delete global.window; delete global.navigator;
});

test('GPS Web-Mercator projection matches independent Davao reference values', () => {
  global.window = {};
  Object.defineProperty(global, 'navigator', { value: { language: 'en' }, configurable: true });
  delete require.cache[require.resolve('../Web-App/app/modules/gps/index.js')];
  const gps = require('../Web-App/app/modules/gps/index.js');
  const point = gps.projectWebMercator(7.105691769982597, 125.63707611554916, 15);
  assert.equal(point.tileX, 27819);
  assert.equal(point.tileY, 15735);
  assert.ok(Math.abs(point.pixelX - 7121860.06055418) < 0.01);
  assert.ok(Math.abs(point.pixelY - 4028303.3079026104) < 0.01);
  delete global.window; delete global.navigator;
});

test('Map providers open in safe new browsing contexts', async () => {
  const calls = [];
  global.window = { open: (...args) => { calls.push(['open', ...args]); return { opener: 'set' }; }, location: { assign: (url) => calls.push(['assign', url]) } };
  Object.defineProperty(global, 'navigator', { value: { language: 'en' }, configurable: true });
  delete require.cache[require.resolve('../Web-App/app/modules/gps/index.js')];
  const gps = require('../Web-App/app/modules/gps/index.js');
  gps.lastPosition = { latitude: 7.105691769982597, longitude: 125.63707611554916 };
  assert.equal((await gps.openCurrentPosition('openstreetmap')).ok, true);
  assert.deepEqual(calls[0].slice(0, 3), ['open', gps.locationLinks(gps.lastPosition).openStreetMap, '_blank']);
  assert.match(calls[0][3], /noopener/);
  await gps.openCurrentPosition('google');
  assert.deepEqual(calls[1].slice(0, 3), ['open', gps.locationLinks(gps.lastPosition).googleMaps, '_blank']);
  assert.match(calls[1][3], /noopener/);
  delete global.window; delete global.navigator;
});

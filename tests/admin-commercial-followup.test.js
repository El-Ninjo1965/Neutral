'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const php = (body) => spawnSync('php', ['-r', `require '${root}/Server/php/bootstrap.php';${body}`], { encoding: 'utf8' });

test('package and license service accepts underscore keys, arbitrary limits, defaults, unlimited and a selected manager', () => {
  const result = php(`
    $c=new Neutral\\Core\\AppConfig(['APP_ENV'=>'test','DB_TYPE'=>'mysql','DB_HOST'=>'x','DB_NAME'=>'x','DB_USER'=>'x'],'${root}');
    $d=new Neutral\\Core\\Database($c);$pdo=new PDO('sqlite::memory:');$pdo->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
    $pdo->exec("CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,status TEXT);INSERT INTO users VALUES(7,'manager','active');CREATE TABLE packages(id INTEGER PRIMARY KEY AUTOINCREMENT,package_key TEXT UNIQUE,name TEXT,description TEXT,entitlements_json TEXT,limits_json TEXT,status TEXT);CREATE TABLE licenses(id INTEGER PRIMARY KEY AUTOINCREMENT,license_key TEXT UNIQUE,organization_name TEXT,package_id INTEGER,seat_limit INTEGER,device_limit INTEGER,device_limit_mode TEXT,status TEXT);CREATE TABLE license_users(license_id INTEGER,user_id INTEGER,license_role TEXT,membership_status TEXT,device_limit INTEGER,device_limit_mode TEXT,PRIMARY KEY(license_id,user_id));");
    $r=new ReflectionProperty($d,'pdo');$r->setAccessible(true);$r->setValue($d,$pdo);$s=new Neutral\\Core\\AccountLicenseService($d);
    $p=$s->savePackage(null,['key'=>'free_package','name'=>'Free','description'=>'Neutral package','status'=>'active','allowedDevices'=>50,'modules'=>['gps'=>'available','reference-notes'=>'locked']]);
    $l=$s->saveLicense(null,['key'=>'free_license','organizationName'=>'Privat User','packageId'=>$p['id'],'seatLimit'=>1,'deviceLimitMode'=>'default','allowedDevices'=>null,'managerUserId'=>7,'status'=>'active']);
    $u=$s->saveLicense((int)$l['id'],['key'=>'free_license','organizationName'=>'Privat User','packageId'=>$p['id'],'seatLimit'=>1,'deviceLimitMode'=>'unlimited','allowedDevices'=>null,'managerUserId'=>'','status'=>'blocked']);
    echo json_encode(compact('p','l','u'));
  `);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout);
  assert.equal(data.p.allowedDevices, 50);
  assert.equal(data.l.deviceLimitMode, 'default');
  assert.equal(data.l.allowedDevices, 50);
  assert.equal(data.l.managerUsername, 'manager');
  assert.equal(data.u.deviceLimitMode, 'unlimited');
  assert.equal(data.u.allowedDevices, null);
  assert.equal(data.u.managerUserId, null);
  assert.equal(data.u.status, 'blocked');
});

test('commercial validation rejects malformed keys and limits with controlled messages', () => {
  const result = php(`
    $c=new Neutral\\Core\\AppConfig(['APP_ENV'=>'test','DB_TYPE'=>'mysql','DB_HOST'=>'x','DB_NAME'=>'x','DB_USER'=>'x'],'${root}');$d=new Neutral\\Core\\Database($c);$s=new Neutral\\Core\\AccountLicenseService($d);
    $messages=[];foreach([['key'=>'has space','name'=>'X','allowedDevices'=>1],['key'=>'valid','name'=>'X','allowedDevices'=>0]] as $payload)try{$s->savePackage(null,$payload);}catch(RuntimeException $e){$messages[]=$e->getMessage();}echo json_encode($messages);
  `);
  assert.equal(result.status, 0, result.stderr);
  const messages = JSON.parse(result.stdout);
  assert.match(messages[0], /no spaces/i);
  assert.match(messages[1], /1–1000 or unlimited/);
});

test('birthday accepts real ISO calendar dates only, including leap years and deletion', () => {
  const result = php(`$ok=[Neutral\\Core\\AccountLicenseService::normalizeBirthday('2024-02-29'),Neutral\\Core\\AccountLicenseService::normalizeBirthday('')];$bad=0;foreach(['2023-02-29','2024-02-30','31.12.2024','nonsense'] as $v)try{Neutral\\Core\\AccountLicenseService::normalizeBirthday($v);}catch(RuntimeException $e){$bad++;}echo json_encode(compact('ok','bad'));`);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { ok: ['2024-02-29', ''], bad: 4 });
});

test('admin UX exposes free device limits, user-selected managers, birthday dropdowns and exactly two audit confirmations', () => {
  const commercial = read('Web-App/public/admin/commercial-view.js');
  const users = read('Web-App/public/admin/users-view.js');
  const profile = read('Web-App/public/user-app.js');
  const audit = read('Web-App/public/admin/audit-view.js');
  assert.match(commercial, /Custom device limit/);
  assert.match(commercial, /License manager<select/);
  assert.doesNotMatch(commercial, /Manager user ID|\[1,\s*2,\s*3,\s*5,\s*10\]/);
  assert.match(users, /Package \/ License default/);
  assert.match(users, /Custom device limit/);
  assert.doesNotMatch(users, /Override:|\[1,\s*2,\s*3,\s*5,\s*10\]/);
  assert.match(profile, /profileBirthdayDay/);
  assert.match(profile, /profileBirthdayMonth/);
  assert.match(profile, /profileBirthdayYear/);
  assert.doesNotMatch(profile, /profileBirthday" type="date/);
  assert.equal((audit.match(/AdminCommon\.confirmAction\(/g) || []).length, 3, 'one purge confirmation plus exactly two clear confirmations');
  assert.match(audit, /confirmed: true/);
  assert.doesNotMatch(audit, /window\.prompt|Type DELETE/);
});

test('profile hydration is authoritative and authenticated settings tabs fail closed', () => {
  const profile = read('Web-App/public/user-app.js');
  const css = read('Web-App/public/style.css');
  assert.match(profile, /allowedSections = currentUser && profileAvailable \? \['areas', 'navigation', 'privacy', 'profile'\] : \['areas', 'navigation'\]/);
  assert.match(profile, /currentUser && profileAvailable \? \[\['privacy','Privacy & Sharing'\],\['profile','Profile'\]\] : \[\]/);
  assert.match(profile, /state\.accountProfile = savedProfile/);
  assert.match(profile, /savedProfile\.birthday !== profile\.birthday/);
  assert.match(profile, /state\.accountProfile = null/);
  assert.match(css, /\.birthday-selects \{[\s\S]*?max-width: 440px/);
  assert.match(css, /grid-template-columns: minmax\(72px,[\s\S]*?minmax\(150px,[\s\S]*?minmax\(96px/);
});

test('commercial API maps controlled input and database failures without leaking SQL', () => {
  const api = read('Server/public/api/index.php');
  assert.match(api, /catch\(PDOException \$exception\)\{JsonResponse::error\('License could not be saved/);
  assert.match(api, /catch\(RuntimeException \$exception\)\{JsonResponse::error\(\$exception->getMessage\(\),422\)/);
  assert.match(api, /Two-step confirmation is required/);
  assert.match(api, /audit\.clear\.completed/);
  assert.doesNotMatch(api, /Explicit DELETE confirmation/);
});

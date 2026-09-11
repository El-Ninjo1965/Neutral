'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

test('persistent user session remains active without expiry and explicit revoke ends it', () => {
  const php = `require '${root}/Server/php/bootstrap.php';
  $c=new Neutral\\Core\\AppConfig(['APP_ENV'=>'test','DB_TYPE'=>'mysql','DB_HOST'=>'x','DB_NAME'=>'x','DB_USER'=>'x'],'${root}');
  $d=new Neutral\\Core\\Database($c);$pdo=new PDO('sqlite::memory:');$pdo->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
  $pdo->exec("CREATE TABLE sessions(session_id TEXT PRIMARY KEY,user_id INTEGER,csrf_token TEXT,issued_at TEXT,last_seen_at TEXT,expires_at TEXT NULL,session_scope TEXT,status TEXT,ip TEXT,user_agent TEXT,device_id TEXT,device_label TEXT)");
  $rp=new ReflectionProperty($d,'pdo');$rp->setAccessible(true);$rp->setValue($d,$pdo);
  $store=new Neutral\\Core\\Phase4JsonStore(sys_get_temp_dir().'/neutral-session-test-'.bin2hex(random_bytes(4)));
  $registry=new Neutral\\Core\\Phase4SessionRegistry($store,$d);
  $pdo->exec("INSERT INTO sessions VALUES('persistent',7,'token','2020-01-01 00:00:00','2099-01-01 00:00:00',NULL,'user','active',NULL,'agent','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','iPadOS · Chrome')");
  $before=$registry->isActive('persistent','user');$wrongScope=$registry->recover('persistent','admin');$recovered=$registry->recover('persistent','user');$devices=$registry->activeDeviceCount(7);$registry->remove('persistent');$after=$registry->isActive('persistent','user');echo json_encode(['before'=>$before,'wrongScope'=>$wrongScope,'recoveredScope'=>$recovered['sessionScope']??null,'csrfToken'=>$recovered['csrfToken']??null,'devices'=>$devices,'after'=>$after]);`;
  const result = spawnSync('php', ['-r', php], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { before: true, wrongScope: null, recoveredScope: 'user', csrfToken: 'token', devices: 1, after: false });
});

test('replacing a browser installation never invalidates the other auth scope', () => {
  const php = `require '${root}/Server/php/bootstrap.php';
  $c=new Neutral\\Core\\AppConfig(['APP_ENV'=>'test','DB_TYPE'=>'mysql','DB_HOST'=>'x','DB_NAME'=>'x','DB_USER'=>'x'],'${root}');
  $d=new Neutral\\Core\\Database($c);$pdo=new PDO('sqlite::memory:');$pdo->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
  $pdo->exec("CREATE TABLE sessions(session_id TEXT PRIMARY KEY,user_id INTEGER,csrf_token TEXT,issued_at TEXT,last_seen_at TEXT,expires_at TEXT NULL,session_scope TEXT,status TEXT,ip TEXT,user_agent TEXT,device_id TEXT,device_label TEXT)");
  $pdo->exec("INSERT INTO sessions VALUES('old-user',7,'u','2020-01-01','2099-01-01',NULL,'user','active',NULL,'agent','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','Browser'),('admin',7,'a','2020-01-01','2099-01-01','2099-12-01','admin','active',NULL,'agent','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','Browser')");
  $rp=new ReflectionProperty($d,'pdo');$rp->setAccessible(true);$rp->setValue($d,$pdo);$store=new Neutral\\Core\\Phase4JsonStore(sys_get_temp_dir().'/neutral-scope-test-'.bin2hex(random_bytes(4)));$registry=new Neutral\\Core\\Phase4SessionRegistry($store,$d);
  $registry->replaceActiveInstallation(7,str_repeat('a',32),'new-user','user');
  echo json_encode(['user'=>$pdo->query("SELECT status FROM sessions WHERE session_id='old-user'")->fetchColumn(),'admin'=>$pdo->query("SELECT status FROM sessions WHERE session_id='admin'")->fetchColumn(),'devices'=>$registry->activeDeviceCount(7)]);`;
  const result = spawnSync('php', ['-r', php], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { user: 'replaced', admin: 'active', devices: 0 });
});

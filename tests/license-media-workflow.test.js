'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('license manager projection is scoped, privacy-filtered and includes authoritative device activity', () => {
  const php = String.raw`
require '${root}/Server/php/bootstrap.php';
class LMStatement extends PDOStatement { public string $sql=''; public array $params=[]; public function execute(?array $p=null):bool{$this->params=$p??[];return true;} public function fetchColumn(int $c=0):mixed{return str_contains($this->sql,'SELECT license_id')?7:false;} public function fetchAll(int $m=PDO::FETCH_DEFAULT,mixed ...$a):array{return str_contains($this->sql,'FROM license_users lu JOIN users')?[['id'=>11,'username'=>'member','status'=>'active','created_at'=>'2026-09-09','device_limit'=>1,'public_nickname'=>'Visible','phone'=>'secret','address'=>'','birthday'=>null,'privacy_json'=>'{"publicNickname":true,"phone":false}','used_devices'=>1,'last_activity_at'=>'2026-09-09 12:00:00']]:[];} }
class LMPdo extends PDO {public function __construct(){} public function prepare(string $q,array $o=[]):PDOStatement|false{$s=new LMStatement();$s->sql=$q;return $s;}}
$c=new Neutral\Core\AppConfig(['APP_ENV'=>'test','DB_TYPE'=>'mysql','DB_HOST'=>'x','DB_NAME'=>'x','DB_USER'=>'x'],'${root}');$d=new Neutral\Core\Database($c);$p=new LMPdo();$r=new ReflectionProperty($d,'pdo');$r->setAccessible(true);$r->setValue($d,$p);$s=new Neutral\Core\AccountLicenseService($d);echo json_encode($s->organizationUsers(5));`;
  const result=spawnSync('php',['-r',php],{encoding:'utf8'}); assert.equal(result.status,0,result.stderr); const row=JSON.parse(result.stdout)[0];
  assert.equal(row.usedDevices,1); assert.equal(row.allowedDevices,1); assert.equal(row.publicNickname,'Visible'); assert.equal(row.phone,undefined); assert.equal(row.lastActivityAt,'2026-09-09 12:00:00');
});

test('media workflow decodes a real image, stores privately as pending and records moderation history', () => {
  const php = String.raw`
require '${root}/Server/php/bootstrap.php';
class MMStatement extends PDOStatement {public string $sql='';public int $rows=1;public function execute(?array $p=null):bool{return true;}public function fetchColumn(int $c=0):mixed{return str_starts_with($this->sql,'SELECT moderation_status')?'pending':false;}public function rowCount():int{return $this->rows;}}
class MMPdo extends PDO {public array $sql=[];public function __construct(){}public function prepare(string $q,array $o=[]):PDOStatement|false{$this->sql[]=$q;$s=new MMStatement();$s->sql=$q;return $s;}public function lastInsertId(?string $n=null):string|false{return '42';}}
$c=new Neutral\Core\AppConfig(['APP_ENV'=>'test','DB_TYPE'=>'mysql','DB_HOST'=>'x','DB_NAME'=>'x','DB_USER'=>'x'],'${root}');$d=new Neutral\Core\Database($c);$p=new MMPdo();$r=new ReflectionProperty($d,'pdo');$r->setAccessible(true);$r->setValue($d,$p);$s=new Neutral\Core\AccountLicenseService($d);$dir=sys_get_temp_dir().'/neutral-media-'.bin2hex(random_bytes(4));$png=base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');$created=$s->createMedia(3,$png,$dir);$moderated=$s->moderateMedia(9,42,'reject','policy','internal');echo json_encode(['created'=>$created,'moderated'=>$moderated,'files'=>count(glob($dir.'/*')),'history'=>count(array_filter($p->sql,fn($q)=>str_contains($q,'media_moderation_history')))]);array_map('unlink',glob($dir.'/*'));rmdir($dir);`;
  const result=spawnSync('php',['-r',php],{encoding:'utf8'}); assert.equal(result.status,0,result.stderr); const data=JSON.parse(result.stdout);
  assert.equal(data.created.status,'pending'); assert.equal(data.created.mimeType,'image/png'); assert.equal(data.files,1); assert.equal(data.moderated.status,'rejected'); assert.equal(data.history,2);
});

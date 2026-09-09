'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const projectRoot = path.resolve(__dirname, '..');

function runPhp(script) {
  return spawnSync('php', ['-r', script], {
    cwd: projectRoot,
    env: { ...process.env, NEUTRAL_TEST_ROOT: projectRoot },
    encoding: 'utf8'
  });
}

test('PHP login limiter locks the sixth identifier/IP failure and returns retry time', () => {
  const result = runPhp(`
require getenv('NEUTRAL_TEST_ROOT') . '/Server/php/src/LoginRateLimiter.php';
final class MemoryAttempts implements \\Neutral\\Core\\LoginAttemptStore {
    public array $rows = [];
    public function state(string $key): ?array { return $this->rows[$key] ?? null; }
    public function recordFailure(string $key, int $limit, int $window, int $lock, int $now): array {
        $row = $this->rows[$key] ?? ['attemptCount' => 0, 'windowStartedAt' => $now, 'lockedUntil' => 0];
        if ($row['windowStartedAt'] + $window <= $now) { $row = ['attemptCount' => 0, 'windowStartedAt' => $now, 'lockedUntil' => 0]; }
        $row['attemptCount']++;
        if ($row['attemptCount'] >= $limit) { $row['lockedUntil'] = $now + $lock; }
        return $this->rows[$key] = $row;
    }
    public function delete(array $keys): void { foreach ($keys as $key) { unset($this->rows[$key]); } }
    public function purgeExpired(int $before): void {}
}
$clock = static fn (): int => 1000;
$store = new MemoryAttempts();
$limiter = new \\Neutral\\Core\\LoginRateLimiter($store, $clock);
$results = [];
for ($i = 0; $i < 6; $i++) { $results[] = $limiter->registerFailure('Admin', '203.0.113.8'); }
$results[] = $limiter->check('admin', '203.0.113.8');
echo json_encode($results);
`);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const outcomes = JSON.parse(result.stdout);
  assert.deepEqual(outcomes.slice(0, 5).map((entry) => entry.allowed), [true, true, true, true, true]);
  assert.equal(outcomes[5].allowed, false);
  assert.deepEqual(outcomes[6], { allowed: false, retryAfter: 900 });
});

test('PHP login limiter applies an IP-wide limit and success clears only matching scopes', () => {
  const result = runPhp(`
require getenv('NEUTRAL_TEST_ROOT') . '/Server/php/src/LoginRateLimiter.php';
final class MemoryAttempts implements \\Neutral\\Core\\LoginAttemptStore {
    public array $rows = [];
    public function state(string $key): ?array { return $this->rows[$key] ?? null; }
    public function recordFailure(string $key, int $limit, int $window, int $lock, int $now): array {
        $row = $this->rows[$key] ?? ['attemptCount' => 0, 'windowStartedAt' => $now, 'lockedUntil' => 0];
        $row['attemptCount']++;
        if ($row['attemptCount'] >= $limit) { $row['lockedUntil'] = $now + $lock; }
        return $this->rows[$key] = $row;
    }
    public function delete(array $keys): void { foreach ($keys as $key) { unset($this->rows[$key]); } }
    public function purgeExpired(int $before): void {}
}
$store = new MemoryAttempts();
$limiter = new \\Neutral\\Core\\LoginRateLimiter($store, static fn (): int => 2000, ['identifierLimit' => 5, 'ipLimit' => 3, 'windowSeconds' => 900, 'lockSeconds' => 900]);
$limiter->registerFailure('first', '203.0.113.9');
$limiter->registerFailure('second', '203.0.113.9');
$third = $limiter->registerFailure('third', '203.0.113.9');
$fourth = $limiter->registerFailure('fourth', '203.0.113.9');
$limiter->registerFailure('other', '198.51.100.4');
$limiter->registerSuccess('other', '198.51.100.4');
echo json_encode(['third' => $third, 'fourth' => $fourth, 'ip' => $limiter->check('new-name', '203.0.113.9'), 'other' => $limiter->check('other', '198.51.100.4')]);
`);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(JSON.parse(result.stdout), {
    third: { allowed: true, retryAfter: 0 },
    fourth: { allowed: false, retryAfter: 900 },
    ip: { allowed: false, retryAfter: 900 },
    other: { allowed: true, retryAfter: 0 }
  });
});

test('PDO login-attempt reads never execute request-time DDL', () => {
  const result = runPhp(`
require getenv('NEUTRAL_TEST_ROOT') . '/Server/php/bootstrap.php';
class NoDdlStatement extends PDOStatement { public function execute(?array $params=null):bool{return true;} public function fetch(int $mode=PDO::FETCH_DEFAULT,int $orientation=PDO::FETCH_ORI_NEXT,int $offset=0):mixed{return false;} }
class NoDdlPdo extends PDO { public int $execs=0; public function __construct(){} public function exec(string $statement):int|false{$this->execs++;throw new RuntimeException('DDL forbidden during requests');} public function prepare(string $query,array $options=[]):PDOStatement|false{return new NoDdlStatement();} }
$config=new Neutral\\Core\\AppConfig(['APP_ENV'=>'test','DB_TYPE'=>'mysql','DB_HOST'=>'x','DB_NAME'=>'x','DB_USER'=>'x'],getenv('NEUTRAL_TEST_ROOT'));$db=new Neutral\\Core\\Database($config);$pdo=new NoDdlPdo();$property=new ReflectionProperty($db,'pdo');$property->setAccessible(true);$property->setValue($db,$pdo);$store=new Neutral\\Core\\PdoLoginAttemptStore($db);$state=$store->state(hash('sha256','dummy'));echo json_encode(['state'=>$state,'execs'=>$pdo->execs]);`);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(JSON.parse(result.stdout), { state: null, execs: 0 });
});

test('PHP user lookup uses unique native MySQL placeholders for username-or-email login', () => {
  const result = runPhp(`
require getenv('NEUTRAL_TEST_ROOT') . '/Server/php/bootstrap.php';
class NativeStatement extends PDOStatement { public array $params=[]; public function execute(?array $params=null):bool{$this->params=$params??[];return true;} public function fetch(int $mode=PDO::FETCH_DEFAULT,int $orientation=PDO::FETCH_ORI_NEXT,int $offset=0):mixed{return false;} }
class NativePdo extends PDO { public function __construct(){} public function prepare(string $query,array $options=[]):PDOStatement|false{preg_match_all('/:([a-zA-Z_][a-zA-Z0-9_]*)/',$query,$m);if(count($m[1])!==count(array_unique($m[1])))throw new PDOException('HY093 duplicate native placeholder');return new NativeStatement();} }
$root=getenv('NEUTRAL_TEST_ROOT');$config=new Neutral\\Core\\AppConfig(['APP_ENV'=>'test','DB_TYPE'=>'mysql','DB_HOST'=>'x','DB_NAME'=>'x','DB_USER'=>'x'],$root);$db=new Neutral\\Core\\Database($config);$pdo=new NativePdo();$property=new ReflectionProperty($db,'pdo');$property->setAccessible(true);$property->setValue($db,$pdo);$store=new Neutral\\Core\\Phase4JsonStore(sys_get_temp_dir().'/neutral-native-placeholders');$roles=new Neutral\\Core\\Phase4RoleService($store,$db);$users=new Neutral\\Core\\Phase4UserService($store,$roles,$config,$db);echo json_encode(['result'=>$users->authenticate('missing-user','invalid-password')]);`);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(JSON.parse(result.stdout), { result: null });
});

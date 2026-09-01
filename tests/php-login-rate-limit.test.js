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

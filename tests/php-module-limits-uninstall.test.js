'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const guardPath = path.join(projectRoot, 'Server/php/src/ModuleLimitGuard.php');
const kernelPath = path.join(projectRoot, 'Server/php/src/ModuleHttpKernel.php');
const runtimePath = path.join(projectRoot, 'Server/php/src/Phase7ModuleRuntime.php');

test('module HTTP kernel centrally invokes the quantitative limit guard', () => {
  assert.equal(fs.existsSync(guardPath), true);
  const kernel = fs.readFileSync(kernelPath, 'utf8');
  assert.match(kernel, /ModuleLimitGuard/);
  assert.match(kernel, /usageAction/);
  assert.match(kernel, /assertAllows/);
  assert.match(kernel, /withLimitLock/);
});

test('uninstall is inactive-only, retain-by-default and never directly drops manifest tables', () => {
  const runtime = fs.readFileSync(runtimePath, 'utf8');
  const start = runtime.indexOf('public function uninstall');
  const end = runtime.indexOf('private function findDiscoveredModule');
  const uninstall = runtime.slice(start, end);
  assert.match(uninstall, /Module must be inactive before uninstall/);
  assert.match(uninstall, /dataPolicy/);
  assert.match(uninstall, /migrationRunner->rollback/);
  assert.doesNotMatch(uninstall, /dropOwnedTables/);
  assert.doesNotMatch(runtime, /DROP TABLE IF EXISTS/);
  assert.match(uninstall, /assertOwnedRollback/);
  assert.match(uninstall, /is_present = 0/);
  assert.match(uninstall, /dataPolicy === 'destroy'[\s\S]*DELETE FROM modules/);
  assert.match(runtime, /if \(!\(bool\) \(\$record\['isPresent'\]/);
});

test('module limit guard selects the strongest server role and rejects over-limit mutations', (t) => {
  const probe = spawnSync('php', ['-v'], { encoding: 'utf8' });
  if (probe.error && probe.error.code === 'ENOENT') {
    t.skip('PHP executable is not available (ENOENT).');
    return;
  }
  assert.equal(probe.status, 0);
  const script = `
require ${JSON.stringify(kernelPath)};
require ${JSON.stringify(guardPath)};
use Neutral\\Core\\ModuleLimitGuard;
use Neutral\\Core\\ModuleHttpException;
$limits = [[
  'key' => 'reference-notes.items',
  'default' => 0,
  'roles' => ['viewer' => 5, 'user' => 100, 'admin' => null],
]];
$guard = new ModuleLimitGuard();
$values = [
  'default' => $guard->effectiveLimit($limits, 'reference-notes.items', []),
  'viewer' => $guard->effectiveLimit($limits, 'reference-notes.items', ['viewer']),
  'user' => $guard->effectiveLimit($limits, 'reference-notes.items', ['viewer', 'user']),
  'admin' => $guard->effectiveLimit($limits, 'reference-notes.items', ['admin']),
];
$blocked = false;
try { $guard->assertAllows($limits, 'reference-notes.items', ['user'], 100, 1); }
catch (ModuleHttpException $error) { $blocked = $error->status() === 409 && $error->errorCode() === 'MODULE_LIMIT_EXCEEDED'; }
$guard->assertAllows($limits, 'reference-notes.items', ['user'], 99, 1);
$guard->assertAllows($limits, 'reference-notes.items', ['admin'], 999999, 1);
echo json_encode(['values' => $values, 'blocked' => $blocked], JSON_THROW_ON_ERROR);
`;
  const result = spawnSync('php', ['-r', script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(JSON.parse(result.stdout), {
    values: { default: 0, viewer: 5, user: 100, admin: null },
    blocked: true,
  });
});

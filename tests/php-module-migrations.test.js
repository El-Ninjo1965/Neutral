'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const runnerPath = path.join(projectRoot, 'Server/php/src/ModuleMigrationRunner.php');
const bootstrapPath = path.join(projectRoot, 'Server/php/bootstrap.php');
const schemaPath = path.join(projectRoot, 'Server/php/src/SchemaMigrator.php');

test('module migration runner and checksum columns are part of the PHP runtime', () => {
  assert.equal(fs.existsSync(runnerPath), true);
  assert.match(fs.readFileSync(bootstrapPath, 'utf8'), /ModuleMigrationRunner\.php/);
  const schema = fs.readFileSync(schemaPath, 'utf8');
  assert.match(schema, /2026_09_03_0003_module_contract/);
  assert.match(schema, /checksum CHAR\(64\)/);
  assert.match(schema, /module_version VARCHAR\(64\)/);
  assert.match(schema, /executeStatementIdempotently/);
  assert.match(schema, /verifyExistingModuleMigrationColumn/);
  assert.match(fs.readFileSync(runnerPath, 'utf8'), /assertOwnedRollback/);
  assert.match(fs.readFileSync(runnerPath, 'utf8'), /Applied module migration is missing from the current definition/);
});

test('destructive rollback accepts only reversible statements targeting declared owned tables', (t) => {
  const probe = spawnSync('php', ['-v'], { encoding: 'utf8' });
  if (probe.error && probe.error.code === 'ENOENT') {
    t.skip('PHP executable is not available (ENOENT).');
    return;
  }
  const script = `
require ${JSON.stringify(runnerPath)};
use Neutral\\Core\\ModuleMigrationRunner;
$safe = [
  ['key' => '2026_09_03_0001_create', 'version' => '1.0.0', 'up' => ['CREATE TABLE reference_notes_items (id INT)'], 'down' => ['DROP TABLE IF EXISTS reference_notes_items']],
  ['key' => '2026_09_03_0002_extend', 'version' => '1.1.0', 'up' => ['ALTER TABLE reference_notes_items ADD COLUMN title VARCHAR(10)'], 'down' => ['ALTER TABLE reference_notes_items DROP COLUMN title']],
];
ModuleMigrationRunner::assertOwnedRollback('reference-notes', ['reference_notes_items'], $safe);
$blocked = 0;
foreach ([
  [['key' => '2026_09_03_0001_bad', 'version' => '1.0.0', 'up' => ['SELECT 1'], 'down' => ['DROP TABLE users']]],
  [['key' => '2026_09_03_0001_bad', 'version' => '1.0.0', 'up' => ['SELECT 1'], 'down' => ['DROP TABLE IF EXISTS reference_notes_items; DROP TABLE users']]],
  [['key' => '2026_09_03_0001_bad', 'version' => '1.0.0', 'up' => ['SELECT 1'], 'down' => ['ALTER TABLE reference_notes_items DROP COLUMN title, RENAME TO users']]],
  [['key' => '2026_09_03_0001_bad', 'version' => '1.0.0', 'up' => ['SELECT 1'], 'down' => ['ALTER TABLE reference_notes_items EXCHANGE PARTITION p WITH TABLE users']]],
] as $bad) {
  try { ModuleMigrationRunner::assertOwnedRollback('reference-notes', ['reference_notes_items'], $bad); }
  catch (Throwable $error) { $blocked++; }
}
echo json_encode(['blocked' => $blocked], JSON_THROW_ON_ERROR);
`;
  const result = spawnSync('php', ['-r', script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(JSON.parse(result.stdout), { blocked: 4 });
});

test('migration batch is ordered, idempotent, checksum-bound and compensates failures', (t) => {
  const probe = spawnSync('php', ['-v'], { encoding: 'utf8' });
  if (probe.error && probe.error.code === 'ENOENT') {
    t.skip('PHP executable is not available (ENOENT).');
    return;
  }
  assert.equal(probe.status, 0);
  const script = `
require ${JSON.stringify(runnerPath)};
use Neutral\\Core\\ModuleMigrationRunner;

$definitions = [
  ['key' => '2026_09_03_0001_create', 'version' => '1.0.0', 'up' => ['up-1'], 'down' => ['down-1']],
  ['key' => '2026_09_03_0002_extend', 'version' => '1.1.0', 'up' => ['up-2'], 'down' => ['down-2']],
];
$events = [];
$applied = [];
$result = ModuleMigrationRunner::runBatch(
  $definitions,
  static fn (string $key): ?string => $applied[$key] ?? null,
  static function (array $migration) use (&$events): void { $events[] = 'apply:' . $migration['key']; },
  static function (array $migration, string $checksum) use (&$applied, &$events): void { $applied[$migration['key']] = $checksum; $events[] = 'record:' . $migration['key']; },
  static function (array $migration) use (&$applied, &$events): void { unset($applied[$migration['key']]); $events[] = 'rollback:' . $migration['key']; }
);
$second = ModuleMigrationRunner::runBatch(
  $definitions,
  static fn (string $key): ?string => $applied[$key] ?? null,
  static function (): void { throw new RuntimeException('must not apply'); },
  static function (): void { throw new RuntimeException('must not record'); },
  static function (): void { throw new RuntimeException('must not rollback'); }
);
$tamper = false;
try {
  $changed = $definitions;
  $changed[0]['up'] = ['changed'];
  ModuleMigrationRunner::runBatch($changed, static fn (string $key): ?string => $applied[$key] ?? null, static function (): void {}, static function (): void {}, static function (): void {});
} catch (Throwable $error) { $tamper = true; }
$failureEvents = [];
try {
  ModuleMigrationRunner::runBatch(
    $definitions,
    static fn (): ?string => null,
    static function (array $migration) use (&$failureEvents): void { $failureEvents[] = 'apply:' . $migration['key']; if (str_ends_with($migration['key'], 'extend')) { throw new RuntimeException('fail'); } },
    static function (array $migration) use (&$failureEvents): void { $failureEvents[] = 'record:' . $migration['key']; },
    static function (array $migration) use (&$failureEvents): void { $failureEvents[] = 'rollback:' . $migration['key']; }
  );
} catch (Throwable $error) { $failureEvents[] = 'failed'; }
echo json_encode(['result' => $result, 'second' => $second, 'events' => $events, 'tamper' => $tamper, 'failureEvents' => $failureEvents], JSON_THROW_ON_ERROR);
`;
  const result = spawnSync('php', ['-r', script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.deepEqual(payload.result.applied, ['2026_09_03_0001_create', '2026_09_03_0002_extend']);
  assert.deepEqual(payload.second.skipped, ['2026_09_03_0001_create', '2026_09_03_0002_extend']);
  assert.equal(payload.tamper, true);
  assert.deepEqual(payload.failureEvents, [
    'apply:2026_09_03_0001_create', 'record:2026_09_03_0001_create',
    'apply:2026_09_03_0002_extend', 'rollback:2026_09_03_0002_extend',
    'rollback:2026_09_03_0001_create', 'failed'
  ]);
});

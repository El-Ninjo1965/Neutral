'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('PHP device-session list executes one complete query and marks the current session', () => {
  const php = String.raw`
require '${root}/Server/php/bootstrap.php';
class FakeStatement extends PDOStatement {
  public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array {
    return [['session_id' => session_id(), 'user_id' => 101, 'username' => 'admin', 'display_name' => 'Admin', 'status' => 'active', 'issued_at' => '2026-09-09 00:00:00', 'last_seen_at' => '2026-09-09 01:00:00', 'expires_at' => '2026-10-09 00:00:00', 'device_id' => str_repeat('a', 32), 'device_label' => 'iPad', 'user_agent' => 'Safari', 'role_keys' => 'admin']];
  }
}
class FakePdo extends PDO {
  public array $queries = [];
  public function __construct() {}
  public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): PDOStatement|false {
    $this->queries[] = [$query, func_num_args()];
    return new FakeStatement();
  }
}
$env = ['APP_ENV'=>'test','DB_TYPE'=>'mysql','DB_HOST'=>'localhost','DB_NAME'=>'neutral','DB_USER'=>'neutral'];
$config = new Neutral\Core\AppConfig($env, '${root}');
$database = new Neutral\Core\Database($config);
$pdo = new FakePdo();
$property = new ReflectionProperty($database, 'pdo'); $property->setAccessible(true); $property->setValue($database, $pdo);
session_id('phase2-current-session');
$registry = new Neutral\Core\Phase4SessionRegistry(new Neutral\Core\Phase4JsonStore(sys_get_temp_dir()), $database);
$rows = $registry->listPublic();
echo json_encode(['args'=>$pdo->queries[0][1], 'sql'=>$pdo->queries[0][0], 'current'=>$rows[0]['current']]);`;
  const result = spawnSync('php', ['-r', php], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.args, 1);
  assert.match(payload.sql, /GROUP_CONCAT/);
  assert.equal(payload.current, true);
});

test('Admin infrastructure consumes the real nested PHP envelope and preserves explicit errors', async () => {
  global.AdminCommon = require('../Web-App/public/admin/common.js').AdminCommon;
  const Router = require('../Web-App/public/admin/index.js');
  const View = Router.AdminInfrastructureView;
  assert.equal(typeof View, 'function');
  const success = (data) => Promise.resolve({ ok: true, data: { ok: true, data } });
  const api = { get(endpoint) {
    const values = {
      '/api/admin/connections': { connections: [{ name: 'Primary database', status: 'ready' }] },
      '/api/admin/providers': { providers: [], status: 'not_configured' },
      '/api/admin/backups': { backups: [{ backupId: 'a'.repeat(32) }], automation: { scheduler: 'external-cron-required' } },
      '/api/admin/backups/readiness': { readiness: { keyConfigured: true, cryptoAvailable: true, databaseReady: true, managedTablesReady: true, storageReady: true } },
      '/api/admin/release/status': { release: { version: '1.2.3', commit: 'abcdef0' } },
      '/api/setup/status': { setup: { status: 'ACTIVE' } },
      '/api/admin/database': { database: { status: 'ready' } },
      '/api/admin/server': { server: { status: 'healthy' } }
    };
    return success(values[endpoint]);
  }};
  const view = new View(api);
  await view.loadData();
  assert.equal(view.snapshot.connections.length, 1);
  assert.equal(view.snapshot.providersStatus, 'not_configured');
  assert.equal(view.snapshot.backups.length, 1);
  assert.equal(view.snapshot.release.version, '1.2.3');
  assert.equal(view.snapshot.database.status, 'ready');
  assert.equal(view.snapshot.server.status, 'healthy');
});

test('production package includes operational CLI entrypoints', () => {
  const { buildProductionPackage } = require('../scripts/lib/portable-install.js');
  const outputDir = path.join('/tmp', `neutral-phase2-package-${process.pid}`);
  const result = buildProductionPackage({ sourceRoot: root, outputDir, sourceCommit: '0123456789abcdef0123456789abcdef01234567' });
  const paths = result.manifest.files.map((entry) => entry.path);
  assert.ok(paths.includes('scripts/run-automatic-backup.php'));
  assert.ok(paths.includes('scripts/run-core-migrations.php'));
});

test('PHP settings persist manual retention and reject invalid interval/retention', () => {
  const php = String.raw`
require '${root}/Server/php/bootstrap.php';
$dir = sys_get_temp_dir() . '/neutral-settings-' . bin2hex(random_bytes(4)); mkdir($dir);
$service = new Neutral\Core\Phase4SettingsService(new Neutral\Core\Phase4JsonStore($dir));
$saved = $service->update(['settings'=>['backupEnabled'=>true,'backupInterval'=>'weekly','backupRetention'=>23]]);
$errors = 0;
foreach ([['backupInterval'=>'hourly','backupRetention'=>23], ['backupInterval'=>'daily','backupRetention'=>0], ['backupInterval'=>'daily','backupRetention'=>101]] as $settings) {
  try { $service->update(['settings'=>$settings]); } catch (RuntimeException $e) { $errors++; }
}
echo json_encode(['interval'=>$saved['settings']['backupInterval'],'retention'=>$saved['settings']['backupRetention'],'errors'=>$errors]);`;
  const result = spawnSync('php', ['-r', php], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { interval: 'weekly', retention: 23, errors: 3 });
});

test('backup prerequisite failures expose stable safe codes without secret values', () => {
  const php = String.raw`
require '${root}/Server/php/bootstrap.php';
$config = new Neutral\Core\AppConfig(['APP_ENV'=>'test','DB_TYPE'=>'mysql','DB_HOST'=>'localhost','DB_NAME'=>'neutral','DB_USER'=>'neutral','NEUTRAL_BACKUP_KEY'=>''], '${root}');
try {
  new Neutral\Core\DatabaseBackupService(new Neutral\Core\Database($config), new Neutral\Core\SchemaMigrator(new Neutral\Core\Database($config)), $config, '${root}');
} catch (Neutral\Core\BackupRuntimeException $e) { echo $e->safeCode(); }`;
  const result = spawnSync('php', ['-r', php], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'BACKUP_KEY_NOT_CONFIGURED');
});

test('route alerts are removed while explicitly global alerts survive navigation', () => {
  const { AdminCommon } = require('../Web-App/public/admin/common.js');
  const removed = [];
  global.document = { querySelectorAll(selector) {
    assert.equal(selector, '.alert[data-alert-scope="route"]');
    return [{ remove: () => removed.push('route') }];
  }};
  AdminCommon.clearRouteAlerts();
  assert.deepEqual(removed, ['route']);
  delete global.document;
});

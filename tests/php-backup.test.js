'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const projectRoot = path.resolve(__dirname, '..');

function runPhp(script, env = {}) {
  return spawnSync('php', ['-r', script], {
    cwd: projectRoot,
    env: { ...process.env, NEUTRAL_TEST_ROOT: projectRoot, ...env },
    encoding: 'utf8'
  });
}

test('encrypted PHP backup round-trips managed data without plaintext or ephemeral tables', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-backup-roundtrip-'));
  try {
    const capture = path.join(root, 'restored.json');
    const result = runPhp(`
require getenv('NEUTRAL_TEST_ROOT') . '/Server/php/bootstrap.php';
$config = new \\Neutral\\Core\\AppConfig(['NEUTRAL_BACKUP_KEY' => str_repeat('k', 32)]);
$database = new \\Neutral\\Core\\Database($config);
$migrator = new \\Neutral\\Core\\SchemaMigrator($database);
$exporter = static function (array $tables): array {
    return [
        'users' => [['id' => 101, 'username' => 'portable-admin', 'password_hash' => 'sensitive-hash']],
        'settings' => [['setting_key' => 'acceptance.marker', 'setting_value_json' => '{"value":"roundtrip"}']],
        'sessions' => [['session_id' => 'must-not-travel']],
        'login_attempts' => [['scope_key' => 'must-not-travel']]
    ];
};
$importer = static function (array $tables): void { file_put_contents(getenv('NEUTRAL_CAPTURE'), json_encode($tables)); };
$service = new \\Neutral\\Core\\DatabaseBackupService($database, $migrator, $config, getenv('NEUTRAL_BACKUP_ROOT'), $exporter, $importer);
$created = $service->create();
$bytes = file_get_contents($service->pathForDownload($created['backupId']));
$restored = $service->restore($created['backupId']);
echo json_encode(['created' => $created, 'restored' => $restored, 'containsPlaintext' => str_contains($bytes, 'portable-admin') || str_contains($bytes, 'sensitive-hash')]);
`, { NEUTRAL_BACKUP_ROOT: root, NEUTRAL_CAPTURE: capture });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.created.status, 'created');
    assert.equal(payload.restored.status, 'restored');
    assert.equal(payload.containsPlaintext, false);
    const restored = JSON.parse(fs.readFileSync(capture, 'utf8'));
    assert.equal(restored.users[0].username, 'portable-admin');
    assert.equal(restored.settings[0].setting_key, 'acceptance.marker');
    assert.equal(restored.sessions, undefined);
    assert.equal(restored.login_attempts, undefined);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('tampered or wrongly keyed backup is rejected before importer mutation', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-backup-tamper-'));
  try {
    const capture = path.join(root, 'mutated.txt');
    const result = runPhp(`
require getenv('NEUTRAL_TEST_ROOT') . '/Server/php/bootstrap.php';
function service_for(string $key, string $root, string $capture): \\Neutral\\Core\\DatabaseBackupService {
    $config = new \\Neutral\\Core\\AppConfig(['NEUTRAL_BACKUP_KEY' => $key]);
    $database = new \\Neutral\\Core\\Database($config);
    return new \\Neutral\\Core\\DatabaseBackupService(
        $database,
        new \\Neutral\\Core\\SchemaMigrator($database),
        $config,
        $root,
        static fn (array $tables): array => ['users' => [['id' => 101]]],
        static function (array $tables) use ($capture): void { file_put_contents($capture, 'mutated'); }
    );
}
$service = service_for(str_repeat('a', 32), getenv('NEUTRAL_BACKUP_ROOT'), getenv('NEUTRAL_CAPTURE'));
$created = $service->create();
$wrongKeyRejected = false;
try { service_for(str_repeat('b', 32), getenv('NEUTRAL_BACKUP_ROOT'), getenv('NEUTRAL_CAPTURE'))->restore($created['backupId']); } catch (Throwable $error) { $wrongKeyRejected = true; }
$path = $service->pathForDownload($created['backupId']);
$envelope = json_decode(file_get_contents($path), true);
$envelope['ciphertext'] = substr($envelope['ciphertext'], 0, -2) . 'AA';
file_put_contents($path, json_encode($envelope));
$tamperRejected = false;
try { $service->restore($created['backupId']); } catch (Throwable $error) { $tamperRejected = true; }
$traversalRejected = false;
try { $service->pathForDownload('../.env'); } catch (Throwable $error) { $traversalRejected = true; }
echo json_encode(['wrongKeyRejected' => $wrongKeyRejected, 'tamperRejected' => $tamperRejected, 'traversalRejected' => $traversalRejected, 'mutated' => file_exists(getenv('NEUTRAL_CAPTURE'))]);
`, { NEUTRAL_BACKUP_ROOT: root, NEUTRAL_CAPTURE: capture });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.deepEqual(JSON.parse(result.stdout), {
      wrongKeyRejected: true,
      tamperRejected: true,
      traversalRejected: true,
      mutated: false
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('backup key shorter than 32 characters is rejected', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-backup-key-'));
  try {
    const result = runPhp(`
require getenv('NEUTRAL_TEST_ROOT') . '/Server/php/bootstrap.php';
$config = new \\Neutral\\Core\\AppConfig(['NEUTRAL_BACKUP_KEY' => 'short']);
$database = new \\Neutral\\Core\\Database($config);
$message = '';
try {
    new \\Neutral\\Core\\DatabaseBackupService($database, new \\Neutral\\Core\\SchemaMigrator($database), $config, getenv('NEUTRAL_BACKUP_ROOT'), static fn (array $tables): array => []);
} catch (Throwable $error) { $message = $error->getMessage(); }
echo json_encode(['message' => $message]);
`, { NEUTRAL_BACKUP_ROOT: root });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(JSON.parse(result.stdout).message, /at least 32 characters/i);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('validated encrypted backup can be uploaded to an isolated target', () => {
  const sourceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-backup-source-'));
  const targetRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-backup-target-'));
  try {
    const result = runPhp(`
require getenv('NEUTRAL_TEST_ROOT') . '/Server/php/bootstrap.php';
function portable_service(string $root): \\Neutral\\Core\\DatabaseBackupService {
    $config = new \\Neutral\\Core\\AppConfig(['NEUTRAL_BACKUP_KEY' => str_repeat('p', 32)]);
    $database = new \\Neutral\\Core\\Database($config);
    return new \\Neutral\\Core\\DatabaseBackupService($database, new \\Neutral\\Core\\SchemaMigrator($database), $config, $root, static fn (array $tables): array => ['users' => [['id' => 101]]], static fn (array $tables) => null);
}
$source = portable_service(getenv('NEUTRAL_SOURCE_ROOT'));
$created = $source->create();
$bytes = file_get_contents($source->pathForDownload($created['backupId']));
$target = portable_service(getenv('NEUTRAL_TARGET_ROOT'));
$uploaded = $target->storeUpload($bytes);
$listed = $target->list();
echo json_encode(['uploaded' => $uploaded, 'listed' => $listed]);
`, { NEUTRAL_SOURCE_ROOT: sourceRoot, NEUTRAL_TARGET_ROOT: targetRoot });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.uploaded.status, 'uploaded');
    assert.equal(payload.listed.length, 1);
    assert.equal(payload.listed[0].backupId, payload.uploaded.backupId);
  } finally {
    fs.rmSync(sourceRoot, { recursive: true, force: true });
    fs.rmSync(targetRoot, { recursive: true, force: true });
  }
});

test('restore rejects authenticated partial or incompatible-schema artifacts before mutation', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-backup-schema-'));
  try {
    const capture = path.join(root, 'mutated.txt');
    const result = runPhp(`
require getenv('NEUTRAL_TEST_ROOT') . '/Server/php/bootstrap.php';
$configuredKey = str_repeat('s', 32);
$config = new \\Neutral\\Core\\AppConfig(['NEUTRAL_BACKUP_KEY' => $configuredKey]);
$database = new \\Neutral\\Core\\Database($config);
$service = new \\Neutral\\Core\\DatabaseBackupService($database, new \\Neutral\\Core\\SchemaMigrator($database), $config, getenv('NEUTRAL_BACKUP_ROOT'), static fn (array $tables): array => [], static function (array $tables): void { file_put_contents(getenv('NEUTRAL_CAPTURE'), 'mutated'); });
function write_artifact(\\Neutral\\Core\\DatabaseBackupService $service, string $configuredKey, string $id, string $schemaVersion, array $tables): void {
    $payload = ['format' => 'neutral-logical-backup-v1', 'schemaVersion' => $schemaVersion, 'createdAt' => '2026-09-01T00:00:00Z', 'tables' => $tables];
    $payloadJson = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    $plaintext = json_encode(['checksum' => hash('sha256', $payloadJson), 'payload' => $payload], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    $nonce = random_bytes(12); $tag = '';
    $ciphertext = openssl_encrypt($plaintext, 'aes-256-gcm', hash('sha256', $configuredKey, true), OPENSSL_RAW_DATA, $nonce, $tag, $id, 16);
    $envelope = ['envelope' => 'neutral-encrypted-backup-v1', 'backupId' => $id, 'createdAt' => '2026-09-01T00:00:00Z', 'nonce' => base64_encode($nonce), 'tag' => base64_encode($tag), 'ciphertext' => base64_encode($ciphertext)];
    $path = $service->pathForDownload($id); @mkdir(dirname($path), 0700, true); file_put_contents($path, json_encode($envelope));
}
$partialId = str_repeat('c', 32);
write_artifact($service, $configuredKey, $partialId, '2026_09_01_0002', ['users' => []]);
$partialRejected = false; try { $service->restore($partialId); } catch (Throwable $error) { $partialRejected = true; }
$schemaId = str_repeat('d', 32);
$allTables = []; foreach ($service->portableTables() as $table) { $allTables[$table] = []; }
write_artifact($service, $configuredKey, $schemaId, 'obsolete-schema', $allTables);
$schemaRejected = false; try { $service->restore($schemaId); } catch (Throwable $error) { $schemaRejected = true; }
echo json_encode(['partialRejected' => $partialRejected, 'schemaRejected' => $schemaRejected, 'mutated' => file_exists(getenv('NEUTRAL_CAPTURE'))]);
`, { NEUTRAL_BACKUP_ROOT: root, NEUTRAL_CAPTURE: capture });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.deepEqual(JSON.parse(result.stdout), { partialRejected: true, schemaRejected: true, mutated: false });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('streaming upload enforces byte limit before storing an artifact', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-backup-stream-'));
  try {
    const result = runPhp(`
require getenv('NEUTRAL_TEST_ROOT') . '/Server/php/bootstrap.php';
$config = new \\Neutral\\Core\\AppConfig(['NEUTRAL_BACKUP_KEY' => str_repeat('u', 32)]);
$database = new \\Neutral\\Core\\Database($config);
$service = new \\Neutral\\Core\\DatabaseBackupService($database, new \\Neutral\\Core\\SchemaMigrator($database), $config, getenv('NEUTRAL_BACKUP_ROOT'), static fn (array $tables): array => []);
$stream = fopen('php://temp', 'w+b'); fwrite($stream, str_repeat('x', 128)); rewind($stream);
$message = ''; try { $service->storeUploadStream($stream, 64); } catch (Throwable $error) { $message = $error->getMessage(); }
fclose($stream);
echo json_encode(['message' => $message, 'stored' => $service->list()]);
`, { NEUTRAL_BACKUP_ROOT: root });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const payload = JSON.parse(result.stdout);
    assert.match(payload.message, /size limit/i);
    assert.deepEqual(payload.stored, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

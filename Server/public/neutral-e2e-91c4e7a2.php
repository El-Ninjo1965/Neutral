<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/php/bootstrap.php';

use Neutral\Core\PrerequisiteChecker;
use Neutral\Core\SetupInstaller;
use Neutral\Core\SetupStateStore;

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

$expectedFingerprint = 'f13d47a4d9a46e4b';
$expectedTables = [
    'audit_log',
    'backups',
    'module_migrations',
    'module_state',
    'modules',
    'permissions',
    'release_state',
    'role_permissions',
    'roles',
    'schema_migrations',
    'sessions',
    'settings',
    'setup_status',
    'user_roles',
    'users',
];

$result = [
    'marker' => 'neutral-db-reset-91c4e7a2',
    'identity_verified' => false,
    'table_set_verified' => false,
    'tables_dropped' => 0,
    'installation_active' => false,
    'migration_pending_count' => null,
    'post_install_tables' => [],
    'error_category' => null,
];

try {
    $runtime = neutral_bootstrap();
    $database = $runtime->config()->database();
    $fingerprint = substr(hash('sha256', implode('|', [
        'neutral-db-inspect-91c4e7a2',
        $database['host'],
        $database['port'],
        $database['name'],
        $database['user'],
    ])), 0, 16);
    if (!hash_equals($expectedFingerprint, $fingerprint)) {
        $result['error_category'] = 'DB_IDENTITY_MISMATCH';
        throw new RuntimeException('Database identity mismatch.');
    }
    $result['identity_verified'] = true;

    $pdo = $runtime->database()->connect();
    $statement = $pdo->query('SHOW TABLES');
    $tables = $statement === false ? [] : array_map('strval', $statement->fetchAll(PDO::FETCH_COLUMN));
    sort($tables);
    if ($tables !== $expectedTables) {
        $result['error_category'] = 'TABLE_SET_MISMATCH';
        throw new RuntimeException('Database table set mismatch.');
    }
    $result['table_set_verified'] = true;

    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    try {
        foreach ($tables as $table) {
            $quoted = '`' . str_replace('`', '``', $table) . '`';
            $pdo->exec('DROP TABLE ' . $quoted);
            $result['tables_dropped']++;
        }
    } finally {
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    }

    $stateFile = SetupStateStore::defaultStateFile($runtime->projectRoot());
    if (is_file($stateFile) && !@unlink($stateFile)) {
        $result['error_category'] = 'SETUP_STATE_RESET_FAILED';
        throw new RuntimeException('Could not reset setup state.');
    }

    $stateStore = new SetupStateStore($stateFile);
    $checker = new PrerequisiteChecker($runtime->config(), $runtime->database());
    $installer = new SetupInstaller($runtime, $stateStore, $checker);
    $installed = $installer->install();
    $result['installation_active'] = strtoupper((string) ($installed['status'] ?? '')) === 'ACTIVE'
        && (bool) (($installed['installation']['active'] ?? false) === true);
    $result['migration_pending_count'] = count((array) ($installed['migrationState']['pending'] ?? []));

    $postStatement = $pdo->query('SHOW TABLES');
    $postTables = $postStatement === false ? [] : array_map('strval', $postStatement->fetchAll(PDO::FETCH_COLUMN));
    sort($postTables);
    $result['post_install_tables'] = $postTables;
    if (!$result['installation_active'] || $result['migration_pending_count'] !== 0) {
        $result['error_category'] = 'INSTALLATION_INCOMPLETE';
    }
} catch (Throwable $exception) {
    if ($result['error_category'] === null) {
        $result['error_category'] = 'RESET_OR_INSTALL_FAILED';
    }
}

$result['self_deleted'] = @unlink(__FILE__);
$resultPath = __DIR__ . '/neutral-db-reset-result-91c4e7a2.php';
$result['result_persisted'] = false;
$encoded = json_encode($result, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . PHP_EOL;
$result['result_persisted'] = file_put_contents($resultPath, $encoded, LOCK_EX) !== false;
$encoded = json_encode($result, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . PHP_EOL;
if ($result['result_persisted']) {
    file_put_contents($resultPath, $encoded, LOCK_EX);
}
echo $encoded;

<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/php/bootstrap.php';

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

$expectedFingerprint = 'f13d47a4d9a46e4b';
$expectedTables = [
    'audit_log', 'backups', 'module_migrations', 'module_state', 'modules',
    'permissions', 'release_state', 'role_permissions', 'roles',
    'schema_migrations', 'sessions', 'settings', 'setup_status', 'user_roles', 'users',
];
$result = [
    'marker' => 'neutral-health-91c4e7a2',
    'identity_verified' => false,
    'database_connected' => false,
    'table_set_verified' => false,
    'table_count' => 0,
    'setup_status' => null,
    'migration_count' => null,
    'error_category' => null,
    'result_persisted' => false,
];

try {
    $runtime = neutral_bootstrap();
    $database = $runtime->config()->database();
    $fingerprint = substr(hash('sha256', implode('|', [
        'neutral-db-inspect-91c4e7a2', $database['host'], $database['port'],
        $database['name'], $database['user'],
    ])), 0, 16);
    $result['identity_verified'] = hash_equals($expectedFingerprint, $fingerprint);
    if (!$result['identity_verified']) {
        throw new RuntimeException('Database identity mismatch.');
    }

    $pdo = $runtime->database()->connect();
    $result['database_connected'] = true;
    $statement = $pdo->query('SHOW TABLES');
    $tables = $statement === false ? [] : array_map('strval', $statement->fetchAll(PDO::FETCH_COLUMN));
    sort($tables);
    $result['table_count'] = count($tables);
    $result['table_set_verified'] = $tables === $expectedTables;

    $setup = $pdo->query('SELECT status FROM setup_status WHERE id = 1 LIMIT 1');
    $result['setup_status'] = $setup === false ? null : ($setup->fetchColumn() ?: null);
    $migrations = $pdo->query('SELECT COUNT(*) FROM schema_migrations');
    $result['migration_count'] = $migrations === false ? null : (int) $migrations->fetchColumn();
} catch (Throwable $exception) {
    $result['error_category'] = $result['identity_verified'] ? 'HEALTH_CHECK_FAILED' : 'DB_IDENTITY_MISMATCH';
}

$resultPath = __DIR__ . '/health-result-91c4e7a2.json';
$encoded = json_encode($result, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . PHP_EOL;
$result['result_persisted'] = file_put_contents($resultPath, $encoded, LOCK_EX) !== false;
$encoded = json_encode($result, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . PHP_EOL;
if ($result['result_persisted']) {
    file_put_contents($resultPath, $encoded, LOCK_EX);
}
echo $encoded;

<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/php/bootstrap.php';

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

$marker = 'neutral-db-inspect-91c4e7a2';
$result = [
    'marker' => $marker,
    'db_config_complete' => false,
    'db_connected' => false,
    'db_fingerprint' => null,
    'tables' => [],
    'error_category' => null,
];

try {
    $runtime = neutral_bootstrap();
    $database = $runtime->config()->database();
    $result['db_config_complete'] = trim($database['host']) !== ''
        && trim($database['port']) !== ''
        && trim($database['name']) !== ''
        && trim($database['user']) !== ''
        && trim($database['password']) !== '';
    $result['db_fingerprint'] = substr(hash('sha256', implode('|', [
        $marker,
        $database['host'],
        $database['port'],
        $database['name'],
        $database['user'],
    ])), 0, 16);

    $pdo = $runtime->database()->connect();
    $result['db_connected'] = true;
    $statement = $pdo->query('SHOW TABLES');
    $tables = $statement === false ? [] : $statement->fetchAll(PDO::FETCH_COLUMN);

    foreach ($tables as $table) {
        $tableName = (string) $table;
        $quoted = '`' . str_replace('`', '``', $tableName) . '`';
        $countStatement = $pdo->query('SELECT COUNT(*) FROM ' . $quoted);
        $result['tables'][] = [
            'name' => $tableName,
            'rows' => $countStatement === false ? null : (int) $countStatement->fetchColumn(),
        ];
    }
} catch (Throwable $exception) {
    $result['error_category'] = $result['db_connected'] ? 'TABLE_INSPECTION_FAILED' : 'DB_CONNECTION_FAILED';
}

$result['self_deleted'] = @unlink(__FILE__);
$resultPath = __DIR__ . '/neutral-db-result-91c4e7a2.json';
$result['result_persisted'] = false;
$encoded = json_encode($result, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . PHP_EOL;
$result['result_persisted'] = file_put_contents($resultPath, $encoded, LOCK_EX) !== false;
$encoded = json_encode($result, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . PHP_EOL;
if ($result['result_persisted']) {
    file_put_contents($resultPath, $encoded, LOCK_EX);
}
echo $encoded;

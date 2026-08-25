<?php
header('Content-Type: text/html; charset=utf-8');

$diagToken = getenv('NEUTRAL_DIAGNOSE_TOKEN');
if (is_string($diagToken) && trim($diagToken) !== '' && (!isset($_GET['token']) || $_GET['token'] !== trim($diagToken))) {
    http_response_code(403);
    echo '<!doctype html><html><body><h1>Forbidden</h1></body></html>';
    exit;
}

function readEnvFile($filePath) {
    if (!is_string($filePath) || trim($filePath) === '' || !is_file($filePath) || !is_readable($filePath)) {
        return [];
    }

    $values = [];
    $lines = @file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return [];
    }

    foreach ($lines as $line) {
        $trimmed = trim((string) $line);
        if ($trimmed === '' || strpos($trimmed, '#') === 0) {
            continue;
        }

        $separatorIndex = strpos($trimmed, '=');
        if ($separatorIndex === false) {
            continue;
        }

        $key = trim(substr($trimmed, 0, $separatorIndex));
        $rawValue = trim(substr($trimmed, $separatorIndex + 1));
        if ($key === '') {
            continue;
        }

        $cleanValue = stripslashes($rawValue);
        if (strlen($cleanValue) >= 2 && (($cleanValue[0] === '"' && $cleanValue[strlen($cleanValue) - 1] === '"') || ($cleanValue[0] === '\'' && $cleanValue[strlen($cleanValue) - 1] === '\''))) {
            $cleanValue = substr($cleanValue, 1, -1);
        }

        $values[$key] = $cleanValue;
    }

    return $values;
}

function statusForValue($value) {
    if (!isset($value)) {
        return 'MISSING';
    }

    $text = trim((string) $value);
    if ($text === '') {
        return 'EMPTY';
    }

    return 'SET';
}

function statusForDbUrl($value) {
    $trimmed = trim((string) $value);
    if ($trimmed === '') {
        return 'MISSING';
    }

    $parsed = @parse_url($trimmed);
    if (!is_array($parsed) || empty($parsed['scheme']) || empty($parsed['host'])) {
        return 'INVALID';
    }

    return 'SET';
}

function parseDbUrlSummary($value) {
    $trimmed = trim((string) $value);
    if ($trimmed === '') {
        return [
            'present' => false,
            'scheme' => null,
            'host' => null,
            'port' => null,
            'database' => null,
            'username' => null,
        ];
    }

    $parsed = @parse_url($trimmed);
    if (!is_array($parsed)) {
        return [
            'present' => true,
            'scheme' => 'INVALID',
            'host' => null,
            'port' => null,
            'database' => null,
            'username' => null,
        ];
    }

    return [
        'present' => true,
        'scheme' => isset($parsed['scheme']) ? strtolower((string) $parsed['scheme']) : null,
        'host' => isset($parsed['host']) ? (string) $parsed['host'] : null,
        'port' => isset($parsed['port']) ? (int) $parsed['port'] : null,
        'database' => isset($parsed['path']) ? ltrim((string) $parsed['path'], '/') : null,
        'username' => isset($parsed['user']) ? (string) $parsed['user'] : null,
    ];
}

function sanitizeMessage($message, $secret) {
    $text = trim((string) $message);
    if ($secret !== '') {
        $text = str_replace($secret, '[MASKED]', $text);
    }
    return preg_replace('/\s+/', ' ', $text);
}

function safeCommandOutput($command) {
    if (!function_exists('shell_exec')) {
        return null;
    }

    $output = @shell_exec($command . ' 2>/dev/null');
    if (!is_string($output)) {
        return null;
    }

    $trimmed = trim($output);
    return $trimmed === '' ? null : $trimmed;
}

function fileStatus($path) {
    $exists = is_file($path);
    $readable = $exists && is_readable($path);
    return [
        'path' => $path,
        'exists' => $exists,
        'readable' => $readable,
        'size' => $exists ? @filesize($path) : null,
    ];
}

function describePath($path) {
    return [
        'path' => $path,
        'exists' => file_exists($path),
        'is_dir' => is_dir($path),
        'readable' => is_readable($path),
        'writable' => is_writable($path),
    ];
}

$envCandidatePaths = [
    '/home/web1819/.env',
    '/home/web1819/public_html/.env',
    '/home/web1819/public_html/index/app/neutral/.env',
    dirname(__DIR__) . '/.env',
    dirname(__DIR__) . '/.env.local',
    dirname(__DIR__) . '/.env.production',
    dirname(__DIR__) . '/.env.deploy',
];

$env = [];
foreach ($envCandidatePaths as $candidatePath) {
    $env = array_replace($env, readEnvFile($candidatePath));
}

$requiredKeys = [
    'PORT',
    'HOST',
    'NODE_ENV',
    'DEFAULT_APP_ID',
    'DB_TYPE',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'DB_URL',
    'PUBLIC_WEBROOT_PATH',
    'PUBLIC_URL',
    'AUTH_SESSION_STORE',
    'AUTH_SESSION_TTL_MS',
    'AUTH_SESSION_COOKIE_NAME',
    'AUTH_COOKIE_SAMESITE',
    'SERVER_MODE',
    'FTP_SERVER',
    'FTP_PORT',
    'FTP_USERNAME',
    'FTP_TARGET_DIR',
    'FTP_PROTOCOL',
];

$envStatus = [];
foreach ($requiredKeys as $key) {
    $envStatus[$key] = statusForValue($env[$key] ?? null);
}
if (array_key_exists('DB_URL', $env) || array_key_exists('DATABASE_URL', $env)) {
    $dbUrlRaw = $env['DB_URL'] ?? $env['DATABASE_URL'] ?? '';
    $envStatus['DB_URL'] = statusForDbUrl($dbUrlRaw);
}

$expectedWebroot = '/home/web1819/public_html/index/app/neutral';
$webRootPath = '/home/web1819/public_html/index/app/neutral/webroot';
$webrootStatus = [
    'app_root' => describePath($expectedWebroot),
    'webroot' => describePath($webRootPath),
    'setup_php' => describePath($webRootPath . '/setup.php'),
    'admin_html' => describePath($webRootPath . '/admin.html'),
];

$projectRoot = dirname(__DIR__);
$configDir = $projectRoot . '/config';
$runtimeDir = $projectRoot . '/server/runtime';
$runtimeDataDir = $runtimeDir . '/data';
$storageFiles = [
    'setup-state.json',
    'admin-users.json',
    'admin-settings.json',
    'admin-roles.json',
    'audit-log.json',
    'sessions.json',
];
$storageFileStatus = [];
foreach ($storageFiles as $filename) {
    $storageFileStatus[$filename] = describePath($configDir . '/' . $filename);
}

$phpVersion = PHP_VERSION;
$phpSapi = php_sapi_name();
$serverSoftware = $_SERVER['SERVER_SOFTWARE'] ?? 'unknown';
$documentRoot = $_SERVER['DOCUMENT_ROOT'] ?? 'unknown';
$scriptFilename = $_SERVER['SCRIPT_FILENAME'] ?? 'unknown';
$requestUri = $_SERVER['REQUEST_URI'] ?? 'unknown';

$runtimeNode = safeCommandOutput('node -v 2>/dev/null');
$runtimeNpm = safeCommandOutput('npm -v 2>/dev/null');
$runtimeNpx = safeCommandOutput('npx -v 2>/dev/null');
$passenger = safeCommandOutput('passenger -v 2>/dev/null || /usr/local/bin/passenger -v 2>/dev/null || true');

$dbHost = trim((string) ($env['DB_HOST'] ?? ''));
$dbPort = trim((string) ($env['DB_PORT'] ?? '3306'));
$dbName = trim((string) ($env['DB_NAME'] ?? ''));
$dbUser = trim((string) ($env['DB_USER'] ?? ''));
$dbPassword = trim((string) ($env['DB_PASSWORD'] ?? ''));
$dbUrl = trim((string) ($env['DB_URL'] ?? $env['DATABASE_URL'] ?? ''));
$dbConfig = [
    'host' => $dbHost !== '' ? $dbHost : 'MISSING',
    'port' => $dbPort !== '' ? $dbPort : 'MISSING',
    'name' => $dbName !== '' ? $dbName : 'MISSING',
    'user' => $dbUser !== '' ? $dbUser : 'MISSING',
];

$mysqlAttempts = [];
$pdoAvailable = extension_loaded('pdo_mysql');
$mysqliAvailable = extension_loaded('mysqli');
$storageMetadata = [
    'db_metadata_status' => 'NOT_ATTEMPTED',
    'database' => $dbName !== '' ? $dbName : null,
    'active_database' => null,
    'table_count' => null,
    'error' => null,
];

$targets = [];
if ($dbHost !== '') {
    $targets[] = $dbHost;
}
if (!in_array('localhost', $targets, true)) {
    $targets[] = 'localhost';
}
if (!in_array('127.0.0.1', $targets, true)) {
    $targets[] = '127.0.0.1';
}

foreach ($targets as $hostCandidate) {
    $portCandidate = $dbPort !== '' ? (int) $dbPort : 3306;
    $hostLabel = strtolower(trim((string) $hostCandidate));
    $result = [
        'host' => $hostLabel,
        'port' => $portCandidate,
        'name' => $dbName !== '' ? 'SET' : 'MISSING',
        'user' => $dbUser !== '' ? 'SET' : 'MISSING',
        'status' => 'NOT_ATTEMPTED',
        'error' => null,
    ];

    if ($pdoAvailable && $dbName !== '' && $dbUser !== '' && $dbPassword !== '') {
        try {
            $dsn = 'mysql:host=' . $hostCandidate . ';port=' . $portCandidate . ';dbname=' . $dbName . ';charset=utf8mb4';
            $pdo = new PDO($dsn, $dbUser, $dbPassword, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            $pdo->query('SELECT 1');
            $result['status'] = 'SUCCESS';
            $result['error'] = null;
            $pdo = null;
        } catch (Throwable $throwable) {
            $result['status'] = 'FAILED';
            $result['error'] = sanitizeMessage($throwable->getMessage(), $dbPassword);
        }
    } elseif ($mysqliAvailable && $dbName !== '' && $dbUser !== '' && $dbPassword !== '') {
        $link = @mysqli_connect($hostCandidate, $dbUser, $dbPassword, $dbName, $portCandidate);
        if ($link === false) {
            $result['status'] = 'FAILED';
            $result['error'] = sanitizeMessage(mysqli_connect_error(), $dbPassword);
        } else {
            $result['status'] = 'SUCCESS';
            $result['error'] = null;
            @mysqli_close($link);
        }
    } else {
        $result['status'] = 'SKIPPED';
        $result['error'] = 'PDO/MySQLi not available or required DB values missing';
    }

    $mysqlAttempts[] = $result;
}

if ($pdoAvailable && $dbHost !== '' && $dbName !== '' && $dbUser !== '' && $dbPassword !== '') {
    try {
        $metadataDsn = 'mysql:host=' . $dbHost . ';port=' . ($dbPort !== '' ? (int) $dbPort : 3306) . ';dbname=' . $dbName . ';charset=utf8mb4';
        $metadataPdo = new PDO($metadataDsn, $dbUser, $dbPassword, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $dbRow = $metadataPdo->query('SELECT DATABASE() AS active_database')->fetch();
        $countStmt = $metadataPdo->prepare('SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema = :schema');
        $countStmt->execute(['schema' => $dbName]);
        $countRow = $countStmt->fetch();

        $storageMetadata['db_metadata_status'] = 'SUCCESS';
        $storageMetadata['active_database'] = isset($dbRow['active_database']) ? (string) $dbRow['active_database'] : null;
        $storageMetadata['table_count'] = isset($countRow['table_count']) ? (int) $countRow['table_count'] : null;
        $storageMetadata['error'] = null;
        $metadataPdo = null;
    } catch (Throwable $throwable) {
        $storageMetadata['db_metadata_status'] = 'FAILED';
        $storageMetadata['error'] = sanitizeMessage($throwable->getMessage(), $dbPassword);
    }
} elseif ($mysqliAvailable && $dbHost !== '' && $dbName !== '' && $dbUser !== '' && $dbPassword !== '') {
    $metadataLink = @mysqli_connect($dbHost, $dbUser, $dbPassword, $dbName, $dbPort !== '' ? (int) $dbPort : 3306);
    if ($metadataLink === false) {
        $storageMetadata['db_metadata_status'] = 'FAILED';
        $storageMetadata['error'] = sanitizeMessage(mysqli_connect_error(), $dbPassword);
    } else {
        $dbResult = @mysqli_query($metadataLink, 'SELECT DATABASE() AS active_database');
        $countResult = @mysqli_query($metadataLink, "SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema = '" . mysqli_real_escape_string($metadataLink, $dbName) . "'");

        if ($dbResult !== false) {
            $dbRow = @mysqli_fetch_assoc($dbResult);
            $storageMetadata['active_database'] = isset($dbRow['active_database']) ? (string) $dbRow['active_database'] : null;
            @mysqli_free_result($dbResult);
        }

        if ($countResult !== false) {
            $countRow = @mysqli_fetch_assoc($countResult);
            $storageMetadata['table_count'] = isset($countRow['table_count']) ? (int) $countRow['table_count'] : null;
            @mysqli_free_result($countResult);
        }

        $storageMetadata['db_metadata_status'] = 'SUCCESS';
        $storageMetadata['error'] = null;
        @mysqli_close($metadataLink);
    }
} else {
    $storageMetadata['db_metadata_status'] = 'SKIPPED';
    $storageMetadata['error'] = 'DB metadata check requires PDO/MySQLi and DB credentials';
}

$storageStatus = [
    'project_root' => describePath($projectRoot),
    'config_dir' => describePath($configDir),
    'runtime_dir' => describePath($runtimeDir),
    'runtime_data_dir' => describePath($runtimeDataDir),
    'config_files' => $storageFileStatus,
    'db_metadata' => $storageMetadata,
];

$reportText = "PRODUCTION DIAGNOSTICS\n======================\n\n";
$reportText .= "HOST\n";
$reportText .= '- /home/web1819 exists: ' . (file_exists('/home/web1819') ? 'yes' : 'no') . "\n";
$reportText .= '- /home/web1819/.env exists: ' . (file_exists('/home/web1819/.env') ? 'yes' : 'no') . "\n";
$reportText .= '- /home/web1819/.env readable: ' . (is_readable('/home/web1819/.env') ? 'yes' : 'no') . "\n";
$reportText .= '- PUBLIC_WEBROOT_PATH: ' . ($env['PUBLIC_WEBROOT_PATH'] ?? 'MISSING') . "\n";
$reportText .= '- PUBLIC_URL: ' . ($env['PUBLIC_URL'] ?? 'MISSING') . "\n";
$reportText .= "\nRUNTIME\n";
$reportText .= '- PHP version: ' . $phpVersion . "\n";
$reportText .= '- PHP SAPI: ' . $phpSapi . "\n";
$reportText .= '- SERVER_SOFTWARE: ' . $serverSoftware . "\n";
$reportText .= '- DOCUMENT_ROOT: ' . $documentRoot . "\n";
$reportText .= '- SCRIPT_FILENAME: ' . $scriptFilename . "\n";
$reportText .= '- REQUEST_URI: ' . $requestUri . "\n";
$reportText .= '- Node: ' . ($runtimeNode ?? 'MISSING') . "\n";
$reportText .= '- npm: ' . ($runtimeNpm ?? 'MISSING') . "\n";
$reportText .= '- npx: ' . ($runtimeNpx ?? 'MISSING') . "\n";
$reportText .= '- Passenger: ' . ($passenger ?? 'MISSING') . "\n\n";
$reportText .= "ENV\n";
foreach ($requiredKeys as $key) {
    $reportText .= '- ' . $key . ': ' . ($envStatus[$key] ?? 'MISSING') . "\n";
}
$reportText .= "\nMYSQL\n";
$reportText .= '- DB_HOST: ' . $dbConfig['host'] . "\n";
$reportText .= '- DB_PORT: ' . $dbConfig['port'] . "\n";
foreach ($mysqlAttempts as $attempt) {
    $reportText .= '- ' . $attempt['host'] . ':' . $attempt['port'] . ' => ' . $attempt['status'];
    if (!empty($attempt['error'])) {
        $reportText .= ' | ERROR: ' . $attempt['error'];
    }
    $reportText .= "\n";
}
$reportText .= "\nWEBROOT\n";
$reportText .= '- expected app root exists: ' . (file_exists($expectedWebroot) ? 'yes' : 'no') . "\n";
$reportText .= '- expected webroot exists: ' . (file_exists($webRootPath) ? 'yes' : 'no') . "\n";
$reportText .= '- setup.php exists: ' . (file_exists($webRootPath . '/setup.php') ? 'yes' : 'no') . "\n";
$reportText .= '- admin.html exists: ' . (file_exists($webRootPath . '/admin.html') ? 'yes' : 'no') . "\n";
$reportText .= "\nSERVER STORAGE\n";
$reportText .= '- config dir exists/readable/writable: '
    . ($storageStatus['config_dir']['exists'] ? 'yes' : 'no') . '/'
    . ($storageStatus['config_dir']['readable'] ? 'yes' : 'no') . '/'
    . ($storageStatus['config_dir']['writable'] ? 'yes' : 'no') . "\n";
$reportText .= '- runtime data dir exists/readable/writable: '
    . ($storageStatus['runtime_data_dir']['exists'] ? 'yes' : 'no') . '/'
    . ($storageStatus['runtime_data_dir']['readable'] ? 'yes' : 'no') . '/'
    . ($storageStatus['runtime_data_dir']['writable'] ? 'yes' : 'no') . "\n";
$reportText .= '- db metadata check: ' . ($storageMetadata['db_metadata_status'] ?? 'UNKNOWN') . "\n";
$reportText .= '- db table count: ' . (isset($storageMetadata['table_count']) ? (string) $storageMetadata['table_count'] : 'n/a') . "\n";

if (isset($_GET['format']) && strtolower((string) $_GET['format']) === 'json') {
    $payload = [
        'result' => 'PRODUCTION_DIAGNOSTICS',
        'host' => [
            '/home/web1819' => file_exists('/home/web1819'),
            '/home/web1819/.env' => file_exists('/home/web1819/.env'),
            '/home/web1819/.env_readable' => is_readable('/home/web1819/.env'),
            'public_webroot' => file_exists($webRootPath),
        ],
        'php' => [
            'version' => $phpVersion,
            'sapi' => $phpSapi,
            'server_software' => $serverSoftware,
            'document_root' => $documentRoot,
            'script_filename' => $scriptFilename,
            'request_uri' => $requestUri,
        ],
        'runtime' => [
            'node' => $runtimeNode ?? 'MISSING',
            'npm' => $runtimeNpm ?? 'MISSING',
            'npx' => $runtimeNpx ?? 'MISSING',
            'passenger' => $passenger ?? 'MISSING',
        ],
        'env' => $envStatus,
        'db_config' => $dbConfig,
        'db_url' => parseDbUrlSummary($dbUrl),
        'mysql' => $mysqlAttempts,
        'webroot' => $webrootStatus,
        'storage' => $storageStatus,
    ];
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), PHP_EOL;
    exit;
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Production Diagnostics</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 2rem; background: #0b1020; color: #e5eefb; }
        h1 { margin-bottom: 1rem; }
        .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        .card { background: #121a2d; border: 1px solid #2a3a5b; border-radius: 10px; padding: 1rem; }
        .ok { color: #7ee787; }
        .warn { color: #ffd966; }
        .bad { color: #ff7b7b; }
        pre { white-space: pre-wrap; background: #0d1529; padding: 1rem; border-radius: 8px; border: 1px solid #2a3a5b; }
        button { background: #2d6cdf; color: white; border: none; border-radius: 6px; padding: 0.6rem 1rem; cursor: pointer; }
        table { border-collapse: collapse; width: 100%; }
        th, td { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid #24324d; }
        code { background: #0d1529; padding: 0.15rem 0.35rem; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Production Diagnostics</h1>
    <p>Secret values are intentionally masked or omitted. Only status flags are shown.</p>
    <button type="button" id="copyButton">Copy report</button>
    <div class="grid">
        <div class="card">
            <h2>Host</h2>
            <table>
                <tr><td>/home/web1819 exists</td><td class="<?= file_exists('/home/web1819') ? 'ok' : 'bad' ?>"><?= file_exists('/home/web1819') ? 'yes' : 'no' ?></td></tr>
                <tr><td>/home/web1819/.env exists</td><td class="<?= file_exists('/home/web1819/.env') ? 'ok' : 'bad' ?>"><?= file_exists('/home/web1819/.env') ? 'yes' : 'no' ?></td></tr>
                <tr><td>/home/web1819/.env readable</td><td class="<?= is_readable('/home/web1819/.env') ? 'ok' : 'bad' ?>"><?= is_readable('/home/web1819/.env') ? 'yes' : 'no' ?></td></tr>
                <tr><td>public webroot exists</td><td class="<?= file_exists($webRootPath) ? 'ok' : 'bad' ?>"><?= file_exists($webRootPath) ? 'yes' : 'no' ?></td></tr>
                <tr><td>expected app root</td><td class="<?= file_exists($expectedWebroot) ? 'ok' : 'bad' ?>"><?= file_exists($expectedWebroot) ? 'yes' : 'no' ?></td></tr>
            </table>
        </div>
        <div class="card">
            <h2>PHP runtime</h2>
            <table>
                <tr><td>PHP version</td><td><code><?= htmlspecialchars((string) $phpVersion, ENT_QUOTES, 'UTF-8') ?></code></td></tr>
                <tr><td>PHP SAPI</td><td><code><?= htmlspecialchars((string) $phpSapi, ENT_QUOTES, 'UTF-8') ?></code></td></tr>
                <tr><td>SERVER_SOFTWARE</td><td><code><?= htmlspecialchars((string) $serverSoftware, ENT_QUOTES, 'UTF-8') ?></code></td></tr>
                <tr><td>DOCUMENT_ROOT</td><td><code><?= htmlspecialchars((string) $documentRoot, ENT_QUOTES, 'UTF-8') ?></code></td></tr>
                <tr><td>REQUEST_URI</td><td><code><?= htmlspecialchars((string) $requestUri, ENT_QUOTES, 'UTF-8') ?></code></td></tr>
            </table>
        </div>
        <div class="card">
            <h2>Runtime availability</h2>
            <table>
                <tr><td>Node</td><td class="<?= $runtimeNode ? 'ok' : 'bad' ?>"><?= $runtimeNode ? 'yes' : 'no' ?></td></tr>
                <tr><td>npm</td><td class="<?= $runtimeNpm ? 'ok' : 'bad' ?>"><?= $runtimeNpm ? 'yes' : 'no' ?></td></tr>
                <tr><td>npx</td><td class="<?= $runtimeNpx ? 'ok' : 'bad' ?>"><?= $runtimeNpx ? 'yes' : 'no' ?></td></tr>
                <tr><td>Passenger</td><td class="<?= $passenger ? 'ok' : 'bad' ?>"><?= $passenger ? 'yes' : 'no' ?></td></tr>
                <tr><td>PDO MySQL</td><td class="<?= $pdoAvailable ? 'ok' : 'bad' ?>"><?= $pdoAvailable ? 'yes' : 'no' ?></td></tr>
                <tr><td>MySQLi</td><td class="<?= $mysqliAvailable ? 'ok' : 'bad' ?>"><?= $mysqliAvailable ? 'yes' : 'no' ?></td></tr>
            </table>
        </div>
    </div>

    <div class="card" style="margin-top: 1rem;">
        <h2>Env summary</h2>
        <table>
        <?php foreach ($requiredKeys as $key): ?>
            <tr>
                <td><?= htmlspecialchars($key, ENT_QUOTES, 'UTF-8') ?></td>
                <td class="<?= $envStatus[$key] === 'SET' ? 'ok' : ($envStatus[$key] === 'EMPTY' ? 'warn' : 'bad') ?>"><?= htmlspecialchars((string) $envStatus[$key], ENT_QUOTES, 'UTF-8') ?></td>
            </tr>
        <?php endforeach; ?>
        </table>
    </div>

    <div class="card" style="margin-top: 1rem;">
        <h2>Database URL summary</h2>
        <?php $dbSummary = parseDbUrlSummary($dbUrl); ?>
        <table>
            <tr><td>present</td><td><?= $dbSummary['present'] ? 'yes' : 'no' ?></td></tr>
            <tr><td>scheme</td><td><?= htmlspecialchars((string) ($dbSummary['scheme'] ?? 'n/a'), ENT_QUOTES, 'UTF-8') ?></td></tr>
            <tr><td>host</td><td><?= htmlspecialchars((string) ($dbSummary['host'] ?? 'n/a'), ENT_QUOTES, 'UTF-8') ?></td></tr>
            <tr><td>port</td><td><?= htmlspecialchars((string) ($dbSummary['port'] ?? 'n/a'), ENT_QUOTES, 'UTF-8') ?></td></tr>
            <tr><td>database</td><td><?= htmlspecialchars((string) ($dbSummary['database'] ?? 'n/a'), ENT_QUOTES, 'UTF-8') ?></td></tr>
            <tr><td>username</td><td><?= htmlspecialchars((string) ($dbSummary['username'] ?? 'n/a'), ENT_QUOTES, 'UTF-8') ?></td></tr>
        </table>
    </div>

    <div class="card" style="margin-top: 1rem;">
        <h2>MySQL checks</h2>
        <table>
        <?php foreach ($mysqlAttempts as $attempt): ?>
            <tr>
                <td><?= htmlspecialchars($attempt['host'], ENT_QUOTES, 'UTF-8') ?>:<?= htmlspecialchars((string) $attempt['port'], ENT_QUOTES, 'UTF-8') ?></td>
                <td class="<?= $attempt['status'] === 'SUCCESS' ? 'ok' : ($attempt['status'] === 'FAILED' ? 'bad' : 'warn') ?>"><?= htmlspecialchars((string) $attempt['status'], ENT_QUOTES, 'UTF-8') ?></td>
                <td><?= htmlspecialchars((string) ($attempt['error'] ?? 'n/a'), ENT_QUOTES, 'UTF-8') ?></td>
            </tr>
        <?php endforeach; ?>
        </table>
    </div>

    <div class="card" style="margin-top: 1rem;">
        <h2>Webroot checks</h2>
        <table>
            <tr><td>expected app root</td><td class="<?= file_exists($expectedWebroot) ? 'ok' : 'bad' ?>"><?= file_exists($expectedWebroot) ? 'yes' : 'no' ?></td></tr>
            <tr><td>expected webroot</td><td class="<?= file_exists($webRootPath) ? 'ok' : 'bad' ?>"><?= file_exists($webRootPath) ? 'yes' : 'no' ?></td></tr>
            <tr><td>setup.php</td><td class="<?= file_exists($webRootPath . '/setup.php') ? 'ok' : 'bad' ?>"><?= file_exists($webRootPath . '/setup.php') ? 'yes' : 'no' ?></td></tr>
            <tr><td>admin.html</td><td class="<?= file_exists($webRootPath . '/admin.html') ? 'ok' : 'bad' ?>"><?= file_exists($webRootPath . '/admin.html') ? 'yes' : 'no' ?></td></tr>
        </table>
    </div>

    <pre id="report" style="margin-top:1rem;"><?= htmlspecialchars($reportText, ENT_QUOTES, 'UTF-8') ?></pre>

    <script>
        const copyButton = document.getElementById('copyButton');
        const report = document.getElementById('report');
        copyButton.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(report.textContent || '');
                copyButton.textContent = 'Copied';
                setTimeout(() => copyButton.textContent = 'Copy report', 1200);
            } catch (error) {
                copyButton.textContent = 'Copy failed';
                setTimeout(() => copyButton.textContent = 'Copy report', 1200);
            }
        });
    </script>
</body>
</html>

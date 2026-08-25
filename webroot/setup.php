<?php
require_once dirname(__DIR__) . '/core/php/bootstrap.php';

function readEnvFile($filePath) {
    if (!is_string($filePath) || $filePath === '' || !is_file($filePath)) {
        return [];
    }

    $values = [];
    $lines = @file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return [];
    }

    foreach ($lines as $line) {
        $trimmed = trim($line);
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
        if ((strlen($cleanValue) >= 2) && (($cleanValue[0] === '"' && $cleanValue[strlen($cleanValue) - 1] === '"') || ($cleanValue[0] === '\'' && $cleanValue[strlen($cleanValue) - 1] === '\''))) {
            $cleanValue = substr($cleanValue, 1, -1);
        }

        $values[$key] = $cleanValue;
    }

    return $values;
}

function writeEnvFile($filePath, array $values) {
    if (!is_string($filePath) || $filePath === '') {
        return false;
    }

    $directory = dirname($filePath);
    if (!is_dir($directory)) {
        return false;
    }

    $lines = [];
    foreach ($values as $key => $value) {
        $normalizedKey = trim((string) $key);
        if ($normalizedKey === '') {
            continue;
        }

        $escapedValue = str_replace('\\', '\\\\', (string) $value);
        $escapedValue = str_replace('"', '\\"', $escapedValue);
        $lines[] = $normalizedKey . '="' . $escapedValue . '"';
    }

    $content = implode(PHP_EOL, $lines);
    if ($content !== '') {
        $content .= PHP_EOL;
    }

    return @file_put_contents($filePath, $content, LOCK_EX) !== false;
}

function writeSetupLog($message, array $context = []) {
    $projectRoot = dirname(__DIR__);
    $logDir = $projectRoot . '/server/runtime';
    if (!is_dir($logDir) && !@mkdir($logDir, 0777, true) && !is_dir($logDir)) {
        return false;
    }

    $payload = [
        'timestamp' => gmdate('c'),
        'message' => (string) $message,
    ];
    if (!empty($context)) {
        $payload['context'] = $context;
    }

    $line = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . PHP_EOL;
    return @file_put_contents($logDir . '/setup-debug.log', $line, FILE_APPEND | LOCK_EX) !== false;
}

function writeJsonFile($filePath, array $content) {
    if (!is_string($filePath) || $filePath === '') {
        return false;
    }

    $directory = dirname($filePath);
    if (!is_dir($directory) && !@mkdir($directory, 0777, true) && !is_dir($directory)) {
        return false;
    }

    $json = json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        return false;
    }

    return @file_put_contents($filePath, $json . PHP_EOL, LOCK_EX) !== false;
}

function resolveRuntimeEnvFile() {
    $projectRoot = dirname(__DIR__);
    $candidateRoots = [];

    foreach ([
        $projectRoot,
        dirname($projectRoot),
        dirname(dirname($projectRoot)),
        getenv('NEUTRAL_APP_ROOT'),
        getenv('NEUTRAL_INSTALL_ROOT'),
        getenv('APP_ROOT'),
        getenv('REAL_APP_ROOT'),
        getenv('INSTALL_ROOT'),
        getenv('DOCUMENT_ROOT'),
        '/home/web1819',
        '/home/web1819/public_html',
        '/home/web1819/public_html/index/app/neutral',
        '/var/www/html',
        '/var/www',
        '/srv/www',
    ] as $candidate) {
        if (!is_string($candidate) || trim($candidate) === '') {
            continue;
        }
        $candidateRoots[] = rtrim($candidate, "/\\");
    }

    $seen = [];
    foreach ($candidateRoots as $root) {
        if ($root === '' || isset($seen[$root])) {
            continue;
        }
        $seen[$root] = true;

        foreach ([
            $root,
            $root . '/.env',
            $root . '/.env.local',
            $root . '/.env.production',
            $root . '/.env.development',
            $root . '/index/app/neutral/.env',
            $root . '/index/app/neutral/webroot/../.env',
        ] as $candidate) {
            if (is_string($candidate) && trim($candidate) !== '' && is_file($candidate)) {
                return $candidate;
            }
        }
    }

    foreach ([
        getenv('NEUTRAL_ENV_FILE'),
        '/home/web1819/.env',
        '/home/web1819/public_html/.env',
        '/home/web1819/public_html/index/app/neutral/.env',
        '/var/www/html/.env',
        '/var/www/.env'
    ] as $candidate) {
        if (is_string($candidate) && trim($candidate) !== '' && is_file($candidate)) {
            return $candidate;
        }
    }

    return $projectRoot . '/.env';
}

function isLocalHostname($host) {
    $normalized = strtolower(trim((string) $host));
    $normalized = preg_replace('/^\[(.*)\]$/', '$1', $normalized);
    return in_array($normalized, ['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'], true);
}

function resolveRuntimeServerUrl(array $env, $fallback = 'http://localhost') {
    $requestHost = trim((string) ($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
    $forwardedProto = trim((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? $_SERVER['REQUEST_SCHEME'] ?? ''));
    $scheme = '';
    if ($forwardedProto !== '') {
        $scheme = strtolower(strtok($forwardedProto, ','));
    }
    if ($scheme === '') {
        $isSecure = (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off') || ((isset($_SERVER['SERVER_PORT']) && (string) $_SERVER['SERVER_PORT']) === '443');
        $scheme = $isSecure ? 'https' : 'http';
    }

    $candidate = trim((string) ($env['SERVER_URL'] ?? $env['PUBLIC_URL'] ?? $env['BASE_URL'] ?? ''));
    if ($candidate !== '') {
        $normalizedCandidate = rtrim($candidate, '/');
        $parsed = parse_url($normalizedCandidate);
        if (is_array($parsed) && !empty($parsed['host'])) {
            $candidateHost = trim((string) $parsed['host']);
            if (!isLocalHostname($candidateHost) && !empty($requestHost) && !isLocalHostname($requestHost) && strtolower($candidateHost) === strtolower(preg_replace('/:\d+$/', '', $requestHost))) {
                $normalizedCandidate = $scheme . '://' . preg_replace('/:\d+$/', '', $requestHost);
            } elseif (!empty($requestHost) && !isLocalHostname($requestHost) && !empty($parsed['port']) && (string) $parsed['port'] === '3000') {
                $normalizedCandidate = $scheme . '://' . preg_replace('/:\d+$/', '', $requestHost);
            }
        }
        return $normalizedCandidate;
    }

    $host = trim((string) $requestHost);
    if ($host === '') {
        $host = 'localhost';
    }

    $host = preg_replace('/^0\.0\.0\.0$/', 'localhost', $host);
    $host = preg_replace('/^\[::1\]$/', 'localhost', $host);

    $runtimeHost = trim((string) ($env['HOST'] ?? ''));
    if ($runtimeHost !== '' && $runtimeHost !== '0.0.0.0' && $runtimeHost !== '::' && !isLocalHostname($runtimeHost) && !isLocalHostname($host)) {
        $host = $runtimeHost;
    }

    $port = trim((string) ($env['PORT'] ?? ''));
    $hostWithoutPort = preg_replace('/:\d+$/', '', $host);
    $shouldSkipPort = $port !== '' && $port !== '80' && $port !== '443' && !preg_match('/:\d+$/', $host) && !(!isLocalHostname($hostWithoutPort) && $port === '3000' && !isLocalHostname($requestHost));
    if ($shouldSkipPort) {
        $host = $host . ':' . $port;
    }

    return rtrim($scheme . '://' . $host, '/');
}

function buildDatabaseUrlFromEnv(array $env) {
    $dbType = strtolower(trim((string) ($env['DB_TYPE'] ?? $env['MYSQL_TYPE'] ?? 'mysql')));
    if ($dbType === '') {
        $dbType = 'mysql';
    }

    $configuredDbUrl = trim((string) ($env['DB_URL'] ?? $env['DATABASE_URL'] ?? ''));
    if ($configuredDbUrl !== '') {
        return $configuredDbUrl;
    }

    $dbHost = trim((string) ($env['DB_HOST'] ?? $env['MYSQL_HOST'] ?? '127.0.0.1'));
    $dbPort = trim((string) ($env['DB_PORT'] ?? $env['MYSQL_PORT'] ?? '3306'));
    $dbName = trim((string) ($env['DB_NAME'] ?? $env['MYSQL_DATABASE'] ?? ''));
    $dbUser = trim((string) ($env['DB_USER'] ?? $env['MYSQL_USER'] ?? ''));

    $hostPart = $dbHost !== '' ? $dbHost : '127.0.0.1';
    $portPart = $dbPort !== '' ? ':' . $dbPort : '';
    $namePart = $dbName !== '' ? '/' . $dbName : '';

    if ($dbUser !== '') {
        return $dbType . '://' . $dbUser . '@' . $hostPart . $portPart . $namePart;
    }

    return $dbType . '://' . $hostPart . $portPart . $namePart;
}

$envFile = resolveRuntimeEnvFile();
$env = readEnvFile($envFile);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $post = $_POST;

    $serverUrl = trim((string) ($post['serverUrl'] ?? $env['SERVER_URL'] ?? $env['PUBLIC_URL'] ?? $env['BASE_URL'] ?? resolveRuntimeServerUrl($env, 'http://localhost')));
    if ($serverUrl !== '') {
        $env['SERVER_URL'] = $serverUrl;
        $env['PUBLIC_URL'] = $serverUrl;
        $env['BASE_URL'] = $serverUrl;
    }

    $apiBase = trim((string) ($post['apiBase'] ?? $env['API_BASE'] ?? '/api')) ?: '/api';
    $env['API_BASE'] = $apiBase;
    $env['APP_ID'] = trim((string) ($post['appId'] ?? $env['APP_ID'] ?? 'neutral-app')) ?: 'neutral-app';
    $env['APP_NAME'] = trim((string) ($post['appName'] ?? $env['APP_NAME'] ?? 'Neutral Platform')) ?: 'Neutral Platform';
    $env['HOST'] = trim((string) ($post['host'] ?? $env['HOST'] ?? '0.0.0.0')) ?: '0.0.0.0';
    $env['PORT'] = trim((string) ($post['port'] ?? $env['PORT'] ?? '3000')) ?: '3000';
    $env['DB_TYPE'] = trim((string) ($post['dbType'] ?? $env['DB_TYPE'] ?? 'mysql')) ?: ($env['DB_TYPE'] ?? 'mysql');
    $env['DB_HOST'] = trim((string) ($post['dbHost'] ?? $env['DB_HOST'] ?? '127.0.0.1')) ?: ($env['DB_HOST'] ?? '127.0.0.1');
    $env['DB_PORT'] = trim((string) ($post['dbPort'] ?? $env['DB_PORT'] ?? '3306')) ?: ($env['DB_PORT'] ?? '3306');
    $env['DB_NAME'] = trim((string) ($post['dbName'] ?? $env['DB_NAME'] ?? ''));
    $env['DB_USER'] = trim((string) ($post['dbUser'] ?? $env['DB_USER'] ?? ''));
    $dbPassword = trim((string) ($post['dbPassword'] ?? ''));
    if ($dbPassword !== '') {
        $env['DB_PASSWORD'] = $dbPassword;
    }
    $dbUrl = trim((string) ($post['dbUrl'] ?? $env['DB_URL'] ?? ''));
    if ($dbUrl !== '') {
        $env['DB_URL'] = $dbUrl;
        $env['DATABASE_URL'] = $dbUrl;
    }

    if (!writeEnvFile($envFile, $env)) {
        writeSetupLog('setup.php writeEnvFile failed', [
            'envFile' => $envFile,
            'serverUrl' => $serverUrl,
            'apiBase' => $apiBase,
            'dbHost' => $env['DB_HOST'] ?? null,
            'dbName' => $env['DB_NAME'] ?? null,
            'dbUser' => $env['DB_USER'] ?? null,
        ]);
    }
}

$env = readEnvFile($envFile);
$runtime = neutral_bootstrap([
    'project_root' => dirname(__DIR__),
    'register_error_handler' => false,
]);
$runtimeConfig = $runtime->config();
$runtimeDatabase = $runtimeConfig->database();
$setupStateStore = new \Neutral\Core\SetupStateStore(\Neutral\Core\SetupStateStore::defaultStateFile($runtime->projectRoot()));
$prerequisiteChecker = new \Neutral\Core\PrerequisiteChecker($runtimeConfig, $runtime->database());
$setupInstaller = new \Neutral\Core\SetupInstaller($runtime, $setupStateStore, $prerequisiteChecker);
$setupSnapshot = $setupInstaller->status();

$dbType = $runtimeDatabase['type'];
$dbHost = $runtimeDatabase['host'];
$dbPort = $runtimeDatabase['port'];
$dbName = $runtimeDatabase['name'];
$dbUser = $runtimeDatabase['user'];
$dbPassword = $runtimeDatabase['password'];
$serverUrl = resolveRuntimeServerUrl($env);
$dbUrl = $runtimeDatabase['url'] !== '' ? $runtimeDatabase['url'] : buildDatabaseUrlFromEnv($env);
$setupReadyFromEnv = in_array((string) ($setupSnapshot['status'] ?? 'SETUP_REQUIRED'), ['READY_TO_INSTALL', 'ACTIVE'], true);
$setupChecks = is_array($setupSnapshot['checks'] ?? null) ? $setupSnapshot['checks'] : [];
$installationActive = (bool) (($setupSnapshot['installation']['active'] ?? false) === true);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['install_now'])) {
    $result = $setupInstaller->install();
    $isActive = strtoupper((string) ($result['status'] ?? '')) === 'ACTIVE' && (bool) (($result['installation']['active'] ?? false) === true);
    if (!$isActive) {
        http_response_code(409);
        echo '<!doctype html><html><body><h1>Install blocked</h1><p>Installation prerequisites are not yet satisfied. Check setup status details and retry.</p></body></html>';
        exit;
    }

    echo '<!doctype html><html><head><meta charset="utf-8" /><meta http-equiv="refresh" content="1;url=admin.html" /></head><body style="font-family:Arial,sans-serif;background:#111827;color:#e5e7eb;padding:32px;"><div style="max-width:720px;margin:0 auto;background:#1f2937;border-radius:12px;padding:28px;"><h1>Installation complete</h1><p>Using the values from the server .env file and prerequisite checks. Redirecting to the admin panel…</p></div></body></html>';
    exit;
}
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Setup</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background: #111827;
        color: #e5e7eb;
        margin: 0;
        padding: 32px;
      }
      .panel {
        max-width: 920px;
        margin: 0 auto;
        background: #1f2937;
        border-radius: 12px;
        padding: 28px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
      }
      .row {
        display: grid;
        grid-template-columns: 180px 1fr;
        gap: 12px;
        align-items: center;
        margin: 12px 0;
      }
      .section {
        margin-top: 22px;
        padding-top: 18px;
        border-top: 1px solid rgba(148, 163, 184, 0.3);
      }
      .section h2 {
        margin: 0 0 12px;
        font-size: 1.1rem;
      }
      label {
        font-weight: 600;
      }
      input {
        width: 100%;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid #374151;
        background: #0f172a;
        color: #f8fafc;
        box-sizing: border-box;
      }
      input[readonly] {
        opacity: 0.9;
      }
      .actions {
        margin-top: 20px;
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: flex-end;
      }
      button {
        background: #2563eb;
        color: #fff;
        border: 0;
        border-radius: 8px;
        padding: 10px 18px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
      }
      button.secondary {
        background: #374151;
      }
      button.danger {
        background: #b91c1c;
      }
      button:hover {
        filter: brightness(1.06);
      }
      .status {
        margin-top: 16px;
        padding: 10px 12px;
        border-radius: 8px;
        background: #0f172a;
        border: 1px solid #374151;
        color: #e2e8f0;
      }
      .status.success {
        background: rgba(34, 197, 94, 0.12);
        border-color: rgba(34, 197, 94, 0.35);
        color: #dcfce7;
      }
      .status.error {
        background: rgba(239, 68, 68, 0.12);
        border-color: rgba(239, 68, 68, 0.35);
        color: #fee2e2;
      }
      .hint {
        color: #cbd5e1;
        font-size: 0.9rem;
        margin-top: 18px;
      }
      .small {
        font-size: 0.85rem;
        color: #cbd5e1;
      }
      .check-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 10px;
        margin-top: 14px;
      }
      .check-item {
        border: 1px solid #374151;
        border-radius: 10px;
        background: #0f172a;
        padding: 10px 12px;
      }
      .check-title {
        font-size: 0.9rem;
        font-weight: 600;
      }
      .check-ok {
        color: #86efac;
      }
      .check-fail {
        color: #fda4af;
      }
      .check-meta {
        margin-top: 6px;
        font-size: 0.8rem;
        color: #cbd5e1;
        white-space: pre-wrap;
        word-break: break-word;
      }
    </style>
  </head>
  <body>
    <div class="panel" data-setup-ready="<?= $setupReadyFromEnv ? '1' : '0' ?>">
      <h1><?= $installationActive ? 'Installation active' : ($setupReadyFromEnv ? 'Installation ready' : 'Platform setup') ?></h1>
      <p class="small">Setup state: <?= htmlspecialchars((string) ($setupSnapshot['status'] ?? 'SETUP_REQUIRED'), ENT_QUOTES, 'UTF-8') ?></p>

      <div class="section">
        <h2>System checks</h2>
        <div class="check-grid">
          <?php foreach ($setupChecks as $checkKey => $checkValue): ?>
            <?php
              $checkOk = (bool) (($checkValue['ok'] ?? false) === true);
              $checkMeta = $checkValue;
              unset($checkMeta['ok']);
            ?>
            <div class="check-item">
              <div class="check-title <?= $checkOk ? 'check-ok' : 'check-fail' ?>">
                <?= $checkOk ? 'PASS' : 'FAIL' ?> — <?= htmlspecialchars((string) $checkKey, ENT_QUOTES, 'UTF-8') ?>
              </div>
              <div class="check-meta"><?= htmlspecialchars((string) json_encode($checkMeta, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), ENT_QUOTES, 'UTF-8') ?></div>
            </div>
          <?php endforeach; ?>
        </div>
      </div>

      <?php if ($setupReadyFromEnv): ?>
        <p class="small">Using the live server configuration from the installed .env file. No manual setup fields are required.</p>

        <input id="envAppId" type="hidden" value="<?= htmlspecialchars((string) ($env['APP_ID'] ?? $env['DEFAULT_APP_ID'] ?? 'neutral-app'), ENT_QUOTES, 'UTF-8') ?>" />
        <input id="envAppName" type="hidden" value="<?= htmlspecialchars((string) ($env['APP_NAME'] ?? 'Neutral Platform'), ENT_QUOTES, 'UTF-8') ?>" />
        <input id="envServerUrl" type="hidden" value="<?= htmlspecialchars((string) ($serverUrl), ENT_QUOTES, 'UTF-8') ?>" />
        <input id="envApiBase" type="hidden" value="<?= htmlspecialchars((string) ($env['API_BASE'] ?? '/api'), ENT_QUOTES, 'UTF-8') ?>" />
        <input id="envDbType" type="hidden" value="<?= htmlspecialchars((string) $dbType, ENT_QUOTES, 'UTF-8') ?>" />
        <input id="envDbHost" type="hidden" value="<?= htmlspecialchars((string) $dbHost, ENT_QUOTES, 'UTF-8') ?>" />
        <input id="envDbPort" type="hidden" value="<?= htmlspecialchars((string) $dbPort, ENT_QUOTES, 'UTF-8') ?>" />
        <input id="envDbName" type="hidden" value="<?= htmlspecialchars((string) $dbName, ENT_QUOTES, 'UTF-8') ?>" />
        <input id="envDbUser" type="hidden" value="<?= htmlspecialchars((string) $dbUser, ENT_QUOTES, 'UTF-8') ?>" />
        <input id="envDbUrl" type="hidden" value="<?= htmlspecialchars((string) $dbUrl, ENT_QUOTES, 'UTF-8') ?>" />

        <div class="actions">
          <?php if (!$installationActive): ?>
            <button type="button" id="installNowBtn">Install now</button>
          <?php else: ?>
            <a href="admin.html" style="display:inline-block;background:#2563eb;color:#fff;border-radius:8px;padding:10px 18px;font-size:1rem;font-weight:600;text-decoration:none;">Open admin</a>
          <?php endif; ?>
        </div>
        <div id="setupStatus" class="status" aria-live="polite">
          Setup status: <?= $installationActive ? 'installation is already active.' : 'ready to install from the server .env configuration.' ?>
        </div>
      <?php else: ?>
        <form id="setupForm" method="post" action="<?= htmlspecialchars($_SERVER['PHP_SELF'] ?? 'setup.php', ENT_QUOTES, 'UTF-8') ?>">
          <div class="row">
            <label for="appId">Application ID</label>
            <input id="appId" name="appId" type="text" value="neutral-app" />
          </div>
          <div class="row">
            <label for="appName">Application name</label>
            <input id="appName" name="appName" type="text" value="Neutral Platform" />
          </div>
          <div class="row">
            <label for="serverUrl">Server URL</label>
            <input id="serverUrl" name="serverUrl" type="text" value="<?= htmlspecialchars((string) $serverUrl, ENT_QUOTES, 'UTF-8') ?>" />
          </div>
          <div class="row">
            <label for="apiBase">API base</label>
            <input id="apiBase" name="apiBase" type="text" value="/api" />
          </div>
          <div class="row">
            <label for="dbType">Database type</label>
            <input id="dbType" name="dbType" type="text" value="<?= htmlspecialchars((string) $dbType, ENT_QUOTES, 'UTF-8') ?>" readonly />
          </div>
          <div class="row">
            <label for="dbHost">Database host</label>
            <input id="dbHost" name="dbHost" type="text" value="<?= htmlspecialchars((string) $dbHost, ENT_QUOTES, 'UTF-8') ?>" readonly />
          </div>
          <div class="row">
            <label for="dbPort">Database port</label>
            <input id="dbPort" name="dbPort" type="text" value="<?= htmlspecialchars((string) $dbPort, ENT_QUOTES, 'UTF-8') ?>" readonly />
          </div>
          <div class="row">
            <label for="dbName">Database name</label>
            <input id="dbName" name="dbName" type="text" value="<?= htmlspecialchars((string) $dbName, ENT_QUOTES, 'UTF-8') ?>" readonly />
          </div>
          <div class="row">
            <label for="dbUser">Database user</label>
            <input id="dbUser" name="dbUser" type="text" value="<?= htmlspecialchars((string) $dbUser, ENT_QUOTES, 'UTF-8') ?>" readonly />
          </div>
          <div class="row">
            <label for="dbUrl">Database URL</label>
            <input id="dbUrl" name="dbUrl" type="text" value="<?= htmlspecialchars((string) $dbUrl, ENT_QUOTES, 'UTF-8') ?>" readonly />
          </div>
          <div class="row">
            <label for="dbPassword">Database password</label>
            <input id="dbPassword" name="dbPassword" type="password" value="" placeholder="Not prefilled for security" />
          </div>

          <div class="actions">
            <button type="submit">Save configuration</button>
            <button type="button" class="secondary" id="testServerBtn">Test server</button>
            <button type="button" class="secondary" id="testDatabaseBtn">Test database</button>
            <button type="button" id="installNowBtn">Install now</button>
            <button type="button" id="activateSystemBtn">Activate system</button>
          </div>
        </form>

        <div class="section">
          <h2>Developer account setup</h2>

          <div class="row">
            <label for="developerUsername">Username</label>
            <input id="developerUsername" type="text" value="Developer" readonly />
          </div>
          <div class="row">
            <label for="developerPassword">Password</label>
            <input id="developerPassword" type="password" placeholder="Set the initial developer password" />
          </div>
          <div class="row">
            <label for="developerPasswordConfirm">Repeat password</label>
            <input id="developerPasswordConfirm" type="password" placeholder="Repeat password" />
          </div>
          <div class="actions">
            <button type="button" class="secondary" id="setupDeveloperBtn">Create local developer account</button>
          </div>
          <div class="small">This developer account is created once and stored locally in the browser for the first system login.</div>
        </div>

        <div class="hint">Sensitive values are intentionally not prefilled for security. The password is kept only in the protected server environment.</div>
      <?php endif; ?>
    </div>
    <script>
      (() => {
        const setupReady = document.querySelector('[data-setup-ready]')?.getAttribute('data-setup-ready') === '1';
        const statusEl = document.getElementById('setupStatus');
        const form = document.getElementById('setupForm');

        const getHiddenValue = (id, fallback = '') => {
          const element = document.getElementById(id);
          const value = (element && element.value !== undefined ? element.value : '') || '';
          return value.trim() || fallback;
        };

        const getRuntimeOrigin = () => {
          const origin = window.location && window.location.origin && window.location.origin !== 'null'
            ? window.location.origin
            : 'http://localhost';
          return origin.replace(/\/+$/, '');
        };

        const serverUrlInput = document.getElementById('serverUrl');
        const apiBaseInput = document.getElementById('apiBase');
        if (serverUrlInput && (!serverUrlInput.value || /^https?:\/\/127\.0\.0\.1(?::3000)?$/.test(serverUrlInput.value) || /^https?:\/\/localhost(?::3000)?$/.test(serverUrlInput.value))) {
          serverUrlInput.value = getRuntimeOrigin();
        }
        if (apiBaseInput && (!apiBaseInput.value || apiBaseInput.value === '/')) {
          apiBaseInput.value = '/api';
        }

        const setStatus = (message, kind = 'info') => {
          if (!statusEl) {
            return;
          }
          statusEl.textContent = message;
          statusEl.className = 'status' + (kind === 'success' ? ' success' : kind === 'error' ? ' error' : '');
        };

        const canReachRuntimeApi = async (timeoutMs = 1500) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            const response = await fetch(buildApiUrl('/status'), {
                method: 'GET',
                headers: { Accept: 'application/json' },
                cache: 'no-store',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response && response.ok;
          } catch (error) {
            return false;
          }
        };

        const submitPhpSetupForm = () => {
          const targetForm = document.getElementById('setupForm');
          if (targetForm) {
            targetForm.submit();
            return true;
          }
          return false;
        };

        const sha256 = async (value) => {
          const data = new TextEncoder().encode(String(value || ''));
          const digest = await crypto.subtle.digest('SHA-256', data);
          return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
        };

        const getConfiguredServerUrl = () => {
          const configured = setupReady
            ? getHiddenValue('envServerUrl', getRuntimeOrigin())
            : (document.getElementById('serverUrl')?.value || '').trim();
          return configured || getRuntimeOrigin();
        };

        const getConfiguredApiBase = () => {
          const configured = setupReady
            ? getHiddenValue('envApiBase', '/api')
            : (document.getElementById('apiBase')?.value || '').trim();
          if (!configured) {
            return '/api';
          }
          if (/^https?:\/\//i.test(configured)) {
            return configured.replace(/\/+$/, '');
          }
          return configured.startsWith('/') ? configured : `/${configured}`;
        };

        const buildApiUrl = (endpoint) => {
          const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
          const base = getConfiguredApiBase();
          const baseUrl = /^https?:\/\//i.test(base)
            ? base.replace(/\/+$/, '')
            : `${getConfiguredServerUrl().replace(/\/+$/, '')}${base.startsWith('/') ? base : `/${base}`}`;
          return `${baseUrl.replace(/\/+$/, '')}${normalizedEndpoint}`;
        };

        const getSetupEnvironmentConfig = () => ({
          appId: setupReady ? getHiddenValue('envAppId', 'neutral-app') : (document.getElementById('appId')?.value || 'neutral-app'),
          appName: setupReady ? getHiddenValue('envAppName', 'Neutral Platform') : (document.getElementById('appName')?.value || 'Neutral Platform'),
          serverUrl: setupReady ? getHiddenValue('envServerUrl', getRuntimeOrigin()) : (document.getElementById('serverUrl')?.value || getRuntimeOrigin()),
          apiBase: setupReady ? getHiddenValue('envApiBase', '/api') : (document.getElementById('apiBase')?.value || '/api'),
          host: window.location && window.location.hostname ? window.location.hostname : '0.0.0.0',
          port: window.location && window.location.port ? window.location.port : '3000',
          database: {
            type: setupReady ? getHiddenValue('envDbType', 'mysql') : (document.getElementById('dbType')?.value || 'mysql'),
            host: setupReady ? getHiddenValue('envDbHost', '127.0.0.1') : (document.getElementById('dbHost')?.value || '127.0.0.1'),
            port: setupReady ? getHiddenValue('envDbPort', '3306') : (document.getElementById('dbPort')?.value || '3306'),
            name: setupReady ? getHiddenValue('envDbName', '') : (document.getElementById('dbName')?.value || ''),
            username: setupReady ? getHiddenValue('envDbUser', '') : (document.getElementById('dbUser')?.value || '')
          },
          dbUrl: setupReady ? getHiddenValue('envDbUrl', '') : (document.getElementById('dbUrl')?.value || '')
        });

        const installSetup = async ({ silent = false } = {}) => {
          const config = getSetupEnvironmentConfig();
          const payload = {
            appId: config.appId,
            appName: config.appName,
            serverUrl: config.serverUrl,
            apiBase: config.apiBase,
            host: config.host,
            port: config.port,
            configuration: {
              serverUrl: config.serverUrl,
              apiBase: config.apiBase,
              database: {
                type: config.database.type,
                host: config.database.host,
                port: config.database.port,
                name: config.database.name,
                username: config.database.username
              }
            },
            databaseState: {
              configured: true,
              type: config.database.type,
              host: config.database.host,
              port: config.database.port,
              name: config.database.name,
              username: config.database.username
            },
            bootstrapState: {
              configured: true,
              enabled: true,
              username: 'Developer',
              displayId: 'USR-000001',
              role: 'developer'
            },
            installation: {
              active: true,
              state: 'ACTIVE'
            }
          };

          if (!silent && statusEl) {
            setStatus('Installing configuration and activating system…');
          }

          const saveResponse = await fetch(buildApiUrl('/setup'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const saveResult = await saveResponse.json().catch(() => ({}));
          if (!saveResponse.ok) {
            throw new Error((saveResult && saveResult.message) || 'Setup could not be saved.');
          }

          const activateResponse = await fetch(buildApiUrl('/setup/activate'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentStep: 'runtime', message: 'Installation activated.' })
          });
          const activateResult = await activateResponse.json().catch(() => ({}));
          if (!activateResponse.ok) {
            throw new Error((activateResult && activateResult.message) || 'Activation failed.');
          }

          return { ok: true, message: 'Installation completed successfully.' };
        };

        const saveLocalDeveloperAccount = async (username, password) => {
          if (!window.LocalAuth || typeof window.LocalAuth.setupDeveloper !== 'function') {
            const passwordHash = await sha256(password);
            const payload = {
              username: username || 'Developer',
              passwordHash,
              setupComplete: true,
              source: 'local-offline',
              updatedAt: new Date().toISOString()
            };
            localStorage.setItem('neutral.local.auth.v1', JSON.stringify(payload));
            if (window.ConfigManager && typeof window.ConfigManager.get === 'function') {
              const current = window.ConfigManager.get('bootstrap', {}) || {};
              window.ConfigManager.set('bootstrap', {
                ...current,
                enabled: true,
                developerUsername: payload.username,
                developerDisplayId: 'USR-000001',
                developerPasswordHash: passwordHash,
                passwordRequired: true,
                passwordSource: 'local-offline',
                hasDeveloperAccount: true
              });
            }
            return { ok: true, message: 'Local developer account created.' };
          }
          return window.LocalAuth.setupDeveloper({ username, password });
        };

        if (form) {
          form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const runtimeApiReady = await canReachRuntimeApi();
            if (!runtimeApiReady) {
              setStatus('Shared-host runtime is not available; using the server-side PHP setup flow instead.', 'info');
              submitPhpSetupForm();
              return;
            }

            const payload = {
              appId: document.getElementById('appId').value || 'neutral-app',
              appName: document.getElementById('appName').value || 'Neutral Platform',
              configuration: {
                serverUrl: document.getElementById('serverUrl').value || getRuntimeOrigin(),
                apiBase: document.getElementById('apiBase').value || '/api',
                database: {
                  type: document.getElementById('dbType').value || 'mysql',
                  host: document.getElementById('dbHost').value || '127.0.0.1',
                  port: document.getElementById('dbPort').value || '3306',
                  name: document.getElementById('dbName').value || '',
                  username: document.getElementById('dbUser').value || '',
                  password: document.getElementById('dbPassword').value || ''
                }
              },
              serverState: {
                configured: true,
                url: document.getElementById('serverUrl').value || getRuntimeOrigin(),
                apiBase: document.getElementById('apiBase').value || '/api',
                status: 'CONFIGURATION_REQUIRED'
              },
              databaseState: {
                configured: true,
                type: document.getElementById('dbType').value || 'mysql',
                host: document.getElementById('dbHost').value || '127.0.0.1',
                port: document.getElementById('dbPort').value || '3306',
                name: document.getElementById('dbName').value || '',
                username: document.getElementById('dbUser').value || '',
                password: document.getElementById('dbPassword').value || '',
                status: 'CONFIGURATION_REQUIRED'
              },
              bootstrapState: {
                configured: true,
                enabled: true,
                username: 'Developer',
                displayId: 'USR-000001',
                role: 'developer'
              }
            };

            try {
              const response = await fetch(buildApiUrl('/setup'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              const result = await response.json().catch(() => ({}));
              if (!response.ok) {
                throw new Error((result && result.message) || 'Setup could not be saved.');
              }
              setStatus('Setup saved successfully.', 'success');
            } catch (error) {
              setStatus('Node runtime is unavailable on this host; falling back to the PHP setup flow.', 'info');
              submitPhpSetupForm();
            }
          });
        }

        const testServerBtn = document.getElementById('testServerBtn');
        if (testServerBtn) {
          testServerBtn.addEventListener('click', async () => {
            const runtimeApiReady = await canReachRuntimeApi();
            if (!runtimeApiReady) {
              setStatus('Shared hosting does not expose a Node API; server test is performed by the PHP setup flow instead.', 'info');
              submitPhpSetupForm();
              return;
            }

            try {
              const response = await fetch(buildApiUrl('/server/test'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  serverUrl: document.getElementById('serverUrl')?.value || getRuntimeOrigin(),
                  apiBase: document.getElementById('apiBase')?.value || '/api'
                })
              });
              const result = await response.json().catch(() => ({}));
              if (!response.ok) {
                throw new Error((result && result.result && result.result.message) || 'Server test failed.');
              }
              setStatus((result && result.result && result.result.message) || 'Server connection is healthy.', 'success');
            } catch (error) {
              setStatus('The server runtime is unavailable on this shared host; using the PHP setup flow instead.', 'info');
              submitPhpSetupForm();
            }
          });
        }

        const testDatabaseBtn = document.getElementById('testDatabaseBtn');
        if (testDatabaseBtn) {
          testDatabaseBtn.addEventListener('click', async () => {
            const runtimeApiReady = await canReachRuntimeApi();
            if (!runtimeApiReady) {
              setStatus('Database validation is handled server-side on this shared host; no Node API is required.', 'info');
              submitPhpSetupForm();
              return;
            }

            try {
              const response = await fetch(buildApiUrl('/database/test'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: document.getElementById('dbType')?.value || 'mysql',
                  name: document.getElementById('dbName')?.value || '',
                  host: document.getElementById('dbHost')?.value || '127.0.0.1',
                  port: document.getElementById('dbPort')?.value || '3306',
                  username: document.getElementById('dbUser')?.value || '',
                  password: document.getElementById('dbPassword')?.value || '',
                  url: document.getElementById('dbUrl')?.value || ''
                })
              });
              const result = await response.json().catch(() => ({}));
              if (!response.ok) {
                throw new Error((result && result.result && result.result.message) || 'Database test failed.');
              }
              setStatus((result && result.result && result.result.message) || 'Database configuration is valid.', 'success');
            } catch (error) {
              setStatus('No Node runtime backend is available here; server-side PHP validation will be used instead.', 'info');
              submitPhpSetupForm();
            }
          });
        }

        const installNowBtn = document.getElementById('installNowBtn');
        if (installNowBtn) {
          if (setupReady) {
            installNowBtn.addEventListener('click', () => {
              const form = document.createElement('form');
              form.method = 'POST';
              form.action = window.location.href;
              const hidden = document.createElement('input');
              hidden.type = 'hidden';
              hidden.name = 'install_now';
              hidden.value = '1';
              form.appendChild(hidden);
              document.body.appendChild(form);
              form.submit();
            });
          } else {
            installNowBtn.addEventListener('click', async () => {
              try {
                const result = await installSetup({ silent: false });
                setStatus(result && result.message ? result.message : 'Installation completed successfully.', 'success');
                setTimeout(() => { window.location.href = 'admin.html'; }, 600);
              } catch (error) {
                console.error('Install now failed', error);
                setStatus(error && error.message ? error.message : 'Installation failed.', 'error');
              }
            });
          }
        }

        const activateSystemBtn = document.getElementById('activateSystemBtn');
        if (activateSystemBtn) {
          activateSystemBtn.addEventListener('click', async () => {
            try {
              const result = await installSetup({ silent: false });
              setStatus(result && result.message ? result.message : 'System activated successfully.', 'success');
              setTimeout(() => { window.location.href = 'admin.html'; }, 600);
            } catch (error) {
              console.error('Activate system failed', error);
              setStatus(error && error.message ? error.message : 'Activation failed.', 'error');
            }
          });
        }

        const setupDeveloperBtn = document.getElementById('setupDeveloperBtn');
        if (setupDeveloperBtn) {
          setupDeveloperBtn.addEventListener('click', async () => {
            const username = document.getElementById('developerUsername').value.trim() || 'Developer';
            const password = document.getElementById('developerPassword').value;
            const confirmation = document.getElementById('developerPasswordConfirm').value;

            if (!password || password !== confirmation) {
              setStatus('Developer password is required and must match the confirmation field.', 'error');
              return;
            }

            try {
              const result = await saveLocalDeveloperAccount(username, password);
              if (!result || !result.ok) {
                throw new Error((result && result.message) || 'Developer account could not be created.');
              }
              setStatus('Developer account initialized successfully.', 'success');
            } catch (error) {
              setStatus(error && error.message ? error.message : 'Developer setup failed.', 'error');
            }
          });
        }
      })();
    </script>
  </body>
</html>

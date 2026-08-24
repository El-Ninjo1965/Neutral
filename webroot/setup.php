<?php
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

$envFile = '/home/web1819/.env';
$env = readEnvFile($envFile);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $post = $_POST;
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
    }
    writeEnvFile($envFile, $env);
}

$dbType = $env['DB_TYPE'] ?? $env['MYSQL_TYPE'] ?? 'mysql';
$dbHost = $env['DB_HOST'] ?? $env['MYSQL_HOST'] ?? '127.0.0.1';
$dbPort = $env['DB_PORT'] ?? $env['MYSQL_PORT'] ?? '3306';
$dbName = $env['DB_NAME'] ?? $env['MYSQL_DATABASE'] ?? '';
$dbUser = $env['DB_USER'] ?? $env['MYSQL_USER'] ?? '';
$dbUrl = $env['DB_URL'] ?? $env['DATABASE_URL'] ?? '';

if ($dbUrl === '') {
    $protocol = strtolower((string) $dbType) === 'postgresql' ? 'postgresql' : 'mysql';
    $hostPart = trim((string) $dbHost) !== '' ? (string) $dbHost : '127.0.0.1';
    $portPart = trim((string) $dbPort) !== '' ? (string) $dbPort : '3306';
    $namePart = trim((string) $dbName) !== '' ? (string) $dbName : '';
    $userPart = trim((string) $dbUser) !== '' ? (string) $dbUser : '';

    if ($userPart !== '' && $namePart !== '') {
        $dbUrl = $protocol . '://' . $userPart . '@' . $hostPart . ':' . $portPart . '/' . $namePart;
    } elseif ($namePart !== '') {
        $dbUrl = $protocol . '://' . $hostPart . ':' . $portPart . '/' . $namePart;
    } else {
        $dbUrl = $protocol . '://' . $hostPart . ':' . $portPart;
    }
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
        max-width: 760px;
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
      }
      input[readonly] {
        opacity: 0.9;
      }
      .actions {
        margin-top: 20px;
        display: flex;
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
      button:hover {
        background: #1d4ed8;
      }
      .hint {
        color: #cbd5e1;
        font-size: 0.9rem;
        margin-top: 18px;
      }
    </style>
  </head>
  <body>
    <div class="panel">
      <h1>Platform setup</h1>
      <form method="post" action="<?= htmlspecialchars($_SERVER['PHP_SELF'] ?? 'setup.php', ENT_QUOTES, 'UTF-8') ?>">
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
        </div>
      </form>
      <div class="hint">Sensitive values are intentionally not prefilled for security. The password is kept only in the protected server environment.</div>
    </div>
  </body>
</html>

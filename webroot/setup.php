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
    </style>
  </head>
  <body>
    <div class="panel">
      <h1>Platform setup</h1>

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
          <input id="serverUrl" name="serverUrl" type="text" value="http://127.0.0.1:3000" />
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
          <button type="button" id="activateSystemBtn">Activate system</button>
        </div>
      </form>

      <div id="setupStatus" class="status" aria-live="polite">Setup status: ready to validate and activate.</div>

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
    </div>

    <script>
      (() => {
        const statusEl = document.getElementById('setupStatus');
        const form = document.getElementById('setupForm');

        const setStatus = (message, kind = 'info') => {
          statusEl.textContent = message;
          statusEl.className = 'status' + (kind === 'success' ? ' success' : kind === 'error' ? ' error' : '');
        };

        const sha256 = async (value) => {
          const data = new TextEncoder().encode(String(value || ''));
          const digest = await crypto.subtle.digest('SHA-256', data);
          return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
        };

        const getConfiguredServerUrl = () => {
          const configured = (document.getElementById('serverUrl')?.value || '').trim();
          return configured || window.location.origin || 'http://127.0.0.1:3000';
        };

        const getConfiguredApiBase = () => {
          const configured = (document.getElementById('apiBase')?.value || '').trim();
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

        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          const payload = {
            appId: document.getElementById('appId').value || 'neutral-app',
            appName: document.getElementById('appName').value || 'Neutral Platform',
            configuration: {
              serverUrl: document.getElementById('serverUrl').value || 'http://127.0.0.1:3000',
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
              url: document.getElementById('serverUrl').value || 'http://127.0.0.1:3000',
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
            setStatus(error && error.message ? error.message : 'Setup save failed.', 'error');
          }
        });

        document.getElementById('testServerBtn').addEventListener('click', async () => {
          try {
            const response = await fetch(buildApiUrl('/server/test'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                serverUrl: document.getElementById('serverUrl').value || 'http://127.0.0.1:3000',
                apiBase: document.getElementById('apiBase').value || '/api'
              })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
              throw new Error((result && result.result && result.result.message) || 'Server test failed.');
            }
            setStatus((result && result.result && result.result.message) || 'Server connection is healthy.', 'success');
          } catch (error) {
            setStatus(error && error.message ? error.message : 'Server test failed.', 'error');
          }
        });

        document.getElementById('testDatabaseBtn').addEventListener('click', async () => {
          try {
            const response = await fetch(buildApiUrl('/database/test'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: document.getElementById('dbType').value || 'mysql',
                name: document.getElementById('dbName').value || '',
                host: document.getElementById('dbHost').value || '127.0.0.1',
                port: document.getElementById('dbPort').value || '3306',
                username: document.getElementById('dbUser').value || '',
                password: document.getElementById('dbPassword').value || '',
                url: document.getElementById('dbUrl').value || ''
              })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
              throw new Error((result && result.result && result.result.message) || 'Database test failed.');
            }
            setStatus((result && result.result && result.result.message) || 'Database configuration is valid.', 'success');
          } catch (error) {
            setStatus(error && error.message ? error.message : 'Database test failed.', 'error');
          }
        });

        document.getElementById('activateSystemBtn').addEventListener('click', async () => {
          try {
            const response = await fetch(buildApiUrl('/setup/activate'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ currentStep: 'runtime', message: 'Installation activated.' })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
              throw new Error((result && result.message) || 'Activation failed.');
            }
            setStatus('System activated successfully.', 'success');
            setTimeout(() => { window.location.href = 'admin.html'; }, 500);
          } catch (error) {
            setStatus(error && error.message ? error.message : 'Activation failed.', 'error');
          }
        });

        document.getElementById('setupDeveloperBtn').addEventListener('click', async () => {
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
      })();
    </script>
  </body>
</html>

<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/core/php/bootstrap.php';

use Neutral\Core\Security;

/**
 * @return list<string>
 */
function normalize_roles_from_identity($roles): array
{
    if (!is_array($roles)) {
        return [];
    }

    $normalized = [];
    foreach ($roles as $role) {
        $value = strtolower(trim((string) $role));
        if ($value !== '') {
            $normalized[] = $value;
        }
    }

    return array_values(array_unique($normalized));
}

function render_auth_required_page(): void
{
    http_response_code(401);
    header('Content-Type: text/html; charset=utf-8');
    ?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authentication required</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="auth-shell">
    <div class="auth-card">
      <h2>Authentication required</h2>
      <p class="subtle">Please sign in with an authorized administrator account first.</p>
      <div class="form-grid" style="margin-top:12px;">
        <div class="form-field">
          <label for="loginUsername">Username</label>
          <input id="loginUsername" type="text" value="admin" autocomplete="username">
        </div>
        <div class="form-field">
          <label for="loginPassword">Password</label>
          <input id="loginPassword" type="password" value="" autocomplete="current-password">
        </div>
        <div class="action-list">
          <button id="loginBtn" class="primary" type="button">Sign in</button>
        </div>
        <div id="authMessage" class="message info">Sign in with your configured administrator account.</div>
      </div>
      <div class="action-list">
        <a class="nav-item" href="index.html">Return to platform</a>
      </div>
    </div>
  </div>
  <script>
  (function () {
    const loginButton = document.getElementById('loginBtn');
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const authMessage = document.getElementById('authMessage');

    if (!loginButton || !usernameInput || !passwordInput || !authMessage) {
      return;
    }

    const setMessage = function (text, mode) {
      authMessage.className = mode === 'error' ? 'message error' : 'message info';
      authMessage.textContent = text;
    };

    const login = async function () {
      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      if (!username || !password) {
        setMessage('Please enter username and password.', 'error');
        return;
      }

      loginButton.disabled = true;
      setMessage('Signing in...', 'info');
      try {
        const response = await fetch('api/auth/login', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: username, password: password }),
        });
        const payload = await response.json().catch(function () { return {}; });
        if (!response.ok || !payload || payload.ok !== true) {
          const message = payload && payload.error && payload.error.message
            ? payload.error.message
            : 'Authentication failed.';
          setMessage(message, 'error');
          return;
        }
        window.location.replace('admin.php');
      } catch (_error) {
        setMessage('Authentication request failed.', 'error');
      } finally {
        loginButton.disabled = false;
      }
    };

    loginButton.addEventListener('click', login);
    passwordInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        login();
      }
    });
  })();
  </script>
</body>
</html>
<?php
}

function render_access_denied_page(): void
{
    http_response_code(403);
    header('Content-Type: text/html; charset=utf-8');
    ?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access denied</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="auth-shell">
    <div class="auth-card">
      <h2>Access denied</h2>
      <p class="subtle">Administrative access requires an authorized role.</p>
      <div class="action-list">
        <a class="nav-item" href="index.html">Return to platform</a>
      </div>
    </div>
  </div>
</body>
</html>
<?php
}

$runtime = neutral_bootstrap();
$cookieName = trim((string) ($runtime->config()->env()['AUTH_ADMIN_SESSION_COOKIE_NAME'] ?? 'neutral_admin_session'));
Security::ensureSessionStarted($cookieName !== '' ? $cookieName : 'neutral_admin_session');

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Robots-Tag: noindex, nofollow');

$identity = $_SESSION['auth_identity'] ?? null;
if (!is_array($identity)) {
    render_auth_required_page();
    exit;
}

$expiresAt = strtotime((string) ($identity['expiresAt'] ?? ''));
if ($expiresAt !== false && $expiresAt > 0 && $expiresAt < time()) {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'] ?? '/',
            $params['domain'] ?? '',
            (bool) ($params['secure'] ?? false),
            (bool) ($params['httponly'] ?? true)
        );
    }
    session_destroy();
    render_auth_required_page();
    exit;
}

$status = strtolower(trim((string) ($identity['status'] ?? 'active')));
if ($status !== '' && $status !== 'active') {
    render_auth_required_page();
    exit;
}

$roles = normalize_roles_from_identity($identity['roles'] ?? []);
if (!in_array('admin', $roles, true)) {
    render_access_denied_page();
    exit;
}

http_response_code(200);
header('Content-Type: text/html; charset=utf-8');
require dirname(__DIR__) . '/core/php/views/admin-ui.php';

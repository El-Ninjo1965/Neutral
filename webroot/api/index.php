<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/core/php/bootstrap.php';

use Neutral\Core\AppConfig;
use Neutral\Core\JsonResponse;
use Neutral\Core\Phase4AuthManager;
use Neutral\Core\Phase4JsonStore;
use Neutral\Core\Phase4RoleService;
use Neutral\Core\Phase4SessionRegistry;
use Neutral\Core\Phase4SettingsService;
use Neutral\Core\Phase4UserService;
use Neutral\Core\Phase6AuditService;
use Neutral\Core\Phase6SettingsService;
use Neutral\Core\Phase7ModuleRuntime;
use Neutral\Core\Security;

$runtime = neutral_bootstrap();
$config = $runtime->config();
$database = $runtime->database();

$store = new Phase4JsonStore($runtime->projectRoot() . '/config');
$roleService = new Phase4RoleService($store, $database);
$userService = new Phase4UserService($store, $roleService, $config, $database);
$settingsService = new Phase6SettingsService($database, new Phase4SettingsService($store));
$auditService = new Phase6AuditService($database, $store);
$moduleRuntime = new Phase7ModuleRuntime($database, $runtime->projectRoot());
$sessionRegistry = new Phase4SessionRegistry(new Phase4JsonStore($runtime->projectRoot() . '/server/runtime'), $database);
$authManager = new Phase4AuthManager($config, $userService, $roleService, $sessionRegistry);

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$requestUriPath = trim((string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH), '/');
$segments = $requestUriPath === '' ? [] : explode('/', $requestUriPath);
$apiIndex = array_search('api', $segments, true);
$apiSegments = $apiIndex === false ? $segments : array_slice($segments, $apiIndex + 1);
$route = strtolower(implode('/', $apiSegments));

/**
 * @return array<string, string>
 */
function request_headers_lower(): array
{
    $result = [];
    if (function_exists('getallheaders')) {
        foreach ((array) getallheaders() as $key => $value) {
            $result[strtolower((string) $key)] = is_array($value) ? implode(', ', $value) : (string) $value;
        }
    }
    foreach ($_SERVER as $key => $value) {
        if (!is_string($key) || !str_starts_with($key, 'HTTP_')) {
            continue;
        }
        $name = strtolower(str_replace('_', '-', substr($key, 5)));
        if (!isset($result[$name])) {
            $result[$name] = (string) $value;
        }
    }
    return $result;
}

/**
 * @return array<string, mixed>
 */
function parse_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Invalid JSON payload.');
    }
    return $decoded;
}

/**
 * @param array<string,mixed>|null $identity
 */
function require_permission_or_fail(?array $identity, Phase4AuthManager $authManager, string $permission, bool $needsCsrf, array $headers): void
{
    if (!$identity) {
        JsonResponse::error('Not authenticated.', 401);
    }
    if (!$authManager->hasPermission($identity, $permission)) {
        JsonResponse::error('Insufficient privileges.', 403, ['permission' => $permission]);
    }
    if ($needsCsrf && (($identity['via'] ?? '') === 'session')) {
        $provided = $headers['x-csrf-token'] ?? '';
        try {
            Security::assertValidCsrfToken(is_string($provided) ? $provided : null);
        } catch (Throwable $exception) {
            JsonResponse::error('Invalid CSRF token.', 403, ['code' => 'CSRF_INVALID']);
        }
    }
}

/**
 * @param array<string,mixed> $user
 * @return array<string,mixed>
 */
function admin_user_payload(array $user): array
{
    return [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'displayName' => $user['displayName'],
        'role' => (is_array($user['roles'] ?? null) && $user['roles'] !== []) ? $user['roles'][0] : 'user',
        'roles' => $user['roles'],
        'status' => $user['status'],
        'permissions' => $user['permissions'],
        'createdAt' => $user['createdAt'],
        'updatedAt' => $user['updatedAt'],
    ];
}

function actor_user_id(?array $identity): ?int
{
    if (!$identity) {
        return null;
    }
    $raw = (string) ($identity['userId'] ?? '');
    if ($raw === '' || !ctype_digit($raw)) {
        return null;
    }
    $value = (int) $raw;
    return $value > 0 ? $value : null;
}

if ($method === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, X-Framework-Role, X-Admin-Access-Token, X-Auth-Token');
    http_response_code(204);
    exit;
}

$headers = request_headers_lower();
$identity = $authManager->resolveIdentity($headers);

if ($route === 'setup/status') {
    require __DIR__ . '/setup/status.php';
    exit;
}

if ($route === 'setup/install') {
    require __DIR__ . '/setup/install.php';
    exit;
}

if ($route === 'status') {
    $database = $config->database();
    $dbState = 'not_configured';
    $dbError = null;
    if (trim($database['host']) !== '' && trim($database['name']) !== '' && trim($database['user']) !== '') {
        try {
            $dbState = $runtime->database()->ping() ? 'ok' : 'error';
        } catch (Throwable $exception) {
            $dbState = 'error';
            $dbError = $exception->getMessage();
        }
    }

    JsonResponse::success([
        'service' => 'neutral-core',
        'status' => 'ok',
        'environment' => $config->environment(),
        'app' => [
            'id' => $config->appId(),
            'name' => $config->appName(),
            'apiBase' => $config->apiBase(),
        ],
        'runtime' => [
            'phpVersion' => PHP_VERSION,
            'sapi' => php_sapi_name(),
            'envFile' => $runtime->envFile(),
        ],
        'database' => [
            'state' => $dbState,
            'type' => $database['type'],
            'host' => $database['host'],
            'port' => $database['port'],
            'name' => $database['name'],
            'user' => $database['user'],
            'error' => $dbError,
        ],
    ]);
}

if ($route === 'auth/login' && $method === 'POST') {
    $payload = parse_json_body();
    $username = trim((string) ($payload['username'] ?? ''));
    $password = (string) ($payload['password'] ?? '');
    $result = $authManager->authenticate($username, $password);
    if (!$result) {
        JsonResponse::error('Invalid username or password.', 401);
    }

    setcookie(
        'neutral_csrf',
        (string) $result['csrfToken'],
        [
            'expires' => strtotime((string) $result['expiresAt']) ?: 0,
            'path' => '/',
            'secure' => Security::isHttpsRequest(),
            'httponly' => false,
            'samesite' => 'Lax',
        ]
    );

    JsonResponse::success([
        'via' => 'session',
        'user' => $result['user'],
        'roles' => $result['roles'],
        'permissions' => $result['permissions'],
        'csrfToken' => $result['csrfToken'],
        'expiresAt' => $result['expiresAt'],
    ]);
}

if ($route === 'auth/logout' && $method === 'POST') {
    $authManager->logout();
    setcookie(
        'neutral_csrf',
        '',
        [
            'expires' => time() - 3600,
            'path' => '/',
            'secure' => Security::isHttpsRequest(),
            'httponly' => false,
            'samesite' => 'Lax',
        ]
    );
    JsonResponse::success(['loggedOut' => true]);
}

if ($route === 'auth/me' && $method === 'GET') {
    if (!$identity) {
        JsonResponse::error('Not authenticated.', 401);
    }
    $user = null;
    if (($identity['via'] ?? '') === 'session') {
        $user = $userService->getPublicById((string) ($identity['userId'] ?? ''));
    }
    JsonResponse::success([
        'via' => $identity['via'] ?? 'token',
        'user' => $user,
        'roles' => $identity['roles'] ?? [],
        'permissions' => $identity['permissions'] ?? [],
    ]);
}

if ($route === 'modules' && $method === 'GET') {
    JsonResponse::success([
        'modules' => $moduleRuntime->discover(),
    ]);
}

if ($route === 'admin/sessions' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'session.read', false, $headers);
    JsonResponse::success(['sessions' => $authManager->listSessions()]);
}

if ($route === 'admin/permissions' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'role.read', false, $headers);
    JsonResponse::success(['permissions' => Neutral\Core\Phase4AuthRbac::PERMISSIONS]);
}

if ($route === 'admin/users' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'user.read', false, $headers);
    $filters = [
        'q' => (string) ($_GET['q'] ?? ''),
        'role' => (string) ($_GET['role'] ?? ''),
        'status' => (string) ($_GET['status'] ?? ''),
    ];
    $users = array_map('admin_user_payload', $userService->allPublic($filters));
    JsonResponse::success(['users' => $users]);
}

if ($route === 'admin/users' && $method === 'POST') {
    require_permission_or_fail($identity, $authManager, 'user.write', true, $headers);
    $payload = parse_json_body();
    $created = $userService->create($payload);
    $auditService->log('user.create', 'user', (string) ($created['id'] ?? ''), actor_user_id($identity), [
        'username' => (string) ($created['username'] ?? ''),
        'status' => (string) ($created['status'] ?? ''),
    ]);
    JsonResponse::success(['user' => admin_user_payload($created)], 201);
}

if (preg_match('#^admin/users/([a-z0-9\-]+)$#', $route, $matches) === 1) {
    $userId = $matches[1];
    if ($method === 'GET') {
        require_permission_or_fail($identity, $authManager, 'user.read', false, $headers);
        $user = $userService->getPublicById($userId);
        if (!$user) {
            JsonResponse::error('User not found.', 404);
        }
        JsonResponse::success(['user' => admin_user_payload($user)]);
    }
    if ($method === 'PUT') {
        require_permission_or_fail($identity, $authManager, 'user.write', true, $headers);
        $payload = parse_json_body();
        $updated = $userService->update($userId, $payload);
        $auditService->log('user.update', 'user', $userId, actor_user_id($identity), [
            'status' => (string) ($updated['status'] ?? ''),
            'roles' => $updated['roles'] ?? [],
        ]);
        JsonResponse::success(['user' => admin_user_payload($updated)]);
    }
    if ($method === 'DELETE') {
        require_permission_or_fail($identity, $authManager, 'user.write', true, $headers);
        $userService->delete($userId);
        $auditService->log('user.delete', 'user', $userId, actor_user_id($identity), []);
        JsonResponse::success(['deleted' => true]);
    }
}

if ($route === 'admin/roles' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'role.read', false, $headers);
    JsonResponse::success(['roles' => $roleService->all()]);
}

if ($route === 'admin/roles' && $method === 'POST') {
    require_permission_or_fail($identity, $authManager, 'role.write', true, $headers);
    $payload = parse_json_body();
    $created = $roleService->create($payload);
    $auditService->log('role.create', 'role', (string) ($created['id'] ?? ''), actor_user_id($identity), [
        'name' => (string) ($created['name'] ?? ''),
    ]);
    JsonResponse::success(['role' => $created], 201);
}

if (preg_match('#^admin/roles/([a-z0-9\-]+)$#', $route, $matches) === 1) {
    $roleId = $matches[1];
    if ($method === 'GET') {
        require_permission_or_fail($identity, $authManager, 'role.read', false, $headers);
        $role = $roleService->get($roleId);
        if (!$role) {
            JsonResponse::error('Role not found.', 404);
        }
        JsonResponse::success(['role' => $role]);
    }
    if ($method === 'PUT') {
        require_permission_or_fail($identity, $authManager, 'role.write', true, $headers);
        $payload = parse_json_body();
        $updated = $roleService->update($roleId, $payload);
        $auditService->log('role.update', 'role', $roleId, actor_user_id($identity), [
            'permissions' => $updated['permissions'] ?? [],
        ]);
        JsonResponse::success(['role' => $updated]);
    }
    if ($method === 'DELETE') {
        require_permission_or_fail($identity, $authManager, 'role.write', true, $headers);
        $roleService->delete($roleId);
        $auditService->log('role.delete', 'role', $roleId, actor_user_id($identity), []);
        JsonResponse::success(['deleted' => true]);
    }
}

if ($route === 'admin/settings' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'settings.read', false, $headers);
    JsonResponse::success(['settings' => $settingsService->getAll()]);
}

if ($route === 'admin/settings' && $method === 'POST') {
    require_permission_or_fail($identity, $authManager, 'settings.write', true, $headers);
    $payload = parse_json_body();
    $updated = $settingsService->update($payload, actor_user_id($identity));
    $auditService->log('settings.update', 'settings', 'core', actor_user_id($identity), [
        'appId' => (string) ($updated['appId'] ?? ''),
        'appName' => (string) ($updated['appName'] ?? ''),
    ]);
    JsonResponse::success(['settings' => $updated]);
}

if ($route === 'admin/audit' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'audit.read', false, $headers);
    $filters = [
        'action' => (string) ($_GET['action'] ?? ''),
        'resource' => (string) ($_GET['resource'] ?? ''),
        'limit' => (int) ($_GET['limit'] ?? 100),
    ];
    JsonResponse::success(['entries' => $auditService->list($filters)]);
}

if ($route === 'admin/modules' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'role.read', false, $headers);
    JsonResponse::success([
        'modules' => $moduleRuntime->listForAdmin(),
    ]);
}

if (preg_match('#^admin/modules/([a-z0-9\-]+)$#', $route, $matches) === 1 && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'role.read', false, $headers);
    $module = $moduleRuntime->getForAdmin($matches[1]);
    if ($module === null) {
        JsonResponse::error('Module not found.', 404, ['moduleId' => $matches[1]]);
    }
    JsonResponse::success(['module' => $module]);
}

if (preg_match('#^admin/modules/([a-z0-9\-]+)/install$#', $route, $matches) === 1 && $method === 'POST') {
    require_permission_or_fail($identity, $authManager, 'role.write', true, $headers);
    try {
        $module = $moduleRuntime->install($matches[1], actor_user_id($identity));
    } catch (RuntimeException $exception) {
        if ($exception->getMessage() === 'Module not discovered.') {
            JsonResponse::error('Module not discovered.', 404, ['moduleId' => $matches[1]]);
        }
        throw $exception;
    }
    $auditService->log('module.install', 'module', (string) ($module['id'] ?? $matches[1]), actor_user_id($identity), [
        'status' => (string) ($module['status'] ?? 'inactive'),
        'lifecycleState' => (string) ($module['lifecycleState'] ?? 'INACTIVE'),
    ]);
    JsonResponse::success(['module' => $module]);
}

if (preg_match('#^admin/modules/([a-z0-9\-]+)/activate$#', $route, $matches) === 1 && $method === 'POST') {
    require_permission_or_fail($identity, $authManager, 'role.write', true, $headers);
    try {
        $module = $moduleRuntime->activate($matches[1], actor_user_id($identity));
    } catch (RuntimeException $exception) {
        if ($exception->getMessage() === 'Module not registered.') {
            JsonResponse::error('Module not registered.', 404, ['moduleId' => $matches[1]]);
        }
        throw $exception;
    }
    $auditService->log('module.activate', 'module', (string) ($module['id'] ?? $matches[1]), actor_user_id($identity), [
        'status' => (string) ($module['status'] ?? 'active'),
        'lifecycleState' => (string) ($module['lifecycleState'] ?? 'ACTIVE'),
    ]);
    JsonResponse::success(['module' => $module]);
}

if (preg_match('#^admin/modules/([a-z0-9\-]+)/deactivate$#', $route, $matches) === 1 && $method === 'POST') {
    require_permission_or_fail($identity, $authManager, 'role.write', true, $headers);
    try {
        $module = $moduleRuntime->deactivate($matches[1], actor_user_id($identity));
    } catch (RuntimeException $exception) {
        if ($exception->getMessage() === 'Module not registered.') {
            JsonResponse::error('Module not registered.', 404, ['moduleId' => $matches[1]]);
        }
        throw $exception;
    }
    $auditService->log('module.deactivate', 'module', (string) ($module['id'] ?? $matches[1]), actor_user_id($identity), [
        'status' => (string) ($module['status'] ?? 'inactive'),
        'lifecycleState' => (string) ($module['lifecycleState'] ?? 'INACTIVE'),
    ]);
    JsonResponse::success(['module' => $module]);
}

if ($route === 'database/status' && $method === 'GET') {
    $database = $config->database();
    $ok = false;
    $message = 'Database is not configured.';
    try {
        $ok = $runtime->database()->ping();
        $message = $ok ? 'Database connection is available.' : 'Database ping failed.';
    } catch (Throwable $exception) {
        $ok = false;
        $message = $exception->getMessage();
    }
    JsonResponse::success([
        'database' => [
            'ok' => $ok,
            'status' => $ok ? 'ready' : 'error',
            'message' => $message,
            'type' => $database['type'],
            'host' => $database['host'],
            'port' => $database['port'],
            'name' => $database['name'],
            'user' => $database['user'],
        ],
    ]);
}

JsonResponse::error('Not found', 404, ['route' => $route, 'method' => $method]);

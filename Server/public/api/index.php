<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/php/bootstrap.php';

use Neutral\Core\AppConfig;
use Neutral\Core\JsonResponse;
use Neutral\Core\Phase4AuthManager;
use Neutral\Core\Phase4JsonStore;
use Neutral\Core\Phase4PermissionService;
use Neutral\Core\Phase4RoleService;
use Neutral\Core\Phase4SessionRegistry;
use Neutral\Core\Phase4SettingsService;
use Neutral\Core\Phase4UserService;
use Neutral\Core\Phase6AuditService;
use Neutral\Core\Phase6SettingsService;
use Neutral\Core\Phase7ModuleRuntime;
use Neutral\Core\Security;
use Neutral\Core\LoginRateLimiter;
use Neutral\Core\PdoLoginAttemptStore;
use Neutral\Core\DatabaseBackupService;
use Neutral\Core\SchemaMigrator;

$runtime = neutral_bootstrap();
$config = $runtime->config();
$database = $runtime->database();

$store = new Phase4JsonStore($runtime->projectRoot() . '/Server/runtime/config');
$roleService = new Phase4RoleService($store, $database);
$permissionService = new Phase4PermissionService($database);
$userService = new Phase4UserService($store, $roleService, $config, $database);
$settingsService = new Phase6SettingsService($database, new Phase4SettingsService($store));
$auditService = new Phase6AuditService($database, $store);
$moduleRuntime = new Phase7ModuleRuntime($database, $runtime->projectRoot());
$sessionRegistry = new Phase4SessionRegistry(new Phase4JsonStore($runtime->projectRoot() . '/Server/runtime'), $database);
$authManager = new Phase4AuthManager($config, $userService, $roleService, $sessionRegistry);

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$apiRequest = $config->apiRequestRoute((string) ($_SERVER['REQUEST_URI'] ?? ''));
$requestedApiVersion = $apiRequest['version'];
header('X-Neutral-API-Version: 1');
if ($requestedApiVersion !== null && $requestedApiVersion !== 1) {
    JsonResponse::error('Unsupported API version.', 404, ['supportedVersions' => [1]]);
}
$route = $apiRequest['route'];

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
 * @param list<string> $permissions
 */
function require_any_permission_or_fail(?array $identity, Phase4AuthManager $authManager, array $permissions, bool $needsCsrf, array $headers): void
{
    if (!$identity) {
        JsonResponse::error('Not authenticated.', 401);
    }
    foreach ($permissions as $permission) {
        if ($authManager->hasPermission($identity, $permission)) {
            if ($needsCsrf && (($identity['via'] ?? '') === 'session')) {
                $provided = $headers['x-csrf-token'] ?? '';
                try {
                    Security::assertValidCsrfToken(is_string($provided) ? $provided : null);
                } catch (Throwable $exception) {
                    JsonResponse::error('Invalid CSRF token.', 403, ['code' => 'CSRF_INVALID']);
                }
            }
            return;
        }
    }
    JsonResponse::error('Insufficient privileges.', 403, ['permissions' => $permissions]);
}

/** @param array<string,mixed>|null $identity */
function require_admin_session_permission_or_fail(?array $identity, Phase4AuthManager $authManager, string $permission, array $headers, bool $needsCsrf = true): void
{
    if (!$identity || (($identity['via'] ?? '') !== 'session')) {
        JsonResponse::error('Admin session required.', 401);
    }
    require_permission_or_fail($identity, $authManager, $permission, $needsCsrf, $headers);
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

/**
 * @return list<string>
 */
function module_access_permissions(array $module, string $key): array
{
    $access = is_array($module['access'] ?? null) ? $module['access'] : [];
    $permissions = is_array($access[$key] ?? null) ? $access[$key] : [];
    $normalized = [];
    foreach ($permissions as $permission) {
        $value = trim((string) $permission);
        if ($value !== '') {
            $normalized[] = $value;
        }
    }
    return array_values(array_unique($normalized));
}

/**
 * @return list<string>
 */
function module_permission_keys(array $module): array
{
    $keys = [];
    $definitions = is_array($module['permissionDefinitions'] ?? null) ? $module['permissionDefinitions'] : [];
    foreach ($definitions as $definition) {
        if (!is_array($definition)) {
            continue;
        }
        $value = trim((string) ($definition['key'] ?? ''));
        if ($value !== '') {
            $keys[] = $value;
        }
    }
    if ($keys === [] && is_array($module['permissions'] ?? null)) {
        foreach ($module['permissions'] as $permission) {
            $value = trim((string) $permission);
            if ($value !== '') {
                $keys[] = $value;
            }
        }
    }
    return array_values(array_unique($keys));
}

/**
 * @return array<string,mixed>
 */
function module_permissions_payload(array $module, array $roles): array
{
    $modulePermissionKeys = module_permission_keys($module);
    $permissionDefinitions = is_array($module['permissionDefinitions'] ?? null) ? $module['permissionDefinitions'] : [];

    return [
        'moduleId' => (string) ($module['id'] ?? ''),
        'permissions' => array_values(array_filter($permissionDefinitions, static fn ($definition): bool => is_array($definition) && trim((string) ($definition['key'] ?? '')) !== '')),
        'access' => is_array($module['access'] ?? null) ? $module['access'] : [],
        'roles' => array_map(static function (array $role) use ($modulePermissionKeys): array {
            $rolePermissions = is_array($role['permissions'] ?? null) ? $role['permissions'] : [];
            return [
                'id' => (string) ($role['id'] ?? ''),
                'name' => (string) ($role['name'] ?? ($role['id'] ?? '')),
                'description' => (string) ($role['description'] ?? ''),
                'isSystem' => (bool) ($role['isSystem'] ?? false),
                'modulePermissions' => array_values(array_intersect($rolePermissions, $modulePermissionKeys)),
            ];
        }, $roles),
    ];
}

if ($route === 'setup/status') {
    require __DIR__ . '/setup/status.php';
    exit;
}

if ($route === 'setup/install') {
    require __DIR__ . '/setup/install.php';
    exit;
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

if ($route === 'status') {
    $database = $config->database();
    $dbState = 'not_configured';
    if (trim($database['host']) !== '' && trim($database['name']) !== '' && trim($database['user']) !== '') {
        try {
            $dbState = $runtime->database()->ping() ? 'ok' : 'error';
        } catch (Throwable $exception) {
            $dbState = 'error';
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
        'database' => [
            'state' => $dbState,
        ],
    ]);
}

if ($route === 'auth/login' && $method === 'POST') {
    $payload = parse_json_body();
    $username = trim((string) ($payload['username'] ?? ''));
    $password = (string) ($payload['password'] ?? '');
    $clientIp = trim((string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    try {
        (new SchemaMigrator($runtime->database()))->migrate();
        $loginLimiter = new LoginRateLimiter(
            new PdoLoginAttemptStore($runtime->database()),
            static fn (): int => time(),
            $config->loginRateLimit()
        );
        $rateState = $loginLimiter->check($username, $clientIp);
        if (!$rateState['allowed']) {
            header('Retry-After: ' . max(1, $rateState['retryAfter']));
            JsonResponse::error('Too many failed login attempts. Try again later.', 429);
        }
        $result = $authManager->authenticate($username, $password);
        if (!$result) {
            $rateState = $loginLimiter->registerFailure($username, $clientIp);
            if (!$rateState['allowed']) {
                header('Retry-After: ' . max(1, $rateState['retryAfter']));
                JsonResponse::error('Too many failed login attempts. Try again later.', 429);
            }
        } else {
            $loginLimiter->registerSuccess($username, $clientIp);
        }
    } catch (\Throwable $exception) {
        JsonResponse::error('Authentication service temporarily unavailable.', 503);
    }
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
    if (!$identity || (($identity['via'] ?? '') !== 'session')) {
        JsonResponse::error('Not authenticated.', 401);
    }
    try {
        Security::assertValidCsrfToken(is_string($headers['x-csrf-token'] ?? null) ? $headers['x-csrf-token'] : null);
    } catch (Throwable $exception) {
        JsonResponse::error('Invalid CSRF token.', 403, ['code' => 'CSRF_INVALID']);
    }
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
    $databaseConfig = $config->database();
    $databaseConfigured = trim((string) ($databaseConfig['url'] ?? '')) !== ''
        || (
            trim((string) ($databaseConfig['host'] ?? '')) !== ''
            && trim((string) ($databaseConfig['name'] ?? '')) !== ''
            && trim((string) ($databaseConfig['user'] ?? '')) !== ''
        );
    JsonResponse::success([
        'modules' => $databaseConfigured
            ? $moduleRuntime->listForClient($identity)
            : $moduleRuntime->discover(),
    ]);
}

if ($route === 'admin/sessions' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'session.read', false, $headers);
    JsonResponse::success(['sessions' => $authManager->listSessions()]);
}

if ($route === 'admin/permissions' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'role.read', false, $headers);
    $permissions = $permissionService->all();
    JsonResponse::success([
        'permissions' => array_map(static fn (array $permission): string => (string) ($permission['key'] ?? ''), $permissions),
        'permissionDetails' => $permissions,
    ]);
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

if (preg_match('#^admin/modules/([a-z0-9\-]+)/permissions$#', $route, $matches) === 1) {
    $module = $moduleRuntime->getForAdmin($matches[1]);
    if ($module === null) {
        JsonResponse::error('Module not found.', 404, ['moduleId' => $matches[1]]);
    }
    $readPermissions = array_values(array_unique(array_merge(
        ['role.read'],
        module_access_permissions($module, 'managementPermissions'),
        module_access_permissions($module, 'adminPermissions')
    )));
    if ($method === 'GET') {
        require_any_permission_or_fail($identity, $authManager, $readPermissions, false, $headers);
        JsonResponse::success([
            'modulePermissions' => module_permissions_payload($module, $roleService->all()),
        ]);
    }
    if ($method === 'PUT') {
        require_any_permission_or_fail($identity, $authManager, array_values(array_unique(array_merge(['role.write'], module_access_permissions($module, 'adminPermissions')))), true, $headers);
        if (!(bool) ($module['registered'] ?? false)) {
            JsonResponse::error('Module must be installed before permissions can be assigned.', 409, ['moduleId' => $matches[1]]);
        }
        $payload = parse_json_body();
        $assignments = is_array($payload['roleAssignments'] ?? null) ? $payload['roleAssignments'] : [];
        $modulePermissionKeys = module_permission_keys($module);
        $roles = $roleService->all();
        foreach ($roles as $role) {
            $roleId = (string) ($role['id'] ?? '');
            if ($roleId === '') {
                continue;
            }
            $requested = is_array($assignments[$roleId] ?? null) ? $assignments[$roleId] : [];
            $requestedKeys = [];
            foreach ($requested as $permission) {
                $value = trim((string) $permission);
                if ($value !== '' && in_array($value, $modulePermissionKeys, true)) {
                    $requestedKeys[] = $value;
                }
            }
            $requestedKeys = array_values(array_unique($requestedKeys));
            $currentPermissions = is_array($role['permissions'] ?? null) ? $role['permissions'] : [];
            $preserved = array_values(array_filter(
                $currentPermissions,
                static fn (string $permission): bool => !in_array($permission, $modulePermissionKeys, true)
            ));
            $roleService->replacePermissions($roleId, array_values(array_unique(array_merge($preserved, $requestedKeys))), true);
        }
        $updatedModule = $moduleRuntime->getForAdmin($matches[1]);
        if ($updatedModule === null) {
            JsonResponse::error('Module not found after permission update.', 404, ['moduleId' => $matches[1]]);
        }
        $updatedRoles = $roleService->all();
        $auditService->log('module.permissions.update', 'module', (string) ($updatedModule['id'] ?? $matches[1]), actor_user_id($identity), [
            'permissions' => $modulePermissionKeys,
        ]);
        JsonResponse::success([
            'modulePermissions' => module_permissions_payload($updatedModule, $updatedRoles),
        ]);
    }
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
    $module = $moduleRuntime->getForAdmin($matches[1]);
    if ($module === null) {
        JsonResponse::error('Module not found.', 404, ['moduleId' => $matches[1]]);
    }
    require_any_permission_or_fail($identity, $authManager, array_values(array_unique(array_merge(['role.write'], module_access_permissions($module, 'adminPermissions')))), true, $headers);
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
    $module = $moduleRuntime->getForAdmin($matches[1]);
    if ($module === null) {
        JsonResponse::error('Module not found.', 404, ['moduleId' => $matches[1]]);
    }
    require_any_permission_or_fail($identity, $authManager, array_values(array_unique(array_merge(['role.write'], module_access_permissions($module, 'adminPermissions')))), true, $headers);
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

if (preg_match('#^admin/modules/([a-z0-9\-]+)/uninstall$#', $route, $matches) === 1 && $method === 'POST') {
    $module = $moduleRuntime->getForAdmin($matches[1]);
    if ($module === null) {
        JsonResponse::error('Module not found.', 404, ['moduleId' => $matches[1]]);
    }
    require_any_permission_or_fail($identity, $authManager, array_values(array_unique(array_merge(['role.write'], module_access_permissions($module, 'adminPermissions')))), true, $headers);
    try {
        $module = $moduleRuntime->uninstall($matches[1], actor_user_id($identity));
    } catch (RuntimeException $exception) {
        if ($exception->getMessage() === 'Module not registered.') {
            JsonResponse::error('Module not registered.', 404, ['moduleId' => $matches[1]]);
        }
        throw $exception;
    }
    $auditService->log('module.uninstall', 'module', (string) ($module['id'] ?? $matches[1]), actor_user_id($identity), [
        'status' => (string) ($module['status'] ?? 'uninstalled'),
        'lifecycleState' => (string) ($module['lifecycleState'] ?? 'UNINSTALLED'),
    ]);
    JsonResponse::success(['module' => $module]);
}

if ($route === 'admin/system/health' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'role.read', false, $headers);
    $appDatabase = $config->database();
    $databaseOk = false;
    $databaseMessage = 'Database is not configured.';
    try {
        $databaseOk = $runtime->database()->ping();
        $databaseMessage = $databaseOk ? 'Database connection is available.' : 'Database ping failed.';
    } catch (Throwable $exception) {
        $databaseOk = false;
        $databaseMessage = $exception->getMessage();
    }
    $moduleCount = count($moduleRuntime->discover());
    JsonResponse::success([
        'health' => [
            'status' => $databaseOk ? 'ok' : 'degraded',
            'state' => $databaseOk ? 'healthy' : 'degraded',
            'environment' => $config->environment(),
            'runtime' => [
                'phpVersion' => PHP_VERSION,
                'sapi' => php_sapi_name(),
                'memoryLimit' => ini_get('memory_limit') ?: 'unknown',
                'diskFree' => disk_free_space($runtime->projectRoot()) ?: null,
            ],
            'database' => [
                'ok' => $databaseOk,
                'status' => $databaseOk ? 'ready' : 'error',
                'message' => $databaseMessage,
                'type' => $appDatabase['type'],
                'host' => $appDatabase['host'],
                'port' => $appDatabase['port'],
                'name' => $appDatabase['name'],
                'user' => $appDatabase['user'],
            ],
            'modules' => $moduleCount,
            'apps' => 1,
            'framework' => [
                'service' => 'neutral-core',
                'version' => '1.0.0',
            ],
        ],
    ]);
}

if ($route === 'admin/system/inventory' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'backups.view', false, $headers);
    try {
        $migrator = new SchemaMigrator($runtime->database());
        $pdo = $runtime->database()->connect();
        $tables = [];
        foreach ($migrator->managedTables() as $table) {
            if (preg_match('/^[a-z][a-z0-9_]{0,63}$/', $table) !== 1) {
                throw new RuntimeException('Unsafe managed table identifier.');
            }
            $statement = $pdo->query('SELECT COUNT(*) FROM `' . $table . '`');
            $tables[] = ['table' => $table, 'rows' => $statement ? (int) $statement->fetchColumn() : 0];
        }
        JsonResponse::success(['inventory' => ['tables' => $tables, 'migration' => $migrator->status()]]);
    } catch (Throwable $exception) {
        JsonResponse::error('Inventory service temporarily unavailable.', 503);
    }
}

if ($route === 'admin/diagnostics' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'role.read', false, $headers);
    JsonResponse::success([
        'diagnostics' => [
            'status' => 'ok',
            'environment' => $config->environment(),
            'runtime' => [
                'phpVersion' => PHP_VERSION,
                'sapi' => php_sapi_name(),
                'memoryLimit' => ini_get('memory_limit') ?: 'unknown',
                'diskFree' => disk_free_space($runtime->projectRoot()) ?: null,
            ],
            'database' => [
                'type' => $config->database()['type'],
                'host' => $config->database()['host'],
                'name' => $config->database()['name'],
                'user' => $config->database()['user'],
            ],
            'modules' => count($moduleRuntime->discover()),
            'apps' => 1,
            'summary' => 'Neutral PHP runtime is active.',
        ],
    ]);
}

if ($route === 'admin/server' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'settings.read', false, $headers);
    JsonResponse::success([
        'server' => [
            'status' => 'healthy',
            'environment' => $config->environment(),
            'phpVersion' => PHP_VERSION,
            'sapi' => php_sapi_name(),
            'appId' => $config->appId(),
            'appName' => $config->appName(),
            'apiBase' => $config->apiBase(),
        ],
    ]);
}

if ($route === 'server/test' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'settings.read', false, $headers);
    JsonResponse::success([
        'result' => [
            'status' => 'healthy',
            'environment' => $config->environment(),
            'phpVersion' => PHP_VERSION,
            'sapi' => php_sapi_name(),
            'appId' => $config->appId(),
            'appName' => $config->appName(),
            'apiBase' => $config->apiBase(),
        ],
    ]);
}

if ($route === 'admin/database' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'settings.read', false, $headers);
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

if ($route === 'admin/release/status' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'role.read', false, $headers);
    JsonResponse::success([
        'release' => [
            'status' => 'operational',
            'version' => '1.0.0',
            'updatedAt' => gmdate('c'),
            'maintenanceMode' => false,
        ],
    ]);
}

if ($route === 'admin/providers' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'settings.read', false, $headers);
    JsonResponse::success([
        'providers' => [],
        'status' => 'not_configured',
    ]);
}

if ($route === 'providers' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'settings.read', false, $headers);
    JsonResponse::success([
        'providers' => [],
        'status' => 'not_configured',
    ]);
}

if ($route === 'admin/connections' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'settings.read', false, $headers);
    JsonResponse::success([
        'connections' => [],
    ]);
}

if ($route === 'connections' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'settings.read', false, $headers);
    JsonResponse::success([
        'connections' => [],
    ]);
}

if ($route === 'admin/backups' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'backups.view', false, $headers);
    try {
        $backupService = new DatabaseBackupService(
            $runtime->database(),
            new SchemaMigrator($runtime->database()),
            $config,
            $runtime->projectRoot()
        );
        JsonResponse::success(['backups' => $backupService->list(), 'status' => 'available']);
    } catch (Throwable $exception) {
        JsonResponse::error('Backup service temporarily unavailable.', 503);
    }
}

if ($route === 'admin/backups' && $method === 'POST') {
    require_admin_session_permission_or_fail($identity, $authManager, 'backups.manage', $headers);
    try {
        $backupService = new DatabaseBackupService($runtime->database(), new SchemaMigrator($runtime->database()), $config, $runtime->projectRoot());
        $backup = $backupService->create();
        $auditService->log('backup.create', 'backup', $backup['backupId'], actor_user_id($identity), ['size' => $backup['size']]);
        JsonResponse::success(['backup' => $backup], 201);
    } catch (Throwable $exception) {
        JsonResponse::error('Backup service temporarily unavailable.', 503);
    }
}

if ($route === 'admin/backups/upload' && $method === 'POST') {
    require_admin_session_permission_or_fail($identity, $authManager, 'backups.manage', $headers);
    $contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($contentLength > 100 * 1024 * 1024) {
        JsonResponse::error('Backup upload is too large.', 413);
    }
    try {
        $backupService = new DatabaseBackupService($runtime->database(), new SchemaMigrator($runtime->database()), $config, $runtime->projectRoot());
        $input = fopen('php://input', 'rb');
        if (!is_resource($input)) {
            throw new RuntimeException('Could not open backup upload stream.');
        }
        try {
            $backup = $backupService->storeUploadStream($input, 100 * 1024 * 1024);
        } finally {
            fclose($input);
        }
        $auditService->log('backup.upload', 'backup', $backup['backupId'], actor_user_id($identity), ['size' => $backup['size']]);
        JsonResponse::success(['backup' => $backup], 201);
    } catch (Throwable $exception) {
        JsonResponse::error('Backup upload was rejected.', 400);
    }
}

if (preg_match('#^admin/backups/([a-f0-9]{32})/download$#', $route, $backupMatches) === 1 && $method === 'GET') {
    require_admin_session_permission_or_fail($identity, $authManager, 'backups.manage', $headers, false);
    try {
        $backupService = new DatabaseBackupService($runtime->database(), new SchemaMigrator($runtime->database()), $config, $runtime->projectRoot());
        $path = $backupService->pathForDownload($backupMatches[1]);
        if (!is_file($path) || !is_readable($path)) {
            JsonResponse::error('Backup not found.', 404);
        }
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="neutral-' . $backupMatches[1] . '.neutral-backup"');
        header('Content-Length: ' . (string) filesize($path));
        header('Cache-Control: no-store');
        readfile($path);
        exit;
    } catch (Throwable $exception) {
        JsonResponse::error('Backup download was rejected.', 400);
    }
}

if (preg_match('#^admin/backups/([a-f0-9]{32})/restore$#', $route, $backupMatches) === 1 && $method === 'POST') {
    require_admin_session_permission_or_fail($identity, $authManager, 'backups.manage', $headers);
    try {
        $backupService = new DatabaseBackupService($runtime->database(), new SchemaMigrator($runtime->database()), $config, $runtime->projectRoot());
        $backup = $backupService->restore($backupMatches[1]);
        $auditService->log('backup.restore', 'backup', $backup['backupId'], actor_user_id($identity), ['restoredTables' => $backup['restoredTables']]);
        $authManager->logout();
        JsonResponse::success(['backup' => $backup]);
    } catch (Throwable $exception) {
        JsonResponse::error('Backup restore was rejected.', 400);
    }
}

if ($route === 'backups' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'settings.read', false, $headers);
    JsonResponse::success([
        'backups' => [],
        'status' => 'not_configured',
    ]);
}

if ($route === 'admin/backup' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'settings.read', false, $headers);
    JsonResponse::success([
        'backups' => [],
        'status' => 'not_configured',
    ]);
}

if ($route === 'admin/updates' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'settings.read', false, $headers);
    JsonResponse::success([
        'updates' => [
            'status' => 'current',
            'available' => [],
        ],
    ]);
}

if ($route === 'updates' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'settings.read', false, $headers);
    JsonResponse::success([
        'updates' => [
            'status' => 'current',
            'available' => [],
        ],
    ]);
}

JsonResponse::error('Not found', 404, ['route' => $route, 'method' => $method]);

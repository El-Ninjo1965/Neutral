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
use Neutral\Core\ModuleContract;
use Neutral\Core\ModuleServerRegistry;
use Neutral\Core\ModuleHttpKernel;
use Neutral\Core\ModuleHttpException;
use Neutral\Core\Security;
use Neutral\Core\LoginRateLimiter;
use Neutral\Core\PdoLoginAttemptStore;
use Neutral\Core\FallbackLoginAttemptStore;
use Neutral\Core\FileLoginAttemptStore;
use Neutral\Core\DatabaseBackupService;
use Neutral\Core\BackupRuntimeException;
use Neutral\Core\SchemaMigrator;
use Neutral\Core\AccountLicenseService;
use Neutral\Core\AuthRuntimeException;

$runtime = neutral_bootstrap();
$config = $runtime->config();
$database = $runtime->database();

// Deployed Core schema follows the deployed application revision. Migrations
// are additive/idempotent and must complete before any route uses new tables.
$schemaMigrator = new SchemaMigrator($database);
try {
    if ($schemaMigrator->status()['pending'] !== []) $schemaMigrator->migrate();
} catch (Throwable $exception) {
    // Setup/readiness routes must remain able to report an unavailable database.
}

$store = new Phase4JsonStore($runtime->projectRoot() . '/Server/runtime/config');
$roleService = new Phase4RoleService($store, $database);
$permissionService = new Phase4PermissionService($database);
$userService = new Phase4UserService($store, $roleService, $config, $database);
$settingsService = new Phase6SettingsService($database, new Phase4SettingsService($store));
$auditService = new Phase6AuditService($database, $store);
$moduleRuntime = new Phase7ModuleRuntime($database, $runtime->projectRoot());
$sessionRegistry = new Phase4SessionRegistry(new Phase4JsonStore($runtime->projectRoot() . '/Server/runtime'), $database);
$authManager = new Phase4AuthManager($config, $userService, $roleService, $sessionRegistry);
$accountLicenseService = new AccountLicenseService($database);
$moduleServerRegistry = new ModuleServerRegistry(
    $runtime->projectRoot(),
    new ModuleContract(),
    ['database' => $database, 'runtime' => $runtime]
);
$moduleHttpKernel = new ModuleHttpKernel(
    $moduleServerRegistry,
    static fn (string $moduleId): ?array => $moduleRuntime->getForAdmin($moduleId),
    static fn (array $moduleIdentity, string $permission): bool => $authManager->hasPermission($moduleIdentity, $permission),
    static function (?string $provided): void {
        Security::assertValidCsrfToken($provided);
    }
);

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
        'lastActivityAt' => $user['lastActivityAt'] ?? '',
        'usedDevices' => $user['usedDevices'] ?? 0,
        'allowedDevices' => $user['allowedDevices'] ?? 5,
        'licenseId' => $user['licenseId'] ?? '',
        'packageName' => $user['packageName'] ?? '',
        'deviceLimitSource' => $user['deviceLimitSource'] ?? 'system_default',
    ];
}

function identity_user_id(?array $identity): int
{
    $id = (string) ($identity['userId'] ?? '');
    if ($id === '' || !ctype_digit($id) || (int) $id < 1) JsonResponse::error('Authenticated user required.', 401);
    return (int) $id;
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

function configured_backup_storage_path(Phase6SettingsService $settingsService): ?string
{
    $snapshot=$settingsService->getAll();$settings=is_array($snapshot['settings']??null)?$snapshot['settings']:[];$path=trim((string)($settings['backupStoragePath']??''));
    return $path===''?null:$path;
}

function configured_backup_service($runtime,AppConfig $config,Phase6SettingsService $settingsService): DatabaseBackupService
{
    return new DatabaseBackupService($runtime->database(),new SchemaMigrator($runtime->database()),$config,$runtime->projectRoot(),null,null,configured_backup_storage_path($settingsService));
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
$sessionScope = 'user';
if (str_starts_with((string) ($route ?? ''), 'admin/')) {
    $sessionScope = 'admin';
} else {
    $roleHeader = strtolower(trim((string) ($headers['x-framework-role'] ?? $headers['x-user-role'] ?? $headers['x-admin-role'] ?? '')));
    if ($roleHeader !== '') {
        foreach (explode(',', $roleHeader) as $role) {
            $value = strtolower(trim((string) $role));
            if ($value === 'admin' || $value === 'developer') {
                $sessionScope = 'admin';
                break;
            }
        }
    }
}
$identity = $authManager->resolveIdentity($headers, $sessionScope);
try {
    $presenceUserId = (string) ($identity['userId'] ?? '');
    $accountLicenseService->recordInstallation(
        strtolower(trim((string) ($headers['x-neutral-device-id'] ?? ''))),
        ctype_digit($presenceUserId) && (int) $presenceUserId > 0 ? (int) $presenceUserId : null
    );
} catch (Throwable $exception) {
    // Presence metrics must never block the requested operation.
}

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

if ($route === 'system/readiness' && $method === 'GET') {
    try {
        $migration = (new SchemaMigrator($database))->status();
        JsonResponse::success(['readiness' => ['database' => true, 'migrationsReady' => $migration['pending'] === [], 'pendingMigrationCount' => count($migration['pending'])]]);
    } catch (Throwable $exception) {
        JsonResponse::success(['readiness' => ['database' => false, 'migrationsReady' => false, 'pendingMigrationCount' => null]]);
    }
}

if (($route === 'auth/login' || $route === 'admin/auth/login') && $method === 'POST') {
    $payload = parse_json_body();
    $username = trim((string) ($payload['username'] ?? ''));
    $password = (string) ($payload['password'] ?? '');
    $clientIp = trim((string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    $authStage = 'throttle';
    try {
        // Schema readiness is handled once during API bootstrap. Re-running the
        // migrator for every login needlessly requires a database advisory lock
        // and turns otherwise valid authentication into a generic 503 on hosts
        // where GET_LOCK is unavailable or temporarily contended.
        $loginLimiter = new LoginRateLimiter(
            new FallbackLoginAttemptStore(
                new PdoLoginAttemptStore($runtime->database()),
                new FileLoginAttemptStore($runtime->projectRoot() . '/Server/runtime/login-attempts.json')
            ),
            static fn (): int => time(),
            $config->loginRateLimit()
        );
        $rateState = $loginLimiter->check($username, $clientIp);
        if (!$rateState['allowed']) {
            header('Retry-After: ' . max(1, $rateState['retryAfter']));
            JsonResponse::error('Too many failed login attempts. Try again later.', 429);
        }
        $authStage = 'authentication';
        $result = $authManager->authenticate(
            $username,
            $password,
            $sessionScope,
            strtolower(trim((string) ($headers['x-neutral-device-id'] ?? ''))),
            trim((string) ($headers['x-neutral-device-label'] ?? '')),
            trim((string) ($headers['x-neutral-client-platform'] ?? ''))
        );
        if (!$result) {
            $authStage = 'throttle-write';
            $rateState = $loginLimiter->registerFailure($username, $clientIp);
            if (!$rateState['allowed']) {
                header('Retry-After: ' . max(1, $rateState['retryAfter']));
                JsonResponse::error('Too many failed login attempts. Try again later.', 429);
            }
        } else {
            $authStage = 'throttle-write';
            try {
                $loginLimiter->registerSuccess($username, $clientIp);
            } catch (\Throwable $exception) {
                // Clearing stale throttle counters is non-critical after the
                // identity and durable session were established successfully.
            }
        }
    } catch (\Throwable $exception) {
        if ($exception->getMessage() === 'Active device limit reached. Revoke another device session in Admin before adding this device.') {
            JsonResponse::error($exception->getMessage(), 409, ['code' => 'DEVICE_LIMIT_REACHED']);
        }
        $errorCode = $exception instanceof AuthRuntimeException ? $exception->safeCode() : match ($authStage) {
            'throttle', 'throttle-write' => 'AUTH_THROTTLE_UNAVAILABLE',
            'authentication' => 'AUTH_SESSION_OR_IDENTITY_UNAVAILABLE',
            default => 'AUTH_SERVICE_UNAVAILABLE',
        };
        JsonResponse::error('Authentication service temporarily unavailable.', 503, [
            'code' => $errorCode,
            'correlationId' => bin2hex(random_bytes(8)),
        ]);
    }
    if (!$result) {
        JsonResponse::error('Invalid username or password.', 401);
    }

    setcookie(
        $authManager->csrfCookieNameForScope($sessionScope),
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

if (($route === 'auth/logout' || $route === 'admin/auth/logout') && $method === 'POST') {
    if (!$identity || (($identity['via'] ?? '') !== 'session')) {
        JsonResponse::error('Not authenticated.', 401);
    }
    $authManager->startSession($sessionScope);
    try {
        Security::assertValidCsrfToken(is_string($headers['x-csrf-token'] ?? null) ? $headers['x-csrf-token'] : null);
    } catch (Throwable $exception) {
        JsonResponse::error('Invalid CSRF token.', 403, ['code' => 'CSRF_INVALID']);
    }
    $authManager->logout();
    setcookie(
        $authManager->csrfCookieNameForScope($sessionScope),
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

if (($route === 'auth/me' || $route === 'admin/auth/me') && $method === 'GET') {
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

if ($route === 'account/profile' && $method === 'GET') {
    if (!$identity || (($identity['via'] ?? '') !== 'session')) JsonResponse::error('User session required.', 401);
    JsonResponse::success(['profile' => $accountLicenseService->profile(identity_user_id($identity))]);
}

if ($route === 'account/profile' && $method === 'PUT') {
    if (!$identity || (($identity['via'] ?? '') !== 'session')) JsonResponse::error('User session required.', 401);
    try { Security::assertValidCsrfToken((string)($headers['x-csrf-token'] ?? '')); } catch (Throwable $exception) { JsonResponse::error('Invalid CSRF token.', 403); }
    try { JsonResponse::success(['profile' => $accountLicenseService->updateProfile(identity_user_id($identity), parse_json_body())]); }
    catch (RuntimeException $exception) { JsonResponse::error($exception->getMessage(), 422); }
}

if ($route === 'account/password' && $method === 'POST') {
    if (!$identity || (($identity['via'] ?? '') !== 'session')) JsonResponse::error('User session required.', 401);
    try {
        Security::assertValidCsrfToken((string)($headers['x-csrf-token'] ?? ''));
        $payload = parse_json_body();
        $accountLicenseService->changePassword(identity_user_id($identity), (string)($payload['currentPassword'] ?? ''), (string)($payload['newPassword'] ?? ''));
    } catch (RuntimeException $exception) {
        JsonResponse::error($exception->getMessage(), 422);
    }
    JsonResponse::success(['changed' => true]);
}

if ($route === 'admin/installations/metrics' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'admin.read', false, $headers);
    JsonResponse::success(['metrics' => $accountLicenseService->installationMetrics()]);
}

if ($route === 'license/users' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'license.manage', false, $headers);
    JsonResponse::success(['users'=>$accountLicenseService->organizationUsers(identity_user_id($identity))]);
}

if ($route === 'admin/packages' && $method === 'GET') { require_admin_session_permission_or_fail($identity,$authManager,'admin.read',$headers,false);JsonResponse::success(['packages'=>$accountLicenseService->packages()]); }
if ($route === 'admin/packages' && $method === 'POST') { require_admin_session_permission_or_fail($identity,$authManager,'admin.write',$headers);try{$package=$accountLicenseService->savePackage(null,parse_json_body());}catch(PDOException $exception){JsonResponse::error('Package could not be saved. The key may already be in use.',409);}catch(RuntimeException $exception){JsonResponse::error($exception->getMessage(),422);}$auditService->log('package.create','package',(string)$package['id'],actor_user_id($identity),[]);JsonResponse::success(['package'=>$package],201); }
if (preg_match('#^admin/packages/(\d+)$#',$route,$matches)===1 && $method==='PUT') { require_admin_session_permission_or_fail($identity,$authManager,'admin.write',$headers);try{$package=$accountLicenseService->savePackage((int)$matches[1],parse_json_body());}catch(PDOException $exception){JsonResponse::error('Package could not be saved. The key may already be in use.',409);}catch(RuntimeException $exception){JsonResponse::error($exception->getMessage(),422);}$auditService->log('package.update','package',$matches[1],actor_user_id($identity),[]);JsonResponse::success(['package'=>$package]); }
if (preg_match('#^admin/packages/(\d+)$#',$route,$matches)===1 && $method==='DELETE') { require_admin_session_permission_or_fail($identity,$authManager,'admin.write',$headers);$accountLicenseService->deletePackage((int)$matches[1]);$auditService->log('package.delete','package',$matches[1],actor_user_id($identity),[]);JsonResponse::success(['deleted'=>true]); }
if ($route === 'admin/licenses' && $method === 'GET') { require_admin_session_permission_or_fail($identity,$authManager,'admin.read',$headers,false);JsonResponse::success(['licenses'=>$accountLicenseService->licenses()]); }
if ($route === 'admin/licenses' && $method === 'POST') { require_admin_session_permission_or_fail($identity,$authManager,'admin.write',$headers);try{$license=$accountLicenseService->saveLicense(null,parse_json_body());}catch(PDOException $exception){JsonResponse::error('License could not be saved. Check that its key, package and manager are valid.',409);}catch(RuntimeException $exception){JsonResponse::error($exception->getMessage(),422);}$auditService->log('license.create','license',(string)$license['id'],actor_user_id($identity),[]);JsonResponse::success(['license'=>$license],201); }
if (preg_match('#^admin/licenses/(\d+)$#',$route,$matches)===1 && $method==='PUT') { require_admin_session_permission_or_fail($identity,$authManager,'admin.write',$headers);try{$license=$accountLicenseService->saveLicense((int)$matches[1],parse_json_body());}catch(PDOException $exception){JsonResponse::error('License could not be saved. Check that its key, package and manager are valid.',409);}catch(RuntimeException $exception){JsonResponse::error($exception->getMessage(),422);}$auditService->log('license.update','license',$matches[1],actor_user_id($identity),[]);JsonResponse::success(['license'=>$license]); }
if (preg_match('#^admin/licenses/(\d+)$#',$route,$matches)===1 && $method==='DELETE') {
    require_admin_session_permission_or_fail($identity,$authManager,'admin.write',$headers);$pdo=$database->connect();$pdo->beginTransaction();
    try{$deletedLicense=$accountLicenseService->deleteLicense((int)$matches[1]);$auditService->log('license.delete','license',$deletedLicense['id'],actor_user_id($identity),['licenseKey'=>$deletedLicense['key']]);$pdo->commit();}
    catch(PDOException $exception){if($pdo->inTransaction())$pdo->rollBack();JsonResponse::error('License could not be deleted because it is still referenced.',409);}
    catch(RuntimeException $exception){if($pdo->inTransaction())$pdo->rollBack();$status=$exception->getMessage()==='License not found.'?404:409;JsonResponse::error($exception->getMessage(),$status);}
    JsonResponse::success(['deleted'=>true]);
}

if ($route === 'license/users' && $method === 'POST') {
    require_permission_or_fail($identity, $authManager, 'license.manage', true, $headers);
    $payload=parse_json_body();
    // Delegated managers create ordinary members only; role/core permission
    // assignment remains a global administrator capability.
    $payload['role']='user'; $payload['roles']=['user']; $payload['status']='active';
    $created=$userService->create($payload);
    $accountLicenseService->assignUser(identity_user_id($identity),(int)$created['id'],isset($payload['allowedDevices'])?(int)$payload['allowedDevices']:null);
    JsonResponse::success(['user'=>$created],201);
}

if (preg_match('#^license/users/(\d+)$#', $route, $matches) === 1 && $method === 'PATCH') {
    require_permission_or_fail($identity, $authManager, 'license.manage', true, $headers);
    $payload=parse_json_body(); $accountLicenseService->setMembershipStatus(identity_user_id($identity),(int)$matches[1],(string)($payload['status']??''));
    $auditService->log('license.user.status', 'license-user', $matches[1], actor_user_id($identity), ['status'=>(string)($payload['status']??'')]);
    JsonResponse::success(['updated'=>true]);
}
if (preg_match('#^license/users/(\d+)$#', $route, $matches) === 1 && $method === 'DELETE') {
    require_permission_or_fail($identity, $authManager, 'license.manage', true, $headers);
    $accountLicenseService->removeMembership(identity_user_id($identity),(int)$matches[1]);
    $auditService->log('license.user.remove', 'license-user', $matches[1], actor_user_id($identity), []);
    JsonResponse::success(['removed'=>true]);
}
if ($route === 'license/devices' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'license.manage', false, $headers);
    $target=isset($_GET['userId'])?(int)$_GET['userId']:null;
    JsonResponse::success(['devices'=>$accountLicenseService->organizationDevices(identity_user_id($identity),$target)]);
}
if (preg_match('#^license/users/(\d+)/devices/([^/]+)/revoke$#', $route, $matches) === 1 && $method === 'POST') {
    require_permission_or_fail($identity, $authManager, 'license.manage', true, $headers);
    $accountLicenseService->revokeOrganizationDevice(identity_user_id($identity),(int)$matches[1],rawurldecode($matches[2]));
    $auditService->log('license.device.revoke', 'license-device', rawurldecode($matches[2]), actor_user_id($identity), ['userId'=>$matches[1]]);
    JsonResponse::success(['revoked'=>true]);
}

$mediaStorageRoot=$runtime->projectRoot().'/Server/runtime/user-media';
if ($route === 'account/media' && $method === 'GET') {
    if (!$identity || (($identity['via']??'')!=='session')) JsonResponse::error('User session required.',401);
    JsonResponse::success(['media'=>$accountLicenseService->userMedia(identity_user_id($identity))]);
}
if ($route === 'account/media' && $method === 'POST') {
    require_permission_or_fail($identity,$authManager,'profile.media.upload',true,$headers);
    $bytes=file_get_contents('php://input');
    try { $media=$accountLicenseService->createMedia(identity_user_id($identity),is_string($bytes)?$bytes:'',$mediaStorageRoot); }
    catch (RuntimeException $exception) { JsonResponse::error($exception->getMessage(),422); }
    $auditService->log('media.upload','media',(string)$media['id'],actor_user_id($identity),['status'=>'pending']);
    JsonResponse::success(['media'=>$media],201);
}
if (preg_match('#^media/(\d+)$#',$route,$matches)===1 && $method==='GET') {
    try { $delivery=$accountLicenseService->mediaDelivery((int)$matches[1],actor_user_id($identity),$authManager->hasPermission($identity,'media.moderate'),$mediaStorageRoot); }
    catch (RuntimeException $exception) { JsonResponse::error('Media not found.',404); }
    if (!is_file($delivery['path'])) JsonResponse::error('Media not found.',404);
    header('Content-Type: '.$delivery['mimeType']); header('Content-Length: '.(string)filesize($delivery['path'])); header('X-Content-Type-Options: nosniff'); header('Cache-Control: private, no-store'); readfile($delivery['path']); exit;
}
if (preg_match('#^admin/media/(\d+)/(approve|reject|delete)$#',$route,$matches)===1 && $method==='POST') {
    require_permission_or_fail($identity,$authManager,'media.moderate',true,$headers);$payload=parse_json_body();
    try{$media=$accountLicenseService->moderateMedia(identity_user_id($identity),(int)$matches[1],$matches[2],(string)($payload['reason']??''),(string)($payload['note']??''));}catch(RuntimeException $exception){JsonResponse::error($exception->getMessage(),422);}
    $auditService->log('media.'.$matches[2],'media',$matches[1],actor_user_id($identity),['status'=>$media['status']]);JsonResponse::success(['media'=>$media]);
}

if ($route === 'modules' && $method === 'GET') {
    $databaseConfig = $config->database();
    $databaseConfigured = trim((string) ($databaseConfig['url'] ?? '')) !== ''
        || (
            trim((string) ($databaseConfig['host'] ?? '')) !== ''
            && trim((string) ($databaseConfig['name'] ?? '')) !== ''
            && trim((string) ($databaseConfig['user'] ?? '')) !== ''
        );
    $clientIdentity = $identity;
    if ($clientIdentity === null && $databaseConfigured) {
        $clientIdentity = [
            'anonymous' => true,
            'permissions' => $roleService->permissionsForRoles(['viewer']),
        ];
    }
    $clientModules=$databaseConfigured && $clientIdentity !== null ? $moduleRuntime->listForClient($clientIdentity) : [];
    if($identity){$entitlements=$accountLicenseService->moduleEntitlementsForUser(identity_user_id($identity));if($entitlements!==[])$clientModules=array_values(array_filter(array_map(static function(array $module)use($entitlements):array{$state=(string)($entitlements[$module['id']]??'hidden');$module['entitlementState']=in_array($state,['available','locked','hidden'],true)?$state:'hidden';return $module;},$clientModules),static fn(array $module):bool=>$module['entitlementState']!=='hidden'));}
    JsonResponse::success([
        'modules' => $clientModules,
        'accessContext' => [
            'mode' => $identity ? 'authenticated' : 'anonymous',
        ],
    ]);
}

if (str_starts_with($route, 'modules/')) {
    try {
        $moduleResult = $moduleHttpKernel->dispatch(
            $route,
            $method,
            $identity,
            $headers,
            $method === 'GET' ? [] : parse_json_body(),
            $_GET
        );
        if ($moduleResult !== null) {
            JsonResponse::success($moduleResult['data'], $moduleResult['status']);
        }
    } catch (ModuleHttpException $exception) {
        JsonResponse::error($exception->getMessage(), $exception->status(), ['code' => $exception->errorCode()]);
    }
}

if ($route === 'admin/sessions' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'session.read', false, $headers);
    JsonResponse::success(['sessions' => $authManager->listSessions()]);
}

if ($route === 'admin/sessions/invalidate' && $method === 'POST') {
    require_permission_or_fail($identity, $authManager, 'session.write', true, $headers);
    $payload = parse_json_body();
    $authManager->invalidateSession((string) ($payload['sessionId'] ?? ''));
    JsonResponse::success(['message' => 'Session invalidated.']);
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
    if(array_key_exists('licenseId',$payload))$accountLicenseService->assignUserToLicense((int)$created['id'],$payload['licenseId']===''?null:(int)$payload['licenseId'],$payload['allowedDevices']??'default');
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
        if(array_key_exists('licenseId',$payload))$accountLicenseService->assignUserToLicense((int)$userId,$payload['licenseId']===''?null:(int)$payload['licenseId'],$payload['allowedDevices']??'default');
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

if ($route === 'settings/homepage' && $method === 'GET') {
    $settings = $settingsService->getAll();
    JsonResponse::success(['homepage' => $settings['homepage'] ?? []]);
}

if ($route === 'settings/appearance' && $method === 'GET') {
    $settings = $settingsService->getAll();
    JsonResponse::success(['appearance' => $settings['appearance'] ?? \Neutral\Core\UserUiDesign::defaults()]);
}

if ($route === 'settings/maintenance' && $method === 'GET') {
    $statement = $database->connect()->query('SELECT maintenance_mode, maintenance_reason, checked_at FROM release_state WHERE id = 1');
    $state = $statement ? $statement->fetch(PDO::FETCH_ASSOC) : false;
    JsonResponse::success(['maintenance' => [
        'active' => is_array($state) && (int) ($state['maintenance_mode'] ?? 0) === 1,
        'reason' => is_array($state) ? (string) ($state['maintenance_reason'] ?? '') : '',
        'updatedAt' => is_array($state) ? (string) ($state['checked_at'] ?? '') : '',
    ]]);
}

if ($route === 'admin/settings' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'settings.read', false, $headers);
    JsonResponse::success(['settings' => $settingsService->getAll()]);
}

if ($route === 'admin/settings' && $method === 'POST') {
    require_permission_or_fail($identity, $authManager, 'settings.write', true, $headers);
    $payload = parse_json_body();
    $before = $settingsService->getAll();
    $updated = $settingsService->update($payload, actor_user_id($identity));
    if ($updated !== $before) {
        $changedFields = [];
        foreach (['appName', 'homepage', 'appearance', 'settings'] as $field) {
            if (($before[$field] ?? null) !== ($updated[$field] ?? null)) $changedFields[] = $field;
        }
        $auditService->log('settings.update', 'settings', 'core', actor_user_id($identity), [
            'changedFields' => $changedFields,
            'before' => ['appName' => (string) ($before['appName'] ?? '')],
            'after' => ['appName' => (string) ($updated['appName'] ?? '')],
        ]);
    }
    JsonResponse::success(['settings' => $updated]);
}

if ($route === 'admin/audit' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'audit.read', false, $headers);
    $filters = [
        'action' => (string) ($_GET['action'] ?? ''),
        'resource' => (string) ($_GET['resource'] ?? ''),
        'result' => (string) ($_GET['result'] ?? ''),
        'user' => (string) ($_GET['user'] ?? ''),
        'from' => (string) ($_GET['from'] ?? ''),
        'to' => (string) ($_GET['to'] ?? ''),
        'limit' => (int) ($_GET['limit'] ?? 100),
    ];
    JsonResponse::success([
        'entries' => $auditService->list($filters),
        'allowClearAll' => $authManager->hasPermission($identity, 'audit.clear'),
    ]);
}

if ($route === 'admin/audit/clear' && $method === 'POST') {
    require_admin_session_permission_or_fail($identity, $authManager, 'audit.clear', $headers);
    $confirmation=parse_json_body()['confirmed']??false;
    if($confirmation!==true)JsonResponse::error('Two-step confirmation is required.',422);
    $statement = $database->connect()->query('SELECT COUNT(*) FROM audit_log');
    $count = $statement ? (int) $statement->fetchColumn() : 0;
    $pdo=$database->connect();$pdo->beginTransaction();
    try{$deleted=$pdo->exec('DELETE FROM audit_log');$auditService->log('audit.clear.completed','audit',null,actor_user_id($identity),['entriesDeleted'=>$deleted===false?0:$deleted,'actorUsername'=>(string)($identity['username']??'')]);$pdo->commit();}catch(Throwable $exception){if($pdo->inTransaction())$pdo->rollBack();throw $exception;}
    JsonResponse::success(['deleted' => $deleted === false ? 0 : $deleted]);
}

if ($route === 'admin/audit/purge' && $method === 'POST') {
    require_admin_session_permission_or_fail($identity, $authManager, 'admin.write', $headers);
    $days = (int) (parse_json_body()['retentionDays'] ?? 90);
    if (!in_array($days, [30, 90, 180, 365], true)) JsonResponse::error('Unsupported audit retention.', 400);
    $auditService->log('audit.retention.purge', 'audit', null, actor_user_id($identity), ['retentionDays' => $days]);
    $statement = $database->connect()->prepare('DELETE FROM audit_log WHERE created_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL :days DAY)');
    $statement->bindValue(':days', $days, PDO::PARAM_INT);
    $statement->execute();
    JsonResponse::success(['purged' => $statement->rowCount(), 'retentionDays' => $days]);
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
        if ($exception->getMessage() === 'Module is already registered; use update.') {
            JsonResponse::error($exception->getMessage(), 409, ['moduleId' => $matches[1]]);
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
        if (in_array($exception->getMessage(), ['Module downgrade is not allowed.', 'Module update is required before activation.', 'Module installed version is unavailable.'], true)) {
            JsonResponse::error($exception->getMessage(), 409, ['moduleId' => $matches[1]]);
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

if (preg_match('#^admin/modules/([a-z0-9\-]+)/update$#', $route, $matches) === 1 && $method === 'POST') {
    $module = $moduleRuntime->getForAdmin($matches[1]);
    if ($module === null) {
        JsonResponse::error('Module not found.', 404, ['moduleId' => $matches[1]]);
    }
    require_any_permission_or_fail($identity, $authManager, array_values(array_unique(array_merge(['role.write'], module_access_permissions($module, 'adminPermissions')))), true, $headers);
    try {
        $module = $moduleRuntime->update($matches[1], actor_user_id($identity));
    } catch (RuntimeException $exception) {
        if (in_array($exception->getMessage(), ['Module not registered.', 'Module not discovered.'], true)) {
            JsonResponse::error($exception->getMessage(), 404, ['moduleId' => $matches[1]]);
        }
        if (in_array($exception->getMessage(), ['Module must be inactive before update.', 'Module downgrade is not allowed.', 'Module installed version is unavailable.'], true)) {
            JsonResponse::error($exception->getMessage(), 409, ['moduleId' => $matches[1]]);
        }
        throw $exception;
    }
    $auditService->log('module.update', 'module', (string) ($module['id'] ?? $matches[1]), actor_user_id($identity), [
        'version' => (string) ($module['installedVersion'] ?? $module['version'] ?? ''),
        'status' => (string) ($module['status'] ?? 'inactive'),
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

if ($route === 'admin/settings' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'settings.read', false, $headers);
    JsonResponse::success($settingsService->getAll());
}

if ($route === 'admin/settings' && $method === 'POST') {
    require_admin_session_permission_or_fail($identity, $authManager, 'settings.write', $headers);
    try {
        $payload = parse_json_body();
        $updated = $settingsService->update($payload, actor_user_id($identity));
        JsonResponse::success(['settings' => $updated], 200);
    } catch (Throwable $exception) {
        JsonResponse::error($exception->getMessage(), 400, ['code' => 'SETTINGS_INVALID']);
    }
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
    $statement = $database->connect()->query('SELECT version, environment, status, maintenance_mode, maintenance_reason, checked_at FROM release_state WHERE id = 1');
    $state = $statement ? $statement->fetch(PDO::FETCH_ASSOC) : false;
    $manifest = [];
    $manifestPath = $runtime->projectRoot() . '/manifest.json';
    if (is_readable($manifestPath)) {
        $decodedManifest = json_decode((string) file_get_contents($manifestPath), true);
        $manifest = is_array($decodedManifest) ? $decodedManifest : [];
    }
    JsonResponse::success([
        'release' => [
            'status' => is_array($state) && (int) ($state['maintenance_mode'] ?? 0) === 1 ? 'maintenance' : 'operational',
            'version' => (string) ($manifest['appVersion'] ?? (is_array($state) ? ($state['version'] ?? '') : '')),
            'commit' => substr((string) ($manifest['sourceCommit'] ?? ''), 0, 12),
            'buildAt' => (string) ($manifest['generatedAt'] ?? ''),
            'maintenanceMode' => is_array($state) && (int) ($state['maintenance_mode'] ?? 0) === 1,
            'reason' => is_array($state) ? (string) ($state['maintenance_reason'] ?? '') : '',
            'updateActionsSupported' => false,
        ],
    ]);
}

if ($route === 'admin/release/maintenance' && $method === 'POST') {
    require_admin_session_permission_or_fail($identity, $authManager, 'settings.write', $headers);
    $payload = parse_json_body();
    $active = !empty($payload['maintenanceMode']);
    $reason = trim((string) ($payload['reason'] ?? ''));
    if (strlen($reason) > 500) JsonResponse::error('Maintenance reason is too long.', 400);
    $statement = $database->connect()->prepare("INSERT INTO release_state (id, version, environment, status, maintenance_mode, maintenance_reason, checks_json, checked_at) VALUES (1, '1.0.0', :environment, 'release-information-only', :active, :reason, '{}', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE maintenance_mode=VALUES(maintenance_mode), maintenance_reason=VALUES(maintenance_reason), checked_at=CURRENT_TIMESTAMP");
    $statement->execute([':environment' => $config->environment(), ':active' => $active ? 1 : 0, ':reason' => $reason]);
    $auditService->log('maintenance.update', 'release', '1', actor_user_id($identity), ['active' => $active]);
    JsonResponse::success(['maintenanceMode' => $active, 'reason' => $reason]);
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
    try { $connectionReady = $database->ping(); } catch (Throwable $exception) { $connectionReady = false; }
    JsonResponse::success([
        'connections' => [[
            'id' => 'primary-database', 'name' => 'Primary database', 'type' => 'database_mysql',
            'status' => $connectionReady ? 'ready' : 'unavailable', 'source' => 'Runtime configuration',
        ]],
    ]);
}

if ($route === 'admin/backups/path/test' && $method === 'POST') {
    require_admin_session_permission_or_fail($identity,$authManager,'backups.manage',$headers);
    try{$path=(string)(parse_json_body()['path']??'');$result=DatabaseBackupService::testDirectory($path,$runtime->projectRoot(),(string)($_SERVER['DOCUMENT_ROOT']??''));JsonResponse::success(['pathTest'=>$result]);}
    catch(RuntimeException $exception){JsonResponse::error('Backup storage path must be an absolute safe server path.',422);}
}

if ($route === 'admin/backups/path' && $method === 'POST') {
    require_admin_session_permission_or_fail($identity,$authManager,'backups.manage',$headers);
    try{$path=DatabaseBackupService::normalizeConfiguredDirectory((string)(parse_json_body()['path']??''));$current=$settingsService->getAll();$options=is_array($current['settings']??null)?$current['settings']:[];$options['backupStoragePath']=$path;$settingsService->update(['settings'=>$options],actor_user_id($identity));$auditService->log('backup.storage.update','backup-storage',null,actor_user_id($identity),[]);JsonResponse::success(['saved'=>true,'path'=>$path]);}
    catch(RuntimeException $exception){JsonResponse::error('Backup storage path must be an absolute safe server path.',422);}
}

if ($route === 'connections' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'settings.read', false, $headers);
    JsonResponse::success([
        'connections' => [], 'status' => 'Admin-only registry',
    ]);
}

if ($route === 'admin/backups' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'backups.view', false, $headers);
    try {
        $backupService = configured_backup_service($runtime,$config,$settingsService);
        $automaticStatePath = $runtime->projectRoot() . '/Server/runtime/config/.automatic-backup-state.json';
        $automaticState = is_file($automaticStatePath) ? json_decode((string) file_get_contents($automaticStatePath), true) : [];
        JsonResponse::success([
            'backups' => $backupService->list(),
            'status' => 'available',
            'automation' => [
                'scheduler' => 'external-cron-required',
                'lastSuccess' => is_array($automaticState) ? ($automaticState['lastSuccess'] ?? null) : null,
                'lastError' => is_array($automaticState) ? ($automaticState['lastError'] ?? null) : null,
            ],
        ]);
    } catch (BackupRuntimeException $exception) {
        JsonResponse::error('Backup prerequisites are not ready.', 503, ['code' => $exception->safeCode()]);
    } catch (Throwable $exception) {
        JsonResponse::error('Backup database prerequisites are not ready.', 503, ['code' => 'BACKUP_DATABASE_UNAVAILABLE']);
    }
}

if ($route === 'admin/backups' && $method === 'POST') {
    require_admin_session_permission_or_fail($identity, $authManager, 'backups.manage', $headers);
    try {
        $backupService = configured_backup_service($runtime,$config,$settingsService);
        $backup = $backupService->create();
        $settings = $settingsService->getAll();
        $retention = max(1, min(100, (int) ($settings['settings']['backupRetention'] ?? 14)));
        $backupService->enforceRetention($retention);
        $auditService->log('backup.create', 'backup', $backup['backupId'], actor_user_id($identity), ['size' => $backup['size']]);
        JsonResponse::success(['backup' => $backup], 201);
    } catch (BackupRuntimeException $exception) {
        JsonResponse::error('Backup could not be created because a runtime prerequisite is unavailable.', 503, ['code' => $exception->safeCode()]);
    } catch (Throwable $exception) {
        JsonResponse::error('Backup export could not be completed.', 503, ['code' => 'BACKUP_EXPORT_FAILED']);
    }
}

if ($route === 'admin/backups/readiness' && $method === 'GET') {
    require_permission_or_fail($identity, $authManager, 'backups.view', false, $headers);
    $checks = ['keyConfigured' => strlen($config->backupKey()) >= 32, 'cryptoAvailable' => function_exists('openssl_encrypt'), 'databaseReady' => false, 'managedTablesReady' => false, 'storageReady' => false];
    try {
        $checks['databaseReady'] = $database->ping();
        $migrator = new SchemaMigrator($database);
        $checks['managedTablesReady'] = $migrator->status()['pending'] === [];
    } catch (Throwable $exception) { /* Boolean-only safe projection. */ }
    $configuredPath=configured_backup_storage_path($settingsService);
    if($configuredPath===null){$backupDir=$runtime->projectRoot().'/Server/runtime/backups';$parent=dirname($backupDir);$checks['storageReady']=(is_dir($backupDir)&&is_writable($backupDir))||(!is_dir($backupDir)&&is_dir($parent)&&is_writable($parent));$checks['storageStatus']=$checks['storageReady']?'protected_default':'not_writable';}
    else{try{$pathTest=DatabaseBackupService::testDirectory($configuredPath,$runtime->projectRoot(),(string)($_SERVER['DOCUMENT_ROOT']??''));$checks['storageReady']=$pathTest['status']==='ready';$checks['storageStatus']=$pathTest['status'];}catch(Throwable $exception){$checks['storageStatus']='invalid';}}
    $checks['storagePath']=$configuredPath??'';
    JsonResponse::success(['readiness'=>$checks]);
}

if (preg_match('#^admin/backups/([a-f0-9]{32})$#', $route, $backupMatches) === 1 && $method === 'DELETE') {
    require_admin_session_permission_or_fail($identity, $authManager, 'backups.manage', $headers);
    try {
        $backupService = configured_backup_service($runtime,$config,$settingsService);
        $backupService->delete($backupMatches[1]);
        $auditService->log('backup.delete', 'backup', $backupMatches[1], actor_user_id($identity));
        JsonResponse::success(['deleted' => true]);
    } catch (Throwable $exception) { JsonResponse::error('Backup delete was rejected.', 400); }
}

if ($route === 'admin/backups/upload' && $method === 'POST') {
    require_admin_session_permission_or_fail($identity, $authManager, 'backups.manage', $headers);
    $contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($contentLength > 100 * 1024 * 1024) {
        JsonResponse::error('Backup upload is too large.', 413);
    }
    try {
        $backupService = configured_backup_service($runtime,$config,$settingsService);
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
        $backupService = configured_backup_service($runtime,$config,$settingsService);
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
        $backupService = configured_backup_service($runtime,$config,$settingsService);
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

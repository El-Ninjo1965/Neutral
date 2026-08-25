<?php
declare(strict_types=1);

namespace Neutral\Core;

final class Phase4AuthRbac
{
    public const PERMISSIONS = [
        'admin.read',
        'admin.write',
        'auth.read',
        'auth.write',
        'user.read',
        'user.write',
        'role.read',
        'role.write',
        'settings.read',
        'settings.write',
        'session.read',
    ];

    /** @var array<string, list<string>> */
    public const ROLE_PERMISSIONS = [
        'admin' => [
            'admin.read',
            'admin.write',
            'auth.read',
            'auth.write',
            'user.read',
            'user.write',
            'role.read',
            'role.write',
            'settings.read',
            'settings.write',
            'session.read',
        ],
        'developer' => [
            'admin.read',
            'auth.read',
            'user.read',
            'user.write',
            'role.read',
            'settings.read',
            'settings.write',
            'session.read',
        ],
        'viewer' => [
            'admin.read',
            'auth.read',
            'user.read',
            'role.read',
            'settings.read',
            'session.read',
        ],
        'user' => [
            'auth.read',
        ],
    ];

    public static function isValidPermission(string $permission): bool
    {
        return in_array($permission, self::PERMISSIONS, true);
    }
}

final class Phase4JsonStore
{
    private string $baseDir;

    public function __construct(string $baseDir)
    {
        $this->baseDir = rtrim($baseDir, "/\\");
    }

    /**
     * @param array<string, mixed> $defaultValue
     * @return array<string, mixed>
     */
    public function read(string $fileName, array $defaultValue): array
    {
        $path = $this->path($fileName);
        if (!is_file($path) || !is_readable($path)) {
            return $defaultValue;
        }

        $raw = file_get_contents($path);
        if ($raw === false || trim($raw) === '') {
            return $defaultValue;
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return $defaultValue;
        }

        return array_replace_recursive($defaultValue, $decoded);
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function write(string $fileName, array $payload): void
    {
        if (!is_dir($this->baseDir) && !mkdir($this->baseDir, 0775, true) && !is_dir($this->baseDir)) {
            throw new \RuntimeException('Could not create storage directory: ' . $this->baseDir);
        }

        $json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            throw new \RuntimeException('Could not encode JSON payload.');
        }

        $written = file_put_contents($this->path($fileName), $json . PHP_EOL, LOCK_EX);
        if ($written === false) {
            throw new \RuntimeException('Could not write storage file: ' . $fileName);
        }
    }

    private function path(string $fileName): string
    {
        return $this->baseDir . '/' . ltrim($fileName, "/\\");
    }
}

final class Phase4PasswordHasher
{
    public static function hash(string $password): string
    {
        $trimmed = trim($password);
        if ($trimmed === '') {
            throw new \RuntimeException('Password must not be empty.');
        }

        $algo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT;
        $hash = password_hash($trimmed, $algo);
        if (!is_string($hash) || $hash === '') {
            throw new \RuntimeException('Could not hash password.');
        }
        return $hash;
    }

    public static function verify(string $password, string $hash): bool
    {
        if ($password === '' || $hash === '') {
            return false;
        }
        return password_verify($password, $hash);
    }
}

final class Phase4RoleService
{
    private const FILE = 'admin-roles.json';

    private Phase4JsonStore $store;

    public function __construct(Phase4JsonStore $store)
    {
        $this->store = $store;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function all(): array
    {
        $snapshot = $this->loadWithDefaults();
        return array_values($snapshot['roles']);
    }

    public function get(string $roleId): ?array
    {
        foreach ($this->all() as $role) {
            if ((string) ($role['id'] ?? '') === $roleId || (string) ($role['role'] ?? '') === $roleId) {
                return $role;
            }
        }
        return null;
    }

    /**
     * @return list<string>
     */
    public function permissionsForRoles(array $roleKeys): array
    {
        $resolved = [];
        foreach ($roleKeys as $roleKey) {
            $role = $this->get((string) $roleKey);
            if (!$role) {
                continue;
            }
            $permissions = is_array($role['permissions'] ?? null) ? $role['permissions'] : [];
            foreach ($permissions as $permission) {
                $resolved[] = (string) $permission;
            }
        }
        return array_values(array_unique($resolved));
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function create(array $payload): array
    {
        $snapshot = $this->loadWithDefaults();
        $roleKey = strtolower(trim((string) ($payload['name'] ?? $payload['role'] ?? '')));
        if ($roleKey === '' || strlen($roleKey) < 3) {
            throw new \RuntimeException('Role name must have at least 3 characters.');
        }

        if (isset($snapshot['rolesByRole'][$roleKey])) {
            throw new \RuntimeException('Role already exists: ' . $roleKey);
        }

        $permissions = $this->normalizePermissions($payload['permissions'] ?? []);
        $now = gmdate('c');
        $id = 'role-' . preg_replace('/[^a-z0-9\-]/', '-', $roleKey);
        $role = [
            'id' => $id,
            'name' => $roleKey,
            'role' => $roleKey,
            'description' => trim((string) ($payload['description'] ?? '')),
            'permissions' => $permissions,
            'isSystem' => false,
            'createdAt' => $now,
            'updatedAt' => $now,
        ];

        $snapshot['roles'][] = $role;
        $this->persist($snapshot['roles']);
        return $role;
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function update(string $roleId, array $payload): array
    {
        $snapshot = $this->loadWithDefaults();
        $index = null;
        foreach ($snapshot['roles'] as $offset => $role) {
            if ((string) ($role['id'] ?? '') === $roleId || (string) ($role['role'] ?? '') === $roleId) {
                $index = $offset;
                break;
            }
        }
        if ($index === null) {
            throw new \RuntimeException('Role not found: ' . $roleId);
        }

        $current = $snapshot['roles'][$index];
        if (($current['isSystem'] ?? false) === true) {
            throw new \RuntimeException('System roles cannot be modified.');
        }

        $updated = $current;
        if (array_key_exists('description', $payload)) {
            $updated['description'] = trim((string) $payload['description']);
        }
        if (array_key_exists('permissions', $payload)) {
            $updated['permissions'] = $this->normalizePermissions($payload['permissions']);
        }
        $updated['updatedAt'] = gmdate('c');
        $snapshot['roles'][$index] = $updated;
        $this->persist($snapshot['roles']);
        return $updated;
    }

    public function delete(string $roleId): void
    {
        $snapshot = $this->loadWithDefaults();
        $remaining = [];
        $deleted = false;
        foreach ($snapshot['roles'] as $role) {
            if ((string) ($role['id'] ?? '') === $roleId || (string) ($role['role'] ?? '') === $roleId) {
                if (($role['isSystem'] ?? false) === true) {
                    throw new \RuntimeException('System roles cannot be deleted.');
                }
                $deleted = true;
                continue;
            }
            $remaining[] = $role;
        }
        if (!$deleted) {
            throw new \RuntimeException('Role not found: ' . $roleId);
        }
        $this->persist($remaining);
    }

    /**
     * @param mixed $permissions
     * @return list<string>
     */
    private function normalizePermissions($permissions): array
    {
        if (!is_array($permissions)) {
            return [];
        }
        $normalized = [];
        foreach ($permissions as $permission) {
            $value = trim((string) $permission);
            if ($value === '' || !Phase4AuthRbac::isValidPermission($value)) {
                continue;
            }
            $normalized[] = $value;
        }
        return array_values(array_unique($normalized));
    }

    /**
     * @return array{roles:list<array<string,mixed>>,rolesByRole:array<string,array<string,mixed>>}
     */
    private function loadWithDefaults(): array
    {
        $defaults = $this->defaultRoles();
        $raw = $this->store->read(self::FILE, ['roles' => $defaults]);
        $roles = is_array($raw['roles'] ?? null) && $raw['roles'] !== [] ? $raw['roles'] : $defaults;

        $normalized = [];
        $byRole = [];
        foreach ($roles as $role) {
            if (!is_array($role)) {
                continue;
            }
            $roleKey = strtolower(trim((string) ($role['role'] ?? $role['name'] ?? '')));
            if ($roleKey === '') {
                continue;
            }
            $entry = [
                'id' => (string) ($role['id'] ?? 'role-' . $roleKey),
                'name' => (string) ($role['name'] ?? $roleKey),
                'role' => $roleKey,
                'description' => (string) ($role['description'] ?? ''),
                'permissions' => $this->normalizePermissions($role['permissions'] ?? []),
                'isSystem' => (bool) (($role['isSystem'] ?? false) === true),
                'createdAt' => (string) ($role['createdAt'] ?? gmdate('c')),
                'updatedAt' => (string) ($role['updatedAt'] ?? gmdate('c')),
            ];
            $normalized[] = $entry;
            $byRole[$roleKey] = $entry;
        }

        if ($normalized === []) {
            $normalized = $defaults;
            foreach ($defaults as $role) {
                $byRole[(string) $role['role']] = $role;
            }
        }

        return ['roles' => $normalized, 'rolesByRole' => $byRole];
    }

    /**
     * @param list<array<string,mixed>> $roles
     */
    private function persist(array $roles): void
    {
        $this->store->write(self::FILE, ['roles' => array_values($roles)]);
    }

    /**
     * @return list<array<string,mixed>>
     */
    private function defaultRoles(): array
    {
        $now = gmdate('c');
        $roles = [];
        foreach (Phase4AuthRbac::ROLE_PERMISSIONS as $role => $permissions) {
            $roles[] = [
                'id' => 'role-' . $role,
                'name' => $role,
                'role' => $role,
                'description' => $role === 'admin' ? 'System administrator' : ucfirst($role) . ' role',
                'permissions' => $permissions,
                'isSystem' => true,
                'createdAt' => $now,
                'updatedAt' => $now,
            ];
        }
        return $roles;
    }
}

final class Phase4UserService
{
    private const FILE = 'admin-users.json';

    private Phase4JsonStore $store;
    private Phase4RoleService $roles;
    private AppConfig $config;

    public function __construct(Phase4JsonStore $store, Phase4RoleService $roles, AppConfig $config)
    {
        $this->store = $store;
        $this->roles = $roles;
        $this->config = $config;
    }

    /**
     * @param array{q?:string,role?:string,status?:string} $filters
     * @return list<array<string,mixed>>
     */
    public function allPublic(array $filters = []): array
    {
        $users = $this->load()['users'];
        $q = strtolower(trim((string) ($filters['q'] ?? '')));
        $role = strtolower(trim((string) ($filters['role'] ?? '')));
        $status = strtolower(trim((string) ($filters['status'] ?? '')));

        $filtered = [];
        foreach ($users as $user) {
            if ($q !== '') {
                $haystack = strtolower((string) ($user['username'] ?? '') . ' ' . (string) ($user['email'] ?? '') . ' ' . (string) ($user['displayName'] ?? ''));
                if (!str_contains($haystack, $q)) {
                    continue;
                }
            }
            if ($status !== '' && strtolower((string) ($user['status'] ?? '')) !== $status) {
                continue;
            }
            if ($role !== '') {
                $roles = is_array($user['roles'] ?? null) ? $user['roles'] : [];
                $lowerRoles = array_map(static fn ($item) => strtolower((string) $item), $roles);
                if (!in_array($role, $lowerRoles, true)) {
                    continue;
                }
            }
            $filtered[] = $this->publicUser($user);
        }

        return $filtered;
    }

    public function getPublicById(string $id): ?array
    {
        $user = $this->getById($id);
        return $user ? $this->publicUser($user) : null;
    }

    /**
     * @param array<string,mixed> $payload
     */
    public function create(array $payload): array
    {
        $snapshot = $this->load();
        $username = trim((string) ($payload['username'] ?? ''));
        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        $password = (string) ($payload['password'] ?? '');
        if ($username === '' || strlen($username) < 3) {
            throw new \RuntimeException('Username must have at least 3 characters.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \RuntimeException('Email is invalid.');
        }
        if ($password === '' || strlen($password) < 8) {
            throw new \RuntimeException('Password must have at least 8 characters.');
        }
        foreach ($snapshot['users'] as $user) {
            if (strtolower((string) ($user['username'] ?? '')) === strtolower($username)) {
                throw new \RuntimeException('Username already exists.');
            }
            if (strtolower((string) ($user['email'] ?? '')) === $email) {
                throw new \RuntimeException('Email already exists.');
            }
        }

        $roles = $this->normalizeRoles($payload['roles'] ?? [$payload['role'] ?? 'user']);
        $permissions = $this->normalizePermissions($payload['permissions'] ?? []);
        $now = gmdate('c');
        $id = $snapshot['nextId'];
        if ($id < 101) {
            $id = 101;
        }
        $snapshot['nextId'] = $id + 1;

        $user = [
            'id' => (string) $id,
            'username' => $username,
            'email' => $email,
            'displayName' => trim((string) ($payload['displayName'] ?? $username)),
            'status' => $this->normalizeStatus((string) ($payload['status'] ?? 'active')),
            'roles' => $roles,
            'permissions' => $permissions,
            'passwordHash' => Phase4PasswordHasher::hash($password),
            'createdAt' => $now,
            'updatedAt' => $now,
        ];

        $snapshot['users'][] = $user;
        $this->persist($snapshot);
        return $this->publicUser($user);
    }

    /**
     * @param array<string,mixed> $payload
     */
    public function update(string $id, array $payload): array
    {
        $snapshot = $this->load();
        $index = $this->indexOf($snapshot['users'], $id);
        if ($index < 0) {
            throw new \RuntimeException('User not found: ' . $id);
        }
        $user = $snapshot['users'][$index];

        if (array_key_exists('email', $payload)) {
            $email = strtolower(trim((string) $payload['email']));
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new \RuntimeException('Email is invalid.');
            }
            foreach ($snapshot['users'] as $candidate) {
                if ((string) ($candidate['id'] ?? '') === $id) {
                    continue;
                }
                if (strtolower((string) ($candidate['email'] ?? '')) === $email) {
                    throw new \RuntimeException('Email already exists.');
                }
            }
            $user['email'] = $email;
        }

        if (array_key_exists('displayName', $payload)) {
            $user['displayName'] = trim((string) $payload['displayName']);
        }
        if (array_key_exists('status', $payload)) {
            $user['status'] = $this->normalizeStatus((string) $payload['status']);
        }
        if (array_key_exists('roles', $payload) || array_key_exists('role', $payload)) {
            $user['roles'] = $this->normalizeRoles($payload['roles'] ?? [$payload['role'] ?? 'user']);
        }
        if (array_key_exists('permissions', $payload)) {
            $user['permissions'] = $this->normalizePermissions($payload['permissions']);
        }
        if (array_key_exists('password', $payload) && trim((string) $payload['password']) !== '') {
            $password = (string) $payload['password'];
            if (strlen($password) < 8) {
                throw new \RuntimeException('Password must have at least 8 characters.');
            }
            $user['passwordHash'] = Phase4PasswordHasher::hash($password);
        }
        $user['updatedAt'] = gmdate('c');

        $snapshot['users'][$index] = $user;
        $this->persist($snapshot);
        return $this->publicUser($user);
    }

    public function delete(string $id): void
    {
        $snapshot = $this->load();
        $index = $this->indexOf($snapshot['users'], $id);
        if ($index < 0) {
            throw new \RuntimeException('User not found: ' . $id);
        }
        $userId = (int) ($snapshot['users'][$index]['id'] ?? 0);
        if ($userId === 101) {
            throw new \RuntimeException('User 101 cannot be deleted.');
        }
        array_splice($snapshot['users'], $index, 1);
        $this->persist($snapshot);
    }

    public function authenticate(string $username, string $password): ?array
    {
        $username = trim($username);
        if ($username === '' || $password === '') {
            return null;
        }
        $snapshot = $this->load();
        foreach ($snapshot['users'] as $user) {
            if (strtolower((string) ($user['username'] ?? '')) !== strtolower($username)) {
                continue;
            }
            if (($user['status'] ?? 'active') !== 'active') {
                return null;
            }
            $hash = (string) ($user['passwordHash'] ?? '');
            if ($hash !== '' && Phase4PasswordHasher::verify($password, $hash)) {
                return $user;
            }
            return null;
        }
        return null;
    }

    public function getById(string $id): ?array
    {
        foreach ($this->load()['users'] as $user) {
            if ((string) ($user['id'] ?? '') === $id) {
                return $user;
            }
        }
        return null;
    }

    /**
     * @return list<string>
     */
    public function effectivePermissions(array $user): array
    {
        $roles = is_array($user['roles'] ?? null) ? $user['roles'] : [];
        $rolePermissions = $this->roles->permissionsForRoles($roles);
        $directPermissions = is_array($user['permissions'] ?? null) ? $this->normalizePermissions($user['permissions']) : [];
        return array_values(array_unique(array_merge($rolePermissions, $directPermissions)));
    }

    /**
     * @param array<string,mixed> $user
     * @return array<string,mixed>
     */
    private function publicUser(array $user): array
    {
        return [
            'id' => (string) ($user['id'] ?? ''),
            'username' => (string) ($user['username'] ?? ''),
            'email' => (string) ($user['email'] ?? ''),
            'displayName' => (string) ($user['displayName'] ?? ''),
            'status' => (string) ($user['status'] ?? 'active'),
            'roles' => is_array($user['roles'] ?? null) ? array_values($user['roles']) : [],
            'permissions' => is_array($user['permissions'] ?? null) ? array_values($user['permissions']) : [],
            'createdAt' => (string) ($user['createdAt'] ?? ''),
            'updatedAt' => (string) ($user['updatedAt'] ?? ''),
        ];
    }

    /**
     * @return array{users:list<array<string,mixed>>,nextId:int}
     */
    private function load(): array
    {
        $defaults = [
            'users' => [],
            'nextId' => 101,
        ];
        $data = $this->store->read(self::FILE, $defaults);
        $users = is_array($data['users'] ?? null) ? $data['users'] : [];
        if ($users === []) {
            $env = $this->config->env();
            $bootstrapUsername = trim((string) ($env['CORE_BOOTSTRAP_USERNAME'] ?? ''));
            $bootstrapPassword = (string) ($env['CORE_BOOTSTRAP_PASSWORD'] ?? '');
            if ($bootstrapUsername !== '' && strlen($bootstrapPassword) >= 8) {
                $now = gmdate('c');
                $users[] = [
                    'id' => '101',
                    'username' => $bootstrapUsername,
                    'email' => strtolower($bootstrapUsername) . '@localhost',
                    'displayName' => 'Bootstrap Administrator',
                    'status' => 'active',
                    'roles' => ['admin'],
                    'permissions' => [],
                    'passwordHash' => Phase4PasswordHasher::hash($bootstrapPassword),
                    'createdAt' => $now,
                    'updatedAt' => $now,
                ];
                $data['users'] = $users;
                $data['nextId'] = 102;
                $this->store->write(self::FILE, $data);
            }
        }
        $highest = 100;
        foreach ($users as $user) {
            $id = (int) ($user['id'] ?? 0);
            if ($id > $highest) {
                $highest = $id;
            }
        }
        $nextId = max((int) ($data['nextId'] ?? 101), $highest + 1, 101);
        return ['users' => $users, 'nextId' => $nextId];
    }

    /**
     * @param array{users:list<array<string,mixed>>,nextId:int} $snapshot
     */
    private function persist(array $snapshot): void
    {
        $this->store->write(self::FILE, $snapshot);
    }

    /**
     * @param list<array<string,mixed>> $users
     */
    private function indexOf(array $users, string $id): int
    {
        foreach ($users as $index => $user) {
            if ((string) ($user['id'] ?? '') === $id) {
                return $index;
            }
        }
        return -1;
    }

    /**
     * @param mixed $rolesValue
     * @return list<string>
     */
    private function normalizeRoles($rolesValue): array
    {
        $roles = [];
        if (is_array($rolesValue)) {
            foreach ($rolesValue as $role) {
                $value = strtolower(trim((string) $role));
                if ($value !== '') {
                    $roles[] = $value;
                }
            }
        } else {
            $single = strtolower(trim((string) $rolesValue));
            if ($single !== '') {
                $roles[] = $single;
            }
        }
        $roles = array_values(array_unique($roles));
        if ($roles === []) {
            $roles = ['user'];
        }
        return $roles;
    }

    /**
     * @param mixed $permissions
     * @return list<string>
     */
    private function normalizePermissions($permissions): array
    {
        if (!is_array($permissions)) {
            return [];
        }
        $normalized = [];
        foreach ($permissions as $permission) {
            $value = trim((string) $permission);
            if (Phase4AuthRbac::isValidPermission($value)) {
                $normalized[] = $value;
            }
        }
        return array_values(array_unique($normalized));
    }

    private function normalizeStatus(string $status): string
    {
        $value = strtolower(trim($status));
        $allowed = ['active', 'inactive', 'pending', 'archived'];
        if (!in_array($value, $allowed, true)) {
            throw new \RuntimeException('Invalid user status: ' . $status);
        }
        return $value;
    }
}

final class Phase4SettingsService
{
    private const FILE = 'admin-settings.json';

    private Phase4JsonStore $store;

    public function __construct(Phase4JsonStore $store)
    {
        $this->store = $store;
    }

    /**
     * @return array<string,mixed>
     */
    public function getAll(): array
    {
        return $this->store->read(self::FILE, [
            'appName' => 'Neutral Platform',
            'appId' => 'neutral-app',
            'settings' => [],
        ]);
    }

    /**
     * @param array<string,mixed> $payload
     * @return array<string,mixed>
     */
    public function update(array $payload): array
    {
        $current = $this->getAll();
        $next = [
            'appName' => trim((string) ($payload['appName'] ?? $current['appName'] ?? 'Neutral Platform')),
            'appId' => trim((string) ($payload['appId'] ?? $current['appId'] ?? 'neutral-app')),
            'settings' => is_array($payload['settings'] ?? null)
                ? $payload['settings']
                : (is_array($current['settings'] ?? null) ? $current['settings'] : []),
        ];
        $this->store->write(self::FILE, $next);
        return $next;
    }
}

final class Phase4SessionRegistry
{
    private const FILE = 'auth-sessions.json';
    private Phase4JsonStore $store;

    public function __construct(Phase4JsonStore $store)
    {
        $this->store = $store;
    }

    /**
     * @param array<string,mixed> $identity
     */
    public function upsert(string $sessionId, array $identity): void
    {
        $snapshot = $this->store->read(self::FILE, ['sessions' => []]);
        $sessions = is_array($snapshot['sessions'] ?? null) ? $snapshot['sessions'] : [];
        $sessions[$sessionId] = array_merge($sessions[$sessionId] ?? [], $identity, ['updatedAt' => gmdate('c')]);
        $this->store->write(self::FILE, ['sessions' => $sessions]);
    }

    public function remove(string $sessionId): void
    {
        $snapshot = $this->store->read(self::FILE, ['sessions' => []]);
        $sessions = is_array($snapshot['sessions'] ?? null) ? $snapshot['sessions'] : [];
        unset($sessions[$sessionId]);
        $this->store->write(self::FILE, ['sessions' => $sessions]);
    }

    /**
     * @return list<array<string,mixed>>
     */
    public function listPublic(): array
    {
        $snapshot = $this->store->read(self::FILE, ['sessions' => []]);
        $sessions = is_array($snapshot['sessions'] ?? null) ? $snapshot['sessions'] : [];
        $public = [];
        foreach ($sessions as $sessionId => $session) {
            if (!is_array($session)) {
                continue;
            }
            $public[] = [
                'sessionId' => (string) $sessionId,
                'userId' => (string) ($session['userId'] ?? ''),
                'username' => (string) ($session['username'] ?? ''),
                'roles' => is_array($session['roles'] ?? null) ? $session['roles'] : [],
                'status' => (string) ($session['status'] ?? 'active'),
                'issuedAt' => (string) ($session['issuedAt'] ?? ''),
                'lastSeenAt' => (string) ($session['lastSeenAt'] ?? ''),
                'expiresAt' => (string) ($session['expiresAt'] ?? ''),
                'updatedAt' => (string) ($session['updatedAt'] ?? ''),
            ];
        }
        return $public;
    }
}

final class Phase4AuthManager
{
    private AppConfig $config;
    private Phase4UserService $users;
    private Phase4RoleService $roles;
    private Phase4SessionRegistry $sessions;

    public function __construct(AppConfig $config, Phase4UserService $users, Phase4RoleService $roles, Phase4SessionRegistry $sessions)
    {
        $this->config = $config;
        $this->users = $users;
        $this->roles = $roles;
        $this->sessions = $sessions;
    }

    public function startSession(): void
    {
        $cookieName = trim((string) ($this->config->env()['AUTH_SESSION_COOKIE_NAME'] ?? 'neutral_session'));
        Security::ensureSessionStarted($cookieName !== '' ? $cookieName : 'neutral_session');
    }

    /**
     * @return array<string,mixed>|null
     */
    public function authenticate(string $username, string $password): ?array
    {
        $this->startSession();
        $user = $this->users->authenticate($username, $password);
        if (!$user) {
            return null;
        }

        session_regenerate_id(true);
        $ttlMs = (int) ($this->config->env()['AUTH_SESSION_TTL_MS'] ?? (1000 * 60 * 60 * 12));
        if ($ttlMs <= 0) {
            $ttlMs = 1000 * 60 * 60 * 12;
        }
        $expiresAt = time() + (int) floor($ttlMs / 1000);
        $roles = is_array($user['roles'] ?? null) ? $user['roles'] : ['user'];
        $permissions = $this->users->effectivePermissions($user);

        $_SESSION['auth_identity'] = [
            'userId' => (string) ($user['id'] ?? ''),
            'username' => (string) ($user['username'] ?? ''),
            'roles' => $roles,
            'permissions' => $permissions,
            'issuedAt' => gmdate('c'),
            'lastSeenAt' => gmdate('c'),
            'expiresAt' => gmdate('c', $expiresAt),
            'status' => 'active',
        ];
        $csrf = Security::ensureCsrfToken();
        $this->sessions->upsert(session_id(), $_SESSION['auth_identity']);

        return [
            'user' => $this->users->getPublicById((string) ($user['id'] ?? '')),
            'roles' => $roles,
            'permissions' => $permissions,
            'csrfToken' => $csrf,
            'expiresAt' => gmdate('c', $expiresAt),
        ];
    }

    /**
     * @return array<string,mixed>|null
     */
    public function identityFromSession(): ?array
    {
        $this->startSession();
        $identity = $_SESSION['auth_identity'] ?? null;
        if (!is_array($identity)) {
            return null;
        }

        $expiresAt = strtotime((string) ($identity['expiresAt'] ?? ''));
        if ($expiresAt !== false && $expiresAt > 0 && $expiresAt < time()) {
            $this->logout();
            return null;
        }

        $identity['lastSeenAt'] = gmdate('c');
        $_SESSION['auth_identity'] = $identity;
        $this->sessions->upsert(session_id(), $identity);
        return $identity;
    }

    /**
     * @return array<string,mixed>|null
     */
    public function bootstrapTokenIdentity(array $headers): ?array
    {
        $token = trim((string) ($headers['x-admin-access-token'] ?? $headers['x-auth-token'] ?? ''));
        if ($token === '') {
            return null;
        }

        $env = $this->config->env();
        $allowedTokens = [
            trim((string) ($env['AUTH_TOKEN'] ?? '')),
            trim((string) ($env['ADMIN_ACCESS_TOKEN'] ?? '')),
            trim((string) ($env['NEUTRAL_ADMIN_TOKEN'] ?? '')),
        ];
        if ($this->config->environment() !== 'production') {
            $allowedTokens[] = 'test-token';
            $allowedTokens[] = 'neutral-dev-token';
        }
        $allowedTokens = array_values(array_filter(array_unique($allowedTokens), static fn ($value) => $value !== ''));
        if (!in_array($token, $allowedTokens, true)) {
            return null;
        }

        $rolesHeader = trim((string) ($headers['x-framework-role'] ?? $headers['x-user-role'] ?? $headers['x-admin-role'] ?? ''));
        $roles = [];
        foreach (explode(',', $rolesHeader) as $roleEntry) {
            $value = strtolower(trim($roleEntry));
            if ($value !== '') {
                $roles[] = $value;
            }
        }
        if ($roles === []) {
            $roles = ['admin'];
        }
        $permissions = $this->roles->permissionsForRoles($roles);

        return [
            'userId' => 'bootstrap-token',
            'username' => 'bootstrap-token',
            'roles' => array_values(array_unique($roles)),
            'permissions' => $permissions,
            'via' => 'token',
        ];
    }

    public function logout(): void
    {
        $this->startSession();
        $sessionId = session_id();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'] ?? '/', $params['domain'] ?? '', (bool) ($params['secure'] ?? false), (bool) ($params['httponly'] ?? true));
        }
        session_destroy();
        if ($sessionId !== '') {
            $this->sessions->remove($sessionId);
        }
    }

    /**
     * @return array<string,mixed>|null
     */
    public function resolveIdentity(array $headers): ?array
    {
        $sessionIdentity = $this->identityFromSession();
        if ($sessionIdentity) {
            $sessionIdentity['via'] = 'session';
            return $sessionIdentity;
        }
        return $this->bootstrapTokenIdentity($headers);
    }

    /**
     * @param array<string,mixed>|null $identity
     */
    public function hasPermission(?array $identity, string $permission): bool
    {
        if (!$identity) {
            return false;
        }
        $permissions = is_array($identity['permissions'] ?? null) ? $identity['permissions'] : [];
        return in_array($permission, $permissions, true) || in_array('admin.write', $permissions, true);
    }

    /**
     * @return list<array<string,mixed>>
     */
    public function listSessions(): array
    {
        return $this->sessions->listPublic();
    }
}

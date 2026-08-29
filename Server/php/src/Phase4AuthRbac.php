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
        'audit.read',
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
            'audit.read',
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
            'audit.read',
        ],
        'viewer' => [
            'admin.read',
            'auth.read',
            'user.read',
            'role.read',
            'settings.read',
            'session.read',
            'audit.read',
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
    private Phase4JsonStore $store;
    private ?Database $database;

    public function __construct(Phase4JsonStore $store, ?Database $database = null)
    {
        $this->store = $store;
        $this->database = $database;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function all(): array
    {
        $pdo = $this->requireDatabase()->connect();
        return $this->loadRoles($pdo);
    }

    public function get(string $roleId): ?array
    {
        $pdo = $this->requireDatabase()->connect();
        $roles = $this->loadRoles($pdo, $roleId);
        return $roles[0] ?? null;
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
        $pdo = $this->requireDatabase()->connect();
        $roleKey = strtolower(trim((string) ($payload['name'] ?? $payload['role'] ?? '')));
        if ($roleKey === '' || strlen($roleKey) < 3) {
            throw new \RuntimeException('Role name must have at least 3 characters.');
        }
        if ($this->get($roleKey)) {
            throw new \RuntimeException('Role already exists: ' . $roleKey);
        }
        $permissions = $this->normalizePermissions($payload['permissions'] ?? [], $pdo);
        $statement = $pdo->prepare('
            INSERT INTO roles (role_key, name, description, is_system, created_at, updated_at)
            VALUES (:role_key, :name, :description, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ');
        $statement->execute([
            ':role_key' => $roleKey,
            ':name' => $roleKey,
            ':description' => trim((string) ($payload['description'] ?? '')),
        ]);
        $roleDbId = (int) $pdo->lastInsertId();
        $this->syncRolePermissions($pdo, $roleDbId, $permissions);
        $created = $this->get($roleKey);
        if (!$created) {
            throw new \RuntimeException('Role could not be loaded after creation.');
        }
        return $created;
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function update(string $roleId, array $payload): array
    {
        $pdo = $this->requireDatabase()->connect();
        $current = $this->loadRoleRow($pdo, $roleId);
        if ($current === null) {
            throw new \RuntimeException('Role not found: ' . $roleId);
        }
        if ((int) ($current['is_system'] ?? 0) === 1) {
            throw new \RuntimeException('System roles cannot be modified.');
        }
        $roleDbId = (int) ($current['id'] ?? 0);
        $description = trim((string) ($current['description'] ?? ''));
        if (array_key_exists('description', $payload)) {
            $description = trim((string) $payload['description']);
        }
        $statement = $pdo->prepare('UPDATE roles SET description = :description, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
        $statement->execute([
            ':id' => $roleDbId,
            ':description' => $description,
        ]);
        if (array_key_exists('permissions', $payload)) {
            $permissions = $this->normalizePermissions($payload['permissions'], $pdo);
            $this->syncRolePermissions($pdo, $roleDbId, $permissions);
        }
        $updated = $this->get((string) ($current['role_key'] ?? $roleId));
        if (!$updated) {
            throw new \RuntimeException('Role could not be loaded after update.');
        }
        return $updated;
    }

    public function delete(string $roleId): void
    {
        $pdo = $this->requireDatabase()->connect();
        $current = $this->loadRoleRow($pdo, $roleId);
        if ($current === null) {
            throw new \RuntimeException('Role not found: ' . $roleId);
        }
        if ((int) ($current['is_system'] ?? 0) === 1) {
            throw new \RuntimeException('System roles cannot be deleted.');
        }
        $statement = $pdo->prepare('DELETE FROM roles WHERE id = :id');
        $statement->execute([':id' => (int) ($current['id'] ?? 0)]);
    }

    /**
     * @param list<string> $permissionKeys
     * @return array<string,mixed>
     */
    public function replacePermissions(string $roleId, array $permissionKeys, bool $allowSystem = false): array
    {
        $pdo = $this->requireDatabase()->connect();
        $current = $this->loadRoleRow($pdo, $roleId);
        if ($current === null) {
            throw new \RuntimeException('Role not found: ' . $roleId);
        }
        if (!$allowSystem && (int) ($current['is_system'] ?? 0) === 1) {
            throw new \RuntimeException('System roles cannot be modified.');
        }

        $normalized = $this->normalizePermissions($permissionKeys, $pdo);
        $this->syncRolePermissions($pdo, (int) ($current['id'] ?? 0), $normalized);

        $updated = $this->get((string) ($current['role_key'] ?? $roleId));
        if (!$updated) {
            throw new \RuntimeException('Role could not be loaded after permission update.');
        }
        return $updated;
    }

    /**
     * @param mixed $permissions
     * @param \PDO|null $pdo
     * @return list<string>
     */
    private function normalizePermissions($permissions, ?\PDO $pdo = null): array
    {
        if (!is_array($permissions)) {
            return [];
        }
        $normalized = [];
        foreach ($permissions as $permission) {
            $value = trim((string) $permission);
            if ($value === '') {
                continue;
            }
            if (!Phase4AuthRbac::isValidPermission($value) && !$this->permissionExists($value, $pdo)) {
                continue;
            }
            $normalized[] = $value;
        }
        return array_values(array_unique($normalized));
    }

    /**
     * @return list<array<string,mixed>>
     */
    private function loadRoles(\PDO $pdo, ?string $identifier = null): array
    {
        $where = '';
        $params = [];
        if ($identifier !== null && trim($identifier) !== '') {
            $where = 'WHERE r.role_key = :role_key';
            $params[':role_key'] = trim(strtolower($identifier));
            if (ctype_digit($identifier)) {
                $where = 'WHERE r.role_key = :role_key OR r.id = :role_id';
                $params[':role_id'] = (int) $identifier;
            }
        }
        $statement = $pdo->prepare("
            SELECT
                r.id,
                r.role_key,
                r.name,
                r.description,
                r.is_system,
                r.created_at,
                r.updated_at,
                GROUP_CONCAT(DISTINCT p.permission_key ORDER BY p.permission_key SEPARATOR ',') AS permission_keys
            FROM roles r
            LEFT JOIN role_permissions rp ON rp.role_id = r.id
            LEFT JOIN permissions p ON p.id = rp.permission_id
            $where
            GROUP BY r.id, r.role_key, r.name, r.description, r.is_system, r.created_at, r.updated_at
            ORDER BY r.role_key ASC
        ");
        $statement->execute($params);
        $roles = [];
        foreach ($statement->fetchAll(\PDO::FETCH_ASSOC) as $row) {
            if (!is_array($row)) {
                continue;
            }
            $roleKey = strtolower(trim((string) ($row['role_key'] ?? '')));
            if ($roleKey === '') {
                continue;
            }
            $permissions = [];
            $rawPermissions = (string) ($row['permission_keys'] ?? '');
            if ($rawPermissions !== '') {
                $permissions = array_values(array_filter(array_map('trim', explode(',', $rawPermissions)), static fn (string $value): bool => $value !== ''));
            }
            $roles[] = [
                'id' => $roleKey,
                'name' => (string) ($row['name'] ?? $roleKey),
                'role' => $roleKey,
                'description' => (string) ($row['description'] ?? ''),
                'permissions' => $permissions,
                'isSystem' => ((int) ($row['is_system'] ?? 0)) === 1,
                'createdAt' => (string) ($row['created_at'] ?? ''),
                'updatedAt' => (string) ($row['updated_at'] ?? ''),
            ];
        }
        return $roles;
    }

    /**
     * @return array<string,mixed>|null
     */
    private function loadRoleRow(\PDO $pdo, string $roleId): ?array
    {
        $params = [':role_key' => strtolower(trim($roleId))];
        $where = 'role_key = :role_key';
        if (ctype_digit($roleId)) {
            $where = '(role_key = :role_key OR id = :role_id)';
            $params[':role_id'] = (int) $roleId;
        }
        $statement = $pdo->prepare("SELECT id, role_key, description, is_system FROM roles WHERE $where LIMIT 1");
        $statement->execute($params);
        $row = $statement->fetch(\PDO::FETCH_ASSOC);
        return is_array($row) ? $row : null;
    }

    /**
     * @param list<string> $permissionKeys
     */
    private function syncRolePermissions(\PDO $pdo, int $roleId, array $permissionKeys): void
    {
        $pdo->prepare('DELETE FROM role_permissions WHERE role_id = :role_id')->execute([':role_id' => $roleId]);
        if ($permissionKeys === []) {
            return;
        }
        $placeholders = implode(',', array_fill(0, count($permissionKeys), '?'));
        $statement = $pdo->prepare("SELECT id, permission_key FROM permissions WHERE permission_key IN ($placeholders)");
        $statement->execute($permissionKeys);
        $permissionRows = $statement->fetchAll(\PDO::FETCH_ASSOC);
        if (!is_array($permissionRows) || count($permissionRows) !== count($permissionKeys)) {
            throw new \RuntimeException('One or more permissions are not available in database.');
        }
        $insert = $pdo->prepare('
            INSERT INTO role_permissions (role_id, permission_id, granted_at)
            VALUES (:role_id, :permission_id, CURRENT_TIMESTAMP)
        ');
        foreach ($permissionRows as $permissionRow) {
            if (!is_array($permissionRow)) {
                continue;
            }
            $insert->execute([
                ':role_id' => $roleId,
                ':permission_id' => (int) ($permissionRow['id'] ?? 0),
            ]);
        }
    }

    private function permissionExists(string $permissionKey, ?\PDO $pdo = null): bool
    {
        $key = trim($permissionKey);
        if ($key === '') {
            return false;
        }
        if (Phase4AuthRbac::isValidPermission($key)) {
            return true;
        }

        $connection = $pdo ?? $this->requireDatabase()->connect();
        $statement = $connection->prepare('SELECT id FROM permissions WHERE permission_key = :permission_key LIMIT 1');
        $statement->execute([':permission_key' => $key]);
        return $statement->fetchColumn() !== false;
    }

    private function requireDatabase(): Database
    {
        if (!$this->database instanceof Database) {
            throw new \RuntimeException('MySQL role storage is not configured.');
        }
        return $this->database;
    }
}

final class Phase4PermissionService
{
    private Database $database;

    public function __construct(Database $database)
    {
        $this->database = $database;
    }

    /**
     * @return list<string>
     */
    public function allKeys(): array
    {
        return array_map(
            static fn (array $permission): string => (string) ($permission['key'] ?? ''),
            $this->all()
        );
    }

    /**
     * @return list<array{key:string,description:string,scope:string}>
     */
    public function all(): array
    {
        $catalog = [];
        foreach (Phase4AuthRbac::PERMISSIONS as $permission) {
            $catalog[(string) $permission] = [
                'key' => (string) $permission,
                'description' => '',
                'scope' => 'core',
            ];
        }

        try {
            $pdo = $this->database->connect();
        } catch (\Throwable $exception) {
            return array_values($catalog);
        }

        $statement = $pdo->query('SELECT permission_key, description, scope FROM permissions ORDER BY scope ASC, permission_key ASC');
        if ($statement === false) {
            return array_values($catalog);
        }

        foreach ($statement->fetchAll(\PDO::FETCH_ASSOC) as $row) {
            if (!is_array($row)) {
                continue;
            }
            $key = trim((string) ($row['permission_key'] ?? ''));
            if ($key === '') {
                continue;
            }
            $catalog[$key] = [
                'key' => $key,
                'description' => (string) ($row['description'] ?? ''),
                'scope' => trim((string) ($row['scope'] ?? '')) !== '' ? (string) $row['scope'] : (Phase4AuthRbac::isValidPermission($key) ? 'core' : 'custom'),
            ];
        }

        return array_values($catalog);
    }

    /**
     * @param list<array{key:string,description:string,scope:string,defaultRoles:list<string>}> $definitions
     */
    public function ensure(array $definitions): void
    {
        if ($definitions === []) {
            return;
        }

        $pdo = $this->database->connect();
        $statement = $pdo->prepare('
            INSERT INTO permissions (permission_key, description, scope, created_at)
            VALUES (:permission_key, :description, :scope, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE
                description = VALUES(description),
                scope = VALUES(scope)
        ');

        foreach ($definitions as $definition) {
            $key = trim((string) ($definition['key'] ?? ''));
            if ($key === '') {
                continue;
            }
            $statement->execute([
                ':permission_key' => $key,
                ':description' => (string) ($definition['description'] ?? ''),
                ':scope' => (string) ($definition['scope'] ?? 'custom'),
            ]);
        }
    }

    public function deleteByScope(string $scope): void
    {
        $normalized = trim($scope);
        if ($normalized === '') {
            return;
        }

        $pdo = $this->database->connect();
        $statement = $pdo->prepare('DELETE FROM permissions WHERE scope = :scope');
        $statement->execute([':scope' => $normalized]);
    }
}

final class Phase4UserService
{
    private Phase4JsonStore $store;
    private Phase4RoleService $roles;
    private AppConfig $config;
    private ?Database $database;

    public function __construct(Phase4JsonStore $store, Phase4RoleService $roles, AppConfig $config, ?Database $database = null)
    {
        $this->store = $store;
        $this->roles = $roles;
        $this->config = $config;
        $this->database = $database;
    }

    /**
     * @param array{q?:string,role?:string,status?:string} $filters
     * @return list<array<string,mixed>>
     */
    public function allPublic(array $filters = []): array
    {
        $pdo = $this->requireDatabase()->connect();
        $q = trim((string) ($filters['q'] ?? ''));
        $status = strtolower(trim((string) ($filters['status'] ?? '')));
        $role = strtolower(trim((string) ($filters['role'] ?? '')));

        $where = [];
        $params = [];
        if ($q !== '') {
            $where[] = '(u.username LIKE :q OR u.email LIKE :q OR u.display_name LIKE :q)';
            $params[':q'] = '%' . $q . '%';
        }
        if ($status !== '') {
            $where[] = 'u.status = :status';
            $params[':status'] = $status;
        }
        if ($role !== '') {
            if (ctype_digit($role)) {
                $where[] = 'EXISTS (
                    SELECT 1 FROM user_roles urf
                    JOIN roles rf ON rf.id = urf.role_id
                    WHERE urf.user_id = u.id AND (rf.role_key = :role_key OR rf.id = :role_id)
                )';
                $params[':role_id'] = (int) $role;
                $params[':role_key'] = $role;
            } else {
                $where[] = 'EXISTS (
                    SELECT 1 FROM user_roles urf
                    JOIN roles rf ON rf.id = urf.role_id
                    WHERE urf.user_id = u.id AND rf.role_key = :role_key
                )';
                $params[':role_key'] = $role;
            }
        }
        $whereSql = $where === [] ? '' : ('WHERE ' . implode(' AND ', $where));
        $statement = $pdo->prepare("
            SELECT
                u.id,
                u.username,
                u.email,
                u.display_name,
                u.status,
                u.password_hash,
                u.created_at,
                u.updated_at,
                GROUP_CONCAT(DISTINCT r.role_key ORDER BY r.role_key SEPARATOR ',') AS role_keys
            FROM users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON r.id = ur.role_id
            $whereSql
            GROUP BY u.id, u.username, u.email, u.display_name, u.status, u.password_hash, u.created_at, u.updated_at
            ORDER BY u.id ASC
        ");
        $statement->execute($params);
        $public = [];
        foreach ($statement->fetchAll(\PDO::FETCH_ASSOC) as $row) {
            if (!is_array($row)) {
                continue;
            }
            $public[] = $this->publicUser($this->hydrateUserRow($row));
        }
        return $public;
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
        $pdo = $this->requireDatabase()->connect();
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
        $duplicate = $pdo->prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(:username) OR LOWER(email) = LOWER(:email) LIMIT 1');
        $duplicate->execute([
            ':username' => $username,
            ':email' => $email,
        ]);
        if ($duplicate->fetchColumn() !== false) {
            throw new \RuntimeException('Username or email already exists.');
        }
        $roles = $this->normalizeRoles($payload['roles'] ?? [$payload['role'] ?? 'user']);
        $statement = $pdo->prepare('
            INSERT INTO users (username, email, password_hash, status, display_name, created_at, updated_at)
            VALUES (:username, :email, :password_hash, :status, :display_name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ');
        $statement->execute([
            ':username' => $username,
            ':email' => $email,
            ':password_hash' => Phase4PasswordHasher::hash($password),
            ':status' => $this->normalizeStatus((string) ($payload['status'] ?? 'active')),
            ':display_name' => trim((string) ($payload['displayName'] ?? $username)),
        ]);
        $userId = (int) $pdo->lastInsertId();
        if ($userId < 101) {
            throw new \RuntimeException('User ID allocation is below reserved boundary.');
        }
        $this->syncUserRoles($pdo, $userId, $roles);
        $created = $this->getById((string) $userId);
        if (!$created) {
            throw new \RuntimeException('User could not be loaded after creation.');
        }
        return $this->publicUser($created);
    }

    /**
     * @param array<string,mixed> $payload
     */
    public function update(string $id, array $payload): array
    {
        $pdo = $this->requireDatabase()->connect();
        $user = $this->getById($id);
        if (!$user) {
            throw new \RuntimeException('User not found: ' . $id);
        }
        if (array_key_exists('email', $payload)) {
            $email = strtolower(trim((string) $payload['email']));
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new \RuntimeException('Email is invalid.');
            }
            $duplicate = $pdo->prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(:email) AND id <> :id LIMIT 1');
            $duplicate->execute([
                ':email' => $email,
                ':id' => (int) $id,
            ]);
            if ($duplicate->fetchColumn() !== false) {
                throw new \RuntimeException('Email already exists.');
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
        if (array_key_exists('password', $payload) && trim((string) $payload['password']) !== '') {
            $password = (string) $payload['password'];
            if (strlen($password) < 8) {
                throw new \RuntimeException('Password must have at least 8 characters.');
            }
            $user['passwordHash'] = Phase4PasswordHasher::hash($password);
        }
        $statement = $pdo->prepare('
            UPDATE users
            SET email = :email,
                display_name = :display_name,
                status = :status,
                password_hash = :password_hash,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ');
        $statement->execute([
            ':id' => (int) $id,
            ':email' => (string) ($user['email'] ?? ''),
            ':display_name' => (string) ($user['displayName'] ?? ''),
            ':status' => (string) ($user['status'] ?? 'active'),
            ':password_hash' => (string) ($user['passwordHash'] ?? ''),
        ]);
        $roles = is_array($user['roles'] ?? null) ? $user['roles'] : ['user'];
        $this->syncUserRoles($pdo, (int) $id, $roles);
        $updated = $this->getById($id);
        if (!$updated) {
            throw new \RuntimeException('User could not be loaded after update.');
        }
        return $this->publicUser($updated);
    }

    public function delete(string $id): void
    {
        $pdo = $this->requireDatabase()->connect();
        $statement = $pdo->prepare('SELECT id FROM users WHERE id = :id LIMIT 1');
        $statement->execute([':id' => (int) $id]);
        if ($statement->fetchColumn() === false) {
            throw new \RuntimeException('User not found: ' . $id);
        }
        $userId = (int) $id;
        if ($userId === 101) {
            throw new \RuntimeException('User 101 cannot be deleted.');
        }
        $pdo->prepare('DELETE FROM users WHERE id = :id')->execute([':id' => $userId]);
    }

    public function authenticate(string $username, string $password): ?array
    {
        $username = trim($username);
        if ($username === '' || $password === '') {
            return null;
        }
        $pdo = $this->requireDatabase()->connect();
        $statement = $pdo->prepare('
            SELECT
                u.id,
                u.username,
                u.email,
                u.display_name,
                u.status,
                u.password_hash,
                u.created_at,
                u.updated_at,
                GROUP_CONCAT(DISTINCT r.role_key ORDER BY r.role_key SEPARATOR \',\') AS role_keys
            FROM users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON r.id = ur.role_id
            WHERE LOWER(u.username) = LOWER(:username)
            GROUP BY u.id, u.username, u.email, u.display_name, u.status, u.password_hash, u.created_at, u.updated_at
            LIMIT 1
        ');
        $statement->execute([':username' => $username]);
        $row = $statement->fetch(\PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            return null;
        }
        $user = $this->hydrateUserRow($row);
        if (($user['status'] ?? 'inactive') !== 'active') {
            return null;
        }
        $hash = (string) ($user['passwordHash'] ?? '');
        if ($hash !== '' && Phase4PasswordHasher::verify($password, $hash)) {
            return $user;
        }
        return null;
    }

    public function getById(string $id): ?array
    {
        if (!ctype_digit($id)) {
            return null;
        }
        $pdo = $this->requireDatabase()->connect();
        $statement = $pdo->prepare('
            SELECT
                u.id,
                u.username,
                u.email,
                u.display_name,
                u.status,
                u.password_hash,
                u.created_at,
                u.updated_at,
                GROUP_CONCAT(DISTINCT r.role_key ORDER BY r.role_key SEPARATOR \',\') AS role_keys
            FROM users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON r.id = ur.role_id
            WHERE u.id = :id
            GROUP BY u.id, u.username, u.email, u.display_name, u.status, u.password_hash, u.created_at, u.updated_at
            LIMIT 1
        ');
        $statement->execute([':id' => (int) $id]);
        $row = $statement->fetch(\PDO::FETCH_ASSOC);
        return is_array($row) ? $this->hydrateUserRow($row) : null;
    }

    public function getByUsername(string $username): ?array
    {
        $username = trim($username);
        if ($username === '') {
            return null;
        }

        $pdo = $this->requireDatabase()->connect();
        $statement = $pdo->prepare("
            SELECT
                u.id,
                u.username,
                u.email,
                u.display_name,
                u.status,
                u.password_hash,
                u.created_at,
                u.updated_at,
                GROUP_CONCAT(DISTINCT r.role_key ORDER BY r.role_key SEPARATOR ',') AS role_keys
            FROM users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON r.id = ur.role_id
            WHERE LOWER(u.username) = LOWER(:username)
            GROUP BY u.id, u.username, u.email, u.display_name, u.status, u.password_hash, u.created_at, u.updated_at
            LIMIT 1
        ");
        $statement->execute([':username' => $username]);
        $row = $statement->fetch(\PDO::FETCH_ASSOC);
        return is_array($row) ? $this->hydrateUserRow($row) : null;
    }

    public function ensureBootstrapAdminFromEnv(): bool
    {
        $env = $this->config->env();
        $username = trim((string) ($env['CORE_BOOTSTRAP_USERNAME'] ?? ''));
        $password = (string) ($env['CORE_BOOTSTRAP_PASSWORD'] ?? '');
        if ($username === '' || strlen($password) < 8) {
            return false;
        }

        if ($this->getByUsername($username) !== null) {
            return true;
        }

        try {
            $database = $this->requireDatabase();
            (new CoreDataSeeder($database, $this->config))->seed();
        } catch (\Throwable $exception) {
            return false;
        }

        return $this->getByUsername($username) !== null;
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
            'permissions' => $this->effectivePermissions($user),
            'createdAt' => (string) ($user['createdAt'] ?? ''),
            'updatedAt' => (string) ($user['updatedAt'] ?? ''),
        ];
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
        $resolved = [];
        foreach ($roles as $role) {
            $resolvedRole = $this->roles->get($role);
            if (!$resolvedRole) {
                throw new \RuntimeException('Unknown role: ' . $role);
            }
            $resolved[] = (string) ($resolvedRole['role'] ?? $role);
        }
        return array_values(array_unique($resolved));
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

    /**
     * @param array<string,mixed> $row
     * @return array<string,mixed>
     */
    private function hydrateUserRow(array $row): array
    {
        $roles = [];
        $roleKeys = trim((string) ($row['role_keys'] ?? ''));
        if ($roleKeys !== '') {
            $roles = array_values(array_filter(array_map('trim', explode(',', $roleKeys)), static fn (string $value): bool => $value !== ''));
        }
        return [
            'id' => (string) ($row['id'] ?? ''),
            'username' => (string) ($row['username'] ?? ''),
            'email' => (string) ($row['email'] ?? ''),
            'displayName' => (string) ($row['display_name'] ?? ''),
            'status' => (string) ($row['status'] ?? 'active'),
            'roles' => $roles,
            'permissions' => [],
            'passwordHash' => (string) ($row['password_hash'] ?? ''),
            'createdAt' => (string) ($row['created_at'] ?? ''),
            'updatedAt' => (string) ($row['updated_at'] ?? ''),
        ];
    }

    /**
     * @param list<string> $roleKeys
     */
    private function syncUserRoles(\PDO $pdo, int $userId, array $roleKeys): void
    {
        $pdo->prepare('DELETE FROM user_roles WHERE user_id = :user_id')->execute([':user_id' => $userId]);
        if ($roleKeys === []) {
            return;
        }
        $placeholders = implode(',', array_fill(0, count($roleKeys), '?'));
        $statement = $pdo->prepare("SELECT id, role_key FROM roles WHERE role_key IN ($placeholders)");
        $statement->execute($roleKeys);
        $rows = $statement->fetchAll(\PDO::FETCH_ASSOC);
        if (!is_array($rows) || count($rows) !== count($roleKeys)) {
            throw new \RuntimeException('One or more roles are not available in database.');
        }
        $insert = $pdo->prepare('
            INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)
            VALUES (:user_id, :role_id, CURRENT_TIMESTAMP, NULL)
        ');
        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $insert->execute([
                ':user_id' => $userId,
                ':role_id' => (int) ($row['id'] ?? 0),
            ]);
        }
    }

    private function requireDatabase(): Database
    {
        if (!$this->database instanceof Database) {
            throw new \RuntimeException('MySQL user storage is not configured.');
        }
        return $this->database;
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
    private Phase4JsonStore $store;
    private ?Database $database;

    public function __construct(Phase4JsonStore $store, ?Database $database = null)
    {
        $this->store = $store;
        $this->database = $database;
    }

    /**
     * @param array<string,mixed> $identity
     */
    public function upsert(string $sessionId, array $identity): void
    {
        if ($sessionId === '') {
            return;
        }
        $pdo = $this->requireDatabase()->connect();
        $rawUserId = (string) ($identity['userId'] ?? '');
        $userId = ctype_digit($rawUserId) ? (int) $rawUserId : null;
        $csrfToken = isset($_SESSION['_csrf_token']) && is_string($_SESSION['_csrf_token']) ? $_SESSION['_csrf_token'] : null;
        $issuedAt = (string) ($identity['issuedAt'] ?? gmdate('c'));
        $lastSeenAt = (string) ($identity['lastSeenAt'] ?? gmdate('c'));
        $expiresAt = (string) ($identity['expiresAt'] ?? gmdate('c'));
        $statement = $pdo->prepare('
            INSERT INTO sessions (session_id, user_id, csrf_token, issued_at, last_seen_at, expires_at, status, ip, user_agent)
            VALUES (:session_id, :user_id, :csrf_token, :issued_at, :last_seen_at, :expires_at, :status, :ip, :user_agent)
            ON DUPLICATE KEY UPDATE
                user_id = VALUES(user_id),
                csrf_token = VALUES(csrf_token),
                last_seen_at = VALUES(last_seen_at),
                expires_at = VALUES(expires_at),
                status = VALUES(status),
                ip = VALUES(ip),
                user_agent = VALUES(user_agent)
        ');
        $statement->execute([
            ':session_id' => $sessionId,
            ':user_id' => $userId,
            ':csrf_token' => $csrfToken,
            ':issued_at' => $this->toMysqlDateTime($issuedAt),
            ':last_seen_at' => $this->toMysqlDateTime($lastSeenAt),
            ':expires_at' => $this->toMysqlDateTime($expiresAt),
            ':status' => (string) ($identity['status'] ?? 'active'),
            ':ip' => (string) ($_SERVER['REMOTE_ADDR'] ?? ''),
            ':user_agent' => substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255),
        ]);
    }

    public function remove(string $sessionId): void
    {
        if ($sessionId === '') {
            return;
        }
        $pdo = $this->requireDatabase()->connect();
        $statement = $pdo->prepare('DELETE FROM sessions WHERE session_id = :session_id');
        $statement->execute([':session_id' => $sessionId]);
    }

    /**
     * @return list<array<string,mixed>>
     */
    public function listPublic(): array
    {
        $pdo = $this->requireDatabase()->connect();
        $statement = $pdo->query('
            SELECT session_id, user_id, status, issued_at, last_seen_at, expires_at
            FROM sessions
            ORDER BY last_seen_at DESC
            LIMIT 500
        ');
        if ($statement === false) {
            throw new \RuntimeException('Could not read sessions.');
        }
        $public = [];
        foreach ($statement->fetchAll(\PDO::FETCH_ASSOC) as $session) {
            if (!is_array($session)) {
                continue;
            }
            $public[] = [
                'sessionId' => (string) ($session['session_id'] ?? ''),
                'userId' => $session['user_id'] !== null ? (string) $session['user_id'] : '',
                'username' => '',
                'roles' => [],
                'status' => (string) ($session['status'] ?? 'active'),
                'issuedAt' => (string) ($session['issued_at'] ?? ''),
                'lastSeenAt' => (string) ($session['last_seen_at'] ?? ''),
                'expiresAt' => (string) ($session['expires_at'] ?? ''),
                'updatedAt' => (string) ($session['last_seen_at'] ?? ''),
            ];
        }
        return $public;
    }

    private function toMysqlDateTime(string $value): string
    {
        $timestamp = strtotime($value);
        if ($timestamp === false) {
            return gmdate('Y-m-d H:i:s');
        }
        return gmdate('Y-m-d H:i:s', $timestamp);
    }

    private function requireDatabase(): Database
    {
        if (!$this->database instanceof Database) {
            throw new \RuntimeException('MySQL session storage is not configured.');
        }
        return $this->database;
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
        $this->users->ensureBootstrapAdminFromEnv();
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

        $userId = (string) ($identity['userId'] ?? '');
        $user = $userId !== '' ? $this->users->getById($userId) : null;
        if (!$user || (string) ($user['status'] ?? 'inactive') !== 'active') {
            $this->logout();
            return null;
        }
        $roles = is_array($user['roles'] ?? null) ? array_values($user['roles']) : ['user'];
        $permissions = $this->users->effectivePermissions($user);

        $identity['lastSeenAt'] = gmdate('c');
        $identity['roles'] = $roles;
        $identity['permissions'] = $permissions;
        $identity['status'] = 'active';
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

<?php
declare(strict_types=1);

namespace Neutral\Core;

use PDO;

final class CoreDataSeeder
{
    private Database $database;
    private AppConfig $config;

    public function __construct(Database $database, AppConfig $config)
    {
        $this->database = $database;
        $this->config = $config;
    }

    /**
     * @return array{
     *   bootstrapUser:string,
     *   roles:int,
     *   permissions:int
     * }
     */
    public function seed(): array
    {
        $pdo = $this->database->connect();
        $roleCount = $this->seedRoles($pdo);
        $permissionCount = $this->seedPermissions($pdo);
        $this->seedRolePermissions($pdo);
        $bootstrapState = $this->seedBootstrapAdmin($pdo);
        $this->seedSettings($pdo);

        return [
            'bootstrapUser' => $bootstrapState,
            'roles' => $roleCount,
            'permissions' => $permissionCount,
        ];
    }

    /**
     * @param array<string,mixed> $setupState
     */
    public function syncSetupStatus(array $setupState): void
    {
        $pdo = $this->database->connect();
        $detailsJson = json_encode($setupState, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($detailsJson === false) {
            $detailsJson = '{}';
        }
        $statement = $pdo->prepare('
            INSERT INTO setup_status (id, status, current_step, details_json, updated_at, updated_by)
            VALUES (1, :status, :step, :details, CURRENT_TIMESTAMP, NULL)
            ON DUPLICATE KEY UPDATE
                status = VALUES(status),
                current_step = VALUES(current_step),
                details_json = VALUES(details_json),
                updated_at = CURRENT_TIMESTAMP
        ');
        $statement->execute([
            ':status' => (string) ($setupState['status'] ?? 'SETUP_REQUIRED'),
            ':step' => (string) ($setupState['currentStep'] ?? 'setup'),
            ':details' => $detailsJson,
        ]);
    }

    private function seedRoles(PDO $pdo): int
    {
        $count = 0;
        foreach (Phase4AuthRbac::ROLE_PERMISSIONS as $roleKey => $_permissions) {
            $insert = $pdo->prepare('
                INSERT INTO roles (role_key, name, description, is_system)
                VALUES (:role_key, :name, :description, 1)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    description = VALUES(description),
                    is_system = VALUES(is_system),
                    updated_at = CURRENT_TIMESTAMP
            ');
            $insert->execute([
                ':role_key' => $roleKey,
                ':name' => ucfirst($roleKey),
                ':description' => ucfirst($roleKey) . ' role',
            ]);
            $count++;
        }
        return $count;
    }

    private function seedPermissions(PDO $pdo): int
    {
        $count = 0;
        foreach (Phase4AuthRbac::PERMISSIONS as $permissionKey) {
            $insert = $pdo->prepare('
                INSERT INTO permissions (permission_key, description, scope)
                VALUES (:key, :description, :scope)
                ON DUPLICATE KEY UPDATE
                    description = VALUES(description),
                    scope = VALUES(scope)
            ');
            $scope = explode('.', $permissionKey, 2)[0] ?? 'core';
            $insert->execute([
                ':key' => $permissionKey,
                ':description' => 'Permission ' . $permissionKey,
                ':scope' => $scope,
            ]);
            $count++;
        }
        return $count;
    }

    private function seedRolePermissions(PDO $pdo): void
    {
        foreach (Phase4AuthRbac::ROLE_PERMISSIONS as $roleKey => $permissions) {
            $roleId = $this->findRoleId($pdo, $roleKey);
            if ($roleId === null) {
                continue;
            }
            foreach ($permissions as $permissionKey) {
                $permissionId = $this->findPermissionId($pdo, $permissionKey);
                if ($permissionId === null) {
                    continue;
                }
                $insert = $pdo->prepare('
                    INSERT INTO role_permissions (role_id, permission_id, granted_at)
                    VALUES (:role_id, :permission_id, CURRENT_TIMESTAMP)
                    ON DUPLICATE KEY UPDATE granted_at = VALUES(granted_at)
                ');
                $insert->execute([
                    ':role_id' => $roleId,
                    ':permission_id' => $permissionId,
                ]);
            }
        }
    }

    private function seedBootstrapAdmin(PDO $pdo): string
    {
        $env = $this->config->env();
        $username = trim((string) ($env['CORE_BOOTSTRAP_USERNAME'] ?? ''));
        $password = (string) ($env['CORE_BOOTSTRAP_PASSWORD'] ?? '');
        if ($username === '' || strlen($password) < 8) {
            throw new \RuntimeException('CORE_BOOTSTRAP_USERNAME and CORE_BOOTSTRAP_PASSWORD (>=8 chars) are required for installation.');
        }

        $adminRoleId = $this->findRoleId($pdo, 'admin');
        if ($adminRoleId === null) {
            throw new \RuntimeException('Admin role is not available after role seeding.');
        }

        $user = $this->findUserById($pdo, 101);
        if ($user === null) {
            $existingByUsername = $this->findUserIdByUsername($pdo, $username);
            if ($existingByUsername !== null) {
                $this->ensureUserRole($pdo, $existingByUsername, $adminRoleId);
                return 'existing-username';
            }

            $email = strtolower(preg_replace('/\s+/', '.', $username)) . '@localhost';
            $insert = $pdo->prepare('
                INSERT INTO users (id, username, email, password_hash, status, display_name, created_at, updated_at)
                VALUES (101, :username, :email, :password_hash, :status, :display_name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ');
            $insert->execute([
                ':username' => $username,
                ':email' => $email,
                ':password_hash' => Phase4PasswordHasher::hash($password),
                ':status' => 'active',
                ':display_name' => 'Bootstrap Administrator',
            ]);
            $this->ensureUserRole($pdo, 101, $adminRoleId);
            return 'created-101';
        }

        $this->ensureUserRole($pdo, 101, $adminRoleId);
        return 'existing-101';
    }

    private function seedSettings(PDO $pdo): void
    {
        $settings = [
            'core.app.id' => json_encode(['value' => $this->config->appId()]),
            'core.app.name' => json_encode(['value' => $this->config->appName()]),
            'core.installed.via' => json_encode(['value' => 'setup-installer']),
        ];

        foreach ($settings as $key => $value) {
            $statement = $pdo->prepare('
                INSERT INTO settings (setting_key, setting_value_json, updated_by, updated_at)
                VALUES (:key, :value, NULL, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE
                    setting_value_json = VALUES(setting_value_json),
                    updated_at = CURRENT_TIMESTAMP
            ');
            $statement->execute([
                ':key' => $key,
                ':value' => $value !== false ? $value : '{}',
            ]);
        }
    }

    private function findRoleId(PDO $pdo, string $roleKey): ?int
    {
        $statement = $pdo->prepare('SELECT id FROM roles WHERE role_key = :role_key LIMIT 1');
        $statement->execute([':role_key' => $roleKey]);
        $value = $statement->fetchColumn();
        return $value === false ? null : (int) $value;
    }

    private function findPermissionId(PDO $pdo, string $permissionKey): ?int
    {
        $statement = $pdo->prepare('SELECT id FROM permissions WHERE permission_key = :permission_key LIMIT 1');
        $statement->execute([':permission_key' => $permissionKey]);
        $value = $statement->fetchColumn();
        return $value === false ? null : (int) $value;
    }

    private function findUserIdByUsername(PDO $pdo, string $username): ?int
    {
        $statement = $pdo->prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(:username) LIMIT 1');
        $statement->execute([':username' => $username]);
        $value = $statement->fetchColumn();
        return $value === false ? null : (int) $value;
    }

    private function findUserById(PDO $pdo, int $userId): ?array
    {
        $statement = $pdo->prepare('SELECT id, username FROM users WHERE id = :id LIMIT 1');
        $statement->execute([':id' => $userId]);
        $result = $statement->fetch(PDO::FETCH_ASSOC);
        return is_array($result) ? $result : null;
    }

    private function ensureUserRole(PDO $pdo, int $userId, int $roleId): void
    {
        $statement = $pdo->prepare('
            INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)
            VALUES (:user_id, :role_id, CURRENT_TIMESTAMP, NULL)
            ON DUPLICATE KEY UPDATE assigned_at = VALUES(assigned_at)
        ');
        $statement->execute([
            ':user_id' => $userId,
            ':role_id' => $roleId,
        ]);
    }
}

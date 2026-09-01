<?php
declare(strict_types=1);

namespace Neutral\Core;

use PDO;

final class SchemaMigrator
{
    private const MIGRATION_TABLE = 'schema_migrations';
    private const CORE_TABLES = [
        'roles',
        'permissions',
        'users',
        'user_roles',
        'role_permissions',
        'sessions',
        'login_attempts',
        'settings',
        'modules',
        'module_state',
        'module_migrations',
        'setup_status',
        'audit_log',
        'backups',
        'release_state',
    ];

    private Database $database;

    public function __construct(Database $database)
    {
        $this->database = $database;
    }

    /**
     * @return list<array{key:string,checksum:string,statements:list<string>}>
     */
    private function definitions(): array
    {
        $statements = [
            "CREATE TABLE IF NOT EXISTS roles (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                role_key VARCHAR(120) NOT NULL,
                name VARCHAR(190) NOT NULL,
                description TEXT NULL,
                is_system TINYINT(1) NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY ux_roles_role_key (role_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "CREATE TABLE IF NOT EXISTS permissions (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                permission_key VARCHAR(150) NOT NULL,
                description TEXT NULL,
                scope VARCHAR(120) NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY ux_permissions_permission_key (permission_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "CREATE TABLE IF NOT EXISTS users (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                username VARCHAR(120) NOT NULL,
                email VARCHAR(190) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                status VARCHAR(32) NOT NULL DEFAULT 'active',
                display_name VARCHAR(190) NOT NULL DEFAULT '',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY ux_users_username (username),
                UNIQUE KEY ux_users_email (email),
                KEY ix_users_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=101",
            "CREATE TABLE IF NOT EXISTS user_roles (
                user_id BIGINT UNSIGNED NOT NULL,
                role_id BIGINT UNSIGNED NOT NULL,
                assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                assigned_by BIGINT UNSIGNED NULL,
                PRIMARY KEY (user_id, role_id),
                KEY ix_user_roles_role_id (role_id),
                CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "CREATE TABLE IF NOT EXISTS role_permissions (
                role_id BIGINT UNSIGNED NOT NULL,
                permission_id BIGINT UNSIGNED NOT NULL,
                granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (role_id, permission_id),
                KEY ix_role_permissions_permission_id (permission_id),
                CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
                CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "CREATE TABLE IF NOT EXISTS sessions (
                session_id VARCHAR(128) NOT NULL,
                user_id BIGINT UNSIGNED NOT NULL,
                csrf_token VARCHAR(128) NOT NULL,
                issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                status VARCHAR(32) NOT NULL DEFAULT 'active',
                ip VARCHAR(45) NULL,
                user_agent VARCHAR(255) NULL,
                PRIMARY KEY (session_id),
                KEY ix_sessions_user_id (user_id),
                KEY ix_sessions_expires_at (expires_at),
                KEY ix_sessions_status (status),
                CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "CREATE TABLE IF NOT EXISTS settings (
                setting_key VARCHAR(191) NOT NULL,
                setting_value_json LONGTEXT NOT NULL,
                updated_by BIGINT UNSIGNED NULL,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (setting_key),
                KEY ix_settings_updated_by (updated_by),
                CONSTRAINT fk_settings_user FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "CREATE TABLE IF NOT EXISTS modules (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                module_key VARCHAR(150) NOT NULL,
                name VARCHAR(190) NOT NULL,
                version VARCHAR(64) NOT NULL,
                manifest_json LONGTEXT NULL,
                filesystem_path VARCHAR(255) NULL,
                is_present TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY ux_modules_module_key (module_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "CREATE TABLE IF NOT EXISTS module_state (
                module_id BIGINT UNSIGNED NOT NULL,
                status VARCHAR(32) NOT NULL DEFAULT 'inactive',
                is_enabled TINYINT(1) NOT NULL DEFAULT 0,
                installed_version VARCHAR(64) NULL,
                last_error TEXT NULL,
                changed_by BIGINT UNSIGNED NULL,
                changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (module_id),
                CONSTRAINT fk_module_state_module FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "CREATE TABLE IF NOT EXISTS module_migrations (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                module_id BIGINT UNSIGNED NOT NULL,
                migration_key VARCHAR(190) NOT NULL,
                applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY ux_module_migrations_module_key (module_id, migration_key),
                CONSTRAINT fk_module_migrations_module FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "CREATE TABLE IF NOT EXISTS setup_status (
                id TINYINT UNSIGNED NOT NULL,
                status VARCHAR(64) NOT NULL,
                current_step VARCHAR(120) NOT NULL,
                details_json LONGTEXT NULL,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                updated_by BIGINT UNSIGNED NULL,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "CREATE TABLE IF NOT EXISTS audit_log (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                action VARCHAR(120) NOT NULL,
                resource VARCHAR(120) NOT NULL,
                resource_id VARCHAR(191) NULL,
                actor_user_id BIGINT UNSIGNED NULL,
                details_json LONGTEXT NULL,
                result VARCHAR(64) NOT NULL DEFAULT 'ok',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY ix_audit_action (action),
                KEY ix_audit_resource (resource),
                KEY ix_audit_created_at (created_at),
                KEY ix_audit_actor_user_id (actor_user_id),
                CONSTRAINT fk_audit_actor_user FOREIGN KEY (actor_user_id) REFERENCES users (id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "CREATE TABLE IF NOT EXISTS backups (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                backup_key VARCHAR(190) NOT NULL,
                label VARCHAR(190) NOT NULL,
                provider VARCHAR(120) NOT NULL,
                status VARCHAR(64) NOT NULL,
                file_ref VARCHAR(255) NULL,
                meta_json LONGTEXT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY ux_backups_backup_key (backup_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "CREATE TABLE IF NOT EXISTS release_state (
                id TINYINT UNSIGNED NOT NULL,
                version VARCHAR(64) NOT NULL,
                environment VARCHAR(64) NOT NULL,
                status VARCHAR(64) NOT NULL,
                maintenance_mode TINYINT(1) NOT NULL DEFAULT 0,
                maintenance_reason TEXT NULL,
                checks_json LONGTEXT NULL,
                checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        ];

        $loginThrottleStatements = [
            "CREATE TABLE IF NOT EXISTS login_attempts (
                scope_key CHAR(64) NOT NULL,
                attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
                window_started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_attempt_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                locked_until TIMESTAMP NULL DEFAULT NULL,
                PRIMARY KEY (scope_key),
                KEY ix_login_attempts_last_attempt (last_attempt_at),
                KEY ix_login_attempts_locked_until (locked_until)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "INSERT INTO permissions (permission_key, description, scope)
             VALUES ('backups.view', 'View encrypted backup metadata and inventory', 'backups')
             ON DUPLICATE KEY UPDATE description = VALUES(description), scope = VALUES(scope)",
            "INSERT INTO permissions (permission_key, description, scope)
             VALUES ('backups.manage', 'Create, transfer and restore encrypted backups', 'backups')
             ON DUPLICATE KEY UPDATE description = VALUES(description), scope = VALUES(scope)",
            "INSERT IGNORE INTO role_permissions (role_id, permission_id)
             SELECT r.id, p.id FROM roles r JOIN permissions p ON p.permission_key IN ('backups.view','backups.manage') WHERE r.role_key = 'admin'",
        ];

        return [
            [
                'key' => '2026_08_25_0001_core_schema',
                'checksum' => sha1(implode("\n", $statements)),
                'statements' => $statements,
            ],
            [
                'key' => '2026_09_01_0002_login_throttle',
                'checksum' => sha1(implode("\n", $loginThrottleStatements)),
                'statements' => $loginThrottleStatements,
            ],
        ];
    }

    /**
     * @return array{
     *   migrationTableReady:bool,
     *   applied:list<string>,
     *   pending:list<string>,
     *   total:int
     * }
     */
    public function status(): array
    {
        $pdo = $this->database->connect();
        $migrationTableReady = $this->migrationTableExists($pdo);
        $applied = $migrationTableReady ? $this->appliedKeys($pdo) : [];
        $all = array_map(static fn ($migration) => $migration['key'], $this->definitions());
        $pending = array_values(array_filter($all, static fn ($key) => !in_array($key, $applied, true)));

        return [
            'migrationTableReady' => $migrationTableReady,
            'applied' => $applied,
            'pending' => $pending,
            'total' => count($all),
        ];
    }

    /**
     * @return array{
     *   applied:list<string>,
     *   skipped:list<string>,
     *   pending:list<string>
     * }
     */
    public function migrate(): array
    {
        $pdo = $this->database->connect();
        $this->ensureMigrationTable($pdo);
        $alreadyApplied = $this->appliedKeys($pdo);
        $appliedNow = [];
        $skipped = [];

        foreach ($this->definitions() as $migration) {
            $key = $migration['key'];
            if (in_array($key, $alreadyApplied, true)) {
                $skipped[] = $key;
                continue;
            }

            foreach ($migration['statements'] as $statement) {
                $pdo->exec($statement);
            }

            $insert = $pdo->prepare('INSERT INTO ' . self::MIGRATION_TABLE . ' (migration_key, checksum, applied_at) VALUES (:key, :checksum, CURRENT_TIMESTAMP)');
            $insert->execute([
                ':key' => $key,
                ':checksum' => $migration['checksum'],
            ]);
            $appliedNow[] = $key;
        }

        $status = $this->status();
        return [
            'applied' => $appliedNow,
            'skipped' => $skipped,
            'pending' => $status['pending'],
        ];
    }

    /**
     * @return list<string>
     */
    public function managedTables(): array
    {
        return array_values(array_unique(array_merge(self::CORE_TABLES, [self::MIGRATION_TABLE])));
    }

    private function migrationTableExists(PDO $pdo): bool
    {
        $query = $pdo->query("SHOW TABLES LIKE '" . self::MIGRATION_TABLE . "'");
        if ($query === false) {
            return false;
        }
        return (bool) $query->fetchColumn();
    }

    private function ensureMigrationTable(PDO $pdo): void
    {
        $pdo->exec("CREATE TABLE IF NOT EXISTS " . self::MIGRATION_TABLE . " (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            migration_key VARCHAR(191) NOT NULL,
            checksum CHAR(40) NOT NULL,
            applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY ux_schema_migrations_key (migration_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }

    /**
     * @return list<string>
     */
    private function appliedKeys(PDO $pdo): array
    {
        if (!$this->migrationTableExists($pdo)) {
            return [];
        }

        $statement = $pdo->query('SELECT migration_key FROM ' . self::MIGRATION_TABLE . ' ORDER BY id ASC');
        if ($statement === false) {
            return [];
        }
        $rows = $statement->fetchAll(PDO::FETCH_COLUMN);
        $keys = [];
        foreach ($rows as $value) {
            if (is_string($value) && $value !== '') {
                $keys[] = $value;
            }
        }
        return $keys;
    }
}

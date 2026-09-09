<?php
declare(strict_types=1);

namespace Neutral\Core;

use PDO;

final class SchemaMigrator
{
    public const SCHEMA_VERSION = '2026_09_09_0006';
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
        'user_profiles',
        'packages',
        'licenses',
        'license_users',
        'installation_presence',
        'user_media',
        'media_moderation_history',
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

        $moduleContractStatements = [
            "ALTER TABLE module_migrations ADD COLUMN checksum CHAR(64) NULL AFTER migration_key",
            "ALTER TABLE module_migrations ADD COLUMN module_version VARCHAR(64) NULL AFTER checksum",
        ];

        $operationsStatements = [
            "ALTER TABLE sessions ADD COLUMN device_id CHAR(32) NOT NULL DEFAULT '' AFTER user_agent",
            "ALTER TABLE sessions ADD COLUMN device_label VARCHAR(120) NOT NULL DEFAULT 'Browser installation' AFTER device_id",
            "CREATE INDEX ix_sessions_user_device ON sessions (user_id, device_id, status)",
            "DELETE rp FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id WHERE r.role_key IN ('viewer','user') AND p.permission_key IN ('admin.read','admin.write','auth.read','auth.write','user.read','user.write','role.read','role.write','settings.read','settings.write','session.read','session.write','audit.read','backups.view','backups.manage')",
        ];

        $accountLicenseStatements = [
            "ALTER TABLE users MODIFY email VARCHAR(190) NULL",
            "CREATE TABLE IF NOT EXISTS user_profiles (user_id BIGINT UNSIGNED NOT NULL, public_nickname VARCHAR(120) NULL, phone VARCHAR(80) NULL, address TEXT NULL, birthday DATE NULL, privacy_json TEXT NOT NULL, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (user_id), CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "CREATE TABLE IF NOT EXISTS packages (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, package_key VARCHAR(120) NOT NULL, name VARCHAR(190) NOT NULL, entitlements_json LONGTEXT NOT NULL, limits_json LONGTEXT NOT NULL, status VARCHAR(32) NOT NULL DEFAULT 'active', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY(id), UNIQUE KEY ux_packages_key(package_key)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "CREATE TABLE IF NOT EXISTS licenses (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, license_key VARCHAR(120) NOT NULL, organization_name VARCHAR(190) NOT NULL, package_id BIGINT UNSIGNED NOT NULL, seat_limit INT UNSIGNED NULL, device_limit INT UNSIGNED NULL, status VARCHAR(32) NOT NULL DEFAULT 'active', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY(id), UNIQUE KEY ux_licenses_key(license_key), CONSTRAINT fk_licenses_package FOREIGN KEY(package_id) REFERENCES packages(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "CREATE TABLE IF NOT EXISTS license_users (license_id BIGINT UNSIGNED NOT NULL, user_id BIGINT UNSIGNED NOT NULL, license_role VARCHAR(32) NOT NULL DEFAULT 'member', device_limit INT UNSIGNED NULL, assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(license_id,user_id), KEY ix_license_users_user(user_id), CONSTRAINT fk_license_users_license FOREIGN KEY(license_id) REFERENCES licenses(id) ON DELETE CASCADE, CONSTRAINT fk_license_users_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "CREATE TABLE IF NOT EXISTS installation_presence (installation_id CHAR(32) NOT NULL, user_id BIGINT UNSIGNED NULL, audience VARCHAR(32) NOT NULL DEFAULT 'anonymous', first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(installation_id), KEY ix_presence_last_seen(last_seen_at), KEY ix_presence_audience(audience), CONSTRAINT fk_presence_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "CREATE TABLE IF NOT EXISTS user_media (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, user_id BIGINT UNSIGNED NOT NULL, media_type VARCHAR(32) NOT NULL, storage_path VARCHAR(255) NOT NULL, mime_type VARCHAR(80) NOT NULL, byte_size INT UNSIGNED NOT NULL, moderation_status VARCHAR(32) NOT NULL DEFAULT 'pending', rejection_reason VARCHAR(255) NULL, moderator_note TEXT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY(id), KEY ix_user_media_user(user_id), KEY ix_user_media_status(moderation_status), CONSTRAINT fk_user_media_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "CREATE TABLE IF NOT EXISTS media_moderation_history (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, media_id BIGINT UNSIGNED NOT NULL, actor_user_id BIGINT UNSIGNED NULL, from_status VARCHAR(32) NULL, to_status VARCHAR(32) NOT NULL, reason VARCHAR(255) NULL, note TEXT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(id), KEY ix_media_history_media(media_id), CONSTRAINT fk_media_history_media FOREIGN KEY(media_id) REFERENCES user_media(id) ON DELETE CASCADE, CONSTRAINT fk_media_history_actor FOREIGN KEY(actor_user_id) REFERENCES users(id) ON DELETE SET NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            "INSERT INTO permissions (permission_key,description,scope) VALUES ('license.manage','Manage users and devices within an assigned license','license'),('profile.media.upload','Upload profile media when entitled','user-media'),('media.moderate','Review submitted user media','admin') ON DUPLICATE KEY UPDATE description=VALUES(description),scope=VALUES(scope)",
        ];
        $licenseMediaWorkflowStatements = [
            "ALTER TABLE license_users ADD COLUMN membership_status VARCHAR(32) NOT NULL DEFAULT 'active' AFTER license_role",
            "CREATE INDEX ix_license_users_status ON license_users (license_id, membership_status)",
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
            [
                'key' => '2026_09_03_0003_module_contract',
                'checksum' => sha1(implode("\n", $moduleContractStatements)),
                'statements' => $moduleContractStatements,
            ],
            [
                'key' => '2026_09_09_0004_operations_device_sessions',
                'checksum' => sha1(implode("\n", $operationsStatements)),
                'statements' => $operationsStatements,
            ],
            [
                'key' => '2026_09_09_0005_account_license_foundation',
                'checksum' => sha1(implode("\n", $accountLicenseStatements)),
                'statements' => $accountLicenseStatements,
            ],
            [
                'key' => '2026_09_09_0006_license_media_workflow',
                'checksum' => sha1(implode("\n", $licenseMediaWorkflowStatements)),
                'statements' => $licenseMediaWorkflowStatements,
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
        $connection = $this->database->connectionConfig();
        $lockName = 'neutral_schema_' . substr(hash('sha256', (string) ($connection['name'] ?? 'default')), 0, 32);
        $lockStatement = $pdo->prepare('SELECT GET_LOCK(:lock_name, 10)');
        $lockStatement->execute([':lock_name' => $lockName]);
        if ((int) $lockStatement->fetchColumn() !== 1) {
            throw new \RuntimeException('Could not acquire schema migration lock.');
        }
        try {
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
                    $this->executeStatementIdempotently($pdo, $statement);
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
        } finally {
            $release = $pdo->prepare('SELECT RELEASE_LOCK(:lock_name)');
            $release->execute([':lock_name' => $lockName]);
        }
    }

    private function executeStatementIdempotently(PDO $pdo, string $statement): void
    {
        try {
            $pdo->exec($statement);
        } catch (\PDOException $exception) {
            $driverCode = (int) ($exception->errorInfo[1] ?? 0);
            $isKnownAddColumn = preg_match('/^ALTER\s+TABLE\s+module_migrations\s+ADD\s+COLUMN\s+(checksum|module_version)\b/i', trim($statement), $matches) === 1;
            if ($isKnownAddColumn && ($exception->getCode() === '42S21' || $driverCode === 1060)) {
                $this->verifyExistingModuleMigrationColumn($pdo, strtolower($matches[1]));
                return;
            }
            $isDeviceColumn = preg_match('/^ALTER\s+TABLE\s+sessions\s+ADD\s+COLUMN\s+(device_id|device_label)\b/i', trim($statement)) === 1;
            if ($isDeviceColumn && ($exception->getCode() === '42S21' || $driverCode === 1060)) {
                return;
            }
            $isDeviceIndex = preg_match('/^CREATE\s+INDEX\s+ix_sessions_user_device\b/i', trim($statement)) === 1;
            if ($isDeviceIndex && $driverCode === 1061) {
                return;
            }
            $isMembershipColumn = preg_match('/^ALTER\s+TABLE\s+license_users\s+ADD\s+COLUMN\s+membership_status\b/i', trim($statement)) === 1;
            if ($isMembershipColumn && ($exception->getCode() === '42S21' || $driverCode === 1060)) return;
            $isMembershipIndex = preg_match('/^CREATE\s+INDEX\s+ix_license_users_status\b/i', trim($statement)) === 1;
            if ($isMembershipIndex && $driverCode === 1061) return;
            throw $exception;
        }
    }

    private function verifyExistingModuleMigrationColumn(PDO $pdo, string $column): void
    {
        $expectedType = $column === 'checksum' ? 'char(64)' : 'varchar(64)';
        $query = $pdo->query('SHOW COLUMNS FROM module_migrations LIKE ' . $pdo->quote($column));
        $definition = $query === false ? false : $query->fetch(PDO::FETCH_ASSOC);
        if (
            !is_array($definition)
            || strtolower((string) ($definition['Field'] ?? '')) !== $column
            || strtolower((string) ($definition['Type'] ?? '')) !== $expectedType
            || strtoupper((string) ($definition['Null'] ?? '')) !== 'YES'
        ) {
            throw new \RuntimeException('Existing module migration column is incompatible.');
        }
    }

    /**
     * @return list<string>
     */
    public function managedTables(): array
    {
        return array_values(array_unique(array_merge(self::CORE_TABLES, [self::MIGRATION_TABLE])));
    }

    public static function schemaVersion(): string
    {
        return self::SCHEMA_VERSION;
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

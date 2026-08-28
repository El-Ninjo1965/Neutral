<?php
declare(strict_types=1);

namespace Neutral\Core;

final class SetupInstaller
{
    private AppRuntime $runtime;
    private SetupStateStore $store;
    private PrerequisiteChecker $checker;
    private SchemaMigrator $migrator;
    private CoreDataSeeder $seeder;

    public function __construct(AppRuntime $runtime, SetupStateStore $store, PrerequisiteChecker $checker)
    {
        $this->runtime = $runtime;
        $this->store = $store;
        $this->checker = $checker;
        $this->migrator = new SchemaMigrator($runtime->database());
        $this->seeder = new CoreDataSeeder($runtime->database(), $runtime->config());
    }

    /**
     * @return array<string, mixed>
     */
    public function status(): array
    {
        $state = $this->store->load();
        $checkResult = $this->checker->run($this->runtime->projectRoot(), $this->runtime->envFile());
        $installationEvidence = $this->inspectInstallationEvidence();

        $state['checks'] = $checkResult['checks'];
        $state['checkSummary'] = $checkResult['summary'];
        $state['infrastructureCatalog'] = InfrastructureCatalog::defaultCatalog();
        $state['migrationState'] = $this->migrationStateFromChecks($checkResult);
        $state['installationEvidence'] = $installationEvidence;
        $state['configuration'] = array_merge($state['configuration'] ?? [], [
            'appId' => $this->runtime->config()->appId(),
            'appName' => $this->runtime->config()->appName(),
            'apiBase' => $this->runtime->config()->apiBase(),
            'database' => $this->publicDatabaseConfig(),
        ]);

        $migrationStatus = strtoupper((string) ($state['migrationState']['status'] ?? 'BLOCKED'));
        $runtimeReady = $checkResult['ok'] && $migrationStatus === 'ACTIVE';
        $persistedActive = strtoupper((string) ($state['status'] ?? '')) === 'ACTIVE'
            && (bool) (($state['installation']['active'] ?? false) === true);
        $detectedInstalled = (bool) ($installationEvidence['installed'] ?? false);

        if ($runtimeReady && ($persistedActive || $detectedInstalled)) {
            $state['status'] = 'ACTIVE';
            $state['installation']['active'] = true;
            $state['installation']['state'] = 'ACTIVE';
            $state['installation']['message'] = $detectedInstalled
                ? 'Existing installation detected from server-side state.'
                : 'Installation is active.';
            if (!$persistedActive) {
                $this->store->save($state);
            }
            return $state;
        }

        $state['status'] = $checkResult['ok'] ? 'READY_TO_INSTALL' : 'SETUP_REQUIRED';
        $state['installation']['active'] = false;
        $state['installation']['state'] = $state['status'];
        $state['installation']['message'] = $runtimeReady
            ? 'All prerequisites passed. Ready for install.'
            : 'Setup prerequisites not satisfied yet or migration is blocked.';
        if ($persistedActive && !$runtimeReady) {
            $this->store->save($state);
        }
        return $state;
    }

    /**
     * @return array<string, mixed>
     */
    public function install(): array
    {
        $currentStatus = $this->status();
        if (
            strtoupper((string) ($currentStatus['status'] ?? '')) === 'ACTIVE'
            && (bool) (($currentStatus['installation']['active'] ?? false) === true)
        ) {
            return $currentStatus;
        }
        $state = $this->store->load();

        $checkResult = $this->checker->run($this->runtime->projectRoot(), $this->runtime->envFile());
        if (!$checkResult['ok']) {
            $state['status'] = 'SETUP_REQUIRED';
            $state['checks'] = $checkResult['checks'];
            $state['checkSummary'] = $checkResult['summary'];
            $state['installation']['active'] = false;
            $state['installation']['state'] = 'SETUP_REQUIRED';
            $state['installation']['message'] = 'Installation blocked due to failed prerequisites.';
            $state['databaseState'] = [
                'configured' => false,
                'status' => 'ERROR',
                'message' => 'Database prerequisites are not satisfied.',
            ];
            $state['migrationState'] = $this->migrationStateFromChecks($checkResult);
            $this->store->save($state);
            return $state;
        }

        $databasePreparation = $this->runtime->database()->ensureDatabaseExists();
        if (!$databasePreparation['ok']) {
            $state['status'] = 'SETUP_REQUIRED';
            $state['databaseState'] = [
                'configured' => true,
                'status' => 'ERROR',
                'message' => $databasePreparation['message'],
            ];
            $state['installation']['active'] = false;
            $state['installation']['state'] = 'SETUP_REQUIRED';
            $state['installation']['message'] = 'Installation blocked: database is not ready.';
            $state['migrationState'] = [
                'status' => 'BLOCKED',
                'message' => 'Migrations cannot run until database preparation succeeds.',
                'applied' => [],
                'pending' => [],
                'total' => 0,
            ];
            $this->store->save($state);
            return $state;
        }

        $migrationResult = $this->migrator->migrate();
        $seedResult = $this->seeder->seed();
        $migrationStatus = $this->migrator->status();
        $publicDb = $this->publicDatabaseConfig();
        $nextState = array_replace_recursive($state, [
            'status' => 'ACTIVE',
            'currentStep' => 'installed',
            'installation' => [
                'active' => true,
                'state' => 'ACTIVE',
                'message' => 'Installation completed from .env with MySQL schema and core seed data.',
            ],
            'serverState' => [
                'configured' => true,
                'status' => 'ACTIVE',
                'message' => 'Server configuration loaded from .env.',
            ],
            'databaseState' => [
                'configured' => true,
                'status' => 'ACTIVE',
                'message' => $databasePreparation['message'],
                'type' => $publicDb['type'],
                'host' => $publicDb['host'],
                'port' => $publicDb['port'],
                'name' => $publicDb['name'],
                'username' => $publicDb['user'],
                'passwordPresent' => $publicDb['passwordPresent'],
                'created' => $databasePreparation['created'],
                'existing' => $databasePreparation['existing'],
            ],
            'bootstrapState' => [
                'configured' => true,
                'enabled' => true,
                'status' => 'ACTIVE',
                'username' => (string) ($this->runtime->config()->env()['CORE_BOOTSTRAP_USERNAME'] ?? ''),
                'displayId' => 'USR-000101',
                'role' => 'admin',
                'message' => 'Bootstrap administrator has been prepared from .env.',
                'mode' => $seedResult['bootstrapUser'],
            ],
            'migrationState' => [
                'status' => $migrationStatus['pending'] === [] ? 'ACTIVE' : 'PENDING',
                'message' => $migrationStatus['pending'] === [] ? 'Schema is up to date.' : 'Pending migrations are still available.',
                'appliedNow' => $migrationResult['applied'],
                'skipped' => $migrationResult['skipped'],
                'applied' => $migrationStatus['applied'],
                'pending' => $migrationStatus['pending'],
                'total' => $migrationStatus['total'],
            ],
            'configuration' => [
                'appId' => $this->runtime->config()->appId(),
                'appName' => $this->runtime->config()->appName(),
                'apiBase' => $this->runtime->config()->apiBase(),
                'database' => $publicDb,
            ],
            'checks' => $checkResult['checks'],
            'checkSummary' => $checkResult['summary'],
            'infrastructureCatalog' => InfrastructureCatalog::defaultCatalog(),
        ]);

        $saved = $this->store->save($nextState);
        $this->seeder->syncSetupStatus($saved);
        $this->runtime->logger()->info('Setup installation activated.', [
            'appId' => $this->runtime->config()->appId(),
            'envFile' => $this->runtime->envFile(),
            'migrationsApplied' => count($migrationResult['applied']),
        ]);

        return $saved;
    }

    /**
     * @return array{
     *   ok:bool,
     *   droppedTables:list<string>,
     *   removedFiles:list<string>,
     *   state:array<string,mixed>
     * }
     */
    public function resetApplicationState(): array
    {
        $pdo = $this->runtime->database()->connect();
        $managedTables = $this->migrator->managedTables();
        $droppedTables = [];

        $pdo->beginTransaction();
        try {
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
            foreach ($managedTables as $tableName) {
                if ($this->tableExists($pdo, $tableName)) {
                    $pdo->exec('DROP TABLE IF EXISTS `' . str_replace('`', '``', $tableName) . '`');
                    $droppedTables[] = $tableName;
                }
            }
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
            $pdo->commit();
        } catch (\Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $exception;
        }

        $removedFiles = $this->removeLegacyStateFiles();
        $this->store->reset();
        $state = $this->status();
        $this->runtime->logger()->info('Setup reset completed.', [
            'droppedTables' => $droppedTables,
            'removedFiles' => $removedFiles,
        ]);

        return [
            'ok' => true,
            'droppedTables' => $droppedTables,
            'removedFiles' => $removedFiles,
            'state' => $state,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function publicDatabaseConfig(): array
    {
        $database = $this->runtime->config()->database();
        return [
            'type' => $database['type'],
            'host' => $database['host'],
            'port' => $database['port'],
            'name' => $database['name'],
            'user' => $database['user'],
            'url' => $database['url'],
            'passwordPresent' => trim($database['password']) !== '',
        ];
    }

    /**
     * @param array{ok:bool,checks:array<string,mixed>} $checkResult
     * @return array<string,mixed>
     */
    private function migrationStateFromChecks(array $checkResult): array
    {
        $dbConnectionOk = (bool) (($checkResult['checks']['database_connection']['ok'] ?? false) === true);
        if (!$dbConnectionOk) {
            return [
                'status' => 'BLOCKED',
                'message' => 'Migrations are blocked until database connectivity is available.',
                'applied' => [],
                'pending' => [],
                'total' => 0,
            ];
        }

        try {
            $status = $this->migrator->status();
            return [
                'status' => $status['pending'] === [] ? 'ACTIVE' : 'READY',
                'message' => $status['pending'] === [] ? 'Schema is up to date.' : 'Schema is ready to install.',
                'applied' => $status['applied'],
                'pending' => $status['pending'],
                'total' => $status['total'],
            ];
        } catch (\Throwable $exception) {
            return [
                'status' => 'ERROR',
                'message' => $exception->getMessage(),
                'applied' => [],
                'pending' => [],
                'total' => 0,
            ];
        }
    }

    /**
     * @return array<string,mixed>
     */
    private function inspectInstallationEvidence(): array
    {
        $evidence = [
            'installed' => false,
            'databaseReachable' => false,
            'migrationTableReady' => false,
            'appliedMigrations' => [],
            'managedTablesPresent' => [],
            'setupStatus' => null,
            'users' => [
                'total' => 0,
                'admin' => 0,
                'developer' => 0,
            ],
            'error' => null,
        ];

        try {
            $pdo = $this->runtime->database()->connect();
            $evidence['databaseReachable'] = true;

            $migrationStatus = $this->migrator->status();
            $evidence['migrationTableReady'] = (bool) ($migrationStatus['migrationTableReady'] ?? false);
            $evidence['appliedMigrations'] = is_array($migrationStatus['applied'] ?? null) ? $migrationStatus['applied'] : [];

            foreach ($this->migrator->managedTables() as $tableName) {
                $evidence['managedTablesPresent'][$tableName] = $this->tableExists($pdo, $tableName);
            }

            if ($this->tableExists($pdo, 'setup_status')) {
                $statement = $pdo->query('SELECT status, current_step FROM setup_status WHERE id = 1 LIMIT 1');
                $setupStatusRow = $statement ? $statement->fetch(\PDO::FETCH_ASSOC) : false;
                if (is_array($setupStatusRow)) {
                    $evidence['setupStatus'] = [
                        'status' => (string) ($setupStatusRow['status'] ?? ''),
                        'currentStep' => (string) ($setupStatusRow['current_step'] ?? ''),
                    ];
                }
            }

            if ($this->tableExists($pdo, 'users')) {
                $totalUsers = 0;
                $countStatement = $pdo->query('SELECT COUNT(*) FROM users');
                if ($countStatement !== false) {
                    $totalUsers = (int) ($countStatement->fetchColumn() ?: 0);
                }
                $evidence['users']['total'] = $totalUsers;
            }

            if ($this->tableExists($pdo, 'users') && $this->tableExists($pdo, 'user_roles') && $this->tableExists($pdo, 'roles')) {
                $roleCounts = $pdo->query("
                    SELECT r.role_key, COUNT(DISTINCT ur.user_id) AS total
                    FROM user_roles ur
                    JOIN roles r ON r.id = ur.role_id
                    WHERE r.role_key IN ('admin','developer')
                    GROUP BY r.role_key
                ");
                if ($roleCounts) {
                    foreach ($roleCounts->fetchAll(\PDO::FETCH_ASSOC) as $row) {
                        if (!is_array($row)) {
                            continue;
                        }
                        $roleKey = strtolower(trim((string) ($row['role_key'] ?? '')));
                        $total = (int) ($row['total'] ?? 0);
                        if ($roleKey === 'admin') {
                            $evidence['users']['admin'] = $total;
                        }
                        if ($roleKey === 'developer') {
                            $evidence['users']['developer'] = $total;
                        }
                    }
                }
            }

            $setupStatus = strtolower(trim((string) (($evidence['setupStatus']['status'] ?? '') ?: '')));
            $hasAppliedMigrations = count($evidence['appliedMigrations']) > 0;
            $hasCoreTables = ($evidence['managedTablesPresent']['users'] ?? false) && ($evidence['managedTablesPresent']['roles'] ?? false);
            $hasUsers = (int) ($evidence['users']['total'] ?? 0) > 0;
            $evidence['installed'] = $hasAppliedMigrations || $setupStatus === 'active' || ($hasCoreTables && $hasUsers);
        } catch (\Throwable $exception) {
            $evidence['error'] = $exception->getMessage();
        }

        return $evidence;
    }

    private function tableExists(\PDO $pdo, string $tableName): bool
    {
        $query = $pdo->query('SHOW TABLES LIKE ' . $pdo->quote($tableName));
        return $query !== false && (bool) $query->fetchColumn();
    }

    /**
     * @return list<string>
     */
    private function removeLegacyStateFiles(): array
    {
        $paths = [
            $this->runtime->projectRoot() . '/config/admin-users.json',
            $this->runtime->projectRoot() . '/config/admin-roles.json',
            $this->runtime->projectRoot() . '/config/admin-settings.json',
            $this->runtime->projectRoot() . '/config/audit-log.json',
            $this->runtime->projectRoot() . '/server/runtime/sessions.json',
        ];
        $removed = [];
        foreach ($paths as $path) {
            if (is_file($path)) {
                if (!unlink($path)) {
                    throw new \RuntimeException('Could not remove legacy setup state file: ' . $path);
                }
                $removed[] = $path;
            }
        }
        return $removed;
    }
}

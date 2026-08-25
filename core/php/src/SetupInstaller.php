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

        $state['checks'] = $checkResult['checks'];
        $state['checkSummary'] = $checkResult['summary'];
        $state['infrastructureCatalog'] = InfrastructureCatalog::defaultCatalog();
        $state['migrationState'] = $this->migrationStateFromChecks($checkResult);
        $state['configuration'] = array_merge($state['configuration'] ?? [], [
            'appId' => $this->runtime->config()->appId(),
            'appName' => $this->runtime->config()->appName(),
            'apiBase' => $this->runtime->config()->apiBase(),
            'database' => $this->publicDatabaseConfig(),
        ]);

        $migrationStatus = strtoupper((string) ($state['migrationState']['status'] ?? 'BLOCKED'));
        $runtimeReady = $checkResult['ok'] && !in_array($migrationStatus, ['BLOCKED', 'ERROR'], true);
        $persistedActive = strtoupper((string) ($state['status'] ?? '')) === 'ACTIVE'
            && (bool) (($state['installation']['active'] ?? false) === true);

        if (!$persistedActive || !$runtimeReady) {
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

        $state['status'] = 'ACTIVE';
        $state['installation']['active'] = true;
        $state['installation']['state'] = 'ACTIVE';
        $state['installation']['message'] = 'Installation is active.';
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
}

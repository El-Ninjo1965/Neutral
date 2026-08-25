<?php
declare(strict_types=1);

namespace Neutral\Core;

final class SetupInstaller
{
    private AppRuntime $runtime;
    private SetupStateStore $store;
    private PrerequisiteChecker $checker;

    public function __construct(AppRuntime $runtime, SetupStateStore $store, PrerequisiteChecker $checker)
    {
        $this->runtime = $runtime;
        $this->store = $store;
        $this->checker = $checker;
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
        $state['configuration'] = array_merge($state['configuration'] ?? [], [
            'appId' => $this->runtime->config()->appId(),
            'appName' => $this->runtime->config()->appName(),
            'apiBase' => $this->runtime->config()->apiBase(),
            'database' => $this->publicDatabaseConfig(),
        ]);

        if (!$this->store->isInstalled()) {
            $state['status'] = $checkResult['ok'] ? 'READY_TO_INSTALL' : 'SETUP_REQUIRED';
            $state['installation']['active'] = false;
            $state['installation']['state'] = $state['status'];
            $state['installation']['message'] = $checkResult['ok']
                ? 'All prerequisites passed. Ready for install.'
                : 'Setup prerequisites not satisfied yet.';
        }

        return $state;
    }

    /**
     * @return array<string, mixed>
     */
    public function install(): array
    {
        $state = $this->store->load();
        if ($this->store->isInstalled()) {
            return $this->status();
        }

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
            $this->store->save($state);
            return $state;
        }

        $publicDb = $this->publicDatabaseConfig();
        $nextState = array_replace_recursive($state, [
            'status' => 'ACTIVE',
            'currentStep' => 'installed',
            'installation' => [
                'active' => true,
                'state' => 'ACTIVE',
                'message' => 'Installation activated from .env configuration.',
            ],
            'serverState' => [
                'configured' => true,
                'status' => 'ACTIVE',
                'message' => 'Server configuration loaded from .env.',
            ],
            'databaseState' => [
                'configured' => true,
                'status' => 'ACTIVE',
                'message' => 'Database configuration loaded from .env.',
                'type' => $publicDb['type'],
                'host' => $publicDb['host'],
                'port' => $publicDb['port'],
                'name' => $publicDb['name'],
                'username' => $publicDb['user'],
                'passwordPresent' => true,
            ],
            'bootstrapState' => [
                'configured' => true,
                'enabled' => true,
                'status' => 'ACTIVE',
                'username' => 'Developer',
                'displayId' => 'USR-000101',
                'role' => 'developer',
                'message' => 'Developer bootstrap is prepared.',
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

        $this->store->save($nextState);
        $this->runtime->logger()->info('Setup installation activated.', [
            'appId' => $this->runtime->config()->appId(),
            'envFile' => $this->runtime->envFile(),
        ]);

        return $nextState;
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
}

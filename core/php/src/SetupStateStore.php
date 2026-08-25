<?php
declare(strict_types=1);

namespace Neutral\Core;

final class SetupStateStore
{
    private string $stateFile;

    public function __construct(string $stateFile)
    {
        $this->stateFile = $stateFile;
    }

    public static function defaultStateFile(string $projectRoot): string
    {
        return rtrim($projectRoot, "/\\") . '/server/runtime/setup-state.json';
    }

    /**
     * @return array<string, mixed>
     */
    public function load(): array
    {
        if (!is_file($this->stateFile) || !is_readable($this->stateFile)) {
            return $this->defaultState();
        }

        $raw = file_get_contents($this->stateFile);
        if ($raw === false || trim($raw) === '') {
            return $this->defaultState();
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return $this->defaultState();
        }

        return array_replace_recursive($this->defaultState(), $decoded);
    }

    /**
     * @param array<string, mixed> $state
     * @return array<string, mixed>
     */
    public function save(array $state): array
    {
        $directory = dirname($this->stateFile);
        if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
            throw new \RuntimeException('Could not create setup runtime directory: ' . $directory);
        }

        $state['updatedAt'] = gmdate('c');
        $json = json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            throw new \RuntimeException('Could not encode setup state as JSON.');
        }

        $written = file_put_contents($this->stateFile, $json . PHP_EOL, LOCK_EX);
        if ($written === false) {
            throw new \RuntimeException('Could not persist setup state file.');
        }

        return $state;
    }

    public function isInstalled(): bool
    {
        $state = $this->load();
        $status = strtoupper((string) ($state['status'] ?? ''));
        $installActive = (bool) (($state['installation']['active'] ?? false) === true);
        return $status === 'ACTIVE' || $installActive;
    }

    /**
     * @return array<string, mixed>
     */
    private function defaultState(): array
    {
        return [
            'status' => 'SETUP_REQUIRED',
            'currentStep' => 'setup',
            'installation' => [
                'active' => false,
                'state' => 'SETUP_REQUIRED',
                'message' => 'Installation not activated yet.',
            ],
            'serverState' => [
                'configured' => false,
                'status' => 'SETUP_REQUIRED',
                'message' => 'Server configuration not validated yet.',
            ],
            'databaseState' => [
                'configured' => false,
                'status' => 'SETUP_REQUIRED',
                'message' => 'Database configuration not validated yet.',
            ],
            'bootstrapState' => [
                'configured' => false,
                'enabled' => false,
                'status' => 'SETUP_REQUIRED',
                'message' => 'Bootstrap account not initialized yet.',
            ],
            'configuration' => [],
            'checks' => [],
            'updatedAt' => gmdate('c'),
        ];
    }
}

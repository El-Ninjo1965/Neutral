<?php
declare(strict_types=1);

namespace Neutral\Core;

final class PrerequisiteChecker
{
    private AppConfig $config;
    private Database $database;

    public function __construct(AppConfig $config, Database $database)
    {
        $this->config = $config;
        $this->database = $database;
    }

    /**
     * @param string $projectRoot
     * @param string $envFile
     * @return array{
     *   ok: bool,
     *   checks: array<string, array<string, mixed>>,
     *   summary: array<string, mixed>
     * }
     */
    public function run(string $projectRoot, string $envFile): array
    {
        $database = $this->config->database();
        $missingDbConfig = [];
        foreach (['host', 'port', 'name', 'user'] as $requiredKey) {
            if ($database['url'] === '' && trim((string) ($database[$requiredKey] ?? '')) === '') {
                $missingDbConfig[] = $requiredKey;
            }
        }
        if ($database['url'] === '' && trim($database['password']) === '') {
            $missingDbConfig[] = 'password';
        }

        $checks = [];
        $checks['php_version'] = [
            'ok' => version_compare(PHP_VERSION, '8.0.0', '>='),
            'required' => '>=8.0.0',
            'current' => PHP_VERSION,
        ];
        $checks['php_extensions'] = [
            'ok' => extension_loaded('json') && extension_loaded('pdo') && extension_loaded('pdo_mysql'),
            'required' => ['json', 'pdo', 'pdo_mysql'],
            'current' => [
                'json' => extension_loaded('json'),
                'pdo' => extension_loaded('pdo'),
                'pdo_mysql' => extension_loaded('pdo_mysql'),
            ],
        ];
        $checks['env_file'] = [
            'ok' => is_file($envFile) && is_readable($envFile),
            'file' => $envFile,
            'exists' => is_file($envFile),
            'readable' => is_readable($envFile),
        ];

        $runtimeDir = rtrim($projectRoot, "/\\") . '/Server/runtime';
        $checks['runtime_directory'] = [
            'ok' => $this->ensureWritableDirectory($runtimeDir),
            'path' => $runtimeDir,
            'writable' => is_dir($runtimeDir) ? is_writable($runtimeDir) : false,
        ];

        $checks['database_config'] = [
            'ok' => $missingDbConfig === [],
            'missing' => $missingDbConfig,
            'type' => $database['type'],
            'host' => $database['host'],
            'port' => $database['port'],
            'name' => $database['name'],
            'user' => $database['user'],
        ];

        $dbConnectionCheck = [
            'ok' => false,
            'status' => 'skipped',
            'message' => 'Database connectivity check skipped.',
        ];
        if ($checks['database_config']['ok']) {
            try {
                $dbConnectionCheck['ok'] = $this->database->ping();
                $dbConnectionCheck['status'] = $dbConnectionCheck['ok'] ? 'ready' : 'error';
                $dbConnectionCheck['message'] = $dbConnectionCheck['ok']
                    ? 'Database connection is available.'
                    : 'Database ping returned an unexpected result.';
            } catch (\Throwable $exception) {
                $dbConnectionCheck['ok'] = false;
                $dbConnectionCheck['status'] = 'error';
                $dbConnectionCheck['message'] = $exception->getMessage();
            }
        }
        $checks['database_connection'] = $dbConnectionCheck;

        $overall = true;
        foreach ($checks as $item) {
            $overall = $overall && (bool) ($item['ok'] ?? false);
        }

        return [
            'ok' => $overall,
            'checks' => $checks,
            'summary' => [
                'checkedAt' => gmdate('c'),
                'environment' => $this->config->environment(),
                'appId' => $this->config->appId(),
                'appName' => $this->config->appName(),
            ],
        ];
    }

    private function ensureWritableDirectory(string $directory): bool
    {
        if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
            return false;
        }
        return is_writable($directory);
    }
}

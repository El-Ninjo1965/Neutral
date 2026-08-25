<?php
declare(strict_types=1);

namespace Neutral\Core;

final class AppRuntime
{
    private string $projectRoot;
    private string $envFile;
    private AppConfig $config;
    private AppLogger $logger;
    private Database $database;

    public function __construct(string $projectRoot, string $envFile, AppConfig $config, AppLogger $logger, Database $database)
    {
        $this->projectRoot = $projectRoot;
        $this->envFile = $envFile;
        $this->config = $config;
        $this->logger = $logger;
        $this->database = $database;
    }

    /**
     * @param array{project_root?:string, register_error_handler?:bool} $options
     */
    public static function init(array $options = []): self
    {
        $projectRoot = rtrim((string) ($options['project_root'] ?? dirname(__DIR__, 3)), "/\\");
        $registerErrorHandler = (bool) ($options['register_error_handler'] ?? true);

        $envFile = EnvLoader::detectEnvFile($projectRoot);
        $env = EnvLoader::loadMerged($projectRoot);
        $config = new AppConfig($env);
        $logger = new AppLogger(AppLogger::defaultLogFile($projectRoot));
        $database = new Database($config);

        $runtime = new self($projectRoot, $envFile, $config, $logger, $database);
        $runtime->configurePhpRuntime();
        if ($registerErrorHandler) {
            $runtime->registerErrorHandling();
        }
        return $runtime;
    }

    private function configurePhpRuntime(): void
    {
        date_default_timezone_set('UTC');
        if ($this->config->isDebug()) {
            ini_set('display_errors', '1');
            error_reporting(E_ALL);
            return;
        }

        ini_set('display_errors', '0');
        error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_STRICT);
    }

    private function registerErrorHandling(): void
    {
        set_error_handler(function (int $severity, string $message, string $file, int $line): bool {
            if (!(error_reporting() & $severity)) {
                return false;
            }
            throw new \ErrorException($message, 0, $severity, $file, $line);
        });

        set_exception_handler(function (\Throwable $exception): void {
            $this->logger->error('Unhandled exception', [
                'exception' => get_class($exception),
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ]);

            if ($this->expectsJsonResponse()) {
                JsonResponse::error(
                    $this->config->isDebug() ? $exception->getMessage() : 'Internal server error.',
                    500
                );
            }

            http_response_code(500);
            header('Content-Type: text/plain; charset=utf-8');
            echo $this->config->isDebug() ? $exception->getMessage() : 'Internal server error.';
            exit;
        });
    }

    private function expectsJsonResponse(): bool
    {
        $uri = (string) ($_SERVER['REQUEST_URI'] ?? '');
        if (str_contains($uri, '/api/')) {
            return true;
        }

        $accept = strtolower((string) ($_SERVER['HTTP_ACCEPT'] ?? ''));
        return str_contains($accept, 'application/json');
    }

    public function projectRoot(): string
    {
        return $this->projectRoot;
    }

    public function envFile(): string
    {
        return $this->envFile;
    }

    public function config(): AppConfig
    {
        return $this->config;
    }

    public function logger(): AppLogger
    {
        return $this->logger;
    }

    public function database(): Database
    {
        return $this->database;
    }
}

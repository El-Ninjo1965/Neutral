<?php
declare(strict_types=1);

namespace Neutral\Core;

final class AppConfig
{
    /** @var array<string, string> */
    private array $env;

    /**
     * @param array<string, string> $env
     */
    public function __construct(array $env)
    {
        $this->env = $env;
    }

    /**
     * @return array<string, string>
     */
    public function env(): array
    {
        return $this->env;
    }

    public function appId(): string
    {
        return trim($this->env['APP_ID'] ?? $this->env['DEFAULT_APP_ID'] ?? 'neutral-app');
    }

    public function appName(): string
    {
        return trim($this->env['APP_NAME'] ?? 'Neutral Platform');
    }

    public function apiBase(): string
    {
        $value = trim($this->env['API_BASE'] ?? $this->env['NEUTRAL_API_BASE'] ?? $this->env['APP_API_BASE'] ?? '/api');
        if ($value === '') {
            return '/api';
        }
        return str_starts_with($value, '/') ? $value : '/' . $value;
    }

    public function environment(): string
    {
        $value = strtolower(trim($this->env['APP_ENV'] ?? $this->env['NODE_ENV'] ?? 'production'));
        return $value === '' ? 'production' : $value;
    }

    public function isDebug(): bool
    {
        $debug = strtolower(trim($this->env['APP_DEBUG'] ?? ''));
        if ($debug !== '') {
            return in_array($debug, ['1', 'true', 'yes', 'on'], true);
        }
        return $this->environment() !== 'production';
    }

    public function isSetupRecoveryEnabled(): bool
    {
        $value = strtolower(trim($this->env['NEUTRAL_SETUP_RECOVERY_ENABLED'] ?? ''));
        return in_array($value, ['1', 'true', 'yes', 'on'], true);
    }

    public function setupRecoveryToken(): string
    {
        return trim($this->env['NEUTRAL_SETUP_RECOVERY_TOKEN'] ?? '');
    }

    public function hasDatabaseConfiguration(): bool
    {
        $database = $this->database();
        if (trim($database['url']) !== '') {
            return true;
        }
        return trim($database['host']) !== ''
            && trim($database['name']) !== ''
            && trim($database['user']) !== '';
    }

    /** @return array{identifierLimit:int,ipLimit:int,windowSeconds:int,lockSeconds:int} */
    public function loginRateLimit(): array
    {
        return [
            'identifierLimit' => max(1, (int) ($this->env['AUTH_LOGIN_IDENTIFIER_LIMIT'] ?? 5)),
            'ipLimit' => max(1, (int) ($this->env['AUTH_LOGIN_IP_LIMIT'] ?? 20)),
            'windowSeconds' => max(60, (int) ($this->env['AUTH_LOGIN_WINDOW_SECONDS'] ?? 900)),
            'lockSeconds' => max(60, (int) ($this->env['AUTH_LOGIN_LOCK_SECONDS'] ?? 900)),
        ];
    }

    /**
     * @return array{
     *   type:string,
     *   host:string,
     *   port:string,
     *   name:string,
     *   user:string,
     *   password:string,
     *   url:string
     * }
     */
    public function database(): array
    {
        $dbType = trim($this->env['DB_TYPE'] ?? $this->env['MYSQL_TYPE'] ?? 'mysql');
        $dbHost = trim($this->env['DB_HOST'] ?? $this->env['MYSQL_HOST'] ?? '127.0.0.1');
        $dbPort = trim($this->env['DB_PORT'] ?? $this->env['MYSQL_PORT'] ?? '3306');
        $dbName = trim($this->env['DB_NAME'] ?? $this->env['MYSQL_DATABASE'] ?? '');
        $dbUser = trim($this->env['DB_USER'] ?? $this->env['MYSQL_USER'] ?? '');
        $dbPassword = trim($this->env['DB_PASSWORD'] ?? $this->env['MYSQL_PASSWORD'] ?? '');
        $dbUrl = trim($this->env['DB_URL'] ?? $this->env['DATABASE_URL'] ?? '');

        return [
            'type' => $dbType !== '' ? $dbType : 'mysql',
            'host' => $dbHost,
            'port' => $dbPort,
            'name' => $dbName,
            'user' => $dbUser,
            'password' => $dbPassword,
            'url' => $dbUrl,
        ];
    }

    /**
     * @param list<string> $requiredKeys
     * @return list<string>
     */
    public function missingKeys(array $requiredKeys): array
    {
        $missing = [];
        foreach ($requiredKeys as $key) {
            $value = trim((string) ($this->env[$key] ?? ''));
            if ($value === '') {
                $missing[] = $key;
            }
        }
        return $missing;
    }
}

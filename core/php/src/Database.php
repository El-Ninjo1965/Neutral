<?php
declare(strict_types=1);

namespace Neutral\Core;

use PDO;
use PDOException;

final class Database
{
    private AppConfig $config;
    private ?PDO $pdo = null;
    private ?PDO $serverPdo = null;

    public function __construct(AppConfig $config)
    {
        $this->config = $config;
    }

    public function connect(): PDO
    {
        if ($this->pdo instanceof PDO) {
            return $this->pdo;
        }

        if (!extension_loaded('pdo_mysql')) {
            throw new \RuntimeException('Missing required PHP extension: pdo_mysql');
        }

        $connection = $this->connectionConfig();
        $this->pdo = $this->connectWithConfig($connection, true);

        return $this->pdo;
    }

    public function connectServer(): PDO
    {
        if ($this->serverPdo instanceof PDO) {
            return $this->serverPdo;
        }

        if (!extension_loaded('pdo_mysql')) {
            throw new \RuntimeException('Missing required PHP extension: pdo_mysql');
        }

        $connection = $this->connectionConfig();
        $this->serverPdo = $this->connectWithConfig($connection, false);
        return $this->serverPdo;
    }

    public function ping(): bool
    {
        $pdo = $this->connect();
        $statement = $pdo->query('SELECT 1 AS ok');
        if ($statement === false) {
            throw new \RuntimeException('Database ping query failed.');
        }
        $result = $statement->fetch();
        return isset($result['ok']) && (string) $result['ok'] === '1';
    }

    /**
     * @return array{
     *   ok:bool,
     *   created:bool,
     *   existing:bool,
     *   message:string
     * }
     */
    public function ensureDatabaseExists(): array
    {
        $connection = $this->connectionConfig();
        if ($connection['name'] === '') {
            throw new \RuntimeException('Database name is missing in DB configuration.');
        }

        try {
            $server = $this->connectServer();
        } catch (\Throwable $exception) {
            return [
                'ok' => false,
                'created' => false,
                'existing' => false,
                'message' => 'Could not connect to MySQL server for database preparation: ' . $exception->getMessage(),
            ];
        }

        try {
            $statement = $server->prepare('SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = :name LIMIT 1');
            $statement->execute([':name' => $connection['name']]);
            $existing = (bool) $statement->fetchColumn();
            if ($existing) {
                return [
                    'ok' => true,
                    'created' => false,
                    'existing' => true,
                    'message' => 'Database already exists.',
                ];
            }

            $quotedName = '`' . str_replace('`', '``', $connection['name']) . '`';
            $server->exec('CREATE DATABASE IF NOT EXISTS ' . $quotedName . ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

            return [
                'ok' => true,
                'created' => true,
                'existing' => false,
                'message' => 'Database created successfully.',
            ];
        } catch (\Throwable $exception) {
            return [
                'ok' => false,
                'created' => false,
                'existing' => false,
                'message' => 'Database creation is not permitted or failed: ' . $exception->getMessage(),
            ];
        }
    }

    /**
     * @return array{type:string,host:string,port:string,name:string,user:string,password:string,url:string}
     */
    public function connectionConfig(): array
    {
        $database = $this->config->database();
        if ($database['url'] !== '') {
            $parts = parse_url($database['url']);
            if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
                throw new \RuntimeException('Invalid DB_URL / DATABASE_URL in environment.');
            }

            $scheme = strtolower((string) $parts['scheme']);
            if ($scheme !== 'mysql') {
                throw new \RuntimeException('Unsupported DB URL scheme: ' . $scheme);
            }

            $host = (string) $parts['host'];
            $port = (string) ($parts['port'] ?? '3306');
            $name = ltrim((string) ($parts['path'] ?? ''), '/');
            $user = (string) ($parts['user'] ?? '');
            $password = (string) ($parts['pass'] ?? '');

            if ($user === '') {
                throw new \RuntimeException('DB URL must include username.');
            }

            return [
                'type' => 'mysql',
                'host' => $host,
                'port' => $port,
                'name' => $name,
                'user' => $user,
                'password' => $password,
                'url' => $database['url'],
            ];
        }

        if ($database['host'] === '' || $database['port'] === '' || $database['user'] === '') {
            throw new \RuntimeException('Incomplete database configuration in environment.');
        }

        if (strtolower($database['type']) !== 'mysql') {
            throw new \RuntimeException('Unsupported DB_TYPE: ' . $database['type']);
        }

        return $database;
    }

    /**
     * @param array{type:string,host:string,port:string,name:string,user:string,password:string,url:string} $connection
     */
    private function connectWithConfig(array $connection, bool $withDatabase): PDO
    {
        $dsn = sprintf(
            'mysql:host=%s;port=%s%s;charset=utf8mb4',
            $connection['host'],
            $connection['port'],
            ($withDatabase && trim($connection['name']) !== '') ? ';dbname=' . $connection['name'] : ''
        );

        try {
            return new PDO($dsn, $connection['user'], $connection['password'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $exception) {
            throw new \RuntimeException('Database connection failed: ' . $exception->getMessage(), 0, $exception);
        }
    }
}

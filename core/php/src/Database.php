<?php
declare(strict_types=1);

namespace Neutral\Core;

use PDO;
use PDOException;

final class Database
{
    private AppConfig $config;
    private ?PDO $pdo = null;

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

        $database = $this->config->database();
        [$dsn, $user, $password] = $this->resolveConnectionConfig($database);

        try {
            $this->pdo = new PDO($dsn, $user, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $exception) {
            throw new \RuntimeException('Database connection failed: ' . $exception->getMessage(), 0, $exception);
        }

        return $this->pdo;
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
     * @param array{type:string,host:string,port:string,name:string,user:string,password:string,url:string} $database
     * @return array{0:string,1:string,2:string}
     */
    private function resolveConnectionConfig(array $database): array
    {
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

            if ($name === '' || $user === '') {
                throw new \RuntimeException('DB URL must include database name and username.');
            }

            return [
                sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $name),
                $user,
                $password,
            ];
        }

        if ($database['host'] === '' || $database['port'] === '' || $database['name'] === '' || $database['user'] === '') {
            throw new \RuntimeException('Incomplete database configuration in environment.');
        }

        if (strtolower($database['type']) !== 'mysql') {
            throw new \RuntimeException('Unsupported DB_TYPE: ' . $database['type']);
        }

        return [
            sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $database['host'], $database['port'], $database['name']),
            $database['user'],
            $database['password'],
        ];
    }
}

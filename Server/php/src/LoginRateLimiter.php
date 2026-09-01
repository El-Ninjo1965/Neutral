<?php
declare(strict_types=1);

namespace Neutral\Core;

interface LoginAttemptStore
{
    /** @return array{attemptCount:int,windowStartedAt:int,lockedUntil:int}|null */
    public function state(string $key): ?array;

    /** @return array{attemptCount:int,windowStartedAt:int,lockedUntil:int} */
    public function recordFailure(string $key, int $limit, int $window, int $lock, int $now): array;

    /** @param list<string> $keys */
    public function delete(array $keys): void;

    public function purgeExpired(int $before): void;
}

final class PdoLoginAttemptStore implements LoginAttemptStore
{
    private bool $schemaReady = false;

    public function __construct(private readonly Database $database)
    {
    }

    public function state(string $key): ?array
    {
        $this->ensureSchema();
        $statement = $this->database->connect()->prepare(
            'SELECT attempt_count, UNIX_TIMESTAMP(window_started_at), COALESCE(UNIX_TIMESTAMP(locked_until), 0) FROM login_attempts WHERE scope_key = :key LIMIT 1'
        );
        $statement->execute([':key' => $key]);
        $row = $statement->fetch(\PDO::FETCH_NUM);
        return is_array($row) ? [
            'attemptCount' => (int) ($row[0] ?? 0),
            'windowStartedAt' => (int) ($row[1] ?? 0),
            'lockedUntil' => (int) ($row[2] ?? 0),
        ] : null;
    }

    public function recordFailure(string $key, int $limit, int $window, int $lock, int $now): array
    {
        $this->ensureSchema();
        $pdo = $this->database->connect();
        $statement = $pdo->prepare(
            'INSERT INTO login_attempts (scope_key, attempt_count, window_started_at, last_attempt_at, locked_until)
             VALUES (:key, 1, FROM_UNIXTIME(:now_insert), FROM_UNIXTIME(:now_last), IF(:first_limit <= 1, FROM_UNIXTIME(:first_lock), NULL))
             ON DUPLICATE KEY UPDATE
               attempt_count = IF(window_started_at <= FROM_UNIXTIME(:window_cutoff), 1, attempt_count + 1),
               window_started_at = IF(window_started_at <= FROM_UNIXTIME(:window_cutoff_reset), FROM_UNIXTIME(:window_start), window_started_at),
               last_attempt_at = FROM_UNIXTIME(:last_attempt),
               locked_until = IF(
                 IF(window_started_at <= FROM_UNIXTIME(:window_cutoff_lock), 1, attempt_count) >= :failure_limit,
                 FROM_UNIXTIME(:locked_until),
                 IF(locked_until > FROM_UNIXTIME(:lock_now), locked_until, NULL)
               )'
        );
        $statement->execute([
            ':key' => $key,
            ':now_insert' => $now,
            ':now_last' => $now,
            ':first_limit' => $limit,
            ':first_lock' => $now + $lock,
            ':window_cutoff' => $now - $window,
            ':window_cutoff_reset' => $now - $window,
            ':window_start' => $now,
            ':last_attempt' => $now,
            ':window_cutoff_lock' => $now - $window,
            ':failure_limit' => $limit,
            ':locked_until' => $now + $lock,
            ':lock_now' => $now,
        ]);
        return $this->state($key) ?? ['attemptCount' => 1, 'windowStartedAt' => $now, 'lockedUntil' => 0];
    }

    public function delete(array $keys): void
    {
        if ($keys === []) {
            return;
        }
        $this->ensureSchema();
        $placeholders = implode(',', array_fill(0, count($keys), '?'));
        $statement = $this->database->connect()->prepare('DELETE FROM login_attempts WHERE scope_key IN (' . $placeholders . ')');
        $statement->execute(array_values($keys));
    }

    public function purgeExpired(int $before): void
    {
        $this->ensureSchema();
        $statement = $this->database->connect()->prepare('DELETE FROM login_attempts WHERE last_attempt_at < FROM_UNIXTIME(:before) AND (locked_until IS NULL OR locked_until < FROM_UNIXTIME(:before))');
        $statement->execute([':before' => $before]);
    }

    private function ensureSchema(): void
    {
        if ($this->schemaReady) {
            return;
        }
        $this->database->connect()->exec(
            "CREATE TABLE IF NOT EXISTS login_attempts (
                scope_key CHAR(64) NOT NULL,
                attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
                window_started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_attempt_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                locked_until TIMESTAMP NULL DEFAULT NULL,
                PRIMARY KEY (scope_key),
                KEY ix_login_attempts_last_attempt (last_attempt_at),
                KEY ix_login_attempts_locked_until (locked_until)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
        $this->schemaReady = true;
    }
}

final class LoginRateLimiter
{
    /** @var \Closure():int */
    private \Closure $clock;
    /** @var array{identifierLimit:int,ipLimit:int,windowSeconds:int,lockSeconds:int} */
    private array $options;

    /** @param callable():int $clock @param array<string,int> $options */
    public function __construct(private readonly LoginAttemptStore $store, callable $clock, array $options = [])
    {
        $this->clock = \Closure::fromCallable($clock);
        $this->options = [
            'identifierLimit' => max(1, (int) ($options['identifierLimit'] ?? 5)),
            'ipLimit' => max(1, (int) ($options['ipLimit'] ?? 20)),
            'windowSeconds' => max(60, (int) ($options['windowSeconds'] ?? 900)),
            'lockSeconds' => max(60, (int) ($options['lockSeconds'] ?? 900)),
        ];
    }

    /** @return array{allowed:bool,retryAfter:int} */
    public function check(string $identifier, string $ip): array
    {
        $now = ($this->clock)();
        $retryAfter = 0;
        foreach ($this->scopeKeys($identifier, $ip) as $key) {
            $state = $this->store->state($key);
            if ($state !== null && $state['lockedUntil'] > $now) {
                $retryAfter = max($retryAfter, $state['lockedUntil'] - $now);
            }
        }
        return ['allowed' => $retryAfter === 0, 'retryAfter' => $retryAfter];
    }

    /** @return array{allowed:bool,retryAfter:int} */
    public function registerFailure(string $identifier, string $ip): array
    {
        $now = ($this->clock)();
        [$identifierKey, $ipKey] = $this->scopeKeys($identifier, $ip);
        $identifierState = $this->store->recordFailure($identifierKey, $this->options['identifierLimit'] + 1, $this->options['windowSeconds'], $this->options['lockSeconds'], $now);
        $ipState = $this->store->recordFailure($ipKey, $this->options['ipLimit'] + 1, $this->options['windowSeconds'], $this->options['lockSeconds'], $now);
        $this->store->purgeExpired($now - ($this->options['windowSeconds'] + $this->options['lockSeconds']));
        $retryAfter = max(0, $identifierState['lockedUntil'] - $now, $ipState['lockedUntil'] - $now);
        return ['allowed' => $retryAfter === 0, 'retryAfter' => $retryAfter];
    }

    public function registerSuccess(string $identifier, string $ip): void
    {
        $this->store->delete($this->scopeKeys($identifier, $ip));
    }

    /** @return list<string> */
    private function scopeKeys(string $identifier, string $ip): array
    {
        $normalizedIdentifier = strtolower(trim($identifier));
        $normalizedIp = trim($ip) !== '' ? trim($ip) : 'unknown';
        return [
            hash('sha256', 'identifier|' . $normalizedIdentifier . '|' . $normalizedIp),
            hash('sha256', 'ip|' . $normalizedIp),
        ];
    }
}

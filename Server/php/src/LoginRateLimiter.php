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
    public function __construct(private readonly Database $database)
    {
    }

    public function state(string $key): ?array
    {
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
        $placeholders = implode(',', array_fill(0, count($keys), '?'));
        $statement = $this->database->connect()->prepare('DELETE FROM login_attempts WHERE scope_key IN (' . $placeholders . ')');
        $statement->execute(array_values($keys));
    }

    public function purgeExpired(int $before): void
    {
        $statement = $this->database->connect()->prepare('DELETE FROM login_attempts WHERE last_attempt_at < FROM_UNIXTIME(:before) AND (locked_until IS NULL OR locked_until < FROM_UNIXTIME(:before))');
        $statement->execute([':before' => $before]);
    }

}

final class FallbackLoginAttemptStore implements LoginAttemptStore
{
    private bool $usingFallback = false;
    public function __construct(private readonly LoginAttemptStore $primary, private readonly LoginAttemptStore $fallback) {}
    private function call(string $method, array $args): mixed
    {
        if (!$this->usingFallback) {
            try { return $this->primary->{$method}(...$args); }
            catch (\Throwable $exception) { $this->usingFallback = true; }
        }
        return $this->fallback->{$method}(...$args);
    }
    public function state(string $key): ?array { return $this->call(__FUNCTION__, func_get_args()); }
    public function recordFailure(string $key, int $limit, int $window, int $lock, int $now): array { return $this->call(__FUNCTION__, func_get_args()); }
    public function delete(array $keys): void { $this->call(__FUNCTION__, func_get_args()); }
    public function purgeExpired(int $before): void { $this->call(__FUNCTION__, func_get_args()); }
}

final class FileLoginAttemptStore implements LoginAttemptStore
{
    public function __construct(private readonly string $path) {}
    public function state(string $key): ?array { $rows=$this->read(); return isset($rows[$key])&&is_array($rows[$key])?$rows[$key]:null; }
    public function recordFailure(string $key, int $limit, int $window, int $lock, int $now): array
    {
        return $this->mutate(function(array &$rows) use($key,$limit,$window,$lock,$now):array { $row=$rows[$key]??['attemptCount'=>0,'windowStartedAt'=>$now,'lockedUntil'=>0]; if((int)$row['windowStartedAt'] <= $now-$window)$row=['attemptCount'=>0,'windowStartedAt'=>$now,'lockedUntil'=>0];$row['attemptCount']=(int)$row['attemptCount']+1;if($row['attemptCount'] >= $limit)$row['lockedUntil']=$now+$lock;return $rows[$key]=$row; });
    }
    public function delete(array $keys): void { $this->mutate(function(array &$rows)use($keys):null{foreach($keys as $key)unset($rows[$key]);return null;}); }
    public function purgeExpired(int $before): void { $this->mutate(function(array &$rows)use($before):null{foreach($rows as $key=>$row)if((int)($row['windowStartedAt']??0)<$before&&(int)($row['lockedUntil']??0)<$before)unset($rows[$key]);return null;}); }
    private function read(): array { if(!is_file($this->path))return []; $decoded=json_decode((string)file_get_contents($this->path),true);return is_array($decoded)?$decoded:[]; }
    private function mutate(callable $callback): mixed
    {
        $directory=dirname($this->path);if(!is_dir($directory)&&!mkdir($directory,0700,true)&&!is_dir($directory))throw new \RuntimeException('Auth fallback storage unavailable.');
        $handle=fopen($this->path,'c+');if($handle===false)throw new \RuntimeException('Auth fallback storage unavailable.');
        try { if(!flock($handle,LOCK_EX))throw new \RuntimeException('Auth fallback lock unavailable.');$raw=stream_get_contents($handle);$rows=json_decode(is_string($raw)?$raw:'',true);if(!is_array($rows))$rows=[];$result=$callback($rows);rewind($handle);ftruncate($handle,0);fwrite($handle,json_encode($rows,JSON_THROW_ON_ERROR));fflush($handle);@chmod($this->path,0600);flock($handle,LOCK_UN);return $result; } finally { fclose($handle); }
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

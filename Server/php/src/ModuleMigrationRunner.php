<?php
declare(strict_types=1);

namespace Neutral\Core;

use PDO;

final class ModuleMigrationRunner
{
    private Database $database;

    public function __construct(Database $database)
    {
        $this->database = $database;
    }

    /**
     * @param list<array<string,mixed>> $definitions
     * @param callable(string):?string $appliedChecksum
     * @param callable(array<string,mixed>):void $apply
     * @param callable(array<string,mixed>,string):void $record
     * @param callable(array<string,mixed>):void $rollback
     * @return array{applied:list<string>,skipped:list<string>}
     */
    public static function runBatch(
        array $definitions,
        callable $appliedChecksum,
        callable $apply,
        callable $record,
        callable $rollback
    ): array {
        $applied = [];
        $skipped = [];
        $started = [];
        try {
            foreach (self::normalizeDefinitions($definitions) as $migration) {
                $checksum = self::checksum($migration);
                $existing = $appliedChecksum($migration['key']);
                if ($existing !== null) {
                    if (!hash_equals($existing, $checksum)) {
                        throw new \RuntimeException('Applied module migration checksum mismatch.');
                    }
                    $skipped[] = $migration['key'];
                    continue;
                }
                $started[] = $migration;
                $apply($migration);
                $record($migration, $checksum);
                $applied[] = $migration['key'];
            }
        } catch (\Throwable $failure) {
            $rollbackFailure = null;
            foreach (array_reverse($started) as $migration) {
                try {
                    $rollback($migration);
                } catch (\Throwable $exception) {
                    $rollbackFailure = $exception;
                }
            }
            if ($rollbackFailure !== null) {
                throw new \RuntimeException('Module migration failed and rollback was incomplete.', 0, $rollbackFailure);
            }
            throw new \RuntimeException('Module migration failed and was rolled back.', 0, $failure);
        }
        return ['applied' => $applied, 'skipped' => $skipped];
    }

    /**
     * @param array<string,mixed> $module
     * @param list<array<string,mixed>> $definitions
     * @return array{applied:list<string>,skipped:list<string>}
     */
    public function migrate(array $module, array $definitions): array
    {
        $this->assertDeclaredMigrations($module, $definitions);
        $pdo = $this->database->connect();
        $moduleId = $this->moduleDatabaseId($module);
        $moduleKey = $this->moduleKey($module);
        $lockName = 'neutral_module_' . substr(hash('sha256', $moduleKey), 0, 32);
        $this->acquireLock($pdo, $lockName);
        try {
            $existing = $this->appliedChecksums($pdo, $moduleId);
            $declaredKeys = array_map(static fn (array $migration): string => $migration['key'], self::normalizeDefinitions($definitions));
            if (array_diff(array_keys($existing), $declaredKeys) !== []) {
                throw new \RuntimeException('Applied module migration is missing from the current definition.');
            }
            $result = self::runBatch(
                $definitions,
                static fn (string $key): ?string => $existing[$key] ?? null,
                static function (array $migration) use ($pdo): void {
                    foreach ($migration['up'] as $statement) {
                        $pdo->exec($statement);
                    }
                },
                static function (array $migration, string $checksum) use ($pdo, $moduleId): void {
                    $insert = $pdo->prepare('INSERT INTO module_migrations (module_id, migration_key, checksum, module_version, applied_at) VALUES (:module_id, :migration_key, :checksum, :module_version, CURRENT_TIMESTAMP)');
                    $insert->execute([
                        ':module_id' => $moduleId,
                        ':migration_key' => $migration['key'],
                        ':checksum' => $checksum,
                        ':module_version' => $migration['version'],
                    ]);
                },
                static function (array $migration) use ($pdo, $moduleId): void {
                    foreach ($migration['down'] as $statement) {
                        $pdo->exec($statement);
                    }
                    $delete = $pdo->prepare('DELETE FROM module_migrations WHERE module_id = :module_id AND migration_key = :migration_key');
                    $delete->execute([':module_id' => $moduleId, ':migration_key' => $migration['key']]);
                }
            );
            $state = $pdo->prepare('UPDATE module_state SET installed_version = :version, last_error = NULL, changed_at = CURRENT_TIMESTAMP WHERE module_id = :module_id');
            $state->execute([':version' => (string) ($module['version'] ?? ''), ':module_id' => $moduleId]);
            return $result;
        } catch (\Throwable $exception) {
            $this->storeFailure($pdo, $moduleId, $exception->getMessage());
            throw $exception;
        } finally {
            $this->releaseLock($pdo, $lockName);
        }
    }

    /**
     * @param array<string,mixed> $module
     * @param list<array<string,mixed>> $definitions
     * @return list<string>
     */
    public function rollback(array $module, array $definitions): array
    {
        $this->assertDeclaredMigrations($module, $definitions);
        $pdo = $this->database->connect();
        $moduleId = $this->moduleDatabaseId($module);
        $moduleKey = $this->moduleKey($module);
        $lockName = 'neutral_module_' . substr(hash('sha256', $moduleKey), 0, 32);
        $this->acquireLock($pdo, $lockName);
        try {
            $normalized = self::normalizeDefinitions($definitions);
            $byKey = [];
            foreach ($normalized as $migration) {
                $byKey[$migration['key']] = $migration;
            }
            $applied = $this->appliedChecksums($pdo, $moduleId);
            $rolledBack = [];
            foreach (array_reverse(array_keys($applied)) as $key) {
                $migration = $byKey[$key] ?? null;
                if (!is_array($migration) || !hash_equals($applied[$key], self::checksum($migration))) {
                    throw new \RuntimeException('Applied module migration cannot be safely rolled back.');
                }
                foreach ($migration['down'] as $statement) {
                    $pdo->exec($statement);
                }
                $delete = $pdo->prepare('DELETE FROM module_migrations WHERE module_id = :module_id AND migration_key = :migration_key');
                $delete->execute([':module_id' => $moduleId, ':migration_key' => $key]);
                $rolledBack[] = $key;
            }
        } catch (\Throwable $exception) {
            $this->storeFailure($pdo, $moduleId, $exception->getMessage());
            throw new \RuntimeException('Module rollback failed.', 0, $exception);
        } finally {
            $this->releaseLock($pdo, $lockName);
        }
        return $rolledBack;
    }

    /**
     * Reverse only migrations applied by the current update and restore its prior version marker.
     *
     * @param array<string,mixed> $module
     * @param list<array<string,mixed>> $definitions
     * @param list<string> $appliedKeys
     */
    public function compensate(array $module, array $definitions, array $appliedKeys, string $priorVersion): void
    {
        $this->assertDeclaredMigrations($module, $definitions);
        $pdo = $this->database->connect();
        $moduleId = $this->moduleDatabaseId($module);
        $lockName = 'neutral_module_' . substr(hash('sha256', $this->moduleKey($module)), 0, 32);
        $this->acquireLock($pdo, $lockName);
        try {
            $normalized = self::normalizeDefinitions($definitions);
            $byKey = [];
            foreach ($normalized as $migration) {
                $byKey[$migration['key']] = $migration;
            }
            $existing = $this->appliedChecksums($pdo, $moduleId);
            foreach (array_reverse($appliedKeys) as $key) {
                $migration = $byKey[$key] ?? null;
                if (!is_array($migration) || !isset($existing[$key]) || !hash_equals($existing[$key], self::checksum($migration))) {
                    throw new \RuntimeException('Applied update migration cannot be safely compensated.');
                }
                foreach ($migration['down'] as $statement) {
                    $pdo->exec($statement);
                }
                $delete = $pdo->prepare('DELETE FROM module_migrations WHERE module_id = :module_id AND migration_key = :migration_key');
                $delete->execute([':module_id' => $moduleId, ':migration_key' => $key]);
            }
            $state = $pdo->prepare('UPDATE module_state SET installed_version = :version, last_error = NULL, changed_at = CURRENT_TIMESTAMP WHERE module_id = :module_id');
            $state->execute([':version' => $priorVersion, ':module_id' => $moduleId]);
        } catch (\Throwable $exception) {
            $this->storeFailure($pdo, $moduleId, 'rollback');
            throw new \RuntimeException('Module update compensation failed.', 0, $exception);
        } finally {
            $this->releaseLock($pdo, $lockName);
        }
    }

    /**
     * Destructive uninstall accepts reversible statements only when their mutation target is owned.
     *
     * @param list<string> $ownedTables
     * @param list<array<string,mixed>> $definitions
     */
    public static function assertOwnedRollback(string $moduleId, array $ownedTables, array $definitions): void
    {
        $prefix = str_replace('-', '_', strtolower(trim($moduleId))) . '_';
        $owned = [];
        foreach ($ownedTables as $table) {
            $name = strtolower(trim($table));
            if (preg_match('/^[a-z][a-z0-9_]{1,63}$/', $name) !== 1 || !str_starts_with($name, $prefix)) {
                throw new \RuntimeException('Unsafe module rollback ownership declaration.');
            }
            $owned[$name] = true;
        }
        if ($owned === []) {
            throw new \RuntimeException('Destructive uninstall requires owned module tables.');
        }
        $dropped = [];
        foreach (self::normalizeDefinitions($definitions) as $migration) {
            foreach ($migration['down'] as $statement) {
                [$target, $dropsTable] = self::ownedRollbackTarget($statement);
                if (!isset($owned[$target])) {
                    throw new \RuntimeException('Module rollback targets a foreign table.');
                }
                if ($dropsTable) {
                    $dropped[$target] = true;
                }
            }
        }
        $ownedNames = array_keys($owned);
        $droppedNames = array_keys($dropped);
        sort($ownedNames);
        sort($droppedNames);
        if ($ownedNames !== $droppedNames) {
            throw new \RuntimeException('Destructive uninstall must roll back every owned table exactly.');
        }
    }

    /** @return array{0:string,1:bool} */
    private static function ownedRollbackTarget(string $statement): array
    {
        $sql = trim($statement);
        if (str_ends_with($sql, ';')) {
            $sql = rtrim(substr($sql, 0, -1));
        }
        if ($sql === '' || str_contains($sql, ';') || str_contains($sql, '--') || str_contains($sql, '/*')) {
            throw new \RuntimeException('Unsafe destructive module rollback statement.');
        }
        $identifier = '`?([a-z][a-z0-9_]{1,63})`?';
        if (preg_match('/^ALTER\s+TABLE\s+' . $identifier . '\s+(.+)$/is', $sql, $alter) === 1) {
            $operation = trim($alter[2]);
            if (self::hasTopLevelComma($operation) || !self::isSafeOwnedAlterOperation($operation)) {
                throw new \RuntimeException('Unsafe destructive module rollback statement.');
            }
            return [strtolower($alter[1]), false];
        }
        $patterns = [
            ['/^DROP\s+TABLE\s+IF\s+EXISTS\s+' . $identifier . '$/i', true],
            ['/^TRUNCATE\s+TABLE\s+' . $identifier . '$/i', false],
            ['/^DELETE\s+FROM\s+' . $identifier . '(?:\s+.+)?$/is', false],
            ['/^UPDATE\s+' . $identifier . '\s+SET\s+.+$/is', false],
            ['/^INSERT\s+INTO\s+' . $identifier . '(?:\s|\().+$/is', false],
            ['/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?' . $identifier . '\s*\(.+$/is', false],
            ['/^DROP\s+INDEX\s+`?[a-z][a-z0-9_]{0,63}`?\s+ON\s+' . $identifier . '$/i', false],
            ['/^CREATE\s+(?:UNIQUE\s+)?INDEX\s+`?[a-z][a-z0-9_]{0,63}`?\s+ON\s+' . $identifier . '\s*\(.+$/is', false],
        ];
        foreach ($patterns as [$pattern, $dropsTable]) {
            if (preg_match($pattern, $sql, $matches) === 1) {
                return [strtolower($matches[1]), $dropsTable];
            }
        }
        throw new \RuntimeException('Unsafe destructive module rollback statement.');
    }

    private static function isSafeOwnedAlterOperation(string $operation): bool
    {
        $id = '`?[a-z][a-z0-9_]{0,63}`?';
        $patterns = [
            '/^ADD\s+(?:COLUMN\s+)?(?:IF\s+NOT\s+EXISTS\s+)?' . $id . '\s+.+$/is',
            '/^DROP\s+(?:COLUMN\s+)?(?:IF\s+EXISTS\s+)?' . $id . '$/i',
            '/^MODIFY\s+(?:COLUMN\s+)?' . $id . '\s+.+$/is',
            '/^CHANGE\s+(?:COLUMN\s+)?' . $id . '\s+' . $id . '\s+.+$/is',
            '/^ADD\s+(?:(?:UNIQUE|FULLTEXT|SPATIAL)\s+)?(?:INDEX|KEY)\s+' . $id . '\s*\(.+\)$/is',
            '/^DROP\s+(?:INDEX|KEY)\s+' . $id . '$/i',
            '/^ADD\s+PRIMARY\s+KEY\s*\(.+\)$/is',
            '/^DROP\s+PRIMARY\s+KEY$/i',
            '/^DROP\s+FOREIGN\s+KEY\s+' . $id . '$/i',
            '/^ADD\s+CONSTRAINT\s+' . $id . '\s+.+$/is',
            '/^DROP\s+CONSTRAINT\s+' . $id . '$/i',
            '/^ALTER\s+COLUMN\s+' . $id . '\s+(?:SET\s+DEFAULT\s+.+|DROP\s+DEFAULT)$/is',
            '/^RENAME\s+INDEX\s+' . $id . '\s+TO\s+' . $id . '$/i',
        ];
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $operation) === 1) {
                return true;
            }
        }
        return false;
    }

    private static function hasTopLevelComma(string $sql): bool
    {
        $depth = 0;
        $quote = null;
        $length = strlen($sql);
        for ($index = 0; $index < $length; $index++) {
            $character = $sql[$index];
            if ($quote !== null) {
                if ($character === $quote && ($index === 0 || $sql[$index - 1] !== '\\')) {
                    $quote = null;
                }
                continue;
            }
            if ($character === "'" || $character === '"' || $character === '`') {
                $quote = $character;
            } elseif ($character === '(') {
                $depth++;
            } elseif ($character === ')') {
                $depth--;
                if ($depth < 0) {
                    return true;
                }
            } elseif ($character === ',' && $depth === 0) {
                return true;
            }
        }
        return $depth !== 0 || $quote !== null;
    }

    /**
     * @param list<array<string,mixed>> $definitions
     * @return list<array{key:string,version:string,up:list<string>,down:list<string>}>
     */
    private static function normalizeDefinitions(array $definitions): array
    {
        $normalized = [];
        foreach ($definitions as $definition) {
            if (!is_array($definition)) {
                throw new \RuntimeException('Invalid module migration definition.');
            }
            $key = trim((string) ($definition['key'] ?? ''));
            $version = trim((string) ($definition['version'] ?? ''));
            if (preg_match('/^[0-9]{4}_[0-9]{2}_[0-9]{2}_[0-9]{4}_[a-z0-9_]+$/', $key) !== 1 || preg_match('/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$/', $version) !== 1) {
                throw new \RuntimeException('Invalid module migration identity.');
            }
            $up = self::statements($definition['up'] ?? null);
            $down = self::statements($definition['down'] ?? null);
            if ($up === [] || $down === []) {
                throw new \RuntimeException('Module migrations require up and down statements.');
            }
            if (isset($normalized[$key])) {
                throw new \RuntimeException('Duplicate module migration key.');
            }
            $normalized[$key] = ['key' => $key, 'version' => $version, 'up' => $up, 'down' => $down];
        }
        return array_values($normalized);
    }

    /** @param mixed $value @return list<string> */
    private static function statements($value): array
    {
        if (!is_array($value)) {
            return [];
        }
        $statements = [];
        foreach ($value as $statement) {
            $sql = trim((string) $statement);
            if ($sql === '' || strlen($sql) > 1024 * 1024 || str_contains($sql, "\0")) {
                throw new \RuntimeException('Invalid module migration statement.');
            }
            $statements[] = $sql;
        }
        return $statements;
    }

    /** @param array<string,mixed> $migration */
    private static function checksum(array $migration): string
    {
        $payload = json_encode([
            'key' => $migration['key'],
            'version' => $migration['version'],
            'up' => $migration['up'],
            'down' => $migration['down'],
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        return hash('sha256', $payload);
    }

    /** @param array<string,mixed> $module @param list<array<string,mixed>> $definitions */
    private function assertDeclaredMigrations(array $module, array $definitions): void
    {
        $manifest = is_array($module['manifest'] ?? null) ? $module['manifest'] : [];
        $database = is_array($manifest['database'] ?? null) ? $manifest['database'] : [];
        $declared = is_array($database['migrations'] ?? null) ? $database['migrations'] : [];
        $expected = [];
        foreach ($declared as $migration) {
            if (is_array($migration)) {
                $expected[] = [
                    'key' => (string) ($migration['key'] ?? ''),
                    'version' => (string) ($migration['version'] ?? ''),
                ];
            }
        }
        $actual = array_map(static fn (array $migration): array => [
            'key' => (string) ($migration['key'] ?? ''),
            'version' => (string) ($migration['version'] ?? ''),
        ], $definitions);
        if ($expected !== $actual) {
            throw new \RuntimeException('Module migration definition does not match its manifest.');
        }
    }

    /** @param array<string,mixed> $module */
    private function moduleDatabaseId(array $module): int
    {
        $id = (int) ($module['databaseId'] ?? 0);
        if ($id < 1) {
            throw new \RuntimeException('Registered module database id is required.');
        }
        return $id;
    }

    /** @param array<string,mixed> $module */
    private function moduleKey(array $module): string
    {
        $key = strtolower(trim((string) ($module['id'] ?? '')));
        if (preg_match('/^[a-z][a-z0-9-]{1,63}$/', $key) !== 1) {
            throw new \RuntimeException('Invalid module id.');
        }
        return $key;
    }

    /** @return array<string,string> */
    private function appliedChecksums(PDO $pdo, int $moduleId): array
    {
        $statement = $pdo->prepare('SELECT migration_key, checksum FROM module_migrations WHERE module_id = :module_id ORDER BY id ASC');
        $statement->execute([':module_id' => $moduleId]);
        $result = [];
        foreach ($statement->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $key = (string) ($row['migration_key'] ?? '');
            $checksum = (string) ($row['checksum'] ?? '');
            if ($key !== '') {
                $result[$key] = preg_match('/^[a-f0-9]{64}$/', $checksum) === 1
                    ? $checksum
                    : str_repeat('0', 64);
            }
        }
        return $result;
    }

    private function acquireLock(PDO $pdo, string $name): void
    {
        $statement = $pdo->prepare('SELECT GET_LOCK(:lock_name, 10)');
        $statement->execute([':lock_name' => $name]);
        if ((int) $statement->fetchColumn() !== 1) {
            throw new \RuntimeException('Could not acquire module migration lock.');
        }
    }

    private function releaseLock(PDO $pdo, string $name): void
    {
        $statement = $pdo->prepare('SELECT RELEASE_LOCK(:lock_name)');
        $statement->execute([':lock_name' => $name]);
    }

    private function storeFailure(PDO $pdo, int $moduleId, string $message): void
    {
        $safe = str_contains(strtolower($message), 'rollback') ? 'Module migration rollback failed.' : 'Module migration failed.';
        $statement = $pdo->prepare('UPDATE module_state SET status = :status, is_enabled = 0, last_error = :last_error, changed_at = CURRENT_TIMESTAMP WHERE module_id = :module_id');
        $statement->execute([':status' => 'error', ':last_error' => $safe, ':module_id' => $moduleId]);
    }
}

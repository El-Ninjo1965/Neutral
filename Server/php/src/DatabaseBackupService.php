<?php
declare(strict_types=1);

namespace Neutral\Core;

final class DatabaseBackupService
{
    private const FORMAT = 'neutral-logical-backup-v1';
    private const ENVELOPE = 'neutral-encrypted-backup-v1';
    /** @var \Closure(list<string>):array<string,list<array<string,mixed>>> */
    private \Closure $exporter;
    /** @var \Closure(array<string,list<array<string,mixed>>>):void */
    private \Closure $importer;
    private string $key;
    private string $backupDirectory;

    /**
     * @param callable(list<string>):array<string,list<array<string,mixed>>>|null $exporter
     * @param callable(array<string,list<array<string,mixed>>>):void|null $importer
     */
    public function __construct(
        private readonly Database $database,
        private readonly SchemaMigrator $migrator,
        AppConfig $config,
        string $projectRoot,
        ?callable $exporter = null,
        ?callable $importer = null
    ) {
        $configuredKey = $config->backupKey();
        if (strlen($configuredKey) < 32) {
            throw new \RuntimeException('NEUTRAL_BACKUP_KEY must contain at least 32 characters.');
        }
        if (!function_exists('openssl_encrypt') || !function_exists('openssl_decrypt')) {
            throw new \RuntimeException('OpenSSL is required for encrypted backups.');
        }
        $this->key = hash('sha256', $configuredKey, true);
        $this->backupDirectory = rtrim($projectRoot, "/\\") . '/Server/runtime/backups';
        $this->exporter = $exporter === null
            ? \Closure::fromCallable([$this, 'exportDatabase'])
            : \Closure::fromCallable($exporter);
        $this->importer = $importer === null
            ? \Closure::fromCallable([$this, 'importDatabase'])
            : \Closure::fromCallable($importer);
    }

    /** @return array{backupId:string,status:string,createdAt:string,size:int} */
    public function create(): array
    {
        $this->ensureDirectory();
        $backupId = bin2hex(random_bytes(16));
        $createdAt = gmdate('c');
        $allowed = $this->portableTables();
        $exported = ($this->exporter)($allowed);
        $tables = [];
        foreach ($allowed as $table) {
            $rows = $exported[$table] ?? [];
            $tables[$table] = is_array($rows) ? array_values(array_filter($rows, 'is_array')) : [];
        }
        $payload = [
            'format' => self::FORMAT,
            'schemaVersion' => SchemaMigrator::schemaVersion(),
            'createdAt' => $createdAt,
            'tables' => $tables,
        ];
        $payloadJson = $this->encode($payload);
        $plaintext = $this->encode([
            'checksum' => hash('sha256', $payloadJson),
            'payload' => $payload,
        ]);
        $nonce = random_bytes(12);
        $tag = '';
        $ciphertext = openssl_encrypt($plaintext, 'aes-256-gcm', $this->key, OPENSSL_RAW_DATA, $nonce, $tag, $backupId, 16);
        if (!is_string($ciphertext) || strlen($tag) !== 16) {
            throw new \RuntimeException('Backup encryption failed.');
        }
        $envelope = $this->encode([
            'envelope' => self::ENVELOPE,
            'backupId' => $backupId,
            'createdAt' => $createdAt,
            'nonce' => base64_encode($nonce),
            'tag' => base64_encode($tag),
            'ciphertext' => base64_encode($ciphertext),
        ]);
        $path = $this->pathForDownload($backupId);
        if (file_put_contents($path, $envelope, LOCK_EX) === false) {
            throw new \RuntimeException('Could not persist encrypted backup.');
        }
        @chmod($path, 0600);
        return ['backupId' => $backupId, 'status' => 'created', 'createdAt' => $createdAt, 'size' => strlen($envelope)];
    }

    /** @return list<array{backupId:string,createdAt:string,size:int}> */
    public function list(): array
    {
        if (!is_dir($this->backupDirectory)) {
            return [];
        }
        $items = [];
        foreach (glob($this->backupDirectory . '/*.neutral-backup') ?: [] as $path) {
            $raw = file_get_contents($path);
            $decoded = is_string($raw) ? json_decode($raw, true) : null;
            $fileId = basename($path, '.neutral-backup');
            if (!is_array($decoded) || !$this->validBackupId((string) ($decoded['backupId'] ?? '')) || (string) $decoded['backupId'] !== $fileId) {
                continue;
            }
            $items[] = [
                'backupId' => (string) $decoded['backupId'],
                'createdAt' => (string) ($decoded['createdAt'] ?? ''),
                'size' => (int) (filesize($path) ?: 0),
            ];
        }
        usort($items, static fn (array $left, array $right): int => strcmp($right['createdAt'], $left['createdAt']));
        return $items;
    }

    /** @return array{backupId:string,status:string,restoredTables:int} */
    public function restore(string $backupId): array
    {
        $payload = $this->decryptFile($this->pathForDownload($backupId));
        $tables = $payload['tables'] ?? null;
        if (!is_array($tables)) {
            throw new \RuntimeException('Backup table payload is invalid.');
        }
        if (($payload['schemaVersion'] ?? '') !== SchemaMigrator::schemaVersion()) {
            throw new \RuntimeException('Backup schema version is incompatible.');
        }
        $allowed = array_flip($this->portableTables());
        foreach ($tables as $table => $rows) {
            if (!is_string($table) || !isset($allowed[$table]) || !is_array($rows)) {
                throw new \RuntimeException('Backup contains an unsupported table.');
            }
        }
        $expectedTables = $this->portableTables();
        $providedTables = array_keys($tables);
        sort($expectedTables);
        sort($providedTables);
        if ($providedTables !== $expectedTables) {
            throw new \RuntimeException('Backup does not contain the complete managed table set.');
        }
        ($this->importer)($tables);
        return ['backupId' => $backupId, 'status' => 'restored', 'restoredTables' => count($tables)];
    }

    /** @return array{backupId:string,status:string,size:int} */
    public function storeUpload(string $bytes): array
    {
        $stream = fopen('php://temp', 'w+b');
        if (!is_resource($stream)) {
            throw new \RuntimeException('Could not open backup upload stream.');
        }
        fwrite($stream, $bytes);
        rewind($stream);
        try {
            return $this->storeUploadStream($stream, 100 * 1024 * 1024);
        } finally {
            fclose($stream);
        }
    }

    /** @param resource $stream @return array{backupId:string,status:string,size:int} */
    public function storeUploadStream($stream, int $maximumBytes = 104857600): array
    {
        if (!is_resource($stream) || $maximumBytes < 32) {
            throw new \RuntimeException('Backup upload stream or size limit is invalid.');
        }
        $this->ensureDirectory();
        $temporary = $this->backupDirectory . '/upload-' . bin2hex(random_bytes(12)) . '.tmp';
        $output = fopen($temporary, 'xb');
        if (!is_resource($output)) {
            throw new \RuntimeException('Could not store backup upload.');
        }
        $size = 0;
        try {
            while (!feof($stream)) {
                $chunk = fread($stream, 8192);
                if ($chunk === false) {
                    throw new \RuntimeException('Could not read backup upload stream.');
                }
                $size += strlen($chunk);
                if ($size > $maximumBytes) {
                    throw new \RuntimeException('Backup upload exceeded the size limit.');
                }
                if ($chunk !== '' && fwrite($output, $chunk) !== strlen($chunk)) {
                    throw new \RuntimeException('Could not store backup upload.');
                }
            }
            fclose($output);
            $output = null;
            if ($size < 32) {
                throw new \RuntimeException('Backup upload size is invalid.');
            }
            $payload = $this->decryptFile($temporary);
            if (($payload['format'] ?? '') !== self::FORMAT) {
                throw new \RuntimeException('Backup format is unsupported.');
            }
            $raw = file_get_contents($temporary);
            $decoded = is_string($raw) ? json_decode($raw, true, 512, JSON_THROW_ON_ERROR) : null;
            $backupId = is_array($decoded) ? (string) ($decoded['backupId'] ?? '') : '';
            if (!$this->validBackupId($backupId)) {
                throw new \RuntimeException('Backup identifier is invalid.');
            }
            $destination = $this->pathForDownload($backupId);
            if (is_file($destination)) {
                throw new \RuntimeException('Backup already exists.');
            }
            if (!rename($temporary, $destination)) {
                throw new \RuntimeException('Could not finalize backup upload.');
            }
            @chmod($destination, 0600);
            return ['backupId' => $backupId, 'status' => 'uploaded', 'size' => $size];
        } finally {
            if (is_resource($output)) {
                fclose($output);
            }
            if (is_file($temporary)) {
                @unlink($temporary);
            }
        }
    }

    public function pathForDownload(string $backupId): string
    {
        if (!$this->validBackupId($backupId)) {
            throw new \RuntimeException('Backup identifier is invalid.');
        }
        return $this->backupDirectory . '/' . $backupId . '.neutral-backup';
    }

    /** @return list<string> */
    public function portableTables(): array
    {
        return array_values(array_filter(
            $this->migrator->managedTables(),
            static fn (string $table): bool => !in_array($table, ['sessions', 'login_attempts'], true)
        ));
    }

    /** @param list<string> $tables @return array<string,list<array<string,mixed>>> */
    private function exportDatabase(array $tables): array
    {
        $pdo = $this->database->connect();
        $result = [];
        $pdo->exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        $pdo->beginTransaction();
        try {
            foreach ($tables as $table) {
                $this->assertIdentifier($table);
                $statement = $pdo->query('SELECT * FROM `' . $table . '`');
                $rows = $statement ? $statement->fetchAll(\PDO::FETCH_ASSOC) : [];
                $result[$table] = is_array($rows) ? $rows : [];
            }
            $pdo->commit();
        } catch (\Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $exception;
        }
        return $result;
    }

    /** @param array<string,list<array<string,mixed>>> $tables */
    private function importDatabase(array $tables): void
    {
        $pdo = $this->database->connect();
        $pdo->beginTransaction();
        try {
            $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
            foreach (['sessions', 'login_attempts'] as $ephemeralTable) {
                $pdo->exec('DELETE FROM `' . $ephemeralTable . '`');
            }
            foreach (array_reverse(array_keys($tables)) as $table) {
                $this->assertIdentifier($table);
                $pdo->exec('DELETE FROM `' . $table . '`');
            }
            foreach ($tables as $table => $rows) {
                $this->assertIdentifier($table);
                foreach ($rows as $row) {
                    if ($row === []) {
                        continue;
                    }
                    $columns = array_keys($row);
                    foreach ($columns as $column) {
                        $this->assertIdentifier((string) $column);
                    }
                    $columnSql = implode(',', array_map(static fn (string $column): string => '`' . $column . '`', $columns));
                    $placeholders = implode(',', array_fill(0, count($columns), '?'));
                    $statement = $pdo->prepare('INSERT INTO `' . $table . '` (' . $columnSql . ') VALUES (' . $placeholders . ')');
                    $statement->execute(array_values($row));
                }
            }
            $pdo->commit();
        } catch (\Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $exception;
        } finally {
            $pdo->exec('SET FOREIGN_KEY_CHECKS=1');
        }
    }

    /** @return array<string,mixed> */
    private function decryptFile(string $path): array
    {
        if (!is_file($path) || !is_readable($path)) {
            throw new \RuntimeException('Backup was not found.');
        }
        $raw = file_get_contents($path);
        $envelope = is_string($raw) ? json_decode($raw, true, 512, JSON_THROW_ON_ERROR) : null;
        if (!is_array($envelope) || ($envelope['envelope'] ?? '') !== self::ENVELOPE) {
            throw new \RuntimeException('Backup envelope is invalid.');
        }
        $backupId = (string) ($envelope['backupId'] ?? '');
        if (!$this->validBackupId($backupId)) {
            throw new \RuntimeException('Backup identifier is invalid.');
        }
        $nonce = base64_decode((string) ($envelope['nonce'] ?? ''), true);
        $tag = base64_decode((string) ($envelope['tag'] ?? ''), true);
        $ciphertext = base64_decode((string) ($envelope['ciphertext'] ?? ''), true);
        if (!is_string($nonce) || strlen($nonce) !== 12 || !is_string($tag) || strlen($tag) !== 16 || !is_string($ciphertext)) {
            throw new \RuntimeException('Backup encryption envelope is invalid.');
        }
        $plaintext = openssl_decrypt($ciphertext, 'aes-256-gcm', $this->key, OPENSSL_RAW_DATA, $nonce, $tag, $backupId);
        if (!is_string($plaintext)) {
            throw new \RuntimeException('Backup authentication failed.');
        }
        $decoded = json_decode($plaintext, true, 512, JSON_THROW_ON_ERROR);
        $payload = is_array($decoded) ? ($decoded['payload'] ?? null) : null;
        if (!is_array($payload) || ($payload['format'] ?? '') !== self::FORMAT) {
            throw new \RuntimeException('Backup payload is invalid.');
        }
        $payloadJson = $this->encode($payload);
        if (!hash_equals((string) ($decoded['checksum'] ?? ''), hash('sha256', $payloadJson))) {
            throw new \RuntimeException('Backup checksum is invalid.');
        }
        return $payload;
    }

    private function ensureDirectory(): void
    {
        if (!is_dir($this->backupDirectory) && !mkdir($this->backupDirectory, 0700, true) && !is_dir($this->backupDirectory)) {
            throw new \RuntimeException('Could not create backup directory.');
        }
        @chmod($this->backupDirectory, 0700);
    }

    private function validBackupId(string $backupId): bool
    {
        return preg_match('/^[a-f0-9]{32}$/', $backupId) === 1;
    }

    private function assertIdentifier(string $identifier): void
    {
        if (preg_match('/^[a-z][a-z0-9_]{0,63}$/', $identifier) !== 1) {
            throw new \RuntimeException('Backup contains an unsafe SQL identifier.');
        }
    }

    /** @param array<string,mixed> $value */
    private function encode(array $value): string
    {
        return json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    }
}

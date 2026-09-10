<?php
declare(strict_types=1);

namespace Neutral\Core;

final class BackupRuntimeException extends \RuntimeException
{
    public function __construct(private readonly string $safeCode, string $internalMessage)
    {
        parent::__construct($internalMessage);
    }
    public function safeCode(): string { return $this->safeCode; }
}

final class DatabaseBackupService
{
    private const FORMAT = 'neutral-logical-backup-v2';
    private const LEGACY_FORMAT = 'neutral-logical-backup-v1';
    private const ENVELOPE = 'neutral-encrypted-backup-v1';
    /** @var \Closure(list<string>):array<string,list<array<string,mixed>>> */
    private \Closure $exporter;
    /** @var \Closure(array<string,list<array<string,mixed>>>):void */
    private \Closure $importer;
    private string $key;
    private string $backupDirectory;
    private string $projectRoot;
    private bool $customDirectory;
    private bool $usesDatabaseExporter;

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
        ?callable $importer = null,
        ?string $configuredDirectory = null
    ) {
        $configuredKey = $config->backupKey();
        if (strlen($configuredKey) < 32) {
            throw new BackupRuntimeException('BACKUP_KEY_NOT_CONFIGURED', 'Backup encryption key must contain at least 32 characters.');
        }
        if (!function_exists('openssl_encrypt') || !function_exists('openssl_decrypt')) {
            throw new BackupRuntimeException('BACKUP_CRYPTO_UNAVAILABLE', 'OpenSSL is unavailable.');
        }
        $this->key = hash('sha256', $configuredKey, true);
        $this->projectRoot=rtrim($projectRoot,"/\\");
        $this->customDirectory=$configuredDirectory !== null && trim($configuredDirectory) !== '';
        $this->backupDirectory = !$this->customDirectory
            ? rtrim($projectRoot, "/\\") . '/Server/runtime/backups'
            : self::normalizeConfiguredDirectory($configuredDirectory);
        $this->exporter = $exporter === null
            ? \Closure::fromCallable([$this, 'exportDatabase'])
            : \Closure::fromCallable($exporter);
        $this->usesDatabaseExporter = $exporter === null;
        $this->importer = $importer === null
            ? \Closure::fromCallable([$this, 'importDatabase'])
            : \Closure::fromCallable($importer);
    }

    public static function normalizeConfiguredDirectory(string $path): string
    {
        $normalized=rtrim(trim($path),"/\\");
        if($normalized===''||strlen($normalized)>1024||str_contains($normalized,"\0")||preg_match('#(^|[\\/])\.\.([\\/]|$)#',$normalized)===1||preg_match('#^(?:/|[A-Za-z]:[\\/])#',$normalized)!==1)throw new \RuntimeException('Backup storage path must be an absolute path without traversal.');
        return $normalized;
    }

    /** @return array{status:string,exists:bool,directory:bool,writable:bool,protected:bool} */
    public static function testDirectory(string $path,string $projectRoot,string $documentRoot=''): array
    {
        $normalized=self::normalizeConfiguredDirectory($path);$exists=file_exists($normalized);$directory=is_dir($normalized);$writable=false;$protected=false;
        $real=$directory?realpath($normalized):false;
        if(is_string($real)){
            $publicRoots=array_filter([realpath(rtrim($projectRoot,"/\\").'/Web-App/public'),realpath(rtrim($projectRoot,"/\\").'/Server/public'),$documentRoot!==''?realpath($documentRoot):false],'is_string');
            $insidePublic=false;foreach($publicRoots as $root){$root=rtrim((string)$root,"/\\");if($real===$root||str_starts_with($real,$root.DIRECTORY_SEPARATOR)){$insidePublic=true;break;}}
            $protected=!$insidePublic;
            if(is_writable($real)){$probe=$real.'/.neutral-write-probe-'.bin2hex(random_bytes(8));$handle=@fopen($probe,'xb');if(is_resource($handle)){$writable=fwrite($handle,'ok')===2;fclose($handle);@unlink($probe);}}
        }
        $status=!$exists?'missing':(!$directory?'not_directory':(!$writable?'not_writable':(!$protected?'public_path':'ready')));
        return ['status'=>$status,'exists'=>$exists,'directory'=>$directory,'writable'=>$writable,'protected'=>$protected];
    }

    public function directory(): string { return $this->backupDirectory; }

    /** @return array{backupId:string,status:string,createdAt:string,size:int} */
    public function create(): array
    {
        $this->ensureDirectory();
        try {
            if (!$this->usesDatabaseExporter) {
                $migrationReady = true;
            } else {
                $migrationReady = $this->migrator->status()['pending'] === [];
            }
            if (!$migrationReady) {
                throw new BackupRuntimeException('BACKUP_SCHEMA_NOT_READY', 'Managed database migrations are pending.');
            }
        } catch (BackupRuntimeException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            throw new BackupRuntimeException('BACKUP_DATABASE_UNAVAILABLE', 'Could not verify managed database tables.');
        }
        $backupId = bin2hex(random_bytes(16));
        $createdAt = gmdate('c');
        $allowed = $this->portableTables();
        try {
            $exported = ($this->exporter)($allowed);
        } catch (\Throwable $exception) {
            throw new BackupRuntimeException('BACKUP_EXPORT_FAILED', 'Managed database export failed.');
        }
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
            'files' => $this->exportManagedFiles(),
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
            throw new BackupRuntimeException('BACKUP_ENCRYPT_FAILED', 'Backup encryption failed.');
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
            throw new BackupRuntimeException('BACKUP_WRITE_FAILED', 'Could not persist encrypted backup.');
        }
        @chmod($path, 0600);
        return ['backupId' => $backupId, 'status' => 'created', 'createdAt' => $createdAt, 'size' => strlen($envelope)];
    }

    /** @return list<array{backupId:string,createdAt:string,size:int}> */
    public function list(): array
    {
        if($this->customDirectory)$this->ensureDirectory();
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
                'format' => self::ENVELOPE,
                'appVersion' => '1.0.0',
                'status' => 'ready',
            ];
        }
        usort($items, static fn (array $left, array $right): int => strcmp($right['createdAt'], $left['createdAt']));
        return $items;
    }

    /** @return array{backupId:string,status:string,restoredTables:int} */
    public function restore(string $backupId): array
    {
        $payload = $this->decryptFile($this->pathForDownload($backupId));
        $tables = $this->validatedTables($payload);
        $stagedFiles = $this->stageManagedFiles($payload);
        try { ($this->importer)($tables);$this->commitManagedFiles($stagedFiles); }
        catch (\Throwable $exception) { if($stagedFiles!==null)$this->removeTree($stagedFiles['stage']);throw $exception; }
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
            $this->validatedTables($payload);
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

    public function delete(string $backupId): void
    {
        $path = $this->pathForDownload($backupId);
        if (!is_file($path) || !unlink($path)) {
            throw new \RuntimeException('Backup could not be deleted.');
        }
    }

    public function enforceRetention(int $maximumBackups = 14): int
    {
        $items = $this->list();
        $removed = 0;
        foreach (array_slice($items, max(1, $maximumBackups)) as $item) {
            $this->delete((string) $item['backupId']);
            $removed++;
        }
        return $removed;
    }

    /** @return list<string> */
    public function portableTables(): array
    {
        $core = array_values(array_filter(
            $this->migrator->managedTables(),
            static fn (string $table): bool => !in_array($table, ['sessions', 'login_attempts'], true)
        ));
        if (!$this->usesDatabaseExporter) return $core;
        try {
            $rows=$this->database->connect()->query("SELECT manifest_json FROM modules WHERE is_present=1")->fetchAll(\PDO::FETCH_COLUMN);
            foreach($rows as $json){$manifest=json_decode((string)$json,true);foreach((array)($manifest['database']['tables']??[]) as $entry){$table=is_array($entry)?(string)($entry['name']??''):(string)$entry;if($table!==''){$this->assertIdentifier($table);$core[]=$table;}}}
        } catch (\Throwable $exception) { /* Core-only test/fallback path. */ }
        return array_values(array_unique($core));
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
        if (!is_array($payload) || !in_array(($payload['format'] ?? ''), [self::FORMAT,self::LEGACY_FORMAT], true)) {
            throw new \RuntimeException('Backup payload is invalid.');
        }
        $payloadJson = $this->encode($payload);
        if (!hash_equals((string) ($decoded['checksum'] ?? ''), hash('sha256', $payloadJson))) {
            throw new \RuntimeException('Backup checksum is invalid.');
        }
        return $payload;
    }

    /** @param array<string,mixed> $payload @return array<string,list<array<string,mixed>>> */
    private function validatedTables(array $payload): array
    {
        if (!in_array(($payload['format'] ?? ''), [self::FORMAT,self::LEGACY_FORMAT], true)) {
            throw new \RuntimeException('Backup format is unsupported.');
        }
        if (($payload['schemaVersion'] ?? '') !== SchemaMigrator::schemaVersion()) {
            throw new \RuntimeException('Backup schema version is incompatible.');
        }
        $tables = $payload['tables'] ?? null;
        if (!is_array($tables)) {
            throw new \RuntimeException('Backup table payload is invalid.');
        }
        $allowed = array_flip($this->portableTables());
        foreach ($tables as $table => $rows) {
            if (!is_string($table) || !isset($allowed[$table]) || !is_array($rows)) {
                throw new \RuntimeException('Backup contains an unsupported table.');
            }
            foreach ($rows as $row) {
                if (!is_array($row)) {
                    throw new \RuntimeException('Backup table row is invalid.');
                }
            }
        }
        $expectedTables = array_keys($allowed);
        $providedTables = array_keys($tables);
        sort($expectedTables);
        sort($providedTables);
        if ($providedTables !== $expectedTables) {
            throw new \RuntimeException('Backup does not contain the complete managed table set.');
        }
        $this->validatedManagedFiles($payload);
        return $tables;
    }

    /** @param array<string,mixed> $payload @return array<string,string> */
    private function validatedManagedFiles(array $payload): array
    {
        if(($payload['format']??'')===self::LEGACY_FORMAT)return [];$files=$payload['files']??null;if(!is_array($files))throw new \RuntimeException('Backup file payload is invalid.');$decoded=[];$total=0;
        foreach($files as $logical=>$entry){if(!is_string($logical)||!preg_match('#^user-media/([a-f0-9]{32}\.(?:jpg|png|webp))$#',$logical)||!is_array($entry))throw new \RuntimeException('Backup file path is invalid.');$bytes=base64_decode((string)($entry['bytes']??''),true);if(!is_string($bytes)||(int)($entry['size']??-1)!==strlen($bytes)||!hash_equals((string)($entry['sha256']??''),hash('sha256',$bytes)))throw new \RuntimeException('Backup file integrity is invalid.');$total+=strlen($bytes);if($total>100*1024*1024)throw new \RuntimeException('Backup file payload is too large.');$decoded[$logical]=$bytes;}return $decoded;
    }

    /** @return array<string,array{size:int,sha256:string,bytes:string}> */
    private function exportManagedFiles(): array
    {
        $root=$this->projectRoot.'/Server/runtime/user-media';$files=[];$total=0;if(!is_dir($root))return $files;
        foreach(new \FilesystemIterator($root,\FilesystemIterator::SKIP_DOTS) as $item){if(!$item->isFile()||$item->isLink())throw new BackupRuntimeException('BACKUP_FILE_UNSAFE','Managed media storage contains an unsupported entry.');$name=$item->getBasename();if(!preg_match('/^[a-f0-9]{32}\.(?:jpg|png|webp)$/',$name))throw new BackupRuntimeException('BACKUP_FILE_UNSAFE','Managed media filename is invalid.');$bytes=file_get_contents($item->getPathname());if(!is_string($bytes))throw new BackupRuntimeException('BACKUP_FILE_READ_FAILED','Managed media could not be read.');$total+=strlen($bytes);if($total>100*1024*1024)throw new BackupRuntimeException('BACKUP_FILE_LIMIT','Managed media exceeds the backup limit.');$files['user-media/'.$name]=['size'=>strlen($bytes),'sha256'=>hash('sha256',$bytes),'bytes'=>base64_encode($bytes)];}
        ksort($files);return $files;
    }

    /** @param array<string,mixed> $payload @return array{stage:string,target:string}|null */
    private function stageManagedFiles(array $payload): ?array
    {
        if(($payload['format']??'')===self::LEGACY_FORMAT)return null;$files=$this->validatedManagedFiles($payload);$target=$this->projectRoot.'/Server/runtime/user-media';if(is_dir($target)&&(new \FilesystemIterator($target))->valid())throw new \RuntimeException('Managed media target must be empty before restore.');$stage=$this->projectRoot.'/Server/runtime/.user-media-restore-'.bin2hex(random_bytes(8));if(!mkdir($stage,0700,true))throw new \RuntimeException('Could not stage managed media.');try{foreach($files as $logical=>$bytes){$name=basename($logical);if(file_put_contents($stage.'/'.$name,$bytes,LOCK_EX)===false)throw new \RuntimeException('Could not stage managed media.');}return ['stage'=>$stage,'target'=>$target];}catch(\Throwable $e){$this->removeTree($stage);throw $e;}
    }

    /** @param array{stage:string,target:string}|null $staged */
    private function commitManagedFiles(?array $staged): void { if($staged===null)return;if(is_dir($staged['target']))rmdir($staged['target']);if(!rename($staged['stage'],$staged['target'])){$this->removeTree($staged['stage']);throw new \RuntimeException('Could not finalize managed media restore.');} }
    private function removeTree(string $dir): void { if(!is_dir($dir))return;foreach(new \FilesystemIterator($dir,\FilesystemIterator::SKIP_DOTS) as $item)@unlink($item->getPathname());@rmdir($dir); }

    private function ensureDirectory(): void
    {
        if($this->customDirectory){$tested=self::testDirectory($this->backupDirectory,$this->projectRoot,(string)($_SERVER['DOCUMENT_ROOT']??''));if($tested['status']!=='ready')throw new BackupRuntimeException('BACKUP_STORAGE_UNAVAILABLE','Configured protected backup directory is not ready.');return;}
        if (!is_dir($this->backupDirectory) && !mkdir($this->backupDirectory, 0700, true) && !is_dir($this->backupDirectory)) {
            throw new BackupRuntimeException('BACKUP_STORAGE_UNAVAILABLE', 'Could not create the protected backup directory.');
        }
        @chmod($this->backupDirectory, 0700);
        if (!is_writable($this->backupDirectory)) {
            throw new BackupRuntimeException('BACKUP_STORAGE_UNAVAILABLE', 'Protected backup directory is not writable.');
        }
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

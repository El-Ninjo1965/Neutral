<?php
declare(strict_types=1);

// Host-compatible CLI entrypoint. Configure cPanel Cron daily; credentials and
// NEUTRAL_BACKUP_KEY remain in the server environment and never in this file.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit(1);
}

require_once dirname(__DIR__) . '/Server/php/bootstrap.php';

use Neutral\Core\DatabaseBackupService;
use Neutral\Core\Phase4JsonStore;
use Neutral\Core\Phase4SettingsService;
use Neutral\Core\Phase6SettingsService;
use Neutral\Core\SchemaMigrator;

$runtime = neutral_bootstrap();
$settings = (new Phase6SettingsService(
    $runtime->database(),
    new Phase4SettingsService(new Phase4JsonStore($runtime->projectRoot() . '/Server/runtime/config'))
))->getAll();
$options = is_array($settings['settings'] ?? null) ? $settings['settings'] : [];
if (($options['backupEnabled'] ?? true) !== true) {
    exit(0);
}
$interval = in_array(($options['backupInterval'] ?? 'daily'), ['daily', 'weekly', 'monthly'], true) ? $options['backupInterval'] : 'daily';
$seconds = ['daily' => 86400, 'weekly' => 604800, 'monthly' => 2592000][$interval];
$stateFile = $runtime->projectRoot() . '/Server/runtime/config/.automatic-backup-state.json';
$state = is_file($stateFile) ? json_decode((string) file_get_contents($stateFile), true) : [];
if (is_array($state) && (int) ($state['lastSuccess'] ?? 0) > time() - $seconds) exit(0);

try {
    $configuredPath=trim((string)($options['backupStoragePath']??''));
    $service = new DatabaseBackupService($runtime->database(), new SchemaMigrator($runtime->database()), $runtime->config(), $runtime->projectRoot(), null, null, $configuredPath===''?null:$configuredPath);
    $backup = $service->create();
    $service->enforceRetention(max(1, min(100, (int) ($options['backupRetention'] ?? 14))));
    @mkdir(dirname($stateFile),0700,true);
    if(file_put_contents($stateFile,json_encode(['lastSuccess'=>time(),'backupId'=>$backup['backupId'],'lastError'=>null],JSON_THROW_ON_ERROR),LOCK_EX)===false)throw new RuntimeException('Automatic backup state could not be saved.');
} catch (Throwable $exception) {
    @mkdir(dirname($stateFile), 0700, true);
    file_put_contents($stateFile, json_encode(['lastAttempt' => time(), 'lastError' => 'Automatic backup failed; inspect server logs.'], JSON_THROW_ON_ERROR), LOCK_EX);
    exit(1);
}

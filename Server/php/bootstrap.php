<?php
declare(strict_types=1);

require_once __DIR__ . '/src/EnvLoader.php';
require_once __DIR__ . '/src/AppConfig.php';
require_once __DIR__ . '/src/AppLogger.php';
require_once __DIR__ . '/src/Database.php';
require_once __DIR__ . '/src/JsonResponse.php';
require_once __DIR__ . '/src/Security.php';
require_once __DIR__ . '/src/AppRuntime.php';
require_once __DIR__ . '/src/SetupStateStore.php';
require_once __DIR__ . '/src/PrerequisiteChecker.php';
require_once __DIR__ . '/src/InfrastructureCatalog.php';
require_once __DIR__ . '/src/SetupInstaller.php';
require_once __DIR__ . '/src/SetupAccessGuard.php';
require_once __DIR__ . '/src/LoginRateLimiter.php';
require_once __DIR__ . '/src/DatabaseBackupService.php';
require_once __DIR__ . '/src/Phase4AuthRbac.php';
require_once __DIR__ . '/src/SchemaMigrator.php';
require_once __DIR__ . '/src/CoreDataSeeder.php';
require_once __DIR__ . '/src/Phase6AdminStorage.php';
require_once __DIR__ . '/src/Phase7ModuleRuntime.php';

/**
 * @param array{project_root?:string, register_error_handler?:bool} $options
 */
function neutral_bootstrap(array $options = []): \Neutral\Core\AppRuntime
{
    return \Neutral\Core\AppRuntime::init($options);
}

<?php
declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/core/php/bootstrap.php';

use Neutral\Core\JsonResponse;
use Neutral\Core\PrerequisiteChecker;
use Neutral\Core\SetupInstaller;
use Neutral\Core\SetupStateStore;

$runtime = neutral_bootstrap();
$stateStore = new SetupStateStore(SetupStateStore::defaultStateFile($runtime->projectRoot()));
$checker = new PrerequisiteChecker($runtime->config(), $runtime->database());
$installer = new SetupInstaller($runtime, $stateStore, $checker);

JsonResponse::success([
    'status' => $installer->status(),
]);

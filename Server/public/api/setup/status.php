<?php
declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/php/bootstrap.php';

use Neutral\Core\JsonResponse;
use Neutral\Core\PrerequisiteChecker;
use Neutral\Core\SetupInstaller;
use Neutral\Core\SetupAccessGuard;
use Neutral\Core\SetupStateStore;

$runtime = neutral_bootstrap();
$stateStore = new SetupStateStore(SetupStateStore::defaultStateFile($runtime->projectRoot()));
$checker = new PrerequisiteChecker($runtime->config(), $runtime->database());
$installer = new SetupInstaller($runtime, $stateStore, $checker);
SetupAccessGuard::enforce($runtime->config(), $installer);

if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET,OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(204);
    exit;
}

JsonResponse::success([
    'status' => $installer->status(),
]);

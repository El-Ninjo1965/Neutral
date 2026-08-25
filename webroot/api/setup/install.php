<?php
declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/core/php/bootstrap.php';

use Neutral\Core\JsonResponse;
use Neutral\Core\PrerequisiteChecker;
use Neutral\Core\SetupInstaller;
use Neutral\Core\SetupStateStore;

if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
    JsonResponse::error('Method not allowed. Use POST.', 405);
}

$runtime = neutral_bootstrap();
$stateStore = new SetupStateStore(SetupStateStore::defaultStateFile($runtime->projectRoot()));
$checker = new PrerequisiteChecker($runtime->config(), $runtime->database());
$installer = new SetupInstaller($runtime, $stateStore, $checker);

$status = $installer->status();
$alreadyActive = strtoupper((string) ($status['status'] ?? '')) === 'ACTIVE' && (bool) (($status['installation']['active'] ?? false) === true);
if ($alreadyActive) {
    JsonResponse::error('Installation is already active.', 409, ['status' => $status]);
}

$result = $installer->install();
$isActive = strtoupper((string) ($result['status'] ?? '')) === 'ACTIVE' && (bool) (($result['installation']['active'] ?? false) === true);
if (!$isActive) {
    JsonResponse::error('Installation prerequisites are not satisfied.', 409, ['status' => $result]);
}

JsonResponse::success([
    'status' => $result,
], 201);

<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/php/bootstrap.php';

use Neutral\Core\JsonResponse;

$runtime = neutral_bootstrap();
$config = $runtime->config();

$database = $config->database();
$missingDbKeys = [];
foreach (['host', 'port', 'name', 'user'] as $requiredKey) {
    if (trim((string) ($database[$requiredKey] ?? '')) === '') {
        $missingDbKeys[] = $requiredKey;
    }
}

$dbState = 'not_configured';
if ($missingDbKeys === []) {
    try {
        $dbState = $runtime->database()->ping() ? 'ok' : 'error';
    } catch (Throwable $exception) {
        $dbState = 'error';
    }
}

JsonResponse::success([
    'service' => 'neutral-core',
    'status' => 'ok',
    'environment' => $config->environment(),
    'app' => [
        'id' => $config->appId(),
        'name' => $config->appName(),
        'apiBase' => $config->apiBase(),
    ],
    'database' => [
        'state' => $dbState,
    ],
], 200);

<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/core/php/bootstrap.php';

use Neutral\Core\JsonResponse;

$runtime = neutral_bootstrap();
$path = trim((string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH), '/');
$segments = $path === '' ? [] : explode('/', $path);
$last = $segments === [] ? '' : strtolower((string) end($segments));

if (count($segments) >= 2) {
    $penultimate = strtolower((string) ($segments[count($segments) - 2] ?? ''));
    if ($penultimate === 'setup' && $last === 'status') {
        require __DIR__ . '/setup/status.php';
        exit;
    }
    if ($penultimate === 'setup' && $last === 'install') {
        require __DIR__ . '/setup/install.php';
        exit;
    }
}

if ($last === 'status') {
    $config = $runtime->config();
    $database = $config->database();
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
            'type' => $database['type'],
            'host' => $database['host'],
            'port' => $database['port'],
            'name' => $database['name'],
            'user' => $database['user'],
        ],
    ]);
}

JsonResponse::error('Not found', 404, ['path' => $path]);

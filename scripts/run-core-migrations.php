<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit(1);
}

require_once dirname(__DIR__) . '/Server/php/bootstrap.php';

use Neutral\Core\SchemaMigrator;

try {
    $runtime = neutral_bootstrap();
    $migrator = new SchemaMigrator($runtime->database());
    $result = $migrator->migrate();
    $status = $migrator->status();
    if ($status['pending'] !== []) {
        fwrite(STDERR, "Core migrations remain pending.\n");
        exit(2);
    }
    echo json_encode(['status' => 'ready', 'applied' => count($result['applied']), 'pending' => 0], JSON_THROW_ON_ERROR) . PHP_EOL;
} catch (Throwable $exception) {
    fwrite(STDERR, "Core migration failed; inspect protected server logs.\n");
    exit(1);
}

<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

use Neutral\Core\PrerequisiteChecker;
use Neutral\Core\SetupInstaller;
use Neutral\Core\SetupStateStore;

$runtime = neutral_bootstrap([
    'project_root' => dirname(__DIR__, 3),
    'register_error_handler' => false,
]);

$checker = new PrerequisiteChecker($runtime->config(), $runtime->database());
$checkResult = $checker->run($runtime->projectRoot(), $runtime->envFile());

if (!isset($checkResult['checks']) || !is_array($checkResult['checks'])) {
    fwrite(STDERR, "Prerequisite checker did not return checks.\n");
    exit(1);
}

$store = new SetupStateStore(SetupStateStore::defaultStateFile($runtime->projectRoot()));
$installer = new SetupInstaller($runtime, $store, $checker);
$status = $installer->status();

if (!isset($status['status']) || !is_string($status['status'])) {
    fwrite(STDERR, "Setup installer did not return status.\n");
    exit(1);
}

echo "PHP core smoke test passed.\n";
exit(0);

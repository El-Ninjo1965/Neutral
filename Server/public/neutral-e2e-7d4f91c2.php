<?php

declare(strict_types=1);

header('Content-Type: text/plain; charset=UTF-8');
header('Cache-Control: no-store');

$marker = 'neutral-e2e-7d4f91c2-success';
$deleted = @unlink(__FILE__);

echo $marker . PHP_EOL;
echo 'self_deleted=' . ($deleted ? 'true' : 'false') . PHP_EOL;

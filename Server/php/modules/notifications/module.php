<?php
declare(strict_types=1);
return ['moduleId'=>'notifications','services'=>['module.notifications.capability'=>static fn(array $context): object => new class { public function status(array $context): array { return ['available'=>true]; } }],'migrations'=>[]];

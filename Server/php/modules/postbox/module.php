<?php
declare(strict_types=1);
return ['moduleId'=>'postbox','services'=>['module.postbox.capability'=>static fn(array $context): object => new class { public function status(array $context): array { return ['available'=>true]; } }],'migrations'=>[]];

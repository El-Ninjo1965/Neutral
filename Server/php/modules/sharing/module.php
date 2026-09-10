<?php
declare(strict_types=1);
return ['moduleId'=>'sharing','services'=>['module.sharing.capability'=>static fn(array $context): object => new class { public function status(array $context): array { return ['available'=>true]; } }],'migrations'=>[]];

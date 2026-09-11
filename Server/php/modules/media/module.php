<?php
declare(strict_types=1);

return [
    'moduleId' => 'media',
    'services' => [
        'module.media.capability' => static function (array $context): object {
            return new class {
                /** @param array<string,mixed> $context @return array{available:bool} */
                public function status(array $context): array
                {
                    return ['available' => true];
                }
            };
        },
    ],
    'migrations' => [],
];

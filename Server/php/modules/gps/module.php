<?php
declare(strict_types=1);

return [
    'moduleId' => 'gps',
    'services' => [
        'module.gps.status' => static fn (array $context): object => new class {
            /** @param array<string,mixed> $context @return array<string,mixed> */
            public function status(array $context): array
            {
                return [
                    'module' => 'gps',
                    'available' => true,
                    'serverStorage' => false,
                ];
            }
        },
    ],
    'migrations' => [],
];

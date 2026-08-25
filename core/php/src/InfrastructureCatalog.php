<?php
declare(strict_types=1);

namespace Neutral\Core;

final class InfrastructureCatalog
{
    /**
     * @return array<string, mixed>
     */
    public static function defaultCatalog(): array
    {
        return [
            'schemaVersion' => 1,
            'entity' => 'connection_service',
            'requiredFields' => [
                'type',
                'name',
                'configuration',
                'credential_reference',
                'capabilities',
                'status',
                'enabled',
            ],
            'supportedTypes' => [
                'database_mysql',
                'database_postgresql',
                'api_http',
                'server_php',
                'server_node',
                'service_webhook',
            ],
            'notes' => [
                'node_integration' => 'defined as future type only; not active production runtime in current phase',
                'secret_handling' => 'credentials should be stored as references, not returned to frontend in plaintext',
            ],
        ];
    }
}

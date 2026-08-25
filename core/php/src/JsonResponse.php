<?php
declare(strict_types=1);

namespace Neutral\Core;

final class JsonResponse
{
    /**
     * @param array<string, mixed> $payload
     */
    public static function send(array $payload, int $statusCode = 200): never
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store, no-cache, must-revalidate');
        header('Pragma: no-cache');

        $json = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            throw new \RuntimeException('Could not encode JSON response payload.');
        }

        echo $json;
        exit;
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function success(array $data = [], int $statusCode = 200): never
    {
        self::send([
            'ok' => true,
            'data' => $data,
        ], $statusCode);
    }

    /**
     * @param array<string, mixed> $details
     */
    public static function error(string $message, int $statusCode = 400, array $details = []): never
    {
        self::send([
            'ok' => false,
            'error' => [
                'message' => $message,
                'details' => $details,
            ],
        ], $statusCode);
    }
}

<?php
declare(strict_types=1);

namespace Neutral\Core;

final class SetupAccessGuard
{
    public static function enforce(AppConfig $config, SetupInstaller $installer): void
    {
        if (!$installer->hasInstallationEvidence()) {
            return;
        }

        if (!$config->isSetupRecoveryEnabled()) {
            self::notFound();
        }

        $expectedToken = $config->setupRecoveryToken();
        $providedToken = self::basicAuthPassword();
        if (strlen($expectedToken) < 32 || $providedToken === '' || !hash_equals($expectedToken, $providedToken)) {
            header('WWW-Authenticate: Basic realm="Neutral setup recovery", charset="UTF-8"');
            header('Cache-Control: no-store');
            JsonResponse::error('Recovery authentication required.', 401);
        }
    }

    private static function basicAuthPassword(): string
    {
        $phpAuthPassword = (string) ($_SERVER['PHP_AUTH_PW'] ?? '');
        if ($phpAuthPassword !== '') {
            return $phpAuthPassword;
        }

        $authorization = trim((string) ($_SERVER['HTTP_AUTHORIZATION'] ?? ''));
        if (!preg_match('/^Basic\s+([A-Za-z0-9+\/=]+)$/i', $authorization, $matches)) {
            return '';
        }
        $decoded = base64_decode($matches[1], true);
        if ($decoded === false || !str_contains($decoded, ':')) {
            return '';
        }
        return (string) substr($decoded, strpos($decoded, ':') + 1);
    }

    private static function notFound(): never
    {
        header('Cache-Control: no-store');
        JsonResponse::error('Not found.', 404);
    }
}

<?php
declare(strict_types=1);

namespace Neutral\Core;

final class Security
{
    public static function ensureSessionStarted(string $cookieName = 'neutral_session'): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        session_name($cookieName);
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => self::isHttpsRequest(),
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }

    public static function ensureCsrfToken(): string
    {
        self::ensureSessionStarted();
        if (!isset($_SESSION['_csrf_token']) || !is_string($_SESSION['_csrf_token']) || $_SESSION['_csrf_token'] === '') {
            $_SESSION['_csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['_csrf_token'];
    }

    public static function assertValidCsrfToken(?string $providedToken): void
    {
        self::ensureSessionStarted();
        $expected = isset($_SESSION['_csrf_token']) && is_string($_SESSION['_csrf_token']) ? $_SESSION['_csrf_token'] : '';
        if ($expected === '' || !is_string($providedToken) || $providedToken === '' || !hash_equals($expected, $providedToken)) {
            throw new \RuntimeException('Invalid CSRF token.');
        }
    }

    public static function isHttpsRequest(): bool
    {
        if (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off') {
            return true;
        }
        $forwardedProto = strtolower(trim((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')));
        return $forwardedProto === 'https';
    }
}

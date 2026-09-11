<?php
declare(strict_types=1);

namespace Neutral\Core;

final class Security
{
    public static function ensureSessionStarted(string $cookieName = 'neutral_session', bool $persistent = false): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        session_name($cookieName);
        $lifetime = $persistent ? 60 * 60 * 24 * 400 : 60 * 60 * 24 * 30;
        // Keep PHP's server-side session payload at least as long as the cookie.
        // The database registry remains authoritative and can recover a payload
        // if host-level garbage collection nevertheless removes the file.
        ini_set('session.gc_maxlifetime', (string) $lifetime);
        $providedSessionId = isset($_COOKIE[$cookieName]) && is_string($_COOKIE[$cookieName])
            ? trim((string) $_COOKIE[$cookieName])
            : '';
        if ($providedSessionId !== '') {
            session_id($providedSessionId);
        }
        session_set_cookie_params([
            // Browsers require a finite cookie date. User sessions therefore use
            // the maximum broadly supported 400-day window and renew on requests;
            // server-side validity itself has no calendar/idle expiry.
            'lifetime' => $lifetime,
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

    public static function allowsAuditClear(string $environment): bool
    {
        return in_array(strtolower(trim($environment)), ['development', 'test'], true);
    }
}

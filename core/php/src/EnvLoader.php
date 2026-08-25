<?php
declare(strict_types=1);

namespace Neutral\Core;

final class EnvLoader
{
    /**
     * @return array<string, string>
     */
    public static function parseFile(string $filePath): array
    {
        if ($filePath === '' || !is_file($filePath) || !is_readable($filePath)) {
            return [];
        }

        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return [];
        }

        $values = [];
        foreach ($lines as $line) {
            $trimmed = trim((string) $line);
            if ($trimmed === '' || str_starts_with($trimmed, '#')) {
                continue;
            }

            $separatorIndex = strpos($trimmed, '=');
            if ($separatorIndex === false) {
                continue;
            }

            $key = trim(substr($trimmed, 0, $separatorIndex));
            if ($key === '') {
                continue;
            }

            $rawValue = trim(substr($trimmed, $separatorIndex + 1));
            $cleanValue = stripslashes($rawValue);
            if (
                strlen($cleanValue) >= 2 &&
                (
                    ($cleanValue[0] === '"' && $cleanValue[strlen($cleanValue) - 1] === '"') ||
                    ($cleanValue[0] === '\'' && $cleanValue[strlen($cleanValue) - 1] === '\'')
                )
            ) {
                $cleanValue = substr($cleanValue, 1, -1);
            }

            $values[$key] = $cleanValue;
        }

        return $values;
    }

    public static function detectEnvFile(string $projectRoot): string
    {
        $candidates = self::defaultCandidates($projectRoot);
        foreach ($candidates as $candidate) {
            if ($candidate !== '' && is_file($candidate) && is_readable($candidate)) {
                return $candidate;
            }
        }

        return rtrim($projectRoot, "/\\") . '/.env';
    }

    /**
     * @return array<string, string>
     */
    public static function loadMerged(string $projectRoot): array
    {
        $values = [];
        foreach (self::defaultCandidates($projectRoot) as $candidate) {
            if ($candidate !== '' && is_file($candidate) && is_readable($candidate)) {
                $values = array_replace($values, self::parseFile($candidate));
            }
        }

        foreach ($_ENV as $key => $value) {
            if (is_string($key) && is_scalar($value)) {
                $values[$key] = (string) $value;
            }
        }

        foreach ($_SERVER as $key => $value) {
            if (is_string($key) && str_starts_with($key, 'NEUTRAL_') && is_scalar($value)) {
                $values[$key] = (string) $value;
            }
        }

        return $values;
    }

    /**
     * @return list<string>
     */
    public static function defaultCandidates(string $projectRoot): array
    {
        $projectRoot = rtrim($projectRoot, "/\\");
        $roots = [
            $projectRoot,
            dirname($projectRoot),
            dirname(dirname($projectRoot)),
            (string) getenv('NEUTRAL_APP_ROOT'),
            (string) getenv('NEUTRAL_INSTALL_ROOT'),
            (string) getenv('APP_ROOT'),
            (string) getenv('INSTALL_ROOT'),
            (string) getenv('DOCUMENT_ROOT'),
            '/home/web1819',
            '/home/web1819/public_html',
            '/home/web1819/public_html/index/app/neutral',
            '/var/www/html',
            '/var/www',
            '/srv/www',
        ];

        $candidates = [];
        $seen = [];
        foreach ($roots as $root) {
            if (!is_string($root) || trim($root) === '') {
                continue;
            }
            $normalizedRoot = rtrim($root, "/\\");
            if (isset($seen[$normalizedRoot])) {
                continue;
            }
            $seen[$normalizedRoot] = true;

            $candidates[] = $normalizedRoot . '/.env';
            $candidates[] = $normalizedRoot . '/.env.local';
            $candidates[] = $normalizedRoot . '/.env.production';
            $candidates[] = $normalizedRoot . '/.env.development';
            $candidates[] = $normalizedRoot . '/index/app/neutral/.env';
        }

        $explicit = (string) getenv('NEUTRAL_ENV_FILE');
        if (trim($explicit) !== '') {
            array_unshift($candidates, $explicit);
        }

        return array_values(array_unique($candidates));
    }
}

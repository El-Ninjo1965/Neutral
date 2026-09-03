<?php
declare(strict_types=1);

namespace Neutral\Core;

use InvalidArgumentException;

final class PublicPath
{
    private string $basePath;

    public function __construct(string $basePath = '')
    {
        $this->basePath = self::normalize($basePath);
    }

    public static function normalize(string $value): string
    {
        if ($value === '' || $value === '/') {
            return '';
        }

        if (str_ends_with($value, '/')) {
            $value = substr($value, 0, -1);
        }
        if (!str_starts_with($value, '/')) {
            $value = '/' . $value;
        }

        if (!preg_match('#^/(?:[A-Za-z0-9._~-]+(?:/[A-Za-z0-9._~-]+)*)\z#', $value)) {
            throw new InvalidArgumentException('Invalid base path.');
        }

        foreach (explode('/', substr($value, 1)) as $segment) {
            if ($segment === '.' || $segment === '..') {
                throw new InvalidArgumentException('Invalid base path.');
            }
        }

        return $value;
    }

    public function basePath(): string
    {
        return $this->basePath;
    }

    public function publicUrl(string $path): string
    {
        $normalizedPath = $this->normalizeLocalPath($path);
        return $this->basePath . '/' . $normalizedPath;
    }

    public function apiBase(): string
    {
        return $this->publicUrl('api/v1');
    }

    /**
     * @return array{version:?int,route:string}
     */
    public function apiRequestRoute(string $requestUri): array
    {
        $requestPath = parse_url($requestUri, PHP_URL_PATH);
        if (!is_string($requestPath)) {
            throw new InvalidArgumentException('Invalid API request path.');
        }

        if ($this->basePath !== '') {
            if (!str_starts_with($requestPath, $this->basePath . '/')) {
                throw new InvalidArgumentException('Invalid API request path.');
            }
            $requestPath = substr($requestPath, strlen($this->basePath));
        }

        $segments = explode('/', trim($requestPath, '/'));
        if (($segments[0] ?? '') !== 'api') {
            throw new InvalidArgumentException('Invalid API request path.');
        }
        array_shift($segments);

        $requestedVersion = null;
        if ($segments !== [] && preg_match('/^v([0-9]+)$/i', (string) $segments[0], $versionMatch) === 1) {
            $requestedVersion = (int) $versionMatch[1];
            array_shift($segments);
        }

        return [
            'version' => $requestedVersion,
            'route' => strtolower(implode('/', $segments)),
        ];
    }

    private function normalizeLocalPath(string $path): string
    {
        $normalizedPath = preg_replace('#/+#', '/', $path);
        if ($normalizedPath === null) {
            throw new InvalidArgumentException('Invalid public path.');
        }
        $normalizedPath = trim($normalizedPath, '/');

        if ($normalizedPath === '') {
            return '';
        }
        if (!preg_match('#^[A-Za-z0-9._~/-]+$#', $normalizedPath)) {
            throw new InvalidArgumentException('Invalid public path.');
        }
        foreach (explode('/', $normalizedPath) as $segment) {
            if ($segment === '.' || $segment === '..') {
                throw new InvalidArgumentException('Invalid public path.');
            }
        }

        return $normalizedPath;
    }
}

<?php
declare(strict_types=1);

namespace Neutral\Core;

final class ModuleContract
{
    public const CORE_VERSION = '1.0.0';
    public const API_VERSION = 1;

    private string $coreVersion;
    private int $apiVersion;
    private string $phpVersion;

    public function __construct(
        string $coreVersion = self::CORE_VERSION,
        int $apiVersion = self::API_VERSION,
        string $phpVersion = PHP_VERSION
    ) {
        $this->assertSemanticVersion($coreVersion, 'Core version');
        $this->assertSemanticVersion($phpVersion, 'PHP version');
        if ($apiVersion < 1) {
            throw new \RuntimeException('API version must be positive.');
        }
        $this->coreVersion = $coreVersion;
        $this->apiVersion = $apiVersion;
        $this->phpVersion = $phpVersion;
    }

    /**
     * @param array<string,mixed> $manifest
     * @return array<string,mixed>
     */
    public function normalize(array $manifest): array
    {
        $moduleId = strtolower(trim((string) ($manifest['id'] ?? '')));
        if (preg_match('/^[a-z][a-z0-9-]{1,63}$/', $moduleId) !== 1 || $moduleId === 'neutral') {
            throw new \RuntimeException('Invalid module id.');
        }

        $version = trim((string) ($manifest['version'] ?? ''));
        $this->assertSemanticVersion($version, 'Module version');

        $permissionKeys = $this->permissionKeys($manifest['permissions'] ?? null, $moduleId);
        $compatibility = $this->normalizeCompatibility($manifest['compatibility'] ?? null);
        $limits = $this->normalizeLimits($manifest['limits'] ?? null, $moduleId);
        $server = $this->normalizeServer($manifest['server'] ?? null, $moduleId, $permissionKeys, array_column($limits, 'key'));
        $database = $this->normalizeDatabase($manifest['database'] ?? null);
        $uninstall = $this->normalizeUninstall($manifest['uninstall'] ?? null);

        $normalized = $manifest;
        $normalized['id'] = $moduleId;
        $normalized['version'] = $version;
        $normalized['compatibility'] = $compatibility;
        $normalized['server'] = $server;
        $normalized['database'] = $database;
        $normalized['limits'] = $limits;
        $normalized['uninstall'] = $uninstall;
        return $normalized;
    }

    /** @param array<string,mixed> $contract */
    public function assertCompatible(array $contract): void
    {
        $compatibility = $this->normalizeCompatibility($contract['compatibility'] ?? null);
        if (!$this->matchesRange($this->coreVersion, $compatibility['core'])) {
            throw new \RuntimeException('Module is incompatible with this core version.');
        }
        if ($compatibility['api'] !== $this->apiVersion) {
            throw new \RuntimeException('Module is incompatible with this API version.');
        }
        if (!$this->matchesRange($this->phpVersion, $compatibility['php'])) {
            throw new \RuntimeException('Module is incompatible with this PHP version.');
        }
    }

    /**
     * @param mixed $permissions
     * @return list<string>
     */
    private function permissionKeys($permissions, string $moduleId): array
    {
        if (!is_array($permissions)) {
            throw new \RuntimeException('Module permissions must be declared.');
        }
        $keys = [];
        foreach ($permissions as $permission) {
            $key = is_array($permission)
                ? trim((string) ($permission['key'] ?? ''))
                : trim((string) $permission);
            if (preg_match('/^' . preg_quote($moduleId, '/') . '\.[a-z][a-z0-9.-]{0,119}$/', $key) !== 1) {
                throw new \RuntimeException('Module permission is outside its namespace.');
            }
            $keys[] = $key;
        }
        return array_values(array_unique($keys));
    }

    /**
     * @param mixed $value
     * @return array{core:string,api:int,php:string}
     */
    private function normalizeCompatibility($value): array
    {
        if (!is_array($value)) {
            throw new \RuntimeException('Module compatibility is required.');
        }
        $core = trim((string) ($value['core'] ?? ''));
        $php = trim((string) ($value['php'] ?? ''));
        $apiRaw = $value['api'] ?? null;
        if ($core === '' || $php === '' || (!is_int($apiRaw) && !(is_string($apiRaw) && ctype_digit($apiRaw)))) {
            throw new \RuntimeException('Incomplete module compatibility declaration.');
        }
        $api = (int) $apiRaw;
        $this->validateRange($core);
        $this->validateRange($php);
        $normalized = ['core' => $core, 'api' => $api, 'php' => $php];
        if (!$this->matchesRange($this->coreVersion, $core)) {
            throw new \RuntimeException('Module is incompatible with this core version.');
        }
        if ($api !== $this->apiVersion) {
            throw new \RuntimeException('Module is incompatible with this API version.');
        }
        if (!$this->matchesRange($this->phpVersion, $php)) {
            throw new \RuntimeException('Module is incompatible with this PHP version.');
        }
        return $normalized;
    }

    /**
     * @param mixed $value
     * @param list<string> $permissions
     * @param list<string> $limitKeys
     * @return array{entry:string,services:list<string>,routes:list<array<string,mixed>>}
     */
    private function normalizeServer($value, string $moduleId, array $permissions, array $limitKeys): array
    {
        if (!is_array($value)) {
            throw new \RuntimeException('Module server declaration is required.');
        }
        $entry = trim((string) ($value['entry'] ?? ''));
        $prefix = 'Server/php/modules/' . $moduleId . '/';
        if (
            !str_starts_with($entry, $prefix)
            || str_contains($entry, '..')
            || str_contains($entry, '\\')
            || str_contains($entry, '//')
            || preg_match('/^[A-Za-z]:/', $entry) === 1
            || !str_ends_with(strtolower($entry), '.php')
        ) {
            throw new \RuntimeException('Unsafe module server entry.');
        }

        $services = [];
        foreach (($value['services'] ?? []) as $service) {
            $name = trim((string) $service);
            if (preg_match('/^module\.' . preg_quote($moduleId, '/') . '\.[a-z][a-z0-9.-]{0,119}$/', $name) !== 1) {
                throw new \RuntimeException('Invalid module service name.');
            }
            $services[] = $name;
        }
        $services = array_values(array_unique($services));
        if ($services === []) {
            throw new \RuntimeException('At least one module service is required.');
        }

        $routes = [];
        foreach (($value['routes'] ?? []) as $route) {
            if (!is_array($route)) {
                throw new \RuntimeException('Invalid module route declaration.');
            }
            $method = strtoupper(trim((string) ($route['method'] ?? '')));
            $path = trim((string) ($route['path'] ?? ''));
            $service = trim((string) ($route['service'] ?? ''));
            $action = trim((string) ($route['action'] ?? ''));
            $permission = trim((string) ($route['permission'] ?? ''));
            $csrf = ($route['csrf'] ?? false) === true;
            if (!in_array($method, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], true)) {
                throw new \RuntimeException('Unsupported module route method.');
            }
            if (preg_match('#^[a-z0-9][a-z0-9-]*(?:/[a-z0-9][a-z0-9-]*)*$#', $path) !== 1) {
                throw new \RuntimeException('Invalid module route path.');
            }
            if (!in_array($service, $services, true) || preg_match('/^[a-z][A-Za-z0-9_]{0,63}$/', $action) !== 1) {
                throw new \RuntimeException('Invalid module service action.');
            }
            if (!in_array($permission, $permissions, true)) {
                throw new \RuntimeException('Module route permission is not declared.');
            }
            if ($method !== 'GET' && !$csrf) {
                throw new \RuntimeException('Mutating module routes require CSRF protection.');
            }
            $normalizedRoute = [
                'method' => $method,
                'path' => $path,
                'service' => $service,
                'action' => $action,
                'permission' => $permission,
                'csrf' => $csrf,
                'limit' => null,
            ];
            if (isset($route['limit'])) {
                if (!is_array($route['limit'])) {
                    throw new \RuntimeException('Invalid module route limit.');
                }
                $limitKey = trim((string) ($route['limit']['key'] ?? ''));
                $cost = $route['limit']['cost'] ?? null;
                $usageAction = trim((string) ($route['limit']['usageAction'] ?? ''));
                if (!in_array($limitKey, $limitKeys, true) || !is_int($cost) || $cost < 1 || preg_match('/^[a-z][A-Za-z0-9_]{0,63}$/', $usageAction) !== 1) {
                    throw new \RuntimeException('Invalid module route limit.');
                }
                $normalizedRoute['limit'] = ['key' => $limitKey, 'cost' => $cost, 'usageAction' => $usageAction];
            }
            $routes[] = $normalizedRoute;
        }
        if ($routes === []) {
            throw new \RuntimeException('At least one module route is required.');
        }
        return ['entry' => $entry, 'services' => $services, 'routes' => $routes];
    }

    /**
     * @param mixed $value
     * @return list<array{key:string,default:int,roles:array<string,int|null>}>
     */
    private function normalizeLimits($value, string $moduleId): array
    {
        if ($value === null) {
            return [];
        }
        if (!is_array($value)) {
            throw new \RuntimeException('Invalid module limits.');
        }
        $limits = [];
        foreach ($value as $limit) {
            if (!is_array($limit)) {
                throw new \RuntimeException('Invalid module limit.');
            }
            $key = trim((string) ($limit['key'] ?? ''));
            $default = $limit['default'] ?? null;
            if (preg_match('/^' . preg_quote($moduleId, '/') . '\.[a-z][a-z0-9.-]{0,119}$/', $key) !== 1 || !is_int($default) || $default < 0) {
                throw new \RuntimeException('Invalid module limit.');
            }
            $roles = [];
            foreach (($limit['roles'] ?? []) as $role => $maximum) {
                $roleKey = strtolower(trim((string) $role));
                if (preg_match('/^[a-z][a-z0-9-]{0,63}$/', $roleKey) !== 1 || ($maximum !== null && (!is_int($maximum) || $maximum < 0))) {
                    throw new \RuntimeException('Invalid module role limit.');
                }
                $roles[$roleKey] = $maximum;
            }
            $limits[$key] = ['key' => $key, 'default' => $default, 'roles' => $roles];
        }
        return array_values($limits);
    }

    /**
     * @param mixed $value
     * @return array<string,mixed>
     */
    private function normalizeDatabase($value): array
    {
        $database = is_array($value) ? $value : [];
        $migrations = [];
        foreach (($database['migrations'] ?? []) as $migration) {
            if (!is_array($migration)) {
                throw new \RuntimeException('Invalid module migration.');
            }
            $key = trim((string) ($migration['key'] ?? ''));
            $version = trim((string) ($migration['version'] ?? ''));
            if (preg_match('/^[0-9]{4}_[0-9]{2}_[0-9]{2}_[0-9]{4}_[a-z0-9_]+$/', $key) !== 1) {
                throw new \RuntimeException('Invalid module migration key.');
            }
            $this->assertSemanticVersion($version, 'Module migration version');
            $migrations[] = ['key' => $key, 'version' => $version];
        }
        $database['migrations'] = $migrations;
        return $database;
    }

    /** @param mixed $value @return array{dataPolicy:string} */
    private function normalizeUninstall($value): array
    {
        $source = is_array($value) ? $value : [];
        $policy = strtolower(trim((string) ($source['dataPolicy'] ?? 'retain')));
        if (!in_array($policy, ['retain', 'destroy'], true)) {
            throw new \RuntimeException('Invalid module uninstall data policy.');
        }
        return ['dataPolicy' => $policy];
    }

    private function validateRange(string $range): void
    {
        if (preg_match('/^>=([0-9]+\.[0-9]+\.[0-9]+)(?: <([0-9]+\.[0-9]+\.[0-9]+))?$/', $range) !== 1) {
            throw new \RuntimeException('Unsupported compatibility range.');
        }
    }

    private function matchesRange(string $version, string $range): bool
    {
        if (preg_match('/^>=([0-9]+\.[0-9]+\.[0-9]+)(?: <([0-9]+\.[0-9]+\.[0-9]+))?$/', $range, $matches) !== 1) {
            return false;
        }
        if (version_compare($version, $matches[1], '<')) {
            return false;
        }
        return !isset($matches[2]) || $matches[2] === '' || version_compare($version, $matches[2], '<');
    }

    private function assertSemanticVersion(string $version, string $label): void
    {
        if (preg_match('/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$/', $version) !== 1) {
            throw new \RuntimeException($label . ' must use semantic versioning.');
        }
    }
}

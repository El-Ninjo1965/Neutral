<?php
declare(strict_types=1);

namespace Neutral\Core;

final class ModuleHttpException extends \RuntimeException
{
    private int $status;
    private string $errorCode;

    public function __construct(string $message, int $status, string $errorCode)
    {
        parent::__construct($message);
        $this->status = $status;
        $this->errorCode = $errorCode;
    }

    public function status(): int
    {
        return $this->status;
    }

    public function errorCode(): string
    {
        return $this->errorCode;
    }
}

final class ModuleHttpKernel
{
    private ModuleServerRegistry $registry;
    /** @var callable(string):?array<string,mixed> */
    private $moduleResolver;
    /** @var callable(array<string,mixed>,string):bool */
    private $permissionChecker;
    /** @var callable(?string):void */
    private $csrfChecker;
    private ModuleLimitGuard $limitGuard;

    public function __construct(
        ModuleServerRegistry $registry,
        callable $moduleResolver,
        callable $permissionChecker,
        callable $csrfChecker,
        ?ModuleLimitGuard $limitGuard = null
    ) {
        $this->registry = $registry;
        $this->moduleResolver = $moduleResolver;
        $this->permissionChecker = $permissionChecker;
        $this->csrfChecker = $csrfChecker;
        $this->limitGuard = $limitGuard ?? new ModuleLimitGuard();
    }

    /**
     * @param array<string,mixed>|null $identity
     * @param array<string,string> $headers
     * @param array<string,mixed> $payload
     * @param array<string,mixed> $query
     * @return array{status:int,data:array<string,mixed>}|null
     */
    public function dispatch(
        string $route,
        string $method,
        ?array $identity,
        array $headers,
        array $payload = [],
        array $query = []
    ): ?array {
        if (preg_match('#^modules/([a-z][a-z0-9-]{1,63})/(.+)$#', $route, $matches) !== 1) {
            return null;
        }
        $moduleId = $matches[1];
        $relativePath = trim($matches[2], '/');
        $module = ($this->moduleResolver)($moduleId);
        if (!is_array($module)) {
            throw new ModuleHttpException('Module route not found.', 404, 'MODULE_NOT_FOUND');
        }
        try {
            $contract = $this->registry->contractForRequest($module);
        } catch (\Throwable $exception) {
            throw new ModuleHttpException('Module route is unavailable.', 404, 'MODULE_UNAVAILABLE');
        }

        $httpMethod = strtoupper(trim($method));
        $matched = null;
        foreach ($contract['server']['routes'] as $candidate) {
            if ((string) $candidate['method'] === $httpMethod && (string) $candidate['path'] === $relativePath) {
                $matched = $candidate;
                break;
            }
        }
        if (!is_array($matched)) {
            throw new ModuleHttpException('Module route not found.', 404, 'MODULE_ROUTE_NOT_FOUND');
        }
        if ($identity === null) {
            throw new ModuleHttpException('Not authenticated.', 401, 'MODULE_AUTH_REQUIRED');
        }
        if (!(($this->permissionChecker)($identity, (string) $matched['permission']))) {
            throw new ModuleHttpException('Insufficient privileges.', 403, 'MODULE_PERMISSION_DENIED');
        }
        if (($matched['csrf'] ?? false) === true && (($identity['via'] ?? '') === 'session')) {
            try {
                ($this->csrfChecker)($headers['x-csrf-token'] ?? null);
            } catch (\Throwable $exception) {
                throw new ModuleHttpException('Invalid CSRF token.', 403, 'CSRF_INVALID');
            }
        }

        try {
            $resolved = $this->registry->resolve($module);
        } catch (\Throwable $exception) {
            throw new ModuleHttpException('Module service is unavailable.', 503, 'MODULE_SERVICE_UNAVAILABLE');
        }

        $serviceName = (string) $matched['service'];
        $action = (string) $matched['action'];
        try {
            $service = $this->registry->instantiateService($resolved, $serviceName);
        } catch (\Throwable $exception) {
            throw new ModuleHttpException('Module service is unavailable.', 503, 'MODULE_SERVICE_UNAVAILABLE');
        }
        if (!is_callable([$service, $action])) {
            throw new ModuleHttpException('Module service is unavailable.', 503, 'MODULE_SERVICE_UNAVAILABLE');
        }
        $context = [
                'moduleId' => $moduleId,
                'identity' => $identity,
                'payload' => $payload,
                'query' => $query,
                'method' => $httpMethod,
                'route' => $relativePath,
        ];
        $routeLimit = $matched['limit'] ?? null;
        $invoke = function () use ($service, $action, $context): array {
            try {
                $result = $service->{$action}($context);
            } catch (ModuleHttpException $exception) {
                throw $exception;
            } catch (\InvalidArgumentException $exception) {
                throw new ModuleHttpException('Invalid module request.', 400, 'MODULE_REQUEST_INVALID');
            } catch (\Throwable $exception) {
                throw new ModuleHttpException('Module service temporarily unavailable.', 503, 'MODULE_SERVICE_ERROR');
            }
            if (!is_array($result)) {
                throw new ModuleHttpException('Module service returned an invalid response.', 503, 'MODULE_RESPONSE_INVALID');
            }
            return $result;
        };
        if (is_array($routeLimit)) {
            $usageAction = (string) ($routeLimit['usageAction'] ?? '');
            if (!is_callable([$service, $usageAction])) {
                throw new ModuleHttpException('Module limit usage is unavailable.', 503, 'MODULE_LIMIT_USAGE_UNAVAILABLE');
            }
            $roles = is_array($identity['roles'] ?? null) ? array_values(array_map('strval', $identity['roles'])) : [];
            try {
                $result = $this->registry->withLimitLock($moduleId, (string) $routeLimit['key'], function () use ($service, $usageAction, $context, $resolved, $routeLimit, $roles, $invoke): array {
                    $current = $service->{$usageAction}($context);
                    if (!is_int($current)) {
                        throw new ModuleHttpException('Module limit usage is invalid.', 503, 'MODULE_LIMIT_USAGE_INVALID');
                    }
                    $this->limitGuard->assertAllows($resolved['contract']['limits'], (string) $routeLimit['key'], $roles, $current, (int) $routeLimit['cost']);
                    return $invoke();
                });
            } catch (ModuleHttpException $exception) {
                throw $exception;
            } catch (\Throwable $exception) {
                throw new ModuleHttpException('Module limit usage is unavailable.', 503, 'MODULE_LIMIT_USAGE_UNAVAILABLE');
            }
        } else {
            $result = $invoke();
        }
        return ['status' => $httpMethod === 'POST' ? 201 : 200, 'data' => $result];
    }
}

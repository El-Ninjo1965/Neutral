<?php
declare(strict_types=1);

namespace Neutral\Core;

final class ModuleLimitGuard
{
    /**
     * @param list<array<string,mixed>> $limits
     * @param list<string> $roles
     */
    public function effectiveLimit(array $limits, string $key, array $roles): ?int
    {
        $definition = null;
        foreach ($limits as $candidate) {
            if (is_array($candidate) && (string) ($candidate['key'] ?? '') === $key) {
                $definition = $candidate;
                break;
            }
        }
        if (!is_array($definition) || !is_int($definition['default'] ?? null) || $definition['default'] < 0) {
            throw new ModuleHttpException('Module limit is unavailable.', 503, 'MODULE_LIMIT_UNAVAILABLE');
        }
        $roleLimits = is_array($definition['roles'] ?? null) ? $definition['roles'] : [];
        $effective = (int) $definition['default'];
        foreach ($roles as $role) {
            $roleKey = strtolower(trim((string) $role));
            if (!array_key_exists($roleKey, $roleLimits)) {
                continue;
            }
            $value = $roleLimits[$roleKey];
            if ($value === null) {
                return null;
            }
            if (!is_int($value) || $value < 0) {
                throw new ModuleHttpException('Module limit is unavailable.', 503, 'MODULE_LIMIT_UNAVAILABLE');
            }
            $effective = max($effective, $value);
        }
        return $effective;
    }

    /**
     * @param list<array<string,mixed>> $limits
     * @param list<string> $roles
     */
    public function assertAllows(array $limits, string $key, array $roles, int $current, int $cost): void
    {
        if ($current < 0 || $cost < 1) {
            throw new ModuleHttpException('Module usage could not be validated.', 503, 'MODULE_LIMIT_USAGE_INVALID');
        }
        $maximum = $this->effectiveLimit($limits, $key, $roles);
        if ($maximum !== null && ($current > $maximum || $cost > $maximum - $current)) {
            throw new ModuleHttpException('Module limit exceeded.', 409, 'MODULE_LIMIT_EXCEEDED');
        }
    }
}

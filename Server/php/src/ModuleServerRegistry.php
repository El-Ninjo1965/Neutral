<?php
declare(strict_types=1);

namespace Neutral\Core;

final class ModuleServerRegistry
{
    private string $projectRoot;
    private ModuleContract $contract;
    /** @var array<string,mixed> */
    private array $serviceContext;

    /** @param array<string,mixed> $serviceContext */
    public function __construct(string $projectRoot, ModuleContract $contract, array $serviceContext = [])
    {
        $this->projectRoot = rtrim($projectRoot, "/\\");
        $this->contract = $contract;
        $this->serviceContext = $serviceContext;
    }

    /**
     * @param array<string,mixed> $module
     * @return array{contract:array<string,mixed>,serviceFactories:array<string,mixed>,migrations:list<array<string,mixed>>,uninstall:array<string,mixed>}
     */
    public function resolve(array $module): array
    {
        return $this->load($module, true);
    }

    /**
     * @param array<string,mixed> $module
     * @return array{contract:array<string,mixed>,serviceFactories:array<string,mixed>,migrations:list<array<string,mixed>>,uninstall:array<string,mixed>}
     */
    public function resolveForLifecycle(array $module): array
    {
        return $this->load($module, false);
    }

    /** @param array<string,mixed> $module @return array<string,mixed> */
    public function contractForRequest(array $module): array
    {
        return $this->validatedContract($module, true);
    }

    /**
     * @param array<string,mixed> $module
     * @return array{contract:array<string,mixed>,serviceFactories:array<string,mixed>,migrations:list<array<string,mixed>>,uninstall:array<string,mixed>}
     */
    private function load(array $module, bool $requireActive): array
    {
        $contract = $this->validatedContract($module, $requireActive);

        $moduleId = (string) $contract['id'];
        $moduleRoot = realpath($this->projectRoot . '/Server/php/modules/' . $moduleId);
        $entryPath = realpath($this->projectRoot . '/' . (string) $contract['server']['entry']);
        if ($moduleRoot === false || $entryPath === false || !is_file($entryPath)) {
            throw new \RuntimeException('Module server entry is unavailable.');
        }
        $normalizedRoot = rtrim(str_replace('\\', '/', $moduleRoot), '/') . '/';
        $normalizedEntry = str_replace('\\', '/', $entryPath);
        if (!str_starts_with($normalizedEntry, $normalizedRoot)) {
            throw new \RuntimeException('Module server entry escapes its directory.');
        }

        $definition = require $entryPath;
        if (!is_array($definition) || (string) ($definition['moduleId'] ?? '') !== $moduleId) {
            throw new \RuntimeException('Invalid module server definition.');
        }
        $provided = is_array($definition['services'] ?? null) ? $definition['services'] : [];
        $serviceFactories = [];
        foreach ($contract['server']['services'] as $serviceName) {
            if (!array_key_exists($serviceName, $provided)) {
                throw new \RuntimeException('Declared module service is unavailable.');
            }
            $factory = $provided[$serviceName];
            if (!is_callable($factory) && !is_object($factory)) {
                throw new \RuntimeException('Declared module service factory is invalid.');
            }
            $serviceFactories[$serviceName] = $factory;
        }

        return [
            'contract' => $contract,
            'serviceFactories' => $serviceFactories,
            'migrations' => is_array($definition['migrations'] ?? null) ? array_values($definition['migrations']) : [],
            'uninstall' => is_array($definition['uninstall'] ?? null) ? $definition['uninstall'] : [],
        ];
    }

    /** @param array<string,mixed> $module @return array<string,mixed> */
    private function validatedContract(array $module, bool $requireActive): array
    {
        if (!(bool) ($module['registered'] ?? false) || ($requireActive && !(bool) ($module['active'] ?? false))) {
            throw new \RuntimeException('Module is not active.');
        }
        $manifest = is_array($module['manifest'] ?? null) ? $module['manifest'] : [];
        $contract = $this->contract->normalize($manifest);
        $this->contract->assertCompatible($contract);
        if ((string) ($module['id'] ?? '') !== (string) $contract['id']) {
            throw new \RuntimeException('Module identity mismatch.');
        }
        return $contract;
    }

    /** @param array<string,mixed> $resolved */
    public function instantiateService(array $resolved, string $serviceName): object
    {
        $factories = is_array($resolved['serviceFactories'] ?? null) ? $resolved['serviceFactories'] : [];
        $service = $factories[$serviceName] ?? null;
        if (is_callable($service)) {
            $service = $service($this->serviceContext);
        }
        if (!is_object($service)) {
            throw new \RuntimeException('Module service factory returned an invalid service.');
        }
        return $service;
    }

    /** @return mixed */
    public function withLimitLock(string $moduleId, string $limitKey, callable $callback)
    {
        $database = $this->serviceContext['database'] ?? null;
        if (!$database instanceof Database) {
            throw new \RuntimeException('Module limit locking is unavailable.');
        }
        $pdo = $database->connect();
        $lockName = 'neutral_limit_' . substr(hash('sha256', $moduleId . ':' . $limitKey), 0, 32);
        $lock = $pdo->prepare('SELECT GET_LOCK(:lock_name, 10)');
        $lock->execute([':lock_name' => $lockName]);
        if ((int) $lock->fetchColumn() !== 1) {
            throw new \RuntimeException('Could not acquire module limit lock.');
        }
        try {
            return $callback();
        } finally {
            $release = $pdo->prepare('SELECT RELEASE_LOCK(:lock_name)');
            $release->execute([':lock_name' => $lockName]);
        }
    }
}

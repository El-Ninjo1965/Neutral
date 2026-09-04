<?php
declare(strict_types=1);

namespace Neutral\Core;

use PDO;

final class Phase7ModuleRuntime
{
    private Database $database;
    private string $projectRoot;
    private ModuleServerRegistry $serverRegistry;
    private ModuleMigrationRunner $migrationRunner;
    private ModuleContract $moduleContract;

    public function __construct(Database $database, string $projectRoot)
    {
        $this->database = $database;
        $this->projectRoot = rtrim($projectRoot, "/\\");
        $this->moduleContract = new ModuleContract();
        $this->serverRegistry = new ModuleServerRegistry(
            $this->projectRoot,
            $this->moduleContract,
            ['database' => $database]
        );
        $this->migrationRunner = new ModuleMigrationRunner($database);
    }

    /**
     * @return list<array<string,mixed>>
     */
    public function discover(): array
    {
        $discovered = [];
        foreach ($this->readModuleManifests() as $manifest) {
            $moduleId = strtolower(trim((string) ($manifest['id'] ?? '')));
            if ($moduleId === '' || strtolower((string) ($manifest['type'] ?? 'module')) !== 'module') {
                continue;
            }
            if ($moduleId === 'neutral') {
                continue;
            }
            $discovered[$moduleId] = $this->normalizeModuleManifest($manifest, true);
        }

        return array_values($discovered);
    }

    /**
     * @return list<array<string,mixed>>
     */
    public function listForAdmin(): array
    {
        $discovered = [];
        foreach ($this->discover() as $module) {
            $discovered[(string) $module['id']] = $module;
        }
        $registered = $this->fetchRegisteredModules();

        $modules = [];
        foreach ($discovered as $moduleId => $module) {
            $record = $registered[$moduleId] ?? null;
            $modules[] = $this->mergeModuleState($module, $record);
            unset($registered[$moduleId]);
        }

        foreach ($registered as $record) {
            if (!(bool) ($record['isPresent'] ?? false)) {
                continue;
            }
            $modules[] = $this->mergeModuleState($this->normalizeStoredModule($record), $record);
        }

        usort($modules, static function (array $a, array $b): int {
            return strcmp((string) $a['id'], (string) $b['id']);
        });

        return $modules;
    }

    /**
     * @param array<string,mixed>|null $identity
     * @return list<array<string,mixed>>
     */
    public function listForClient(?array $identity = null): array
    {
        $modules = array_values(array_filter(
            $this->listForAdmin(),
            fn (array $module): bool => $this->shouldExposeToClient($module, $identity)
        ));

        return array_map(function (array $module) use ($identity): array {
            $manifest = is_array($module['manifest'] ?? null) ? $module['manifest'] : [];
            $clientAccess = $this->resolveClientAccess($module, $identity);

            return [
                'id' => (string) ($module['id'] ?? ''),
                'name' => (string) ($module['name'] ?? ''),
                'displayName' => (string) ($module['displayName'] ?? ($module['name'] ?? '')),
                'version' => (string) ($module['version'] ?? ''),
                'description' => (string) ($module['description'] ?? ''),
                'type' => (string) ($module['type'] ?? 'module'),
                'entry' => $module['entry'] ?? null,
                'globalName' => $module['globalName'] ?? null,
                'capabilities' => is_array($module['capabilities'] ?? null) ? $module['capabilities'] : [],
                'dependencies' => is_array($module['dependencies'] ?? null) ? $module['dependencies'] : [],
                'access' => $this->sanitizeClientAccessDefinition($module),
                'standalone' => is_array($module['standalone'] ?? null) ? $module['standalone'] : null,
                'modulePath' => $module['modulePath'] ?? null,
                'discovered' => (bool) ($module['discovered'] ?? false),
                'registered' => (bool) ($module['registered'] ?? false),
                'status' => (string) ($module['status'] ?? 'discovered'),
                'lifecycleState' => (string) ($module['lifecycleState'] ?? 'DISCOVERED'),
                'active' => (bool) ($module['active'] ?? false),
                'enabled' => (bool) ($module['enabled'] ?? false),
                'clientAccess' => $clientAccess,
                'public' => isset($module['public']) ? (bool) $module['public'] : ((bool) ($manifest['public'] ?? false)),
                'isPublic' => isset($module['isPublic']) ? (bool) $module['isPublic'] : ((bool) ($manifest['isPublic'] ?? false)),
                'loginRequired' => isset($module['loginRequired']) ? (bool) $module['loginRequired'] : ((bool) ($manifest['loginRequired'] ?? false)),
                'requiresLogin' => isset($module['requiresLogin']) ? (bool) ($module['requiresLogin']) : ((bool) ($manifest['requiresLogin'] ?? false)),
            ];
        }, $modules);
    }

    /**
     * @return array<string,mixed>|null
     */
    public function getForAdmin(string $moduleId): ?array
    {
        $normalizedId = $this->normalizeModuleId($moduleId);
        $indexed = [];
        foreach ($this->listForAdmin() as $module) {
            $indexed[(string) $module['id']] = $module;
        }
        return $indexed[$normalizedId] ?? null;
    }

    /**
     * @return array<string,mixed>
     */
    public function install(string $moduleId, ?int $actorUserId = null): array
    {
        $discovered = $this->findDiscoveredModule($moduleId);
        if ($discovered === null) {
            throw new \RuntimeException('Module not discovered.');
        }

        $pdo = null;
        try {
            $pdo = $this->database->connect();
            $pdo->beginTransaction();
            $existing = $this->fetchRegisteredModules($pdo);
            $existingRecord = $existing[(string) $discovered['id']] ?? null;
            if ($existingRecord !== null) {
                if ((bool) ($existingRecord['isPresent'] ?? false)) {
                    throw new \RuntimeException('Module is already registered; use update.');
                }
                $installed = trim((string) ($existingRecord['installedVersion'] ?? ''));
                $this->assertNoModuleDowngrade((string) $discovered['version'], $installed !== '' ? $installed : (string) ($existingRecord['version'] ?? ''));
            }

            $moduleDbId = $this->upsertModuleRecord($pdo, $discovered);

            if ($existingRecord === null) {
                $this->insertInitialModuleState($pdo, $moduleDbId, (string) $discovered['version'], $actorUserId);
            } else {
                $this->ensureModuleStateExists($pdo, $moduleDbId, (string) $discovered['version'], $actorUserId);
            }

            $this->syncModulePermissions($pdo, $discovered, $existingRecord === null || !(bool) ($existingRecord['isPresent'] ?? false));

            $pdo->commit();
        } catch (\Throwable $exception) {
            if ($pdo instanceof PDO && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $exception;
        }

        $module = $this->getForAdmin((string) $discovered['id']);
        if ($module === null) {
            throw new \RuntimeException('Installed module could not be loaded.');
        }
        $definition = $this->serverRegistry->resolveForLifecycle($module);
        $this->migrationRunner->migrate($module, $definition['migrations']);
        $module = $this->getForAdmin((string) $discovered['id']);
        if ($module === null) {
            throw new \RuntimeException('Installed module could not be loaded after migration.');
        }
        return $module;
    }

    /**
     * @return array<string,mixed>
     */
    public function activate(string $moduleId, ?int $actorUserId = null): array
    {
        $module = $this->getForAdmin($moduleId);
        if ($module === null || !(bool) ($module['registered'] ?? false)) {
            throw new \RuntimeException('Module not registered.');
        }
        $installed = trim((string) ($module['installedVersion'] ?? ''));
        if ($installed === '') {
            throw new \RuntimeException('Module installed version is unavailable.');
        }
        $this->assertNoModuleDowngrade((string) ($module['version'] ?? ''), $installed);
        if (version_compare((string) ($module['version'] ?? ''), $installed, '!=')) {
            throw new \RuntimeException('Module update is required before activation.');
        }
        $definition = $this->serverRegistry->resolveForLifecycle($module);
        $this->migrationRunner->migrate($module, $definition['migrations']);
        return $this->changeState($moduleId, 'active', 1, $actorUserId);
    }

    /**
     * @return array<string,mixed>
     */
    public function deactivate(string $moduleId, ?int $actorUserId = null): array
    {
        return $this->changeState($moduleId, 'inactive', 0, $actorUserId);
    }

    /**
     * @return array<string,mixed>
     */
    public function update(string $moduleId, ?int $actorUserId = null): array
    {
        $normalizedId = $this->normalizeModuleId($moduleId);
        $current = $this->getForAdmin($normalizedId);
        if ($current === null || !(bool) ($current['registered'] ?? false)) {
            throw new \RuntimeException('Module not registered.');
        }
        if ((bool) ($current['active'] ?? false)) {
            throw new \RuntimeException('Module must be inactive before update.');
        }

        $discovered = $this->findDiscoveredModule($normalizedId);
        if ($discovered === null) {
            throw new \RuntimeException('Module not discovered.');
        }
        $installedVersion = trim((string) ($current['installedVersion'] ?? ''));
        if ($installedVersion === '') {
            throw new \RuntimeException('Module installed version is unavailable.');
        }
        $this->assertNoModuleDowngrade((string) $discovered['version'], $installedVersion);

        $candidate = array_replace($discovered, [
            'databaseId' => (int) ($current['databaseId'] ?? 0),
            'registered' => true,
            'active' => false,
            'enabled' => false,
            'installedVersion' => $installedVersion,
        ]);
        $definition = $this->serverRegistry->resolveForLifecycle($candidate);
        $migrationResult = $this->migrationRunner->migrate($candidate, $definition['migrations']);

        $pdo = null;
        try {
            $pdo = $this->database->connect();
            $pdo->beginTransaction();
            $moduleDbId = $this->upsertModuleRecord($pdo, $discovered);
            $this->syncModulePermissions($pdo, $discovered, false, true);
            $state = $pdo->prepare('
                UPDATE module_state
                SET status = :status,
                    is_enabled = 0,
                    installed_version = :installed_version,
                    last_error = NULL,
                    changed_by = :changed_by,
                    changed_at = CURRENT_TIMESTAMP
                WHERE module_id = :module_id
            ');
            $state->execute([
                ':status' => 'inactive',
                ':installed_version' => (string) $discovered['version'],
                ':changed_by' => $actorUserId,
                ':module_id' => $moduleDbId,
            ]);
            $pdo->commit();
        } catch (\Throwable $exception) {
            if ($pdo instanceof PDO && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $this->migrationRunner->compensate($candidate, $definition['migrations'], $migrationResult['applied'], $installedVersion);
            throw $exception;
        }

        $updated = $this->getForAdmin($normalizedId);
        if ($updated === null) {
            throw new \RuntimeException('Updated module could not be loaded.');
        }
        return $updated;
    }

    /**
     * @return array<string,mixed>
     */
    public function uninstall(string $moduleId, ?int $actorUserId = null): array
    {
        $normalizedId = $this->normalizeModuleId($moduleId);
        $module = $this->getForAdmin($normalizedId);
        if ($module === null || !(bool) ($module['registered'] ?? false)) {
            throw new \RuntimeException('Module not registered.');
        }
        if ((bool) ($module['active'] ?? false)) {
            throw new \RuntimeException('Module must be inactive before uninstall.');
        }
        $definition = $this->serverRegistry->resolveForLifecycle($module);
        $dataPolicy = (string) ($definition['contract']['uninstall']['dataPolicy'] ?? 'retain');
        if ($dataPolicy === 'destroy') {
            $this->assertDestroyOwnership($definition['contract']);
            $tables = array_map(
                static fn (array $table): string => (string) ($table['name'] ?? ''),
                $definition['contract']['database']['tables']
            );
            ModuleMigrationRunner::assertOwnedRollback($normalizedId, $tables, $definition['migrations']);
            $this->migrationRunner->rollback($module, $definition['migrations']);
        }

        $pdo = $this->database->connect();
        $pdo->beginTransaction();

        try {
            $registered = $this->fetchRegisteredModules($pdo);
            $record = $registered[$normalizedId] ?? null;
            if ($record === null) {
                throw new \RuntimeException('Module not registered.');
            }
            $this->removeModuleSettings($pdo, $normalizedId, $actorUserId);
            $this->deleteModulePermissions($pdo, $normalizedId);

            if ($dataPolicy === 'destroy') {
                $statement = $pdo->prepare('DELETE FROM modules WHERE id = :id');
                $statement->execute([':id' => (int) ($record['dbId'] ?? 0)]);
            } else {
                $statement = $pdo->prepare('UPDATE modules SET is_present = 0, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
                $statement->execute([':id' => (int) ($record['dbId'] ?? 0)]);
                $state = $pdo->prepare('UPDATE module_state SET status = :status, is_enabled = 0, changed_by = :changed_by, changed_at = CURRENT_TIMESTAMP WHERE module_id = :module_id');
                $state->execute([
                    ':status' => 'inactive',
                    ':changed_by' => $actorUserId,
                    ':module_id' => (int) ($record['dbId'] ?? 0),
                ]);
            }

            $pdo->commit();
        } catch (\Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $exception;
        }

        $discovered = $this->findDiscoveredModule($normalizedId);
        if ($discovered !== null) {
            return $this->mergeModuleState($discovered, null);
        }

        return [
            'id' => $normalizedId,
            'name' => $normalizedId,
            'displayName' => $normalizedId,
            'version' => '',
            'description' => '',
            'type' => 'module',
            'entry' => null,
            'globalName' => null,
            'permissions' => [],
            'permissionDefinitions' => [],
            'capabilities' => [],
            'dependencies' => [],
            'access' => [
                'visibilityPermissions' => [],
                'usagePermissions' => [],
                'managementPermissions' => [],
                'adminPermissions' => [],
            ],
            'standalone' => null,
            'database' => ['tables' => []],
            'modulePath' => null,
            'manifest' => [],
            'discovered' => false,
            'registered' => false,
            'status' => 'uninstalled',
            'lifecycleState' => 'UNINSTALLED',
            'active' => false,
            'enabled' => false,
        ];
    }

    /** @param array<string,mixed> $contract */
    private function assertDestroyOwnership(array $contract): void
    {
        $moduleId = $this->normalizeModuleId((string) ($contract['id'] ?? ''));
        $prefix = str_replace('-', '_', $moduleId) . '_';
        $database = is_array($contract['database'] ?? null) ? $contract['database'] : [];
        $tables = is_array($database['tables'] ?? null) ? $database['tables'] : [];
        foreach ($tables as $table) {
            if (!is_array($table)) {
                throw new \RuntimeException('Unsafe module table ownership declaration.');
            }
            $name = strtolower(trim((string) ($table['name'] ?? '')));
            if (
                ($table['destroyOnUninstall'] ?? false) !== true
                || preg_match('/^[a-z][a-z0-9_]{1,63}$/', $name) !== 1
                || !str_starts_with($name, $prefix)
            ) {
                throw new \RuntimeException('Unsafe module table ownership declaration.');
            }
        }
    }

    private function assertNoModuleDowngrade(string $candidateVersion, string $installedVersion): void
    {
        $installedVersion = trim($installedVersion);
        if ($installedVersion !== '' && version_compare($candidateVersion, $installedVersion, '<')) {
            throw new \RuntimeException('Module downgrade is not allowed.');
        }
    }

    /**
     * @return array<string,mixed>|null
     */
    private function findDiscoveredModule(string $moduleId): ?array
    {
        $normalizedId = $this->normalizeModuleId($moduleId);
        foreach ($this->discover() as $module) {
            if ((string) ($module['id'] ?? '') === $normalizedId) {
                return $module;
            }
        }
        return null;
    }

    private function normalizeModuleId(string $moduleId): string
    {
        $normalized = strtolower(trim($moduleId));
        if ($normalized === '') {
            throw new \RuntimeException('Module id is required.');
        }
        return $normalized;
    }

    /**
     * @return list<array<string,mixed>>
     */
    private function readModuleManifests(): array
    {
        $manifests = [];
        $modulesDir = $this->projectRoot . '/Web-App/app/modules';
        if (!is_dir($modulesDir)) {
            return [];
        }

        $entries = scandir($modulesDir);
        if ($entries === false) {
            return [];
        }

        foreach ($entries as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }
            $moduleDir = $modulesDir . '/' . $entry;
            if (!is_dir($moduleDir)) {
                continue;
            }

            $manifestPath = null;
            foreach (['module.json', 'manifest.json'] as $candidate) {
                $candidatePath = $moduleDir . '/' . $candidate;
                if (is_file($candidatePath) && is_readable($candidatePath)) {
                    $manifestPath = $candidatePath;
                    break;
                }
            }
            if ($manifestPath === null) {
                continue;
            }

            $raw = file_get_contents($manifestPath);
            if ($raw === false || trim($raw) === '') {
                continue;
            }
            $decoded = json_decode($raw, true);
            if (!is_array($decoded)) {
                continue;
            }

            $decoded['modulePath'] = 'Web-App/app/modules/' . $entry;
            $decoded['manifestPath'] = 'Web-App/app/modules/' . $entry . '/' . basename($manifestPath);
            $manifests[] = $decoded;
        }

        return $manifests;
    }

    /**
     * @param array<string,mixed> $manifest
     * @return array<string,mixed>
     */
    private function normalizeModuleManifest(array $manifest, bool $discovered): array
    {
        $manifest = $this->moduleContract->normalize($manifest);
        $moduleId = $this->normalizeModuleId((string) ($manifest['id'] ?? ''));
        $displayName = trim((string) ($manifest['displayName'] ?? ''));
        if ($displayName === '') {
            $displayName = trim((string) ($manifest['name'] ?? $moduleId));
        }

        $permissionDefinitions = $this->normalizePermissionDefinitions($manifest['permissions'] ?? [], $moduleId);

        return [
            'id' => $moduleId,
            'name' => trim((string) ($manifest['name'] ?? $moduleId)),
            'displayName' => $displayName,
            'version' => trim((string) ($manifest['version'] ?? '1.0.0')),
            'description' => (string) ($manifest['description'] ?? ''),
            'type' => trim((string) ($manifest['type'] ?? 'module')),
            'entry' => isset($manifest['entry']) ? (string) $manifest['entry'] : null,
            'globalName' => isset($manifest['globalName']) ? (string) $manifest['globalName'] : null,
            'permissions' => array_map(static fn (array $definition): string => (string) $definition['key'], $permissionDefinitions),
            'permissionDefinitions' => $permissionDefinitions,
            'capabilities' => is_array($manifest['capabilities'] ?? null) ? array_values(array_filter(array_map('strval', $manifest['capabilities']))) : [],
            'dependencies' => is_array($manifest['dependencies'] ?? null) ? array_values(array_filter(array_map('strval', $manifest['dependencies']))) : [],
            'compatibility' => $manifest['compatibility'],
            'server' => $manifest['server'],
            'limits' => $manifest['limits'],
            'uninstall' => $manifest['uninstall'],
            'access' => $this->normalizeAccess($manifest['access'] ?? null, $permissionDefinitions),
            'standalone' => $this->normalizeStandalone($manifest['standalone'] ?? null),
            'database' => $this->normalizeDatabase($manifest['database'] ?? null),
            'modulePath' => isset($manifest['modulePath']) ? (string) $manifest['modulePath'] : null,
            'manifest' => $manifest,
            'public' => isset($manifest['public']) ? (bool) $manifest['public'] : null,
            'isPublic' => isset($manifest['isPublic']) ? (bool) $manifest['isPublic'] : null,
            'loginRequired' => isset($manifest['loginRequired']) ? (bool) $manifest['loginRequired'] : null,
            'requiresLogin' => isset($manifest['requiresLogin']) ? (bool) $manifest['requiresLogin'] : null,
            'discovered' => $discovered,
        ];
    }

    /**
     * @param array<string,mixed> $record
     * @return array<string,mixed>
     */
    private function normalizeStoredModule(array $record): array
    {
        $manifest = is_array($record['manifest'] ?? null) ? $record['manifest'] : [];
        return $this->normalizeModuleManifest(array_replace($manifest, [
            'id' => (string) ($record['id'] ?? ''),
            'name' => (string) ($record['name'] ?? ($record['id'] ?? '')),
            'version' => (string) ($record['version'] ?? '1.0.0'),
            'modulePath' => (string) ($record['filesystemPath'] ?? ''),
        ]), false);
    }

    /**
     * @param mixed $permissions
     * @return list<array{key:string,description:string,scope:string,defaultRoles:list<string>}>
     */
    private function normalizePermissionDefinitions($permissions, string $moduleId): array
    {
        if (!is_array($permissions)) {
            return [];
        }

        $definitions = [];
        foreach ($permissions as $index => $permission) {
            if (is_string($permission)) {
                $key = trim($permission);
                if ($key === '') {
                    continue;
                }
                $definitions[$key] = [
                    'key' => $key,
                    'description' => '',
                    'scope' => $this->modulePermissionScope($moduleId),
                    'defaultRoles' => [],
                ];
                continue;
            }

            if (!is_array($permission)) {
                continue;
            }

            $key = trim((string) ($permission['key'] ?? $permission['permission'] ?? ''));
            if ($key === '') {
                continue;
            }

            $defaultRoles = [];
            if (is_array($permission['defaultRoles'] ?? null)) {
                foreach ($permission['defaultRoles'] as $role) {
                    $value = strtolower(trim((string) $role));
                    if ($value !== '') {
                        $defaultRoles[] = $value;
                    }
                }
            }

            $definitions[$key] = [
                'key' => $key,
                'description' => (string) ($permission['description'] ?? ''),
                'scope' => $this->modulePermissionScope($moduleId),
                'defaultRoles' => array_values(array_unique($defaultRoles)),
            ];
        }

        return array_values($definitions);
    }

    /**
     * @param mixed $access
     * @param list<array{key:string,description:string,scope:string,defaultRoles:list<string>}> $permissionDefinitions
     * @return array<string,list<string>>
     */
    private function normalizeAccess($access, array $permissionDefinitions): array
    {
        $keys = array_map(static fn (array $definition): string => (string) $definition['key'], $permissionDefinitions);
        $source = is_array($access) ? $access : [];

        $fallback = static function (string $suffix) use ($keys): array {
            return array_values(array_filter($keys, static fn (string $key): bool => str_ends_with($key, $suffix)));
        };

        $normalizeList = static function ($value): array {
            if (!is_array($value)) {
                return [];
            }
            $normalized = [];
            foreach ($value as $entry) {
                $item = trim((string) $entry);
                if ($item !== '') {
                    $normalized[] = $item;
                }
            }
            return array_values(array_unique($normalized));
        };

        $visibility = $normalizeList($source['visibilityPermissions'] ?? null);
        $usage = $normalizeList($source['usagePermissions'] ?? null);
        $management = $normalizeList($source['managementPermissions'] ?? null);
        $admin = $normalizeList($source['adminPermissions'] ?? null);

        return [
            'visibilityPermissions' => $visibility !== [] ? $visibility : $fallback('.view'),
            'usagePermissions' => $usage !== [] ? $usage : $fallback('.use'),
            'managementPermissions' => $management !== [] ? $management : $fallback('.manage'),
            'adminPermissions' => $admin !== [] ? $admin : $fallback('.admin'),
        ];
    }

    /**
     * @param mixed $standalone
     * @return array<string,mixed>|null
     */
    private function normalizeStandalone($standalone): ?array
    {
        if (!is_array($standalone)) {
            return null;
        }

        $entry = trim((string) ($standalone['entry'] ?? ''));
        if ($entry === '') {
            return null;
        }

        $requires = is_array($standalone['requires'] ?? null) ? $standalone['requires'] : [];

        return [
            'entry' => $entry,
            'label' => trim((string) ($standalone['label'] ?? '')) !== '' ? trim((string) $standalone['label']) : 'Standalone module test',
            'description' => (string) ($standalone['description'] ?? ''),
            'requires' => [
                'server' => (($requires['server'] ?? false) === true),
                'database' => (($requires['database'] ?? false) === true),
                'auth' => (($requires['auth'] ?? false) === true),
            ],
        ];
    }

    /**
     * @param mixed $database
     * @return array{tables:list<array{name:string,destroyOnUninstall:bool,description:string}>,migrations:list<array<string,mixed>>}
     */
    private function normalizeDatabase($database): array
    {
        $source = is_array($database) ? $database : [];
        $tables = [];
        foreach (($source['tables'] ?? []) as $table) {
            if (is_string($table)) {
                $name = trim($table);
                if ($name !== '') {
                    $tables[] = [
                        'name' => $name,
                        'destroyOnUninstall' => false,
                        'description' => '',
                    ];
                }
                continue;
            }

            if (!is_array($table)) {
                continue;
            }

            $name = trim((string) ($table['name'] ?? ''));
            if ($name === '') {
                continue;
            }

            $tables[] = [
                'name' => $name,
                'destroyOnUninstall' => (($table['destroyOnUninstall'] ?? false) === true),
                'description' => (string) ($table['description'] ?? ''),
            ];
        }

        $migrations = is_array($source['migrations'] ?? null) ? array_values($source['migrations']) : [];
        return ['tables' => $tables, 'migrations' => $migrations];
    }

    /**
     * @param PDO|null $pdo
     * @return array<string,array<string,mixed>>
     */
    private function fetchRegisteredModules(?PDO $pdo = null): array
    {
        $connection = $pdo ?? $this->database->connect();
        $statement = $connection->query('
            SELECT
                m.id,
                m.module_key,
                m.name,
                m.version,
                m.manifest_json,
                m.filesystem_path,
                m.is_present,
                m.created_at,
                m.updated_at,
                s.status,
                s.is_enabled,
                s.installed_version,
                s.last_error,
                s.changed_by,
                s.changed_at
            FROM modules m
            LEFT JOIN module_state s ON s.module_id = m.id
        ');
        if ($statement === false) {
            throw new \RuntimeException('Could not load modules from database.');
        }

        $rows = [];
        foreach ($statement->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $moduleKey = strtolower(trim((string) ($row['module_key'] ?? '')));
            if ($moduleKey === '') {
                continue;
            }

            $manifestRaw = (string) ($row['manifest_json'] ?? '');
            $manifest = json_decode($manifestRaw, true);
            if (!is_array($manifest)) {
                $manifest = [];
            }

            $rows[$moduleKey] = [
                'dbId' => (int) ($row['id'] ?? 0),
                'id' => $moduleKey,
                'name' => (string) ($row['name'] ?? $moduleKey),
                'version' => (string) ($row['version'] ?? ''),
                'manifest' => $manifest,
                'filesystemPath' => (string) ($row['filesystem_path'] ?? ''),
                'isPresent' => ((int) ($row['is_present'] ?? 0)) === 1,
                'createdAt' => (string) ($row['created_at'] ?? ''),
                'updatedAt' => (string) ($row['updated_at'] ?? ''),
                'status' => $this->normalizeStateStatus((string) ($row['status'] ?? 'inactive')),
                'isEnabled' => ((int) ($row['is_enabled'] ?? 0)) === 1,
                'installedVersion' => (string) ($row['installed_version'] ?? ''),
                'lastError' => (string) ($row['last_error'] ?? ''),
                'changedBy' => isset($row['changed_by']) ? (int) $row['changed_by'] : null,
                'changedAt' => (string) ($row['changed_at'] ?? ''),
                'registered' => true,
            ];
        }
        return $rows;
    }

    /**
     * @param array<string,mixed> $module
     * @param array<string,mixed>|null $record
     * @return array<string,mixed>
     */
    private function mergeModuleState(array $module, ?array $record): array
    {
        $isRegistered = $record !== null && (bool) ($record['isPresent'] ?? true);
        $status = $isRegistered ? $this->normalizeStateStatus((string) ($record['status'] ?? 'inactive')) : 'discovered';
        $isActive = $isRegistered && ((bool) ($record['isEnabled'] ?? false) || $status === 'active');
        $lifecycleState = $status === 'active'
            ? 'ACTIVE'
            : ($isRegistered ? 'INACTIVE' : 'DISCOVERED');

        return [
            'id' => (string) ($module['id'] ?? ''),
            'name' => (string) ($module['name'] ?? ''),
            'displayName' => (string) ($module['displayName'] ?? ($module['name'] ?? '')),
            'version' => (string) ($module['version'] ?? ''),
            'description' => (string) ($module['description'] ?? ''),
            'type' => (string) ($module['type'] ?? 'module'),
            'entry' => $module['entry'] ?? null,
            'globalName' => $module['globalName'] ?? null,
            'permissions' => is_array($module['permissions'] ?? null) ? $module['permissions'] : [],
            'permissionDefinitions' => is_array($module['permissionDefinitions'] ?? null) ? $module['permissionDefinitions'] : [],
            'capabilities' => is_array($module['capabilities'] ?? null) ? $module['capabilities'] : [],
            'dependencies' => is_array($module['dependencies'] ?? null) ? $module['dependencies'] : [],
            'compatibility' => is_array($module['compatibility'] ?? null) ? $module['compatibility'] : [],
            'server' => is_array($module['server'] ?? null) ? $module['server'] : [],
            'limits' => is_array($module['limits'] ?? null) ? $module['limits'] : [],
            'uninstall' => is_array($module['uninstall'] ?? null) ? $module['uninstall'] : ['dataPolicy' => 'retain'],
            'access' => is_array($module['access'] ?? null) ? $module['access'] : [],
            'standalone' => is_array($module['standalone'] ?? null) ? $module['standalone'] : null,
            'database' => is_array($module['database'] ?? null) ? $module['database'] : ['tables' => []],
            'modulePath' => $module['modulePath'] ?? ($record['filesystemPath'] ?? null),
            'manifest' => is_array($module['manifest'] ?? null) ? $module['manifest'] : ($record['manifest'] ?? []),
            'public' => $module['public'] ?? null,
            'isPublic' => $module['isPublic'] ?? null,
            'loginRequired' => $module['loginRequired'] ?? null,
            'requiresLogin' => $module['requiresLogin'] ?? null,
            'discovered' => (bool) ($module['discovered'] ?? false),
            'registered' => $isRegistered,
            'status' => $status,
            'lifecycleState' => $lifecycleState,
            'active' => $isActive,
            'enabled' => $isActive,
            'installedVersion' => $record['installedVersion'] ?? null,
            'lastError' => $record['lastError'] ?? null,
            'changedBy' => $record['changedBy'] ?? null,
            'changedAt' => $record['changedAt'] ?? null,
            'createdAt' => $record['createdAt'] ?? null,
            'updatedAt' => $record['updatedAt'] ?? null,
            'databaseId' => $record['dbId'] ?? null,
        ];
    }

    /**
     * @param array<string,mixed> $module
     */
    private function upsertModuleRecord(PDO $pdo, array $module): int
    {
        $manifestJson = json_encode($module['manifest'] ?? [], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($manifestJson === false) {
            throw new \RuntimeException('Could not encode module manifest.');
        }
        $statement = $pdo->prepare('
            INSERT INTO modules (module_key, name, version, manifest_json, filesystem_path, is_present, created_at, updated_at)
            VALUES (:module_key, :name, :version, :manifest_json, :filesystem_path, :is_present, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                version = VALUES(version),
                manifest_json = VALUES(manifest_json),
                filesystem_path = VALUES(filesystem_path),
                is_present = VALUES(is_present),
                updated_at = CURRENT_TIMESTAMP
        ');
        $statement->execute([
            ':module_key' => (string) $module['id'],
            ':name' => (string) $module['name'],
            ':version' => (string) $module['version'],
            ':manifest_json' => $manifestJson,
            ':filesystem_path' => (string) ($module['modulePath'] ?? ''),
            ':is_present' => 1,
        ]);

        $select = $pdo->prepare('SELECT id FROM modules WHERE module_key = :module_key LIMIT 1');
        $select->execute([':module_key' => (string) $module['id']]);
        $value = $select->fetchColumn();
        $moduleDbId = is_int($value) ? $value : (int) $value;
        if ($moduleDbId <= 0) {
            throw new \RuntimeException('Module row could not be resolved.');
        }
        return $moduleDbId;
    }

    private function insertInitialModuleState(PDO $pdo, int $moduleDbId, string $version, ?int $actorUserId): void
    {
        $statement = $pdo->prepare('
            INSERT INTO module_state (module_id, status, is_enabled, installed_version, last_error, changed_by, changed_at)
            VALUES (:module_id, :status, :is_enabled, :installed_version, NULL, :changed_by, CURRENT_TIMESTAMP)
        ');
        $statement->execute([
            ':module_id' => $moduleDbId,
            ':status' => 'inactive',
            ':is_enabled' => 0,
            ':installed_version' => $version,
            ':changed_by' => $actorUserId,
        ]);
    }

    private function ensureModuleStateExists(PDO $pdo, int $moduleDbId, string $version, ?int $actorUserId): void
    {
        $statement = $pdo->prepare('SELECT module_id FROM module_state WHERE module_id = :module_id LIMIT 1');
        $statement->execute([':module_id' => $moduleDbId]);
        $existing = $statement->fetchColumn();
        if ($existing !== false) {
            return;
        }
        $this->insertInitialModuleState($pdo, $moduleDbId, $version, $actorUserId);
    }

    /**
     * @return array<string,mixed>
     */
    private function changeState(string $moduleId, string $status, int $isEnabled, ?int $actorUserId): array
    {
        $normalizedId = $this->normalizeModuleId($moduleId);
        $pdo = $this->database->connect();
        $pdo->beginTransaction();

        try {
            $registered = $this->fetchRegisteredModules($pdo);
            $record = $registered[$normalizedId] ?? null;
            if ($record === null) {
                throw new \RuntimeException('Module not registered.');
            }

            $statement = $pdo->prepare('
                INSERT INTO module_state (module_id, status, is_enabled, installed_version, last_error, changed_by, changed_at)
                VALUES (:module_id, :status, :is_enabled, :installed_version, NULL, :changed_by, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE
                    status = VALUES(status),
                    is_enabled = VALUES(is_enabled),
                    last_error = NULL,
                    changed_by = VALUES(changed_by),
                    changed_at = CURRENT_TIMESTAMP
            ');
            $statement->execute([
                ':module_id' => (int) $record['dbId'],
                ':status' => $status,
                ':is_enabled' => $isEnabled,
                ':installed_version' => (string) ($record['installedVersion'] !== '' ? $record['installedVersion'] : $record['version']),
                ':changed_by' => $actorUserId,
            ]);

            $pdo->commit();
        } catch (\Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $exception;
        }

        $module = $this->getForAdmin($normalizedId);
        if ($module === null) {
            throw new \RuntimeException('Module state could not be resolved after update.');
        }
        return $module;
    }

    /**
     * @param array<string,mixed> $module
     */
    private function syncModulePermissions(PDO $pdo, array $module, bool $applyDefaultRoles, bool $pruneObsolete = false): void
    {
        $definitions = is_array($module['permissionDefinitions'] ?? null) ? $module['permissionDefinitions'] : [];
        if ($pruneObsolete) {
            $this->pruneObsoleteModulePermissions($pdo, (string) ($module['id'] ?? ''), $definitions);
        }
        if ($definitions === []) {
            return;
        }

        $insertPermission = $pdo->prepare('
            INSERT INTO permissions (permission_key, description, scope, created_at)
            VALUES (:permission_key, :description, :scope, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE
                description = VALUES(description),
                scope = VALUES(scope)
        ');

        foreach ($definitions as $definition) {
            if (!is_array($definition)) {
                continue;
            }
            $key = trim((string) ($definition['key'] ?? ''));
            if ($key === '') {
                continue;
            }
            $insertPermission->execute([
                ':permission_key' => $key,
                ':description' => (string) ($definition['description'] ?? ''),
                ':scope' => (string) ($definition['scope'] ?? $this->modulePermissionScope((string) ($module['id'] ?? ''))),
            ]);
        }

        if (!$applyDefaultRoles) {
            return;
        }

        $roleKeys = [];
        foreach ($definitions as $definition) {
            if (!is_array($definition)) {
                continue;
            }
            foreach (($definition['defaultRoles'] ?? []) as $role) {
                $roleKey = strtolower(trim((string) $role));
                if ($roleKey !== '') {
                    $roleKeys[] = $roleKey;
                }
            }
        }
        $roleKeys = array_values(array_unique($roleKeys));
        if ($roleKeys === []) {
            return;
        }

        $rolePlaceholders = implode(',', array_fill(0, count($roleKeys), '?'));
        $roleStatement = $pdo->prepare("SELECT id, role_key FROM roles WHERE role_key IN ($rolePlaceholders)");
        $roleStatement->execute($roleKeys);
        $roleRows = $roleStatement->fetchAll(PDO::FETCH_ASSOC);
        if (!is_array($roleRows) || $roleRows === []) {
            return;
        }

        $rolesByKey = [];
        foreach ($roleRows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $roleKey = strtolower(trim((string) ($row['role_key'] ?? '')));
            if ($roleKey === '') {
                continue;
            }
            $rolesByKey[$roleKey] = (int) ($row['id'] ?? 0);
        }

        $permissionKeys = array_map(static fn (array $definition): string => (string) $definition['key'], $definitions);
        $permissionPlaceholders = implode(',', array_fill(0, count($permissionKeys), '?'));
        $permissionStatement = $pdo->prepare("SELECT id, permission_key FROM permissions WHERE permission_key IN ($permissionPlaceholders)");
        $permissionStatement->execute($permissionKeys);
        $permissionRows = $permissionStatement->fetchAll(PDO::FETCH_ASSOC);
        $permissionIds = [];
        foreach ($permissionRows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $key = trim((string) ($row['permission_key'] ?? ''));
            if ($key === '') {
                continue;
            }
            $permissionIds[$key] = (int) ($row['id'] ?? 0);
        }

        $grantStatement = $pdo->prepare('
            INSERT INTO role_permissions (role_id, permission_id, granted_at)
            VALUES (:role_id, :permission_id, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE granted_at = VALUES(granted_at)
        ');

        foreach ($definitions as $definition) {
            if (!is_array($definition)) {
                continue;
            }
            $permissionKey = (string) ($definition['key'] ?? '');
            $permissionId = $permissionIds[$permissionKey] ?? 0;
            if ($permissionId <= 0) {
                continue;
            }
            foreach (($definition['defaultRoles'] ?? []) as $role) {
                $roleKey = strtolower(trim((string) $role));
                $roleId = $rolesByKey[$roleKey] ?? 0;
                if ($roleId <= 0) {
                    continue;
                }
                $grantStatement->execute([
                    ':role_id' => $roleId,
                    ':permission_id' => $permissionId,
                ]);
            }
        }
    }

    /** @param list<array<string,mixed>> $definitions */
    private function pruneObsoleteModulePermissions(PDO $pdo, string $moduleId, array $definitions): void
    {
        $keys = [];
        foreach ($definitions as $definition) {
            $key = is_array($definition) ? trim((string) ($definition['key'] ?? '')) : '';
            if ($key !== '') {
                $keys[] = $key;
            }
        }
        $scope = $this->modulePermissionScope($moduleId);
        if ($keys === []) {
            $statement = $pdo->prepare('DELETE FROM permissions WHERE scope = ?');
            $statement->execute([$scope]);
            return;
        }
        $placeholders = implode(',', array_fill(0, count($keys), '?'));
        $statement = $pdo->prepare("DELETE FROM permissions WHERE scope = ? AND permission_key NOT IN ($placeholders)");
        $statement->execute(array_merge([$scope], $keys));
    }

    private function deleteModulePermissions(PDO $pdo, string $moduleId): void
    {
        $statement = $pdo->prepare('DELETE FROM permissions WHERE scope = :scope');
        $statement->execute([':scope' => $this->modulePermissionScope($moduleId)]);
    }

    private function removeModuleSettings(PDO $pdo, string $moduleId, ?int $actorUserId): void
    {
        $statement = $pdo->prepare('SELECT setting_value_json FROM settings WHERE setting_key = :setting_key LIMIT 1');
        $statement->execute([':setting_key' => 'core.ui.settings']);
        $raw = $statement->fetchColumn();
        if (!is_string($raw) || trim($raw) === '') {
            return;
        }

        $settings = json_decode($raw, true);
        if (!is_array($settings)) {
            return;
        }

        $changed = $this->removeNestedPath($settings, ['moduleSettings', $moduleId]);
        if (!$changed) {
            return;
        }

        $json = json_encode($settings, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            throw new \RuntimeException('Could not encode module settings payload.');
        }

        $upsert = $pdo->prepare('
            INSERT INTO settings (setting_key, setting_value_json, updated_by, updated_at)
            VALUES (:setting_key, :setting_value_json, :updated_by, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE
                setting_value_json = VALUES(setting_value_json),
                updated_by = VALUES(updated_by),
                updated_at = CURRENT_TIMESTAMP
        ');
        $upsert->execute([
            ':setting_key' => 'core.ui.settings',
            ':setting_value_json' => $json,
            ':updated_by' => $actorUserId,
        ]);
    }

    /**
     * @param array<string,mixed> $settings
     * @param list<string> $segments
     */
    private function removeNestedPath(array &$settings, array $segments): bool
    {
        $segment = array_shift($segments);
        if ($segment === null || $segment === '') {
            return false;
        }
        if ($segments === []) {
            if (!array_key_exists($segment, $settings)) {
                return false;
            }
            unset($settings[$segment]);
            return true;
        }
        if (!isset($settings[$segment]) || !is_array($settings[$segment])) {
            return false;
        }
        $changed = $this->removeNestedPath($settings[$segment], $segments);
        if ($changed && $settings[$segment] === []) {
            unset($settings[$segment]);
        }
        return $changed;
    }

    /**
     * @param array<string,mixed> $module
     * @param array<string,mixed>|null $identity
     */
    private function shouldExposeToClient(array $module, ?array $identity): bool
    {
        $clientAccess = $this->resolveClientAccess($module, $identity);
        return $clientAccess['canView'];
    }

    /**
     * Resolves browser-only module visibility and use. This result never grants
     * permission to a server endpoint.
     *
     * @param array<string,mixed> $module
     * @param array<string,mixed>|null $identity
     * @return array{mode:string,canView:bool,canUse:bool}
     */
    private function resolveClientAccess(array $module, ?array $identity): array
    {
        $access = is_array($module['access'] ?? null) ? $module['access'] : [];
        $visibilityPermissions = is_array($access['visibilityPermissions'] ?? null) && $access['visibilityPermissions'] !== []
            ? array_values(array_unique(array_map('strval', $access['visibilityPermissions'])))
            : [];
        $usagePermissions = is_array($access['usagePermissions'] ?? null) && $access['usagePermissions'] !== []
            ? array_values(array_unique(array_map('strval', $access['usagePermissions'])))
            : [];
        $mode = (($identity['anonymous'] ?? false) === true) ? 'anonymous' : 'authenticated';
        $active = (($module['active'] ?? false) === true)
            || (($module['enabled'] ?? false) === true)
            || in_array(strtolower((string) ($module['status'] ?? '')), ['active', 'enabled'], true)
            || strtoupper((string) ($module['lifecycleState'] ?? '')) === 'ACTIVE';
        $permissions = is_array($identity['permissions'] ?? null) ? $identity['permissions'] : [];
        $hasPermission = static fn (string $permission): bool => in_array($permission, $permissions, true)
            || ($mode === 'authenticated' && in_array('admin.write', $permissions, true));
        $canView = $active
            && $visibilityPermissions !== []
            && count(array_filter($visibilityPermissions, $hasPermission)) > 0;
        $canUse = $canView
            && ($usagePermissions === [] || count(array_filter($usagePermissions, $hasPermission)) > 0);

        return [
            'mode' => $mode,
            'canView' => $canView,
            'canUse' => $canUse,
        ];
    }

    /**
     * Keeps only the permission metadata needed for local client visibility and
     * use. Management and administration definitions stay on admin endpoints.
     *
     * @param array<string,mixed> $module
     * @return array{visibilityPermissions:list<string>,usagePermissions:list<string>}
     */
    private function sanitizeClientAccessDefinition(array $module): array
    {
        $access = is_array($module['access'] ?? null) ? $module['access'] : [];
        $normalize = static function ($permissions): array {
            if (!is_array($permissions)) {
                return [];
            }

            return array_values(array_unique(array_filter(
                array_map(static fn ($permission): string => trim((string) $permission), $permissions),
                static fn (string $permission): bool => $permission !== ''
            )));
        };

        return [
            'visibilityPermissions' => $normalize($access['visibilityPermissions'] ?? []),
            'usagePermissions' => $normalize($access['usagePermissions'] ?? []),
        ];
    }

    private function modulePermissionScope(string $moduleId): string
    {
        return 'module:' . $this->normalizeModuleId($moduleId);
    }

    private function normalizeStateStatus(string $status): string
    {
        $normalized = strtolower(trim($status));
        if (in_array($normalized, ['active', 'enabled'], true)) {
            return 'active';
        }
        if (in_array($normalized, ['inactive', 'disabled', 'installed'], true)) {
            return 'inactive';
        }
        if (in_array($normalized, ['uninstalled'], true)) {
            return 'uninstalled';
        }
        if ($normalized === '' || $normalized === 'discovered' || $normalized === 'available') {
            return 'discovered';
        }
        return $normalized;
    }
}

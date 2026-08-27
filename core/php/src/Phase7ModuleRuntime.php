<?php
declare(strict_types=1);

namespace Neutral\Core;

use PDO;

final class Phase7ModuleRuntime
{
    private Database $database;
    private string $projectRoot;

    public function __construct(Database $database, string $projectRoot)
    {
        $this->database = $database;
        $this->projectRoot = rtrim($projectRoot, "/\\");
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
            $discovered[$moduleId] = $this->normalizeDiscoveredModule($manifest);
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

        foreach ($registered as $moduleId => $record) {
            $modules[] = $this->mergeModuleState([
                'id' => $moduleId,
                'name' => $record['name'],
                'displayName' => $record['name'],
                'version' => $record['version'],
                'description' => '',
                'type' => 'module',
                'entry' => null,
                'globalName' => null,
                'permissions' => [],
                'capabilities' => [],
                'dependencies' => [],
                'modulePath' => $record['filesystemPath'],
                'manifest' => $record['manifest'],
                'discovered' => false,
            ], $record);
        }

        usort($modules, static function (array $a, array $b): int {
            return strcmp((string) $a['id'], (string) $b['id']);
        });

        return $modules;
    }

    /**
     * @return list<array<string,mixed>>
     */
    public function listForClient(): array
    {
        return array_map(function (array $module): array {
            $manifest = is_array($module['manifest'] ?? null) ? $module['manifest'] : [];

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
                'capabilities' => is_array($module['capabilities'] ?? null) ? $module['capabilities'] : [],
                'dependencies' => is_array($module['dependencies'] ?? null) ? $module['dependencies'] : [],
                'modulePath' => $module['modulePath'] ?? null,
                'discovered' => (bool) ($module['discovered'] ?? false),
                'registered' => (bool) ($module['registered'] ?? false),
                'status' => (string) ($module['status'] ?? 'discovered'),
                'lifecycleState' => (string) ($module['lifecycleState'] ?? 'DISCOVERED'),
                'active' => (bool) ($module['active'] ?? false),
                'enabled' => (bool) ($module['enabled'] ?? false),
                'public' => isset($module['public']) ? (bool) $module['public'] : ((bool) ($manifest['public'] ?? false)),
                'isPublic' => isset($module['isPublic']) ? (bool) $module['isPublic'] : ((bool) ($manifest['isPublic'] ?? false)),
                'loginRequired' => isset($module['loginRequired']) ? (bool) $module['loginRequired'] : ((bool) ($manifest['loginRequired'] ?? false)),
                'requiresLogin' => isset($module['requiresLogin']) ? (bool) $module['requiresLogin'] : ((bool) ($manifest['requiresLogin'] ?? false)),
            ];
        }, $this->listForAdmin());
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

        $pdo = $this->database->connect();
        $pdo->beginTransaction();
        try {
            $existing = $this->fetchRegisteredModules($pdo);
            $existingRecord = $existing[(string) $discovered['id']] ?? null;

            $moduleDbId = $this->upsertModuleRecord($pdo, $discovered);

            if ($existingRecord === null) {
                $this->insertInitialModuleState($pdo, $moduleDbId, (string) $discovered['version'], $actorUserId);
            } else {
                $this->ensureModuleStateExists($pdo, $moduleDbId, (string) $discovered['version'], $actorUserId);
            }

            $pdo->commit();
        } catch (\Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $exception;
        }

        $module = $this->getForAdmin((string) $discovered['id']);
        if ($module === null) {
            throw new \RuntimeException('Installed module could not be loaded.');
        }
        return $module;
    }

    /**
     * @return array<string,mixed>
     */
    public function activate(string $moduleId, ?int $actorUserId = null): array
    {
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
        $modulesDir = $this->projectRoot . '/app/modules';
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

            $decoded['modulePath'] = 'app/modules/' . $entry;
            $decoded['manifestPath'] = 'app/modules/' . $entry . '/' . basename($manifestPath);
            $manifests[] = $decoded;
        }

        return $manifests;
    }

    /**
     * @param array<string,mixed> $manifest
     * @return array<string,mixed>
     */
    private function normalizeDiscoveredModule(array $manifest): array
    {
        $moduleId = $this->normalizeModuleId((string) ($manifest['id'] ?? ''));
        $displayName = trim((string) ($manifest['displayName'] ?? ''));
        if ($displayName === '') {
            $displayName = trim((string) ($manifest['name'] ?? $moduleId));
        }

        return [
            'id' => $moduleId,
            'name' => trim((string) ($manifest['name'] ?? $moduleId)),
            'displayName' => $displayName,
            'version' => trim((string) ($manifest['version'] ?? '1.0.0')),
            'description' => (string) ($manifest['description'] ?? ''),
            'type' => trim((string) ($manifest['type'] ?? 'module')),
            'entry' => isset($manifest['entry']) ? (string) $manifest['entry'] : null,
            'globalName' => isset($manifest['globalName']) ? (string) $manifest['globalName'] : null,
            'permissions' => is_array($manifest['permissions'] ?? null) ? array_values($manifest['permissions']) : [],
            'capabilities' => is_array($manifest['capabilities'] ?? null) ? array_values($manifest['capabilities']) : [],
            'dependencies' => is_array($manifest['dependencies'] ?? null) ? array_values($manifest['dependencies']) : [],
            'modulePath' => isset($manifest['modulePath']) ? (string) $manifest['modulePath'] : null,
            'manifest' => $manifest,
            'discovered' => true,
        ];
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
        $status = $record ? $this->normalizeStateStatus((string) ($record['status'] ?? 'inactive')) : 'discovered';
        $isActive = $record ? ((bool) ($record['isEnabled'] ?? false) || $status === 'active') : false;
        $lifecycleState = $status === 'active'
            ? 'ACTIVE'
            : ($record ? 'INACTIVE' : 'DISCOVERED');

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
            'capabilities' => is_array($module['capabilities'] ?? null) ? $module['capabilities'] : [],
            'dependencies' => is_array($module['dependencies'] ?? null) ? $module['dependencies'] : [],
            'modulePath' => $module['modulePath'] ?? ($record['filesystemPath'] ?? null),
            'manifest' => is_array($module['manifest'] ?? null) ? $module['manifest'] : ($record['manifest'] ?? []),
            'discovered' => (bool) ($module['discovered'] ?? false),
            'registered' => $record !== null,
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

    private function normalizeStateStatus(string $status): string
    {
        $normalized = strtolower(trim($status));
        if (in_array($normalized, ['active', 'enabled'], true)) {
            return 'active';
        }
        if (in_array($normalized, ['inactive', 'disabled', 'installed'], true)) {
            return 'inactive';
        }
        if ($normalized === '' || $normalized === 'discovered' || $normalized === 'available') {
            return 'discovered';
        }
        return $normalized;
    }
}

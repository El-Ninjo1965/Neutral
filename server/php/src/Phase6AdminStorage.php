<?php
declare(strict_types=1);

namespace Neutral\Core;

use PDO;

final class Phase6SettingsService
{
    private Database $database;
    private Phase4SettingsService $fallback;

    public function __construct(Database $database, Phase4SettingsService $fallback)
    {
        $this->database = $database;
        $this->fallback = $fallback;
    }

    /**
     * @return array<string,mixed>
     */
    public function getAll(): array
    {
        try {
            $pdo = $this->database->connect();
            $rows = $this->loadRows($pdo, ['core.app.name', 'core.app.id', 'core.ui.settings']);
            $appName = $this->readValue($rows['core.app.name'] ?? null, 'Neutral Platform');
            $appId = $this->readValue($rows['core.app.id'] ?? null, 'neutral-app');
            $settings = $this->readObjectValue($rows['core.ui.settings'] ?? null);
            return [
                'appName' => is_string($appName) && $appName !== '' ? $appName : 'Neutral Platform',
                'appId' => is_string($appId) && $appId !== '' ? $appId : 'neutral-app',
                'settings' => $settings,
            ];
        } catch (\Throwable $exception) {
            return $this->fallback->getAll();
        }
    }

    /**
     * @param array<string,mixed> $payload
     * @return array<string,mixed>
     */
    public function update(array $payload, ?int $updatedBy = null): array
    {
        $current = $this->getAll();
        $next = [
            'appName' => trim((string) ($payload['appName'] ?? $current['appName'] ?? 'Neutral Platform')),
            'appId' => trim((string) ($payload['appId'] ?? $current['appId'] ?? 'neutral-app')),
            'settings' => is_array($payload['settings'] ?? null)
                ? $payload['settings']
                : (is_array($current['settings'] ?? null) ? $current['settings'] : []),
        ];

        try {
            $pdo = $this->database->connect();
            $this->upsert($pdo, 'core.app.name', ['value' => $next['appName']], $updatedBy);
            $this->upsert($pdo, 'core.app.id', ['value' => $next['appId']], $updatedBy);
            $this->upsert($pdo, 'core.ui.settings', $next['settings'], $updatedBy);
            return $next;
        } catch (\Throwable $exception) {
            return $this->fallback->update($next);
        }
    }

    public function removeModuleSettings(string $moduleId, ?int $updatedBy = null): array
    {
        $normalized = strtolower(trim($moduleId));
        if ($normalized === '') {
            throw new \RuntimeException('Module id is required.');
        }

        return $this->removeSettingsPath('moduleSettings.' . $normalized, $updatedBy);
    }

    public function removeSettingsPath(string $path, ?int $updatedBy = null): array
    {
        $current = $this->getAll();
        $settings = is_array($current['settings'] ?? null) ? $current['settings'] : [];
        $segments = array_values(array_filter(array_map('trim', explode('.', trim($path))), static fn (string $segment): bool => $segment !== ''));
        if ($segments === []) {
            throw new \RuntimeException('Settings path is required.');
        }

        $changed = $this->removeNestedPath($settings, $segments);
        if (!$changed) {
            return $current;
        }

        return $this->update([
            'appName' => $current['appName'] ?? 'Neutral Platform',
            'appId' => $current['appId'] ?? 'neutral-app',
            'settings' => $settings,
        ], $updatedBy);
    }

    /**
     * @param list<string> $keys
     * @return array<string,string>
     */
    private function loadRows(PDO $pdo, array $keys): array
    {
        if ($keys === []) {
            return [];
        }
        $placeholders = implode(',', array_fill(0, count($keys), '?'));
        $statement = $pdo->prepare("SELECT setting_key, setting_value_json FROM settings WHERE setting_key IN ($placeholders)");
        $statement->execute($keys);
        $rows = [];
        foreach ($statement->fetchAll(PDO::FETCH_ASSOC) as $row) {
            if (!is_array($row)) {
                continue;
            }
            $rows[(string) ($row['setting_key'] ?? '')] = (string) ($row['setting_value_json'] ?? '');
        }
        return $rows;
    }

    /**
     * @param mixed $raw
     * @return mixed
     */
    private function readValue($raw, $defaultValue)
    {
        if (!is_string($raw) || $raw === '') {
            return $defaultValue;
        }
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return $defaultValue;
        }
        return $decoded['value'] ?? $defaultValue;
    }

    /**
     * @param mixed $raw
     * @return array<string,mixed>
     */
    private function readObjectValue($raw): array
    {
        if (!is_string($raw) || $raw === '') {
            return [];
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    /**
     * @param array<string,mixed> $value
     */
    private function upsert(PDO $pdo, string $key, array $value, ?int $updatedBy): void
    {
        $json = json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            throw new \RuntimeException('Could not encode settings payload.');
        }

        $statement = $pdo->prepare('
            INSERT INTO settings (setting_key, setting_value_json, updated_by, updated_at)
            VALUES (:setting_key, :setting_value_json, :updated_by, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE
                setting_value_json = VALUES(setting_value_json),
                updated_by = VALUES(updated_by),
                updated_at = CURRENT_TIMESTAMP
        ');
        $statement->execute([
            ':setting_key' => $key,
            ':setting_value_json' => $json,
            ':updated_by' => $updatedBy,
        ]);
    }

    /**
     * @param array<string,mixed> $subject
     * @param list<string> $segments
     */
    private function removeNestedPath(array &$subject, array $segments): bool
    {
        $segment = array_shift($segments);
        if ($segment === null || $segment === '') {
            return false;
        }

        if ($segments === []) {
            if (!array_key_exists($segment, $subject)) {
                return false;
            }
            unset($subject[$segment]);
            return true;
        }

        if (!isset($subject[$segment]) || !is_array($subject[$segment])) {
            return false;
        }

        $changed = $this->removeNestedPath($subject[$segment], $segments);
        if ($changed && $subject[$segment] === []) {
            unset($subject[$segment]);
        }

        return $changed;
    }
}

final class Phase6AuditService
{
    private Database $database;
    private Phase4JsonStore $fallbackStore;

    public function __construct(Database $database, Phase4JsonStore $fallbackStore)
    {
        $this->database = $database;
        $this->fallbackStore = $fallbackStore;
    }

    /**
     * @param array<string,mixed> $details
     */
    public function log(string $action, string $resource, ?string $resourceId, ?int $actorUserId, array $details = [], string $result = 'ok'): void
    {
        $entry = [
            'action' => $action,
            'resource' => $resource,
            'resourceId' => $resourceId,
            'actorUserId' => $actorUserId,
            'details' => $details,
            'result' => $result,
            'createdAt' => gmdate('c'),
        ];

        try {
            $pdo = $this->database->connect();
            $detailsJson = json_encode($details, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            if ($detailsJson === false) {
                $detailsJson = '{}';
            }
            $statement = $pdo->prepare('
                INSERT INTO audit_log (action, resource, resource_id, actor_user_id, details_json, result, created_at)
                VALUES (:action, :resource, :resource_id, :actor_user_id, :details_json, :result, CURRENT_TIMESTAMP)
            ');
            $statement->execute([
                ':action' => $action,
                ':resource' => $resource,
                ':resource_id' => $resourceId,
                ':actor_user_id' => $actorUserId,
                ':details_json' => $detailsJson,
                ':result' => $result,
            ]);
            return;
        } catch (\Throwable $exception) {
            $snapshot = $this->fallbackStore->read('audit-log.json', ['entries' => []]);
            $entries = is_array($snapshot['entries'] ?? null) ? $snapshot['entries'] : [];
            $entries[] = $entry;
            if (count($entries) > 500) {
                $entries = array_slice($entries, -500);
            }
            $snapshot['entries'] = $entries;
            $this->fallbackStore->write('audit-log.json', $snapshot);
        }
    }

    /**
     * @param array{action?:string,resource?:string,limit?:int} $filters
     * @return list<array<string,mixed>>
     */
    public function list(array $filters = []): array
    {
        try {
            $pdo = $this->database->connect();
            $limit = (int) ($filters['limit'] ?? 100);
            if ($limit <= 0) {
                $limit = 100;
            }
            if ($limit > 500) {
                $limit = 500;
            }

            $where = [];
            $params = [];
            if (trim((string) ($filters['action'] ?? '')) !== '') {
                $where[] = 'action = :action';
                $params[':action'] = trim((string) $filters['action']);
            }
            if (trim((string) ($filters['resource'] ?? '')) !== '') {
                $where[] = 'resource = :resource';
                $params[':resource'] = trim((string) $filters['resource']);
            }
            $sql = 'SELECT id, action, resource, resource_id, actor_user_id, details_json, result, created_at FROM audit_log';
            if ($where !== []) {
                $sql .= ' WHERE ' . implode(' AND ', $where);
            }
            $sql .= ' ORDER BY id DESC LIMIT ' . $limit;
            $statement = $pdo->prepare($sql);
            $statement->execute($params);

            $entries = [];
            foreach ($statement->fetchAll(PDO::FETCH_ASSOC) as $row) {
                if (!is_array($row)) {
                    continue;
                }
                $details = json_decode((string) ($row['details_json'] ?? '{}'), true);
                if (!is_array($details)) {
                    $details = [];
                }
                $entries[] = [
                    'id' => (string) ($row['id'] ?? ''),
                    'action' => (string) ($row['action'] ?? ''),
                    'resource' => (string) ($row['resource'] ?? ''),
                    'resourceId' => (string) ($row['resource_id'] ?? ''),
                    'actorUserId' => $row['actor_user_id'] !== null ? (string) $row['actor_user_id'] : null,
                    'details' => $details,
                    'result' => (string) ($row['result'] ?? 'ok'),
                    'createdAt' => (string) ($row['created_at'] ?? ''),
                ];
            }
            return $entries;
        } catch (\Throwable $exception) {
            $snapshot = $this->fallbackStore->read('audit-log.json', ['entries' => []]);
            $entries = is_array($snapshot['entries'] ?? null) ? $snapshot['entries'] : [];
            return array_reverse(array_values($entries));
        }
    }
}

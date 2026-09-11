<?php
declare(strict_types=1);

use Neutral\Core\Database;

return [
    'moduleId' => 'field-notes',
    'services' => [
        'module.field-notes.notes' => static function (array $context): object {
            $database = $context['database'] ?? null;
            if (!$database instanceof Database) throw new RuntimeException('Module database service is unavailable.');
            return new class ($database) {
                public function __construct(private Database $database) {}

                /** @param array<string,mixed> $context @return array<string,mixed> */
                public function list(array $context): array
                {
                    $statement = $this->database->connect()->prepare('SELECT id, title, body, created_at, updated_at FROM field_notes_items WHERE owner_user_id = :owner_id ORDER BY updated_at DESC, id DESC');
                    $statement->execute([':owner_id' => $this->ownerId($context)]);
                    return ['items' => array_map([$this, 'item'], $statement->fetchAll(PDO::FETCH_ASSOC))];
                }

                /** @param array<string,mixed> $context */
                public function count(array $context): int
                {
                    $statement = $this->database->connect()->prepare('SELECT COUNT(*) FROM field_notes_items WHERE owner_user_id = :owner_id');
                    $statement->execute([':owner_id' => $this->ownerId($context)]);
                    return (int) $statement->fetchColumn();
                }

                /** @param array<string,mixed> $context @return array<string,mixed> */
                public function create(array $context): array
                {
                    [$title, $body] = $this->validatedPayload($context);
                    $pdo = $this->database->connect();
                    $statement = $pdo->prepare('INSERT INTO field_notes_items (owner_user_id, title, body, created_at, updated_at) VALUES (:owner_id, :title, :body, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
                    $statement->execute([':owner_id' => $this->ownerId($context), ':title' => $title, ':body' => $body]);
                    return ['item' => $this->findOwned($this->ownerId($context), (int) $pdo->lastInsertId())];
                }

                /** @param array<string,mixed> $context @return array<string,mixed> */
                public function update(array $context): array
                {
                    [$title, $body] = $this->validatedPayload($context);
                    $id = $this->noteId($context);
                    $ownerId = $this->ownerId($context);
                    $statement = $this->database->connect()->prepare('UPDATE field_notes_items SET title = :title, body = :body, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND owner_user_id = :owner_id');
                    $statement->execute([':title' => $title, ':body' => $body, ':id' => $id, ':owner_id' => $ownerId]);
                    if ($statement->rowCount() === 0 && $this->findOwned($ownerId, $id, false) === null) throw new InvalidArgumentException('Invalid note id.');
                    return ['item' => $this->findOwned($ownerId, $id)];
                }

                /** @param array<string,mixed> $context @return array<string,mixed> */
                public function delete(array $context): array
                {
                    $statement = $this->database->connect()->prepare('DELETE FROM field_notes_items WHERE id = :id AND owner_user_id = :owner_id');
                    $statement->execute([':id' => $this->noteId($context), ':owner_id' => $this->ownerId($context)]);
                    return ['deleted' => $statement->rowCount() === 1];
                }

                /** @param array<string,mixed> $context @return array{string,string} */
                private function validatedPayload(array $context): array
                {
                    $payload = is_array($context['payload'] ?? null) ? $context['payload'] : [];
                    $title = trim((string) ($payload['title'] ?? ''));
                    $body = trim((string) ($payload['body'] ?? ''));
                    if ($title === '' || mb_strlen($title) > 160 || mb_strlen($body) > 10000) throw new InvalidArgumentException('Invalid note content.');
                    return [$title, $body];
                }

                /** @param array<string,mixed> $context */
                private function ownerId(array $context): int
                {
                    $raw = (string) (($context['identity']['userId'] ?? ''));
                    if ($raw === '' || !ctype_digit($raw) || (int) $raw < 1) throw new InvalidArgumentException('Authenticated user is required.');
                    return (int) $raw;
                }

                /** @param array<string,mixed> $context */
                private function noteId(array $context): int
                {
                    $raw = $context['payload']['id'] ?? null;
                    if ((!is_int($raw) && !(is_string($raw) && ctype_digit($raw))) || (int) $raw < 1) throw new InvalidArgumentException('Invalid note id.');
                    return (int) $raw;
                }

                /** @return array<string,mixed>|null */
                private function findOwned(int $ownerId, int $id, bool $required = true): ?array
                {
                    $statement = $this->database->connect()->prepare('SELECT id, title, body, created_at, updated_at FROM field_notes_items WHERE id = :id AND owner_user_id = :owner_id');
                    $statement->execute([':id' => $id, ':owner_id' => $ownerId]);
                    $row = $statement->fetch(PDO::FETCH_ASSOC);
                    if (!is_array($row)) {
                        if ($required) throw new InvalidArgumentException('Invalid note id.');
                        return null;
                    }
                    return $this->item($row);
                }

                /** @param array<string,mixed> $row @return array<string,mixed> */
                private function item(array $row): array
                {
                    return ['id' => (int) $row['id'], 'title' => (string) $row['title'], 'body' => (string) $row['body'], 'createdAt' => (string) $row['created_at'], 'updatedAt' => (string) $row['updated_at']];
                }
            };
        },
    ],
    'migrations' => [[
        'key' => '2026_09_11_0001_create_field_notes',
        'version' => '1.0.0',
        'up' => ['CREATE TABLE IF NOT EXISTS field_notes_items (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, owner_user_id BIGINT UNSIGNED NOT NULL, title VARCHAR(160) NOT NULL, body TEXT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (id), KEY ix_field_notes_owner_updated (owner_user_id, updated_at), CONSTRAINT fk_field_notes_owner FOREIGN KEY (owner_user_id) REFERENCES users (id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'],
        'down' => ['DROP TABLE IF EXISTS field_notes_items'],
    ]],
];

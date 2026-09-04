<?php
declare(strict_types=1);

use Neutral\Core\Database;

return [
    'moduleId' => 'reference-notes',
    'services' => [
        'module.reference-notes.notes' => static function (array $context): object {
            $database = $context['database'] ?? null;
            if (!$database instanceof Database) {
                throw new RuntimeException('Module database service is unavailable.');
            }
            return new class ($database) {
                private Database $database;

                public function __construct(Database $database)
                {
                    $this->database = $database;
                }

                /** @param array<string,mixed> $context @return array<string,mixed> */
                public function list(array $context): array
                {
                    $ownerId = $this->ownerId($context);
                    $statement = $this->database->connect()->prepare('SELECT id, note_text, created_at, updated_at FROM reference_notes_items WHERE owner_user_id = :owner_id ORDER BY id ASC');
                    $statement->execute([':owner_id' => $ownerId]);
                    $items = array_map(static fn (array $row): array => [
                        'id' => (int) $row['id'],
                        'text' => (string) $row['note_text'],
                        'createdAt' => (string) $row['created_at'],
                        'updatedAt' => (string) $row['updated_at'],
                    ], $statement->fetchAll(PDO::FETCH_ASSOC));
                    return ['items' => $items];
                }

                /** @param array<string,mixed> $context */
                public function count(array $context): int
                {
                    $statement = $this->database->connect()->prepare('SELECT COUNT(*) FROM reference_notes_items WHERE owner_user_id = :owner_id');
                    $statement->execute([':owner_id' => $this->ownerId($context)]);
                    return (int) $statement->fetchColumn();
                }

                /** @param array<string,mixed> $context @return array<string,mixed> */
                public function create(array $context): array
                {
                    $payload = is_array($context['payload'] ?? null) ? $context['payload'] : [];
                    $text = trim((string) ($payload['text'] ?? ''));
                    if ($text === '' || preg_match('/^.{1,2000}$/us', $text) !== 1) {
                        throw new InvalidArgumentException('Invalid note text.');
                    }
                    $pdo = $this->database->connect();
                    $statement = $pdo->prepare('INSERT INTO reference_notes_items (owner_user_id, note_text, created_at, updated_at) VALUES (:owner_id, :note_text, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
                    $statement->execute([':owner_id' => $this->ownerId($context), ':note_text' => $text]);
                    return ['item' => ['id' => (int) $pdo->lastInsertId(), 'text' => $text]];
                }

                /** @param array<string,mixed> $context @return array<string,mixed> */
                public function delete(array $context): array
                {
                    $payload = is_array($context['payload'] ?? null) ? $context['payload'] : [];
                    $id = $payload['id'] ?? null;
                    if ((!is_int($id) && !(is_string($id) && ctype_digit($id))) || (int) $id < 1) {
                        throw new InvalidArgumentException('Invalid note id.');
                    }
                    $statement = $this->database->connect()->prepare('DELETE FROM reference_notes_items WHERE id = :id AND owner_user_id = :owner_id');
                    $statement->execute([':id' => (int) $id, ':owner_id' => $this->ownerId($context)]);
                    return ['deleted' => $statement->rowCount() === 1];
                }

                /** @param array<string,mixed> $context */
                private function ownerId(array $context): int
                {
                    $identity = is_array($context['identity'] ?? null) ? $context['identity'] : [];
                    $raw = (string) ($identity['userId'] ?? '');
                    if ($raw === '' || !ctype_digit($raw) || (int) $raw < 1) {
                        throw new InvalidArgumentException('Authenticated user is required.');
                    }
                    return (int) $raw;
                }
            };
        },
    ],
    'migrations' => [
        [
            'key' => '2026_09_03_0001_create_notes',
            'version' => '1.0.0',
            'up' => [
                'CREATE TABLE IF NOT EXISTS reference_notes_items (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, owner_user_id BIGINT UNSIGNED NOT NULL, note_text TEXT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (id), KEY ix_reference_notes_owner (owner_user_id), CONSTRAINT fk_reference_notes_owner FOREIGN KEY (owner_user_id) REFERENCES users (id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            ],
            'down' => [
                'DROP TABLE IF EXISTS reference_notes_items',
            ],
        ],
    ],
];

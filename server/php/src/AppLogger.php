<?php
declare(strict_types=1);

namespace Neutral\Core;

final class AppLogger
{
    private string $logFile;
    private string $channel;

    public function __construct(string $logFile, string $channel = 'neutral.php')
    {
        $this->logFile = $logFile;
        $this->channel = $channel;
    }

    public static function defaultLogFile(string $projectRoot): string
    {
        $projectRoot = rtrim($projectRoot, "/\\");
        return $projectRoot . '/server/runtime/php-core.log';
    }

    /**
     * @param array<string, mixed> $context
     */
    public function log(string $level, string $message, array $context = []): void
    {
        $directory = dirname($this->logFile);
        if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
            throw new \RuntimeException('Could not create log directory: ' . $directory);
        }

        $payload = [
            'timestamp' => gmdate('c'),
            'channel' => $this->channel,
            'level' => strtolower($level),
            'message' => $message,
        ];
        if ($context !== []) {
            $payload['context'] = $context;
        }

        $line = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($line === false) {
            throw new \RuntimeException('Could not encode log payload as JSON.');
        }

        $written = file_put_contents($this->logFile, $line . PHP_EOL, FILE_APPEND | LOCK_EX);
        if ($written === false) {
            throw new \RuntimeException('Could not write log file: ' . $this->logFile);
        }
    }

    /**
     * @param array<string, mixed> $context
     */
    public function info(string $message, array $context = []): void
    {
        $this->log('info', $message, $context);
    }

    /**
     * @param array<string, mixed> $context
     */
    public function warning(string $message, array $context = []): void
    {
        $this->log('warning', $message, $context);
    }

    /**
     * @param array<string, mixed> $context
     */
    public function error(string $message, array $context = []): void
    {
        $this->log('error', $message, $context);
    }
}

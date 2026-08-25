<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/core/php/bootstrap.php';

$runtime = neutral_bootstrap([
    'project_root' => dirname(__DIR__),
    'register_error_handler' => false,
]);
$setupStateStore = new \Neutral\Core\SetupStateStore(\Neutral\Core\SetupStateStore::defaultStateFile($runtime->projectRoot()));
$prerequisiteChecker = new \Neutral\Core\PrerequisiteChecker($runtime->config(), $runtime->database());
$setupInstaller = new \Neutral\Core\SetupInstaller($runtime, $setupStateStore, $prerequisiteChecker);

$installMessage = '';
$installError = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['install_now'])) {
    try {
        $result = $setupInstaller->install();
        $active = strtoupper((string) ($result['status'] ?? '')) === 'ACTIVE'
            && (bool) (($result['installation']['active'] ?? false) === true);
        if ($active) {
            header('Location: admin.html');
            exit;
        }
        $installError = (string) ($result['installation']['message'] ?? 'Installation did not complete.');
    } catch (\Throwable $exception) {
        $installError = $exception->getMessage();
    }
}

$setupSnapshot = $setupInstaller->status();
$checks = is_array($setupSnapshot['checks'] ?? null) ? $setupSnapshot['checks'] : [];
$migrationState = is_array($setupSnapshot['migrationState'] ?? null) ? $setupSnapshot['migrationState'] : [];
$installationActive = (bool) (($setupSnapshot['installation']['active'] ?? false) === true);
$readyToInstall = strtoupper((string) ($setupSnapshot['status'] ?? '')) === 'READY_TO_INSTALL';
$database = $runtime->config()->database();
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Neutral Setup</title>
    <style>
      body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 32px; }
      .shell { max-width: 980px; margin: 0 auto; background: #111827; border-radius: 12px; border: 1px solid #334155; padding: 26px; }
      h1 { margin: 0 0 8px; }
      .muted { color: #94a3b8; font-size: .95rem; }
      .section { margin-top: 24px; }
      .panel { background: #0b1220; border: 1px solid #233147; border-radius: 10px; padding: 14px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .kv { display: grid; grid-template-columns: 170px 1fr; gap: 8px; font-size: .92rem; }
      .status { margin-top: 14px; border-radius: 8px; padding: 10px 12px; border: 1px solid #334155; background: #0b1220; }
      .ok { color: #bbf7d0; border-color: rgba(34,197,94,.4); background: rgba(34,197,94,.12); }
      .err { color: #fecaca; border-color: rgba(239,68,68,.5); background: rgba(239,68,68,.12); }
      .check { margin-bottom: 10px; font-size: .9rem; }
      .check strong { display: inline-block; min-width: 190px; }
      button, a.btn { border: 0; border-radius: 8px; padding: 10px 18px; font-weight: 700; text-decoration: none; display: inline-block; }
      button { background: #2563eb; color: #fff; cursor: pointer; }
      button[disabled] { opacity: .6; cursor: not-allowed; }
      a.btn { background: #16a34a; color: #fff; }
    </style>
  </head>
  <body>
    <div class="shell">
      <h1><?= $installationActive ? 'Installation active' : 'Neutral setup' ?></h1>
      <p class="muted">
        Setup state: <?= htmlspecialchars((string) ($setupSnapshot['status'] ?? 'SETUP_REQUIRED'), ENT_QUOTES, 'UTF-8') ?> ·
        Environment: <?= htmlspecialchars($runtime->config()->environment(), ENT_QUOTES, 'UTF-8') ?>
      </p>

      <?php if ($installMessage !== ''): ?>
        <div class="status ok"><?= htmlspecialchars($installMessage, ENT_QUOTES, 'UTF-8') ?></div>
      <?php endif; ?>
      <?php if ($installError !== ''): ?>
        <div class="status err"><?= htmlspecialchars($installError, ENT_QUOTES, 'UTF-8') ?></div>
      <?php endif; ?>

      <div class="section panel">
        <h2>Install</h2>
        <p class="muted">Configuration is loaded from the server-side <code>.env</code>. No secret values are shown here.</p>
        <?php if ($installationActive): ?>
          <a class="btn" href="admin.html">Open admin</a>
        <?php else: ?>
          <form method="post" action="setup.php">
            <input type="hidden" name="install_now" value="1" />
            <button type="submit" <?= $readyToInstall ? '' : 'disabled' ?>>Install</button>
          </form>
          <?php if (!$readyToInstall): ?>
            <div class="status err">Install is currently blocked. Review system checks and database state below.</div>
          <?php endif; ?>
        <?php endif; ?>
      </div>

      <div class="section panel">
        <h2>Configuration summary</h2>
        <div class="grid">
          <div class="kv"><strong>Env file</strong><span><?= htmlspecialchars($runtime->envFile(), ENT_QUOTES, 'UTF-8') ?></span></div>
          <div class="kv"><strong>App</strong><span><?= htmlspecialchars($runtime->config()->appId() . ' · ' . $runtime->config()->appName(), ENT_QUOTES, 'UTF-8') ?></span></div>
          <div class="kv"><strong>API base</strong><span><?= htmlspecialchars($runtime->config()->apiBase(), ENT_QUOTES, 'UTF-8') ?></span></div>
          <div class="kv"><strong>Database</strong><span><?= htmlspecialchars(($database['type'] ?? 'mysql') . '://' . ($database['host'] ?? '') . ':' . ($database['port'] ?? ''), ENT_QUOTES, 'UTF-8') ?></span></div>
          <div class="kv"><strong>Database name</strong><span><?= htmlspecialchars((string) ($database['name'] ?? ''), ENT_QUOTES, 'UTF-8') ?></span></div>
          <div class="kv"><strong>DB user</strong><span><?= htmlspecialchars((string) ($database['user'] ?? ''), ENT_QUOTES, 'UTF-8') ?></span></div>
        </div>
      </div>

      <div class="section panel">
        <h2>Migration state</h2>
        <div class="kv"><strong>Status</strong><span><?= htmlspecialchars((string) ($migrationState['status'] ?? 'unknown'), ENT_QUOTES, 'UTF-8') ?></span></div>
        <div class="kv"><strong>Message</strong><span><?= htmlspecialchars((string) ($migrationState['message'] ?? ''), ENT_QUOTES, 'UTF-8') ?></span></div>
        <div class="kv"><strong>Applied</strong><span><?= htmlspecialchars((string) json_encode($migrationState['applied'] ?? [], JSON_UNESCAPED_SLASHES), ENT_QUOTES, 'UTF-8') ?></span></div>
        <div class="kv"><strong>Pending</strong><span><?= htmlspecialchars((string) json_encode($migrationState['pending'] ?? [], JSON_UNESCAPED_SLASHES), ENT_QUOTES, 'UTF-8') ?></span></div>
      </div>

      <div class="section panel">
        <h2>System checks</h2>
        <?php foreach ($checks as $checkName => $check): ?>
          <?php $ok = (bool) (($check['ok'] ?? false) === true); $meta = $check; unset($meta['ok']); ?>
          <div class="check">
            <strong><?= htmlspecialchars((string) $checkName, ENT_QUOTES, 'UTF-8') ?></strong>
            <span class="<?= $ok ? 'ok' : 'err' ?>" style="padding:2px 6px;border-radius:6px;"><?= $ok ? 'PASS' : 'FAIL' ?></span>
            <div class="muted"><?= htmlspecialchars((string) json_encode($meta, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), ENT_QUOTES, 'UTF-8') ?></div>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
  </body>
</html>

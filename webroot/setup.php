<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/core/php/bootstrap.php';

use Neutral\Core\CoreDataSeeder;
use Neutral\Core\Phase4JsonStore;
use Neutral\Core\Phase4RoleService;
use Neutral\Core\Phase4UserService;
use Neutral\Core\PrerequisiteChecker;
use Neutral\Core\SetupInstaller;
use Neutral\Core\SetupStateStore;

/**
 * @param mixed $value
 */
function setup_bool($value): bool
{
    $normalized = strtolower(trim((string) $value));
    return in_array($normalized, ['1', 'true', 'yes', 'on'], true);
}

/**
 * @param array<string,mixed> $user
 */
function setup_has_role(array $user, string $role): bool
{
    $roles = is_array($user['roles'] ?? null) ? $user['roles'] : [];
    foreach ($roles as $entry) {
        if (strtolower(trim((string) $entry)) === strtolower($role)) {
            return true;
        }
    }
    return false;
}

/**
 * @param list<string> $roles
 * @return list<string>
 */
function setup_remove_role(array $roles, string $role): array
{
    $filtered = [];
    foreach ($roles as $entry) {
        $value = strtolower(trim((string) $entry));
        if ($value !== '' && $value !== strtolower($role)) {
            $filtered[] = $value;
        }
    }
    if ($filtered === []) {
        $filtered[] = 'user';
    }
    return array_values(array_unique($filtered));
}

function setup_default_email(string $username): string
{
    $normalized = strtolower(trim($username));
    $sanitized = preg_replace('/[^a-z0-9._-]+/i', '.', $normalized);
    $sanitized = trim((string) $sanitized, '.');
    if ($sanitized === '') {
        $sanitized = 'user';
    }
    return $sanitized . '@localhost';
}

/**
 * @param list<array<string,mixed>> $users
 */
function setup_find_by_username(array $users, string $username): ?array
{
    $needle = strtolower(trim($username));
    foreach ($users as $user) {
        if (strtolower(trim((string) ($user['username'] ?? ''))) === $needle) {
            return $user;
        }
    }
    return null;
}

$runtime = neutral_bootstrap([
    'project_root' => dirname(__DIR__),
    'register_error_handler' => false,
]);
$setupStateStore = new SetupStateStore(SetupStateStore::defaultStateFile($runtime->projectRoot()));
$prerequisiteChecker = new PrerequisiteChecker($runtime->config(), $runtime->database());
$setupInstaller = new SetupInstaller($runtime, $setupStateStore, $prerequisiteChecker);

$messages = [];
$errors = [];
$setupSnapshot = $setupInstaller->status();
$installationActive = (bool) (($setupSnapshot['installation']['active'] ?? false) === true);
$readyToInstall = strtoupper((string) ($setupSnapshot['status'] ?? '')) === 'READY_TO_INSTALL';

$env = $runtime->config()->env();
$recoveryEnabled = setup_bool($env['CORE_SETUP_RECOVERY_ENABLED'] ?? '');
$recoveryKeyExpected = trim((string) ($env['CORE_SETUP_RECOVERY_KEY'] ?? ''));
$providedRecoveryKey = trim((string) ($_POST['recovery_key'] ?? $_GET['recovery_key'] ?? ''));
$recoveryAuthorized = !$installationActive
    || (
        $recoveryEnabled
        && ($recoveryKeyExpected === '' || ($providedRecoveryKey !== '' && hash_equals($recoveryKeyExpected, $providedRecoveryKey)))
    );

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['install_now'])) {
    try {
        $result = $setupInstaller->install();
        $active = strtoupper((string) ($result['status'] ?? '')) === 'ACTIVE'
            && (bool) (($result['installation']['active'] ?? false) === true);
        if ($active) {
            $messages[] = 'Step 1 completed. Installation is active. Continue with user setup below.';
        } else {
            $errors[] = (string) ($result['installation']['message'] ?? 'Installation did not complete.');
        }
    } catch (Throwable $exception) {
        $errors[] = $exception->getMessage();
    }
    $setupSnapshot = $setupInstaller->status();
    $installationActive = (bool) (($setupSnapshot['installation']['active'] ?? false) === true);
    $readyToInstall = strtoupper((string) ($setupSnapshot['status'] ?? '')) === 'READY_TO_INSTALL';
}

$userService = null;
$allUsers = [];
$adminUsers = [];
$developerUsers = [];
$inventoryError = '';
if ($installationActive) {
    try {
        $store = new Phase4JsonStore($runtime->projectRoot() . '/config');
        $roleService = new Phase4RoleService($store, $runtime->database());
        $userService = new Phase4UserService($store, $roleService, $runtime->config(), $runtime->database());
        $allUsers = $userService->allPublic();
        foreach ($allUsers as $user) {
            if (setup_has_role($user, 'admin')) {
                $adminUsers[] = $user;
            }
            if (setup_has_role($user, 'developer')) {
                $developerUsers[] = $user;
            }
        }
    } catch (Throwable $exception) {
        $inventoryError = $exception->getMessage();
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['configure_users'])) {
    if (!$installationActive) {
        $errors[] = 'Install step is not active yet.';
    } elseif (!$recoveryAuthorized) {
        $errors[] = 'Setup is locked. Enable controlled recovery mode first.';
    } elseif (!$userService) {
        $errors[] = $inventoryError !== '' ? $inventoryError : 'User service is not available.';
    } else {
        try {
            $adminAction = strtolower(trim((string) ($_POST['admin_action'] ?? (count($adminUsers) > 0 ? 'keep' : 'create'))));
            $developerAction = strtolower(trim((string) ($_POST['developer_action'] ?? 'skip')));
            if (!in_array($adminAction, ['keep', 'create', 'reset'], true)) {
                throw new RuntimeException('Invalid admin action.');
            }
            if (!in_array($developerAction, ['skip', 'keep', 'create', 'reset'], true)) {
                throw new RuntimeException('Invalid developer action.');
            }

            $applyRole = static function (
                string $roleKey,
                string $action,
                string $username,
                string $password,
                string $passwordConfirm,
                string $email,
                Phase4UserService $service,
                array $usersWithRole,
                array $allCurrentUsers
            ): array {
                if ($action === 'skip') {
                    return ['changed' => false, 'message' => ucfirst($roleKey) . ' setup skipped.'];
                }
                if ($action === 'keep') {
                    if ($usersWithRole === []) {
                        throw new RuntimeException('No existing ' . $roleKey . ' user is available to keep.');
                    }
                    return ['changed' => false, 'message' => 'Existing ' . $roleKey . ' user kept.'];
                }

                $normalizedUser = trim($username);
                if ($normalizedUser === '' || strlen($normalizedUser) < 3) {
                    throw new RuntimeException(ucfirst($roleKey) . ' username must have at least 3 characters.');
                }
                if ($password === '' || strlen($password) < 8) {
                    throw new RuntimeException(ucfirst($roleKey) . ' password must have at least 8 characters.');
                }
                if (!hash_equals($password, $passwordConfirm)) {
                    throw new RuntimeException(ucfirst($roleKey) . ' password confirmation does not match.');
                }

                $target = setup_find_by_username($allCurrentUsers, $normalizedUser);
                $targetUserId = null;
                if (is_array($target)) {
                    $targetUserId = (string) ($target['id'] ?? '');
                    $targetRoles = is_array($target['roles'] ?? null) ? $target['roles'] : [];
                    $targetRoles[] = $roleKey;
                    $service->update($targetUserId, [
                        'status' => 'active',
                        'roles' => array_values(array_unique(array_map(static fn ($value) => strtolower(trim((string) $value)), $targetRoles))),
                        'password' => $password,
                    ]);
                } else {
                    $service->create([
                        'username' => $normalizedUser,
                        'email' => filter_var($email, FILTER_VALIDATE_EMAIL) ? strtolower(trim($email)) : setup_default_email($normalizedUser),
                        'password' => $password,
                        'displayName' => ucfirst($roleKey),
                        'status' => 'active',
                        'roles' => [$roleKey],
                    ]);
                }

                if ($action === 'reset') {
                    foreach ($usersWithRole as $existingUser) {
                        $existingId = (string) ($existingUser['id'] ?? '');
                        if ($existingId === '' || ($targetUserId !== null && $existingId === $targetUserId)) {
                            continue;
                        }
                        $existingRoles = is_array($existingUser['roles'] ?? null) ? $existingUser['roles'] : [];
                        $service->update($existingId, [
                            'roles' => setup_remove_role($existingRoles, $roleKey),
                            'status' => 'inactive',
                        ]);
                    }
                }

                return ['changed' => true, 'message' => ucfirst($roleKey) . ' user has been provisioned.'];
            };

            $adminResult = $applyRole(
                'admin',
                $adminAction,
                trim((string) ($_POST['admin_username'] ?? '')),
                (string) ($_POST['admin_password'] ?? ''),
                (string) ($_POST['admin_password_confirm'] ?? ''),
                trim((string) ($_POST['admin_email'] ?? '')),
                $userService,
                $adminUsers,
                $allUsers
            );
            $messages[] = (string) ($adminResult['message'] ?? 'Admin setup finished.');

            $developerResult = $applyRole(
                'developer',
                $developerAction,
                trim((string) ($_POST['developer_username'] ?? '')),
                (string) ($_POST['developer_password'] ?? ''),
                (string) ($_POST['developer_password_confirm'] ?? ''),
                trim((string) ($_POST['developer_email'] ?? '')),
                $userService,
                $developerUsers,
                $allUsers
            );
            $messages[] = (string) ($developerResult['message'] ?? 'Developer setup finished.');

            $state = $setupStateStore->load();
            $state['status'] = 'ACTIVE';
            $state['currentStep'] = 'users-configured';
            $state['installation']['active'] = true;
            $state['installation']['state'] = 'ACTIVE';
            $state['installation']['message'] = 'Installation is active and server users are configured.';
            $state['userProvisioning'] = [
                'configured' => true,
                'configuredAt' => gmdate('c'),
                'adminAction' => $adminAction,
                'developerAction' => $developerAction,
            ];
            $savedState = $setupStateStore->save($state);
            (new CoreDataSeeder($runtime->database(), $runtime->config()))->syncSetupStatus($savedState);
            $messages[] = 'Setup is now locked. Use controlled recovery mode to reopen setup later.';
        } catch (Throwable $exception) {
            $errors[] = $exception->getMessage();
        }
    }

    $setupSnapshot = $setupInstaller->status();
    $installationActive = (bool) (($setupSnapshot['installation']['active'] ?? false) === true);
    $readyToInstall = strtoupper((string) ($setupSnapshot['status'] ?? '')) === 'READY_TO_INSTALL';
    $recoveryAuthorized = !$installationActive
        || (
            $recoveryEnabled
            && ($recoveryKeyExpected === '' || ($providedRecoveryKey !== '' && hash_equals($recoveryKeyExpected, $providedRecoveryKey)))
        );

    $adminUsers = [];
    $developerUsers = [];
    $allUsers = [];
    $inventoryError = '';
    if ($installationActive) {
        try {
            $store = new Phase4JsonStore($runtime->projectRoot() . '/config');
            $roleService = new Phase4RoleService($store, $runtime->database());
            $userService = new Phase4UserService($store, $roleService, $runtime->config(), $runtime->database());
            $allUsers = $userService->allPublic();
            foreach ($allUsers as $user) {
                if (setup_has_role($user, 'admin')) {
                    $adminUsers[] = $user;
                }
                if (setup_has_role($user, 'developer')) {
                    $developerUsers[] = $user;
                }
            }
        } catch (Throwable $exception) {
            $inventoryError = $exception->getMessage();
        }
    }
}

$checks = is_array($setupSnapshot['checks'] ?? null) ? $setupSnapshot['checks'] : [];
$migrationState = is_array($setupSnapshot['migrationState'] ?? null) ? $setupSnapshot['migrationState'] : [];
$database = $runtime->config()->database();
$formAction = 'setup.php' . ($providedRecoveryKey !== '' ? ('?recovery_key=' . rawurlencode($providedRecoveryKey)) : '');
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Neutral Setup</title>
    <style>
      body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 32px; }
      .shell { max-width: 1080px; margin: 0 auto; background: #111827; border-radius: 12px; border: 1px solid #334155; padding: 26px; }
      h1 { margin: 0 0 8px; }
      h2 { margin: 0 0 12px; }
      h3 { margin: 0 0 10px; }
      .muted { color: #94a3b8; font-size: .95rem; }
      .section { margin-top: 24px; }
      .panel { background: #0b1220; border: 1px solid #233147; border-radius: 10px; padding: 14px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .kv { display: grid; grid-template-columns: 200px 1fr; gap: 8px; font-size: .92rem; }
      .status { margin-top: 14px; border-radius: 8px; padding: 10px 12px; border: 1px solid #334155; background: #0b1220; }
      .ok { color: #bbf7d0; border-color: rgba(34,197,94,.4); background: rgba(34,197,94,.12); }
      .err { color: #fecaca; border-color: rgba(239,68,68,.5); background: rgba(239,68,68,.12); }
      .check { margin-bottom: 10px; font-size: .9rem; }
      .check strong { display: inline-block; min-width: 190px; }
      .form-grid { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
      .form-field { display:flex; flex-direction:column; gap:6px; }
      .form-field input, .form-field select { padding: 8px 10px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #e2e8f0; }
      .action-row { margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap; }
      button, a.btn { border: 0; border-radius: 8px; padding: 10px 18px; font-weight: 700; text-decoration: none; display: inline-block; }
      button { background: #2563eb; color: #fff; cursor: pointer; }
      button[disabled] { opacity: .6; cursor: not-allowed; }
      a.btn { background: #16a34a; color: #fff; }
      table { width:100%; border-collapse: collapse; margin-top: 8px; }
      th, td { padding: 8px 10px; border-bottom: 1px solid #233147; text-align: left; font-size: .9rem; }
      .pill { display:inline-block; padding:2px 8px; border-radius:999px; font-size:.8rem; border:1px solid #334155; }
    </style>
  </head>
  <body>
    <div class="shell">
      <h1>Neutral setup</h1>
      <p class="muted">
        Setup state: <?= htmlspecialchars((string) ($setupSnapshot['status'] ?? 'SETUP_REQUIRED'), ENT_QUOTES, 'UTF-8') ?> ·
        Environment: <?= htmlspecialchars($runtime->config()->environment(), ENT_QUOTES, 'UTF-8') ?>
      </p>

      <?php foreach ($messages as $message): ?>
        <div class="status ok"><?= htmlspecialchars($message, ENT_QUOTES, 'UTF-8') ?></div>
      <?php endforeach; ?>
      <?php foreach ($errors as $error): ?>
        <div class="status err"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
      <?php endforeach; ?>

      <?php if ($installationActive && !$recoveryAuthorized): ?>
        <div class="section panel">
          <h2>Setup locked</h2>
          <p class="muted">Installation is complete. Setup is blocked in production mode.</p>
          <div class="status err">
            Controlled recovery can be enabled via server-side environment:
            <code>CORE_SETUP_RECOVERY_ENABLED=true</code>
            <?php if ($recoveryKeyExpected !== ''): ?>
              and a valid recovery key.
            <?php endif; ?>
          </div>
          <div class="action-row">
            <a class="btn" href="admin.html">Open admin</a>
          </div>
        </div>
      <?php else: ?>
        <div class="section panel">
          <h2>Step 1 – Install</h2>
          <p class="muted">Configuration is loaded from the server-side <code>.env</code>. No secret values are shown here.</p>
          <?php if (!$installationActive): ?>
            <form method="post" action="<?= htmlspecialchars($formAction, ENT_QUOTES, 'UTF-8') ?>">
              <input type="hidden" name="install_now" value="1" />
              <?php if ($providedRecoveryKey !== ''): ?>
                <input type="hidden" name="recovery_key" value="<?= htmlspecialchars($providedRecoveryKey, ENT_QUOTES, 'UTF-8') ?>" />
              <?php endif; ?>
              <button type="submit" <?= $readyToInstall ? '' : 'disabled' ?>>Install now</button>
            </form>
            <?php if (!$readyToInstall): ?>
              <div class="status err">Install is currently blocked. Review system checks and database state below.</div>
            <?php endif; ?>
          <?php else: ?>
            <div class="status ok">Installation is active.</div>
          <?php endif; ?>
        </div>

        <?php if ($installationActive): ?>
          <div class="section panel">
            <h2>Step 2 – Configure server users</h2>
            <p class="muted">Server-side database users are the only authentication source. Local browser developer stores are not used for setup decisions.</p>
            <?php if ($inventoryError !== ''): ?>
              <div class="status err"><?= htmlspecialchars($inventoryError, ENT_QUOTES, 'UTF-8') ?></div>
            <?php else: ?>
              <div class="grid">
                <div class="panel">
                  <h3>Existing admin users</h3>
                  <?php if ($adminUsers === []): ?>
                    <div class="muted">No admin user found.</div>
                  <?php else: ?>
                    <table>
                      <thead><tr><th>ID</th><th>Username</th><th>Status</th><th>Roles</th></tr></thead>
                      <tbody>
                        <?php foreach ($adminUsers as $user): ?>
                          <tr>
                            <td><?= htmlspecialchars((string) ($user['id'] ?? ''), ENT_QUOTES, 'UTF-8') ?></td>
                            <td><?= htmlspecialchars((string) ($user['username'] ?? ''), ENT_QUOTES, 'UTF-8') ?></td>
                            <td><?= htmlspecialchars((string) ($user['status'] ?? ''), ENT_QUOTES, 'UTF-8') ?></td>
                            <td><?= htmlspecialchars(implode(', ', is_array($user['roles'] ?? null) ? $user['roles'] : []), ENT_QUOTES, 'UTF-8') ?></td>
                          </tr>
                        <?php endforeach; ?>
                      </tbody>
                    </table>
                  <?php endif; ?>
                </div>
                <div class="panel">
                  <h3>Existing developer users</h3>
                  <?php if ($developerUsers === []): ?>
                    <div class="muted">No developer user found.</div>
                  <?php else: ?>
                    <table>
                      <thead><tr><th>ID</th><th>Username</th><th>Status</th><th>Roles</th></tr></thead>
                      <tbody>
                        <?php foreach ($developerUsers as $user): ?>
                          <tr>
                            <td><?= htmlspecialchars((string) ($user['id'] ?? ''), ENT_QUOTES, 'UTF-8') ?></td>
                            <td><?= htmlspecialchars((string) ($user['username'] ?? ''), ENT_QUOTES, 'UTF-8') ?></td>
                            <td><?= htmlspecialchars((string) ($user['status'] ?? ''), ENT_QUOTES, 'UTF-8') ?></td>
                            <td><?= htmlspecialchars(implode(', ', is_array($user['roles'] ?? null) ? $user['roles'] : []), ENT_QUOTES, 'UTF-8') ?></td>
                          </tr>
                        <?php endforeach; ?>
                      </tbody>
                    </table>
                  <?php endif; ?>
                </div>
              </div>

              <form method="post" action="<?= htmlspecialchars($formAction, ENT_QUOTES, 'UTF-8') ?>">
                <input type="hidden" name="configure_users" value="1" />
                <?php if ($providedRecoveryKey !== ''): ?>
                  <input type="hidden" name="recovery_key" value="<?= htmlspecialchars($providedRecoveryKey, ENT_QUOTES, 'UTF-8') ?>" />
                <?php endif; ?>
                <div class="form-grid">
                  <div class="panel">
                    <h3>Admin</h3>
                    <div class="form-field">
                      <label for="adminAction">Action</label>
                      <select id="adminAction" name="admin_action">
                        <option value="keep" <?= $adminUsers !== [] ? 'selected' : '' ?>>Keep existing admin</option>
                        <option value="reset">Reset admin</option>
                        <option value="create" <?= $adminUsers === [] ? 'selected' : '' ?>>Create admin</option>
                      </select>
                    </div>
                    <div class="form-field"><label for="adminUsername">Username</label><input id="adminUsername" type="text" name="admin_username" placeholder="admin" /></div>
                    <div class="form-field"><label for="adminEmail">Email (optional)</label><input id="adminEmail" type="email" name="admin_email" placeholder="admin@example.com" /></div>
                    <div class="form-field"><label for="adminPassword">Password</label><input id="adminPassword" type="password" name="admin_password" /></div>
                    <div class="form-field"><label for="adminPasswordConfirm">Confirm password</label><input id="adminPasswordConfirm" type="password" name="admin_password_confirm" /></div>
                  </div>
                  <div class="panel">
                    <h3>Developer (optional)</h3>
                    <div class="form-field">
                      <label for="developerAction">Action</label>
                      <select id="developerAction" name="developer_action">
                        <option value="skip" <?= $developerUsers === [] ? 'selected' : '' ?>>Skip</option>
                        <option value="keep" <?= $developerUsers !== [] ? 'selected' : '' ?>>Keep existing developer</option>
                        <option value="reset">Reset developer</option>
                        <option value="create">Create developer</option>
                      </select>
                    </div>
                    <div class="form-field"><label for="developerUsername">Username</label><input id="developerUsername" type="text" name="developer_username" placeholder="developer" /></div>
                    <div class="form-field"><label for="developerEmail">Email (optional)</label><input id="developerEmail" type="email" name="developer_email" placeholder="developer@example.com" /></div>
                    <div class="form-field"><label for="developerPassword">Password</label><input id="developerPassword" type="password" name="developer_password" /></div>
                    <div class="form-field"><label for="developerPasswordConfirm">Confirm password</label><input id="developerPasswordConfirm" type="password" name="developer_password_confirm" /></div>
                  </div>
                </div>
                <div class="action-row">
                  <button type="submit">Apply user setup</button>
                  <a class="btn" href="admin.html">Open admin</a>
                </div>
              </form>
            <?php endif; ?>
          </div>
        <?php endif; ?>
      <?php endif; ?>

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

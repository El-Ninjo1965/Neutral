<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/php/bootstrap.php';

use Neutral\Core\CoreDataSeeder;
use Neutral\Core\Phase4JsonStore;
use Neutral\Core\Phase4RoleService;
use Neutral\Core\Phase4UserService;
use Neutral\Core\PrerequisiteChecker;
use Neutral\Core\Security;
use Neutral\Core\SetupAccessGuard;
use Neutral\Core\SetupInstaller;
use Neutral\Core\SetupStateStore;

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

/**
 * @param array<string,mixed> $check
 */
function setup_check_text(string $checkName, array $check): string
{
    if ($checkName === 'php_version') {
        return 'Required PHP version is available.';
    }
    if ($checkName === 'php_extensions') {
        return 'Required PHP extensions are available.';
    }
    if ($checkName === 'env_file') {
        return 'Server environment file is readable.';
    }
    if ($checkName === 'runtime_directory') {
        return 'Runtime directory is writable.';
    }
    if ($checkName === 'database_config') {
        $missing = is_array($check['missing'] ?? null) ? $check['missing'] : [];
        if ($missing !== []) {
            return 'Database configuration has missing values.';
        }
        return 'Database configuration is present.';
    }
    if ($checkName === 'database_connection') {
        return (string) ($check['message'] ?? 'Database connectivity check completed.');
    }
    return 'System check completed.';
}

$runtime = neutral_bootstrap([
    'register_error_handler' => false,
]);
$setupStateStore = new SetupStateStore(SetupStateStore::defaultStateFile($runtime->projectRoot()));
$prerequisiteChecker = new PrerequisiteChecker($runtime->config(), $runtime->database());
$setupInstaller = new SetupInstaller($runtime, $setupStateStore, $prerequisiteChecker);

SetupAccessGuard::enforce($runtime->config(), $setupInstaller);

$messages = [];
$errors = [];
$lastResetResult = null;
$lastInventoryError = '';
$allUsers = [];
$adminUsers = [];
$developerUsers = [];

$csrfToken = Security::ensureCsrfToken();

$refreshState = static function () use (
    $setupInstaller,
    $runtime,
    &$allUsers,
    &$adminUsers,
    &$developerUsers,
    &$lastInventoryError
): array {
    $snapshot = $setupInstaller->status();
    $installationEvidence = is_array($snapshot['installationEvidence'] ?? null) ? $snapshot['installationEvidence'] : [];
    $installationActive = (bool) (($snapshot['installation']['active'] ?? false) === true);
    $installationDetected = $installationActive || (bool) ($installationEvidence['installed'] ?? false);

    $allUsers = [];
    $adminUsers = [];
    $developerUsers = [];
    $lastInventoryError = '';

    if ($installationDetected) {
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
            $lastInventoryError = $exception->getMessage();
        }
    }

    return $snapshot;
};

$setupSnapshot = $refreshState();
$installationEvidence = is_array($setupSnapshot['installationEvidence'] ?? null) ? $setupSnapshot['installationEvidence'] : [];
$installationActive = (bool) (($setupSnapshot['installation']['active'] ?? false) === true);
$installationDetected = $installationActive || (bool) ($installationEvidence['installed'] ?? false);
$readyToInstall = strtoupper((string) ($setupSnapshot['status'] ?? '')) === 'READY_TO_INSTALL';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        Security::assertValidCsrfToken((string) ($_POST['_csrf_token'] ?? ''));
    } catch (Throwable $exception) {
        $errors[] = 'Invalid request token. Please reload the page and try again.';
    }

    if ($errors === []) {
        if (isset($_POST['install_now'])) {
            try {
                $result = $setupInstaller->install();
                $isActive = strtoupper((string) ($result['status'] ?? '')) === 'ACTIVE'
                    && (bool) (($result['installation']['active'] ?? false) === true);
                if ($isActive) {
                    $messages[] = 'Installation completed. Continue with server user provisioning.';
                } else {
                    $errors[] = (string) ($result['installation']['message'] ?? 'Installation did not complete.');
                }
            } catch (Throwable $exception) {
                $errors[] = $exception->getMessage();
            }
        }

        if (isset($_POST['configure_users'])) {
            if (!$installationDetected) {
                $errors[] = 'No existing installation detected. Run installation first.';
            } else {
                try {
                    $store = new Phase4JsonStore($runtime->projectRoot() . '/config');
                    $roleService = new Phase4RoleService($store, $runtime->database());
                    $userService = new Phase4UserService($store, $roleService, $runtime->config(), $runtime->database());

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
                            return ['changed' => false, 'message' => ucfirst($roleKey) . ' provisioning skipped.'];
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
                    $messages[] = (string) ($adminResult['message'] ?? 'Admin provisioning finished.');

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
                    $messages[] = (string) ($developerResult['message'] ?? 'Developer provisioning finished.');

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
                } catch (Throwable $exception) {
                    $errors[] = $exception->getMessage();
                }
            }
        }

        if (isset($_POST['reset_now'])) {
            $confirmation = trim((string) ($_POST['reset_confirmation'] ?? ''));
            $confirmedCheckbox = ((string) ($_POST['reset_confirm_checkbox'] ?? '')) === 'yes';
            if (!$confirmedCheckbox || !hash_equals('RESET NEUTRAL', $confirmation)) {
                $errors[] = 'Reset requires checkbox confirmation and exact phrase: RESET NEUTRAL';
            } else {
                try {
                    $lastResetResult = $setupInstaller->resetApplicationState();
                    $messages[] = 'Application reset completed. Neutral is now in a not-installed state.';
                } catch (Throwable $exception) {
                    $errors[] = $exception->getMessage();
                }
            }
        }
    }

    $setupSnapshot = $refreshState();
    $installationEvidence = is_array($setupSnapshot['installationEvidence'] ?? null) ? $setupSnapshot['installationEvidence'] : [];
    $installationActive = (bool) (($setupSnapshot['installation']['active'] ?? false) === true);
    $installationDetected = $installationActive || (bool) ($installationEvidence['installed'] ?? false);
    $readyToInstall = strtoupper((string) ($setupSnapshot['status'] ?? '')) === 'READY_TO_INSTALL';
}

$checks = is_array($setupSnapshot['checks'] ?? null) ? $setupSnapshot['checks'] : [];
$migrationState = is_array($setupSnapshot['migrationState'] ?? null) ? $setupSnapshot['migrationState'] : [];
$adminDefaultAction = $adminUsers === [] ? 'create' : 'reset';
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Neutral Setup</title>
    <style>
      body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 32px; }
      .shell { max-width: 1120px; margin: 0 auto; background: #111827; border-radius: 12px; border: 1px solid #334155; padding: 26px; }
      h1 { margin: 0 0 8px; }
      h2 { margin: 0 0 10px; }
      h3 { margin: 0 0 8px; }
      .muted { color: #94a3b8; font-size: .95rem; }
      .section { margin-top: 24px; }
      .panel { background: #0b1220; border: 1px solid #233147; border-radius: 10px; padding: 14px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .status { margin-top: 12px; border-radius: 8px; padding: 10px 12px; border: 1px solid #334155; background: #0b1220; }
      .ok { color: #bbf7d0; border-color: rgba(34,197,94,.4); background: rgba(34,197,94,.12); }
      .err { color: #fecaca; border-color: rgba(239,68,68,.5); background: rgba(239,68,68,.12); }
      .warn { color: #fde68a; border-color: rgba(245,158,11,.5); background: rgba(245,158,11,.12); }
      .form-grid { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 10px; }
      .form-field { display:flex; flex-direction:column; gap:6px; }
      .form-field input, .form-field select { padding: 8px 10px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #e2e8f0; }
      .action-row { margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap; }
      button, a.btn { border: 0; border-radius: 8px; padding: 10px 18px; font-weight: 700; text-decoration: none; display: inline-block; }
      button { background: #2563eb; color: #fff; cursor: pointer; }
      button[disabled] { opacity: .6; cursor: not-allowed; }
      .danger { background: #b91c1c; }
      a.btn { background: #16a34a; color: #fff; }
      table { width:100%; border-collapse: collapse; margin-top: 8px; }
      th, td { padding: 8px 10px; border-bottom: 1px solid #233147; text-align: left; font-size: .9rem; }
      .metric { font-size:.92rem; margin: 4px 0; }
      .check-row { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
      .pill { display:inline-block; padding:2px 8px; border-radius:999px; font-size:.8rem; border:1px solid #334155; }
      .pill.ok { color:#bbf7d0; border-color:rgba(34,197,94,.4); background:rgba(34,197,94,.12); }
      .pill.err { color:#fecaca; border-color:rgba(239,68,68,.5); background:rgba(239,68,68,.12); }
    </style>
  </head>
  <body>
    <div class="shell">
      <h1>Neutral setup</h1>
      <p class="muted">
        Current setup state: <?= htmlspecialchars((string) ($setupSnapshot['status'] ?? 'SETUP_REQUIRED'), ENT_QUOTES, 'UTF-8') ?> ·
        Installation detected: <?= $installationDetected ? 'yes' : 'no' ?>
      </p>

      <?php foreach ($messages as $message): ?>
        <div class="status ok"><?= htmlspecialchars($message, ENT_QUOTES, 'UTF-8') ?></div>
      <?php endforeach; ?>
      <?php foreach ($errors as $error): ?>
        <div class="status err"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
      <?php endforeach; ?>

      <div class="section panel">
        <h2>Installation detection</h2>
        <div class="grid">
          <div>
            <div class="metric">Database reachable: <?= ((bool) ($installationEvidence['databaseReachable'] ?? false)) ? 'yes' : 'no' ?></div>
            <div class="metric">Migration table ready: <?= ((bool) ($installationEvidence['migrationTableReady'] ?? false)) ? 'yes' : 'no' ?></div>
            <div class="metric">Applied migrations: <?= count(is_array($installationEvidence['appliedMigrations'] ?? null) ? $installationEvidence['appliedMigrations'] : []) ?></div>
          </div>
          <div>
            <?php $usersEvidence = is_array($installationEvidence['users'] ?? null) ? $installationEvidence['users'] : ['total' => 0, 'admin' => 0, 'developer' => 0]; ?>
            <div class="metric">Users total: <?= (int) ($usersEvidence['total'] ?? 0) ?></div>
            <div class="metric">Admins: <?= (int) ($usersEvidence['admin'] ?? 0) ?></div>
            <div class="metric">Developers: <?= (int) ($usersEvidence['developer'] ?? 0) ?></div>
          </div>
        </div>
        <?php if (trim((string) ($installationEvidence['error'] ?? '')) !== ''): ?>
          <div class="status warn"><?= htmlspecialchars((string) $installationEvidence['error'], ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>
      </div>

      <div class="section panel">
        <h2>Step 1 – Install</h2>
        <?php if (!$installationDetected): ?>
          <p class="muted">No installation detected. Run installation to create schema and core data.</p>
          <form method="post" action="<?= htmlspecialchars($runtime->config()->publicUrl('setup.php'), ENT_QUOTES, 'UTF-8') ?>">
            <input type="hidden" name="_csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>" />
            <input type="hidden" name="install_now" value="1" />
            <button type="submit" <?= $readyToInstall ? '' : 'disabled' ?>>Install now</button>
          </form>
          <?php if (!$readyToInstall): ?>
            <div class="status err">Install is currently blocked by failed prerequisites.</div>
          <?php endif; ?>
        <?php else: ?>
          <div class="status ok">Existing installation detected.</div>
        <?php endif; ?>
      </div>

      <?php if ($installationDetected): ?>
        <div class="section panel">
          <h2>Step 2 – Provision server users</h2>
          <p class="muted">Provisioning uses only server-side database/RBAC services.</p>
          <?php if ($lastInventoryError !== ''): ?>
            <div class="status err"><?= htmlspecialchars($lastInventoryError, ENT_QUOTES, 'UTF-8') ?></div>
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

            <form method="post" action="<?= htmlspecialchars($runtime->config()->publicUrl('setup.php'), ENT_QUOTES, 'UTF-8') ?>">
              <input type="hidden" name="_csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>" />
              <input type="hidden" name="configure_users" value="1" />
              <div class="form-grid">
                <div class="panel">
                  <h3>Admin</h3>
                  <div class="form-field">
                    <label for="adminAction">Action</label>
                    <select id="adminAction" name="admin_action">
                      <option value="keep" <?= $adminDefaultAction === 'keep' ? 'selected' : '' ?>>Keep existing admin</option>
                      <option value="reset" <?= $adminDefaultAction === 'reset' ? 'selected' : '' ?>>Reset admin</option>
                      <option value="create" <?= $adminDefaultAction === 'create' ? 'selected' : '' ?>>Create admin</option>
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
                      <option value="skip" selected>Skip</option>
                      <option value="keep">Keep existing developer</option>
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
                <button type="submit">Apply user provisioning</button>
                <a class="btn" href="<?= htmlspecialchars($runtime->config()->publicUrl('admin.php'), ENT_QUOTES, 'UTF-8') ?>">Open admin</a>
              </div>
            </form>
          <?php endif; ?>
        </div>

        <div class="section panel">
          <h2>Full reset (destructive)</h2>
          <div class="status warn">
            This reset deletes Neutral application state from the database (users, roles, permissions, sessions, module state, setup state, audit/release/backup state and migration markers).
            Environment/deploy files are not changed.
          </div>
          <form method="post" action="<?= htmlspecialchars($runtime->config()->publicUrl('setup.php'), ENT_QUOTES, 'UTF-8') ?>">
            <input type="hidden" name="_csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>" />
            <input type="hidden" name="reset_now" value="1" />
            <div class="form-field">
              <label><input type="checkbox" name="reset_confirm_checkbox" value="yes" /> I understand this will erase the Neutral application state.</label>
            </div>
            <div class="form-field">
              <label for="resetConfirmation">Type exactly: RESET NEUTRAL</label>
              <input id="resetConfirmation" type="text" name="reset_confirmation" placeholder="RESET NEUTRAL" />
            </div>
            <div class="action-row">
              <button type="submit" class="danger">Reset application state</button>
            </div>
          </form>
          <?php if (is_array($lastResetResult)): ?>
            <?php $droppedTables = is_array($lastResetResult['droppedTables'] ?? null) ? $lastResetResult['droppedTables'] : []; ?>
            <?php $removedFiles = is_array($lastResetResult['removedFiles'] ?? null) ? $lastResetResult['removedFiles'] : []; ?>
            <div class="status ok">
              Reset completed. Dropped tables: <?= count($droppedTables) ?> · Removed legacy state files: <?= count($removedFiles) ?>
            </div>
          <?php endif; ?>
        </div>
      <?php endif; ?>

      <div class="section panel">
        <h2>Migration state</h2>
        <div class="metric">Status: <?= htmlspecialchars((string) ($migrationState['status'] ?? 'unknown'), ENT_QUOTES, 'UTF-8') ?></div>
        <div class="metric">Message: <?= htmlspecialchars((string) ($migrationState['message'] ?? ''), ENT_QUOTES, 'UTF-8') ?></div>
      </div>

      <div class="section panel">
        <h2>System checks</h2>
        <?php foreach ($checks as $checkName => $check): ?>
          <?php $ok = (bool) (($check['ok'] ?? false) === true); ?>
          <div class="check-row">
            <strong><?= htmlspecialchars((string) $checkName, ENT_QUOTES, 'UTF-8') ?></strong>
            <span class="pill <?= $ok ? 'ok' : 'err' ?>"><?= $ok ? 'PASS' : 'FAIL' ?></span>
            <span class="muted"><?= htmlspecialchars(setup_check_text((string) $checkName, is_array($check) ? $check : []), ENT_QUOTES, 'UTF-8') ?></span>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
  </body>
</html>

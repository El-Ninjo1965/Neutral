<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title data-app-title>Platform Administration</title>
    <link rel="stylesheet" href="<?= htmlspecialchars($runtime->config()->assetUrl('Web-App/public/style.css'), ENT_QUOTES, 'UTF-8') ?>" />
  </head>
  <body data-page="admin" data-theme="light">
    <div id="accessDenied" class="auth-shell hidden">
      <div class="auth-card">
        <h2>Access denied</h2>
        <p class="subtle">Administrative access requires an authorized role.</p>
        <div class="action-list">
          <a class="nav-item" id="backToAppLink" href="<?= htmlspecialchars($runtime->config()->publicUrl(''), ENT_QUOTES, 'UTF-8') ?>">Return to platform</a>
        </div>
      </div>
    </div>

    <div id="authPanel" class="auth-shell">
      <div class="auth-card">
      <h2 data-auth-title>Neutral Framework Administration</h2>
        <p class="subtle">Sign in to access the administrator workspace.</p>
        <div class="form-grid">
          <div class="form-field">
            <label for="loginUsername">Username</label>
            <input id="loginUsername" type="text" autocomplete="username" />
          </div>
          <div class="form-field">
            <label for="loginPassword">Password</label>
            <input id="loginPassword" type="password" value="" />
          </div>
          <div class="action-list">
            <button id="loginBtn" class="primary" type="button">Sign in</button>
          </div>
          <div id="authMessage" class="message info" role="status">Checking the current server session…</div>
        </div>
      </div>
    </div>

    <div id="appShell" class="hidden">
      <div id="mainContent"></div>
    </div>

    <script>window.NeutralConfig = <?= $publicConfigJson ?>;</script>
    <?php
    $scripts = [
        'Web-App/public/public-path.js',
        'Web-App/core/core.js',
        'Web-App/core/core-contracts.js',
        'Web-App/core/core-performance.js',
        'Web-App/core/core-event-bus.js',
        'Web-App/core/core-error-handler.js',
        'Web-App/core/error-log.js',
        'Web-App/core/core-config.js',
        'Web-App/core/core-context.js',
        'Web-App/core/core-lifecycle.js',
        'Web-App/core/core-state.js',
        'Web-App/core/core-storage.js',
        'Web-App/core/module-interface.js',
        'Web-App/core/module-registry.js',
        'Web-App/core/module-manager.js',
        'Web-App/core/core-loader.js',
        'Web-App/core/config-manager.js',
        'Web-App/core/database-manager.js',
        'Web-App/core/security.js',
        'Web-App/core/core-auth.js',
        'Web-App/core/core-access.js',
        'Web-App/core/core-audit.js',
        'Web-App/core/core-event-ring.js',
        'Web-App/core/core-user.js',
        'Web-App/core/core-admin.js',
        'Web-App/core/service-manager.js',
        'Web-App/core/core-network.js',
        'Web-App/core/core-shutdown.js',
        'Web-App/core/core-startup.js',
        'Web-App/core/core-runtime.js',
        'Web-App/core/core-entry.js',
        'Web-App/core/theme-engine.js',
        'Web-App/core/media-manager.js',
        'Web-App/core/local-auth.js',
        'Web-App/core/app.js',
        'Web-App/public/api-client.js',
        'Web-App/public/master-ui.js',
        'Web-App/public/admin/common.js',
        'Web-App/public/admin/users-view.js',
        'Web-App/public/admin/roles-view.js',
        'Web-App/public/admin/settings-view.js',
        'Web-App/public/admin/audit-view.js',
        'Web-App/public/admin/modules-view.js',
        'Web-App/public/admin/navigation.js',
        'Web-App/public/admin/shell.js',
        'Web-App/public/admin/index.js',
        'Web-App/public/admin-init.js',
    ];
    foreach ($scripts as $script):
    ?>
    <script defer src="<?= htmlspecialchars($runtime->config()->assetUrl($script), ENT_QUOTES, 'UTF-8') ?>"></script>
    <?php endforeach; ?>
  </body>
</html>

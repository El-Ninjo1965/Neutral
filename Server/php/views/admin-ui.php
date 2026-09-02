<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title data-app-title>Platform Administration</title>
    <link rel="stylesheet" href="/Web-App/public/style.css" />
  </head>
  <body data-page="admin" data-theme="light">
    <div id="accessDenied" class="auth-shell hidden">
      <div class="auth-card">
        <h2>Access denied</h2>
        <p class="subtle">Administrative access requires an authorized role.</p>
        <div class="action-list">
          <a class="nav-item" id="backToAppLink" href="/Web-App/public/index.html">Return to platform</a>
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
            <input id="loginUsername" type="text" value="admin" />
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

    <script defer src="/Web-App/core/core.js"></script>
    <script defer src="/Web-App/core/core-contracts.js"></script>
    <script defer src="/Web-App/core/core-performance.js"></script>
    <script defer src="/Web-App/core/core-event-bus.js"></script>
    <script defer src="/Web-App/core/core-error-handler.js"></script>
    <script defer src="/Web-App/core/error-log.js"></script>
    <script defer src="/Web-App/core/core-config.js"></script>
    <script defer src="/Web-App/core/core-context.js"></script>
    <script defer src="/Web-App/core/core-lifecycle.js"></script>
    <script defer src="/Web-App/core/core-state.js"></script>
    <script defer src="/Web-App/core/core-storage.js"></script>
    <script defer src="/Web-App/core/module-interface.js"></script>
    <script defer src="/Web-App/core/module-registry.js"></script>
    <script defer src="/Web-App/core/module-manager.js"></script>
    <script defer src="/Web-App/core/core-loader.js"></script>
    <script defer src="/Web-App/core/config-manager.js"></script>
    <script defer src="/Web-App/core/database-manager.js"></script>
    <script defer src="/Web-App/core/security.js"></script>
    <script defer src="/Web-App/core/core-auth.js"></script>
    <script defer src="/Web-App/core/core-access.js"></script>
    <script defer src="/Web-App/core/core-audit.js"></script>
    <script defer src="/Web-App/core/core-event-ring.js"></script>
    <script defer src="/Web-App/core/core-user.js"></script>
    <script defer src="/Web-App/core/core-admin.js"></script>
    <script defer src="/Web-App/core/service-manager.js"></script>
    <script defer src="/Web-App/core/core-network.js"></script>
    <script defer src="/Web-App/core/core-shutdown.js"></script>
    <script defer src="/Web-App/core/core-startup.js"></script>
    <script defer src="/Web-App/core/core-runtime.js"></script>
    <script defer src="/Web-App/core/core-entry.js"></script>
    <script defer src="/Web-App/core/theme-engine.js"></script>
    <script defer src="/Web-App/core/media-manager.js"></script>
    <script defer src="/Web-App/core/local-auth.js"></script>
    <script defer src="/Web-App/core/app.js"></script>

    <script defer src="/Web-App/public/api-client.js"></script>
    <script defer src="/Web-App/public/master-ui.js"></script>
    <script defer src="/Web-App/public/admin/common.js"></script>
    <script defer src="/Web-App/public/admin/users-view.js"></script>
    <script defer src="/Web-App/public/admin/roles-view.js"></script>
    <script defer src="/Web-App/public/admin/settings-view.js"></script>
    <script defer src="/Web-App/public/admin/audit-view.js"></script>
    <script defer src="/Web-App/public/admin/modules-view.js"></script>
    <script defer src="/Web-App/public/admin/navigation.js"></script>
    <script defer src="/Web-App/public/admin/shell.js"></script>
    <script defer src="/Web-App/public/admin/index.js"></script>
    <script defer src="/Web-App/public/admin-init.js"></script>
  </body>
</html>

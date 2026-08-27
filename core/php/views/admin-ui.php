<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title data-app-title>Platform Administration</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body data-page="admin" data-theme="light">
    <div id="accessDenied" class="auth-shell hidden">
      <div class="auth-card">
        <h2>Access denied</h2>
        <p class="subtle">Administrative access requires an authorized role.</p>
        <div class="action-list">
          <a class="nav-item" id="backToAppLink" href="index.html">Return to platform</a>
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
          <div id="authMessage" class="message info">Sign in with your configured bootstrap administrator account.</div>
        </div>
      </div>
    </div>

    <div id="appShell" class="app-shell hidden">
      <main class="main-panel">
        <header class="topbar">
          <div id="topbarTitle" class="topbar-title">Neutral Platform Administration</div>
          <div class="header-actions">
            <button id="themeToggleBtn" class="theme-toggle" type="button" aria-label="Toggle light and dark theme">Dark</button>
            <button id="logoutBtn" class="secondary" type="button">Lockout</button>
          </div>
        </header>
        <div id="mainContent" class="content-wrap"></div>
      </main>
    </div>

    <script src="../platform/core.js"></script>
    <script src="../platform/core-event-bus.js"></script>
    <script src="../platform/core-error-handler.js"></script>
    <script src="../platform/error-log.js"></script>
    <script src="../platform/core-config.js"></script>
    <script src="../platform/core-context.js"></script>
    <script src="../platform/core-lifecycle.js"></script>
    <script src="../platform/core-state.js"></script>
    <script src="../platform/core-storage.js"></script>
    <script src="../platform/module-interface.js"></script>
    <script src="../platform/module-registry.js"></script>
    <script src="../platform/module-manager.js"></script>
    <script src="../platform/core-loader.js"></script>
    <script src="../platform/config-manager.js"></script>
    <script src="../platform/database-manager.js"></script>
    <script src="../platform/security.js"></script>
    <script src="../platform/core-auth.js"></script>
    <script src="../platform/core-access.js"></script>
    <script src="../platform/core-audit.js"></script>
    <script src="../platform/core-event-ring.js"></script>
    <script src="../platform/core-user.js"></script>
    <script src="../platform/core-admin.js"></script>
    <script src="../platform/service-manager.js"></script>
    <script src="../platform/core-startup.js"></script>
    <script src="../platform/core-runtime.js"></script>
    <script src="../platform/core-entry.js"></script>
    <script src="../platform/theme-engine.js"></script>
    <script src="../platform/media-manager.js"></script>
    <script src="../platform/local-auth.js"></script>
    <script src="../platform/app.js"></script>
    <script src="../platform/theme-engine.js"></script>
    <script src="master-ui.js"></script>
    <script src="api-client.js"></script>
    <script src="admin/common.js"></script>
    <script src="admin/users-view.js"></script>
    <script src="admin/roles-view.js"></script>
    <script src="admin/settings-view.js"></script>
    <script src="admin/audit-view.js"></script>
    <script src="admin/modules-view.js"></script>
    <script src="admin/index.js"></script>
    <script src="admin-init.js"></script>
    <script>
      (function () {
        const body = document.body;
        const toggleButton = document.getElementById('themeToggleBtn');
        const storageKey = 'neutral-admin-theme';
        const applyTheme = (themeId) => {
          const nextTheme = themeId === 'dark' ? 'dark' : 'light';
          body.setAttribute('data-theme', nextTheme);
          if (toggleButton) {
            toggleButton.textContent = nextTheme === 'dark' ? 'Light' : 'Dark';
            toggleButton.setAttribute('aria-label', nextTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
          }
          try {
            window.localStorage.setItem(storageKey, nextTheme);
          } catch (error) {
            // Ignore storage failures gracefully.
          }
          if (window.ThemeEngine && typeof window.ThemeEngine.activateTheme === 'function') {
            const targetTheme = window.ThemeEngine.getTheme && window.ThemeEngine.getTheme(nextTheme);
            if (targetTheme) {
              window.ThemeEngine.activateTheme(nextTheme);
            }
          }
        };

        try {
          const storedTheme = window.localStorage.getItem(storageKey);
          applyTheme(storedTheme === 'dark' ? 'dark' : 'light');
        } catch (error) {
          applyTheme('light');
        }

        if (toggleButton) {
          toggleButton.addEventListener('click', () => {
            const currentTheme = body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
          });
        }
      })();
    </script>
  </body>
</html>

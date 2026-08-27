(() => {
  'use strict';

  const content = document.getElementById('userAppContent');
  const nav = document.getElementById('userAppNav');
  const actions = document.getElementById('userAppActions');
  const brand = document.querySelector('.user-app-brand');
  const mark = document.getElementById('userAppMark');
  const state = {
    activeView: 'home',
    activeModuleId: null,
    serverUser: null,
    serverModules: []
  };

  const USER_SETTINGS_KEY = 'neutral.user.preferences.v1';

  const defaultUserPreferences = Object.freeze({
    visibleModuleIds: null,
    privacy: {
      shareLocationContext: false,
      shareImages: false,
      allowOnlineSync: false,
      allowUsageAnalytics: false
    }
  });

  const readUserPreferences = () => {
    try {
      if (typeof localStorage === 'undefined') {
        return JSON.parse(JSON.stringify(defaultUserPreferences));
      }

      const raw = localStorage.getItem(USER_SETTINGS_KEY);
      if (!raw) {
        return JSON.parse(JSON.stringify(defaultUserPreferences));
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return JSON.parse(JSON.stringify(defaultUserPreferences));
      }

      return {
        visibleModuleIds: Array.isArray(parsed.visibleModuleIds) ? parsed.visibleModuleIds.filter((id) => typeof id === 'string' && id.trim()) : null,
        privacy: {
          shareLocationContext: !!parsed.privacy?.shareLocationContext,
          shareImages: !!parsed.privacy?.shareImages,
          allowOnlineSync: !!parsed.privacy?.allowOnlineSync,
          allowUsageAnalytics: !!parsed.privacy?.allowUsageAnalytics
        }
      };
    } catch (error) {
      return JSON.parse(JSON.stringify(defaultUserPreferences));
    }
  };

  const saveUserPreferences = (preferences) => {
    const nextPreferences = {
      visibleModuleIds: Array.isArray(preferences && preferences.visibleModuleIds)
        ? preferences.visibleModuleIds.filter((id) => typeof id === 'string' && id.trim())
        : null,
      privacy: {
        shareLocationContext: !!(preferences && preferences.privacy && preferences.privacy.shareLocationContext),
        shareImages: !!(preferences && preferences.privacy && preferences.privacy.shareImages),
        allowOnlineSync: !!(preferences && preferences.privacy && preferences.privacy.allowOnlineSync),
        allowUsageAnalytics: !!(preferences && preferences.privacy && preferences.privacy.allowUsageAnalytics)
      }
    };

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(nextPreferences));
      }
    } catch (error) {
      // Ignore persistence failures in restricted offline environments.
    }

    return nextPreferences;
  };

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const resolveServerApiBase = () => {
    const metaBase = document.querySelector('meta[name="neutral-api-base"]');
    if (metaBase && metaBase.content && String(metaBase.content).trim()) {
      return String(metaBase.content).trim().replace(/\/+$/, '');
    }

    const configuredBase = (window.NEUTRAL_API_BASE || (window.ConfigManager && typeof window.ConfigManager.get === 'function' ? window.ConfigManager.get('api', {})?.baseUrl : null) || (window.ConfigManager && typeof window.ConfigManager.get === 'function' ? window.ConfigManager.get('app', {})?.serverUrl : null));
    if (typeof configuredBase === 'string' && configuredBase.trim()) {
      return configuredBase.trim().replace(/\/+$/, '');
    }

    const origin = (window.location && window.location.origin && window.location.origin !== 'null')
      ? window.location.origin
      : 'https://www.turbolikes.com';
    const pathname = (window.location && typeof window.location.pathname === 'string') ? window.location.pathname : '/';
    if (pathname.includes('/index/app/neutral/webroot')) {
      return `${origin}/index/app/neutral/webroot`;
    }
    return `${origin}/index/app/neutral/webroot`;
  };

  const getServerApiClient = () => {
    if (!window.ApiClient || typeof window.ApiClient !== 'function') {
      return null;
    }
    return new window.ApiClient(resolveServerApiBase());
  };

  const normalizeServerUser = (userRecord = null, rolesOverride = null, permissionsOverride = null) => {
    if (!userRecord || typeof userRecord !== 'object') {
      return null;
    }

    const roles = Array.isArray(rolesOverride) && rolesOverride.length
      ? rolesOverride
      : (Array.isArray(userRecord.roles) ? userRecord.roles : (typeof userRecord.role === 'string' && userRecord.role.trim() ? [userRecord.role.trim()] : ['user']));
    const permissions = Array.isArray(permissionsOverride) && permissionsOverride.length
      ? permissionsOverride
      : (Array.isArray(userRecord.permissions) ? userRecord.permissions : []);

    return {
      ...userRecord,
      id: userRecord.id || userRecord.userId || 'server-user',
      displayName: userRecord.displayName || userRecord.username || 'User',
      username: userRecord.username || userRecord.displayName || 'user',
      status: userRecord.status || 'active',
      roles: Array.from(new Set(roles.filter(Boolean).map((role) => String(role).trim()).filter(Boolean))),
      permissions: Array.from(new Set(permissions.filter(Boolean).map((permission) => String(permission).trim()).filter(Boolean)))
    };
  };

  const getCurrentUser = () => {
    if (state.serverUser) {
      return state.serverUser;
    }
    if (window.UserModule && typeof window.UserModule.getCurrentUser === 'function') {
      return window.UserModule.getCurrentUser();
    }
    if (window.CoreAuth && typeof window.CoreAuth.getCurrentUser === 'function') {
      return window.CoreAuth.getCurrentUser();
    }
    return null;
  };

  const getAppName = () => {
    const framework = window.MasterFramework && typeof window.MasterFramework.getActiveApp === 'function'
      ? window.MasterFramework
      : null;
    const activeApp = framework ? framework.getActiveApp() : null;
    if (activeApp && typeof activeApp.name === 'string' && activeApp.name.trim()) {
      return activeApp.name.trim();
    }

    const appConfig = window.ConfigManager && typeof window.ConfigManager.get === 'function'
      ? window.ConfigManager.get('app', {})
      : {};
    return appConfig && typeof appConfig.name === 'string' && appConfig.name.trim()
      ? appConfig.name.trim()
      : 'Neutral Platform';
  };

  const getAppMark = () => {
    const name = getAppName().trim();
    return name ? name.charAt(0).toUpperCase() : 'A';
  };

  const getModuleDisplayName = (module) => {
    const explicit = module && (module.displayName || module.manifest?.displayName || module.name || module.id || 'Module');
    return String(explicit || module.id || 'Module').trim() || 'Module';
  };

  const getModules = () => {
    const registryModules = window.ModuleRegistry && typeof window.ModuleRegistry.getAll === 'function'
      ? window.ModuleRegistry.getAll().filter((module) => module && module.id)
      : [];

    const serverModules = Array.isArray(state.serverModules)
      ? state.serverModules.filter((module) => module && module.id)
      : [];

    const merged = [...serverModules, ...registryModules];
    const unique = new Map();
    for (const module of merged) {
      if (!module || !module.id) {
        continue;
      }
      if (!unique.has(module.id)) {
        unique.set(module.id, module);
      }
    }

    return Array.from(unique.values()).filter((module) => {
      const status = String(module.status || '').toLowerCase();
      return module && module.id && (module.active || module.enabled || status === 'enabled' || status === 'active' || status === 'installed' || status === 'available' || status === 'discovered');
    });
  };

  const getActiveAppId = () => {
    const framework = window.MasterFramework && typeof window.MasterFramework.getActiveApp === 'function'
      ? window.MasterFramework
      : null;
    const activeApp = framework ? framework.getActiveApp() : null;
    if (activeApp && typeof activeApp.appId === 'string' && activeApp.appId.trim()) {
      return activeApp.appId.trim();
    }

    const appList = framework && typeof framework.listApps === 'function' ? framework.listApps() : [];
    const firstApp = appList.find((app) => app && app.appId);
    return firstApp && typeof firstApp.appId === 'string' ? firstApp.appId : 'neutral-app';
  };

  const getVisibleModules = () => {
    const modules = getModules();
    const currentUser = getCurrentUser();
    const preferences = readUserPreferences();
    const visibleSet = Array.isArray(preferences.visibleModuleIds)
      ? new Set(preferences.visibleModuleIds)
      : null;

    return modules.filter((module) => {
      if (!module || !module.id) {
        return false;
      }

      const visibilityPermissions = Array.isArray(module.access?.visibilityPermissions) && module.access.visibilityPermissions.length
        ? module.access.visibilityPermissions
        : (Array.isArray(module.permissions) ? module.permissions : []);

      if (!currentUser) {
        const isPublic = module.public === true || module.isPublic === true || module.loginRequired === false || module.requiresLogin === false || module.public !== false;
        if (!isPublic) {
          return false;
        }
      }

      if (visibleSet && !visibleSet.has(module.id)) {
        return false;
      }

      if (currentUser && visibilityPermissions.length) {
        const allowed = visibilityPermissions.some((permission) => Array.isArray(currentUser.permissions) && currentUser.permissions.includes(permission));
        if (!allowed) {
          return false;
        }
      }

      return true;
    });
  };

  const canOpenAdmin = () => {
    const currentUser = getCurrentUser();
    return !!currentUser && Array.isArray(currentUser.roles) && (currentUser.roles.includes('developer') || currentUser.roles.includes('admin'));
  };

  const applyBranding = () => {
    const appName = getAppName();
    document.title = appName;
    const title = document.querySelector('[data-app-title]');
    if (title) title.textContent = appName;
    if (brand) brand.textContent = appName;
    if (mark) mark.textContent = getAppMark();
  };

  const renderActions = () => {
    if (!actions) return;
    const currentUser = getCurrentUser();
    const settingsButton = '<button id="userSettingsButton" class="user-app-link" type="button" aria-label="User settings">⚙ Settings</button>';

    if (!currentUser) {
      actions.innerHTML = `${settingsButton}<button id="userLoginButton" class="user-app-action" type="button">Login</button>`;
      const loginButton = document.getElementById('userLoginButton');
      if (loginButton) {
        loginButton.addEventListener('click', () => {
          showLoginForm();
        });
      }
      const settingsButtonElement = document.getElementById('userSettingsButton');
      if (settingsButtonElement) {
        settingsButtonElement.addEventListener('click', () => {
          state.activeView = 'settings';
          state.activeModuleId = null;
          renderApp();
        });
      }
      return;
    }

    actions.innerHTML = `
      <span class="user-app-session-badge">${escapeHtml(currentUser.displayName || currentUser.username || 'User')}</span>
      ${canOpenAdmin() ? '<a class="user-app-link" href="/index/app/neutral/webroot/admin.php">Admin</a>' : ''}
      ${settingsButton}
      <button id="userLogoutButton" class="user-app-link" type="button">Logout</button>
    `;
    const logoutButton = document.getElementById('userLogoutButton');
    if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
        const apiClient = getServerApiClient();
        if (apiClient && typeof apiClient.logout === 'function') {
          await apiClient.logout();
        } else if (window.UserModule && typeof window.UserModule.logout === 'function') {
          await window.UserModule.logout();
        }
        state.serverUser = null;
        state.activeView = 'home';
        state.activeModuleId = null;
        renderApp();
      });
    }
    const settingsButtonElement = document.getElementById('userSettingsButton');
    if (settingsButtonElement) {
      settingsButtonElement.addEventListener('click', () => {
        state.activeView = 'settings';
        state.activeModuleId = null;
        renderApp();
      });
    }
  };

  const renderModuleNav = () => {
    if (!nav) return;
    const modules = getVisibleModules();
    const items = [
      { id: 'home', label: getAppName() },
      ...modules.map((module) => ({ id: `module:${module.id}`, label: getModuleDisplayName(module) }))
    ];
    nav.innerHTML = items.map((item) => `
      <button
        type="button"
        class="user-app-nav-item ${state.activeView === item.id ? 'active' : ''}"
        data-user-nav="${escapeHtml(item.id)}"
      >${escapeHtml(item.label)}</button>
    `).join('');
    nav.querySelectorAll('[data-user-nav]').forEach((button) => {
      button.addEventListener('click', () => {
        const nextView = button.dataset.userNav;
        state.activeView = nextView;
        state.activeModuleId = nextView.startsWith('module:') ? nextView.slice('module:'.length) : null;
        renderApp();
      });
    });
  };

  const loadServerModules = async () => {
    const apiClient = getServerApiClient();
    if (!apiClient || typeof apiClient.discoverModules !== 'function') {
      return [];
    }

    try {
      const result = await apiClient.discoverModules();
      const moduleList = result && result.ok && Array.isArray(result.data && result.data.modules)
        ? result.data.modules
        : (Array.isArray(result && result.data) ? result.data : []);
      const normalizedModules = moduleList
        .filter((module) => module && typeof module === 'object' && module.id)
        .map((module) => ({
          ...module,
          id: String(module.id),
          status: module.status || 'available',
          active: !!module.active || module.status === 'active' || module.status === 'enabled',
          enabled: !!module.enabled || !!module.active || module.status === 'active' || module.status === 'enabled',
          public: module.public !== undefined ? !!module.public : module.isPublic !== undefined ? !!module.isPublic : (module.loginRequired === false || module.requiresLogin === false),
          loginRequired: module.loginRequired !== undefined ? !!module.loginRequired : (module.requiresLogin !== undefined ? !!module.requiresLogin : false)
        }));
      state.serverModules = Array.isArray(normalizedModules) ? normalizedModules : [];
      return state.serverModules;
    } catch (error) {
      state.serverModules = [];
      return [];
    }
  };

  const refreshServerSession = async () => {
    const apiClient = getServerApiClient();
    if (!apiClient || typeof apiClient.me !== 'function') {
      state.serverUser = null;
      return null;
    }

    try {
      const result = await apiClient.me();
      const payload = result && result.data && typeof result.data === 'object' ? result.data : {};
      if (!result || !result.ok || !payload.user) {
        state.serverUser = null;
        return null;
      }

      state.serverUser = normalizeServerUser(payload.user, payload.roles, payload.permissions || payload.user.permissions || []);
      return state.serverUser;
    } catch (error) {
      state.serverUser = null;
      return null;
    }
  };

  const showLoginForm = () => {
    state.activeView = 'login';
    state.activeModuleId = null;
    content.innerHTML = `
      <section class="user-app-panel">
        <span class="user-app-eyebrow">Account access</span>
        <h1>Sign in</h1>
        <p>Use your existing server account to unlock available features.</p>
        <div class="user-login-form">
          <div class="form-field">
            <label for="userLoginUsername">Username</label>
            <input id="userLoginUsername" type="text" value="" autocomplete="username" />
          </div>
          <div class="form-field">
            <label for="userLoginPassword">Password</label>
            <input id="userLoginPassword" type="password" autocomplete="current-password" />
          </div>
          <div class="user-login-actions">
            <button type="button" id="userLoginSubmit" class="primary">Login</button>
          </div>
          <div id="userLoginStatus" class="message info">Sign in with your server account to unlock personalized features.</div>
        </div>
      </section>
    `;

    const submit = document.getElementById('userLoginSubmit');
    submit.addEventListener('click', async () => {
      const username = document.getElementById('userLoginUsername').value.trim();
      const password = document.getElementById('userLoginPassword').value;
      const status = document.getElementById('userLoginStatus');

      if (!window.ApiClient || typeof window.ApiClient !== 'function') {
        status.className = 'message error';
        status.textContent = 'Server authentication is not available in this environment.';
        return;
      }

      const apiClient = getServerApiClient();
      if (!apiClient || typeof apiClient.login !== 'function') {
        status.className = 'message error';
        status.textContent = 'Server authentication is not available in this environment.';
        return;
      }

      const result = await apiClient.login(username, password);
      if (!result || !result.ok) {
        status.className = 'message error';
        status.textContent = (result && result.error) || (result && result.data && result.data.message) || 'Authentication failed.';
        return;
      }

      const user = normalizeServerUser(result.data && result.data.user ? result.data.user : null, result.data && result.data.roles, result.data && result.data.permissions);
      if (!user) {
        status.className = 'message error';
        status.textContent = 'Login succeeded but the server user record could not be loaded.';
        return;
      }

      state.serverUser = user;
      await loadServerModules();
      status.className = 'message success';
      status.textContent = 'Signed in successfully.';
      state.activeView = 'home';
      renderApp();
    });
  };

  const renderUserSettings = () => {
    const modules = getModules();
    const preferences = readUserPreferences();
    const hasExplicitVisibility = Array.isArray(preferences.visibleModuleIds);
    const moduleVisibility = hasExplicitVisibility
      ? new Set(preferences.visibleModuleIds)
      : new Set(modules.map((module) => module.id));

    content.innerHTML = `
      <section class="user-app-panel">
        <button class="user-app-back" type="button" id="userSettingsBackButton">Back</button>
        <div class="user-app-section-heading">
          <div>
            <span class="user-app-eyebrow">Profile</span>
            <h1>Settings</h1>
          </div>
          <span class="user-app-count">${modules.length}</span>
        </div>
        <div class="user-settings-card">
          <h2>Functions</h2>
          <p>Choose which features should remain visible in your current workspace menu.</p>
          <div class="user-settings-module-list">
            ${modules.length ? modules.map((module) => `
              <label class="user-settings-toggle" for="module-toggle-${escapeHtml(module.id)}">
                <input id="module-toggle-${escapeHtml(module.id)}" type="checkbox" data-user-setting-module="${escapeHtml(module.id)}" ${moduleVisibility.has(module.id) ? 'checked' : ''} />
                <span>
                  <strong>${escapeHtml(getModuleDisplayName(module))}</strong>
                  <small>${escapeHtml(module.description || 'Feature available in this app.')}</small>
                </span>
              </label>
            `).join('') : '<p class="user-app-empty">No active modules are available yet.</p>'}
          </div>
        </div>
        <div class="user-settings-card">
          <h2>Privacy and sharing</h2>
          <div class="user-settings-list">
            <label class="user-settings-toggle" for="setting-location-context">
              <input id="setting-location-context" type="checkbox" data-user-setting-privacy="shareLocationContext" ${preferences.privacy.shareLocationContext ? 'checked' : ''} />
              <span>Allow location context sharing</span>
            </label>
            <label class="user-settings-toggle" for="setting-media-sharing">
              <input id="setting-media-sharing" type="checkbox" data-user-setting-privacy="shareImages" ${preferences.privacy.shareImages ? 'checked' : ''} />
              <span>Allow image and media sharing</span>
            </label>
            <label class="user-settings-toggle" for="setting-online-sync">
              <input id="setting-online-sync" type="checkbox" data-user-setting-privacy="allowOnlineSync" ${preferences.privacy.allowOnlineSync ? 'checked' : ''} />
              <span>Enable online sync when available</span>
            </label>
            <label class="user-settings-toggle" for="setting-analytics">
              <input id="setting-analytics" type="checkbox" data-user-setting-privacy="allowUsageAnalytics" ${preferences.privacy.allowUsageAnalytics ? 'checked' : ''} />
              <span>Allow usage analytics for product improvements</span>
            </label>
          </div>
        </div>
        <div class="user-settings-actions">
          <button id="userSettingsSaveButton" type="button" class="primary">Save settings</button>
          <button id="userSettingsResetButton" type="button" class="secondary">Show all functions</button>
        </div>
        <p id="userSettingsStatus" class="user-settings-status">Changes are stored locally in this workspace.</p>
      </section>
    `;

    const backButton = document.getElementById('userSettingsBackButton');
    if (backButton) {
      backButton.addEventListener('click', () => {
        state.activeView = 'home';
        state.activeModuleId = null;
        renderApp();
      });
    }

    const saveButton = document.getElementById('userSettingsSaveButton');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        const moduleSelection = Array.from(document.querySelectorAll('[data-user-setting-module]:checked')).map((input) => input.dataset.userSettingModule).filter(Boolean);
        const privacySelection = {};
        document.querySelectorAll('[data-user-setting-privacy]').forEach((input) => {
          privacySelection[input.dataset.userSettingPrivacy] = !!input.checked;
        });

        const nextPreferences = saveUserPreferences({
          visibleModuleIds: moduleSelection,
          privacy: privacySelection
        });

        const status = document.getElementById('userSettingsStatus');
        if (status) {
          status.textContent = 'Settings saved successfully.';
          status.className = 'user-settings-status success';
        }

        if (Object.keys(nextPreferences.privacy).some((key) => nextPreferences.privacy[key])) {
          const currentUser = getCurrentUser();
          if (currentUser && window.UserModule && typeof window.UserModule.updateProfile === 'function') {
            window.UserModule.updateProfile({ privacy: nextPreferences.privacy });
          }
        }

        renderApp();
      });
    }

    const resetButton = document.getElementById('userSettingsResetButton');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        const moduleIds = getModules().map((module) => module.id);
        saveUserPreferences({ visibleModuleIds: moduleIds, privacy: defaultUserPreferences.privacy });
        state.activeView = 'home';
        state.activeModuleId = null;
        renderApp();
      });
    }
  };

  const renderModule = (moduleId) => {
    const module = getVisibleModules().find((entry) => entry.id === moduleId) || getModules().find((entry) => entry.id === moduleId);
    if (!module) {
      state.activeView = 'home';
      state.activeModuleId = null;
      renderLandingPage();
      return;
    }

    state.activeView = `module:${moduleId}`;
    state.activeModuleId = moduleId;
    content.innerHTML = `
      <section class="user-app-panel">
        <button class="user-app-back" type="button" id="userModuleBackButton">Back</button>
        <div class="user-app-section-heading">
          <div>
            <span class="user-app-eyebrow">Module</span>
            <h1>${escapeHtml(getModuleDisplayName(module))}</h1>
          </div>
          <span class="user-app-count">${escapeHtml(moduleId)}</span>
        </div>
        <div class="user-app-module-intro">${escapeHtml(module.description || 'This module is active in the current application.')}</div>
        <div id="moduleUserInterface"></div>
      </section>
    `;
    const target = document.getElementById('moduleUserInterface');
    if (typeof module.renderUserInterface === 'function') {
      module.renderUserInterface(target);
    } else {
      target.innerHTML = '<span class="user-app-eyebrow">Module</span><h1>' + escapeHtml(getModuleDisplayName(module)) + '</h1><p>This module does not provide a user interface.</p>';
    }
    const backButton = document.getElementById('userModuleBackButton');
    if (backButton) {
      backButton.addEventListener('click', () => {
        state.activeView = 'home';
        state.activeModuleId = null;
        renderApp();
      });
    }
    content.focus();
  };

  const renderLandingPage = () => {
    const appName = getAppName();
    const modules = getVisibleModules();
    const currentUser = getCurrentUser();
    content.innerHTML = `
      <section class="user-app-panel">
        <div class="user-app-section-heading">
          <div>
            <span class="user-app-eyebrow">Welcome</span>
            <h1>${escapeHtml(appName)}</h1>
          </div>
          <span class="user-app-count">${modules.length}</span>
        </div>
        <p class="user-app-intro">The active modules of this application appear directly in the top menu and can also be opened from the workspace below.</p>
        ${currentUser ? `<div class="user-app-status">Signed in as ${escapeHtml(currentUser.displayName || currentUser.username || 'User')} (${escapeHtml((currentUser.roles || ['user']).join(', '))})</div>` : '<div class="user-app-status">You can already use public modules without signing in. Sign in to unlock personalized administration and role-based features.</div>'}
        <div class="user-module-list" style="margin-top: 22px;">
          ${modules.length ? modules.map((module) => `
            <button type="button" class="user-module-card" data-module-card="${escapeHtml(module.id)}">
              <span class="user-module-icon">${escapeHtml((getModuleDisplayName(module).charAt(0) || 'M').toUpperCase())}</span>
              <span class="user-module-copy">
                <strong>${escapeHtml(getModuleDisplayName(module))}</strong>
                <small>${escapeHtml(module.description || 'Open this module in the current application.')}</small>
              </span>
              <span class="user-module-arrow" aria-hidden="true">›</span>
            </button>
          `).join('') : '<div class="user-app-empty">No modules are active yet. Activate modules in the admin area to make them available here.</div>'}
        </div>
      </section>
    `;
    content.querySelectorAll('[data-module-card]').forEach((button) => {
      button.addEventListener('click', () => {
        renderModule(button.dataset.moduleCard);
      });
    });
  };

  const renderApp = () => {
    applyBranding();
    renderActions();
    renderModuleNav();

    if (state.activeView === 'login') {
      showLoginForm();
      return;
    }

    if (state.activeView === 'settings') {
      renderUserSettings();
      return;
    }

    if (state.activeModuleId) {
      renderModule(state.activeModuleId);
      return;
    }

    renderLandingPage();
  };

  const start = async () => {
    if (window.CoreStartup && typeof window.CoreStartup.start === 'function') await window.CoreStartup.start();
    await refreshServerSession();
    await loadServerModules();
    if (window.ModuleManager && typeof window.ModuleManager.discoverModules === 'function') await window.ModuleManager.discoverModules();
    renderApp();
  };

  start();
})();

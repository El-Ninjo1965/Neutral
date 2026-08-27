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
    moduleCatalog: [],
    moduleCatalogLoaded: false
  };

  const USER_SETTINGS_KEY = 'neutral.user.preferences.v1';
  const MODULE_INSTALL_STATE_KEY = 'neutral.module.installs.v1';

  const defaultUserPreferences = Object.freeze({
    visibleModuleIds: null,
    privacy: {
      shareLocationContext: false,
      shareImages: false,
      allowOnlineSync: false,
      allowUsageAnalytics: false
    }
  });
  let serverAuthenticatedUser = null;

  const extractApiData = (result) => {
    if (!result || result.ok !== true || !result.data || typeof result.data !== 'object') {
      return null;
    }
    const envelope = result.data;
    if (envelope.ok !== true || !envelope.data || typeof envelope.data !== 'object') {
      return null;
    }
    return envelope.data;
  };

  const resolveRuntimeApiClientBase = () => {
    const origin = (window.location && window.location.origin && window.location.origin !== 'null')
      ? window.location.origin.replace(/\/+$/, '')
      : (window.location && window.location.protocol && window.location.hostname)
        ? `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`.replace(/\/+$/, '')
        : '';
    const pathname = window.location && typeof window.location.pathname === 'string'
      ? window.location.pathname
      : '/';
    const basePath = pathname.endsWith('/')
      ? pathname.replace(/\/+$/, '')
      : pathname.replace(/\/[^/]*$/, '');
    const normalizedBasePath = (!basePath || basePath === '/') ? '' : basePath.replace(/\/+$/, '');
    if (!origin) {
      return normalizedBasePath ? normalizedBasePath : '/';
    }
    return `${origin}${normalizedBasePath}`;
  };

  const createServerApiClient = () => typeof window.ApiClient === 'function'
    ? new window.ApiClient(resolveRuntimeApiClientBase())
    : null;

  const isLocalPreviewRuntime = () => {
    const protocol = window.location && typeof window.location.protocol === 'string'
      ? window.location.protocol
      : '';
    const hostname = window.location && typeof window.location.hostname === 'string'
      ? window.location.hostname.toLowerCase()
      : '';
    return protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1';
  };

  const applyServerIdentity = (identityData) => {
    const userRecord = identityData && identityData.user && typeof identityData.user === 'object'
      ? identityData.user
      : null;
    if (!userRecord) {
      return null;
    }

    const resolvedRoles = Array.isArray(identityData.roles) && identityData.roles.length
      ? identityData.roles
      : (Array.isArray(userRecord.roles) ? userRecord.roles : []);
    const resolvedPermissions = Array.isArray(identityData.permissions) && identityData.permissions.length
      ? identityData.permissions
      : (Array.isArray(userRecord.permissions) ? userRecord.permissions : []);

    const normalizedUser = {
      ...userRecord,
      roles: Array.from(new Set(resolvedRoles.map((role) => String(role || '').trim()).filter(Boolean))),
      permissions: Array.from(new Set(resolvedPermissions.map((permission) => String(permission || '').trim()).filter(Boolean))),
      status: typeof userRecord.status === 'string' && userRecord.status.trim() ? userRecord.status : 'active'
    };

    const normalizedSession = {
      sessionId: 'server-session',
      status: 'active',
      authContext: {
        source: 'server-session'
      }
    };

    serverAuthenticatedUser = normalizedUser;
    if (window.CoreAuth && typeof window.CoreAuth === 'object') {
      window.CoreAuth.currentUser = normalizedUser;
      window.CoreAuth.currentSession = normalizedSession;
    }
    if (window.UserModule && typeof window.UserModule === 'object') {
      window.UserModule.currentUser = normalizedUser;
      window.UserModule.currentSession = normalizedSession;
    }

    return normalizedUser;
  };

  const clearServerIdentity = () => {
    serverAuthenticatedUser = null;
    if (window.CoreAuth && typeof window.CoreAuth === 'object') {
      window.CoreAuth.currentUser = null;
      window.CoreAuth.currentSession = null;
    }
    if (window.UserModule && typeof window.UserModule === 'object') {
      window.UserModule.currentUser = null;
      window.UserModule.currentSession = null;
    }
  };

  const syncServerSession = async () => {
    clearServerIdentity();
    const apiClient = createServerApiClient();
    if (!apiClient) {
      return null;
    }

    const sessionResult = await apiClient.me();
    const sessionData = extractApiData(sessionResult);
    if (!sessionResult.ok || !sessionData || !sessionData.user) {
      return null;
    }

    return applyServerIdentity({
      user: sessionData.user,
      roles: Array.isArray(sessionData.roles) ? sessionData.roles : [],
      permissions: Array.isArray(sessionData.permissions) ? sessionData.permissions : []
    });
  };

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

  const compareVersion = (left, right) => {
    const leftParts = String(left || '').split('.').map((part) => Number.parseInt(part, 10));
    const rightParts = String(right || '').split('.').map((part) => Number.parseInt(part, 10));
    const length = Math.max(leftParts.length, rightParts.length);
    for (let index = 0; index < length; index += 1) {
      const l = Number.isFinite(leftParts[index]) ? leftParts[index] : 0;
      const r = Number.isFinite(rightParts[index]) ? rightParts[index] : 0;
      if (l < r) return -1;
      if (l > r) return 1;
    }
    return 0;
  };

  const readInstalledModuleState = () => {
    if (typeof localStorage === 'undefined') {
      return {};
    }
    try {
      const raw = localStorage.getItem(MODULE_INSTALL_STATE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      if (window.CoreErrorHandler && typeof window.CoreErrorHandler.handle === 'function') {
        window.CoreErrorHandler.handle(error, {
          component: 'UserApp',
          operation: 'readInstalledModuleState'
        });
      }
      return {};
    }
  };

  const saveInstalledModuleState = (nextState) => {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(MODULE_INSTALL_STATE_KEY, JSON.stringify(nextState));
    } catch (error) {
      if (window.CoreErrorHandler && typeof window.CoreErrorHandler.handle === 'function') {
        window.CoreErrorHandler.handle(error, {
          component: 'UserApp',
          operation: 'saveInstalledModuleState'
        });
      }
    }
  };

  const upsertInstalledModuleState = (moduleId, nextModuleState) => {
    if (!moduleId) {
      return;
    }
    const installed = readInstalledModuleState();
    if (!nextModuleState) {
      delete installed[moduleId];
      saveInstalledModuleState(installed);
      return;
    }
    installed[moduleId] = {
      ...(installed[moduleId] && typeof installed[moduleId] === 'object' ? installed[moduleId] : {}),
      ...nextModuleState,
      updatedAt: new Date().toISOString()
    };
    saveInstalledModuleState(installed);
  };

  const normalizeCatalogModule = (module) => {
    const installedState = readInstalledModuleState();
    const local = module && module.id && installedState[module.id] && typeof installedState[module.id] === 'object'
      ? installedState[module.id]
      : {};
    const installed = !!(module && (module.installed === true || module.registered === true || module.status === 'installed' || module.status === 'inactive' || module.status === 'active')) || !!local.installed;
    const active = !!(module && (module.active === true || module.status === 'active' || module.status === 'enabled' || module.lifecycleState === 'ACTIVE')) || (installed && local.active === true);
    const disabled = installed && !active;
    const available = module ? module.available !== false : false;
    const latestVersion = String(module && module.version ? module.version : local.version || '1.0.0');
    const installedVersion = String(module && module.installedVersion ? module.installedVersion : local.installedVersion || local.version || '');
    const updateAvailable = !!(module && module.updateAvailable) || (!!installedVersion && compareVersion(installedVersion, latestVersion) < 0);
    const stateName = !installed ? 'available' : (active ? 'active' : 'disabled');

    return {
      ...module,
      id: String(module && module.id ? module.id : ''),
      name: String(module && (module.displayName || module.name || module.id) ? (module.displayName || module.name || module.id) : 'Module'),
      available,
      installed,
      active,
      disabled,
      updateAvailable,
      state: module && typeof module.state === 'string' && module.state.trim() ? module.state : stateName,
      latestVersion,
      installedVersion: installedVersion || null
    };
  };

  const getModuleCatalog = () => Array.isArray(state.moduleCatalog) ? state.moduleCatalog : [];

  const syncInstalledStateFromCatalog = (catalog) => {
    const installedState = readInstalledModuleState();
    catalog.forEach((module) => {
      if (!module || !module.id) {
        return;
      }
      if (!module.installed) {
        delete installedState[module.id];
        return;
      }
      installedState[module.id] = {
        ...(installedState[module.id] && typeof installedState[module.id] === 'object' ? installedState[module.id] : {}),
        installed: true,
        active: !!module.active,
        version: module.latestVersion || module.version || '',
        installedVersion: module.installedVersion || module.latestVersion || module.version || ''
      };
    });
    saveInstalledModuleState(installedState);
  };

  const loadModuleCatalog = async () => {
    const apiClient = createServerApiClient();
    if (!apiClient) {
      const offlineInstalled = readInstalledModuleState();
      state.moduleCatalog = Object.keys(offlineInstalled).map((moduleId) => normalizeCatalogModule({
        id: moduleId,
        name: moduleId,
        available: false,
        installed: true,
        active: !!offlineInstalled[moduleId].active,
        status: offlineInstalled[moduleId].active ? 'active' : 'inactive',
        version: offlineInstalled[moduleId].version || '1.0.0',
        installedVersion: offlineInstalled[moduleId].installedVersion || offlineInstalled[moduleId].version || '1.0.0'
      }));
      state.moduleCatalogLoaded = true;
      return state.moduleCatalog;
    }

    const moduleResult = await apiClient.discoverModules();
    const moduleData = extractApiData(moduleResult);
    const catalog = Array.isArray(moduleData && moduleData.modules) ? moduleData.modules : [];
    state.moduleCatalog = catalog.map((module) => normalizeCatalogModule(module));
    syncInstalledStateFromCatalog(state.moduleCatalog);
    state.moduleCatalogLoaded = true;
    return state.moduleCatalog;
  };

  const refreshModuleRuntime = async () => {
    await loadModuleCatalog();
    if (window.ModuleManager && typeof window.ModuleManager.discoverModules === 'function') {
      await window.ModuleManager.discoverModules();
    }
  };

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const getCurrentUser = () => {
    if (serverAuthenticatedUser) {
      return serverAuthenticatedUser;
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

  const getModules = () => window.ModuleRegistry && typeof window.ModuleRegistry.getAll === 'function'
    ? window.ModuleRegistry.getAll().filter((module) => module && module.id && (module.active || module.status === 'enabled' || module.status === 'active'))
    : [];

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

  const canManageModuleLifecycle = () => canOpenAdmin();

  const updateInstalledStateFromModule = (module) => {
    if (!module || !module.id) {
      return;
    }
    if (!module.installed) {
      upsertInstalledModuleState(module.id, null);
      return;
    }
    upsertInstalledModuleState(module.id, {
      installed: true,
      active: !!module.active,
      version: module.latestVersion || module.version || '',
      installedVersion: module.installedVersion || module.latestVersion || module.version || ''
    });
  };

  const runModuleAction = async (action, moduleId) => {
    const apiClient = createServerApiClient();
    if (!apiClient) {
      return { ok: false, message: 'Module lifecycle actions require a server connection.' };
    }
    if (!canManageModuleLifecycle()) {
      return { ok: false, message: 'Insufficient privileges for module lifecycle actions.' };
    }

    let result = null;
    if (action === 'install') {
      result = await apiClient.installPublicModule(moduleId);
    } else if (action === 'activate') {
      result = await apiClient.activatePublicModule(moduleId);
    } else if (action === 'disable') {
      result = await apiClient.disablePublicModule(moduleId);
    } else if (action === 'uninstall') {
      result = await apiClient.uninstallPublicModule(moduleId);
    } else if (action === 'update') {
      result = await apiClient.installPublicModule(moduleId);
    } else {
      return { ok: false, message: `Unknown module action: ${action}` };
    }

    const payload = extractApiData(result);
    const updatedModule = payload && payload.module ? normalizeCatalogModule(payload.module) : null;
    if (updatedModule) {
      updateInstalledStateFromModule(updatedModule);
    }

    await refreshModuleRuntime();
    return result && result.ok
      ? { ok: true, module: updatedModule }
      : { ok: false, message: result && result.error ? result.error : 'Module lifecycle action failed.' };
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
      ${canOpenAdmin() ? '<a class="user-app-link" href="admin.php">Admin</a>' : ''}
      ${settingsButton}
      <button id="userLogoutButton" class="user-app-link" type="button">Logout</button>
    `;
    const logoutButton = document.getElementById('userLogoutButton');
    if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
        const apiClient = createServerApiClient();
        if (apiClient) {
          await apiClient.logout();
          clearServerIdentity();
          await refreshModuleRuntime();
        }
        if (isLocalPreviewRuntime() && window.LocalAuth && typeof window.LocalAuth.logout === 'function') {
          await window.LocalAuth.logout();
        } else if (window.UserModule && typeof window.UserModule.logout === 'function') {
          await window.UserModule.logout();
        }
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

  const showLoginForm = () => {
    state.activeView = 'login';
    state.activeModuleId = null;
    content.innerHTML = `
      <section class="user-app-panel">
        <span class="user-app-eyebrow">Account access</span>
        <h1>Sign in</h1>
        <p>Sign in with your server account to unlock personalized modules, roles, and administration.</p>
        <div class="user-login-form">
          <div class="form-field">
            <label for="userLoginUsername">Username</label>
            <input id="userLoginUsername" type="text" value="" placeholder="Enter your production username" autocomplete="username" />
          </div>
          <div class="form-field">
            <label for="userLoginPassword">Password</label>
            <input id="userLoginPassword" type="password" placeholder="Enter your production password" autocomplete="current-password" />
          </div>
          <div class="user-login-actions">
            <button type="button" id="userLoginSubmit" class="primary">Login</button>
          </div>
          <div id="userLoginStatus" class="message info">Use your production account for this deployment. Local bootstrap credentials are not used here.</div>
        </div>
      </section>
    `;

    const submit = document.getElementById('userLoginSubmit');
    submit.addEventListener('click', async () => {
      const username = document.getElementById('userLoginUsername').value.trim();
      const password = document.getElementById('userLoginPassword').value;
      const status = document.getElementById('userLoginStatus');
      const apiClient = createServerApiClient();

      if (apiClient) {
        status.className = 'message info';
        status.textContent = 'Signing in...';
        const loginResult = await apiClient.login(username, password);
        const loginData = extractApiData(loginResult);
        if (!loginResult.ok || !loginData) {
          status.className = 'message error';
          status.textContent = loginResult && loginResult.data && loginResult.data.error && loginResult.data.error.message
            ? loginResult.data.error.message
            : (loginResult && loginResult.error ? loginResult.error : 'Server authentication failed.');
          return;
        }

        const meResult = await apiClient.me();
        const meData = extractApiData(meResult);
        const user = applyServerIdentity({
          user: (meData && meData.user) || loginData.user || null,
          roles: meData && Array.isArray(meData.roles) ? meData.roles : loginData.roles,
          permissions: meData && Array.isArray(meData.permissions) ? meData.permissions : loginData.permissions
        });
        if (!meResult.ok || !user) {
          status.className = 'message error';
          status.textContent = meResult && meResult.error ? meResult.error : 'Server session could not be established.';
          return;
        }

        await refreshModuleRuntime();
        status.className = 'message success';
        status.textContent = 'Signed in successfully.';
        state.activeView = 'home';
        renderApp();
        return;
      }

      if (!isLocalPreviewRuntime() || !window.LocalAuth || typeof window.LocalAuth.login !== 'function') {
        status.className = 'message error';
        status.textContent = 'Server authentication is not available for this deployment.';
        return;
      }

      const result = await window.LocalAuth.login({ username, password });
      if (!result || !result.ok) {
        status.className = 'message error';
        status.textContent = result && result.message ? result.message : 'Authentication failed.';
        return;
      }

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
    const catalog = getModuleCatalog();
    const availableCount = catalog.filter((module) => module.available).length;
    const installedCount = catalog.filter((module) => module.installed).length;
    const activeCount = catalog.filter((module) => module.active).length;
    const updateCount = catalog.filter((module) => module.updateAvailable).length;
    const currentUser = getCurrentUser();
    const lifecycleControlsEnabled = !!currentUser && canManageModuleLifecycle();

    const renderLifecycleActions = (module) => {
      if (!lifecycleControlsEnabled) {
        return '';
      }
      const actions = [];
      if (!module.installed) {
        actions.push('<button type="button" class="secondary" data-module-action="install" data-module-id="' + escapeHtml(module.id) + '">Install</button>');
      } else {
        if (module.active) {
          actions.push('<button type="button" class="secondary" data-module-action="disable" data-module-id="' + escapeHtml(module.id) + '">Disable</button>');
        } else {
          actions.push('<button type="button" class="secondary" data-module-action="activate" data-module-id="' + escapeHtml(module.id) + '">Activate</button>');
        }
        actions.push('<button type="button" class="secondary" data-module-action="uninstall" data-module-id="' + escapeHtml(module.id) + '">Uninstall</button>');
      }
      if (module.updateAvailable) {
        actions.push('<button type="button" class="secondary" data-module-action="update" data-module-id="' + escapeHtml(module.id) + '">Update</button>');
      }
      return actions.join('');
    };

    const catalogList = catalog.length
      ? catalog.map((module) => `
          <div class="user-settings-toggle" data-module-catalog-row="${escapeHtml(module.id)}">
            <span>
              <strong>${escapeHtml(module.name || module.id)}</strong>
              <small>State: ${escapeHtml(module.state || 'available')} · Installed: ${module.installed ? 'yes' : 'no'} · Active: ${module.active ? 'yes' : 'no'}${module.updateAvailable ? ' · Update available' : ''}</small>
            </span>
            <span class="user-settings-actions-inline">${renderLifecycleActions(module)}</span>
          </div>
        `).join('')
      : '<div class="user-app-empty">No modules are available from the server catalog.</div>';

    content.innerHTML = `
      <section class="user-app-panel">
        <div class="user-app-section-heading">
          <div>
            <span class="user-app-eyebrow">Welcome</span>
            <h1>${escapeHtml(appName)}</h1>
          </div>
          <span class="user-app-count">${activeCount}</span>
        </div>
        <p class="user-app-intro">The active modules of this application appear directly in the top menu and can also be opened from the workspace below.</p>
        <div class="user-app-status">Catalog: ${availableCount} available · ${installedCount} installed · ${activeCount} active${updateCount ? ` · ${updateCount} updates` : ''}</div>
        ${currentUser ? `<div class="user-app-status">Signed in as ${escapeHtml(currentUser.displayName || currentUser.username || 'User')} (${escapeHtml((currentUser.roles || ['user']).join(', '))})</div>` : '<div class="user-app-status">You can already use public modules without signing in. Sign in to unlock personalized administration and role-based features.</div>'}
        <div class="user-settings-card" style="margin-top: 14px;">
          <h2>Module catalog</h2>
          <p>Server-managed modules stay available in this lightweight client. Install, activate, disable and uninstall run through the server API.</p>
          <div class="user-settings-module-list">${catalogList}</div>
        </div>
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
        <p id="moduleCatalogStatus" class="user-settings-status">${lifecycleControlsEnabled ? 'Module lifecycle actions are available for your role.' : 'Sign in with an admin/developer role to manage module lifecycle actions.'}</p>
      </section>
    `;
    content.querySelectorAll('[data-module-card]').forEach((button) => {
      button.addEventListener('click', () => {
        renderModule(button.dataset.moduleCard);
      });
    });
    content.querySelectorAll('[data-module-action]').forEach((button) => {
      button.addEventListener('click', async () => {
        const action = String(button.dataset.moduleAction || '').trim();
        const moduleId = String(button.dataset.moduleId || '').trim();
        const status = document.getElementById('moduleCatalogStatus');
        if (!action || !moduleId) {
          return;
        }
        if (status) {
          status.textContent = `Running ${action} for ${moduleId}...`;
          status.className = 'user-settings-status';
        }
        const result = await runModuleAction(action, moduleId);
        if (status) {
          status.textContent = result.ok
            ? `Module ${moduleId} ${action} completed.`
            : (result.message || `Module ${moduleId} ${action} failed.`);
          status.className = result.ok ? 'user-settings-status success' : 'user-settings-status error';
        }
        renderApp();
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
    await syncServerSession();
    await refreshModuleRuntime();
    renderApp();
  };

  start();
})();

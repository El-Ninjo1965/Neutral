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
    discoveryState: 'pending'
  };

  const USER_SETTINGS_KEY = 'neutral.user.preferences.v1';
  const USER_THEME_KEY = 'neutral.user.theme.v1';
  const designContract = window.NeutralUserUiDesign || null;
  let userUiDesign = designContract && (designContract.read() || designContract.defaults());
  const HOME_ICON = `<svg class="user-app-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 10.75 12 3l9 7.75v9a1.25 1.25 0 0 1-1.25 1.25h-5.5v-6h-4.5v6h-5.5A1.25 1.25 0 0 1 3 19.75v-9Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const SETTINGS_ICON = `<svg class="user-app-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm0-5 1 2.2 2.4.6 2-1.3 1.6 1.6-1.3 2 .6 2.4 2.2 1v2.2l-2.2 1-.6 2.4 1.3 2-1.6 1.6-2-1.3-2.4.6-1 2.2H11l-1-2.2-2.4-.6-2 1.3L4 19.8l1.3-2-.6-2.4-2.2-1v-2.2l2.2-1 .6-2.4-1.3-2L5.6 5l2 1.3 2.4-.6 1-2.2h2Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;
  const LOGIN_ICON = `<svg class="user-app-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5V3H4v18h9v-2M9 12h11m-4-4 4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const LOCATION_ICON = `<svg class="user-app-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2.2" fill="currentColor"/></svg>`;
  const MODULE_ICON = `<svg class="user-app-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="14" y="4" width="6" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="4" y="14" width="6" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="14" y="14" width="6" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
  const NAV_LABEL_MAX = 32;

  const defaultUserPreferences = Object.freeze({
    visibleModuleIds: null,
    theme: 'light',
    navigation: { display: 'icon-text', labels: {} },
    privacy: {
      shareLocationContext: false,
      shareImages: false,
      allowOnlineSync: false,
      allowUsageAnalytics: false
    }
  });

  const readUserTheme = () => {
    try {
      return localStorage.getItem(USER_THEME_KEY) === 'dark' ? 'dark' : 'light';
    } catch (error) {
      return 'light';
    }
  };

  function applyUserUiDesign(theme = readUserTheme()) {
    if (!designContract || !userUiDesign) return;
    designContract.apply(document.documentElement, userUiDesign, theme);
    let customStyle = document.getElementById('neutralUserCustomCss');
    if (!customStyle) {
      customStyle = document.createElement('style');
      customStyle.id = 'neutralUserCustomCss';
      document.head.appendChild(customStyle);
    }
    customStyle.textContent = userUiDesign.customCss || '';
  }

  const applyUserTheme = (theme) => {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.userTheme = nextTheme;
    document.body.dataset.theme = nextTheme;
    applyUserUiDesign(nextTheme);
    try {
      localStorage.setItem(USER_THEME_KEY, nextTheme);
      return true;
    } catch (error) {
      return false;
    }
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

      const display = ['icon-text', 'icons', 'text'].includes(parsed.navigation?.display) ? parsed.navigation.display : 'icon-text';
      const labels = {};
      if (parsed.navigation?.labels && typeof parsed.navigation.labels === 'object') for (const [key, value] of Object.entries(parsed.navigation.labels)) {
        const label = typeof value === 'string' ? value.trim().slice(0, NAV_LABEL_MAX) : '';
        if (label && !/[<>]/.test(label)) labels[key] = label;
      }
      return {
        visibleModuleIds: Array.isArray(parsed.visibleModuleIds) ? parsed.visibleModuleIds.filter((id) => typeof id === 'string' && id.trim()) : null,
        theme: parsed.theme === 'dark' ? 'dark' : 'light',
        navigation: { display, labels },
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
    const display = ['icon-text', 'icons', 'text'].includes(preferences?.navigation?.display) ? preferences.navigation.display : 'icon-text';
    const labels = {};
    if (preferences?.navigation?.labels && typeof preferences.navigation.labels === 'object') for (const [key, value] of Object.entries(preferences.navigation.labels)) {
      const label = typeof value === 'string' ? value.trim().slice(0, NAV_LABEL_MAX) : '';
      if (label && !/[<>]/.test(label)) labels[key] = label;
    }
    const nextPreferences = {
      visibleModuleIds: Array.isArray(preferences && preferences.visibleModuleIds)
        ? preferences.visibleModuleIds.filter((id) => typeof id === 'string' && id.trim())
        : null,
      theme: preferences && preferences.theme === 'dark' ? 'dark' : 'light',
      navigation: { display, labels },
      privacy: {
        shareLocationContext: !!(preferences && preferences.privacy && preferences.privacy.shareLocationContext),
        shareImages: !!(preferences && preferences.privacy && preferences.privacy.shareImages),
        allowOnlineSync: !!(preferences && preferences.privacy && preferences.privacy.allowOnlineSync),
        allowUsageAnalytics: !!(preferences && preferences.privacy && preferences.privacy.allowUsageAnalytics)
      }
    };

    let persisted = true;

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(nextPreferences));
        localStorage.setItem(USER_THEME_KEY, nextPreferences.theme);
      }
    } catch (error) {
      // Restricted/offline storage must not throw; surface the failure to the caller instead.
      persisted = false;
    }

    return { ...nextPreferences, persisted };
  };

  const presentationLabel = (id, official) => readUserPreferences().navigation.labels[id] || official;
  const presentationContent = (icon, label) => {
    const display = readUserPreferences().navigation.display;
    const iconMarkup = display === 'text' ? '' : `<span class="ui-button-icon">${icon}</span>`;
    const textMarkup = display === 'icons' ? '' : `<span class="ui-button-label">${escapeHtml(label)}</span>`;
    return `${iconMarkup}${textMarkup}`;
  };

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const homepageCache = window.NeutralHomepageCache || null;
  const homepageDocument = window.NeutralHomepageDocument;
  let homepageConfig = homepageCache && typeof homepageCache.read === 'function' ? homepageCache.read() : null;
  let homepageResolved = homepageConfig !== null;
  let maintenanceState = { active: false, reason: '' };
  if (homepageResolved && window.CorePerformance) window.CorePerformance.mark('homepage-local-ready');

  const getHomepageConfig = () => {
    const configManager = window.ConfigManager && typeof window.ConfigManager.get === 'function'
      ? window.ConfigManager
      : null;
    const assigned = configManager ? configManager.get('homepage', null) : null;
    const fromWindow = window.NeutralHomepageConfig || window.NeutralAppHomepage || {};
    const source = homepageConfig || (assigned && typeof assigned === 'object' ? assigned : fromWindow);
    const mode = source && source.mode === 'module' ? 'module' : 'html';
    const title = typeof source?.title === 'string' ? source.title.trim() : '';
    const content = typeof source?.content === 'string' ? source.content : '';
    const moduleId = typeof source?.moduleId === 'string' ? source.moduleId.trim() : '';
    return {
      mode,
      title,
      content,
      moduleId
    };
  };

  const loadHomepageConfig = async () => {
    try {
      const client = getServerApiClient('user');
      if (!client || typeof client.getHomepage !== 'function') return getHomepageConfig();
      const result = await client.getHomepage();
      const envelope = result?.data?.data || result?.data || {};
      const received = envelope.homepage;
      if (!result.ok || !received || typeof received !== 'object') return getHomepageConfig();
      homepageConfig = {
        mode: received.mode === 'module' ? 'module' : 'html',
        title: typeof received.title === 'string' ? received.title.trim() : '',
        content: typeof received.content === 'string' ? received.content : '',
        moduleId: typeof received.moduleId === 'string' ? received.moduleId.trim() : ''
      };
      if (window.ConfigManager && typeof window.ConfigManager.set === 'function') {
        window.ConfigManager.set('homepage', homepageConfig);
      }
      if (homepageCache && typeof homepageCache.write === 'function') {
        homepageCache.write(homepageConfig);
      }
      if (window.CorePerformance) window.CorePerformance.mark('homepage-refresh-ready');
      return homepageConfig;
    } finally {
      homepageResolved = true;
      renderApp();
    }
  };

  const loadMaintenanceState = async () => {
    const client = getServerApiClient('user');
    if (!client || typeof client.getMaintenance !== 'function') return maintenanceState;
    const result = await client.getMaintenance();
    const envelope = result?.data?.data || result?.data || {};
    if (result.ok && envelope.maintenance) maintenanceState = envelope.maintenance;
    renderApp();
    return maintenanceState;
  };

  const loadUserUiDesign = async () => {
    const client = getServerApiClient('user');
    if (!client || typeof client.getAppearance !== 'function' || !designContract) return userUiDesign;
    const result = await client.getAppearance();
    const envelope = result?.data?.data || result?.data || {};
    if (!result.ok || !envelope.appearance) return userUiDesign;
    const saved = designContract.write(envelope.appearance);
    if (saved) {
      userUiDesign = saved;
      applyUserUiDesign();
    }
    return userUiDesign;
  };

  // Real end-user login must go through the server-authenticated session
  // (ApiClient -> /api/auth/*), never through the local, storage-only
  // developer bootstrap (LocalAuth/CoreAuth local fallback). serverUser holds
  // the identity confirmed by the server for this tab; it is not persisted to
  // localStorage and is re-derived on every reload via restoreServerSession().
  let serverUser = null;
  let sessionRevision = 0;

  const getServerApiClient = (scope = 'user') => {
    const eligibleScope = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : null);
    const ApiCtor = eligibleScope && typeof eligibleScope.ApiClient === 'function'
      ? eligibleScope.ApiClient
      : (typeof window !== 'undefined' && typeof window.ApiClient === 'function' ? window.ApiClient : null);
    if (!ApiCtor) {
      return null;
    }
    const client = new ApiCtor();
    if (scope === 'admin' || scope === 'developer') {
      client.setSessionScope('admin');
      client.setAuthRole('admin');
    } else {
      client.setSessionScope('user');
    }
    return client;
  };

  const extractServerAuthData = (result) => {
    if (!result || typeof result !== 'object') {
      return null;
    }

    const seen = new Set();
    let cursor = result;

    while (cursor && typeof cursor === 'object' && !seen.has(cursor)) {
      seen.add(cursor);

      if (cursor.user !== undefined || cursor.roles !== undefined || cursor.permissions !== undefined) {
        return cursor;
      }

      if (cursor.ok === true && cursor.data && typeof cursor.data === 'object') {
        const payload = cursor.data;
        if (payload.user !== undefined || payload.roles !== undefined || payload.permissions !== undefined) {
          return payload;
        }
      }

      if (cursor.data && typeof cursor.data === 'object' && cursor.data !== cursor) {
        cursor = cursor.data;
        continue;
      }

      break;
    }

    return null;
  };

  const normalizeServerUser = (identityData) => {
    if (!identityData || typeof identityData !== 'object') {
      return null;
    }

    let userRecord = null;
    if (identityData.user && typeof identityData.user === 'object') {
      userRecord = identityData.user;
    } else if (identityData.data && identityData.data.user && typeof identityData.data.user === 'object') {
      userRecord = identityData.data.user;
    } else if (identityData.data && identityData.data.data && identityData.data.data.user && typeof identityData.data.data.user === 'object') {
      userRecord = identityData.data.data.user;
    } else if (identityData.username || identityData.id) {
      userRecord = identityData;
    }

    if (!userRecord || typeof userRecord !== 'object') {
      return null;
    }

    const rawRoles = (Array.isArray(identityData.roles) && identityData.roles.length)
      ? identityData.roles
      : (Array.isArray(identityData.data && identityData.data.roles) && identityData.data.roles.length
        ? identityData.data.roles
        : (Array.isArray(userRecord.roles) && userRecord.roles.length
          ? userRecord.roles
          : (typeof userRecord.role === 'string' && userRecord.role.trim() ? [userRecord.role.trim()] : [])));

    const rawPermissions = (Array.isArray(identityData.permissions) && identityData.permissions.length)
      ? identityData.permissions
      : (Array.isArray(identityData.data && identityData.data.permissions) && identityData.data.permissions.length
        ? identityData.data.permissions
        : (Array.isArray(userRecord.permissions) ? userRecord.permissions : []));

    const resolvedRoles = Array.from(new Set(rawRoles.map((role) => String(role || '').trim()).filter(Boolean)));
    const resolvedPermissions = Array.from(new Set(rawPermissions.map((perm) => String(perm || '').trim()).filter(Boolean)));

    return {
      ...userRecord,
      roles: resolvedRoles.length ? resolvedRoles : ['user'],
      permissions: resolvedPermissions,
      status: typeof userRecord.status === 'string' && userRecord.status.trim() ? userRecord.status : 'active'
    };
  };

  const applyServerUser = (identityData) => {
    const user = normalizeServerUser(identityData);
    serverUser = user;
    if (user) {
      if (window.CoreAuth && typeof window.CoreAuth === 'object') window.CoreAuth.currentUser = user;
      if (window.UserModule && typeof window.UserModule === 'object') window.UserModule.currentUser = user;
    }
    return user;
  };

  const clearServerUser = () => {
    serverUser = null;
    if (window.CoreAuth && typeof window.CoreAuth === 'object') window.CoreAuth.currentUser = null;
    if (window.UserModule && typeof window.UserModule === 'object') window.UserModule.currentUser = null;
  };

  // Restores an existing server session (e.g. after a page reload) via the
  // cookie-backed /api/auth/me endpoint. Never falls back to local storage.
  const restoreServerSession = async () => {
    const revision = sessionRevision;
    const apiClient = getServerApiClient();
    if (!apiClient) return null;
    try {
      const sessionResult = await apiClient.me();
      if (revision !== sessionRevision) return serverUser;
      const sessionData = extractServerAuthData(sessionResult);
      if (sessionResult.ok && sessionData && sessionData.user) {
        return applyServerUser(sessionData);
      }
    } catch (error) {
      // No active server session; treat as anonymous.
    }
    if (revision !== sessionRevision) return serverUser;
    clearServerUser();
    return null;
  };

  const getCurrentUser = () => serverUser;

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
    const framework = window.MasterFramework && typeof window.MasterFramework.getActiveApp === 'function'
      ? window.MasterFramework
      : null;
    const appConfig = window.ConfigManager && typeof window.ConfigManager.get === 'function'
      ? window.ConfigManager.get('app', {})
      : {};
    const branding = framework?.getActiveApp()?.branding || appConfig.branding;
    if (branding && typeof branding.iconText === 'string' && branding.iconText.trim()) {
      return branding.iconText.trim().slice(0, 3);
    }
    const name = getAppName().trim();
    return name ? name.charAt(0).toUpperCase() : 'A';
  };

  const getAppLogoUrl = () => {
    const framework = window.MasterFramework && typeof window.MasterFramework.getActiveApp === 'function'
      ? window.MasterFramework
      : null;
    const appConfig = window.ConfigManager && typeof window.ConfigManager.get === 'function'
      ? window.ConfigManager.get('app', {})
      : {};
    const logoUrl = framework?.getActiveApp()?.branding?.logoUrl || appConfig.branding?.logoUrl;
    return typeof logoUrl === 'string' && logoUrl.trim() ? logoUrl.trim() : '';
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
    const preferences = readUserPreferences();
    return window.NeutralUserModuleAccess.visibleModules(getModules(), {
      currentUser: getCurrentUser(),
      visibleModuleIds: preferences.visibleModuleIds
    });
  };

  const getAvailableModulesForUser = () => window.NeutralUserModuleAccess.visibleModules(getModules(), {
    currentUser: getCurrentUser(),
    visibleModuleIds: null
  });

  const isDiscoveryPending = () => state.discoveryState === 'pending';
  const getDiscoveryMessage = () => state.discoveryState === 'error'
    ? 'Modules could not be loaded. Check your connection and try again.'
    : 'Loading available modules...';
  const applyBranding = () => {
    const appName = getAppName();
    document.title = appName;
    const title = document.querySelector('[data-app-title]');
    if (title) title.textContent = appName;
    if (brand) brand.textContent = appName;
    if (mark) {
      const logoUrl = getAppLogoUrl();
      mark.replaceChildren();
      if (logoUrl) {
        const logo = document.createElement('img');
        logo.className = 'user-app-logo';
        logo.src = logoUrl;
        logo.alt = '';
        mark.appendChild(logo);
      } else {
        mark.textContent = getAppMark();
      }
    }
  };

  const renderActions = () => {
    if (!actions) return;
    const currentUser = getCurrentUser();
    const settingsLabel = presentationLabel('settings', 'Settings');
    const settingsButton = `<button id="userSettingsButton" class="ui-button ui-button--secondary user-app-link" type="button" aria-label="${escapeHtml(settingsLabel)}" title="${escapeHtml(settingsLabel)}">${presentationContent(SETTINGS_ICON, settingsLabel)}</button>`;
    const nextTheme = readUserTheme() === 'dark' ? 'light' : 'dark';
    const themeButton = `<button id="userThemeToggle" class="ui-button ui-button--icon user-app-link user-theme-toggle" type="button" aria-label="Switch to ${nextTheme} theme" title="Switch to ${nextTheme} theme">${nextTheme === 'dark' ? '☾' : '☀'}</button>`;

    if (!currentUser) {
      const loginLabel = presentationLabel('login', 'Login');
      actions.innerHTML = `${themeButton}${settingsButton}<button id="userLoginButton" class="ui-button ui-button--primary user-app-action" type="button" aria-label="${escapeHtml(loginLabel)}" title="${escapeHtml(loginLabel)}">${presentationContent(LOGIN_ICON, loginLabel)}</button>`;
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
      const themeToggle = document.getElementById('userThemeToggle');
      if (themeToggle) themeToggle.addEventListener('click', () => {
        applyUserTheme(readUserTheme() === 'dark' ? 'light' : 'dark');
        renderApp();
      });
      return;
    }

    actions.innerHTML = `
      ${themeButton}${settingsButton}
      <button id="userLogoutButton" class="ui-button ui-button--secondary user-app-link" type="button">Logout</button>
    `;
    const logoutButton = document.getElementById('userLogoutButton');
    if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
        const apiClient = getServerApiClient();
        if (apiClient) {
          await apiClient.logout();
        }
        clearServerUser();
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
    const themeToggle = document.getElementById('userThemeToggle');
    if (themeToggle) themeToggle.addEventListener('click', () => {
      applyUserTheme(readUserTheme() === 'dark' ? 'light' : 'dark');
      renderApp();
    });
  };

  const renderModuleNav = () => {
    if (!nav) return;
    const modules = getVisibleModules();
    const items = [
      { id: 'home', label: presentationLabel('home', 'Start'), icon: HOME_ICON },
      ...modules.map((module) => ({ id: `module:${module.id}`, label: presentationLabel(`module:${module.id}`, getModuleDisplayName(module)), icon: module.id === 'gps' ? LOCATION_ICON : MODULE_ICON }))
    ];
    nav.innerHTML = items.map((item) => `
      <button
        type="button"
        class="ui-button ui-button--navigation user-app-nav-item ${state.activeView === item.id ? 'active' : ''}"
        data-user-nav="${escapeHtml(item.id)}"
        aria-label="${escapeHtml(item.label)}"
        title="${escapeHtml(item.label)}"
        ${state.activeView === item.id ? 'aria-current="page"' : ''}
      >${presentationContent(item.icon || MODULE_ICON, item.label)}</button>
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
        <h1>Login</h1>
        <form id="userLoginForm" class="user-login-form">
          <div class="form-field">
            <label for="userLoginUsername">Username</label>
            <input id="userLoginUsername" type="text" autocomplete="username" />
          </div>
          <div class="form-field">
            <label for="userLoginPassword">Password</label>
            <input id="userLoginPassword" type="password" autocomplete="current-password" />
          </div>
          <div class="user-login-actions">
            <button type="submit" id="userLoginSubmit" class="ui-button ui-button--primary primary">Login</button>
          </div>
          <div id="userLoginStatus" class="message" role="status" aria-live="polite"></div>
        </form>
      </section>
    `;

    const submit = document.getElementById('userLoginSubmit');
    const loginForm = document.getElementById('userLoginForm');
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submit.disabled) return;
      submit.disabled = true;
      sessionRevision += 1;
      const username = document.getElementById('userLoginUsername').value.trim();
      const password = document.getElementById('userLoginPassword').value;
      const status = document.getElementById('userLoginStatus');

      const apiClient = getServerApiClient();
      if (!apiClient) {
        status.className = 'message error';
        status.textContent = 'Server authentication client is not available.';
        submit.disabled = false;
        return;
      }

      status.className = 'message info';
      status.textContent = 'Signing in…';

      let loginResult;
      try {
        loginResult = await apiClient.login(username, password);
      } catch (error) {
        status.className = 'message error';
        status.textContent = 'Authentication failed. Check your connection and try again.';
        submit.disabled = false;
        return;
      }

      const loginData = extractServerAuthData(loginResult);
      if (!loginResult.ok || !loginData) {
        const serverError = loginResult && loginResult.data && loginResult.data.error && loginResult.data.error.message
          ? loginResult.data.error.message
          : (loginResult && loginResult.error ? loginResult.error : 'Authentication failed.');
        status.className = 'message error';
        status.textContent = serverError;
        submit.disabled = false;
        return;
      }

      const user = applyServerUser(loginData);
      if (!user) {
        status.className = 'message error';
        status.textContent = 'No authenticated user was returned by the server.';
        submit.disabled = false;
        return;
      }

      status.className = 'message success';
      status.textContent = 'Signed in successfully.';
      state.activeView = 'home';
      renderApp();
    });
  };

  const renderUserSettings = () => {
    const currentUser = getCurrentUser();
    const modules = getAvailableModulesForUser();
    const preferences = readUserPreferences();
    const hasExplicitVisibility = Array.isArray(preferences.visibleModuleIds);
    const moduleVisibility = hasExplicitVisibility
      ? new Set(preferences.visibleModuleIds)
      : new Set(modules.map((module) => module.id));

    content.innerHTML = `
      <section class="user-app-panel">
        <div class="user-app-section-heading">
          <div>
            <h1>Settings</h1>
          </div>
        </div>
        <div class="user-settings-card">
          <h2 data-i18n-key="settings.areas">App areas</h2>
          <p data-i18n-key="settings.areas.help">Choose the areas you want to see in the app navigation.</p>
          <div class="user-settings-module-list">
            ${isDiscoveryPending() || state.discoveryState === 'error' ? `<p class="user-app-empty">${getDiscoveryMessage()}</p>` : modules.length ? modules.map((module) => `
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
          <h2>Navigation</h2>
          <p>Choose how navigation actions appear on this device and optionally personalize their visible labels.</p>
          <div class="form-field"><label for="navigationDisplay">Display style</label><select id="navigationDisplay" class="user-settings-select">
            <option value="icon-text" ${preferences.navigation.display === 'icon-text' ? 'selected' : ''}>Icon + Text</option>
            <option value="icons" ${preferences.navigation.display === 'icons' ? 'selected' : ''}>Icons only</option>
            <option value="text" ${preferences.navigation.display === 'text' ? 'selected' : ''}>Text only</option>
          </select></div>
          <div class="user-navigation-labels">
            ${[
              ['home', 'Start'], ['settings', 'Settings'], ['login', 'Login'],
              ...modules.map((module) => [`module:${module.id}`, getModuleDisplayName(module)])
            ].map(([key, official]) => `<div class="user-navigation-label-row"><label>${escapeHtml(official)}<small>Default: ${escapeHtml(official)}</small><input type="text" maxlength="${NAV_LABEL_MAX}" data-navigation-label="${escapeHtml(key)}" value="${escapeHtml(preferences.navigation.labels[key] || '')}" placeholder="${escapeHtml(official)}"></label><button type="button" class="ui-button ui-button--secondary" data-navigation-label-reset="${escapeHtml(key)}">Reset</button></div>`).join('')}
          </div>
          <button type="button" class="ui-button ui-button--secondary" id="resetAllNavigationLabels">Reset all navigation labels</button>
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
        </div>
        <p id="userSettingsStatus" class="user-settings-status" aria-live="polite"></p>
      </section>
    `;

    const saveButton = document.getElementById('userSettingsSaveButton');
    document.querySelectorAll('[data-navigation-label-reset]').forEach((button) => button.addEventListener('click', () => {
      const input = document.querySelector(`[data-navigation-label="${button.dataset.navigationLabelReset}"]`);
      if (input) input.value = '';
    }));
    document.getElementById('resetAllNavigationLabels')?.addEventListener('click', () => {
      document.querySelectorAll('[data-navigation-label]').forEach((input) => { input.value = ''; });
    });
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        const moduleSelection = Array.from(document.querySelectorAll('[data-user-setting-module]:checked')).map((input) => input.dataset.userSettingModule).filter(Boolean);
        const privacySelection = {};
        document.querySelectorAll('[data-user-setting-privacy]').forEach((input) => {
          privacySelection[input.dataset.userSettingPrivacy] = !!input.checked;
        });
        const labels = {};
        document.querySelectorAll('[data-navigation-label]').forEach((input) => {
          const label = input.value.trim().slice(0, NAV_LABEL_MAX);
          if (label && !/[<>]/.test(label)) labels[input.dataset.navigationLabel] = label;
        });

        const nextPreferences = saveUserPreferences({
          visibleModuleIds: moduleSelection,
          privacy: privacySelection,
          theme: readUserTheme(),
          navigation: { display: document.getElementById('navigationDisplay')?.value || 'icon-text', labels }
        });
        if (Object.keys(nextPreferences.privacy).some((key) => nextPreferences.privacy[key])) {
          const currentUser = getCurrentUser();
          if (currentUser && window.UserModule && typeof window.UserModule.updateProfile === 'function') {
            window.UserModule.updateProfile({ privacy: nextPreferences.privacy });
          }
        }

        const status = document.getElementById('userSettingsStatus');
        if (status) {
          if (nextPreferences.persisted) {
            status.textContent = 'Settings saved successfully.';
            status.className = 'user-settings-status success';
          } else {
            status.textContent = 'Settings could not be saved. Local storage is unavailable or restricted.';
            status.className = 'user-settings-status error';
          }
          if (nextPreferences.persisted) {
            window.alert('Settings saved successfully.');
            state.activeView = 'home';
            state.activeModuleId = null;
            renderApp();
            return;
          }
        }

      });
    }

  };

  const renderModule = (moduleId, { asHomepage = false } = {}) => {
    const preferences = readUserPreferences();
    const module = window.NeutralUserModuleAccess.findVisibleModule(getModules(), moduleId, {
      currentUser: getCurrentUser(),
      visibleModuleIds: preferences.visibleModuleIds
    });
    if (!module) {
      state.activeView = 'home';
      state.activeModuleId = null;
      renderLandingPage();
      return;
    }

    if (!asHomepage) {
      state.activeView = `module:${moduleId}`;
      state.activeModuleId = moduleId;
    }
    content.innerHTML = `
      <section class="user-app-panel">
        <div id="moduleUserInterface"></div>
      </section>
    `;
    const target = document.getElementById('moduleUserInterface');
    if (typeof module.renderUserInterface === 'function') {
      module.renderUserInterface(target);
    } else {
      target.innerHTML = '<span class="user-app-eyebrow">Module</span><h1>' + escapeHtml(getModuleDisplayName(module)) + '</h1><p>This module does not provide a user interface.</p>';
    }
  };

  const renderModuleCards = () => {
    if (state.discoveryState !== 'ready') {
      return '';
    }
    const modules = getVisibleModules();
    if (!modules.length) {
      return '';
    }
    return `
      <div class="user-module-list">
        ${modules.map((module) => `
          <button type="button" class="user-module-card" data-module-card="${escapeHtml(module.id)}">
            <span>
              <strong>${escapeHtml(getModuleDisplayName(module))}</strong>
              <small>${escapeHtml(module.description || 'Open this module.')}</small>
            </span>
            <span>Open</span>
          </button>
        `).join('')}
      </div>
    `;
  };

  const renderLandingPage = () => {
    if (!homepageResolved) {
      content.innerHTML = '<section class="user-app-panel"><div class="user-app-status" role="status">Loading…</div></section>';
      return;
    }
    const homepage = getHomepageConfig();
    const appName = getAppName();
    if (homepage.mode === 'module') {
      if (state.discoveryState === 'pending') {
        content.innerHTML = '<section class="user-app-panel"><div class="user-app-status" role="status">Loading…</div></section>';
        return;
      }
      const moduleId = homepage.moduleId;
      const preferences = readUserPreferences();
      const module = moduleId
        ? window.NeutralUserModuleAccess.findVisibleModule(getModules(), moduleId, {
          currentUser: getCurrentUser(),
          visibleModuleIds: preferences.visibleModuleIds
        })
        : null;
      if (module) {
        renderModule(module.id, { asHomepage: true });
        return;
      }
    }

    if (homepage.mode === 'html' && homepage.content) {
      content.innerHTML = '<section class="user-app-panel"><div class="user-app-homepage-content"></div></section>';
      const host = content.querySelector('.user-app-homepage-content');
      const frame = document.createElement('iframe');
      frame.className = 'user-app-homepage-frame';
      frame.title = homepage.title || 'Start page content';
      frame.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups');
      homepageDocument.apply(frame, homepage.content, readUserTheme());
      host.appendChild(frame);
      return;
    }

    const heading = homepage.title ? homepage.title : appName;
    const message = '<p class="user-app-intro">Welcome to the workspace.</p>';
    const moduleCards = homepage.mode === 'module' ? renderModuleCards() : '';

    content.innerHTML = `
      <section class="user-app-panel">
        <div class="user-app-section-heading">
          <div>
            <span class="user-app-eyebrow">Welcome</span>
            <h1>${escapeHtml(heading)}</h1>
          </div>
        </div>
        <div class="user-app-homepage-content">${message}</div>
        ${moduleCards}
      </section>
    `;


    const homeModuleCards = content.querySelectorAll('[data-module-card]');
    homeModuleCards.forEach((button) => {
      button.addEventListener('click', () => {
        const nextModuleId = button.dataset.moduleCard;
        if (!nextModuleId) {
          return;
        }
        state.activeView = `module:${button.dataset.moduleCard}`;
        state.activeModuleId = button.dataset.moduleCard;
        renderModule(button.dataset.moduleCard);
      });
    });
  };

  const renderApp = () => {
    applyUserTheme(readUserTheme());
    applyBranding();
    renderActions();
    renderModuleNav();

    if (maintenanceState.active) {
      state.activeModuleId = null;
      content.replaceChildren();
      const panel = document.createElement('section');
      panel.className = 'panel-box maintenance-page';
      const heading = document.createElement('h2'); heading.textContent = 'Maintenance in progress';
      const reason = document.createElement('p'); reason.textContent = maintenanceState.reason || 'Please try again later.';
      panel.append(heading, reason); content.append(panel);
      return;
    }

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

  const startBackgroundInitialization = () => {
    window.setTimeout(async () => {
      try {
        const startCore = async () => {
          if (window.CoreStartup && typeof window.CoreStartup.start === 'function') {
            await window.CoreStartup.start();
            if (window.CorePerformance) window.CorePerformance.mark('minimal-core-ready');
            await window.CoreStartup.startBackground();
          }
        };
        // These data flows are intentionally independent. A failed module or
        // IndexedDB startup must not prevent the public homepage projection
        // from being fetched, and a homepage/API failure must not block P1
        // session restoration or module discovery.
        const initializationResults = await Promise.allSettled([
          startCore(),
          loadHomepageConfig(),
          loadUserUiDesign(),
          restoreServerSession(),
          loadMaintenanceState()
        ]);
        for (const result of initializationResults) {
          if (result.status === 'rejected' && window.CoreErrorHandler && typeof window.CoreErrorHandler.handle === 'function') {
            window.CoreErrorHandler.handle(result.reason, { type: 'background-startup' });
          }
        }
      } finally {
        if (window.CorePerformance) window.CorePerformance.mark('auth-status-known');
        renderApp();
      }
    }, 0);
  };

  if (window.Core && typeof window.Core.on === 'function') {
    window.Core.on('startup:modules-ready', () => {
      state.discoveryState = 'ready';
      renderApp();
    });
    window.Core.on('startup:modules-error', () => {
      state.discoveryState = 'error';
      renderApp();
    });
  }

  // Offline-first: register the service worker in secure contexts only. The
  // worker precaches the app shell so warm starts and offline restarts work
  // after one successful online visit. Registration never blocks first paint.
  if (window.isSecureContext && navigator.serviceWorker && typeof navigator.serviceWorker.register === 'function') {
    navigator.serviceWorker.register('service-worker.js').catch(() => {
      // A failed registration must never break the online experience.
    });
  }

  // First paint and basic navigation do not wait for IndexedDB, auth, network or module discovery.
  if (window.CorePerformance) window.CorePerformance.mark('shell-visible');
  renderApp();
  if (content) content.setAttribute('aria-busy', 'false');
  if (window.CorePerformance) window.CorePerformance.mark('ui-interactive');
  startBackgroundInitialization();
})();

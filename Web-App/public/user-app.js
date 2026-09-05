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

  const getSafeHomepageContent = (value) => {
    let html = String(value ?? '');
    html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
    html = html.replace(/<(?:object|embed|svg|math)[\s\S]*?(?:<\/\1>|$)/gi, '');
    html = html.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    html = html.replace(/href\s*=\s*(?:"\s*javascript:|'\s*javascript:|javascript:)/gi, 'href="#"');
    html = html.replace(/src\s*=\s*(?:"\s*javascript:|'\s*javascript:|javascript:)/gi, 'src="#"');
    html = html.replace(/<(?!\/?(?:p|br|strong|b|em|i|u|small|ul|ol|li|h1|h2|h3|h4|h5|h6|a|span|div|blockquote|code|pre|hr|mark|section)\b)[^>]+>/gi, '');
    html = html.replace(/<a\b([^>]*)\s+href=(?:"[^"]*"|'[^']*'|[^\s>]+)([^>]*)>/gi, (match, before, after) => {
      const hrefMatch = match.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = hrefMatch ? (hrefMatch[1] || hrefMatch[2] || hrefMatch[3] || '') : '';
      const safeHref = /^https?:\/\//i.test(href) || href.startsWith('/') || href.startsWith('#') || href.startsWith('mailto:')
        ? href
        : '#';
      return `<a${before || ''} href="${escapeHtml(safeHref)}"${after || ''}>`;
    });
    return html;
  };

  const getHomepageConfig = () => {
    const configManager = window.ConfigManager && typeof window.ConfigManager.get === 'function'
      ? window.ConfigManager
      : null;
    const assigned = configManager ? configManager.get('homepage', null) : null;
    const fromWindow = window.NeutralHomepageConfig || window.NeutralAppHomepage || {};
    const source = assigned && typeof assigned === 'object' ? assigned : fromWindow;
    const mode = source && source.mode === 'module' ? 'module' : 'content';
    const title = typeof source?.title === 'string' ? source.title.trim() : '';
    const content = typeof source?.content === 'string' ? source.content : '';
    const moduleId = typeof source?.moduleId === 'string' ? source.moduleId.trim() : '';
    return {
      mode,
      title,
      content: getSafeHomepageContent(content),
      moduleId
    };
  };

  const getCurrentUser = () => {
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
  const getModuleCountLabel = (modules) => state.discoveryState === 'pending'
    ? '...'
    : state.discoveryState === 'error'
      ? '—'
      : String(modules.length);

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
    const settingsLabel = currentUser ? 'Settings' : 'Local settings';
    const settingsButton = `<button id="userSettingsButton" class="user-app-link" type="button" aria-label="${settingsLabel}">⚙ ${settingsLabel}</button>`;

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
      ${canOpenAdmin() ? `<a class="user-app-link" href="${escapeHtml(window.NeutralPublicPath.admin())}">Admin</a>` : ''}
      ${settingsButton}
      <button id="userLogoutButton" class="user-app-link" type="button">Logout</button>
    `;
    const logoutButton = document.getElementById('userLogoutButton');
    if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
        if (window.LocalAuth && typeof window.LocalAuth.logout === 'function') {
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
      { id: 'home', label: 'Start' },
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
        <p>Use your local workspace account to unlock available features.</p>
        <div class="user-login-form">
          <div class="form-field">
            <label for="userLoginUsername">Username</label>
            <input id="userLoginUsername" type="text" autocomplete="username" />
          </div>
          <div class="form-field">
            <label for="userLoginPassword">Password</label>
            <input id="userLoginPassword" type="password" autocomplete="current-password" />
          </div>
          <div class="user-login-actions">
            <button type="button" id="userLoginSubmit" class="primary">Login</button>
          </div>
          <div id="userLoginStatus" class="message info">Sign in with your configured account.</div>
        </div>
      </section>
    `;

    const submit = document.getElementById('userLoginSubmit');
    submit.addEventListener('click', async () => {
      const username = document.getElementById('userLoginUsername').value.trim();
      const password = document.getElementById('userLoginPassword').value;
      const status = document.getElementById('userLoginStatus');

      if (!window.LocalAuth || typeof window.LocalAuth.login !== 'function') {
        status.className = 'message error';
        status.textContent = 'Local authentication is not available.';
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
    const currentUser = getCurrentUser();
    const modules = getAvailableModulesForUser();
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
            <span class="user-app-eyebrow">${currentUser ? 'Profile' : 'Local workspace'}</span>
            <h1>${currentUser ? 'Settings' : 'Local settings'}</h1>
          </div>
          <span class="user-app-count">${getModuleCountLabel(modules)}</span>
        </div>
        <div class="user-settings-card">
          <h2>Functions</h2>
          <p>Choose which features should remain visible in your current workspace menu.</p>
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
        const moduleIds = getAvailableModulesForUser().map((module) => module.id);
        saveUserPreferences({ visibleModuleIds: moduleIds, privacy: defaultUserPreferences.privacy });
        const status = document.getElementById('userSettingsStatus');
        if (status) {
          status.textContent = 'All functions are visible again.';
          status.className = 'user-settings-status success';
        }
        renderUserSettings();
      });
    }
  };

  const renderModule = (moduleId) => {
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

    state.activeView = `module:${moduleId}`;
    state.activeModuleId = moduleId;
    content.innerHTML = `
      <section class="user-app-panel">
        <button class="user-app-back" type="button" id="userModuleBackButton">Back</button>
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

  // TEMPORARY startup diagnostics panel — remove after the real-device warmstart
  // measurement is complete. Local-only: reads CorePerformance marks and never
  // transmits anything.
  const renderStartupDiagnostics = () => {
    if (!window.CorePerformance || typeof window.CorePerformance.snapshot !== 'function') {
      return '';
    }
    const snapshot = window.CorePerformance.snapshot();
    const start = snapshot['navigation-start'] ?? 0;
    const rows = Object.keys(snapshot)
      .sort((a, b) => snapshot[a] - snapshot[b])
      .map((name) => `<div><dt>${escapeHtml(name)}</dt><dd>${Math.round(snapshot[name] - start)} ms</dd></div>`)
      .join('');
    return `<details class="startup-diagnostics"><summary>Startup-Diagnose (temporär)</summary><dl class="startup-diagnostics-list">${rows || '<div><dt>Marken</dt><dd>keine</dd></div>'}</dl></details>`;
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
    const homepage = getHomepageConfig();
    const appName = getAppName();
    const currentUser = getCurrentUser();

    if (homepage.mode === 'module') {
      const moduleId = homepage.moduleId;
      const module = moduleId && getModules().some((entry) => entry.id === moduleId)
        ? getModules().find((entry) => entry.id === moduleId)
        : null;
      if (module) {
        state.activeView = 'home';
        state.activeModuleId = null;
        content.innerHTML = `
          <section class="user-app-panel">
            <div class="user-app-module-intro">${escapeHtml(module.description || 'This module is active in the current application.')}</div>
            <div id="moduleUserInterface"></div>
            ${renderStartupDiagnostics()}
          </section>
        `;
        const target = document.getElementById('moduleUserInterface');
        if (typeof module.renderUserInterface === 'function') {
          module.renderUserInterface(target);
        } else {
          target.innerHTML = '<span class="user-app-eyebrow">Module</span><h1>' + escapeHtml(getModuleDisplayName(module)) + '</h1><p>This module does not provide a user interface.</p>';
        }
        return;
      }
    }

    const heading = homepage.title ? homepage.title : appName;
    const message = homepage.content
      ? homepage.content
      : '<p class="user-app-intro">Welcome to the workspace.</p>';
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
        ${currentUser ? `<div class="user-app-status">Signed in as ${escapeHtml(currentUser.displayName || currentUser.username || 'User')} (${escapeHtml((currentUser.roles || ['user']).join(', '))})</div>` : '<div class="user-app-status">You can use the available workspace features without signing in.</div>'}
        ${renderStartupDiagnostics()}
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

  const startBackgroundInitialization = () => {
    window.setTimeout(async () => {
      try {
        if (window.CoreStartup && typeof window.CoreStartup.start === 'function') {
          await window.CoreStartup.start();
          if (window.CorePerformance) window.CorePerformance.mark('minimal-core-ready');
          await window.CoreStartup.startBackground();
        }
      } catch (error) {
        if (window.CoreErrorHandler && typeof window.CoreErrorHandler.handle === 'function') {
          window.CoreErrorHandler.handle(error, { type: 'background-startup' });
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

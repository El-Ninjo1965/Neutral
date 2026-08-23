(() => {
  'use strict';

  const pageType = document.body.dataset.page || 'user';
  const defaultView = pageType === 'admin'
    ? 'admin:dashboard'
    : pageType === 'developer'
      ? 'developer:core'
      : pageType === 'setup'
        ? 'setup:overview'
        : 'dashboard';
  const state = { activeView: defaultView, activeSettingsModuleId: null };

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const getConfiguredAppName = () => {
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
    const name = appConfig && typeof appConfig.name === 'string' && appConfig.name.trim()
      ? appConfig.name.trim()
      : 'Neutral Platform';
    return name;
  };

  const getAppMark = () => {
    const name = getConfiguredAppName().trim();
    return name ? name.charAt(0).toUpperCase() : 'A';
  };

  const getCurrentUser = () => {
    if (window.UserModule && typeof window.UserModule.getCurrentUser === 'function') {
      const user = window.UserModule.getCurrentUser();
      if (user) return user;
    }
    if (window.CoreAuth && typeof window.CoreAuth.getCurrentUser === 'function') {
      return window.CoreAuth.getCurrentUser();
    }
    return null;
  };

  const hasRole = (user, role) => !!user && Array.isArray(user.roles) && user.roles.includes(role);
  const hasPermission = (user, permission) => {
    if (!user) return false;
    if (window.CoreAccess && typeof window.CoreAccess.hasPermission === 'function') {
      return !!window.CoreAccess.hasPermission(user, permission);
    }
    return Array.isArray(user.permissions) && user.permissions.includes(permission);
  };

  const canViewAdmin = (user) => !!user && (hasRole(user, 'admin') || hasPermission(user, 'system:view'));
  const canViewDeveloper = (user) => !!user && (hasRole(user, 'developer') || hasPermission(user, 'module:read'));
  const parseCommaList = (value) => String(value || '')
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  const getRoleCatalog = () => {
    if (window.AdminModule && typeof window.AdminModule.getRoleCatalog === 'function') {
      return window.AdminModule.getRoleCatalog();
    }
    if (window.CoreAccess && typeof window.CoreAccess.getRoleCatalog === 'function') {
      return window.CoreAccess.getRoleCatalog();
    }
    return [
      { role: 'user', name: 'User', permissions: ['user:read'], description: 'Standard end user.' },
      { role: 'member', name: 'Member', permissions: ['user:read'], description: 'Member with basic access.' },
      { role: 'manager', name: 'Manager', permissions: ['user:read', 'user:write'], description: 'Manager.' },
      { role: 'admin', name: 'Admin', permissions: ['user:read', 'user:write', 'system:view'], description: 'Administrator.' },
      { role: 'developer', name: 'Developer', permissions: ['user:read', 'user:write', 'system:view', 'module:read', 'module:update'], description: 'Developer.' }
    ];
  };

  const resolveRoleRoute = (user) => {
    if (!user) {
      return null;
    }

    if (hasRole(user, 'developer') || hasRole(user, 'admin') || hasPermission(user, 'system:view')) {
      return 'admin.html';
    }

    return 'index.html';
  };

  const getVisibleModules = () => {
    const registry = window.ModuleRegistry && typeof window.ModuleRegistry.getAll === 'function' ? window.ModuleRegistry.getAll() : [];
    const currentUser = getCurrentUser();
    if (!currentUser) return [];

    const framework = window.MasterFramework && typeof window.MasterFramework.getActiveApp === 'function' ? window.MasterFramework : null;
    const activeApp = framework ? framework.getActiveApp() : null;
    const activeAppId = activeApp && typeof activeApp.appId === 'string' && activeApp.appId.trim()
      ? activeApp.appId.trim()
      : (framework && typeof framework.listApps === 'function'
        ? ((framework.listApps()[0] && (framework.listApps()[0].appId || framework.listApps()[0].id)) || 'neutral-app')
        : 'neutral-app');
    const currentRole = Array.isArray(currentUser.roles) && currentUser.roles.length
      ? currentUser.roles[0]
      : (typeof currentUser.role === 'string' ? currentUser.role : 'user');

    return registry.filter((module) => {
      if (!module || !module.id) return false;
      const active = module.active === true || module.status === 'enabled' || module.status === 'active';
      if (!active) return false;

      if (window.MasterFramework && typeof window.MasterFramework.getAppModuleAccess === 'function') {
        const appAccess = window.MasterFramework.getAppModuleAccess(activeAppId, module.id);
        if (appAccess && appAccess.roles && typeof appAccess.roles === 'object' && Object.keys(appAccess.roles).length > 0) {
          const explicitRoleState = appAccess.roles[currentRole];
          if (typeof explicitRoleState === 'boolean' && !explicitRoleState) {
            return false;
          }
        }
      }

      const permissions = Array.isArray(module.permissions) && module.permissions.length ? module.permissions : [];
      if (!permissions.length) return true;
      return permissions.some((permission) => hasPermission(currentUser, permission));
    }).map((module) => ({
      id: module.id,
      name: module.name || module.id,
      status: module.status || (module.active ? 'enabled' : 'available'),
      description: module.description || '',
      capabilities: Array.isArray(module.capabilities) ? [...module.capabilities] : []
    }));
  };

  const applyShellBranding = () => {
    const appName = getConfiguredAppName();
    const brandName = document.getElementById('brandName');
    const brandMark = document.getElementById('brandMark');
    const brandSubtitle = document.getElementById('brandSubtitle');
    const topbarTitle = document.getElementById('topbarTitle');
    const authTitle = document.querySelector('[data-auth-title]');
    const title = document.querySelector('[data-app-title]');

    document.title = pageType === 'admin' ? `${appName} Administration` : appName;
    if (title) title.textContent = document.title;
    if (authTitle) authTitle.textContent = `${appName} Administration`;
    if (brandName) brandName.textContent = appName;
    if (brandMark) brandMark.textContent = getAppMark();
    if (brandSubtitle) brandSubtitle.textContent = pageType === 'admin' ? 'Administration' : 'Workspace';
    if (topbarTitle) topbarTitle.textContent = pageType === 'admin' ? `${appName} Administration` : appName;
  };

  const renderFrameworkPreview = () => {
    const registry = window.ModuleRegistry && typeof window.ModuleRegistry.getAll === 'function'
      ? window.ModuleRegistry
      : null;
    const modules = registry ? registry.getAll().filter((module) => module && module.id) : [];
    const frameworkStatus = document.getElementById('frameworkStatus');
    const discoveryStatus = document.getElementById('moduleDiscoveryStatus');
    const discoveredModules = document.getElementById('discoveredModules');
    const moduleCount = document.getElementById('moduleCount');

    if (frameworkStatus) frameworkStatus.textContent = window.Core ? 'OK' : 'Unavailable';
    if (discoveryStatus) discoveryStatus.textContent = registry ? 'OK' : 'Unavailable';
    if (moduleCount) moduleCount.textContent = String(modules.length);
    if (discoveredModules) {
      discoveredModules.innerHTML = modules.length
        ? modules.map((module) => '<span class="chip">' + escapeHtml(module.name || module.id) + '</span>').join('')
        : '<span class="chip">No modules installed</span>';
    }
  };

  const renderSummary = () => {
    applyShellBranding();
    const currentUser = getCurrentUser();
    const currentUserName = document.getElementById('currentUserName');
    const currentUserInitial = document.getElementById('currentUserInitial');
    const summaryUsername = document.getElementById('summaryUsername');
    const summaryStatus = document.getElementById('summaryStatus');
    const summaryRoleBadge = document.getElementById('summaryRoleBadge');
    const activeModules = document.getElementById('activeModules');
    const displayIdTargets = document.querySelectorAll('[data-user-display-id]');

    if (!currentUser) {
      if (currentUserName) currentUserName.textContent = 'Not signed in';
      if (currentUserInitial) currentUserInitial.textContent = '—';
      if (summaryUsername) summaryUsername.textContent = 'Not signed in';
      if (summaryStatus) summaryStatus.textContent = 'signed out';
      displayIdTargets.forEach((target) => { target.textContent = '—'; });
      if (summaryRoleBadge) {
        summaryRoleBadge.textContent = 'guest';
        summaryRoleBadge.className = 'role-badge user';
      }
      if (activeModules) activeModules.innerHTML = '<span class="chip">No active modules</span>';
      return;
    }

    const role = Array.isArray(currentUser.roles) && currentUser.roles.length ? currentUser.roles[0] : 'user';
    const initials = (currentUser.displayName || currentUser.username || 'U').charAt(0).toUpperCase();

    if (currentUserName) currentUserName.textContent = currentUser.displayName || currentUser.username || 'User';
    if (currentUserInitial) currentUserInitial.textContent = initials;
    if (summaryUsername) summaryUsername.textContent = currentUser.displayName || currentUser.username || 'User';
    if (summaryStatus) summaryStatus.textContent = currentUser.status || 'active';
    displayIdTargets.forEach((target) => { target.textContent = currentUser.displayId || currentUser.id || '—'; });
    if (summaryRoleBadge) {
      summaryRoleBadge.textContent = role;
      summaryRoleBadge.className = `role-badge ${role}`;
    }

    const modules = getVisibleModules();
    if (activeModules) {
      activeModules.innerHTML = modules.length
        ? modules.map((module) => `<span class="chip">${escapeHtml(module.name)}</span>`).join('')
        : '<span class="chip">No active modules</span>';
    }
  };

  const renderAppModuleNav = () => {
    const appModuleNav = document.getElementById('appModuleNav');
    if (!appModuleNav) return;

    const modules = getVisibleModules();
    const primaryItems = [
      { id: 'admin:dashboard', label: getConfiguredAppName() },
      ...modules.map((module) => ({ id: `admin:module:${module.id}`, label: module.name || module.id }))
    ];

    appModuleNav.innerHTML = primaryItems.map((item) => `
      <button type="button" class="nav-item ${state.activeView === item.id ? 'active' : ''}" data-app-nav="${escapeHtml(item.id)}">${escapeHtml(item.label)}</button>
    `).join('') + '<a class="nav-item" href="index.html">Open app</a>';

    appModuleNav.querySelectorAll('[data-app-nav]').forEach((button) => {
      button.addEventListener('click', () => {
        state.activeView = button.dataset.appNav;
        renderAppModuleNav();
        renderUserMenu();
        renderPageContent();
      });
    });
  };

  const fetchJson = async (url, fallback = { ok: false }, options = {}) => {
    try {
      const response = await fetch(url, { cache: 'no-store', ...options });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { ...fallback, ok: false, status: response.status, payload };
      }
      return { ok: true, ...payload, status: response.status };
    } catch (error) {
      console.warn(`Admin fetch failed for ${url}:`, error);
      return { ...fallback, ok: false, message: error && error.message ? error.message : 'Request failed.' };
    }
  };

  const getCurrentRoleHeaders = () => {
    const user = getCurrentUser();
    const roles = user && Array.isArray(user.roles) ? user.roles.filter(Boolean).map(String) : [];
    const primaryRole = roles.length ? roles[0] : 'user';

    return {
      'x-framework-user-id': user && user.id ? String(user.id) : '',
      'x-framework-role': roles.join(','),
      'x-user-role': primaryRole,
      'x-admin-role': roles.join(','),
      'x-framework-permissions': user && Array.isArray(user.permissions) ? user.permissions.filter(Boolean).map(String).join(',') : ''
    };
  };

  const postJson = async (url, payload, fallback = { ok: false }) => fetchJson(url, fallback, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getCurrentRoleHeaders() },
    body: JSON.stringify(payload)
  });

  const parseSettingValue = (input) => {
    if (!input) return '';
    const type = input.dataset.settingType || input.type || 'text';

    if (type === 'boolean' || input.type === 'checkbox') {
      return !!input.checked;
    }

    if (type === 'number') {
      return input.value === '' ? '' : Number(input.value);
    }

    return input.value;
  };

  const renderSettingInput = (setting) => {
    const path = escapeHtml(setting.path || '');
    const label = escapeHtml(setting.label || setting.key || 'Setting');
    const description = setting.description ? `<div class="small-muted">${escapeHtml(setting.description)}</div>` : '';

    if (setting.type === 'boolean') {
      return `
        <div class="form-field">
          <label><input type="checkbox" data-setting-path="${path}" data-setting-type="boolean" ${setting.value ? 'checked' : ''} /> ${label}</label>
          ${description}
        </div>
      `;
    }

    if (setting.type === 'select') {
      const options = Array.isArray(setting.options) ? setting.options : [];
      return `
        <div class="form-field">
          <label>${label}</label>
          <select data-setting-path="${path}" data-setting-type="select">
            ${options.map((option) => `<option value="${escapeHtml(option)}" ${String(setting.value) === String(option) ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}
          </select>
          ${description}
        </div>
      `;
    }

    const min = typeof setting.min === 'number' ? ` min="${setting.min}"` : '';
    const max = typeof setting.max === 'number' ? ` max="${setting.max}"` : '';
    const step = typeof setting.step === 'number' ? ` step="${setting.step}"` : '';
    const inputType = setting.type === 'number' ? 'number' : 'text';
    const value = setting.value === undefined || setting.value === null ? '' : setting.value;

    return `
      <div class="form-field">
        <label>${label}</label>
        <input type="${inputType}" value="${escapeHtml(value)}" data-setting-path="${path}" data-setting-type="${escapeHtml(setting.type || 'text')}"${min}${max}${step} />
        ${description}
      </div>
    `;
  };

  const renderSettingsSection = (section, kind = 'framework') => `
    <div class="card" data-settings-section="${escapeHtml(section.id || 'settings')}" data-settings-kind="${escapeHtml(kind)}" data-module-id="${escapeHtml(section.moduleId || '')}">
      <div class="card-header">
        <h2 class="card-title">${escapeHtml(section.title || 'Settings')}</h2>
      </div>
      <div class="content-wrap">
        ${section.description ? `<div class="small-muted" style="margin-bottom: 14px;">${escapeHtml(section.description)}</div>` : ''}
        <form class="form-grid">
          ${Array.isArray(section.settings) ? section.settings.map((setting) => renderSettingInput(setting)).join('') : ''}
          <div class="action-list">
            <button type="button" class="primary" data-admin-action="config-section-save">Save section</button>
          </div>
        </form>
        <div class="message info" data-settings-status style="margin-top: 14px;">Changes are stored locally in the active framework runtime.</div>
      </div>
    </div>
  `;

  const bindActionButtons = () => {
    document.querySelectorAll('[data-admin-action]').forEach((button) => {
      button.onclick = async (event) => {
        event.preventDefault();
        const action = button.dataset.adminAction;
        const statusTarget = document.getElementById('adminActionStatus');

        try {
          if (action === 'entity-schema-create') {
            const schemaId = document.getElementById('entitySchemaIdInput') ? document.getElementById('entitySchemaIdInput').value.trim() : '';
            const schemaName = document.getElementById('entitySchemaNameInput') ? document.getElementById('entitySchemaNameInput').value.trim() : '';
            const fieldsValue = document.getElementById('entitySchemaFieldsInput') ? document.getElementById('entitySchemaFieldsInput').value : '[]';
            const appId = (window.MasterFramework && typeof window.MasterFramework.listApps === 'function'
              ? (window.MasterFramework.listApps()[0] && (window.MasterFramework.listApps()[0].appId || window.MasterFramework.listApps()[0].id)) || 'neutral-app'
              : 'neutral-app');
            if (!schemaId) {
              throw new Error('A schema ID is required.');
            }
            let parsedFields = [];
            try {
              parsedFields = JSON.parse(fieldsValue || '[]');
            } catch (error) {
              throw new Error('Schema fields must be valid JSON.');
            }
            const schemaDefinition = {
              id: schemaId,
              name: schemaName || schemaId,
              appId,
              fields: Array.isArray(parsedFields) ? parsedFields : []
            };
            const result = window.AdminModule && typeof window.AdminModule.registerEntitySchema === 'function'
              ? window.AdminModule.registerEntitySchema(appId, schemaDefinition)
              : { ok: false, message: 'Entity schema creation is unavailable.' };
            if (statusTarget) {
              statusTarget.textContent = result && result.ok ? (result.message || 'Schema created.') : (result && result.message) || 'Schema creation failed.';
              statusTarget.className = result && result.ok ? 'message success' : 'message error';
            }
            if (result && result.ok) {
              renderAdminData();
            }
          }

          if (action === 'entity-schema-delete') {
            const appId = button.dataset.entityAppId || '';
            const entityId = button.dataset.entitySchemaId || '';
            const result = window.AdminModule && typeof window.AdminModule.deleteEntitySchema === 'function'
              ? window.AdminModule.deleteEntitySchema(appId, entityId)
              : { ok: false, message: 'Schema deletion is unavailable.' };
            if (statusTarget) {
              statusTarget.textContent = result && result.ok ? (result.message || 'Schema deleted.') : (result && result.message) || 'Schema deletion failed.';
              statusTarget.className = result && result.ok ? 'message success' : 'message error';
            }
            if (result && result.ok) {
              renderAdminData();
            }
          }

          if (action === 'entity-record-delete') {
            const appId = button.dataset.entityAppId || '';
            const entityId = button.dataset.entitySchemaId || '';
            const recordId = button.dataset.entityRecordId || '';
            const result = window.AdminModule && typeof window.AdminModule.deleteEntityRecord === 'function'
              ? window.AdminModule.deleteEntityRecord(appId, entityId, recordId)
              : { ok: false, message: 'Record deletion is unavailable.' };
            if (statusTarget) {
              statusTarget.textContent = result && result.ok ? (result.message || 'Record deleted.') : (result && result.message) || 'Record deletion failed.';
              statusTarget.className = result && result.ok ? 'message success' : 'message error';
            }
            if (result && result.ok) {
              renderAdminData();
            }
          }

          if (action === 'server-test') {
            const form = document.querySelector('[data-setup-form]');
            const payload = {
              serverUrl: (form && form.querySelector('[name="serverUrl"]')) ? form.querySelector('[name="serverUrl"]').value : (document.getElementById('serverUrlInput') ? document.getElementById('serverUrlInput').value : ''),
              apiBase: (form && form.querySelector('[name="apiBase"]')) ? form.querySelector('[name="apiBase"]').value : (document.getElementById('serverApiBaseInput') ? document.getElementById('serverApiBaseInput').value : '/api')
            };
            const result = await postJson('/api/server/test', payload, { ok: false, result: { status: 'ERROR', message: 'Server test failed.' } });
            if (statusTarget) {
              statusTarget.textContent = result && result.result && result.result.message ? result.result.message : 'Server test failed.';
              statusTarget.className = result && result.ok ? 'message success' : 'message error';
            }
          }

          if (action === 'database-test') {
            const form = document.querySelector('[data-setup-form]');
            const payload = {
              type: (form && form.querySelector('[name="databaseType"]')) ? form.querySelector('[name="databaseType"]').value : (document.getElementById('dbTypeInput') ? document.getElementById('dbTypeInput').value : 'indexeddb'),
              name: (form && form.querySelector('[name="databaseName"]')) ? form.querySelector('[name="databaseName"]').value : (document.getElementById('dbNameInput') ? document.getElementById('dbNameInput').value : ''),
              host: (form && form.querySelector('[name="databaseHost"]')) ? form.querySelector('[name="databaseHost"]').value : (document.getElementById('dbHostInput') ? document.getElementById('dbHostInput').value : ''),
              port: ((form && form.querySelector('[name="databasePort"]')) ? Number(form.querySelector('[name="databasePort"]').value || 0) : (document.getElementById('dbPortInput') ? Number(document.getElementById('dbPortInput').value || 0) : 0)) || undefined,
              username: (form && form.querySelector('[name="databaseUser"]')) ? form.querySelector('[name="databaseUser"]').value : '',
              password: (form && form.querySelector('[name="databasePassword"]')) ? form.querySelector('[name="databasePassword"]').value : '',
              url: (form && form.querySelector('[name="databaseUrl"]')) ? form.querySelector('[name="databaseUrl"]').value : (document.getElementById('dbUrlInput') ? document.getElementById('dbUrlInput').value : '')
            };
            const result = await postJson('/api/database/test', payload, { ok: false, status: 'NOT_CONFIGURED', database: { message: 'Database not configured.' } });
            if (statusTarget) {
              statusTarget.textContent = result && result.database && result.database.message ? result.database.message : 'Database test unavailable.';
              statusTarget.className = result && result.ok ? 'message success' : 'message warning';
            }
          }

          if (action === 'connection-save') {
            const form = button.closest('form');
            if (!form) return;
            const payload = Object.fromEntries(new FormData(form).entries());
            const finalPayload = {
              connectionId: payload.connectionId || payload.name || 'default-storage',
              appId: payload.appId || 'neutral-app',
              serverUrl: payload.serverUrl || payload.url || '',
              apiBase: payload.apiBase || '/api',
              storageType: payload.storageType || payload.type || 'file',
              connectionType: payload.storageType || payload.type || 'file',
              databaseType: payload.databaseType || payload.storageType || 'file',
              databaseName: payload.databaseName || payload.database || '',
              storagePath: payload.storagePath || payload.path || '',
              host: payload.host || '',
              port: payload.port || '',
              username: payload.username || '',
              password: payload.password || '',
              active: payload.active === 'on' || payload.active === 'true' || payload.active === true,
              default: payload.default === 'on' || payload.default === 'true' || payload.default === true,
              status: payload.status || (payload.active === 'on' || payload.active === 'true' ? 'active' : 'inactive'),
              authType: payload.authType || 'none',
              credentialsRef: payload.credentialsRef || ''
            };
            if (window.ConfigManager && typeof window.ConfigManager.get === 'function') {
              const current = window.ConfigManager.get('connections', { connections: [] }) || { connections: [] };
              const nextConnections = Array.isArray(current.connections) ? [...current.connections] : [];
              const existingIndex = nextConnections.findIndex((entry) => String(entry.connectionId || entry.id) === String(finalPayload.connectionId));
              const entry = {
                connectionId: finalPayload.connectionId,
                name: finalPayload.connectionId,
                type: finalPayload.storageType,
                storageType: finalPayload.storageType,
                databaseType: finalPayload.databaseType,
                databaseName: finalPayload.databaseName,
                storagePath: finalPayload.storagePath,
                host: finalPayload.host,
                port: finalPayload.port,
                username: finalPayload.username,
                status: finalPayload.status,
                active: finalPayload.active,
                default: finalPayload.default,
                lastModified: new Date().toISOString()
              };
              if (existingIndex >= 0) {
                nextConnections[existingIndex] = { ...nextConnections[existingIndex], ...entry };
              } else {
                nextConnections.push(entry);
              }
              window.ConfigManager.set('connections', {
                ...current,
                defaultConnectionId: finalPayload.default ? finalPayload.connectionId : (current.defaultConnectionId || finalPayload.connectionId),
                activeConnectionId: finalPayload.connectionId,
                activeStorageType: finalPayload.storageType,
                connections: nextConnections
              });
            }
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('neutral.connections.v1', JSON.stringify({
                defaultConnectionId: finalPayload.connectionId,
                activeConnectionId: finalPayload.connectionId,
                activeStorageType: finalPayload.storageType,
                connections: [finalPayload]
              }));
            }
            const result = await postJson('/api/connections', finalPayload, { ok: false, connection: null, message: 'Connection save failed.' });
            if (statusTarget) {
              statusTarget.textContent = result && result.ok ? 'Connection saved.' : (result && result.message ? result.message : 'Connection save failed.');
              statusTarget.className = result && result.ok ? 'message success' : 'message error';
            }
          }

          if (action === 'module-template-create') {
            const manager = window.AdminModule || null;
            if (!manager || typeof manager.createModuleFromTemplate !== 'function') {
              if (statusTarget) {
                statusTarget.className = 'message error';
                statusTarget.textContent = 'Module template creation is unavailable.';
              }
              return;
            }

            const templateSelect = document.getElementById('moduleTemplateSelect');
            const moduleIdInput = document.getElementById('moduleTemplateModuleId');
            const nameInput = document.getElementById('moduleTemplateName');
            const appInput = document.getElementById('moduleTemplateAppId');

            const result = manager.createModuleFromTemplate(templateSelect ? templateSelect.value : '', {
              moduleId: moduleIdInput ? moduleIdInput.value : '',
              name: nameInput ? nameInput.value : '',
              appId: appInput ? appInput.value : 'neutral-app'
            });

            if (statusTarget) {
              statusTarget.textContent = result && result.ok ? (result.message || 'Module created.') : (result && result.message) || 'Module template creation failed.';
              statusTarget.className = result && result.ok ? 'message success' : 'message error';
            }

            if (result && result.ok) {
              renderAdminModules();
              renderPageContent();
            }
          }

          if (action === 'app-select-active') {
            const appId = button.dataset.appId || document.getElementById('appConfigAppId')?.value || '';
            if (!appId) {
              throw new Error('Select an app before activating it.');
            }
            if (!window.MasterFramework || typeof window.MasterFramework.setActiveApp !== 'function') {
              throw new Error('App runtime manager is unavailable.');
            }
            const runtime = window.MasterFramework.setActiveApp(appId);
            if (window.ConfigManager && typeof window.ConfigManager.set === 'function') {
              window.ConfigManager.set('app', {
                ...(window.ConfigManager.get('app', {})),
                name: runtime && runtime.ui && runtime.ui.appName ? runtime.ui.appName : (window.MasterFramework.getApp(appId)?.name || appId),
                appId: appId,
                defaultAppId: appId
              });
            }
            if (statusTarget) {
              statusTarget.textContent = runtime && runtime.appId ? `Active app set to ${runtime.appId}.` : 'App activated.';
              statusTarget.className = 'message success';
            }
            renderAdminApps();
            renderPageContent();
          }

          if (action === 'app-config-save') {
            const appId = document.getElementById('appConfigAppId') ? document.getElementById('appConfigAppId').value : '';
            const appName = document.getElementById('appConfigName') ? document.getElementById('appConfigName').value : '';
            const appMode = document.getElementById('appConfigMode') ? document.getElementById('appConfigMode').value : 'local';
            const storageType = document.getElementById('appConfigStorageType') ? document.getElementById('appConfigStorageType').value : 'file';
            const defaultView = document.getElementById('appConfigDefaultView') ? document.getElementById('appConfigDefaultView').value : 'dashboard';

            if (!appId) {
              throw new Error('App ID is required.');
            }
            if (!window.MasterFramework || typeof window.MasterFramework.getApp !== 'function') {
              throw new Error('App runtime manager is unavailable.');
            }

            const app = window.MasterFramework.getApp(appId);
            if (!app) {
              throw new Error(`App not found: ${appId}`);
            }

            app.name = appName || app.name || appId;
            app.config = {
              ...(app.config || {}),
              mode: appMode,
              storageType,
              defaultView,
              appId
            };
            app.runtimeState = {
              ...(app.runtimeState || {}),
              ...window.MasterFramework.getAppRuntimeState(appId, app)
            };
            app.updatedAt = new Date().toISOString();

            if (window.ConfigManager && typeof window.ConfigManager.set === 'function') {
              window.ConfigManager.set('app', {
                ...(window.ConfigManager.get('app', {})),
                name: app.name,
                appId: appId,
                defaultAppId: appId,
                mode: appMode,
                storageType,
                defaultView
              });
            }

            if (window.ConfigManager && typeof window.ConfigManager.set === 'function') {
              const connections = window.ConfigManager.get('connections', { connections: [] });
              const nextConnections = Array.isArray(connections.connections) ? [...connections.connections] : [];
              const next = {
                ...(connections || {}),
                defaultConnectionId: nextConnections.find((entry) => entry && entry.storageType === storageType)?.connectionId || 'file-storage',
                activeConnectionId: nextConnections.find((entry) => entry && entry.storageType === storageType)?.connectionId || 'file-storage',
                activeStorageType: storageType,
                connections: nextConnections.length ? nextConnections.map((entry) => ({
                  ...entry,
                  active: entry.storageType === storageType || entry.default,
                  default: entry.storageType === storageType || (!!entry.default && entry.storageType === storageType),
                  storageType: entry.storageType || storageType,
                  appId: appId
                })) : [{
                  connectionId: `${appId}-storage`,
                  name: `${app.name} default storage`,
                  type: storageType,
                  storageType,
                  status: 'active',
                  active: true,
                  default: true,
                  path: 'data',
                  appId: appId,
                  description: `Default ${storageType} storage for ${app.name}.`
                }]
              };
              window.ConfigManager.set('connections', next);
            }

            if (window.MasterFramework && typeof window.MasterFramework.setActiveApp === 'function') {
              window.MasterFramework.setActiveApp(appId);
            }

            if (statusTarget) {
              statusTarget.textContent = `App settings saved for ${appId}.`;
              statusTarget.className = 'message success';
            }
            renderAdminApps();
            renderPageContent();
          }

          if (action === 'app-template-create') {
            const manager = window.AdminModule || null;
            if (!manager || typeof manager.createAppFromTemplate !== 'function') {
              if (statusTarget) {
                statusTarget.className = 'message error';
                statusTarget.textContent = 'App template creation is unavailable.';
              }
              return;
            }

            const templateId = button.dataset.templateId || document.getElementById('appTemplateSelect')?.value || '';
            const appName = document.getElementById('appTemplateName') ? document.getElementById('appTemplateName').value : '';
            const result = manager.createAppFromTemplate(templateId, {
              appId: '',
              name: appName || '',
              active: true
            });

            if (statusTarget) {
              statusTarget.textContent = result && result.ok ? (result.message || 'App created.') : (result && result.message) || 'App template creation failed.';
              statusTarget.className = result && result.ok ? 'message success' : 'message error';
            }

            if (result && result.ok) {
              renderAdminApps();
              renderPageContent();
            }
          }

          if (action === 'device-save') {
            const payload = {
              deviceId: document.getElementById('deviceIdInput') ? document.getElementById('deviceIdInput').value : '',
              name: document.getElementById('deviceNameInput') ? document.getElementById('deviceNameInput').value : '',
              type: document.getElementById('deviceTypeInput') ? document.getElementById('deviceTypeInput').value : 'generic',
              status: document.getElementById('deviceStatusInput') ? document.getElementById('deviceStatusInput').value : 'inactive',
              userId: document.getElementById('deviceUserIdInput') ? document.getElementById('deviceUserIdInput').value : '',
              lastContactAt: document.getElementById('deviceContactInput') ? document.getElementById('deviceContactInput').value : ''
            };
            const result = await postJson('/api/devices', payload, { ok: false, device: null });
            if (statusTarget) {
              statusTarget.textContent = result && result.ok ? 'Device saved.' : (result && result.message ? result.message : 'Device save failed.');
              statusTarget.className = result && result.ok ? 'message success' : 'message error';
            }
          }

          if (action === 'license-save') {
            const payload = {
              licenseId: document.getElementById('licenseIdInput') ? document.getElementById('licenseIdInput').value : '',
              type: document.getElementById('licenseTypeInput') ? document.getElementById('licenseTypeInput').value : 'standard',
              status: document.getElementById('licenseStatusInput') ? document.getElementById('licenseStatusInput').value : 'inactive',
              validUntil: document.getElementById('licenseValidUntilInput') ? document.getElementById('licenseValidUntilInput').value : '',
              userId: document.getElementById('licenseUserIdInput') ? document.getElementById('licenseUserIdInput').value : '',
              deviceId: document.getElementById('licenseDeviceIdInput') ? document.getElementById('licenseDeviceIdInput').value : ''
            };
            const result = await postJson('/api/licenses', payload, { ok: false, license: null });
            if (statusTarget) {
              statusTarget.textContent = result && result.ok ? 'License saved.' : (result && result.message ? result.message : 'License save failed.');
              statusTarget.className = result && result.ok ? 'message success' : 'message error';
            }
          }

          if (action === 'user-save') {
            const actor = getCurrentUser();
            if (!actor) {
              throw new Error('User management requires an authenticated admin or developer.');
            }
            const rawRole = document.getElementById('newUserRoleInput') ? document.getElementById('newUserRoleInput').value : 'user';
            const rawPermissions = document.getElementById('newUserPermissionsInput') ? document.getElementById('newUserPermissionsInput').value : '';
            const payload = {
              username: document.getElementById('newUserUsernameInput') ? document.getElementById('newUserUsernameInput').value : '',
              displayName: document.getElementById('newUserDisplayNameInput') ? document.getElementById('newUserDisplayNameInput').value : '',
              email: document.getElementById('newUserEmailInput') ? document.getElementById('newUserEmailInput').value : '',
              roles: parseCommaList(rawRole || 'user').length ? parseCommaList(rawRole || 'user') : ['user'],
              permissions: parseCommaList(rawPermissions)
            };
            if (!window.AdminModule || typeof window.AdminModule.createUser !== 'function') {
              throw new Error('User management is unavailable.');
            }
            const result = await window.AdminModule.createUser(payload, actor);
            if (statusTarget) {
              statusTarget.textContent = result && result.ok ? 'User created.' : (result && result.message ? result.message : 'User creation failed.');
              statusTarget.className = result && result.ok ? 'message success' : 'message error';
            }
            if (result && result.ok) {
              await renderAdminUsers();
            }
          }

          if (action === 'user-edit-open') {
            const userId = button.dataset.userId;
            if (!userId || !window.UserModule || typeof window.UserModule.getUserById !== 'function') {
              throw new Error('User details are unavailable.');
            }
            const result = await window.UserModule.getUserById(userId);
            const user = result && result.ok ? result.data : null;
            if (!user) {
              throw new Error('User not found.');
            }

            const usernameInput = document.getElementById('editUserUsernameInput');
            const displayNameInput = document.getElementById('editUserDisplayNameInput');
            const emailInput = document.getElementById('editUserEmailInput');
            const roleInput = document.getElementById('editUserRoleInput');
            const permissionsInput = document.getElementById('editUserPermissionsInput');
            const statusInput = document.getElementById('editUserStatusInput');
            const idInput = document.getElementById('editUserIdInput');

            if (idInput) idInput.value = user.id || '';
            if (usernameInput) usernameInput.value = user.username || '';
            if (displayNameInput) displayNameInput.value = user.displayName || user.username || '';
            if (emailInput) emailInput.value = user.email || '';
            if (roleInput) roleInput.value = Array.isArray(user.roles) && user.roles.length ? user.roles[0] : 'user';
            if (permissionsInput) permissionsInput.value = Array.isArray(user.permissions) ? user.permissions.join(', ') : '';
            if (statusInput) statusInput.value = user.status || 'active';

            const form = document.getElementById('userEditForm');
            if (form) {
              form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }

          if (action === 'user-update') {
            const actor = getCurrentUser();
            if (!actor) {
              throw new Error('User management requires an authenticated admin or developer.');
            }

            const userId = document.getElementById('editUserIdInput') ? document.getElementById('editUserIdInput').value : '';
            const rawRole = document.getElementById('editUserRoleInput') ? document.getElementById('editUserRoleInput').value : 'user';
            const rawStatus = document.getElementById('editUserStatusInput') ? document.getElementById('editUserStatusInput').value : 'active';
            const rawPermissions = document.getElementById('editUserPermissionsInput') ? document.getElementById('editUserPermissionsInput').value : '';

            const updates = {
              username: document.getElementById('editUserUsernameInput') ? document.getElementById('editUserUsernameInput').value : '',
              displayName: document.getElementById('editUserDisplayNameInput') ? document.getElementById('editUserDisplayNameInput').value : '',
              email: document.getElementById('editUserEmailInput') ? document.getElementById('editUserEmailInput').value : '',
              roles: parseCommaList(rawRole || 'user').length ? parseCommaList(rawRole || 'user') : ['user'],
              permissions: parseCommaList(rawPermissions),
              status: rawStatus || 'active'
            };

            if (!window.AdminModule || typeof window.AdminModule.updateUser !== 'function') {
              throw new Error('User update is unavailable.');
            }

            const result = await window.AdminModule.updateUser(userId, updates, actor);
            if (statusTarget) {
              statusTarget.textContent = result && result.ok ? 'User updated.' : (result && result.message ? result.message : 'User update failed.');
              statusTarget.className = result && result.ok ? 'message success' : 'message error';
            }
            if (result && result.ok) {
              await renderAdminUsers();
            }
          }

          if (action === 'user-delete') {
            const actor = getCurrentUser();
            const userId = button.dataset.userId;
            if (!actor) {
              throw new Error('User management requires an authenticated admin or developer.');
            }
            if (!userId) {
              throw new Error('User ID is required for delete action.');
            }
            if (!window.AdminModule || typeof window.AdminModule.deleteUser !== 'function') {
              throw new Error('User management is unavailable.');
            }
            const result = await window.AdminModule.deleteUser(userId, actor);
            if (statusTarget) {
              statusTarget.textContent = result && result.ok ? 'User deleted.' : (result && result.message ? result.message : 'User deletion failed.');
              statusTarget.className = result && result.ok ? 'message success' : 'message error';
            }
            if (result && result.ok) {
              await renderAdminUsers();
            }
          }

          if (action === 'updates-check') {
            const payload = {
              currentVersion: document.getElementById('updateCurrentVersionInput') ? document.getElementById('updateCurrentVersionInput').value : '',
              availableVersion: document.getElementById('updateAvailableVersionInput') ? document.getElementById('updateAvailableVersionInput').value : '',
              source: document.getElementById('updateSourceInput') ? document.getElementById('updateSourceInput').value : 'local'
            };
            const result = await postJson('/api/updates/check', payload, { ok: false, updates: {} });
            if (statusTarget) {
              statusTarget.textContent = result && result.updates && result.updates.message ? result.updates.message : 'Update check failed.';
              statusTarget.className = result && result.ok ? 'message success' : 'message error';
            }
          }

          if (action === 'config-section-save') {
            const section = button.closest('[data-settings-section]');
            const sectionStatusTarget = section ? section.querySelector('[data-settings-status]') : statusTarget;
            if (!section) {
              throw new Error('Settings section not found.');
            }

            if (!window.AdminModule || typeof window.AdminModule.updateSettings !== 'function') {
              throw new Error('Administrative settings are unavailable.');
            }

            const updates = Array.from(section.querySelectorAll('[data-setting-path]')).map((input) => ({
              path: input.dataset.settingPath,
              value: parseSettingValue(input)
            }));

            const result = await window.AdminModule.updateSettings(updates, getCurrentUser() || 'system');
            if (sectionStatusTarget) {
              sectionStatusTarget.textContent = result && result.ok
                ? 'Settings saved successfully.'
                : (result && result.message ? result.message : 'Settings save failed.');
              sectionStatusTarget.className = result && result.ok ? 'message success' : 'message error';
            }
            renderSummary();
            renderAppModuleNav();
            renderUserMenu();
          }

          if (action === 'setup-save') {
            const form = button.closest('form');
            if (!form) return;
            const serverUrl = form.querySelector('[name="serverUrl"]') ? form.querySelector('[name="serverUrl"]').value : '';
            const apiBase = form.querySelector('[name="apiBase"]') ? form.querySelector('[name="apiBase"]').value : '/api';
            const databaseType = form.querySelector('[name="databaseType"]') ? form.querySelector('[name="databaseType"]').value : 'indexeddb';
            const databaseHost = form.querySelector('[name="databaseHost"]') ? form.querySelector('[name="databaseHost"]').value : '';
            const databasePortValue = form.querySelector('[name="databasePort"]') ? form.querySelector('[name="databasePort"]').value : '';
            const databasePort = databasePortValue === '' ? undefined : Number(databasePortValue);
            const databaseName = form.querySelector('[name="databaseName"]') ? form.querySelector('[name="databaseName"]').value : '';
            const databaseUser = form.querySelector('[name="databaseUser"]') ? form.querySelector('[name="databaseUser"]').value : '';
            const databasePassword = form.querySelector('[name="databasePassword"]') ? form.querySelector('[name="databasePassword"]').value : '';
            const payload = {
              appId: form.querySelector('[name="appId"]') ? form.querySelector('[name="appId"]').value : 'neutral-app',
              appName: form.querySelector('[name="appName"]') ? form.querySelector('[name="appName"]').value : getConfiguredAppName(),
              configuration: {
                serverUrl,
                apiBase,
                database: {
                  type: databaseType,
                  host: databaseHost,
                  port: databasePort,
                  name: databaseName,
                  username: databaseUser,
                  password: databasePassword
                }
              },
              serverState: {
                configured: true,
                url: serverUrl,
                apiBase,
                status: 'CONFIGURATION_REQUIRED'
              },
              databaseState: {
                configured: !!(databaseType || databaseHost || databaseName || databaseUser || databasePassword),
                type: databaseType,
                host: databaseHost,
                port: databasePort,
                name: databaseName,
                username: databaseUser,
                password: databasePassword,
                status: 'CONFIGURATION_REQUIRED'
              },
              bootstrapState: {
                configured: true,
                enabled: true,
                username: 'developer',
                displayId: 'USR-000001',
                role: 'developer'
              }
            };
            const result = await postJson('/api/setup', payload, { ok: false, setup: {} });
            if (window.ConfigManager && typeof window.ConfigManager.setPath === 'function') {
              window.ConfigManager.setPath('app.name', payload.appName);
              if (typeof window.ConfigManager.persist === 'function') {
                window.ConfigManager.persist('app');
              }
            }
            if (statusTarget) {
              statusTarget.textContent = result && result.ok ? 'Setup saved successfully.' : 'Setup could not be saved.';
              statusTarget.className = result && result.ok ? 'message success' : 'message error';
            }
            renderSummary();
            renderAppModuleNav();
            renderUserMenu();
          }

          if (action === 'setup-activate') {
            const result = await postJson('/api/setup/activate', {
              currentStep: 'runtime',
              message: 'Installation activated.'
            }, { ok: false, setup: {} });
            if (statusTarget) {
              statusTarget.textContent = result && result.ok ? 'System activated. Redirecting to admin workspace.' : 'Activation failed.';
              statusTarget.className = result && result.ok ? 'message success' : 'message error';
            }
            if (result && result.ok) {
              setTimeout(() => { window.location.replace('admin.html'); }, 500);
            }
          }
        } catch (error) {
          if (statusTarget) {
            statusTarget.className = 'message error';
            statusTarget.textContent = error && error.message ? error.message : 'Action failed.';
          }
        }
      };
    });
  };

  const getModuleCatalog = () => {
    if (window.AdminModule && typeof window.AdminModule.getModuleCatalog === 'function') {
      return window.AdminModule.getModuleCatalog();
    }

    return window.ModuleRegistry && typeof window.ModuleRegistry.getAll === 'function'
      ? window.ModuleRegistry.getAll()
      : [];
  };

  const getFrameworkVersion = () => {
    if (window.CoreConfig && window.CoreConfig.core && typeof window.CoreConfig.core.version === 'string') {
      return window.CoreConfig.core.version;
    }
    if (window.MasterFramework && typeof window.MasterFramework.version === 'string') {
      return window.MasterFramework.version;
    }
    if (window.App && typeof window.App.version === 'string') {
      return window.App.version;
    }
    return '1.0.0';
  };

  const getModuleActionState = (module) => {
    const active = !!(module && (module.active || module.status === 'enabled' || module.status === 'active'));
    return {
      active,
      status: active ? 'enabled' : 'available',
      label: active ? 'Disable' : 'Enable'
    };
  };

  const getLifecycleActionButtons = (module) => {
    const actionState = getModuleActionState(module);
    const moduleId = module && module.id ? module.id : '';

    return `
      <div class="action-list" style="gap: 8px; justify-content: flex-start;">
        <button type="button" class="secondary" data-module-action="toggle" data-module-id="${escapeHtml(moduleId)}">${actionState.label}</button>
        <button type="button" class="secondary" data-module-action="uninstall" data-module-id="${escapeHtml(moduleId)}">Uninstall</button>
      </div>
    `;
  };

  const getAppVersion = () => {
    if (window.App && typeof window.App.version === 'string') {
      return window.App.version;
    }
    if (window.MasterFramework && window.MasterFramework.getApp && typeof window.MasterFramework.getApp === 'function') {
      const app = window.MasterFramework.getApp('neutral-app');
      if (app && app.version) return app.version;
    }
    return '1.0.0';
  };

  const getDatabaseStatus = () => {
    if (window.DatabaseManager && typeof window.DatabaseManager.getStatus === 'function') {
      const status = window.DatabaseManager.getStatus();
      if (status && typeof status === 'object') {
        return status;
      }
    }
    return {
      status: 'NOT_CONFIGURED',
      configured: false,
      initialized: false,
      message: 'Database not configured.'
    };
  };

  const describeDatabaseStatus = (status) => {
    if (!status) return 'Database not configured';
    if (typeof status === 'string') return status;
    return status.message || status.status || 'Database not configured';
  };

  const getServerStatus = async () => {
    const [healthResult, statusResult] = await Promise.all([
      fetchJson('/health', { ok: true, status: 'unknown' }),
      fetchJson('/api/status', { ok: true, runtime: {}, framework: {} })
    ]);
    return {
      health: healthResult && healthResult.status ? healthResult.status : 'unknown',
      api: statusResult && statusResult.ok ? 'healthy' : 'unavailable',
      runtime: statusResult && statusResult.runtime ? statusResult.runtime : {},
      framework: statusResult && statusResult.framework ? statusResult.framework : {}
    };
  };

  const renderAdminDashboard = async () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const registry = getModuleCatalog();
    const activeCount = registry.filter((module) => module && (module.active || module.status === 'enabled' || module.status === 'active')).length;
    const currentUser = getCurrentUser();
    const sessionState = window.CoreAuth && typeof window.CoreAuth.getSessionStateSnapshot === 'function'
      ? window.CoreAuth.getSessionStateSnapshot()
      : { authenticated: !!currentUser, username: currentUser ? currentUser.username : null, roles: currentUser ? currentUser.roles || [] : [] };
    const stats = window.AdminModule && typeof window.AdminModule.getSystemStats === 'function'
      ? await window.AdminModule.getSystemStats()
      : { moduleCount: registry.length, userCount: 0, uptime: 0 };
    const serverStatus = await getServerStatus();
    const errorCount = window.ErrorLog && typeof window.ErrorLog.getAll === 'function' ? window.ErrorLog.getAll().length : 0;
    const frameworkStats = serverStatus.framework && serverStatus.framework.framework ? serverStatus.framework.framework : {};

    const cards = [
      { label: 'Framework version', value: getFrameworkVersion() },
      { label: 'API version', value: (serverStatus.framework && serverStatus.framework.apiVersion) || 'v1' },
      { label: 'App version', value: getAppVersion() },
      { label: 'System status', value: window.AdminModule && typeof window.AdminModule.healthCheck === 'function' ? (window.AdminModule.healthCheck().healthy ? 'Operational' : 'Warning') : 'Unknown' },
      { label: 'Server status', value: serverStatus.api === 'healthy' ? 'Healthy' : 'Unavailable' },
      { label: 'Database status', value: describeDatabaseStatus(getDatabaseStatus()) },
      { label: 'Connection status', value: typeof serverStatus.framework.connections === 'number' ? `${serverStatus.framework.connections} configured` : 'Unknown' },
      { label: 'Module count', value: String(stats.moduleCount || registry.length) },
      { label: 'Active modules', value: String(activeCount) },
      { label: 'Device count', value: String(typeof frameworkStats.devices === 'number' ? frameworkStats.devices : 0) },
      { label: 'License count', value: String(typeof frameworkStats.licenses === 'number' ? frameworkStats.licenses : 0) },
      { label: 'Update status', value: frameworkStats.updateStatus || 'NOT_CONFIGURED' },
      { label: 'Error count', value: String(errorCount) },
      { label: 'Current user', value: sessionState.username || (currentUser ? currentUser.username : 'guest') },
      { label: 'Current role', value: (sessionState.roles && sessionState.roles.length ? sessionState.roles.join(', ') : 'user') }
    ];

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Framework dashboard</h2></div>
        <div class="content-wrap">
          <div class="grid">
            ${cards.map((card) => `
              <div class="metric">
                <span class="metric-label">${escapeHtml(card.label)}</span>
                <div class="metric-value">${escapeHtml(card.value)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  };

  const renderAdminAudit = () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const entries = window.CoreAudit && typeof window.CoreAudit.list === 'function'
      ? window.CoreAudit.list()
      : [];
    const summary = window.CoreAudit && typeof window.CoreAudit.summary === 'function'
      ? window.CoreAudit.summary()
      : { total: entries.length, success: 0, error: 0, warning: 0, info: 0, actors: [], actions: [], resources: [] };
    const actorOptions = ['all', ...summary.actors].filter((value, index, list) => list.indexOf(value) === index);
    const actionOptions = ['all', ...summary.actions].filter((value, index, list) => list.indexOf(value) === index);
    const resourceOptions = ['all', ...summary.resources].filter((value, index, list) => list.indexOf(value) === index);
    const resultOptions = ['all', 'success', 'ok', 'error', 'failed', 'warning', 'info'];
    const activeActor = document.getElementById('auditActorFilter') ? document.getElementById('auditActorFilter').value : 'all';
    const activeAction = document.getElementById('auditActionFilter') ? document.getElementById('auditActionFilter').value : 'all';
    const activeResource = document.getElementById('auditResourceFilter') ? document.getElementById('auditResourceFilter').value : 'all';
    const activeResult = document.getElementById('auditResultFilter') ? document.getElementById('auditResultFilter').value : 'all';
    const searchValue = document.getElementById('auditSearchInput') ? String(document.getElementById('auditSearchInput').value || '').trim().toLowerCase() : '';

    const filteredEntries = (window.CoreAudit && typeof window.CoreAudit.filter === 'function'
      ? window.CoreAudit.filter({
          actor: activeActor,
          action: activeAction,
          resource: activeResource,
          result: activeResult,
          search: searchValue
        })
      : entries.filter((entry) => {
          const actorMatches = activeActor === 'all' || String(entry.actor || 'system') === activeActor;
          const actionMatches = activeAction === 'all' || String(entry.action || 'unknown') === activeAction;
          const resourceMatches = activeResource === 'all' || String(entry.resource || 'resource') === activeResource;
          const resultMatches = activeResult === 'all' || String(entry.result || 'unknown') === activeResult;
          const searchMatches = !searchValue || [entry.actor, entry.action, entry.resource, entry.result, JSON.stringify(entry.metadata || {})].join(' ').toLowerCase().includes(searchValue);
          return actorMatches && actionMatches && resourceMatches && resultMatches && searchMatches;
        }))
      .slice(0, 120);

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Audit</h2></div>
        <div class="content-wrap">
          <div class="grid">
            <div class="metric"><span class="metric-label">Total entries</span><div class="metric-value">${summary.total}</div></div>
            <div class="metric"><span class="metric-label">Success</span><div class="metric-value">${summary.success}</div></div>
            <div class="metric"><span class="metric-label">Errors</span><div class="metric-value">${summary.error}</div></div>
            <div class="metric"><span class="metric-label">Warnings</span><div class="metric-value">${summary.warning}</div></div>
          </div>

          <div class="card" style="margin-top: 18px;">
            <div class="card-header"><h3 class="card-title">Filters</h3></div>
            <div class="content-wrap">
              <div class="form-grid">
                <div class="form-field"><label>Actor</label><select id="auditActorFilter">${actorOptions.map((option) => `<option value="${escapeHtml(option)}" ${option === activeActor ? 'selected' : ''}>${escapeHtml(option === 'all' ? 'All actors' : option)}</option>`).join('')}</select></div>
                <div class="form-field"><label>Action</label><select id="auditActionFilter">${actionOptions.map((option) => `<option value="${escapeHtml(option)}" ${option === activeAction ? 'selected' : ''}>${escapeHtml(option === 'all' ? 'All actions' : option)}</option>`).join('')}</select></div>
                <div class="form-field"><label>Resource</label><select id="auditResourceFilter">${resourceOptions.map((option) => `<option value="${escapeHtml(option)}" ${option === activeResource ? 'selected' : ''}>${escapeHtml(option === 'all' ? 'All resources' : option)}</option>`).join('')}</select></div>
                <div class="form-field"><label>Result</label><select id="auditResultFilter">${resultOptions.map((option) => `<option value="${escapeHtml(option)}" ${option === activeResult ? 'selected' : ''}>${escapeHtml(option === 'all' ? 'All results' : option)}</option>`).join('')}</select></div>
                <div class="form-field" style="grid-column: 1 / -1;"><label>Search</label><input id="auditSearchInput" type="text" value="${escapeHtml(searchValue)}" placeholder="Search actor, action, resource or metadata" /></div>
              </div>
            </div>
          </div>

          <div class="table-wrap" style="margin-top: 18px;">
            <table>
              <thead><tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Resource</th><th>Result</th><th>Metadata</th></tr></thead>
              <tbody>
                ${filteredEntries.length ? filteredEntries.map((entry) => `
                  <tr>
                    <td>${escapeHtml(new Date(entry.timestamp || Date.now()).toLocaleString())}</td>
                    <td>${escapeHtml(entry.actor || 'system')}</td>
                    <td>${escapeHtml(entry.action || 'unknown')}</td>
                    <td>${escapeHtml(entry.resource || 'resource')}</td>
                    <td><span class="status-badge ${String(entry.result || 'unknown').toLowerCase() === 'success' || String(entry.result || 'unknown').toLowerCase() === 'ok' ? 'ok' : (String(entry.result || 'unknown').toLowerCase() === 'error' || String(entry.result || 'unknown').toLowerCase() === 'failed' ? 'warning' : 'ok')}">${escapeHtml(entry.result || 'unknown')}</span></td>
                    <td>${escapeHtml(JSON.stringify(entry.metadata || {}))}</td>
                  </tr>
                `).join('') : '<tr><td colspan="6">No audit entries match the current filters.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    page.querySelectorAll('#auditActorFilter, #auditActionFilter, #auditResourceFilter, #auditResultFilter, #auditSearchInput').forEach((control) => {
      control.addEventListener('input', renderAdminAudit);
      control.addEventListener('change', renderAdminAudit);
    });
  };

  const renderAdminApps = () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const appRegistry = window.MasterFramework && typeof window.MasterFramework.listApps === 'function'
      ? window.MasterFramework.listApps()
      : [];
    const appTemplates = window.MasterFramework && typeof window.MasterFramework.listAppTemplates === 'function'
      ? window.MasterFramework.listAppTemplates()
      : [];
    const activeApp = window.MasterFramework && typeof window.MasterFramework.getActiveApp === 'function'
      ? window.MasterFramework.getActiveApp()
      : (appRegistry.find((app) => app.active || app.status === 'active') || appRegistry[0] || null);
    const apps = appRegistry.length ? appRegistry : [{
      appId: 'neutral-app',
      name: getConfiguredAppName(),
      version: getAppVersion(),
      status: 'active',
      description: 'Default neutral application shell.'
    }];

    const selectedAppId = activeApp && (activeApp.appId || activeApp.id) ? (activeApp.appId || activeApp.id) : (apps[0] && (apps[0].appId || apps[0].id)) || 'neutral-app';
    const selectedApp = apps.find((app) => (app.appId || app.id) === selectedAppId) || apps[0] || null;
    const selectedName = selectedApp && (selectedApp.name || selectedApp.appId || 'Neutral App');
    const selectedMode = selectedApp && selectedApp.config && selectedApp.config.mode ? selectedApp.config.mode : 'local';
    const selectedStorageType = selectedApp && selectedApp.config && selectedApp.config.storageType ? selectedApp.config.storageType : 'file';
    const selectedDefaultView = selectedApp && selectedApp.config && selectedApp.config.defaultView ? selectedApp.config.defaultView : 'dashboard';

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Apps</h2></div>
        <div class="content-wrap">
          <div class="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Version</th><th>Status</th><th>Active app</th><th>Description</th></tr></thead>
              <tbody>
                ${apps.map((app) => {
                  const appId = app.appId || app.id || 'unknown';
                  const isActive = !!(window.MasterFramework && typeof window.MasterFramework.getActiveApp === 'function' && (window.MasterFramework.getActiveApp() && ((window.MasterFramework.getActiveApp().appId || window.MasterFramework.getActiveApp().id) === appId)));
                  return `
                    <tr>
                      <td>${escapeHtml(appId)}</td>
                      <td>${escapeHtml(app.name || appId || 'Unnamed app')}</td>
                      <td>${escapeHtml(app.version || '1.0.0')}</td>
                      <td><span class="status-badge ${app.active || app.status === 'active' ? 'ok' : 'warning'}">${escapeHtml(app.status || (app.active ? 'active' : 'inactive'))}</span></td>
                      <td>${isActive ? '<span class="status-badge ok">Active</span>' : '<button type="button" class="secondary" data-admin-action="app-select-active" data-app-id="' + escapeHtml(appId) + '">Set active</button>'}</td>
                      <td>${escapeHtml(app.description || 'No description available')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="spacer" style="height: 18px;"></div>
          <div class="subsection">
            <h3 style="margin: 0 0 12px;">Selected app configuration</h3>
            <div class="form-grid" style="max-width: 700px;">
              <div class="form-field">
                <label>App ID</label>
                <input id="appConfigAppId" type="text" value="${escapeHtml(selectedAppId)}" readonly />
              </div>
              <div class="form-field">
                <label>App name</label>
                <input id="appConfigName" type="text" value="${escapeHtml(selectedName)}" />
              </div>
              <div class="form-field">
                <label>Mode</label>
                <select id="appConfigMode">
                  <option value="local" ${selectedMode === 'local' ? 'selected' : ''}>local</option>
                  <option value="preview" ${selectedMode === 'preview' ? 'selected' : ''}>preview</option>
                  <option value="server" ${selectedMode === 'server' ? 'selected' : ''}>server</option>
                </select>
              </div>
              <div class="form-field">
                <label>Default storage</label>
                <select id="appConfigStorageType">
                  <option value="file" ${selectedStorageType === 'file' ? 'selected' : ''}>file</option>
                  <option value="sqlite" ${selectedStorageType === 'sqlite' ? 'selected' : ''}>sqlite</option>
                  <option value="mysql" ${selectedStorageType === 'mysql' ? 'selected' : ''}>mysql</option>
                  <option value="postgresql" ${selectedStorageType === 'postgresql' ? 'selected' : ''}>postgresql</option>
                </select>
              </div>
              <div class="form-field">
                <label>Default view</label>
                <input id="appConfigDefaultView" type="text" value="${escapeHtml(selectedDefaultView)}" />
              </div>
            </div>
            <div class="action-list" style="margin-top: 16px;">
              <button type="button" class="primary" data-admin-action="app-config-save">Save app settings</button>
            </div>
          </div>

          <div class="spacer" style="height: 14px;"></div>
          <div class="subsection">
            <h3 style="margin: 0 0 12px;">Create app from template</h3>
            <div class="form-grid" style="max-width: 520px;">
              <div class="form-field">
                <label>Template</label>
                <select id="appTemplateSelect">
                  ${appTemplates.length ? appTemplates.map((template) => `<option value="${escapeHtml(template.id)}">${escapeHtml(template.name || template.id)}</option>`).join('') : '<option value="">No templates available</option>'}
                </select>
              </div>
              <div class="form-field">
                <label>App name</label>
                <input id="appTemplateName" type="text" placeholder="My new app" />
              </div>
            </div>
            <div class="action-list" style="margin-top: 16px;">
              <button type="button" class="primary" data-admin-action="app-template-create" ${!appTemplates.length ? 'disabled' : ''}>Create app</button>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const renderAdminData = () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const appId = (window.MasterFramework && typeof window.MasterFramework.listApps === 'function'
      ? (window.MasterFramework.listApps()[0] && (window.MasterFramework.listApps()[0].appId || window.MasterFramework.listApps()[0].id)) || 'neutral-app'
      : 'neutral-app');
    const schemas = window.AdminModule && typeof window.AdminModule.getEntitySchemas === 'function'
      ? window.AdminModule.getEntitySchemas(appId)
      : [];

    const fieldExample = JSON.stringify([
      { key: 'name', name: 'Name', type: 'string', required: true },
      { key: 'quantity', name: 'Quantity', type: 'number', required: true },
      { key: 'active', name: 'Active', type: 'boolean', defaultValue: true }
    ], null, 2);

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Data</h2></div>
        <div class="content-wrap">
          <div id="adminActionStatus" class="message info">Manage app-specific entity schemas and records in the active app runtime.</div>

          <div class="card" style="margin-top: 18px;">
            <div class="card-header"><h3 class="card-title">Create schema</h3></div>
            <div class="content-wrap">
              <div class="form-grid">
                <div class="form-field">
                  <label>Schema ID</label>
                  <input id="entitySchemaIdInput" type="text" placeholder="inventory" />
                </div>
                <div class="form-field">
                  <label>Schema name</label>
                  <input id="entitySchemaNameInput" type="text" placeholder="Inventory" />
                </div>
                <div class="form-field" style="grid-column: 1 / -1;">
                  <label>Fields (JSON array)</label>
                  <textarea id="entitySchemaFieldsInput" rows="8">${escapeHtml(fieldExample)}</textarea>
                </div>
              </div>
              <div class="action-list" style="margin-top: 14px;">
                <button type="button" class="primary" data-admin-action="entity-schema-create">Create schema</button>
              </div>
            </div>
          </div>

          ${schemas.length ? schemas.map((schema) => {
            const rows = Array.isArray(schema.fields) ? schema.fields : [];
            const records = window.AdminModule && typeof window.AdminModule.listEntityRecords === 'function'
              ? window.AdminModule.listEntityRecords(appId, schema.id)
              : [];
            const schemaFieldsJson = JSON.stringify(rows, null, 2);

            return `
              <div class="card" style="margin-top: 20px;">
                <div class="card-header"><h3 class="card-title">${escapeHtml(schema.name || schema.id)}</h3></div>
                <div class="content-wrap">
                  <div class="small-muted">App: ${escapeHtml(schema.appId || appId)} · ID: ${escapeHtml(schema.id || 'schema')}</div>
                  <div class="action-list" style="margin-top: 12px; justify-content: flex-start;">
                    <button type="button" class="secondary" data-admin-action="entity-schema-delete" data-entity-app-id="${escapeHtml(appId)}" data-entity-schema-id="${escapeHtml(schema.id || '')}">Delete schema</button>
                  </div>
                  <div class="table-wrap" style="margin-top: 12px;">
                    <table>
                      <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Default</th></tr></thead>
                      <tbody>
                        ${rows.length ? rows.map((field) => `
                          <tr>
                            <td>${escapeHtml(field.key || field.name || field.id || 'field')}</td>
                            <td>${escapeHtml(field.type || 'string')}</td>
                            <td>${field.required ? 'Yes' : 'No'}</td>
                            <td>${field.defaultValue === undefined ? '—' : escapeHtml(String(field.defaultValue))}</td>
                          </tr>
                        `).join('') : '<tr><td colspan="4">No fields defined.</td></tr>'}
                      </tbody>
                    </table>
                  </div>

                  <form class="form-grid" style="margin-top: 16px;" data-entity-schema-form data-entity-app-id="${escapeHtml(appId)}" data-entity-schema-id="${escapeHtml(schema.id || '')}">
                    <div class="form-field">
                      <label>Schema name</label>
                      <input type="text" name="schemaName" value="${escapeHtml(schema.name || schema.id || '')}" />
                    </div>
                    <div class="form-field" style="grid-column: 1 / -1;">
                      <label>Fields (JSON)</label>
                      <textarea name="schemaFields" rows="8">${escapeHtml(schemaFieldsJson)}</textarea>
                    </div>
                    <div class="action-list" style="grid-column: 1 / -1;">
                      <button type="submit" class="primary">Update schema</button>
                    </div>
                  </form>

                  <form class="form-grid" style="margin-top: 16px;" data-entity-record-form data-entity-app-id="${escapeHtml(appId)}" data-entity-schema-id="${escapeHtml(schema.id || '')}">
                    ${rows.length ? rows.map((field) => {
                      const fieldType = String(field.type || 'string').toLowerCase();
                      const fieldKey = field.key || field.name || field.id || 'field';
                      const fieldLabel = escapeHtml(field.label || field.name || fieldKey);
                      const defaultValue = field.defaultValue === undefined ? '' : escapeHtml(String(field.defaultValue));
                      if (fieldType === 'boolean') {
                        return `
                          <div class="form-field">
                            <label><input type="checkbox" name="${escapeHtml(fieldKey)}" data-field-key="${escapeHtml(fieldKey)}" data-field-type="boolean" ${field.defaultValue ? 'checked' : ''} /> ${fieldLabel}</label>
                          </div>
                        `;
                      }
                      if (fieldType === 'number') {
                        return `
                          <div class="form-field">
                            <label>${fieldLabel}</label>
                            <input type="number" name="${escapeHtml(fieldKey)}" data-field-key="${escapeHtml(fieldKey)}" data-field-type="number" value="${defaultValue}" />
                          </div>
                        `;
                      }
                      if (fieldType === 'date' || fieldType === 'datetime') {
                        return `
                          <div class="form-field">
                            <label>${fieldLabel}</label>
                            <input type="datetime-local" name="${escapeHtml(fieldKey)}" data-field-key="${escapeHtml(fieldKey)}" data-field-type="${escapeHtml(fieldType)}" value="${defaultValue}" />
                          </div>
                        `;
                      }
                      return `
                        <div class="form-field">
                          <label>${fieldLabel}</label>
                          <input type="text" name="${escapeHtml(fieldKey)}" data-field-key="${escapeHtml(fieldKey)}" data-field-type="${escapeHtml(fieldType)}" value="${defaultValue}" />
                        </div>
                      `;
                    }).join('') : '<div class="small-muted">Add fields to create a record form.</div>'}
                    <div class="action-list" style="grid-column: 1 / -1;">
                      <button type="submit" class="primary" ${rows.length ? '' : 'disabled'}>Create record</button>
                    </div>
                  </form>

                  <div class="table-wrap" style="margin-top: 16px;">
                    <table>
                      <thead><tr><th>ID</th>${rows.length ? rows.map((field) => `<th>${escapeHtml(field.key || field.name || field.id || 'field')}</th>`).join('') : '<th>Value</th>'}</tr></thead>
                      <tbody>
                        ${records.length ? records.map((record) => `
                          <tr>
                            <td>${escapeHtml(record.id || 'record')}</td>
                            ${rows.length ? rows.map((field) => {
                              const fieldKey = field.key || field.name || field.id || 'field';
                              const value = record && Object.prototype.hasOwnProperty.call(record, fieldKey) ? record[fieldKey] : '';
                              return `<td>${escapeHtml(Array.isArray(value) ? value.join(', ') : (typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value ?? '')))}</td>`;
                            }).join('') : `<td>—</td>`}
                            <td><button type="button" class="secondary" data-admin-action="entity-record-delete" data-entity-app-id="${escapeHtml(appId)}" data-entity-schema-id="${escapeHtml(schema.id || '')}" data-entity-record-id="${escapeHtml(record.id || '')}">Delete</button></td>
                          </tr>
                        `).join('') : '<tr><td colspan="${Math.max(2, (rows.length || 1) + 1)}">No records created yet.</td></tr>'}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            `;
          }).join('') : '<div class="message warning" style="margin-top: 18px;">No schemas are registered for this app yet.</div>'}
        </div>
      </div>
    `;

    page.querySelectorAll('[data-entity-schema-form]').forEach((form) => {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const appIdValue = form.dataset.entityAppId || appId;
        const entityId = form.dataset.entitySchemaId || '';
        const schemaName = form.querySelector('[name="schemaName"]') ? form.querySelector('[name="schemaName"]').value.trim() : '';
        const fieldsValue = form.querySelector('[name="schemaFields"]') ? form.querySelector('[name="schemaFields"]').value : '[]';
        let parsedFields = [];
        try {
          parsedFields = JSON.parse(fieldsValue || '[]');
        } catch (error) {
          const statusTarget = document.getElementById('adminActionStatus');
          if (statusTarget) {
            statusTarget.className = 'message error';
            statusTarget.textContent = 'Schema fields must be valid JSON.';
          }
          return;
        }

        const result = window.AdminModule && typeof window.AdminModule.updateEntitySchema === 'function'
          ? window.AdminModule.updateEntitySchema(appIdValue, entityId, { name: schemaName || entityId, fields: Array.isArray(parsedFields) ? parsedFields : [] })
          : { ok: false, message: 'Schema editor is unavailable.' };

        const statusTarget = document.getElementById('adminActionStatus');
        if (statusTarget) {
          statusTarget.className = result && result.ok ? 'message success' : 'message error';
          statusTarget.textContent = result && result.ok ? (result.message || 'Schema updated successfully.') : (result && result.message) || 'Schema update failed.';
        }
        if (result && result.ok) {
          renderAdminData();
        }
      });
    });

    page.querySelectorAll('[data-entity-record-form]').forEach((form) => {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const appIdValue = form.dataset.entityAppId || appId;
        const entityId = form.dataset.entitySchemaId || '';
        const payload = {};
        form.querySelectorAll('[data-field-key]').forEach((field) => {
          const key = field.dataset.fieldKey;
          if (!key) return;
          if (field.type === 'checkbox') {
            payload[key] = !!field.checked;
            return;
          }
          if (field.dataset.fieldType === 'number') {
            payload[key] = field.value === '' ? 0 : Number(field.value);
            return;
          }
          payload[key] = field.value;
        });

        const result = window.AdminModule && typeof window.AdminModule.createEntityRecord === 'function'
          ? window.AdminModule.createEntityRecord(appIdValue, entityId, payload)
          : { ok: false, message: 'Data engine is unavailable.' };

        const statusTarget = document.getElementById('adminActionStatus');
        if (statusTarget) {
          statusTarget.className = result && result.ok ? 'message success' : 'message error';
          statusTarget.textContent = result && result.ok ? 'Record created successfully.' : (result && result.message) || 'Record creation failed.';
        }
        if (result && result.ok) {
          renderAdminData();
        }
      });
    });

    bindActionButtons();
  };

  const renderAdminModules = () => {
    const page = document.getElementById('mainContent');
    if (!page) return;
    const modules = getModuleCatalog();
    const roleCatalog = getRoleCatalog();
    const defaultAppId = (window.MasterFramework && typeof window.MasterFramework.listApps === 'function'
      ? (window.MasterFramework.listApps()[0] && (window.MasterFramework.listApps()[0].appId || window.MasterFramework.listApps()[0].id)) || 'neutral-app'
      : 'neutral-app');
    const moduleMatrix = window.AdminModule && typeof window.AdminModule.getModuleAccessMatrix === 'function'
      ? window.AdminModule.getModuleAccessMatrix(defaultAppId)
      : [];
    const featureMatrix = window.AdminModule && typeof window.AdminModule.getFeatureAccessMatrix === 'function'
      ? window.AdminModule.getFeatureAccessMatrix(defaultAppId)
      : [];
    const accessLookup = {};
    moduleMatrix.forEach((roleEntry) => {
      const roleId = roleEntry.role || 'user';
      (roleEntry.modules || []).forEach((entry) => {
        accessLookup[`${roleId}:${entry.id}`] = !!entry.enabled;
      });
    });
    const featureLookup = {};
    featureMatrix.forEach((roleEntry) => {
      const roleId = roleEntry.role || 'user';
      (roleEntry.features || []).forEach((entry) => {
        featureLookup[`${roleId}:${entry.id}`] = !!entry.enabled;
      });
    });
    const appFeatures = Array.isArray((window.MasterFramework && typeof window.MasterFramework.getApp === 'function'
      ? window.MasterFramework.getApp(defaultAppId)
      : null)?.featureTemplates) && (window.MasterFramework && typeof window.MasterFramework.getApp === 'function'
        ? window.MasterFramework.getApp(defaultAppId)
        : null).featureTemplates.length
      ? (window.MasterFramework.getApp(defaultAppId)).featureTemplates
      : [
          { id: 'overview', label: 'Overview' },
          { id: 'profile', label: 'Profile' },
          { id: 'modules', label: 'Modules' }
        ];

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Modules</h2></div>
        <div class="content-wrap">
          <div id="adminModuleActionStatus" class="message info">Module state is managed directly through the runtime registry.</div>
          <div class="table-wrap" style="margin-top: 18px;">
            <table>
              <thead>
                <tr><th>ID</th><th>Name</th><th>Version</th><th>Status</th><th>Type</th><th>Dependencies</th><th>Capabilities</th><th>Admin</th><th>Actions</th></tr>
              </thead>
              <tbody>
                ${modules.length ? modules.map((module) => {
                  const actionState = getModuleActionState(module);
                  return `
                   <tr>
                     <td>${escapeHtml(module.id || 'unknown')}</td>
                     <td>${escapeHtml(module.name || module.id || 'Module')}</td>
                     <td>${escapeHtml(module.version || '1.0.0')}</td>
                     <td><span class="status-badge ${actionState.active ? 'ok' : 'warning'}">${escapeHtml(actionState.status)}</span></td>
                     <td>${escapeHtml(module.type || 'framework')}</td>
                     <td>${escapeHtml(Array.isArray(module.dependencies) ? module.dependencies.join(', ') : '')}</td>
                     <td>${escapeHtml(Array.isArray(module.capabilities) ? module.capabilities.join(', ') : '')}</td>
                     <td>${module.adminSettingsCount ? `<span class="status-badge ok">${module.adminSettingsCount} setting${module.adminSettingsCount === 1 ? '' : 's'}</span>` : '<span class="status-badge warning">No schema</span>'}</td>
                     <td>
                       <div class="action-list" style="gap: 8px; justify-content: flex-start;">
                         <button type="button" class="secondary" data-module-action="edit" data-module-id="${escapeHtml(module.id || '')}">Edit</button>
                         <button type="button" class="secondary" data-module-action="toggle" data-module-id="${escapeHtml(module.id || '')}">${actionState.label}</button>
                         <button type="button" class="secondary" data-module-action="uninstall" data-module-id="${escapeHtml(module.id || '')}">Uninstall</button>
                         ${module.adminSettingsCount ? `<button type="button" class="secondary" data-admin-open-settings data-module-id="${escapeHtml(module.id || '')}">Open settings</button>` : ''}
                       </div>
                     </td>
                   </tr>
                  `;
                }).join('') : '<tr><td colspan="9">No modules discovered.</td></tr>'}
              </tbody>
            </table>
          </div>

          <div class="card" style="margin-top: 24px;">
            <div class="card-header"><h3 class="card-title">App role access matrix</h3></div>
            <div class="content-wrap">
              <div class="small-muted">This matrix controls which roles can access which modules within the active app shell.</div>
              <div class="table-wrap" style="margin-top: 18px;">
                <table>
                  <thead>
                   <tr>
                     <th>Module</th>
                     ${roleCatalog.map((role) => `<th>${escapeHtml(role.name || role.role || 'Role')}</th>`).join('')}
                   </tr>
                  </thead>
                  <tbody>
                   ${modules.length ? modules.map((module) => `
                     <tr>
                       <td>${escapeHtml(module.name || module.id || 'Module')}</td>
                       ${roleCatalog.map((role) => {
                         const roleId = role.role || role.name || 'user';
                         const enabled = !!accessLookup[`${roleId}:${module.id}`];
                         return `<td><button type="button" class="secondary" data-role-module-toggle data-module-id="${escapeHtml(module.id || '')}" data-role-id="${escapeHtml(roleId)}" data-enabled="${enabled ? 'true' : 'false'}">${enabled ? 'Allow' : 'Blocked'}</button></td>`;
                       }).join('')}
                     </tr>
                   `).join('') : '<tr><td colspan="2">No module access data available.</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="card" style="margin-top: 24px;">
            <div class="card-header"><h3 class="card-title">App feature access matrix</h3></div>
            <div class="content-wrap">
              <div class="small-muted">Feature areas can be grouped and controlled independently from module activation so future apps can expose different feature sets by role.</div>
              <div class="table-wrap" style="margin-top: 18px;">
                <table>
                  <thead>
                   <tr>
                     <th>Feature</th>
                     ${roleCatalog.map((role) => `<th>${escapeHtml(role.name || role.role || 'Role')}</th>`).join('')}
                   </tr>
                  </thead>
                  <tbody>
                   ${appFeatures.length ? appFeatures.map((feature) => `
                     <tr>
                       <td>${escapeHtml(feature.label || feature.name || feature.id || 'Feature')}</td>
                       ${roleCatalog.map((role) => {
                         const roleId = role.role || role.name || 'user';
                         const enabled = !!featureLookup[`${roleId}:${feature.id}`];
                         return `<td><button type="button" class="secondary" data-feature-access-toggle data-feature-id="${escapeHtml(feature.id || '')}" data-role-id="${escapeHtml(roleId)}" data-enabled="${enabled ? 'true' : 'false'}">${enabled ? 'Allow' : 'Blocked'}</button></td>`;
                       }).join('')}
                     </tr>
                   `).join('') : '<tr><td colspan="2">No feature templates available.</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const statusTarget = document.getElementById('adminModuleActionStatus');
    page.querySelectorAll('[data-module-action="edit"]').forEach((button) => {
      button.addEventListener('click', () => {
        const moduleId = button.dataset.moduleId;
        if (!moduleId) return;
        renderAdminModuleWorkspace(moduleId);
      });
    });

    page.querySelectorAll('[data-module-action="toggle"]').forEach((button) => {
      button.addEventListener('click', async () => {
        const moduleId = button.dataset.moduleId;
        const manager = window.AdminModule || null;
        if (!moduleId || !manager || typeof manager.toggleModule !== 'function') {
          if (statusTarget) {
            statusTarget.className = 'message error';
            statusTarget.textContent = 'Module actions are unavailable.';
          }
          return;
        }

        const result = await manager.toggleModule(moduleId);
        if (statusTarget) {
          statusTarget.className = result && result.ok ? 'message success' : 'message error';
          statusTarget.textContent = result && result.ok
            ? `Module ${moduleId} is now ${result.data && result.data.active ? 'enabled' : 'disabled'}.`
            : (result && result.message) || 'Module update failed.';
        }
        renderAdminModules();
      });
    });

    page.querySelectorAll('[data-module-action="uninstall"]').forEach((button) => {
      button.addEventListener('click', async () => {
        const moduleId = button.dataset.moduleId;
        const manager = window.AdminModule || null;
        if (!moduleId || !manager || typeof manager.uninstallModule !== 'function') {
          if (statusTarget) {
            statusTarget.className = 'message error';
            statusTarget.textContent = 'Module uninstall is unavailable.';
          }
          return;
        }

        const result = await manager.uninstallModule(moduleId);
        if (statusTarget) {
          statusTarget.className = result && result.ok ? 'message success' : 'message error';
          statusTarget.textContent = result && result.ok
            ? `Module ${moduleId} was uninstalled.`
            : (result && result.message) || 'Module uninstall failed.';
        }
        renderAdminModules();
      });
    });

    page.querySelectorAll('[data-role-module-toggle]').forEach((button) => {
      button.addEventListener('click', async () => {
        const moduleId = button.dataset.moduleId;
        const roleId = button.dataset.roleId;
        const manager = window.AdminModule || null;
        if (!moduleId || !roleId || !manager || typeof manager.setModuleAccessForRole !== 'function') {
          if (statusTarget) {
            statusTarget.className = 'message error';
            statusTarget.textContent = 'Role access controls are unavailable.';
          }
          return;
        }

        const nextEnabled = button.dataset.enabled !== 'true';
        const result = await manager.setModuleAccessForRole(defaultAppId, moduleId, roleId, nextEnabled);
        if (statusTarget) {
          statusTarget.className = result && result.ok ? 'message success' : 'message error';
          statusTarget.textContent = result && result.ok
            ? `Updated ${roleId} access for ${moduleId} to ${nextEnabled ? 'allowed' : 'blocked'}.`
            : (result && result.message) || 'Role access update failed.';
        }
        renderAdminModules();
      });
    });

    page.querySelectorAll('[data-feature-access-toggle]').forEach((button) => {
      button.addEventListener('click', async () => {
        const featureId = button.dataset.featureId;
        const roleId = button.dataset.roleId;
        const manager = window.AdminModule || null;
        if (!featureId || !roleId || !manager || typeof manager.setFeatureAccessForRole !== 'function') {
          if (statusTarget) {
            statusTarget.className = 'message error';
            statusTarget.textContent = 'Feature access controls are unavailable.';
          }
          return;
        }

        const nextEnabled = button.dataset.enabled !== 'true';
        const result = await manager.setFeatureAccessForRole(defaultAppId, featureId, roleId, nextEnabled);
        if (statusTarget) {
          statusTarget.className = result && result.ok ? 'message success' : 'message error';
          statusTarget.textContent = result && result.ok
            ? `Updated ${roleId} access for feature ${featureId} to ${nextEnabled ? 'allowed' : 'blocked'}.`
            : (result && result.message) || 'Feature access update failed.';
        }
        renderAdminModules();
      });
    });

    page.querySelectorAll('[data-admin-open-settings]').forEach((button) => {
      button.addEventListener('click', () => {
        state.activeSettingsModuleId = button.dataset.moduleId || null;
        state.activeView = 'admin:settings';
        renderPageContent();
      });
    });
  };

  const renderAdminTemplates = () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const templates = window.AdminModule && typeof window.AdminModule.getModuleTemplateCatalog === 'function'
      ? window.AdminModule.getModuleTemplateCatalog()
      : [
          { id: 'content-module', name: 'Content module', type: 'app', description: 'Generic editable content module.', permissions: ['module:read'], capabilities: ['content', 'entries'] },
          { id: 'dashboard-module', name: 'Dashboard module', type: 'app', description: 'Overview and KPI module.', permissions: ['module:read'], capabilities: ['dashboard', 'overview'] },
          { id: 'data-module', name: 'Data module', type: 'app', description: 'Structured data entry module.', permissions: ['module:read', 'user:read'], capabilities: ['data-entry', 'storage'] }
        ];

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Module templates</h2></div>
        <div class="content-wrap">
          <div id="adminActionStatus" class="message info">Templates create future-ready modules without restructuring the framework core.</div>
          <div class="form-grid" style="margin: 18px 0;">
            <div class="form-field"><label>Template</label>
              <select id="moduleTemplateSelect">
                ${templates.map((template) => `<option value="${escapeHtml(template.id)}">${escapeHtml(template.name || template.id)}</option>`).join('')}
              </select>
            </div>
            <div class="form-field"><label>Module ID</label><input id="moduleTemplateModuleId" type="text" placeholder="new-report-module" /></div>
            <div class="form-field"><label>Name</label><input id="moduleTemplateName" type="text" placeholder="New report module" /></div>
            <div class="form-field"><label>App</label><input id="moduleTemplateAppId" type="text" value="neutral-app" /></div>
            <div class="action-list">
              <button type="button" class="primary" data-admin-action="module-template-create">Create module</button>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Permissions</th><th>Capabilities</th><th>Description</th></tr></thead>
              <tbody>
                ${templates.map((template) => `
                  <tr>
                    <td>${escapeHtml(template.id)}</td>
                    <td>${escapeHtml(template.name || template.id)}</td>
                    <td>${escapeHtml(template.type || 'app')}</td>
                    <td>${escapeHtml(Array.isArray(template.permissions) ? template.permissions.join(', ') : 'module:read')}</td>
                    <td>${escapeHtml(Array.isArray(template.capabilities) ? template.capabilities.join(', ') : '—')}</td>
                    <td>${escapeHtml(template.description || 'No description available')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    bindActionButtons();
  };

  const renderAdminModuleWorkspace = (moduleId) => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const module = getModuleCatalog().find((entry) => entry.id === moduleId);
    if (!module) {
      renderAdminModules();
      return;
    }

    const status = getModuleActionState(module);
    const permissionText = Array.isArray(module.permissions) && module.permissions.length ? module.permissions.join(', ') : 'No explicit permissions';
    const capabilityText = Array.isArray(module.capabilities) && module.capabilities.length ? module.capabilities.join(', ') : 'No explicit capabilities';
    page.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">${escapeHtml(module.name || module.id)}</h2>
          <span class="status-badge ${status.active ? 'ok' : 'warn'}">${escapeHtml(status.status)}</span>
        </div>
        <div class="content-wrap">
          <div class="small-muted">${escapeHtml(module.description || 'This module does not expose additional descriptive metadata yet.')}</div>
          <div class="action-list">
            <button type="button" class="secondary" data-admin-open-settings data-module-id="${escapeHtml(module.id)}">Open settings</button>
            <button type="button" class="secondary" data-module-action="toggle" data-module-id="${escapeHtml(module.id)}">${escapeHtml(status.label)}</button>
            <button type="button" class="secondary" data-module-action="back" data-module-id="${escapeHtml(module.id)}">Back to modules</button>
          </div>
          <div class="grid">
            <div class="metric"><span class="metric-label">Module ID</span><div class="metric-value">${escapeHtml(module.id)}</div></div>
            <div class="metric"><span class="metric-label">App</span><div class="metric-value">${escapeHtml(module.appId || module.manifest?.appId || 'neutral-app')}</div></div>
            <div class="metric"><span class="metric-label">Permissions</span><div class="metric-value" style="font-size:0.95rem;">${escapeHtml(permissionText)}</div></div>
            <div class="metric"><span class="metric-label">Capabilities</span><div class="metric-value" style="font-size:0.95rem;">${escapeHtml(capabilityText)}</div></div>
            <div class="metric"><span class="metric-label">Admin schema</span><div class="metric-value">${module.adminSettingsCount || 0}</div></div>
          </div>

          <div class="card" style="margin-top: 18px;">
            <div class="card-header"><h3 class="card-title">Module metadata</h3></div>
            <div class="content-wrap">
              <form id="moduleMetadataForm" class="form-grid">
                <div class="form-field"><label>App ID</label><input name="appId" value="${escapeHtml(module.appId || module.manifest?.appId || 'neutral-app')}" /></div>
                <div class="form-field"><label>Name</label><input name="name" value="${escapeHtml(module.name || module.id || '')}" /></div>
                <div class="form-field"><label>Display name</label><input name="displayName" value="${escapeHtml(module.displayName || module.name || module.id || '')}" /></div>
                <div class="form-field"><label>Type</label><input name="type" value="${escapeHtml(module.type || 'framework')}" /></div>
                <div class="form-field" style="grid-column: 1 / -1;"><label>Description</label><textarea name="description" rows="3">${escapeHtml(module.description || '')}</textarea></div>
                <div class="form-field" style="grid-column: 1 / -1;"><label>Permissions (comma separated)</label><input name="permissions" value="${escapeHtml(permissionText === 'No explicit permissions' ? '' : permissionText)}" /></div>
                <div class="form-field" style="grid-column: 1 / -1;"><label>Capabilities (comma separated)</label><input name="capabilities" value="${escapeHtml(capabilityText === 'No explicit capabilities' ? '' : capabilityText)}" /></div>
                <div class="form-field"><label>Status</label><select name="status"><option value="enabled" ${status.active ? 'selected' : ''}>Enabled</option><option value="disabled" ${status.active ? '' : 'selected'}>Disabled</option></select></div>
                <div class="action-list" style="grid-column: 1 / -1; justify-content: flex-start;">
                  <button type="submit" class="primary">Save metadata</button>
                  <button type="button" class="secondary" data-module-action="toggle" data-module-id="${escapeHtml(module.id)}">${escapeHtml(status.label)}</button>
                </div>
              </form>
            </div>
          </div>

          <div id="adminModulePreview" class="admin-module-preview"></div>
        </div>
      </div>
    `;

    const preview = document.getElementById('adminModulePreview');
    if (preview && typeof module.renderUserInterface === 'function') {
      module.renderUserInterface(preview);
    } else if (preview) {
      preview.innerHTML = '<div class="empty-state">This module does not provide a live preview yet.</div>';
    }

    const moduleForm = document.getElementById('moduleMetadataForm');
    if (moduleForm) {
      moduleForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const manager = window.AdminModule || null;
        if (!manager || typeof manager.updateModule !== 'function') {
          return;
        }

        const formData = new FormData(moduleForm);
        const payload = {
          appId: String(formData.get('appId') || '').trim(),
          name: String(formData.get('name') || '').trim(),
          displayName: String(formData.get('displayName') || '').trim(),
          type: String(formData.get('type') || '').trim(),
          description: String(formData.get('description') || '').trim(),
          permissions: String(formData.get('permissions') || '').split(',').map((entry) => entry.trim()).filter(Boolean),
          capabilities: String(formData.get('capabilities') || '').split(',').map((entry) => entry.trim()).filter(Boolean),
          status: String(formData.get('status') || 'enabled').trim()
        };

        const result = await manager.updateModule(module.id, payload);
        if (result && result.ok) {
          renderSummary();
          renderAppModuleNav();
          renderUserMenu();
          renderAdminModuleWorkspace(module.id);
        }
      });
    }

    const settingsButton = page.querySelector('[data-admin-open-settings]');
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        state.activeSettingsModuleId = module.id;
        state.activeView = 'admin:settings';
        renderAppModuleNav();
        renderUserMenu();
        renderPageContent();
      });
    }

    const backButton = page.querySelector('[data-module-action="back"]');
    if (backButton) {
      backButton.addEventListener('click', () => {
        renderAdminModules();
      });
    }

    const toggleButtons = page.querySelectorAll('[data-module-action="toggle"]');
    toggleButtons.forEach((toggleButton) => {
      toggleButton.addEventListener('click', async () => {
        const manager = window.AdminModule || null;
        if (!manager || typeof manager.toggleModule !== 'function') {
          return;
        }

        await manager.toggleModule(module.id);
        renderSummary();
        renderAppModuleNav();
        renderUserMenu();
        renderAdminModuleWorkspace(module.id);
      });
    });
  };

  const renderAdminGPS = () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const module = window.GpsModule || (window.ModuleRegistry && typeof window.ModuleRegistry.get === 'function' ? window.ModuleRegistry.get('gps') : null);
    const runtime = module ? module.getRuntimeState() : { status: 'unavailable', active: false, tracking: false, permissionState: 'unknown', lastError: null, lastPosition: null };
    const label = runtime.tracking ? 'Tracking active' : runtime.permissionState === 'denied' ? 'Permission denied' : runtime.status === 'enabled' ? 'Ready' : 'Not active';
    const position = runtime.lastPosition || null;
    const positionHtml = position ? `<div><dt>Latitude</dt><dd>${position.latitude ?? position.lat ?? '—'}</dd></div><div><dt>Longitude</dt><dd>${position.longitude ?? position.lng ?? '—'}</dd></div><div><dt>Accuracy</dt><dd>${position.accuracy ?? '—'}</dd></div><div><dt>Timestamp</dt><dd>${position.timestamp ?? '—'}</dd></div>` : '<div><dt>Position</dt><dd>Not available</dd></div>';

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">GPS module</h2></div>
        <div class="content-wrap">
          <div class="message info">Admin controls are wired to the real geolocation APIs and current module state.</div>
          <div class="gps-user-module" style="margin-top: 18px;">
            <div class="gps-heading">
              <div><span class="user-app-eyebrow">Location</span><h1>GPS</h1></div>
              <span id="gpsAdminStatus" class="gps-status ${runtime.permissionState === 'denied' ? 'error' : ''}">${label}</span>
            </div>
            <div class="gps-location-card">
              <span class="gps-location-label">Current position</span>
              <dl id="gpsAdminPosition" class="gps-position">${positionHtml}</dl>
              <div class="gps-state-line">Permission: ${runtime.permissionState}</div>
            </div>
            <div class="gps-actions" style="margin-top: 18px;">
              <button type="button" class="gps-primary-action" data-gps-action="current">Get Current Position</button>
              <button type="button" data-gps-action="start" ${runtime.tracking ? 'disabled' : ''}>Start Tracking</button>
              <button type="button" data-gps-action="stop" ${runtime.tracking ? '' : 'disabled'}>Stop Tracking</button>
            </div>
            <p id="gpsAdminMessage" class="gps-message">${runtime.lastError ? runtime.lastError.message : 'GPS module available.'}</p>
          </div>
        </div>
      </div>
    `;

    const applyState = () => {
      const nextRuntime = module && typeof module.getRuntimeState === 'function' ? module.getRuntimeState() : { status: 'unavailable', active: false, tracking: false, permissionState: 'unknown', lastError: null, lastPosition: null };
      const positionNode = document.getElementById('gpsAdminPosition');
      const statusNode = document.getElementById('gpsAdminStatus');
      const messageNode = document.getElementById('gpsAdminMessage');
      const nextPosition = nextRuntime.lastPosition || nextRuntime.lastPosition || null;
      const nextLabel = nextRuntime.tracking ? 'Tracking active' : nextRuntime.permissionState === 'denied' ? 'Permission denied' : nextRuntime.status === 'enabled' ? 'Ready' : 'Not active';
      if (positionNode) {
        const positionHtmlValue = nextPosition ? `<div><dt>Latitude</dt><dd>${nextPosition.latitude ?? nextPosition.lat ?? '—'}</dd></div><div><dt>Longitude</dt><dd>${nextPosition.longitude ?? nextPosition.lng ?? '—'}</dd></div><div><dt>Accuracy</dt><dd>${nextPosition.accuracy ?? '—'}</dd></div><div><dt>Timestamp</dt><dd>${nextPosition.timestamp ?? '—'}</dd></div>` : '<div><dt>Position</dt><dd>Not available</dd></div>';
        positionNode.innerHTML = positionHtmlValue;
      }
      if (statusNode) {
        statusNode.textContent = nextLabel;
        statusNode.className = `gps-status ${nextRuntime.permissionState === 'denied' ? 'error' : ''}`;
      }
      if (messageNode) {
        messageNode.textContent = nextRuntime.lastError ? nextRuntime.lastError.message : nextRuntime.tracking ? 'GPS tracking active.' : 'GPS module available.';
      }
    };

    const actionHandlers = {
      current: async () => {
        if (!module || typeof module.getCurrentPosition !== 'function') {
          const messageNode = document.getElementById('gpsAdminMessage');
          if (messageNode) {
            messageNode.textContent = 'GPS module is unavailable.';
          }
          return;
        }
        try {
          await module.getCurrentPosition();
          applyState();
        } catch (error) {
          const messageNode = document.getElementById('gpsAdminMessage');
          if (messageNode) {
            messageNode.textContent = error && error.code === 'PERMISSION_DENIED'
              ? 'Location permission was denied.'
              : error && error.code === 'POSITION_UNAVAILABLE'
                ? 'Position could not be determined.'
                : error && error.code === 'TIMEOUT'
                  ? 'Location request timed out.'
                  : 'Location could not be retrieved.';
          }
          applyState();
        }
      },
      start: () => {
        if (!module || typeof module.startTracking !== 'function') {
          const messageNode = document.getElementById('gpsAdminMessage');
          if (messageNode) messageNode.textContent = 'GPS module is unavailable.';
          return;
        }
        const result = module.startTracking();
        if (result && result.ok) {
          applyState();
        } else {
          const messageNode = document.getElementById('gpsAdminMessage');
          if (messageNode) {
            messageNode.textContent = result && result.code === 'PERMISSION_DENIED' ? 'Location permission was denied.' : 'Location tracking could not be started.';
          }
        }
        applyState();
      },
      stop: () => {
        if (module && typeof module.stopTracking === 'function') {
          module.stopTracking();
        }
        applyState();
      }
    };

    page.querySelectorAll('[data-gps-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.gpsAction;
        if (action && actionHandlers[action]) {
          actionHandlers[action]();
        }
      });
    });
  };

  const renderAdminMarketplace = async () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const [marketplaceResult, moduleResult] = await Promise.all([
      fetchJson('/api/marketplace', { ok: true, marketplace: { catalog: [] }, modules: [] }),
      fetchJson('/api/marketplace/modules', { ok: true, modules: [] })
    ]);

    const catalog = Array.isArray(marketplaceResult.marketplace && marketplaceResult.marketplace.catalog)
      ? marketplaceResult.marketplace.catalog
      : [];
    const modules = Array.isArray(moduleResult.modules) ? moduleResult.modules : [];

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Marketplace</h2></div>
        <div class="content-wrap">
          <div id="adminActionStatus" class="message ${catalog.length || modules.length ? 'success' : 'warning'}">
            ${escapeHtml(catalog.length || modules.length ? 'Local catalog loaded.' : 'No marketplace entries configured.')}
          </div>
          <div class="small-muted" style="margin: 12px 0 18px;">Only local and discovered entries are displayed. No external marketplace or automatic installation is used.</div>
          <h3 style="margin: 0 0 10px;">Configured catalog</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Type</th><th>Name</th><th>Version</th><th>Status</th><th>Source</th><th>Description</th></tr></thead>
              <tbody>
                ${catalog.length ? catalog.map((item) => `
                  <tr>
                    <td>${escapeHtml(item.type || 'module')}</td>
                    <td>${escapeHtml(item.name || item.id || 'Unknown')}</td>
                    <td>${escapeHtml(item.version || '1.0.0')}</td>
                    <td><span class="status-badge ${item.status === 'enabled' || item.status === 'active' ? 'ok' : 'warning'}">${escapeHtml(item.status || 'available')}</span></td>
                    <td>${escapeHtml(item.source || 'local')}</td>
                    <td>${escapeHtml(item.description || 'No description available')}</td>
                  </tr>
                `).join('') : '<tr><td colspan="6">No catalog entries configured.</td></tr>'}
              </tbody>
            </table>
          </div>
          <h3 style="margin: 20px 0 10px;">Discovered modules</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Version</th><th>Status</th><th>Source</th><th>Capabilities</th></tr></thead>
              <tbody>
                ${modules.length ? modules.map((item) => `
                  <tr>
                    <td>${escapeHtml(item.id || item.moduleId || 'unknown')}</td>
                    <td>${escapeHtml(item.name || item.id || 'Unknown')}</td>
                    <td>${escapeHtml(item.version || '1.0.0')}</td>
                    <td><span class="status-badge ${item.status === 'enabled' || item.status === 'active' ? 'ok' : 'warning'}">${escapeHtml(item.status || 'available')}</span></td>
                    <td>${escapeHtml(item.modulePath || item.source || 'local')}</td>
                    <td>${escapeHtml(Array.isArray(item.capabilities) && item.capabilities.length ? item.capabilities.join(', ') : '—')}</td>
                  </tr>
                `).join('') : '<tr><td colspan="6">No modules discovered in the local catalog.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  };

  const renderAdminConnections = async () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const fromFramework = window.MasterFramework && typeof window.MasterFramework.listConnections === 'function'
      ? window.MasterFramework.listConnections()
      : [];
    const apiResult = await fetchJson('/api/connections', { ok: true, connections: [] });
    const connections = fromFramework.length ? fromFramework : (apiResult.connections || []);
    const defaultConnection = connections[0] || {
      connectionId: 'file-storage',
      appId: 'neutral-app',
      serverUrl: 'http://127.0.0.1:3000',
      apiBase: '/api',
      storageType: 'file',
      databaseType: 'file',
      databaseName: 'data',
      host: '',
      port: '',
      username: '',
      status: 'active',
      active: true
    };

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Connections</h2></div>
        <div class="content-wrap">
          <form class="form-grid" style="margin-bottom: 18px;">
            <div class="form-field"><label>Name</label><input type="text" name="connectionId" value="${escapeHtml(defaultConnection.connectionId || defaultConnection.id || 'file-storage')}" /></div>
            <div class="form-field"><label>App</label><input type="text" name="appId" value="${escapeHtml(defaultConnection.appId || 'neutral-app')}" /></div>
            <div class="form-field"><label>Preferred storage</label>
              <select name="storageType">
                <option value="file" ${defaultConnection.storageType === 'file' || defaultConnection.type === 'file' ? 'selected' : ''}>Text / JSON files</option>
                <option value="sqlite" ${defaultConnection.storageType === 'sqlite' || defaultConnection.databaseType === 'sqlite' ? 'selected' : ''}>SQLite</option>
                <option value="mysql" ${defaultConnection.storageType === 'mysql' || defaultConnection.databaseType === 'mysql' ? 'selected' : ''}>MySQL</option>
                <option value="postgresql" ${defaultConnection.storageType === 'postgresql' || defaultConnection.databaseType === 'postgresql' ? 'selected' : ''}>PostgreSQL</option>
              </select>
            </div>
            <div class="form-field"><label>Database type</label><input type="text" name="databaseType" value="${escapeHtml(defaultConnection.databaseType || defaultConnection.type || defaultConnection.storageType || 'file')}" /></div>
            <div class="form-field"><label>Database / file name</label><input type="text" name="databaseName" value="${escapeHtml(defaultConnection.databaseName || defaultConnection.database || defaultConnection.storagePath || 'data')}" /></div>
            <div class="form-field"><label>Storage path</label><input type="text" name="storagePath" value="${escapeHtml(defaultConnection.storagePath || defaultConnection.filePath || defaultConnection.path || 'data')}" /></div>
            <div class="form-field"><label>Host</label><input type="text" name="host" value="${escapeHtml(defaultConnection.host || '')}" /></div>
            <div class="form-field"><label>Port</label><input type="text" name="port" value="${escapeHtml(defaultConnection.port || '')}" /></div>
            <div class="form-field"><label>Username</label><input type="text" name="username" value="${escapeHtml(defaultConnection.username || '')}" /></div>
            <div class="form-field"><label>Password</label><input type="password" name="password" value="" /></div>
            <div class="form-field"><label>Server URL</label><input id="connectionServerUrl" type="text" name="serverUrl" value="${escapeHtml(defaultConnection.serverUrl || 'http://127.0.0.1:3000')}" /></div>
            <div class="form-field"><label>API base</label><input type="text" name="apiBase" value="${escapeHtml(defaultConnection.apiBase || '/api')}" /></div>
            <div class="form-field"><label>Auth type</label><input type="text" name="authType" value="${escapeHtml(defaultConnection.authType || 'none')}" /></div>
            <div class="form-field"><label>Status</label><input type="text" name="status" value="${escapeHtml(defaultConnection.status || (defaultConnection.active ? 'active' : 'inactive'))}" /></div>
            <div class="form-field"><label><input type="checkbox" name="active" ${defaultConnection.active || defaultConnection.status === 'active' ? 'checked' : ''} /> Active</label></div>
            <div class="form-field"><label><input type="checkbox" name="default" ${defaultConnection.default || defaultConnection.connectionId === 'file-storage' ? 'checked' : ''} /> Default storage</label></div>
            <div class="action-list">
              <button type="button" class="primary" data-admin-action="connection-save">Save connection</button>
            </div>
          </form>
          <div id="adminActionStatus" class="message info">The connection mode can be switched between file storage and SQL storage directly from the admin area.</div>
          <div class="table-wrap" style="margin-top: 20px;">
            <table>
              <thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Target</th><th>Service</th><th>Last test</th></tr></thead>
              <tbody>
                ${connections.length ? connections.map((connection) => `
                  <tr>
                    <td>${escapeHtml(connection.connectionId || connection.id || connection.name || 'Unknown')}</td>
                    <td>${escapeHtml(connection.storageType || connection.databaseType || connection.type || connection.authType || 'file')}</td>
                    <td><span class="status-badge ${connection.active || connection.status === 'active' || connection.status === 'healthy' ? 'ok' : 'warning'}">${escapeHtml(connection.status || (connection.active ? 'active' : 'inactive'))}</span></td>
                    <td>${escapeHtml(connection.storagePath || connection.databaseName || connection.serverUrl || connection.url || '—')}</td>
                    <td>${escapeHtml(connection.appId || connection.service || 'framework')}</td>
                    <td>${escapeHtml(connection.lastTestAt || connection.updatedAt || 'never')}</td>
                  </tr>
                `).join('') : '<tr><td colspan="6">No connections configured.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    bindActionButtons();
  };

  const renderAdminServer = async () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const status = await getServerStatus();
    const health = window.AdminModule && typeof window.AdminModule.healthCheck === 'function' ? window.AdminModule.healthCheck() : { healthy: false };
    const setupStatus = await fetchJson('/api/setup/status', { ok: true, status: 'NOT_CONFIGURED', setup: {} });

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Server</h2></div>
        <div class="content-wrap">
          <div class="form-grid" style="margin-bottom: 18px;">
            <div class="form-field"><label>Server URL</label><input id="serverUrlInput" type="text" value="http://127.0.0.1:3000" /></div>
            <div class="form-field"><label>API base</label><input id="serverApiBaseInput" type="text" value="/api" /></div>
            <div class="action-list">
              <button type="button" class="primary" data-admin-action="server-test">Test server connection</button>
            </div>
          </div>
          <div id="adminActionStatus" class="message info">${escapeHtml((setupStatus && setupStatus.status) || 'NOT_CONFIGURED')}</div>
          <div class="grid">
            <div class="metric"><span class="metric-label">Server reachable</span><div class="metric-value">${status.health === 'healthy' ? 'Yes' : 'No'}</div></div>
            <div class="metric"><span class="metric-label">API reachable</span><div class="metric-value">${status.api === 'healthy' ? 'Yes' : 'No'}</div></div>
            <div class="metric"><span class="metric-label">Version</span><div class="metric-value">${escapeHtml(getFrameworkVersion())}</div></div>
            <div class="metric"><span class="metric-label">Response time</span><div class="metric-value">${status.runtime && typeof status.runtime.uptime === 'number' ? `${status.runtime.uptime}s` : 'n/a'}</div></div>
            <div class="metric"><span class="metric-label">Last check</span><div class="metric-value">${new Date().toLocaleTimeString()}</div></div>
            <div class="metric"><span class="metric-label">Error state</span><div class="metric-value">${health.healthy ? 'None' : 'Warning'}</div></div>
          </div>
        </div>
      </div>
    `;
    bindActionButtons();
  };

  const renderAdminDatabase = async () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const statusResponse = await fetchJson('/api/database/status', { ok: false, status: 'NOT_CONFIGURED', database: { configured: false, message: 'Database not configured' } });
    const status = statusResponse && statusResponse.database ? statusResponse.database : { configured: false, status: 'NOT_CONFIGURED', message: 'Database not configured' };

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Database</h2></div>
        <div class="content-wrap">
          <div class="form-grid" style="margin-bottom: 18px;">
            <div class="form-field"><label>Database type</label><input id="dbTypeInput" type="text" value="indexeddb" /></div>
            <div class="form-field"><label>Database name</label><input id="dbNameInput" type="text" value="CoreDB" /></div>
            <div class="form-field"><label>Host</label><input id="dbHostInput" type="text" value="" /></div>
            <div class="form-field"><label>URL</label><input id="dbUrlInput" type="text" value="" /></div>
            <div class="action-list">
              <button type="button" class="primary" data-admin-action="database-test">Test database configuration</button>
            </div>
          </div>
          <div id="adminActionStatus" class="message ${status.configured ? 'success' : 'warning'}">${escapeHtml(status.message || 'Database not configured')}</div>
          <div class="grid">
            <div class="metric"><span class="metric-label">State</span><div class="metric-value">${escapeHtml(status.status || 'NOT_CONFIGURED')}</div></div>
            <div class="metric"><span class="metric-label">Configured</span><div class="metric-value">${status.configured ? 'Yes' : 'No'}</div></div>
            <div class="metric"><span class="metric-label">Diagnostics</span><div class="metric-value">${escapeHtml(status.message || 'No database driver configured.')}</div></div>
          </div>
        </div>
      </div>
    `;
    bindActionButtons();
  };

  const renderAdminUsers = async () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const roleCatalog = getRoleCatalog();
    let rows = [];
    if (window.UserModule && typeof window.UserModule.listUsers === 'function') {
      const result = await window.UserModule.listUsers();
      rows = result && result.data && Array.isArray(result.data.items) ? result.data.items : (Array.isArray(result) ? result : []);
    }

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Users</h2></div>
        <div class="content-wrap">
          <div class="form-grid" style="margin-bottom: 18px;">
            <div class="form-field"><label>Username</label><input id="newUserUsernameInput" type="text" placeholder="new.user" /></div>
            <div class="form-field"><label>Display name</label><input id="newUserDisplayNameInput" type="text" placeholder="New User" /></div>
            <div class="form-field"><label>Email</label><input id="newUserEmailInput" type="email" placeholder="user@example.com" /></div>
            <div class="form-field">
              <label>Role</label>
              <select id="newUserRoleInput">
                ${roleCatalog.map((role) => `<option value="${escapeHtml(role.role)}">${escapeHtml(role.name || role.role)}</option>`).join('')}
              </select>
            </div>
            <div class="form-field"><label>Permissions</label><input id="newUserPermissionsInput" type="text" placeholder="user:read, module:read" /></div>
            <div class="action-list">
              <button type="button" class="primary" data-admin-action="user-save">Create user</button>
            </div>
          </div>

          <div id="userEditForm" class="card" style="margin-bottom: 18px;">
            <div class="card-header"><h3 class="card-title">Edit user</h3></div>
            <div class="content-wrap">
              <div class="form-grid">
                <input id="editUserIdInput" type="hidden" />
                <div class="form-field"><label>Username</label><input id="editUserUsernameInput" type="text" /></div>
                <div class="form-field"><label>Display name</label><input id="editUserDisplayNameInput" type="text" /></div>
                <div class="form-field"><label>Email</label><input id="editUserEmailInput" type="email" /></div>
                <div class="form-field">
                  <label>Role</label>
                  <select id="editUserRoleInput">
                    ${roleCatalog.map((role) => `<option value="${escapeHtml(role.role)}">${escapeHtml(role.name || role.role)}</option>`).join('')}
                  </select>
                </div>
                <div class="form-field"><label>Permissions</label><input id="editUserPermissionsInput" type="text" placeholder="user:read, module:read" /></div>
                <div class="form-field">
                  <label>Status</label>
                  <select id="editUserStatusInput">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="deleted">Deleted</option>
                  </select>
                </div>
                <div class="action-list">
                  <button type="button" class="primary" data-admin-action="user-update">Save changes</button>
                </div>
              </div>
            </div>
          </div>

          <div id="adminActionStatus" class="message info">User management uses the central framework identity layer.</div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>User ID</th><th>Username</th><th>Name</th><th>Status</th><th>Roles</th><th>Actions</th></tr></thead>
              <tbody>
                ${rows.length ? rows.map((user) => `
                  <tr>
                    <td>${escapeHtml(user.displayId || user.id || '—')}</td>
                    <td>${escapeHtml(user.username || '—')}</td>
                    <td>${escapeHtml(user.displayName || user.username || '—')}</td>
                    <td><span class="status-badge ${user.status === 'active' ? 'ok' : 'warning'}">${escapeHtml(user.status || 'active')}</span></td>
                    <td>${escapeHtml(Array.isArray(user.roles) ? user.roles.join(', ') : '')}</td>
                    <td>
                      <div class="action-list" style="gap: 8px; justify-content: flex-start;">
                        <button type="button" class="secondary" data-admin-action="user-edit-open" data-user-id="${escapeHtml(user.id || '')}">Edit</button>
                        <button type="button" class="secondary" data-admin-action="user-delete" data-user-id="${escapeHtml(user.id || '')}">Delete</button>
                      </div>
                    </td>
                  </tr>
                `).join('') : '<tr><td colspan="6">No users available.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    bindActionButtons();
  };

  const renderAdminRoles = async () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    let users = [];
    if (window.UserModule && typeof window.UserModule.listUsers === 'function') {
      const result = await window.UserModule.listUsers();
      users = result && result.data && Array.isArray(result.data.items) ? result.data.items : [];
    }

    const roleCatalog = getRoleCatalog();
    const roles = roleCatalog.map((role) => ({
      role: role.role,
      name: role.name || role.role,
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
      description: role.description || '',
      userCount: users.filter((user) => Array.isArray(user.roles) && user.roles.includes(role.role)).length
    }));

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Roles</h2></div>
        <div class="content-wrap">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Role</th><th>Name</th><th>Users</th><th>Permissions</th></tr></thead>
              <tbody>
                ${roles.map((entry) => `<tr><td>${escapeHtml(entry.role)}</td><td>${escapeHtml(entry.name)}</td><td>${escapeHtml(String(entry.userCount))}</td><td>${escapeHtml(entry.permissions.join(', ') || '—')}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  };

  const renderAdminPermissions = () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    let permissions = [];
    if (window.AdminModule && typeof window.AdminModule.getPermissionCatalog === 'function') {
      permissions = window.AdminModule.getPermissionCatalog();
    } else if (window.CoreAccess && typeof window.CoreAccess.getPermissionCatalog === 'function') {
      permissions = window.CoreAccess.getPermissionCatalog();
    } else {
      permissions = [
        { permission: 'framework:read', description: 'Core framework diagnostics' },
        { permission: 'auth:read', description: 'Core auth' },
        { permission: 'auth:write', description: 'Core auth' },
        { permission: 'module:read', description: 'Core access / module registry' },
        { permission: 'module:update', description: 'Developer access' },
        { permission: 'system:view', description: 'Admin access' },
        { permission: 'user:read', description: 'Core user module' },
        { permission: 'user:write', description: 'Core user module' },
        { permission: 'connection:read', description: 'Master framework' },
        { permission: 'connection:write', description: 'Master framework' }
      ];
    }

    const modulePermissions = (window.ModuleRegistry && typeof window.ModuleRegistry.getAll === 'function'
      ? window.ModuleRegistry.getAll()
      : []).flatMap((module) => {
        if (!module || !Array.isArray(module.permissions)) {
          return [];
        }
        return module.permissions.map((permission) => ({
          permission,
          description: `Module permission for ${module.name || module.id || 'module'}`
        }));
      });

    const merged = [...permissions, ...modulePermissions].reduce((result, entry) => {
      if (!entry || !entry.permission) {
        return result;
      }
      const key = String(entry.permission);
      if (!result.has(key)) {
        result.set(key, { permission: key, description: entry.description || 'Framework permission' });
      }
      return result;
    }, new Map());

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Permissions</h2></div>
        <div class="content-wrap">
          <div class="grid">
            ${Array.from(merged.values()).map((entry) => `<div class="metric"><span class="metric-label">${escapeHtml(entry.permission)}</span><div class="metric-value" style="font-size:0.85rem;">${escapeHtml(entry.description || 'Framework permission')}</div></div>`).join('')}
          </div>
        </div>
      </div>
    `;
  };

  const renderAdminDevices = async () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const result = await fetchJson('/api/devices', { ok: true, devices: [] });
    const devices = Array.isArray(result.devices) ? result.devices : [];
    const statusText = result.ok
      ? (devices.length ? 'Device registry loaded from the framework runtime.' : 'No devices registered yet.')
      : (result.message || 'Device registry unavailable.');

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Devices</h2></div>
        <div class="content-wrap">
          <div class="message info">${escapeHtml(statusText)}</div>
          <div class="form-grid" style="margin: 18px 0;">
            <div class="form-field"><label>Device ID</label><input id="deviceIdInput" type="text" placeholder="device-001" /></div>
            <div class="form-field"><label>Name</label><input id="deviceNameInput" type="text" placeholder="Scanner" /></div>
            <div class="form-field"><label>Type</label><input id="deviceTypeInput" type="text" placeholder="generic" /></div>
            <div class="form-field"><label>Status</label><input id="deviceStatusInput" type="text" placeholder="inactive" /></div>
            <div class="form-field"><label>User ID</label><input id="deviceUserIdInput" type="text" placeholder="optional user" /></div>
            <div class="form-field"><label>Last contact</label><input id="deviceContactInput" type="text" placeholder="2026-01-01T00:00:00.000Z" /></div>
            <div class="action-list">
              <button type="button" class="primary" data-admin-action="device-save">Save device</button>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Status</th><th>User</th><th>Last contact</th></tr></thead>
              <tbody>
                ${devices.length ? devices.map((device) => `
                  <tr>
                    <td>${escapeHtml(device.deviceId || device.id || '—')}</td>
                    <td>${escapeHtml(device.name || 'Unnamed device')}</td>
                    <td>${escapeHtml(device.type || 'generic')}</td>
                    <td><span class="status-badge ${device.status === 'active' || device.status === 'online' ? 'ok' : 'warning'}">${escapeHtml(device.status || 'inactive')}</span></td>
                    <td>${escapeHtml(device.userDisplayId || device.userId || '—')}</td>
                    <td>${escapeHtml(device.lastContactAt || device.updatedAt || 'never')}</td>
                  </tr>
                `).join('') : '<tr><td colspan="6">No devices registered.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    bindActionButtons();
  };

  const renderAdminLicenses = async () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const result = await fetchJson('/api/licenses', { ok: true, licenses: [] });
    const licenses = Array.isArray(result.licenses) ? result.licenses : [];
    const statusText = result.ok
      ? (licenses.length ? 'License registry loaded from the framework runtime.' : 'No licenses registered yet.')
      : (result.message || 'License registry unavailable.');

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Licenses</h2></div>
        <div class="content-wrap">
          <div class="message info">${escapeHtml(statusText)}</div>
          <div class="form-grid" style="margin: 18px 0;">
            <div class="form-field"><label>License ID</label><input id="licenseIdInput" type="text" placeholder="lic-001" /></div>
            <div class="form-field"><label>Type</label><input id="licenseTypeInput" type="text" placeholder="standard" /></div>
            <div class="form-field"><label>Status</label><input id="licenseStatusInput" type="text" placeholder="inactive" /></div>
            <div class="form-field"><label>Valid until</label><input id="licenseValidUntilInput" type="text" placeholder="2027-01-01" /></div>
            <div class="form-field"><label>User ID</label><input id="licenseUserIdInput" type="text" placeholder="optional user" /></div>
            <div class="form-field"><label>Device ID</label><input id="licenseDeviceIdInput" type="text" placeholder="optional device" /></div>
            <div class="action-list">
              <button type="button" class="primary" data-admin-action="license-save">Save license</button>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Type</th><th>Status</th><th>Valid from</th><th>Valid until</th><th>Assignment</th></tr></thead>
              <tbody>
                ${licenses.length ? licenses.map((license) => `
                  <tr>
                    <td>${escapeHtml(license.licenseId || license.id || '—')}</td>
                    <td>${escapeHtml(license.type || 'standard')}</td>
                    <td><span class="status-badge ${license.status === 'active' ? 'ok' : 'warning'}">${escapeHtml(license.status || 'inactive')}</span></td>
                    <td>${escapeHtml(license.validFrom || '—')}</td>
                    <td>${escapeHtml(license.validUntil || '—')}</td>
                    <td>${escapeHtml([license.userId, license.deviceId, license.appId, license.moduleId].filter(Boolean).join(' · ') || '—')}</td>
                  </tr>
                `).join('') : '<tr><td colspan="6">No licenses registered.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    bindActionButtons();
  };

  const renderAdminUpdates = async () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const [updatesResult, statusResult] = await Promise.all([
      fetchJson('/api/updates', { ok: true, updates: {} }),
      fetchJson('/api/status', { ok: true, framework: { framework: {} } })
    ]);
    const updates = updatesResult && updatesResult.updates ? updatesResult.updates : {};
    const frameworkVersion = statusResult && statusResult.framework && statusResult.framework.framework ? statusResult.framework.framework.version : getFrameworkVersion();

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Updates</h2></div>
        <div class="content-wrap">
          <div class="form-grid" style="margin-bottom: 18px;">
            <div class="form-field"><label>Current version</label><input id="updateCurrentVersionInput" type="text" value="${escapeHtml(updates.currentVersion || frameworkVersion)}" /></div>
            <div class="form-field"><label>Available version</label><input id="updateAvailableVersionInput" type="text" value="${escapeHtml(updates.availableVersion || '')}" placeholder="optional" /></div>
            <div class="form-field"><label>Source</label><input id="updateSourceInput" type="text" value="${escapeHtml(updates.source || 'local')}" /></div>
            <div class="action-list">
              <button type="button" class="primary" data-admin-action="updates-check">Check updates</button>
            </div>
          </div>
          <div id="adminActionStatus" class="message ${updates.status === 'AVAILABLE' ? 'warning' : updates.status === 'ERROR' ? 'error' : 'info'}">${escapeHtml(updates.message || 'Update state is ready.')}</div>
          <div class="grid">
            <div class="metric"><span class="metric-label">Current version</span><div class="metric-value">${escapeHtml(updates.currentVersion || frameworkVersion)}</div></div>
            <div class="metric"><span class="metric-label">Available version</span><div class="metric-value">${escapeHtml(updates.availableVersion || 'n/a')}</div></div>
            <div class="metric"><span class="metric-label">Status</span><div class="metric-value">${escapeHtml(updates.status || 'NOT_CONFIGURED')}</div></div>
            <div class="metric"><span class="metric-label">Last checked</span><div class="metric-value">${escapeHtml(updates.lastCheckedAt || 'never')}</div></div>
          </div>
          <div class="small-muted" style="margin-top:12px;">Automatic internet installation is not enabled. The API only checks locally configured update metadata.</div>
        </div>
      </div>
    `;
    bindActionButtons();
  };

  const renderAdminDiagnostics = () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const errors = window.ErrorLog && typeof window.ErrorLog.getAll === 'function' ? window.ErrorLog.getAll() : [];
    const ring = window.CoreEventRing && typeof window.CoreEventRing.get === 'function' ? window.CoreEventRing.get() : {};
    const audit = window.CoreAudit && typeof window.CoreAudit.list === 'function' ? window.CoreAudit.list() : [];

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Diagnostics</h2></div>
        <div class="content-wrap">
          <div class="grid">
            <div class="metric"><span class="metric-label">Errors</span><div class="metric-value">${errors.length}</div></div>
            <div class="metric"><span class="metric-label">Audit entries</span><div class="metric-value">${audit.length}</div></div>
            <div class="metric"><span class="metric-label">Event ring keys</span><div class="metric-value">${Object.keys(ring).length}</div></div>
          </div>
          <div class="table-wrap" style="margin-top:16px;">
            <table>
              <thead><tr><th>Time</th><th>Module</th><th>Message</th><th>Status</th></tr></thead>
              <tbody>
                ${errors.length ? errors.slice(0, 8).map((entry) => `
                  <tr>
                    <td>${escapeHtml(entry.timestamp || 'unknown')}</td>
                    <td>${escapeHtml((entry.context && entry.context.type) || 'system')}</td>
                    <td>${escapeHtml(entry.message || 'No message')}</td>
                    <td><span class="status-badge warning">logged</span></td>
                  </tr>
                `).join('') : '<tr><td colspan="4">No errors recorded.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  };

  const renderAdminSettings = async () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const setupResult = await fetchJson('/api/setup/status', { ok: true, status: 'NOT_CONFIGURED', setup: {} });
    const settingsCatalog = window.AdminModule && typeof window.AdminModule.getSettingsCatalog === 'function'
      ? window.AdminModule.getSettingsCatalog()
      : { ok: true, data: { framework: [], modules: [] } };
    const setup = setupResult.setup || {};
    const configuration = setup.configuration || {};
    const installation = setup.installation || {};
    const frameworkSections = settingsCatalog && settingsCatalog.data && Array.isArray(settingsCatalog.data.framework)
      ? settingsCatalog.data.framework
      : [];
    const moduleSections = settingsCatalog && settingsCatalog.data && Array.isArray(settingsCatalog.data.modules)
      ? [...settingsCatalog.data.modules]
      : [];

    if (state.activeSettingsModuleId) {
      moduleSections.sort((left, right) => {
        if (left.moduleId === state.activeSettingsModuleId) return -1;
        if (right.moduleId === state.activeSettingsModuleId) return 1;
        return String(left.title || '').localeCompare(String(right.title || ''));
      });
    }

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Settings</h2></div>
        <div class="content-wrap">
          <form class="form-grid" style="margin-bottom: 18px;">
            <div class="form-field"><label>App ID</label><input type="text" name="appId" value="${escapeHtml(setup.appId || 'neutral-app')}" /></div>
            <div class="form-field"><label>App name</label><input type="text" name="appName" value="${escapeHtml(setup.appName || getConfiguredAppName())}" /></div>
            <div class="form-field"><label>Server URL</label><input type="text" name="serverUrl" value="${escapeHtml(configuration.serverUrl || 'http://127.0.0.1:3000')}" /></div>
            <div class="form-field"><label>API base</label><input type="text" name="apiBase" value="${escapeHtml(configuration.apiBase || '/api')}" /></div>
            <div class="form-field"><label>Database type</label><input type="text" name="databaseType" value="${escapeHtml((configuration.database && configuration.database.type) || 'indexeddb')}" /></div>
            <div class="form-field"><label>Database name</label><input type="text" name="databaseName" value="${escapeHtml((configuration.database && configuration.database.name) || 'CoreDB')}" /></div>
            <div class="action-list">
              <button type="button" class="primary" data-admin-action="setup-save">Save framework settings</button>
            </div>
          </form>
          <div id="adminActionStatus" class="message info">Setup status: ${escapeHtml(setup.status || 'NOT_CONFIGURED')} · installation: ${escapeHtml((installation && installation.state) || 'draft')}</div>
          <div class="grid" style="margin-top: 18px;">
            <div class="metric"><span class="metric-label">Status</span><div class="metric-value">${escapeHtml(setup.status || 'NOT_CONFIGURED')}</div></div>
            <div class="metric"><span class="metric-label">Current step</span><div class="metric-value">${escapeHtml(setup.currentStep || 'system-check')}</div></div>
            <div class="metric"><span class="metric-label">Installation active</span><div class="metric-value">${installation && installation.active ? 'Yes' : 'No'}</div></div>
            <div class="metric"><span class="metric-label">Updated at</span><div class="metric-value">${escapeHtml(setup.updatedAt || 'n/a')}</div></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h2 class="card-title">CMS settings registry</h2></div>
        <div class="content-wrap">
          <div class="grid">
            <div class="metric"><span class="metric-label">Framework sections</span><div class="metric-value">${frameworkSections.length}</div></div>
            <div class="metric"><span class="metric-label">Module sections</span><div class="metric-value">${moduleSections.length}</div></div>
            <div class="metric"><span class="metric-label">Focused module</span><div class="metric-value">${escapeHtml(state.activeSettingsModuleId || 'All modules')}</div></div>
          </div>
          <div class="small-muted" style="margin-top: 14px;">Framework defaults and module-defined admin settings are rendered from schema metadata, so new modules can appear here without bespoke admin page code.</div>
        </div>
      </div>
      ${frameworkSections.map((section) => renderSettingsSection(section, 'framework')).join('')}
      ${moduleSections.length ? moduleSections.map((section) => renderSettingsSection(section, 'module')).join('') : `
        <div class="card">
          <div class="card-header"><h2 class="card-title">Module settings</h2></div>
          <div class="content-wrap">No modules currently expose an admin settings schema.</div>
        </div>
      `}
    `;
    bindActionButtons();
  };

  const renderSetupPage = async () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const setupResult = await fetchJson('/api/setup/status', { ok: true, status: 'NOT_CONFIGURED', setup: {} });
    const setup = setupResult.setup || {};
    const configuration = setup.configuration || {};
    const installation = setup.installation || {};

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">First-run setup</h2></div>
        <div class="content-wrap">
          <div class="message info">This installation is not active yet. Configure the server, test the connections, and activate the system before using the admin workspace.</div>
          <form data-setup-form>
            <div class="form-grid" style="margin-top: 18px; margin-bottom: 18px;">
              <div class="form-field"><label>Application ID</label><input type="text" name="appId" value="${escapeHtml(setup.appId || 'neutral-app')}" /></div>
              <div class="form-field"><label>Application name</label><input type="text" name="appName" value="${escapeHtml(setup.appName || getConfiguredAppName())}" /></div>
              <div class="form-field"><label>Server URL</label><input type="text" name="serverUrl" value="${escapeHtml(configuration.serverUrl || 'https://your-domain.example')}" /></div>
              <div class="form-field"><label>API base</label><input type="text" name="apiBase" value="${escapeHtml(configuration.apiBase || '/api')}" /></div>
              <div class="form-field"><label>Database type</label><input type="text" name="databaseType" value="${escapeHtml((configuration.database && configuration.database.type) || 'indexeddb')}" /></div>
              <div class="form-field"><label>Database host</label><input type="text" name="databaseHost" value="${escapeHtml((configuration.database && configuration.database.host) || '127.0.0.1')}" /></div>
              <div class="form-field"><label>Database port</label><input type="number" min="1" max="65535" name="databasePort" value="${escapeHtml((configuration.database && configuration.database.port) || '3306')}" /></div>
              <div class="form-field"><label>Database name</label><input type="text" name="databaseName" value="${escapeHtml((configuration.database && configuration.database.name) || 'CoreDB')}" /></div>
              <div class="form-field"><label>Database user</label><input type="text" name="databaseUser" value="${escapeHtml((configuration.database && configuration.database.username) || '')}" /></div>
              <div class="form-field"><label>Database password</label><input type="password" name="databasePassword" value="${escapeHtml((configuration.database && configuration.database.password) || '')}" /></div>
              <div class="form-field"><label>Database URL (optional)</label><input type="text" name="databaseUrl" value="${escapeHtml((configuration.database && configuration.database.url) || '')}" /></div>
            </div>
            <div class="action-list" style="margin-bottom: 18px;">
              <button type="button" class="primary" data-admin-action="setup-save">Save configuration</button>
              <button type="button" class="secondary" data-admin-action="server-test">Test server</button>
              <button type="button" class="secondary" data-admin-action="database-test">Test database</button>
              <button type="button" class="primary" data-admin-action="setup-activate">Activate system</button>
            </div>
          </form>
          <div id="adminActionStatus" class="message info">Setup state: ${escapeHtml(setup.status || 'NOT_CONFIGURED')} · Server: ${escapeHtml((setup.serverState && setup.serverState.status) || 'NOT_CONFIGURED')} · Database: ${escapeHtml((setup.databaseState && setup.databaseState.status) || 'NOT_CONFIGURED')}</div>
          <div class="grid" style="margin-top: 18px;">
            <div class="metric"><span class="metric-label">Status</span><div class="metric-value">${escapeHtml(setup.status || 'NOT_CONFIGURED')}</div></div>
            <div class="metric"><span class="metric-label">Current step</span><div class="metric-value">${escapeHtml(setup.currentStep || 'system-check')}</div></div>
            <div class="metric"><span class="metric-label">Server</span><div class="metric-value">${escapeHtml(configuration.serverUrl || 'not configured')}</div></div>
            <div class="metric"><span class="metric-label">Database</span><div class="metric-value">${escapeHtml((configuration.database && configuration.database.name) || 'not configured')}</div></div>
            <div class="metric"><span class="metric-label">Framework</span><div class="metric-value">${escapeHtml((setup.frameworkState && setup.frameworkState.status) || 'NOT_INITIALIZED')}</div></div>
            <div class="metric"><span class="metric-label">Bootstrap</span><div class="metric-value">${escapeHtml((setup.bootstrapState && setup.bootstrapState.status) || 'NOT_CONFIGURED')}</div></div>
          </div>
        </div>
      </div>
    `;
    bindActionButtons();
  };


  const renderAdminSystem = async () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const health = window.AdminModule && typeof window.AdminModule.healthCheck === 'function'
      ? window.AdminModule.healthCheck()
      : { healthy: false };
    const sessionState = window.CoreAuth && typeof window.CoreAuth.getSessionStateSnapshot === 'function'
      ? window.CoreAuth.getSessionStateSnapshot()
      : { authenticated: false };

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">System status</h2></div>
        <div class="content-wrap">
          <div class="grid">
            <div class="metric"><span class="metric-label">Healthy</span><div class="metric-value">${health.healthy ? 'Yes' : 'No'}</div></div>
            <div class="metric"><span class="metric-label">Auth state</span><div class="metric-value">${sessionState.authenticated ? 'authenticated' : 'anonymous'}</div></div>
            <div class="metric"><span class="metric-label">Core</span><div class="metric-value">${window.Core ? 'Available' : 'Unavailable'}</div></div>
            <div class="metric"><span class="metric-label">Modules</span><div class="metric-value">${window.ModuleRegistry && typeof window.ModuleRegistry.getAll === 'function' ? window.ModuleRegistry.getAll().length : 0}</div></div>
          </div>
        </div>
      </div>
    `;
  };

  const renderDeveloperOverview = async () => {
    const page = document.getElementById('mainContent');
    if (!page) return;

    const registry = window.ModuleRegistry && typeof window.ModuleRegistry.getAll === 'function'
      ? window.ModuleRegistry.getAll()
      : [];
    const health = window.AdminModule && typeof window.AdminModule.healthCheck === 'function'
      ? window.AdminModule.healthCheck()
      : { healthy: false };
    const audit = window.AdminModule && typeof window.AdminModule.getAuditLog === 'function'
      ? window.AdminModule.getAuditLog()
      : [];

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Developer overview</h2></div>
        <div class="content-wrap">
          <div class="grid">
            <div class="metric"><span class="metric-label">Runtime health</span><div class="metric-value">${health.healthy ? 'Healthy' : 'Warning'}</div></div>
            <div class="metric"><span class="metric-label">Discovered modules</span><div class="metric-value">${registry.length}</div></div>
            <div class="metric"><span class="metric-label">Audit entries</span><div class="metric-value">${Array.isArray(audit) ? audit.length : 0}</div></div>
          </div>
        </div>
      </div>
    `;
  };

  const renderUserMenu = () => {
    const userMenu = document.getElementById('userMenu');
    const adminSection = document.getElementById('adminSection');
    const adminMenu = document.getElementById('adminMenu');
    const developerSection = document.getElementById('developerSection');
    const developerMenu = document.getElementById('developerMenu');
    const currentUser = getCurrentUser();

    if (!userMenu) return;

    if (!currentUser) {
      userMenu.innerHTML = '';
      if (adminSection) adminSection.classList.add('hidden');
      if (adminMenu) adminMenu.innerHTML = '';
      if (developerSection) developerSection.classList.add('hidden');
      if (developerMenu) developerMenu.innerHTML = '';
      return;
    }

    const items = pageType === 'admin'
      ? [
          { id: 'admin:dashboard', label: 'Dashboard' },
          { id: 'admin:apps', label: 'Apps' },
          { id: 'admin:modules', label: 'Modules' },
          { id: 'admin:data', label: 'Data' },
          { id: 'admin:templates', label: 'Templates' },
          { id: 'admin:users', label: 'Users' },
          { id: 'admin:roles', label: 'Roles' },
          { id: 'admin:permissions', label: 'Permissions' },
          { id: 'admin:connections', label: 'Connections' },
          { id: 'admin:server', label: 'Server' },
          { id: 'admin:database', label: 'Database' },
          { id: 'admin:settings', label: 'Settings' },
          { id: 'admin:diagnostics', label: 'Diagnostics' },
          { id: 'admin:audit', label: 'Audit' }
        ]      : [
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'profile', label: 'Profile' },
          { id: 'modules', label: 'Modules' },
          ...getVisibleModules().map((module) => ({ id: `module:${module.id}`, label: module.name }))
        ];

    userMenu.innerHTML = items.map((item) => `
      <button type="button" class="nav-item ${state.activeView === item.id ? 'active' : ''}" data-view="${escapeHtml(item.id)}">${escapeHtml(item.label)}</button>
    `).join('');

    userMenu.querySelectorAll('[data-view]').forEach((button) => {
      button.addEventListener('click', () => {
        state.activeView = button.dataset.view;
        renderPageContent();
        renderSummary();
      });
    });

    if (pageType !== 'admin' && canViewAdmin(currentUser)) {
      if (adminSection) adminSection.classList.remove('hidden');
      if (adminMenu) {
        adminMenu.innerHTML = '<button type="button" class="nav-item" data-view="admin:dashboard" data-href="admin.html">Administration</button>';
      }
    } else if (adminSection) {
      adminSection.classList.add('hidden');
      if (adminMenu) adminMenu.innerHTML = '';
    }

    if (pageType !== 'admin' && canViewDeveloper(currentUser)) {
      if (developerSection) developerSection.classList.remove('hidden');
      if (developerMenu) {
        developerMenu.innerHTML = '<button type="button" class="nav-item" data-view="developer:core" data-href="dev.html">Developer</button>';
      }
    } else if (developerSection) {
      developerSection.classList.add('hidden');
      if (developerMenu) developerMenu.innerHTML = '';
    }
  };

  const renderDashboard = () => {
    const page = document.getElementById('mainContent');
    if (!page) return;
    const currentUser = getCurrentUser();
    const modules = getVisibleModules();

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Dashboard</h2></div>
        <div class="content-wrap">
          <div class="summary-username">Welcome ${escapeHtml(currentUser ? currentUser.displayName || currentUser.username : 'User')}</div>
          <div class="small-muted">${escapeHtml(currentUser ? currentUser.username : 'guest')} · ${escapeHtml(currentUser ? (Array.isArray(currentUser.roles) ? currentUser.roles.join(', ') : 'user') : 'guest')}</div>
          <div class="grid" style="margin-top:16px;">
            <div class="metric"><span class="metric-label">Available modules</span><div class="metric-value">${modules.length}</div></div>
            <div class="metric"><span class="metric-label">Status</span><div class="metric-value">${escapeHtml(currentUser ? currentUser.status || 'active' : 'logged-out')}</div></div>
            <div class="metric"><span class="metric-label">Access</span><div class="metric-value">${escapeHtml(currentUser && Array.isArray(currentUser.roles) ? currentUser.roles.join(', ') : 'user')}</div></div>
          </div>
        </div>
      </div>
    `;
  };

  const renderProfile = () => {
    const page = document.getElementById('mainContent');
    if (!page) return;
    const user = getCurrentUser();

    page.innerHTML = `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Profile</h2></div>
        <div class="content-wrap">
          <div class="summary-username">${escapeHtml(user ? user.displayName || user.username || 'User' : 'Guest')}</div>
          <div class="small-muted">${escapeHtml(user ? user.username || 'guest' : 'guest')}</div>
          <div class="grid" style="margin-top:16px;">
            <div class="metric"><span class="metric-label">Display ID</span><div class="metric-value">${escapeHtml(user ? user.displayId || user.id || '—' : '—')}</div></div>
            <div class="metric"><span class="metric-label">Role</span><div class="metric-value">${escapeHtml(user && Array.isArray(user.roles) ? user.roles.join(', ') : 'user')}</div></div>
            <div class="metric"><span class="metric-label">Status</span><div class="metric-value">${escapeHtml(user ? user.status || 'active' : 'signed-out')}</div></div>
          </div>
        </div>
      </div>
    `;
  };

  const renderModules = () => {
    const page = document.getElementById('mainContent');
    if (!page) return;
    const modules = getVisibleModules();

    page.innerHTML = modules.length ? `
      <div class="card">
        <div class="card-header"><h2 class="card-title">Modules</h2></div>
        <div class="content-wrap">
          <div class="grid">
            ${modules.map((module) => `
              <div class="metric">
                <span class="metric-label">${escapeHtml(module.name)}</span>
                <div class="metric-value" style="font-size: 0.85rem;">${escapeHtml(module.status)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    ` : '<div class="card"><div class="card-header"><h2 class="card-title">Modules</h2></div><div class="content-wrap">No modules are active for the current user context.</div></div>';
  };

  const renderPageContent = async () => {
    if (pageType === 'admin') {
      if (state.activeView.startsWith('admin:module:')) {
        renderAdminModuleWorkspace(state.activeView.slice('admin:module:'.length));
        return;
      }
      if (state.activeView === 'admin:dashboard') {
        await renderAdminDashboard();
        return;
      }
      if (state.activeView === 'admin:apps') {
        renderAdminApps();
        return;
      }
      if (state.activeView === 'admin:modules') {
        renderAdminModules();
        return;
      }
      if (state.activeView === 'admin:data') {
        renderAdminData();
        return;
      }
      if (state.activeView === 'admin:templates') {
        renderAdminTemplates();
        return;
      }
      if (state.activeView === 'admin:gps') {
        renderAdminGPS();
        return;
      }
      if (state.activeView === 'admin:marketplace') {
        await renderAdminMarketplace();
        return;
      }
      if (state.activeView === 'admin:connections') {
        await renderAdminConnections();
        return;
      }
      if (state.activeView === 'admin:server') {
        await renderAdminServer();
        return;
      }
      if (state.activeView === 'admin:database') {
        await renderAdminDatabase();
        return;
      }
      if (state.activeView === 'admin:users') {
        await renderAdminUsers();
        return;
      }
      if (state.activeView === 'admin:roles') {
        await renderAdminRoles();
        return;
      }
      if (state.activeView === 'admin:permissions') {
        renderAdminPermissions();
        return;
      }
      if (state.activeView === 'admin:devices') {
        await renderAdminDevices();
        return;
      }
      if (state.activeView === 'admin:licenses') {
        await renderAdminLicenses();
        return;
      }
      if (state.activeView === 'admin:updates') {
        renderAdminUpdates();
        return;
      }
      if (state.activeView === 'admin:diagnostics') {
        renderAdminDiagnostics();
        return;
      }
      if (state.activeView === 'admin:audit') {
        renderAdminAudit();
        return;
      }
      if (state.activeView === 'admin:settings') {
        await renderAdminSettings();
        return;
      }
      if (state.activeView === 'admin:system') {
        await renderAdminSystem();
        return;
      }
      await renderAdminDashboard();
      return;
    }

    if (pageType === 'developer') {
      if (state.activeView === 'developer:core') {
        await renderDeveloperOverview();
        return;
      }
      await renderDeveloperOverview();
      return;
    }

    if (pageType === 'setup') {
      await renderSetupPage();
      return;
    }

    if (state.activeView === 'profile') {
      renderProfile();
      return;
    }
    if (state.activeView === 'modules') {
      renderModules();
      return;
    }
    renderDashboard();
  };

  const bindAuth = () => {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginBtn) {
      loginBtn.addEventListener('click', async () => {
        const usernameInput = document.getElementById('loginUsername');
        const passwordInput = document.getElementById('loginPassword');
        const username = usernameInput ? usernameInput.value.trim() : 'Developer';
        const password = passwordInput ? passwordInput.value : '';

        if (!window.UserModule || typeof window.UserModule.login !== 'function') {
          return;
        }

        const result = await window.UserModule.login({ username, password });
        if (!result || !result.ok) {
          const authMessage = document.getElementById('authMessage');
          if (authMessage) {
            authMessage.className = 'message error';
            authMessage.textContent = result && result.message ? result.message : 'Authentication failed.';
          }
          return;
        }

        const user = result.data && result.data.user ? result.data.user : null;
        const target = resolveRoleRoute(user);
        if (target && target !== window.location.pathname.replace(/^\//, '')) {
          window.location.replace(target);
          return;
        }

        renderSummary();
        renderUserMenu();
        renderPageContent();
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (window.UserModule && typeof window.UserModule.logout === 'function') {
          await window.UserModule.logout();
        } else if (window.CoreAuth && typeof window.CoreAuth.logout === 'function') {
          await window.CoreAuth.logout();
        }
        const target = pageType === 'developer' ? 'dev.html' : pageType === 'admin' ? 'admin.html' : 'index.html';
        window.location.replace(target);
      });
    }
  };

  const syncShellVisibility = () => {
    const authPanel = document.getElementById('authPanel');
    const appShell = document.getElementById('appShell');
    const accessDenied = document.getElementById('accessDenied');
    const currentUser = getCurrentUser();

    if (pageType === 'admin' || pageType === 'developer') {
      const pageAllowed = pageType === 'admin'
        ? !!currentUser && (hasRole(currentUser, 'admin') || hasRole(currentUser, 'developer') || hasPermission(currentUser, 'system:view'))
        : !!currentUser && (hasRole(currentUser, 'developer') || hasRole(currentUser, 'admin') || hasPermission(currentUser, 'module:read'));

      if (authPanel) authPanel.classList.toggle('hidden', !!currentUser && pageAllowed);
      if (appShell) appShell.classList.toggle('hidden', !currentUser || !pageAllowed);
      if (accessDenied) accessDenied.classList.toggle('hidden', !!currentUser && pageAllowed);
      return;
    }

    if (authPanel) authPanel.classList.toggle('hidden', !!currentUser);
    if (appShell) appShell.classList.toggle('hidden', !currentUser);
  };

  const ensureRuntime = async () => {
    if (window.CoreStartup && typeof window.CoreStartup.start === 'function') {
      await window.CoreStartup.start();
    }
    if (window.ModuleManager && typeof window.ModuleManager.discoverModules === 'function') {
      await window.ModuleManager.discoverModules();
    }
  };

  const init = async () => {
    await ensureRuntime();
    const currentUser = getCurrentUser();
    const targetPage = resolveRoleRoute(currentUser);
    const currentPath = window.location.pathname.replace(/^\//, '');

    if (pageType === 'admin' || pageType === 'developer') {
      const pageAllowed = pageType === 'admin'
        ? !!currentUser && (hasRole(currentUser, 'admin') || hasRole(currentUser, 'developer') || hasPermission(currentUser, 'system:view'))
        : !!currentUser && (hasRole(currentUser, 'developer') || hasRole(currentUser, 'admin') || hasPermission(currentUser, 'module:read'));
      if (currentUser && !pageAllowed && targetPage && targetPage !== currentPath) {
        window.location.replace(targetPage);
        return;
      }
      if (currentUser && pageAllowed && targetPage && targetPage !== currentPath && targetPage !== 'admin.html') {
        window.location.replace(targetPage);
        return;
      }
    } else if (currentUser && targetPage && targetPage !== currentPath) {
      window.location.replace(targetPage);
      return;
    }

    renderFrameworkPreview();
    renderSummary();
    renderAppModuleNav();
    renderUserMenu();
    syncShellVisibility();
    await renderPageContent();
    bindAuth();
  };

  init();
})();

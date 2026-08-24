(function (globalObject) {
  'use strict';

  const root = globalObject || globalThis;

  const normalizeString = (value, fallback = '') => {
    if (typeof value !== 'string') {
      return fallback;
    }

    const trimmed = value.trim();
    return trimmed || fallback;
  };

  const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

  const normalizeSetupStatus = (value, fallback = 'NOT_CONFIGURED') => {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    const normalized = String(value).trim().toUpperCase().replace(/[\s_-]+/g, '_');
    const aliases = {
      NOT_STARTED: 'NOT_CONFIGURED',
      DRAFT: 'NOT_CONFIGURED',
      IN_PROGRESS: 'CONFIGURATION_REQUIRED',
      CONFIGURATION_REQUIRED: 'CONFIGURATION_REQUIRED',
      READY_TO_TEST: 'READY_TO_TEST',
      TESTING: 'TESTING',
      READY: 'READY',
      ACTIVE: 'ACTIVE',
      ERROR: 'ERROR',
      NOT_CONFIGURED: 'NOT_CONFIGURED'
    };

    return aliases[normalized] || fallback;
  };

  const createStatusSnapshot = (name, value) => ({
    name,
    value,
    status: value ? 'enabled' : 'disabled'
  });

  const cloneObject = (value, fallback = {}) => (isPlainObject(value) ? { ...value } : { ...fallback });

  const normalizeSectionState = (value, defaults) => ({
    ...defaults,
    ...(isPlainObject(value) ? value : {})
  });

  const ADMIN_STATE_STORAGE_KEY = 'master-framework.admin-state';
  const ADMIN_STATE_FILE_NAME = 'admin-state.json';

  const FrameworkRuntime = {
    version: '1.0.0',
    apps: new Map(),
    appTemplates: new Map(),
    connections: new Map(),
    providers: new Map(),
    featureFlags: new Map(),
    normalizeSetupStatus,
    permissions: new Map(),
    roles: new Map(),
    modules: new Map(),
    moduleMigrations: new Map(),
    moduleSnapshots: new Map(),
    migrations: [],
    appRuntimeState: new Map(),
    currentAppId: null,
    entitySchemas: new Map(),
    entityRecords: new Map(),
    createdAt: new Date().toISOString(),

    initialize() {
      this.setFeatureFlag('new-sync-engine', false);
      this.setFeatureFlag('beta-admin', false);
      this.setFeatureFlag('offline-first', true);
      this.registerRole('user', {
        description: 'Standard end user.',
        permissions: ['user:read']
      });
      this.registerRole('member', {
        description: 'Member with basic collaboration access.',
        permissions: ['user:read']
      });
      this.registerRole('manager', {
        description: 'Management role with restricted write access.',
        permissions: ['user:read', 'user:write']
      });
      this.registerRole('admin', {
        description: 'Administrators can manage users and system settings.',
        permissions: ['user:read', 'user:write', 'system:view']
      });
      this.registerRole('developer', {
        description: 'Developer role with module and framework access.',
        permissions: ['user:read', 'user:write', 'system:view', 'module:read', 'module:update']
      });
      this.registerPermission('system:view', 'Read system and diagnostics information.');
      this.registerPermission('module:read', 'Read module metadata and status.');
      this.registerPermission('module:update', 'Update module metadata and runtime state.');
      this.registerPermission('app:read', 'Read app metadata.');
      this.registerPermission('app:module:read', 'Read app-specific module access metadata.');
      this.registerPermission('app:module:update', 'Update app-specific module access metadata.');
      this.registerPermission('connection:read', 'Read connection metadata.');
      this.registerPermission('connection:write', 'Modify connection metadata.');
      this.registerPermission('user:read', 'Read user data.');
      this.registerPermission('user:write', 'Create and update users.');
      this.setFeatureFlag('app-scoped-governance', true);
      this.registerAppTemplate({
        id: 'neutral-workspace',
        name: 'Neutral workspace',
        description: 'A generic multi-module workspace for a neutral app shell.',
        version: '1.0.0',
        defaultStatus: 'active',
        modules: ['dashboard', 'gps'],
        featureTemplates: [
          { id: 'dashboard', label: 'Dashboard', description: 'Overview and workspace summary.', permissions: ['system:view'] },
          { id: 'profile', label: 'Profile', description: 'User profile and privacy controls.', permissions: ['user:read'] },
          { id: 'modules', label: 'Modules', description: 'Module workspace and governance.', permissions: ['module:read'] }
        ],
        config: {
          mode: 'local',
          featureSet: 'neutral-workspace'
        }
      });

      if (!this.getProvider('local-provider')) {
        this.registerProvider({
          providerId: 'local-provider',
          name: 'Local Provider',
          type: 'local',
          status: 'ready',
          active: true,
          default: true,
          endpoint: 'local://workspace'
        });
      }

      if (!this.listProviders().some((provider) => !!provider.active)) {
        this.setActiveProvider('local-provider');
      }

      // App templates are defined externally or via admin UI configuration, not hardcoded in core.
      return this;
    },

    normalizeAppTemplate(templateDefinition) {
      if (!isPlainObject(templateDefinition)) {
        throw new TypeError('Application template definition must be an object.');
      }

      const templateId = normalizeString(templateDefinition.id || templateDefinition.templateId || templateDefinition.name, 'neutral-workspace');
      const templateName = normalizeString(templateDefinition.name || templateDefinition.label || templateId, templateId);
      const moduleIds = Array.isArray(templateDefinition.modules)
        ? templateDefinition.modules.map((entry) => normalizeString(String(entry), '')).filter(Boolean)
        : [];
      const featureTemplates = Array.isArray(templateDefinition.featureTemplates)
        ? templateDefinition.featureTemplates.map((feature) => this.normalizeFeatureTemplate(feature)).filter(Boolean)
        : [];
      const entitySchemas = Array.isArray(templateDefinition.entitySchemas)
        ? templateDefinition.entitySchemas.map((entry) => ({
            ...this.normalizeEntitySchema(templateId, entry),
            appId: normalizeString(templateDefinition.appId || templateId, templateId)
          }))
        : [];

      return {
        id: templateId,
        name: templateName,
        label: templateName,
        description: normalizeString(templateDefinition.description, ''),
        version: normalizeString(templateDefinition.version, '1.0.0'),
        defaultStatus: normalizeString(templateDefinition.defaultStatus, 'active'),
        modules: moduleIds,
        featureTemplates,
        entitySchemas,
        permissions: Array.isArray(templateDefinition.permissions)
          ? [...new Set(templateDefinition.permissions.filter(Boolean).map((entry) => normalizeString(String(entry), '')).filter(Boolean))]
          : [],
        capabilities: Array.isArray(templateDefinition.capabilities)
          ? [...new Set(templateDefinition.capabilities.filter(Boolean).map((entry) => normalizeString(String(entry), '')).filter(Boolean))]
          : [],
        config: isPlainObject(templateDefinition.config) ? { ...templateDefinition.config } : {},
        moduleAccess: isPlainObject(templateDefinition.moduleAccess) ? { ...templateDefinition.moduleAccess } : {},
        featureAccess: isPlainObject(templateDefinition.featureAccess) ? { ...templateDefinition.featureAccess } : {},
        createdAt: templateDefinition.createdAt || new Date().toISOString(),
        updatedAt: templateDefinition.updatedAt || new Date().toISOString()
      };
    },

    registerAppTemplate(templateDefinition) {
      const template = this.normalizeAppTemplate(templateDefinition);
      this.appTemplates.set(template.id, template);
      return { ...template };
    },

    getAppTemplate(templateId) {
      const normalized = normalizeString(templateId, '');
      if (!normalized) {
        return null;
      }
      return this.appTemplates.get(normalized) || null;
    },

    listAppTemplates() {
      return Array.from(this.appTemplates.values()).map((template) => ({ ...template }));
    },

    createAppFromTemplate(templateId, overrides = {}) {
      const template = this.getAppTemplate(templateId);
      if (!template) {
        throw new Error(`Application template not found: ${templateId}`);
      }

      const appId = normalizeString(overrides.appId || overrides.id || `${template.id}-${Date.now()}`, `${template.id}-app`);
      const appDefinition = {
        appId,
        id: appId,
        name: normalizeString(overrides.name || template.name || appId, appId),
        description: normalizeString(overrides.description || template.description, ''),
        version: normalizeString(overrides.version || template.version, '1.0.0'),
        active: typeof overrides.active === 'boolean' ? overrides.active : true,
        status: normalizeString(overrides.status || template.defaultStatus || 'active', 'active'),
        modules: Array.isArray(overrides.modules) ? [...overrides.modules] : [...(template.modules || [])],
        permissions: Array.isArray(overrides.permissions) ? [...overrides.permissions] : [...(template.permissions || [])],
        capabilities: Array.isArray(overrides.capabilities) ? [...overrides.capabilities] : [...(template.capabilities || [])],
        moduleAccess: isPlainObject(overrides.moduleAccess) ? { ...overrides.moduleAccess } : { ...(template.moduleAccess || {}) },
        featureTemplates: Array.isArray(overrides.featureTemplates)
          ? overrides.featureTemplates.map((entry) => this.normalizeFeatureTemplate(entry)).filter(Boolean)
          : Array.isArray(template.featureTemplates) ? template.featureTemplates.map((entry) => ({ ...entry })) : [],
        featureAccess: isPlainObject(overrides.featureAccess) ? { ...overrides.featureAccess } : { ...(template.featureAccess || {}) },
        config: {
          ...(template.config || {}),
          ...(isPlainObject(overrides.config) ? overrides.config : {})
        },
        ui: isPlainObject(overrides.ui) ? { ...overrides.ui } : {},
        server: isPlainObject(overrides.server) ? { ...overrides.server } : {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const app = this.registerApp(appDefinition);
      const schemas = Array.isArray(overrides.entitySchemas)
        ? overrides.entitySchemas
        : Array.isArray(template.entitySchemas)
          ? template.entitySchemas
          : [];
      for (const schemaDefinition of schemas) {
        if (!schemaDefinition || !schemaDefinition.id) {
          continue;
        }
        this.registerEntitySchema(app.appId, schemaDefinition);
      }
      return app;
    },

    normalizeApp(appDefinition) {
      if (!isPlainObject(appDefinition)) {
        throw new TypeError('Application definition must be an object.');
      }

      const appId = normalizeString(appDefinition.appId || appDefinition.id, 'default-app');
      const appName = normalizeString(appDefinition.name, appId);
      const moduleAccess = isPlainObject(appDefinition.moduleAccess)
        ? { ...appDefinition.moduleAccess }
        : (isPlainObject(appDefinition.config) && isPlainObject(appDefinition.config.moduleAccess)
          ? { ...appDefinition.config.moduleAccess }
          : {});

      const featureTemplates = Array.isArray(appDefinition.featureTemplates)
        ? appDefinition.featureTemplates.map((featureDefinition) => this.normalizeFeatureTemplate(featureDefinition)).filter(Boolean)
        : Array.isArray(appDefinition.features)
          ? appDefinition.features.map((featureDefinition) => this.normalizeFeatureTemplate(featureDefinition)).filter(Boolean)
          : [
              this.normalizeFeatureTemplate({ id: 'overview', label: 'Overview', description: 'Core overview area.', permissions: ['system:view'] }),
              this.normalizeFeatureTemplate({ id: 'profile', label: 'Profile', description: 'User profile and settings.', permissions: ['user:read'] }),
              this.normalizeFeatureTemplate({ id: 'modules', label: 'Modules', description: 'Feature and module workspace.', permissions: ['module:read'] })
            ].filter(Boolean);
      const featureAccess = isPlainObject(appDefinition.featureAccess)
        ? { ...appDefinition.featureAccess }
        : {};

      const normalized = {
        appId,
        id: appId,
        name: appName,
        version: normalizeString(appDefinition.version, '1.0.0'),
        description: normalizeString(appDefinition.description, ''),
        active: !!appDefinition.active,
        status: normalizeString(appDefinition.status, appDefinition.active ? 'active' : 'inactive'),
        modules: Array.isArray(appDefinition.modules) ? [...appDefinition.modules] : [],
        moduleAccess,
        featureTemplates,
        featureAccess,
        config: isPlainObject(appDefinition.config) ? { ...appDefinition.config } : {},
        secrets: isPlainObject(appDefinition.secrets) ? { ...appDefinition.secrets } : {},
        runtimeState: isPlainObject(appDefinition.runtimeState) ? { ...appDefinition.runtimeState } : {},
        permissions: Array.isArray(appDefinition.permissions) ? [...appDefinition.permissions] : [],
        capabilities: Array.isArray(appDefinition.capabilities) ? [...appDefinition.capabilities] : [],
        ui: isPlainObject(appDefinition.ui) ? { ...appDefinition.ui } : {},
        server: isPlainObject(appDefinition.server) ? { ...appDefinition.server } : {},
        createdAt: appDefinition.createdAt || new Date().toISOString(),
        updatedAt: appDefinition.updatedAt || new Date().toISOString()
      };

      if (normalized.config && typeof normalized.config === 'object' && !normalized.config.moduleAccess) {
        normalized.config.moduleAccess = normalized.moduleAccess;
      }
      if (normalized.config && typeof normalized.config === 'object' && !normalized.config.featureAccess) {
        normalized.config.featureAccess = normalized.featureAccess;
      }

      return normalized;
    },

    registerApp(appDefinition) {
      const app = this.normalizeApp(appDefinition);
      this.apps.set(app.appId, app);
      const runtime = this.getAppRuntimeState(app.appId, app);
      app.runtimeState = { ...runtime };
      if (!this.currentAppId && app.active) {
        this.currentAppId = app.appId;
      }
      return app;
    },

    getApp(appId) {
      const normalized = normalizeString(appId, '');
      if (!normalized) {
        return null;
      }
      return this.apps.get(normalized) || null;
    },

    getAppRuntimeState(appId, appDefinition = null) {
      const resolvedAppId = normalizeString(appId, '');
      if (!resolvedAppId) {
        return null;
      }

      const app = appDefinition || this.getApp(resolvedAppId);
      const source = app || this.getApp(resolvedAppId) || {};
      const runtime = this.appRuntimeState.get(resolvedAppId) || {
        appId: resolvedAppId,
        active: !!(source && source.active),
        isolated: true,
        server: {
          appId: resolvedAppId,
          mode: (source && source.config && source.config.mode) || 'local',
          title: (source && source.name) || resolvedAppId,
          status: (source && source.status) || 'inactive',
          runtime: 'neutral-framework'
        },
        admin: {
          appId: resolvedAppId,
          roleScope: 'app-local',
          isolated: true,
          permissions: Array.isArray(source && source.permissions) ? [...source.permissions] : [],
          capabilities: Array.isArray(source && source.capabilities) ? [...source.capabilities] : []
        },
        storage: {
          appId: resolvedAppId,
          namespace: `app:${resolvedAppId}:`,
          adapter: ((source && source.config && source.config.storageType) || 'file'),
          mode: ((source && source.config && source.config.mode) || 'local')
        },
        ui: {
          appId: resolvedAppId,
          defaultView: ((source && source.config && source.config.defaultView) || 'dashboard'),
          appName: (source && source.name) || resolvedAppId
        },
        createdAt: (source && source.createdAt) || new Date().toISOString(),
        updatedAt: (source && source.updatedAt) || new Date().toISOString()
      };

      const merged = {
        ...runtime,
        appId: resolvedAppId,
        active: !!(source && source.active) || runtime.active,
        isolated: true,
        server: {
          ...(runtime.server || {}),
          appId: resolvedAppId,
          mode: ((source && source.config && source.config.mode) || (runtime.server && runtime.server.mode) || 'local'),
          title: (source && source.name) || (runtime.server && runtime.server.title) || resolvedAppId,
          status: (source && source.status) || (runtime.server && runtime.server.status) || 'inactive',
          runtime: 'neutral-framework'
        },
        admin: {
          ...(runtime.admin || {}),
          appId: resolvedAppId,
          roleScope: 'app-local',
          isolated: true,
          permissions: Array.isArray(source && source.permissions) ? [...source.permissions] : (Array.isArray(runtime.admin && runtime.admin.permissions) ? [...runtime.admin.permissions] : []),
          capabilities: Array.isArray(source && source.capabilities) ? [...source.capabilities] : (Array.isArray(runtime.admin && runtime.admin.capabilities) ? [...runtime.admin.capabilities] : [])
        },
        storage: {
          ...(runtime.storage || {}),
          appId: resolvedAppId,
          namespace: `app:${resolvedAppId}:`,
          adapter: ((source && source.config && source.config.storageType) || (runtime.storage && runtime.storage.adapter) || 'file'),
          mode: ((source && source.config && source.config.mode) || (runtime.storage && runtime.storage.mode) || 'local')
        },
        ui: {
          ...(runtime.ui || {}),
          appId: resolvedAppId,
          defaultView: ((source && source.config && source.config.defaultView) || (runtime.ui && runtime.ui.defaultView) || 'dashboard'),
          appName: (source && source.name) || (runtime.ui && runtime.ui.appName) || resolvedAppId
        },
        updatedAt: (source && source.updatedAt) || new Date().toISOString()
      };

      this.appRuntimeState.set(resolvedAppId, merged);
      if (app) {
        app.runtimeState = { ...merged };
      }
      return { ...merged };
    },

    getActiveApp() {
      if (!this.currentAppId) {
        return null;
      }
      return this.getApp(this.currentAppId);
    },

    setActiveApp(appId) {
      const normalized = normalizeString(appId, '');
      if (!normalized) {
        throw new Error('Application id is required.');
      }

      const app = this.getApp(normalized);
      if (!app) {
        throw new Error(`Application not found: ${normalized}`);
      }

      this.currentAppId = normalized;
      app.active = true;
      app.status = 'active';
      app.updatedAt = new Date().toISOString();
      const runtime = this.getAppRuntimeState(normalized, app);
      runtime.active = true;
      runtime.server.status = 'active';
      return { ...runtime };
    },

    listAppRuntimeState() {
      return Array.from(this.appRuntimeState.entries()).map(([appId, runtime]) => ({ ...runtime, appId }));
    },

    setAppModuleAccess(appId, moduleId, access = {}) {
      const app = this.getApp(appId);
      if (!app) {
        throw new Error(`Application not found: ${appId}`);
      }

      const moduleKey = normalizeString(moduleId, '');
      if (!moduleKey) {
        throw new Error('Module id is required.');
      }

      const source = isPlainObject(app.moduleAccess) ? { ...app.moduleAccess } : {};
      const roleMatrix = isPlainObject(access.roles) ? Object.fromEntries(
        Object.entries(access.roles).map(([role, enabled]) => [normalizeString(role, ''), !!enabled])
          .filter(([role]) => role)
      ) : {};

      const nextEntry = {
        enabled: typeof access.enabled === 'boolean' ? access.enabled : true,
        permissions: Array.isArray(access.permissions)
          ? [...new Set(access.permissions.filter(Boolean).map((entry) => normalizeString(String(entry), '')))].filter(Boolean)
          : Array.isArray(source[moduleKey] && source[moduleKey].permissions) ? [...source[moduleKey].permissions] : [],
        roles: roleMatrix,
        updatedAt: new Date().toISOString()
      };

      source[moduleKey] = nextEntry;
      app.moduleAccess = source;
      if (isPlainObject(app.config)) {
        app.config.moduleAccess = source;
      }
      app.updatedAt = new Date().toISOString();
      return { ...nextEntry, moduleId: moduleKey, appId: app.appId };
    },

    getAppModuleAccess(appId, moduleId) {
      const app = this.getApp(appId);
      if (!app) {
        return null;
      }

      const moduleKey = normalizeString(moduleId, '');
      if (!moduleKey) {
        return null;
      }

      const access = isPlainObject(app.moduleAccess) ? app.moduleAccess[moduleKey] : null;
      return access ? { ...access, moduleId: moduleKey, appId: app.appId } : null;
    },

    listAppModuleAccess(appId) {
      const app = this.getApp(appId);
      if (!app) {
        return [];
      }

      const accessMap = isPlainObject(app.moduleAccess) ? app.moduleAccess : {};
      return Object.entries(accessMap).map(([moduleId, value]) => ({
        appId: app.appId,
        moduleId,
        ...(isPlainObject(value) ? value : {})
      }));
    },

    normalizeFeatureTemplate(featureDefinition) {
      if (!featureDefinition) {
        return null;
      }

      const definition = isPlainObject(featureDefinition) ? featureDefinition : { id: String(featureDefinition) };
      const featureId = normalizeString(definition.id || definition.featureId || definition.name, '');
      if (!featureId) {
        return null;
      }

      const normalized = {
        id: featureId,
        key: featureId,
        label: normalizeString(definition.label || definition.name || definition.title, featureId),
        description: normalizeString(definition.description, ''),
        permissions: Array.isArray(definition.permissions)
          ? [...new Set(definition.permissions.filter(Boolean).map((entry) => normalizeString(String(entry), '')).filter(Boolean))]
          : [],
        roles: Array.isArray(definition.roles)
          ? [...new Set(definition.roles.filter(Boolean).map((role) => normalizeString(String(role), '')).filter(Boolean))]
          : [],
        group: normalizeString(definition.group, 'core'),
        enabled: typeof definition.enabled === 'boolean' ? definition.enabled : true
      };

      return normalized;
    },

    registerFeatureTemplate(appId, templateDefinition) {
      const app = this.getApp(appId);
      if (!app) {
        throw new Error(`Application not found: ${appId}`);
      }

      const normalized = this.normalizeFeatureTemplate(templateDefinition);
      if (!normalized) {
        throw new TypeError('Feature template definition must be an object with an id.');
      }

      const templates = Array.isArray(app.featureTemplates) ? [...app.featureTemplates] : [];
      const existingIndex = templates.findIndex((template) => template.id === normalized.id || template.key === normalized.id);
      if (existingIndex >= 0) {
        templates[existingIndex] = { ...templates[existingIndex], ...normalized };
      } else {
        templates.push(normalized);
      }
      app.featureTemplates = templates;
      if (isPlainObject(app.config)) {
        app.config.featureTemplates = templates;
      }
      app.updatedAt = new Date().toISOString();
      return { ...normalized };
    },

    setAppFeatureAccess(appId, featureId, access = {}) {
      const app = this.getApp(appId);
      if (!app) {
        throw new Error(`Application not found: ${appId}`);
      }

      const featureKey = normalizeString(featureId, '');
      if (!featureKey) {
        throw new Error('Feature id is required.');
      }

      const source = isPlainObject(app.featureAccess) ? { ...app.featureAccess } : {};
      const roleMatrix = isPlainObject(access.roles) ? Object.fromEntries(
        Object.entries(access.roles).map(([role, enabled]) => [normalizeString(role, ''), !!enabled])
          .filter(([role]) => role)
      ) : {};

      const nextEntry = {
        enabled: typeof access.enabled === 'boolean' ? access.enabled : true,
        permissions: Array.isArray(access.permissions)
          ? [...new Set(access.permissions.filter(Boolean).map((entry) => normalizeString(String(entry), '')))].filter(Boolean)
          : Array.isArray(source[featureKey] && source[featureKey].permissions) ? [...source[featureKey].permissions] : [],
        roles: roleMatrix,
        updatedAt: new Date().toISOString()
      };

      source[featureKey] = nextEntry;
      app.featureAccess = source;
      if (isPlainObject(app.config)) {
        app.config.featureAccess = source;
      }
      app.updatedAt = new Date().toISOString();
      return { ...nextEntry, featureId: featureKey, appId: app.appId };
    },

    getAppFeatureAccess(appId, featureId) {
      const app = this.getApp(appId);
      if (!app) {
        return null;
      }

      const featureKey = normalizeString(featureId, '');
      if (!featureKey) {
        return null;
      }

      const access = isPlainObject(app.featureAccess) ? app.featureAccess[featureKey] : null;
      return access ? { ...access, featureId: featureKey, appId: app.appId } : null;
    },

    listAppFeatureAccess(appId) {
      const app = this.getApp(appId);
      if (!app) {
        return [];
      }

      const accessMap = isPlainObject(app.featureAccess) ? app.featureAccess : {};
      return Object.entries(accessMap).map(([featureId, value]) => ({
        appId: app.appId,
        featureId,
        ...(isPlainObject(value) ? value : {})
      }));
    },

    listApps() {
      return Array.from(this.apps.values()).map((app) => {
        const runtime = this.getAppRuntimeState(app.appId, app);
        return {
          ...app,
          config: { ...app.config },
          secrets: { ...app.secrets },
          runtimeState: { ...(app.runtimeState || {}), ...runtime }
        };
      });
    },

    activateApp(appId) {
      const app = this.getApp(appId);
      if (!app) {
        throw new Error(`Application not found: ${appId}`);
      }
      app.active = true;
      app.status = 'active';
      app.updatedAt = new Date().toISOString();
      this.currentAppId = app.appId;
      const runtime = this.getAppRuntimeState(app.appId, app);
      runtime.active = true;
      runtime.server.status = 'active';
      return app;
    },

    deactivateApp(appId) {
      const app = this.getApp(appId);
      if (!app) {
        throw new Error(`Application not found: ${appId}`);
      }
      app.active = false;
      app.status = 'inactive';
      app.updatedAt = new Date().toISOString();
      const runtime = this.getAppRuntimeState(app.appId, app);
      runtime.active = false;
      runtime.server.status = 'inactive';
      if (this.currentAppId === app.appId && this.apps.size > 0) {
        const current = Array.from(this.apps.keys()).find((key) => key !== app.appId);
        this.currentAppId = current || null;
      }
      return app;
    },

    unregisterApp(appId) {
      const normalized = normalizeString(appId, '');
      return this.apps.delete(normalized);
    },

    normalizeEntityField(fieldDefinition = {}, fallbackName = 'field') {
      if (!isPlainObject(fieldDefinition)) {
        return null;
      }

      const fieldName = normalizeString(
        fieldDefinition.name || fieldDefinition.key || fieldDefinition.id || fieldDefinition.label || fallbackName,
        fallbackName
      );
      const key = normalizeString(fieldDefinition.key || fieldDefinition.id || fieldDefinition.name || fieldName, fieldName);
      const type = normalizeString(fieldDefinition.type || 'string', 'string').toLowerCase();
      const allowedTypes = ['string', 'number', 'boolean', 'date', 'datetime', 'array', 'object', 'json'];

      return {
        id: key,
        key,
        name: fieldName,
        label: normalizeString(fieldDefinition.label || fieldDefinition.name || key, fieldName),
        type: allowedTypes.includes(type) ? type : 'string',
        required: !!fieldDefinition.required,
        unique: !!fieldDefinition.unique,
        visible: fieldDefinition.visible !== false,
        description: normalizeString(fieldDefinition.description, ''),
        defaultValue: Object.prototype.hasOwnProperty.call(fieldDefinition, 'defaultValue') ? fieldDefinition.defaultValue : undefined,
        options: Array.isArray(fieldDefinition.options)
          ? fieldDefinition.options.map((option) => normalizeString(String(option), '')).filter(Boolean)
          : [],
        min: fieldDefinition.min !== undefined ? fieldDefinition.min : null,
        max: fieldDefinition.max !== undefined ? fieldDefinition.max : null,
        step: fieldDefinition.step !== undefined ? fieldDefinition.step : null,
        createdAt: fieldDefinition.createdAt || new Date().toISOString(),
        updatedAt: fieldDefinition.updatedAt || new Date().toISOString()
      };
    },

    normalizeEntitySchema(appId, schemaDefinition = {}) {
      if (!isPlainObject(schemaDefinition)) {
        throw new TypeError('Entity schema definition must be an object.');
      }

      const normalizedAppId = normalizeString(appId, 'default-app');
      const schemaId = normalizeString(schemaDefinition.id || schemaDefinition.entityId || schemaDefinition.name || 'records', 'records');
      const name = normalizeString(schemaDefinition.name || schemaDefinition.label || schemaId, schemaId);
      const fields = Array.isArray(schemaDefinition.fields)
        ? schemaDefinition.fields
            .map((field, index) => this.normalizeEntityField(field, `field-${index + 1}`))
            .filter(Boolean)
        : [];

      return {
        appId: normalizedAppId,
        id: schemaId,
        key: schemaId,
        name,
        label: normalizeString(schemaDefinition.label || name, name),
        plural: normalizeString(schemaDefinition.plural || schemaDefinition.name || `${schemaId}s`, `${schemaId}s`),
        singular: normalizeString(schemaDefinition.singular || schemaDefinition.label || schemaId, schemaId),
        description: normalizeString(schemaDefinition.description, ''),
        status: normalizeString(schemaDefinition.status, 'enabled'),
        fields,
        permissions: Array.isArray(schemaDefinition.permissions)
          ? [...new Set(schemaDefinition.permissions.filter(Boolean).map((entry) => normalizeString(String(entry), '')).filter(Boolean))]
          : [],
        defaultSort: normalizeString(schemaDefinition.defaultSort, 'createdAt'),
        createdAt: schemaDefinition.createdAt || new Date().toISOString(),
        updatedAt: schemaDefinition.updatedAt || new Date().toISOString()
      };
    },

    getEntitySchemaStorageKey(appId, entityId) {
      return `${normalizeString(appId, 'default-app')}::${normalizeString(entityId, 'records')}`;
    },

    registerEntitySchema(appId, schemaDefinition) {
      const app = this.getApp(appId);
      if (!app) {
        throw new Error(`Application not found: ${appId}`);
      }

      const schema = this.normalizeEntitySchema(appId, schemaDefinition);
      const storageKey = this.getEntitySchemaStorageKey(app.appId, schema.id);
      this.entitySchemas.set(storageKey, schema);

      const storage = this.getActiveStorageConnection();
      if (storage && typeof storage.write === 'function') {
        storage.write('entity-schemas', storageKey, schema);
      }

      return { ...schema, fields: schema.fields.map((field) => ({ ...field })) };
    },

    updateEntitySchema(appId, entityId, schemaDefinition = {}) {
      const normalizedAppId = normalizeString(appId, 'default-app');
      const normalizedEntityId = normalizeString(entityId, '');
      if (!normalizedEntityId) {
        throw new Error('Entity schema id is required.');
      }

      const current = this.getEntitySchema(normalizedAppId, normalizedEntityId);
      if (!current) {
        throw new Error(`Entity schema not found for app ${normalizedAppId}: ${normalizedEntityId}`);
      }

      const nextDefinition = {
        ...current,
        ...schemaDefinition,
        id: normalizedEntityId,
        appId: normalizedAppId,
        fields: Array.isArray(schemaDefinition.fields)
          ? schemaDefinition.fields
          : current.fields || []
      };

      const schema = this.normalizeEntitySchema(normalizedAppId, nextDefinition);
      const storageKey = this.getEntitySchemaStorageKey(normalizedAppId, schema.id);
      this.entitySchemas.set(storageKey, schema);

      const storage = this.getActiveStorageConnection();
      if (storage && typeof storage.write === 'function') {
        storage.write('entity-schemas', storageKey, schema);
      }

      return { ...schema, fields: schema.fields.map((field) => ({ ...field })) };
    },

    getEntitySchema(appId, entityId) {
      const normalizedAppId = normalizeString(appId, 'default-app');
      const normalizedEntityId = normalizeString(entityId, '');
      if (!normalizedEntityId) {
        return null;
      }

      const storageKey = this.getEntitySchemaStorageKey(normalizedAppId, normalizedEntityId);
      return this.entitySchemas.has(storageKey)
        ? { ...this.entitySchemas.get(storageKey), fields: (this.entitySchemas.get(storageKey).fields || []).map((field) => ({ ...field })) }
        : null;
    },

    unregisterEntitySchema(appId, entityId) {
      const normalizedAppId = normalizeString(appId, 'default-app');
      const normalizedEntityId = normalizeString(entityId, '');
      if (!normalizedEntityId) {
        return false;
      }

      const storageKey = this.getEntitySchemaStorageKey(normalizedAppId, normalizedEntityId);
      const removed = this.entitySchemas.delete(storageKey);
      if (removed) {
        const storage = this.getActiveStorageConnection();
        if (storage && typeof storage.remove === 'function') {
          storage.remove('entity-schemas', storageKey);
        }
      }
      return removed;
    },

    listEntitySchemas(appId = null) {
      const entries = Array.from(this.entitySchemas.values());
      if (!appId) {
        return entries.map((schema) => ({ ...schema, fields: (schema.fields || []).map((field) => ({ ...field })) }));
      }

      const normalizedAppId = normalizeString(appId, '');
      return entries
        .filter((schema) => schema.appId === normalizedAppId)
        .map((schema) => ({ ...schema, fields: (schema.fields || []).map((field) => ({ ...field })) }));
    },

    normalizeEntityValue(field = {}, rawValue) {
      if (!isPlainObject(field)) {
        return rawValue;
      }

      const type = normalizeString(field.type || 'string', 'string').toLowerCase();
      const hasValue = rawValue !== null && rawValue !== undefined && rawValue !== '';

      if (!hasValue) {
        if (Object.prototype.hasOwnProperty.call(field, 'defaultValue')) {
          return field.defaultValue;
        }
        if (type === 'number') {
          return 0;
        }
        if (type === 'boolean') {
          return false;
        }
        if (type === 'array') {
          return [];
        }
        if (type === 'object' || type === 'json') {
          return {};
        }
        return '';
      }

      if (type === 'number') {
        const numeric = Number(rawValue);
        return Number.isFinite(numeric) ? numeric : 0;
      }

      if (type === 'boolean') {
        return rawValue === true || rawValue === 'true' || rawValue === 1 || rawValue === '1';
      }

      if (type === 'array') {
        if (Array.isArray(rawValue)) {
          return rawValue;
        }
        if (typeof rawValue === 'string') {
          try {
            const parsed = JSON.parse(rawValue);
            return Array.isArray(parsed) ? parsed : [rawValue];
          } catch (error) {
            return [rawValue];
          }
        }
        return [rawValue];
      }

      if (type === 'object' || type === 'json') {
        if (isPlainObject(rawValue)) {
          return rawValue;
        }
        if (typeof rawValue === 'string') {
          try {
            const parsed = JSON.parse(rawValue);
            return isPlainObject(parsed) ? parsed : { value: rawValue };
          } catch (error) {
            return { value: rawValue };
          }
        }
        return { value: rawValue };
      }

      if (type === 'date' || type === 'datetime') {
        if (rawValue instanceof Date) {
          return rawValue.toISOString();
        }
        if (typeof rawValue === 'string' && rawValue.trim()) {
          return rawValue;
        }
        return new Date().toISOString();
      }

      return String(rawValue);
    },

    createEntityRecord(appId, entityId, payload = {}) {
      const normalizedAppId = normalizeString(appId, 'default-app');
      const schema = this.getEntitySchema(normalizedAppId, entityId);
      if (!schema) {
        throw new Error(`Entity schema not found for app ${normalizedAppId}: ${entityId}`);
      }

      const source = isPlainObject(payload) ? payload : {};
      const recordId = normalizeString(source.id || `${entityId}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`, '');
      if (!recordId) {
        throw new Error('Record id is required.');
      }

      const record = {
        id: recordId,
        appId: normalizedAppId,
        entityId: normalizeString(entityId, schema.id),
        createdAt: source.createdAt || new Date().toISOString(),
        updatedAt: source.updatedAt || new Date().toISOString()
      };

      for (const field of schema.fields) {
        const candidate = field.key || field.id;
        const hasExplicitValue = Object.prototype.hasOwnProperty.call(source, candidate)
          || Object.prototype.hasOwnProperty.call(source, field.name)
          || Object.prototype.hasOwnProperty.call(source, field.label);
        const valueFromSource = hasExplicitValue
          ? (Object.prototype.hasOwnProperty.call(source, candidate)
            ? source[candidate]
            : (Object.prototype.hasOwnProperty.call(source, field.name)
              ? source[field.name]
              : source[field.label]))
          : undefined;

        if (valueFromSource === undefined && field.required) {
          throw new Error(`Field "${field.name}" is required for entity "${schema.id}".`);
        }

        const normalizedValue = this.normalizeEntityValue(field, valueFromSource);
        record[candidate] = normalizedValue;
      }

      const storageKey = this.getEntitySchemaStorageKey(normalizedAppId, entityId);
      const storage = this.getActiveStorageConnection();
      const existingRecords = storage && typeof storage.read === 'function'
        ? (storage.read('entity-records', storageKey, []) || [])
        : (this.entityRecords.get(storageKey) || []);

      const records = Array.isArray(existingRecords) ? [...existingRecords] : [];
      records.push(record);

      this.entityRecords.set(storageKey, records);
      if (storage && typeof storage.write === 'function') {
        storage.write('entity-records', storageKey, records);
      }

      return { ...record };
    },

    listEntityRecords(appId, entityId, filters = {}) {
      const normalizedAppId = normalizeString(appId, 'default-app');
      const normalizedEntityId = normalizeString(entityId, '');
      const storageKey = this.getEntitySchemaStorageKey(normalizedAppId, normalizedEntityId);
      const storage = this.getActiveStorageConnection();
      const records = storage && typeof storage.read === 'function'
        ? (storage.read('entity-records', storageKey, []) || [])
        : (this.entityRecords.get(storageKey) || []);

      const nextList = Array.isArray(records) ? records : [];
      const filterMap = isPlainObject(filters) ? filters : {};
      const filtered = nextList.filter((entry) => {
        if (!entry || typeof entry !== 'object') {
          return false;
        }
        return Object.entries(filterMap).every(([key, value]) => {
          if (value === undefined || value === null || value === '') {
            return true;
          }
          return entry[key] === value;
        });
      });

      return filtered.map((record) => ({ ...record }));
    },

    getEntityRecord(appId, entityId, recordId) {
      const records = this.listEntityRecords(appId, entityId);
      return records.find((record) => record.id === recordId) || null;
    },

    updateEntityRecord(appId, entityId, recordId, updates = {}) {
      const normalizedAppId = normalizeString(appId, 'default-app');
      const normalizedEntityId = normalizeString(entityId, '');
      const storageKey = this.getEntitySchemaStorageKey(normalizedAppId, normalizedEntityId);
      const storage = this.getActiveStorageConnection();
      const records = storage && typeof storage.read === 'function'
        ? (storage.read('entity-records', storageKey, []) || [])
        : (this.entityRecords.get(storageKey) || []);

      const nextRecords = Array.isArray(records) ? [...records] : [];
      const index = nextRecords.findIndex((record) => record && record.id === recordId);
      if (index === -1) {
        return null;
      }

      const nextRecord = {
        ...nextRecords[index],
        ...(isPlainObject(updates) ? updates : {}),
        updatedAt: new Date().toISOString()
      };
      nextRecords[index] = nextRecord;

      this.entityRecords.set(storageKey, nextRecords);
      if (storage && typeof storage.write === 'function') {
        storage.write('entity-records', storageKey, nextRecords);
      }
      return { ...nextRecord };
    },

    deleteEntityRecord(appId, entityId, recordId) {
      const normalizedAppId = normalizeString(appId, 'default-app');
      const normalizedEntityId = normalizeString(entityId, '');
      const storageKey = this.getEntitySchemaStorageKey(normalizedAppId, normalizedEntityId);
      const storage = this.getActiveStorageConnection();
      const records = storage && typeof storage.read === 'function'
        ? (storage.read('entity-records', storageKey, []) || [])
        : (this.entityRecords.get(storageKey) || []);

      const nextRecords = Array.isArray(records) ? records.filter((record) => record && record.id !== recordId) : [];
      this.entityRecords.set(storageKey, nextRecords);
      if (storage && typeof storage.write === 'function') {
        storage.write('entity-records', storageKey, nextRecords);
      }
      return nextRecords;
    },

    normalizeConnection(connectionDefinition) {
      if (!isPlainObject(connectionDefinition)) {
        throw new TypeError('Connection definition must be an object.');
      }

      const connectionId = normalizeString(connectionDefinition.connectionId || connectionDefinition.id, 'default-connection');
      const appId = normalizeString(connectionDefinition.appId || connectionDefinition.app, 'default-app');
      const serverUrl = normalizeString(connectionDefinition.serverUrl || connectionDefinition.url || connectionDefinition.serverAddress, ((typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') ? window.location.origin : 'http://localhost'));
      const apiBase = normalizeString(connectionDefinition.apiBase || connectionDefinition.basePath || '/api', '/api');
      const storageType = this.normalizeStorageType(connectionDefinition.storageType || connectionDefinition.type || connectionDefinition.databaseType || connectionDefinition.connectionType || 'file', 'file');
      const databaseType = this.normalizeStorageType(connectionDefinition.databaseType || connectionDefinition.sqlType || ((storageType === 'sql' || storageType === 'sqlite' || storageType === 'mysql' || storageType === 'postgresql') ? storageType : ''), '');
      const databaseName = normalizeString(connectionDefinition.databaseName || connectionDefinition.name || connectionDefinition.database || '', '');
      const storagePath = normalizeString(connectionDefinition.storagePath || connectionDefinition.filePath || connectionDefinition.path || '', '');
      const host = normalizeString(connectionDefinition.host || '', '');
      const port = normalizeString(connectionDefinition.port || connectionDefinition.portNumber || '', '');
      const username = normalizeString(connectionDefinition.username || '', '');
      const password = normalizeString(connectionDefinition.password || '', '');

      return {
        connectionId,
        id: connectionId,
        appId,
        serverUrl,
        apiBase,
        type: storageType,
        storageType,
        connectionType: normalizeString(connectionDefinition.connectionType || storageType, storageType),
        databaseType,
        databaseName,
        storagePath,
        host,
        port,
        username,
        password,
        endpoints: isPlainObject(connectionDefinition.endpoints) ? { ...connectionDefinition.endpoints } : {},
        status: normalizeString(connectionDefinition.status, 'inactive'),
        active: !!connectionDefinition.active,
        default: !!connectionDefinition.default,
        authType: normalizeString(connectionDefinition.authType, 'none'),
        credentialsRef: normalizeString(connectionDefinition.credentialsRef, ''),
        health: isPlainObject(connectionDefinition.health) ? { ...connectionDefinition.health } : { status: 'unknown' },
        lastTestAt: connectionDefinition.lastTestAt || null,
        createdAt: connectionDefinition.createdAt || new Date().toISOString(),
        updatedAt: connectionDefinition.updatedAt || new Date().toISOString()
      };
    },

    registerConnection(connectionDefinition) {
      const connection = this.normalizeConnection(connectionDefinition);
      this.connections.set(connection.connectionId, connection);
      return connection;
    },

    getConnection(connectionId) {
      const normalized = normalizeString(connectionId, '');
      if (!normalized) {
        return null;
      }
      return this.connections.get(normalized) || null;
    },

    listConnections(appId = null) {
      const values = Array.from(this.connections.values());
      if (!appId) {
        return values;
      }
      return values.filter((connection) => connection.appId === normalizeString(appId, ''));
    },

    updateConnection(connectionId, updates) {
      const connection = this.getConnection(connectionId);
      if (!connection) {
        throw new Error(`Connection not found: ${connectionId}`);
      }
      const next = { ...connection, ...updates, updatedAt: new Date().toISOString() };
      this.connections.set(connectionId, next);
      return next;
    },

    setConnectionStatus(connectionId, status) {
      const normalizedStatus = normalizeString(status, 'inactive');
      const connection = this.getConnection(connectionId);
      if (!connection) {
        throw new Error(`Connection not found: ${connectionId}`);
      }
      connection.status = normalizedStatus;
      connection.active = normalizedStatus === 'active' || normalizedStatus === 'healthy';
      connection.updatedAt = new Date().toISOString();
      return connection;
    },

    async testConnection(connectionId, testHandler = null) {
      const connection = this.getConnection(connectionId);
      if (!connection) {
        throw new Error(`Connection not found: ${connectionId}`);
      }

      const result = typeof testHandler === 'function'
        ? await testHandler(connection)
        : { ok: true, status: 'healthy', checkedAt: new Date().toISOString() };

      connection.health = isPlainObject(result) ? { ...result } : { status: 'healthy' };
      connection.lastTestAt = new Date().toISOString();
      connection.status = result && result.status ? String(result.status) : connection.status;
      connection.updatedAt = new Date().toISOString();
      return connection;
    },

    getStorageManager() {
      if (typeof globalThis !== 'undefined' && globalThis.StorageManager && typeof globalThis.StorageManager.resolveStorageAdapter === 'function') {
        return globalThis.StorageManager;
      }

      if (typeof require === 'function') {
        try {
          return require('./storage-manager');
        } catch (error) {
          return null;
        }
      }

      return null;
    },

    getProviderManager() {
      if (typeof globalThis !== 'undefined' && globalThis.ProviderManager && typeof globalThis.ProviderManager.normalizeProviderDefinition === 'function') {
        return globalThis.ProviderManager;
      }

      if (typeof require === 'function') {
        try {
          return require('./provider-manager');
        } catch (error) {
          return null;
        }
      }

      return null;
    },

    normalizeProviderType(value, fallback = 'local') {
      const manager = this.getProviderManager();
      if (manager && typeof manager.normalizeProviderType === 'function') {
        return manager.normalizeProviderType(value, fallback);
      }

      const normalized = normalizeString(String(value || fallback), fallback).toLowerCase();
      const aliases = {
        local: 'local',
        server: 'server',
        ownserver: 'server',
        cloud: 'cloud',
        cpanel: 'cpanel',
        ftps: 'cpanel'
      };
      return aliases[normalized] || fallback;
    },

    normalizeProvider(providerDefinition = {}) {
      const manager = this.getProviderManager();
      if (manager && typeof manager.normalizeProviderDefinition === 'function') {
        return manager.normalizeProviderDefinition(providerDefinition);
      }

      if (!isPlainObject(providerDefinition)) {
        throw new TypeError('Provider definition must be an object.');
      }

      const providerId = normalizeString(providerDefinition.providerId || providerDefinition.id || providerDefinition.name || 'local-provider', 'local-provider');
      const type = this.normalizeProviderType(providerDefinition.type || providerDefinition.providerType || providerDefinition.kind || 'local', 'local');
      const now = new Date().toISOString();

      return {
        providerId,
        id: providerId,
        name: normalizeString(providerDefinition.name || providerDefinition.label || providerId, providerId),
        type,
        providerType: type,
        status: normalizeString(providerDefinition.status, 'unconfigured'),
        active: !!providerDefinition.active,
        default: !!providerDefinition.default,
        endpoint: normalizeString(providerDefinition.endpoint || providerDefinition.url || providerDefinition.host || '', ''),
        host: normalizeString(providerDefinition.host || providerDefinition.hostname || '', ''),
        region: normalizeString(providerDefinition.region || '', ''),
        path: normalizeString(providerDefinition.path || providerDefinition.rootPath || '', ''),
        apiBase: normalizeString(providerDefinition.apiBase || providerDefinition.basePath || '/api', '/api'),
        authType: normalizeString(providerDefinition.authType || 'none', 'none'),
        username: normalizeString(providerDefinition.username || '', ''),
        password: normalizeString(providerDefinition.password || '', ''),
        credentialsRef: normalizeString(providerDefinition.credentialsRef || '', ''),
        metadata: isPlainObject(providerDefinition.metadata) ? { ...providerDefinition.metadata } : {},
        createdAt: normalizeString(providerDefinition.createdAt, now),
        updatedAt: normalizeString(providerDefinition.updatedAt, now)
      };
    },

    normalizeBackupEntry(entry = {}) {
      if (!isPlainObject(entry)) {
        return null;
      }

      const backupId = normalizeString(entry.backupId || entry.id || entry.name || `backup-${Date.now()}`, `backup-${Date.now()}`);
      const now = new Date().toISOString();
      return {
        backupId,
        id: backupId,
        label: normalizeString(entry.label || entry.name || `Backup ${backupId}`, `Backup ${backupId}`),
        providerId: normalizeString(entry.providerId || entry.provider || 'local-provider', 'local-provider'),
        status: normalizeString(entry.status || 'completed', 'completed'),
        filePath: normalizeString(entry.filePath || entry.path || '', ''),
        size: Number.isFinite(entry.size) ? entry.size : 0,
        createdAt: normalizeString(entry.createdAt, now),
        updatedAt: normalizeString(entry.updatedAt, now),
        lastRestoredAt: normalizeString(entry.lastRestoredAt, ''),
        metadata: isPlainObject(entry.metadata) ? { ...entry.metadata } : {}
      };
    },

    registerProvider(providerDefinition = {}) {
      const provider = this.normalizeProvider(providerDefinition);
      this.providers.set(provider.providerId, provider);
      return { ...provider, metadata: { ...(provider.metadata || {}) } };
    },

    getProvider(providerId) {
      const normalized = normalizeString(providerId, '');
      if (!normalized) {
        return null;
      }
      return this.providers.has(normalized)
        ? { ...this.providers.get(normalized), metadata: { ...(this.providers.get(normalized).metadata || {}) } }
        : null;
    },

    listProviders() {
      return Array.from(this.providers.values()).map((provider) => ({ ...provider, metadata: { ...(provider.metadata || {}) } }));
    },

    setActiveProvider(providerId) {
      const normalized = normalizeString(providerId, '');
      if (!normalized) {
        throw new Error('Provider id is required.');
      }

      const provider = this.getProvider(normalized);
      if (!provider) {
        throw new Error(`Provider not found: ${normalized}`);
      }

      for (const existing of this.providers.values()) {
        existing.active = false;
      }
      provider.active = true;
      provider.status = provider.status || 'ready';
      this.providers.set(provider.providerId, provider);
      return { ...provider, metadata: { ...(provider.metadata || {}) } };
    },

    removeProvider(providerId) {
      const normalized = normalizeString(providerId, '');
      if (!normalized) {
        return false;
      }
      return this.providers.delete(normalized);
    },

    getBackupService() {
      if (typeof require === 'function') {
        try {
          return require('../server/services/backup-service');
        } catch (error) {
          return null;
        }
      }
      return null;
    },

    listBackups() {
      const state = this.loadAdminState();
      const service = this.getBackupService();
      const persisted = service && typeof service.listBackups === 'function' ? service.listBackups() : [];
      const source = Array.isArray(state.backups) && state.backups.length > 0 ? state.backups : persisted;
      return Array.isArray(source)
        ? source.map((entry) => this.normalizeBackupEntry(entry)).filter(Boolean)
        : [];
    },

    getBackup(backupId) {
      const normalized = normalizeString(backupId, '');
      if (!normalized) {
        return null;
      }
      const state = this.loadAdminState();
      const found = (Array.isArray(state.backups) ? state.backups : []).find((entry) => entry.backupId === normalized || entry.id === normalized);
      if (found) {
        return this.normalizeBackupEntry(found);
      }
      const service = this.getBackupService();
      if (service && typeof service.getBackup === 'function') {
        const backup = service.getBackup(normalized);
        return backup ? this.normalizeBackupEntry(backup) : null;
      }
      return null;
    },

    createBackup(config = {}) {
      const service = this.getBackupService();
      if (!service || typeof service.createBackup !== 'function') {
        throw new Error('Backup service is not available.');
      }
      const backup = service.createBackup(config);
      const state = this.loadAdminState();
      const backups = Array.isArray(state.backups) ? [...state.backups] : [];
      const entry = this.normalizeBackupEntry(backup);
      if (entry) {
        const index = backups.findIndex((candidate) => candidate.backupId === entry.backupId || candidate.id === entry.backupId);
        if (index >= 0) {
          backups[index] = { ...backups[index], ...entry };
        } else {
          backups.unshift(entry);
        }
        state.backups = backups;
        state.activeBackupId = entry.backupId;
        this.saveAdminState(state);
      }
      return entry || backup;
    },

    restoreBackup(backupId) {
      const service = this.getBackupService();
      if (!service || typeof service.restoreBackup !== 'function') {
        throw new Error('Backup service is not available.');
      }
      const result = service.restoreBackup(backupId);
      if (result && result.ok) {
        const state = this.loadAdminState();
        state.activeBackupId = normalizeString(result.backupId || backupId, '');
        state.updatedAt = new Date().toISOString();
        this.saveAdminState(state);
      }
      return result;
    },

    removeBackup(backupId) {
      const service = this.getBackupService();
      if (!service || typeof service.removeBackup !== 'function') {
        return false;
      }
      const state = this.loadAdminState();
      const normalized = normalizeString(backupId, '');
      const removed = service.removeBackup(normalized);
      if (removed) {
        state.backups = Array.isArray(state.backups)
          ? state.backups.filter((entry) => (entry.backupId || entry.id) !== normalized)
          : [];
        if (state.activeBackupId === normalized) {
          state.activeBackupId = '';
        }
        this.saveAdminState(state);
      }
      return removed;
    },

    normalizeStorageType(value, fallback = 'file') {
      const manager = this.getStorageManager();
      if (manager && typeof manager.normalizeStorageType === 'function') {
        return manager.normalizeStorageType(value, fallback);
      }

      const normalized = normalizeString(String(value || fallback), fallback).toLowerCase();
      const aliases = {
        text: 'file',
        json: 'file',
        file: 'file',
        filesystem: 'file',
        sqlite: 'sqlite',
        sql: 'sqlite',
        database: 'sqlite',
        mysql: 'mysql',
        postgres: 'postgresql',
        postgresql: 'postgresql'
      };
      return aliases[normalized] || fallback;
    },

    createStorageAdapter(connectionDefinition = {}) {
      const manager = this.getStorageManager();
      if (manager && typeof manager.resolveStorageAdapter === 'function') {
        return manager.resolveStorageAdapter(connectionDefinition || {});
      }

      const normalized = this.normalizeConnection(connectionDefinition || {});
      return {
        id: normalized.connectionId,
        connectionId: normalized.connectionId,
        type: normalized.storageType,
        storageType: normalized.storageType,
        name: `${normalized.storageType.toUpperCase()} storage adapter`,
        async test() {
          return { ok: true, status: 'healthy', mode: normalized.storageType, checkedAt: new Date().toISOString() };
        },
        async read() { return null; },
        async write(collection, key, value) { return value; },
        async list() { return []; },
        async remove() { return true; }
      };
    },

    getActiveStorageConnection() {
      const defaultConnection = this.listConnections().find((connection) => !!connection.default) || this.listConnections().find((connection) => !!connection.active) || null;
      const fallback = this.normalizeConnection({
        connectionId: 'file-storage',
        appId: 'default-app',
        storageType: 'file',
        databaseType: 'file',
        active: true,
        default: true,
        status: 'active'
      });

      const source = defaultConnection || fallback;
      return this.createStorageAdapter(source);
    },

    setFeatureFlag(key, value) {
      const normalizedKey = normalizeString(key, '');
      if (!normalizedKey) {
        throw new Error('Feature flag key is required.');
      }
      this.featureFlags.set(normalizedKey, !!value);
      return this.featureFlags.get(normalizedKey);
    },

    getFeatureFlag(key, defaultValue = false) {
      const normalizedKey = normalizeString(key, '');
      if (!normalizedKey) {
        return defaultValue;
      }
      return this.featureFlags.has(normalizedKey) ? this.featureFlags.get(normalizedKey) : defaultValue;
    },

    listFeatureFlags() {
      return Array.from(this.featureFlags.entries()).map(([name, value]) => ({ name, value, status: createStatusSnapshot(name, value) }));
    },

    coerceVersion(value, fallback = '0.0.0') {
      const raw = normalizeString(String(value || fallback), fallback);
      const match = raw.match(/\d+(?:\.\d+){0,2}/);
      if (!match) {
        return this.coerceVersion(fallback, fallback);
      }
      const parts = match[0].split('.').map((entry) => Number.parseInt(entry, 10) || 0);
      while (parts.length < 3) {
        parts.push(0);
      }
      return parts.slice(0, 3).join('.');
    },

    compareVersions(leftVersion, rightVersion) {
      const left = this.coerceVersion(leftVersion, '0.0.0').split('.').map((entry) => Number.parseInt(entry, 10) || 0);
      const right = this.coerceVersion(rightVersion, '0.0.0').split('.').map((entry) => Number.parseInt(entry, 10) || 0);

      for (let index = 0; index < 3; index += 1) {
        if (left[index] < right[index]) {
          return -1;
        }
        if (left[index] > right[index]) {
          return 1;
        }
      }
      return 0;
    },

    versionMatches(version, requirement) {
      const current = this.coerceVersion(version, '0.0.0');
      const normalizedRequirement = normalizeString(String(requirement || '*'), '*');
      if (normalizedRequirement === '*' || normalizedRequirement === 'latest') {
        return true;
      }

      const match = normalizedRequirement.match(/^\s*(<=|>=|==|=|<|>|\^|~)?\s*(\d+(?:\.\d+){0,2})\s*$/i);
      if (!match) {
        return current === this.coerceVersion(normalizedRequirement, current);
      }

      const operator = match[1] || '=';
      const target = this.coerceVersion(match[2], '0.0.0');
      const comparison = this.compareVersions(current, target);

      if (operator === '=' || operator === '==') {
        return comparison === 0;
      }
      if (operator === '>') {
        return comparison > 0;
      }
      if (operator === '>=') {
        return comparison >= 0;
      }
      if (operator === '<') {
        return comparison < 0;
      }
      if (operator === '<=') {
        return comparison <= 0;
      }
      if (operator === '^') {
        const targetParts = target.split('.').map((entry) => Number.parseInt(entry, 10) || 0);
        const upperBound = [targetParts[0] + 1, 0, 0].join('.');
        return comparison >= 0 && this.compareVersions(current, upperBound) < 0;
      }
      if (operator === '~') {
        const targetParts = target.split('.').map((entry) => Number.parseInt(entry, 10) || 0);
        const upperBound = [targetParts[0], targetParts[1] + 1, 0].join('.');
        return comparison >= 0 && this.compareVersions(current, upperBound) < 0;
      }
      return comparison === 0;
    },

    normalizeModuleDependencyMap(dependencies = []) {
      const source = Array.isArray(dependencies)
        ? dependencies
        : isPlainObject(dependencies)
          ? Object.entries(dependencies)
          : typeof dependencies === 'string'
            ? [dependencies]
            : [];

      const normalized = {};
      source.forEach((entry) => {
        if (typeof entry === 'string') {
          normalized[normalizeString(entry, '')] = '*';
          return;
        }

        if (isPlainObject(entry)) {
          const name = normalizeString(entry.name || entry.moduleId || entry.id || '', '');
          if (!name) {
            return;
          }
          normalized[name] = normalizeString(entry.version || entry.range || entry.requirement || '*', '*');
          return;
        }

        if (Array.isArray(entry)) {
          const [name, requirement = '*'] = entry;
          const depName = normalizeString(String(name || ''), '');
          if (depName) {
            normalized[depName] = normalizeString(String(requirement || '*'), '*');
          }
        }

        if (isPlainObject(source) && typeof entry === 'object' && entry !== null && !Array.isArray(entry)) {
          // noop: handled earlier via Object.entries validation
        }
      });

      if (isPlainObject(dependencies)) {
        Object.entries(dependencies).forEach(([name, requirement]) => {
          const depName = normalizeString(name, '');
          if (!depName) {
            return;
          }
          normalized[depName] = normalizeString(String(requirement || '*'), '*');
        });
      }

      return Object.fromEntries(Object.entries(normalized).filter(([key]) => !!key));
    },

    normalizeModuleDefinition(moduleDefinition = {}) {
      if (!isPlainObject(moduleDefinition)) {
        throw new TypeError('Module definition must be an object.');
      }

      const moduleId = normalizeString(moduleDefinition.id || moduleDefinition.moduleId || moduleDefinition.name || '', '');
      if (!moduleId) {
        throw new Error('Module id is required.');
      }

      const appId = normalizeString(moduleDefinition.appId || moduleDefinition.app || 'default-app', 'default-app');
      const version = normalizeString(moduleDefinition.version || '1.0.0', '1.0.0');
      const dependencies = this.normalizeModuleDependencyMap(moduleDefinition.dependencies || {});
      const optionalDependencies = this.normalizeModuleDependencyMap(moduleDefinition.optionalDependencies || {});
      const conflicts = Array.isArray(moduleDefinition.conflicts)
        ? moduleDefinition.conflicts.filter(Boolean).map((entry) => normalizeString(String(entry), '')).filter(Boolean)
        : [];
      const permissions = Array.isArray(moduleDefinition.permissions)
        ? [...new Set(moduleDefinition.permissions.filter(Boolean).map((entry) => normalizeString(String(entry), '')).filter(Boolean))]
        : [];

      return {
        id: moduleId,
        name: normalizeString(moduleDefinition.name || moduleId, moduleId),
        version,
        appId,
        status: normalizeString(moduleDefinition.status || 'available', 'available'),
        enabled: !!moduleDefinition.enabled,
        active: !!moduleDefinition.active,
        description: normalizeString(moduleDefinition.description || '', ''),
        dependencies,
        optionalDependencies,
        conflicts,
        permissions,
        capabilities: Array.isArray(moduleDefinition.capabilities)
          ? [...new Set(moduleDefinition.capabilities.filter(Boolean).map((entry) => normalizeString(String(entry), '')).filter(Boolean))]
          : [],
        coreVersion: normalizeString(moduleDefinition.coreVersion || '', ''),
        source: normalizeString(moduleDefinition.source || moduleDefinition.modulePath || '', ''),
        config: isPlainObject(moduleDefinition.config) ? { ...moduleDefinition.config } : {},
        manifest: isPlainObject(moduleDefinition.manifest) ? { ...moduleDefinition.manifest } : {},
        createdAt: normalizeString(moduleDefinition.createdAt || new Date().toISOString(), new Date().toISOString()),
        updatedAt: normalizeString(moduleDefinition.updatedAt || new Date().toISOString(), new Date().toISOString())
      };
    },

    getModule(moduleId) {
      const normalized = normalizeString(moduleId, '');
      if (!normalized) {
        return null;
      }
      return this.modules.has(normalized) ? { ...this.modules.get(normalized), dependencies: { ...(this.modules.get(normalized).dependencies || {}) }, optionalDependencies: { ...(this.modules.get(normalized).optionalDependencies || {}) }, permissions: [...(this.modules.get(normalized).permissions || [])], capabilities: [...(this.modules.get(normalized).capabilities || [])], conflicts: [...(this.modules.get(normalized).conflicts || [])] } : null;
    },

    listModules() {
      return Array.from(this.modules.values()).map((module) => ({ ...module, dependencies: { ...(module.dependencies || {}) }, optionalDependencies: { ...(module.optionalDependencies || {}) }, permissions: [...(module.permissions || [])], capabilities: [...(module.capabilities || [])], conflicts: [...(module.conflicts || [])] }));
    },

    registerModule(moduleDefinition = {}) {
      const normalized = this.normalizeModuleDefinition(moduleDefinition);
      this.modules.set(normalized.id, normalized);
      const key = `${normalized.appId}:${normalized.id}`;
      const snapshot = this.moduleSnapshots.get(key) || { version: normalized.version, status: normalized.status, installedAt: new Date().toISOString() };
      this.moduleSnapshots.set(key, { ...snapshot, version: normalized.version, status: normalized.status, updatedAt: new Date().toISOString() });
      return this.getModule(normalized.id);
    },

    detectCircularDependencies(moduleId, graph = null, visited = new Set(), stack = []) {
      const targetId = normalizeString(moduleId, '');
      if (!targetId) {
        return [];
      }
      const dependencyGraph = graph || new Map(Array.from(this.modules.values()).map((module) => [module.id, Object.keys(module.dependencies || {})]));
      const currentStack = [...stack, targetId];
      const currentModule = dependencyGraph.get(targetId) || [];

      for (const dependency of currentModule) {
        if (currentStack.includes(dependency)) {
          return [...currentStack, dependency];
        }
        if (!visited.has(dependency) && dependencyGraph.has(dependency)) {
          visited.add(dependency);
          const cycle = this.detectCircularDependencies(dependency, dependencyGraph, visited, currentStack);
          if (cycle.length > 0) {
            return cycle;
          }
        }
      }
      return [];
    },

    validateModuleDependencies(moduleId) {
      const module = this.getModule(moduleId);
      if (!module) {
        return { ok: false, code: 'MODULE_NOT_FOUND', errors: ['Module not found.'], missing: [], invalidVersions: [], conflicts: [] };
      }

      const errors = [];
      const missing = [];
      const invalidVersions = [];
      const conflicts = [];

      if (module.coreVersion && this.compareVersions(this.version, module.coreVersion) < 0) {
        errors.push(`Framework version ${this.version} does not satisfy required core version ${module.coreVersion}.`);
      }

      const cycle = this.detectCircularDependencies(module.id);
      if (cycle.length > 0) {
        errors.push(`Circular dependency detected: ${cycle.join(' -> ')}`);
      }

      Object.entries(module.dependencies || {}).forEach(([dependencyId, requirement]) => {
        const dependency = this.getModule(dependencyId);
        if (!dependency) {
          missing.push(dependencyId);
          errors.push(`Missing dependency: ${dependencyId}.`);
          return;
        }

        const dependencyRequirement = normalizeString(String(requirement || '*'), '*');
        if (!this.versionMatches(dependency.version, dependencyRequirement)) {
          invalidVersions.push({ moduleId: dependencyId, requirement: dependencyRequirement, actual: dependency.version });
          errors.push(`Dependency ${dependencyId} version ${dependency.version} does not satisfy ${dependencyRequirement}.`);
        }
      });

      (module.conflicts || []).forEach((conflictId) => {
        if (this.getModule(conflictId)) {
          conflicts.push(conflictId);
          errors.push(`Module conflict detected: ${module.id} conflicts with ${conflictId}.`);
        }
      });

      return {
        ok: errors.length === 0,
        code: errors.length === 0 ? 'OK' : 'DEPENDENCY_ERROR',
        errors,
        missing,
        invalidVersions,
        conflicts,
        circular: cycle
      };
    },

    installModule(moduleDefinition = {}) {
      const module = this.normalizeModuleDefinition(moduleDefinition);
      const dependencyState = this.validateModuleDependencies(module.id);
      if (!dependencyState.ok) {
        return { ok: false, code: 'DEPENDENCY_ERROR', errors: dependencyState.errors, module, dependencyState };
      }

      const current = this.getModule(module.id);
      if (current) {
        const updatedModule = { ...current, ...module, status: 'installed', enabled: !!module.enabled, active: !!module.active, updatedAt: new Date().toISOString() };
        this.modules.set(module.id, updatedModule);
        return { ok: true, code: 'UPDATED', module: this.getModule(module.id) };
      }

      const installedModule = { ...module, status: 'installed', enabled: false, active: false, updatedAt: new Date().toISOString() };
      this.modules.set(installedModule.id, installedModule);
      return { ok: true, code: 'INSTALLED', module: this.getModule(installedModule.id) };
    },

    enableModule(moduleId) {
      const module = this.getModule(moduleId);
      if (!module) {
        return { ok: false, code: 'MODULE_NOT_FOUND', message: `Module not found: ${moduleId}` };
      }

      const dependencyState = this.validateModuleDependencies(module.id);
      if (!dependencyState.ok) {
        return { ok: false, code: 'DEPENDENCY_ERROR', message: dependencyState.errors.join(' '), dependencyState };
      }

      const enabledModule = { ...module, status: 'enabled', enabled: true, active: true, updatedAt: new Date().toISOString() };
      this.modules.set(enabledModule.id, enabledModule);
      return { ok: true, code: 'ENABLED', module: this.getModule(enabledModule.id) };
    },

    disableModule(moduleId) {
      const module = this.getModule(moduleId);
      if (!module) {
        return { ok: false, code: 'MODULE_NOT_FOUND', message: `Module not found: ${moduleId}` };
      }

      const updatedModule = { ...module, status: 'disabled', enabled: false, active: false, updatedAt: new Date().toISOString() };
      this.modules.set(updatedModule.id, updatedModule);
      return { ok: true, code: 'DISABLED', module: this.getModule(updatedModule.id) };
    },

    uninstallModule(moduleId) {
      const module = this.getModule(moduleId);
      if (!module) {
        return { ok: false, code: 'MODULE_NOT_FOUND', message: `Module not found: ${moduleId}` };
      }

      if (module.enabled || module.active) {
        return { ok: false, code: 'MODULE_ACTIVE', message: `Module ${moduleId} is still active and cannot be uninstalled.` };
      }

      this.modules.delete(module.id);
      return { ok: true, code: 'UNINSTALLED', moduleId: module.id };
    },

    getModuleDependencyGraph() {
      return new Map(Array.from(this.modules.values()).map((module) => [module.id, Object.keys(module.dependencies || {})]));
    },

    getModuleMigrations(moduleId) {
      const normalized = normalizeString(moduleId, '');
      if (!normalized) {
        return [];
      }
      const state = this.moduleMigrations.get(normalized) || new Map();
      return Array.from(state.values());
    },

    recordModuleMigration(moduleId, migrationRecord = {}) {
      const normalizedId = normalizeString(moduleId, '');
      if (!normalizedId) {
        throw new Error('Module id is required for migration tracking.');
      }
      const entry = {
        id: normalizeString(migrationRecord.id || `migration-${Date.now()}`, `migration-${Date.now()}`),
        moduleId: normalizedId,
        version: normalizeString(migrationRecord.version || '1.0.0', '1.0.0'),
        status: normalizeString(migrationRecord.status || 'pending', 'pending'),
        appliedAt: normalizeString(migrationRecord.appliedAt || '', ''),
        rolledBackAt: normalizeString(migrationRecord.rolledBackAt || '', ''),
        metadata: isPlainObject(migrationRecord.metadata) ? { ...migrationRecord.metadata } : {}
      };

      const current = this.moduleMigrations.get(normalizedId) || new Map();
      current.set(entry.id, entry);
      this.moduleMigrations.set(normalizedId, current);
      return entry;
    },

    createModuleSnapshot(moduleId) {
      const module = this.getModule(moduleId);
      if (!module) {
        return null;
      }
      const snapshot = {
        moduleId: module.id,
        appId: module.appId,
        version: module.version,
        status: module.status,
        enabled: !!module.enabled,
        active: !!module.active,
        createdAt: new Date().toISOString(),
        data: { ...module }
      };
      this.moduleSnapshots.set(`${module.appId}:${module.id}`, snapshot);
      return snapshot;
    },

    rollbackModule(moduleId, snapshot = null) {
      const module = this.getModule(moduleId);
      if (!module) {
        return { ok: false, code: 'MODULE_NOT_FOUND', message: `Module not found: ${moduleId}` };
      }

      const currentSnapshot = snapshot || this.moduleSnapshots.get(`${module.appId}:${module.id}`) || null;
      if (!currentSnapshot) {
        return { ok: false, code: 'NO_SNAPSHOT', message: `No rollback snapshot found for module ${moduleId}.` };
      }

      const restoredModule = {
        ...module,
        version: normalizeString(currentSnapshot.version || module.version, module.version),
        status: normalizeString(currentSnapshot.status || 'available', 'available'),
        enabled: !!currentSnapshot.enabled,
        active: !!currentSnapshot.active,
        updatedAt: new Date().toISOString()
      };

      this.modules.set(restoredModule.id, restoredModule);
      const migrationRecord = this.recordModuleMigration(moduleId, {
        id: `rollback-${Date.now()}`,
        version: restoredModule.version,
        status: 'rolled_back',
        rolledBackAt: new Date().toISOString(),
        metadata: { restoredFrom: currentSnapshot.version }
      });

      return { ok: true, code: 'ROLLED_BACK', module: this.getModule(moduleId), migration: migrationRecord };
    },

    async updateModule(moduleId, nextVersion, options = {}) {
      const module = this.getModule(moduleId);
      if (!module) {
        return { ok: false, code: 'MODULE_NOT_FOUND', message: `Module not found: ${moduleId}` };
      }

      const targetVersion = normalizeString(nextVersion || module.version, module.version);
      const snapshot = this.createModuleSnapshot(module.id) || { moduleId: module.id, appId: module.appId, version: module.version, status: module.status, enabled: module.enabled, active: module.active };
      const migrationPlan = Array.isArray(options.migrations) && options.migrations.length > 0 ? options.migrations : (Array.isArray(module.migrations) ? module.migrations : []);

      for (const migration of migrationPlan) {
        const migrationEntry = isPlainObject(migration) ? migration : { id: `migration-${Date.now()}` };
        const migrationResult = await (typeof migrationEntry.run === 'function'
          ? migrationEntry.run({ moduleId, fromVersion: module.version, toVersion: targetVersion, snapshot, appId: module.appId })
          : { ok: true, skipped: true, id: migrationEntry.id || `migration-${Date.now()}` });

        if (migrationResult && migrationResult.ok === false) {
          const rollbackResult = this.rollbackModule(moduleId, snapshot);
          return { ok: false, code: 'MIGRATION_FAILED', message: migrationResult.message || 'Migration failed.', migrationResult, rollbackResult };
        }
      }

      const updatedModule = {
        ...module,
        version: targetVersion,
        status: 'updated',
        enabled: !!module.enabled,
        active: !!module.active,
        updatedAt: new Date().toISOString()
      };
      this.modules.set(updatedModule.id, updatedModule);
      this.recordModuleMigration(moduleId, {
        id: `update-${Date.now()}`,
        version: targetVersion,
        status: 'applied',
        appliedAt: new Date().toISOString(),
        metadata: { fromVersion: module.version, toVersion: targetVersion }
      });
      return { ok: true, code: 'UPDATED', module: this.getModule(moduleId), snapshot };
    },

    registerRole(roleId, roleDefinition = {}) {
      const normalized = normalizeString(roleId, '');
      if (!normalized) {
        throw new Error('Role key is required.');
      }

      const definition = isPlainObject(roleDefinition) ? roleDefinition : {};
      const permissions = Array.isArray(definition.permissions)
        ? [...new Set(definition.permissions.filter(Boolean).map((value) => normalizeString(String(value), '')))].filter(Boolean)
        : [];

      const role = {
        role: normalized,
        name: normalizeString(definition.name, normalized),
        description: normalizeString(definition.description, ''),
        permissions,
        isSystem: !!definition.isSystem
      };

      this.roles.set(normalized, role);
      permissions.forEach((permission) => {
        this.registerPermission(permission, definition.permissionDescriptions && definition.permissionDescriptions[permission] ? definition.permissionDescriptions[permission] : '');
      });

      return { ...role };
    },

    getRole(roleId) {
      const normalized = normalizeString(roleId, '');
      if (!normalized) {
        return null;
      }
      return this.roles.has(normalized) ? { ...this.roles.get(normalized) } : null;
    },

    getRoleCatalog() {
      return Array.from(this.roles.values()).map((role) => ({ ...role, permissions: [...role.permissions] }));
    },

    getPermissionCatalog() {
      return Array.from(this.permissions.entries()).map(([permission, description]) => ({
        permission,
        description: normalizeString(description, '')
      }));
    },

    registerPermission(permission, description = '') {
      const normalized = normalizeString(permission, '');
      if (!normalized) {
        throw new Error('Permission key is required.');
      }
      this.permissions.set(normalized, normalizeString(description, ''));
      return { permission: normalized, description: this.permissions.get(normalized) };
    },

    checkPermission(subject, permission) {
      const permissionKey = normalizeString(permission, '');
      if (!permissionKey) {
        return { ok: false, code: 'NO_PERMISSION', message: 'Permission is required.' };
      }

      const value = subject && typeof subject === 'object' ? subject : null;
      const permissions = Array.isArray(value && value.permissions) ? value.permissions.filter(Boolean).map(String) : [];
      const roles = Array.isArray(value && value.roles) ? value.roles.filter(Boolean).map(String) : [];
      const hasPermission = permissions.includes(permissionKey) || roles.includes('admin') || roles.includes('developer');

      return {
        ok: hasPermission,
        code: hasPermission ? 'ALLOWED' : 'DENIED',
        permission: permissionKey,
        subject: value && (value.id || value.username || value.email) ? value.id || value.username || value.email : 'anonymous'
      };
    },

    getRuntimeSetupDefaults() {
      const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
      const config = (() => {
        if (typeof require !== 'function') {
          return {};
        }

        try {
          return require('../server/config') || {};
        } catch (error) {
          return {};
        }
      })();
      const activeApp = this.getActiveApp ? this.getActiveApp() : null;
      const appId = normalizeString(env.DEFAULT_APP_ID || env.APP_ID || env.NEUTRAL_APP_ID || (activeApp && activeApp.appId) || 'neutral-app', 'neutral-app');
      const appName = normalizeString(env.APP_NAME || env.NEUTRAL_APP_NAME || (activeApp && activeApp.name) || 'Neutral App', 'Neutral App');
      const host = normalizeString(env.HOST || config.host || '127.0.0.1', '127.0.0.1');
      const port = Number(env.PORT || config.port || 3000) || 3000;
      const serverUrl = normalizeString(env.SERVER_URL || env.PUBLIC_URL || env.BASE_URL || `http://${host}:${port}`, `http://${host}:${port}`);
      const apiBase = normalizeString(env.API_BASE || config.apiBase || '/api', '/api');
      const database = this.getDatabaseConfig ? this.getDatabaseConfig() : {};

      return {
        appId,
        appName,
        serverUrl,
        apiBase,
        configuration: {
          appId,
          appName,
          serverUrl,
          apiBase,
          database: { ...database }
        },
        serverState: {
          configured: !!(env.SERVER_URL || env.PUBLIC_URL || env.BASE_URL || env.HOST || env.PORT),
          testedAt: null,
          status: 'NOT_CONFIGURED',
          reachable: false,
          responseTimeMs: null,
          message: 'Server not configured.',
          url: serverUrl,
          apiBase
        },
        databaseState: {
          configured: !!(database && (database.host || database.name || database.url || database.username || database.type)),
          testedAt: null,
          status: 'NOT_CONFIGURED',
          reachable: false,
          responseTimeMs: null,
          message: 'Database not configured.',
          type: database.type || 'mysql',
          name: database.name || 'neutral',
          host: database.host || '',
          url: database.url || ''
        }
      };
    },

    getDefaultSetupState() {
      return {
        status: 'NOT_CONFIGURED',
        currentStep: 'system-check',
        completedSteps: [],
        appId: 'neutral-app',
        appName: 'Neutral App',
        selectedApp: null,
        configuration: {},
        serverState: {
          configured: false,
          testedAt: null,
          status: 'NOT_CONFIGURED',
          reachable: false,
          responseTimeMs: null,
          message: 'Server not configured.',
          url: '',
          apiBase: '/api'
        },
        databaseState: {
          configured: false,
          testedAt: null,
          status: 'NOT_CONFIGURED',
          reachable: false,
          responseTimeMs: null,
          message: 'Database not configured.',
          type: 'indexeddb',
          name: 'CoreDB',
          host: '',
          url: ''
        },
        frameworkState: {
          initialized: false,
          initializedAt: null,
          status: 'NOT_INITIALIZED',
          message: 'Framework not initialized.'
        },
        bootstrapState: {
          configured: false,
          enabled: true,
          username: 'developer',
          displayId: 'USR-000001',
          role: 'developer',
          status: 'NOT_CONFIGURED',
          message: 'Bootstrap not configured.'
        },
        connections: [],
        database: null,
        adminAccount: null,
        license: null,
        installation: {
          active: false,
          installedAt: null,
          activatedAt: null,
          state: 'NOT_CONFIGURED'
        },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
    },

    readPersistedSetupState() {
      const candidates = [];

      if (typeof localStorage !== 'undefined') {
        try {
          const raw = localStorage.getItem('master-framework.setup-state');
          if (raw) {
            candidates.push(JSON.parse(raw));
          }
        } catch (error) {
          // Ignore invalid persisted state in localStorage.
        }
      }

      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        try {
          const fs = require('node:fs');
          const path = require('node:path');
          const stateFile = path.resolve(process.cwd(), 'server', 'runtime', 'setup-state.json');
          if (fs.existsSync(stateFile)) {
            const raw = fs.readFileSync(stateFile, 'utf8');
            if (raw && raw.trim()) {
              candidates.push(JSON.parse(raw));
            }
          }
        } catch (error) {
          // Ignore invalid persisted state on disk.
        }
      }

      for (const candidate of candidates) {
        if (isPlainObject(candidate)) {
          return candidate;
        }
      }
      return null;
    },

    getInstallationStatus(state = null) {
      const source = state && isPlainObject(state) ? state : this.loadSetupState();
      const installation = source.installation || {};
      const serverState = source.serverState || {};
      const databaseState = source.databaseState || {};
      const frameworkState = source.frameworkState || {};
      const bootstrapState = source.bootstrapState || {};
      const config = source.configuration || {};
      const databaseConfig = source.database || config.database || null;
      const connections = Array.isArray(source.connections) ? source.connections.length : 0;
      const rawStatus = normalizeSetupStatus(source.status || installation.state || 'NOT_CONFIGURED', 'NOT_CONFIGURED');
      const hasConfiguration = !!(
        serverState.configured ||
        databaseState.configured ||
        databaseConfig ||
        config.serverUrl ||
        config.appId ||
        bootstrapState.configured ||
        (isPlainObject(config) && Object.keys(config).length > 0)
      );
      const hasTesting = !!(serverState.testedAt || databaseState.testedAt);

      if (installation.active === true || rawStatus === 'ACTIVE') {
        return 'ACTIVE';
      }
      if (rawStatus === 'ERROR' || serverState.status === 'ERROR' || databaseState.status === 'ERROR' || frameworkState.status === 'ERROR' || bootstrapState.status === 'ERROR') {
        return 'ERROR';
      }
      if (rawStatus === 'READY') {
        return 'READY';
      }
      if (frameworkState.initialized && serverState.testedAt && databaseState.testedAt) {
        return 'READY';
      }
      if (hasConfiguration && hasTesting) {
        return 'READY_TO_TEST';
      }
      if (rawStatus === 'READY_TO_TEST' || rawStatus === 'TESTING') {
        return rawStatus;
      }
      if (hasConfiguration || connections > 0 || source.currentStep === 'configuration') {
        return 'CONFIGURATION_REQUIRED';
      }
      return 'NOT_CONFIGURED';
    },

    normalizeSetupState(state = {}) {
      const baseState = this.getDefaultSetupState();
      const merged = {
        ...baseState,
        ...(isPlainObject(state) ? state : {}),
        configuration: cloneObject(state.configuration, baseState.configuration),
        serverState: normalizeSectionState(state.serverState, baseState.serverState),
        databaseState: normalizeSectionState(state.databaseState, baseState.databaseState),
        frameworkState: normalizeSectionState(state.frameworkState, baseState.frameworkState),
        bootstrapState: normalizeSectionState(state.bootstrapState, baseState.bootstrapState),
        installation: normalizeSectionState(state.installation, baseState.installation),
        connections: Array.isArray(state.connections) ? [...state.connections] : [...baseState.connections]
      };

      const status = this.getInstallationStatus(merged);
      merged.status = status;
      merged.installation.state = status;
      if (status === 'ACTIVE') {
        merged.installation.active = true;
        merged.installation.activatedAt = merged.installation.activatedAt || new Date().toISOString();
      }
      if (merged.frameworkState.initialized && !merged.frameworkState.initializedAt) {
        merged.frameworkState.initializedAt = new Date().toISOString();
      }
      return merged;
    },

    getSetupSnapshot() {
      return this.normalizeSetupState(this.loadSetupState());
    },

    getServerState() {
      return cloneObject(this.getSetupSnapshot().serverState, this.getDefaultSetupState().serverState);
    },

    getDatabaseState() {
      return cloneObject(this.getSetupSnapshot().databaseState, this.getDefaultSetupState().databaseState);
    },

    getFrameworkState() {
      return cloneObject(this.getSetupSnapshot().frameworkState, this.getDefaultSetupState().frameworkState);
    },

    getBootstrapState() {
      return cloneObject(this.getSetupSnapshot().bootstrapState, this.getDefaultSetupState().bootstrapState);
    },

    getServerStatus() {
      const state = this.getServerState();
      return {
        ...state,
        ok: state.status !== 'ERROR',
        configured: !!state.configured
      };
    },

    getDatabaseStatus() {
      const state = this.getDatabaseState();
      const runtimeConfig = this.getDatabaseConfig();
      const mysqlReady = runtimeConfig.type === 'mysql' && !!runtimeConfig.host && !!runtimeConfig.name && !!runtimeConfig.username;
      const configured = !!state.configured || mysqlReady;
      return {
        ...state,
        type: runtimeConfig.type || state.type || 'mysql',
        host: runtimeConfig.host || state.host || '',
        name: runtimeConfig.name || state.name || '',
        configured,
        ok: state.status !== 'ERROR' && state.status !== 'NOT_CONFIGURED' ? true : configured,
        ready: configured
      };
    },

    getDatabaseConfig(source = {}) {
      if (typeof require === 'function') {
        try {
          const databaseModule = require('../server/database/connection');
          if (databaseModule && typeof databaseModule.readRuntimeConfig === 'function') {
            return databaseModule.readRuntimeConfig(source || {});
          }
        } catch (error) {
          // Best effort: runtime config remains available in memory even when the
          // database connection module has not been loaded yet.
        }
      }

      const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
      const config = isPlainObject(source) ? source : {};
      const type = this.normalizeStorageType(
        config.type || config.databaseType || config.storageType || env.DB_TYPE || env.DATABASE_TYPE || env.MYSQL_TYPE || 'mysql',
        'mysql'
      );

      return {
        type,
        host: normalizeString(config.host || config.hostname || config.server || env.MYSQL_HOST || env.DB_HOST || '127.0.0.1', '127.0.0.1'),
        port: Number(config.port || config.portNumber || env.MYSQL_PORT || env.DB_PORT || 3306),
        name: normalizeString(config.name || config.database || config.databaseName || env.MYSQL_DATABASE || env.DB_NAME || 'neutral', 'neutral'),
        username: normalizeString(config.username || config.user || config.userName || env.MYSQL_USER || env.DB_USER || env.MYSQL_USERNAME || '', ''),
        password: normalizeString(config.password || config.pass || env.MYSQL_PASSWORD || env.DB_PASSWORD || '', ''),
        charset: normalizeString(config.charset || env.MYSQL_CHARSET || 'utf8mb4', 'utf8mb4'),
        connectionLimit: Number(config.connectionLimit || env.MYSQL_CONNECTION_LIMIT || 10),
        queueLimit: Number(config.queueLimit || env.MYSQL_QUEUE_LIMIT || 0),
        ssl: !!(config.ssl || env.MYSQL_SSL === 'true' || env.DB_SSL === 'true'),
        allowLocalFallback: config.allowLocalFallback !== false && env.DB_ALLOW_LOCAL_FALLBACK !== 'false'
      };
    },

    getDatabaseConnection(source = {}) {
      if (typeof require === 'function') {
        try {
          const databaseModule = require('../server/database/connection');
          if (databaseModule && typeof databaseModule.createDatabaseConnection === 'function') {
            return databaseModule.createDatabaseConnection({
              ...this.getDatabaseConfig(),
              ...(isPlainObject(source) ? source : {})
            });
          }
        } catch (error) {
          return null;
        }
      }
      return null;
    },

    loadSetupState() {
      const baseState = this.getDefaultSetupState();
      const persisted = this.readPersistedSetupState();
      const source = persisted && isPlainObject(persisted)
        ? persisted
        : (this.setupState && isPlainObject(this.setupState) ? this.setupState : null);

      if (!source) {
        this.setupState = this.normalizeSetupState(baseState);
        return this.setupState;
      }

      const merged = this.normalizeSetupState({
        ...baseState,
        ...source
      });

      this.setupState = merged;
      return merged;
    },

    saveSetupState(nextState = null) {
      const state = isPlainObject(nextState) ? nextState : this.loadSetupState();
      const normalized = this.normalizeSetupState({
        ...this.getDefaultSetupState(),
        ...state,
        updatedAt: new Date().toISOString()
      });
      this.setupState = normalized;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('master-framework.setup-state', JSON.stringify(normalized));
      }
      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        try {
          const fs = require('node:fs');
          const path = require('node:path');
          const stateDir = path.resolve(process.cwd(), 'server', 'runtime');
          fs.mkdirSync(stateDir, { recursive: true });
          fs.writeFileSync(path.join(stateDir, 'setup-state.json'), JSON.stringify(normalized, null, 2));
        } catch (error) {
          // best effort filesystem persistence; runtime state remains available in memory.
        }
      }
      return this.setupState;
    },

    updateSetupProgress(progress = {}) {
      const state = this.loadSetupState();
      const next = {
        ...state,
        ...progress,
        updatedAt: new Date().toISOString()
      };
      return this.saveSetupState(next);
    },

    markFrameworkInitialized(metadata = {}) {
      const state = this.loadSetupState();
      state.frameworkState = {
        ...this.getDefaultSetupState().frameworkState,
        ...state.frameworkState,
        initialized: true,
        initializedAt: new Date().toISOString(),
        status: 'READY',
        message: metadata.message || 'Framework initialized.'
      };
      if (metadata.currentStep) {
        state.currentStep = metadata.currentStep;
      }
      return this.saveSetupState(state);
    },

    updateServerState(serverState = {}) {
      const state = this.loadSetupState();
      state.serverState = normalizeSectionState(serverState, this.getDefaultSetupState().serverState);
      if (Object.keys(serverState || {}).length > 0) {
        state.serverState.configured = true;
      }
      if (serverState && Object.prototype.hasOwnProperty.call(serverState, 'configured')) {
        state.serverState.configured = !!serverState.configured;
      }
      return this.saveSetupState(state);
    },

    updateDatabaseState(databaseState = {}) {
      const state = this.loadSetupState();
      state.databaseState = normalizeSectionState(databaseState, this.getDefaultSetupState().databaseState);
      if (Object.keys(databaseState || {}).length > 0) {
        state.databaseState.configured = true;
      }
      if (databaseState && Object.prototype.hasOwnProperty.call(databaseState, 'configured')) {
        state.databaseState.configured = !!databaseState.configured;
      }
      return this.saveSetupState(state);
    },

    updateBootstrapState(bootstrapState = {}) {
      const state = this.loadSetupState();
      state.bootstrapState = normalizeSectionState(bootstrapState, this.getDefaultSetupState().bootstrapState);
      if (Object.keys(bootstrapState || {}).length > 0) {
        state.bootstrapState.configured = true;
      }
      if (bootstrapState && Object.prototype.hasOwnProperty.call(bootstrapState, 'enabled')) {
        state.bootstrapState.enabled = !!bootstrapState.enabled;
      }
      return this.saveSetupState(state);
    },

    ensureDeveloperBootstrap(metadata = {}) {
      const bootstrapState = this.getBootstrapState();
      const runtimeBootstrap = (typeof globalThis !== 'undefined' && globalThis.ConfigManager && typeof globalThis.ConfigManager.get === 'function')
        ? (globalThis.ConfigManager.get('bootstrap', {}) || {})
        : {};
      const username = normalizeString(
        metadata.username || bootstrapState.username || runtimeBootstrap.developerUsername || 'Developer',
        'Developer'
      );
      const displayId = normalizeString(
        metadata.displayId || bootstrapState.displayId || runtimeBootstrap.developerDisplayId || 'USR-000001',
        'USR-000001'
      );
      const role = normalizeString(
        metadata.role || bootstrapState.role || runtimeBootstrap.role || 'developer',
        'developer'
      );

      if (bootstrapState.enabled === false || runtimeBootstrap.enabled === false) {
        return {
          ok: true,
          code: 'BOOTSTRAP_DISABLED',
          created: false,
          message: 'Developer bootstrap is disabled.',
          state: {
            configured: true,
            enabled: false,
            username,
            displayId,
            role,
            status: 'DISABLED',
            message: 'Developer bootstrap is disabled.'
          }
        };
      }

      if (typeof globalThis !== 'undefined' && globalThis.ConfigManager && typeof globalThis.ConfigManager.set === 'function') {
        globalThis.ConfigManager.set('bootstrap', {
          ...runtimeBootstrap,
          enabled: true,
          developerUsername: username,
          developerDisplayId: displayId,
          role,
          passwordRequired: runtimeBootstrap.passwordRequired !== false,
          passwordSource: runtimeBootstrap.passwordSource || 'local-offline',
          hasDeveloperAccount: true
        });
      }

      const userModule = (typeof globalThis !== 'undefined' && globalThis.UserModule)
        || (typeof window !== 'undefined' && window.UserModule)
        || null;

      if (!userModule || typeof userModule.bootstrapDeveloperUser !== 'function') {
        return {
          ok: true,
          code: 'BOOTSTRAP_SKIPPED',
          created: false,
          message: 'Developer bootstrap is not available in this runtime.',
          state: {
            configured: true,
            enabled: true,
            username,
            displayId,
            role,
            status: 'READY',
            message: 'Developer bootstrap is not available in this runtime.'
          }
        };
      }

      const result = userModule.bootstrapDeveloperUser();
      const nextState = {
        configured: true,
        enabled: true,
        username,
        displayId,
        role,
        status: result && result.ok === false ? 'ERROR' : 'READY',
        message: result && result.message ? result.message : (result && result.created ? 'Developer bootstrap created.' : 'Developer bootstrap ready.')
      };

      if (result && result.ok === false) {
        return {
          ...result,
          created: false,
          state: nextState
        };
      }

      return {
        ok: true,
        code: result && result.code ? result.code : 'DEVELOPER_BOOTSTRAP_READY',
        created: !!(result && result.created),
        data: result && result.data ? result.data : null,
        message: nextState.message,
        state: nextState
      };
    },

    activateInstallation(metadata = {}) {
      const state = this.loadSetupState();
      const currentStatus = this.getInstallationStatus(state);

      if (currentStatus !== 'READY') {
        return {
          ok: false,
          code: 'SETUP_NOT_READY',
          status: currentStatus,
          message: 'Installation cannot be activated before server, database and framework are ready.'
        };
      }

      const bootstrapOutcome = this.ensureDeveloperBootstrap({
        username: state.bootstrapState && state.bootstrapState.username,
        displayId: state.bootstrapState && state.bootstrapState.displayId,
        role: state.bootstrapState && state.bootstrapState.role
      });

      const nextState = {
        ...state,
        status: 'ACTIVE',
        installation: {
          ...state.installation,
          active: true,
          installedAt: state.installation.installedAt || new Date().toISOString(),
          activatedAt: new Date().toISOString(),
          state: 'ACTIVE'
        },
        bootstrapState: {
          ...state.bootstrapState,
          ...((bootstrapOutcome && bootstrapOutcome.state) || {}),
          configured: true,
          enabled: bootstrapOutcome && bootstrapOutcome.state && Object.prototype.hasOwnProperty.call(bootstrapOutcome.state, 'enabled')
            ? !!bootstrapOutcome.state.enabled
            : (state.bootstrapState && state.bootstrapState.enabled !== false),
          username: (bootstrapOutcome && bootstrapOutcome.state && bootstrapOutcome.state.username) || (state.bootstrapState && state.bootstrapState.username) || 'Developer',
          displayId: (bootstrapOutcome && bootstrapOutcome.state && bootstrapOutcome.state.displayId) || (state.bootstrapState && state.bootstrapState.displayId) || 'USR-000001',
          role: (bootstrapOutcome && bootstrapOutcome.state && bootstrapOutcome.state.role) || (state.bootstrapState && state.bootstrapState.role) || 'developer'
        },
        currentStep: metadata.currentStep || 'runtime',
        updatedAt: new Date().toISOString()
      };

      if (metadata.message) {
        nextState.installation.message = metadata.message;
      }

      if (bootstrapOutcome && bootstrapOutcome.ok === false) {
        nextState.status = 'ERROR';
        nextState.installation.state = 'ERROR';
        nextState.installation.message = bootstrapOutcome.message || 'Developer bootstrap failed.';
        nextState.bootstrapState.status = 'ERROR';
        nextState.bootstrapState.message = bootstrapOutcome.message || 'Developer bootstrap failed.';
      }

      return this.saveSetupState(nextState);
    },

    getReleaseDefaults() {
      return {
        version: this.version,
        environment: (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) ? process.env.NODE_ENV : 'development',
        status: 'not_ready',
        maintenanceMode: false,
        maintenanceReason: '',
        checkedAt: new Date().toISOString(),
        checks: {
          database: { ok: false, status: 'not_configured', message: 'Database is not configured.' },
          server: { ok: false, status: 'not_configured', message: 'Server status is not configured.' },
          framework: { ok: false, status: 'not_configured', message: 'Framework runtime is not initialized.' },
          security: { ok: true, status: 'ready', message: 'Security baseline is active.' }
        }
      };
    },

    getReleaseState() {
      if (typeof require === 'function') {
        try {
          const releaseService = require('../server/services/release-service');
          if (releaseService && typeof releaseService.getReleaseStatus === 'function') {
            return releaseService.getReleaseStatus();
          }
        } catch (error) {
          return this.getReleaseDefaults();
        }
      }
      return this.getReleaseDefaults();
    },

    setMaintenanceMode(enabled = false, reason = '') {
      if (typeof require === 'function') {
        try {
          const releaseService = require('../server/services/release-service');
          if (releaseService && typeof releaseService.setMaintenanceMode === 'function') {
            return releaseService.setMaintenanceMode(enabled, reason);
          }
        } catch (error) {
          return { ok: false, status: 'error' };
        }
      }
      return { ok: false, status: 'error' };
    },

    getDefaultAdminState() {
      const now = new Date().toISOString();
      return {
        devices: [],
        licenses: [],
        providers: [],
        backups: [],
        activeProviderId: null,
        activeBackupId: null,
        updates: {
          currentVersion: this.version,
          availableVersion: null,
          status: 'NOT_CONFIGURED',
          lastCheckedAt: null,
          source: 'local',
          message: 'Update source not configured.'
        },
        marketplace: {
          catalog: [],
          lastRefreshedAt: null,
          source: 'local'
        },
        createdAt: now,
        updatedAt: now
      };
    },

    readPersistedAdminState() {
      const candidates = [];

      if (typeof localStorage !== 'undefined') {
        try {
          const raw = localStorage.getItem(ADMIN_STATE_STORAGE_KEY);
          if (raw) {
            candidates.push(JSON.parse(raw));
          }
        } catch (error) {
          // Ignore malformed admin state in browser storage.
        }
      }

      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        try {
          const fs = require('node:fs');
          const path = require('node:path');
          const stateFile = path.resolve(process.cwd(), 'server', 'runtime', ADMIN_STATE_FILE_NAME);
          if (fs.existsSync(stateFile)) {
            const raw = fs.readFileSync(stateFile, 'utf8');
            if (raw && raw.trim()) {
              candidates.push(JSON.parse(raw));
            }
          }
        } catch (error) {
          // Ignore malformed admin state on disk.
        }
      }

      for (const candidate of candidates) {
        if (isPlainObject(candidate)) {
          return candidate;
        }
      }

      return null;
    },

    loadAdminState() {
      const baseState = this.getDefaultAdminState();
      const persisted = this.readPersistedAdminState();
      const source = persisted && isPlainObject(persisted)
        ? persisted
        : (this.adminState && isPlainObject(this.adminState) ? this.adminState : null);

      if (!source) {
        this.adminState = { ...baseState };
        return this.adminState;
      }

      const state = {
        ...baseState,
        ...source,
        devices: Array.isArray(source.devices) ? source.devices.map((device) => this.normalizeDevice(device)).filter(Boolean) : [],
        licenses: Array.isArray(source.licenses) ? source.licenses.map((license) => this.normalizeLicense(license)).filter(Boolean) : [],
        providers: Array.isArray(source.providers)
          ? source.providers.map((provider) => this.normalizeProvider(provider)).filter(Boolean)
          : [],
        backups: Array.isArray(source.backups)
          ? source.backups.map((backup) => this.normalizeBackupEntry(backup)).filter(Boolean)
          : [],
        activeProviderId: normalizeString(source.activeProviderId || '', ''),
        activeBackupId: normalizeString(source.activeBackupId || '', ''),
        updates: this.normalizeUpdateState(source.updates || baseState.updates),
        marketplace: {
          ...baseState.marketplace,
          ...(source.marketplace || {}),
          catalog: Array.isArray(source.marketplace && source.marketplace.catalog)
            ? source.marketplace.catalog.map((entry) => this.normalizeMarketplaceEntry(entry)).filter(Boolean)
            : []
        }
      };

      this.adminState = state;
      return state;
    },

    saveAdminState(nextState = null) {
      const state = isPlainObject(nextState) ? nextState : this.loadAdminState();
      const normalized = {
        ...this.getDefaultAdminState(),
        ...state,
        devices: Array.isArray(state.devices) ? state.devices.map((device) => this.normalizeDevice(device)).filter(Boolean) : [],
        licenses: Array.isArray(state.licenses) ? state.licenses.map((license) => this.normalizeLicense(license)).filter(Boolean) : [],
        providers: Array.isArray(state.providers)
          ? state.providers.map((provider) => this.normalizeProvider(provider)).filter(Boolean)
          : [],
        backups: Array.isArray(state.backups)
          ? state.backups.map((backup) => this.normalizeBackupEntry(backup)).filter(Boolean)
          : [],
        activeProviderId: normalizeString(state.activeProviderId || '', ''),
        activeBackupId: normalizeString(state.activeBackupId || '', ''),
        updates: this.normalizeUpdateState(state.updates || {}),
        marketplace: {
          ...this.getDefaultAdminState().marketplace,
          ...(state.marketplace || {}),
          catalog: Array.isArray(state.marketplace && state.marketplace.catalog)
            ? state.marketplace.catalog.map((entry) => this.normalizeMarketplaceEntry(entry)).filter(Boolean)
            : []
        },
        updatedAt: new Date().toISOString()
      };

      this.adminState = normalized;

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(ADMIN_STATE_STORAGE_KEY, JSON.stringify(normalized));
      }

      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        try {
          const fs = require('node:fs');
          const path = require('node:path');
          const stateDir = path.resolve(process.cwd(), 'server', 'runtime');
          fs.mkdirSync(stateDir, { recursive: true });
          fs.writeFileSync(path.join(stateDir, ADMIN_STATE_FILE_NAME), JSON.stringify(normalized, null, 2));
        } catch (error) {
          // best effort filesystem persistence; runtime state remains available in memory.
        }
      }

      return this.adminState;
    },

    normalizeDevice(device = {}) {
      if (!isPlainObject(device)) {
        return null;
      }

      const now = new Date().toISOString();
      const id = normalizeString(device.id || device.deviceId || device.identifier, '');
      const deviceId = id || `device-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      return {
        id: deviceId,
        deviceId,
        name: normalizeString(device.name || device.label || device.deviceName, deviceId),
        type: normalizeString(device.type || device.category, 'generic'),
        status: normalizeString(device.status, 'inactive'),
        userId: normalizeString(device.userId || device.assignedUserId, ''),
        userDisplayId: normalizeString(device.userDisplayId || device.assignedDisplayId, ''),
        appId: normalizeString(device.appId || '', ''),
        moduleId: normalizeString(device.moduleId || '', ''),
        lastContactAt: normalizeString(device.lastContactAt || device.lastSeenAt, ''),
        registeredAt: normalizeString(device.registeredAt, now),
        updatedAt: now,
        metadata: isPlainObject(device.metadata) ? { ...device.metadata } : {}
      };
    },

    normalizeLicense(license = {}) {
      if (!isPlainObject(license)) {
        return null;
      }

      const now = new Date().toISOString();
      const licenseId = normalizeString(license.licenseId || license.id, '');
      const normalizedId = licenseId || `license-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      return {
        id: normalizedId,
        licenseId: normalizedId,
        type: normalizeString(license.type || license.kind, 'standard'),
        status: normalizeString(license.status, 'inactive'),
        validFrom: normalizeString(license.validFrom || license.issuedAt, ''),
        validUntil: normalizeString(license.validUntil || license.expiresAt, ''),
        userId: normalizeString(license.userId || license.assignedUserId, ''),
        deviceId: normalizeString(license.deviceId || license.assignedDeviceId, ''),
        appId: normalizeString(license.appId || '', ''),
        moduleId: normalizeString(license.moduleId || '', ''),
        createdAt: normalizeString(license.createdAt, now),
        updatedAt: now,
        metadata: isPlainObject(license.metadata) ? { ...license.metadata } : {}
      };
    },

    normalizeUpdateState(update = {}) {
      if (!isPlainObject(update)) {
        return this.getDefaultAdminState().updates;
      }

      const currentVersion = normalizeString(update.currentVersion, this.version);
      const availableVersion = normalizeString(update.availableVersion, '');
      const status = normalizeString(update.status, availableVersion && availableVersion !== currentVersion ? 'AVAILABLE' : 'NOT_CONFIGURED').toUpperCase();
      const allowedStatuses = ['NOT_CONFIGURED', 'CHECKING', 'AVAILABLE', 'UP_TO_DATE', 'ERROR', 'UNKNOWN'];

      return {
        currentVersion,
        availableVersion: availableVersion || null,
        status: allowedStatuses.includes(status) ? status : 'UNKNOWN',
        lastCheckedAt: normalizeString(update.lastCheckedAt, null),
        source: normalizeString(update.source, 'local'),
        message: normalizeString(update.message, availableVersion && availableVersion !== currentVersion ? `Update ${availableVersion} available.` : 'Update source not configured.')
      };
    },

    normalizeMarketplaceEntry(entry = {}) {
      if (!isPlainObject(entry)) {
        return null;
      }

      const now = new Date().toISOString();
      const id = normalizeString(entry.id || entry.moduleId || entry.name, '');
      const normalizedId = id || `catalog-${Math.random().toString(16).slice(2, 10)}`;
      return {
        id: normalizedId,
        name: normalizeString(entry.name, normalizedId),
        type: normalizeString(entry.type || (entry.capabilities && entry.capabilities.includes('gps') ? 'module' : ''), 'module'),
        version: normalizeString(entry.version, '1.0.0'),
        status: normalizeString(entry.status, 'available'),
        description: normalizeString(entry.description, ''),
        source: normalizeString(entry.source || entry.modulePath, 'local'),
        appId: normalizeString(entry.appId || '', ''),
        moduleId: normalizeString(entry.moduleId || entry.id || '', ''),
        capabilities: Array.isArray(entry.capabilities) ? [...entry.capabilities] : [],
        permissions: Array.isArray(entry.permissions) ? [...entry.permissions] : [],
        installed: !!entry.installed,
        active: !!entry.active,
        lastSeenAt: normalizeString(entry.lastSeenAt, now),
        actions: Array.isArray(entry.actions) ? [...entry.actions] : ['view'],
        metadata: isPlainObject(entry.metadata) ? { ...entry.metadata } : {}
      };
    },

    listDevices() {
      return Array.from(this.loadAdminState().devices || []).map((device) => ({ ...device, metadata: { ...(device.metadata || {}) } }));
    },

    getDevice(deviceId) {
      const normalized = normalizeString(deviceId, '');
      if (!normalized) {
        return null;
      }

      return this.listDevices().find((device) => device.deviceId === normalized || device.id === normalized) || null;
    },

    upsertDevice(device = {}) {
      const state = this.loadAdminState();
      const normalized = this.normalizeDevice(device);
      if (!normalized) {
        throw new TypeError('Device definition must be an object.');
      }

      const index = state.devices.findIndex((entry) => entry.deviceId === normalized.deviceId);
      if (index >= 0) {
        state.devices[index] = { ...state.devices[index], ...normalized, updatedAt: new Date().toISOString() };
      } else {
        state.devices.push(normalized);
      }

      return this.saveAdminState(state).devices.find((entry) => entry.deviceId === normalized.deviceId);
    },

    removeDevice(deviceId) {
      const state = this.loadAdminState();
      const normalized = normalizeString(deviceId, '');
      const nextDevices = state.devices.filter((entry) => entry.deviceId !== normalized && entry.id !== normalized);
      state.devices = nextDevices;
      this.saveAdminState(state);
      return true;
    },

    listLicenses() {
      return Array.from(this.loadAdminState().licenses || []).map((license) => ({ ...license, metadata: { ...(license.metadata || {}) } }));
    },

    getLicense(licenseId) {
      const normalized = normalizeString(licenseId, '');
      if (!normalized) {
        return null;
      }

      return this.listLicenses().find((license) => license.licenseId === normalized || license.id === normalized) || null;
    },

    upsertLicense(license = {}) {
      const state = this.loadAdminState();
      const normalized = this.normalizeLicense(license);
      if (!normalized) {
        throw new TypeError('License definition must be an object.');
      }

      const index = state.licenses.findIndex((entry) => entry.licenseId === normalized.licenseId);
      if (index >= 0) {
        state.licenses[index] = { ...state.licenses[index], ...normalized, updatedAt: new Date().toISOString() };
      } else {
        state.licenses.push(normalized);
      }

      return this.saveAdminState(state).licenses.find((entry) => entry.licenseId === normalized.licenseId);
    },

    removeLicense(licenseId) {
      const state = this.loadAdminState();
      const normalized = normalizeString(licenseId, '');
      state.licenses = state.licenses.filter((entry) => entry.licenseId !== normalized && entry.id !== normalized);
      this.saveAdminState(state);
      return true;
    },

    getUpdateState() {
      return { ...this.loadAdminState().updates };
    },

    setUpdateState(updateState = {}) {
      const state = this.loadAdminState();
      state.updates = this.normalizeUpdateState({ ...state.updates, ...updateState });
      return this.saveAdminState(state).updates;
    },

    checkForUpdates(payload = {}) {
      const state = this.loadAdminState();
      const currentVersion = normalizeString(payload.currentVersion, state.updates.currentVersion || this.version);
      const availableVersion = normalizeString(
        payload.availableVersion || (typeof process !== 'undefined' && process.env ? process.env.UPDATE_AVAILABLE_VERSION : '') || state.updates.availableVersion || '',
        ''
      );
      const source = normalizeString(payload.source || state.updates.source, 'local');
      const hasUpdate = !!availableVersion && availableVersion !== currentVersion;
      const next = this.normalizeUpdateState({
        ...state.updates,
        currentVersion,
        availableVersion: availableVersion || null,
        status: hasUpdate ? 'AVAILABLE' : 'UP_TO_DATE',
        lastCheckedAt: new Date().toISOString(),
        source,
        message: hasUpdate ? `Update ${availableVersion} available.` : 'No updates available.'
      });
      state.updates = next;
      this.saveAdminState(state);
      return next;
    },

    getMarketplaceState() {
      const state = this.loadAdminState();
      return {
        ...state.marketplace,
        catalog: Array.isArray(state.marketplace.catalog)
          ? state.marketplace.catalog.map((entry) => ({ ...entry, metadata: { ...(entry.metadata || {}) } }))
          : []
      };
    },

    setMarketplaceCatalog(catalog = []) {
      const state = this.loadAdminState();
      state.marketplace = {
        ...state.marketplace,
        catalog: Array.isArray(catalog) ? catalog.map((entry) => this.normalizeMarketplaceEntry(entry)).filter(Boolean) : [],
        lastRefreshedAt: new Date().toISOString(),
        source: 'local'
      };
      return this.saveAdminState(state).marketplace;
    },

    appendMarketplaceEntries(entries = []) {
      const state = this.loadAdminState();
      const current = Array.isArray(state.marketplace.catalog) ? state.marketplace.catalog : [];
      const additional = Array.isArray(entries) ? entries.map((entry) => this.normalizeMarketplaceEntry(entry)).filter(Boolean) : [];
      state.marketplace = {
        ...state.marketplace,
        catalog: [...current, ...additional],
        lastRefreshedAt: new Date().toISOString()
      };
      return this.saveAdminState(state).marketplace;
    },

    getMarketplaceEntries() {
      return this.getMarketplaceState().catalog;
    },

    updateSetupStep(stepName, value) {
      const state = this.loadSetupState();
      const nextState = { ...state, currentStep: stepName, updatedAt: new Date().toISOString() };
      if (Array.isArray(nextState.completedSteps) && !nextState.completedSteps.includes(stepName)) {
        nextState.completedSteps.push(stepName);
      }
      if (value && typeof value === 'object') {
        nextState.configuration = { ...(nextState.configuration || {}), ...value };
      }
      return this.saveSetupState(nextState);
    },

    registerMigration(migration) {
      if (!isPlainObject(migration)) {
        throw new TypeError('Migration must be an object.');
      }
      const entry = {
        id: normalizeString(migration.id, `migration-${this.migrations.length + 1}`),
        version: normalizeString(migration.version, '1.0.0'),
        from: normalizeString(migration.from, '0.0.0'),
        to: normalizeString(migration.to, migration.version || '1.0.0'),
        description: normalizeString(migration.description, ''),
        run: typeof migration.run === 'function' ? migration.run : async () => ({ ok: true })
      };
      this.migrations.push(entry);
      return entry;
    },

    async applyMigrations(currentVersion, steps = []) {
      const version = normalizeString(currentVersion, '0.0.0');
      const pending = Array.isArray(steps) && steps.length > 0 ? steps : this.migrations;

      const results = [];
      for (const entry of pending) {
        const from = normalizeString(entry.from, '0.0.0');
        const target = normalizeString(entry.to, entry.version || from);
        if (from === version || version === '0.0.0' || (version < from && entry.version)) {
          const result = await entry.run({ from, to: target, currentVersion: version });
          results.push({ ...result, id: entry.id, from, to: target });
        }
      }
      return { ok: true, applied: results.length, results };
    },

    getDiagnostics() {
      const connectionStates = Array.from(this.connections.values()).map((connection) => ({
        id: connection.connectionId,
        appId: connection.appId,
        status: connection.status,
        health: connection.health,
        active: !!connection.active
      }));
      const adminState = this.loadAdminState();

      return {
        framework: {
          name: 'neutral-master-framework',
          version: this.version,
          apiVersion: 'v1',
          apps: this.apps.size,
          connections: this.connections.size,
          featureFlags: this.featureFlags.size,
          migrations: this.migrations.length,
          devices: Array.isArray(adminState.devices) ? adminState.devices.length : 0,
          licenses: Array.isArray(adminState.licenses) ? adminState.licenses.length : 0,
          updateStatus: adminState.updates ? adminState.updates.status : 'NOT_CONFIGURED'
        },
        applications: this.listApps().map((app) => ({
          id: app.appId,
          name: app.name,
          version: app.version,
          status: app.status,
          active: app.active
        })),
        connections: connectionStates,
        featureFlags: this.listFeatureFlags(),
        permissions: Array.from(this.permissions.entries()).map(([permission, description]) => ({ permission, description })),
        admin: {
          devices: this.listDevices(),
          licenses: this.listLicenses(),
          updates: this.getUpdateState(),
          marketplace: this.getMarketplaceState()
        },
        setup: this.getSetupSnapshot(),
        timestamp: new Date().toISOString()
      };
    }
  };

  const appRegistry = {
    register: FrameworkRuntime.registerApp.bind(FrameworkRuntime),
    get: FrameworkRuntime.getApp.bind(FrameworkRuntime),
    list: FrameworkRuntime.listApps.bind(FrameworkRuntime),
    activate: FrameworkRuntime.activateApp.bind(FrameworkRuntime),
    deactivate: FrameworkRuntime.deactivateApp.bind(FrameworkRuntime),
    unregister: FrameworkRuntime.unregisterApp.bind(FrameworkRuntime)
  };

  const connectionManager = {
    register: FrameworkRuntime.registerConnection.bind(FrameworkRuntime),
    get: FrameworkRuntime.getConnection.bind(FrameworkRuntime),
    list: FrameworkRuntime.listConnections.bind(FrameworkRuntime),
    update: FrameworkRuntime.updateConnection.bind(FrameworkRuntime),
    setStatus: FrameworkRuntime.setConnectionStatus.bind(FrameworkRuntime),
    test: FrameworkRuntime.testConnection.bind(FrameworkRuntime)
  };

  const featureFlags = {
    set: FrameworkRuntime.setFeatureFlag.bind(FrameworkRuntime),
    get: FrameworkRuntime.getFeatureFlag.bind(FrameworkRuntime),
    list: FrameworkRuntime.listFeatureFlags.bind(FrameworkRuntime)
  };

  FrameworkRuntime.initialize();

  root.MasterFramework = FrameworkRuntime;
  root.AppRegistry = appRegistry;
  root.ConnectionManager = connectionManager;
  root.FeatureFlags = featureFlags;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrameworkRuntime;
  }
})(typeof window !== 'undefined' ? window : globalThis);

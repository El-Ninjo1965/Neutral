/*
 * Generic Admin Module
 * Version: 1.0.0
 *
 * Administrative facade for the generic platform architecture.
 * It orchestrates user, access, audit and module management without creating
 * a second auth or session truth.
 */

(() => {
    'use strict';

    const cloneValue = (value) => {
        if (Array.isArray(value)) {
            return value.map((entry) => cloneValue(entry));
        }

        if (value && typeof value === 'object') {
            return Object.keys(value).reduce((result, key) => {
                result[key] = cloneValue(value[key]);
                return result;
            }, {});
        }

        return value;
    };

    const frameworkSettingsSchema = Object.freeze([
        {
            id: 'app',
            title: 'Application',
            description: 'General application identity and debug settings.',
            settings: [
                { key: 'name', path: 'app.name', label: 'Application name', type: 'text', defaultValue: 'Neutral Platform' },
                { key: 'version', path: 'app.version', label: 'Application version', type: 'text', defaultValue: '1.0.0' },
                { key: 'debug', path: 'app.debug', label: 'Debug mode', type: 'boolean', defaultValue: true },
                { key: 'logging.level', path: 'app.logging.level', label: 'Log level', type: 'select', defaultValue: 'debug', options: ['debug', 'info', 'warn', 'error'] },
                { key: 'logging.maxLogs', path: 'app.logging.maxLogs', label: 'Max log entries', type: 'number', defaultValue: 1000, min: 10, step: 10 }
            ]
        },
        {
            id: 'api',
            title: 'API',
            description: 'Connectivity behaviour for online services.',
            settings: [
                { key: 'baseUrl', path: 'api.baseUrl', label: 'Base URL', type: 'text', defaultValue: 'http://localhost:3000/api' },
                { key: 'timeout', path: 'api.timeout', label: 'Request timeout (ms)', type: 'number', defaultValue: 30000, min: 1000, step: 500 },
                { key: 'retries', path: 'api.retries', label: 'Retry count', type: 'number', defaultValue: 3, min: 0, step: 1 },
                { key: 'retryDelay', path: 'api.retryDelay', label: 'Retry delay (ms)', type: 'number', defaultValue: 1000, min: 0, step: 100 }
            ]
        },
        {
            id: 'modules',
            title: 'Module runtime',
            description: 'Default behaviour for module discovery and activation.',
            settings: [
                { key: 'autoLoad', path: 'modules.autoLoad', label: 'Auto-load modules', type: 'boolean', defaultValue: true },
                { key: 'autoActivate', path: 'modules.autoActivate', label: 'Auto-activate modules', type: 'boolean', defaultValue: true },
                { key: 'moduleTimeout', path: 'modules.moduleTimeout', label: 'Module timeout (ms)', type: 'number', defaultValue: 5000, min: 1000, step: 500 }
            ]
        },
        {
            id: 'security',
            title: 'Security',
            description: 'Framework-wide session and request safety defaults.',
            settings: [
                { key: 'sessionTimeout', path: 'security.sessionTimeout', label: 'Session timeout (ms)', type: 'number', defaultValue: 3600000, min: 60000, step: 60000 },
                { key: 'csrfProtection', path: 'security.csrfProtection', label: 'CSRF protection', type: 'boolean', defaultValue: true },
                { key: 'allowCors', path: 'security.allowCors', label: 'Allow CORS', type: 'boolean', defaultValue: false }
            ]
        },
        {
            id: 'ui',
            title: 'User interface',
            description: 'Shared UI behaviour for the application and admin workspace.',
            settings: [
                { key: 'theme', path: 'ui.theme', label: 'Theme', type: 'text', defaultValue: 'neutral' },
                { key: 'language', path: 'ui.language', label: 'Language', type: 'text', defaultValue: 'en' },
                { key: 'animationsEnabled', path: 'ui.animationsEnabled', label: 'Animations enabled', type: 'boolean', defaultValue: true },
                { key: 'updateInterval', path: 'ui.updateInterval', label: 'Refresh interval (ms)', type: 'number', defaultValue: 5000, min: 1000, step: 500 }
            ]
        },
        {
            id: 'features',
            title: 'Feature flags',
            description: 'Globally enabled framework areas.',
            settings: [
                { key: 'userModule', path: 'features.userModule', label: 'User module', type: 'boolean', defaultValue: true },
                { key: 'adminModule', path: 'features.adminModule', label: 'Admin module', type: 'boolean', defaultValue: true },
                { key: 'advancedLogging', path: 'features.advancedLogging', label: 'Advanced logging', type: 'boolean', defaultValue: false },
                { key: 'betaFeatures', path: 'features.betaFeatures', label: 'Beta features', type: 'boolean', defaultValue: false },
                { key: 'maintenanceMode', path: 'features.maintenanceMode', label: 'Maintenance mode', type: 'boolean', defaultValue: false }
            ]
        }
    ]);

    const normalizeSettingField = (field, moduleId = null, index = 0) => {
        if (!field || typeof field !== 'object') {
            return null;
        }

        const key = typeof field.key === 'string' && field.key.trim()
            ? field.key.trim()
            : typeof field.path === 'string' && field.path.trim()
                ? field.path.trim().split('.').pop()
                : `setting-${index + 1}`;
        const path = typeof field.path === 'string' && field.path.trim()
            ? field.path.trim()
            : moduleId
                ? `moduleSettings.${moduleId}.${key}`
                : key;

        return {
            key,
            path,
            label: typeof field.label === 'string' && field.label.trim() ? field.label.trim() : key,
            type: typeof field.type === 'string' && field.type.trim() ? field.type.trim() : 'text',
            description: typeof field.description === 'string' ? field.description : '',
            options: Array.isArray(field.options) ? [...field.options] : [],
            min: typeof field.min === 'number' ? field.min : null,
            max: typeof field.max === 'number' ? field.max : null,
            step: typeof field.step === 'number' ? field.step : null,
            defaultValue: Object.prototype.hasOwnProperty.call(field, 'defaultValue')
                ? cloneValue(field.defaultValue)
                : ''
        };
    };

    const normalizeSection = (section, moduleId = null) => {
        if (!section || typeof section !== 'object') {
            return null;
        }

        const id = typeof section.id === 'string' && section.id.trim()
            ? section.id.trim()
            : moduleId
                ? `module-${moduleId}`
                : 'section';
        const settings = Array.isArray(section.settings)
            ? section.settings.map((field, index) => normalizeSettingField(field, moduleId, index)).filter(Boolean)
            : [];

        return {
            id,
            title: typeof section.title === 'string' && section.title.trim() ? section.title.trim() : id,
            description: typeof section.description === 'string' ? section.description : '',
            moduleId,
            settings
        };
    };

    const createModuleSettingsSection = (module) => {
        if (!module || !module.id) {
            return null;
        }

        const adminDefinition = module.admin && typeof module.admin === 'object'
            ? module.admin
            : module.manifest && module.manifest.admin && typeof module.manifest.admin === 'object'
                ? module.manifest.admin
                : null;

        if (!adminDefinition || !Array.isArray(adminDefinition.settings) || adminDefinition.settings.length === 0) {
            return null;
        }

        return normalizeSection({
            id: `module-${module.id}`,
            title: adminDefinition.title || module.displayName || module.name || module.id,
            description: adminDefinition.description || module.description || '',
            settings: adminDefinition.settings
        }, module.id);
    };

    const AdminModule = {
        name: 'admin-module',
        version: '1.0.0',
        initialized: false,
        startedAt: new Date().toISOString(),

        init() {
            if (this.initialized) {
                return this;
            }

            this.initialized = true;

            if (window.Core) {
                window.Core.on('error:handled', (data) => {
                    if (window.CoreAudit && typeof window.CoreAudit.record === 'function') {
                        window.CoreAudit.record('system', 'admin:error', data && data.context ? data.context.type || 'error' : 'error', 'handled', data || {});
                    }
                });

                window.Core.on('module:registered', () => {
                    this.seedModuleSettings();
                });

                window.Core.on('module:activated', () => {
                    this.seedModuleSettings();
                });

                window.Core.emit('admin:initialized', {
                    timestamp: new Date().toISOString(),
                    startedAt: this.startedAt
                });
            }

            this.seedFrameworkSettings();
            this.seedModuleSettings();

            return this;
        },

        getConfigManager() {
            return window.ConfigManager && typeof window.ConfigManager.getPath === 'function' && typeof window.ConfigManager.setPath === 'function'
                ? window.ConfigManager
                : null;
        },

        ensureSettingDefault(path, defaultValue) {
            const manager = this.getConfigManager();
            if (!manager || typeof path !== 'string' || !path.trim()) {
                return false;
            }

            if (manager.getPath(path) !== undefined) {
                return false;
            }

            manager.setPath(path, cloneValue(defaultValue));
            return true;
        },

        hydrateSettingsSection(section) {
            const manager = this.getConfigManager();
            const normalized = normalizeSection(section, section && section.moduleId ? section.moduleId : null);
            if (!normalized) {
                return null;
            }

            return {
                ...normalized,
                settings: normalized.settings.map((setting) => {
                    this.ensureSettingDefault(setting.path, setting.defaultValue);
                    return {
                        ...setting,
                        value: manager ? cloneValue(manager.getPath(setting.path, setting.defaultValue)) : cloneValue(setting.defaultValue)
                    };
                })
            };
        },

        seedFrameworkSettings() {
            frameworkSettingsSchema.forEach((section) => {
                section.settings.forEach((setting) => {
                    this.ensureSettingDefault(setting.path, setting.defaultValue);
                });
            });
        },

        seedModuleSettings() {
            this.getModuleCatalog()
                .map((module) => createModuleSettingsSection(module))
                .filter(Boolean)
                .forEach((section) => {
                    section.settings.forEach((setting) => {
                        this.ensureSettingDefault(setting.path, setting.defaultValue);
                    });
                });
        },

        getFrameworkSettingsSections() {
            return frameworkSettingsSchema
                .map((section) => this.hydrateSettingsSection(section))
                .filter(Boolean);
        },

        getModuleSettingsSections() {
            return this.getModuleCatalog()
                .map((module) => createModuleSettingsSection(module))
                .filter(Boolean)
                .map((section) => this.hydrateSettingsSection(section))
                .filter(Boolean);
        },

        getSettingsCatalog() {
            this.seedFrameworkSettings();
            this.seedModuleSettings();

            return {
                ok: true,
                data: {
                    framework: this.getFrameworkSettingsSections(),
                    modules: this.getModuleSettingsSections()
                }
            };
        },

        updateSettings(updates, actor = 'system') {
            if (!Array.isArray(updates) || updates.length === 0) {
                return { ok: false, code: 'INVALID_SETTINGS', message: 'At least one setting update is required.' };
            }

            const manager = this.getConfigManager();
            if (!manager) {
                return { ok: false, code: 'CONFIG_MANAGER_UNAVAILABLE', message: 'Config manager is unavailable.' };
            }

            const persistedRoots = new Set();
            const applied = [];

            updates.forEach((update) => {
                if (!update || typeof update.path !== 'string' || !update.path.trim()) {
                    throw new Error('Each setting update requires a valid path.');
                }

                manager.setPath(update.path.trim(), cloneValue(update.value));
                persistedRoots.add(update.path.trim().split('.')[0]);
                applied.push({
                    path: update.path.trim(),
                    value: cloneValue(update.value)
                });
            });

            persistedRoots.forEach((rootKey) => {
                if (typeof manager.persist === 'function') {
                    manager.persist(rootKey);
                }
            });

            if (window.CoreAudit && typeof window.CoreAudit.record === 'function') {
                window.CoreAudit.record(actor, 'admin:settings:update', 'config', 'ok', {
                    updated: applied.map((entry) => entry.path)
                });
            }

            if (window.Core) {
                window.Core.emit('admin:settings:updated', {
                    updated: applied
                });
            }

            return {
                ok: true,
                data: {
                    updated: applied,
                    persistedRoots: Array.from(persistedRoots)
                }
            };
        },

        getUptime() {
            const start = new Date(this.startedAt);
            return Date.now() - start.getTime();
        },

        async listUsers() {
            if (!window.UserModule || typeof window.UserModule.listUsers !== 'function') {
                return { ok: false, code: 'USER_MODULE_UNAVAILABLE', message: 'User module is not available.' };
            }

            return await window.UserModule.listUsers();
        },

        async getUserById(userId) {
            if (!window.UserModule || typeof window.UserModule.getUserById !== 'function') {
                return { ok: false, code: 'USER_MODULE_UNAVAILABLE', message: 'User module is not available.' };
            }

            return await window.UserModule.getUserById(userId);
        },

        async createUser(userData, actor = 'system') {
            if (!window.UserModule || typeof window.UserModule.createUser !== 'function') {
                return { ok: false, code: 'USER_MODULE_UNAVAILABLE', message: 'User module is not available.' };
            }

            return await window.UserModule.createUser(userData, actor);
        },

        async updateUser(userId, updates, actor = 'system') {
            if (!window.UserModule || typeof window.UserModule.updateUser !== 'function') {
                return { ok: false, code: 'USER_MODULE_UNAVAILABLE', message: 'User module is not available.' };
            }

            return await window.UserModule.updateUser(userId, updates, actor);
        },

        async deleteUser(userId, actor = 'system') {
            if (!window.UserModule || typeof window.UserModule.deleteUser !== 'function') {
                return { ok: false, code: 'USER_MODULE_UNAVAILABLE', message: 'User module is not available.' };
            }

            return await window.UserModule.deleteUser(userId, actor);
        },

        getCurrentUser() {
            if (!window.UserModule || typeof window.UserModule.getCurrentUser !== 'function') {
                return null;
            }

            return window.UserModule.getCurrentUser();
        },

        getRoleCatalog() {
            if (window.CoreAccess && typeof window.CoreAccess.getRoleCatalog === 'function') {
                return window.CoreAccess.getRoleCatalog();
            }

            return [
                { role: 'user', name: 'User', description: 'Standard end user.', permissions: ['user:read'], isSystem: true },
                { role: 'member', name: 'Member', description: 'Member with basic collaboration access.', permissions: ['user:read'], isSystem: true },
                { role: 'manager', name: 'Manager', description: 'Manager with limited write access.', permissions: ['user:read', 'user:write'], isSystem: true },
                { role: 'admin', name: 'Admin', description: 'Administrator with system access.', permissions: ['user:read', 'user:write', 'system:view'], isSystem: true },
                { role: 'developer', name: 'Developer', description: 'Developer role with module and framework access.', permissions: ['user:read', 'user:write', 'system:view', 'module:read', 'module:update'], isSystem: true }
            ];
        },

        getPermissionCatalog() {
            if (window.CoreAccess && typeof window.CoreAccess.getPermissionCatalog === 'function') {
                return window.CoreAccess.getPermissionCatalog();
            }

            const permissions = new Map();
            this.getRoleCatalog().forEach((role) => {
                (Array.isArray(role.permissions) ? role.permissions : []).forEach((permission) => {
                    permissions.set(String(permission).trim(), permission);
                });
            });

            return Array.from(permissions.values()).map((permission) => ({
                permission,
                description: 'Permission resolved from the framework role catalog.'
            }));
        },

        getEntitySchemas(appId = null) {
            if (!window.MasterFramework || typeof window.MasterFramework.listEntitySchemas !== 'function') {
                return [];
            }
            return window.MasterFramework.listEntitySchemas(appId);
        },

        getEntitySchema(appId, entityId) {
            if (!window.MasterFramework || typeof window.MasterFramework.getEntitySchema !== 'function') {
                return null;
            }
            return window.MasterFramework.getEntitySchema(appId, entityId);
        },

        registerEntitySchema(appId, schemaDefinition) {
            const framework = window.MasterFramework;
            if (!framework || typeof framework.registerEntitySchema !== 'function') {
                return { ok: false, code: 'FRAMEWORK_UNAVAILABLE', message: 'Master framework is unavailable.' };
            }
            try {
                const schema = framework.registerEntitySchema(appId, schemaDefinition || {});
                return { ok: true, data: schema, message: `Entity schema registered: ${schema.id}` };
            } catch (error) {
                return { ok: false, code: 'ENTITY_SCHEMA_ERROR', message: error && error.message ? error.message : 'Entity schema registration failed.' };
            }
        },

        updateEntitySchema(appId, entityId, schemaDefinition) {
            const framework = window.MasterFramework;
            if (!framework || typeof framework.updateEntitySchema !== 'function') {
                return { ok: false, code: 'FRAMEWORK_UNAVAILABLE', message: 'Master framework is unavailable.' };
            }
            try {
                const schema = framework.updateEntitySchema(appId, entityId, schemaDefinition || {});
                return { ok: true, data: schema, message: `Entity schema updated: ${schema.id}` };
            } catch (error) {
                return { ok: false, code: 'ENTITY_SCHEMA_ERROR', message: error && error.message ? error.message : 'Entity schema update failed.' };
            }
        },

        deleteEntitySchema(appId, entityId) {
            const framework = window.MasterFramework;
            if (!framework || typeof framework.unregisterEntitySchema !== 'function') {
                return { ok: false, code: 'FRAMEWORK_UNAVAILABLE', message: 'Master framework is unavailable.' };
            }
            try {
                const removed = framework.unregisterEntitySchema(appId, entityId);
                return { ok: true, data: removed, message: `Entity schema removed: ${entityId}` };
            } catch (error) {
                return { ok: false, code: 'ENTITY_SCHEMA_ERROR', message: error && error.message ? error.message : 'Entity schema removal failed.' };
            }
        },

        listEntityRecords(appId, entityId, filters = {}) {
            if (!window.MasterFramework || typeof window.MasterFramework.listEntityRecords !== 'function') {
                return [];
            }
            return window.MasterFramework.listEntityRecords(appId, entityId, filters || {});
        },

        createEntityRecord(appId, entityId, payload = {}) {
            const framework = window.MasterFramework;
            if (!framework || typeof framework.createEntityRecord !== 'function') {
                return { ok: false, code: 'FRAMEWORK_UNAVAILABLE', message: 'Master framework is unavailable.' };
            }
            try {
                const record = framework.createEntityRecord(appId, entityId, payload || {});
                return { ok: true, data: record, message: `Record created for ${entityId}` };
            } catch (error) {
                return { ok: false, code: 'ENTITY_RECORD_ERROR', message: error && error.message ? error.message : 'Record creation failed.' };
            }
        },

        updateEntityRecord(appId, entityId, recordId, updates = {}) {
            const framework = window.MasterFramework;
            if (!framework || typeof framework.updateEntityRecord !== 'function') {
                return { ok: false, code: 'FRAMEWORK_UNAVAILABLE', message: 'Master framework is unavailable.' };
            }
            try {
                const record = framework.updateEntityRecord(appId, entityId, recordId, updates || {});
                return { ok: true, data: record, message: `Record updated for ${entityId}` };
            } catch (error) {
                return { ok: false, code: 'ENTITY_RECORD_ERROR', message: error && error.message ? error.message : 'Record update failed.' };
            }
        },

        deleteEntityRecord(appId, entityId, recordId) {
            const framework = window.MasterFramework;
            if (!framework || typeof framework.deleteEntityRecord !== 'function') {
                return { ok: false, code: 'FRAMEWORK_UNAVAILABLE', message: 'Master framework is unavailable.' };
            }
            try {
                const records = framework.deleteEntityRecord(appId, entityId, recordId);
                return { ok: true, data: records, message: `Record deleted from ${entityId}` };
            } catch (error) {
                return { ok: false, code: 'ENTITY_RECORD_ERROR', message: error && error.message ? error.message : 'Record deletion failed.' };
            }
        },

        getAppTemplateCatalog() {
            if (window.MasterFramework && typeof window.MasterFramework.listAppTemplates === 'function') {
                return window.MasterFramework.listAppTemplates();
            }

            return [];
        },

        createAppFromTemplate(templateId, overrides = {}) {
            if (!window.MasterFramework || typeof window.MasterFramework.createAppFromTemplate !== 'function') {
                return { ok: false, code: 'FRAMEWORK_UNAVAILABLE', message: 'Master framework is unavailable.' };
            }

            try {
                const app = window.MasterFramework.createAppFromTemplate(templateId, overrides || {});
                return { ok: true, data: app, message: `Application created from template: ${templateId}` };
            } catch (error) {
                return { ok: false, code: 'APP_TEMPLATE_ERROR', message: error && error.message ? error.message : 'Application template creation failed.' };
            }
        },

        getModuleCatalog() {
            if (!window.ModuleRegistry || typeof window.ModuleRegistry.getAll !== 'function') {
                return [];
            }

            return window.ModuleRegistry.getAll().map((module) => {
                const section = createModuleSettingsSection(module);
                return {
                    ...module,
                    admin: module.admin || (module.manifest && module.manifest.admin) || null,
                    adminSettingsCount: section ? section.settings.length : 0
                };
            });
        },

        getModuleAccessMatrix(appId = null) {
            const framework = window.MasterFramework || null;
            const roleCatalog = framework && typeof framework.getRoleCatalog === 'function'
                ? framework.getRoleCatalog()
                : this.getRoleCatalog();
            const modules = this.getModuleCatalog();
            const normalizedAppId = typeof appId === 'string' && appId.trim() ? appId.trim() : null;
            const filteredModules = normalizedAppId
                ? modules.filter((module) => (module.appId || module.manifest?.appId || 'neutral-app') === normalizedAppId)
                : modules;

            return roleCatalog.map((role) => ({
                role: role.role || role.name || 'user',
                name: role.name || role.role || 'User',
                modules: filteredModules.map((module) => {
                    const access = framework && typeof framework.getAppModuleAccess === 'function'
                        ? framework.getAppModuleAccess(module.appId || normalizedAppId || module.manifest?.appId || 'neutral-app', module.id)
                        : null;
                    const defaultEnabled = !!(module.active || module.status === 'enabled' || module.status === 'active');
                    const roles = access && access.roles && typeof access.roles === 'object' ? access.roles : {};
                    const enabledByRole = typeof roles[role.role || role.name || 'user'] === 'boolean'
                        ? !!roles[role.role || role.name || 'user']
                        : defaultEnabled;
                    return {
                        id: module.id,
                        name: module.name || module.id,
                        enabled: enabledByRole,
                        permissions: Array.isArray(module.permissions) ? [...module.permissions] : []
                    };
                })
            }));
        },

        getFeatureAccessMatrix(appId = null) {
            const framework = window.MasterFramework || null;
            const roleCatalog = framework && typeof framework.getRoleCatalog === 'function'
                ? framework.getRoleCatalog()
                : this.getRoleCatalog();
            const app = framework && typeof framework.getApp === 'function'
                ? framework.getApp(appId || 'neutral-app')
                : null;
            const templates = app && Array.isArray(app.featureTemplates) && app.featureTemplates.length
                ? app.featureTemplates
                : (framework && typeof framework.listApps === 'function'
                    ? (framework.listApps().find((entry) => entry.appId === (appId || 'neutral-app')) || {}).featureTemplates || []
                    : []);
            const normalizedAppId = typeof appId === 'string' && appId.trim() ? appId.trim() : 'neutral-app';

            return roleCatalog.map((role) => ({
                role: role.role || role.name || 'user',
                name: role.name || role.role || 'User',
                features: templates.map((template) => {
                    const access = framework && typeof framework.getAppFeatureAccess === 'function'
                        ? framework.getAppFeatureAccess(normalizedAppId, template.id)
                        : null;
                    const roles = access && access.roles && typeof access.roles === 'object' ? access.roles : {};
                    const enabledByRole = typeof roles[role.role || role.name || 'user'] === 'boolean'
                        ? !!roles[role.role || role.name || 'user']
                        : !!template.enabled;
                    return {
                        id: template.id,
                        name: template.label || template.name || template.id,
                        enabled: enabledByRole,
                        permissions: Array.isArray(template.permissions) ? [...template.permissions] : []
                    };
                })
            }));
        },

        setModuleAccessForRole(appId, moduleId, roleId, enabled = true) {
            if (!appId || typeof appId !== 'string') {
                return { ok: false, code: 'INVALID_APP_ID', message: 'An app id is required.' };
            }
            if (!moduleId || typeof moduleId !== 'string') {
                return { ok: false, code: 'INVALID_MODULE_ID', message: 'A module id is required.' };
            }
            if (!roleId || typeof roleId !== 'string') {
                return { ok: false, code: 'INVALID_ROLE_ID', message: 'A role id is required.' };
            }

            const framework = window.MasterFramework;
            if (!framework || typeof framework.setAppModuleAccess !== 'function') {
                return { ok: false, code: 'FRAMEWORK_UNAVAILABLE', message: 'Master framework is unavailable.' };
            }

            const existing = framework.getAppModuleAccess(appId, moduleId) || { enabled: true, permissions: [], roles: {} };
            const nextRoles = { ...(existing.roles || {}) };
            nextRoles[roleId] = !!enabled;

            const result = framework.setAppModuleAccess(appId, moduleId, {
                enabled: typeof existing.enabled === 'boolean' ? existing.enabled : true,
                permissions: Array.isArray(existing.permissions) ? [...existing.permissions] : [],
                roles: nextRoles
            });

            return { ok: true, data: result, message: `Updated role access for ${moduleId} in ${appId}` };
        },

        setFeatureAccessForRole(appId, featureId, roleId, enabled = true) {
            if (!appId || typeof appId !== 'string') {
                return { ok: false, code: 'INVALID_APP_ID', message: 'An app id is required.' };
            }
            if (!featureId || typeof featureId !== 'string') {
                return { ok: false, code: 'INVALID_FEATURE_ID', message: 'A feature id is required.' };
            }
            if (!roleId || typeof roleId !== 'string') {
                return { ok: false, code: 'INVALID_ROLE_ID', message: 'A role id is required.' };
            }

            const framework = window.MasterFramework;
            if (!framework || typeof framework.setAppFeatureAccess !== 'function') {
                return { ok: false, code: 'FRAMEWORK_UNAVAILABLE', message: 'Master framework is unavailable.' };
            }

            const app = framework.getApp(appId);
            if (!app) {
                return { ok: false, code: 'APP_NOT_FOUND', message: `App not found: ${appId}` };
            }

            const existing = framework.getAppFeatureAccess(appId, featureId) || { enabled: true, permissions: [], roles: {} };
            const nextRoles = { ...(existing.roles || {}) };
            nextRoles[roleId] = !!enabled;

            const result = framework.setAppFeatureAccess(appId, featureId, {
                enabled: typeof existing.enabled === 'boolean' ? existing.enabled : true,
                permissions: Array.isArray(existing.permissions) ? [...existing.permissions] : [],
                roles: nextRoles
            });

            return { ok: true, data: result, message: `Updated feature access for ${featureId} in ${appId}` };
        },

        updateModule(moduleId, updates = {}) {
            if (!moduleId || typeof moduleId !== 'string') {
                return { ok: false, code: 'INVALID_MODULE_ID', message: 'A module id is required.' };
            }

            if (!window.ModuleRegistry || typeof window.ModuleRegistry.get !== 'function') {
                return { ok: false, code: 'MODULE_REGISTRY_UNAVAILABLE', message: 'Module registry is unavailable.' };
            }

            const module = window.ModuleRegistry.get(moduleId);
            if (!module) {
                return { ok: false, code: 'MODULE_NOT_FOUND', message: `Module not found: ${moduleId}` };
            }

            if (!updates || typeof updates !== 'object') {
                return { ok: false, code: 'INVALID_MODULE_UPDATES', message: 'Module updates must be an object.' };
            }

            const nextState = {};

            if (typeof updates.name === 'string' && updates.name.trim()) {
                module.name = updates.name.trim();
                nextState.name = module.name;
            }

            if (typeof updates.displayName === 'string' && updates.displayName.trim()) {
                module.displayName = updates.displayName.trim();
                nextState.displayName = module.displayName;
            }

            if (typeof updates.appId === 'string' && updates.appId.trim()) {
                module.appId = updates.appId.trim();
                nextState.appId = module.appId;
            }

            if (typeof updates.type === 'string' && updates.type.trim()) {
                module.type = updates.type.trim();
                nextState.type = module.type;
            }

            if (typeof updates.description === 'string') {
                module.description = updates.description.trim();
                nextState.description = module.description;
            }

            if (Array.isArray(updates.permissions)) {
                module.permissions = updates.permissions
                    .map((entry) => String(entry).trim())
                    .filter(Boolean);
                nextState.permissions = [...module.permissions];
            }

            if (Array.isArray(updates.capabilities)) {
                module.capabilities = updates.capabilities
                    .map((entry) => String(entry).trim())
                    .filter(Boolean);
                nextState.capabilities = [...module.capabilities];
            }

            if (typeof updates.active === 'boolean') {
                module.active = updates.active;
                module.status = updates.active ? 'enabled' : 'disabled';
                nextState.active = module.active;
                nextState.status = module.status;
            }

            if (typeof updates.status === 'string' && updates.status.trim()) {
                module.status = updates.status.trim();
                nextState.status = module.status;
                if (module.status === 'enabled' || module.status === 'active') {
                    module.active = true;
                    nextState.active = true;
                }
                if (module.status === 'disabled' || module.status === 'inactive') {
                    module.active = false;
                    nextState.active = false;
                }
            }

            if (module.manifest && typeof module.manifest === 'object') {
                if (typeof module.name === 'string') module.manifest.name = module.name;
                if (typeof module.displayName === 'string') module.manifest.displayName = module.displayName;
                if (typeof module.appId === 'string') module.manifest.appId = module.appId;
                if (typeof module.type === 'string') module.manifest.type = module.type;
                if (typeof module.description === 'string') module.manifest.description = module.description;
                if (Array.isArray(module.permissions)) module.manifest.permissions = [...module.permissions];
                if (Array.isArray(module.capabilities)) module.manifest.capabilities = [...module.capabilities];
            }

            if (module.admin && typeof module.admin === 'object') {
                if (typeof module.name === 'string' && !module.admin.title) {
                    module.admin.title = module.name;
                }
                if (typeof module.description === 'string') {
                    module.admin.description = module.description;
                }
            }

            if (window.Core) {
                window.Core.emit('module:updated', {
                    id: moduleId,
                    ...nextState
                });
            }

            return {
                ok: true,
                data: this.getModuleState(moduleId).data,
                message: `Module updated: ${moduleId}`
            };
        },

        getModuleTemplateCatalog() {
            return [
                {
                    id: 'content-module',
                    name: 'Content module',
                    type: 'app',
                    description: 'Generic editable content module for pages, lists or entries.',
                    permissions: ['module:read'],
                    capabilities: ['content', 'entries'],
                    settings: [
                        { key: 'title', path: 'moduleSettings.contentModule.title', label: 'Default title', type: 'text', defaultValue: 'New content module' },
                        { key: 'itemsPerPage', path: 'moduleSettings.contentModule.itemsPerPage', label: 'Items per page', type: 'number', defaultValue: 10, min: 1, step: 1 },
                        { key: 'allowDrafts', path: 'moduleSettings.contentModule.allowDrafts', label: 'Allow drafts', type: 'boolean', defaultValue: true }
                    ]
                },
                {
                    id: 'dashboard-module',
                    name: 'Dashboard module',
                    type: 'app',
                    description: 'A compact overview module with KPI tiles and action cards.',
                    permissions: ['module:read'],
                    capabilities: ['dashboard', 'overview'],
                    settings: [
                        { key: 'defaultView', path: 'moduleSettings.dashboardModule.defaultView', label: 'Default view', type: 'text', defaultValue: 'overview' },
                        { key: 'showSummaryCards', path: 'moduleSettings.dashboardModule.showSummaryCards', label: 'Show summary cards', type: 'boolean', defaultValue: true }
                    ]
                },
                {
                    id: 'data-module',
                    name: 'Data module',
                    type: 'app',
                    description: 'A structured data module for form-based records and local storage workflows.',
                    permissions: ['module:read', 'user:read'],
                    capabilities: ['data-entry', 'storage', 'records'],
                    settings: [
                        { key: 'recordLimit', path: 'moduleSettings.dataModule.recordLimit', label: 'Record limit', type: 'number', defaultValue: 500, min: 10, step: 10 },
                        { key: 'requireApproval', path: 'moduleSettings.dataModule.requireApproval', label: 'Require approval', type: 'boolean', defaultValue: false }
                    ]
                }
            ];
        },

        createModuleFromTemplate(templateId, overrides = {}) {
            const template = this.getModuleTemplateCatalog().find((entry) => entry.id === templateId)
                || this.getModuleTemplateCatalog()[0];

            if (!template) {
                return { ok: false, code: 'NO_TEMPLATE', message: 'No module template is available.' };
            }

            const moduleId = String(overrides.moduleId || overrides.id || template.id || 'custom-module')
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9-_]+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '') || 'custom-module';

            const baseName = String(overrides.name || template.name || 'New module').trim();
            const displayName = String(overrides.displayName || baseName || moduleId).trim();
            const moduleDefinition = {
                id: moduleId,
                name: baseName,
                displayName,
                version: String(overrides.version || '1.0.0').trim() || '1.0.0',
                type: String(overrides.type || template.type || 'app').trim() || 'app',
                appId: String(overrides.appId || 'neutral-app').trim() || 'neutral-app',
                description: String(overrides.description || template.description || 'Generated from a framework module template').trim(),
                permissions: Array.isArray(overrides.permissions) ? [...overrides.permissions] : Array.isArray(template.permissions) ? [...template.permissions] : ['module:read'],
                capabilities: Array.isArray(overrides.capabilities) ? [...overrides.capabilities] : Array.isArray(template.capabilities) ? [...template.capabilities] : ['customization'],
                dependencies: Array.isArray(overrides.dependencies) ? [...overrides.dependencies] : [],
                status: 'enabled',
                active: true,
                admin: {
                    title: `${displayName} settings`,
                    description: `${displayName} settings generated from the ${template.name || 'template'} template.`,
                    settings: Array.isArray(overrides.settings) ? [...overrides.settings] : Array.isArray(template.settings) ? template.settings.map((setting) => ({ ...setting })) : []
                },
                renderUserInterface(container) {
                    if (!container) {
                        return;
                    }
                    container.innerHTML = `
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">${displayName}</h3>
                            </div>
                            <div class="content-wrap">
                                <div class="message info">This module was generated from the ${template.name || 'module'} template and is ready for app-specific content.</div>
                            </div>
                        </div>
                    `;
                }
            };

            if (window.ModuleRegistry && typeof window.ModuleRegistry.get === 'function' && window.ModuleRegistry.get(moduleId)) {
                return { ok: false, code: 'MODULE_EXISTS', message: `Module already exists: ${moduleId}` };
            }

            if (window.ModuleManager && typeof window.ModuleManager.register === 'function') {
                const created = window.ModuleManager.register(moduleDefinition);
                if (created && typeof created.id === 'string' && window.ModuleManager.enable) {
                    window.ModuleManager.enable(created.id);
                }
                return { ok: true, data: created, message: `Module created: ${created.id}` };
            }

            if (window.ModuleRegistry && typeof window.ModuleRegistry.register === 'function') {
                const created = window.ModuleRegistry.register(moduleDefinition);
                return { ok: true, data: created, message: `Module created: ${created.id}` };
            }

            return { ok: false, code: 'MODULE_REGISTRY_UNAVAILABLE', message: 'Module registry is unavailable.' };
        },

        getModuleState(moduleId) {
            if (!moduleId || typeof moduleId !== 'string') {
                return { ok: false, code: 'INVALID_MODULE_ID', message: 'A module id is required.' };
            }

            if (!window.ModuleRegistry || typeof window.ModuleRegistry.get !== 'function') {
                return { ok: false, code: 'MODULE_REGISTRY_UNAVAILABLE', message: 'Module registry is unavailable.' };
            }

            const module = window.ModuleRegistry.get(moduleId);
            if (!module) {
                return { ok: false, code: 'MODULE_NOT_FOUND', message: `Module not found: ${moduleId}` };
            }

            return {
                ok: true,
                data: {
                    id: module.id,
                    name: module.name,
                    status: module.status || (module.active ? 'enabled' : 'available'),
                    active: !!module.active,
                    permissions: Array.isArray(module.permissions) ? [...module.permissions] : [],
                    capabilities: Array.isArray(module.capabilities) ? [...module.capabilities] : [],
                    admin: module.admin || (module.manifest && module.manifest.admin) || null,
                    adminSettingsCount: createModuleSettingsSection(module)?.settings.length || 0
                }
            };
        },

        setModuleState(moduleId, enabled) {
            if (!moduleId || typeof moduleId !== 'string') {
                return { ok: false, code: 'INVALID_MODULE_ID', message: 'A module id is required.' };
            }

            if (!window.ModuleManager || typeof window.ModuleManager.enable !== 'function' || typeof window.ModuleManager.disable !== 'function') {
                return { ok: false, code: 'MODULE_MANAGER_UNAVAILABLE', message: 'Module manager is unavailable.' };
            }

            const shouldEnable = !!enabled;
            if (shouldEnable) {
                window.ModuleManager.enable(moduleId);
            } else {
                window.ModuleManager.disable(moduleId);
            }

            return this.getModuleState(moduleId);
        },

        installModule(moduleId) {
            if (!moduleId || typeof moduleId !== 'string') {
                return { ok: false, code: 'INVALID_MODULE_ID', message: 'A module id is required.' };
            }

            if (!window.ModuleManager || typeof window.ModuleManager.install !== 'function') {
                return { ok: false, code: 'MODULE_MANAGER_UNAVAILABLE', message: 'Module manager is unavailable.' };
            }

            const module = window.ModuleRegistry && typeof window.ModuleRegistry.get === 'function'
                ? window.ModuleRegistry.get(moduleId)
                : null;

            if (!module) {
                return { ok: false, code: 'MODULE_NOT_FOUND', message: `Module not found: ${moduleId}` };
            }

            try {
                const installed = window.ModuleManager.install(moduleId);
                if (window.ModuleManager.enable) {
                    window.ModuleManager.enable(moduleId);
                }
                return {
                    ok: true,
                    data: installed || module,
                    message: `Module installed: ${moduleId}`
                };
            } catch (error) {
                return {
                    ok: false,
                    code: 'MODULE_INSTALL_FAILED',
                    message: error && error.message ? error.message : `Module install failed: ${moduleId}`
                };
            }
        },

        uninstallModule(moduleId) {
            if (!moduleId || typeof moduleId !== 'string') {
                return { ok: false, code: 'INVALID_MODULE_ID', message: 'A module id is required.' };
            }

            if (!window.ModuleRegistry || typeof window.ModuleRegistry.get !== 'function') {
                return { ok: false, code: 'MODULE_REGISTRY_UNAVAILABLE', message: 'Module registry is unavailable.' };
            }

            const module = window.ModuleRegistry.get(moduleId);
            if (!module) {
                return { ok: false, code: 'MODULE_NOT_FOUND', message: `Module not found: ${moduleId}` };
            }

            if (typeof module.id === 'string' && module.id.startsWith('core-')) {
                return { ok: false, code: 'CORE_MODULE_PROTECTED', message: `Core modules cannot be uninstalled: ${moduleId}` };
            }

            if (window.ModuleManager && typeof window.ModuleManager.disable === 'function') {
                window.ModuleManager.disable(moduleId);
            }

            let removed = false;
            if (window.ModuleManager && typeof window.ModuleManager.unregister === 'function') {
                removed = !!window.ModuleManager.unregister(moduleId);
            } else if (typeof window.ModuleRegistry.unregister === 'function') {
                removed = !!window.ModuleRegistry.unregister(moduleId);
            }

            return {
                ok: removed,
                data: removed ? { id: moduleId } : null,
                message: removed ? `Module uninstalled: ${moduleId}` : `Module could not be uninstalled: ${moduleId}`
            };
        },

        toggleModule(moduleId) {
            const current = this.getModuleState(moduleId);
            if (!current.ok || !current.data) {
                return current;
            }

            return this.setModuleState(moduleId, !current.data.active);
        },

        getAuditLog() {
            return window.CoreAudit && typeof window.CoreAudit.list === 'function'
                ? window.CoreAudit.list()
                : [];
        },

        getEventRingBuffer() {
            return window.CoreEventRing && typeof window.CoreEventRing.get === 'function'
                ? window.CoreEventRing.get()
                : {};
        },

        async getSystemStats() {
            const registry = window.ModuleRegistry && typeof window.ModuleRegistry.getAll === 'function'
                ? window.ModuleRegistry.getAll()
                : [];

            let userCount = 0;
            if (window.UserModule && typeof window.UserModule.listUsers === 'function') {
                const usersResult = await window.UserModule.listUsers();
                userCount = usersResult && usersResult.data && typeof usersResult.data.count === 'number'
                    ? usersResult.data.count
                    : 0;
            }

            return {
                startedAt: this.startedAt,
                uptime: this.getUptime(),
                moduleCount: registry.length,
                userCount,
                modules: registry.map((module) => ({ id: module.id, name: module.name, status: module.status || 'available' }))
            };
        },

        async canAccess(subject, action, resource = null) {
            if (!window.CoreAccess || typeof window.CoreAccess.can !== 'function') {
                return { ok: false, code: 'ACCESS_UNAVAILABLE', message: 'Core access is not available.' };
            }

            return window.CoreAccess.can(subject, action, resource);
        },

        healthCheck() {
            const checks = {
                timestamp: new Date().toISOString(),
                coreLoaded: !!window.Core,
                authLoaded: !!window.CoreAuth,
                accessLoaded: !!window.CoreAccess,
                auditLoaded: !!window.CoreAudit,
                eventRingLoaded: !!window.CoreEventRing,
                userModuleLoaded: !!window.UserModule,
                moduleManagerLoaded: !!window.ModuleManager
            };

            checks.healthy = Object.values(checks)
                .filter((value) => typeof value === 'boolean')
                .every((value) => value === true);

            return checks;
        },

        async getDebugInfo() {
            return {
                timestamp: new Date().toISOString(),
                environment: {
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                    language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
                    onLine: typeof navigator !== 'undefined' ? navigator.onLine : true
                },
                stats: await this.getSystemStats(),
                health: this.healthCheck()
            };
        }
    };

    const moduleManifest = Object.freeze({
        id: 'core-admin',
        name: 'Core Admin',
        version: '1.0.0',
        type: 'framework',
        description: 'Framework administration and governance facade.',
        dependencies: ['core-user', 'core-auth', 'core-access', 'core-audit', 'core-event-ring'],
        permissions: ['framework:read', 'system:view', 'user:read', 'user:write'],
        capabilities: ['diagnostics', 'audit', 'admin'],
        source: 'platform/core-admin.js'
    });

    if (!Array.isArray(window.FrameworkModuleCatalog)) {
        window.FrameworkModuleCatalog = [];
    }

    if (!window.FrameworkModuleCatalog.some((entry) => entry && entry.id === moduleManifest.id)) {
        window.FrameworkModuleCatalog.push(moduleManifest);
    }

    if (!window.AdminModule) {
        window.AdminModule = AdminModule;
    }
})();

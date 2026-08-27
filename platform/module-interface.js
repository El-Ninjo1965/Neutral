/*
 * Module Interface
 * Version: 1.0
 *
 * Einheitliche Grundstruktur für alle Module.
 * Die eigentliche Funktionalität wird ausschließlich
 * innerhalb des jeweiligen Moduls implementiert.
 */

(() => {
    'use strict';

    const moduleStatuses = Object.freeze({
        AVAILABLE: 'available',
        INSTALLED: 'installed',
        ENABLED: 'enabled',
        ACTIVE: 'enabled',
        DISABLED: 'disabled',
        INACTIVE: 'disabled',
        ERROR: 'error'
    });

    const normalizeStringArray = (value) => Array.isArray(value)
        ? value.filter(Boolean).map((entry) => String(entry).trim()).filter(Boolean)
        : [];

    const normalizePermissionDefinitions = (permissions) => {
        if (!Array.isArray(permissions)) {
            return [];
        }

        return permissions.map((entry, index) => {
            if (typeof entry === 'string') {
                const key = entry.trim();
                return key
                    ? {
                        key,
                        description: '',
                        defaultRoles: []
                    }
                    : null;
            }

            if (!entry || typeof entry !== 'object') {
                return null;
            }

            const fallbackKey = typeof entry.permission === 'string' && entry.permission.trim()
                ? entry.permission.trim()
                : `module.permission.${index + 1}`;
            const key = typeof entry.key === 'string' && entry.key.trim()
                ? entry.key.trim()
                : fallbackKey;

            if (!key) {
                return null;
            }

            return {
                key,
                description: typeof entry.description === 'string' ? entry.description : '',
                defaultRoles: normalizeStringArray(entry.defaultRoles)
            };
        }).filter(Boolean);
    };

    const normalizeAccessDefinition = (value, permissionDefinitions) => {
        const permissionKeys = permissionDefinitions.map((entry) => entry.key);
        const fallbackBySuffix = (suffix) => permissionKeys.filter((key) => key.endsWith(suffix));
        const source = value && typeof value === 'object' ? value : {};

        return {
            visibilityPermissions: normalizeStringArray(source.visibilityPermissions).length
                ? normalizeStringArray(source.visibilityPermissions)
                : fallbackBySuffix('.view'),
            usagePermissions: normalizeStringArray(source.usagePermissions).length
                ? normalizeStringArray(source.usagePermissions)
                : fallbackBySuffix('.use'),
            managementPermissions: normalizeStringArray(source.managementPermissions).length
                ? normalizeStringArray(source.managementPermissions)
                : fallbackBySuffix('.manage'),
            adminPermissions: normalizeStringArray(source.adminPermissions).length
                ? normalizeStringArray(source.adminPermissions)
                : fallbackBySuffix('.admin')
        };
    };

    const normalizeStandaloneDefinition = (value) => {
        if (!value || typeof value !== 'object') {
            return null;
        }

        const entry = typeof value.entry === 'string' && value.entry.trim()
            ? value.entry.trim()
            : null;

        if (!entry) {
            return null;
        }

        const requires = value.requires && typeof value.requires === 'object' ? value.requires : {};

        return {
            entry,
            label: typeof value.label === 'string' && value.label.trim() ? value.label.trim() : 'Standalone module test',
            description: typeof value.description === 'string' ? value.description : '',
            requires: {
                server: requires.server === true,
                database: requires.database === true,
                auth: requires.auth === true
            }
        };
    };

    const normalizeDatabaseDefinition = (value) => {
        const source = value && typeof value === 'object' ? value : {};
        const tables = Array.isArray(source.tables)
            ? source.tables.map((entry) => {
                if (typeof entry === 'string') {
                    const name = entry.trim();
                    return name ? { name, destroyOnUninstall: false } : null;
                }
                if (!entry || typeof entry !== 'object') {
                    return null;
                }
                const name = typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim() : '';
                if (!name) {
                    return null;
                }
                return {
                    name,
                    destroyOnUninstall: entry.destroyOnUninstall === true,
                    description: typeof entry.description === 'string' ? entry.description : ''
                };
            }).filter(Boolean)
            : [];

        return { tables };
    };

    const ModuleInterface = {
        statuses: moduleStatuses,

        validateManifest(manifest) {
            if (!manifest || typeof manifest !== 'object') {
                return null;
            }

            const id = typeof manifest.id === 'string' && manifest.id.trim()
                ? manifest.id.trim()
                : null;

            if (!id) {
                return null;
            }

            const permissionDefinitions = normalizePermissionDefinitions(manifest.permissions);

            return {
                id,
                appId: typeof manifest.appId === 'string' && manifest.appId.trim()
                    ? manifest.appId.trim()
                    : null,
                name: typeof manifest.name === 'string' && manifest.name.trim()
                    ? manifest.name.trim()
                    : id,
                version: typeof manifest.version === 'string' && manifest.version.trim()
                    ? manifest.version.trim()
                    : '1.0.0',
                apiVersion: typeof manifest.apiVersion === 'string' && manifest.apiVersion.trim()
                    ? manifest.apiVersion.trim()
                    : null,
                type: manifest.type || 'module',
                description: typeof manifest.description === 'string'
                    ? manifest.description
                    : '',
                dependencies: Array.isArray(manifest.dependencies)
                    ? manifest.dependencies.filter(Boolean).map(String)
                    : manifest.dependencies && typeof manifest.dependencies === 'object'
                        ? Object.entries(manifest.dependencies).map(([dependencyId, requirement]) => {
                            const normalizedRequirement = requirement && typeof requirement === 'string' ? requirement : '*';
                            return normalizedRequirement === '*' ? dependencyId : `${dependencyId}@${normalizedRequirement}`;
                        })
                        : [],
                permissions: permissionDefinitions.map((entry) => entry.key),
                permissionDefinitions,
                capabilities: Array.isArray(manifest.capabilities)
                    ? manifest.capabilities.filter(Boolean).map(String)
                    : [],
                source: typeof manifest.source === 'string' ? manifest.source : null,
                entry: typeof manifest.entry === 'string' ? manifest.entry : null,
                main: typeof manifest.main === 'string' ? manifest.main : null,
                globalName: typeof manifest.globalName === 'string' && manifest.globalName.trim()
                    ? manifest.globalName.trim()
                    : null,
                modulePath: typeof manifest.modulePath === 'string' ? manifest.modulePath : null,
                mountPath: typeof manifest.mountPath === 'string' ? manifest.mountPath : null,
                manifestPath: typeof manifest.manifestPath === 'string' ? manifest.manifestPath : null,
                autoload: manifest.autoload !== false,
                lifecycle: manifest.lifecycle && typeof manifest.lifecycle === 'object'
                    ? manifest.lifecycle
                    : {},
                requirements: Array.isArray(manifest.requirements)
                    ? manifest.requirements.filter(Boolean).map(String)
                    : [],
                access: normalizeAccessDefinition(manifest.access, permissionDefinitions),
                standalone: normalizeStandaloneDefinition(manifest.standalone),
                database: normalizeDatabaseDefinition(manifest.database),
                admin: manifest.admin && typeof manifest.admin === 'object'
                    ? manifest.admin
                    : null
            };
        },

        create(definition = {}) {
            const manifest = this.validateManifest(definition.manifest || definition);

            if (!manifest) {
                throw new Error('Module ID is required.');
            }

            const module = {
                id: manifest.id,
                name: manifest.name,
                version: manifest.version,
                description: manifest.description,
                status: moduleStatuses.AVAILABLE,
                active: false,
                dependencies: [...manifest.dependencies],
                permissions: [...manifest.permissions],
                permissionDefinitions: [...manifest.permissionDefinitions],
                capabilities: [...manifest.capabilities],
                access: manifest.access,
                standalone: manifest.standalone,
                database: manifest.database,
                admin: manifest.admin,
                manifest,

                install() {
                    if (this.status === moduleStatuses.INSTALLED) {
                        return this;
                    }

                    this.status = moduleStatuses.INSTALLED;
                    this.active = false;

                    if (typeof definition.onInstall === 'function') {
                        definition.onInstall(this);
                    }

                    return this;
                },

                initialize() {
                    if (typeof definition.onInitialize === 'function') {
                        definition.onInitialize(this);
                    }

                    if (this.status === moduleStatuses.AVAILABLE) {
                        this.status = moduleStatuses.INSTALLED;
                    }

                    return this;
                },

                enable() {
                    if (this.status === moduleStatuses.ENABLED) {
                        return this;
                    }

                    this.status = moduleStatuses.ENABLED;
                    this.active = true;

                    if (typeof definition.onEnable === 'function') {
                        definition.onEnable(this);
                    }

                    if (typeof definition.onActivate === 'function') {
                        definition.onActivate(this);
                    }

                    return this;
                },

                disable() {
                    if (this.status === moduleStatuses.DISABLED && !this.active) {
                        return this;
                    }

                    this.status = moduleStatuses.DISABLED;
                    this.active = false;

                    if (typeof definition.onDisable === 'function') {
                        definition.onDisable(this);
                    }

                    if (typeof definition.onDeactivate === 'function') {
                        definition.onDeactivate(this);
                    }

                    return this;
                },

                update() {
                    if (typeof definition.onUpdate === 'function') {
                        definition.onUpdate(this);
                    }

                    return this;
                },

                uninstall() {
                    this.status = moduleStatuses.AVAILABLE;
                    this.active = false;

                    if (typeof definition.onUninstall === 'function') {
                        definition.onUninstall(this);
                    }

                    return this;
                },

                activate() {
                    return this.enable();
                },

                deactivate() {
                    return this.disable();
                }
            };

            return module;
        }
    };

    if (!window.ModuleInterface) {
        window.ModuleInterface = ModuleInterface;
    }
})();
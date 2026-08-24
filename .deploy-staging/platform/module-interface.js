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
        DISABLED: 'disabled'
    });

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
                type: manifest.type || 'framework',
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
                permissions: Array.isArray(manifest.permissions)
                    ? manifest.permissions.filter(Boolean).map(String)
                    : [],
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
                capabilities: [...manifest.capabilities],
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
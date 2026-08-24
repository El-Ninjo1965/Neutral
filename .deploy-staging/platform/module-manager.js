/*
 * Module Manager
 * Version: 1.0
 *
 * Zentrale Verwaltung der Module inklusive Registrierung,
 * Aktivierung, Deaktivierung und Lifecycle-Steuerung.
 */

(() => {
    'use strict';

    const ModuleManager = {
        registry: null,

        init() {
            if (!window.ModuleRegistry) {
                throw new Error('Module Registry is not available.');
            }

            this.registry = window.ModuleRegistry;
        },

        normalizeModule(module) {
            if (!module || typeof module !== 'object') {
                throw new TypeError('Invalid module definition.');
            }

            if (!module.id || typeof module.id !== 'string') {
                if (typeof module.name === 'string' && module.name.trim()) {
                    module.id = module.name.trim();
                } else {
                    throw new Error('Module ID is required.');
                }
            }

            if (!module.name || typeof module.name !== 'string') {
                module.name = module.id;
            }

            if (!module.displayName || typeof module.displayName !== 'string') {
                module.displayName = module.name;
            }

            if (typeof module.status === 'undefined') {
                module.status = 'available';
            }

            if (typeof module.active === 'undefined') {
                module.active = false;
            }

            if (!Array.isArray(module.dependencies)) {
                module.dependencies = [];
            }

            if (!Array.isArray(module.permissions)) {
                module.permissions = [];
            }

            if (!Array.isArray(module.capabilities)) {
                module.capabilities = [];
            }

            if (!module.appId && typeof module.manifest?.appId === 'string') {
                module.appId = module.manifest.appId;
            }

            if (!module.apiVersion && typeof module.manifest?.apiVersion === 'string') {
                module.apiVersion = module.manifest.apiVersion;
            }

            if (!module.manifest) {
                module.manifest = {
                    id: module.id,
                    appId: module.appId || null,
                    name: module.name,
                    version: module.version || '1.0.0',
                    apiVersion: module.apiVersion || null,
                    type: 'framework',
                    description: module.description || '',
                    dependencies: [...module.dependencies],
                    permissions: [...module.permissions],
                    capabilities: [...module.capabilities],
                    admin: module.admin || null
                };
            }

            if (!module.admin || typeof module.admin !== 'object') {
                module.admin = module.manifest && module.manifest.admin && typeof module.manifest.admin === 'object'
                    ? module.manifest.admin
                    : null;
            }

            return module;
        },

        async discoverModules() {
            this.ensureInitialized();

            if (!window.ModuleRegistry || typeof window.ModuleRegistry.discover !== 'function') {
                return [];
            }

            const discovered = await window.ModuleRegistry.discover();

            for (const registered of discovered) {
                if (!registered || !registered.id) {
                    continue;
                }

                try {
                    this.install(registered.id);
                    this.initialize(registered.id);
                    this.enable(registered.id);
                } catch (error) {
                    if (window.CoreErrorHandler) {
                        window.CoreErrorHandler.handle(error, {
                            type: 'module-discovery-activate',
                            moduleId: registered.id
                        });
                    }
                }
            }

            return discovered;
        },

        validateDependencies(moduleId) {
            this.ensureInitialized();

            const module = this.get(moduleId);

            if (!module) {
                throw new Error(`Module not found: ${moduleId}`);
            }

            const framework = (typeof window !== 'undefined' && window.MasterFramework)
                ? window.MasterFramework
                : (typeof globalThis !== 'undefined' && globalThis.MasterFramework ? globalThis.MasterFramework : null);

            if (framework && typeof framework.validateModuleDependencies === 'function') {
                const result = framework.validateModuleDependencies(moduleId);
                if (!result.ok) {
                    throw new Error(result.errors.join(' '));
                }
                return true;
            }

            const dependencyEntries = Array.isArray(module.dependencies)
                ? module.dependencies
                : module.dependencies && typeof module.dependencies === 'object'
                    ? Object.entries(module.dependencies).map(([dependencyId, requirement]) => requirement && requirement !== '*' ? `${dependencyId}@${requirement}` : dependencyId)
                    : [];

            const missingDependencies = dependencyEntries.filter((dependency) => {
                const dependencyId = String(dependency).split('@')[0];
                return !this.registry.has(dependencyId);
            });

            if (missingDependencies.length > 0) {
                throw new Error(`Missing module dependencies for "${module.id}": ${missingDependencies.join(', ')}`);
            }

            return true;
        },

        register(module) {
            this.ensureInitialized();

            const normalizedModule = this.normalizeModule(module);
            const registeredModule = this.registry.register(normalizedModule);

            if (window.Core) {
                window.Core.emit('module:registered', {
                    id: registeredModule.id,
                    name: registeredModule.name,
                    version: registeredModule.version
                });
            }

            return registeredModule;
        },

        unregister(moduleId) {
            this.ensureInitialized();

            const removed = this.registry.unregister(moduleId);

            if (removed && window.Core) {
                window.Core.emit('module:unregistered', {
                    id: moduleId
                });
            }

            return removed;
        },

        get(moduleId) {
            this.ensureInitialized();
            return this.registry.get(moduleId);
        },

        getAll() {
            this.ensureInitialized();
            return this.registry.getAll();
        },

        getByApp(appId) {
            this.ensureInitialized();
            return this.registry.getByApp(appId);
        },

        getStatus(moduleId) {
            const module = this.get(moduleId);

            if (!module) {
                return null;
            }

            return module.status || (module.active ? 'enabled' : 'available');
        },

        install(moduleId) {
            this.ensureInitialized();

            const module = this.get(moduleId);

            if (!module) {
                throw new Error(`Module not found: ${moduleId}`);
            }

            this.validateDependencies(moduleId);

            if (typeof module.install === 'function') {
                module.install();
            }

            return module;
        },

        initialize(moduleId) {
            this.ensureInitialized();

            const module = this.get(moduleId);

            if (!module) {
                throw new Error(`Module not found: ${moduleId}`);
            }

            this.validateDependencies(moduleId);

            if (typeof module.initialize === 'function') {
                module.initialize();
            }

            return module;
        },

        enable(moduleId) {
            this.ensureInitialized();

            const module = this.get(moduleId);

            if (!module) {
                throw new Error(`Module not found: ${moduleId}`);
            }

            this.validateDependencies(moduleId);

            if (typeof module.enable === 'function') {
                module.enable();
            } else if (typeof module.activate === 'function') {
                module.activate();
            }

            if (window.Core) {
                window.Core.state.activeModule = moduleId;
                window.Core.emit('module:activated', {
                    id: moduleId,
                    name: module.name,
                    version: module.version
                });
            }

            return module;
        },

        disable(moduleId) {
            this.ensureInitialized();

            const module = this.get(moduleId);

            if (!module) {
                return false;
            }

            if (typeof module.disable === 'function') {
                module.disable();
            } else if (typeof module.deactivate === 'function') {
                module.deactivate();
            }

            if (
                window.Core &&
                window.Core.state.activeModule === moduleId
            ) {
                window.Core.state.activeModule = null;
            }

            if (window.Core) {
                window.Core.emit('module:deactivated', {
                    id: moduleId
                });
            }

            return true;
        },

        update(moduleId) {
            this.ensureInitialized();

            const module = this.get(moduleId);

            if (!module) {
                throw new Error(`Module not found: ${moduleId}`);
            }

            if (typeof module.update === 'function') {
                module.update();
            }

            return module;
        },

        uninstall(moduleId) {
            this.ensureInitialized();

            const module = this.get(moduleId);

            if (!module) {
                return false;
            }

            if (typeof module.uninstall === 'function') {
                module.uninstall();
            }

            return this.unregister(moduleId);
        },

        activate(moduleId) {
            return this.enable(moduleId);
        },

        deactivate(moduleId) {
            return this.disable(moduleId);
        },

        ensureInitialized() {
            if (!this.registry) {
                throw new Error('Module Manager is not initialized.');
            }
        }
    };

    ModuleManager.init();

    window.ModuleManager = ModuleManager;
})();
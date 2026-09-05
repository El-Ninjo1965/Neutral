/*
 * Module Manager
 * Version: 1.0
 *
 * Zentrale Verwaltung der Module inklusive Registrierung,
 * Aktivierung, Deaktivierung und Lifecycle-Steuerung.
 */

(() => {
    'use strict';

    // TEMPORARY diagnostic instrumentation (local-only, non-PII, no telemetry
    // — see WORKFLOW.md). Removed once the offline/online discovery timing
    // has been confirmed on a real device.
    const mark = (name) => {
        if (typeof window !== 'undefined' && window.CorePerformance) window.CorePerformance.mark(name);
    };

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

            if (!Array.isArray(module.permissionDefinitions)) {
                module.permissionDefinitions = [];
            }

            if (!Array.isArray(module.capabilities)) {
                module.capabilities = [];
            }

            if (!module.access || typeof module.access !== 'object') {
                module.access = module.manifest && module.manifest.access && typeof module.manifest.access === 'object'
                    ? module.manifest.access
                    : {
                        visibilityPermissions: [],
                        usagePermissions: [],
                        managementPermissions: [],
                        adminPermissions: []
                    };
            }

            if (!module.standalone || typeof module.standalone !== 'object') {
                module.standalone = module.manifest && module.manifest.standalone && typeof module.manifest.standalone === 'object'
                    ? module.manifest.standalone
                    : null;
            }

            if (!module.database || typeof module.database !== 'object') {
                module.database = module.manifest && module.manifest.database && typeof module.manifest.database === 'object'
                    ? module.manifest.database
                    : { tables: [] };
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
                    permissionDefinitions: [...module.permissionDefinitions],
                    capabilities: [...module.capabilities],
                    access: module.access,
                    standalone: module.standalone,
                    database: module.database,
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

            mark('module-manager-discover-modules-start'); // TEMPORARY diagnostic mark
            if (!window.ModuleRegistry || typeof window.ModuleRegistry.discover !== 'function') {
                mark('module-manager-discover-modules-end'); // TEMPORARY diagnostic mark
                return [];
            }

            const discovered = await window.ModuleRegistry.discover();

            for (const registered of discovered) {
                if (!registered || !registered.id) {
                    continue;
                }

                try {
                    const existing = this.get(registered.id);
                    const sourceState = existing || registered;
                    const rawStatus = typeof sourceState?.status === 'string'
                        ? sourceState.status.trim().toLowerCase()
                        : '';
                    const lifecycleState = typeof sourceState?.lifecycleState === 'string'
                        ? sourceState.lifecycleState.trim().toUpperCase()
                        : '';
                    const isActive = !!(
                        sourceState &&
                        (
                            sourceState.active ||
                            sourceState.enabled ||
                            rawStatus === 'active' ||
                            rawStatus === 'enabled' ||
                            lifecycleState === 'ACTIVE'
                        )
                    );
                    const isRegistered = typeof sourceState?.registered === 'boolean'
                        ? sourceState.registered
                        : ['installed', 'inactive', 'disabled', 'active', 'enabled'].includes(rawStatus)
                            || ['INSTALLED', 'INACTIVE', 'ACTIVE'].includes(lifecycleState);
                    const normalizedStatus = isActive
                        ? 'enabled'
                        : (rawStatus === 'inactive' || rawStatus === 'disabled')
                            ? 'disabled'
                            : rawStatus === 'installed'
                                ? 'installed'
                                : (rawStatus === 'available' || rawStatus === 'discovered')
                                    ? 'available'
                                    : (isRegistered ? 'installed' : 'available');
                    const nextDefinition = {
                        ...registered,
                        type: registered.type || (registered.manifest && registered.manifest.type) || 'module',
                        status: normalizedStatus,
                        lifecycleState: lifecycleState || (isActive ? 'ACTIVE' : (isRegistered ? 'INACTIVE' : 'DISCOVERED')),
                        registered: isRegistered,
                        active: isActive,
                        enabled: isActive
                    };

                    if (existing) {
                        this.unregister(registered.id);
                    }

                    const runtimeModule = this.register({
                        ...existing,
                        ...nextDefinition,
                    });
                    if (isActive) {
                        mark(`module-init-enable-start-${registered.id}`); // TEMPORARY diagnostic mark
                        if (typeof runtimeModule.initialize === 'function') {
                            await runtimeModule.initialize();
                        }
                        if (typeof runtimeModule.enable === 'function') {
                            await runtimeModule.enable();
                        } else if (typeof runtimeModule.activate === 'function') {
                            await runtimeModule.activate();
                        }
                        mark(`module-init-enable-end-${registered.id}`); // TEMPORARY diagnostic mark
                        runtimeModule.status = 'enabled';
                        runtimeModule.lifecycleState = 'ACTIVE';
                        runtimeModule.registered = true;
                        runtimeModule.active = true;
                        runtimeModule.enabled = true;
                    }
                } catch (error) {
                    if (window.CoreErrorHandler) {
                        window.CoreErrorHandler.handle(error, {
                            type: 'module-discovery-register',
                            moduleId: registered.id
                        });
                    }
                }
            }

            mark('module-manager-discover-modules-end'); // TEMPORARY diagnostic mark
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

            module.registered = true;
            module.active = false;
            module.enabled = false;
            module.status = 'installed';
            module.lifecycleState = 'INACTIVE';
            if (window.Core) window.Core.emit('module:installed', { id: moduleId });

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

            module.registered = true;
            module.active = true;
            module.enabled = true;
            module.status = 'enabled';
            module.lifecycleState = 'ACTIVE';

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

            module.active = false;
            module.enabled = false;
            module.status = 'disabled';
            module.lifecycleState = 'INACTIVE';

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

            if (window.Core) window.Core.emit('module:updated', { id: moduleId, version: module.version || null });

            return module;
        },

        uninstall(moduleId) {
            this.ensureInitialized();

            const module = this.get(moduleId);

            if (!module) {
                return false;
            }

            if (module.active || module.enabled) this.disable(moduleId);

            if (typeof module.uninstall === 'function') {
                module.uninstall();
            }
            const removed = this.unregister(moduleId);
            if (removed && window.Core) window.Core.emit('module:uninstalled', { id: moduleId });
            return removed;
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

/*
 * Module Registry
 * Version: 1.0
 *
 * Zentrale Verwaltung der registrierten Core-Module.
 * Diese Registry enthält keine UI-Logik und keine fachliche
 * Modulimplementierung. Sie stellt nur die technische Registry
 * für Module bereit.
 */

(() => {
    'use strict';

    // TEMPORARY diagnostic instrumentation (local-only, non-PII, no telemetry
    // — see WORKFLOW.md). Removed once the offline/online discovery timing
    // has been confirmed on a real device.
    const mark = (name) => {
        if (typeof window !== 'undefined' && window.CorePerformance) window.CorePerformance.mark(name);
    };

    const registry = new Map();

    const resolveGlobalName = (manifest, entry) => {
        if (entry && typeof entry.globalName === 'string' && entry.globalName.trim()) {
            return entry.globalName.trim();
        }

        if (manifest && typeof manifest.globalName === 'string' && manifest.globalName.trim()) {
            return manifest.globalName.trim();
        }

        const primaryName = (manifest && manifest.name) || (entry && entry.name) || (manifest && manifest.id) || '';
        const nameCandidates = [
            primaryName,
            (manifest && manifest.id) || '',
            (entry && entry.id) || ''
        ].filter(Boolean);

        const normalized = nameCandidates
            .map((name) => name
                .replace(/[^A-Za-z0-9]+/g, ' ')
                .trim()
                .split(/\s+/)
                .filter(Boolean))
            .flat()
            .map((part, index) => index === 0
                ? part.charAt(0).toUpperCase() + part.slice(1)
                : part.charAt(0).toUpperCase() + part.slice(1))
            .join('');

        return normalized || 'Module';
    };

    const ModuleRegistry = {
        register(module) {
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

            if (registry.has(module.id)) {
                throw new Error(`Module already registered: ${module.id}`);
            }

            if (!module.name || typeof module.name !== 'string') {
                module.name = module.id;
            }

            if (!module.displayName || typeof module.displayName !== 'string') {
                module.displayName = module.name;
            }

            if (!module.admin || typeof module.admin !== 'object') {
                module.admin = module.manifest && module.manifest.admin && typeof module.manifest.admin === 'object'
                    ? module.manifest.admin
                    : null;
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
                    clientAccess: module.clientAccess || null,
                    standalone: module.standalone,
                    database: module.database,
                    admin: module.admin
                };
            }

            registry.set(module.id, module);
            return module;
        },

        unregister(moduleId) {
            if (!moduleId || typeof moduleId !== 'string') {
                throw new Error('Module ID is required.');
            }

            if (!registry.has(moduleId)) {
                return false;
            }

            registry.delete(moduleId);
            return true;
        },

        get(moduleId) {
            if (!moduleId || typeof moduleId !== 'string') {
                throw new Error('Module ID is required.');
            }

            return registry.get(moduleId) || null;
        },

        getAll() {
            return Array.from(registry.values());
        },

        getByApp(appId) {
            if (!appId || typeof appId !== 'string') {
                return [];
            }

            return Array.from(registry.values()).filter((module) => module.appId === appId || module.manifest?.appId === appId);
        },

        has(moduleId) {
            if (!moduleId || typeof moduleId !== 'string') {
                throw new Error('Module ID is required.');
            }

            return registry.has(moduleId);
        },

        clear() {
            registry.clear();
        },

        async discover() {
            mark('module-registry-discover-start'); // TEMPORARY diagnostic mark
            const catalog = Array.isArray(window.FrameworkModuleCatalog)
                ? window.FrameworkModuleCatalog
                : [];

            const discovered = [];

            const discoveredExternal = window.CoreLoader && typeof window.CoreLoader.discoverExternalModules === 'function'
                ? await window.CoreLoader.discoverExternalModules()
                : [];

            const combinedCatalog = [...catalog, ...discoveredExternal.map((module) => ({
                id: module.id,
                name: module.name,
                version: module.version,
                description: module.description || '',
                dependencies: Array.isArray(module.dependencies) ? module.dependencies : [],
                permissions: Array.isArray(module.permissions) ? module.permissions : [],
                permissionDefinitions: Array.isArray(module.permissionDefinitions) ? module.permissionDefinitions : [],
                capabilities: Array.isArray(module.capabilities) ? module.capabilities : [],
                source: module.source || module.modulePath,
                entry: module.source || module.modulePath,
                globalName: module.globalName || module.manifest?.globalName || module.name || module.id,
                access: module.access || module.manifest?.access || null,
                clientAccess: module.clientAccess || module.manifest?.clientAccess || null,
                standalone: module.standalone || module.manifest?.standalone || null,
                database: module.database || module.manifest?.database || null
            }))];

            combinedCatalog.forEach((entry) => {
                if (!entry || typeof entry !== 'object') {
                    return;
                }

                const manifest = window.ModuleInterface && typeof window.ModuleInterface.validateManifest === 'function'
                    ? window.ModuleInterface.validateManifest(entry)
                    : null;

                if (!manifest || registry.has(manifest.id)) {
                    return;
                }

                const globalName = resolveGlobalName(manifest, entry);
                const implementation = typeof window[globalName] === 'object'
                    ? window[globalName]
                    : null;

                if (!implementation) {
                    return;
                }

                const module = {
                    ...implementation,
                    id: implementation.id || manifest.id,
                    name: implementation.name || manifest.name,
                    displayName: implementation.displayName || manifest.displayName || implementation.name || manifest.name,
                    version: implementation.version || manifest.version,
                    type: implementation.type || manifest.type || 'module',
                    description: implementation.description || manifest.description,
                    manifest,
                    admin: implementation.admin || manifest.admin || null,
                    dependencies: Array.isArray(implementation.dependencies)
                        ? [...implementation.dependencies]
                        : [...manifest.dependencies],
                    permissions: Array.isArray(implementation.permissions)
                        ? [...implementation.permissions]
                        : [...manifest.permissions],
                    permissionDefinitions: Array.isArray(implementation.permissionDefinitions)
                        ? [...implementation.permissionDefinitions]
                        : [...manifest.permissionDefinitions],
                    capabilities: Array.isArray(implementation.capabilities)
                        ? [...implementation.capabilities]
                        : [...manifest.capabilities],
                    access: implementation.access || manifest.access || null,
                    clientAccess: manifest.clientAccess || implementation.clientAccess || null,
                    standalone: implementation.standalone || manifest.standalone || null,
                    database: implementation.database || manifest.database || null,
                    status: implementation.status || manifest.status || 'inactive',
                    active: !!implementation.active,
                    enabled: !!implementation.enabled
                };

                registry.set(module.id, module);
                discovered.push(module);
            });

            mark('module-registry-discover-end'); // TEMPORARY diagnostic mark
            return discovered;
        }
    };

    window.ModuleRegistry = Object.freeze(ModuleRegistry);
})();

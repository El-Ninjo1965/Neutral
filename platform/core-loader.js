/*
 * Core Loader
 * Version: 1.0
 *
 * Lädt und prüft die definierte Core-Infrastruktur.
 * Die technische Modulverwaltung liegt im Module Manager und
 * in der Module Registry; dieser Loader führt keine Fachmodule.
 */

(() => {
    'use strict';

    const defaultFrameworkCatalog = Object.freeze([
        {
            id: 'core-user',
            name: 'Core User',
            version: '1.0.0',
            type: 'framework',
            description: 'Framework identity, session and permission layer.',
            dependencies: [],
            permissions: ['framework:read'],
            capabilities: ['identity', 'session'],
            globalName: 'UserModule',
            source: 'platform/core-user.js'
        },
        {
            id: 'core-admin',
            name: 'Core Admin',
            version: '1.0.0',
            type: 'framework',
            description: 'Framework administration and health diagnostics.',
            dependencies: [],
            permissions: ['framework:read', 'system:view'],
            capabilities: ['diagnostics', 'health-check'],
            globalName: 'AdminModule',
            source: 'platform/core-admin.js'
        },
        {
            id: 'core-i18n',
            name: 'Core i18n',
            version: '1.0.0',
            type: 'framework',
            description: 'Framework localization and locale management.',
            dependencies: [],
            permissions: ['framework:read'],
            capabilities: ['localization'],
            globalName: 'I18nModule',
            source: 'platform/core-i18n.js'
        }
    ]);

    const getCurrentAppRoot = () => {
        if (typeof window === 'undefined' || !window.location || !window.location.pathname) {
            return '/';
        }

        const trimmedPath = window.location.pathname.replace(/\/+$/, '');
        if (!trimmedPath || trimmedPath === '/') {
            return '/';
        }

        const segments = trimmedPath.split('/').filter(Boolean);
        const webrootIndex = segments.lastIndexOf('webroot');
        if (webrootIndex > 0) {
            return `/${segments.slice(0, webrootIndex).join('/')}`;
        }

        const lastSegment = segments[segments.length - 1] || '';
        if (lastSegment.includes('.') || lastSegment === 'app') {
            return `/${segments.slice(0, -1).join('/')}`;
        }

        return `/${segments.join('/')}`;
    };

    const toAbsolutePath = (basePath, candidate) => {
        if (!candidate) {
            return null;
        }

        if (/^(https?:)?\/\//i.test(candidate)) {
            return candidate;
        }

        if (candidate.startsWith('/')) {
            return candidate;
        }

        const normalizedBase = (typeof basePath === 'string' && basePath.trim()) ? basePath.trim() : '/';
        const resolvedBase = /^(https?:)?\/\//i.test(normalizedBase)
            ? normalizedBase
            : (() => {
                const baseDirectory = normalizedBase.startsWith('/')
                    ? normalizedBase
                    : `${getCurrentAppRoot().replace(/\/$/, '')}/${normalizedBase.replace(/^\.\//, '')}`;
                return baseDirectory.endsWith('/') ? baseDirectory : `${baseDirectory}/`;
            })();

        if (typeof window !== 'undefined' && window.location && window.location.origin) {
            const baseUrl = /^(https?:)?\/\//i.test(resolvedBase)
                ? resolvedBase
                : `${window.location.origin}${resolvedBase.startsWith('/') ? resolvedBase : `/${resolvedBase}`}`;
            const safeBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
            const resolved = new URL(candidate.replace(/^\.\//, ''), safeBaseUrl);
            return resolved.pathname + resolved.search;
        }

        const plainBase = resolvedBase.endsWith('/') ? resolvedBase : `${resolvedBase}/`;
        return `${plainBase.replace(/\/$/, '')}/${candidate.replace(/^\.\//, '')}`;
    };

    const readTextFile = async (filePath) => {
        if (typeof require === 'function' && typeof process !== 'undefined') {
            const fs = require('fs');
            const path = require('path');
            const normalized = path.resolve(filePath);

            if (!fs.existsSync(normalized)) {
                return null;
            }

            return fs.readFileSync(normalized, 'utf8');
        }

        if (typeof fetch === 'function') {
            const absolutePath = toAbsolutePath('/', filePath);
            const response = await fetch(absolutePath, { cache: 'no-store' });

            if (!response.ok) {
                return null;
            }

            return response.text();
        }

        return null;
    };

    const readJsonFile = async (filePath) => {
        if (typeof require === 'function' && typeof process !== 'undefined') {
            const fs = require('fs');
            const path = require('path');
            const normalized = path.resolve(filePath);

            if (!fs.existsSync(normalized)) {
                return null;
            }

            try {
                return JSON.parse(fs.readFileSync(normalized, 'utf8'));
            } catch (error) {
                return null;
            }
        }

        const text = await readTextFile(filePath);

        if (!text) {
            return null;
        }

        try {
            return JSON.parse(text);
        } catch (error) {
            return null;
        }
    };

    const readModuleCatalog = async (catalogPath) => {
        if (typeof fetch !== 'function') {
            return [];
        }

        try {
            const response = await fetch(catalogPath, { cache: 'no-store' });

            if (!response.ok) {
                return [];
            }

            const payload = await response.json();
            const wrappedData = payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object'
                ? payload.data
                : null;
            const modules = Array.isArray(payload)
                ? payload
                : Array.isArray(payload.modules)
                    ? payload.modules
                    : Array.isArray(wrappedData && wrappedData.modules)
                        ? wrappedData.modules
                    : [];

            return modules.filter((entry) => entry && typeof entry === 'object');
        } catch (error) {
            return [];
        }
    };

    const resolveRuntimeApiBase = () => {
        const configured = typeof window !== 'undefined' && window.ConfigManager && typeof window.ConfigManager.get === 'function'
            ? window.ConfigManager.get('api', {})
            : {};
        const configuredBase = configured && typeof configured.baseUrl === 'string'
            ? configured.baseUrl.trim()
            : '';
        if (configuredBase) {
            return configuredBase.replace(/\/+$/, '');
        }

        if (typeof window === 'undefined' || !window.location) {
            return '/api';
        }

        const runtimeOrigin = window.location.origin && window.location.origin !== 'null'
            ? window.location.origin.replace(/\/+$/, '')
            : '';
        const pathname = typeof window.location.pathname === 'string'
            ? window.location.pathname
            : '/';
        const basePath = pathname.endsWith('/')
            ? pathname.replace(/\/+$/, '')
            : pathname.replace(/\/[^/]*$/, '');
        const normalizedBasePath = (!basePath || basePath === '/')
            ? ''
            : basePath.replace(/\/+$/, '');

        return `${runtimeOrigin}${normalizedBasePath}/api`;
    };

    const normalizeModuleKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const resolveModuleImplementation = (manifest) => {
        const candidates = [
            manifest && manifest.globalName,
            manifest && manifest.name,
            manifest && manifest.id
        ].filter((value) => typeof value === 'string' && value.trim());

        for (const candidate of candidates) {
            if (window[candidate]) {
                return window[candidate];
            }
        }

        const targetKey = normalizeModuleKey(manifest && manifest.id);
        if (!targetKey) {
            return null;
        }

        const keys = Object.keys(window);
        const exactKey = keys.find((key) => normalizeModuleKey(key) === targetKey);
        if (exactKey && window[exactKey]) {
            return window[exactKey];
        }

        const fuzzyKey = keys.find((key) => /^([A-Z].*)$/.test(key) && normalizeModuleKey(key).includes(targetKey));
        if (fuzzyKey && window[fuzzyKey]) {
            return window[fuzzyKey];
        }

        return null;
    };

    const evaluateModuleScript = (scriptText) => {
        if (!scriptText || typeof scriptText !== 'string') {
            return null;
        }

        try {
            const executor = new Function(scriptText);
            executor();
            return true;
        } catch (error) {
            if (window && window.CoreErrorHandler) {
                window.CoreErrorHandler.handle(error, {
                    type: 'module-script-eval',
                    scriptText: scriptText.slice(0, 120)
                });
            }
            return false;
        }
    };

    const CoreLoader = {
        initialized: false,

        getDefaultFrameworkCatalog() {
            return [...defaultFrameworkCatalog];
        },

        loadModuleManifest(moduleRootPath, candidateNames = ['module.json', 'manifest.json']) {
            const candidates = candidateNames
                .map((fileName) => toAbsolutePath(moduleRootPath, fileName))
                .filter(Boolean);

            return (async () => {
                for (const candidate of candidates) {
                    const manifest = await readJsonFile(candidate);
                    if (manifest) {
                        return {
                            ...manifest,
                            modulePath: moduleRootPath,
                            manifestPath: candidate
                        };
                    }
                }

                return null;
            })();
        },

        async loadModuleFromManifest(moduleRootPath, manifest, entryOverride = null) {
            const normalizedManifest = manifest && typeof manifest === 'object' ? manifest : null;

            if (!normalizedManifest || !normalizedManifest.id) {
                return null;
            }

            const entryName = entryOverride || normalizedManifest.entry || normalizedManifest.main || 'index.js';
            const entryPath = toAbsolutePath(moduleRootPath, entryName);
            const scriptText = await readTextFile(entryPath);

            if (!scriptText) {
                return null;
            }

            evaluateModuleScript(scriptText);

            const implementation = resolveModuleImplementation(normalizedManifest);

            if (!implementation) {
                return null;
            }

            return {
                ...implementation,
                id: implementation.id || normalizedManifest.id,
                name: implementation.name || normalizedManifest.name || normalizedManifest.id,
                version: implementation.version || normalizedManifest.version || '1.0.0',
                description: implementation.description || normalizedManifest.description || '',
                globalName: implementation.globalName || normalizedManifest.globalName || null,
                manifest: normalizedManifest,
                modulePath: moduleRootPath,
                source: entryPath
            };
        },

        async discoverExternalModules(basePath = 'app/modules') {
            const rootPath = (typeof basePath === 'string' && basePath.trim()) ? basePath.trim() : 'app/modules';
            const discovered = [];
            const seenModuleKeys = new Set();

            const markModuleSeen = (entry) => {
                const moduleKey = normalizeModuleKey(
                    entry && (entry.id || entry.globalName || entry.name || entry.modulePath)
                );

                if (!moduleKey) {
                    return false;
                }

                if (seenModuleKeys.has(moduleKey)) {
                    return true;
                }

                seenModuleKeys.add(moduleKey);
                return false;
            };

            if (typeof require === 'function' && typeof process !== 'undefined') {
                const fs = require('fs');
                const path = require('path');
                const rootDirectory = path.resolve(rootPath);

                if (!fs.existsSync(rootDirectory)) {
                    return discovered;
                }

                const entries = fs.readdirSync(rootDirectory, { withFileTypes: true });

                for (const entry of entries) {
                    if (!entry.isDirectory()) {
                        continue;
                    }

                    const moduleDirectory = path.join(rootDirectory, entry.name);
                    const manifest = await this.loadModuleManifest(moduleDirectory);

                    if (!manifest) {
                        continue;
                    }

                    if (markModuleSeen(manifest)) {
                        continue;
                    }

                    const loaded = await this.loadModuleFromManifest(moduleDirectory, manifest);
                    if (loaded) {
                        discovered.push(loaded);
                    }
                }

                return discovered;
            }

            const apiCatalog = await readModuleCatalog(`${resolveRuntimeApiBase()}/modules`);
            const externalCatalog = Array.isArray(window.ExternalModuleCatalog)
                ? window.ExternalModuleCatalog
                : [];
            const combinedCatalog = [...apiCatalog, ...externalCatalog];

            for (const entry of combinedCatalog) {
                if (!entry || typeof entry !== 'object') {
                    continue;
                }

                const manifest = window.ModuleInterface && typeof window.ModuleInterface.validateManifest === 'function'
                    ? window.ModuleInterface.validateManifest(entry)
                    : null;

                if (!manifest) {
                    continue;
                }

                if (markModuleSeen(manifest)) {
                    continue;
                }

                const loaded = await this.loadModuleFromManifest(
                    entry.moduleUrl || entry.modulePath || rootPath,
                    manifest,
                    entry.entryUrl || entry.entry || manifest.entry || manifest.main || null
                );

                if (loaded) {
                    const isInstalled = entry.installed === true || entry.registered === true;
                    const isActive = entry.active === true || entry.enabled === true || String(entry.status || '').toLowerCase() === 'active' || String(entry.status || '').toLowerCase() === 'enabled';
                    const normalizedStatus = typeof entry.status === 'string' && entry.status.trim()
                        ? entry.status.trim().toLowerCase()
                        : (isActive ? 'active' : (isInstalled ? 'installed' : 'available'));
                    const lifecycleState = typeof entry.lifecycleState === 'string' && entry.lifecycleState.trim()
                        ? entry.lifecycleState.trim().toUpperCase()
                        : (isActive ? 'ACTIVE' : (isInstalled ? 'INACTIVE' : 'DISCOVERED'));
                    const navigation = entry.navigation && typeof entry.navigation === 'object'
                        ? entry.navigation
                        : {};

                    discovered.push({
                        ...loaded,
                        status: normalizedStatus,
                        lifecycleState,
                        active: isActive,
                        enabled: isActive,
                        registered: isInstalled,
                        installed: isInstalled,
                        available: entry.available !== false,
                        disabled: entry.disabled === true || (isInstalled && !isActive),
                        updateAvailable: entry.updateAvailable === true,
                        state: typeof entry.state === 'string' && entry.state.trim()
                            ? entry.state.trim().toLowerCase()
                            : (isActive ? 'active' : (isInstalled ? 'disabled' : 'available')),
                        installedVersion: typeof entry.installedVersion === 'string' && entry.installedVersion.trim()
                            ? entry.installedVersion.trim()
                            : null,
                        moduleUrl: entry.moduleUrl || loaded.moduleUrl || null,
                        entryUrl: entry.entryUrl || loaded.entryUrl || null,
                        manifestUrl: entry.manifestUrl || loaded.manifestUrl || null,
                        navigation: {
                            enabled: typeof navigation.enabled === 'boolean' ? navigation.enabled : true,
                            label: typeof navigation.label === 'string' && navigation.label.trim()
                                ? navigation.label.trim()
                                : (entry.displayName || entry.name || loaded.displayName || loaded.name || loaded.id)
                        }
                    });
                }
            }

            const manifestIndexCandidates = [
                `${rootPath}/modules.json`,
                `${rootPath}/index.json`,
                `${rootPath}/manifest.json`
            ];

            for (const manifestUrl of manifestIndexCandidates) {
                const manifestList = await readJsonFile(manifestUrl);

                if (!manifestList) {
                    continue;
                }

                const list = Array.isArray(manifestList)
                    ? manifestList
                    : Array.isArray(manifestList.modules)
                        ? manifestList.modules
                        : [];

                for (const entry of list) {
                    const manifest = window.ModuleInterface && typeof window.ModuleInterface.validateManifest === 'function'
                        ? window.ModuleInterface.validateManifest(entry)
                        : null;

                    if (!manifest) {
                        continue;
                    }

                    if (markModuleSeen(manifest)) {
                        continue;
                    }

                    const moduleRoot = entry.modulePath || `${rootPath}/${manifest.id}`;
                    const loaded = await this.loadModuleFromManifest(moduleRoot, manifest, entry.entry || manifest.entry || manifest.main || null);

                    if (loaded) {
                        discovered.push(loaded);
                    }
                }
            }

            return discovered;
        },

        init() {
            if (this.initialized) {
                return true;
            }

            const requiredComponents = [
                'Core',
                'ModuleManager',
                'ModuleRegistry',
                'ModuleInterface',
                'ErrorLog',
                'CoreConfig',
                'CoreContext',
                'CoreState',
                'CoreEventBus',
                'CoreLifecycle',
                'CoreAuth',
                'CoreAccess',
                'CoreAudit',
                'CoreEventRing'
            ];

            const missingComponents = requiredComponents.filter(
                (component) => !window[component]
            );

            if (missingComponents.length > 0) {
                return false;
            }

            if (!Array.isArray(window.FrameworkModuleCatalog)) {
                window.FrameworkModuleCatalog = this.getDefaultFrameworkCatalog();
            }

            this.initialized = true;

            if (window.Core && window.Core.emit) {
                window.Core.emit('core:ready', {
                    version: window.CoreConfig && window.CoreConfig.core
                        ? window.CoreConfig.core.version
                        : 'unknown'
                });
            }

            return true;
        }
    };

    window.CoreLoader = CoreLoader;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            CoreLoader.init();
        });
    }
})();

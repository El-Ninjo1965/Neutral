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
            source: 'Web-App/core/core-user.js'
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
            source: 'Web-App/core/core-admin.js'
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
            source: 'Web-App/core/core-i18n.js'
        }
    ]);

    const ANONYMOUS_CATALOG_CACHE_PREFIX = 'neutral.module-catalog.anonymous.v1:';

    const anonymousCatalogCacheKey = () => {
        const basePath = window.NeutralPublicPath && typeof window.NeutralPublicPath.base === 'function'
            ? window.NeutralPublicPath.base()
            : '';
        return `${ANONYMOUS_CATALOG_CACHE_PREFIX}${encodeURIComponent(String(basePath || '/'))}`;
    };

    const normalizeCatalogEntries = (modules, mode) => {
        if (!Array.isArray(modules) || !['anonymous', 'authenticated'].includes(mode)) {
            return [];
        }

        return modules.filter((entry) => {
            if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string' || !entry.id.trim()) {
                return false;
            }
            const access = entry.clientAccess;
            return !!access
                && typeof access === 'object'
                && access.mode === mode
                && typeof access.canView === 'boolean'
                && typeof access.canUse === 'boolean'
                && access.canView === true;
        });
    };

    const readAnonymousCatalogCache = () => {
        if (typeof localStorage === 'undefined') {
            return [];
        }
        try {
            const raw = localStorage.getItem(anonymousCatalogCacheKey());
            const cached = raw ? JSON.parse(raw) : null;
            if (!cached || cached.schemaVersion !== 1 || cached.mode !== 'anonymous') {
                return [];
            }
            return normalizeCatalogEntries(cached.modules, 'anonymous');
        } catch (error) {
            return [];
        }
    };

    const writeAnonymousCatalogCache = (modules) => {
        if (typeof localStorage === 'undefined') {
            return;
        }
        try {
            localStorage.setItem(anonymousCatalogCacheKey(), JSON.stringify({
                schemaVersion: 1,
                mode: 'anonymous',
                modules
            }));
        } catch (error) {
            // Restricted storage must not prevent online module discovery.
        }
    };

    const getCurrentAppRoot = () => {
        if (typeof window === 'undefined' || !window.location || !window.location.pathname) {
            return '/';
        }

        const trimmedPath = window.location.pathname.replace(/\/+$/, '');
        if (!trimmedPath || trimmedPath === '/') {
            return '/';
        }

        const segments = trimmedPath.split('/').filter(Boolean);
        const publicIndex = segments.lastIndexOf('public');
        if (publicIndex > 0) {
            return `/${segments.slice(0, publicIndex).join('/')}`;
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

        if (typeof basePath === 'string' && /^[A-Za-z]:[\\/]/.test(basePath)) {
            const separator = basePath.includes('\\') ? '\\' : '/';
            return `${basePath.replace(/[\\/]+$/, '')}${separator}${candidate.replace(/^[\\/]+/, '')}`;
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

    // ── Local-first catalog hydration ─────────────────────────────────────────
    // A previously cached anonymous catalog is a valid last-known-good state.
    // Warmstart must hydrate from it immediately; the remote catalog is then
    // reconciled in the background. Security contract: only anonymous catalogs
    // are ever cached, authenticated responses never persist as fallback.
    let backgroundCatalogSyncPromise = null;

    const isCatalogRefreshOnline = () => {
        if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
            return navigator.onLine;
        }

        if (window.CoreNetwork && typeof window.CoreNetwork.isOnline === 'function') {
            return !!window.CoreNetwork.isOnline();
        }

        return true;
    };

    const fetchRemoteCatalog = async (catalogPath) => {
        if (!isCatalogRefreshOnline()) {
            return null;
        }

        try {
            const response = await fetch(catalogPath, { cache: 'no-store' });

            if (!response.ok) {
                return null;
            }

            const payload = await response.json();
            const envelope = payload && payload.data && typeof payload.data === 'object'
                ? payload.data
                : payload;
            const mode = envelope && envelope.accessContext && typeof envelope.accessContext.mode === 'string'
                ? envelope.accessContext.mode
                : '';
            const sourceModules = envelope && envelope.modules;
            const modules = normalizeCatalogEntries(sourceModules, mode);
            const catalogIsValid = Array.isArray(sourceModules) && modules.length === sourceModules.length;

            if (mode === 'anonymous' && catalogIsValid) {
                writeAnonymousCatalogCache(modules);
            }

            return catalogIsValid ? modules : null;
        } catch (error) {
            return null;
        }
    };

    const startBackgroundCatalogSync = (catalogPath) => {
        if (!isCatalogRefreshOnline()) {
            return null;
        }

        if (backgroundCatalogSyncPromise) {
            return backgroundCatalogSyncPromise;
        }

        backgroundCatalogSyncPromise = fetchRemoteCatalog(catalogPath)
            .then((modules) => {
                if (Array.isArray(modules) && window.Core && typeof window.Core.emit === 'function') {
                    window.Core.emit('module-catalog:refreshed', { count: modules.length });
                }
                return modules;
            })
            .finally(() => { backgroundCatalogSyncPromise = null; });
        return backgroundCatalogSyncPromise;
    };

    const readModuleCatalog = async (catalogPath) => {
        if (typeof fetch !== 'function') {
            return readAnonymousCatalogCache();
        }

        const cached = readAnonymousCatalogCache();
        if (cached.length > 0) {
            // Warmstart: hydrate from the last known good catalog immediately and
            // reconcile against the server in the background without blocking the UI.
            if (isCatalogRefreshOnline()) {
                startBackgroundCatalogSync(catalogPath);
            }
            return cached;
        }

        if (!isCatalogRefreshOnline()) {
            return [];
        }

        // First run without any local state: the remote catalog is the only source.
        const remote = await fetchRemoteCatalog(catalogPath);
        return remote || [];
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

            if (normalizedManifest.clientAccess) {
                implementation.clientAccess = { ...normalizedManifest.clientAccess };
            }
            for (const property of ['registered', 'active', 'enabled']) {
                if (typeof normalizedManifest[property] === 'boolean') {
                    implementation[property] = normalizedManifest[property];
                }
            }
            for (const property of ['status', 'lifecycleState']) {
                if (typeof normalizedManifest[property] === 'string' && normalizedManifest[property]) {
                    implementation[property] = normalizedManifest[property];
                }
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
                source: entryPath,
                clientAccess: normalizedManifest.clientAccess,
                registered: normalizedManifest.registered,
                status: normalizedManifest.status || implementation.status,
                lifecycleState: normalizedManifest.lifecycleState,
                active: normalizedManifest.active === true,
                enabled: normalizedManifest.enabled === true
            };
        },

        async discoverExternalModules(basePath = null) {
            const defaultBasePath = typeof process !== 'undefined' && process.versions && process.versions.node
                ? 'Web-App/app/modules'
                : window.NeutralPublicPath.join('Web-App/app/modules');
            const rootPath = (typeof basePath === 'string' && basePath.trim()) ? basePath.trim() : defaultBasePath;
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

            const apiCatalog = await readModuleCatalog(window.NeutralPublicPath.api('modules'));
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
                    entry.modulePath || rootPath,
                    manifest,
                    entry.entry || manifest.entry || manifest.main || null
                );

                if (loaded) {
                    discovered.push(loaded);
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

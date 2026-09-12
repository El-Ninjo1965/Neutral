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

    // TEMPORARY diagnostic instrumentation (local-only, non-PII, no telemetry
    // — see WORKFLOW.md). Removed once the offline/online discovery timing
    // has been confirmed on a real device.
    const mark = (name) => {
        if (typeof window !== 'undefined' && window.CorePerformance) window.CorePerformance.mark(name);
    };

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

    const ANONYMOUS_CATALOG_CACHE_PREFIX = 'neutral.module-catalog.public-offline.v1:';

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

    const sanitizePublicOfflineEntries = (modules) => Array.isArray(modules) ? modules.map((entry) => {
        if (!entry || entry.publicOffline !== true || !/^[a-z][a-z0-9-]{1,63}$/.test(String(entry.id || ''))) return null;
        if (!/^\d+\.\d+\.\d+$/.test(String(entry.version || ''))) return null;
        if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(String(entry.entry || '')) || String(entry.entry).includes('..')) return null;
        if (!/^Web-App\/app\/modules\/[a-z0-9-]+$/.test(String(entry.modulePath || ''))) return null;
        if (!/^[A-Za-z][A-Za-z0-9]*$/.test(String(entry.globalName || ''))) return null;
        return {
            id: String(entry.id), name: String(entry.name || entry.id), displayName: String(entry.displayName || entry.name || entry.id),
            version: String(entry.version), type: 'module', entry: String(entry.entry), modulePath: String(entry.modulePath), globalName: String(entry.globalName),
            presentation: { userNavigation: entry.presentation?.userNavigation !== false, adminNavigation: entry.presentation?.adminNavigation !== false, system: entry.presentation?.system === true },
            publicOffline: true, registered: entry.registered === true, active: entry.active === true, enabled: entry.active === true,
            status: entry.active === true ? 'active' : 'inactive', lifecycleState: entry.active === true ? 'ACTIVE' : 'INACTIVE',
            clientAccess: { mode: 'anonymous', canView: entry.active === true, canUse: entry.active === true, navigationVisible: entry.active === true }
        };
    }).filter(Boolean) : [];

    const readStoredPublicOfflineCatalog = () => {
        if (typeof localStorage === 'undefined') {
            return null;
        }
        try {
            const raw = localStorage.getItem(anonymousCatalogCacheKey());
            const cached = raw ? JSON.parse(raw) : null;
            if (!cached || cached.schemaVersion !== 1 || cached.kind !== 'public-offline' || !Array.isArray(cached.modules)) {
                return null;
            }
            const modules = sanitizePublicOfflineEntries(cached.modules);
            return modules.length === cached.modules.length ? modules : null;
        } catch (error) {
            return null;
        }
    };

    const readAnonymousCatalogCache = () => {
        const stored = readStoredPublicOfflineCatalog();
        if (stored !== null) return stored.filter((module) => module.active);
        const seed = window.NeutralPublicOfflineModules;
        if (!seed || seed.schemaVersion !== 1) return [];
        return sanitizePublicOfflineEntries(seed.modules).filter((module) => module.active);
    };

    const writeAnonymousCatalogCache = (modules) => {
        if (typeof localStorage === 'undefined') {
            return;
        }
        try {
            const publicModules = sanitizePublicOfflineEntries(modules.filter((module) => module?.publicOffline === true));
            localStorage.setItem(anonymousCatalogCacheKey(), JSON.stringify({
                schemaVersion: 1,
                kind: 'public-offline',
                modules: publicModules
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
    // A sanitized public/offline activation projection hydrates before first
    // paint. Online catalogs reconcile later; authenticated metadata is never
    // persisted into this public projection.
    let catalogRequestSequence = 0;
    let lastCatalogRequest = null;

    const isCatalogRefreshOnline = () => {
        if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
            return navigator.onLine;
        }

        if (window.CoreNetwork && typeof window.CoreNetwork.isOnline === 'function') {
            return !!window.CoreNetwork.isOnline();
        }

        return true;
    };

    const currentCatalogMode = () => (window.CoreAuth?.currentUser || window.UserModule?.currentUser)
        ? 'authenticated'
        : 'anonymous';

    const fetchRemoteCatalog = async (catalogPath, expectedMode = currentCatalogMode()) => {
        if (!isCatalogRefreshOnline()) {
            mark('fetch-remote-catalog-skipped'); // TEMPORARY diagnostic mark
            throw new Error('Module catalog is unavailable while offline.');
        }

        mark('fetch-remote-catalog-start'); // TEMPORARY diagnostic mark
        const requestId = ++catalogRequestSequence;
        const startedAt = Date.now();
        try {
            const response = await fetch(catalogPath, { cache: 'no-store', credentials: 'same-origin' });

            if (!response.ok) {
                mark('fetch-remote-catalog-end'); // TEMPORARY diagnostic mark
                throw new Error(`Module catalog request failed with HTTP ${response.status}.`);
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

            if (!catalogIsValid) throw new Error('Module catalog response is invalid.');
            if (mode !== expectedMode) throw new Error(`Stale module catalog response (${mode || 'unknown'} while ${expectedMode} was expected).`);

            writeAnonymousCatalogCache(modules);

            mark('fetch-remote-catalog-end'); // TEMPORARY diagnostic mark
            lastCatalogRequest = { requestId, mode, status: response.status, durationMs: Date.now() - startedAt, moduleCount: modules.length };
            return modules;
        } catch (error) {
            lastCatalogRequest = { requestId, mode: expectedMode, status: Number(error?.status || 0), durationMs: Date.now() - startedAt, moduleCount: 0, error: String(error?.message || error) };
            mark('fetch-remote-catalog-end'); // TEMPORARY diagnostic mark
            throw error;
        }
    };

    const readModuleCatalog = async (catalogPath) => {
        mark('read-module-catalog-start'); // TEMPORARY diagnostic mark
        if (typeof fetch !== 'function') {
            mark('read-module-catalog-end'); // TEMPORARY diagnostic mark
            return readAnonymousCatalogCache();
        }

        const mode = currentCatalogMode();
        const cached = mode === 'anonymous' ? readAnonymousCatalogCache() : [];
        if (!isCatalogRefreshOnline()) {
            mark('read-module-catalog-end'); // TEMPORARY diagnostic mark
            return cached;
        }
        try {
            const remote = await fetchRemoteCatalog(catalogPath, mode);
            mark('read-module-catalog-end'); // TEMPORARY diagnostic mark
            return remote;
        } catch (error) {
            mark('read-module-catalog-end'); // TEMPORARY diagnostic mark
            if (mode === 'anonymous' && cached.length) return cached;
            throw error;
        }
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

        getPublicOfflineModules() {
            return readAnonymousCatalogCache().map((projection) => {
                const implementation = resolveModuleImplementation(projection);
                return implementation ? { ...implementation, ...projection, clientAccess: { mode: 'anonymous', canView: true, canUse: true, navigationVisible: true } } : null;
            }).filter(Boolean);
        },

        syncPublicOfflineCatalog(modules) {
            writeAnonymousCatalogCache(Array.isArray(modules) ? modules : []);
            return this.getPublicOfflineModules();
        },

        syncPublicOfflineModule(module) {
            if (!module || module.publicOffline !== true) return this.getPublicOfflineModules();
            const current = readStoredPublicOfflineCatalog() ?? sanitizePublicOfflineEntries(window.NeutralPublicOfflineModules?.modules || []);
            const next = current.filter((entry) => entry.id !== module.id);
            next.push(module);
            writeAnonymousCatalogCache(next);
            return this.getPublicOfflineModules();
        },

        getCatalogDiagnostics() {
            return lastCatalogRequest ? Object.freeze({ ...lastCatalogRequest }) : null;
        },

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

            mark(`load-module-entry-start-${normalizedManifest.id}`); // TEMPORARY diagnostic mark
            const entryName = entryOverride || normalizedManifest.entry || normalizedManifest.main || 'index.js';
            const entryPath = toAbsolutePath(moduleRootPath, entryName);
            const scriptText = await readTextFile(entryPath);

            if (!scriptText) {
                mark(`load-module-entry-end-${normalizedManifest.id}`); // TEMPORARY diagnostic mark
                return null;
            }

            evaluateModuleScript(scriptText);

            const implementation = resolveModuleImplementation(normalizedManifest);

            if (!implementation) {
                mark(`load-module-entry-end-${normalizedManifest.id}`); // TEMPORARY diagnostic mark
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

            mark(`load-module-entry-end-${normalizedManifest.id}`); // TEMPORARY diagnostic mark
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
            mark('discover-external-modules-start'); // TEMPORARY diagnostic mark
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
                    mark('discover-external-modules-end'); // TEMPORARY diagnostic mark
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

            mark('discover-external-modules-end'); // TEMPORARY diagnostic mark
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

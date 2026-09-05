/*
 * Neutral Service Worker — offline-first app shell.
 *
 * Contract:
 * - Precaches the static app shell (HTML, CSS, core JS) under a versioned cache
 *   name so warm starts and offline restarts work after one successful online
 *   visit.
 * - Cache-first for known static assets, with a background refresh that
 *   replaces the cached copy when the network is available.
 * - Navigation requests: network first, falling back to the cached shell when
 *   offline. The shell is never pinned forever: a successful network response
 *   always updates the cached copy.
 * - NEVER caches non-GET requests, /api/ responses, auth/session endpoints or
 *   anything authenticated — security-critical answers always come from the
 *   network.
 * - Module entry scripts that were successfully fetched once are cached so
 *   locally known modules remain usable offline. No unknown modules are
 *   invented.
 * - On activate, all cache versions other than the current one are removed, so
 *   a deployment never leaves a mixed old-core/new-module state behind.
 *
 * The cache version comes from the deployment stamp injected by the build
 * (self.__NEUTRAL_SW_VERSION_OVERRIDE__ is a test hook only); there is no
 * hardcoded manual version number.
 */
'use strict';

const VERSION = (typeof self !== 'undefined' && self.__NEUTRAL_SW_VERSION_OVERRIDE__)
    || (typeof self !== 'undefined' && self.__NEUTRAL_DEPLOY_STAMP__)
    || 'dev';
const CACHE_NAME = `neutral-shell-v${VERSION}`;

const CORE_SCRIPTS = [
    'core.js', 'core-contracts.js', 'core-performance.js', 'core-event-bus.js',
    'core-error-handler.js', 'error-log.js', 'core-config.js', 'core-context.js',
    'core-lifecycle.js', 'core-state.js', 'core-storage.js', 'module-interface.js',
    'module-registry.js', 'module-manager.js', 'core-loader.js', 'config-manager.js',
    'database-manager.js', 'security.js', 'core-auth.js', 'core-access.js',
    'core-audit.js', 'core-event-ring.js', 'core-user.js', 'core-admin.js',
    'service-manager.js', 'core-network.js', 'core-shutdown.js', 'core-startup.js',
    'core-runtime.js', 'core-entry.js', 'theme-engine.js', 'media-manager.js',
    'local-auth.js', 'app.js'
];

const PUBLIC_SCRIPTS = [
    'public-path.js', 'user-module-access.js', 'user-app.js', 'style.css'
];

const shellUrls = (base) => {
    const normalized = base.endsWith('/') ? base : `${base}/`;
    return [
        normalized,
        `${normalized}index.html`,
        ...CORE_SCRIPTS.map((name) => `${normalized}core/${name}`),
        ...PUBLIC_SCRIPTS.map((name) => `${normalized}${name}`)
    ];
};

const scopeBase = () => {
    const scope = self.registration && self.registration.scope
        ? self.registration.scope
        : self.location.href;
    return scope;
};

const isStaticAsset = (pathname) => (
    /\/core\/[a-z0-9-]+\.js$/.test(pathname)
    || /\/Web-App\/public\/[a-z0-9-]+\.(js|css)$/.test(pathname)
    || /\/(public-path|user-app|user-module-access|style)\.(js|css)$/.test(pathname)
    || /\/Web-App\/app\/modules\/[a-z0-9-]+\/index\.js$/.test(pathname)
);

const shellUrlPaths = () => shellUrls(scopeBase()).map((url) => new URL(url, scopeBase()).pathname);

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(shellUrlPaths()))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(
                names
                    .filter((name) => name.startsWith('neutral-shell-v') && name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            ))
            .then(() => self.clients.claim())
    );
});

const cacheFirstWithRefresh = (cache, request) => cache.match(request.url).then((cached) => {
    const network = fetch(request).then((response) => {
        if (response && response.ok) {
            cache.put(request.url, response.clone());
        }
        return response;
    }).catch(() => null);

    return cached || network.then((response) => response);
});

const networkFirstWithShellFallback = (cache, request) => fetch(request)
    .then((response) => {
        if (response && response.ok) {
            cache.put(request.url, response.clone());
        }
        return response;
    })
    .catch(() => cache.match(request.url)
        .then((cached) => cached || cache.match(new URL('index.html', scopeBase()).pathname)));

self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Security boundary: only idempotent GET requests may ever touch the cache.
    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) {
        return;
    }

    // API, auth, admin and setup endpoints are always network-only: cached
    // answers for security-critical or personalized data are never simulated.
    if (url.pathname.includes('/api/') || /(admin|setup|login)/.test(url.pathname)) {
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            if (request.mode === 'navigate') {
                return networkFirstWithShellFallback(cache, request);
            }
            if (isStaticAsset(url.pathname)) {
                return cacheFirstWithRefresh(cache, request);
            }
            return fetch(request).catch(() => cache.match(request.url));
        })
    );
});

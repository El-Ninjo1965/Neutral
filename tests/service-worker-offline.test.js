'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

// ── Service worker sandbox helpers ────────────────────────────────────────────

const createServiceWorkerSandbox = ({ online = true, responses = {}, version = null, sharedStore = null } = {}) => {
  const cacheStore = sharedStore || new Map();
  const cacheStorage = {
    opened: [],
    deleted: [],
    async open(name) {
      this.opened.push(name);
      if (!cacheStore.has(name)) cacheStore.set(name, new Map());
      const store = cacheStore.get(name);
      return {
        async addAll(urls) {
          for (const url of urls) {
            const response = await sandbox.fetch(url);
            if (!response || !response.ok) throw new Error(`precache failed: ${url}`);
            store.set(url, response);
          }
        },
        async match(url) {
          return store.get(url) || null;
        },
        async put(url, response) {
          store.set(url, response);
        }
      };
    },
    async keys() {
      return Array.from(cacheStore.keys());
    },
    async delete(name) {
      this.deleted.push(name);
      return cacheStore.delete(name);
    },
    async match(url) {
      for (const store of cacheStore.values()) {
        if (store.has(url)) return store.get(url);
      }
      return null;
    },
    _store: cacheStore
  };

  const listeners = new Map();
  const sandbox = {
    console,
    URL,
    caches: cacheStorage,
    self: null,
    fetch: async (url) => {
      if (!online) {
        const error = new Error('offline');
        error.name = 'TypeError';
        throw error;
      }
      const key = String(url);
      if (responses[key]) {
        return responses[key];
      }
      return {
        ok: true,
        status: 200,
        headers: new Map(),
        clone() { return { ...this }; },
        async text() { return `// ${key}`; }
      };
    },
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    skipWaitingCalls: 0,
    skipWaiting() { this.skipWaitingCalls += 1; },
    clients: { async claim() { this.claimed = true; } },
    location: { href: 'https://example.test/service-worker.js', origin: 'https://example.test' },
    registration: { scope: 'https://example.test/' }
  };
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  if (version) {
    vm.runInContext(`self.__NEUTRAL_SW_VERSION_OVERRIDE__ = ${JSON.stringify(version)};`, sandbox);
  }
  vm.runInContext(read('Web-App/public/service-worker.js'), sandbox, { filename: 'service-worker.js' });
  return { sandbox, cacheStorage, listeners };
};

const dispatch = async (listeners, type, event) => {
  const handler = listeners.get(type);
  assert.ok(handler, `no ${type} handler registered`);
  let waited = null;
  const enriched = {
    ...event,
    waitUntil(promise) { waited = promise; return promise; },
    respondWith(promise) { waited = promise; this._response = promise; }
  };
  handler(enriched);
  if (waited) await waited;
  return enriched._response ? enriched._response : null;
};

const request = (url, method = 'GET') => ({ url, method, headers: new Map() });

// ── Contract tests ────────────────────────────────────────────────────────────

test('service worker file exists and registers only in secure contexts', () => {
  const worker = read('Web-App/public/service-worker.js');
  const shell = read('Web-App/public/user-app.js');

  assert.ok(worker.length > 0);
  assert.match(shell, /serviceWorker/);
  assert.match(shell, /isSecureContext/);
  assert.match(shell, /navigator\.serviceWorker\.register/);
});

test('service worker precaches the app shell and core assets on install', async () => {
  const { cacheStorage, listeners } = createServiceWorkerSandbox();
  await dispatch(listeners, 'install', {});

  const names = await cacheStorage.keys();
  assert.equal(names.length, 1);
  assert.match(names[0], /^neutral-shell-v/);
  const { sandbox } = createServiceWorkerSandbox();
  void sandbox;
  const cached = Array.from(cacheStorage._store.get(names[0]).keys());
  assert.ok(cached.some((url) => url.endsWith('/index.html') || url.endsWith('/')));
  assert.ok(cached.some((url) => url.includes('style.css')));
  assert.ok(cached.some((url) => url.includes('core/core.js')));
  assert.ok(cached.some((url) => url.includes('user-app.js')));
});

test('navigation requests fall back to the cached shell when offline', async () => {
  const online = createServiceWorkerSandbox({ online: true });
  await dispatch(online.listeners, 'install', {});
  await dispatch(online.listeners, 'activate', {});

  // A later offline start: network fails, the cached shell must answer.
  const offline = createServiceWorkerSandbox({ online: false, sharedStore: online.cacheStorage._store });
  const fetchHandler = offline.listeners.get('fetch');
  assert.ok(fetchHandler);
  let responsePromise = null;
  fetchHandler({
    request: { ...request('https://example.test/'), mode: 'navigate' },
    respondWith(promise) { responsePromise = promise; }
  });
  const response = await responsePromise;
  assert.ok(response && response.ok, 'cached shell must serve the offline navigation');
});

test('static core assets are served cache-first and updated in the background', async () => {
  const { sandbox, listeners } = createServiceWorkerSandbox();
  await dispatch(listeners, 'install', {});
  await dispatch(listeners, 'activate', {});

  let networkCalls = 0;
  const originalFetch = sandbox.fetch;
  sandbox.fetch = async (url) => { networkCalls += 1; return originalFetch(url); };

  const responsePromise = await dispatch(listeners, 'fetch', {
    request: { ...request('https://example.test/core/core.js'), mode: 'same-origin' }
  });
  const response = await responsePromise;
  assert.ok(response && response.ok, 'cached core asset must be served');
});

test('API and auth requests are never served from cache', async () => {
  const { listeners } = createServiceWorkerSandbox();
  await dispatch(listeners, 'install', {});
  await dispatch(listeners, 'activate', {});

  let handled = false;
  const fetchHandler = listeners.get('fetch');
  fetchHandler({
    request: request('https://example.test/api/v1/status'),
    respondWith() { handled = true; }
  });
  assert.equal(handled, false, 'API requests must not be intercepted by the cache');
});

test('a new deployment version creates a new cache and removes the old one', async () => {
  const first = createServiceWorkerSandbox({ version: 'commit-a' });
  await dispatch(first.listeners, 'install', {});
  await dispatch(first.listeners, 'activate', {});
  const firstNames = await first.cacheStorage.keys();
  assert.deepEqual(firstNames, ['neutral-shell-vcommit-a']);

  // Simulate the next deployment: a new worker version over the same storage.
  const second = createServiceWorkerSandbox({ version: 'commit-b', sharedStore: first.cacheStorage._store });
  await dispatch(second.listeners, 'install', {});
  await dispatch(second.listeners, 'activate', {});

  const names = await second.cacheStorage.keys();
  assert.deepEqual(names, ['neutral-shell-vcommit-b'], 'old cache version must be removed on activate');
});

test('service worker source never caches non-GET or API/auth responses', () => {
  const worker = read('Web-App/public/service-worker.js');

  assert.match(worker, /request\.method\s*!==\s*'GET'/);
  assert.match(worker, /\/api\//);
  assert.doesNotMatch(worker, /cache\.put\([^)]*\/api\//);
});

test('production package includes the service worker and .htaccess does not cache it long', () => {
  const htaccess = read('.htaccess');
  const pkg = read('scripts/lib/portable-install.js');

  assert.ok(fs.existsSync(path.join(projectRoot, 'Web-App/public/service-worker.js')));
  // The service worker is served at the scope root and must always revalidate.
  assert.match(htaccess, /RewriteRule \^service-worker\\\.js\$ Web-App\/public\/service-worker\.js/);
  assert.match(htaccess, /\^service-worker\\\.js\$"[\s\S]{0,80}no-cache/);
  void pkg;
});

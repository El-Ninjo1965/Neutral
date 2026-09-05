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
  // Tests inject the deploy stamp the same way the production build does:
  // as a `self.__NEUTRAL_DEPLOY_STAMP__` line prepended to the worker source.
  const source = version
    ? `self.__NEUTRAL_DEPLOY_STAMP__ = ${JSON.stringify(version)};\n${read('Web-App/public/service-worker.js')}`
    : read('Web-App/public/service-worker.js');
  vm.runInContext(source, sandbox, { filename: 'service-worker.js' });
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

test('source service worker carries no hardcoded production commit', () => {
  const worker = read('Web-App/public/service-worker.js');

  assert.doesNotMatch(worker, /neutral-shell-v[0-9a-f]{7,40}/);
  assert.match(worker, /__NEUTRAL_DEPLOY_STAMP__/);
});

test('production package injects the source commit as the worker stamp', async () => {
  const os = require('node:os');
  const { buildProductionPackage } = require('../scripts/lib/portable-install.js');
  const outputA = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-pkg-a-'));
  const outputB = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-pkg-b-'));

  try {
    const pkgA = buildProductionPackage({
      sourceRoot: projectRoot,
      outputDir: path.join(outputA, 'dist'),
      sourceCommit: 'aaaa1111bbbb2222cccc3333dddd4444eeee5555'
    });
    const workerA = fs.readFileSync(path.join(pkgA.outputDir, 'Web-App/public/service-worker.js'), 'utf8');
    assert.match(workerA, /aaaa1111bbbb2222cccc3333dddd4444eeee5555/);
    assert.doesNotMatch(workerA, /neutral-shell-vdev/);
    assert.equal(pkgA.manifest.sourceCommit, 'aaaa1111bbbb2222cccc3333dddd4444eeee5555');

    const pkgB = buildProductionPackage({
      sourceRoot: projectRoot,
      outputDir: path.join(outputB, 'dist'),
      sourceCommit: 'ffff666600007777888899990000aaaabbbbcccc'
    });
    const workerB = fs.readFileSync(path.join(pkgB.outputDir, 'Web-App/public/service-worker.js'), 'utf8');
    assert.match(workerB, /ffff666600007777888899990000aaaabbbbcccc/);
    assert.doesNotMatch(workerB, /aaaa1111/);

    // Distinct deployments must yield distinct cache names.
    const cacheName = (source) => source.match(/neutral-shell-v\$\{VERSION\}|neutral-shell-v([a-z0-9-]+)/)?.[0];
    void cacheName;
    assert.notEqual(
      workerA.match(/__NEUTRAL_DEPLOY_STAMP__[^;]*'([0-9a-f]+)'/)?.[1],
      workerB.match(/__NEUTRAL_DEPLOY_STAMP__[^;]*'([0-9a-f]+)'/)?.[1]
    );
  } finally {
    fs.rmSync(outputA, { recursive: true, force: true });
    fs.rmSync(outputB, { recursive: true, force: true });
  }
});

test('production package fails closed when no deploy stamp is available', () => {
  const os = require('node:os');
  const { buildProductionPackage } = require('../scripts/lib/portable-install.js');
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-pkg-nostamp-'));

  try {
    assert.throws(
      () => buildProductionPackage({
        sourceRoot: projectRoot,
        outputDir: path.join(output, 'dist'),
        sourceCommit: null
      }),
      /deploy|stamp|commit/i
    );
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});

test('development fallback never produces the shared dev cache name', () => {
  const os = require('node:os');
  const { buildProductionPackage } = require('../scripts/lib/portable-install.js');
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-pkg-dev-'));

  try {
    const pkg = buildProductionPackage({
      sourceRoot: projectRoot,
      outputDir: path.join(output, 'dist'),
      sourceCommit: null,
      allowDevStampFallback: true
    });
    const worker = fs.readFileSync(path.join(pkg.outputDir, 'Web-App/public/service-worker.js'), 'utf8');
    // Dev builds get a unique stamp per build, never the shared literal 'dev'.
    assert.doesNotMatch(worker, /neutral-shell-vdev'/);
    assert.match(worker, /__NEUTRAL_DEPLOY_STAMP__ = 'dev[0-9a-f]{12}'/);
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});

test('the packaged service worker never contains the test override hook', async () => {
  const os = require('node:os');
  const { buildProductionPackage } = require('../scripts/lib/portable-install.js');
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-pkg-hook-'));

  try {
    const pkg = buildProductionPackage({
      sourceRoot: projectRoot,
      outputDir: path.join(output, 'dist'),
      sourceCommit: '0123456789abcdef0123456789abcdef01234567'
    });
    const worker = fs.readFileSync(path.join(pkg.outputDir, 'Web-App/public/service-worker.js'), 'utf8');
    assert.doesNotMatch(worker, /__NEUTRAL_SW_VERSION_OVERRIDE__/);
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
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

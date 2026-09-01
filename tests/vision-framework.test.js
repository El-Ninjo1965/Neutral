const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const loadScript = (context, scriptPath) => {
  const source = fs.readFileSync(scriptPath, 'utf8');
  vm.runInContext(source, context, { filename: scriptPath });
};

test('theme engine supports neutral and app-specific themes', () => {
  const styles = new Map();
  const documentStub = {
    body: {
      dataset: {},
      setAttribute(name, value) {
        this[name] = value;
      }
    },
    documentElement: {
      style: {
        setProperty(name, value) {
          styles.set(name, value);
        }
      }
    }
  };

  const eventLog = [];
  const windowStub = {
    document: documentStub,
    Core: { emit() {} },
    dispatchEvent(event) {
      eventLog.push(event.type);
      return true;
    },
    CustomEvent: class CustomEvent {
      constructor(type, detail) {
        this.type = type;
        this.detail = detail || {};
      }
    }
  };
  windowStub.window = windowStub;

  const context = vm.createContext(windowStub);
  loadScript(context, path.resolve(__dirname, '../Web-App/core/theme-engine.js'));

  const neutralTheme = context.window.ThemeEngine.getCurrentTheme();
  assert.equal(neutralTheme.id, 'neutral-theme');

  const customTheme = context.window.ThemeEngine.registerTheme({
    id: 'custom-theme',
    name: 'Custom Theme',
    config: { accent: '#2d6a4f', background: '#edf5ee' }
  });

  assert.equal(customTheme.id, 'custom-theme');

  context.window.ThemeEngine.activateTheme('custom-theme');
  assert.equal(documentStub.body.dataset.theme, 'custom-theme');
  assert.equal(styles.get('--accent'), '#2d6a4f');
  assert.equal(eventLog.includes('theme:changed'), true);
});

test('media manager optimizes supported image uploads', async () => {
  const createObjectURL = () => `blob:${Math.random()}`;
  const revokeObjectURL = () => {};
  class MockImage {
    constructor() {
      this.width = 2000;
      this.height = 1500;
      this._src = '';
    }

    set src(value) {
      this._src = value;
      queueMicrotask(() => {
        if (typeof this.onload === 'function') {
          this.onload();
        }
      });
    }

    get src() {
      return this._src;
    }
  }

  const canvas = {
    width: 0,
    height: 0,
    getContext() {
      return {
        drawImage() {}
      };
    },
    toBlob(callback) {
      callback(new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/jpeg' }));
    }
  };

  const documentStub = {
    createElement() {
      return canvas;
    }
  };

  const windowStub = {
    document: documentStub,
    Core: { emit() {} },
    Image: MockImage,
    URL: { createObjectURL, revokeObjectURL },
    File
  };
  windowStub.window = windowStub;

  const context = vm.createContext(windowStub);
  loadScript(context, path.resolve(__dirname, '../Web-App/core/media-manager.js'));

  const result = await context.window.MediaManager.optimizeImage({
    name: 'sample.jpg',
    type: 'image/jpeg',
    size: 2_500_000
  }, {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.7,
    maxBytes: 2_000_000
  });

  assert.equal(result.ok, true);
  assert.equal(result.optimized, true);
  assert.equal(result.dimensions.width <= 800, true);
  assert.equal(result.dimensions.height <= 800, true);
});

test('developer setup persists a hashed local password for login and admin access', async () => {
  const mkStorage = () => {
    const map = new Map();
    return {
      getItem(key) { return map.has(key) ? map.get(key) : null; },
      setItem(key, value) { map.set(key, String(value)); },
      removeItem(key) { map.delete(key); }
    };
  };

  const localStorage = mkStorage();
  const windowStub = {
    localStorage,
    Core: { emit() {} },
    CoreAudit: { record() {} },
    CoreAccess: {
      can() { return { ok: true }; },
      hasPermission(user, permission) {
        return !!user && Array.isArray(user.permissions) && user.permissions.includes(permission);
      }
    },
    DatabaseManager: {
      async clear() {},
      async save() {},
      async getAll() { return []; }
    },
    ConfigManager: {
      configs: new Map(),
      init() {
        this.set('bootstrap', {
          enabled: true,
          developerUsername: 'Developer',
          developerDisplayId: 'USR-000001',
          createOnInit: true,
          passwordRequired: true,
          passwordSource: 'local-offline',
          developerPasswordHash: ''
        });
      },
      set(key, value) { this.configs.set(key, value); },
      get(key, fallback) { return this.configs.has(key) ? this.configs.get(key) : fallback; }
    }
  };
  windowStub.window = windowStub;

  const context = vm.createContext(windowStub);
  loadScript(context, path.resolve(__dirname, '../Web-App/core/config-manager.js'));
  loadScript(context, path.resolve(__dirname, '../Web-App/core/core-auth.js'));
  loadScript(context, path.resolve(__dirname, '../Web-App/core/core-user.js'));
  loadScript(context, path.resolve(__dirname, '../Web-App/core/local-auth.js'));

  windowStub.ConfigManager.init();

  const setupResult = await context.window.LocalAuth.setupDeveloper({
    username: 'Developer',
    password: 'Dev-password-42!'
  });

  assert.equal(setupResult.ok, true);

  const bootstrapConfig = context.window.CoreAuth.resolveBootstrapConfig();
  assert.equal(typeof bootstrapConfig.passwordHash === 'string' && bootstrapConfig.passwordHash.length > 0, true);
  assert.equal(context.window.ConfigManager.get('bootstrap').developerPasswordHash, bootstrapConfig.passwordHash);

  const persistedState = JSON.parse(localStorage.getItem('neutral.local.auth.v1'));
  assert.equal(typeof persistedState.passwordHash === 'string' && persistedState.passwordHash.length > 0, true);
  assert.equal(localStorage.getItem('platform.local.auth.developerPassword'), null);
  assert.equal(localStorage.getItem('core.bootstrap.developerPassword'), null);

  const reloadedWindow = {
    localStorage,
    Core: { emit() {} },
    CoreAudit: { record() {} },
    CoreAccess: {
      can() { return { ok: true }; },
      hasPermission(user, permission) {
        return !!user && Array.isArray(user.permissions) && user.permissions.includes(permission);
      }
    },
    DatabaseManager: {
      async clear() {},
      async save() {},
      async getAll() { return []; }
    },
    ConfigManager: {
      configs: new Map(),
      init() {
        const raw = localStorage.getItem('neutral.local.auth.v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          this.set('bootstrap', {
            enabled: true,
            developerUsername: parsed.username || 'Developer',
            developerDisplayId: 'USR-000001',
            createOnInit: true,
            passwordRequired: true,
            passwordSource: 'local-offline',
            developerPasswordHash: parsed.passwordHash || ''
          });
        }
      },
      set(key, value) { this.configs.set(key, value); },
      get(key, fallback) { return this.configs.has(key) ? this.configs.get(key) : fallback; }
    }
  };
  reloadedWindow.window = reloadedWindow;

  const reloadedContext = vm.createContext(reloadedWindow);
  loadScript(reloadedContext, path.resolve(__dirname, '../Web-App/core/config-manager.js'));
  loadScript(reloadedContext, path.resolve(__dirname, '../Web-App/core/core-auth.js'));
  loadScript(reloadedContext, path.resolve(__dirname, '../Web-App/core/core-user.js'));
  loadScript(reloadedContext, path.resolve(__dirname, '../Web-App/core/local-auth.js'));
  reloadedWindow.ConfigManager.init();

  const loginResult = await reloadedContext.window.LocalAuth.login({
    username: 'Developer',
    password: 'Dev-password-42!'
  });

  assert.equal(loginResult.ok, true);
  assert.equal(reloadedContext.window.CoreAuth.getCurrentUser().username, 'Developer');
  assert.ok(reloadedContext.window.CoreAuth.getCurrentUser().roles.includes('developer'));
});

test('app config exposes a single neutral app name', () => {
  const windowStub = { window: null, ConfigManager: null };
  windowStub.window = windowStub;
  const context = vm.createContext(windowStub);
  loadScript(context, path.resolve(__dirname, '../Web-App/core/config-manager.js'));
  context.window.ConfigManager.init();

  const appName = context.window.ConfigManager.get('app').name;
  assert.equal(appName, 'Neutral Platform');
  assert.equal(context.window.ConfigManager.get('bootstrap').developerUsername, 'Developer');
  assert.equal(typeof context.window.ConfigManager.get('bootstrap').developerPasswordHash, 'string');
});

test('user shell keeps shared navigation while admin shell stays single-column and sidebar-free', () => {
  const userHtml = fs.readFileSync(path.resolve(__dirname, '../Web-App/public/index.html'), 'utf8');
  const adminPhp = fs.readFileSync(path.resolve(__dirname, '../Server/php/views/admin-ui.php'), 'utf8');
  const adminPhpEntry = fs.readFileSync(path.resolve(__dirname, '../Server/public/admin.php'), 'utf8');

  assert.match(userHtml, /id="userAppNav"/);
  assert.match(userHtml, /id="userAppActions"/);
  assert.doesNotMatch(adminPhp, /shared-shell-sidebar|appModuleNav|userMenu/);
  assert.match(adminPhp, /id="topbarTitle"/);
  assert.match(adminPhp, /id="mainContent"/);
  assert.match(adminPhpEntry, /admin.php|admin-ui/);
});

test('two-component layout renders the shell before background startup and discovers modules once', () => {
  const projectRoot = path.resolve(__dirname, '..');
  for (const directory of ['Web-App', 'Server']) {
    assert.equal(fs.statSync(path.join(projectRoot, directory)).isDirectory(), true);
  }
  const rootEntries = fs.readdirSync(projectRoot);
  for (const obsoleteDirectory of ['app', 'apps', 'core', 'platform', 'webroot', 'server']) {
    assert.equal(rootEntries.includes(obsoleteDirectory), false);
  }

  const userApp = fs.readFileSync(path.join(projectRoot, 'Web-App/public/user-app.js'), 'utf8');
  const startup = fs.readFileSync(path.join(projectRoot, 'Web-App/core/core-startup.js'), 'utf8');
  assert.match(userApp, /renderApp\(\);[\s\S]*startBackgroundInitialization\(\);/);
  assert.doesNotMatch(userApp, /ModuleManager\.discoverModules/);
  assert.equal((startup.match(/ModuleManager\.discoverModules/g) || []).length, 2);
  assert.match(startup, /startBackground\(\)/);
  assert.match(startup, /mark\('storage-ready'\)/);
});

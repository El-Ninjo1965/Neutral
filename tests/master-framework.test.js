const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const Framework = require('../Web-App/core/master-framework');
const ServerBootstrap = require('../Server/node/bootstrap/server');
const projectRoot = path.resolve(__dirname, '..');
const gpsReferenceAvailable = fs.existsSync(path.join(projectRoot, 'Web-App/app/modules/gps/module.json'));

const readCurrentAppManifest = () => {
  const appsRoot = path.join(projectRoot, 'Web-App/apps');
  const manifests = fs.readdirSync(appsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(appsRoot, entry.name, 'app-info.json'))
    .filter((manifestPath) => fs.existsSync(manifestPath));
  assert.equal(manifests.length, 1);
  return JSON.parse(fs.readFileSync(manifests[0], 'utf8'));
};

const cleanupRuntimeState = () => {
  Framework.setupState = null;
  Framework.adminState = null;

  const runtimeDir = path.resolve(__dirname, '../Server/node/runtime');
  for (const filename of ['setup-state.json', 'admin-state.json']) {
    const filePath = path.join(runtimeDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Also clean up config directory (used by persistence service)
  const configDir = path.resolve(__dirname, '../Server/config');
  if (fs.existsSync(configDir)) {
    const configFiles = ['setup-state.json', 'admin-users.json', 'admin-roles.json', 'admin-settings.json', 'audit-log.json'];
    for (const filename of configFiles) {
      const filePath = path.join(configDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
};

const loadScriptIntoContext = (context, filePath) => {
  const source = fs.readFileSync(filePath, 'utf8');
  vm.runInContext(source, context, { filename: filePath });
};

const createGpsModuleContext = ({ permissionState = 'granted', currentUser } = {}) => {
  const geolocationState = {
    permissionState,
    watchCalls: 0,
    activeWatches: new Map(),
    lastWatchOptions: null,
    lastCurrentPositionOptions: null,
    nextCurrentPositionError: null,
    position: {
      coords: {
        latitude: 52.52,
        longitude: 13.405,
        accuracy: 7.5
      },
      timestamp: 1710000000000
    }
  };

  const sandbox = {
    window: null,
    document: {
      readyState: 'complete',
      addEventListener() {}
    },
    navigator: {
      permissions: {
        query: () => ({ state: geolocationState.permissionState })
      },
      geolocation: {
        watchPosition(success, error, options) {
          const watchId = ++geolocationState.watchCalls;
          geolocationState.lastWatchOptions = options || null;
          geolocationState.activeWatches.set(watchId, { success, error });
          return watchId;
        },
        clearWatch(watchId) {
          geolocationState.activeWatches.delete(watchId);
        },
        getCurrentPosition(success, error, options) {
          geolocationState.lastCurrentPositionOptions = options || null;
          if (geolocationState.nextCurrentPositionError) {
            const currentError = geolocationState.nextCurrentPositionError;
            geolocationState.nextCurrentPositionError = null;
            error(currentError);
            return;
          }

          success(geolocationState.position);
        }
      }
    },
    Core: {
      state: {},
      emit() {},
      on() {}
    },
    CoreEventBus: {
      emit() {}
    },
    CoreErrorHandler: {
      handle() {}
    },
    CoreAudit: {
      record() {}
    },
    NeutralPublicPath: {
      api() { return '/api/v1'; }
    },
    CoreStorage: (() => {
      const storage = new Map();
      return {
        get(key) {
          return storage.get(key);
        },
        set(key, value) {
          storage.set(key, value);
        }
      };
    })(),
    DatabaseManager: {
      save() {
        return Promise.resolve({ ok: true });
      }
    },
    localStorage: (() => {
      const storage = new Map();
      return {
        getItem(key) {
          return storage.has(key) ? storage.get(key) : null;
        },
        setItem(key, value) {
          storage.set(key, String(value));
        },
        removeItem(key) {
          storage.delete(key);
        }
      };
    })(),
    ModuleInterface: null,
    ModuleRegistry: null,
    ModuleManager: null,
    CoreLoader: null,
    FrameworkModuleCatalog: [],
    ErrorLog: {},
    CoreConfig: {},
    CoreContext: {},
    CoreState: {},
    CoreLifecycle: {},
    CoreAuth: currentUser ? {
      getCurrentUser() {
        return currentUser;
      }
    } : {},
    CoreAccess: currentUser ? {
      hasPermission(user, permission) {
        return !!user && Array.isArray(user.permissions) && user.permissions.includes(permission);
      }
    } : {},
    CoreEventRing: {},
    require,
    process,
    console
  };

  sandbox.window = sandbox;
  vm.createContext(sandbox);

  const base = path.resolve(__dirname, '..');
  for (const scriptPath of [
    'Web-App/core/module-interface.js',
    'Web-App/core/module-registry.js',
    'Web-App/core/module-manager.js',
    'Web-App/core/core-loader.js',
    'Web-App/app/modules/gps/index.js'
  ]) {
    loadScriptIntoContext(sandbox, path.join(base, scriptPath));
  }

  return { sandbox, geolocationState };
};

test('registers and activates apps', () => {
  cleanupRuntimeState();
  const runtime = Framework;
  runtime.apps.clear();

  const app = runtime.registerApp({
    appId: 'sample-app',
    name: 'Sample App',
    version: '1.0.0',
    active: false,
    modules: ['gps'],
    config: { mode: 'local' }
  });

  assert.equal(app.appId, 'sample-app');
  assert.equal(runtime.getApp('sample-app').name, 'Sample App');
  runtime.activateApp('sample-app');
  assert.equal(runtime.getApp('sample-app').status, 'active');
});

test('prefers the active app in the app listing and keeps the neutral app as the default working app', () => {
  cleanupRuntimeState();
  const runtime = Framework;
  runtime.apps.clear();
  runtime.appRuntimeState.clear();
  runtime.currentAppId = null;

  runtime.registerApp({
    appId: 'neutral-app',
    name: 'Neutral App',
    version: '1.0.0',
    active: true,
    modules: ['gps'],
    config: { mode: 'local' }
  });

  runtime.registerApp({
    appId: 'test-app',
    name: 'Test App',
    version: '1.0.0',
    active: false,
    modules: ['gps'],
    config: { mode: 'local', defaultView: 'overview' }
  });

  const appList = runtime.listApps();
  assert.equal(appList[0].appId, 'neutral-app');
  assert.equal(runtime.getActiveApp().appId, 'neutral-app');
  assert.equal(runtime.getApp('neutral-app').status, 'active');
});

test('loads the current app from the Web-App app manifest', () => {
  const runtime = Framework;
  const manifest = readCurrentAppManifest();

  const app = runtime.registerApp({
    appId: manifest.id,
    name: manifest.name,
    version: manifest.version || '1.0.0',
    active: true,
    modules: manifest.modules || [],
    config: { mode: 'local', source: 'app-info.json' }
  });

  assert.equal(app.appId, manifest.id);
  assert.equal(app.name, manifest.name);
  assert.equal(app.config.source, 'app-info.json');
});

test('exposes the discovered GPS module through the admin module API', { skip: gpsReferenceAvailable ? false : 'GPS reference is not included' }, async () => {
  const server = ServerBootstrap.createServer({ modulesDir: path.resolve(__dirname, '../Web-App/app/modules') });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  const port = server.address().port;
  const requestJson = (pathname, headers = {}) => new Promise((resolve, reject) => {
    const req = http.get({
      hostname: '127.0.0.1',
      port,
      path: pathname,
      headers: {
        'x-admin-access-token': 'test-token',
        'x-framework-role': 'admin',
        ...headers
      }
    }, (response) => {
      let body = '';
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        try {
          resolve({
            statusCode: response.statusCode,
            body: body ? JSON.parse(body) : {}
          });
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on('error', reject);
  });

  try {
    const listResult = await requestJson('/api/admin/modules');
    assert.equal(listResult.statusCode, 200);
    assert.ok(Array.isArray(listResult.body.modules));
    const gpsModule = listResult.body.modules.find((module) => String(module.id).toLowerCase() === 'gps');
    assert.ok(gpsModule, 'GPS module should be discoverable through /api/admin/modules');

    const detailResult = await requestJson('/api/admin/modules/gps');
    assert.equal(detailResult.statusCode, 200);
    assert.equal(detailResult.body.module.id, 'gps');
    assert.equal(detailResult.body.module.name, 'GPS');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});

test('preserves discovered module lifecycle state instead of forcing inactive install state', async () => {
  const context = {
    window: null,
    document: { readyState: 'complete', addEventListener() {} },
    Core: { emit() {}, state: {} },
    CoreErrorHandler: { handle() {} },
    ModuleRegistry: {
      register(module) { this.modules.set(module.id, module); return module; },
      unregister(moduleId) { return this.modules.delete(moduleId); },
      get(moduleId) { return this.modules.get(moduleId) || null; },
      getAll() { return Array.from(this.modules.values()); },
      getByApp() { return []; },
      has(moduleId) { return this.modules.has(moduleId); },
      modules: new Map(),
      async discover() {
        return [{
          id: 'gps',
          name: 'GPS',
          displayName: 'GPS',
          version: '1.0.0',
          status: 'active',
          lifecycleState: 'ACTIVE',
          registered: true,
          active: true,
          enabled: true,
          manifest: { id: 'gps', name: 'GPS', type: 'module' }
        }];
      }
    },
    console
  };
  context.window = context;
  vm.createContext(context);

  loadScriptIntoContext(context, path.resolve(__dirname, '../Web-App/core/module-manager.js'));

  const discovered = await context.ModuleManager.discoverModules();
  assert.equal(discovered.length, 1);
  const gps = context.ModuleManager.get('gps');
  assert.ok(gps);
  assert.equal(gps.status, 'enabled');
  assert.equal(gps.lifecycleState, 'ACTIVE');
  assert.equal(gps.registered, true);
  assert.equal(gps.active, true);
});

test('installing a module through the admin facade keeps it inactive until activation', { skip: gpsReferenceAvailable ? false : 'GPS reference is not included' }, () => {
  cleanupRuntimeState();

  const { sandbox } = createGpsModuleContext();
  loadScriptIntoContext(sandbox, path.resolve(__dirname, '../Web-App/core/core-admin.js'));

  sandbox.ModuleManager.register(sandbox.GpsModule);
  sandbox.AdminModule.init();

  const result = sandbox.AdminModule.installModule('gps');
  assert.equal(result.ok, true);

  const gps = sandbox.ModuleManager.get('gps');
  assert.ok(gps);
  assert.equal(gps.status, 'installed');
  assert.equal(gps.active, false);
});

test('discovers module-declared permissions and standalone metadata from the gps manifest', { skip: gpsReferenceAvailable ? false : 'GPS reference is not included' }, async () => {
  cleanupRuntimeState();

  const { sandbox } = createGpsModuleContext();
  const discovered = await sandbox.ModuleManager.discoverModules();
  const gps = discovered.find((module) => module.id === 'gps');

  assert.ok(gps);
  assert.deepEqual(Array.from(gps.permissions), ['gps.view', 'gps.use', 'gps.manage', 'gps.admin']);
  assert.equal(Array.isArray(gps.permissionDefinitions), true);
  assert.equal(gps.permissionDefinitions.length, 4);
  assert.deepEqual(Array.from(gps.access.visibilityPermissions), ['gps.view']);
  assert.equal(gps.standalone.entry, 'index.html');
});

test('keeps app runtime state isolated for each app instance', () => {
  cleanupRuntimeState();
  const runtime = Framework;
  runtime.apps.clear();
  runtime.appRuntimeState.clear();
  runtime.currentAppId = null;

  runtime.registerApp({
    appId: 'neutral-app',
    name: 'Test App',
    version: '1.0.0',
    active: true,
    modules: ['gps'],
    config: { mode: 'local', storageType: 'file', defaultView: 'dashboard' }
  });

  runtime.registerApp({
    appId: 'sample-app',
    name: 'Sample App',
    version: '1.0.0',
    active: false,
    modules: ['gps'],
    config: { mode: 'local', storageType: 'file', defaultView: 'overview' }
  });

  const neutralAppRuntime = runtime.getAppRuntimeState('neutral-app');
  const sampleRuntime = runtime.getAppRuntimeState('sample-app');

  assert.equal(neutralAppRuntime.appId, 'neutral-app');
  assert.equal(sampleRuntime.appId, 'sample-app');
  assert.equal(neutralAppRuntime.storage.namespace, 'app:neutral-app:');
  assert.equal(sampleRuntime.storage.namespace, 'app:sample-app:');
  assert.equal(runtime.getActiveApp().appId, 'neutral-app');

  runtime.setActiveApp('sample-app');
  assert.equal(runtime.getActiveApp().appId, 'sample-app');
  assert.equal(runtime.getAppRuntimeState('sample-app').server.status, 'active');
  assert.equal(runtime.getAppRuntimeState('neutral-app').server.status, 'active');
});

test('supports app-scoped module access and role mappings', () => {
  cleanupRuntimeState();
  const runtime = Framework;
  runtime.apps.clear();

  runtime.registerApp({
    appId: 'neutral-app',
    name: 'Test App',
    version: '1.0.0',
    active: true,
    modules: ['gps', undefined],
    config: { mode: 'local' }
  });

  const updated = runtime.setAppModuleAccess('neutral-app', 'gps', {
    enabled: true,
    permissions: ['module:read'],
    roles: {
      user: false,
      admin: true,
      developer: true
    }
  });

  assert.equal(updated.appId, 'neutral-app');
  assert.equal(runtime.getAppModuleAccess('neutral-app', 'gps').roles.admin, true);
  assert.equal(runtime.getAppModuleAccess('neutral-app', 'gps').roles.user, false);
  assert.equal(runtime.listAppModuleAccess('neutral-app').length, 1);
});

test('supports app feature templates and role-based feature access', () => {
  cleanupRuntimeState();
  const runtime = Framework;
  runtime.apps.clear();

  runtime.registerApp({
    appId: 'neutral-app',
    name: 'Test App',
    version: '1.0.0',
    active: true,
    features: [
      { id: 'dashboard', label: 'Dashboard', permissions: ['system:view'], roles: ['user', 'admin'] },
      { id: undefined, label: 'Record List', permissions: ['user:read'], roles: ['admin', 'member'] }
    ]
  });

  runtime.registerFeatureTemplate('neutral-app', {
    id: 'profile',
    label: 'Profile',
    permissions: ['user:read'],
    roles: ['user', 'admin']
  });

  const updated = runtime.setAppFeatureAccess('neutral-app', 'profile', {
    enabled: true,
    permissions: ['user:read'],
    roles: { user: true, admin: true, developer: false }
  });

  assert.equal(updated.featureId, 'profile');
  assert.equal(runtime.getAppFeatureAccess('neutral-app', 'profile').roles.user, true);
  assert.equal(runtime.getAppFeatureAccess('neutral-app', 'profile').roles.developer, false);
  assert.equal(runtime.listAppFeatureAccess('neutral-app').length >= 1, true);
});

test('registers and tests connections', async () => {
  cleanupRuntimeState();
  const runtime = Framework;
  runtime.connections.clear();

  runtime.registerConnection({
    connectionId: 'remote-api',
    appId: 'sample-app',
    serverUrl: 'https://example.com',
    apiBase: '/api',
    status: 'inactive',
    active: false,
    authType: 'none'
  });

  const connection = runtime.getConnection('remote-api');
  assert.equal(connection.appId, 'sample-app');

  await runtime.testConnection('remote-api', async () => ({ ok: true, status: 'healthy', checkedAt: '2026-01-01T00:00:00.000Z' }));
  assert.equal(runtime.getConnection('remote-api').status, 'healthy');
});

test('supports feature flags, permissions, and migrations', async () => {
  cleanupRuntimeState();
  const runtime = Framework;

  runtime.setFeatureFlag('new-sync-engine', true);
  assert.equal(runtime.getFeatureFlag('new-sync-engine'), true);

  const permissionResult = runtime.checkPermission({ id: 'u1', roles: ['admin'] }, 'system:view');
  assert.equal(permissionResult.ok, true);

  runtime.migrations = [];
  runtime.registerMigration({
    id: 'v1-to-v2',
    version: '2.0.0',
    from: '1.0.0',
    to: '2.0.0',
    run: async ({ from, to }) => ({ ok: true, from, to })
  });

  const result = await runtime.applyMigrations('1.0.0', runtime.migrations);
  assert.equal(result.ok, true);
  assert.equal(result.applied, 1);
});

test('evaluates dependency requirements and circular module references', () => {
  cleanupRuntimeState();
  const runtime = Framework;
  runtime.modules.clear();

  runtime.registerModule({ id: 'shared-lib', version: '2.1.0', appId: 'neutral-app' });
  runtime.registerModule({ id: 'core-module', version: '1.5.0', appId: 'neutral-app', dependencies: { 'shared-lib': '>=2.0.0' } });

  const dependencyResult = runtime.validateModuleDependencies('core-module');
  assert.equal(dependencyResult.ok, true);
  assert.deepEqual(dependencyResult.missing, []);

  runtime.registerModule({ id: 'alpha-module', version: '1.0.0', appId: 'neutral-app', dependencies: { 'beta-module': '>=1.0.0' } });
  runtime.registerModule({ id: 'beta-module', version: '1.0.0', appId: 'neutral-app', dependencies: { 'alpha-module': '>=1.0.0' } });

  const circularResult = runtime.validateModuleDependencies('alpha-module');
  assert.equal(circularResult.ok, false);
  assert.equal(Array.isArray(circularResult.circular) && circularResult.circular.length > 0, true);
});

test('supports module migration rollback snapshots and version updates', async () => {
  cleanupRuntimeState();
  const runtime = Framework;
  runtime.modules.clear();

  runtime.registerModule({
    id: 'audit-addon',
    version: '1.0.0',
    appId: 'neutral-app',
    status: 'installed',
    enabled: false,
    active: false
  });

  const snapshot = runtime.createModuleSnapshot('audit-addon');
  assert.equal(snapshot.version, '1.0.0');

  const updateResult = await runtime.updateModule('audit-addon', '2.0.0', {
    migrations: [{
      id: 'audit-addon-migration',
      run: async () => ({ ok: true, message: 'migration applied' })
    }]
  });

  assert.equal(updateResult.ok, true);
  assert.equal(runtime.getModule('audit-addon').version, '2.0.0');
  assert.equal(runtime.getModuleMigrations('audit-addon').length >= 1, true);

  const rollbackResult = runtime.rollbackModule('audit-addon', snapshot);
  assert.equal(rollbackResult.ok, true);
  assert.equal(runtime.getModule('audit-addon').version, '1.0.0');
});

test('supports admin-configurable storage modes and connection metadata', () => {
  cleanupRuntimeState();
  const runtime = Framework;
  runtime.connections.clear();

  const connection = runtime.registerConnection({
    connectionId: 'primary-storage',
    appId: 'neutral-app',
    storageType: 'sqlite',
    databaseType: 'sqlite',
    databaseName: 'neutral-app.db',
    host: 'localhost',
    port: '3306',
    username: 'appuser',
    active: true,
    status: 'active',
    default: true
  });

  assert.equal(connection.storageType, 'sqlite');
  assert.equal(connection.databaseType, 'sqlite');
  assert.equal(connection.databaseName, 'neutral-app.db');
  assert.equal(connection.default, true);
  assert.equal(runtime.getConnection('primary-storage').status, 'active');
});

test('allows developer roles to pass resource-scoped user write checks', () => {
  const context = {
    window: null,
    console,
    require,
    setTimeout,
    clearTimeout
  };
  context.window = context;
  vm.createContext(context);
  loadScriptIntoContext(context, path.resolve(__dirname, '../Web-App/core/core-access.js'));

  const result = context.window.CoreAccess.can({ id: 'dev-1', roles: ['developer'] }, 'user:write', 'user');
  assert.equal(result.ok, true);
  assert.equal(result.code, 'ALLOWED');

  const denied = context.window.CoreAccess.can({ id: 'user-1', roles: ['user'] }, 'user:write', 'user');
  assert.equal(denied.ok, false);
  assert.equal(denied.code, 'ACCESS_DENIED');
});

test('creates a live file storage adapter and a sql-ready adapter for admin-managed connections', async () => {
  cleanupRuntimeState();
  const runtime = Framework;
  const fileAdapter = runtime.createStorageAdapter({
    connectionId: 'file-storage',
    appId: 'neutral-app',
    storageType: 'file',
    storagePath: 'Server/node/runtime/test-data'
  });

  assert.equal(fileAdapter.type, 'file');
  const fileCheck = await fileAdapter.test();
  assert.equal(fileCheck.ok, true);
  await fileAdapter.write('sessions', 'session-demo', { ok: true, appId: 'neutral-app' });
  const saved = await fileAdapter.read('sessions', 'session-demo', null);
  assert.equal(saved.appId, 'neutral-app');

  const sqlAdapter = runtime.createStorageAdapter({
    connectionId: 'sql-storage',
    appId: 'neutral-app',
    storageType: 'sqlite',
    databaseType: 'sqlite',
    databaseName: 'neutral-app.db',
    storagePath: 'Server/node/runtime/test-data'
  });

  assert.equal(sqlAdapter.type, 'sqlite');
  const sqlCheck = await sqlAdapter.test();
  assert.equal(sqlCheck.status, 'ready');
  await sqlAdapter.write('sessions', 'sql-session-demo', { ok: true, appId: 'neutral-app', mode: 'sqlite' });
  const sqlSaved = await sqlAdapter.read('sessions', 'sql-session-demo', null);
  assert.equal(sqlSaved.appId, 'neutral-app');
  assert.equal(sqlSaved.mode, 'sqlite');
});

test('registers generic entity schemas and records for app-level business data', () => {
  cleanupRuntimeState();
  const runtime = Framework;
  runtime.apps.clear();
  runtime.entitySchemas.clear();
  runtime.entityRecords.clear();

  runtime.registerApp({
    appId: 'neutral-app',
    name: 'Test App',
    version: '1.0.0',
    active: true,
    modules: ['gps'],
    config: { mode: 'local', storageType: 'file' }
  });

  runtime.registerEntitySchema('neutral-app', {
    id: 'inventory',
    name: 'Inventory',
    fields: [
      { key: 'name', type: 'string', required: true },
      { key: 'quantity', type: 'number', required: true },
      { key: 'active', type: 'boolean', defaultValue: true }
    ]
  });

  const schema = runtime.getEntitySchema('neutral-app', 'inventory');
  assert.equal(schema.id, 'inventory');
  assert.equal(schema.fields.some((field) => field.key === 'name'), true);

  const record = runtime.createEntityRecord('neutral-app', 'inventory', {
    name: 'Salmon',
    quantity: 8,
    active: true
  });

  assert.equal(record.entityId, 'inventory');
  assert.equal(record.quantity, 8);
  assert.equal(runtime.getEntityRecord('neutral-app', 'inventory', record.id).name, 'Salmon');

  const records = runtime.listEntityRecords('neutral-app', 'inventory');
  assert.equal(records.length, 1);

  const updated = runtime.updateEntityRecord('neutral-app', 'inventory', record.id, { quantity: 12 });
  assert.equal(updated.quantity, 12);

  const updatedSchema = runtime.updateEntitySchema('neutral-app', 'inventory', {
    name: 'Inventory items',
    fields: [
      { key: 'name', type: 'string', required: true },
      { key: 'quantity', type: 'number', required: true },
      { key: 'active', type: 'boolean', defaultValue: true },
      { key: 'price', type: 'number', required: false, defaultValue: 0 }
    ]
  });
  assert.equal(updatedSchema.name, 'Inventory items');
  assert.equal(updatedSchema.fields.some((field) => field.key === 'price'), true);

  const afterDelete = runtime.deleteEntityRecord('neutral-app', 'inventory', record.id);
  assert.equal(afterDelete.length, 0);
});

test('registers a centralized role and permission catalog', () => {
  cleanupRuntimeState();
  const runtime = Framework;
  runtime.roles.clear();
  runtime.permissions.clear();

  runtime.registerRole('manager', {
    description: 'Can manage user access.',
    permissions: ['user:read', 'user:write']
  });
  runtime.registerPermission('module:read', 'Read module metadata.');

  const roles = runtime.getRoleCatalog();
  const permissionCatalog = runtime.getPermissionCatalog();

  assert.ok(roles.some((role) => role.role === 'manager' && role.permissions.includes('user:write')));
  assert.ok(permissionCatalog.some((permission) => permission.permission === 'module:read'));
});

test('supports persisted setup state and connection updates', () => {
  cleanupRuntimeState();
  const runtime = Framework;

  const initial = runtime.loadSetupState();
  assert.equal(initial.status, 'NOT_CONFIGURED');

  const saved = runtime.saveSetupState({
    currentStep: 'connection-config',
    appId: 'sample-app',
    configuration: { defaultRegion: 'de' }
  });

  assert.equal(saved.currentStep, 'connection-config');
  assert.equal(saved.configuration.defaultRegion, 'de');
  assert.equal(saved.status, 'CONFIGURATION_REQUIRED');

  const connection = runtime.registerConnection({
    connectionId: 'remote-api',
    appId: 'sample-app',
    serverUrl: 'https://api.example.test',
    apiBase: '/remote-api',
    authType: 'token',
    status: 'inactive',
    active: false
  });

  assert.equal(connection.serverUrl, 'https://api.example.test');
  const updated = runtime.updateConnection('remote-api', { status: 'active', active: true });
  assert.equal(updated.status, 'active');
});

test('discovers runtime setup defaults from the real environment and config', () => {
  cleanupRuntimeState();
  const runtime = Framework;
  const originalEnv = { ...process.env };

  try {
    process.env.DEFAULT_APP_ID = 'fleet-app';
    process.env.APP_NAME = 'Fleet Control';
    process.env.HOST = '0.0.0.0';
    process.env.PORT = '4200';
    process.env.DB_TYPE = 'mysql';
    process.env.MYSQL_HOST = 'db.internal';
    process.env.MYSQL_DATABASE = 'fleet';
    process.env.MYSQL_USER = 'fleet_user';

    const defaults = runtime.getRuntimeSetupDefaults();
    assert.equal(defaults.appId, 'fleet-app');
    assert.equal(defaults.appName, 'Fleet Control');
    assert.equal(defaults.serverUrl, 'http://0.0.0.0:4200');
    assert.equal(defaults.apiBase, '/api');
    assert.equal(defaults.configuration.database.type, 'mysql');
    assert.equal(defaults.databaseState.host, 'db.internal');

    const setupState = runtime.loadSetupState();
    assert.equal(setupState.status, 'NOT_CONFIGURED');
    assert.equal(runtime.getRuntimeSetupDefaults().appId, 'fleet-app');
    assert.equal(runtime.getRuntimeSetupDefaults().serverUrl, 'http://0.0.0.0:4200');
    assert.equal(runtime.getRuntimeSetupDefaults().apiBase, '/api');
  } finally {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    for (const key of Object.keys(originalEnv)) {
      process.env[key] = originalEnv[key];
    }
  }
});

test('prefers runtime env database config over stale persisted setup state in setup snapshot', async () => {
  cleanupRuntimeState();
  const runtime = Framework;
  const originalEnv = { ...process.env };
  const savedSetupState = {
    status: 'CONFIGURATION_REQUIRED',
    configuration: {
      appId: 'neutral-app',
      appName: 'Neutral App',
      serverUrl: 'http://stale.example:3000',
      apiBase: '/api',
      database: {
        type: 'indexeddb',
        host: 'stale-db.internal',
        port: 9000,
        name: 'CoreDB',
        username: 'stale-user',
        password: 'stale-secret'
      }
    },
    databaseState: {
      type: 'indexeddb',
      host: 'stale-db.internal',
      port: 9000,
      name: 'CoreDB',
      username: 'stale-user',
      password: 'stale-secret',
      source: 'setup-state'
    }
  };

  runtime.setupState = savedSetupState;
  const app = ServerBootstrap.createServer();

  try {
    process.env.DB_TYPE = 'mysql';
    process.env.MYSQL_HOST = 'db.internal';
    process.env.MYSQL_PORT = '3307';
    process.env.MYSQL_DATABASE = 'neutral_prod';
    process.env.MYSQL_USER = 'neutral_user';
    process.env.MYSQL_PASSWORD = 'server-secret';
    process.env.DB_URL = 'mysql://neutral_user@db.internal:3307/neutral_prod';

    await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
    const port = app.address().port;

    const requestJson = (method, pathname) => new Promise((resolve, reject) => {
      const req = http.request({
        host: '127.0.0.1',
        port,
        path: pathname,
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-framework-role': 'admin',
          'x-admin-access-token': 'test-token'
        }
      }, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: data ? JSON.parse(data) : {} });
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });

    const snapshot = await requestJson('GET', '/api/setup/status');
    assert.equal(snapshot.statusCode, 200);
    assert.equal(snapshot.body.setup.configuration.database.type, 'mysql');
    assert.equal(snapshot.body.setup.configuration.database.host, 'db.internal');
    assert.equal(snapshot.body.setup.configuration.database.port, 3307);
    assert.equal(snapshot.body.setup.configuration.database.name, 'neutral_prod');
    assert.equal(snapshot.body.setup.configuration.database.username, 'neutral_user');
    assert.equal(snapshot.body.setup.configuration.database.password, undefined);
    assert.equal(snapshot.body.setup.databaseState.source, 'env');
  } finally {
    await new Promise((resolve) => app.close(resolve));
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    for (const key of Object.keys(originalEnv)) {
      process.env[key] = originalEnv[key];
    }
    runtime.setupState = null;
  }
});

test('provides diagnostic summary', () => {
  cleanupRuntimeState();
  const runtime = Framework;
  const diagnostics = runtime.getDiagnostics();
  assert.ok(diagnostics.framework);
  assert.ok(Array.isArray(diagnostics.connections));
  assert.ok(Array.isArray(diagnostics.applications));
});

test('supports admin devices, licenses, and updates', () => {
  cleanupRuntimeState();
  const runtime = Framework;

  const device = runtime.upsertDevice({
    deviceId: 'device-1',
    name: 'Scanner',
    type: 'scanner',
    status: 'active',
    userId: 'user-1',
    lastContactAt: '2026-08-18T00:00:00.000Z'
  });
  assert.equal(device.deviceId, 'device-1');
  assert.equal(runtime.getDevice('device-1').status, 'active');

  const license = runtime.upsertLicense({
    licenseId: 'license-1',
    type: 'trial',
    status: 'active',
    validUntil: '2027-01-01',
    userId: 'user-1'
  });
  assert.equal(license.licenseId, 'license-1');
  assert.equal(runtime.getLicense('license-1').type, 'trial');

  const updateState = runtime.checkForUpdates({
    currentVersion: '1.0.0',
    availableVersion: '1.1.0',
    source: 'local'
  });
  assert.equal(updateState.status, 'AVAILABLE');
  assert.equal(runtime.getUpdateState().availableVersion, '1.1.0');

});

test('loads and cycles the gps module lifecycle without duplicate watchers', { skip: gpsReferenceAvailable ? false : 'GPS reference is not included' }, async () => {
  cleanupRuntimeState();

  const { sandbox, geolocationState } = createGpsModuleContext();
  const discovered = await sandbox.ModuleManager.discoverModules();

  assert.ok(discovered.some((module) => module.id === 'gps'));
  const gps = sandbox.ModuleManager.get('gps');
  assert.ok(gps);
  assert.equal(gps.status, 'available');
  assert.equal(gps.active, false);
  assert.equal(gps.isTracking(), false);
  assert.equal(geolocationState.watchCalls, 0);
  assert.equal(geolocationState.activeWatches.size, 0);

  const inactiveStart = gps.startTracking();
  assert.equal(inactiveStart.ok, false);
  assert.equal(inactiveStart.code, 'MODULE_NOT_ENABLED');

  sandbox.ModuleManager.install('gps');
  assert.equal(gps.status, 'installed');
  sandbox.ModuleManager.enable('gps');

  const result = gps.startTracking();
  assert.equal(result.ok, true);
  assert.equal(gps.status, 'enabled');
  assert.equal(gps.active, true);
  assert.equal(gps.isTracking(), true);
  assert.equal(geolocationState.watchCalls, 1);
  assert.equal(geolocationState.activeWatches.size, 1);

  const firstWatchId = [...geolocationState.activeWatches.keys()][0];

  sandbox.ModuleManager.disable('gps');
  assert.equal(gps.status, 'disabled');
  assert.equal(gps.active, false);
  assert.equal(gps.isTracking(), false);
  assert.equal(geolocationState.activeWatches.size, 0);

  sandbox.ModuleManager.enable('gps');
  assert.equal(gps.status, 'enabled');
  assert.equal(gps.isTracking(), false);
  assert.equal(geolocationState.watchCalls, 1);
  assert.equal(geolocationState.activeWatches.size, 0);

  geolocationState.nextCurrentPositionError = { code: 2, message: 'Position unavailable' };
  await assert.rejects(gps.getCurrentPosition(), (error) => error.code === 'POSITION_UNAVAILABLE');

  geolocationState.nextCurrentPositionError = { code: 3, message: 'Timeout' };
  await assert.rejects(gps.getCurrentPosition(), (error) => error.code === 'TIMEOUT');

  sandbox.ModuleManager.disable('gps');
  const uninstallResult = sandbox.ModuleManager.uninstall('gps');
  assert.equal(uninstallResult, true);
  assert.equal(sandbox.ModuleManager.get('gps'), null);

  const rediscovered = await sandbox.ModuleManager.discoverModules();
  assert.ok(rediscovered.some((module) => module.id === 'gps'));
  const rediscoveredGps = sandbox.ModuleManager.get('gps');
  assert.ok(rediscoveredGps);
  assert.equal(rediscoveredGps.status, 'available');
  assert.equal(rediscoveredGps.active, false);
});

test('marks gps permission denied without starting a watcher', { skip: gpsReferenceAvailable ? false : 'GPS reference is not included' }, async () => {
  cleanupRuntimeState();

  const { sandbox, geolocationState } = createGpsModuleContext({ permissionState: 'denied' });
  const discovered = await sandbox.ModuleManager.discoverModules();

  assert.ok(discovered.some((module) => module.id === 'gps'));
  await new Promise((resolve) => setImmediate(resolve));

  const gps = sandbox.ModuleManager.get('gps');
  assert.ok(gps);
  assert.equal(gps.getPermissionState(), 'unknown');
  assert.equal(gps.isTracking(), false);
  assert.equal(geolocationState.watchCalls, 0);
});

test('blocks gps usage when the current user lacks the module usage permission', { skip: gpsReferenceAvailable ? false : 'GPS reference is not included' }, async () => {
  cleanupRuntimeState();

  const { sandbox } = createGpsModuleContext({
    currentUser: {
      id: 'viewer-1',
      username: 'viewer',
      roles: ['viewer'],
      permissions: ['gps.view']
    }
  });
  await sandbox.ModuleManager.discoverModules();

  const gps = sandbox.ModuleManager.get('gps');
  assert.ok(gps);

  sandbox.ModuleManager.install('gps');
  sandbox.ModuleManager.enable('gps');

  const startResult = gps.startTracking();
  assert.equal(startResult.ok, false);
  assert.equal(startResult.code, 'INSUFFICIENT_PERMISSIONS');
  await assert.rejects(gps.getCurrentPosition(), (error) => error.code === 'INSUFFICIENT_PERMISSIONS');
});

test('registers module-provided admin settings and applies them to gps runtime options', { skip: gpsReferenceAvailable ? false : 'GPS reference is not included' }, async () => {
  cleanupRuntimeState();

  const { sandbox, geolocationState } = createGpsModuleContext();
  loadScriptIntoContext(sandbox, path.resolve(__dirname, '../Web-App/core/config-manager.js'));
  loadScriptIntoContext(sandbox, path.resolve(__dirname, '../Web-App/core/core-admin.js'));

  sandbox.ConfigManager.init();
  sandbox.ModuleManager.register(sandbox.GpsModule);
  sandbox.AdminModule.init();

  const settingsCatalog = sandbox.AdminModule.getSettingsCatalog();
  const gpsSettingsSection = settingsCatalog.data.modules.find((section) => section.moduleId === 'gps');
  assert.ok(gpsSettingsSection);
  assert.equal(sandbox.ConfigManager.getPath('moduleSettings.gps.timeoutMs'), 10000);
  assert.equal(sandbox.ConfigManager.getPath('moduleSettings.gps.enableHighAccuracy'), true);

  const updateResult = sandbox.AdminModule.updateSettings([
    { path: 'moduleSettings.gps.enableHighAccuracy', value: false },
    { path: 'moduleSettings.gps.timeoutMs', value: 4500 },
    { path: 'moduleSettings.gps.maximumAgeMs', value: 60000 }
  ], { id: 'developer' });

  assert.equal(updateResult.ok, true);
  assert.equal(sandbox.ConfigManager.getPath('moduleSettings.gps.timeoutMs'), 4500);
  assert.match(sandbox.localStorage.getItem('core-config-moduleSettings') || '', /"timeoutMs":4500/);

  sandbox.ModuleManager.install('gps');
  sandbox.ModuleManager.initialize('gps');
  sandbox.ModuleManager.enable('gps');

  const gps = sandbox.ModuleManager.get('gps');
  const trackingResult = gps.startTracking();
  assert.equal(trackingResult.ok, true);
  assert.equal(geolocationState.lastWatchOptions.enableHighAccuracy, false);
  assert.equal(geolocationState.lastWatchOptions.timeout, 4500);
  assert.equal(geolocationState.lastWatchOptions.maximumAge, 60000);
});

test('updates an existing user role and status through the user and admin facades', async () => {
  const context = {
    window: null,
    document: { readyState: 'complete', addEventListener() {} },
    navigator: {},
    localStorage: {
      store: new Map(),
      getItem(key) { return this.store.has(key) ? this.store.get(key) : null; },
      setItem(key, value) { this.store.set(key, String(value)); },
      removeItem(key) { this.store.delete(key); }
    },
    crypto: { randomUUID() { return 'test-uuid'; }, subtle: null },
    console,
    require,
    process,
    DatabaseManager: {
      async clear() { return true; },
      async save() { return true; },
      async getAll() { return []; }
    },
    Core: { emit() {}, on() {} },
    CoreAudit: { record() {} },
    CoreAccess: null,
    ConfigManager: null,
    NeutralPublicPath: { api() { return '/api/v1'; } },
    FrameworkModuleCatalog: []
  };
  const sandbox = vm.createContext(context);
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.window.localStorage = sandbox.localStorage;

  const base = path.resolve(__dirname, '..');
  loadScriptIntoContext(sandbox, path.join(base, 'Web-App/core/core-access.js'));
  loadScriptIntoContext(sandbox, path.join(base, 'Web-App/core/config-manager.js'));
  loadScriptIntoContext(sandbox, path.join(base, 'Web-App/core/core-user.js'));
  loadScriptIntoContext(sandbox, path.join(base, 'Web-App/core/core-admin.js'));

  sandbox.ConfigManager.init();
  const created = await sandbox.UserModule.createUser({
    username: 'alina',
    displayName: 'Alina',
    roles: ['user'],
    permissions: ['user:read']
  }, 'system');
  assert.equal(created.ok, true);

  const updated = await sandbox.UserModule.updateUser(created.data.id, {
    username: 'alina-admin',
    displayName: 'Alina Admin',
    roles: ['admin'],
    permissions: ['user:read', 'user:write', 'system:view'],
    status: 'inactive'
  }, 'system');

  assert.equal(updated.ok, true);
  assert.equal(updated.data.username, 'alina-admin');
  assert.equal(updated.data.roles[0], 'admin');
  assert.equal(updated.data.status, 'inactive');

  const adminUpdated = await sandbox.AdminModule.updateUser(updated.data.id, {
    roles: ['developer'],
    status: 'active'
  }, { id: 'dev-1', roles: ['developer'] });
  assert.equal(adminUpdated.ok, true);
  assert.equal(adminUpdated.data.roles[0], 'developer');
  assert.equal(adminUpdated.data.status, 'active');
});

test('supports setup, database, and activation flow', async () => {
  cleanupRuntimeState();
  const runtime = Framework;
  runtime.setupState = null;

  const app = ServerBootstrap.createServer();

  const requestJson = (port, method, pathname, payload = null, role = 'admin', token = 'test-token') => new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : '';
    const headers = body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {};
    if (role) {
      headers['x-framework-role'] = role;
    }
    if (token) {
      headers['x-admin-access-token'] = token;
    }
    const req = http.request({
      host: '127.0.0.1',
      port,
      path: pathname,
      method,
      headers
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: data ? JSON.parse(data) : {} });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });

  const requestText = (port, method, pathname) => new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1',
      port,
      path: pathname,
      method
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.end();
  });

  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  const port = app.address().port;

  try {
    const initial = await requestJson(port, 'GET', '/api/setup/status');
    assert.equal(initial.body.status, 'NOT_CONFIGURED');

    const configured = await requestJson(port, 'POST', '/api/setup', {
      configuration: {
        serverUrl: `http://127.0.0.1:${port}`,
        apiBase: '/api',
        database: {
          type: 'indexeddb',
          name: 'CoreDB'
        }
      },
      bootstrapState: {
        configured: true,
        username: 'developer',
        displayId: 'USR-000001',
        role: 'developer'
      }
    });
    assert.equal(configured.body.status, 'CONFIGURATION_REQUIRED');

    const serverTest = await requestJson(port, 'POST', '/api/server/test', {
      serverUrl: `http://127.0.0.1:${port}`,
      apiBase: '/api'
    });
    assert.equal(serverTest.body.ok, true);

    const databaseTest = await requestJson(port, 'POST', '/api/database/test', {
      type: 'indexeddb',
      name: 'CoreDB'
    });
    assert.equal(databaseTest.body.ok, true);
    assert.equal(databaseTest.body.status, 'READY');

    const activated = await requestJson(port, 'POST', '/api/setup/activate', {
      currentStep: 'runtime'
    });
    assert.equal(activated.body.ok, true);
    assert.equal(activated.body.status, 'ACTIVE');

    const runtimeAfterActivation = await requestText(port, 'GET', '/');
    assert.equal(runtimeAfterActivation.statusCode, 200);
    assert.match(runtimeAfterActivation.body, /<!DOCTYPE html>/);
  } finally {
    await new Promise((resolve) => app.close(resolve));
  }
});

test('activates installation and bootstraps the developer user when the runtime exposes UserModule', () => {
  cleanupRuntimeState();
  const context = {
    window: null,
    document: { readyState: 'complete', addEventListener() {} },
    navigator: {},
    localStorage: {
      store: new Map(),
      getItem(key) { return this.store.has(key) ? this.store.get(key) : null; },
      setItem(key, value) { this.store.set(key, String(value)); },
      removeItem(key) { this.store.delete(key); }
    },
    crypto: { randomUUID() { return 'test-uuid'; }, subtle: null },
    console,
    require,
    process,
    DatabaseManager: {
      async clear() { return true; },
      async save() { return true; },
      async getAll() { return []; }
    },
    ConfigManager: {
      get(key, fallback) {
        const state = this.store || {};
        if (key === 'bootstrap') {
          return state.bootstrap || fallback || {};
        }
        return fallback;
      },
      set(key, value) { this.store = this.store || {}; this.store[key] = value; }
    },
    UserModule: {
      bootstrapDeveloperUser() {
        return { ok: true, created: true, code: 'DEVELOPER_BOOTSTRAP_CREATED', data: { username: 'Developer' } };
      }
    },
    Core: { emit() {}, on() {} },
    CoreAudit: { record() {} },
    CoreAccess: null,
    FrameworkModuleCatalog: []
  };
  const sandbox = vm.createContext(context);
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.window.localStorage = sandbox.localStorage;

  const base = path.resolve(__dirname, '..');
  loadScriptIntoContext(sandbox, path.join(base, 'Web-App/core/config-manager.js'));
  loadScriptIntoContext(sandbox, path.join(base, 'Web-App/core/core-user.js'));
  loadScriptIntoContext(sandbox, path.join(base, 'Web-App/core/master-framework.js'));

  const runtime = sandbox.MasterFramework;
  runtime.setupState = {
    ...runtime.getDefaultSetupState(),
    status: 'READY',
    currentStep: 'runtime',
    serverState: { ...runtime.getDefaultSetupState().serverState, configured: true, testedAt: '2024-01-01T00:00:00.000Z', status: 'READY', reachable: true },
    databaseState: { ...runtime.getDefaultSetupState().databaseState, configured: true, testedAt: '2024-01-01T00:00:00.000Z', status: 'READY', reachable: true },
    frameworkState: { ...runtime.getDefaultSetupState().frameworkState, initialized: true, initializedAt: '2024-01-01T00:00:00.000Z', status: 'READY', message: 'ready' },
    bootstrapState: { ...runtime.getDefaultSetupState().bootstrapState, configured: true, enabled: true, username: 'Developer', displayId: 'USR-000001', role: 'developer', status: 'READY' },
    installation: { ...runtime.getDefaultSetupState().installation, active: false, state: 'READY' }
  };

  const result = runtime.activateInstallation({ currentStep: 'runtime' });
  assert.equal(result.status, 'ACTIVE');
  assert.equal(result.bootstrapState.status, 'READY');
  assert.equal(result.bootstrapState.username, 'Developer');
  assert.equal(context.ConfigManager.get('bootstrap').developerUsername, 'Developer');
  assert.equal(context.ConfigManager.get('bootstrap').hasDeveloperAccount, true);
});

test('bootstraps the developer user even when other users already exist', async () => {
  const context = {
    window: null,
    document: { readyState: 'complete', addEventListener() {} },
    navigator: {},
    localStorage: {
      store: new Map(),
      getItem(key) { return this.store.has(key) ? this.store.get(key) : null; },
      setItem(key, value) { this.store.set(key, String(value)); },
      removeItem(key) { this.store.delete(key); }
    },
    crypto: {
      randomUUID() { return 'test-uuid'; },
      subtle: null
    },
    console,
    require,
    process,
    DatabaseManager: {
      async clear() { return true; },
      async save() { return true; },
      async getAll() { return []; }
    },
    Core: { emit() {}, on() {} },
    CoreAudit: { record() {} },
    CoreAccess: null,
    ConfigManager: null,
    NeutralPublicPath: { api() { return '/api/v1'; } },
    FrameworkModuleCatalog: []
  };
  const sandbox = vm.createContext(context);
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.window.localStorage = sandbox.localStorage;

  const base = path.resolve(__dirname, '..');
  loadScriptIntoContext(sandbox, path.join(base, 'Web-App/core/core-access.js'));
  loadScriptIntoContext(sandbox, path.join(base, 'Web-App/core/config-manager.js'));
  loadScriptIntoContext(sandbox, path.join(base, 'Web-App/core/core-user.js'));

  sandbox.ConfigManager.init();
  sandbox.ConfigManager.set('bootstrap', {
    enabled: true,
    developerUsername: 'Developer',
    developerDisplayId: 'USR-000001',
    developerPasswordHash: 'hash',
    passwordRequired: true,
    passwordSource: 'local-offline'
  });

  const firstUser = await sandbox.UserModule.createUser({
    username: 'alice',
    displayName: 'Alice',
    roles: ['user'],
    permissions: ['user:read']
  });
  assert.equal(firstUser.ok, true);
  assert.equal(sandbox.UserModule.users.size, 1);

  const result = sandbox.UserModule.bootstrapDeveloperUser();
  assert.equal(result.ok, true);
  assert.equal(result.created, true);
  assert.ok(Array.from(sandbox.UserModule.users.values()).some((user) => user.username === 'Developer'));
});

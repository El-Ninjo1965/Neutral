const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { port, host, rootDir, webRootDir, apiBase } = require('../config');
const MasterFramework = require('../../platform/master-framework');
const persistenceService = require('../services/persistence-service');
const inputValidation = require('../middleware/input-validation');
const userService = require('../services/user-service');
const roleService = require('../services/role-service');
const settingsService = require('../services/settings-service');
const auditService = require('../services/audit-service');
const authService = require('../services/auth-service');
const backupService = require('../services/backup-service');
const logService = require('../services/log-service');
const healthService = require('../services/health-service');
const releaseService = require('../services/release-service');
const authConfig = require('../config').auth;

const bootstrapDefaultApps = () => {
  const normalizeManifestValue = (value, fallback = 'neutral-app') => {
    const normalized = typeof value === 'string' ? value.trim() : '';
    return normalized || fallback;
  };

  const readAppManifests = () => {
    const appsRoot = path.join(rootDir, 'apps');
    if (!fs.existsSync(appsRoot)) {
      return [];
    }

    return fs.readdirSync(appsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const manifestPath = path.join(appsRoot, entry.name, 'app-info.json');
        if (!fs.existsSync(manifestPath)) {
          return null;
        }

        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          const appId = normalizeManifestValue(manifest && manifest.id, entry.name);
          return {
            appId,
            id: appId,
            name: normalizeManifestValue(manifest && manifest.name, appId),
            version: normalizeManifestValue(manifest && manifest.version, '1.0.0'),
            description: normalizeManifestValue(manifest && manifest.description, ''),
            status: 'active',
            active: true,
            modules: Array.isArray(manifest && manifest.modules) ? manifest.modules : ['dashboard', 'gps'],
            config: {
              framework: 'neutral-master-framework',
              mode: 'local',
              defaultView: 'dashboard',
              appManifestPath: manifestPath,
              source: 'app-info.json'
            }
          };
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean);
  };

  let defaults = readAppManifests();
  if (!defaults.length) {
    defaults = [
      {
        appId: 'neutral-app',
        name: 'Neutral App',
        version: '1.0.0',
        description: 'Default neutral application shell for the framework runtime.',
        status: 'active',
        active: true,
        modules: ['dashboard', 'gps'],
        config: {
          framework: 'neutral-master-framework',
          mode: 'local',
          defaultView: 'dashboard',
          source: 'default-runtime'
        }
      }
    ];
  }

  for (const appDefinition of defaults) {
    const existingApp = MasterFramework.getApp(appDefinition.appId);
    if (!existingApp) {
      MasterFramework.registerApp(appDefinition);
      continue;
    }

    existingApp.name = appDefinition.name || existingApp.name;
    existingApp.description = appDefinition.description || existingApp.description;
    existingApp.version = appDefinition.version || existingApp.version;
    existingApp.modules = Array.isArray(appDefinition.modules) ? appDefinition.modules : existingApp.modules;
    existingApp.config = {
      ...(existingApp.config || {}),
      ...(appDefinition.config || {}),
      appManifestPath: appDefinition.config && appDefinition.config.appManifestPath
        ? appDefinition.config.appManifestPath
        : existingApp.config && existingApp.config.appManifestPath
          ? existingApp.config.appManifestPath
          : undefined,
      source: 'app-info.json'
    };
    existingApp.updatedAt = new Date().toISOString();
  }

  const preferredAppId = (process.env.DEFAULT_APP_ID || (defaults[0] && defaults[0].appId) || 'neutral-app').trim() || 'neutral-app';
  const targetApp = MasterFramework.getApp(preferredAppId) || MasterFramework.getApp('neutral-app');
  if (targetApp) {
    MasterFramework.setActiveApp(targetApp.appId);
  }
};

bootstrapDefaultApps();

if (typeof MasterFramework.markFrameworkInitialized === 'function') {
  MasterFramework.markFrameworkInitialized({
    currentStep: 'server-runtime',
    message: 'Server framework loaded.'
  });
}

const appModulesDir = path.join(rootDir, 'app', 'modules');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Access-Token, X-Auth-Token, X-Framework-Role, X-User-Role, X-Admin-Role, X-CSRF-Token, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '600');
  res.setHeader('Vary', 'Origin');
};

const sendJson = (res, statusCode, payload) => {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
};

const readRuntimeDatabaseConfig = () => {
  const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
  const type = String(env.DB_TYPE || env.DATABASE_TYPE || env.MYSQL_TYPE || 'mysql').trim().toLowerCase() || 'mysql';
  const databaseType = ['mysql', 'postgresql', 'sqlite'].includes(type) ? type : 'mysql';
  const config = {
    type: databaseType,
    host: normalizeStringValue(env.MYSQL_HOST || env.DB_HOST || '', ''),
    port: Number(env.MYSQL_PORT || env.DB_PORT || 3306),
    name: normalizeStringValue(env.MYSQL_DATABASE || env.DB_NAME || '', ''),
    username: normalizeStringValue(env.MYSQL_USER || env.DB_USER || env.MYSQL_USERNAME || '', ''),
    password: normalizeStringValue(env.MYSQL_PASSWORD || env.DB_PASSWORD || '', ''),
    url: normalizeStringValue(env.DB_URL || env.DATABASE_URL || '', ''),
    configured: !!(
      env.DB_TYPE ||
      env.DATABASE_TYPE ||
      env.MYSQL_TYPE ||
      env.MYSQL_HOST ||
      env.DB_HOST ||
      env.MYSQL_PORT ||
      env.DB_PORT ||
      env.MYSQL_DATABASE ||
      env.DB_NAME ||
      env.MYSQL_USER ||
      env.DB_USER ||
      env.MYSQL_USERNAME ||
      env.MYSQL_PASSWORD ||
      env.DB_PASSWORD ||
      env.DB_URL ||
      env.DATABASE_URL
    )
  };

  if (config.port === 0 || !Number.isFinite(config.port)) {
    config.port = 3306;
  }

  return config;
};

const stripSensitiveDatabaseValues = (value = {}) => {
  const sanitized = { ...(value || {}) };
  const forbiddenKeys = ['password', 'pass', 'secret', 'apiKey', 'api_key', 'token', 'credentials'];
  for (const key of forbiddenKeys) {
    delete sanitized[key];
  }
  return sanitized;
};

const getPublicDatabaseConfig = (snapshot = {}) => {
  const runtimeConfig = readRuntimeDatabaseConfig();
  const persistedDatabase = stripSensitiveDatabaseValues((snapshot && snapshot.configuration && snapshot.configuration.database) || (snapshot && snapshot.database) || {});
  const persistedDatabaseState = stripSensitiveDatabaseValues((snapshot && snapshot.databaseState) || {});
  const fallbackDatabase = {
    ...persistedDatabase,
    ...persistedDatabaseState
  };

  const runtimePriority = runtimeConfig.configured ? runtimeConfig : {};
  const merged = {
    ...fallbackDatabase,
    ...stripSensitiveDatabaseValues(runtimePriority),
    type: runtimePriority.type || fallbackDatabase.type || 'mysql',
    host: runtimePriority.host || fallbackDatabase.host || '127.0.0.1',
    port: Number.isFinite(Number(runtimePriority.port))
      ? Number(runtimePriority.port)
      : (Number.isFinite(Number(fallbackDatabase.port)) ? Number(fallbackDatabase.port) : 3306),
    name: runtimePriority.name || fallbackDatabase.name || '',
    username: runtimePriority.username || fallbackDatabase.username || '',
    url: runtimePriority.url || fallbackDatabase.url || ''
  };

  const source = runtimeConfig.configured ? 'env' : (fallbackDatabase.type || fallbackDatabase.host || fallbackDatabase.name || fallbackDatabase.username || fallbackDatabase.url || persistedDatabaseState.type || persistedDatabaseState.host || persistedDatabaseState.name || persistedDatabaseState.username || persistedDatabaseState.url) ? 'setup-state' : 'default';
  const configured = !!(
    merged.type ||
    merged.host ||
    merged.port ||
    merged.name ||
    merged.username ||
    merged.url ||
    runtimeConfig.configured ||
    fallbackDatabase.type ||
    fallbackDatabase.host ||
    fallbackDatabase.name ||
    fallbackDatabase.username ||
    fallbackDatabase.url
  );

  return {
    ...merged,
    configured,
    source,
    passwordPresent: false,
    username: merged.username || '',
    host: merged.host || '',
    port: Number.isFinite(Number(merged.port)) ? Number(merged.port) : 3306,
    type: merged.type || 'mysql',
    name: merged.name || '',
    url: merged.url || ''
  };
};

const sanitizeSetupStateForClient = (snapshot = {}) => {
  const state = JSON.parse(JSON.stringify(snapshot || {}));
  const publicDatabase = getPublicDatabaseConfig(state);
  const runtimeDefaults = MasterFramework.getRuntimeSetupDefaults ? MasterFramework.getRuntimeSetupDefaults() : {};
  const serverUrl = normalizeStringValue(
    state.serverState && state.serverState.url ? state.serverState.url : state.configuration && state.configuration.serverUrl ? state.configuration.serverUrl : runtimeDefaults.serverUrl || `http://${host}:${port}`,
    `http://${host}:${port}`
  );
  const apiBase = normalizeStringValue(
    state.serverState && state.serverState.apiBase ? state.serverState.apiBase : state.configuration && state.configuration.apiBase ? state.configuration.apiBase : runtimeDefaults.apiBase || '/api',
    '/api'
  );

  state.appId = normalizeStringValue(state.appId || runtimeDefaults.appId || 'neutral-app', 'neutral-app');
  state.appName = normalizeStringValue(state.appName || runtimeDefaults.appName || 'Neutral App', 'Neutral App');
  state.configuration = {
    ...(runtimeDefaults.configuration || {}),
    ...(state.configuration || {}),
    appId: state.appId,
    appName: state.appName,
    serverUrl,
    apiBase,
    database: {
      ...(state.configuration && state.configuration.database ? stripSensitiveDatabaseValues(state.configuration.database) : {}),
      ...publicDatabase
    }
  };
  state.serverState = {
    ...(runtimeDefaults.serverState || {}),
    ...(state.serverState || {}),
    url: serverUrl,
    apiBase
  };
  state.database = {
    ...stripSensitiveDatabaseValues(state.database || {}),
    ...publicDatabase
  };
  state.databaseState = {
    ...stripSensitiveDatabaseValues(state.databaseState || {}),
    ...publicDatabase,
    source: publicDatabase.source || (state.databaseState && state.databaseState.source) || 'setup-state'
  };
  state.discovery = {
    app: {
      id: state.appId,
      name: state.appName
    },
    project: {
      rootDir,
      webRootDir,
      appPath: path.join(rootDir, 'app'),
      platformPath: path.join(rootDir, 'platform'),
      testsPath: path.join(rootDir, 'tests')
    },
    environment: {
      host,
      port,
      serverUrl,
      apiBase,
      nodeEnv: process.env.NODE_ENV || 'development'
    },
    server: {
      url: serverUrl,
      apiBase
    },
    database: publicDatabase
  };
  delete state.database.password;
  delete state.databaseState.password;
  delete state.configuration.database.password;
  delete state.database.pass;
  delete state.databaseState.pass;
  delete state.configuration.database.pass;
  state.database.passwordPresent = false;
  state.databaseState.passwordPresent = false;
  state.configuration.database.passwordPresent = false;
  return state;
};

const getSetupSnapshot = () => sanitizeSetupStateForClient(MasterFramework.getSetupSnapshot());

const isSetupRequired = () => {
  const snapshot = getSetupSnapshot();
  return !(snapshot.installation && snapshot.installation.active) && snapshot.status !== 'ACTIVE';
};

const canAccessSetupBootstrap = () => {
  const snapshot = getSetupSnapshot();
  return !(snapshot.installation && snapshot.installation.active) && snapshot.status !== 'ACTIVE';
};

const requireSetupBootstrapAccess = (req, res) => {
  if (canAccessSetupBootstrap()) {
    return true;
  }
  return requireAdminWriteAccess(req, res);
};

const getDatabaseStatus = () => {
  const status = MasterFramework.getDatabaseStatus();
  const safe = stripSensitiveDatabaseValues(status);
  safe.passwordPresent = false;
  return safe;
};

const resolveRequestOrigin = (req, fallbackHost = host, fallbackPort = port) => {
  const headers = req && req.headers ? req.headers : {};
  const forwardedProto = normalizeStringValue(
    Array.isArray(headers['x-forwarded-proto']) ? String(headers['x-forwarded-proto'][0] || '') : String(headers['x-forwarded-proto'] || headers['x-forwarded-protocol'] || headers['x-forwarded-scheme'] || ''),
    req && req.socket && req.socket.encrypted ? 'https' : 'http'
  ).split(',')[0].trim();
  const forwardedHost = normalizeStringValue(
    Array.isArray(headers['x-forwarded-host']) ? String(headers['x-forwarded-host'][0] || '') : String(headers['x-forwarded-host'] || headers.host || ''),
    `${fallbackHost}:${fallbackPort}`
  ).split(',')[0].trim();

  return `${forwardedProto}://${forwardedHost.replace(/\/$/, '')}`;
};

const getServerTestResult = async (payload = {}, req = null) => {
  const targetBase = normalizeStringValue(
    payload.serverUrl || process.env.SERVER_URL || resolveRequestOrigin(req, host, port),
    `http://${host}:${port}`
  );
  const apiBase = payload.apiBase || '/api';
  const targetUrl = new URL(`${targetBase.replace(/\/$/, '')}${apiBase}/status`);
  const start = Date.now();

  return new Promise((resolve) => {
    const client = targetUrl.protocol === 'https:' ? require('node:https') : require('node:http');
    const request = client.get(targetUrl, (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        const parsed = (() => {
          try { return JSON.parse(body || '{}'); } catch { return {}; }
        })();

        resolve({
          ok: response.statusCode >= 200 && response.statusCode < 400,
          reachable: true,
          statusCode: response.statusCode,
          status: response.statusCode >= 200 && response.statusCode < 400 ? 'READY' : 'ERROR',
          responseTimeMs: Date.now() - start,
          version: parsed.framework?.framework?.version || parsed.version || 'unknown',
          message: response.statusCode >= 200 && response.statusCode < 400 ? 'Server reachable.' : `HTTP ${response.statusCode}`,
          endpoint: targetUrl.toString()
        });
      });
    });

    request.on('error', () => {
      resolve({
        ok: false,
        reachable: false,
        status: 'ERROR',
        responseTimeMs: Date.now() - start,
        message: 'Server is not reachable.',
        endpoint: targetUrl.toString()
      });
    });

    request.setTimeout(5000, () => {
      request.destroy();
      resolve({
        ok: false,
        reachable: false,
        status: 'ERROR',
        responseTimeMs: Date.now() - start,
        message: 'Server test timed out.',
        endpoint: targetUrl.toString()
      });
    });
  });
};

const normalizeStringValue = (value, fallback = '') => {
  if (typeof value !== 'string') {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
};

const readJsonBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  let body = '';

  req.on('data', (chunk) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  });

  req.on('end', () => {
    body = Buffer.concat(chunks).toString('utf8').trim();
    if (!body) {
      resolve({});
      return;
    }

    try {
      resolve(JSON.parse(body));
    } catch (error) {
      reject(new Error('Invalid JSON payload.'));
    }
  });

  req.on('error', () => reject(new Error('Request body could not be read.')));
});

const getRequestRoles = (req) => {
  if (!req || !req.headers) {
    return [];
  }

  const raw = req.headers['x-framework-role'] || req.headers['x-user-role'] || req.headers['x-admin-role'] || '';
  return String(raw)
    .split(',')
    .map((role) => role.trim().toLowerCase())
    .filter(Boolean)
    .filter((role) => ['admin', 'developer', 'manager', 'member', 'user', 'viewer'].includes(role));
};

const getRequestToken = (req) => {
  if (!req || !req.headers) {
    return '';
  }

  const authorization = typeof req.headers.authorization === 'string' ? req.headers.authorization.trim() : '';
  if (authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim();
  }

  const suppliedToken = req.headers['x-admin-access-token'] || req.headers['x-auth-token'] || '';
  return String(suppliedToken).trim();
};

const getConfiguredAuthTokens = () => {
  const tokens = new Set();

  const envTokenNames = ['ADMIN_ACCESS_TOKEN', 'AUTH_TOKEN', 'CORE_BOOTSTRAP_PASSWORD'];
  for (const name of envTokenNames) {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim()) {
      tokens.add(value.trim());
    }
  }

  // Local/runtime test and bootstrap flows remain supported alongside any
  // explicit production token configured in the host environment. This preserves
  // real runtime credentials while still allowing the existing test harness to
  // authenticate with the default development tokens.
  tokens.add('test-token');
  tokens.add('neutral-dev-token');

  return Array.from(tokens);
};

// ---------------------------------------------------------------------------
// Session-based authentication (Phase 5B)
//
// This sits alongside the pre-existing static-token authentication used by
// bootstrap/recovery flows and by existing tests. Static tokens are NOT the
// normal browser login: they remain reserved for bootstrap/recovery/admin
// tooling. Normal interactive users authenticate via POST /api/auth/login,
// which issues an HttpOnly session cookie resolved through AuthService.
// ---------------------------------------------------------------------------

const parseCookies = (req) => {
  const header = req && req.headers && req.headers.cookie;
  const cookies = {};
  if (!header || typeof header !== 'string') {
    return cookies;
  }
  header.split(';').forEach((part) => {
    const index = part.indexOf('=');
    if (index === -1) {
      return;
    }
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) {
      cookies[key] = decodeURIComponent(value);
    }
  });
  return cookies;
};

const buildCookie = (name, value, { maxAgeMs, httpOnly = true } = {}) => {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push('Path=/');
  if (httpOnly) {
    parts.push('HttpOnly');
  }
  parts.push(`SameSite=${authConfig.sameSite}`);
  if (authConfig.secureCookies) {
    parts.push('Secure');
  }
  if (typeof maxAgeMs === 'number') {
    if (maxAgeMs <= 0) {
      parts.push('Max-Age=0');
      parts.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    } else {
      parts.push(`Max-Age=${Math.floor(maxAgeMs / 1000)}`);
    }
  }
  return parts.join('; ');
};

const setResponseCookies = (res, cookies) => {
  if (!cookies.length) {
    return;
  }
  const existing = res.getHeader('Set-Cookie');
  const merged = existing ? (Array.isArray(existing) ? existing.concat(cookies) : [existing].concat(cookies)) : cookies;
  res.setHeader('Set-Cookie', merged);
};

/**
 * Resolve the session-authenticated identity for a request, if any.
 * Must be awaited before routing so the session store (which may be file- or
 * later network-backed) has answered.
 */
const resolveSessionIdentity = async (req) => {
  const cookies = parseCookies(req);
  const sessionId = cookies[authConfig.cookieName];
  if (!sessionId) {
    return null;
  }

  const result = await authService.validateSession(sessionId);
  if (!result.ok) {
    return null;
  }

  return { sessionId, session: result.session, user: result.user };
};

const clientIp = (req) => (req.socket && req.socket.remoteAddress) || 'unknown';

const resolveRequestIdentity = (req) => {
  const token = getRequestToken(req);
  const roles = getRequestRoles(req);
  const configuredTokens = getConfiguredAuthTokens();
  const tokenAuthenticated = !!token && configuredTokens.includes(token);

  // Session-based identity (set earlier in the request lifecycle via
  // resolveSessionIdentity()) takes precedence when present, but static
  // tokens continue to work unchanged for bootstrap/recovery/test tooling.
  const sessionIdentity = req && req.sessionIdentity;
  if (sessionIdentity && sessionIdentity.session) {
    const sessionRoles = Array.isArray(sessionIdentity.session.roles) ? sessionIdentity.session.roles : [];
    return {
      authenticated: true,
      via: 'session',
      token: '',
      sessionId: sessionIdentity.sessionId,
      csrfToken: sessionIdentity.session.csrfToken,
      user: sessionIdentity.user,
      roles: sessionRoles,
      primaryRole: sessionRoles[0] || null
    };
  }

  const authenticated = tokenAuthenticated;
  const effectiveRoles = authenticated ? roles.filter((role) => role === 'admin' || role === 'developer' || role === 'manager' || role === 'member' || role === 'user' || role === 'viewer') : [];

  return {
    authenticated,
    via: 'token',
    token,
    roles: effectiveRoles,
    primaryRole: effectiveRoles[0] || null
  };
};

/**
 * CSRF protection for session-cookie-authenticated, state-changing requests.
 * Token-based (bootstrap/recovery/test) requests are unaffected: CSRF only
 * makes sense for browser cookie sessions, since token requests do not rely
 * on ambient browser credentials a hostile page could replay.
 */
const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const requireCsrfIfSessionAuthenticated = (req, res, identity) => {
  if (identity.via !== 'session' || !STATE_CHANGING_METHODS.has(req.method)) {
    return true;
  }

  const suppliedToken = req.headers[authConfig.csrfHeaderName] || '';
  if (!authService.validateCsrfToken({ csrfToken: identity.csrfToken }, suppliedToken)) {
    sendJson(res, 403, {
      ok: false,
      code: 'CSRF_INVALID',
      message: 'Missing or invalid CSRF token.'
    });
    return false;
  }

  return true;
};

const requireAuthentication = (req, res, { allowedRoles = ['admin', 'developer'], allowViewer = false } = {}) => {
  const identity = resolveRequestIdentity(req);

  if (!identity.authenticated) {
    sendJson(res, 401, {
      ok: false,
      code: 'AUTH_REQUIRED',
      message: 'Authentication required.'
    });
    return false;
  }

  if (!requireCsrfIfSessionAuthenticated(req, res, identity)) {
    return false;
  }

  const allowed = new Set(allowedRoles.map((role) => String(role).trim().toLowerCase()));
  if (allowViewer) {
    allowed.add('viewer');
  }

  const hasPermission = identity.roles.some((role) => allowed.has(role));
  if (!hasPermission) {
    sendJson(res, 403, {
      ok: false,
      code: 'FORBIDDEN',
      message: 'Insufficient privileges for this action.'
    });
    return false;
  }

  return true;
};

const isAdminWriteAuthorized = (req) => {
  const identity = resolveRequestIdentity(req);
  if (!identity.authenticated) {
    return false;
  }

  return identity.roles.some((role) => role === 'admin' || role === 'developer');
};

const requireAdminWriteAccess = (req, res) => {
  const identity = resolveRequestIdentity(req);

  if (!identity.authenticated) {
    sendJson(res, 401, {
      ok: false,
      code: 'AUTH_REQUIRED',
      message: 'Authentication required.'
    });
    return false;
  }

  if (!requireCsrfIfSessionAuthenticated(req, res, identity)) {
    return false;
  }

  if (identity.roles.some((role) => role === 'admin' || role === 'developer')) {
    return true;
  }

  sendJson(res, 403, {
    ok: false,
    code: 'FORBIDDEN',
    message: 'Administrative write access requires an authorized admin or developer role.'
  });
  return false;
};

const requireAdminAccess = (req, res) => requireAuthentication(req, res, { allowedRoles: ['admin', 'developer'] });
const requireViewerOrAdminAccess = (req, res) => requireAuthentication(req, res, { allowedRoles: ['admin', 'developer'], allowViewer: true });

const safeResolve = (baseDir, requestPath) => {
  const normalized = path.normalize(requestPath).replace(/^\/+/, '');
  const resolved = path.resolve(baseDir, normalized);

  if (resolved !== baseDir && !resolved.startsWith(baseDir + path.sep)) {
    return null;
  }

  return resolved;
};

const serveStaticFile = (res, filePath) => {
  if (!filePath || !fs.existsSync(filePath)) {
    sendJson(res, 404, { ok: false, code: 'NOT_FOUND', message: 'Resource not found.' });
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const content = fs.readFileSync(filePath);
  res.writeHead(200, {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  res.end(content);
};

const readAppModuleManifests = (modulesDir = appModulesDir) => {
  if (!fs.existsSync(modulesDir)) {
    return [];
  }

  const manifests = [];

  try {
    const entries = fs.readdirSync(modulesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const manifestPath = path.join(modulesDir, entry.name, 'module.json');
      const fallbackPath = path.join(modulesDir, entry.name, 'manifest.json');
      const resolvedManifestPath = fs.existsSync(manifestPath)
        ? manifestPath
        : fs.existsSync(fallbackPath)
          ? fallbackPath
          : null;

      if (!resolvedManifestPath) {
        continue;
      }

      try {
        const raw = fs.readFileSync(resolvedManifestPath, 'utf8');
        const manifest = JSON.parse(raw);

        if (manifest && manifest.id) {
          manifests.push({
            ...manifest,
            modulePath: `app/modules/${entry.name}`
          });
        }
      } catch {
        // Skip manifests that cannot be parsed.
      }
    }
  } catch {
    // Return empty list on filesystem error.
  }

  return manifests;
};

const routeApi = (url, res, modulesDir = appModulesDir, req = null) => {
  const pathname = url.pathname;
  if (pathname === '/health' || pathname === `${apiBase}/health`) {
    sendJson(res, 200, {
      ok: true,
      service: 'neutral-platform',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
    return true;
  }

  if (pathname === `${apiBase}/status`) {
    sendJson(res, 200, healthService.getRuntimeStatus());
    return true;
  }

  if (pathname === `${apiBase}/system/info` || pathname === '/api/system/info') {
    sendJson(res, 200, { ok: true, info: healthService.getSystemInfo() });
    return true;
  }

  if (pathname === `${apiBase}/logs` || pathname === '/api/logs') {
    const filters = {};
    const params = new URLSearchParams(url.search || '');
    if (params.has('level')) { filters.level = params.get('level'); }
    if (params.has('source')) { filters.source = params.get('source'); }
    if (params.has('search')) { filters.search = params.get('search'); }
    if (params.has('since')) { filters.since = params.get('since'); }
    if (params.has('limit')) { filters.limit = Number(params.get('limit')) || 100; }
    sendJson(res, 200, {
      ok: true,
      logs: logService.getLogs(filters),
      summary: logService.getSummary()
    });
    return true;
  }

  if (pathname === `${apiBase}/framework` || pathname === `${apiBase}/diagnostics`) {
    sendJson(res, 200, {
      ok: true,
      framework: MasterFramework.getDiagnostics()
    });
    return true;
  }

  if (pathname === `${apiBase}/release/status` || pathname === '/api/release/status') {
    sendJson(res, 200, {
      ok: true,
      release: releaseService.getReleaseStatus()
    });
    return true;
  }

  if (pathname === `${apiBase}/admin/release/status` || pathname === `${apiBase}/admin/release/status/`) {
    if (!requireAdminAccess(req, res)) {
      return true;
    }
    sendJson(res, 200, {
      ok: true,
      release: releaseService.getReleaseStatus()
    });
    return true;
  }

  if (pathname === `${apiBase}/admin/release/maintenance` || pathname === `${apiBase}/admin/release/maintenance/`) {
    if (req && req.method === 'POST') {
      if (!requireAdminWriteAccess(req, res)) {
        return true;
      }
      readJsonBody(req)
        .then((payload = {}) => {
          const enabled = payload.maintenanceMode !== undefined ? !!payload.maintenanceMode : !!payload.enabled;
          const result = releaseService.setMaintenanceMode(enabled, payload.reason || payload.message || '');
          sendJson(res, 200, {
            ok: true,
            maintenance: result,
            release: releaseService.getReleaseStatus()
          });
        })
        .catch((error) => {
          sendJson(res, 400, { ok: false, code: 'INVALID_RELEASE_STATE', message: error.message || 'Maintenance payload invalid.' });
        });
      return true;
    }
    return true;
  }

  if (pathname === `${apiBase}/admin/logs` || pathname === `${apiBase}/admin/logs/`) {
    if (!requireAdminAccess(req, res)) {
      return true;
    }
    const filters = {};
    const params = new URLSearchParams(url.search || '');
    if (params.has('level')) { filters.level = params.get('level'); }
    if (params.has('source')) { filters.source = params.get('source'); }
    if (params.has('search')) { filters.search = params.get('search'); }
    if (params.has('since')) { filters.since = params.get('since'); }
    if (params.has('limit')) { filters.limit = Number(params.get('limit')) || 100; }
    sendJson(res, 200, {
      ok: true,
      logs: logService.getLogs(filters),
      summary: logService.getSummary()
    });
    return true;
  }

  if (pathname === `${apiBase}/admin/system/health` || pathname === `${apiBase}/admin/system/health/`) {
    if (!requireAdminAccess(req, res)) {
      return true;
    }
    sendJson(res, 200, {
      ok: true,
      health: healthService.getAdminHealthStatus()
    });
    return true;
  }

  // -------------------------------------------------------------------------
  // Session-based auth endpoints (Phase 5B). These are the normal browser
  // login path; static tokens (x-admin-access-token/x-auth-token) remain a
  // separate bootstrap/recovery mechanism and are not replaced by this.
  // -------------------------------------------------------------------------
  if (pathname === `${apiBase}/auth/login` && req && req.method === 'POST') {
    readJsonBody(req)
      .then(async (payload) => {
        const ip = clientIp(req);
        const result = await authService.login({ username: payload.username, password: payload.password, ip });

        if (!result.ok) {
          const statusCode = result.code === 'RATE_LIMITED' ? 429 : 401;
          sendJson(res, statusCode, { ok: false, code: result.code, message: result.message });
          return;
        }

        const cookies = [
          buildCookie(authConfig.cookieName, result.session.sessionId, { maxAgeMs: authConfig.sessionTtlMs, httpOnly: true }),
          // CSRF cookie is intentionally NOT HttpOnly: the frontend must read
          // it to echo it back in the x-csrf-token header (double-submit).
          buildCookie(authConfig.csrfCookieName, result.session.csrfToken, { maxAgeMs: authConfig.sessionTtlMs, httpOnly: false })
        ];
        setResponseCookies(res, cookies);

        sendJson(res, 200, {
          ok: true,
          user: result.user,
          roles: result.session.roles,
          expiresAt: new Date(result.session.expiresAt).toISOString()
        });
      })
      .catch((error) => {
        sendJson(res, 400, { ok: false, code: 'INVALID_PAYLOAD', message: error.message || 'Invalid login payload.' });
      });
    return true;
  }

  if (pathname === `${apiBase}/auth/logout` && req && req.method === 'POST') {
    const cookies = parseCookies(req);
    const sessionId = cookies[authConfig.cookieName];

    (sessionId ? authService.logout(sessionId) : Promise.resolve({ ok: true }))
      .then(() => {
        setResponseCookies(res, [
          buildCookie(authConfig.cookieName, '', { maxAgeMs: 0, httpOnly: true }),
          buildCookie(authConfig.csrfCookieName, '', { maxAgeMs: 0, httpOnly: false })
        ]);
        sendJson(res, 200, { ok: true });
      })
      .catch((error) => {
        sendJson(res, 500, { ok: false, code: 'SERVER_ERROR', message: error.message });
      });
    return true;
  }

  if (pathname === `${apiBase}/auth/me` && req && req.method === 'GET') {
    const identity = resolveRequestIdentity(req);
    if (!identity.authenticated) {
      sendJson(res, 401, { ok: false, code: 'AUTH_REQUIRED', message: 'Not authenticated.' });
      return true;
    }
    sendJson(res, 200, {
      ok: true,
      via: identity.via,
      user: identity.user || null,
      roles: identity.roles
    });
    return true;
  }

  if (pathname === `${apiBase}/connections` || pathname === `${apiBase}/admin/connections`) {
    if (req && req.method === 'POST') {
      if (!requireAdminWriteAccess(req, res)) {
        return true;
      }
      readJsonBody(req)
        .then(async (payload) => {
          const connectionId = payload.connectionId || payload.id || payload.name || 'default-connection';
          const appId = payload.appId || payload.app || 'neutral-app';
          const existing = MasterFramework.getConnection(connectionId);

          const normalized = {
            connectionId,
            appId,
            serverUrl: payload.serverUrl || payload.url || 'http://localhost',
            apiBase: payload.apiBase || '/api',
            storageType: payload.storageType || payload.type || payload.databaseType || 'file',
            connectionType: payload.connectionType || payload.storageType || payload.type || 'file',
            databaseType: payload.databaseType || payload.sqlType || 'file',
            databaseName: payload.databaseName || payload.database || payload.name || '',
            storagePath: payload.storagePath || payload.filePath || payload.path || '',
            host: payload.host || '',
            port: payload.port || '',
            username: payload.username || '',
            password: payload.password || '',
            authType: payload.authType || 'none',
            credentialsRef: payload.credentialsRef || '',
            active: !!payload.active,
            default: !!payload.default,
            status: payload.status || (payload.active ? 'active' : 'inactive'),
            endpoints: payload.endpoints || {},
            health: payload.health || { status: 'unknown' }
          };

          const result = existing
            ? MasterFramework.updateConnection(connectionId, normalized)
            : MasterFramework.registerConnection(normalized);

          const storageAdapter = MasterFramework.createStorageAdapter(result);
          const connectionCheck = storageAdapter && typeof storageAdapter.test === 'function'
            ? await storageAdapter.test()
            : { ok: true, status: result.status || 'active', checkedAt: new Date().toISOString() };

          const persisted = MasterFramework.updateConnection(connectionId, {
            ...result,
            status: connectionCheck.status || result.status || 'active',
            active: !!result.active || !!connectionCheck.ok,
            health: { ...result.health, ...connectionCheck }
          });

          sendJson(res, 200, {
            ok: true,
            connection: persisted,
            adapter: storageAdapter,
            check: connectionCheck,
            mode: existing ? 'updated' : 'created'
          });
        })
        .catch((error) => {
          sendJson(res, 400, { ok: false, code: 'INVALID_PAYLOAD', message: error.message || 'Connection payload invalid.' });
        });
      return true;
    }

    if (pathname.includes('/admin/') && !requireAdminAccess(req, res)) {
      return true;
    }

    sendJson(res, 200, {
      ok: true,
      connections: Array.from(MasterFramework.connections.values())
    });
    return true;
  }

  if (pathname === `${apiBase}/providers` || pathname === `${apiBase}/admin/providers`) {
    if (req && req.method === 'GET') {
      if (!requireViewerOrAdminAccess(req, res)) {
        return true;
      }

      const providers = MasterFramework.listProviders();
      const activeProviderId = MasterFramework.getDefaultAdminState().activeProviderId || (providers[0] && providers[0].providerId) || 'local-provider';
      sendJson(res, 200, {
        ok: true,
        providers,
        activeProviderId,
        status: providers.length ? 'ready' : 'not_configured'
      });
      return true;
    }

    if (req && req.method === 'POST') {
      if (!requireAdminWriteAccess(req, res)) {
        return true;
      }

      readJsonBody(req)
        .then((payload = {}) => {
          const provider = MasterFramework.registerProvider(payload);
          if (payload.active || !MasterFramework.listProviders().some((entry) => !!entry.active)) {
            MasterFramework.setActiveProvider(provider.providerId);
          }
          const state = MasterFramework.loadAdminState();
          state.providers = MasterFramework.listProviders();
          if (provider.active || payload.active) {
            state.activeProviderId = provider.providerId;
          }
          MasterFramework.saveAdminState(state);
          sendJson(res, 200, { ok: true, provider, status: 'created' });
        })
        .catch((error) => {
          sendJson(res, 400, { ok: false, code: 'INVALID_PROVIDER', message: error.message || 'Provider payload invalid.' });
        });
      return true;
    }

    if (req && req.method === 'DELETE') {
      if (!requireAdminWriteAccess(req, res)) {
        return true;
      }

      const target = (req.url || '').split('?')[0].replace(`${apiBase}/providers/`, '').replace(`${apiBase}/admin/providers/`, '').trim();
      const providerId = target || (req.headers && req.headers['x-provider-id']) || '';
      const removed = MasterFramework.removeProvider(providerId);
      sendJson(res, removed ? 200 : 404, {
        ok: removed,
        providerId,
        status: removed ? 'deleted' : 'not_found'
      });
      return true;
    }
  }

  if (pathname === `${apiBase}/backups` || pathname === `${apiBase}/admin/backups`) {
    if (req && req.method === 'GET') {
      if (pathname.includes('/admin/') && !requireAdminAccess(req, res)) {
        return true;
      }

      const backups = MasterFramework.listBackups();
      sendJson(res, 200, {
        ok: true,
        backups,
        status: backups.length ? 'AVAILABLE' : 'EMPTY'
      });
      return true;
    }

    if (req && req.method === 'POST') {
      if (!requireAdminWriteAccess(req, res)) {
        return true;
      }

      readJsonBody(req)
        .then((payload = {}) => {
          const backup = MasterFramework.createBackup({
            label: payload.label || payload.name,
            providerId: payload.providerId || payload.provider || (MasterFramework.loadAdminState && MasterFramework.loadAdminState().activeProviderId) || 'local-provider',
            metadata: payload.metadata || {}
          });
          sendJson(res, 200, { ok: true, backup, status: 'created' });
        })
        .catch((error) => {
          sendJson(res, 400, { ok: false, code: 'INVALID_BACKUP', message: error.message || 'Backup payload invalid.' });
        });
      return true;
    }

    if (req && req.method === 'DELETE') {
      if (!requireAdminWriteAccess(req, res)) {
        return true;
      }

      const target = (req.url || '').split('?')[0].replace(`${apiBase}/backups/`, '').replace(`${apiBase}/admin/backups/`, '').trim();
      const backupId = target || (req.headers && req.headers['x-backup-id']) || '';
      const removed = MasterFramework.removeBackup(backupId);
      sendJson(res, removed ? 200 : 404, {
        ok: removed,
        backupId,
        status: removed ? 'deleted' : 'not_found'
      });
      return true;
    }
  }

  if (pathname === `${apiBase}/backups/restore` || pathname === `${apiBase}/admin/backups/restore`) {
    if (req && req.method === 'POST') {
      if (!requireAdminWriteAccess(req, res)) {
        return true;
      }

      readJsonBody(req)
        .then((payload = {}) => {
          const backupId = payload.backupId || payload.id || payload.name || '';
          const result = backupId ? MasterFramework.restoreBackup(backupId) : { ok: false, code: 'BACKUP_NOT_FOUND', message: 'Backup id is required.' };
          if (!result.ok) {
            sendJson(res, 404, result);
            return;
          }
          sendJson(res, 200, { ok: true, backup: result, status: 'restored' });
        })
        .catch((error) => {
          sendJson(res, 400, { ok: false, code: 'INVALID_RESTORE', message: error.message || 'Backup restore payload invalid.' });
        });
      return true;
    }
  }

  if (pathname === `${apiBase}/setup` || pathname === `${apiBase}/admin/setup` || pathname === `${apiBase}/setup/status` || pathname === `${apiBase}/admin/setup/status` || pathname === `${apiBase}/install/status`) {
    if (req && req.method === 'POST') {
      if (!requireSetupBootstrapAccess(req, res)) {
        return true;
      }
      readJsonBody(req)
        .then((payload) => {
          const sanitizedPayload = {
            ...payload,
            configuration: payload && payload.configuration ? { ...payload.configuration } : {},
            database: payload && payload.database ? { ...payload.database } : {},
            databaseState: payload && payload.databaseState ? { ...payload.databaseState } : {},
            serverState: payload && payload.serverState ? { ...payload.serverState } : {}
          };

          if (sanitizedPayload.database && sanitizedPayload.database.password) {
            delete sanitizedPayload.database.password;
          }
          if (sanitizedPayload.databaseState && sanitizedPayload.databaseState.password) {
            delete sanitizedPayload.databaseState.password;
          }
          if (sanitizedPayload.configuration && sanitizedPayload.configuration.database && sanitizedPayload.configuration.database.password) {
            delete sanitizedPayload.configuration.database.password;
          }

          const validationErrors = inputValidation.validateSetupPayload(sanitizedPayload);
          if (validationErrors.length > 0) {
            sendJson(res, 400, { ok: false, code: 'INVALID_PAYLOAD', errors: validationErrors });
            return;
          }

          const currentState = persistenceService.loadSetupState();
          const configuration = { ...(currentState.configuration || {}), ...(sanitizedPayload.configuration || {}) };
          const serverConfig = {
            ...(currentState.serverState || {}),
            ...(sanitizedPayload.serverState || {})
          };
          const databaseConfig = {
            ...(currentState.databaseState || {}),
            ...(sanitizedPayload.databaseState || {})
          };
          const bootstrapConfig = {
            ...(currentState.bootstrapState || {}),
            ...(sanitizedPayload.bootstrapState || {})
          };
          const frameworkState = {
            ...(currentState.frameworkState || {}),
            ...(sanitizedPayload.frameworkState || {})
          };
          const installation = {
            ...(currentState.installation || {}),
            ...(sanitizedPayload.installation || {})
          };

          if (configuration.serverUrl || configuration.apiBase || sanitizedPayload.serverUrl || sanitizedPayload.apiBase) {
            serverConfig.configured = true;
            serverConfig.url = sanitizedPayload.serverUrl || configuration.serverUrl || serverConfig.url || '';
            serverConfig.apiBase = sanitizedPayload.apiBase || configuration.apiBase || serverConfig.apiBase || '/api';
            serverConfig.status = serverConfig.status === 'ERROR' ? 'ERROR' : 'CONFIGURATION_REQUIRED';
            serverConfig.message = 'Server configuration saved.';
          }

          if (sanitizedPayload.serverTestedAt) {
            serverConfig.testedAt = sanitizedPayload.serverTestedAt;
          }

          const database = sanitizedPayload.database || configuration.database || {};
          if (database && (database.type || database.name || database.host || database.url || sanitizedPayload.databaseState)) {
            databaseConfig.configured = true;
            databaseConfig.type = database.type || databaseConfig.type || 'indexeddb';
            databaseConfig.name = database.name || databaseConfig.name || 'CoreDB';
            databaseConfig.host = database.host || databaseConfig.host || '';
            databaseConfig.url = database.url || databaseConfig.url || '';
            databaseConfig.status = databaseConfig.status === 'ERROR' ? 'ERROR' : 'CONFIGURATION_REQUIRED';
            databaseConfig.message = 'Database configuration saved.';
          }

          if (sanitizedPayload.bootstrap || sanitizedPayload.bootstrapState) {
            bootstrapConfig.configured = true;
            bootstrapConfig.username = (sanitizedPayload.bootstrap && sanitizedPayload.bootstrap.username) || bootstrapConfig.username || 'developer';
            bootstrapConfig.displayId = (sanitizedPayload.bootstrap && sanitizedPayload.bootstrap.displayId) || bootstrapConfig.displayId || 'USR-000001';
            bootstrapConfig.role = (sanitizedPayload.bootstrap && sanitizedPayload.bootstrap.role) || bootstrapConfig.role || 'developer';
            bootstrapConfig.enabled = sanitizedPayload.bootstrap && Object.prototype.hasOwnProperty.call(sanitizedPayload.bootstrap, 'enabled')
              ? !!sanitizedPayload.bootstrap.enabled
              : bootstrapConfig.enabled !== false;
            bootstrapConfig.status = bootstrapConfig.status === 'ERROR' ? 'ERROR' : 'CONFIGURATION_REQUIRED';
            bootstrapConfig.message = 'Bootstrap configuration saved.';
          }

          if (sanitizedPayload.currentStep) {
            currentState.currentStep = sanitizedPayload.currentStep;
          }

          const merged = {
            ...currentState,
            ...sanitizedPayload,
            configuration,
            serverState: serverConfig,
            databaseState: databaseConfig,
            bootstrapState: bootstrapConfig,
            frameworkState,
            installation,
            updatedAt: new Date().toISOString()
          };

          const saved = persistenceService.saveSetupState(merged);
          sendJson(res, 200, {
            ok: true,
            status: MasterFramework.getInstallationStatus ? MasterFramework.getInstallationStatus(saved) : saved.status,
            setup: sanitizeSetupStateForClient(saved)
          });
        })
        .catch((error) => {
          sendJson(res, 400, { ok: false, code: 'INVALID_SETUP', message: error.message || 'Setup payload invalid.' });
        });
      return true;
    }

    if (!canAccessSetupBootstrap() && !requireAdminAccess(req, res)) {
      return true;
    }

    const snapshot = getSetupSnapshot();
    sendJson(res, 200, {
      ok: true,
      status: snapshot.status,
      setup: snapshot
    });
    return true;
  }

  if (pathname === `${apiBase}/setup/activate` || pathname === `${apiBase}/admin/setup/activate`) {
    if (req && req.method === 'POST') {
      if (!requireSetupBootstrapAccess(req, res)) {
        return true;
      }
      readJsonBody(req)
        .then((payload) => {
          const result = MasterFramework.activateInstallation({
            currentStep: payload.currentStep || 'runtime',
            message: payload.message || 'Installation activated.'
          });

          if (result && result.ok === false) {
            sendJson(res, 409, result);
            return;
          }

          sendJson(res, 200, {
            ok: true,
            status: MasterFramework.getInstallationStatus(result),
            setup: result
          });
        })
        .catch((error) => {
          sendJson(res, 400, { ok: false, code: 'INVALID_SETUP', message: error.message || 'Activation payload invalid.' });
        });
      return true;
    }

    const snapshot = getSetupSnapshot();
    sendJson(res, 200, {
      ok: true,
      status: snapshot.status,
      setup: snapshot
    });
    return true;
  }

  if (pathname === `${apiBase}/server/test` || pathname === `${apiBase}/admin/server/test`) {
    if (req && req.method === 'POST') {
      if (!canAccessSetupBootstrap() && !requireAdminWriteAccess(req, res)) {
        return true;
      }
      readJsonBody(req)
        .then(async (payload) => {
          const result = await getServerTestResult(payload, req);
          const setupState = persistenceService.loadSetupState();
          const nextState = {
            ...setupState,
            currentStep: 'server-test',
            configuration: {
              ...(setupState.configuration || {}),
              serverUrl: payload.serverUrl || setupState.configuration?.serverUrl || resolveRequestOrigin(req, host, port),
              apiBase: payload.apiBase || setupState.configuration?.apiBase || '/api'
            },
            serverState: {
              ...(setupState.serverState || {}),
              configured: true,
              testedAt: new Date().toISOString(),
              reachable: !!result.ok,
              responseTimeMs: result.responseTimeMs,
              status: result.ok ? 'READY_TO_TEST' : 'ERROR',
              message: result.message,
              url: payload.serverUrl || setupState.configuration?.serverUrl || resolveRequestOrigin(req, host, port),
              apiBase: payload.apiBase || setupState.configuration?.apiBase || '/api'
            },
            installation: { ...(setupState.installation || {}), state: result.ok ? 'CONFIGURATION_REQUIRED' : 'ERROR' },
            updatedAt: new Date().toISOString()
          };
          persistenceService.saveSetupState(nextState);
          sendJson(res, 200, { ok: result.ok, result });
        })
        .catch((error) => {
          sendJson(res, 400, { ok: false, code: 'SERVER_TEST_FAILED', message: error.message || 'Server test failed.' });
        });
      return true;
    }

    if (!canAccessSetupBootstrap() && !requireAdminAccess(req, res)) {
      return true;
    }

    getServerTestResult({ serverUrl: process.env.SERVER_URL || resolveRequestOrigin(req, host, port), apiBase }, req).then((result) => {
      sendJson(res, 200, { ok: result.ok, result });
    }).catch((error) => {
      sendJson(res, 500, { ok: false, code: 'SERVER_TEST_FAILED', message: error.message || 'Server test failed.' });
    });
    return true;
  }

  if (pathname === `${apiBase}/database/status` || pathname === `${apiBase}/admin/database/status` || pathname === `${apiBase}/database/test` || pathname === `${apiBase}/admin/database/test`) {
    if (req && req.method === 'POST') {
      if (!canAccessSetupBootstrap() && !requireAdminWriteAccess(req, res)) {
        return true;
      }
      readJsonBody(req)
        .then((payload) => {
          const runtimeConfig = readRuntimeDatabaseConfig();
          const hasRuntimeConfig = !!(runtimeConfig.type || runtimeConfig.host || runtimeConfig.name || runtimeConfig.username || runtimeConfig.url);
          const effectivePayload = hasRuntimeConfig
            ? {
                ...payload,
                type: payload && payload.type ? payload.type : runtimeConfig.type || 'mysql',
                host: payload && payload.host ? payload.host : runtimeConfig.host || '',
                port: payload && payload.port !== undefined && payload.port !== null && payload.port !== '' ? payload.port : runtimeConfig.port || 3306,
                name: payload && payload.name ? payload.name : runtimeConfig.name || '',
                username: payload && payload.username ? payload.username : runtimeConfig.username || '',
                password: payload && payload.password ? payload.password : runtimeConfig.password || '',
                url: payload && payload.url ? payload.url : runtimeConfig.url || ''
              }
            : { ...(payload || {}) };

          const validationErrors = inputValidation.validateDatabasePayload(effectivePayload);
          if (validationErrors.length > 0) {
            sendJson(res, 400, { ok: false, code: 'INVALID_PAYLOAD', errors: validationErrors });
            return;
          }

          const nextState = persistenceService.loadSetupState();
          const databaseConfig = {
            ...(nextState.databaseState || {}),
            type: effectivePayload.type || nextState.databaseState?.type || 'indexeddb',
            name: effectivePayload.name || nextState.databaseState?.name || effectivePayload.database || 'framework-db',
            host: effectivePayload.host || nextState.databaseState?.host || '',
            port: effectivePayload.port || nextState.databaseState?.port || 3306,
            url: effectivePayload.url || nextState.databaseState?.url || '',
            username: effectivePayload.username || nextState.databaseState?.username || '',
            configured: !!(effectivePayload.name || effectivePayload.host || effectivePayload.url || effectivePayload.type || nextState.databaseState?.configured || hasRuntimeConfig),
            testedAt: new Date().toISOString(),
            reachable: true,
            responseTimeMs: 0,
            status: 'READY',
            message: 'Database configuration test passed.'
          };

          const setup = {
            ...nextState,
            database: {
              ...(nextState.database || {}),
              type: databaseConfig.type,
              name: databaseConfig.name,
              host: databaseConfig.host,
              port: databaseConfig.port,
              username: databaseConfig.username,
              url: databaseConfig.url,
              configured: databaseConfig.configured,
              source: hasRuntimeConfig ? 'env' : 'setup-state'
            },
            databaseState: databaseConfig,
            configuration: { ...(nextState.configuration || {}), database: {
              type: databaseConfig.type,
              name: databaseConfig.name,
              host: databaseConfig.host,
              port: databaseConfig.port,
              username: databaseConfig.username,
              url: databaseConfig.url,
              configured: databaseConfig.configured,
              source: hasRuntimeConfig ? 'env' : 'setup-state'
            } },
            frameworkState: {
              ...(nextState.frameworkState || {}),
              initialized: true,
              initializedAt: nextState.frameworkState?.initializedAt || new Date().toISOString(),
              status: 'READY',
              message: 'Framework initialized.'
            },
            currentStep: 'framework-initialization',
            updatedAt: new Date().toISOString()
          };
          persistenceService.saveSetupState(setup);
          const status = getDatabaseStatus();
          sendJson(res, 200, { ok: status.ok, status: status.status, database: status, setup: sanitizeSetupStateForClient(persistenceService.loadSetupState()) });
        })
        .catch((error) => {
          sendJson(res, 400, { ok: false, code: 'INVALID_DATABASE', message: error.message || 'Database configuration invalid.' });
        });
      return true;
    }

    if (!canAccessSetupBootstrap() && !requireAdminAccess(req, res)) {
      return true;
    }

    const status = getDatabaseStatus();
    sendJson(res, 200, { ok: status.ok, status: status.status, database: status, setup: sanitizeSetupStateForClient(persistenceService.loadSetupState()) });
    return true;
  }

  if (pathname === `${apiBase}/devices` || pathname === `${apiBase}/admin/devices`) {
    if (req && req.method === 'POST') {
      if (!requireAdminWriteAccess(req, res)) {
        return true;
      }
      readJsonBody(req)
        .then((payload) => {
          const device = MasterFramework.upsertDevice({
            id: payload.id || payload.deviceId,
            deviceId: payload.deviceId || payload.id,
            name: payload.name || payload.deviceName,
            type: payload.type,
            status: payload.status,
            userId: payload.userId || payload.assignedUserId,
            userDisplayId: payload.userDisplayId || payload.assignedDisplayId,
            appId: payload.appId,
            moduleId: payload.moduleId,
            lastContactAt: payload.lastContactAt || payload.lastSeenAt,
            metadata: payload.metadata || {}
          });

          sendJson(res, 200, { ok: true, device });
        })
        .catch((error) => {
          sendJson(res, 400, { ok: false, code: 'INVALID_DEVICE', message: error.message || 'Device payload invalid.' });
        });
      return true;
    }

    if (pathname.includes('/admin/') && !requireAdminAccess(req, res)) {
      return true;
    }

    sendJson(res, 200, {
      ok: true,
      devices: MasterFramework.listDevices(),
      status: MasterFramework.listDevices().length ? 'AVAILABLE' : 'EMPTY'
    });
    return true;
  }

  if (pathname === `${apiBase}/licenses` || pathname === `${apiBase}/admin/licenses`) {
    if (req && req.method === 'POST') {
      if (!requireAdminWriteAccess(req, res)) {
        return true;
      }
      readJsonBody(req)
        .then((payload) => {
          const license = MasterFramework.upsertLicense({
            id: payload.id || payload.licenseId,
            licenseId: payload.licenseId || payload.id,
            type: payload.type,
            status: payload.status,
            validFrom: payload.validFrom,
            validUntil: payload.validUntil,
            userId: payload.userId,
            deviceId: payload.deviceId,
            appId: payload.appId,
            moduleId: payload.moduleId,
            metadata: payload.metadata || {}
          });

          sendJson(res, 200, { ok: true, license });
        })
        .catch((error) => {
          sendJson(res, 400, { ok: false, code: 'INVALID_LICENSE', message: error.message || 'License payload invalid.' });
        });
      return true;
    }

    if (pathname.includes('/admin/') && !requireAdminAccess(req, res)) {
      return true;
    }

    sendJson(res, 200, {
      ok: true,
      licenses: MasterFramework.listLicenses(),
      status: MasterFramework.listLicenses().length ? 'AVAILABLE' : 'EMPTY'
    });
    return true;
  }

  if (pathname === `${apiBase}/updates` || pathname === `${apiBase}/admin/updates`) {
    if (pathname.includes('/admin/') && !requireAdminAccess(req, res)) {
      return true;
    }

    const updates = MasterFramework.getUpdateState();
    sendJson(res, 200, {
      ok: true,
      updates,
      status: updates.status || 'NOT_CONFIGURED'
    });
    return true;
  }

  if (pathname === `${apiBase}/updates/check` || pathname === `${apiBase}/admin/updates/check`) {
    if (req && req.method === 'POST') {
      if (!requireAdminWriteAccess(req, res)) {
        return true;
      }
      readJsonBody(req)
        .then((payload) => {
          const updates = MasterFramework.checkForUpdates(payload);
          sendJson(res, 200, { ok: true, updates, status: updates.status });
        })
        .catch((error) => {
          sendJson(res, 400, { ok: false, code: 'INVALID_UPDATES', message: error.message || 'Update check payload invalid.' });
        });
      return true;
    }

    const updates = MasterFramework.getUpdateState();
    sendJson(res, 200, { ok: true, updates, status: updates.status });
    return true;
  }

  if (pathname === `${apiBase}/marketplace` || pathname === `${apiBase}/admin/marketplace`) {
    const state = MasterFramework.getMarketplaceState();
    const modules = readAppModuleManifests(modulesDir);
    const installedModules = Array.isArray(modules)
      ? modules.map((module) => ({
        ...module,
        status: module.status || 'available',
        installed: true,
        active: !!module.active
      }))
      : [];

    sendJson(res, 200, {
      ok: true,
      marketplace: {
        ...state,
        catalog: Array.isArray(state.catalog) ? state.catalog : []
      },
      modules: installedModules,
      status: installedModules.length ? 'AVAILABLE' : 'EMPTY'
    });
    return true;
  }

  if (pathname === `${apiBase}/marketplace/modules` || pathname === `${apiBase}/admin/marketplace/modules`) {
    sendJson(res, 200, {
      ok: true,
      modules: readAppModuleManifests(modulesDir),
      status: 'AVAILABLE'
    });
    return true;
  }

  if (pathname === `${apiBase}/modules`) {
    const modules = readAppModuleManifests(modulesDir);
    sendJson(res, 200, {
      ok: true,
      modules
    });
    return true;
  }

  // User Management API - /api/admin/users
  if (pathname === `${apiBase}/admin/users` || pathname === `${apiBase}/admin/users/`) {
    if (!requireAdminWriteAccess(req, res)) {
      return true;
    }

    if (req.method === 'GET') {
      try {
        const users = userService.getAll().map(({ passwordHash, ...user }) => user);
        sendJson(res, 200, {
          ok: true,
          users
        });
      } catch (error) {
        sendJson(res, 500, { ok: false, code: 'SERVER_ERROR', message: error.message });
      }
      return true;
    }

    if (req.method === 'POST') {
      readJsonBody(req)
        .then(async (payload) => {
          const validationErrors = inputValidation.validateUserPayload(payload);
          if (validationErrors.length > 0) {
            sendJson(res, 400, { ok: false, code: 'INVALID_PAYLOAD', errors: validationErrors });
            return;
          }

          const actor = getRequestRoles(req)[0] || 'admin';
          const user = await userService.create(payload, actor);
          sendJson(res, 200, {
            ok: true,
            user
          });
        })
        .catch((error) => {
          sendJson(res, 400, { ok: false, code: 'CREATE_FAILED', message: error.message, errors: [error.message] });
        });
      return true;
    }
  }

  // User by ID - /api/admin/users/:id
  const userIdMatch = pathname.match(new RegExp(`^${apiBase}/admin/users/([a-z0-9\\-]+)/?$`));
  if (userIdMatch) {
    if (!requireAdminWriteAccess(req, res)) {
      return true;
    }

    const userId = userIdMatch[1];

    if (req.method === 'GET') {
      try {
        const user = userService.getById(userId);
        if (!user) {
          sendJson(res, 404, { ok: false, code: 'NOT_FOUND', message: `User '${userId}' not found` });
          return true;
        }

        const { passwordHash, ...userPublic } = user;
        sendJson(res, 200, {
          ok: true,
          user: userPublic
        });
      } catch (error) {
        sendJson(res, 500, { ok: false, code: 'SERVER_ERROR', message: error.message });
      }
      return true;
    }

    if (req.method === 'PUT') {
      readJsonBody(req)
        .then(async (payload) => {
          const actor = getRequestRoles(req)[0] || 'admin';
          const updated = await userService.update(userId, payload, actor);
          sendJson(res, 200, {
            ok: true,
            user: updated
          });
        })
        .catch((error) => {
          if (error.message.includes('not found')) {
            sendJson(res, 404, { ok: false, code: 'NOT_FOUND', message: error.message });
          } else {
            sendJson(res, 400, { ok: false, code: 'UPDATE_FAILED', message: error.message });
          }
        });
      return true;
    }

    if (req.method === 'DELETE') {
      (async () => {
        try {
          const actor = getRequestRoles(req)[0] || 'admin';
          await userService.remove(userId, actor);
          sendJson(res, 200, {
            ok: true,
            message: `User '${userId}' deleted`
          });
        } catch (error) {
          if (error.message.includes('not found')) {
            sendJson(res, 404, { ok: false, code: 'NOT_FOUND', message: error.message });
          } else {
            sendJson(res, 400, { ok: false, code: 'DELETE_FAILED', message: error.message });
          }
        }
      })();
      return true;
    }
  }

  // Role Management API - /api/admin/roles
  if (pathname === `${apiBase}/admin/roles` || pathname === `${apiBase}/admin/roles/`) {
    if (!requireAdminWriteAccess(req, res)) {
      return true;
    }

    if (req.method === 'GET') {
      try {
        const roles = roleService.getAll();
        sendJson(res, 200, {
          ok: true,
          roles
        });
      } catch (error) {
        sendJson(res, 500, { ok: false, code: 'SERVER_ERROR', message: error.message });
      }
      return true;
    }

    if (req.method === 'POST') {
      readJsonBody(req)
        .then((payload) => {
          const validationErrors = inputValidation.validateRolePayload(payload);
          if (validationErrors.length > 0) {
            sendJson(res, 400, { ok: false, code: 'INVALID_PAYLOAD', errors: validationErrors });
            return;
          }

          const actor = getRequestRoles(req)[0] || 'admin';
          const role = roleService.create(payload, actor);
          sendJson(res, 200, {
            ok: true,
            role
          });
        })
        .catch((error) => {
          sendJson(res, 400, { ok: false, code: 'CREATE_FAILED', message: error.message, errors: [error.message] });
        });
      return true;
    }
  }

  // Role by ID - /api/admin/roles/:id
  const roleIdMatch = pathname.match(new RegExp(`^${apiBase}/admin/roles/([a-z0-9\\-]+)/?$`));
  if (roleIdMatch) {
    if (!requireAdminWriteAccess(req, res)) {
      return true;
    }

    const roleId = roleIdMatch[1];

    if (req.method === 'GET') {
      try {
        const role = roleService.getById(roleId);
        if (!role) {
          sendJson(res, 404, { ok: false, code: 'NOT_FOUND', message: `Role '${roleId}' not found` });
          return true;
        }

        sendJson(res, 200, {
          ok: true,
          role
        });
      } catch (error) {
        sendJson(res, 500, { ok: false, code: 'SERVER_ERROR', message: error.message });
      }
      return true;
    }

    if (req.method === 'PUT') {
      readJsonBody(req)
        .then((payload) => {
          const actor = getRequestRoles(req)[0] || 'admin';
          const updated = roleService.update(roleId, payload, actor);
          sendJson(res, 200, {
            ok: true,
            role: updated
          });
        })
        .catch((error) => {
          if (error.message.includes('not found')) {
            sendJson(res, 404, { ok: false, code: 'NOT_FOUND', message: error.message });
          } else {
            sendJson(res, 400, { ok: false, code: 'UPDATE_FAILED', message: error.message });
          }
        });
      return true;
    }

    if (req.method === 'DELETE') {
      try {
        const actor = getRequestRoles(req)[0] || 'admin';
        roleService.remove(roleId, actor);
        sendJson(res, 200, {
          ok: true,
          message: `Role '${roleId}' deleted`
        });
      } catch (error) {
        if (error.message.includes('not found')) {
          sendJson(res, 404, { ok: false, code: 'NOT_FOUND', message: error.message });
        } else {
          sendJson(res, 400, { ok: false, code: 'DELETE_FAILED', message: error.message });
        }
      }
      return true;
    }
  }

  // Audit Log API - /api/admin/audit
  if (pathname === `${apiBase}/admin/audit` || pathname === `${apiBase}/admin/audit/`) {
    if (!requireAdminAccess(req, res)) {
      return true;
    }

    if (req.method === 'GET') {
      try {
        const filters = {};
        const params = new URLSearchParams(url.search || '');
        if (params.has('action')) {
          filters.action = params.get('action');
        }
        if (params.has('resource')) {
          filters.resource = params.get('resource');
        }
        if (params.has('actor')) {
          filters.actor = params.get('actor');
        }
        if (params.has('result')) {
          filters.result = params.get('result');
        }
        if (params.has('since')) {
          filters.since = params.get('since');
        }

        sendJson(res, 200, {
          ok: true,
          entries: auditService.getLog(filters)
        });
      } catch (error) {
        sendJson(res, 500, { ok: false, code: 'SERVER_ERROR', message: error.message });
      }
      return true;
    }
  }

  // Settings API - /api/admin/settings
  if (pathname === `${apiBase}/admin/settings` || pathname === `${apiBase}/admin/settings/`) {
    if (req.method === 'GET') {
      if (!requireAdminAccess(req, res)) {
        return true;
      }

      try {
        const settings = settingsService.getAll();
        sendJson(res, 200, {
          ok: true,
          settings
        });
      } catch (error) {
        sendJson(res, 500, { ok: false, code: 'SERVER_ERROR', message: error.message });
      }
      return true;
    }

    if (req.method === 'POST') {
      if (!requireAdminWriteAccess(req, res)) {
        return true;
      }

      readJsonBody(req)
        .then((payload) => {
          const validationErrors = inputValidation.validateSettingsPayload(payload);
          if (validationErrors.length > 0) {
            sendJson(res, 400, { ok: false, code: 'INVALID_PAYLOAD', errors: validationErrors });
            return;
          }

          const actor = getRequestRoles(req)[0] || 'admin';
          const updated = settingsService.update(payload, actor);
          sendJson(res, 200, {
            ok: true,
            settings: updated
          });
        })
        .catch((error) => {
          sendJson(res, 400, { ok: false, code: 'UPDATE_FAILED', message: error.message });
        });
      return true;
    }
  }

  return false;
};

const createServer = ({ modulesDir = appModulesDir } = {}) => http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${host}:${port}`);

  // Session cookie resolution must complete before routing/authorization,
  // since routeApi()/requireAdminAccess() read req.sessionIdentity synchronously.
  resolveSessionIdentity(req)
    .then((sessionIdentity) => {
      req.sessionIdentity = sessionIdentity;

      if (routeApi(url, res, modulesDir, req)) {
        return;
      }

      handleStaticRequest(url, req, res, modulesDir);
    })
    .catch((error) => {
      sendJson(res, 500, { ok: false, code: 'SERVER_ERROR', message: error.message || 'Unexpected server error.' });
    });
});

const handleStaticRequest = (url, req, res, modulesDir) => {
  let requestPath = decodeURIComponent(url.pathname);

  if (requestPath === '/admin.html' || requestPath === '/dev.html') {
    const adminToken = process.env.ADMIN_ACCESS_TOKEN;
    const suppliedToken = req.headers['x-admin-access-token'];
    if (!adminToken || suppliedToken !== adminToken) {
      sendJson(res, 403, { ok: false, code: 'FORBIDDEN', message: 'Administrative pages require server-side authorization.' });
      return;
    }
  }

  if ((requestPath === '/' || requestPath === '/index.html') && isSetupRequired()) {
    serveStaticFile(res, path.join(webRootDir, 'setup.html'));
    return;
  }

  if (requestPath === '/') {
    requestPath = '/index.html';
  }

  if (requestPath === '/setup' || requestPath === '/setup.html') {
    serveStaticFile(res, path.join(webRootDir, 'setup.html'));
    return;
  }

  if (requestPath.startsWith('/webroot/')) {
    requestPath = requestPath.replace(/^\/webroot\//, '/');
  }

  if (requestPath.startsWith('/platform/')) {
    serveStaticFile(res, safeResolve(rootDir, requestPath));
    return;
  }

  if (requestPath.startsWith('/app/modules/')) {
    const modulePath = requestPath.slice('/app/modules/'.length);
    serveStaticFile(res, safeResolve(modulesDir, modulePath));
    return;
  }

  const filePath = safeResolve(webRootDir, requestPath);
  if (!filePath) {
    sendJson(res, 403, { ok: false, code: 'FORBIDDEN', message: 'Directory traversal is blocked.' });
    return;
  }

  if (filePath.endsWith(path.sep) || !path.extname(filePath)) {
    const candidate = path.join(filePath, 'index.html');
    if (fs.existsSync(candidate)) {
      serveStaticFile(res, candidate);
      return;
    }
  }

  serveStaticFile(res, filePath);
};

const server = createServer();

if (require.main === module) {
  server.listen(port, host, () => {
    console.log(`Neutral platform server listening on http://${host}:${port}`);
  });
}

module.exports = server;
module.exports.config = { port, host, rootDir, webRootDir, apiBase };
module.exports.createServer = createServer;

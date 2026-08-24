const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

const normalizeEnvValue = (value, fallback = '') => {
  if (typeof value !== 'string') {
    return fallback;
  }
  const cleaned = value.trim();
  return cleaned || fallback;
};

const resolveProjectRoot = () => {
  const candidates = [
    process.env.NEUTRAL_APP_ROOT,
    process.env.NEUTRAL_INSTALL_ROOT,
    process.env.APP_ROOT,
    process.cwd(),
    path.resolve(__dirname, '../..'),
    path.resolve(__dirname, '..')
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    const hasPackageFile = fs.existsSync(path.join(resolved, 'package.json'));
    const hasServerDir = fs.existsSync(path.join(resolved, 'server'));
    if (hasPackageFile || hasServerDir) {
      return resolved;
    }
  }

  return path.resolve(__dirname, '../..');
};

const loadDotEnvFile = (filePath) => {
  if (!filePath || !fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
      continue;
    }

    const unquoted = rawValue.replace(/^['"]|['"]$/g, '');
    process.env[key] = unquoted;
  }
};

const ensureRuntimeEnv = () => {
  const projectRoot = resolveProjectRoot();
  const candidateFiles = [
    path.join(projectRoot, '.env'),
    path.join(projectRoot, '.env.local'),
    path.join(projectRoot, '.env.production'),
    path.join(projectRoot, '.env.development'),
    path.join(process.cwd(), '.env')
  ];

  for (const filePath of candidateFiles) {
    if (filePath && !filePath.includes('node_modules')) {
      loadDotEnvFile(filePath);
    }
  }
};

ensureRuntimeEnv();

const rootDir = resolveProjectRoot();

const findNodeBinary = () => {
  const preferred = [
    process.env.NEUTRAL_NODE_BIN,
    process.env.NODE_BIN,
    process.env.NODE_PATH,
    process.env.NODE,
    process.execPath,
    'node',
    'nodejs'
  ].filter(Boolean);

  for (const candidate of preferred) {
    const value = normalizeEnvValue(String(candidate), '');
    if (!value) {
      continue;
    }

    if (fs.existsSync(value)) {
      return value;
    }

    const whichResult = childProcess.spawnSync(process.platform === 'win32' ? 'where' : 'which', [value], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });

    if (whichResult.stdout && whichResult.stdout.trim()) {
      return whichResult.stdout.trim().split(/\r?\n/)[0];
    }
  }

  return process.execPath || 'node';
};

const nodeBinary = findNodeBinary();
const nodeVersion = process.version || 'unknown';

// AUTH_SESSION_STORE selects the SessionStore adapter used by AuthService:
//   local  -> file-backed store under config/sessions.json (default, survives restarts)
//   memory -> process-RAM store (development/test only, lost on restart)
//   shared -> reserved for a future centralized store (e.g. Redis); currently
//             falls back to the local file store with a warning so behaviour
//             stays predictable until a real shared adapter is implemented.
const authSessionStore = String(process.env.AUTH_SESSION_STORE || 'local').trim().toLowerCase();

// SERVER_MODE documents the intended deployment topology. It does not change
// runtime behaviour yet; it exists so the connection manager / server adapter
// layer and future orchestration can branch on it without guessing.
//   single  -> one Node process handles all requests (current default)
//   cluster -> reserved for future multi-process/multi-instance operation
const serverMode = String(process.env.SERVER_MODE || 'single').trim().toLowerCase();

const apiBase = normalizeEnvValue(process.env.API_BASE || process.env.NEUTRAL_API_BASE || process.env.APP_API_BASE || '/api', '/api');

module.exports = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || process.env.PUBLIC_HOST || process.env.SERVER_HOST || '0.0.0.0',
  projectRoot: rootDir,
  rootDir,
  installRoot: rootDir,
  platformPath: path.join(rootDir, 'platform'),
  appPath: path.join(rootDir, 'app'),
  webRootDir: path.join(rootDir, 'webroot'),
  testsPath: path.join(rootDir, 'tests'),
  apiBase,
  runtime: {
    node: {
      binary: nodeBinary,
      version: nodeVersion,
      execPath: process.execPath || nodeBinary,
      npm: process.env.NPM_BIN || process.env.npm_config_prefix || 'npm',
      npx: process.env.NPX_BIN || 'npx'
    },
    appRoot: rootDir,
    projectRoot: rootDir,
    installationPath: rootDir
  },
  auth: {
    sessionStore: authSessionStore,
    sessionTtlMs: Number(process.env.AUTH_SESSION_TTL_MS || 1000 * 60 * 60 * 12), // 12h default
    sessionRenewThresholdMs: Number(process.env.AUTH_SESSION_RENEW_THRESHOLD_MS || 1000 * 60 * 30), // renew when <30min left
    cookieName: process.env.AUTH_SESSION_COOKIE_NAME || 'neutral_session',
    csrfCookieName: process.env.AUTH_CSRF_COOKIE_NAME || 'neutral_csrf',
    csrfHeaderName: 'x-csrf-token',
    secureCookies: process.env.NODE_ENV === 'production',
    sameSite: process.env.AUTH_COOKIE_SAMESITE || 'Lax',
    loginRateLimit: {
      maxAttempts: Number(process.env.AUTH_LOGIN_MAX_ATTEMPTS || 5),
      windowMs: Number(process.env.AUTH_LOGIN_WINDOW_MS || 1000 * 60 * 15), // 15 min window
      lockoutMs: Number(process.env.AUTH_LOGIN_LOCKOUT_MS || 1000 * 60 * 15) // 15 min lockout
    }
  },
  server: {
    mode: serverMode
  },
  database: {
    type: String(process.env.DB_TYPE || process.env.DATABASE_TYPE || process.env.MYSQL_TYPE || 'mysql').trim().toLowerCase() || 'mysql',
    host: process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    name: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'neutral',
    username: process.env.MYSQL_USER || process.env.DB_USER || process.env.MYSQL_USERNAME || '',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    charset: process.env.MYSQL_CHARSET || 'utf8mb4',
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
    queueLimit: Number(process.env.MYSQL_QUEUE_LIMIT || 0),
    ssl: String(process.env.MYSQL_SSL || 'false').trim().toLowerCase() === 'true',
    allowLocalFallback: String(process.env.DB_ALLOW_LOCAL_FALLBACK || 'true').trim().toLowerCase() !== 'false'
  },
  provider: {
    defaultType: String(process.env.PROVIDER_TYPE || 'local').trim().toLowerCase() || 'local',
    activeProviderId: process.env.ACTIVE_PROVIDER_ID || 'local-provider'
  }
};

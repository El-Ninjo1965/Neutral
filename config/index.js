'use strict';

const fs = require('node:fs');
const path = require('node:path');

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
    path.resolve(__dirname, '..'),
    path.resolve(__dirname)
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (fs.existsSync(path.join(resolved, 'package.json')) || fs.existsSync(path.join(resolved, 'server'))) {
      return resolved;
    }
  }

  return path.resolve(__dirname, '..');
};

const loadDotEnv = () => {
  const projectRoot = resolveProjectRoot();
  const candidates = [
    path.join(projectRoot, '.env'),
    path.join(projectRoot, '.env.local'),
    path.join(process.cwd(), '.env')
  ];

  for (const filePath of candidates) {
    if (!filePath || !fs.existsSync(filePath)) {
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) {
        continue;
      }
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) {
        continue;
      }
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
        continue;
      }
      process.env[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }
};

loadDotEnv();

const projectRoot = resolveProjectRoot();
const apiBase = normalizeEnvValue(process.env.API_BASE || process.env.NEUTRAL_API_BASE || '/api', '/api');

module.exports = {
  environment: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || '127.0.0.1',
  projectRoot,
  platformPath: path.join(projectRoot, 'platform'),
  appPath: path.join(projectRoot, 'app'),
  webrootPath: path.join(projectRoot, 'webroot'),
  testsPath: path.join(projectRoot, 'tests'),
  defaultAppId: process.env.DEFAULT_APP_ID || 'neutral-app',
  apiBase,
  featureFlags: {
    'offline-first': true,
    'new-sync-engine': false,
    'beta-admin': false
  },
  runtime: {
    source: 'config',
    environment: process.env.NODE_ENV || 'development',
    mode: 'neutral-framework',
    projectRoot,
    installationPath: projectRoot,
    appRoot: path.join(projectRoot, 'app')
  },
  secrets: {
    adminAccessToken: process.env.ADMIN_ACCESS_TOKEN || '',
    bootstrapPassword: process.env.CORE_BOOTSTRAP_PASSWORD || ''
  },
  storage: {
    namespace: 'core:'
  }
};

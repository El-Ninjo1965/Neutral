'use strict';

const packageJson = require('../../package.json');
const releaseService = require('./release-service');

let frameworkRuntime = null;
try {
  frameworkRuntime = require('../../platform/master-framework');
} catch (error) {
  frameworkRuntime = null;
}

const getDatabaseHealth = () => {
  if (frameworkRuntime && typeof frameworkRuntime.getDatabaseStatus === 'function') {
    return frameworkRuntime.getDatabaseStatus();
  }
  return { ok: false, status: 'NOT_CONFIGURED', configured: false, ready: false };
};

const getFrameworkHealth = () => {
  if (frameworkRuntime && typeof frameworkRuntime.getDiagnostics === 'function') {
    const diagnostics = frameworkRuntime.getDiagnostics();
    const framework = diagnostics && diagnostics.framework ? diagnostics.framework : {};
    return {
      ok: true,
      status: framework.version ? 'healthy' : 'unknown',
      version: framework.version || packageJson.version || '1.0.0',
      apps: framework.apps || 0,
      connections: framework.connections || 0,
      featureFlags: framework.featureFlags || 0,
      migrations: framework.migrations || 0
    };
  }
  return {
    ok: true,
    status: 'unknown',
    version: packageJson.version || '1.0.0',
    apps: 0,
    connections: 0,
    featureFlags: 0,
    migrations: 0
  };
};

const getHealthStatus = () => ({
  ok: true,
  service: 'neutral-platform',
  status: 'healthy',
  timestamp: new Date().toISOString(),
  version: packageJson.version || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  uptime: Math.round(process.uptime()),
  database: getDatabaseHealth(),
  framework: getFrameworkHealth(),
  release: releaseService.getReleaseStatus()
});

const getRuntimeStatus = () => ({
  ok: true,
  environment: process.env.NODE_ENV || 'development',
  server: 'neutral-platform',
  runtime: {
    platform: process.platform,
    arch: process.arch,
    uptime: Math.round(process.uptime())
  },
  database: getDatabaseHealth(),
  framework: getFrameworkHealth(),
  release: releaseService.getReleaseStatus()
});

const getSystemInfo = () => ({
  ok: true,
  service: 'neutral-platform',
  name: 'Neutral Framework',
  version: packageJson.version || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  platform: process.platform,
  arch: process.arch,
  uptime: Math.round(process.uptime()),
  nodeVersion: process.version,
  timestamp: new Date().toISOString(),
  database: getDatabaseHealth(),
  framework: getFrameworkHealth(),
  release: releaseService.getReleaseStatus()
});

const getAdminHealthStatus = () => ({
  ok: true,
  service: 'neutral-platform',
  status: 'healthy',
  timestamp: new Date().toISOString(),
  summary: {
    server: 'healthy',
    database: getDatabaseHealth().status || 'NOT_CONFIGURED',
    framework: getFrameworkHealth().status || 'unknown',
    release: releaseService.getReleaseStatus().status || 'not_ready'
  },
  environment: process.env.NODE_ENV || 'development',
  runtime: getRuntimeStatus(),
  system: getSystemInfo(),
  database: getDatabaseHealth(),
  framework: getFrameworkHealth(),
  release: releaseService.getReleaseStatus()
});

module.exports = {
  getHealthStatus,
  getRuntimeStatus,
  getSystemInfo,
  getAdminHealthStatus,
  getDatabaseHealth,
  getFrameworkHealth
};

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const packageJson = require('../../package.json');

const RELEASE_STATE_PATH = path.resolve(process.cwd(), 'server', 'runtime', 'release-state.json');

const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(lower)) {
      return true;
    }
    if (['0', 'false', 'no', 'off'].includes(lower)) {
      return false;
    }
  }
  return fallback;
};

const buildDefaultState = () => ({
  version: packageJson.version || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  status: 'not_ready',
  maintenanceMode: false,
  maintenanceReason: '',
  checkedAt: new Date().toISOString(),
  checks: {
    database: { ok: false, status: 'not_configured', message: 'Database is not configured.' },
    server: { ok: false, status: 'not_configured', message: 'Server status is not configured.' },
    framework: { ok: false, status: 'not_configured', message: 'Framework runtime is not initialized.' },
    security: { ok: true, status: 'ready', message: 'Security baseline is active.' }
  }
});

const ensureDir = () => {
  const dir = path.dirname(RELEASE_STATE_PATH);
  fs.mkdirSync(dir, { recursive: true });
};

const readState = () => {
  try {
    ensureDir();
    if (!fs.existsSync(RELEASE_STATE_PATH)) {
      return buildDefaultState();
    }
    const raw = fs.readFileSync(RELEASE_STATE_PATH, 'utf8');
    if (!raw || !raw.trim()) {
      return buildDefaultState();
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? { ...buildDefaultState(), ...parsed } : buildDefaultState();
  } catch (error) {
    return buildDefaultState();
  }
};

const writeState = (nextState) => {
  try {
    ensureDir();
    const state = { ...buildDefaultState(), ...nextState, checkedAt: new Date().toISOString() };
    fs.writeFileSync(RELEASE_STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
    return state;
  } catch (error) {
    return buildDefaultState();
  }
};

const getFrameworkRuntime = () => {
  try {
    return require('../../webapp/platform/master-framework');
  } catch (error) {
    return null;
  }
};

const evaluateChecks = () => {
  const frameworkRuntime = getFrameworkRuntime();
  const release = buildDefaultState();

  if (frameworkRuntime && typeof frameworkRuntime.getDatabaseStatus === 'function') {
    const databaseStatus = frameworkRuntime.getDatabaseStatus();
    release.checks.database = {
      ok: !!databaseStatus.ok,
      status: databaseStatus.status || (databaseStatus.configured ? 'ready' : 'not_configured'),
      message: databaseStatus.message || 'Database status is available.'
    };
  }

  if (frameworkRuntime && typeof frameworkRuntime.getSetupSnapshot === 'function') {
    const setup = frameworkRuntime.getSetupSnapshot();
    const installationStatus = frameworkRuntime.getInstallationStatus ? frameworkRuntime.getInstallationStatus(setup) : (setup && setup.status) || 'not_configured';
    const serverConfigured = setup && setup.serverState && setup.serverState.configured;
    release.checks.server = {
      ok: !!serverConfigured || installationStatus === 'ACTIVE' || installationStatus === 'READY',
      status: installationStatus === 'ACTIVE' ? 'ready' : (serverConfigured ? 'configured' : 'not_configured'),
      message: serverConfigured ? 'Server configuration is present.' : 'Server settings are not yet ready.'
    };
    release.checks.framework = {
      ok: !!(setup && setup.frameworkState && setup.frameworkState.initialized),
      status: setup && setup.frameworkState && setup.frameworkState.status ? setup.frameworkState.status : 'not_configured',
      message: setup && setup.frameworkState && setup.frameworkState.message ? setup.frameworkState.message : 'Framework runtime is not initialized.'
    };
  }

  const allReady = release.checks.database.ok && release.checks.server.ok && release.checks.framework.ok;
  const maintenanceMode = normalizeBoolean(readState().maintenanceMode, false);
  release.maintenanceMode = maintenanceMode;
  release.maintenanceReason = readState().maintenanceReason || '';
  release.status = maintenanceMode ? 'maintenance' : (allReady ? 'ready' : 'not_ready');
  release.version = packageJson.version || '1.0.0';

  return release;
};

const getReleaseStatus = () => {
  const state = readState();
  const evaluated = evaluateChecks();
  const merged = { ...state, ...evaluated, checks: { ...state.checks, ...evaluated.checks } };
  if (merged.status === 'not_ready' && state.status === 'ready') {
    merged.status = 'ready';
  }
  return merged;
};

const setMaintenanceMode = (enabled = false, reason = '') => {
  const value = normalizeBoolean(enabled, false);
  const current = readState();
  const next = {
    ...current,
    maintenanceMode: value,
    maintenanceReason: value ? String(reason || 'Maintenance mode enabled.') : '',
    status: value ? 'maintenance' : 'not_ready',
    checkedAt: new Date().toISOString()
  };
  if (!value) {
    const evaluated = evaluateChecks();
    next.status = evaluated.status || 'not_ready';
    next.checks = { ...evaluated.checks };
  }
  return writeState(next);
};

const getReleaseSummary = () => {
  const release = getReleaseStatus();
  return {
    version: release.version,
    environment: release.environment,
    status: release.status,
    maintenanceMode: !!release.maintenanceMode,
    ready: release.status === 'ready',
    checkedAt: release.checkedAt
  };
};

module.exports = {
  buildDefaultState,
  evaluateChecks,
  getReleaseStatus,
  getReleaseSummary,
  setMaintenanceMode,
  readState,
  writeState
};

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const BACKUP_DIR = path.resolve(__dirname, '../runtime/backups');
const BACKUP_INDEX_FILE = 'backup-index.json';

const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
};

const readJsonFile = (filePath, fallback = []) => {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw || !raw.trim()) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
};

const writeJsonFile = (filePath, value) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
    return true;
  } catch (error) {
    return false;
  }
};

const normalizeString = (value, fallback = '') => {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed || fallback;
};

const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

const getIndexPath = () => path.join(BACKUP_DIR, BACKUP_INDEX_FILE);

const readIndex = () => {
  ensureBackupDir();
  const index = readJsonFile(getIndexPath(), []);
  return Array.isArray(index) ? index : [];
};

const writeIndex = (entries) => {
  ensureBackupDir();
  return writeJsonFile(getIndexPath(), Array.isArray(entries) ? entries : []);
};

const snapshotRuntimeState = (framework) => {
  const safeList = (values) => (Array.isArray(values) ? values : []);
  const getProviders = () => {
    if (framework && typeof framework.listProviders === 'function') {
      return framework.listProviders();
    }
    if (framework && framework.providers && typeof framework.providers.values === 'function') {
      return Array.from(framework.providers.values());
    }
    return [];
  };

  return {
    generatedAt: new Date().toISOString(),
    framework: {
      version: framework && framework.version ? framework.version : '1.0.0',
      currentAppId: framework && framework.currentAppId ? framework.currentAppId : null
    },
    setup: framework && typeof framework.loadSetupState === 'function' ? framework.loadSetupState() : null,
    adminState: framework && typeof framework.loadAdminState === 'function' ? framework.loadAdminState() : null,
    apps: framework && typeof framework.listApps === 'function' ? framework.listApps() : safeList(framework && framework.apps ? Array.from(framework.apps.values()) : []),
    connections: framework && typeof framework.listConnections === 'function' ? framework.listConnections() : safeList(framework && framework.connections ? Array.from(framework.connections.values()) : []),
    providers: getProviders(),
    devices: framework && typeof framework.listDevices === 'function' ? framework.listDevices() : safeList(framework && framework.loadAdminState ? framework.loadAdminState().devices : []),
    licenses: framework && typeof framework.listLicenses === 'function' ? framework.listLicenses() : safeList(framework && framework.loadAdminState ? framework.loadAdminState().licenses : []),
    updates: framework && typeof framework.getUpdateState === 'function' ? framework.getUpdateState() : (framework && framework.loadAdminState ? framework.loadAdminState().updates : {}),
    featureFlags: framework && framework.featureFlags && typeof framework.featureFlags.entries === 'function'
      ? Object.fromEntries(framework.featureFlags.entries())
      : {}
  };
};

const buildBackupEntry = (backupId, payload = {}) => {
  const now = new Date().toISOString();
  const record = {
    backupId,
    id: backupId,
    label: normalizeString(payload.label, `backup-${backupId}`),
    providerId: normalizeString(payload.providerId, 'local-provider'),
    status: normalizeString(payload.status, 'completed'),
    filePath: normalizeString(payload.filePath, ''),
    createdAt: normalizeString(payload.createdAt, now),
    updatedAt: normalizeString(payload.updatedAt, now),
    size: Number.isFinite(payload.size) ? payload.size : 0,
    metadata: isPlainObject(payload.metadata) ? { ...payload.metadata } : {}
  };
  return record;
};

module.exports = {
  BACKUP_DIR,
  ensureBackupDir,
  readIndex,
  writeIndex,
  createBackup: (payload = {}) => {
    const framework = require('../../../Web-App/core/master-framework');
    const snapshot = snapshotRuntimeState(framework);
    const backupId = normalizeString(payload.backupId || payload.id || `backup-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, `backup-${Date.now()}`);
    const label = normalizeString(payload.label || payload.name || `Backup ${backupId}`, `Backup ${backupId}`);
    const providerId = normalizeString(payload.providerId || (framework && framework.loadAdminState ? framework.loadAdminState().activeProviderId : ''), 'local-provider');
    const filePath = path.join(BACKUP_DIR, `${backupId}.json`);
    const record = buildBackupEntry(backupId, {
      label,
      providerId,
      status: 'completed',
      filePath,
      metadata: payload.metadata || {}
    });

    const archive = {
      backupId,
      id: backupId,
      label: record.label,
      providerId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      status: 'completed',
      snapshot
    };

    fs.writeFileSync(filePath, JSON.stringify(archive, null, 2), 'utf8');
    record.size = fs.statSync(filePath).size;
    record.updatedAt = new Date().toISOString();

    const existing = readIndex().filter((entry) => entry.backupId !== backupId);
    writeIndex([record, ...existing]);
    return { ...record, filePath };
  },
  listBackups: () => readIndex(),
  getBackup: (backupId) => {
    const normalized = normalizeString(backupId, '');
    if (!normalized) {
      return null;
    }

    const fromIndex = readIndex().find((entry) => entry.backupId === normalized || entry.id === normalized);
    if (fromIndex) {
      const filePath = normalizeString(fromIndex.filePath, path.join(BACKUP_DIR, `${normalized}.json`));
      if (fs.existsSync(filePath)) {
        const raw = readJsonFile(filePath, null);
        return raw && isPlainObject(raw) ? { ...fromIndex, ...raw, snapshot: raw.snapshot || {} } : fromIndex;
      }
      return fromIndex;
    }

    const filePath = path.join(BACKUP_DIR, `${normalized}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const raw = readJsonFile(filePath, null);
    return raw && isPlainObject(raw) ? raw : null;
  },
  restoreBackup: (backupId) => {
    const framework = require('../../../Web-App/core/master-framework');
    const backup = module.exports.getBackup(backupId);
    if (!backup || !isPlainObject(backup.snapshot)) {
      return { ok: false, code: 'BACKUP_NOT_FOUND', message: 'Backup not found.' };
    }

    const snapshot = backup.snapshot;

    if (snapshot.setup && typeof framework.saveSetupState === 'function') {
      framework.saveSetupState(snapshot.setup);
    }
    if (snapshot.adminState && typeof framework.saveAdminState === 'function') {
      framework.saveAdminState(snapshot.adminState);
    }
    if (Array.isArray(snapshot.apps)) {
      framework.apps = new Map();
      for (const app of snapshot.apps) {
        if (app && app.appId) {
          framework.apps.set(app.appId, app);
        }
      }
    }
    if (Array.isArray(snapshot.connections)) {
      framework.connections = new Map();
      for (const connection of snapshot.connections) {
        if (connection && connection.connectionId) {
          framework.connections.set(connection.connectionId, connection);
        }
      }
    }
    if (Array.isArray(snapshot.providers)) {
      framework.providers = new Map();
      for (const provider of snapshot.providers) {
        if (provider && provider.providerId) {
          framework.providers.set(provider.providerId, provider);
        }
      }
    }

    const restoredAt = new Date().toISOString();
    const entries = readIndex().map((entry) => (entry.backupId === backupId || entry.id === backupId)
      ? { ...entry, lastRestoredAt: restoredAt, status: 'restored', updatedAt: restoredAt }
      : entry);
    writeIndex(entries);

    return {
      ok: true,
      backupId: backup.backupId || backup.id,
      restoredAt,
      snapshot: {
        setup: snapshot.setup || null,
        adminState: snapshot.adminState || null
      }
    };
  },
  removeBackup: (backupId) => {
    const normalized = normalizeString(backupId, '');
    if (!normalized) {
      return false;
    }
    const entries = readIndex().filter((entry) => entry.backupId !== normalized && entry.id !== normalized);
    const removed = writeIndex(entries);
    const filePath = path.join(BACKUP_DIR, `${normalized}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return removed;
  }
};

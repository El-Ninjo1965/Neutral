'use strict';

const fs = require('node:fs');
const path = require('node:path');

const AUDIT_FILE = 'audit-log.json';

class MemoryAuditStore {
  constructor() {
    this.kind = 'memory';
    this.entries = [];
  }

  append(entry) {
    this.entries.push(entry);
    return entry;
  }

  list(filters = {}) {
    let entries = [...this.entries];
    if (filters.action) {
      entries = entries.filter((entry) => entry.action === filters.action);
    }
    if (filters.resource) {
      entries = entries.filter((entry) => entry.resource === filters.resource);
    }
    if (filters.actor) {
      entries = entries.filter((entry) => entry.actor === filters.actor);
    }
    if (filters.result) {
      entries = entries.filter((entry) => entry.result === filters.result);
    }
    if (filters.since) {
      entries = entries.filter((entry) => new Date(entry.timestamp) >= new Date(filters.since));
    }
    return entries;
  }

  clear() {
    this.entries = [];
  }
}

class FileAuditStore {
  constructor({ configDir } = {}) {
    this.kind = 'file';
    this.configDir = configDir || path.join(__dirname, '../../config');
  }

  _filePath() {
    return path.join(this.configDir, AUDIT_FILE);
  }

  _ensureDir() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  _readAll() {
    try {
      this._ensureDir();
      const filePath = this._filePath();
      if (!fs.existsSync(filePath)) {
        return { entries: [] };
      }
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8') || '{}');
      return parsed && typeof parsed === 'object' ? parsed : { entries: [] };
    } catch (error) {
      console.warn('[audit-store] Failed to read audit log:', error.message);
      return { entries: [] };
    }
  }

  _writeAll(payload) {
    try {
      this._ensureDir();
      fs.writeFileSync(this._filePath(), JSON.stringify(payload, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('[audit-store] Failed to write audit log:', error.message);
      return false;
    }
  }

  append(entry) {
    const state = this._readAll();
    const entries = Array.isArray(state.entries) ? state.entries : [];
    entries.push(entry);
    while (entries.length > 1000) {
      entries.shift();
    }
    this._writeAll({ entries });
    return entry;
  }

  list(filters = {}) {
    const state = this._readAll();
    let entries = Array.isArray(state.entries) ? state.entries : [];
    if (filters.action) {
      entries = entries.filter((entry) => entry.action === filters.action);
    }
    if (filters.resource) {
      entries = entries.filter((entry) => entry.resource === filters.resource);
    }
    if (filters.actor) {
      entries = entries.filter((entry) => entry.actor === filters.actor);
    }
    if (filters.result) {
      entries = entries.filter((entry) => entry.result === filters.result);
    }
    if (filters.since) {
      entries = entries.filter((entry) => new Date(entry.timestamp) >= new Date(filters.since));
    }
    return entries;
  }

  clear() {
    this._writeAll({ entries: [] });
  }
}

const resolveAuditStore = (kind = 'file', options = {}) => {
  const normalizedKind = String(kind || 'file').trim().toLowerCase();
  if (normalizedKind === 'memory') {
    return new MemoryAuditStore();
  }
  if (normalizedKind === 'shared') {
    console.warn('[audit-store] Shared audit backend requested but not implemented yet; falling back to file store.');
  }
  return new FileAuditStore(options);
};

module.exports = {
  MemoryAuditStore,
  FileAuditStore,
  resolveAuditStore
};

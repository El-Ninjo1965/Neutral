'use strict';

/**
 * SessionStore adapter contract.
 *
 * The contract intentionally abstracts the storage backend so AuthService does
 * not depend on whether session state is in memory, on disk, or a future
 * shared backend such as Redis/Valkey.
 *
 * Required operations:
 * - create(session)
 * - get(sessionId)
 * - update(sessionId, patch)
 * - delete(sessionId)
 * - count()
 *
 * The current default is a file-backed store. A memory store is still exposed
 * for tests/dev. A future shared adapter can be inserted behind the same API
 * without any AuthService or API code changes.
 */

const fs = require('node:fs');
const path = require('node:path');

const SESSION_FILE = 'sessions.json';

class MemorySessionStore {
  constructor() {
    this.kind = 'memory';
    this.sessions = new Map();
  }

  async create(session) {
    this.sessions.set(session.sessionId, { ...session });
    return { ...session };
  }

  async get(sessionId) {
    const session = this.sessions.get(sessionId);
    return session ? { ...session } : null;
  }

  async update(sessionId, changes = {}) {
    const existing = this.sessions.get(sessionId);
    if (!existing) {
      return null;
    }
    const next = { ...existing, ...changes };
    this.sessions.set(sessionId, next);
    return { ...next };
  }

  async renew(sessionId, changes = {}) {
    return this.update(sessionId, changes);
  }

  async touch(sessionId, changes = {}) {
    return this.update(sessionId, changes);
  }

  async delete(sessionId) {
    return this.sessions.delete(sessionId);
  }

  async destroy(sessionId) {
    return this.delete(sessionId);
  }

  async count() {
    return this.sessions.size;
  }

  async clear() {
    this.sessions.clear();
  }
}

class FileSessionStore {
  constructor({ configDir } = {}) {
    this.kind = 'file';
    this.configDir = configDir || path.join(__dirname, '../../config');
  }

  _filePath() {
    return path.join(this.configDir, SESSION_FILE);
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
        return {};
      }
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      console.warn('[session-store] Failed to read sessions file:', error.message);
      return {};
    }
  }

  _writeAll(data) {
    try {
      this._ensureDir();
      fs.writeFileSync(this._filePath(), JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('[session-store] Failed to write sessions file:', error.message);
      return false;
    }
  }

  async create(session) {
    const all = this._readAll();
    all[session.sessionId] = { ...session };
    this._writeAll(all);
    return { ...session };
  }

  async get(sessionId) {
    const all = this._readAll();
    const session = all[sessionId];
    return session ? { ...session } : null;
  }

  async update(sessionId, changes = {}) {
    const all = this._readAll();
    const existing = all[sessionId];
    if (!existing) {
      return null;
    }
    const next = { ...existing, ...changes };
    all[sessionId] = next;
    this._writeAll(all);
    return { ...next };
  }

  async renew(sessionId, changes = {}) {
    return this.update(sessionId, changes);
  }

  async touch(sessionId, changes = {}) {
    return this.update(sessionId, changes);
  }

  async delete(sessionId) {
    const all = this._readAll();
    if (!(sessionId in all)) {
      return false;
    }
    delete all[sessionId];
    this._writeAll(all);
    return true;
  }

  async destroy(sessionId) {
    return this.delete(sessionId);
  }

  async count() {
    return Object.keys(this._readAll()).length;
  }

  async clear() {
    this._writeAll({});
  }
}

const instances = new Map();

const resolveSessionStore = (kind = 'local', options = {}) => {
  const normalizedKind = String(kind || 'local').trim().toLowerCase();
  const cacheKey = `${normalizedKind}:${options.configDir || ''}`;

  if (instances.has(cacheKey)) {
    return instances.get(cacheKey);
  }

  let store;
  if (normalizedKind === 'memory') {
    store = new MemorySessionStore();
  } else if (normalizedKind === 'local' || normalizedKind === 'file') {
    store = new FileSessionStore(options);
  } else {
    console.warn(`[session-store] Unknown AUTH_SESSION_STORE "${kind}", falling back to local file store.`);
    store = new FileSessionStore(options);
  }

  instances.set(cacheKey, store);
  return store;
};

module.exports = {
  MemorySessionStore,
  FileSessionStore,
  resolveSessionStore,
  _resetCache: () => instances.clear()
};

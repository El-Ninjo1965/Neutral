(() => {
  'use strict';

  const normalizeString = (value, fallback = '') => {
    if (typeof value !== 'string') {
      return fallback;
    }
    const trimmed = value.trim();
    return trimmed || fallback;
  };

  const normalizeStorageType = (value, fallback = 'file') => {
    const normalized = normalizeString(typeof value === 'string' ? value : String(value || fallback), fallback).toLowerCase();
    const aliases = {
      text: 'file',
      json: 'file',
      file: 'file',
      filesystem: 'file',
      local: 'file',
      sqlite: 'sqlite',
      sql: 'sqlite',
      database: 'sqlite',
      mysql: 'mysql',
      postgres: 'postgresql',
      postgresql: 'postgresql'
    };
    return aliases[normalized] || fallback;
  };

  const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

  const resolveRuntimeRoot = (config = {}) => {
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      const path = require('node:path');
      const base = normalizeString(config.storagePath || config.filePath || config.path || '', '');
      if (base) {
        return path.resolve(process.cwd(), base);
      }
      return path.resolve(process.cwd(), 'Server', 'node', 'runtime', 'data');
    }

    if (typeof window !== 'undefined' && window.location && window.location.pathname) {
      return 'browser-local-storage';
    }

    return 'runtime-data';
  };

  const ensureNodeDirectory = (directory) => {
    if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
      return;
    }
    const fs = require('node:fs');
    fs.mkdirSync(directory, { recursive: true });
  };

  const createFileAdapter = (config = {}) => {
    const connectionId = normalizeString(config.connectionId || config.id || 'file-storage', 'file-storage');
    const storageRoot = resolveRuntimeRoot(config);
    const storePrefix = normalizeString(config.storePrefix || 'framework', 'framework');

    const readNodeFile = (collection, key, fallbackValue = null) => {
      if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
        return fallbackValue;
      }

      const path = require('node:path');
      const fs = require('node:fs');
      const directory = path.join(storageRoot, collection);
      ensureNodeDirectory(directory);
      const filePath = path.join(directory, `${key}.json`);

      if (!fs.existsSync(filePath)) {
        return fallbackValue;
      }

      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return raw ? JSON.parse(raw) : fallbackValue;
      } catch (error) {
        return fallbackValue;
      }
    };

    const writeNodeFile = (collection, key, value) => {
      if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
        return value;
      }

      const path = require('node:path');
      const fs = require('node:fs');
      const directory = path.join(storageRoot, collection);
      ensureNodeDirectory(directory);
      const filePath = path.join(directory, `${key}.json`);
      fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
      return value;
    };

    const listNodeFiles = (collection) => {
      if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
        return [];
      }

      const path = require('node:path');
      const fs = require('node:fs');
      const directory = path.join(storageRoot, collection);
      if (!fs.existsSync(directory)) {
        return [];
      }

      return fs.readdirSync(directory)
        .filter((entry) => entry.endsWith('.json'))
        .map((entry) => entry.replace(/\.json$/, ''));
    };

    const browserStorageKey = (collection, key) => `${storePrefix}:${connectionId}:${collection}:${key}`;

    const browserRead = (collection, key, fallbackValue = null) => {
      if (typeof localStorage === 'undefined') {
        return fallbackValue;
      }

      try {
        const raw = localStorage.getItem(browserStorageKey(collection, key));
        if (raw === null) {
          return fallbackValue;
        }
        return JSON.parse(raw);
      } catch (error) {
        return fallbackValue;
      }
    };

    const browserWrite = (collection, key, value) => {
      if (typeof localStorage === 'undefined') {
        return value;
      }
      localStorage.setItem(browserStorageKey(collection, key), JSON.stringify(value));
      return value;
    };

    const browserList = (collection) => {
      if (typeof localStorage === 'undefined') {
        return [];
      }

      const prefix = `${storePrefix}:${connectionId}:${collection}:`;
      const result = [];
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key && key.startsWith(prefix)) {
          result.push(key.slice(prefix.length));
        }
      }
      return result;
    };

    return {
      id: connectionId,
      connectionId,
      type: 'file',
      storageType: 'file',
      name: 'Text file storage',
      storageRoot,
      async test() {
        if (typeof process !== 'undefined' && process.versions && process.versions.node) {
          const path = require('node:path');
          const fs = require('node:fs');
          ensureNodeDirectory(storageRoot);
          const checkFile = path.join(storageRoot, '.storage-check.json');
          fs.writeFileSync(checkFile, JSON.stringify({ ok: true, checkedAt: new Date().toISOString() }));
        }
        return {
          ok: true,
          status: 'healthy',
          mode: 'file',
          storageType: 'file',
          checkedAt: new Date().toISOString(),
          message: 'File-based storage is available and writable.'
        };
      },
      read(collection, key, fallbackValue = null) {
        const normalizedCollection = normalizeString(collection || 'default', 'default');
        const normalizedKey = normalizeString(key || '', 'default');
        const storageValue = typeof localStorage !== 'undefined' && localStorage
          ? browserRead(normalizedCollection, normalizedKey, fallbackValue)
          : readNodeFile(normalizedCollection, normalizedKey, fallbackValue);
        return storageValue === undefined ? fallbackValue : storageValue;
      },
      write(collection, key, value) {
        const normalizedCollection = normalizeString(collection || 'default', 'default');
        const normalizedKey = normalizeString(key || '', 'default');
        if (typeof localStorage !== 'undefined' && localStorage) {
          return browserWrite(normalizedCollection, normalizedKey, value);
        }
        return writeNodeFile(normalizedCollection, normalizedKey, value);
      },
      list(collection) {
        const normalizedCollection = normalizeString(collection || 'default', 'default');
        if (typeof localStorage !== 'undefined' && localStorage) {
          return browserList(normalizedCollection);
        }
        return listNodeFiles(normalizedCollection);
      },
      remove(collection, key) {
        const normalizedCollection = normalizeString(collection || 'default', 'default');
        const normalizedKey = normalizeString(key || '', 'default');

        if (typeof localStorage !== 'undefined' && localStorage) {
          localStorage.removeItem(browserStorageKey(normalizedCollection, normalizedKey));
          return true;
        }

        if (typeof process !== 'undefined' && process.versions && process.versions.node) {
          const path = require('node:path');
          const fs = require('node:fs');
          const directory = path.join(storageRoot, normalizedCollection);
          const filePath = path.join(directory, `${normalizedKey}.json`);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
        return true;
      }
    };
  };

  const createSqlAdapter = (config = {}) => {
    const type = normalizeStorageType(config.storageType || config.databaseType || config.type || 'sqlite', 'sqlite').toLowerCase();
    const normalizedType = (type === 'sql') ? 'sqlite' : type;
    const databaseName = normalizeString(config.databaseName || config.name || config.database || 'framework.db', 'framework.db');
    const connectionId = normalizeString(config.connectionId || config.id || `sql-${normalizedType}`, `sql-${normalizedType}`);
    const runtimeRoot = resolveRuntimeRoot(config);
    const databasePath = normalizedType === 'sqlite'
      ? (() => {
          const path = require('node:path');
          const fileName = databaseName.endsWith('.db') || databaseName.endsWith('.sqlite') || databaseName.endsWith('.sqlite3')
            ? databaseName
            : `${databaseName}.sqlite`;
          ensureNodeDirectory(runtimeRoot);
          return path.resolve(runtimeRoot, fileName);
        })()
      : '';

    const ensureSqliteDatabase = () => {
      if (normalizedType !== 'sqlite') {
        return null;
      }

      if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
        return null;
      }

      try {
        const { DatabaseSync } = require('node:sqlite');
        const db = new DatabaseSync(databasePath);
        db.exec(`
          CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            collection TEXT NOT NULL,
            entry_key TEXT NOT NULL,
            value TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(collection, entry_key)
          );
        `);
        return db;
      } catch (error) {
        return null;
      }
    };

    const database = normalizedType === 'sqlite' ? ensureSqliteDatabase() : null;

    return {
      id: connectionId,
      connectionId,
      type: normalizedType,
      storageType: normalizedType,
      name: `${normalizedType.toUpperCase()} storage adapter`,
      databaseName,
      databasePath,
      async test() {
        if (normalizedType === 'sqlite') {
          if (!database) {
            return {
              ok: false,
              status: 'error',
              mode: 'sqlite',
              storageType: 'sqlite',
              checkedAt: new Date().toISOString(),
              message: 'SQLite database could not be initialized.'
            };
          }

          try {
            const row = database.prepare('SELECT 1 AS ok').get();
            return {
              ok: !!row && row.ok === 1,
              status: 'ready',
              mode: 'sqlite',
              storageType: 'sqlite',
              checkedAt: new Date().toISOString(),
              message: 'SQLite database initialized successfully.'
            };
          } catch (error) {
            return {
              ok: false,
              status: 'error',
              mode: 'sqlite',
              storageType: 'sqlite',
              checkedAt: new Date().toISOString(),
              message: error.message || 'SQLite validation failed.'
            };
          }
        }

        return {
          ok: true,
          status: 'ready',
          mode: normalizedType,
          storageType: normalizedType,
          checkedAt: new Date().toISOString(),
          message: `${normalizedType.toUpperCase()} backend is configured for future database connectivity.`
        };
      },
      read(collection, key, fallbackValue = null) {
        if (normalizedType !== 'sqlite' || !database) {
          return fallbackValue;
        }

        const normalizedCollection = normalizeString(collection || 'default', 'default');
        const normalizedKey = normalizeString(key || '', 'default');
        const row = database.prepare('SELECT value FROM records WHERE collection = ? AND entry_key = ? LIMIT 1').get(normalizedCollection, normalizedKey);
        if (!row || row.value === null || row.value === undefined) {
          return fallbackValue;
        }

        try {
          return JSON.parse(row.value);
        } catch (error) {
          return row.value;
        }
      },
      write(collection, key, value) {
        if (normalizedType !== 'sqlite' || !database) {
          return value;
        }

        const normalizedCollection = normalizeString(collection || 'default', 'default');
        const normalizedKey = normalizeString(key || '', 'default');
        const payload = JSON.stringify(value);
        const now = new Date().toISOString();

        database.prepare(`
          INSERT INTO records (collection, entry_key, value, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(collection, entry_key)
          DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `).run(normalizedCollection, normalizedKey, payload, now, now);

        return value;
      },
      list(collection) {
        if (normalizedType !== 'sqlite' || !database) {
          return [];
        }

        const normalizedCollection = normalizeString(collection || 'default', 'default');
        const rows = database.prepare('SELECT entry_key FROM records WHERE collection = ? ORDER BY entry_key ASC').all(normalizedCollection);
        return rows.map((row) => row.entry_key);
      },
      remove(collection, key) {
        if (normalizedType !== 'sqlite' || !database) {
          return true;
        }

        const normalizedCollection = normalizeString(collection || 'default', 'default');
        const normalizedKey = normalizeString(key || '', 'default');
        database.prepare('DELETE FROM records WHERE collection = ? AND entry_key = ?').run(normalizedCollection, normalizedKey);
        return true;
      }
    };
  };

  const resolveStorageAdapter = (config = {}) => {
    if (!isPlainObject(config)) {
      return createFileAdapter({ connectionId: 'file-storage' });
    }

    const mode = normalizeStorageType(config.storageType || config.type || config.databaseType || 'file', 'file');

    if (mode === 'file') {
      return createFileAdapter(config);
    }

    if (['sqlite', 'mysql', 'postgresql'].includes(mode)) {
      return createSqlAdapter({ ...config, storageType: mode });
    }

    return createFileAdapter(config);
  };

  const getConnectionDefinitionFromRuntime = () => {
    const runtimeConnection = (() => {
      if (typeof window !== 'undefined' && window.ConfigManager && typeof window.ConfigManager.get === 'function') {
        const connectionConfig = window.ConfigManager.get('connections', {});
        const activeId = window.ConfigManager.getPath ? window.ConfigManager.getPath('connections.activeConnectionId', '') : '';
        const connections = Array.isArray(connectionConfig && connectionConfig.connections) ? connectionConfig.connections : [];
        const selected = connections.find((entry) => entry.connectionId === activeId)
          || connections.find((entry) => entry.default === true)
          || connections.find((entry) => entry.active === true)
          || (connections[0] || null);
        if (selected) {
          return selected;
        }
      }

      if (typeof window !== 'undefined' && window.MasterFramework && typeof window.MasterFramework.listConnections === 'function') {
        const connections = window.MasterFramework.listConnections();
        const selected = connections.find((entry) => !!entry.default)
          || connections.find((entry) => !!entry.active)
          || (connections[0] || null);
        if (selected) {
          return selected;
        }
      }

      return {
        connectionId: 'file-storage',
        storageType: 'file',
        databaseType: 'file',
        active: true,
        default: true,
        status: 'active'
      };
    })();

    if (runtimeConnection && typeof runtimeConnection === 'object') {
      return { ...runtimeConnection };
    }

    return {
      connectionId: 'file-storage',
      storageType: 'file',
      databaseType: 'file',
      active: true,
      default: true,
      status: 'active'
    };
  };

  const StorageManager = {
    supportedTypes: ['file', 'sqlite', 'mysql', 'postgresql'],
    resolveStorageAdapter,
    createFileAdapter,
    createSqlAdapter,
    getActiveConnectionConfig: getConnectionDefinitionFromRuntime,
    getRuntimeAdapter() {
      return resolveStorageAdapter(getConnectionDefinitionFromRuntime());
    },
    normalizeStorageType: (value, fallback = 'file') => normalizeStorageType(value, fallback),
    isSupportedStorageType: (value) => StorageManager.supportedTypes.includes(normalizeStorageType(value, 'file'))
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
  }

  if (typeof globalThis !== 'undefined') {
    globalThis.StorageManager = StorageManager;
  }
})();

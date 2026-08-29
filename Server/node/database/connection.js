'use strict';

const normalizeString = (value, fallback = '') => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
};

const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

const pickString = (source, keys, fallback = '') => {
  for (const key of keys) {
    const candidate = source && Object.prototype.hasOwnProperty.call(source, key) ? source[key] : undefined;
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return fallback;
};

const pickNumber = (source, keys, fallback = 0) => {
  for (const key of keys) {
    const candidate = source && Object.prototype.hasOwnProperty.call(source, key) ? source[key] : undefined;
    if (candidate !== undefined && candidate !== null && candidate !== '') {
      const numeric = Number(candidate);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
  }
  return fallback;
};

const resolveDatabaseType = (value, fallback = 'mysql') => {
  const normalized = normalizeString(typeof value === 'string' ? value : String(value || fallback), fallback).toLowerCase();
  const aliases = {
    sqlite: 'sqlite',
    sql: 'sqlite',
    mysql: 'mysql',
    mariadb: 'mysql',
    postgres: 'postgresql',
    postgresql: 'postgresql'
  };
  return aliases[normalized] || fallback;
};

const readRuntimeConfig = (source = {}) => {
  const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
  const config = isPlainObject(source) ? source : {};
  const databaseType = resolveDatabaseType(
    pickString(config, ['type', 'databaseType', 'storageType', 'dialect'], pickString(env, ['DB_TYPE', 'DATABASE_TYPE', 'MYSQL_TYPE'], 'mysql')),
    'mysql'
  );

  const base = {
    type: databaseType,
    host: pickString(config, ['host', 'hostname', 'server'], pickString(env, ['MYSQL_HOST', 'DB_HOST'], '127.0.0.1')),
    port: pickNumber(config, ['port', 'portNumber'], pickNumber(env, ['MYSQL_PORT', 'DB_PORT'], 3306)),
    name: pickString(config, ['name', 'database', 'databaseName'], pickString(env, ['MYSQL_DATABASE', 'DB_NAME'], 'neutral')),
    username: pickString(config, ['username', 'user', 'userName'], pickString(env, ['MYSQL_USER', 'DB_USER', 'MYSQL_USERNAME'], '')),
    password: pickString(config, ['password', 'pass'], pickString(env, ['MYSQL_PASSWORD', 'DB_PASSWORD'], '')),
    charset: pickString(config, ['charset'], pickString(env, ['MYSQL_CHARSET'], 'utf8mb4')),
    connectionLimit: pickNumber(config, ['connectionLimit'], pickNumber(env, ['MYSQL_CONNECTION_LIMIT'], 10)),
    queueLimit: pickNumber(config, ['queueLimit'], pickNumber(env, ['MYSQL_QUEUE_LIMIT'], 0)),
    ssl: !!(config.ssl || env.MYSQL_SSL === 'true' || env.DB_SSL === 'true'),
    allowLocalFallback: config.allowLocalFallback !== false && env.DB_ALLOW_LOCAL_FALLBACK !== 'false'
  };

  if (base.type === 'sqlite') {
    base.path = pickString(config, ['path', 'storagePath'], pickString(env, ['DB_PATH', 'DATABASE_PATH'], 'Server/node/runtime/data/framework.sqlite'));
  }

  return base;
};

const loadMysqlModule = () => {
  for (const moduleName of ['mysql2', 'mysql']) {
    try {
      return require(moduleName);
    } catch (error) {
      // Intentionally ignore missing optional drivers; the runtime can still
      // expose a configuration-only status for production orchestration.
    }
  }
  return null;
};

const createSqliteConnection = (config = {}) => {
  const runtimeConfig = readRuntimeConfig(config);
  const pathModule = require('node:path');
  const fs = require('node:fs');
  const storageDir = pathModule.resolve(process.cwd(), 'Server', 'node', 'runtime', 'data');
  fs.mkdirSync(storageDir, { recursive: true });
  const databasePath = pathModule.resolve(process.cwd(), runtimeConfig.path || 'Server/node/runtime/data/framework.sqlite');

  return {
    kind: 'sqlite',
    type: 'sqlite',
    config: runtimeConfig,
    status: 'ready',
    ok: true,
    async test() {
      return {
        ok: true,
        status: 'ready',
        type: 'sqlite',
        message: 'SQLite runtime is available for local development.',
        checkedAt: new Date().toISOString(),
        path: databasePath
      };
    },
    async query(sql, params = []) {
      const { DatabaseSync } = require('node:sqlite');
      const db = new DatabaseSync(databasePath);
      const prepared = typeof params === 'undefined' || params === null ? [] : Array.isArray(params) ? params : [params];
      const statement = db.prepare(sql);
      if (/^\s*select\s+/i.test(sql)) {
        return statement.all(...prepared);
      }
      return statement.run(...prepared);
    },
    async close() {
      return true;
    }
  };
};

const createMySqlConnection = (config = {}) => {
  const runtimeConfig = readRuntimeConfig({ ...config, type: 'mysql' });
  const mysqlModule = loadMysqlModule();
  if (!mysqlModule) {
    return {
      kind: 'mysql',
      type: 'mysql',
      config: runtimeConfig,
      status: 'not_configured',
      ok: false,
      message: 'MySQL driver is not installed. Install mysql2 or mysql to enable the production database connector.',
      async test() {
        return {
          ok: false,
          status: 'not_configured',
          type: 'mysql',
          message: 'MySQL driver is not installed.',
          checkedAt: new Date().toISOString()
        };
      },
      async query() {
        throw new Error('MySQL driver is not installed.');
      },
      async close() {
        return true;
      }
    };
  }

  const pool = mysqlModule.createPool({
    host: runtimeConfig.host,
    port: runtimeConfig.port,
    user: runtimeConfig.username,
    password: runtimeConfig.password,
    database: runtimeConfig.name,
    charset: runtimeConfig.charset,
    connectionLimit: runtimeConfig.connectionLimit,
    queueLimit: runtimeConfig.queueLimit,
    ssl: runtimeConfig.ssl ? { rejectUnauthorized: false } : false
  });

  return {
    kind: 'mysql',
    type: 'mysql',
    config: runtimeConfig,
    status: 'ready',
    ok: !!(runtimeConfig.host && runtimeConfig.name && runtimeConfig.username),
    async test() {
      return new Promise((resolve) => {
        pool.query('SELECT 1 AS ok', (error, rows) => {
          if (error) {
            resolve({
              ok: false,
              status: 'error',
              type: 'mysql',
              message: error.message || 'MySQL validation failed.',
              checkedAt: new Date().toISOString()
            });
            return;
          }

          resolve({
            ok: !!(rows && rows[0] && rows[0].ok === 1),
            status: 'ready',
            type: 'mysql',
            message: 'MySQL production connection is ready.',
            checkedAt: new Date().toISOString()
          });
        });
      });
    },
    async query(sql, params = []) {
      return new Promise((resolve, reject) => {
        pool.query(sql, params, (error, results) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(results);
        });
      });
    },
    async close() {
      return new Promise((resolve, reject) => {
        pool.end((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(true);
        });
      });
    }
  };
};

const createDatabaseConnection = (config = {}) => {
  const runtimeConfig = readRuntimeConfig(config);
  if (runtimeConfig.type === 'sqlite') {
    return createSqliteConnection(runtimeConfig);
  }
  return createMySqlConnection(runtimeConfig);
};

module.exports = {
  readRuntimeConfig,
  createDatabaseConnection,
  createMySqlConnection,
  createSqliteConnection
};

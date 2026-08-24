'use strict';

const { resolveAuditStore } = require('./audit-store');

let store = resolveAuditStore(process.env.AUDIT_STORE || 'file', { configDir: require('node:path').join(__dirname, '../../config') });

const log = (action, resource, resourceId, actor, details = {}, result = 'success') => {
  try {
    const auditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      resource,
      resourceId,
      actor: actor || 'system',
      details,
      result
    };

    return store.append(auditEntry);
  } catch (error) {
    console.error('[audit-service] Failed to log audit entry:', error.message);
    return null;
  }
};

const getLog = (filters = {}) => {
  try {
    return store.list(filters || {});
  } catch (error) {
    console.error('[audit-service] Failed to read audit log:', error.message);
    return [];
  }
};

module.exports = {
  log,
  getLog,
  getStore: () => store,
  setStore: (nextStore) => {
    store = nextStore;
    return store;
  },
  actions: {
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',
    ROLE_CREATED: 'role.created',
    ROLE_UPDATED: 'role.updated',
    ROLE_DELETED: 'role.deleted',
    SETTINGS_UPDATED: 'settings.updated',
    SETUP_CHANGED: 'setup.changed',
    LOGIN_SUCCESS: 'auth.login.success',
    LOGIN_FAILURE: 'auth.login.failure',
    LOGOUT: 'auth.logout',
    SESSION_EXPIRED: 'auth.session.expired',
    RATE_LIMITED: 'auth.rate_limited'
  }
};

'use strict';

const persistenceService = require('./persistence-service');
const auditService = require('./audit-service');

const getAll = () => {
  try {
    const data = persistenceService.loadAdminSettings();
    return {
      appName: data.appName || 'Neutral App',
      appId: data.appId || 'neutral-app',
      settings: data.settings || {}
    };
  } catch (error) {
    console.error('[settings-service] Failed to load settings:', error.message);
    return {
      appName: 'Neutral App',
      appId: 'neutral-app',
      settings: {}
    };
  }
};

const update = (updates, actor = 'system') => {
  try {
    const validation = validateSettingsData(updates);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    const current = getAll();
    const updated = {
      appName: updates.appName !== undefined ? updates.appName : current.appName,
      appId: updates.appId !== undefined ? updates.appId : current.appId,
      settings: {
        ...current.settings,
        ...(updates.settings || {})
      }
    };

    persistenceService.saveAdminSettings(updated);

    auditService.log(auditService.actions.SETTINGS_UPDATED, 'settings', 'global', actor, {
      appName: updated.appName,
      settingKeys: Object.keys(updates.settings || {})
    });

    return updated;
  } catch (error) {
    auditService.log(auditService.actions.SETTINGS_UPDATED, 'settings', 'global', actor, {
      error: error.message
    }, 'failure');
    throw error;
  }
};

const getSetting = (key, defaultValue = null) => {
  try {
    const all = getAll();
    return all.settings[key] !== undefined ? all.settings[key] : defaultValue;
  } catch (error) {
    console.error('[settings-service] Failed to get setting:', error.message);
    return defaultValue;
  }
};

const setSetting = (key, value, actor = 'system') => {
  try {
    const current = getAll();
    const updated = {
      ...current,
      settings: {
        ...current.settings,
        [key]: value
      }
    };

    persistenceService.saveAdminSettings(updated);

    auditService.log(auditService.actions.SETTINGS_UPDATED, 'settings', key, actor, {
      key,
      valueType: typeof value
    });

    return value;
  } catch (error) {
    auditService.log(auditService.actions.SETTINGS_UPDATED, 'settings', key, actor, {
      error: error.message
    }, 'failure');
    throw error;
  }
};

const validateSettingsData = (data) => {
  const errors = [];

  if (data.appName !== undefined && (typeof data.appName !== 'string' || data.appName.trim().length === 0)) {
    errors.push('appName must be a non-empty string');
  }

  if (data.appId !== undefined && (typeof data.appId !== 'string' || data.appId.trim().length === 0)) {
    errors.push('appId must be a non-empty string');
  }

  if (data.settings !== undefined && typeof data.settings !== 'object') {
    errors.push('settings must be an object');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  getAll,
  update,
  getSetting,
  setSetting,
  validateSettingsData
};

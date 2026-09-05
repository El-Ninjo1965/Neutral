'use strict';

const persistenceService = require('./persistence-service');
const auditService = require('./audit-service');

const defaultHomepage = Object.freeze({
  mode: 'content',
  title: '',
  content: '',
  moduleId: ''
});

const normalizeHomepage = (value) => {
  const candidate = value && typeof value === 'object' ? value : {};
  const mode = candidate.mode === 'module' ? 'module' : 'content';
  const title = typeof candidate.title === 'string' ? candidate.title.trim() : '';
  const content = typeof candidate.content === 'string' ? candidate.content.trim() : '';
  const moduleId = typeof candidate.moduleId === 'string' ? candidate.moduleId.trim() : '';

  return {
    mode,
    title,
    content,
    moduleId
  };
};

const getAll = () => {
  try {
    const data = persistenceService.loadAdminSettings();
    const homepage = normalizeHomepage(data.homepage || data.settings?.homepage || defaultHomepage);
    return {
      appName: data.appName || 'Neutral App',
      appId: data.appId || 'neutral-app',
      homepage,
      settings: {
        ...(data.settings || {}),
        homepage: homepage
      }
    };
  } catch (error) {
    console.error('[settings-service] Failed to load settings:', error.message);
    return {
      appName: 'Neutral App',
      appId: 'neutral-app',
      homepage: { ...defaultHomepage },
      settings: { homepage: { ...defaultHomepage } }
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
    const homepageValue = normalizeHomepage(
      updates.homepage !== undefined
        ? updates.homepage
        : (updates.settings && updates.settings.homepage !== undefined ? updates.settings.homepage : current.homepage)
    );
    const settings = {
      ...current.settings,
      ...(updates.settings || {})
    };
    settings.homepage = homepageValue;

    const updated = {
      appName: updates.appName !== undefined ? updates.appName : current.appName,
      appId: updates.appId !== undefined ? updates.appId : current.appId,
      homepage: homepageValue,
      settings
    };

    persistenceService.saveAdminSettings(updated);

    auditService.log(auditService.actions.SETTINGS_UPDATED, 'settings', 'global', actor, {
      appName: updated.appName,
      homepageMode: homepageValue.mode,
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

  if (data.homepage !== undefined && (typeof data.homepage !== 'object' || data.homepage === null)) {
    errors.push('homepage must be an object');
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

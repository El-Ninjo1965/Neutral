'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Lazy-load MasterFramework to avoid circular dependencies
let MasterFramework = null;
const getMasterFramework = () => {
  if (!MasterFramework) {
    MasterFramework = require('../../../Web-App/core/master-framework');
  }
  return MasterFramework;
};

const CONFIG_DIR = path.join(__dirname, '../../config');

const ensureConfigDir = () => {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
};

const getConfigPath = (filename) => path.join(CONFIG_DIR, filename);

const readJsonFile = (filename, defaultValue = {}) => {
  try {
    ensureConfigDir();
    const filepath = getConfigPath(filename);
    if (!fs.existsSync(filepath)) {
      return defaultValue;
    }
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`[persistence-service] Failed to read ${filename}:`, error.message);
    return defaultValue;
  }
};

const writeJsonFile = (filename, data) => {
  try {
    ensureConfigDir();
    const filepath = getConfigPath(filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`[persistence-service] Failed to write ${filename}:`, error.message);
    return false;
  }
};

module.exports = {
  // Setup State Management - with fallback to MasterFramework for backwards compatibility
  loadSetupState: () => {
    const persisted = readJsonFile('setup-state.json');
    if (persisted && Object.keys(persisted).length > 0) {
      return persisted;
    }
    // Fallback to MasterFramework for backwards compatibility
    const framework = getMasterFramework();
    return framework.loadSetupState ? framework.loadSetupState() : persisted;
  },

  saveSetupState: (state) => {
    // Save to both persistence layer and MasterFramework
    const fileSaved = writeJsonFile('setup-state.json', state);
    const framework = getMasterFramework();
    if (framework.saveSetupState) {
      framework.saveSetupState(state);
    }
    return fileSaved ? state : null;
  },

  // Admin Users Management
  loadAdminUsers: () => readJsonFile('admin-users.json', {
    users: []
  }),

  saveAdminUsers: (usersData) => writeJsonFile('admin-users.json', usersData),

  // Admin Settings Management
  loadAdminSettings: () => readJsonFile('admin-settings.json', {
    appName: 'Neutral App',
    appId: 'neutral-app',
    settings: {}
  }),

  saveAdminSettings: (settingsData) => writeJsonFile('admin-settings.json', settingsData),

  // Generic file operations
  readJsonFile,
  writeJsonFile,
  getConfigPath,
  ensureConfigDir
};


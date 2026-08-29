(() => {
  'use strict';

  const DEFAULT_DEVELOPER_USERNAME = 'Developer';
  const STORAGE_KEY = 'neutral.local.auth.v1';
  const LEGACY_STORAGE_KEYS = [
    'platform.local.auth.developerPassword',
    'platform.local.auth.developerPasswordHash',
    'platform.local.auth.developerUsername',
    'platform.local.auth.setupComplete',
    'core.bootstrap.developerPassword',
    'core.bootstrap.developerPasswordHash',
    'core.bootstrap.developerUsername'
  ];

  const normalizeUsername = (value) => String(value || '').trim();
  const normalizeHash = (value) => String(value || '').trim();

  const hashSecret = async (value) => {
    const secret = String(value ?? '').trim();
    if (!secret) {
      return '';
    }

    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
      const bytes = new TextEncoder().encode(secret);
      const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    }

    if (typeof require === 'function' && typeof process !== 'undefined') {
      const crypto = require('node:crypto');
      return crypto.createHash('sha256').update(secret).digest('hex');
    }

    let hash = 2166136261;
    for (let index = 0; index < secret.length; index += 1) {
      hash ^= secret.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  };

  const readLegacyState = () => {
    if (typeof localStorage === 'undefined') {
      return { username: DEFAULT_DEVELOPER_USERNAME, passwordHash: '', setupComplete: false };
    }

    const username = localStorage.getItem('platform.local.auth.developerUsername')
      || localStorage.getItem('core.bootstrap.developerUsername')
      || DEFAULT_DEVELOPER_USERNAME;
    const passwordHash = localStorage.getItem('platform.local.auth.developerPasswordHash')
      || localStorage.getItem('core.bootstrap.developerPasswordHash')
      || '';
    const setupComplete = localStorage.getItem('platform.local.auth.setupComplete') === 'true';

    return {
      username: normalizeUsername(username) || DEFAULT_DEVELOPER_USERNAME,
      passwordHash: normalizeHash(passwordHash),
      setupComplete: !!setupComplete
    };
  };

  const writeState = (state) => {
    const nextState = {
      username: normalizeUsername(state && state.username) || DEFAULT_DEVELOPER_USERNAME,
      passwordHash: normalizeHash(state && state.passwordHash),
      setupComplete: !!(state && state.setupComplete),
      source: 'local-offline',
      updatedAt: new Date().toISOString()
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    }

    return nextState;
  };

  const clearLegacyState = () => {
    if (typeof localStorage === 'undefined') {
      return;
    }

    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem(STORAGE_KEY);
  };

  const syncBootstrapConfig = async (password, username = DEFAULT_DEVELOPER_USERNAME) => {
    const normalizedUsername = normalizeUsername(username) || DEFAULT_DEVELOPER_USERNAME;
    const normalizedPassword = String(password || '').trim();
    const passwordHash = normalizedPassword ? await hashSecret(normalizedPassword) : '';
    const nextState = {
      enabled: true,
      developerUsername: normalizedUsername,
      developerDisplayId: 'USR-000001',
      developerPasswordHash: passwordHash,
      passwordRequired: true,
      passwordSource: 'local-offline',
      hasDeveloperAccount: !!passwordHash
    };

    if (window.ConfigManager && typeof window.ConfigManager.get === 'function') {
      const current = window.ConfigManager.get('bootstrap', {}) || {};
      window.ConfigManager.set('bootstrap', {
        ...current,
        ...nextState
      });
    }

    writeState({
      username: normalizedUsername,
      passwordHash,
      setupComplete: !!passwordHash
    });

    return nextState;
  };

  const readLocalAuthState = () => {
    if (typeof localStorage === 'undefined') {
      return { username: DEFAULT_DEVELOPER_USERNAME, passwordHash: '', setupComplete: false, source: 'local-offline' };
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const state = {
            username: normalizeUsername(parsed.username) || DEFAULT_DEVELOPER_USERNAME,
            passwordHash: normalizeHash(parsed.passwordHash),
            setupComplete: !!parsed.setupComplete,
            source: 'local-offline'
          };
          if (state.passwordHash || state.setupComplete) {
            return state;
          }
        }
      }
    } catch (error) {
      // Ignore malformed persisted state and fall back to legacy or empty values.
    }

    return {
      ...readLegacyState(),
      source: 'local-offline'
    };
  };

  const LocalAuth = {
    STORAGE_KEY,
    LEGACY_STORAGE_KEYS,

    getState() {
      return readLocalAuthState();
    },

    isSetupComplete() {
      const state = this.getState();
      return !!state.setupComplete && !!state.passwordHash;
    },

    markSetupComplete(value = true) {
      const state = this.getState();
      const nextState = writeState({
        username: state.username,
        passwordHash: state.passwordHash,
        setupComplete: !!value
      });
      return !!nextState.setupComplete;
    },

    getStoredPasswordHash() {
      return this.getState().passwordHash || '';
    },

    async setDeveloperPassword(password, username = DEFAULT_DEVELOPER_USERNAME) {
      const normalizedPassword = String(password || '').trim();
      if (!normalizedPassword) {
        return { ok: false, code: 'INVALID_PASSWORD', message: 'A developer password is required.' };
      }

      const normalizedUsername = normalizeUsername(username) || DEFAULT_DEVELOPER_USERNAME;
      const config = await syncBootstrapConfig(normalizedPassword, normalizedUsername);

      if (window.CoreAuth && typeof window.CoreAuth.setDeveloperPassword === 'function') {
        return window.CoreAuth.setDeveloperPassword(normalizedPassword);
      }

      return {
        ok: true,
        code: 'DEVELOPER_PASSWORD_SET',
        data: config,
        message: 'Developer password saved locally.'
      };
    },

    resetDeveloperAccount() {
      clearLegacyState();

      if (window.ConfigManager && typeof window.ConfigManager.get === 'function') {
        const current = window.ConfigManager.get('bootstrap', {}) || {};
        window.ConfigManager.set('bootstrap', {
          ...current,
          developerUsername: DEFAULT_DEVELOPER_USERNAME,
          developerDisplayId: 'USR-000001',
          developerPasswordHash: '',
          passwordRequired: true,
          passwordSource: 'local-offline',
          enabled: true,
          hasDeveloperAccount: false
        });
      }

      if (window.UserModule && typeof window.UserModule.users !== 'undefined') {
        const affected = Array.from(window.UserModule.users.values()).filter((user) => {
          const username = String(user && user.username ? user.username : '').trim();
          const roles = Array.isArray(user && user.roles) ? user.roles.map((role) => String(role || '').trim().toLowerCase()) : [];
          return username.toLowerCase() === DEFAULT_DEVELOPER_USERNAME.toLowerCase() || roles.includes('developer');
        });

        affected.forEach((user) => window.UserModule.users.delete(user.id));
        if (typeof window.UserModule.persistUsers === 'function') {
          window.UserModule.persistUsers();
        }
      }

      return {
        ok: true,
        code: 'DEVELOPER_ACCOUNT_RESET',
        message: 'Local developer state has been cleared.'
      };
    },

    async ensureDeveloperUser() {
      if (!window.UserModule || typeof window.UserModule.bootstrapDeveloperUser !== 'function') {
        return { ok: false, code: 'USER_MODULE_MISSING', message: 'User module is not available.' };
      }

      const state = this.getState();
      const bootstrapResult = window.UserModule.bootstrapDeveloperUser();

      if (bootstrapResult && bootstrapResult.ok) {
        const currentUser = window.UserModule.getUserByUsername ? await window.UserModule.getUserByUsername(state.username || DEFAULT_DEVELOPER_USERNAME) : null;
        if (currentUser && currentUser.ok && currentUser.data) {
          return { ok: true, code: 'DEVELOPER_BOOTSTRAP_PRESENT', data: currentUser.data };
        }
        return bootstrapResult;
      }

      return { ok: false, code: 'DEVELOPER_ACCOUNT_UNAVAILABLE', message: 'Developer user could not be prepared.' };
    },

    async login(credentials = {}) {
      const username = normalizeUsername(credentials.username || DEFAULT_DEVELOPER_USERNAME);
      const password = String(credentials.password || '').trim();

      if (!username || !password) {
        return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Username and password are required.' };
      }

      if (!window.UserModule || typeof window.UserModule.login !== 'function') {
        return { ok: false, code: 'USER_MODULE_MISSING', message: 'User module is not available.' };
      }

      const state = this.getState();
      const expectedUsername = normalizeUsername(state.username) || DEFAULT_DEVELOPER_USERNAME;
      const expectedPasswordHash = normalizeHash(state.passwordHash);

      if (!expectedPasswordHash) {
        return { ok: false, code: 'LOCAL_SETUP_REQUIRED', message: 'Set up the local developer account before logging in.' };
      }

      const submittedPasswordHash = await hashSecret(password);
      if (submittedPasswordHash !== expectedPasswordHash) {
        return { ok: false, code: 'INVALID_PASSWORD', message: 'The local developer password is invalid.' };
      }

      const userLookup = await window.UserModule.getUserByUsername(username || expectedUsername);
      if (!userLookup || !userLookup.ok) {
        const result = await this.ensureDeveloperUser();
        if (!result || !result.ok) {
          return result;
        }
      }

      return window.UserModule.login({
        username: username || expectedUsername,
        password
      });
    },

    async setupDeveloper({ password, username = DEFAULT_DEVELOPER_USERNAME } = {}) {
      const normalizedUser = normalizeUsername(username) || DEFAULT_DEVELOPER_USERNAME;
      const normalizedPassword = String(password || '').trim();

      if (!normalizedPassword) {
        return { ok: false, code: 'INVALID_PASSWORD', message: 'A developer password is required.' };
      }

      await syncBootstrapConfig(normalizedPassword, normalizedUser);

      const bootstrapResult = await this.ensureDeveloperUser();
      if (!bootstrapResult || !bootstrapResult.ok) {
        return bootstrapResult || { ok: false, code: 'SETUP_FAILED', message: 'Developer setup could not be completed.' };
      }

      if (window.UserModule && typeof window.UserModule.getUserByUsername === 'function') {
        const userResult = await window.UserModule.getUserByUsername(normalizedUser);
        if (userResult && userResult.ok && userResult.data) {
          const current = userResult.data;
          if (!Array.isArray(current.roles) || !current.roles.includes('developer')) {
            await window.UserModule.updateUser(current.id, { roles: ['developer'] });
          }
        }
      }

      const loginResult = await this.login({ username: normalizedUser, password: normalizedPassword });
      if (loginResult && loginResult.ok) {
        this.markSetupComplete(true);
      }

      return loginResult || {
        ok: true,
        code: 'LOCAL_DEVELOPER_READY',
        message: 'Local developer account is ready.'
      };
    }
  };

  if (!window.LocalAuth) {
    window.LocalAuth = LocalAuth;
  }
})();

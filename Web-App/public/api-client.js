'use strict';

/**
 * API Client Wrapper
 * Centralized fetch wrapper with auth headers, error handling, and JSON parsing
 */

const resolveNeutralApiUrl = (endpoint) => {
  const value = String(endpoint || '');
  if (/^https?:\/\//i.test(value)) return value;
  const queryIndex = value.indexOf('?');
  const endpointPath = queryIndex === -1 ? value : value.slice(0, queryIndex);
  const query = queryIndex === -1 ? '' : value.slice(queryIndex);
  const publicPath = typeof window !== 'undefined' && window.NeutralPublicPath
    ? window.NeutralPublicPath
    : (globalThis.NeutralPublicPath || (typeof module !== 'undefined' && module.exports
      ? require('./public-path.js')
      : null));
  if (!publicPath || typeof publicPath.api !== 'function') {
    throw new Error('NeutralPublicPath is required before ApiClient.');
  }
  const normalizedEndpoint = endpointPath.startsWith('/api/v1/')
    ? endpointPath.slice(8)
    : endpointPath === '/api/v1'
      ? ''
      : endpointPath.startsWith('/api/')
    ? endpointPath.slice(4)
    : endpointPath === '/api' ? '' : endpointPath;
  return `${publicPath.api(normalizedEndpoint)}${query}`;
};

class ApiClient {
  constructor(baseUrl = null, defaultHeaders = {}) {
    this.baseUrl = typeof baseUrl === 'string' && baseUrl.trim() ? baseUrl.replace(/\/$/, '') : null;
    this.csrfToken = null;
    this.timeoutMs = 10000;
    this.sessionScope = 'user';
    this.sessionCookieName = 'neutral_session';
    this.csrfCookieName = 'neutral_csrf';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders
    };
    const deviceId = this.getOrCreateDeviceId();
    if (deviceId) {
      this.defaultHeaders['x-neutral-device-id'] = deviceId;
      this.defaultHeaders['x-neutral-device-label'] = this.deviceLabel();
    }
  }

  getOrCreateDeviceId() {
    try {
      const key = 'neutral.device.id.v1';
      const existing = localStorage.getItem(key);
      if (/^[a-f0-9]{32}$/.test(existing || '')) return existing;
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      const created = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(key, created);
      return created;
    } catch {
      return '';
    }
  }

  deviceLabel() {
    const agent = String(navigator.userAgent || '');
    const ios = /iPad|iPhone|iPod/i.test(agent) || (/Macintosh/i.test(agent) && /Mobile\//i.test(agent));
    const platform = ios ? 'iPadOS' : (navigator.userAgentData?.platform || navigator.platform || 'Device');
    const browser = /CriOS\//.test(agent) ? 'Chrome' : (/FxiOS\//.test(agent) ? 'Firefox' : (/EdgiOS\/|Edg\//.test(agent) ? 'Edge' : (/Safari\//.test(agent) ? 'Safari' : 'Browser')));
    return `${platform} · ${browser}`.slice(0, 80);
  }

  setSessionScope(scope = 'user') {
    const normalized = scope === 'admin' || scope === 'developer' ? 'admin' : 'user';
    this.sessionScope = normalized;
    this.sessionCookieName = normalized === 'admin' ? 'neutral_admin_session' : 'neutral_session';
    this.csrfCookieName = normalized === 'admin' ? 'neutral_admin_csrf' : 'neutral_csrf';
    return this;
  }

  setAuthRole(role) {
    if (role) {
      this.defaultHeaders['x-framework-role'] = role;
      this.setSessionScope(role);
    } else {
      delete this.defaultHeaders['x-framework-role'];
      this.setSessionScope('user');
    }
    return this;
  }

  setAuthToken(token) {
    if (token) {
      this.defaultHeaders['x-admin-access-token'] = token;
    } else {
      delete this.defaultHeaders['x-admin-access-token'];
    }
    return this;
  }

  setCsrfToken(token) {
    this.csrfToken = token || null;
    return this;
  }

  getCookie(name) {
    const key = `${name}=`;
    const parts = (document.cookie || '').split(';');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith(key)) {
        return decodeURIComponent(trimmed.slice(key.length));
      }
    }
    return null;
  }

  async request(endpoint, options = {}) {
    const url = this.baseUrl ? this.baseUrl + endpoint : resolveNeutralApiUrl(endpoint);
    const method = options.method || 'GET';
    const csrf = this.csrfToken || this.getCookie(this.csrfCookieName);
    const config = {
      method,
      credentials: 'same-origin',
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      }
    };
    const timeoutMs = Number.isFinite(Number(options.timeoutMs)) ? Math.max(0, Number(options.timeoutMs)) : this.timeoutMs;
    const supportsAbort = typeof AbortController === 'function';
    const controller = supportsAbort ? new AbortController() : null;
    if (controller) config.signal = controller.signal;

    if (csrf && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase()) && !config.headers['x-csrf-token']) {
      config.headers['x-csrf-token'] = csrf;
    }

    const isBinaryBody = typeof Blob !== 'undefined' && options.body instanceof Blob;
    if (isBinaryBody) {
      config.body = options.body;
      delete config.headers['Content-Type'];
    } else if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    } else if (options.body) {
      config.body = options.body;
    }

    let timeoutId = null;
    try {
      const timeout = new Promise((_, reject) => {
        if (!timeoutMs) return;
        timeoutId = setTimeout(() => {
          if (controller) controller.abort();
          const error = new Error(`Request timed out after ${timeoutMs}ms`);
          error.code = 'API_TIMEOUT';
          error.status = 408;
          reject(error);
        }, timeoutMs);
      });
      const response = await (timeoutMs ? Promise.race([fetch(url, config), timeout]) : fetch(url, config));
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMessage = (data && data.error && data.error.message) || data.message || `HTTP ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return {
        ok: true,
        status: response.status,
        data
      };
    } catch (error) {
      return {
        ok: false,
        status: error.status || (error.name === 'AbortError' ? 408 : 0),
        code: error.code || (error.name === 'AbortError' ? 'API_TIMEOUT' : 'API_NETWORK_ERROR'),
        error: error.message,
        data: error.data
      };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  extractEnvelopeData(result) {
    if (!result || typeof result !== 'object') {
      return null;
    }

    const candidates = [result, result.data, result.data && result.data.data];
    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== 'object') {
        continue;
      }

      if (candidate.user !== undefined || candidate.roles !== undefined || candidate.permissions !== undefined || candidate.csrfToken !== undefined) {
        return candidate;
      }

      if (candidate.ok === true && candidate.data && typeof candidate.data === 'object') {
        const payload = candidate.data;
        if (payload.user !== undefined || payload.roles !== undefined || payload.permissions !== undefined || payload.csrfToken !== undefined) {
          return payload;
        }
      }
    }

    return null;
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  async patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  // PUT request
  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  async download(endpoint) {
    const url = this.baseUrl ? this.baseUrl + endpoint : resolveNeutralApiUrl(endpoint);
    const csrf = this.csrfToken || this.getCookie(this.csrfCookieName);
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { ...this.defaultHeaders, ...(csrf ? { 'x-csrf-token': csrf } : {}) }
      });
      if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status });
      return { ok: true, status: response.status, data: await response.blob() };
    } catch (error) {
      return { ok: false, status: error.status || 0, error: error.message };
    }
  }

  async upload(endpoint, file) {
    return this.request(endpoint, { method: 'POST', body: file });
  }

  // User endpoints
  async getUsers() {
    return this.get('/api/admin/users');
  }

  async searchUsers(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        params.set(key, String(value));
      }
    });
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return this.get(`/api/admin/users${suffix}`);
  }

  async getUser(userId) {
    return this.get(`/api/admin/users/${userId}`);
  }

  async createUser(userData) {
    return this.post('/api/admin/users', userData);
  }

  async updateUser(userId, userData) {
    return this.put(`/api/admin/users/${userId}`, userData);
  }

  async deleteUser(userId) {
    return this.delete(`/api/admin/users/${userId}`);
  }

  // Role endpoints
  async getRoles() {
    return this.get('/api/admin/roles');
  }

  async getRole(roleId) {
    return this.get(`/api/admin/roles/${roleId}`);
  }

  async createRole(roleData) {
    return this.post('/api/admin/roles', roleData);
  }

  async updateRole(roleId, roleData) {
    return this.put(`/api/admin/roles/${roleId}`, roleData);
  }

  async deleteRole(roleId) {
    return this.delete(`/api/admin/roles/${roleId}`);
  }

  // Settings endpoints
  async getSettings() {
    return this.get('/api/admin/settings');
  }

  async getHomepage() {
    return this.get('/api/settings/homepage');
  }

  async getAppearance() {
    return this.get('/api/settings/appearance');
  }

  async getMaintenance() { return this.get('/api/settings/maintenance'); }

  async updateSettings(settingsData) {
    return this.post('/api/admin/settings', settingsData);
  }

  async getPermissions() {
    return this.get('/api/admin/permissions');
  }

  async getSessions() {
    return this.get('/api/admin/sessions');
  }

  async invalidateSession(sessionId) {
    return this.post('/api/admin/sessions/invalidate', { sessionId });
  }

  async getAuditEntries(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        params.set(key, String(value));
      }
    });
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return this.get(`/api/admin/audit${suffix}`);
  }

  async discoverModules() {
    return this.get('/api/modules');
  }

  async getAdminModules() {
    return this.get('/api/admin/modules');
  }

  async getAdminModule(moduleId) {
    return this.get(`/api/admin/modules/${moduleId}`);
  }

  async installModule(moduleId) {
    return this.post(`/api/admin/modules/${moduleId}/install`, {});
  }

  async activateModule(moduleId) {
    return this.post(`/api/admin/modules/${moduleId}/activate`, {});
  }

  async deactivateModule(moduleId) {
    return this.post(`/api/admin/modules/${moduleId}/deactivate`, {});
  }

  async uninstallModule(moduleId) {
    return this.post(`/api/admin/modules/${moduleId}/uninstall`, {});
  }

  async getAdminModulePermissions(moduleId) {
    return this.get(`/api/admin/modules/${moduleId}/permissions`);
  }

  async updateAdminModulePermissions(moduleId, roleAssignments) {
    return this.put(`/api/admin/modules/${moduleId}/permissions`, { roleAssignments });
  }

  // Setup endpoints
  async getSetupStatus() {
    return this.get('/api/setup/status');
  }

  async updateSetup(setupData) {
    return this.post('/api/setup', setupData);
  }

  async installSetup() {
    return this.post('/api/setup/install', {});
  }

  // Database endpoints
  async getDatabaseStatus() {
    return this.get('/api/database/status');
  }

  async getStatus() {
    return this.get('/api/status');
  }

  async testDatabase(databaseConfig) {
    return this.post('/api/database/status', databaseConfig);
  }

  async login(username, password) {
    const endpoint = this.sessionScope === 'admin' ? '/api/admin/auth/login' : '/api/auth/login';
    const result = await this.post(endpoint, { username, password });
    const payload = this.extractEnvelopeData(result) || (result && result.ok && result.data && typeof result.data === 'object' ? result.data : null);
    const csrf = (payload && payload.csrfToken) || (result && result.data && result.data.csrfToken) || (typeof document !== 'undefined' ? this.getCookie(this.csrfCookieName) : null);
    if (csrf) {
      this.setCsrfToken(csrf);
    }
    return result;
  }

  async logout() {
    const endpoint = this.sessionScope === 'admin' ? '/api/admin/auth/logout' : '/api/auth/logout';
    const result = await this.post(endpoint, {});
    this.setCsrfToken(null);
    return result;
  }

  async me() {
    const endpoint = this.sessionScope === 'admin' ? '/api/admin/auth/me' : '/api/auth/me';
    return this.get(endpoint);
  }
}

const globalScope = typeof globalThis !== 'undefined'
  ? globalThis
  : (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));

if (globalScope) {
  globalScope.resolveNeutralApiUrl = resolveNeutralApiUrl;
  globalScope.ApiClient = ApiClient;
}

if (typeof window !== 'undefined') {
  window.resolveNeutralApiUrl = resolveNeutralApiUrl;
  window.ApiClient = ApiClient;
}

if (typeof globalThis !== 'undefined') {
  globalThis.resolveNeutralApiUrl = resolveNeutralApiUrl;
  globalThis.ApiClient = ApiClient;
}

// Export for browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiClient;
}

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
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders
    };
  }

  setAuthRole(role) {
    if (role) {
      this.defaultHeaders['x-framework-role'] = role;
    } else {
      delete this.defaultHeaders['x-framework-role'];
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
    const csrf = this.csrfToken || this.getCookie('neutral_csrf');
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
    if (!result || result.ok !== true || !result.data || typeof result.data !== 'object') {
      return null;
    }
    const envelope = result.data;
    if (envelope.ok !== true || !envelope.data || typeof envelope.data !== 'object') {
      return null;
    }
    return envelope.data;
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
    const csrf = this.csrfToken || this.getCookie('neutral_csrf');
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

  async updateSettings(settingsData) {
    return this.post('/api/admin/settings', settingsData);
  }

  async getPermissions() {
    return this.get('/api/admin/permissions');
  }

  async getSessions() {
    return this.get('/api/admin/sessions');
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
    const result = await this.post('/api/auth/login', { username, password });
    if (result.ok && result.data && result.data.csrfToken) {
      this.setCsrfToken(result.data.csrfToken);
    }
    return result;
  }

  async logout() {
    const result = await this.post('/api/auth/logout', {});
    this.setCsrfToken(null);
    return result;
  }

  async me() {
    return this.get('/api/auth/me');
  }
}

if (typeof window !== 'undefined') {
  window.resolveNeutralApiUrl = resolveNeutralApiUrl;
  window.ApiClient = ApiClient;
}

// Export for browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiClient;
}

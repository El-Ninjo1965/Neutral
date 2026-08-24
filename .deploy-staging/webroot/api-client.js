'use strict';

/**
 * API Client Wrapper
 * Centralized fetch wrapper with auth headers, error handling, and JSON parsing
 */

class ApiClient {
  constructor(baseUrl = '', defaultHeaders = {}) {
    this.baseUrl = baseUrl || '';
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

  async request(endpoint, options = {}) {
    const url = this.baseUrl + endpoint;
    const config = {
      method: options.method || 'GET',
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      }
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    } else if (options.body) {
      config.body = options.body;
    }

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const error = new Error(data.message || `HTTP ${response.status}`);
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
        status: error.status || 500,
        error: error.message,
        data: error.data
      };
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  // PUT request
  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // User endpoints
  async getUsers() {
    return this.get('/api/admin/users');
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

  // Setup endpoints
  async getSetupStatus() {
    return this.get('/api/setup/status');
  }

  async updateSetup(setupData) {
    return this.post('/api/setup', setupData);
  }

  // Database endpoints
  async getDatabaseStatus() {
    return this.get('/api/database/status');
  }

  async testDatabase(databaseConfig) {
    return this.post('/api/database/status', databaseConfig);
  }
}

// Export for browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiClient;
}

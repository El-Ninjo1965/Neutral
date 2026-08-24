'use strict';

/**
 * Input Validation Middleware
 * Validates JSON payloads against schema definitions
 */

const { CoreSecurity } = require('../../platform/security');

const normalizeString = (value, { maxLength = 255, allowEmpty = false } = {}) => {
  if (value === null || typeof value === 'undefined') {
    return allowEmpty ? '' : null;
  }

  const sanitized = CoreSecurity.validateInput(value, { maxLength, allowEmpty });
  return sanitized;
};

const validateSetupPayload = (payload) => {
  const errors = [];

  if (payload.appName !== undefined && payload.appName !== null) {
    if (typeof payload.appName !== 'string') {
      errors.push('appName must be a string');
    } else if (normalizeString(payload.appName, { maxLength: 120, allowEmpty: false }) === '') {
      errors.push('appName must be a non-empty string');
    }
  }

  if (payload.configuration) {
    if (typeof payload.configuration !== 'object') {
      errors.push('configuration must be an object');
    }
    if (payload.configuration.serverUrl !== undefined && payload.configuration.serverUrl !== null && typeof payload.configuration.serverUrl !== 'string') {
      errors.push('configuration.serverUrl must be a string');
    }
    if (payload.configuration.apiBase !== undefined && payload.configuration.apiBase !== null && typeof payload.configuration.apiBase !== 'string') {
      errors.push('configuration.apiBase must be a string');
    }
  }

  if (payload.currentStep !== undefined && payload.currentStep !== null && typeof payload.currentStep !== 'string') {
    errors.push('currentStep must be a string');
  }

  return errors;
};

const validateDatabasePayload = (payload = {}) => {
  const errors = [];

  const validTypes = ['mysql', 'postgresql', 'sqlite', 'indexeddb', 'mongodb'];
  const normalizedType = String(payload.type || '').toLowerCase();
  const allowsEmptyConnection = ['sqlite', 'indexeddb'].includes(normalizedType);

  if (payload.type && !validTypes.includes(payload.type)) {
    errors.push(`type must be one of: ${validTypes.join(', ')}`);
  }

  if (payload.host !== undefined && payload.host !== null && typeof payload.host !== 'string') {
    errors.push('host must be a string');
  } else if (typeof payload.host === 'string' && payload.host.trim() !== '' && normalizeString(payload.host, { maxLength: 255, allowEmpty: false }) === '') {
    errors.push('host must be a non-empty string');
  } else if (typeof payload.host === 'string' && payload.host.trim() === '' && !allowsEmptyConnection) {
    errors.push('host must be a non-empty string');
  }

  if (payload.name !== undefined && payload.name !== null && typeof payload.name !== 'string') {
    errors.push('name must be a string');
  } else if (typeof payload.name === 'string' && payload.name.trim() !== '' && normalizeString(payload.name, { maxLength: 255, allowEmpty: false }) === '') {
    errors.push('name must be a non-empty string');
  }

  if (payload.port !== undefined && payload.port !== null && payload.port !== '' && (typeof payload.port !== 'number' || payload.port < 1 || payload.port > 65535)) {
    errors.push('port must be a number between 1 and 65535');
  }

  if (payload.username !== undefined && payload.username !== null && typeof payload.username !== 'string') {
    errors.push('username must be a string');
  } else if (typeof payload.username === 'string' && payload.username.trim() !== '' && normalizeString(payload.username, { maxLength: 255, allowEmpty: false }) === '') {
    errors.push('username must be a non-empty string');
  } else if (typeof payload.username === 'string' && payload.username.trim() === '' && !allowsEmptyConnection) {
    errors.push('username must be a non-empty string');
  }

  if (payload.password !== undefined && payload.password !== null && typeof payload.password !== 'string') {
    errors.push('password must be a string');
  } else if (typeof payload.password === 'string' && payload.password.trim() !== '' && normalizeString(payload.password, { maxLength: 512, allowEmpty: false }) === '') {
    errors.push('password must be a non-empty string');
  } else if (typeof payload.password === 'string' && payload.password.trim() === '' && !allowsEmptyConnection) {
    errors.push('password must be a non-empty string');
  }

  return errors;
};

const validateUserPayload = (payload) => {
  const errors = [];

  if (!payload.username || typeof payload.username !== 'string' || normalizeString(payload.username, { maxLength: 80, allowEmpty: false }).length < 3) {
    errors.push('username must be a non-empty string with at least 3 characters');
  }

  if (!payload.email || typeof payload.email !== 'string' || !isValidEmail(normalizeString(payload.email, { maxLength: 254, allowEmpty: false }))) {
    errors.push('email must be a valid email address');
  }

  const validRoles = ['admin', 'developer', 'user', 'viewer'];
  if (!payload.role || !validRoles.includes(payload.role)) {
    errors.push(`role must be one of: ${validRoles.join(', ')}`);
  }

  if (payload.displayName !== undefined && payload.displayName !== null && typeof payload.displayName !== 'string') {
    errors.push('displayName must be a string');
  }

  if (payload.status && !['active', 'inactive', 'pending', 'archived'].includes(payload.status)) {
    errors.push('status must be one of: active, inactive, pending, archived');
  }

  if (payload.permissions && !Array.isArray(payload.permissions)) {
    errors.push('permissions must be an array');
  }

  return errors;
};

const validateRolePayload = (payload) => {
  const errors = [];

  if (!payload.name || typeof payload.name !== 'string' || normalizeString(payload.name, { maxLength: 80, allowEmpty: false }).length < 3) {
    errors.push('name must be a non-empty string with at least 3 characters');
  }

  if (payload.description !== undefined && payload.description !== null && typeof payload.description !== 'string') {
    errors.push('description must be a string');
  }

  if (!Array.isArray(payload.permissions)) {
    errors.push('permissions must be an array');
  }

  return errors;
};

const validateSettingsPayload = (payload) => {
  const errors = [];

  if (payload.appName !== undefined && payload.appName !== null) {
    if (typeof payload.appName !== 'string') {
      errors.push('appName must be a string');
    } else if (normalizeString(payload.appName, { maxLength: 120, allowEmpty: false }) === '') {
      errors.push('appName must be a non-empty string');
    }
  }

  if (payload.settings && typeof payload.settings !== 'object') {
    errors.push('settings must be an object');
  }

  return errors;
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  validateSetupPayload,
  validateDatabasePayload,
  validateUserPayload,
  validateRolePayload,
  validateSettingsPayload,
  isValidEmail
};

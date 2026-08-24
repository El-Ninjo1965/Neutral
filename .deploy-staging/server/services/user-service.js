'use strict';

const crypto = require('node:crypto');
const persistenceService = require('./persistence-service');
const auditService = require('./audit-service');
const { hashPassword, verifyPassword } = require('./password-hash');

const generateUserId = () => `user-${crypto.randomBytes(4).toString('hex')}`;

const isModernPasswordHash = (hash) => typeof hash === 'string' && (hash.startsWith('$argon2') || hash.startsWith('scrypt$'));
const isLegacyPasswordHash = (hash) => typeof hash === 'string' && hash.trim() && !isModernPasswordHash(hash);

const getAll = () => {
  try {
    const data = persistenceService.loadAdminUsers();
    return Array.isArray(data.users) ? data.users : [];
  } catch (error) {
    console.error('[user-service] Failed to load users:', error.message);
    return [];
  }
};

const getById = (userId) => {
  try {
    const users = getAll();
    return users.find((u) => u.id === userId) || null;
  } catch (error) {
    console.error('[user-service] Failed to get user:', error.message);
    return null;
  }
};

const getByUsername = (username) => {
  try {
    const users = getAll();
    return users.find((u) => u.username === username) || null;
  } catch (error) {
    console.error('[user-service] Failed to get user by username:', error.message);
    return null;
  }
};

const migrateLegacyPasswordIfNeeded = async (userId, password) => {
  if (!userId || !password) {
    return false;
  }

  const user = getById(userId);
  if (!user || !user.passwordHash) {
    return false;
  }

  if (isModernPasswordHash(user.passwordHash)) {
    return false;
  }

  if (!isLegacyPasswordHash(user.passwordHash)) {
    return false;
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return false;
  }

  const replacementHash = await hashPassword(password);
  const users = getAll();
  const index = users.findIndex((candidate) => candidate.id === userId);
  if (index < 0) {
    return false;
  }

  users[index].passwordHash = replacementHash;
  users[index].updatedAt = new Date().toISOString();
  persistenceService.saveAdminUsers({ users });
  return true;
};

const create = async (userData, actor = 'system') => {
  try {
    const validation = validateUserData(userData, { isNew: true });
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    const existingByUsername = getByUsername(userData.username);
    if (existingByUsername) {
      throw new Error(`User with username '${userData.username}' already exists`);
    }

    const existingByEmail = getAll().find((u) => u.email === userData.email);
    if (existingByEmail) {
      throw new Error(`User with email '${userData.email}' already exists`);
    }

    const userId = userData.id || generateUserId();
    const user = {
      id: userId,
      username: userData.username,
      email: userData.email,
      displayName: userData.displayName || userData.username,
      role: userData.role || 'user',
      status: userData.status || 'active',
      permissions: Array.isArray(userData.permissions) ? userData.permissions : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      passwordHash: userData.password ? await hashPassword(userData.password) : null
    };

    const users = getAll();
    users.push(user);
    persistenceService.saveAdminUsers({ users });

    auditService.log(auditService.actions.USER_CREATED, 'user', userId, actor, {
      username: user.username,
      email: user.email,
      role: user.role
    });

    const { passwordHash, ...userPublic } = user;
    return userPublic;
  } catch (error) {
    auditService.log(auditService.actions.USER_CREATED, 'user', 'unknown', actor, {
      error: error.message
    }, 'failure');
    throw error;
  }
};

const update = async (userId, updates, actor = 'system') => {
  try {
    const user = getById(userId);
    if (!user) {
      throw new Error(`User '${userId}' not found`);
    }

    const validation = validateUserData(updates, { isNew: false, isUpdate: true });
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    if (updates.email && updates.email !== user.email) {
      const existingByEmail = getAll().find((u) => u.email === updates.email);
      if (existingByEmail) {
        throw new Error(`User with email '${updates.email}' already exists`);
      }
    }

    const updated = {
      ...user,
      displayName: updates.displayName !== undefined ? updates.displayName : user.displayName,
      email: updates.email !== undefined ? updates.email : user.email,
      role: updates.role !== undefined ? updates.role : user.role,
      status: updates.status !== undefined ? updates.status : user.status,
      permissions: Array.isArray(updates.permissions) ? updates.permissions : user.permissions,
      updatedAt: new Date().toISOString()
    };

    if (updates.password) {
      updated.passwordHash = await hashPassword(updates.password);
    }

    const users = getAll();
    const index = users.findIndex((u) => u.id === userId);
    if (index >= 0) {
      users[index] = updated;
      persistenceService.saveAdminUsers({ users });
    }

    auditService.log(auditService.actions.USER_UPDATED, 'user', userId, actor, {
      username: updated.username,
      changes: Object.keys(updates).filter((k) => k !== 'password')
    });

    const { passwordHash, ...userPublic } = updated;
    return userPublic;
  } catch (error) {
    auditService.log(auditService.actions.USER_UPDATED, 'user', userId, actor, {
      error: error.message
    }, 'failure');
    throw error;
  }
};

const remove = async (userId, actor = 'system') => {
  try {
    const user = getById(userId);
    if (!user) {
      throw new Error(`User '${userId}' not found`);
    }

    const users = getAll().filter((u) => u.id !== userId);
    persistenceService.saveAdminUsers({ users });

    auditService.log(auditService.actions.USER_DELETED, 'user', userId, actor, {
      username: user.username,
      email: user.email
    });

    return true;
  } catch (error) {
    auditService.log(auditService.actions.USER_DELETED, 'user', userId, actor, {
      error: error.message
    }, 'failure');
    throw error;
  }
};

const validateUserData = (userData, options = {}) => {
  const errors = [];
  const { isNew = false } = options;

  if (isNew || userData.username !== undefined) {
    if (!userData.username || typeof userData.username !== 'string' || userData.username.trim().length < 3) {
      errors.push('username must be a non-empty string with at least 3 characters');
    }
  }

  if (isNew || userData.email !== undefined) {
    if (!userData.email || typeof userData.email !== 'string' || !isValidEmail(userData.email)) {
      errors.push('email must be a valid email address');
    }
  }

  if (isNew || userData.role !== undefined) {
    const validRoles = ['admin', 'developer', 'user', 'viewer'];
    if (!userData.role || !validRoles.includes(userData.role)) {
      errors.push(`role must be one of: ${validRoles.join(', ')}`);
    }
  }

  if (userData.displayName !== undefined && userData.displayName && typeof userData.displayName !== 'string') {
    errors.push('displayName must be a string');
  }

  if (userData.status !== undefined && !['active', 'inactive', 'pending', 'archived'].includes(userData.status)) {
    errors.push('status must be one of: active, inactive, pending, archived');
  }

  if (userData.permissions !== undefined && !Array.isArray(userData.permissions)) {
    errors.push('permissions must be an array');
  }

  if (userData.password !== undefined && userData.password && typeof userData.password !== 'string') {
    errors.push('password must be a string');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  getAll,
  getById,
  getByUsername,
  create,
  update,
  remove,
  verifyPassword,
  validateUserData,
  generateUserId,
  migrateLegacyPasswordIfNeeded,
  hashPassword
};

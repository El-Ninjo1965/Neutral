'use strict';

const crypto = require('node:crypto');
const persistenceService = require('./persistence-service');
const auditService = require('./audit-service');

const generateRoleId = () => `role-${crypto.randomBytes(4).toString('hex')}`;
const builtInRoleNames = ['admin', 'developer', 'user', 'viewer'];

const normalizeRole = (role) => {
  if (!role || typeof role !== 'object') {
    return role;
  }

  const normalized = { ...role };
  if (!normalized.role) {
    normalized.role = normalized.name;
  }
  if (!normalized.name) {
    normalized.name = normalized.role;
  }
  return normalized;
};

const getAll = () => {
  try {
    const data = persistenceService.readJsonFile('admin-roles.json', { roles: [] });
    const roles = Array.isArray(data.roles) ? data.roles : [];
    if (roles.length === 0) {
      const initialized = initializeBuiltInRoles();
      if (Array.isArray(initialized) && initialized.length > 0) {
        return initialized.map(normalizeRole);
      }
      const reloaded = persistenceService.readJsonFile('admin-roles.json', { roles: [] });
      return Array.isArray(reloaded.roles) ? reloaded.roles.map(normalizeRole) : [];
    }
    return roles.map(normalizeRole);
  } catch (error) {
    console.error('[role-service] Failed to load roles:', error.message);
    return [];
  }
};

const getById = (roleId) => {
  try {
    const roles = getAll();
    return roles.find((r) => r.id === roleId || r.name === roleId || r.role === roleId) || null;
  } catch (error) {
    console.error('[role-service] Failed to get role:', error.message);
    return null;
  }
};

const getByName = (name) => {
  try {
    const roles = getAll();
    return roles.find((r) => r.name === name || r.role === name) || null;
  } catch (error) {
    console.error('[role-service] Failed to get role by name:', error.message);
    return null;
  }
};

const create = (roleData, actor = 'system') => {
  try {
    const validation = validateRoleData(roleData, { isNew: true });
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    const requestedRole = (roleData.role || roleData.name || '').trim();
    if (builtInRoleNames.includes(requestedRole)) {
      throw new Error(`Role '${requestedRole}' is a built-in role and cannot be created.`);
    }

    const existingByName = getByName(requestedRole);
    if (existingByName) {
      throw new Error(`Role with name '${requestedRole}' already exists`);
    }

    const roleId = roleData.id || generateRoleId();
    const role = normalizeRole({
      id: roleId,
      name: roleData.name || requestedRole,
      role: requestedRole,
      description: roleData.description || '',
      permissions: Array.isArray(roleData.permissions) ? roleData.permissions : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const roles = getAll();
    roles.push(role);
    persistenceService.writeJsonFile('admin-roles.json', { roles });

    auditService.log(auditService.actions.ROLE_CREATED, 'role', roleId, actor, {
      name: role.name,
      permissionCount: role.permissions.length
    });

    return role;
  } catch (error) {
    auditService.log(auditService.actions.ROLE_CREATED, 'role', 'unknown', actor, {
      error: error.message
    }, 'failure');
    throw error;
  }
};

const update = (roleId, updates, actor = 'system') => {
  try {
    const role = getById(roleId);
    if (!role) {
      throw new Error(`Role '${roleId}' not found`);
    }

    const validation = validateRoleData(updates, { isNew: false, isUpdate: true });
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Check name uniqueness
    if (updates.name && updates.name !== role.name) {
      const existingByName = getByName(updates.name);
      if (existingByName) {
        throw new Error(`Role with name '${updates.name}' already exists`);
      }
    }

    const nextRole = updates.role !== undefined ? updates.role : role.role;
    const nextName = updates.name !== undefined ? updates.name : role.name;
    if (builtInRoleNames.includes(nextRole)) {
      throw new Error(`Role '${nextRole}' is a built-in role and cannot be updated.`);
    }

    const updated = normalizeRole({
      ...role,
      name: nextName,
      role: nextRole,
      description: updates.description !== undefined ? updates.description : role.description,
      permissions: Array.isArray(updates.permissions) ? updates.permissions : role.permissions,
      updatedAt: new Date().toISOString()
    });

    const roles = getAll();
    const index = roles.findIndex((r) => r.id === roleId);
    if (index >= 0) {
      roles[index] = updated;
      persistenceService.writeJsonFile('admin-roles.json', { roles });
    }

    auditService.log(auditService.actions.ROLE_UPDATED, 'role', roleId, actor, {
      name: updated.name,
      changes: Object.keys(updates)
    });

    return updated;
  } catch (error) {
    auditService.log(auditService.actions.ROLE_UPDATED, 'role', roleId, actor, {
      error: error.message
    }, 'failure');
    throw error;
  }
};

const remove = (roleId, actor = 'system') => {
  try {
    const role = getById(roleId);
    if (!role) {
      throw new Error(`Role '${roleId}' not found`);
    }

    // Prevent deletion of built-in roles
    if (builtInRoleNames.includes(role.name) || builtInRoleNames.includes(role.role)) {
      throw new Error(`Cannot delete built-in role '${role.name || role.role}'`);
    }

    const roles = getAll().filter((r) => r.id !== roleId);
    persistenceService.writeJsonFile('admin-roles.json', { roles });

    auditService.log(auditService.actions.ROLE_DELETED, 'role', roleId, actor, {
      name: role.name,
      permissionCount: role.permissions.length
    });

    return true;
  } catch (error) {
    auditService.log(auditService.actions.ROLE_DELETED, 'role', roleId, actor, {
      error: error.message
    }, 'failure');
    throw error;
  }
};

const initializeBuiltInRoles = () => {
  try {
    const existing = persistenceService.readJsonFile('admin-roles.json', { roles: [] });
    if (Array.isArray(existing.roles) && existing.roles.length > 0) {
      return existing.roles.map(normalizeRole); // Already initialized
    }

    const builtInRoles = [
      {
        id: 'role-admin',
        name: 'admin',
        role: 'admin',
        description: 'Full administrative access',
        permissions: ['admin.read', 'admin.write', 'user.read', 'user.write', 'role.read', 'role.write', 'app.read', 'app.write', 'settings.read', 'settings.write'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'role-developer',
        name: 'developer',
        role: 'developer',
        description: 'Developer access with app management',
        permissions: ['app.read', 'app.write', 'user.read', 'settings.read'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'role-user',
        name: 'user',
        role: 'user',
        description: 'Standard user access',
        permissions: ['app.read', 'settings.read'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'role-viewer',
        name: 'viewer',
        role: 'viewer',
        description: 'Read-only access',
        permissions: ['app.read'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ].map(normalizeRole);

    persistenceService.writeJsonFile('admin-roles.json', { roles: builtInRoles });
    return builtInRoles;
  } catch (error) {
    console.error('[role-service] Failed to initialize built-in roles:', error.message);
    return [];
  }
};

const validateRoleData = (roleData, options = {}) => {
  const errors = [];

  const { isNew = false, isUpdate = false } = options;

  const roleName = roleData.role || roleData.name;
  if (isNew || roleName !== undefined) {
    if (!roleName || typeof roleName !== 'string' || roleName.trim().length < 3) {
      errors.push('role must be a non-empty string with at least 3 characters');
    }
  }

  if (roleData.name !== undefined && roleData.name && typeof roleData.name !== 'string') {
    errors.push('name must be a string');
  }

  if (roleData.description !== undefined && roleData.description && typeof roleData.description !== 'string') {
    errors.push('description must be a string');
  }

  if ((roleData.role || roleData.name) && builtInRoleNames.includes(String(roleData.role || roleData.name).trim())) {
    errors.push('built-in role names are reserved');
  }

  if (isNew || roleData.permissions !== undefined) {
    if (!Array.isArray(roleData.permissions)) {
      errors.push('permissions must be an array');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Initialize on load
initializeBuiltInRoles();

module.exports = {
  getAll,
  getById,
  getByName,
  create,
  update,
  remove,
  validateRoleData,
  generateRoleId,
  initializeBuiltInRoles
};

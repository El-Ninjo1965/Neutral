/*
 * Core Access
 * Version: 1.0.0
 *
 * Central authorization and permission evaluation for the framework.
 * This module resolves permissions from roles, explicit permissions,
 * and protected metadata without allowing implicit admin bypasses.
 */

(() => {
    'use strict';

    const DEFAULT_ROLE_PERMISSIONS = {
        user: ['user:read'],
        member: ['user:read'],
        manager: ['user:read', 'user:write'],
        admin: ['user:read', 'user:write', 'system:view'],
        developer: ['user:read', 'user:write', 'system:view', 'module:read', 'module:update']
    };

    const DEFAULT_ROLE_DEFINITIONS = Object.freeze({
        user: {
            role: 'user',
            name: 'User',
            description: 'Standard end user.',
            permissions: ['user:read'],
            isSystem: true
        },
        member: {
            role: 'member',
            name: 'Member',
            description: 'Member with basic collaboration access.',
            permissions: ['user:read'],
            isSystem: true
        },
        manager: {
            role: 'manager',
            name: 'Manager',
            description: 'Manager with limited write access.',
            permissions: ['user:read', 'user:write'],
            isSystem: true
        },
        admin: {
            role: 'admin',
            name: 'Admin',
            description: 'Administrator with system access.',
            permissions: ['user:read', 'user:write', 'system:view'],
            isSystem: true
        },
        developer: {
            role: 'developer',
            name: 'Developer',
            description: 'Developer role with module and framework access.',
            permissions: ['user:read', 'user:write', 'system:view', 'module:read', 'module:update'],
            isSystem: true
        }
    });

    const normalizeArray = (value) => Array.isArray(value)
        ? value.filter(Boolean).map((entry) => String(entry).trim()).filter(Boolean)
        : [];

    const normalizeRoleName = (value) => String(value || '').trim().toLowerCase();
    const normalizePermissionName = (value) => String(value || '').trim();

    const resolveActionPermission = (action, resource = null) => {
        const normalizedAction = normalizePermissionName(action);
        if (!normalizedAction) {
            return '';
        }
        if (normalizedAction.includes(':')) {
            return normalizedAction;
        }

        if (typeof resource === 'string' && resource.trim()) {
            return `${resource.trim()}:${normalizedAction}`;
        }

        if (resource && typeof resource === 'object') {
            const resourceId = resource.id || resource.name || resource.type || resource.resource || '';
            if (typeof resourceId === 'string' && resourceId.trim()) {
                return `${resourceId.trim()}:${normalizedAction}`;
            }
        }

        return normalizedAction;
    };

    const getDefaultRoleCatalog = () => Object.entries(DEFAULT_ROLE_DEFINITIONS).map(([role, definition]) => ({
        ...definition,
        role,
        permissions: Array.isArray(definition.permissions) ? [...definition.permissions] : []
    }));

    const normalizeRoles = (user) => {
        const roles = normalizeArray(user && user.roles).map(normalizeRoleName).filter(Boolean);
        if (roles.length === 0 && user && typeof user.role === 'string' && user.role.trim()) {
            roles.push(normalizeRoleName(user.role));
        }
        return Array.from(new Set(roles));
    };

    const expandPermissions = (user) => {
        const explicit = normalizeArray(user && user.permissions).map(normalizePermissionName).filter(Boolean);
        const roles = normalizeRoles(user);

        const merged = new Set(explicit);

        roles.forEach((role) => {
            const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
            rolePermissions.forEach((permission) => merged.add(normalizePermissionName(permission)));
        });

        return Array.from(merged);
    };

    const CoreAccess = {
        initialized: false,

        init() {
            if (this.initialized) {
                return this;
            }

            this.initialized = true;

            if (window.Core) {
                window.Core.emit('access:initialized', {
                    timestamp: new Date().toISOString()
                });
            }

            return this;
        },

        getRoleCatalog() {
            if (window.MasterFramework && typeof window.MasterFramework.getRoleCatalog === 'function') {
                return window.MasterFramework.getRoleCatalog();
            }
            return getDefaultRoleCatalog();
        },

        getPermissionCatalog() {
            const roleCatalog = this.getRoleCatalog();
            const permissions = new Map();
            roleCatalog.forEach((role) => {
                (Array.isArray(role.permissions) ? role.permissions : []).forEach((permission) => {
                    permissions.set(String(permission).trim(), permission);
                });
            });
            return Array.from(permissions.values()).map((permission) => ({
                permission,
                description: 'Resolved from the framework role catalog.'
            }));
        },

        getRolePermissions(role) {
            const normalizedRole = normalizeRoleName(role);
            if (!normalizedRole) {
                return [];
            }
            const catalog = this.getRoleCatalog();
            const definition = catalog.find((entry) => normalizeRoleName(entry.role) === normalizedRole);
            return definition && Array.isArray(definition.permissions) ? [...definition.permissions] : (DEFAULT_ROLE_PERMISSIONS[normalizedRole] || []);
        },

        can(subject, action, resource = null, context = {}) {
            const user = subject && typeof subject === 'object' ? subject : null;
            if (!user) {
                return {
                    ok: false,
                    code: 'NO_SUBJECT',
                    message: 'User subject is required.'
                };
            }

            const permissions = expandPermissions(user);
            const actionPermission = resolveActionPermission(action, resource);

            const isProtected = !!(resource && resource.protected) || !!context.protected;
            const explicitAllow = permissions.includes(actionPermission) || permissions.includes(normalizePermissionName(action));

            if (isProtected && !explicitAllow) {
                return {
                    ok: false,
                    code: 'ACCESS_DENIED',
                    message: 'Protected resource access denied.',
                    subject: user.id || user.username || null,
                    action,
                    resource: resource && typeof resource === 'object' ? resource.id || resource.name || null : resource
                };
            }

            if (!explicitAllow) {
                return {
                    ok: false,
                    code: 'ACCESS_DENIED',
                    message: 'Permission denied.',
                    subject: user.id || user.username || null,
                    action,
                    resource: resource && typeof resource === 'object' ? resource.id || resource.name || null : resource
                };
            }

            return {
                ok: true,
                code: 'ALLOWED',
                message: 'Access granted.',
                subject: user.id || user.username || null,
                action,
                resource: resource && typeof resource === 'object' ? resource.id || resource.name || null : resource
            };
        },

        hasRole(user, role) {
            const normalizedRole = normalizeRoleName(role);
            const roles = normalizeRoles(user);
            return roles.includes(normalizedRole);
        },

        hasPermission(user, permission) {
            const normalizedPermission = normalizePermissionName(permission);
            const permissions = expandPermissions(user);
            return permissions.includes(normalizedPermission);
        }
    };

    const moduleManifest = Object.freeze({
        id: 'core-access',
        name: 'Core Access',
        version: '1.0.0',
        type: 'framework',
        description: 'Central permission evaluation for roles and permissions.',
        dependencies: [],
        permissions: ['framework:read', 'access:read', 'access:write'],
        capabilities: ['authorization', 'permission-check'],
        source: 'Web-App/core/core-access.js'
    });

    if (!Array.isArray(window.FrameworkModuleCatalog)) {
        window.FrameworkModuleCatalog = [];
    }

    if (!window.FrameworkModuleCatalog.some((entry) => entry && entry.id === moduleManifest.id)) {
        window.FrameworkModuleCatalog.push(moduleManifest);
    }

    if (!window.CoreAccess) {
        window.CoreAccess = CoreAccess;
    }
})();

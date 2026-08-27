/*
 * Generic User Module
 * Version: 1.0.0
 *
 * User facade for the generic platform architecture.
 * It delegates identity, auth, access and audit to central core services.
 */

(() => {
    'use strict';

    const generateUuid = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }

        if (typeof require === 'function' && typeof process !== 'undefined') {
            return require('crypto').randomUUID();
        }

        return `uuid-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };

    const isLocalPreviewRuntime = () => {
        const location = typeof window !== 'undefined' && window.location ? window.location : null;
        const protocol = location && typeof location.protocol === 'string' ? location.protocol.toLowerCase() : '';
        const hostname = location && typeof location.hostname === 'string' ? location.hostname.toLowerCase() : '';
        if (!hostname && protocol === '') {
            return true;
        }
        return protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost');
    };

    const serializeUser = (user) => {
        if (!user || typeof user !== 'object') {
            return null;
        }

        return {
            ...user,
            roles: Array.isArray(user.roles) ? [...user.roles] : [],
            permissions: Array.isArray(user.permissions) ? [...user.permissions] : [],
            protected: !!user.protected,
            metadata: user.metadata && typeof user.metadata === 'object' ? { ...user.metadata } : {}
        };
    };

    const persistUsers = async function persistUsers() {
        const snapshot = Array.from(this.users.values()).map((user) => serializeUser(user)).filter(Boolean);

        try {
            if (window.DatabaseManager && typeof window.DatabaseManager.clear === 'function' && typeof window.DatabaseManager.save === 'function') {
                await window.DatabaseManager.clear('users');
                for (const user of snapshot) {
                    await window.DatabaseManager.save('users', user);
                }
                return snapshot;
            }
        } catch (error) {
            // Persistence fallback intentionally silent for preview/test mode.
        }

        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('core:users', JSON.stringify(snapshot));
        }

        return snapshot;
    };

    const hydrateUsers = async function hydrateUsers() {
        let rows = [];

        try {
            if (window.DatabaseManager && typeof window.DatabaseManager.getAll === 'function') {
                const storedRows = await window.DatabaseManager.getAll('users');
                if (Array.isArray(storedRows) && storedRows.length > 0) {
                    rows = storedRows.map((user) => ensureUserLayout(user)).filter(Boolean);
                }
            }
        } catch (error) {
            rows = [];
        }

        if (rows.length === 0 && typeof localStorage !== 'undefined') {
            try {
                const raw = localStorage.getItem('core:users');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        rows = parsed.map((user) => ensureUserLayout(user)).filter(Boolean);
                    }
                }
            } catch (error) {
                rows = [];
            }
        }

        if (rows.length > 0) {
            this.users = new Map(rows.map((user) => [user.id, user]));
        }

        return rows;
    };

    const normalizePermissions = (user = {}) => {
        const rolePermissions = {
            user: ['user:read'],
            member: ['user:read'],
            manager: ['user:read', 'user:write'],
            admin: ['user:read', 'user:write', 'system:view'],
            developer: ['user:read', 'user:write', 'system:view', 'module:read', 'module:update']
        };

        const explicit = Array.isArray(user.permissions)
            ? user.permissions.filter(Boolean).map((permission) => String(permission).trim()).filter(Boolean)
            : [];
        const roles = Array.isArray(user.roles)
            ? user.roles.filter(Boolean).map((role) => String(role).trim().toLowerCase())
            : (typeof user.role === 'string' && user.role.trim() ? [String(user.role).trim().toLowerCase()] : []);

        const set = new Set(explicit);
        roles.forEach((role) => {
            const mapped = rolePermissions[role] || [];
            mapped.forEach((permission) => set.add(String(permission).trim()));
        });

        return Array.from(set);
    };

    const ensureUserLayout = (user) => {
        if (!user || typeof user !== 'object') {
            return null;
        }

        const roles = Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles.map((role) => String(role).trim().toLowerCase()).filter(Boolean)
            : (typeof user.role === 'string' && user.role.trim() ? [String(user.role).trim().toLowerCase()] : ['user']);

        return {
            id: String(user.id || generateUuid()),
            displayId: user.displayId || '',
            username: String(user.username || '').trim(),
            displayName: user.displayName || user.username || '',
            email: user.email || '',
            status: user.status || 'active',
            roles,
            permissions: normalizePermissions({
                roles,
                permissions: user.permissions || []
            }),
            protected: !!user.protected,
            createdAt: user.createdAt || new Date().toISOString(),
            updatedAt: user.updatedAt || new Date().toISOString(),
            schemaVersion: user.schemaVersion || 1,
            metadata: user.metadata && typeof user.metadata === 'object' ? { ...user.metadata } : {}
        };
    };

    const evaluateWriteAccess = (subject, targetUser) => {
        if (!subject || subject === 'system' || (typeof subject === 'string' && subject.trim() === 'system')) {
            return { ok: true };
        }

        if (!window.CoreAccess || typeof window.CoreAccess.can !== 'function') {
            return { ok: true };
        }

        const resource = targetUser && typeof targetUser === 'object'
            ? { id: targetUser.id, protected: !!targetUser.protected }
            : { protected: false };

        const accessResult = window.CoreAccess.can(subject, 'user:write', resource);
        if (!accessResult || !accessResult.ok) {
            return {
                ok: false,
                code: 'ACCESS_DENIED',
                message: 'User write access denied.'
            };
        }

        return { ok: true };
    };

    const resolveActorUser = async (actor) => {
        if (!actor || actor === 'system' || (typeof actor === 'string' && actor.trim() === 'system')) {
            return null;
        }

        if (actor && typeof actor === 'object' && actor.id) {
            return actor;
        }

        if (typeof actor === 'string' && actor.trim()) {
            const lookup = await UserModule.getUserById(actor);
            if (lookup && lookup.ok && lookup.data) {
                return lookup.data;
            }
        }

        return null;
    };

    const UserModule = {
        name: 'user-module',
        version: '1.0.0',
        initialized: false,
        currentUser: null,
        currentSession: null,
        users: new Map(),

        init() {
            if (this.initialized) {
                if (this.users.size === 0 && isLocalPreviewRuntime()) {
                    this.createDefaultUsers();
                }
                return this;
            }

            if (isLocalPreviewRuntime()) {
                this.ready();
            }
            this.initialized = true;

            if (window.Core) {
                window.Core.emit('user:initialized', {
                    userCount: this.users.size,
                    timestamp: new Date().toISOString()
                });
            }

            return this;
        },

        ready() {
            if (!isLocalPreviewRuntime()) {
                return;
            }

            Promise.resolve(hydrateUsers.call(this)).then((rows) => {
                if (Array.isArray(rows) && rows.length > 0) {
                    if (window.Core) {
                        window.Core.emit('user:hydrated', {
                            userCount: rows.length,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
                this.bootstrapDeveloperUser();
            }).catch(() => {
                this.bootstrapDeveloperUser();
            });
        },

        resolveBootstrapConfig() {
            let bootstrapConfig = {};
            if (window.ConfigManager && typeof window.ConfigManager.get === 'function') {
                bootstrapConfig = window.ConfigManager.get('bootstrap', {}) || {};
            }

            const username = typeof bootstrapConfig.developerUsername === 'string' && bootstrapConfig.developerUsername.trim()
                ? bootstrapConfig.developerUsername.trim()
                : 'developer';
            const displayId = typeof bootstrapConfig.developerDisplayId === 'string' && bootstrapConfig.developerDisplayId.trim()
                ? bootstrapConfig.developerDisplayId.trim()
                : 'USR-000001';

            return {
                enabled: bootstrapConfig.enabled !== false,
                developerUsername: username,
                developerDisplayId: displayId,
                developerUsernameKey: String(username || 'developer').trim().toLowerCase()
            };
        },

        bootstrapDeveloperUser() {
            if (!isLocalPreviewRuntime()) {
                return {
                    ok: false,
                    code: 'SERVER_AUTH_REQUIRED',
                    created: false,
                    data: null,
                    message: 'Local bootstrap is disabled for server-backed deployments.'
                };
            }

            const config = this.resolveBootstrapConfig();
            if (!config.enabled) {
                return {
                    ok: true,
                    code: 'BOOTSTRAP_DISABLED',
                    created: false,
                    data: null
                };
            }

            const targetUsername = String(config.developerUsername || 'developer').trim();
            const existingDeveloper = Array.from(this.users.values()).find((user) => {
                const userName = user && typeof user.username === 'string' ? user.username.trim().toLowerCase() : '';
                const hasDeveloperRole = Array.isArray(user.roles) && user.roles.some((role) => String(role || '').trim().toLowerCase() === 'developer');
                return userName === String(targetUsername).trim().toLowerCase() || hasDeveloperRole;
            });
            if (existingDeveloper) {
                return {
                    ok: true,
                    code: 'DEVELOPER_BOOTSTRAP_PRESENT',
                    created: false,
                    data: serializeUser(existingDeveloper)
                };
            }

            const normalizedTargetUser = String(config.developerUsername || 'developer').trim();
            const usernameExists = Array.from(this.users.values()).some((user) => {
                const existingUsername = user && typeof user.username === 'string' ? user.username.trim().toLowerCase() : '';
                return existingUsername === normalizedTargetUser.toLowerCase();
            });
            if (usernameExists) {
                return {
                    ok: false,
                    code: 'BOOTSTRAP_USERNAME_CONFLICT',
                    created: false,
                    message: 'Developer bootstrap username is already taken.'
                };
            }

            const now = new Date().toISOString();
            const developer = ensureUserLayout({
                id: generateUuid(),
                displayId: config.developerDisplayId,
                username: normalizedTargetUser,
                displayName: 'Developer User',
                email: '',
                status: 'active',
                roles: ['developer'],
                permissions: ['user:read', 'user:write', 'system:view', 'module:read', 'module:update'],
                protected: true,
                createdAt: now,
                updatedAt: now,
                schemaVersion: 1,
                metadata: {
                    bootstrap: true,
                    source: 'core-user.bootstrapDeveloperUser'
                }
            });

            if (!developer) {
                return {
                    ok: false,
                    code: 'BOOTSTRAP_FAILED',
                    created: false,
                    message: 'Developer bootstrap failed.'
                };
            }

            this.users.set(developer.id, developer);

            if (window.CoreAudit && typeof window.CoreAudit.record === 'function') {
                window.CoreAudit.record('system', 'user:bootstrap', developer.id, 'success', {
                    username: developer.username,
                    displayId: developer.displayId,
                    role: 'developer'
                });
            }

            if (window.Core) {
                window.Core.emit('user:bootstrap:developer', {
                    userId: developer.id,
                    username: developer.username,
                    displayId: developer.displayId,
                    timestamp: now
                });
            }

            if (window.DatabaseManager && typeof window.DatabaseManager.clear === 'function' && typeof window.DatabaseManager.save === 'function') {
                Promise.resolve(persistUsers.call(this)).catch(() => {
                    // Storage fallback is intentional for preview-only developer bootstrap.
                });
            }

            return {
                ok: true,
                code: 'DEVELOPER_BOOTSTRAP_CREATED',
                created: true,
                data: serializeUser(developer)
            };
        },

        createDefaultUsers() {
            return this.bootstrapDeveloperUser();
        },

        getNextDisplayId() {
            const sequence = this.users.size + 1;
            return `USR-${String(sequence).padStart(6, '0')}`;
        },

        async listUsers() {
            const items = Array.from(this.users.values()).map((user) => serializeUser(user));
            return {
                ok: true,
                code: 'USERS_LISTED',
                data: {
                    items,
                    count: items.length
                }
            };
        },

        async getUserById(userId) {
            if (!userId) {
                return {
                    ok: false,
                    code: 'INVALID_USER_ID',
                    message: 'User ID is required.'
                };
            }

            const user = this.users.get(userId);
            if (!user) {
                return {
                    ok: false,
                    code: 'USER_NOT_FOUND',
                    message: 'User not found.'
                };
            }

            return {
                ok: true,
                code: 'USER_FOUND',
                data: serializeUser(user)
            };
        },

        async getUserByUsername(username) {
            const normalized = String(username || '').trim();
            if (!normalized) {
                return {
                    ok: false,
                    code: 'INVALID_USERNAME',
                    message: 'Username is required.'
                };
            }

            const expected = normalized.toLowerCase();
            for (const user of this.users.values()) {
                if (String(user.username || '').trim().toLowerCase() === expected) {
                    return {
                        ok: true,
                        code: 'USER_FOUND',
                        data: serializeUser(user)
                    };
                }
            }

            return {
                ok: false,
                code: 'USER_NOT_FOUND',
                message: 'User not found.'
            };
        },

        isUsernameAvailable(username, excludeId = null) {
            const normalized = String(username || '').trim();
            if (!normalized || normalized.length < 3) {
                return false;
            }

            for (const [id, user] of this.users.entries()) {
                if (user.username === normalized && id !== excludeId) {
                    return false;
                }
            }
            return true;
        },

        async createUser(userData, actor = null) {
            if (!userData || typeof userData !== 'object') {
                return {
                    ok: false,
                    code: 'INVALID_USER_DATA',
                    message: 'User data is required.'
                };
            }

            const actorUser = await resolveActorUser(actor);

            if (actorUser && !window.CoreAccess) {
                return {
                    ok: false,
                    code: 'ACCESS_UNAVAILABLE',
                    message: 'Access module is not available.'
                };
            }

            if (actorUser && window.CoreAccess && typeof window.CoreAccess.can === 'function') {
                const access = window.CoreAccess.can(actorUser, 'user:write', 'user');
                if (!access || !access.ok) {
                    return {
                        ok: false,
                        code: 'ACCESS_DENIED',
                        message: 'User creation requires user:write permission.'
                    };
                }
            }

            const username = String(userData.username || '').trim();
            if (!this.isUsernameAvailable(username)) {
                return {
                    ok: false,
                    code: 'USERNAME_INVALID',
                    message: 'Username must be at least 3 characters and unique.'
                };
            }

            const nextDisplayId = this.getNextDisplayId();
            const createdAt = new Date().toISOString();
            const newUser = ensureUserLayout({
                id: generateUuid(),
                displayId: nextDisplayId,
                username,
                displayName: userData.displayName || username,
                email: userData.email || '',
                status: userData.status || 'active',
                roles: Array.isArray(userData.roles) && userData.roles.length > 0 ? userData.roles.map((role) => String(role).trim().toLowerCase()).filter(Boolean) : [String(userData.role || 'user').trim().toLowerCase() || 'user'],
                permissions: Array.isArray(userData.permissions) ? userData.permissions.map((permission) => String(permission).trim()).filter(Boolean) : [],
                protected: !!userData.protected,
                createdAt,
                updatedAt: createdAt,
                schemaVersion: userData.schemaVersion || 1,
                metadata: userData.metadata || {}
            });

            if (!newUser) {
                return {
                    ok: false,
                    code: 'USER_CREATE_FAILED',
                    message: 'User could not be created.'
                };
            }

            this.users.set(newUser.id, newUser);
            Promise.resolve(persistUsers.call(this)).catch(() => {
                // Persistence fallback is intentional for preview-only mode.
            });

            if (window.CoreAudit && typeof window.CoreAudit.record === 'function') {
                window.CoreAudit.record(actor || 'system', 'user:create', newUser.id, 'success', {
                    username: newUser.username,
                    displayId: newUser.displayId
                });
            }

            if (window.Core) {
                window.Core.emit('user:created', {
                    userId: newUser.id,
                    displayId: newUser.displayId,
                    username: newUser.username,
                    timestamp: new Date().toISOString()
                });
            }

            return {
                ok: true,
                code: 'USER_CREATED',
                data: serializeUser(newUser)
            };
        },

        async updateUser(userId, updates = {}, actor = null) {
            const currentResult = await this.getUserById(userId);
            if (!currentResult.ok) {
                return currentResult;
            }

            const currentUser = currentResult.data;
            if (!currentUser) {
                return { ok: false, code: 'USER_NOT_FOUND', message: 'User not found.' };
            }

            const actorUser = await resolveActorUser(actor);
            if (actorUser) {
                const access = evaluateWriteAccess(actorUser, currentUser);
                if (!access.ok) {
                    return access;
                }
            }

            if (updates.username && String(updates.username).trim().length >= 3) {
                const username = String(updates.username).trim();
                if (!this.isUsernameAvailable(username, userId)) {
                    return { ok: false, code: 'USERNAME_INVALID', message: 'Username must be unique and at least 3 characters.' };
                }
            }

            const merged = {
                ...currentUser,
                ...updates,
                updatedAt: new Date().toISOString(),
                roles: Array.isArray(updates.roles) ? updates.roles.map((role) => String(role).trim().toLowerCase()).filter(Boolean) : currentUser.roles,
                permissions: Array.isArray(updates.permissions) ? updates.permissions.map((permission) => String(permission).trim()).filter(Boolean) : currentUser.permissions,
                protected: typeof updates.protected === 'boolean' ? updates.protected : currentUser.protected,
                metadata: updates.metadata && typeof updates.metadata === 'object' ? { ...currentUser.metadata, ...updates.metadata } : currentUser.metadata
            };

            merged.permissions = normalizePermissions(merged);
            const stored = ensureUserLayout(merged);
            this.users.set(userId, stored);
            await persistUsers.call(this);

            if (window.CoreAudit && typeof window.CoreAudit.record === 'function') {
                window.CoreAudit.record(actor || 'system', 'user:update', userId, 'success', {
                    username: stored.username,
                    displayId: stored.displayId
                });
            }

            if (window.Core) {
                window.Core.emit('user:updated', {
                    userId,
                    timestamp: new Date().toISOString()
                });
            }

            return {
                ok: true,
                code: 'USER_UPDATED',
                data: serializeUser(stored)
            };
        },

        async deleteUser(userId, actor = null) {
            const currentResult = await this.getUserById(userId);
            if (!currentResult.ok) {
                return currentResult;
            }

            const user = currentResult.data;
            const actorUser = await resolveActorUser(actor);
            if (actorUser) {
                const access = evaluateWriteAccess(actorUser, user);
                if (!access.ok) {
                    return access;
                }
            }

            const updated = {
                ...user,
                status: 'deleted',
                updatedAt: new Date().toISOString(),
                protected: !!user.protected
            };

            this.users.set(userId, ensureUserLayout(updated));
            await persistUsers.call(this);

            if (window.CoreAudit && typeof window.CoreAudit.record === 'function') {
                window.CoreAudit.record(actor || 'system', 'user:delete', userId, 'success', {
                    username: user.username,
                    displayId: user.displayId
                });
            }

            if (window.Core) {
                window.Core.emit('user:deleted', {
                    userId,
                    timestamp: new Date().toISOString()
                });
            }

            return {
                ok: true,
                code: 'USER_DELETED',
                data: { userId }
            };
        },

        async setStatus(userId, status, actor = null) {
            const currentResult = await this.getUserById(userId);
            if (!currentResult.ok) {
                return currentResult;
            }

            const user = currentResult.data;
            const actorUser = await resolveActorUser(actor);
            if (actorUser) {
                const access = evaluateWriteAccess(actorUser, user);
                if (!access.ok) {
                    return access;
                }
            }

            const updated = {
                ...user,
                status,
                updatedAt: new Date().toISOString()
            };

            const stored = ensureUserLayout(updated);
            this.users.set(userId, stored);
            await persistUsers.call(this);

            if (window.CoreAudit && typeof window.CoreAudit.record === 'function') {
                window.CoreAudit.record(actor || 'system', 'user:set-status', userId, 'success', { status });
            }

            return {
                ok: true,
                code: 'USER_STATUS_UPDATED',
                data: serializeUser(stored)
            };
        },

        async login(credentials) {
            if (!window.CoreAuth || typeof window.CoreAuth.login !== 'function') {
                return { ok: false, code: 'AUTH_NOT_AVAILABLE', message: 'Core auth is not available.' };
            }

            const result = await window.CoreAuth.login(credentials);
            if (!result.ok) {
                return result;
            }

            this.currentUser = result.data.user;
            this.currentSession = result.data.session;
            return result;
        },

        async logout(sessionId = null) {
            if (!window.CoreAuth || typeof window.CoreAuth.logout !== 'function') {
                return { ok: false, code: 'AUTH_NOT_AVAILABLE', message: 'Core auth is not available.' };
            }

            const result = await window.CoreAuth.logout(sessionId);
            this.currentUser = null;
            this.currentSession = null;
            return result;
        },

        getCurrentUser() {
            const authUser = window.CoreAuth && typeof window.CoreAuth.getCurrentUser === 'function'
                ? window.CoreAuth.getCurrentUser()
                : this.currentUser;
            return authUser ? serializeUser(authUser) : null;
        },

        getCurrentSession() {
            return window.CoreAuth && typeof window.CoreAuth.getCurrentSession === 'function'
                ? window.CoreAuth.getCurrentSession()
                : this.currentSession;
        },

        hasRole(role) {
            const user = this.getCurrentUser();
            return !!user && Array.isArray(user.roles) && user.roles.includes(role);
        },

        hasPermission(permission) {
            const user = this.getCurrentUser();
            if (!user) {
                return false;
            }

            if (window.CoreAccess && typeof window.CoreAccess.hasPermission === 'function') {
                return !!window.CoreAccess.hasPermission(user, permission);
            }

            return Array.isArray(user.permissions) && user.permissions.includes(permission);
        },

        isAdmin() {
            return this.hasRole('admin');
        },

        isDeveloper() {
            return this.hasRole('developer');
        }
    };

    const moduleManifest = Object.freeze({
        id: 'core-user',
        name: 'Core User',
        version: '1.0.0',
        type: 'framework',
        description: 'Framework identity, session and access facade.',
        dependencies: ['core-auth', 'core-access', 'core-audit'],
        permissions: ['framework:read', 'user:read', 'user:write'],
        capabilities: ['identity', 'session', 'access'],
        source: 'platform/core-user.js'
    });

    if (!Array.isArray(window.FrameworkModuleCatalog)) {
        window.FrameworkModuleCatalog = [];
    }

    if (!window.FrameworkModuleCatalog.some((entry) => entry && entry.id === moduleManifest.id)) {
        window.FrameworkModuleCatalog.push(moduleManifest);
    }

    if (!window.UserModule) {
        window.UserModule = UserModule;
    }
})();

/*
 * Core Auth
 * Version: 1.0.0
 *
 * Central authentication and session truth for the framework.
 * This is the only auth source for user session state.
 */

(() => {
    'use strict';

    const randomUuid = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }

        if (typeof require === 'function' && typeof process !== 'undefined') {
            return require('crypto').randomUUID();
        }

        return `auth-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };

    const normalizeUserRecord = (user) => {
        if (!user || typeof user !== 'object') {
            return null;
        }

        const roles = Array.isArray(user.roles)
            ? user.roles.filter(Boolean).map(String)
            : (typeof user.role === 'string' && user.role.trim()
                ? [user.role.trim()]
                : ['member']);

        const permissions = Array.isArray(user.permissions)
            ? user.permissions.filter(Boolean).map(String)
            : [];

        const safeUser = {
            id: String(user.id || ''),
            displayId: user.displayId || user.id || '',
            username: String(user.username || '').trim(),
            displayName: user.displayName || user.username || '',
            email: user.email || '',
            status: user.status || 'active',
            roles,
            permissions,
            protected: !!user.protected,
            createdAt: user.createdAt || new Date().toISOString(),
            updatedAt: user.updatedAt || new Date().toISOString(),
            schemaVersion: user.schemaVersion || 1
        };

        return safeUser;
    };

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

    const SESSION_STORAGE_KEY = 'platform.auth.session';

    const isLocalPreviewRuntime = () => {
        const location = typeof window !== 'undefined' && window.location ? window.location : null;
        const protocol = location && typeof location.protocol === 'string' ? location.protocol.toLowerCase() : '';
        const hostname = location && typeof location.hostname === 'string' ? location.hostname.toLowerCase() : '';
        if (!hostname && protocol === '') {
            return true;
        }
        return protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost');
    };

    const readStoredSession = () => {
        if (typeof localStorage === 'undefined') {
            return null;
        }

        try {
            const raw = localStorage.getItem(SESSION_STORAGE_KEY);
            if (!raw) {
                return null;
            }

            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') {
                return null;
            }

            if (parsed.session && typeof parsed.session === 'object') {
                return parsed;
            }
        } catch (error) {
            // Ignore invalid persisted session payloads.
        }

        return null;
    };

    const persistStoredSession = (session, user) => {
        if (typeof localStorage === 'undefined') {
            return;
        }

        if (!session || !user) {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            return;
        }

        const safeUser = normalizeUserRecord(user);
        if (!safeUser) {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            return;
        }

        const payload = {
            session: {
                sessionId: session.sessionId,
                userId: session.userId,
                issuedAt: session.issuedAt,
                expiresAt: session.expiresAt,
                status: session.status || 'active'
            },
            user: safeUser
        };

        try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
        } catch (error) {
            // Storage is intentionally best-effort for preview mode.
        }
    };

    const restoreStoredSession = () => {
        const payload = readStoredSession();
        if (!payload || !payload.session || !payload.user) {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(SESSION_STORAGE_KEY);
            }
            return false;
        }

        const session = payload.session;
        const expiresAt = session.expiresAt ? new Date(session.expiresAt).getTime() : 0;
        if (session.status !== 'active' || !session.sessionId || !session.userId || (expiresAt && expiresAt <= Date.now())) {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(SESSION_STORAGE_KEY);
            }
            return false;
        }

        const user = normalizeUserRecord(payload.user);
        if (!user) {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(SESSION_STORAGE_KEY);
            }
            return false;
        }

        CoreAuth.sessions.set(session.sessionId, session);
        CoreAuth.currentSession = session;
        CoreAuth.currentUser = user;

        if (window.UserModule) {
            window.UserModule.currentUser = user;
            window.UserModule.currentSession = session;
        }

        return true;
    };

    const CoreAuth = {
        initialized: false,
        sessions: new Map(),
        currentSession: null,
        currentUser: null,

        init() {
            if (this.initialized) {
                return this;
            }

            this.initialized = true;

            if (typeof localStorage !== 'undefined') {
                restoreStoredSession();
            }

            if (window.Core) {
                window.Core.emit('auth:initialized', {
                    timestamp: new Date().toISOString()
                });
            }

            return this;
        },

        getUserModule() {
            return window.UserModule || null;
        },

        resolveBootstrapConfig() {
            const configManager = window.ConfigManager && typeof window.ConfigManager.get === 'function'
                ? window.ConfigManager.get('bootstrap', {})
                : {};

            const bootstrapConfig = configManager && typeof configManager === 'object' ? configManager : {};
            const storageState = typeof localStorage !== 'undefined'
                ? (() => {
                    try {
                        const raw = localStorage.getItem('neutral.local.auth.v1');
                        if (!raw) {
                            return null;
                        }
                        const parsed = JSON.parse(raw);
                        return parsed && typeof parsed === 'object' ? parsed : null;
                    } catch (error) {
                        return null;
                    }
                })()
                : null;

            const storageUsername = storageState && typeof storageState.username === 'string' && storageState.username.trim()
                ? storageState.username.trim()
                : (typeof localStorage !== 'undefined'
                    ? (localStorage.getItem('platform.local.auth.developerUsername') || localStorage.getItem('core.bootstrap.developerUsername') || 'Developer')
                    : 'Developer');
            const storagePasswordHash = storageState && typeof storageState.passwordHash === 'string'
                ? storageState.passwordHash
                : (typeof localStorage !== 'undefined'
                    ? (localStorage.getItem('platform.local.auth.developerPasswordHash') || localStorage.getItem('core.bootstrap.developerPasswordHash') || '')
                    : '');

            const username = typeof bootstrapConfig.developerUsername === 'string' && bootstrapConfig.developerUsername.trim()
                ? bootstrapConfig.developerUsername.trim()
                : storageUsername;

            const passwordHash = typeof bootstrapConfig.developerPasswordHash === 'string' && bootstrapConfig.developerPasswordHash.trim()
                ? bootstrapConfig.developerPasswordHash
                : storagePasswordHash;

            return {
                username,
                passwordHash,
                passwordRequired: bootstrapConfig.passwordRequired !== false,
                enabled: bootstrapConfig.enabled !== false
            };
        },

        async setDeveloperPassword(password) {
            const normalized = String(password || '').trim();
            if (!normalized) {
                return {
                    ok: false,
                    code: 'INVALID_PASSWORD',
                    message: 'Developer password must not be empty.'
                };
            }

            const defaultUsername = typeof localStorage !== 'undefined'
                ? (localStorage.getItem('neutral.local.auth.v1')
                    ? (() => {
                        try {
                            const raw = JSON.parse(localStorage.getItem('neutral.local.auth.v1'));
                            return raw && typeof raw.username === 'string' && raw.username.trim() ? raw.username.trim() : 'Developer';
                        } catch (error) {
                            return 'Developer';
                        }
                    })()
                    : 'Developer')
                : 'Developer';
            const passwordHash = await hashSecret(normalized);

            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('neutral.local.auth.v1', JSON.stringify({
                    username: defaultUsername,
                    passwordHash,
                    setupComplete: true,
                    source: 'local-offline',
                    updatedAt: new Date().toISOString()
                }));
            }

            if (window.ConfigManager && typeof window.ConfigManager.get === 'function') {
                const current = window.ConfigManager.get('bootstrap', {}) || {};
                window.ConfigManager.set('bootstrap', {
                    ...current,
                    developerUsername: defaultUsername,
                    developerPasswordHash: passwordHash,
                    passwordRequired: true,
                    passwordSource: 'local-offline'
                });
            }

            return {
                ok: true,
                code: 'DEVELOPER_PASSWORD_SET',
                data: { passwordHash }
            };
        },

        async login(credentialsOrUserId) {
            if (!isLocalPreviewRuntime()) {
                return {
                    ok: false,
                    code: 'SERVER_AUTH_REQUIRED',
                    message: 'Server-side authentication is required for this deployment.'
                };
            }

            const input = credentialsOrUserId && typeof credentialsOrUserId === 'object'
                ? credentialsOrUserId
                : { userId: credentialsOrUserId };

            const userModule = this.getUserModule();
            if (!userModule) {
                return {
                    ok: false,
                    code: 'USER_MODULE_MISSING',
                    message: 'User module is not available.'
                };
            }

            let userResult = null;
            if (typeof input.userId === 'string' && input.userId.trim()) {
                userResult = await userModule.getUserById(input.userId);
            } else if (typeof input.username === 'string' && input.username.trim()) {
                userResult = await userModule.getUserByUsername(input.username);
                if (!userResult || !userResult.ok) {
                    const fallbackName = String(input.username).trim();
                    if (fallbackName.toLowerCase() === 'developer') {
                        const bootstrapResult = userModule.bootstrapDeveloperUser ? userModule.bootstrapDeveloperUser() : null;
                        if (bootstrapResult && bootstrapResult.ok && bootstrapResult.data) {
                            userResult = { ok: true, data: bootstrapResult.data };
                        }
                    }
                }
            }

            const user = userResult && userResult.ok ? userResult.data : null;

            if (!user || user.status !== 'active') {
                if (window.Core) {
                    window.Core.emit('auth:login-failed', {
                        reason: 'INVALID_USER',
                        supplied: input
                    });
                }

                return {
                    ok: false,
                    code: 'INVALID_USER',
                    message: 'User is not valid or not active.'
                };
            }

            const bootstrapConfig = this.resolveBootstrapConfig();
            const isDeveloperUser = String(user.username || '').trim().toLowerCase() === String(bootstrapConfig.username || 'developer').trim().toLowerCase();
            if (bootstrapConfig.enabled && isDeveloperUser && bootstrapConfig.passwordRequired) {
                const expectedPasswordHash = bootstrapConfig.passwordHash || '';
                const givenPassword = typeof input.password === 'string' ? input.password : '';
                if (!expectedPasswordHash) {
                    return {
                        ok: false,
                        code: 'PASSWORD_REQUIRED',
                        message: 'Set a local bootstrap password before testing the developer login.'
                    };
                }
                const givenPasswordHash = await hashSecret(givenPassword);
                if (givenPasswordHash !== expectedPasswordHash) {
                    return {
                        ok: false,
                        code: 'INVALID_PASSWORD',
                        message: 'Developer password is invalid.'
                    };
                }
            }

            const sessionId = randomUuid();
            const session = {
                sessionId,
                userId: user.id,
                issuedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + (60 * 60 * 1000)).toISOString(),
                status: 'active',
                authContext: {
                    source: 'core-auth',
                    method: 'id'
                }
            };

            this.sessions.set(sessionId, session);
            this.currentSession = session;
            this.currentUser = normalizeUserRecord(user);
            persistStoredSession(session, this.currentUser);

            if (window.UserModule) {
                window.UserModule.currentUser = this.currentUser;
                window.UserModule.currentSession = session;
            }

            if (window.Core) {
                window.Core.emit('auth:authenticated', {
                    userId: user.id,
                    sessionId,
                    timestamp: new Date().toISOString()
                });
            }

            return {
                ok: true,
                code: 'AUTHENTICATED',
                data: {
                    user: this.currentUser,
                    session
                }
            };
        },

        async logout(sessionId = null) {
            const activeSession = sessionId
                ? this.sessions.get(sessionId) || this.currentSession
                : this.currentSession;

            if (activeSession && this.sessions.has(activeSession.sessionId)) {
                this.sessions.delete(activeSession.sessionId);
            }

            const previousUser = this.currentUser;
            this.currentSession = null;
            this.currentUser = null;

            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(SESSION_STORAGE_KEY);
            }

            if (window.UserModule) {
                window.UserModule.currentUser = null;
                window.UserModule.currentSession = null;
            }

            if (window.Core) {
                window.Core.emit('auth:logout', {
                    userId: previousUser ? previousUser.id : null,
                    sessionId: activeSession ? activeSession.sessionId : null,
                    timestamp: new Date().toISOString()
                });
            }

            return {
                ok: true,
                code: 'LOGGED_OUT',
                data: {
                    userId: previousUser ? previousUser.id : null,
                    sessionId: activeSession ? activeSession.sessionId : null
                }
            };
        },

        getCurrentUser() {
            if (!this.currentUser) {
                return null;
            }

            return {
                ...this.currentUser,
                roles: [...this.currentUser.roles],
                permissions: [...this.currentUser.permissions]
            };
        },

        getCurrentSession() {
            return this.currentSession ? { ...this.currentSession } : null;
        },

        getSessionStateSnapshot() {
            const user = this.getCurrentUser();
            const session = this.getCurrentSession();
            return {
                authenticated: this.isAuthenticated(),
                userId: user ? user.id : null,
                username: user ? user.username : null,
                displayId: user ? user.displayId : null,
                roles: user ? [...user.roles] : [],
                permissions: user ? [...user.permissions] : [],
                sessionId: session ? session.sessionId : null,
                issuedAt: session ? session.issuedAt : null,
                expiresAt: session ? session.expiresAt : null,
                status: session ? session.status : 'inactive',
                source: session && session.authContext ? session.authContext.source : 'preview-local'
            };
        },

        serializeSessionForTransport() {
            const snapshot = this.getSessionStateSnapshot();
            if (!snapshot.authenticated) {
                return null;
            }

            return {
                sessionId: snapshot.sessionId,
                userId: snapshot.userId,
                username: snapshot.username,
                displayId: snapshot.displayId,
                roles: snapshot.roles,
                permissions: snapshot.permissions,
                issuedAt: snapshot.issuedAt,
                expiresAt: snapshot.expiresAt,
                status: snapshot.status,
                source: snapshot.source
            };
        },

        isAuthenticated() {
            return !!this.currentSession && this.currentSession.status === 'active';
        },

        async requireAuth() {
            if (!this.isAuthenticated()) {
                return {
                    ok: false,
                    code: 'NOT_AUTHENTICATED',
                    message: 'User is not authenticated.'
                };
            }

            return {
                ok: true,
                code: 'AUTHENTICATED',
                data: this.getCurrentUser()
            };
        },

        listSessions() {
            return Array.from(this.sessions.values()).map((session) => ({ ...session }));
        }
    };

    const moduleManifest = Object.freeze({
        id: 'core-auth',
        name: 'Core Auth',
        version: '1.0.0',
        type: 'framework',
        description: 'Central authentication and session truth for the framework.',
        dependencies: ['core-user'],
        permissions: ['framework:read', 'auth:read', 'auth:write'],
        capabilities: ['authentication', 'session'],
        source: 'platform/core-auth.js'
    });

    if (!Array.isArray(window.FrameworkModuleCatalog)) {
        window.FrameworkModuleCatalog = [];
    }

    if (!window.FrameworkModuleCatalog.some((entry) => entry && entry.id === moduleManifest.id)) {
        window.FrameworkModuleCatalog.push(moduleManifest);
    }

    if (!window.CoreAuth) {
        window.CoreAuth = CoreAuth;
    }

    if (!window.AuthModule) {
        window.AuthModule = CoreAuth;
    }
})();

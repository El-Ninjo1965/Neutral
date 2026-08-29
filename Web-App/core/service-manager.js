/*
 * Core Services Layer
 * Version: 1.0
 *
 * Service-Manager für generische Operationen.
 * Verwaltet und koordiniert verschiedene Service-Module.
 */

(() => {
    'use strict';

    const ServiceManager = {
        initialized: false,
        services: new Map(),

        /**
         * Initialisiert den Service-Manager
         */
        init() {
            if (this.initialized) {
                return;
            }

            this.registerDefaultServices();
            this.initialized = true;

            if (window.Core) {
                window.Core.emit('service-manager:initialized', {
                    timestamp: new Date().toISOString()
                });
            }
        },

        /**
         * Registriert Standardservices
         */
        registerDefaultServices() {
            this.register('user', UserService);
            this.register('auth', AuthService);
            this.register('module', ModuleService);
            this.register('logging', LoggingService);
            this.register('cache', CacheService);
        },

        /**
         * Registriert einen Service
         * @param {string} name - Servicename
         * @param {object} service - Service-Objekt
         */
        register(name, service, options = {}) {
            if (typeof name !== 'string' || !name.trim()) {
                throw new Error('Service name is required');
            }

            if (!service || typeof service !== 'object') {
                throw new Error('Service must be an object');
            }

            const normalizedName = name.trim();
            if (!/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(normalizedName)) {
                throw new Error('Service name must use lowercase dot/dash notation');
            }
            if (this.services.has(normalizedName)) {
                throw new Error(`Service "${normalizedName}" is already registered`);
            }

            const visibility = options.visibility === 'internal' ? 'internal' : 'public';
            this.services.set(normalizedName, { service, visibility });

            if (window.Core) {
                window.Core.emit('service:registered', {
                    name: normalizedName,
                    visibility,
                    timestamp: new Date().toISOString()
                });
            }
        },

        /**
         * Gibt einen Service zurück
         * @param {string} name - Servicename
         * @returns {object} Service-Objekt
         */
        get(name, options = {}) {
            if (!this.initialized) {
                this.init();
            }

            if (!this.services.has(name)) {
                throw new Error(`Service "${name}" not found`);
            }

            const entry = this.services.get(name);
            if (!entry || (entry.visibility === 'internal' && options.includeInternal !== true)) {
                throw new Error(`Service "${name}" not found`);
            }
            return entry.service;
        },

        /**
         * Prüft, ob ein Service existiert
         * @param {string} name - Servicename
         * @returns {boolean}
         */
        has(name, options = {}) {
            if (!this.initialized) {
                this.init();
            }

            const entry = this.services.get(name);
            return !!entry && (entry.visibility === 'public' || options.includeInternal === true);
        },

        /**
         * Gibt alle Services zurück
         * @returns {array}
         */
        getAll(options = {}) {
            return Array.from(this.services.entries())
                .filter(([, entry]) => entry.visibility === 'public' || options.includeInternal === true)
                .map(([name]) => name);
        },

        unregister(name) {
            const entry = this.services.get(name);
            if (!entry) return false;
            if (entry.service && typeof entry.service.dispose === 'function') entry.service.dispose();
            this.services.delete(name);
            if (window.Core) window.Core.emit('service:unregistered', { name });
            return true;
        },

        clear(options = {}) {
            this.getAll({ includeInternal: options.includeInternal === true })
                .forEach((name) => this.unregister(name));
            if (options.reset === true) this.initialized = false;
            return true;
        }
    };

    // User Service
    const UserService = {
        name: 'user',

        /**
         * Holt einen Benutzer durch ID
         */
        async getUser(userId) {
            if (!window.DatabaseManager) {
                throw new Error('Database not available');
            }

            try {
                const user = await window.DatabaseManager.get('users', userId);
                return user;
            } catch (error) {
                console.error('Error getting user:', error);
                throw error;
            }
        },

        /**
         * Speichert einen Benutzer
         */
        async saveUser(user) {
            if (!window.DatabaseManager) {
                throw new Error('Database not available');
            }

            try {
                user.updatedAt = new Date().toISOString();
                await window.DatabaseManager.save('users', user);

                if (window.Core) {
                    window.Core.emit('user:saved', {
                        userId: user.id
                    });
                }

                return user;
            } catch (error) {
                console.error('Error saving user:', error);
                throw error;
            }
        },

        /**
         * Löscht einen Benutzer
         */
        async deleteUser(userId) {
            if (!window.DatabaseManager) {
                throw new Error('Database not available');
            }

            try {
                await window.DatabaseManager.delete('users', userId);

                if (window.Core) {
                    window.Core.emit('user:deleted', {
                        userId: userId
                    });
                }

                return true;
            } catch (error) {
                console.error('Error deleting user:', error);
                throw error;
            }
        },

        /**
         * Gibt alle Benutzer zurück
         */
        async getAllUsers() {
            if (!window.DatabaseManager) {
                throw new Error('Database not available');
            }

            try {
                const users = await window.DatabaseManager.getAll('users');
                return users;
            } catch (error) {
                console.error('Error getting all users:', error);
                throw error;
            }
        }
    };

    // Auth Service
    const AuthService = {
        name: 'auth',

        /**
         * Authentifiziert einen Benutzer
         * Compatibility-only delegation to the central CoreAuth truth.
         */
        async authenticate(userIdOrCredentials) {
            if (!window.CoreAuth || typeof window.CoreAuth.login !== 'function') {
                return null;
            }

            const result = await window.CoreAuth.login(userIdOrCredentials);
            if (!result || !result.ok) {
                return null;
            }

            return result.data && result.data.user ? result.data.user : null;
        },

        /**
         * Gibt den aktuellen Benutzer zurück
         */
        getCurrentUser() {
            if (window.CoreAuth && typeof window.CoreAuth.getCurrentUser === 'function') {
                return window.CoreAuth.getCurrentUser();
            }
            return null;
        },

        /**
         * Meldet den Benutzer ab
         */
        logout(sessionId = null) {
            if (window.CoreAuth && typeof window.CoreAuth.logout === 'function') {
                return window.CoreAuth.logout(sessionId);
            }

            if (window.Core) {
                window.Core.emit('auth:logout', {
                    userId: null,
                    timestamp: new Date().toISOString()
                });
            }

            return true;
        },

        /**
         * Prüft, ob der Benutzer authentifiziert ist
         */
        isAuthenticated() {
            if (window.CoreAuth && typeof window.CoreAuth.isAuthenticated === 'function') {
                return window.CoreAuth.isAuthenticated();
            }
            return false;
        }
    };

    // Module Service
    const ModuleService = {
        name: 'module',

        /**
         * Speichert Modul-Metadaten
         */
        async registerModule(moduleData) {
            if (!window.DatabaseManager) {
                throw new Error('Database not available');
            }

            try {
                const module = {
                    id: moduleData.id,
                    name: moduleData.name,
                    version: moduleData.version,
                    status: 'registered',
                    registeredAt: new Date().toISOString()
                };

                await window.DatabaseManager.save('modules', module);

                if (window.Core) {
                    window.Core.emit('module-service:registered', {
                        moduleId: module.id
                    });
                }

                return module;
            } catch (error) {
                console.error('Error registering module:', error);
                throw error;
            }
        },

        /**
         * Gibt alle Module zurück
         */
        async getAllModules() {
            if (!window.DatabaseManager) {
                throw new Error('Database not available');
            }

            try {
                const modules = await window.DatabaseManager.getAll('modules');
                return modules;
            } catch (error) {
                console.error('Error getting all modules:', error);
                throw error;
            }
        }
    };

    // Logging Service
    const LoggingService = {
        name: 'logging',
        maxLogs: 1000,

        /**
         * Protokolliert eine Nachricht
         */
        async log(message, level = 'info', source = 'app') {
            if (!window.DatabaseManager) {
                console.log(`[${level.toUpperCase()}] ${message}`);
                return;
            }

            try {
                const logEntry = {
                    id: `log-${Date.now()}`,
                    message: message,
                    level: level,
                    source: source,
                    timestamp: new Date().toISOString()
                };

                await window.DatabaseManager.insert('logs', logEntry);
                console.log(`[${level.toUpperCase()}] ${message}`);

                return logEntry;
            } catch (error) {
                console.error('Logging error:', error);
            }
        },

        /**
         * Protokolliert ein Info
         */
        info(message, source) {
            return this.log(message, 'info', source);
        },

        /**
         * Protokolliert eine Warnung
         */
        warn(message, source) {
            return this.log(message, 'warn', source);
        },

        /**
         * Protokolliert einen Fehler
         */
        error(message, source) {
            return this.log(message, 'error', source);
        }
    };

    // Cache Service
    const CacheService = {
        name: 'cache',
        cache: new Map(),

        /**
         * Speichert einen Wert im Cache
         */
        async set(key, value, ttl = 3600000) {
            const entry = {
                key: key,
                value: value,
                createdAt: new Date().toISOString(),
                ttl: ttl,
                expiresAt: Date.now() + ttl
            };

            this.cache.set(key, entry);

            if (window.DatabaseManager) {
                try {
                    await window.DatabaseManager.save('cache', entry);
                } catch (error) {
                    console.error('Cache save error:', error);
                }
            }
        },

        /**
         * Holt einen Wert aus dem Cache
         */
        async get(key) {
            const entry = this.cache.get(key);

            if (!entry) {
                return null;
            }

            // Prüfe TTL
            if (Date.now() > entry.expiresAt) {
                this.cache.delete(key);
                return null;
            }

            return entry.value;
        },

        /**
         * Löscht einen Cache-Eintrag
         */
        async delete(key) {
            this.cache.delete(key);

            if (window.DatabaseManager) {
                try {
                    await window.DatabaseManager.delete('cache', key);
                } catch (error) {
                    console.error('Cache delete error:', error);
                }
            }
        },

        /**
         * Löscht den gesamten Cache
         */
        async clear() {
            this.cache.clear();

            if (window.DatabaseManager) {
                try {
                    await window.DatabaseManager.clear('cache');
                } catch (error) {
                    console.error('Cache clear error:', error);
                }
            }
        }
    };

    if (!window.ServiceManager) {
        window.ServiceManager = ServiceManager;
    }
})();

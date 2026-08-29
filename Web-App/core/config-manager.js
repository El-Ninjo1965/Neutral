/*
 * Core Configuration Management
 * Version: 1.0
 *
 * Zentrale Konfigurationsverwaltung für die generische Anwendung.
 * Verwaltet Anwendungseinstellungen, Datenbank-, API- und Service-Konfigurationen.
 */

(() => {
    'use strict';

    const ConfigManager = {
        initialized: false,
        configs: new Map(),
        watchers: new Map(),

        /**
         * Initialisiert den Config-Manager
         */
        init() {
            if (this.initialized) {
                return;
            }

            this.loadDefaultConfigs();
            this.loadPersistedConfigs();

            if (typeof localStorage !== 'undefined') {
                try {
                    const raw = localStorage.getItem('neutral.local.auth.v1');
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed && typeof parsed === 'object') {
                            const current = this.get('bootstrap', {});
                            this.set('bootstrap', {
                                ...current,
                                developerUsername: parsed.username || current.developerUsername || 'Developer',
                                developerPasswordHash: parsed.passwordHash || current.developerPasswordHash || '',
                                passwordRequired: true,
                                enabled: current.enabled !== false,
                                passwordSource: 'local-offline'
                            });
                        }
                    }
                } catch (error) {
                    // Ignore malformed local bootstrap state and retain the default config.
                }
            }

            this.initialized = true;

            if (window.Core) {
                window.Core.emit('config-manager:initialized', {
                    timestamp: new Date().toISOString()
                });
            }
        },

        /**
         * Lädt Standard-Konfigurationen
         */
        loadDefaultConfigs() {
            const runtimeOrigin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null')
                ? window.location.origin
                : 'http://localhost';
            const runtimeApiBaseUrl = `${runtimeOrigin.replace(/\/+$/, '')}/api`;

            // Application Config
            this.set('app', {
                name: 'Neutral Platform',
                version: '1.0.0',
                environment: 'development',
                debug: true,
                logging: {
                    level: 'debug',
                    maxLogs: 1000
                }
            });

            // Bootstrap Config
            this.set('bootstrap', {
                enabled: true,
                developerUsername: 'Developer',
                developerDisplayId: 'USR-000001',
                createOnInit: true,
                passwordRequired: true,
                passwordSource: 'local-offline',
                developerPasswordHash: ''
            });

            this.set('connections', {
                defaultConnectionId: 'file-storage',
                activeConnectionId: 'file-storage',
                activeStorageType: 'file',
                supportedTypes: ['file', 'sqlite', 'mysql', 'postgresql'],
                connections: [{
                    connectionId: 'file-storage',
                    name: 'Text file storage',
                    type: 'file',
                    storageType: 'file',
                    status: 'active',
                    active: true,
                    default: true,
                    path: 'data',
                    description: 'Default lightweight storage for shared hosting and JSON/text file workflows.'
                }]
            });

            // Database Config
            this.set('database', {
                type: 'indexeddb',
                name: 'CoreDB',
                version: 1,
                stores: [
                    'users',
                    'modules',
                    'logs',
                    'sessions',
                    'settings',
                    'cache',
                    'sync'
                ],
                autoSync: true,
                syncInterval: 30000
            });

            // API Config
            this.set('api', {
                baseUrl: runtimeApiBaseUrl,
                timeout: 30000,
                retries: 3,
                retryDelay: 1000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Module Config
            this.set('modules', {
                autoLoad: true,
                autoActivate: true,
                loadPath: '../app/modules/',
                scriptExtension: '.js',
                errorHandling: 'continue',
                moduleTimeout: 5000
            });

            // Security Config
            this.set('security', {
                enableEncryption: false,
                sessionTimeout: 3600000, // 1 Stunde
                csrfProtection: true,
                allowCors: false,
                trustedDomains: ['localhost', '127.0.0.1']
            });

            // Performance Config
            this.set('performance', {
                cacheEnabled: true,
                cacheTTL: 3600000, // 1 Stunde
                maxCacheSize: 50,
                batchRequests: true,
                batchDelay: 100
            });

            // UI Config
            this.set('ui', {
                theme: 'neutral',
                language: (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en',
                responsive: true,
                animationsEnabled: true,
                updateInterval: 5000
            });

            // Feature Flags
            this.set('features', {
                userModule: true,
                adminModule: true,
                advancedLogging: false,
                betaFeatures: false,
                maintenanceMode: false
            });

            // Module-owned settings are stored centrally so new modules can
            // contribute editable admin configuration without custom UI code.
            this.set('moduleSettings', {});
        },

        /**
         * Setzt eine Konfiguration
         * @param {string} key - Konfigurationsschlüssel
         * @param {object} value - Konfigurationswert
         */
        set(key, value) {
            if (typeof key !== 'string' || !key.trim()) {
                throw new Error('Config key is required');
            }

            const oldValue = this.configs.get(key);
            this.configs.set(key, value);

            this.notifyWatchers(key, value, oldValue);

            if (window.Core) {
                window.Core.emit('config:changed', {
                    key: key,
                    newValue: value,
                    oldValue: oldValue
                });
            }
        },

        /**
         * Gibt eine Konfiguration zurück
         * @param {string} key - Konfigurationsschlüssel
         * @param {*} defaultValue - Standardwert
         * @returns {*} Konfigurationswert
         */
        get(key, defaultValue = undefined) {
            if (this.configs.has(key)) {
                return this.configs.get(key);
            }
            return defaultValue;
        },

        /**
         * Gibt einen verschachtelten Konfigurationswert zurück
         * @param {string} path - Pfad mit Punktnotation (z.B. 'database.type')
         * @param {*} defaultValue - Standardwert
         * @returns {*} Konfigurationswert
         */
        getPath(path, defaultValue = undefined) {
            const parts = path.split('.');
            let current = this.configs;

            for (const part of parts) {
                if (current instanceof Map) {
                    current = current.get(part);
                } else if (current && typeof current === 'object') {
                    current = current[part];
                } else {
                    return defaultValue;
                }
            }

            return current !== undefined ? current : defaultValue;
        },

        /**
         * Prüft, ob eine Konfiguration existiert
         * @param {string} key - Konfigurationsschlüssel
         * @returns {boolean} Existiert die Konfiguration
         */
        has(key) {
            return this.configs.has(key);
        },

        /**
         * Setzt einen verschachtelten Konfigurationswert
         * @param {string} path - Pfad mit Punktnotation
         * @param {*} value - Wert
         */
        setPath(path, value) {
            const parts = path.split('.');
            const key = parts[0];
            const config = this.get(key, {});

            if (parts.length === 1) {
                this.set(key, value);
                return;
            }

            let current = config;
            for (let i = 1; i < parts.length - 1; i++) {
                if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
                    current[parts[i]] = {};
                }
                current = current[parts[i]];
            }

            current[parts[parts.length - 1]] = value;
            this.set(key, config);
        },

        /**
         * Fügt einen Watcher für Konfigurationsänderungen hinzu
         * @param {string} key - Zu beobachtender Schlüssel
         * @param {function} callback - Callback-Funktion
         * @returns {function} Unsubscribe-Funktion
         */
        watch(key, callback) {
            if (typeof callback !== 'function') {
                throw new Error('Callback must be a function');
            }

            if (!this.watchers.has(key)) {
                this.watchers.set(key, []);
            }

            this.watchers.get(key).push(callback);

            // Rückgabe einer Unsubscribe-Funktion
            return () => {
                const watchers = this.watchers.get(key);
                const index = watchers.indexOf(callback);
                if (index > -1) {
                    watchers.splice(index, 1);
                }
            };
        },

        /**
         * Benachrichtigt alle Watcher bei Konfigurationsänderung
         * @param {string} key - Geänderter Schlüssel
         * @param {*} newValue - Neuer Wert
         * @param {*} oldValue - Alter Wert
         */
        notifyWatchers(key, newValue, oldValue) {
            if (!this.watchers.has(key)) {
                return;
            }

            const callbacks = this.watchers.get(key);
            callbacks.forEach(callback => {
                try {
                    callback(newValue, oldValue, key);
                } catch (error) {
                    console.error(`Error in config watcher for key "${key}":`, error);
                }
            });
        },

        /**
         * Gibt alle Konfigurationen zurück
         * @returns {object} Alle Konfigurationen
         */
        getAll() {
            const result = {};
            this.configs.forEach((value, key) => {
                result[key] = value;
            });
            return result;
        },

        /**
         * Mergt Konfigurationen
         * @param {object} newConfigs - Zu mergendo Konfigurationen
         */
        merge(newConfigs) {
            if (typeof newConfigs !== 'object') {
                throw new Error('Config must be an object');
            }

            Object.entries(newConfigs).forEach(([key, value]) => {
                if (this.configs.has(key) && typeof value === 'object' && !Array.isArray(value)) {
                    const existingConfig = this.configs.get(key);
                    this.set(key, { ...existingConfig, ...value });
                } else {
                    this.set(key, value);
                }
            });
        },

        loadPersistedConfigs() {
            Array.from(this.configs.keys()).forEach((key) => {
                this.load(key);
            });
        },

        /**
         * Speichert Konfiguration im localStorage
         * @param {string} key - Konfigurationsschlüssel
         */
        persist(key) {
            try {
                const value = this.get(key);
                localStorage.setItem(`core-config-${key}`, JSON.stringify(value));
            } catch (error) {
                console.error('Error persisting config:', error);
            }
        },

        /**
         * Lädt Konfiguration aus localStorage
         * @param {string} key - Konfigurationsschlüssel
         * @returns {boolean} Erfolgreich geladen
         */
        load(key) {
            try {
                const stored = localStorage.getItem(`core-config-${key}`);
                if (stored) {
                    const value = JSON.parse(stored);
                    this.set(key, value);
                    return true;
                }
            } catch (error) {
                console.error('Error loading config:', error);
            }
            return false;
        }
    };

    if (!window.ConfigManager) {
        window.ConfigManager = ConfigManager;
    }
})();

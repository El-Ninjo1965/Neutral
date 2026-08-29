/*
 * Core Database Layer
 * Version: 1.0
 *
 * Datenbankzugriff und -verwaltung mit IndexedDB als Standard.
 * Abstrahiert den Datenzugriff für verschiedene Datenbanktypen.
 */

(() => {
    'use strict';

    const DatabaseManager = {
        initialized: false,
        db: null,
        stores: [],
        status: 'NOT_CONFIGURED',
        lastError: null,
        config: null,

        getDefaultConfig() {
            return {
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
                ]
            };
        },

        resolveConfig(config = null) {
            const source = config && typeof config === 'object'
                ? config
                : (window.ConfigManager && typeof window.ConfigManager.get === 'function'
                    ? window.ConfigManager.get('database', {})
                    : {});
            const resolved = { ...this.getDefaultConfig(), ...(source || {}) };
            resolved.type = typeof resolved.type === 'string' && resolved.type.trim() ? resolved.type.trim().toLowerCase() : 'indexeddb';
            resolved.name = typeof resolved.name === 'string' && resolved.name.trim() ? resolved.name.trim() : 'CoreDB';
            resolved.version = Number.isFinite(Number(resolved.version)) ? Number(resolved.version) : 1;
            resolved.stores = Array.isArray(resolved.stores) && resolved.stores.length ? resolved.stores.filter(Boolean) : [...this.getDefaultConfig().stores];
            return resolved;
        },

        setStatus(status, message = '', error = null) {
            this.status = status;
            this.lastError = error || null;
            this.message = message || '';
            return this.getStatus();
        },

        getStatus() {
            const configured = !!(this.config && this.config.type && this.config.type !== 'disabled');
            return {
                ok: this.status === 'READY' || this.status === 'CONFIGURED' || this.status === 'NOT_CONFIGURED',
                status: this.status,
                configured,
                initialized: this.initialized,
                type: this.config ? this.config.type : null,
                name: this.config ? this.config.name : null,
                version: this.config ? this.config.version : null,
                stores: [...this.stores],
                message: this.message || (this.lastError ? this.lastError.message : (configured ? 'Database configured.' : 'Database not configured.')),
                lastError: this.lastError ? this.lastError.message : null
            };
        },

        isConfigured() {
            return !!(this.config && this.config.type && this.config.type !== 'disabled');
        },

        isReady() {
            return this.initialized && this.status === 'READY';
        },

        configure(config = null) {
            this.config = this.resolveConfig(config);
            this.setStatus('CONFIGURED', 'Database configuration loaded.');
            return this.getStatus();
        },

        /**
         * Initialisiert die Datenbankverbindung
         */
        init(config = null) {
            if (this.initialized) {
                return this.getStatus();
            }

            this.configure(config);

            if (!this.isConfigured()) {
                return this.setStatus('NOT_CONFIGURED', 'Database not configured.');
            }

            if (this.config.type !== 'indexeddb') {
                return this.setStatus('ERROR', `Database type not supported: ${this.config.type}`);
            }

            return this.openDatabase().then(() => {
                this.initialized = true;
                this.setStatus('READY', 'Database ready.');

                if (window.Core) {
                    window.Core.emit('database:initialized', {
                        timestamp: new Date().toISOString()
                    });
                }

                return this.getStatus();
            }).catch((error) => {
                this.initialized = false;
                this.setStatus('ERROR', error.message || 'Database initialization failed.', error);
                throw error;
            });
        },

        /**
         * Öffnet die IndexedDB-Datenbank
         * @returns {Promise}
         */
        openDatabase() {
            return new Promise((resolve, reject) => {
                if (!('indexedDB' in window)) {
                    const error = new Error('IndexedDB not available');
                    this.setStatus('ERROR', error.message, error);
                    reject(error);
                    return;
                }

                const config = this.config || this.resolveConfig();
                const dbName = config.name;
                const dbVersion = config.version;

                const request = indexedDB.open(dbName, dbVersion);

                request.onsuccess = () => {
                    this.db = request.result;
                    // Store-Liste aus tatsächlich vorhandenen Stores befüllen
                    this.stores = Array.from(this.db.objectStoreNames);
                    this.setStatus('READY', 'Database ready.');
                    resolve();
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    this.createStores(db);
                };

                request.onerror = () => {
                    const error = new Error(`Failed to open database: ${request.error}`);
                    this.setStatus('ERROR', error.message, error);
                    reject(error);
                };
            });
        },

        /**
         * Erstellt alle erforderlichen Stores
         * @param {IDBDatabase} db - Datenbankinstanz
         */
        createStores(db) {
            const storeConfigs = [
                { name: 'users', keyPath: 'id', indexes: ['email', 'role', 'active'] },
                { name: 'modules', keyPath: 'id', indexes: ['name', 'version', 'status'] },
                { name: 'logs', keyPath: 'id', indexes: ['timestamp', 'level', 'source'] },
                { name: 'sessions', keyPath: 'id', indexes: ['userId', 'createdAt', 'expiresAt'] },
                { name: 'settings', keyPath: 'key', indexes: ['category'] },
                { name: 'cache', keyPath: 'key', indexes: ['createdAt', 'ttl'] },
                { name: 'sync', keyPath: 'id', indexes: ['timestamp', 'status'] }
            ];

            storeConfigs.forEach(config => {
                if (!db.objectStoreNames.contains(config.name)) {
                    const store = db.createObjectStore(config.name, { keyPath: config.keyPath });

                    if (config.indexes && typeof store.createIndex === 'function') {
                        config.indexes.forEach(indexName => {
                            store.createIndex(indexName, indexName, { unique: false });
                        });
                    }

                    this.stores.push(config.name);
                }
            });
        },

        /**
         * Speichert ein Objekt in einem Store
         * @param {string} storeName - Name des Stores
         * @param {object} data - Zu speichernde Daten
         * @returns {Promise}
         */
        save(storeName, data) {
            return this.transaction(storeName, 'readwrite', (store) => {
                return store.put(data);
            });
        },

        /**
         * Lädt ein Objekt aus einem Store
         * @param {string} storeName - Name des Stores
         * @param {*} key - Objektschlüssel
         * @returns {Promise}
         */
        get(storeName, key) {
            return this.transaction(storeName, 'readonly', (store) => {
                return store.get(key);
            });
        },

        /**
         * Fügt ein Objekt ein
         * @param {string} storeName - Name des Stores
         * @param {object} data - Zu speichernde Daten
         * @returns {Promise}
         */
        insert(storeName, data) {
            return this.transaction(storeName, 'readwrite', (store) => {
                return store.add(data);
            });
        },

        /**
         * Aktualisiert ein Objekt
         * @param {string} storeName - Name des Stores
         * @param {object} data - Aktualisierte Daten
         * @returns {Promise}
         */
        update(storeName, data) {
            return this.transaction(storeName, 'readwrite', (store) => {
                return store.put(data);
            });
        },

        /**
         * Löscht ein Objekt
         * @param {string} storeName - Name des Stores
         * @param {*} key - Objektschlüssel
         * @returns {Promise}
         */
        delete(storeName, key) {
            return this.transaction(storeName, 'readwrite', (store) => {
                return store.delete(key);
            });
        },

        /**
         * Löscht alle Objekte aus einem Store
         * @param {string} storeName - Name des Stores
         * @returns {Promise}
         */
        clear(storeName) {
            return this.transaction(storeName, 'readwrite', (store) => {
                return store.clear();
            });
        },

        /**
         * Sucht nach Objekten in einem Store
         * @param {string} storeName - Name des Stores
         * @param {string} indexName - Name des Index
         * @param {*} value - Suchvalue
         * @returns {Promise}
         */
        findByIndex(storeName, indexName, value) {
            return this.transaction(storeName, 'readonly', (store) => {
                const index = store.index(indexName);
                return index.getAll(value);
            });
        },

        /**
         * Gibt alle Objekte aus einem Store zurück
         * @param {string} storeName - Name des Stores
         * @returns {Promise}
         */
        getAll(storeName) {
            return this.transaction(storeName, 'readonly', (store) => {
                return store.getAll();
            });
        },

        /**
         * Führt eine Transaktion durch
         * @param {string} storeName - Name des Stores
         * @param {string} mode - 'readonly' oder 'readwrite'
         * @param {function} callback - Callback mit dem Store
         * @returns {Promise}
         */
        transaction(storeName, mode, callback) {
            return new Promise((resolve, reject) => {
                if (!this.db) {
                    reject(new Error(this.isConfigured() ? 'Database not initialized' : 'Database not configured.'));
                    return;
                }

                try {
                    const tx = this.db.transaction([storeName], mode);
                    const store = tx.objectStore(storeName);

                    const request = callback(store);

                    request.onsuccess = () => {
                        resolve(request.result);
                    };

                    request.onerror = () => {
                        reject(new Error(`Database error: ${request.error}`));
                    };

                    tx.onerror = () => {
                        reject(new Error(`Transaction error: ${tx.error}`));
                    };
                } catch (error) {
                    reject(error);
                }
            });
        },

        /**
         * Gibt Datenbankstatistiken zurück
         * @returns {Promise}
         */
        async getStats() {
            const stats = {
                status: this.getStatus(),
                storeStats: {}
            };

            for (const storeName of this.stores) {
                try {
                    const count = await this.transaction(storeName, 'readonly', (store) => {
                        return store.count();
                    });

                    stats.storeStats[storeName] = {
                        count: count
                    };
                } catch (error) {
                    stats.storeStats[storeName] = { error: error.message };
                }
            }

            return stats;
        },

        /**
         * Löscht die gesamte Datenbank
         * @returns {Promise}
         */
        deleteDatabase() {
            return new Promise((resolve, reject) => {
                if (!this.db) {
                    reject(new Error(this.isConfigured() ? 'Database not initialized' : 'Database not configured.'));
                    return;
                }

                const dbName = this.db.name;
                this.db.close();

                const request = indexedDB.deleteDatabase(dbName);

                request.onsuccess = () => {
                    this.db = null;
                    this.initialized = false;
                    this.config = null;
                    this.stores = [];
                    this.setStatus('NOT_CONFIGURED', 'Database deleted.');
                    resolve();
                };

                request.onerror = () => {
                    const error = new Error(`Failed to delete database: ${request.error}`);
                    this.setStatus('ERROR', error.message, error);
                    reject(error);
                };
            });
        },

        async test(config = null) {
            return this.init(config);
        }
    };

    if (!window.DatabaseManager) {
        window.DatabaseManager = DatabaseManager;
    }
})();

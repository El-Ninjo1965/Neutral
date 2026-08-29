/*
 * Core Storage
 * Version: 1.0
 *
 * Zentrale Schnittstelle für lokale Datenspeicherung.
 * Die konkrete Datenbankimplementierung wird später ergänzt.
 */

(() => {
    'use strict';

    const STORAGE_PREFIX = 'core:';

    const CoreStorage = {
        set(key, value) {
            this.validateKey(key);

            const serializedValue = JSON.stringify(value);

            localStorage.setItem(
                `${STORAGE_PREFIX}${key}`,
                serializedValue
            );
        },

        get(key, defaultValue = null) {
            this.validateKey(key);

            const storedValue = localStorage.getItem(
                `${STORAGE_PREFIX}${key}`
            );

            if (storedValue === null) {
                return defaultValue;
            }

            try {
                return JSON.parse(storedValue);
            } catch (error) {
                if (window.ErrorLog) {
                    window.ErrorLog.record(error, {
                        type: 'storage-read',
                        key
                    });
                }

                return defaultValue;
            }
        },

        remove(key) {
            this.validateKey(key);

            localStorage.removeItem(
                `${STORAGE_PREFIX}${key}`
            );
        },

        has(key) {
            this.validateKey(key);

            return localStorage.getItem(
                `${STORAGE_PREFIX}${key}`
            ) !== null;
        },

        clear() {
            const keysToRemove = [];

            for (let index = 0; index < localStorage.length; index++) {
                const key = localStorage.key(index);

                if (key && key.startsWith(STORAGE_PREFIX)) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach((key) => {
                localStorage.removeItem(key);
            });
        },

        namespace(namespace) {
            this.validateKey(namespace);
            const prefix = `${namespace.trim()}:`;
            return Object.freeze({
                set: (key, value) => this.set(`${prefix}${key}`, value),
                get: (key, fallback = null) => this.get(`${prefix}${key}`, fallback),
                has: (key) => this.has(`${prefix}${key}`),
                remove: (key) => this.remove(`${prefix}${key}`)
            });
        },

        validateKey(key) {
            if (typeof key !== 'string' || !key.trim()) {
                throw new Error('Storage key is required.');
            }
        }
    };

    if (!window.CoreStorage) {
        window.CoreStorage = Object.freeze(CoreStorage);
    }
})();

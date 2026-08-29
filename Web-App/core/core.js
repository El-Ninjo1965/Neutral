/*
 * Core
 * Version: 1.0
 *
 * Zentrale technische Grundlage für generische Anwendungen.
 * Fachliche Funktionen werden nicht im Core implementiert.
 */

(() => {
    'use strict';

    const Core = {
        version: '1.0.0',

        state: {
            initialized: false,
            activeModule: null
        },

        init() {
            if (this.state.initialized) {
                return;
            }

            this.state.initialized = true;

            this.emit('core:initialized', {
                version: this.version
            });
        },

        getModuleRegistry() {
            return window.ModuleRegistry || null;
        },

        getModuleManager() {
            return window.ModuleManager || null;
        },

        getModules() {
            if (!window.ModuleRegistry) {
                return [];
            }

            return window.ModuleRegistry.getAll();
        },

        on(eventName, callback) {
            if (!window.CoreEventBus) {
                throw new Error('Core Event Bus is not available.');
            }

            return window.CoreEventBus.subscribe(eventName, callback);
        },

        off(eventName, callback) {
            if (!window.CoreEventBus) {
                return;
            }

            return window.CoreEventBus.unsubscribe(eventName, callback);
        },

        once(eventName, callback) {
            if (typeof callback !== 'function') {
                throw new TypeError('Event callback must be a function.');
            }

            const wrapper = (data) => {
                this.off(eventName, wrapper);
                callback(data);
            };

            return this.on(eventName, wrapper);
        },

        emit(eventName, data = null) {
            if (!window.CoreEventBus) {
                return;
            }

            return window.CoreEventBus.publish(eventName, data);
        }
    };

    window.Core = Core;

    Core.init();
})();

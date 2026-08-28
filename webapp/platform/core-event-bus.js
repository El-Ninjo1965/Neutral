/*
 * Core Event Bus
 * Version: 1.0
 *
 * Zentrale Kommunikationsschnittstelle zwischen Core und Modulen.
 * Module kommunizieren über Ereignisse und bleiben dadurch
 * voneinander entkoppelt.
 */

(() => {
    'use strict';

    const channels = new Map();

    const EventBus = {
        subscribe(eventName, callback) {
            if (typeof eventName !== 'string' || !eventName.trim()) {
                throw new Error('Event name is required.');
            }

            if (typeof callback !== 'function') {
                throw new TypeError('Event callback must be a function.');
            }

            if (!channels.has(eventName)) {
                channels.set(eventName, new Set());
            }

            channels.get(eventName).add(callback);

            return () => {
                this.unsubscribe(eventName, callback);
            };
        },

        unsubscribe(eventName, callback) {
            const listeners = channels.get(eventName);

            if (!listeners) {
                return;
            }

            listeners.delete(callback);

            if (listeners.size === 0) {
                channels.delete(eventName);
            }
        },

        publish(eventName, data = null) {
            const listeners = channels.get(eventName);

            if (!listeners) {
                return;
            }

            listeners.forEach((callback) => {
                try {
                    callback(data);
                } catch (error) {
                    if (window.CoreErrorHandler) {
                        window.CoreErrorHandler.handle(
                            error,
                            {
                                type: 'event-handler',
                                eventName
                            }
                        );
                    }
                }
            });
        },

        clear(eventName) {
            if (eventName) {
                channels.delete(eventName);
                return;
            }

            channels.clear();
        }
    };

    window.CoreEventBus =
        Object.freeze(EventBus);
})();

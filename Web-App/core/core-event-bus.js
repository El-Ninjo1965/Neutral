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
            if (typeof eventName !== 'string' || !eventName.trim()) {
                throw new Error('Event name is required.');
            }

            const listeners = channels.get(eventName);

            if (!listeners) {
                return 0;
            }

            let delivered = 0;
            [...listeners].forEach((callback) => {
                try {
                    callback(data);
                    delivered += 1;
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

            if (window.CoreEventRing && typeof window.CoreEventRing.push === 'function') {
                window.CoreEventRing.push(eventName, data);
            }

            return delivered;
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

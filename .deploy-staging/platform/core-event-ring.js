/*
 * Core Event Ring Buffer
 * Version: 1.0.0
 *
 * In-memory diagnostic ring buffer for event history.
 * It is intentionally bounded and not a persistence layer.
 */

(() => {
    'use strict';

    const MAX_ENTRIES = 256;

    const CoreEventRing = {
        initialized: false,
        buffers: new Map(),

        init() {
            if (this.initialized) {
                return this;
            }

            this.initialized = true;

            if (window.Core) {
                window.Core.emit('event-ring:initialized', {
                    timestamp: new Date().toISOString()
                });
            }

            return this;
        },

        push(namespace, payload) {
            const eventNamespace = String(namespace || 'general');
            const bucket = this.buffers.get(eventNamespace) || [];

            bucket.push({
                timestamp: new Date().toISOString(),
                payload: payload && typeof payload === 'object' ? { ...payload } : payload
            });

            if (bucket.length > MAX_ENTRIES) {
                bucket.shift();
            }

            this.buffers.set(eventNamespace, bucket);
            return bucket.slice();
        },

        get(namespace = null) {
            if (!namespace) {
                return Object.fromEntries(Array.from(this.buffers.entries()).map(([key, value]) => [key, value.slice()]));
            }

            return (this.buffers.get(namespace) || []).slice();
        },

        clear(namespace = null) {
            if (namespace) {
                this.buffers.delete(namespace);
            } else {
                this.buffers.clear();
            }
            return true;
        }
    };

    if (!window.CoreEventRing) {
        window.CoreEventRing = CoreEventRing;
    }
})();

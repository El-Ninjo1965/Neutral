/*
 * Neutral client connectivity state.
 * This service reports browser reachability only; it never claims that queued
 * data has been synchronized or that the configured API is healthy.
 */
(() => {
    'use strict';

    let initialized = false;
    let online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
    const listeners = new Set();

    const publish = (nextOnline) => {
        const previousOnline = online;
        online = !!nextOnline;
        const snapshot = CoreNetwork.getStatus();
        if (previousOnline !== online && window.Core && typeof window.Core.emit === 'function') {
            window.Core.emit('network:changed', snapshot);
        }
        listeners.forEach((listener) => listener(snapshot));
    };

    const CoreNetwork = {
        init() {
            if (initialized || typeof window === 'undefined') return this.getStatus();
            window.addEventListener('online', () => publish(true));
            window.addEventListener('offline', () => publish(false));
            initialized = true;
            return this.getStatus();
        },
        isOnline() {
            return online;
        },
        getStatus() {
            return Object.freeze({ online, status: online ? 'online' : 'offline', initialized });
        },
        subscribe(listener) {
            if (typeof listener !== 'function') throw new TypeError('Network listener must be a function.');
            listeners.add(listener);
            return () => listeners.delete(listener);
        }
    };

    window.CoreNetwork = Object.freeze(CoreNetwork);
})();

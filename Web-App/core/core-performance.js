/* Lightweight, data-free startup phase measurements. */
(() => {
    'use strict';
    const values = new Map();
    const now = () => window.performance && typeof window.performance.now === 'function'
        ? window.performance.now()
        : Date.now();
    const mark = (name) => {
        const key = String(name || '').trim();
        if (!key || values.has(key)) return values.get(key) || null;
        const timestamp = now();
        values.set(key, timestamp);
        if (window.performance && typeof window.performance.mark === 'function') {
            try { window.performance.mark(`neutral:${key}`); } catch (error) { /* compatible fallback */ }
        }
        return timestamp;
    };
    const CorePerformance = Object.freeze({
        mark,
        has: (name) => values.has(String(name || '')),
        get: (name) => values.get(String(name || '')) ?? null,
        snapshot: () => Object.freeze(Object.fromEntries(values.entries()))
    });
    window.CorePerformance = CorePerformance;
    mark('navigation-start');
    if (document.querySelector('[data-initial-shell], #authPanel, #appShell')) mark('shell-visible');
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => mark('dom-available'), { once: true });
    } else {
        mark('dom-available');
    }
})();

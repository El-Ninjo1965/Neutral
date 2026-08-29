/*
 * Error Log
 * Version: 1.0
 *
 * Zentrale Fehlererfassung des Core.
 * Fehler werden zunächst lokal im Arbeitsspeicher gesammelt.
 * Eine persistente Speicherung wird später ergänzt.
 */

(() => {
    'use strict';

    const MAX_ENTRIES = 256;
    const sensitiveKey = /password|secret|token|authorization|cookie|credential|private.?key/i;
    const sanitizeText = (value) => String(value || '')
        .replace(/(bearer\s+)[^\s]+/gi, '$1[redacted]')
        .replace(/((?:password|secret|token|credential)\s*[=:]\s*)[^\s,;]+/gi, '$1[redacted]');
    const sanitize = (value, depth = 0) => {
        if (depth > 4) return '[truncated]';
        if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitize(item, depth + 1));
        if (!value || typeof value !== 'object') return value;
        return Object.fromEntries(Object.entries(value).map(([key, nested]) => [
            key,
            sensitiveKey.test(key) ? '[redacted]' : sanitize(nested, depth + 1)
        ]));
    };

    const ErrorLog = {
        entries: [],

        record(error, context = {}) {
            const normalized = error instanceof Error ? error : new Error(String(error));
            const type = typeof context.type === 'string' && context.type ? context.type : 'runtime';
            const entry = {
                timestamp: new Date().toISOString(),
                type,
                severity: typeof context.severity === 'string' ? context.severity : 'error',
                code: typeof context.code === 'string' ? context.code : 'CORE_RUNTIME_ERROR',
                message: sanitizeText(normalized.message),
                stack: sanitizeText(normalized.stack || ''),
                context: sanitize(context)
            };

            this.entries.push(entry);
            if (this.entries.length > MAX_ENTRIES) this.entries.splice(0, this.entries.length - MAX_ENTRIES);

            return entry;
        },

        getAll() {
            return this.entries.map((entry) => ({ ...entry, context: sanitize(entry.context) }));
        },

        clear() {
            this.entries.length = 0;
        }
    };

    if (!window.ErrorLog) {
        window.ErrorLog = ErrorLog;
    }

    window.addEventListener('error', (event) => {
        ErrorLog.record(event.error || event.message, {
            type: 'window-error',
            source: event.filename || '',
            line: event.lineno || 0,
            column: event.colno || 0
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        ErrorLog.record(event.reason, {
            type: 'unhandled-rejection'
        });
    });
})();

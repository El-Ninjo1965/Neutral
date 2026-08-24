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

    const ErrorLog = {
        entries: [],

        record(error, context = {}) {
            const entry = {
                timestamp: new Date().toISOString(),
                message: error instanceof Error
                    ? error.message
                    : String(error),
                stack: error instanceof Error
                    ? error.stack || ''
                    : '',
                context
            };

            this.entries.push(entry);

            return entry;
        },

        getAll() {
            return [...this.entries];
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
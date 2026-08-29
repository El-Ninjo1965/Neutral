/*
 * Core Error Handler
 * Version: 1.0
 *
 * Zentrale Behandlung von Laufzeitfehlern.
 * Die Fehler werden an den zentralen Error Log weitergeleitet.
 */

(() => {
    'use strict';

    const CoreErrorHandler = {
        handle(error, context = {}) {
            const normalizedError =
                error instanceof Error
                    ? error
                    : new Error(String(error));

            const entry = window.ErrorLog
                ? window.ErrorLog.record(
                    normalizedError,
                    context
                )
                : null;

            if (window.Core) {
                window.Core.emit(
                    'error:handled',
                    {
                        type: entry ? entry.type : (context.type || 'runtime'),
                        code: entry ? entry.code : 'CORE_RUNTIME_ERROR',
                        context: entry ? entry.context : {},
                        entry
                    }
                );
            }

            return entry;
        }
    };

    window.CoreErrorHandler =
        Object.freeze(CoreErrorHandler);
})();

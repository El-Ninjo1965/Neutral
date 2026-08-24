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
                        error: normalizedError,
                        context,
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

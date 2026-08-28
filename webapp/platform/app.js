/*
 * Generic Application Bootstrap
 * Version: 1.0
 *
 * Generischer Anwendungseinstiegspunkt.
 * Der Core wird gestartet, ohne konkrete Fachmodule zu laden.
 */

(() => {
    'use strict';

    let systemEventsRegistered = false;

    const App = {
        version: '1.0.0',

        async start() {
            if (!window.Core) {
                throw new Error('Core is not available.');
            }

            if (!window.CoreEntry) {
                throw new Error('Core entry is not available.');
            }

            this.registerSystemEvents();
            await window.CoreEntry.start();
            window.Core.emit('app:started', {
                version: this.version
            });
            return true;
        },

        registerSystemEvents() {
            if (systemEventsRegistered || !window.Core) {
                return;
            }

            systemEventsRegistered = true;

            window.Core.on('module:registered', (event) => {
                console.info(`[Core] Module registered: ${event.id}`);
            });

            window.Core.on('module:activated', (event) => {
                console.info(`[Core] Module activated: ${event.id}`);
            });

            window.Core.on('module:deactivated', (event) => {
                console.info(`[Core] Module deactivated: ${event.id}`);
            });
        }
    };

    window.App = App;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            App.start();
        });
    } else {
        App.start();
    }
})();

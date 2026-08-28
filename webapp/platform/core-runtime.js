/*
 * Core Runtime
 * Version: 1.0
 *
 * Zentrale Laufzeitsteuerung des Core.
 */

(() => {
    'use strict';

    let running = false;

    const CoreRuntime = {
        async start() {
            if (running) {
                return true;
            }

            if (!window.CoreStartup) {
                throw new Error('Core Startup is not available.');
            }

            const started = await window.CoreStartup.start();

            if (!started) {
                return false;
            }

            const lifecycle = window.CoreLifecycle;
            if (lifecycle) {
                const phase = lifecycle.getPhase();

                if (phase === lifecycle.phases.INITIALIZING) {
                    lifecycle.setPhase(lifecycle.phases.READY);
                }

                if (lifecycle.getPhase() === lifecycle.phases.READY) {
                    lifecycle.setPhase(lifecycle.phases.RUNNING);
                }
            }

            running = true;

            window.Core.emit('runtime:started');
            return true;
        },

        stop() {
            if (!running) {
                return;
            }

            if (!window.CoreShutdown) {
                throw new Error('Core Shutdown is not available.');
            }

            window.CoreShutdown.stop();

            running = false;

            window.Core.emit('runtime:stopped');
        },

        isRunning() {
            return running;
        }
    };

    window.CoreRuntime =
        Object.freeze(CoreRuntime);
})();

/*
 * Core Shutdown
 * Version: 1.0
 *
 * Kontrolliertes Beenden der Core-Laufzeit.
 */

(() => {
    'use strict';

    let stopped = false;

    const CoreShutdown = {
        reset() {
            stopped = false;
        },

        stop() {
            if (stopped) {
                return;
            }

            if (!window.CoreLifecycle) {
                throw new Error('Core Lifecycle is not available.');
            }

            const modulesToDisable =
                window.Core
                    ? window.Core.getModules()
                    : [];

            modulesToDisable.forEach((module) => {
                const isEnabled = module && (
                    module.status === 'enabled' ||
                    module.active === true
                );

                if (!isEnabled) {
                    return;
                }

                try {
                    if (window.ModuleManager) {
                        window.ModuleManager.disable(module.id);
                    }
                } catch (error) {
                    if (window.CoreErrorHandler) {
                        window.CoreErrorHandler.handle(
                            error,
                            {
                                type: 'module-shutdown',
                                moduleId: module.id
                            }
                        );
                    }
                }
            });

            if (window.CoreLifecycle.getPhase() !== window.CoreLifecycle.phases.STOPPED) {
                window.CoreLifecycle.setPhase(
                    window.CoreLifecycle.phases.STOPPED
                );
            }

            if (window.CoreStartup && typeof window.CoreStartup.reset === 'function') {
                window.CoreStartup.reset();
            }

            if (window.Core && typeof window.Core.emit === 'function') {
                window.Core.emit('core:stopped');
            }

            stopped = true;
        }
    };

    window.CoreShutdown =
        Object.freeze(CoreShutdown);
})();

/*
 * Core Startup
 * Version: 1.0
 *
 * Kontrollierter Start des Core nach dem Laden aller
 * benötigten Core-Komponenten.
 */

(() => {
    'use strict';

    let started = false;
    let startPromise = null;

    const CoreStartup = {
        async start() {
            if (startPromise) {
                return await startPromise;
            }

            if (started) {
                return true;
            }

            startPromise = (async () => {
                if (window.CoreShutdown && typeof window.CoreShutdown.reset === 'function') {
                    window.CoreShutdown.reset();
                }

                try {
                    const requiredComponents = [
                        'Core',
                        'CoreLoader',
                        'CoreContext',
                        'CoreConfig',
                        'CoreLifecycle',
                        'ModuleRegistry',
                        'ModuleManager'
                    ];

                    const missingComponents = requiredComponents.filter(
                        (component) => !window[component]
                    );

                    if (missingComponents.length > 0) {
                        throw new Error(
                            `Missing Core components: ${missingComponents.join(', ')}`
                        );
                    }

                    window.CoreLifecycle.setPhase(
                        window.CoreLifecycle.phases.INITIALIZING
                    );

                    if (!window.CoreLoader.init()) {
                        throw new Error('Core Loader initialization failed.');
                    }

                    if (window.ConfigManager && typeof window.ConfigManager.init === 'function') {
                        window.ConfigManager.init();
                    }

                    if (window.DatabaseManager && typeof window.DatabaseManager.init === 'function') {
                        await window.DatabaseManager.init();
                    }

                    if (window.CoreAuth && typeof window.CoreAuth.init === 'function') {
                        window.CoreAuth.init();
                    }

                    if (window.CoreAccess && typeof window.CoreAccess.init === 'function') {
                        window.CoreAccess.init();
                    }

                    if (window.CoreAudit && typeof window.CoreAudit.init === 'function') {
                        window.CoreAudit.init();
                    }

                    if (window.CoreEventRing && typeof window.CoreEventRing.init === 'function') {
                        window.CoreEventRing.init();
                    }

                    if (window.ServiceManager && typeof window.ServiceManager.init === 'function') {
                        window.ServiceManager.init();
                    }

                    if (window.UserModule && typeof window.UserModule.init === 'function') {
                        window.UserModule.init();
                    }

                    if (window.AdminModule && typeof window.AdminModule.init === 'function') {
                        window.AdminModule.init();
                    }

                    if (window.I18nModule && typeof window.I18nModule.init === 'function') {
                        window.I18nModule.init();
                    }

                    if (window.ModuleManager && typeof window.ModuleManager.discoverModules === 'function') {
                        await window.ModuleManager.discoverModules();
                    }

                    if (window.MasterFramework && typeof window.MasterFramework.markFrameworkInitialized === 'function') {
                        window.MasterFramework.markFrameworkInitialized({
                            currentStep: 'runtime',
                            message: 'Framework initialized by browser runtime.'
                        });
                    }

                    window.CoreContext.setRuntimeValue(
                        'initialized',
                        true
                    );

                    window.CoreContext.setRuntimeValue(
                        'startedAt',
                        new Date().toISOString()
                    );

                    if (window.CoreLifecycle.getPhase() !== window.CoreLifecycle.phases.RUNNING) {
                        window.CoreLifecycle.setPhase(
                            window.CoreLifecycle.phases.READY
                        );
                    }

                    started = true;

                    window.Core.emit('core:started', {
                        version: window.CoreConfig.core.version
                    });

                    return true;
                } catch (error) {
                    started = false;
                    throw error;
                } finally {
                    startPromise = null;
                }
            })();

            return await startPromise;
        },

        reset() {
            started = false;
            startPromise = null;
        }
    };

    if (!window.CoreStartup) {
        window.CoreStartup =
            Object.freeze(CoreStartup);
    }
})();

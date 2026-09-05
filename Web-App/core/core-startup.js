/* Two-stage Core startup: interactive minimum first, slow local work later. */
(() => {
    'use strict';
    let started = false;
    let startPromise = null;
    let backgroundPromise = null;
    let backgroundComplete = false;

    const mark = (name) => {
        if (window.CorePerformance) window.CorePerformance.mark(name);
    };
    const reportPhaseError = (phase, error) => {
        if (window.CoreErrorHandler) window.CoreErrorHandler.handle(error, { type: 'startup-phase', phase });
        if (window.Core) window.Core.emit('startup:phase-error', { phase, message: error && error.message ? error.message : String(error) });
    };

    const CoreStartup = {
        async start() {
            if (started) return true;
            if (startPromise) return startPromise;
            mark('core-startup-start'); // TEMPORARY diagnostic mark (local-only, no PII) — see WORKFLOW.md
            startPromise = Promise.resolve().then(() => {
                if (window.CoreShutdown && typeof window.CoreShutdown.reset === 'function') window.CoreShutdown.reset();
                const required = ['Core', 'CoreLoader', 'CoreContext', 'CoreConfig', 'CoreLifecycle', 'ModuleRegistry', 'ModuleManager'];
                const missing = required.filter((name) => !window[name]);
                if (missing.length) throw new Error(`Missing Core components: ${missing.join(', ')}`);
                window.CoreLifecycle.setPhase(window.CoreLifecycle.phases.INITIALIZING);
                if (!window.CoreLoader.init()) throw new Error('Core Loader initialization failed.');
                if (window.ConfigManager && typeof window.ConfigManager.init === 'function') window.ConfigManager.init();
                if (window.CoreNetwork && typeof window.CoreNetwork.init === 'function') window.CoreNetwork.init();
                if (window.CoreLifecycle.getPhase() === window.CoreLifecycle.phases.INITIALIZING) {
                    window.CoreLifecycle.setPhase(window.CoreLifecycle.phases.READY);
                }
                started = true;
                mark('minimal-core-ready');
                mark('core-startup-end'); // TEMPORARY diagnostic mark
                window.Core.emit('core:started', { version: window.CoreConfig.core.version, backgroundComplete: false });
                return true;
            }).catch((error) => {
                started = false;
                throw error;
            }).finally(() => { startPromise = null; });
            return startPromise;
        },

        startBackground() {
            if (backgroundPromise) return backgroundPromise;
            if (backgroundComplete) return Promise.resolve(true);
            mark('start-background-start'); // TEMPORARY diagnostic mark
            backgroundPromise = this.start().then(async () => {
                try {
                    mark('database-manager-init-start'); // TEMPORARY diagnostic mark
                    if (window.DatabaseManager && typeof window.DatabaseManager.init === 'function') await window.DatabaseManager.init();
                    mark('database-manager-init-end'); // TEMPORARY diagnostic mark
                    mark('storage-ready');
                    window.Core.emit('startup:storage-ready');
                } catch (error) {
                    reportPhaseError('storage', error);
                    mark('database-manager-init-end'); // TEMPORARY diagnostic mark
                    mark('storage-ready');
                }

                for (const [name, phase] of [
                    ['CoreAuth', 'auth-client'], ['CoreAccess', 'access'], ['CoreAudit', 'audit'],
                    ['CoreEventRing', 'diagnostics'], ['ServiceManager', 'services'],
                    ['UserModule', 'user'], ['AdminModule', 'admin'], ['I18nModule', 'i18n']
                ]) {
                    try {
                        mark(`framework-init-${phase}-start`); // TEMPORARY diagnostic mark
                        if (window[name] && typeof window[name].init === 'function') window[name].init();
                        mark(`framework-init-${phase}-end`); // TEMPORARY diagnostic mark
                    } catch (error) {
                        reportPhaseError(phase, error);
                        mark(`framework-init-${phase}-end`); // TEMPORARY diagnostic mark
                    }
                }

                try {
                    mark('module-manager-discover-start'); // TEMPORARY diagnostic mark
                    if (window.ModuleManager && typeof window.ModuleManager.discoverModules === 'function') {
                        await window.ModuleManager.discoverModules();
                    }
                    mark('module-manager-discover-end'); // TEMPORARY diagnostic mark
                    mark('module-discovery-complete');
                    window.Core.emit('startup:modules-ready');
                } catch (error) {
                    reportPhaseError('module-discovery', error);
                    mark('module-manager-discover-end'); // TEMPORARY diagnostic mark
                    mark('module-discovery-complete');
                    window.Core.emit('startup:modules-error', {
                        message: error && error.message ? error.message : String(error)
                    });
                }

                if (window.MasterFramework && typeof window.MasterFramework.markFrameworkInitialized === 'function') {
                    window.MasterFramework.markFrameworkInitialized({ currentStep: 'runtime', message: 'Framework initialized by browser runtime.' });
                }
                window.CoreContext.setRuntimeValue('initialized', true);
                window.CoreContext.setRuntimeValue('startedAt', new Date().toISOString());
                if (window.CoreLifecycle.getPhase() === window.CoreLifecycle.phases.READY) {
                    window.CoreLifecycle.setPhase(window.CoreLifecycle.phases.RUNNING);
                }
                backgroundComplete = true;
                mark('background-initialization-complete');
                mark('start-background-end'); // TEMPORARY diagnostic mark
                window.Core.emit('core:background-ready');
                return true;
            }).finally(() => { backgroundPromise = null; });
            return backgroundPromise;
        },

        getStatus() { return Object.freeze({ started, backgroundComplete, backgroundRunning: !!backgroundPromise }); },
        reset() { started = false; startPromise = null; backgroundPromise = null; backgroundComplete = false; }
    };
    if (!window.CoreStartup) window.CoreStartup = Object.freeze(CoreStartup);
})();

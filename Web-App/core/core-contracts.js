/*
 * Versioned public contracts for the neutral browser core.
 * Implementation globals not listed here are internal compatibility details.
 */
(() => {
    'use strict';

    const freezeList = (values) => Object.freeze([...values]);
    const events = Object.freeze({
        CORE_INITIALIZED: 'core:initialized',
        CORE_STARTED: 'core:started',
        CORE_STOPPED: 'core:stopped',
        LIFECYCLE_CHANGED: 'lifecycle:changed',
        NETWORK_CHANGED: 'network:changed',
        DATABASE_INITIALIZED: 'database:initialized',
        ERROR_HANDLED: 'error:handled',
        SERVICE_REGISTERED: 'service:registered',
        SERVICE_UNREGISTERED: 'service:unregistered',
        MODULE_REGISTERED: 'module:registered',
        MODULE_INSTALLED: 'module:installed',
        MODULE_ACTIVATED: 'module:activated',
        MODULE_DEACTIVATED: 'module:deactivated',
        MODULE_UPDATED: 'module:updated',
        MODULE_UNINSTALLED: 'module:uninstalled'
    });

    const contracts = Object.freeze({
        version: '1.0.0',
        events,
        publicFacades: freezeList([
            'Core', 'CoreContracts', 'CoreLifecycle', 'CoreNetwork', 'CoreStorage',
            'ConfigManager', 'DatabaseManager', 'ServiceManager', 'CoreErrorHandler',
            'ModuleManager', 'ModuleRegistry', 'ApiClient'
        ]),
        internalGlobals: freezeList([
            'CoreEventBus', 'CoreEventRing', 'CoreLoader', 'CoreState',
            'MasterFramework', 'ErrorLog'
        ]),
        serviceVisibility: Object.freeze({ PUBLIC: 'public', INTERNAL: 'internal' }),
        naming: Object.freeze({
            moduleEventPrefix: 'module:',
            moduleServicePrefix: 'module.'
        })
    });

    window.CoreContracts = contracts;

    if (window.Core) {
        Object.defineProperties(window.Core, {
            contractVersion: { value: contracts.version, enumerable: true },
            events: { value: events, enumerable: true },
            getContract: { value: () => contracts, enumerable: true },
            isPublicFacade: {
                value: (name) => contracts.publicFacades.includes(String(name || '')),
                enumerable: true
            }
        });
    }
})();

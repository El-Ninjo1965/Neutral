'use strict';

// Build-shipped, secret-free bootstrap projection. Server reconciliation may
// replace this projection in localStorage after an administrative lifecycle
// change; it never grants access to a server endpoint.
globalThis.NeutralPublicOfflineModules = Object.freeze({
  schemaVersion: 1,
  modules: Object.freeze([Object.freeze({
    id: 'gps',
    name: 'GPS',
    displayName: 'GPS',
    version: '1.0.0',
    type: 'module',
    entry: 'index.js',
    modulePath: 'Web-App/app/modules/gps',
    globalName: 'GpsModule',
    presentation: Object.freeze({ userNavigation: true, adminNavigation: true, system: false }),
    publicOffline: true,
    registered: true,
    active: true,
    enabled: true,
    status: 'active',
    lifecycleState: 'ACTIVE'
  })])
});

'use strict';

const NeutralProfileModule = Object.freeze({
  id: 'profile',
  name: 'Profile',
  version: '1.0.0',
  capabilities: Object.freeze(['profile', 'settings.profile']),
  dependencies: Object.freeze([]),
  optionalDependencies: Object.freeze(['media', 'sharing']),
  presentation: Object.freeze({ userNavigation: false, adminNavigation: false, system: true })
});

if (typeof window !== 'undefined') window.NeutralProfileModule = NeutralProfileModule;
if (typeof module !== 'undefined' && module.exports) module.exports = NeutralProfileModule;

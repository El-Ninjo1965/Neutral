'use strict';
const NeutralPostboxModule = Object.freeze({ id: 'postbox', system: true });
if (typeof window !== 'undefined') window.NeutralPostboxModule = NeutralPostboxModule;
if (typeof module !== 'undefined') module.exports = NeutralPostboxModule;

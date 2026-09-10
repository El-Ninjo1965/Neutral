'use strict';
const NeutralMediaModule = Object.freeze({ id: 'media', system: true });
if (typeof window !== 'undefined') window.NeutralMediaModule = NeutralMediaModule;
if (typeof module !== 'undefined') module.exports = NeutralMediaModule;

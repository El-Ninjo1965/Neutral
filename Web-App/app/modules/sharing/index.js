'use strict';
const NeutralSharingModule = Object.freeze({ id: 'sharing', system: true });
if (typeof window !== 'undefined') window.NeutralSharingModule = NeutralSharingModule;
if (typeof module !== 'undefined') module.exports = NeutralSharingModule;

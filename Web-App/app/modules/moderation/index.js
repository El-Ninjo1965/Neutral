'use strict';
const NeutralModerationModule = Object.freeze({ id: 'moderation', system: true });
if (typeof window !== 'undefined') window.NeutralModerationModule = NeutralModerationModule;
if (typeof module !== 'undefined') module.exports = NeutralModerationModule;

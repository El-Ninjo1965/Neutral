'use strict';
const NeutralNotificationsModule = Object.freeze({ id: 'notifications', system: true });
if (typeof window !== 'undefined') window.NeutralNotificationsModule = NeutralNotificationsModule;
if (typeof module !== 'undefined') module.exports = NeutralNotificationsModule;

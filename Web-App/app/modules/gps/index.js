/*
 * GPS Tracker Module
 * Version: 1.0.0
 *
 * Geolocation module for the platform.
 * Provides geolocation access, CoreEventBus integration,
 * CoreStorage / DatabaseManager persistence, CoreAudit recording
 * and a full ModuleInterface lifecycle.
 *
 * This module is the reference module for lifecycle, permission and
 * standalone validation inside the Neutral framework.
 */

(() => {
    'use strict';

    const coreFacade = (name) => window.Core && typeof window.Core.getFacade === 'function'
        ? window.Core.getFacade(name)
        : window[name] || null;

    // ── Internal state ────────────────────────────────────────────────────────

    let watchId = null;
    let tracking = false;
    let status = 'available'; // available | installed | enabled | disabled
    let permissionState = 'unknown'; // unknown | granted | prompt | denied | unsupported
    let lastError = null;
    let lastPosition = null;
    // Bounded diagnostic state. Coordinates and personal data are never recorded here.
    const diagnostics = {
        secureContext: typeof window !== 'undefined' && window.isSecureContext === true,
        geolocationAvailable: false,
        permissionsApiAvailable: false,
        permissionState: 'unknown',
        getCurrentPositionCalled: false,
        lastOutcome: null,
        lastErrorCode: null
    };
    const defaultSettings = Object.freeze({
        enableHighAccuracy: true,
        timeoutMs: 10000,
        maximumAgeMs: 0,
        persistLocationHistory: true,
        autoRequestOnOpen: false
    });
    const permissionDefinitions = Object.freeze([
        {
            key: 'gps.view',
            description: 'Allows a user to see the GPS module in the workspace.',
            defaultRoles: ['admin', 'developer', 'user']
        },
        {
            key: 'gps.use',
            description: 'Allows a user to request positions and start GPS tracking.',
            defaultRoles: ['admin', 'developer', 'user']
        },
        {
            key: 'gps.manage',
            description: 'Allows a user to manage GPS-related module settings.',
            defaultRoles: ['admin', 'developer']
        },
        {
            key: 'gps.admin',
            description: 'Allows a user to administer the GPS module lifecycle and role assignments.',
            defaultRoles: ['admin', 'developer']
        }
    ]);
    const access = Object.freeze({
        visibilityPermissions: ['gps.view'],
        usagePermissions: ['gps.use'],
        managementPermissions: ['gps.manage'],
        adminPermissions: ['gps.admin']
    });
    const standalone = Object.freeze({
        entry: 'index.html',
        label: 'GPS standalone test',
        description: 'Loads the GPS module with lightweight local shims for UI and browser geolocation checks without the full application shell.',
        requires: {
            server: false,
            database: false,
            auth: false
        }
    });

    // ── Helpers ───────────────────────────────────────────────────────────────

    const emit = (event, data) => {
        if (window.CoreEventBus && typeof window.CoreEventBus.emit === 'function') {
            window.CoreEventBus.emit(event, data);
        }
    };

    const audit = (action, detail = {}) => {
        if (window.CoreAudit && typeof window.CoreAudit.record === 'function') {
            window.CoreAudit.record(action, detail);
        }
    };

    const hasGeolocation = () => typeof navigator !== 'undefined' && !!navigator.geolocation;

    const getGeolocation = () => (hasGeolocation() ? navigator.geolocation : null);

    const syncDiagnostics = () => {
        diagnostics.secureContext = typeof window !== 'undefined' && window.isSecureContext === true;
        diagnostics.geolocationAvailable = hasGeolocation();
        diagnostics.permissionsApiAvailable = typeof navigator !== 'undefined'
            && !!navigator.permissions
            && typeof navigator.permissions.query === 'function';
        diagnostics.permissionState = permissionState;
    };

    const getCurrentUser = () => {
        if (window.UserModule && typeof window.UserModule.getCurrentUser === 'function') {
            const user = window.UserModule.getCurrentUser();
            if (user) {
                return user;
            }
        }

        if (window.CoreAuth && typeof window.CoreAuth.getCurrentUser === 'function') {
            return window.CoreAuth.getCurrentUser();
        }

        return null;
    };

    const hasAuthContext = () => (
        (window.UserModule && typeof window.UserModule.getCurrentUser === 'function')
        || (window.CoreAuth && typeof window.CoreAuth.getCurrentUser === 'function')
    );

    const hasPermission = (permission) => {
        const user = getCurrentUser();
        if (!hasAuthContext()) {
            return true;
        }
        if (!permission) {
            return false;
        }

        if (!user) {
            const clientAccess = GpsModule.clientAccess;
            if (!clientAccess || clientAccess.mode !== 'anonymous') {
                return false;
            }
            if (access.visibilityPermissions.includes(permission)) {
                return clientAccess.canView === true;
            }
            if (access.usagePermissions.includes(permission)) {
                return clientAccess.canUse === true;
            }
            return false;
        }

        if (window.CoreAccess && typeof window.CoreAccess.hasPermission === 'function') {
            return !!window.CoreAccess.hasPermission(user, permission);
        }

        return Array.isArray(user.permissions) && user.permissions.includes(permission);
    };

    const hasAnyPermission = (permissions) => {
        if (!Array.isArray(permissions) || permissions.length === 0) {
            return true;
        }

        return permissions.some((permission) => hasPermission(permission));
    };

    const canUseModule = () => hasAnyPermission(access.usagePermissions);

    const readSettings = () => {
        const configManager = coreFacade('ConfigManager');
        const configured = configManager && typeof configManager.getModule === 'function'
            ? configManager.getModule('gps', {})
            : configManager && typeof configManager.getPath === 'function'
                ? configManager.getPath('moduleSettings.gps', {})
            : {};

        return {
            ...defaultSettings,
            ...(configured && typeof configured === 'object' ? configured : {})
        };
    };

    const getGeolocationOptions = () => {
        const settings = readSettings();
        return {
            enableHighAccuracy: settings.enableHighAccuracy !== false,
            timeout: Number.isFinite(Number(settings.timeoutMs)) ? Number(settings.timeoutMs) : defaultSettings.timeoutMs,
            maximumAge: Number.isFinite(Number(settings.maximumAgeMs)) ? Number(settings.maximumAgeMs) : defaultSettings.maximumAgeMs
        };
    };

    const persistPosition = (position) => {
        const coords = position && position.coords ? position.coords : {};
        const record = {
            id: `gps-${Date.now()}`,
            latitude: coords.latitude,
            longitude: coords.longitude,
            lat: coords.latitude,
            lng: coords.longitude,
            accuracy: coords.accuracy,
            altitude: coords.altitude,
            speed: coords.speed,
            heading: coords.heading,
            timestamp: new Date(position.timestamp || Date.now()).toISOString()
        };
        const settings = readSettings();

        const database = coreFacade('DatabaseManager');
        if (settings.persistLocationHistory && database && typeof database.save === 'function') {
            database.save('sync', record).catch(() => {
                // Fallback is intentionally silent.
            });
        }

        const storage = coreFacade('CoreStorage');
        if (settings.persistLocationHistory && storage && typeof storage.set === 'function') {
            storage.set('gps:lastPosition', record);
        }

        return record;
    };

    const normalizeError = (error) => {
        const code = error && typeof error.code === 'number' ? error.code : null;
        const normalized = {
            code: 'UNKNOWN_ERROR',
            message: error && error.message ? error.message : 'An unknown GPS error occurred.'
        };

        if (code === 1) {
            normalized.code = 'PERMISSION_DENIED';
            permissionState = 'denied';
        } else if (code === 2) {
            normalized.code = 'POSITION_UNAVAILABLE';
        } else if (code === 3) {
            normalized.code = 'TIMEOUT';
        }

        lastError = normalized;
        return normalized;
    };

    const refreshPermissionState = async () => {
        syncDiagnostics();
        if (typeof navigator === 'undefined' || !navigator.permissions || typeof navigator.permissions.query !== 'function') {
            // The Permissions API is optional. Geolocation itself stays fully usable.
            if (permissionState === 'unknown' || permissionState === 'unsupported') {
                permissionState = hasGeolocation() ? 'prompt' : 'unsupported';
            }
            syncDiagnostics();
            return permissionState;
        }

        try {
            const result = navigator.permissions.query({ name: 'geolocation' });
            const permission = result && typeof result.then === 'function' ? await result : result;
            const state = permission && typeof permission.state === 'string' ? permission.state : 'unknown';
            if (state === 'granted' || state === 'denied' || state === 'prompt') {
                permissionState = state;
            }
            syncDiagnostics();
            return permissionState;
        } catch (error) {
            if (permissionState === 'unknown' || permissionState === 'unsupported') {
                permissionState = hasGeolocation() ? 'prompt' : 'unsupported';
            }
            syncDiagnostics();
            return permissionState;
        }
    };

    // ── Geolocation handlers ──────────────────────────────────────────────────

    const onPosition = (position) => {
        const record = persistPosition(position);
        lastPosition = record;
        GpsModule.lastPosition = record;
        lastError = null;
        emit('gps:position', record);
    };

    const onError = (error) => {
        const detail = normalizeError(error);
        emit('gps:error', detail);
        audit('gps:error', detail);
    };

    // ── Public API ────────────────────────────────────────────────────────────

    const GpsModule = {
        id: 'gps',
        name: 'GPS',
        displayName: 'GPS',
        version: '1.0.0',
        description: 'Geolocation module.',
        permissions: permissionDefinitions.map((entry) => entry.key),
        permissionDefinitions,
        access,
        standalone,
        database: { tables: [] },
        capabilities: ['gps', 'geolocation'],
        admin: {
            title: 'GPS settings',
            description: 'Controls for browser geolocation behaviour and local GPS data handling.',
            settings: [
                {
                    key: 'enableHighAccuracy',
                    path: 'moduleSettings.gps.enableHighAccuracy',
                    label: 'Enable high accuracy',
                    type: 'boolean',
                    defaultValue: true,
                    description: 'Ask the browser for the most precise available position.'
                },
                {
                    key: 'timeoutMs',
                    path: 'moduleSettings.gps.timeoutMs',
                    label: 'Location timeout (ms)',
                    type: 'number',
                    defaultValue: 10000,
                    min: 1000,
                    step: 500,
                    description: 'Maximum time the module waits for a geolocation response.'
                },
                {
                    key: 'maximumAgeMs',
                    path: 'moduleSettings.gps.maximumAgeMs',
                    label: 'Cached position age (ms)',
                    type: 'number',
                    defaultValue: 0,
                    min: 0,
                    step: 1000,
                    description: 'How old a cached GPS position may be before the browser must refresh it.'
                },
                {
                    key: 'persistLocationHistory',
                    path: 'moduleSettings.gps.persistLocationHistory',
                    label: 'Persist location history',
                    type: 'boolean',
                    defaultValue: true,
                    description: 'Store GPS positions in the local framework storage for later reuse.'
                },
                {
                    key: 'autoRequestOnOpen',
                    path: 'moduleSettings.gps.autoRequestOnOpen',
                    label: 'Position beim Öffnen automatisch ermitteln',
                    type: 'boolean',
                    defaultValue: false,
                    description: 'Beim Öffnen automatisch einmal die aktuelle Position ermitteln, sofern der Browser das erlaubt.'
                }
            ]
        },
        status: 'available',
        active: false,

        // ── Lifecycle ─────────────────────────────────────────────────────────

        install() {
            status = 'installed';
            this.status = status;
            audit('gps:install', { moduleId: this.id });
            emit('gps:installed', { moduleId: this.id });
            return { ok: true, status };
        },

        initialize() {
            if (!hasGeolocation()) {
                permissionState = 'unsupported';
                return { ok: false, code: 'GEOLOCATION_UNAVAILABLE', status };
            }

            refreshPermissionState().catch(() => {});
            audit('gps:initialize', { moduleId: this.id });
            emit('gps:initialized', { moduleId: this.id, permissionState });
            return { ok: true, status, permissionState };
        },

        enable() {
            status = 'enabled';
            this.status = status;
            this.active = true;
            tracking = false;
            if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation && typeof navigator.geolocation.clearWatch === 'function') {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }
            audit('gps:enable', { moduleId: this.id });
            emit('gps:enabled', { moduleId: this.id, permissionState, tracking: false });
            return { ok: true, status, tracking: false, permissionState };
        },

        disable() {
            this.stopTracking();
            status = 'disabled';
            this.status = status;
            this.active = false;
            audit('gps:disable', { moduleId: this.id });
            emit('gps:disabled', { moduleId: this.id });
            return { ok: true, status };
        },

        uninstall() {
            this.stopTracking();
            status = 'available';
            this.status = status;
            this.active = false;
            permissionState = 'unknown';
            lastError = null;
            lastPosition = null;
            audit('gps:uninstall', { moduleId: this.id });
            emit('gps:uninstalled', { moduleId: this.id });
            return { ok: true, status };
        },

        getStatus() {
            return status;
        },

        getPermissionState() {
            return permissionState;
        },

        getRuntimeState() {
            return {
                status,
                active: this.active,
                tracking,
                permissionState,
                lastError: lastError ? { ...lastError } : null,
                lastPosition: lastPosition ? { ...lastPosition } : null
            };
        },

        // ── Tracking ──────────────────────────────────────────────────────────

        startTracking() {
            if (tracking) {
                return { ok: false, code: 'ALREADY_TRACKING' };
            }

            if (!canUseModule()) {
                return { ok: false, code: 'INSUFFICIENT_PERMISSIONS' };
            }

            if (status !== 'enabled' || !this.active) {
                return { ok: false, code: 'MODULE_NOT_ENABLED', status };
            }

            const geolocation = getGeolocation();
            if (!geolocation) {
                return { ok: false, code: 'GEOLOCATION_UNAVAILABLE' };
            }

            refreshPermissionState().catch(() => {});
            if (permissionState === 'denied') {
                const detail = { code: 'PERMISSION_DENIED', message: 'Standort nicht verfügbar. Bitte Standortzugriff aktivieren.' };
                lastError = detail;
                emit('gps:error', detail);
                audit('gps:error', detail);
                return { ok: false, code: 'PERMISSION_DENIED', message: detail.message };
            }

            if (permissionState === 'prompt' || permissionState === 'unknown') {
                return { ok: false, code: 'USER_CONFIRMATION_REQUIRED', message: 'Aktuelle Position ermitteln?' };
            }

            try {
                watchId = geolocation.watchPosition(
                    onPosition,
                    onError,
                    getGeolocationOptions()
                );
            } catch (error) {
                const detail = normalizeError(error);
                emit('gps:error', detail);
                audit('gps:error', detail);
                return { ok: false, code: detail.code, message: detail.message };
            }

            tracking = true;
            permissionState = permissionState === 'unknown' ? 'prompt' : permissionState;
            audit('gps:startTracking', { watchId });
            emit('gps:trackingStarted', { watchId });
            return { ok: true, watchId };
        },

        stopTracking() {
            if (!tracking || watchId === null) {
                return { ok: false, code: 'NOT_TRACKING' };
            }

            const geolocation = getGeolocation();
            if (geolocation && typeof geolocation.clearWatch === 'function') {
                geolocation.clearWatch(watchId);
            }

            tracking = false;
            watchId = null;
            audit('gps:stopTracking', {});
            emit('gps:trackingStopped', {});
            return { ok: true };
        },

        isTracking() {
            return tracking;
        },

        // ── One-shot position ─────────────────────────────────────────────────

        getCurrentPosition() {
            return new Promise(async (resolve, reject) => {
                if (!canUseModule()) {
                    reject(Object.assign(new Error('GPS usage is not permitted for the current user.'), { code: 'INSUFFICIENT_PERMISSIONS' }));
                    return;
                }

                if (status !== 'enabled' || !this.active) {
                    reject(Object.assign(new Error('GPS module is not active.'), { code: 'MODULE_NOT_ENABLED' }));
                    return;
                }

                const geolocation = getGeolocation();
                if (!geolocation) {
                    syncDiagnostics();
                    reject(Object.assign(new Error('Geolocation API not available.'), { code: 'GEOLOCATION_UNAVAILABLE' }));
                    return;
                }

                try {
                    await refreshPermissionState();
                } catch (error) {
                    // Continue with the direct browser call and surface the actual geolocation error.
                }

                // The Permissions API result is informational only. It must never block
                // the standardized geolocation call; the browser enforces its own
                // permission model and reports code 1 through the error callback.
                diagnostics.getCurrentPositionCalled = true;
                syncDiagnostics();
                geolocation.getCurrentPosition(
                    (position) => {
                        const record = persistPosition(position);
                        lastPosition = record;
                        this.lastPosition = record;
                        lastError = null;
                        permissionState = 'granted';
                        diagnostics.lastOutcome = 'success';
                        diagnostics.lastErrorCode = null;
                        syncDiagnostics();
                        emit('gps:position', record);
                        resolve(record);
                    },
                    (error) => {
                        const detail = normalizeError(error);
                        diagnostics.lastOutcome = 'error';
                        diagnostics.lastErrorCode = detail.code;
                        syncDiagnostics();
                        onError(error);
                        reject(Object.assign(new Error(detail.message), { code: detail.code }));
                    },
                    getGeolocationOptions()
                );
            });
        },

        requestCurrentPositionWithConsent() {
            if (!canUseModule()) {
                return { ok: false, code: 'INSUFFICIENT_PERMISSIONS' };
            }

            if (status !== 'enabled' || !this.active) {
                return { ok: false, code: 'MODULE_NOT_ENABLED' };
            }

            if (!hasGeolocation()) {
                return { ok: false, code: 'GEOLOCATION_UNAVAILABLE' };
            }

            if (permissionState === 'denied') {
                return { ok: false, code: 'PERMISSION_DENIED', message: 'Standort nicht verfügbar. Bitte Standortzugriff aktivieren.' };
            }

            if (permissionState === 'granted') {
                return { ok: true, code: 'READY' };
            }

            return { ok: false, code: 'USER_CONFIRMATION_REQUIRED', message: 'Aktuelle Position ermitteln?' };
        },

        confirmLocationRequest(confirmed) {
            if (confirmed !== true) {
                permissionState = 'denied';
                return { ok: false, code: 'USER_DECLINED', message: 'User declined the location request.' };
            }

            if (!canUseModule()) {
                return Promise.reject(Object.assign(new Error('GPS usage is not permitted for the current user.'), { code: 'INSUFFICIENT_PERMISSIONS' }));
            }

            if (status !== 'enabled' || !this.active) {
                return Promise.reject(Object.assign(new Error('GPS module is not active.'), { code: 'MODULE_NOT_ENABLED' }));
            }

            const geolocation = getGeolocation();
            if (!geolocation) {
                return Promise.reject(Object.assign(new Error('Geolocation API not available.'), { code: 'GEOLOCATION_UNAVAILABLE' }));
            }

            permissionState = 'granted';
            return new Promise((resolve, reject) => {
                diagnostics.getCurrentPositionCalled = true;
                syncDiagnostics();
                geolocation.getCurrentPosition(
                    (position) => {
                        const record = persistPosition(position);
                        lastPosition = record;
                        this.lastPosition = record;
                        lastError = null;
                        diagnostics.lastOutcome = 'success';
                        diagnostics.lastErrorCode = null;
                        syncDiagnostics();
                        emit('gps:position', record);
                        resolve(record);
                    },
                    (error) => {
                        const detail = normalizeError(error);
                        diagnostics.lastOutcome = 'error';
                        diagnostics.lastErrorCode = detail.code;
                        syncDiagnostics();
                        onError(error);
                        reject(Object.assign(new Error(detail.message), { code: detail.code }));
                    },
                    getGeolocationOptions()
                );
            });
        },

        getDiagnostics() {
            syncDiagnostics();
            return {
                secureContext: diagnostics.secureContext,
                geolocationAvailable: diagnostics.geolocationAvailable,
                permissionsApiAvailable: diagnostics.permissionsApiAvailable,
                permissionState: diagnostics.permissionState,
                getCurrentPositionCalled: diagnostics.getCurrentPositionCalled,
                lastOutcome: diagnostics.lastOutcome,
                lastErrorCode: diagnostics.lastErrorCode
            };
        },

        shareCurrentPosition(options = {}) {
            const requirePosition = options.requirePosition === true;
            const position = options.position || this.lastPosition || lastPosition || this.getLastPosition();
            if (requirePosition && !position) {
                return { ok: false, code: 'NO_POSITION_AVAILABLE', message: 'No valid position is available to share.' };
            }
            if (!position) {
                return { ok: false, code: 'NO_POSITION_AVAILABLE', message: 'No valid position is available to share.' };
            }

            const latitude = Number(position.latitude ?? position.lat ?? 0);
            const longitude = Number(position.longitude ?? position.lng ?? 0);
            const mapUrl = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(latitude)}&mlon=${encodeURIComponent(longitude)}&zoom=18`;
            const text = `Standort: ${latitude}, ${longitude}`;
            const payload = {
                title: 'Standort',
                text: `${text}\n${mapUrl}`,
                url: mapUrl
            };

            const share = typeof navigator !== 'undefined' && navigator.share && typeof navigator.share === 'function'
                ? navigator.share.bind(navigator)
                : null;
            if (share) {
                return share(payload)
                    .then(() => ({ ok: true, method: 'native-share', position, mapUrl }))
                    .catch(() => {
                        const writeText = typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function'
                            ? navigator.clipboard.writeText.bind(navigator.clipboard)
                            : null;
                        if (!writeText) {
                            return { ok: false, code: 'SHARE_UNAVAILABLE', message: 'Sharing is not available on this device.' };
                        }
                        return writeText(`${payload.text}\n${payload.url}`)
                            .then(() => ({ ok: true, method: 'copy', position, mapUrl }));
                    });
            }

            const writeText = typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function'
                ? navigator.clipboard.writeText.bind(navigator.clipboard)
                : null;
            if (!writeText) {
                return { ok: false, code: 'SHARE_UNAVAILABLE', message: 'Sharing is not available on this device.' };
            }

            return writeText(`${payload.text}\n${payload.url}`)
                .then(() => ({ ok: true, method: 'copy', position, mapUrl }));
        },

        // ── State reads ───────────────────────────────────────────────────────

        getLastPosition() {
            if (this.lastPosition) {
                return this.lastPosition;
            }

            // Prefer CoreStorage if a previous position was saved there.
            const storage = coreFacade('CoreStorage');
            if (storage && typeof storage.get === 'function') {
                const stored = storage.get('gps:lastPosition');
                if (stored) {
                    this.lastPosition = stored;
                    return stored;
                }
            }

            return lastPosition;
        }
    };

    // ── Register on window ────────────────────────────────────────────────────

    GpsModule.renderUserInterface = (container) => {
        if (!container) return;
        let autoRefreshAttempted = false;
        const configManager = coreFacade('ConfigManager');
        const isAutoRequestEnabled = () => {
            const settings = readSettings();
            return settings.autoRequestOnOpen === true;
        };
        const persistAutoRequestSetting = (enabled) => {
            if (configManager && typeof configManager.setPath === 'function') {
                configManager.setPath('moduleSettings.gps.autoRequestOnOpen', enabled);
                if (typeof configManager.persist === 'function') {
                    configManager.persist('moduleSettings');
                }
            }
            try {
                const stored = JSON.parse(localStorage.getItem('core-config-moduleSettings') || '{}');
                stored.gps = { ...(stored.gps || {}), autoRequestOnOpen: enabled };
                localStorage.setItem('core-config-moduleSettings', JSON.stringify(stored));
            } catch (error) {
                // Ignore storage issues; runtime config is still authoritative.
            }
        };

        const render = (message = '', isError = false) => {
            const state = GpsModule.getRuntimeState();
            const position = state.lastPosition || GpsModule.getLastPosition();
            const active = state.status === 'enabled' && state.active;
            const allowedToUse = canUseModule();
            const permissionRequested = state.permissionState === 'prompt' || state.permissionState === 'unknown';
            const autoRequestOnOpen = isAutoRequestEnabled();
            const showConsentModal = permissionRequested && active && !autoRequestOnOpen;
            const positionHtml = position ? `<div><dt>Breitengrad</dt><dd>${position.latitude ?? position.lat ?? '—'}</dd></div><div><dt>Längengrad</dt><dd>${position.longitude ?? position.lng ?? '—'}</dd></div><div><dt>Genauigkeit</dt><dd>${position.accuracy ?? '—'}</dd></div><div><dt>Zeitpunkt</dt><dd>${position.timestamp ?? '—'}</dd></div>` : '<div><dt>Position</dt><dd>nicht verfügbar</dd></div>';
            const shareDisabled = !position || !allowedToUse || !active;
            const infoMessage = message || (state.permissionState === 'denied'
                ? 'Standort nicht verfügbar. Bitte Standortzugriff aktivieren.'
                : !allowedToUse
                    ? 'Für diese Nutzung ist keine Berechtigung vorhanden.'
                    : active
                        ? ''
                        : 'Aktivieren Sie das Modul, bevor eine Position abgefragt wird.');
            const modalMarkup = showConsentModal
                ? `<div class="gps-confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="gps-confirmation-title" tabindex="-1"><div class="gps-confirmation"><h2 id="gps-confirmation-title">Aktuelle Position ermitteln?</h2><div class="gps-actions gps-confirmation-actions"><button type="button" data-gps-confirm="yes">Ja</button><button type="button" data-gps-confirm="no">Nein</button></div></div></div>`
                : '';
            container.innerHTML = `<div class="gps-user-module"><h1>GPS</h1><div class="gps-location-card"><h2>Aktuelle Position</h2><dl id="gpsPosition" class="gps-position">${positionHtml}</dl><label class="gps-toggle"><input type="checkbox" data-gps-setting="autoRequestOnOpen" ${autoRequestOnOpen ? 'checked' : ''}> Position beim Öffnen automatisch ermitteln</label></div>${modalMarkup}<div class="gps-actions"><button type="button" class="gps-primary-action" data-gps-action="current" ${(allowedToUse && active) ? '' : 'disabled'}>Position aktualisieren</button><button type="button" data-gps-action="share" ${shareDisabled ? 'disabled' : ''}>Position teilen</button></div><p id="gpsUserMessage" class="gps-message">${infoMessage}</p></div>`;

            const autoSetting = container.querySelector('[data-gps-setting="autoRequestOnOpen"]');
            if (autoSetting) {
                autoSetting.addEventListener('change', (event) => {
                    const enabled = !!event.target.checked;
                    persistAutoRequestSetting(enabled);
                    render(enabled ? 'Automatische Positionsabfrage aktiviert.' : 'Automatische Positionsabfrage deaktiviert.', false);
                });
            }

            const currentButton = container.querySelector('[data-gps-action="current"]');
            if (currentButton) {
                currentButton.addEventListener('click', async () => {
                    render('Position wird abgefragt...');
                    try {
                        const result = GpsModule.requestCurrentPositionWithConsent();
                        if (result && result.ok === false && result.code === 'USER_CONFIRMATION_REQUIRED') {
                            render(result.message || 'Aktuelle Position ermitteln?', true);
                            return;
                        }
                        await GpsModule.getCurrentPosition();
                        render('Position aktualisiert.');
                    } catch (error) {
                        render(error && error.code === 'INSUFFICIENT_PERMISSIONS' ? 'Für diese Nutzung ist keine Berechtigung vorhanden.' : error && error.code === 'PERMISSION_DENIED' ? 'Standort nicht verfügbar. Bitte Standortzugriff aktivieren.' : error && error.code === 'POSITION_UNAVAILABLE' ? 'Position konnte nicht bestimmt werden.' : error && error.code === 'TIMEOUT' ? 'Die Positionsabfrage timed out.' : error && error.code === 'MODULE_NOT_ENABLED' ? 'Aktivieren Sie das Modul, bevor eine Position abgefragt wird.' : 'Position konnte nicht abgerufen werden.', true);
                    }
                });
            }

            const shareButton = container.querySelector('[data-gps-action="share"]');
            if (shareButton) {
                shareButton.addEventListener('click', async () => {
                    const result = await GpsModule.shareCurrentPosition({ requirePosition: true });
                    render(result.ok ? 'Position geteilt.' : result.code === 'NO_POSITION_AVAILABLE' ? 'Keine gültige Position zum Teilen vorhanden.' : 'Position konnte nicht geteilt werden.', !result.ok);
                });
            }

            const confirmationYes = container.querySelector('[data-gps-confirm="yes"]');
            if (confirmationYes) {
                confirmationYes.addEventListener('click', async () => {
                    const result = await GpsModule.confirmLocationRequest(true);
                    if (result && result.latitude) {
                        render('Position aktualisiert.');
                        return;
                    }
                    render('Aktuelle Position ermitteln?', true);
                });
            }

            const confirmationNo = container.querySelector('[data-gps-confirm="no"]');
            if (confirmationNo) {
                confirmationNo.addEventListener('click', () => {
                    GpsModule.confirmLocationRequest(false);
                    render('Standort nicht verfügbar. Bitte Standortzugriff aktivieren.', true);
                });
            }

            const confirmationModal = container.querySelector('.gps-confirmation-modal');
            const confirmationButtons = confirmationModal && typeof confirmationModal.querySelectorAll === 'function'
                ? Array.from(confirmationModal.querySelectorAll('button'))
                : [];
            if (confirmationModal && confirmationButtons.length > 0) {
                confirmationButtons[0].focus();
                confirmationModal.addEventListener('keydown', (event) => {
                    if (event.key !== 'Tab') {
                        return;
                    }
                    const first = confirmationButtons[0];
                    const last = confirmationButtons[confirmationButtons.length - 1];
                    if (event.shiftKey && document.activeElement === first) {
                        event.preventDefault();
                        last.focus();
                    } else if (!event.shiftKey && document.activeElement === last) {
                        event.preventDefault();
                        first.focus();
                    }
                });
            }
        };
        render();
        Promise.resolve(refreshPermissionState()).then((state) => {
            const shouldAutoRequest = state === 'granted' || isAutoRequestEnabled();
            if (autoRefreshAttempted || !canUseModule() || !shouldAutoRequest) {
                return;
            }
            const runtimeState = GpsModule.getRuntimeState();
            if (runtimeState.status !== 'enabled' || !runtimeState.active) {
                return;
            }
            autoRefreshAttempted = true;
            const requestPosition = state === 'granted' ? GpsModule.getCurrentPosition() : GpsModule.confirmLocationRequest(true);
            return requestPosition
                .then(() => render('Position automatisch aktualisiert.'))
                .catch((error) => {
                    const message = error && error.code === 'PERMISSION_DENIED'
                        ? 'Standort nicht verfügbar. Bitte Standortzugriff aktivieren.'
                        : error && error.code === 'TIMEOUT'
                            ? 'Die Positionsabfrage timed out.'
                            : 'Automatische Positionsabfrage war nicht verfügbar.';
                    render(message, true);
                });
        }).catch(() => {});
    };

    window.GpsModule = GpsModule;

})();

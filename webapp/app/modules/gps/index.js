/*
 * GPS Tracker Module
 * Version: 1.0.0
 *
 * Neutral GPS tracking module for the platform.
 * Provides geolocation access, CoreEventBus integration,
 * CoreStorage / DatabaseManager persistence, CoreAudit recording
 * and a full ModuleInterface lifecycle.
 *
 * This module is the reference module for lifecycle, permission and
 * standalone validation inside the Neutral framework.
 */

(() => {
    'use strict';

    // ── Internal state ────────────────────────────────────────────────────────

    let watchId = null;
    let tracking = false;
    let status = 'available'; // available | installed | enabled | disabled
    let permissionState = 'unknown'; // unknown | granted | prompt | denied | unsupported
    let lastError = null;
    let lastPosition = null;
    const defaultSettings = Object.freeze({
        enableHighAccuracy: true,
        timeoutMs: 10000,
        maximumAgeMs: 0,
        persistLocationHistory: true
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

    const updatePermissionState = (nextState) => {
        const normalizedState = typeof nextState === 'string' && nextState.trim()
            ? nextState.trim()
            : 'unknown';

        const previousState = permissionState;
        permissionState = normalizedState;

        if (previousState !== permissionState) {
            emit('gps:permissionChanged', { permissionState });
        }

        return permissionState;
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
        if (!user || !permission) {
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
        const configured = window.ConfigManager && typeof window.ConfigManager.getPath === 'function'
            ? window.ConfigManager.getPath('moduleSettings.gps', {})
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

        if (settings.persistLocationHistory && window.DatabaseManager && typeof window.DatabaseManager.save === 'function') {
            window.DatabaseManager.save('sync', record).catch(() => {
                // Fallback is intentionally silent.
            });
        }

        if (settings.persistLocationHistory && window.CoreStorage && typeof window.CoreStorage.set === 'function') {
            window.CoreStorage.set('gps:lastPosition', record);
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
            updatePermissionState('denied');
        } else if (code === 2) {
            normalized.code = 'POSITION_UNAVAILABLE';
        } else if (code === 3) {
            normalized.code = 'TIMEOUT';
        }

        lastError = normalized;
        return normalized;
    };

    const refreshPermissionState = async () => {
        if (typeof navigator === 'undefined' || !navigator.permissions || typeof navigator.permissions.query !== 'function') {
            updatePermissionState(hasGeolocation() ? 'prompt' : 'unsupported');
            return permissionState;
        }

        try {
            const result = navigator.permissions.query({ name: 'geolocation' });
            const permission = result && typeof result.then === 'function' ? await result : result;
            const state = permission && typeof permission.state === 'string' ? permission.state : 'unknown';
            updatePermissionState(state);
            return permissionState;
        } catch (error) {
            updatePermissionState(hasGeolocation() ? 'prompt' : 'unsupported');
            return permissionState;
        }
    };

    const readPermissionStateSnapshot = () => {
        if (typeof navigator === 'undefined' || !navigator.permissions || typeof navigator.permissions.query !== 'function') {
            return updatePermissionState(hasGeolocation() ? 'prompt' : 'unsupported');
        }

        try {
            const result = navigator.permissions.query({ name: 'geolocation' });
            if (result && typeof result.then === 'function') {
                return null;
            }

            const state = result && typeof result.state === 'string' ? result.state : 'unknown';
            return updatePermissionState(state);
        } catch (error) {
            return updatePermissionState(hasGeolocation() ? 'prompt' : 'unsupported');
        }
    };

    // ── Geolocation handlers ──────────────────────────────────────────────────

    const onPosition = (position) => {
        const record = persistPosition(position);
        lastPosition = record;
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
        description: 'Neutral GPS tracking module.',
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

            const immediatePermissionState = readPermissionStateSnapshot();
            if (immediatePermissionState === 'denied') {
                const detail = { code: 'PERMISSION_DENIED', message: 'Geolocation permission was denied.' };
                lastError = detail;
                emit('gps:error', detail);
                audit('gps:error', detail);
                return { ok: false, code: 'PERMISSION_DENIED' };
            }

            refreshPermissionState().catch(() => {});
            if (permissionState === 'denied') {
                const detail = { code: 'PERMISSION_DENIED', message: 'Geolocation permission was denied.' };
                lastError = detail;
                emit('gps:error', detail);
                audit('gps:error', detail);
                return { ok: false, code: 'PERMISSION_DENIED' };
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
                    reject(Object.assign(new Error('Geolocation API not available.'), { code: 'GEOLOCATION_UNAVAILABLE' }));
                    return;
                }

                try {
                    await refreshPermissionState();
                } catch (error) {
                    // Continue with the direct browser call and surface the actual geolocation error.
                }

                if (permissionState === 'denied') {
                    const error = Object.assign(new Error('Geolocation permission was denied.'), { code: 'PERMISSION_DENIED' });
                    lastError = { code: 'PERMISSION_DENIED', message: error.message };
                    reject(error);
                    return;
                }

                geolocation.getCurrentPosition(
                    (position) => {
                        const record = persistPosition(position);
                        lastPosition = record;
                        lastError = null;
                        emit('gps:position', record);
                        resolve(record);
                    },
                    (error) => {
                        const detail = normalizeError(error);
                        onError(error);
                        reject(Object.assign(new Error(detail.message), { code: detail.code }));
                    },
                    getGeolocationOptions()
                );
            });
        },

        // ── State reads ───────────────────────────────────────────────────────

        getLastPosition() {
            // Prefer CoreStorage if a previous position was saved there.
            if (window.CoreStorage && typeof window.CoreStorage.get === 'function') {
                const stored = window.CoreStorage.get('gps:lastPosition');
                if (stored) {
                    return stored;
                }
            }

            return lastPosition;
        }
    };

    // ── Register on window ────────────────────────────────────────────────────

    GpsModule.renderUserInterface = (container) => {
        if (!container) return;
        if (typeof GpsModule._uiUnsubscribe === 'function') {
            GpsModule._uiUnsubscribe();
            GpsModule._uiUnsubscribe = null;
        }
        const render = (message = '', isError = false) => {
            const state = GpsModule.getRuntimeState();
            const position = state.lastPosition || GpsModule.getLastPosition();
            const trackingNow = GpsModule.isTracking();
            const active = state.status === 'enabled' && state.active;
            const allowedToUse = canUseModule();
            const label = !allowedToUse
                ? 'Access restricted'
                : trackingNow
                    ? 'Tracking active'
                    : state.permissionState === 'denied'
                        ? 'Permission denied'
                        : active
                            ? 'Ready'
                            : 'Not active';
            const positionHtml = position ? `<div><dt>Latitude</dt><dd>${position.latitude ?? position.lat ?? '—'}</dd></div><div><dt>Longitude</dt><dd>${position.longitude ?? position.lng ?? '—'}</dd></div><div><dt>Accuracy</dt><dd>${position.accuracy ?? '—'}</dd></div><div><dt>Timestamp</dt><dd>${position.timestamp ?? '—'}</dd></div>` : '<div><dt>Position</dt><dd>Not available</dd></div>';
            container.innerHTML = `<div class="gps-user-module"><div class="gps-heading"><div><span class="user-app-eyebrow">Location</span><h1>GPS</h1></div><span id="gpsUserStatus" class="gps-status ${isError ? 'error' : ''}">${label}</span></div><div class="gps-location-card"><span class="gps-location-label">Current position</span><dl id="gpsPosition" class="gps-position">${positionHtml}</dl><div class="gps-state-line">Permission: ${state.permissionState}</div></div><div class="gps-actions"><button type="button" class="gps-primary-action" data-gps-action="current" ${(allowedToUse && active) ? '' : 'disabled'}>Get Current Position</button><button type="button" data-gps-action="start" ${(allowedToUse && active && !trackingNow) ? '' : 'disabled'}>Start Tracking</button><button type="button" data-gps-action="stop" ${trackingNow ? '' : 'disabled'}>Stop Tracking</button></div><p id="gpsUserMessage" class="gps-message">${message || (!allowedToUse ? 'Your current role is not allowed to use device geolocation.' : active ? '' : 'Activate this module before requesting device location.')}</p></div>`;
            container.querySelector('[data-gps-action="current"]').addEventListener('click', async () => { render('Requesting location...'); try { await GpsModule.getCurrentPosition(); render('Location updated.'); } catch (error) { render(error && error.code === 'INSUFFICIENT_PERMISSIONS' ? 'Your current role is not allowed to use device geolocation.' : error && error.code === 'PERMISSION_DENIED' ? 'Location permission was denied.' : error && error.code === 'POSITION_UNAVAILABLE' ? 'Position could not be determined.' : error && error.code === 'TIMEOUT' ? 'Location request timed out.' : error && error.code === 'MODULE_NOT_ENABLED' ? 'Activate this module before requesting device location.' : 'Location could not be retrieved.', true); } });
            container.querySelector('[data-gps-action="start"]').addEventListener('click', () => { const result = GpsModule.startTracking(); render(result.ok ? 'Tracking started.' : result.code === 'INSUFFICIENT_PERMISSIONS' ? 'Your current role is not allowed to use device geolocation.' : result.code === 'PERMISSION_DENIED' ? 'Location permission was denied.' : result.code === 'MODULE_NOT_ENABLED' ? 'Activate this module before starting tracking.' : 'Location tracking is unavailable.', !result.ok); });
            container.querySelector('[data-gps-action="stop"]').addEventListener('click', () => { GpsModule.stopTracking(); render('Tracking stopped.'); });
        };
        if (window.Core && typeof window.Core.on === 'function') {
            const rerender = () => {
                if (container && typeof container.isConnected === 'boolean' && !container.isConnected) {
                    return;
                }
                render();
            };
            const subscriptions = [
                'gps:permissionChanged',
                'gps:enabled',
                'gps:disabled',
                'gps:trackingStarted',
                'gps:trackingStopped',
                'gps:position',
                'gps:error'
            ].map((eventName) => window.Core.on(eventName, rerender));
            GpsModule._uiUnsubscribe = () => {
                subscriptions.forEach((unsubscribe) => {
                    if (typeof unsubscribe === 'function') {
                        unsubscribe();
                    }
                });
            };
        }
        render();
    };

    window.GpsModule = GpsModule;

})();

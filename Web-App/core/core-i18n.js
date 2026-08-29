/*
 * Generic i18n Module
 * Version: 1.0.0
 *
 * Internationalization for a reusable framework.
 * The module keeps multilingual support while staying free from app-specific content.
 */

(() => {
    'use strict';

    const TRANSLATIONS = {
        de: {
            'app.loading': 'Wird geladen…',
            'app.error': 'Fehler beim Laden – bitte Seite neu laden.',
            'app.title': 'Anwendung',
            'nav.dashboard': 'Dashboard',
            'nav.profile': 'Profil',
            'nav.settings': 'Einstellungen',
            'nav.admin': 'Administration',
            'nav.users': 'Benutzer',
            'status.ok': 'OK',
            'status.error': 'Fehler',
            'user.active': 'Aktiv',
            'user.inactive': 'Inaktiv',
            'user.role': 'Rolle',
            'admin.system': 'System',
            'locale.current': 'Aktuelle Sprache: {locale}'
        },
        en: {
            'app.loading': 'Loading…',
            'app.error': 'Error loading – please reload the page.',
            'app.title': 'Application',
            'nav.dashboard': 'Dashboard',
            'nav.profile': 'Profile',
            'nav.settings': 'Settings',
            'nav.admin': 'Administration',
            'nav.users': 'Users',
            'status.ok': 'OK',
            'status.error': 'Error',
            'user.active': 'Active',
            'user.inactive': 'Inactive',
            'user.role': 'Role',
            'admin.system': 'System',
            'locale.current': 'Current language: {locale}'
        }
    };

    const SUPPORTED = ['de', 'en'];
    const STORAGE_KEY = 'framework_locale';

    const I18nModule = {
        name: 'i18n-module',
        version: '1.0.0',
        initialized: false,
        _locale: 'de',

        init() {
            if (this.initialized) {
                return this;
            }

            this.initialized = true;

            const stored = localStorage.getItem(STORAGE_KEY);
            const detected = (navigator.language || navigator.userLanguage || 'de').split('-')[0].toLowerCase();

            if (stored === 'auto' || !stored) {
                this._locale = SUPPORTED.includes(detected) ? detected : 'de';
            } else {
                this._locale = SUPPORTED.includes(stored) ? stored : 'de';
            }

            if (window.Core) {
                window.Core.emit('i18n:initialized', { locale: this._locale });
            }

            return this;
        },

        t(key, params) {
            const str = (TRANSLATIONS[this._locale] && TRANSLATIONS[this._locale][key])
                || (TRANSLATIONS.de && TRANSLATIONS.de[key])
                || key;

            if (!params) {
                return str;
            }

            return str.replace(/\{(\w+)\}/g, (_, name) => (params[name] != null ? params[name] : ''));
        },

        setLocale(locale) {
            if (locale === 'auto') {
                localStorage.setItem(STORAGE_KEY, 'auto');
                const detected = (navigator.language || 'de').split('-')[0].toLowerCase();
                this._locale = SUPPORTED.includes(detected) ? detected : 'de';
            } else {
                if (!SUPPORTED.includes(locale)) {
                    return false;
                }

                this._locale = locale;
                localStorage.setItem(STORAGE_KEY, locale);
            }

            if (window.Core) {
                window.Core.emit('i18n:locale-changed', { locale: this._locale });
            }

            return true;
        },

        getLocale() {
            return this._locale;
        },

        getStoredPreference() {
            return localStorage.getItem(STORAGE_KEY) || 'auto';
        },

        getSupportedLocales() {
            return [...SUPPORTED];
        },

        getDeviceLocale() {
            const locale = (navigator.language || 'de').split('-')[0].toLowerCase();
            return SUPPORTED.includes(locale) ? locale : 'de';
        }
    };

    const moduleManifest = Object.freeze({
        id: 'core-i18n',
        name: 'Core i18n',
        version: '1.0.0',
        type: 'framework',
        description: 'Framework localization and locale management.',
        dependencies: [],
        permissions: ['framework:read'],
        capabilities: ['localization'],
        source: 'Web-App/core/core-i18n.js'
    });

    if (!Array.isArray(window.FrameworkModuleCatalog)) {
        window.FrameworkModuleCatalog = [];
    }

    if (!window.FrameworkModuleCatalog.some((entry) => entry && entry.id === moduleManifest.id)) {
        window.FrameworkModuleCatalog.push(moduleManifest);
    }

    if (!window.I18nModule) {
        window.I18nModule = I18nModule;
    }
})();

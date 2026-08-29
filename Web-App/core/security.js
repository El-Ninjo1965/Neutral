/*
 * Core Security
 * Version: 1.0
 *
 * Neutral security primitives for the generic framework.
 * No application-specific rules or domain logic are included here.
 */

(() => {
    'use strict';

    const root = typeof globalThis !== 'undefined'
        ? globalThis
        : (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {}));

    const DEFAULT_ALLOWED_ORIGINS = ['localhost', '127.0.0.1', '::1'];

    const normalizeOrigin = (origin) => {
        if (typeof origin !== 'string') {
            return '';
        }

        const trimmed = origin.trim();
        if (!trimmed || trimmed === '*') {
            return '*';
        }

        const candidate = trimmed
            .replace(/^https?:\/\//i, '')
            .replace(/^\/+/, '')
            .split(/[/?#]/)[0]
            .replace(/^([^@]+)@/, '')
            .replace(/\/$/, '')
            .toLowerCase();

        return candidate || '';
    };

    const CoreSecurity = {
        allowedOrigins: [...DEFAULT_ALLOWED_ORIGINS],

        registerAllowedOrigin(origin) {
            const normalized = normalizeOrigin(origin);
            if (!normalized || normalized === '*') {
                this.allowedOrigins = this.allowedOrigins.filter((entry) => entry !== '*');
                this.allowedOrigins.push('*');
                return true;
            }

            if (!this.allowedOrigins.includes(normalized)) {
                this.allowedOrigins.push(normalized);
            }
            return true;
        },

        isOriginAllowed(origin) {
            const normalized = normalizeOrigin(origin);
            if (!normalized) {
                return false;
            }

            if (this.allowedOrigins.includes('*')) {
                return true;
            }

            if (this.allowedOrigins.includes(normalized)) {
                return true;
            }

            return this.allowedOrigins.some((entry) => {
                if (!entry.includes('*')) {
                    return false;
                }

                const pattern = entry
                    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                    .replace(/\\\*/g, '.*');
                return new RegExp(`^${pattern}$`, 'i').test(normalized);
            });
        },

        sanitizeText(value, { maxLength = 2048, trim = true } = {}) {
            if (value === null || typeof value === 'undefined') {
                return '';
            }

            let text = String(value);
            if (trim) {
                text = text.trim();
            }

            if (maxLength > 0 && text.length > maxLength) {
                text = text.slice(0, maxLength);
            }

            return text
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, '')
                .replace(/[\u0000-\u001f\u007f]/g, '')
                .replace(/(?:\r\n|\r|\n)+/g, ' ');
        },

        generateToken(length = 32) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const bytes = new Uint8Array(length);
            const cryptoObject = (typeof globalThis !== 'undefined' ? globalThis.crypto : undefined) || (typeof crypto !== 'undefined' ? crypto : undefined);

            if (cryptoObject && cryptoObject.getRandomValues) {
                cryptoObject.getRandomValues(bytes);
            } else {
                for (let index = 0; index < length; index += 1) {
                    bytes[index] = Math.floor(Math.random() * 256);
                }
            }

            let token = '';
            for (let index = 0; index < length; index += 1) {
                token += chars[bytes[index] % chars.length];
            }
            return token;
        },

        async hash(value) {
            const input = typeof value === 'string' ? value : JSON.stringify(value);
            const cryptoObject = (typeof globalThis !== 'undefined' ? globalThis.crypto :undefined) || (typeof crypto !== 'undefined' ? crypto : undefined);

            if (cryptoObject && cryptoObject.subtle && typeof cryptoObject.subtle.digest === 'function') {
                const encoded = new TextEncoder().encode(input);
                const digest = await cryptoObject.subtle.digest('SHA-256', encoded);
                return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
            }

            if (typeof require === 'function' && typeof process !== 'undefined') {
                const nodeCrypto = require('node:crypto');
                return nodeCrypto.createHash('sha256').update(input).digest('hex');
            }

            let hash = 0;
            for (let index = 0; index < input.length; index += 1) {
                hash = ((hash << 5) - hash + input.charCodeAt(index)) | 0;
            }
            return String(Math.abs(hash));
        },

        validateInput(value, { maxLength = 2048, allowEmpty = false } = {}) {
            if (value === null || typeof value === 'undefined') {
                return !allowEmpty ? '' : null;
            }

            const sanitized = this.sanitizeText(value, { maxLength, trim: true });
            if (!allowEmpty && sanitized.length === 0) {
                return '';
            }

            return sanitized;
        }
    };

    if (!root.CoreSecurity) {
        root.CoreSecurity = CoreSecurity;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { CoreSecurity };
    }
})();

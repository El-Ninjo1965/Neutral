/*
 * Core Audit
 * Version: 1.0.0
 *
 * Central audit trail for user/admin actions and access decisions.
 * This is separate from the in-memory event ring buffer used for debug output.
 */

(() => {
    'use strict';

    const MAX_AUDIT_ENTRIES = 1000;

    const CoreAudit = {
        entries: [],
        initialized: false,

        normalizeAuditArguments(...args) {
            if (args.length === 0) {
                return {
                    actor: 'system',
                    action: 'unknown',
                    resource: 'resource',
                    result: 'unknown',
                    metadata: {}
                };
            }

            const [first, second, third, fourth, fifth] = args;

            if (args.length === 1 && typeof first === 'string') {
                return {
                    actor: 'system',
                    action: first,
                    resource: 'resource',
                    result: 'ok',
                    metadata: {}
                };
            }

            if (args.length === 1 && first && typeof first === 'object' && !Array.isArray(first)) {
                return {
                    actor: first.actor || first.user || first.userId || 'system',
                    action: first.action || first.type || 'unknown',
                    resource: first.resource || first.target || 'resource',
                    result: first.result || 'ok',
                    metadata: first.metadata && typeof first.metadata === 'object' ? { ...first.metadata } : { ...first }
                };
            }

            if (args.length === 2 && typeof first === 'string' && second && typeof second === 'object' && !Array.isArray(second)) {
                return {
                    actor: 'system',
                    action: first,
                    resource: second.resource || second.target || 'resource',
                    result: second.result || 'ok',
                    metadata: { ...second }
                };
            }

            if (args.length === 2 && typeof first === 'string' && typeof second === 'string') {
                return {
                    actor: 'system',
                    action: first,
                    resource: second,
                    result: 'ok',
                    metadata: {}
                };
            }

            if (args.length >= 3) {
                const metadata = fifth && typeof fifth === 'object' && !Array.isArray(fifth)
                    ? { ...fifth }
                    : (fourth && typeof fourth === 'object' && !Array.isArray(fourth)
                        ? { ...fourth }
                        : {});

                return {
                    actor: (first && typeof first === 'object') ? (first.id || first.username || 'system') : (typeof first === 'string' ? first : 'system'),
                    action: typeof second === 'string' ? second : 'unknown',
                    resource: typeof third === 'string' ? third : (third && typeof third === 'object' ? (third.id || third.name || 'resource') : 'resource'),
                    result: typeof fourth === 'string' ? fourth : 'ok',
                    metadata
                };
            }

            return {
                actor: 'system',
                action: 'unknown',
                resource: 'resource',
                result: 'ok',
                metadata: {}
            };
        },

        readPersistedEntries() {
            const storageKey = 'core-audit.entries';
            const persisted = [];

            if (typeof localStorage !== 'undefined') {
                try {
                    const raw = localStorage.getItem(storageKey);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) {
                            persisted.push(...parsed);
                        }
                    }
                } catch (error) {
                    // Ignore malformed browser audit entries.
                }
            }

            if (persisted.length) {
                return persisted;
            }

            return [];
        },

        persistEntries() {
            if (typeof localStorage !== 'undefined') {
                try {
                    localStorage.setItem('core-audit.entries', JSON.stringify(this.entries.slice(-MAX_AUDIT_ENTRIES)));
                } catch (error) {
                    // Ignore storage issues during audit persistence.
                }
            }
        },

        init() {
            if (this.initialized) {
                return this;
            }

            this.initialized = true;
            this.entries = this.readPersistedEntries();

            if (window.Core) {
                window.Core.emit('audit:initialized', {
                    timestamp: new Date().toISOString(),
                    entries: this.entries.length
                });
            }

            return this;
        },

        record(...args) {
            const normalized = this.normalizeAuditArguments(...args);
            const entry = {
                id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                actor: String(normalized.actor || 'system'),
                action: String(normalized.action || 'unknown'),
                resource: String(normalized.resource || 'resource'),
                result: String(normalized.result || 'unknown'),
                timestamp: new Date().toISOString(),
                metadata: normalized.metadata && typeof normalized.metadata === 'object' ? { ...normalized.metadata } : {}
            };

            this.entries.push(entry);

            if (this.entries.length > MAX_AUDIT_ENTRIES) {
                this.entries = this.entries.slice(-MAX_AUDIT_ENTRIES);
            }

            this.persistEntries();

            if (window.Core) {
                window.Core.emit('audit:recorded', {
                    id: entry.id,
                    actor: entry.actor,
                    action: entry.action,
                    resource: entry.resource,
                    result: entry.result
                });
            }

            return entry;
        },

        filter(filters = {}) {
            const normalized = {
                actor: typeof filters.actor === 'string' && filters.actor.trim() ? filters.actor.trim() : 'all',
                action: typeof filters.action === 'string' && filters.action.trim() ? filters.action.trim() : 'all',
                resource: typeof filters.resource === 'string' && filters.resource.trim() ? filters.resource.trim() : 'all',
                result: typeof filters.result === 'string' && filters.result.trim() ? filters.result.trim() : 'all',
                search: typeof filters.search === 'string' ? filters.search.trim().toLowerCase() : ''
            };

            const entries = this.entries.filter((entry) => {
                if (normalized.actor !== 'all' && String(entry.actor || 'system') !== normalized.actor) {
                    return false;
                }
                if (normalized.action !== 'all' && String(entry.action || 'unknown') !== normalized.action) {
                    return false;
                }
                if (normalized.resource !== 'all' && String(entry.resource || 'resource') !== normalized.resource) {
                    return false;
                }
                if (normalized.result !== 'all' && String(entry.result || 'unknown') !== normalized.result) {
                    return false;
                }
                if (normalized.search) {
                    const searchable = [entry.actor, entry.action, entry.resource, entry.result, JSON.stringify(entry.metadata || {})].join(' ').toLowerCase();
                    if (!searchable.includes(normalized.search)) {
                        return false;
                    }
                }
                return true;
            });

            return entries.map((entry) => ({ ...entry, metadata: { ...(entry.metadata || {}) } }));
        },

        summary() {
            const totals = { total: this.entries.length, success: 0, error: 0, warning: 0, info: 0, actors: new Set(), actions: new Set(), resources: new Set() };

            for (const entry of this.entries) {
                const actor = String(entry.actor || 'system');
                const action = String(entry.action || 'unknown');
                const resource = String(entry.resource || 'resource');
                const result = String(entry.result || 'unknown');
                totals.actors.add(actor);
                totals.actions.add(action);
                totals.resources.add(resource);
                if (result === 'success' || result === 'ok') totals.success += 1;
                else if (result === 'error' || result === 'failed') totals.error += 1;
                else if (result === 'warning') totals.warning += 1;
                else totals.info += 1;
            }

            return {
                total: totals.total,
                success: totals.success,
                error: totals.error,
                warning: totals.warning,
                info: totals.info,
                actors: Array.from(totals.actors),
                actions: Array.from(totals.actions),
                resources: Array.from(totals.resources)
            };
        },

        list() {
            return this.entries.map((entry) => ({ ...entry, metadata: { ...(entry.metadata || {}) } }));
        },

        clear() {
            this.entries = [];
            this.persistEntries();
            if (window.Core) {
                window.Core.emit('audit:cleared', {
                    timestamp: new Date().toISOString()
                });
            }
            return true;
        }
    };

    const moduleManifest = Object.freeze({
        id: 'core-audit',
        name: 'Core Audit',
        version: '1.0.0',
        type: 'framework',
        description: 'Central audit trail for user and admin activity.',
        dependencies: [],
        permissions: ['framework:read', 'audit:read', 'audit:write'],
        capabilities: ['audit', 'trace'],
        source: 'Web-App/core/core-audit.js'
    });

    if (!Array.isArray(window.FrameworkModuleCatalog)) {
        window.FrameworkModuleCatalog = [];
    }

    if (!window.FrameworkModuleCatalog.some((entry) => entry && entry.id === moduleManifest.id)) {
        window.FrameworkModuleCatalog.push(moduleManifest);
    }

    if (!window.CoreAudit) {
        window.CoreAudit = CoreAudit;
    }
})();

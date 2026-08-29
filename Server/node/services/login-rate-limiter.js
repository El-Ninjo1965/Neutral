'use strict';

/**
 * Login rate limiter abstraction.
 *
 * Current default: single-process in-memory store. This keeps the application
 * working without external infrastructure while clearly separating the store
 * contract from the auth logic.
 *
 * For multi-instance deployments, the implementation can be swapped behind the
 * same interface without touching auth-service or the API layer.
 */

const config = require('../config').auth.loginRateLimit;

class MemoryRateLimitStore {
  constructor() {
    this.attempts = new Map();
  }

  keyFor(identifier, ip) {
    return `${String(identifier || '').toLowerCase()}::${String(ip || 'unknown')}`;
  }

  isLocked(identifier, ip) {
    const key = this.keyFor(identifier, ip);
    const record = this.attempts.get(key);
    if (!record) {
      return false;
    }
    return !!record.lockedUntil && record.lockedUntil > Date.now();
  }

  registerFailure(identifier, ip) {
    const key = this.keyFor(identifier, ip);
    const now = Date.now();
    const record = this.attempts.get(key) || { count: 0, windowStart: now, lockedUntil: 0 };

    if (now - record.windowStart > config.windowMs) {
      record.count = 0;
      record.windowStart = now;
    }

    record.count += 1;
    if (record.count >= config.maxAttempts) {
      record.lockedUntil = now + config.lockoutMs;
    }

    this.attempts.set(key, record);
    return {
      count: record.count,
      lockedUntil: record.lockedUntil,
      locked: record.lockedUntil > now
    };
  }

  registerSuccess(identifier, ip) {
    this.attempts.delete(this.keyFor(identifier, ip));
  }

  getStatus(identifier, ip) {
    const key = this.keyFor(identifier, ip);
    const record = this.attempts.get(key);
    if (!record) {
      return { count: 0, locked: false, lockedUntil: 0 };
    }
    return {
      count: record.count,
      locked: !!record.lockedUntil && record.lockedUntil > Date.now(),
      lockedUntil: record.lockedUntil
    };
  }

  reset() {
    this.attempts.clear();
  }
}

const resolveRateLimitStore = (kind = 'memory') => {
  const normalized = String(kind || 'memory').trim().toLowerCase();
  if (normalized === 'shared') {
    console.warn('[login-rate-limiter] Shared rate-limit backend requested but not implemented yet; falling back to single-process memory store.');
  }
  return new MemoryRateLimitStore();
};

const store = resolveRateLimitStore('memory');

module.exports = {
  MemoryRateLimitStore,
  resolveRateLimitStore,
  isLocked: (...args) => store.isLocked(...args),
  registerFailure: (...args) => store.registerFailure(...args),
  registerSuccess: (...args) => store.registerSuccess(...args),
  getStatus: (...args) => store.getStatus(...args),
  reset: () => store.reset()
};

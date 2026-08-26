'use strict';

/**
 * Auth Service
 *
 * Central session-based authentication and authorization layer.
 *
 * Layer separation (see WORKFLOW.md Phase 5B):
 *   A) AUTHENTICATION - who is the user?           -> login/logout/session validation here
 *   B) AUTHORIZATION   - what may the user do?      -> resolveRoles()/hasRole() here
 *   C) SESSION         - how does the user stay in? -> SessionStore adapter (server/services/session-store.js)
 *   D) SERVER/INFRA    - which server handles it?    -> server/config + connection manager (not this file)
 *   E) PERSISTENCE     - where is data stored?       -> user-service / session-store (not mixed in here)
 *
 * AuthService itself never talks to a filesystem or database directly for
 * session data - all session reads/writes go through the SessionStore
 * interface, which is the only thing that needs to change to support a
 * shared/central store later (AUTH_SESSION_STORE=<adapter>).
 */

const crypto = require('node:crypto');
const userService = require('./user-service');
const auditService = require('./audit-service');
const loginRateLimiter = require('./login-rate-limiter');
const { resolveSessionStore } = require('./session-store');
const config = require('../config');

const generateSessionId = () => crypto.randomBytes(32).toString('hex');
const generateCsrfToken = () => crypto.randomBytes(24).toString('hex');

let sessionStoreOverride = null;

/**
 * Resolve the currently configured SessionStore. Tests may override this via
 * setSessionStoreForTesting() to simulate multiple app instances sharing (or
 * not sharing) a store without depending on environment variables.
 */
const getSessionStore = () => {
  if (sessionStoreOverride) {
    return sessionStoreOverride;
  }
  return resolveSessionStore(config.auth.sessionStore);
};

const setSessionStoreForTesting = (store) => {
  sessionStoreOverride = store;
};

const clearSessionStoreOverride = () => {
  sessionStoreOverride = null;
};

const now = () => Date.now();

/**
 * AUTHENTICATION: verify credentials and issue a session.
 * Returns { ok, session, user } or { ok:false, code, message }.
 */
const login = async ({ username, password, ip = 'unknown' } = {}) => {
  const identifier = String(username || '').trim();

  if (loginRateLimiter.isLocked(identifier, ip)) {
    auditService.log(auditService.actions.RATE_LIMITED, 'auth', identifier, identifier, { ip }, 'failure');
    return { ok: false, code: 'RATE_LIMITED', message: 'Too many failed login attempts. Try again later.' };
  }

  if (!identifier || !password) {
    return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Username and password are required.' };
  }

  await userService.ensureBootstrapAdminUser();
  const user = userService.getByUsername(identifier);
  const passwordValid = !!user && !!user.passwordHash && await userService.verifyPassword(password, user.passwordHash);

  if (!user || !passwordValid) {
    const rateState = loginRateLimiter.registerFailure(identifier, ip);
    auditService.log(auditService.actions.LOGIN_FAILURE, 'auth', identifier, identifier, { ip, attempts: rateState.count }, 'failure');
    return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' };
  }

  if (user.status && user.status !== 'active') {
    auditService.log(auditService.actions.LOGIN_FAILURE, 'auth', user.id, identifier, { ip, reason: 'inactive_user' }, 'failure');
    return { ok: false, code: 'ACCOUNT_INACTIVE', message: 'This account is not active.' };
  }

  loginRateLimiter.registerSuccess(identifier, ip);

  const issuedAt = now();
  const session = {
    sessionId: generateSessionId(),
    userId: user.id,
    csrfToken: generateCsrfToken(),
    roles: Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : ['viewer']),
    issuedAt,
    lastSeenAt: issuedAt,
    expiresAt: issuedAt + config.auth.sessionTtlMs,
    status: 'active',
    ip
  };

  await getSessionStore().create(session);

  auditService.log(auditService.actions.LOGIN_SUCCESS, 'auth', user.id, user.username, { ip });

  const { passwordHash, ...userPublic } = user;
  return { ok: true, session, user: userPublic };
};

/**
 * SESSION: validate a session id, transparently renewing it if it is close
 * to expiry. Returns { ok, session, user } or { ok:false, code }.
 */
const validateSession = async (sessionId) => {
  if (!sessionId) {
    return { ok: false, code: 'SESSION_MISSING' };
  }

  const store = getSessionStore();
  const session = await store.get(sessionId);

  if (!session || session.status !== 'active') {
    return { ok: false, code: 'SESSION_INVALID' };
  }

  if (session.expiresAt <= now()) {
    await store.destroy(sessionId);
    auditService.log(auditService.actions.SESSION_EXPIRED, 'auth', session.userId, session.userId, {}, 'success');
    return { ok: false, code: 'SESSION_EXPIRED' };
  }

  const user = userService.getById(session.userId);
  if (!user || (user.status && user.status !== 'active')) {
    await store.destroy(sessionId);
    return { ok: false, code: 'SESSION_USER_INVALID' };
  }

  const timeLeft = session.expiresAt - now();
  let effectiveSession = session;

  // SESSION RENEWAL: extend expiry transparently when nearing the threshold
  // so an active user is not logged out mid-use.
  if (timeLeft < config.auth.sessionRenewThresholdMs) {
    effectiveSession = await store.touch(sessionId, {
      lastSeenAt: now(),
      expiresAt: now() + config.auth.sessionTtlMs
    }) || session;
  } else {
    effectiveSession = await store.touch(sessionId, { lastSeenAt: now() }) || session;
  }

  const { passwordHash, ...userPublic } = user;
  return { ok: true, session: effectiveSession, user: userPublic };
};

/**
 * AUTHENTICATION: end a session (logout).
 */
const logout = async (sessionId) => {
  if (!sessionId) {
    return { ok: false };
  }
  const store = getSessionStore();
  const session = await store.get(sessionId);
  const destroyed = await store.destroy(sessionId);
  if (session) {
    auditService.log(auditService.actions.LOGOUT, 'auth', session.userId, session.userId, {});
  }
  return { ok: destroyed };
};

/**
 * AUTHORIZATION: does this session's role set satisfy one of allowedRoles?
 */
const hasRole = (session, allowedRoles = []) => {
  if (!session || !Array.isArray(session.roles)) {
    return false;
  }
  const allowed = new Set(allowedRoles.map((role) => String(role).trim().toLowerCase()));
  return session.roles.some((role) => allowed.has(String(role).trim().toLowerCase()));
};

/**
 * CSRF: validate a submitted token against the session's stored token.
 * Uses a timing-safe comparison to avoid leaking token contents via timing.
 */
const validateCsrfToken = (session, suppliedToken) => {
  if (!session || !session.csrfToken || !suppliedToken) {
    return false;
  }
  const expected = Buffer.from(String(session.csrfToken));
  const actual = Buffer.from(String(suppliedToken));
  if (expected.length !== actual.length) {
    return false;
  }
  return crypto.timingSafeEqual(expected, actual);
};

module.exports = {
  login,
  logout,
  validateSession,
  hasRole,
  validateCsrfToken,
  getSessionStore,
  setSessionStoreForTesting,
  clearSessionStoreOverride
};

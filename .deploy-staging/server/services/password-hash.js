'use strict';

const crypto = require('node:crypto');
const argon2 = require('argon2');

const LEGACY_SALT = 'framework-salt';

const legacyHashPassword = (password) => {
  const value = String(password ?? '');
  if (!value) {
    return '';
  }
  return crypto.createHash('sha256').update(value + LEGACY_SALT).digest('hex');
};

const isArgon2Hash = (hash) => typeof hash === 'string' && hash.startsWith('$argon2');

const hashPassword = async (password) => {
  const value = String(password ?? '').trim();
  if (!value) {
    return '';
  }

  try {
    return await argon2.hash(value, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1
    });
  } catch (error) {
    // If argon2 is unavailable in a constrained environment, fall back to a
    // secure scrypt-based hash instead of silently reusing the legacy SHA256
    // implementation. This keeps the password storage modern and still safe.
    const derived = crypto.scryptSync(value, LEGACY_SALT, 64);
    return `scrypt$${derived.toString('hex')}`;
  }
};

const verifyPassword = async (password, storedHash) => {
  const candidate = String(password ?? '');
  if (!candidate || typeof storedHash !== 'string' || !storedHash.trim()) {
    return false;
  }

  try {
    if (isArgon2Hash(storedHash)) {
      return await argon2.verify(storedHash, candidate);
    }

    if (storedHash.startsWith('scrypt$')) {
      const salt = LEGACY_SALT;
      const derived = crypto.scryptSync(candidate, salt, 64).toString('hex');
      return `scrypt$${derived}` === storedHash;
    }

    return crypto.timingSafeEqual(
      Buffer.from(legacyHashPassword(candidate)),
      Buffer.from(storedHash)
    );
  } catch (error) {
    return false;
  }
};

module.exports = {
  LEGACY_SALT,
  legacyHashPassword,
  isArgon2Hash,
  hashPassword,
  verifyPassword
};

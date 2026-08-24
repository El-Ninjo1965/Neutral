'use strict';

const fs = require('node:fs');
const path = require('node:path');

const LOG_DIR = path.resolve(process.cwd(), 'server', 'runtime', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'system.log.json');

const ensureDir = (targetDir = LOG_DIR) => {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
};

const readLogStore = () => {
  try {
    ensureDir();
    if (!fs.existsSync(LOG_FILE)) {
      return { entries: [] };
    }
    const parsed = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8') || '{}');
    return parsed && typeof parsed === 'object' && Array.isArray(parsed.entries) ? parsed : { entries: [] };
  } catch (error) {
    return { entries: [] };
  }
};

const writeLogStore = (payload) => {
  try {
    ensureDir();
    fs.writeFileSync(LOG_FILE, JSON.stringify(payload, null, 2), 'utf8');
    return true;
  } catch (error) {
    return false;
  }
};

const normalizeMetadata = (metadata = {}) => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }
  return { ...metadata };
};

const normalizeLevel = (level = 'info') => {
  const value = String(level || 'info').trim().toLowerCase();
  const allowed = ['debug', 'info', 'warn', 'error', 'critical'];
  return allowed.includes(value) ? value : 'info';
};

const append = ({ level = 'info', source = 'system', message = '', metadata = {} } = {}) => {
  const entry = {
    id: `log-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
    timestamp: new Date().toISOString(),
    level: normalizeLevel(level),
    source: String(source || 'system').trim() || 'system',
    message: String(message || '').trim(),
    metadata: normalizeMetadata(metadata)
  };

  const current = readLogStore();
  const entries = Array.isArray(current.entries) ? [...current.entries] : [];
  entries.push(entry);
  while (entries.length > 2000) {
    entries.shift();
  }
  writeLogStore({ entries });
  return entry;
};

const getLogs = (filters = {}) => {
  const source = readLogStore();
  let entries = Array.isArray(source.entries) ? [...source.entries] : [];

  const normalized = filters && typeof filters === 'object' ? filters : {};
  if (normalized.level) {
    entries = entries.filter((entry) => String(entry.level || 'info') === String(normalized.level).trim().toLowerCase());
  }
  if (normalized.source) {
    entries = entries.filter((entry) => String(entry.source || '').toLowerCase() === String(normalized.source).trim().toLowerCase());
  }
  if (normalized.search) {
    const search = String(normalized.search).trim().toLowerCase();
    entries = entries.filter((entry) => [
      entry.message,
      entry.source,
      entry.level,
      JSON.stringify(entry.metadata || {})
    ].join(' ').toLowerCase().includes(search));
  }
  if (normalized.since) {
    const minimum = new Date(normalized.since).getTime();
    if (!Number.isNaN(minimum)) {
      entries = entries.filter((entry) => new Date(entry.timestamp).getTime() >= minimum);
    }
  }
  if (Number.isInteger(normalized.limit) && normalized.limit >= 0) {
    entries = entries.slice(-normalized.limit);
  }

  return entries;
};

const getSummary = () => {
  const entries = getLogs();
  const counts = { debug: 0, info: 0, warn: 0, error: 0, critical: 0 };
  for (const entry of entries) {
    const level = normalizeLevel(entry.level);
    counts[level] += 1;
  }
  return {
    total: entries.length,
    levels: counts,
    latest: entries[entries.length - 1] || null
  };
};

const clearLogs = () => {
  writeLogStore({ entries: [] });
  return { ok: true, cleared: true };
};

module.exports = {
  append,
  getLogs,
  getSummary,
  clearLogs,
  readLogStore,
  writeLogStore,
  normalizeLevel
};

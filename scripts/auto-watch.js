'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const DEBOUNCE_MS = 5000;
const IGNORED_PATH_PATTERNS = [
  /^\.git(?:\/|$)/,
  /^node_modules(?:\/|$)/,
  /^\.deploy-staging(?:\/|$)/,
  /^server\/runtime(?:\/|$)/,
  /^test-results(?:\/|$)/,
  /^\.neutral-deploy-manifest\.json$/,
  /^\.env(?:\..*)?$/
];

function normalizeRelative(filePath) {
  if (!filePath) {
    return '';
  }
  return String(filePath).split(path.sep).join('/').replace(/^\.\//, '').replace(/^\//, '');
}

function isIgnoredRelative(relativePath) {
  const normalized = normalizeRelative(relativePath);
  if (!normalized || normalized === '.') {
    return true;
  }

  return IGNORED_PATH_PATTERNS.some((pattern) => pattern.test(normalized));
}

let timer = null;
function scheduleSync() {
  if (timer) {
    clearTimeout(timer);
  }

  timer = setTimeout(() => {
    const result = spawnSync(process.execPath, [path.join(projectRoot, 'scripts', 'auto-sync.js'), '--commit', '--push', '--deploy'], {
      cwd: projectRoot,
      stdio: 'inherit'
    });

    if (result.status !== 0) {
      console.error(JSON.stringify({ status: 'WATCH_ERROR', message: 'Auto-sync cycle failed.' }, null, 2));
    }
  }, DEBOUNCE_MS);
}

const watcher = fs.watch(projectRoot, { recursive: true }, (eventType, filename) => {
  if (!filename) {
    return;
  }

  const relative = normalizeRelative(filename);
  if (isIgnoredRelative(relative)) {
    return;
  }

  scheduleSync();
});

console.log(JSON.stringify({ status: 'WATCHING', root: projectRoot, message: 'Monitoring repository for relevant changes.' }, null, 2));

process.on('SIGINT', () => {
  watcher.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  watcher.close();
  process.exit(0);
});

setInterval(() => undefined, 60000).unref();

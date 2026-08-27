'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const requiredRuntimeKeys = ['PORT', 'HOST', 'NODE_ENV', 'DEFAULT_APP_ID'];
const requiredDbKeys = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const requiredFtpKeys = ['FTP_SERVER', 'FTP_PORT', 'FTP_USERNAME', 'FTP_PASSWORD', 'FTP_TARGET_DIR', 'FTP_PROTOCOL'];

const allowedEntries = [
  'package.json',
  'package-lock.json',
  'platform',
  'server/server.js',
  'server/bootstrap/server.js',
  'server/config/index.js',
  'server/database/connection.js',
  'server/middleware/input-validation.js',
  'server/api',
  'server/services',
  'app/index.js',
  'app/modules/index.json',
  'app/modules/gps/index.html',
  'app/modules/gps/index.js',
  'app/modules/gps/module.json',
  'apps/neutral-app/app-info.json',
  'apps/neutral-app/index.html',
  'core/php/bootstrap.php',
  'core/php/src',
  'core/php/views',
  'webroot/index.html',
  'webroot/setup.php',
  'webroot/admin.php',
  'webroot/dev.html',
  'webroot/style.css',
  'webroot/master-ui.js',
  'webroot/user-app.js',
  'webroot/api-client.js',
  'webroot/admin-init.js',
  'webroot/admin/common.js',
  'webroot/admin/index.js',
  'webroot/admin/roles-view.js',
  'webroot/admin/settings-view.js',
  'webroot/admin/users-view.js'
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values = {};
  const text = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const sepIndex = line.indexOf('=');
    if (sepIndex === -1) {
      continue;
    }
    const key = line.slice(0, sepIndex).trim();
    const value = line.slice(sepIndex + 1).trim();
    values[key] = value.replace(/^['"]|['"]$/g, '');
  }
  return values;
}

function collectEnv() {
  const envFiles = [
    path.join(projectRoot, '.env'),
    path.join(projectRoot, '.env.local'),
    path.join(projectRoot, '.env.production'),
    path.join(projectRoot, '.env.deploy'),
    '/home/web1819/.env',
    '/home/web1819/public_html/.env',
    '/home/web1819/public_html/index/app/neutral/.env'
  ];

  const merged = {};
  for (const filePath of envFiles) {
    Object.assign(merged, parseEnvFile(filePath));
  }
  Object.assign(merged, process.env);
  return merged;
}

function checkRequiredKeys(label, keys, merged) {
  const anyKeySet = (keySet) => keySet.some((key) => String(merged[key] || '').trim());
  const missing = keys.filter((key) => !String(merged[key] || '').trim());
  const normalized = label === 'database'
    ? { missing: (anyKeySet(['DB_HOST', 'MYSQL_HOST']) && anyKeySet(['DB_NAME', 'MYSQL_DATABASE']) && anyKeySet(['DB_USER', 'MYSQL_USER', 'MYSQL_USERNAME']) && anyKeySet(['DB_PASSWORD', 'MYSQL_PASSWORD'])) ? [] : ['DB_HOST/DB_NAME/DB_USER/DB_PASSWORD'] }
    : { missing };
  return { label, missing: normalized.missing, ok: normalized.missing.length === 0 };
}

function checkAllowlist() {
  const missing = allowedEntries.filter((entry) => !fs.existsSync(path.join(projectRoot, entry)));
  return { ok: missing.length === 0, missing };
}

function runDryRun() {
  const result = spawnSync('node', ['scripts/manual-ftps-deploy.js', '--dry-run'], {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  return {
    ok: result.status === 0,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    code: result.status
  };
}

function main() {
  const merged = collectEnv();
  const checks = [
    checkRequiredKeys('runtime', requiredRuntimeKeys, merged),
    checkRequiredKeys('database', requiredDbKeys, merged),
    checkRequiredKeys('ftp', requiredFtpKeys, merged)
  ];

  const allowlist = checkAllowlist();
  const dryRun = runDryRun();

  const failures = checks.filter((item) => !item.ok).map((item) => ({
    label: item.label,
    missing: item.missing
  }));

  const payload = {
    status: failures.length === 0 && allowlist.ok && dryRun.ok ? 'READY_FOR_C_PANEL_SETUP' : 'BLOCKED',
    checks,
    allowlist,
    dryRun: {
      ok: dryRun.ok,
      code: dryRun.code,
      note: dryRun.ok ? 'Deployment dry-run succeeded.' : 'Deployment dry-run failed. Fix missing configuration or runtime state before live deployment.'
    },
    summary: {
      runtimeEnvReady: checks[0].ok,
      databaseReady: checks[1].ok,
      ftpReady: checks[2].ok,
      allowlistReady: allowlist.ok,
      dryRunReady: dryRun.ok
    }
  };

  console.log(JSON.stringify(payload, null, 2));

  if (failures.length > 0 || !allowlist.ok || !dryRun.ok) {
    process.exit(1);
  }
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({ status: 'ERROR', message: error.message }, null, 2));
  process.exit(1);
}

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const envFiles = [
  path.join(projectRoot, '.env.ftp.deploy'),
  path.join(projectRoot, '.env.deploy'),
  path.join(projectRoot, '.env.web-app.deploy')
];
const manifestFile = path.join(projectRoot, '.neutral-deploy-manifest.json');
const required = ['FTP_SERVER', 'FTP_PORT', 'FTP_USERNAME', 'FTP_PASSWORD', 'FTP_TARGET_DIR', 'FTP_PROTOCOL'];

const webAppEntries = [
  'webroot/index.html',
  'webroot/style.css',
  'webroot/user-app.js',
  'webroot/api-client.js',
  'platform'
];

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
  'webroot/diagnose.php',
  'webroot/admin.php',
  'webroot/dev.html',
  'webroot/style.css',
  'webroot/master-ui.js',
  'webroot/user-app.js',
  'webroot/api-client.js',
  'webroot/admin-init.js',
  'webroot/admin/common.js',
  'webroot/admin/index.js',
  'webroot/admin/audit-view.js',
  'webroot/admin/modules-view.js',
  'webroot/admin/roles-view.js',
  'webroot/admin/settings-view.js',
  'webroot/admin/users-view.js',
  'webroot/api/.htaccess',
  'webroot/api'
];

const explicitCleanupTargets = [
  '/webroot/admin.html',
  '/webroot/setup.html'
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

function normalizeManifestPath(filePath) {
  return String(filePath || '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\//, '');
}

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function readDeploymentManifest(filePath = manifestFile) {
  if (!fs.existsSync(filePath)) {
    return { version: 1, generatedAt: null, files: {} };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!parsed || typeof parsed !== 'object') {
      return { version: 1, generatedAt: null, files: {} };
    }

    const files = parsed.files && typeof parsed.files === 'object' ? parsed.files : {};
    return {
      version: Number(parsed.version || 1),
      generatedAt: parsed.generatedAt || null,
      files
    };
  } catch (error) {
    return { version: 1, generatedAt: null, files: {} };
  }
}

function writeDeploymentManifest(manifest, filePath = manifestFile) {
  fs.writeFileSync(filePath, JSON.stringify({
    version: 1,
    generatedAt: new Date().toISOString(),
    files: manifest
  }, null, 2) + '\n');
}

function collectManifestFiles(dir) {
  const files = {};

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      const relativePath = normalizeManifestPath(path.relative(dir, fullPath));
      const fileStat = fs.statSync(fullPath);
      files[relativePath] = {
        path: relativePath,
        hash: hashFile(fullPath),
        size: fileStat.size
      };
    }
  }

  walk(dir);
  return files;
}

function compareDeploymentFiles(previousFiles, currentFiles) {
  const previousKeys = Object.keys(previousFiles || {});
  const currentKeys = Object.keys(currentFiles || {});

  const upload = [];
  const update = [];
  const deleteCandidates = [];
  const keep = [];

  for (const key of currentKeys) {
    if (!previousFiles[key]) {
      upload.push(key);
      continue;
    }

    if (previousFiles[key].hash !== currentFiles[key].hash) {
      update.push(key);
      continue;
    }

    keep.push(key);
  }

  for (const key of previousKeys) {
    if (!currentFiles[key]) {
      deleteCandidates.push(key);
    }
  }

  return { upload: upload.sort(), update: update.sort(), deleteCandidates: deleteCandidates.sort(), keep: keep.sort() };
}

function buildRemoteDeleteTargets(deleteCandidates, ftpTargetDir) {
  const base = String(ftpTargetDir || '/').replace(/\\/g, '/');
  const normalizedBase = base === '/' ? '' : base.replace(/\/+$/, '');

  return deleteCandidates.map((fileRelativePath) => {
    const value = normalizeManifestPath(fileRelativePath);
    const remotePath = `${normalizedBase}/${value}`.replace(/\/+/g, '/');
    return remotePath === '' ? '/' : remotePath;
  });
}

function getConfig(mode = 'server') {
  const envChain = mode === 'web-app'
    ? [
        path.join(projectRoot, '.env.web-app.deploy'),
        path.join(projectRoot, '.env.ftp.deploy'),
        path.join(projectRoot, '.env.deploy')
      ]
    : [
        path.join(projectRoot, '.env.ftp.deploy'),
        path.join(projectRoot, '.env.deploy')
      ];

  const parsed = {};
  for (const envFile of envChain) {
    Object.assign(parsed, parseEnvFile(envFile));
  }

  const merged = { ...parsed, ...process.env };
  const normalized = {};

  const serverConfig = {
    FTP_SERVER: merged.FTP_SERVER || merged.FTP_HOST || merged.SERVER_FTP_HOST || '',
    FTP_PORT: merged.FTP_PORT || merged.SERVER_FTP_PORT || '21',
    FTP_USERNAME: merged.FTP_USERNAME || merged.FTP_USER || merged.SERVER_FTP_USER || '',
    FTP_PASSWORD: merged.FTP_PASSWORD || merged.SERVER_FTP_PASSWORD || '',
    FTP_TARGET_DIR: merged.FTP_TARGET_DIR || merged.SERVER_FTP_TARGET_DIR || '/',
    FTP_PROTOCOL: (merged.FTP_PROTOCOL || merged.SERVER_FTP_PROTOCOL || 'ftps').toLowerCase()
  };

  const webAppProtocol = String(merged.WEB_APP_FTP_MODE || merged.WEB_APP_PROTOCOL || 'ftps').toLowerCase();
  const webAppConfig = {
    FTP_SERVER: merged.WEB_APP_FTP_HOST || merged.WEB_APP_FTP_SERVER || merged.FTP_HOST || '',
    FTP_PORT: merged.WEB_APP_FTP_PORT || merged.FTP_PORT || '21',
    FTP_USERNAME: merged.WEB_APP_FTP_USER || merged.WEB_APP_FTP_USERNAME || merged.FTP_USER || '',
    FTP_PASSWORD: merged.WEB_APP_FTP_PASSWORD || merged.WEB_APP_FTP_PASS || merged.FTP_PASSWORD || '',
    FTP_TARGET_DIR: merged.WEB_APP_FTP_PATH || merged.WEB_APP_FTP_ROOT || '/',
    FTP_PROTOCOL: webAppProtocol === 'explicit' || webAppProtocol === 'ftps' ? 'ftps' : webAppProtocol === 'implicit' ? 'implicit' : 'ftps'
  };

  const activeConfig = mode === 'web-app' ? webAppConfig : serverConfig;
  for (const key of required) {
    normalized[key] = String(activeConfig[key] || '').trim();
  }

  normalized.FTP_TARGET_DIR = normalized.FTP_TARGET_DIR || '/';
  normalized.FTP_PROTOCOL = (normalized.FTP_PROTOCOL || 'ftps').toLowerCase();
  return normalized;
}

function copyDirectory(srcDir, destDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  fs.mkdirSync(destDir, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
      continue;
    }
    fs.copyFileSync(srcPath, destPath);
  }
}

function getAllowedEntries(mode = 'server') {
  return mode === 'web-app' ? webAppEntries : allowedEntries;
}

function buildStagingTree(mode = 'server') {
  const stagingRoot = path.join(projectRoot, '.deploy-staging');
  fs.rmSync(stagingRoot, { recursive: true, force: true });
  fs.mkdirSync(stagingRoot, { recursive: true });

  const missing = [];
  const entries = getAllowedEntries(mode);

  for (const entry of entries) {
    const sourcePath = path.join(projectRoot, entry);
    if (!fs.existsSync(sourcePath)) {
      missing.push(entry);
      continue;
    }

    let targetName = entry;
    if (mode === 'web-app') {
      const mappedName = {
        'webroot/index.html': 'index.html',
        'webroot/style.css': 'style.css',
        'webroot/user-app.js': 'user-app.js',
        'webroot/api-client.js': 'api-client.js',
        'platform': 'platform'
      }[entry] || path.basename(entry);
      targetName = mappedName;
    }

    const targetPath = path.join(stagingRoot, targetName);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    const stat = fs.statSync(sourcePath);
    if (stat.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }

  return { stagingRoot, missing };
}

function ensureLftpInstalled() {
  const output = spawnSync('lftp', ['--version'], { stdio: 'ignore' });
  if (output.status === 0) {
    return;
  }

  const install = spawnSync('sudo', ['apt-get', 'update'], { stdio: 'inherit' });
  if (install.status !== 0) {
    throw new Error('lftp installation failed');
  }

  const installLftp = spawnSync('sudo', ['apt-get', 'install', '-y', 'lftp'], { stdio: 'inherit' });
  if (installLftp.status !== 0) {
    throw new Error('could not install lftp');
  }
}

function runManualDeploy(stagingRoot, config, diff = { upload: [], update: [], deleteCandidates: [], keep: [] }) {
  ensureLftpInstalled();

  const deleteTargets = buildRemoteDeleteTargets(diff.deleteCandidates, config.FTP_TARGET_DIR);
  const mergedDeleteTargets = Array.from(new Set([...deleteTargets, ...explicitCleanupTargets]));
  const deleteCommands = mergedDeleteTargets.map((target) => `rm -f "${target}"`).join('\n');

  const commandScript = [
    'set cmd:fail-exit true',
    'set net:timeout 30',
    'set net:max-retries 1',
    `set ftp:ssl-force ${config.FTP_PROTOCOL === 'ftps' ? 'true' : 'false'}`,
    'set ftp:ssl-protect-data true',
    'set ssl:verify-certificate no',
    `open -u ${config.FTP_USERNAME},${config.FTP_PASSWORD} -p ${config.FTP_PORT} ${config.FTP_SERVER}`,
    `mirror -R --only-newer --verbose --parallel=1 --no-perms --exclude-glob .env --exclude-glob app-node-test --exclude-glob app-node-test/** ${stagingRoot} ${config.FTP_TARGET_DIR}`,
    deleteCommands ? deleteCommands : '',
    'bye'
  ].filter(Boolean).join('\n');

  const result = spawnSync('lftp', ['-e', commandScript], {
    stdio: 'inherit',
    shell: false
  });

  if (result.status !== 0) {
    throw new Error('manual FTPS deploy failed');
  }
}

function printHelp() {
  console.log(`Usage: node scripts/manual-ftps-deploy.js [--dry-run] [--server|--web-app]\n\nCreates a staging directory containing only the allowlisted production files and uploads only changed/newer files to the remote server.\n`);
}

function main() {
  const args = new Set(process.argv.slice(2));

  if (args.has('--help') || args.has('-h')) {
    printHelp();
    return;
  }

  const mode = args.has('--web-app') ? 'web-app' : 'server';
  const dryRun = args.has('--dry-run') || args.has('--preview');
  const config = getConfig(mode);
  const missingConfig = required.filter((key) => !String(config[key] || '').trim());

  if (!dryRun && missingConfig.length > 0) {
    console.error(JSON.stringify({ status: 'ERROR', mode, missingConfig, message: `Set values in .env.deploy/.env.web-app.deploy or environment variables before deploying ${mode}.` }, null, 2));
    process.exit(1);
  }

  const { stagingRoot, missing } = buildStagingTree(mode);
  const stagedFiles = [];
  const currentManifestFiles = collectManifestFiles(stagingRoot);
  const previousManifest = readDeploymentManifest();
  const diff = compareDeploymentFiles(previousManifest.files || {}, currentManifestFiles);

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      stagedFiles.push(path.relative(stagingRoot, fullPath).split(path.sep).join('/'));
    }
  }

  walk(stagingRoot);

  const output = {
    status: dryRun ? 'DRY_RUN' : 'READY',
    mode,
    stagingDir: stagingRoot,
    filesQueued: stagedFiles.length,
    files: stagedFiles.sort(),
    missingAllowlistEntries: missing,
    transferTarget: config.FTP_TARGET_DIR || '/',
    ftpProtocol: config.FTP_PROTOCOL || 'ftps',
    upload: diff.upload,
    update: diff.update,
    delete: diff.deleteCandidates,
    keep: diff.keep,
    manifestPath: manifestFile,
    note: dryRun ? 'Dry run only: no upload or cleanup was executed.' : 'Only new, updated, and obsolete Neutral-managed files are handled in this deploy.'
  };

  console.log(JSON.stringify(output, null, 2));

  if (dryRun) {
    return;
  }

  runManualDeploy(stagingRoot, config, diff);
  writeDeploymentManifest(currentManifestFiles, manifestFile);
  console.log(JSON.stringify({ status: 'OK', uploaded: diff.upload.length + diff.update.length, deleted: diff.deleteCandidates.length, kept: diff.keep.length }, null, 2));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(JSON.stringify({ status: 'ERROR', message: error.message }, null, 2));
    process.exit(1);
  }
}

module.exports = {
  allowedEntries,
  webAppEntries,
  getAllowedEntries,
  buildStagingTree,
  buildRemoteDeleteTargets,
  collectManifestFiles,
  compareDeploymentFiles,
  readDeploymentManifest,
  writeDeploymentManifest,
  normalizeManifestPath,
  getConfig
};

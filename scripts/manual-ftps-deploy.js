'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const {
  PACKAGE_FORMAT,
  REQUIRED_ENTRIES,
  buildProductionPackage
} = require('./lib/portable-install.js');

const projectRoot = path.resolve(__dirname, '..');
const envFiles = [
  path.join(projectRoot, '.env.ftp.deploy'),
  path.join(projectRoot, '.env.deploy')
];
const manifestFile = path.join(projectRoot, '.neutral-deploy-manifest.json');
const required = ['FTP_SERVER', 'FTP_PORT', 'FTP_USERNAME', 'FTP_PASSWORD', 'FTP_TARGET_DIR', 'FTP_PROTOCOL'];

const allowedEntries = [...REQUIRED_ENTRIES];

const CONTROL_CHARACTERS = /\p{Cc}/u;
const TARGET_FINGERPRINT_PATTERN = /^[a-f0-9]{64}$/;

function parseBooleanSetting(value, defaultValue = true) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  throw new Error('Invalid boolean setting');
}

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
  if (
    typeof filePath !== 'string' ||
    filePath === '' ||
    CONTROL_CHARACTERS.test(filePath) ||
    filePath.includes('\\') ||
    filePath.startsWith('/') ||
    /^[A-Za-z]:/.test(filePath)
  ) {
    throw new Error('Invalid deployment manifest path');
  }

  const segments = filePath.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    throw new Error('Invalid deployment manifest path');
  }
  return filePath;
}

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function readDeploymentManifest(filePath = manifestFile) {
  if (!fs.existsSync(filePath)) {
    return { version: 2, generatedAt: null, targetFingerprint: null, files: {} };
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error('Invalid deployment manifest JSON');
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    ![1, 2].includes(parsed.version) ||
    !parsed.files ||
    typeof parsed.files !== 'object' ||
    Array.isArray(parsed.files)
  ) {
    throw new Error('Invalid deployment manifest schema');
  }
  if (parsed.version === 2 && !TARGET_FINGERPRINT_PATTERN.test(parsed.targetFingerprint)) {
    throw new Error('Invalid deployment manifest target fingerprint');
  }

  for (const [fileKey, file] of Object.entries(parsed.files)) {
    const normalizedPath = normalizeManifestPath(fileKey);
    if (!file || typeof file !== 'object' || file.path !== normalizedPath) {
      throw new Error('Invalid deployment manifest path entry');
    }
  }

  return {
    version: parsed.version,
    generatedAt: parsed.generatedAt || null,
    targetFingerprint: parsed.version === 2 ? parsed.targetFingerprint : null,
    files: parsed.files
  };
}

function writeDeploymentManifest(manifest, targetFingerprint, filePath = manifestFile) {
  if (!TARGET_FINGERPRINT_PATTERN.test(targetFingerprint)) {
    throw new Error('Invalid deployment manifest target fingerprint');
  }
  for (const [fileKey, file] of Object.entries(manifest)) {
    const normalizedPath = normalizeManifestPath(fileKey);
    if (!file || file.path !== normalizedPath) {
      throw new Error('Invalid deployment manifest path entry');
    }
  }
  fs.writeFileSync(filePath, JSON.stringify({
    version: 2,
    generatedAt: new Date().toISOString(),
    targetFingerprint,
    files: manifest
  }, null, 2) + '\n');
}

function collectManifestFiles(dir) {
  const files = {};

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error('Invalid deployment manifest path type');
      }
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      const relativePath = normalizeManifestPath(path.relative(dir, fullPath).split(path.sep).join('/'));
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

  for (const filePath of [...previousKeys, ...currentKeys]) {
    normalizeManifestPath(filePath);
  }

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
  const normalizedBase = normalizeFtpTargetDir(ftpTargetDir);

  return deleteCandidates.map((fileRelativePath) => {
    const value = normalizeManifestPath(fileRelativePath);
    return joinFtpTarget(normalizedBase, value);
  });
}

function buildCleanupTargets(deleteCandidates, ftpTargetDir) {
  return Array.from(new Set(buildRemoteDeleteTargets(deleteCandidates, ftpTargetDir)));
}

function normalizeFtpTargetDir(value) {
  if (
    typeof value !== 'string' ||
    value === '' ||
    CONTROL_CHARACTERS.test(value) ||
    value.includes('\\') ||
    !value.startsWith('/')
  ) {
    throw new Error('Invalid FTP configuration: FTP_TARGET_DIR');
  }

  const normalized = value === '/' ? '/' : value.replace(/\/+$/, '');
  if (normalized === '/') {
    return normalized;
  }
  const segments = normalized.slice(1).split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    throw new Error('Invalid FTP configuration: FTP_TARGET_DIR');
  }
  return normalized;
}

function joinFtpTarget(base, relativePath) {
  return base === '/' ? `/${relativePath}` : `${base}/${relativePath}`;
}

function validateConfig(config, options = {}) {
  if (!config || typeof config !== 'object') {
    throw new Error('Invalid FTP configuration');
  }

  const allowMissing = options.allowMissing === true;
  const normalized = { ...config };
  for (const key of ['FTP_SERVER', 'FTP_USERNAME', 'FTP_PASSWORD']) {
    if (
      typeof normalized[key] !== 'string' ||
      CONTROL_CHARACTERS.test(normalized[key]) ||
      (normalized[key].trim() === '' && (!allowMissing || normalized[key] !== ''))
    ) {
      throw new Error(`Invalid FTP configuration: ${key}`);
    }
  }

  normalized.FTP_PORT = String(normalized.FTP_PORT ?? '');
  if (allowMissing && normalized.FTP_PORT === '') {
    // A dry run can inspect a package without connection credentials.
  } else if (!/^\d+$/.test(normalized.FTP_PORT)) {
    throw new Error('Invalid FTP configuration: FTP_PORT');
  } else {
    const port = Number(normalized.FTP_PORT);
    if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
      throw new Error('Invalid FTP configuration: FTP_PORT');
    }
  }

  normalized.FTP_PROTOCOL = String(normalized.FTP_PROTOCOL ?? '').toLowerCase();
  if (!['ftp', 'ftps'].includes(normalized.FTP_PROTOCOL)) {
    throw new Error('Invalid FTP configuration: FTP_PROTOCOL');
  }
  if (allowMissing && normalized.FTP_TARGET_DIR === '') {
    normalized.FTP_TARGET_DIR = '';
  } else {
    normalized.FTP_TARGET_DIR = normalizeFtpTargetDir(normalized.FTP_TARGET_DIR);
  }
  try {
    normalized.FTP_SSL_CHECK_HOSTNAME = parseBooleanSetting(normalized.FTP_SSL_CHECK_HOSTNAME, true);
  } catch (error) {
    throw new Error('Invalid FTP configuration: FTP_SSL_CHECK_HOSTNAME');
  }
  if (!normalized.FTP_SSL_CHECK_HOSTNAME) {
    throw new Error('Invalid FTP configuration: FTP_SSL_CHECK_HOSTNAME must be true');
  }
  return normalized;
}

function quoteLftp(value) {
  const text = String(value);
  if (CONTROL_CHARACTERS.test(text)) {
    throw new Error('Invalid lftp value: control character');
  }
  return `"${text.replace(/[\\"$`]/g, (character) => `\\${character}`)}"`;
}

function getConfig() {
  const parsed = {};
  for (const envFile of envFiles) {
    Object.assign(parsed, parseEnvFile(envFile));
  }

  const merged = { ...parsed, ...process.env };
  const normalized = {};
  for (const key of required) {
    normalized[key] = String(merged[key] ?? '');
  }

  normalized.FTP_PROTOCOL = (normalized.FTP_PROTOCOL || 'ftps').toLowerCase();
  normalized.FTP_SSL_CHECK_HOSTNAME = merged.FTP_SSL_CHECK_HOSTNAME;
  return validateConfig(normalized, { allowMissing: true });
}

function buildStagingTree(options = {}) {
  const sourceRoot = path.resolve(options.sourceRoot || projectRoot);
  const outputDir = path.resolve(options.outputDir || path.join(projectRoot, 'dist', 'neutral-production'));
  const result = buildProductionPackage({
    sourceRoot,
    outputDir,
    basePath: options.basePath ?? process.env.NEUTRAL_BASE_PATH ?? ''
  });

  return { stagingRoot: result.outputDir, packageManifest: result.manifest, missing: [] };
}

function deploymentTargetFingerprint(config, packageFormat = PACKAGE_FORMAT) {
  const normalized = validateConfig(config);
  if (typeof packageFormat !== 'string' || packageFormat === '' || CONTROL_CHARACTERS.test(packageFormat)) {
    throw new Error('Invalid deployment package format');
  }

  const components = [
    normalized.FTP_PROTOCOL,
    normalized.FTP_SERVER,
    normalized.FTP_PORT,
    normalized.FTP_USERNAME,
    normalized.FTP_TARGET_DIR,
    packageFormat
  ];
  return crypto.createHash('sha256').update(JSON.stringify(components)).digest('hex');
}

function selectPreviousDeploymentFiles(previousManifest, targetFingerprint) {
  if (!TARGET_FINGERPRINT_PATTERN.test(targetFingerprint)) {
    throw new Error('Invalid deployment target fingerprint');
  }
  if (
    !previousManifest ||
    previousManifest.version !== 2 ||
    previousManifest.targetFingerprint !== targetFingerprint ||
    !previousManifest.files ||
    typeof previousManifest.files !== 'object' ||
    Array.isArray(previousManifest.files)
  ) {
    return {};
  }
  return previousManifest.files;
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

async function runManualDeploy(stagingRoot, config, diff = { upload: [], update: [], deleteCandidates: [], keep: [] }) {
  const validatedConfig = validateConfig(config);
  ensureLftpInstalled();

  const commandScript = buildLftpCommandScript(stagingRoot, validatedConfig, diff);
  await runLftpScript(commandScript);
}

function runLftpScript(commandScript, spawnProcess = spawn) {
  return new Promise((resolve, reject) => {
    const child = spawnProcess('lftp', [], {
      shell: false,
      stdio: ['pipe', 'inherit', 'inherit']
    });
    let settled = false;
    const finish = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    child.once('error', () => finish(new Error('manual FTPS deploy failed')));
    child.once('close', (status) => {
      finish(status === 0 ? null : new Error('manual FTPS deploy failed'));
    });
    child.stdin.once('error', () => finish(new Error('manual FTPS deploy failed')));
    child.stdin.end(`${commandScript}\n`);
  });
}

function buildLftpCommandScript(stagingRoot, config, diff = { upload: [], update: [], deleteCandidates: [], keep: [] }) {
  const validatedConfig = validateConfig(config);
  const deleteCommands = buildCleanupTargets(
    diff.deleteCandidates || [],
    validatedConfig.FTP_TARGET_DIR
  ).map((target) => `rm -f ${quoteLftp(target)}`).join('\n');
  const stagingPath = toLftpPath(stagingRoot);
  const htaccessTarget = joinFtpTarget(validatedConfig.FTP_TARGET_DIR, '.htaccess');

  return [
    'set cmd:fail-exit true',
    'set net:timeout 30',
    'set net:max-retries 1',
    `set ftp:ssl-force ${quoteLftp(validatedConfig.FTP_PROTOCOL === 'ftps' ? 'true' : 'false')}`,
    'set ftp:ssl-protect-data true',
    `set ssl:check-hostname ${quoteLftp('true')}`,
    'set ssl:verify-certificate true',
    `open -u ${quoteLftp(validatedConfig.FTP_USERNAME)},${quoteLftp(validatedConfig.FTP_PASSWORD)} -p ${quoteLftp(validatedConfig.FTP_PORT)} ${quoteLftp(validatedConfig.FTP_SERVER)}`,
    `mirror -R --verbose --parallel=1 --no-perms --exclude-glob .env --exclude-glob app-node-test --exclude-glob app-node-test/** ${quoteLftp(stagingPath)} ${quoteLftp(validatedConfig.FTP_TARGET_DIR)}`,
    `put ${quoteLftp(`${stagingPath}/.htaccess`)} -o ${quoteLftp(htaccessTarget)}`,
    deleteCommands,
    'bye'
  ].filter(Boolean).join('\n');
}

function toLftpPath(filePath) {
  return path.resolve(filePath).split(path.sep).join('/').replace(/\/$/, '');
}

function printHelp() {
  console.log(`Usage: node scripts/manual-ftps-deploy.js [--dry-run]\n\nBuilds and fully transfers the verified production package. Set NEUTRAL_BASE_PATH for a subpath installation.\n`);
}

async function main() {
  const args = new Set(process.argv.slice(2));

  if (args.has('--help') || args.has('-h')) {
    printHelp();
    return;
  }

  const dryRun = args.has('--dry-run') || args.has('--preview');
  const config = getConfig();
  const missingConfig = required.filter((key) => !String(config[key] || '').trim());

  if (!dryRun && missingConfig.length > 0) {
    console.error(JSON.stringify({ status: 'ERROR', missingConfig, message: 'Set values in .env.deploy or environment variables before deploying.' }, null, 2));
    process.exit(1);
  }
  const deployConfig = dryRun ? config : validateConfig(config);

  const { stagingRoot, packageManifest, missing } = buildStagingTree();
  const stagedFiles = [];
  const currentManifestFiles = collectManifestFiles(stagingRoot);
  const previousManifest = readDeploymentManifest();
  const targetFingerprint = missingConfig.length === 0
    ? deploymentTargetFingerprint(deployConfig, packageManifest.packageFormat)
    : null;
  const previousFiles = targetFingerprint
    ? selectPreviousDeploymentFiles(previousManifest, targetFingerprint)
    : {};
  const diff = compareDeploymentFiles(previousFiles, currentManifestFiles);

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
    stagingDir: stagingRoot,
    filesQueued: stagedFiles.length,
    files: stagedFiles.sort(),
    missingAllowlistEntries: missing,
    upload: diff.upload,
    update: diff.update,
    delete: diff.deleteCandidates,
    keep: diff.keep,
    manifestPath: manifestFile,
    note: dryRun ? 'Dry run only: no upload or cleanup was executed.' : 'The verified package is fully transferred; only obsolete files from the same deployment target are removed.'
  };

  console.log(JSON.stringify(output, null, 2));

  if (dryRun) {
    return;
  }

  await runManualDeploy(stagingRoot, deployConfig, diff);
  writeDeploymentManifest(currentManifestFiles, targetFingerprint, manifestFile);
  console.log(JSON.stringify({ status: 'OK', uploaded: diff.upload.length + diff.update.length, deleted: diff.deleteCandidates.length, kept: diff.keep.length }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(JSON.stringify({ status: 'ERROR', message: error.message }, null, 2));
    process.exit(1);
  });
}

module.exports = {
  allowedEntries,
  buildCleanupTargets,
  buildStagingTree,
  buildRemoteDeleteTargets,
  collectManifestFiles,
  compareDeploymentFiles,
  deploymentTargetFingerprint,
  readDeploymentManifest,
  runLftpScript,
  selectPreviousDeploymentFiles,
  writeDeploymentManifest,
  normalizeManifestPath,
  getConfig,
  parseBooleanSetting,
  buildLftpCommandScript,
  quoteLftp,
  validateConfig
};

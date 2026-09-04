#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const APP_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CONTROL_CHARACTER_PATTERN = /\p{Cc}/u;
const SECRET_PATTERNS = [
  { name: 'GitHub access token', pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{20,255}|github_pat_[A-Za-z0-9_]{20,255})\b/ },
  { name: 'AWS access key', pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/ },
  { name: 'Private key', pattern: /-----BEGIN (?:ENCRYPTED |EC |RSA |DSA |OPENSSH )?PRIVATE KEY-----/ }
];
const EMPTY_SECRET_KEYS = new Set([
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'DB_URL',
  'CORE_BOOTSTRAP_USERNAME',
  'CORE_BOOTSTRAP_PASSWORD',
  'SESSION_SECRET',
  'AUTH_TOKEN',
  'ADMIN_ACCESS_TOKEN',
  'NEUTRAL_ADMIN_TOKEN',
  'PROVIDER_SECRET',
  'NEUTRAL_BACKUP_KEY',
  'NEUTRAL_SETUP_RECOVERY_TOKEN'
]);
const VERSIONED_TEST_CANARIES = new Map([
  ['tests/production-package.test.js', [
    `ghp_${'0123456789abcdefghijklmnopqrstuvwxyz'}`,
    `ghp_${'abcdefghijklmnopqrstuvwxyz0123456789'}`,
    ['-----BEGIN', 'ENCRYPTED PRIVATE KEY-----'].join(' ')
  ]],
  ['tests/app-bootstrap.test.js', [
    ['-----BEGIN', 'ENCRYPTED PRIVATE KEY-----'].join(' ')
  ]]
]);

function parseArguments(args) {
  const options = {
    target: undefined,
    appId: undefined,
    appName: undefined,
    includeGps: false,
    initGit: false
  };
  const valueOptions = new Map([
    ['--target', 'target'],
    ['--app-id', 'appId'],
    ['--app-name', 'appName']
  ]);
  const flagOptions = new Map([
    ['--include-gps', 'includeGps'],
    ['--init-git', 'initGit']
  ]);
  const seen = new Set();

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const separator = argument.indexOf('=');
    const optionName = separator === -1 ? argument : argument.slice(0, separator);

    if (seen.has(optionName)) {
      throw new Error(`Duplicate option: ${optionName}`);
    }
    seen.add(optionName);

    if (flagOptions.has(optionName)) {
      if (separator !== -1) {
        throw new Error(`${optionName} does not accept a value`);
      }
      options[flagOptions.get(optionName)] = true;
      continue;
    }

    const key = valueOptions.get(optionName);
    if (!key) {
      throw new Error(`Unknown option: ${argument}`);
    }

    let value;
    if (separator !== -1) {
      value = argument.slice(separator + 1);
    } else {
      if (index + 1 >= args.length || args[index + 1].startsWith('--')) {
        throw new Error(`Missing value for ${optionName}`);
      }
      value = args[index + 1];
      index += 1;
    }
    options[key] = value;
  }

  return options;
}

function validateOptions(options) {
  if (typeof options.target !== 'string' || options.target === '' || CONTROL_CHARACTER_PATTERN.test(options.target)) {
    throw new Error('Target directory is required and must not contain control characters');
  }
  if (typeof options.appId !== 'string' || !APP_ID_PATTERN.test(options.appId)) {
    throw new Error('App ID must match ^[a-z0-9]+(?:-[a-z0-9]+)*$');
  }
  const appNameLength = typeof options.appName === 'string' ? Array.from(options.appName).length : 0;
  if (appNameLength < 1 || appNameLength > 80 || CONTROL_CHARACTER_PATTERN.test(options.appName)) {
    throw new Error('App name must contain 1-80 characters and no control characters');
  }
  if (SECRET_PATTERNS.some((rule) => rule.pattern.test(options.appName))) {
    throw new Error('App name must not contain secret-shaped values');
  }
}

function normalizeRepositoryPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function isExcludedSourcePath(relativePath) {
  const normalized = normalizeRepositoryPath(relativePath);
  const parts = normalized.split('/');
  const lowerParts = parts.map((part) => part.toLowerCase());
  const name = parts.at(-1);
  const lowerName = name.toLowerCase();

  if (normalized === '.env.example' || normalized === '.env.ftp.deploy.example') return false;
  if (/^\.env(?:\.|$)/i.test(name)) return true;
  if (lowerParts.some((part) => [
    '.git', '.svn', 'node_modules', 'dist', 'runtime', '.worktrees', '.superpowers',
    'coverage', '.nyc_output', 'test-results'
  ].includes(part))) return true;
  if (lowerParts.includes('.deploy-staging')) return true;
  if (lowerName === '.neutral-deploy-manifest.json') return true;
  if (/\.(?:log|lcov|tmp|temp)$/i.test(name)) return true;
  if (/(?:~|\.(?:bak|backup|old|orig))$/i.test(name)) return true;
  if (/\.(?:key|pem|p12|pfx|jks)$/i.test(name)) return true;
  if (/^(?:credentials|secrets?)(?:\.|$)/i.test(name)) return true;
  return false;
}

function listVersionedFiles(sourceRoot) {
  const result = spawnSync('git', ['ls-files', '--cached', '-z'], {
    cwd: sourceRoot,
    encoding: 'buffer',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (result.status !== 0) {
    throw new Error('A clean Git checkout is required to enumerate versioned source files');
  }

  return result.stdout.toString('utf8')
    .split('\0')
    .filter(Boolean)
    .filter((relativePath) => !isExcludedSourcePath(relativePath))
    .sort();
}

function assertCleanTrackedSource(sourceRoot) {
  const result = spawnSync('git', ['status', '--porcelain', '--untracked-files=no'], {
    cwd: sourceRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (result.status !== 0) {
    throw new Error('A clean Git checkout is required to inspect tracked source files');
  }
  if (result.stdout !== '') {
    throw new Error('A clean Git checkout without tracked changes is required');
  }
}

function assertTargetAvailable(target) {
  const targetStat = fs.lstatSync(target, { throwIfNoEntry: false });
  if (!targetStat) return { existed: false };
  if (targetStat.isSymbolicLink()) {
    throw new Error('Target must not be a symbolic link');
  }
  if (!targetStat.isDirectory()) {
    throw new Error('Target must be an empty directory or must not exist');
  }
  if (fs.readdirSync(target).length !== 0) {
    throw new Error('Target directory must be empty');
  }
  return { existed: true };
}

function copyVersionedFiles(sourceRoot, stagingRoot, files) {
  for (const relativePath of files) {
    const sourcePath = path.join(sourceRoot, relativePath);
    const targetPath = path.join(stagingRoot, relativePath);
    const sourceStat = fs.lstatSync(sourcePath);
    if (!sourceStat.isFile()) {
      throw new Error(`Versioned source path is not a regular file: ${relativePath}`);
    }
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
    fs.chmodSync(targetPath, sourceStat.mode & 0o777);
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function replaceRequired(content, searchValue, replacement, relativePath) {
  if (!content.includes(searchValue)) {
    throw new Error(`Expected application metadata was not found in ${relativePath}`);
  }
  return content.replaceAll(searchValue, replacement);
}

function replaceRequiredPattern(content, pattern, replacement, relativePath) {
  if (!pattern.test(content)) {
    throw new Error(`Expected application metadata was not found in ${relativePath}`);
  }
  return content.replace(pattern, replacement);
}

function singleQuotedJavaScriptString(value) {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function updateEnvironment(stagingRoot, appId, appName) {
  const environmentPath = path.join(stagingRoot, '.env.example');
  const lines = fs.readFileSync(environmentPath, 'utf8').split(/\r?\n/);
  const found = new Set();
  const updated = lines.map((line) => {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match) return line;
    const [, key] = match;
    if (key === 'APP_ID') {
      found.add(key);
      return `APP_ID=${appId}`;
    }
    if (key === 'APP_NAME') {
      found.add(key);
      return `APP_NAME='${appName}'`;
    }
    if (EMPTY_SECRET_KEYS.has(key)) return `${key}=`;
    return line;
  });
  if (!found.has('APP_ID') || !found.has('APP_NAME')) {
    throw new Error('.env.example must define APP_ID and APP_NAME');
  }
  fs.writeFileSync(environmentPath, updated.join('\n'));
}

function updateApplicationMetadata(stagingRoot, appId, appName) {
  const appsRoot = path.join(stagingRoot, 'Web-App/apps');
  const applicationDirectories = fs.readdirSync(appsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(appsRoot, entry.name, 'app-info.json')));
  if (applicationDirectories.length !== 1) {
    throw new Error('Expected exactly one Web-App application metadata directory');
  }
  const oldAppRoot = path.join(appsRoot, applicationDirectories[0].name);
  const newAppRoot = path.join(stagingRoot, 'Web-App/apps', appId);
  if (oldAppRoot !== newAppRoot) fs.renameSync(oldAppRoot, newAppRoot);

  const appInfoPath = path.join(newAppRoot, 'app-info.json');
  const appInfo = JSON.parse(fs.readFileSync(appInfoPath, 'utf8'));
  const sourceAppId = appInfo.id;
  const sourceAppName = appInfo.name;
  if (typeof sourceAppId !== 'string' || !APP_ID_PATTERN.test(sourceAppId) || typeof sourceAppName !== 'string') {
    throw new Error('Current Web-App application metadata is invalid');
  }
  appInfo.id = appId;
  appInfo.name = appName;
  appInfo.description = `${appName} application shell based on Neutral.`;
  writeJson(appInfoPath, appInfo);

  const packagePath = path.join(stagingRoot, 'package.json');
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageData.name = appId;
  packageData.description = `${appName} application based on Neutral.`;
  writeJson(packagePath, packageData);

  const packageLockPath = path.join(stagingRoot, 'package-lock.json');
  if (fs.existsSync(packageLockPath)) {
    const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
    packageLock.name = appId;
    if (packageLock.packages && packageLock.packages['']) packageLock.packages[''].name = appId;
    writeJson(packageLockPath, packageLock);
  }

  updateEnvironment(stagingRoot, appId, appName);

  const shellPath = path.join(stagingRoot, 'Web-App/app/index.js');
  let shell = fs.readFileSync(shellPath, 'utf8');
  shell = replaceRequired(shell, `name: '${sourceAppId}-shell'`, `name: '${appId}-shell'`, 'Web-App/app/index.js');
  shell = replaceRequired(shell, `appId: context.appId || '${sourceAppId}'`, `appId: context.appId || '${appId}'`, 'Web-App/app/index.js');
  shell = replaceRequiredPattern(
    shell,
    /name: context\.name \|\| (?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/,
    `name: context.name || ${JSON.stringify(appName)}`,
    'Web-App/app/index.js'
  );
  fs.writeFileSync(shellPath, shell);

  const indexPath = path.join(stagingRoot, 'Web-App/public/index.html');
  let indexHtml = fs.readFileSync(indexPath, 'utf8');
  indexHtml = replaceRequiredPattern(indexHtml, /<title data-app-title>[^<]*<\/title>/, `<title data-app-title>${escapeHtml(appName)}</title>`, 'Web-App/public/index.html');
  fs.writeFileSync(indexPath, indexHtml);

  const configPath = path.join(stagingRoot, 'Web-App/core/config-manager.js');
  let config = fs.readFileSync(configPath, 'utf8');
  config = replaceRequiredPattern(
    config,
    /(this\.set\('app',\s*\{\s*name:\s*)(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/,
    `$1${JSON.stringify(appName)}`,
    'Web-App/core/config-manager.js'
  );
  fs.writeFileSync(configPath, config);

  updateOperationalDefaults(stagingRoot, sourceAppId, sourceAppName, appId, appName);
}

function updateOperationalDefaults(stagingRoot, sourceAppId, sourceAppName, appId, appName) {
  const files = [
    'Server/node/bootstrap/server.js',
    'Server/node/services/persistence-service.js',
    'Server/node/services/settings-service.js',
    'Server/php/src/AppConfig.php',
    'Server/php/src/Phase4AuthRbac.php',
    'Server/php/src/Phase6AdminStorage.php',
    'Web-App/core/core-admin.js',
    'Web-App/core/master-framework.js',
    'Web-App/public/admin/index.js',
    'Web-App/public/admin/settings-view.js',
    'Web-App/public/master-ui.js',
    'Web-App/public/user-app.js'
  ];
  const sourceIds = new Set([sourceAppId, 'neutral-app']);
  const sourceNames = new Set([sourceAppName, 'Neutral App', 'Neutral Platform']);

  for (const relativePath of files) {
    const filePath = path.join(stagingRoot, relativePath);
    const replacementId = relativePath.endsWith('.php') ? singleQuotedJavaScriptString(appId) : JSON.stringify(appId);
    const replacementName = relativePath.endsWith('.php') ? singleQuotedJavaScriptString(appName) : JSON.stringify(appName);
    let content = fs.readFileSync(filePath, 'utf8');
    for (const sourceId of sourceIds) {
      content = content
        .replaceAll(JSON.stringify(sourceId), replacementId)
        .replaceAll(`'${sourceId}'`, replacementId);
    }
    for (const sourceName of sourceNames) {
      content = content
        .replaceAll(JSON.stringify(sourceName), replacementName)
        .replaceAll(singleQuotedJavaScriptString(sourceName), replacementName);
    }
    fs.writeFileSync(filePath, content);
  }
}

function configureGps(stagingRoot, appId, includeGps) {
  const gpsRoot = path.join(stagingRoot, 'Web-App/app/modules/gps');
  const gpsServerRoot = path.join(stagingRoot, 'Server/php/modules/gps');
  const referenceNotesRoot = path.join(stagingRoot, 'Web-App/app/modules/reference-notes');
  const referenceNotesServerRoot = path.join(stagingRoot, 'Server/php/modules/reference-notes');
  const catalogPath = path.join(stagingRoot, 'Web-App/app/modules/index.json');
  const appInfoPath = path.join(stagingRoot, 'Web-App/apps', appId, 'app-info.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const appInfo = JSON.parse(fs.readFileSync(appInfoPath, 'utf8'));
  if (!Array.isArray(catalog)) throw new Error('Module catalog must be an array');
  fs.rmSync(referenceNotesRoot, { recursive: true, force: true });
  fs.rmSync(referenceNotesServerRoot, { recursive: true, force: true });
  const productCatalog = catalog.filter((module) => module && module.id !== 'reference-notes');

  if (!includeGps) {
    const gpsWasPresent = fs.existsSync(gpsRoot);
    fs.rmSync(gpsRoot, { recursive: true, force: true });
    fs.rmSync(gpsServerRoot, { recursive: true, force: true });
    writeJson(catalogPath, productCatalog.filter((module) => module && module.id !== 'gps'));
    appInfo.modules = [];
    writeJson(appInfoPath, appInfo);
    const workflowPath = path.join(stagingRoot, '.github/workflows/ftp-upload.yml');
    const workflow = fs.readFileSync(workflowPath, 'utf8');
    const gpsCheck = /^\s*test -f "\$STAGING_DIR\/Web-App\/app\/modules\/gps\/module\.json"\r?\n/m;
    if (gpsWasPresent && !gpsCheck.test(workflow)) throw new Error('Expected GPS workflow check is missing');
    fs.writeFileSync(workflowPath, workflow.replace(gpsCheck, ''));
    return;
  }

  const gpsEntry = productCatalog.find((module) => module && module.id === 'gps');
  if (!gpsEntry || !fs.existsSync(gpsRoot)) {
    throw new Error('GPS reference module is missing from the source checkout');
  }
  gpsEntry.appId = appId;
  writeJson(catalogPath, productCatalog);
  appInfo.modules = ['gps'];
  writeJson(appInfoPath, appInfo);

  const gpsManifestPath = path.join(gpsRoot, 'module.json');
  const gpsManifest = JSON.parse(fs.readFileSync(gpsManifestPath, 'utf8'));
  gpsManifest.appId = appId;
  writeJson(gpsManifestPath, gpsManifest);
}

function neutralizeDeploymentSmoke(stagingRoot) {
  const workflowPath = path.join(stagingRoot, '.github/workflows/ftp-upload.yml');
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  const publicUrl = /^\s*NEUTRAL_PUBLIC_URL:\s*.*$/m;
  const viewerModules = /^\s*NEUTRAL_SMOKE_VIEWER_MODULES:\s*.*$/m;
  if (!publicUrl.test(workflow) || !viewerModules.test(workflow)) {
    throw new Error('Expected production smoke configuration is missing');
  }
  fs.writeFileSync(
    workflowPath,
    workflow
      .replace(publicUrl, '      NEUTRAL_PUBLIC_URL: ${{ vars.NEUTRAL_PUBLIC_URL }}')
      .replace(viewerModules, "      NEUTRAL_SMOKE_VIEWER_MODULES: ''")
  );
}

function scanForSecrets(stagingRoot) {
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!entry.isFile()) throw new Error('Generated project contains an unsupported file type');

      const relativePath = normalizeRepositoryPath(path.relative(stagingRoot, fullPath));
      let content = fs.readFileSync(fullPath, 'utf8');
      for (const canary of VERSIONED_TEST_CANARIES.get(relativePath) || []) {
        content = content.split(canary).join('[KNOWN-SCANNER-TEST-CANARY]');
      }
      for (const rule of SECRET_PATTERNS) {
        if (rule.pattern.test(content)) {
          throw new Error(`${relativePath} | ${rule.name} | [MASKIERT]`);
        }
      }
    }
  }
  walk(stagingRoot);
}

function initializeGit(stagingRoot) {
  const result = spawnSync('git', ['init', '--quiet'], {
    cwd: stagingRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (result.status !== 0) throw new Error('git init failed');
}

function createNeutralApp({ sourceRoot, target, appId, appName, includeGps = false, initGit = false }) {
  const options = { target, appId, appName, includeGps, initGit };
  validateOptions(options);

  const resolvedSourceRoot = fs.realpathSync(path.resolve(sourceRoot));
  const resolvedTarget = path.resolve(target);
  assertCleanTrackedSource(resolvedSourceRoot);
  const targetState = assertTargetAvailable(resolvedTarget);
  const parentRoot = path.dirname(resolvedTarget);
  fs.mkdirSync(parentRoot, { recursive: true });
  const stagingRoot = fs.mkdtempSync(path.join(parentRoot, `.${path.basename(resolvedTarget)}.neutral-app-tmp-`));

  try {
    const files = listVersionedFiles(resolvedSourceRoot);
    copyVersionedFiles(resolvedSourceRoot, stagingRoot, files);
    updateApplicationMetadata(stagingRoot, appId, appName);
    configureGps(stagingRoot, appId, includeGps);
    neutralizeDeploymentSmoke(stagingRoot);
    scanForSecrets(stagingRoot);
    if (initGit) initializeGit(stagingRoot);

    assertTargetAvailable(resolvedTarget);
    if (targetState.existed) fs.rmdirSync(resolvedTarget);
    try {
      fs.renameSync(stagingRoot, resolvedTarget);
    } catch (error) {
      if (targetState.existed && !fs.existsSync(resolvedTarget)) fs.mkdirSync(resolvedTarget);
      throw error;
    }
  } finally {
    if (fs.existsSync(stagingRoot)) fs.rmSync(stagingRoot, { recursive: true, force: true });
  }

  return { target: resolvedTarget, appId, appName, includeGps, gitInitialized: initGit };
}

function printHelp() {
  console.log('Usage: npm run app:create -- --target=<dir> --app-id=<id> --app-name="<name>" [--include-gps] [--init-git]');
  console.log('App names must contain 1-80 non-control characters and no secret-shaped values.');
}

function printChecklist(result) {
  console.log(`Created ${result.appName} (${result.appId}).`);
  console.log('Next steps:');
  console.log('- Repository: review the generated files and create the intended remote separately.');
  console.log('- Secrets: create a host-local .env; never commit credentials.');
  console.log('- Target directory: configure the physical hosting destination.');
  console.log('- Database: create dedicated credentials and run setup/migrations.');
  console.log('- Acceptance: verify HTTPS, login, API, assets, SPA fallback and optional modules.');
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }
  const options = parseArguments(args);
  validateOptions(options);
  const result = createNeutralApp({
    sourceRoot: path.resolve(__dirname, '..'),
    target: options.target,
    appId: options.appId,
    appName: options.appName,
    includeGps: options.includeGps,
    initGit: options.initGit
  });
  printChecklist(result);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  APP_ID_PATTERN,
  createNeutralApp,
  isExcludedSourcePath,
  listVersionedFiles,
  parseArguments,
  validateOptions
};

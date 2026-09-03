'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { after, test } = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const phpAvailable = spawnSync('php', ['-v'], { stdio: 'ignore' }).status === 0;
const sourceFixtureWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-app-source-'));
const cleanSourceRoot = path.join(sourceFixtureWorkspace, 'source');

function sourceFiles() {
  const tracked = spawnSync('git', ['ls-files', '--cached', '-z'], {
    cwd: projectRoot,
    encoding: 'buffer',
    stdio: ['ignore', 'pipe', 'ignore']
  });
  const trackedFiles = tracked.status === 0
    ? tracked.stdout.toString('utf8').split('\0').filter(Boolean)
    : [];
  if (trackedFiles.length > 0) return trackedFiles;

  const files = [];
  function walk(relativeDirectory) {
    for (const entry of fs.readdirSync(path.join(projectRoot, relativeDirectory), { withFileTypes: true })) {
      const relativePath = path.join(relativeDirectory, entry.name);
      if (entry.isDirectory()) {
        if (['.git', 'node_modules', 'dist', 'runtime', '.worktrees', '.superpowers', 'coverage', 'test-results'].includes(entry.name)) continue;
        walk(relativePath);
      } else if (entry.isFile()) {
        files.push(relativePath);
      }
    }
  }
  walk('');
  return files;
}

for (const relativePath of sourceFiles()) {
  const sourcePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(sourcePath) || !fs.lstatSync(sourcePath).isFile()) continue;
  const destinationPath = path.join(cleanSourceRoot, relativePath);
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
}
const initFixture = spawnSync('git', ['init', '--quiet'], { cwd: cleanSourceRoot, encoding: 'utf8' });
assert.equal(initFixture.status, 0, initFixture.stderr);
assert.equal(spawnSync('git', ['add', '--all'], { cwd: cleanSourceRoot }).status, 0);
const commitFixture = spawnSync('git', ['commit', '--quiet', '-m', 'test source'], {
  cwd: cleanSourceRoot,
  encoding: 'utf8',
  env: {
    ...process.env,
    GIT_AUTHOR_NAME: 'Neutral Test',
    GIT_AUTHOR_EMAIL: 'neutral-test@example.test',
    GIT_COMMITTER_NAME: 'Neutral Test',
    GIT_COMMITTER_EMAIL: 'neutral-test@example.test'
  }
});
assert.equal(commitFixture.status, 0, commitFixture.stderr);
after(() => fs.rmSync(sourceFixtureWorkspace, { recursive: true, force: true }));

const sourceHasGps = fs.existsSync(path.join(cleanSourceRoot, 'Web-App/app/modules/gps/module.json'));

function createWorkspace(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-app-bootstrap-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  return workspace;
}

function runBootstrapFrom(sourceRoot, target, options = {}) {
  const args = [
    path.join(sourceRoot, 'scripts/create-neutral-app.js'),
    `--target=${target}`,
    `--app-id=${options.appId ?? 'sample-app'}`,
    `--app-name=${options.appName ?? 'Sample App'}`
  ];
  if (options.includeGps) args.push('--include-gps');
  if (options.initGit) args.push('--init-git');

  return spawnSync(process.execPath, args, {
    cwd: sourceRoot,
    encoding: 'utf8'
  });
}

function runBootstrap(target, options = {}) {
  return runBootstrapFrom(cleanSourceRoot, target, options);
}

function runCopiedNonPhpTests(target) {
  const testFiles = fs.readdirSync(path.join(target, 'tests'))
    .filter((name) => name.endsWith('.test.js'))
    .filter((name) => !/(admin-php-entry|php-backup|php-login-rate-limit|portability-config)/.test(name))
    .map((name) => path.join('tests', name));
  const childEnvironment = {
    ...process.env,
    NEUTRAL_SKIP_GENERATED_SUITE: '1',
    NODE_PATH: path.join(projectRoot, 'node_modules')
  };
  delete childEnvironment.NODE_TEST_CONTEXT;
  return spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...testFiles], {
    cwd: target,
    encoding: 'utf8',
    env: childEnvironment,
    timeout: 120000
  });
}

function readEnvironment(filePath) {
  const result = new Map();
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = rawLine.indexOf('=');
    const key = rawLine.slice(0, separator).trim();
    const rawValue = rawLine.slice(separator + 1);
    const value = rawValue.length >= 2 && rawValue.startsWith("'") && rawValue.endsWith("'")
      ? rawValue.slice(1, -1)
      : rawValue;
    result.set(key, value);
  }
  return result;
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

test('refuses a non-empty target without changing its marker', (t) => {
  const workspace = createWorkspace(t);
  const target = path.join(workspace, 'occupied');
  fs.mkdirSync(target);
  const marker = path.join(target, 'keep.txt');
  fs.writeFileSync(marker, 'do not touch\n');

  const result = runBootstrap(target);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /target.*empty/i);
  assert.equal(fs.readFileSync(marker, 'utf8'), 'do not touch\n');
  assert.deepEqual(fs.readdirSync(target), ['keep.txt']);
  assert.equal(fs.readdirSync(workspace).some((name) => name.includes('.neutral-app-tmp-')), false);
});

test('rejects a dirty tracked source before creating output', (t) => {
  const workspace = createWorkspace(t);
  const dirtySource = path.join(workspace, 'dirty-source');
  fs.cpSync(cleanSourceRoot, dirtySource, { recursive: true });
  fs.appendFileSync(path.join(dirtySource, 'package.json'), '\n');
  const target = path.join(workspace, 'dirty-output');

  const result = runBootstrapFrom(dirtySource, target);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /clean Git checkout.*tracked/i);
  assert.equal(fs.existsSync(target), false);
  assert.equal(fs.readdirSync(workspace).some((name) => name.includes('.neutral-app-tmp-')), false);
});

test('rejects a dangling target symlink before creating temporary output', (t) => {
  const workspace = createWorkspace(t);
  const target = path.join(workspace, 'dangling-target');
  fs.symlinkSync(path.join(workspace, 'missing-target'), target, 'dir');

  const result = runBootstrap(target);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /target.*symbolic link/i);
  assert.equal(fs.lstatSync(target).isSymbolicLink(), true);
  assert.deepEqual(fs.readdirSync(workspace), ['dangling-target']);
});

test('validates the exact app ID contract before creating a target', (t) => {
  const workspace = createWorkspace(t);
  const invalidIds = ['', 'Sample-App', '-sample', 'sample-', 'sample--app', 'sample_app', 'sample app'];

  for (const [index, appId] of invalidIds.entries()) {
    const target = path.join(workspace, `invalid-id-${index}`);
    const result = runBootstrap(target, { appId });
    assert.notEqual(result.status, 0, JSON.stringify(appId));
    assert.match(result.stderr, /app id/i);
    assert.equal(fs.existsSync(target), false);
  }
});

test('validates a 1-80 character display name without controls', (t) => {
  const workspace = createWorkspace(t);
  const invalidNames = ['', 'x'.repeat(81), 'Line\nBreak', 'Delete\u007fCharacter'];

  for (const [index, appName] of invalidNames.entries()) {
    const target = path.join(workspace, `invalid-name-${index}`);
    const result = runBootstrap(target, { appName });
    assert.notEqual(result.status, 0, JSON.stringify(appName));
    assert.match(result.stderr, /app name/i);
    assert.equal(fs.existsSync(target), false);
  }
});

test('rejects secret-shaped display names before creating temporary output', (t) => {
  const workspace = createWorkspace(t);
  const target = path.join(workspace, 'secret-name');
  const result = runBootstrap(target, { appName: `ghp_${'abcdefghijklmnopqrstuvwxyz0123456789'}` });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /app name.*secret/i);
  assert.equal(fs.existsSync(target), false);
  assert.deepEqual(fs.readdirSync(workspace), []);
});

test('rejects a versioned encrypted private key with the German masking marker', (t) => {
  const workspace = createWorkspace(t);
  const sourceRoot = path.join(workspace, 'source');
  const target = path.join(workspace, 'output');
  fs.cpSync(cleanSourceRoot, sourceRoot, { recursive: true });
  const keyFixture = path.join(sourceRoot, 'Web-App/public/encrypted-key.txt');
  fs.writeFileSync(keyFixture, '-----BEGIN ENCRYPTED PRIVATE KEY-----\nfixture\n-----END ENCRYPTED PRIVATE KEY-----\n');
  assert.equal(spawnSync('git', ['add', '--all'], { cwd: sourceRoot }).status, 0);
  const commit = spawnSync('git', ['commit', '--quiet', '-m', 'encrypted key fixture'], {
    cwd: sourceRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Neutral Test',
      GIT_AUTHOR_EMAIL: 'neutral-test@example.test',
      GIT_COMMITTER_NAME: 'Neutral Test',
      GIT_COMMITTER_EMAIL: 'neutral-test@example.test'
    }
  });
  assert.equal(commit.status, 0, commit.stderr);

  const result = runBootstrapFrom(sourceRoot, target);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Private key.*\[MASKIERT\]/);
  assert.doesNotMatch(result.stderr, /BEGIN ENCRYPTED PRIVATE KEY/);
  assert.equal(fs.existsSync(target), false);
});

test('serializes display names losslessly as single-quoted environment values', (t) => {
  const workspace = createWorkspace(t);
  const appNames = [
    ' Leading and trailing ',
    'Double "quote" and single \'quote\'',
    String.raw`Backslash \\ and equals=value`
  ];

  for (const [index, appName] of appNames.entries()) {
    const target = path.join(workspace, `quoted-name-${index}`);
    const result = runBootstrap(target, { appId: `quoted-name-${index}`, appName });
    assert.equal(result.status, 0, result.stderr);
    const environmentPath = path.join(target, '.env.example');
    const environmentText = fs.readFileSync(environmentPath, 'utf8');
    assert.match(environmentText, /^APP_NAME='.*'$/m);
    assert.equal(readEnvironment(environmentPath).get('APP_NAME'), appName);
    const appInfo = JSON.parse(fs.readFileSync(path.join(target, `Web-App/apps/quoted-name-${index}/app-info.json`), 'utf8'));
    assert.equal(appInfo.name, appName);
  }
});

test('real Node config loader round-trips an app name with apostrophe and backslash', (t) => {
  const workspace = createWorkspace(t);
  const target = path.join(workspace, 'node-loader-name');
  const appName = String.raw`O'Brien \ Tools & More`;
  const result = runBootstrap(target, { appId: 'node-loader-name', appName });
  assert.equal(result.status, 0, result.stderr);
  fs.copyFileSync(path.join(target, '.env.example'), path.join(target, '.env'));

  const childEnvironment = { ...process.env, NEUTRAL_APP_ROOT: target };
  delete childEnvironment.APP_NAME;
  const loaded = spawnSync(process.execPath, ['-e', [
    "require('./Server/node/config/index.js');",
    'process.stdout.write(JSON.stringify(process.env.APP_NAME));'
  ].join('\n')], {
    cwd: target,
    encoding: 'utf8',
    env: childEnvironment
  });

  assert.equal(loaded.status, 0, loaded.stderr);
  assert.equal(JSON.parse(loaded.stdout), appName);
});

test('real PHP environment loader round-trips an app name with apostrophe and backslash', {
  skip: phpAvailable ? false : 'PHP executable is not available'
}, (t) => {
  const workspace = createWorkspace(t);
  const target = path.join(workspace, 'php-loader-name');
  const appName = String.raw`O'Brien \ Tools & More`;
  const result = runBootstrap(target, { appId: 'php-loader-name', appName });
  assert.equal(result.status, 0, result.stderr);
  const environmentPath = path.join(target, '.env.example');

  const loaded = spawnSync('php', ['-r', [
    `require ${JSON.stringify(path.join(target, 'Server/php/src/EnvLoader.php'))};`,
    `$values = \\Neutral\\Core\\EnvLoader::parseFile(${JSON.stringify(environmentPath)});`,
    `echo json_encode($values['APP_NAME']);`
  ].join('\n')], { encoding: 'utf8' });

  assert.equal(loaded.status, 0, loaded.stderr);
  assert.equal(JSON.parse(loaded.stdout), appName);
});

test('copied metadata tests compare an HTML-escaped title by its semantic app name', (t) => {
  const workspace = createWorkspace(t);
  const target = path.join(workspace, 'html-title-name');
  const appName = `Amp & <Angle> "Double" 'Single'`;
  const result = runBootstrap(target, { appId: 'html-title-name', appName });
  assert.equal(result.status, 0, result.stderr);

  const childEnvironment = { ...process.env, NODE_PATH: path.join(projectRoot, 'node_modules') };
  delete childEnvironment.NODE_TEST_CONTEXT;
  const metadataTests = spawnSync(process.execPath, [
    '--test',
    'tests/production-package.test.js',
    'tests/vision-framework.test.js'
  ], {
    cwd: target,
    encoding: 'utf8',
    env: childEnvironment
  });

  assert.equal(metadataTests.status, 0, `${metadataTests.stdout}\n${metadataTests.stderr}`);
});

test('sets generated server and admin fallback paths to the active app metadata', (t) => {
  const workspace = createWorkspace(t);
  const target = path.join(workspace, 'fallback-app');
  const result = runBootstrap(target, { appId: 'fallback-app', appName: 'Fallback App' });
  assert.equal(result.status, 0, result.stderr);

  const fallbackFiles = [
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
  for (const relativePath of fallbackFiles) {
    const content = fs.readFileSync(path.join(target, relativePath), 'utf8');
    assert.doesNotMatch(content, /["']neutral-app["']|["']Neutral (?:App|Platform)["']/, relativePath);
  }

  const probe = spawnSync(process.execPath, ['-e', [
    "const settings = require('./Server/node/services/settings-service');",
    "const AdminSettingsView = require('./Web-App/public/admin/settings-view.js');",
    'global.AdminCommon = { unwrapData() {}, showAlert() {} };',
    "const view = new AdminSettingsView({ getSettings: async () => ({ ok: false, error: 'offline' }) });",
    '(async () => {',
    '  await view.loadSettings();',
    '  process.stdout.write(JSON.stringify({ server: settings.getAll(), admin: view.settings }));',
    '})().catch((error) => { console.error(error); process.exitCode = 1; });'
  ].join('\n')], {
    cwd: target,
    encoding: 'utf8',
    env: { ...process.env, NODE_PATH: path.join(projectRoot, 'node_modules') }
  });
  assert.equal(probe.status, 0, probe.stderr);
  const fallbacks = JSON.parse(probe.stdout);
  assert.deepEqual({ appId: fallbacks.server.appId, appName: fallbacks.server.appName }, { appId: 'fallback-app', appName: 'Fallback App' });
  assert.deepEqual({ appId: fallbacks.admin.appId, appName: fallbacks.admin.appName }, { appId: 'fallback-app', appName: 'Fallback App' });
});

test('creates a complete secret-free project in an absent target without GPS', (t) => {
  const workspace = createWorkspace(t);
  const target = path.join(workspace, 'sample-app');
  const sourceGpsManifest = path.join(cleanSourceRoot, 'Web-App/app/modules/gps/module.json');
  const sourceGpsHash = sourceHasGps ? sha256(sourceGpsManifest) : null;

  const result = runBootstrap(target);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /repository/i);
  assert.match(result.stdout, /secrets/i);
  assert.match(result.stdout, /target directory/i);
  assert.match(result.stdout, /database/i);
  assert.match(result.stdout, /acceptance/i);
  assert.equal(fs.existsSync(path.join(target, 'Web-App/core/core.js')), true);
  assert.equal(fs.existsSync(path.join(target, 'Server/php/bootstrap.php')), true);
  assert.equal(fs.existsSync(path.join(target, 'package-lock.json')), true);
  assert.equal(fs.existsSync(path.join(target, 'tests/production-package.test.js')), true);
  assert.equal(fs.existsSync(path.join(target, 'scripts/create-neutral-app.js')), true);

  const appInfoPath = path.join(target, 'Web-App/apps/sample-app/app-info.json');
  const appInfo = JSON.parse(fs.readFileSync(appInfoPath, 'utf8'));
  assert.equal(appInfo.id, 'sample-app');
  assert.equal(appInfo.name, 'Sample App');
  assert.deepEqual(appInfo.modules, []);
  assert.deepEqual(fs.readdirSync(path.join(target, 'Web-App/apps')), ['sample-app']);

  const environment = readEnvironment(path.join(target, '.env.example'));
  assert.equal(environment.get('APP_ID'), 'sample-app');
  assert.equal(environment.get('APP_NAME'), 'Sample App');
  for (const secretKey of [
    'DB_PASSWORD', 'CORE_BOOTSTRAP_PASSWORD', 'SESSION_SECRET', 'AUTH_TOKEN',
    'ADMIN_ACCESS_TOKEN', 'NEUTRAL_ADMIN_TOKEN', 'PROVIDER_SECRET',
    'NEUTRAL_BACKUP_KEY', 'NEUTRAL_SETUP_RECOVERY_TOKEN'
  ]) {
    assert.equal(environment.get(secretKey), '', `${secretKey} must stay empty`);
  }

  const packageData = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
  assert.equal(packageData.name, 'sample-app');
  assert.equal(packageData.scripts['app:create'], 'node scripts/create-neutral-app.js');
  const packageLock = JSON.parse(fs.readFileSync(path.join(target, 'package-lock.json'), 'utf8'));
  assert.equal(packageLock.name, 'sample-app');
  assert.equal(packageLock.packages[''].name, 'sample-app');
  assert.match(fs.readFileSync(path.join(target, 'Web-App/public/index.html'), 'utf8'), /<title data-app-title>Sample App<\/title>/);
  assert.match(fs.readFileSync(path.join(target, 'Web-App/app/index.js'), 'utf8'), /appId: context\.appId \|\| 'sample-app'/);
  assert.match(fs.readFileSync(path.join(target, 'Web-App/app/index.js'), 'utf8'), /name: context\.name \|\| ["']Sample App["']/);
  assert.match(fs.readFileSync(path.join(target, 'Web-App/core/config-manager.js'), 'utf8'), /name: ["']Sample App["']/);

  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(target, 'Web-App/app/modules/index.json'), 'utf8')), []);
  assert.equal(fs.existsSync(path.join(target, 'Web-App/app/modules/gps')), false);
  if (sourceHasGps) assert.equal(sha256(sourceGpsManifest), sourceGpsHash, 'source GPS module must stay unchanged');
  const workflow = fs.readFileSync(path.join(target, '.github/workflows/ftp-upload.yml'), 'utf8');
  assert.doesNotMatch(workflow, /test -f .*Web-App\/app\/modules\/gps\/module\.json/);

  for (const excludedPath of [
    '.git', 'node_modules', 'dist', '.worktrees', '.superpowers', '.deploy-staging',
    'Server/node/runtime', 'test-results', 'coverage'
  ]) {
    assert.equal(fs.existsSync(path.join(target, excludedPath)), false, excludedPath);
  }
  assert.equal(fs.existsSync(path.join(target, '.env.example')), true);
  assert.equal(fs.existsSync(path.join(target, '.env.ftp.deploy.example')), true);

  const build = spawnSync(process.execPath, ['scripts/build-production-package.js'], {
    cwd: target,
    encoding: 'utf8'
  });
  assert.equal(build.status, 0, build.stderr);
  assert.equal(fs.existsSync(path.join(target, 'dist/neutral-production/.env.example')), true);
  assert.equal(fs.existsSync(path.join(target, 'dist/neutral-production/.env.ftp.deploy.example')), false);
});

test('accepts an existing empty target and retains GPS only when requested', { skip: sourceHasGps ? false : 'source project has no GPS reference' }, (t) => {
  const workspace = createWorkspace(t);
  const target = path.join(workspace, 'gps-app');
  fs.mkdirSync(target);

  const result = runBootstrap(target, { appId: 'gps-app', appName: 'GPS App', includeGps: true });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(target, 'Web-App/app/modules/gps/module.json')), true);
  const catalog = JSON.parse(fs.readFileSync(path.join(target, 'Web-App/app/modules/index.json'), 'utf8'));
  assert.deepEqual(catalog.map((module) => module.id), ['gps']);
  assert.equal(catalog[0].appId, 'gps-app');
  const manifest = JSON.parse(fs.readFileSync(path.join(target, 'Web-App/app/modules/gps/module.json'), 'utf8'));
  assert.equal(manifest.appId, 'gps-app');
  const appInfo = JSON.parse(fs.readFileSync(path.join(target, 'Web-App/apps/gps-app/app-info.json'), 'utf8'));
  assert.deepEqual(appInfo.modules, ['gps']);
  const workflow = fs.readFileSync(path.join(target, '.github/workflows/ftp-upload.yml'), 'utf8');
  assert.match(workflow, /test -f .*Web-App\/app\/modules\/gps\/module\.json/);
});

test('generated project runs its copied non-PHP test suite without requiring its own Git index', {
  skip: process.env.NEUTRAL_SKIP_GENERATED_SUITE === '1'
}, (t) => {
  const workspace = createWorkspace(t);
  const target = path.join(workspace, 'suite-app');
  const result = runBootstrap(target, { appId: 'suite-app', appName: 'Suite App' });
  assert.equal(result.status, 0, result.stderr);

  const suite = runCopiedNonPhpTests(target);
  assert.equal(suite.status, 0, `${suite.stdout}\n${suite.stderr}`);
});

test('generated --init-git project runs its copied non-PHP test suite with an empty index', {
  skip: process.env.NEUTRAL_SKIP_GENERATED_SUITE === '1'
}, (t) => {
  const workspace = createWorkspace(t);
  const target = path.join(workspace, 'git-suite-app');
  const result = runBootstrap(target, { appId: 'git-suite-app', appName: 'Git Suite App', initGit: true });
  assert.equal(result.status, 0, result.stderr);

  const indexedFiles = spawnSync('git', ['ls-files'], { cwd: target, encoding: 'utf8' });
  assert.equal(indexedFiles.status, 0, indexedFiles.stderr);
  assert.equal(indexedFiles.stdout, '');

  const build = spawnSync(process.execPath, ['scripts/build-production-package.js'], {
    cwd: target,
    encoding: 'utf8'
  });
  assert.equal(build.status, 0, build.stderr);
  assert.equal(fs.existsSync(path.join(target, 'dist/neutral-production/.env.example')), true);
  assert.equal(fs.existsSync(path.join(target, 'dist/neutral-production/.env.ftp.deploy.example')), false);

  const suite = runCopiedNonPhpTests(target);
  assert.equal(suite.status, 0, `${suite.stdout}\n${suite.stderr}`);
});

test('--init-git creates a local repository without a remote', (t) => {
  const workspace = createWorkspace(t);
  const target = path.join(workspace, 'git-app');

  const result = runBootstrap(target, { appId: 'git-app', appName: 'Git App', initGit: true });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(target, '.git')), true);
  const remotes = spawnSync('git', ['remote'], { cwd: target, encoding: 'utf8' });
  assert.equal(remotes.status, 0, remotes.stderr);
  assert.equal(remotes.stdout.trim(), '');
});

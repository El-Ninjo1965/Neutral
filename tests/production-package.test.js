'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const {
  buildProductionPackage,
  collectProductionFiles,
  normalizeBasePath,
  scanFile,
  sha256File
} = require('../scripts/lib/portable-install.js');
const { parseArguments } = require('../scripts/build-production-package.js');

const projectRoot = path.resolve(__dirname, '..');

function decodeHtmlText(value) {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" };
  return value.replace(/&(amp|lt|gt|quot|#39);/g, (entity, name) => entities[name]);
}

function readEnvironmentTemplate(filePath) {
  const values = new Map();
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const separator = line.indexOf('=');
    assert.notEqual(separator, -1, `Invalid environment-template line: ${line}`);
    const rawValue = line.slice(separator + 1);
    const value = rawValue.length >= 2 && rawValue.startsWith("'") && rawValue.endsWith("'")
      ? rawValue.slice(1, -1)
      : rawValue;
    values.set(line.slice(0, separator), value);
  }
  return values;
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function runGit(cwd, args) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Neutral Test',
      GIT_AUTHOR_EMAIL: 'neutral-test@example.test',
      GIT_COMMITTER_NAME: 'Neutral Test',
      GIT_COMMITTER_EMAIL: 'neutral-test@example.test'
    }
  });
  assert.equal(result.status, 0, result.stderr);
  return result;
}

function writeSelfConsistentForeignPackage(outputDir, identity = {}) {
  const relativePath = 'foreign.txt';
  const payload = 'foreign directory marker\n';
  writeFile(path.join(outputDir, relativePath), payload);
  const entry = {
    path: relativePath,
    size: Buffer.byteLength(payload),
    sha256: crypto.createHash('sha256').update(payload).digest('hex')
  };
  writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify({
    schemaVersion: 1,
    ...identity,
    files: [entry]
  }, null, 2)}\n`);
  writeFile(path.join(outputDir, 'SHA256SUMS'), `${entry.sha256}  ${relativePath}\n`);
}

function createSourceFixture(t) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-production-package-'));
  const sourceRoot = path.join(workspaceRoot, 'source');
  fs.mkdirSync(sourceRoot, { recursive: true });
  t.after(() => fs.rmSync(workspaceRoot, { recursive: true, force: true }));

  writeFile(path.join(sourceRoot, 'package.json'), JSON.stringify({ version: '9.8.7' }));
  writeFile(path.join(sourceRoot, '.htaccess'), 'DirectoryIndex Web-App/public/index.html\n');
  writeFile(path.join(sourceRoot, '.env.example'), 'DB_PASSWORD=\nSESSION_SECRET=\n');
  writeFile(path.join(sourceRoot, 'Web-App/public/index.html'), [
    '<!doctype html>',
    '<html><head><meta name="neutral-base-path" content=""><base href="/"></head></html>',
    ''
  ].join('\n'));
  writeFile(path.join(sourceRoot, 'Web-App/public/public-path.js'), 'globalThis.NeutralPublicPath = {};\n');
  writeFile(path.join(sourceRoot, 'Web-App/public/service-worker.js'), "'use strict';\n/* self.__NEUTRAL_DEPLOY_STAMP__ placeholder */\n");
  writeFile(path.join(sourceRoot, 'Web-App/public/app.js'), 'console.log("neutral");\n');
  writeFile(path.join(sourceRoot, 'Server/php/bootstrap.php'), '<?php declare(strict_types=1);\n');
  writeFile(path.join(sourceRoot, 'Server/php/src/PublicPath.php'), '<?php declare(strict_types=1);\n');
  writeFile(path.join(sourceRoot, 'Server/public/api/index.php'), '<?php echo "ok";\n');

  writeFile(path.join(sourceRoot, 'Server/node/server.js'), 'throw new Error("development only");\n');
  writeFile(path.join(sourceRoot, 'tests/not-production.test.js'), 'throw new Error("test only");\n');
  writeFile(path.join(sourceRoot, 'docs/internal.md'), 'internal\n');
  writeFile(path.join(sourceRoot, '.env'), 'DB_PASSWORD=do-not-package\n');

  return { workspaceRoot, sourceRoot };
}

// The production builder requires a source commit for the service worker
// deploy stamp; fixtures without a git repository supply a deterministic one.
const FIXTURE_SOURCE_COMMIT = '0123456789abcdef0123456789abcdef01234567';
const buildFixturePackage = (options = {}) => buildProductionPackage({ sourceCommit: FIXTURE_SOURCE_COMMIT, ...options });

test('normalizes production package base paths with the shared public-path contract', () => {
  assert.equal(normalizeBasePath(''), '');
  assert.equal(normalizeBasePath('/'), '');
  assert.equal(normalizeBasePath('meine-app'), '/meine-app');
  assert.equal(normalizeBasePath('/meine-app/'), '/meine-app');

  for (const value of [
    'https://host/app',
    '/a/../b',
    '/a%2Fb',
    '/a?x=1',
    '/a#fragment',
    '/a\\b',
    '/a//b',
    '/ä',
    '/a\0b'
  ]) {
    assert.throws(() => normalizeBasePath(value), /base path/i, value);
  }
});

test('invalid base-path errors never include the rejected sensitive value', () => {
  const sensitiveValue = `/private-${'value'.repeat(8)}?`;
  let error;
  try {
    normalizeBasePath(sensitiveValue);
  } catch (caught) {
    error = caught;
  }

  assert.ok(error);
  assert.equal(error.message.includes(sensitiveValue), false);
  assert.match(error.message, /invalid base path/i);
});

test('collects only the production allowlist in stable order', (t) => {
  const { sourceRoot } = createSourceFixture(t);
  const inventory = collectProductionFiles(sourceRoot);

  assert.deepEqual(inventory, [...inventory].sort());
  assert.ok(inventory.includes('.env.example'));
  assert.ok(inventory.includes('.htaccess'));
  assert.ok(inventory.includes('Web-App/public/index.html'));
  assert.ok(inventory.includes('Server/php/bootstrap.php'));
  assert.ok(inventory.includes('Server/public/api/index.php'));
  assert.equal(inventory.some((p) => p.startsWith('Server/node/')), false);
  assert.equal(inventory.some((p) => p.startsWith('tests/')), false);
  assert.equal(inventory.some((p) => p.startsWith('docs/')), false);
  assert.equal(inventory.some((p) => /(^|\/)\.env(?:\.|$)/.test(p) && p !== '.env.example'), false);
});

test('keeps the future Task 4 environment template mandatory', (t) => {
  const { sourceRoot } = createSourceFixture(t);
  fs.rmSync(path.join(sourceRoot, '.env.example'));

  assert.throws(
    () => collectProductionFiles(sourceRoot),
    /Missing required production path: \.env\.example/
  );
});

test('builder requires both public-path resolver entrypoints', async (t) => {
  for (const relativePath of [
    'Web-App/public/public-path.js',
    'Server/php/src/PublicPath.php'
  ]) {
    await t.test(relativePath, () => {
      const { workspaceRoot, sourceRoot } = createSourceFixture(t);
      const outputDir = path.join(workspaceRoot, 'package');
      fs.rmSync(path.join(sourceRoot, relativePath));

      assert.throws(
        () => buildFixturePackage({ sourceRoot, outputDir }),
        /required production.*entrypoint|missing required production path/i
      );
      assert.equal(fs.existsSync(outputDir), false);
    });
  }
});

test('repository environment and FTPS templates are value-free and neutral', () => {
  const environment = readEnvironmentTemplate(path.join(projectRoot, '.env.example'));
  const ftps = readEnvironmentTemplate(path.join(projectRoot, '.env.ftp.deploy.example'));
  const appsRoot = path.join(projectRoot, 'Web-App/apps');
  const appManifestPath = fs.readdirSync(appsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(appsRoot, entry.name, 'app-info.json'))
    .find((filePath) => fs.existsSync(filePath));
  const appMetadata = JSON.parse(fs.readFileSync(appManifestPath, 'utf8'));
  const publicIndex = fs.readFileSync(path.join(projectRoot, 'Web-App/public/index.html'), 'utf8');
  const publicTitle = publicIndex.match(/<title data-app-title>([^<]*)<\/title>/);
  assert.ok(publicTitle);

  const hostLocalOrSecretValues = {
    DB_HOST: '',
    DB_NAME: '',
    DB_USER: '',
    DB_PASSWORD: '',
    DB_URL: '',
    CORE_BOOTSTRAP_USERNAME: '',
    CORE_BOOTSTRAP_PASSWORD: '',
    NEUTRAL_BACKUP_KEY: '',
    NEUTRAL_SETUP_RECOVERY_TOKEN: '',
    SESSION_SECRET: '',
    PROVIDER_SECRET: '',
    AUTH_TOKEN: '',
    ADMIN_ACCESS_TOKEN: '',
    NEUTRAL_ADMIN_TOKEN: ''
  };
  for (const [key, expected] of Object.entries(hostLocalOrSecretValues)) {
    assert.equal(environment.get(key), expected, `${key} must remain host-local and empty`);
  }

  const safePublicDefaults = {
    APP_ID: appMetadata.id,
    APP_NAME: decodeHtmlText(publicTitle[1]),
    APP_ENV: 'production',
    APP_DEBUG: 'false',
    NEUTRAL_BASE_PATH: '',
    DB_TYPE: 'mysql',
    DB_PORT: '3306',
    AUTH_SESSION_COOKIE_NAME: 'neutral_session',
    AUTH_SESSION_TTL_MS: '43200000',
    AUTH_LOGIN_IDENTIFIER_LIMIT: '5',
    AUTH_LOGIN_IP_LIMIT: '20',
    AUTH_LOGIN_WINDOW_SECONDS: '900',
    AUTH_LOGIN_LOCK_SECONDS: '900',
    NEUTRAL_SETUP_RECOVERY_ENABLED: 'false'
  };
  for (const [key, expected] of Object.entries(safePublicDefaults)) {
    assert.equal(environment.get(key), expected, `${key} must keep its safe public default`);
  }

  assert.equal(ftps.get('FTP_SERVER'), 'ftp.example.test');
  assert.equal(ftps.get('FTP_PORT'), '21');
  assert.equal(ftps.get('FTP_USERNAME'), 'neutral_user');
  assert.equal(ftps.get('FTP_PASSWORD'), '');
  assert.equal(ftps.get('FTP_TARGET_DIR'), '/neutral-app');
  assert.equal(ftps.get('FTP_PROTOCOL'), 'ftps');
  assert.equal(ftps.get('FTP_SSL_CHECK_HOSTNAME'), 'true');
});

test('rejects forbidden files nested inside an allowlisted directory', (t) => {
  const { sourceRoot } = createSourceFixture(t);
  writeFile(path.join(sourceRoot, 'Web-App/.env.local'), 'API_TOKEN=hidden\n');

  assert.throws(
    () => collectProductionFiles(sourceRoot),
    /Web-App\/\.env\.local.*forbidden/i
  );
});

test('hashes package files with SHA-256', (t) => {
  const { sourceRoot } = createSourceFixture(t);
  const filePath = path.join(sourceRoot, 'Web-App/public/app.js');
  const expected = crypto.createHash('sha256').update('console.log("neutral");\n').digest('hex');

  assert.equal(sha256File(filePath), expected);
});

test('masks secret scanner findings', (t) => {
  const { sourceRoot } = createSourceFixture(t);
  const secretFixtureValue = 'ghp_0123456789abcdefghijklmnopqrstuvwxyz';
  const filePath = path.join(sourceRoot, 'Web-App/public/config.js');
  writeFile(filePath, `const leaked = "${secretFixtureValue}";\n`);

  let scannerError = '';
  try {
    scanFile(filePath, 'Web-App/public/config.js');
  } catch (error) {
    scannerError = error.message;
  }

  assert.equal(
    scannerError,
    'Web-App/public/config.js | GitHub access token | [MASKIERT]'
  );
  assert.doesNotMatch(scannerError, new RegExp(secretFixtureValue));
});

test('detects encrypted private keys without reproducing their content', (t) => {
  const { sourceRoot } = createSourceFixture(t);
  const filePath = path.join(sourceRoot, 'Web-App/public/encrypted-key.txt');
  writeFile(filePath, '-----BEGIN ENCRYPTED PRIVATE KEY-----\nfixture\n-----END ENCRYPTED PRIVATE KEY-----\n');

  let scannerError;
  try {
    scanFile(filePath, 'Web-App/public/encrypted-key.txt');
  } catch (error) {
    scannerError = error.message;
  }

  assert.ok(scannerError);
  assert.match(scannerError, /Private key.*\[MASKIERT\]/);
  assert.doesNotMatch(scannerError, /BEGIN ENCRYPTED PRIVATE KEY/);
});

test('rejects symlinks instead of copying their targets', (t) => {
  const { workspaceRoot, sourceRoot } = createSourceFixture(t);
  const externalFile = path.join(workspaceRoot, 'outside.txt');
  writeFile(externalFile, 'outside\n');
  fs.symlinkSync(externalFile, path.join(sourceRoot, 'Web-App/public/outside.txt'));

  assert.throws(
    () => collectProductionFiles(sourceRoot),
    /Symlink.*Web-App\/public\/outside\.txt/i
  );
});

test('[review-3] rejects lexical and symlinked output overlap while allowing source dist', (t) => {
  const { workspaceRoot, sourceRoot } = createSourceFixture(t);

  assert.throws(
    () => buildFixturePackage({ sourceRoot, outputDir: path.join(sourceRoot, 'Server') }),
    /output.*Server\/php|Server\/php.*output/i
  );

  const outputParentLink = path.join(workspaceRoot, 'linked-output-parent');
  fs.symlinkSync(path.join(sourceRoot, 'Web-App'), outputParentLink, 'dir');
  assert.throws(
    () => buildFixturePackage({ sourceRoot, outputDir: path.join(outputParentLink, 'package') }),
    /output.*Web-App|Web-App.*output/i
  );
  assert.equal(fs.existsSync(path.join(sourceRoot, 'Web-App/package')), false);

  const result = buildFixturePackage({ sourceRoot });
  assert.equal(result.outputDir, path.join(sourceRoot, 'dist', 'neutral-production'));
  assert.equal(fs.existsSync(path.join(result.outputDir, 'manifest.json')), true);
});

test('builds a verified package without mutating the source base-path meta tag', (t) => {
  const { workspaceRoot, sourceRoot } = createSourceFixture(t);
  const firstOutput = path.join(workspaceRoot, 'first-package');
  const secondOutput = path.join(workspaceRoot, 'second-package');
  const rootOutput = path.join(workspaceRoot, 'root-package');
  const sourceIndex = path.join(sourceRoot, 'Web-App/public/index.html');
  const originalIndex = fs.readFileSync(sourceIndex, 'utf8');

  buildProductionPackage({
    sourceRoot,
    outputDir: firstOutput,
    basePath: '/meine-app/',
    generatedAt: '2026-09-03T00:00:00.000Z',
    sourceCommit: 'abc1230abc1230abc1230abc1230abc1230abc1230'
  });
  buildProductionPackage({
    sourceRoot,
    outputDir: secondOutput,
    basePath: '/meine-app/',
    generatedAt: '2026-09-03T01:00:00.000Z',
    sourceCommit: 'def4560def4560def4560def4560def4560def4560'
  });
  buildProductionPackage({
    sourceRoot,
    outputDir: rootOutput,
    basePath: '',
    generatedAt: '2026-09-03T02:00:00.000Z',
    sourceCommit: '111789011178901117890111789011178901117890aa'
  });

  const packagedIndex = fs.readFileSync(path.join(firstOutput, 'Web-App/public/index.html'), 'utf8');
  const rootIndex = fs.readFileSync(path.join(rootOutput, 'Web-App/public/index.html'), 'utf8');
  assert.match(packagedIndex, /<meta name="neutral-base-path" content="\/meine-app">/);
  assert.match(packagedIndex, /<base href="\/meine-app\/">/);
  assert.match(rootIndex, /<base href="\/">/);
  const packagedBase = packagedIndex.match(/<base href="([^"]+)">/)[1];
  assert.equal(
    new URL('core/core.js', new URL(packagedBase, 'https://example.test/meine-app/orders/42/')).pathname,
    '/meine-app/core/core.js'
  );
  assert.equal(fs.readFileSync(sourceIndex, 'utf8'), originalIndex);

  const firstManifest = JSON.parse(fs.readFileSync(path.join(firstOutput, 'manifest.json'), 'utf8'));
  const secondManifest = JSON.parse(fs.readFileSync(path.join(secondOutput, 'manifest.json'), 'utf8'));
  assert.equal(firstManifest.schemaVersion, 1);
  assert.equal(firstManifest.producer, 'neutral-web-platform');
  assert.equal(firstManifest.packageFormat, 'neutral-production');
  assert.equal(firstManifest.appVersion, '9.8.7');
  assert.equal(firstManifest.frameworkVersion, '9.8.7');
  assert.equal(firstManifest.sourceCommit, 'abc1230abc1230abc1230abc1230abc1230abc1230');
  assert.equal(firstManifest.generatedAt, '2026-09-03T00:00:00.000Z');
  assert.equal(firstManifest.basePath, '/meine-app');
  assert.equal(firstManifest.sourceDirty, true);

  const firstFiles = firstManifest.files;
  const secondFiles = secondManifest.files;
  assert.deepEqual(firstFiles.map(({ path: filePath }) => filePath), [...firstFiles.map(({ path: filePath }) => filePath)].sort());
  // The packaged service worker embeds the per-deployment source commit as its
  // cache stamp, so only that file differs between deployments; everything else
  // must stay byte-identical for identical source content.
  const withoutWorker = (files) => files.filter(({ path: filePath }) => filePath !== 'Web-App/public/service-worker.js');
  assert.deepEqual(withoutWorker(firstFiles), withoutWorker(secondFiles));
  const firstWorker = firstFiles.find(({ path: filePath }) => filePath === 'Web-App/public/service-worker.js');
  const secondWorker = secondFiles.find(({ path: filePath }) => filePath === 'Web-App/public/service-worker.js');
  assert.ok(firstWorker && secondWorker);
  assert.notEqual(firstWorker.sha256, secondWorker.sha256);
  assert.equal(firstFiles.some(({ path: filePath }) => filePath === 'manifest.json'), false);
  assert.equal(firstFiles.some(({ path: filePath }) => filePath === 'SHA256SUMS'), false);

  const sumLines = fs.readFileSync(path.join(firstOutput, 'SHA256SUMS'), 'utf8').trim().split('\n');
  assert.deepEqual(sumLines, firstFiles.map((file) => `${file.sha256}  ${file.path}`));
  assert.equal(new Set(sumLines.map((line) => line.slice(66))).size, sumLines.length);
  assert.equal(sumLines.every((line) => /^[0-9a-f]{64}  [A-Za-z0-9._~/-]+$/.test(line)), true);
  for (const file of firstFiles) {
    assert.equal(file.sha256, sha256File(path.join(firstOutput, file.path)));
    assert.equal(file.size, fs.statSync(path.join(firstOutput, file.path)).size);
  }
});

test('records whether the package source is clean at build time', (t) => {
  const { workspaceRoot, sourceRoot } = createSourceFixture(t);
  runGit(sourceRoot, ['init', '--quiet']);
  runGit(sourceRoot, ['add', '--all']);
  runGit(sourceRoot, ['commit', '--quiet', '-m', 'fixture']);

  const cleanOutput = path.join(workspaceRoot, 'clean-package');
  const dirtyOutput = path.join(workspaceRoot, 'dirty-package');
  const clean = buildFixturePackage({ sourceRoot, outputDir: cleanOutput });
  assert.equal(clean.manifest.sourceDirty, false);

  fs.appendFileSync(path.join(sourceRoot, 'Web-App/public/app.js'), '// changed\n');
  const dirty = buildFixturePackage({ sourceRoot, outputDir: dirtyOutput });
  assert.equal(dirty.manifest.sourceDirty, true);
});

test('documents the conservative sourceDirty manifest semantics', () => {
  const documentation = fs.readFileSync(path.join(projectRoot, 'Install-README-Server.md'), 'utf8');

  assert.equal(/`sourceDirty`/.test(documentation), true);
  assert.equal(/`false`[^\n]*(?:Git|Arbeitsbaum)[^\n]*(?:sauber|unverändert)/i.test(documentation), true);
  assert.equal(/`true`[^\n]*(?:Änderungen|Git-Status|Repository)/i.test(documentation), true);
});

test('preserves the previous package when a replacement fails validation', (t) => {
  const { workspaceRoot, sourceRoot } = createSourceFixture(t);
  const outputDir = path.join(workspaceRoot, 'production-package');
  buildFixturePackage({ sourceRoot, outputDir, basePath: '' });
  const originalManifest = fs.readFileSync(path.join(outputDir, 'manifest.json'), 'utf8');

  const secretFixtureValue = 'ghp_abcdefghijklmnopqrstuvwxyz0123456789';
  writeFile(path.join(sourceRoot, 'Web-App/public/leak.js'), `const leaked = "${secretFixtureValue}";\n`);

  assert.throws(() => buildFixturePackage({ sourceRoot, outputDir, basePath: '' }), /\[MASKIERT\]/);
  assert.equal(fs.readFileSync(path.join(outputDir, 'manifest.json'), 'utf8'), originalManifest);
});

test('[review-4] refuses to replace an output with invalid metadata or payload hashes', async (t) => {
  const cases = [
    {
      name: 'schema',
      mutate(outputDir) {
        const manifestPath = path.join(outputDir, 'manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        manifest.schemaVersion = 2;
        fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      }
    },
    {
      name: 'payload',
      mutate(outputDir) {
        fs.appendFileSync(path.join(outputDir, 'Web-App/public/app.js'), '// tampered\n');
      }
    },
    {
      name: 'checksums',
      mutate(outputDir) {
        fs.writeFileSync(path.join(outputDir, 'SHA256SUMS'), `${'0'.repeat(64)}  Web-App/public/app.js\n`);
      }
    },
    {
      name: 'foreign-file',
      mutate(outputDir) {
        fs.writeFileSync(path.join(outputDir, 'foreign.txt'), 'not in the package manifest\n');
      }
    }
  ];

  for (const entry of cases) {
    await t.test(entry.name, (subtest) => {
      const { workspaceRoot, sourceRoot } = createSourceFixture(subtest);
      const outputDir = path.join(workspaceRoot, 'package');
      buildFixturePackage({ sourceRoot, outputDir });
      entry.mutate(outputDir);
      const before = fs.readFileSync(path.join(outputDir, entry.name === 'payload'
        ? 'Web-App/public/app.js'
        : entry.name === 'checksums' ? 'SHA256SUMS'
          : entry.name === 'foreign-file' ? 'foreign.txt' : 'manifest.json'), 'utf8');

      assert.throws(
        () => buildFixturePackage({ sourceRoot, outputDir }),
        /existing production package/i
      );
      const after = fs.readFileSync(path.join(outputDir, entry.name === 'payload'
        ? 'Web-App/public/app.js'
        : entry.name === 'checksums' ? 'SHA256SUMS'
          : entry.name === 'foreign-file' ? 'foreign.txt' : 'manifest.json'), 'utf8');
      assert.equal(after, before);
    });
  }
});

test('[review-4] replaces a verified output and removes its rollback backup', (t) => {
  const { workspaceRoot, sourceRoot } = createSourceFixture(t);
  const outputDir = path.join(workspaceRoot, 'package');
  buildFixturePackage({ sourceRoot, outputDir });
  writeFile(path.join(sourceRoot, 'Web-App/public/app.js'), 'console.log("updated");\n');

  buildFixturePackage({ sourceRoot, outputDir });

  assert.equal(
    fs.readFileSync(path.join(outputDir, 'Web-App/public/app.js'), 'utf8'),
    'console.log("updated");\n'
  );
  assert.equal(
    fs.readdirSync(workspaceRoot).some((entry) => entry.startsWith('package.previous-')),
    false
  );
});

test('refuses to replace self-consistent foreign output directories and preserves their marker', async (t) => {
  const cases = [
    { name: 'schema-1 foreign producer', identity: {} },
    {
      name: 'forged Neutral identity with foreign inventory',
      identity: {
        producer: 'neutral-web-platform',
        packageFormat: 'neutral-production',
        appVersion: '1.0.0',
        frameworkVersion: '1.0.0',
        sourceCommit: null,
        generatedAt: '2026-09-03T00:00:00.000Z',
        basePath: '',
        sourceDirty: false
      }
    }
  ];

  for (const entry of cases) {
    await t.test(entry.name, (subtest) => {
      const { workspaceRoot, sourceRoot } = createSourceFixture(subtest);
      const outputDir = path.join(workspaceRoot, 'foreign-output');
      writeSelfConsistentForeignPackage(outputDir, entry.identity);
      const markerPath = path.join(outputDir, 'foreign.txt');
      const before = fs.readFileSync(markerPath, 'utf8');

      assert.throws(
        () => buildFixturePackage({ sourceRoot, outputDir }),
        /existing production package/i
      );
      assert.equal(fs.readFileSync(markerPath, 'utf8'), before);
    });
  }
});

test('[review-5] rejects unsafe package filenames before creating an output', (t) => {
  const { workspaceRoot, sourceRoot } = createSourceFixture(t);
  const outputDir = path.join(workspaceRoot, 'package');
  writeFile(path.join(sourceRoot, 'Web-App/public/unsafe\nname.js'), 'safe content\n');

  assert.throws(
    () => buildFixturePackage({ sourceRoot, outputDir }),
    /unsafe package path/i
  );
  assert.equal(fs.existsSync(outputDir), false);
});

test('[review-6] changes only genuine neutral base-path meta attributes', (t) => {
  const { workspaceRoot, sourceRoot } = createSourceFixture(t);
  const outputDir = path.join(workspaceRoot, 'package');
  writeFile(path.join(sourceRoot, 'Web-App/public/index.html'), [
    '<meta data-name="neutral-base-path" data-content="decoy">',
    '<meta data-info=\'name="neutral-base-path" content="quoted-decoy"\'>',
    '<meta content="" name="neutral-base-path">',
    '<base href="/">',
    ''
  ].join('\n'));

  buildFixturePackage({ sourceRoot, outputDir, basePath: '/nested' });
  const packagedIndex = fs.readFileSync(path.join(outputDir, 'Web-App/public/index.html'), 'utf8');
  assert.match(packagedIndex, /data-name="neutral-base-path" data-content="decoy"/);
  assert.match(packagedIndex, /data-info='name="neutral-base-path" content="quoted-decoy"'/);
  assert.match(packagedIndex, /<meta content="\/nested" name="neutral-base-path">/);
});

test('[review-7] parses CLI options without destructive ambiguity', () => {
  assert.deepEqual(parseArguments([]), { basePath: undefined, output: undefined });
  assert.deepEqual(parseArguments(['--base-path=']), { basePath: '', output: undefined });
  assert.deepEqual(parseArguments(['--base-path', '']), { basePath: '', output: undefined });
  assert.deepEqual(
    parseArguments(['--base-path=/nested', '--output=dist/custom']),
    { basePath: '/nested', output: 'dist/custom' }
  );

  for (const args of [
    ['--output='],
    ['--output=   '],
    ['--output=line\nbreak'],
    ['--output', ''],
    ['--output=one', '--output=two'],
    ['--base-path=/one', '--base-path=/two'],
    ['--output', 'one', '--output=two']
  ]) {
    assert.throws(() => parseArguments(args), /output|duplicate/i, args.join(' '));
  }
});

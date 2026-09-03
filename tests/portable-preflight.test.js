'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const {
  buildProductionPackage,
  scanProductionPackage,
  sha256File
} = require('../scripts/lib/portable-install.js');

const projectRoot = path.resolve(__dirname, '..');
const preflightScript = path.join(projectRoot, 'scripts/cpanel-preflight.js');
const allowedStatuses = new Set(['PASS', 'BLOCKED', 'NICHT_GEPRUEFT']);

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function createPackage(t, basePath = '/meine-app') {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-portable-preflight-'));
  const sourceRoot = path.join(workspace, 'source');
  const packageRoot = path.join(workspace, 'package');
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));

  writeFile(path.join(sourceRoot, 'package.json'), JSON.stringify({ version: '1.2.3' }));
  writeFile(path.join(sourceRoot, '.env.example'), 'DB_PASSWORD=\nCORE_BOOTSTRAP_PASSWORD=\n');
  writeFile(path.join(sourceRoot, '.htaccess'), 'DirectoryIndex Web-App/public/index.html\nRewriteEngine On\n');
  writeFile(path.join(sourceRoot, 'Web-App/public/index.html'), [
    '<!doctype html>',
    '<meta name="neutral-base-path" content="">',
    '<base href="/">',
    '<title>Neutral</title>',
    ''
  ].join('\n'));
  writeFile(path.join(sourceRoot, 'Web-App/public/public-path.js'), 'globalThis.NeutralPublicPath = {};\n');
  writeFile(path.join(sourceRoot, 'Server/php/bootstrap.php'), '<?php declare(strict_types=1);\n');
  writeFile(path.join(sourceRoot, 'Server/php/src/PublicPath.php'), '<?php declare(strict_types=1);\n');
  writeFile(path.join(sourceRoot, 'Server/public/admin.php'), '<?php echo "admin";\n');
  writeFile(path.join(sourceRoot, 'Server/public/setup.php'), '<?php echo "setup";\n');
  writeFile(path.join(sourceRoot, 'Server/public/api/.htaccess'), 'RewriteEngine On\n');
  writeFile(path.join(sourceRoot, 'Server/public/api/index.php'), '<?php echo "api";\n');

  buildProductionPackage({
    sourceRoot,
    outputDir: packageRoot,
    basePath,
    generatedAt: '2026-09-03T00:00:00.000Z',
    sourceCommit: '0123456789abcdef'
  });
  return { workspace, packageRoot };
}

function readManifest(packageRoot) {
  return JSON.parse(fs.readFileSync(path.join(packageRoot, 'manifest.json'), 'utf8'));
}

function rewritePackageMetadata(packageRoot, mutate) {
  const manifest = readManifest(packageRoot);
  mutate(manifest);
  manifest.files.sort((left, right) => left.path.localeCompare(right.path));
  fs.writeFileSync(path.join(packageRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(
    path.join(packageRoot, 'SHA256SUMS'),
    manifest.files.map((file) => `${file.sha256}  ${file.path}`).join('\n') + '\n'
  );
}

function addManifestFile(packageRoot, relativePath, content) {
  const filePath = path.join(packageRoot, relativePath);
  writeFile(filePath, content);
  rewritePackageMetadata(packageRoot, (manifest) => {
    manifest.files.push({
      path: relativePath,
      size: fs.statSync(filePath).size,
      sha256: sha256File(filePath)
    });
  });
}

function removeManifestFile(packageRoot, relativePath) {
  fs.rmSync(path.join(packageRoot, relativePath));
  rewritePackageMetadata(packageRoot, (manifest) => {
    manifest.files = manifest.files.filter((file) => file.path !== relativePath);
  });
}

function replaceManifestFile(packageRoot, relativePath, content) {
  const filePath = path.join(packageRoot, relativePath);
  writeFile(filePath, content);
  rewritePackageMetadata(packageRoot, (manifest) => {
    const entry = manifest.files.find((file) => file.path === relativePath);
    assert.ok(entry, `missing manifest entry ${relativePath}`);
    entry.size = fs.statSync(filePath).size;
    entry.sha256 = sha256File(filePath);
  });
}

function runPreflight(packageRoot, options = {}) {
  const args = [
    preflightScript,
    `--package=${packageRoot}`,
    `--public-url=${options.publicUrl ?? 'https://example.test/meine-app/'}`
  ];
  if (options.basePath !== null) {
    args.push(`--base-path=${options.basePath ?? '/meine-app'}`);
  }

  return spawnSync(process.execPath, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: options.pathEnvironment ?? ''
    }
  });
}

function parsePayload(result) {
  assert.doesNotThrow(() => JSON.parse(result.stdout), result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  const statuses = [payload.status, ...(payload.checks || []).map((check) => check.status)];
  assert.ok(statuses.length > 1, 'preflight must report an overall status and individual checks');
  for (const status of statuses) {
    assert.equal(allowedStatuses.has(status), true, `unexpected status ${JSON.stringify(status)}`);
  }
  assert.equal(result.stderr, '');
  return payload;
}

function checksByName(payload) {
  return new Map(payload.checks.map((check) => [check.name, check]));
}

test('verifies a subpath package without claiming externally unverified capabilities pass', (t) => {
  const { packageRoot } = createPackage(t);
  const result = runPreflight(packageRoot);
  const payload = parsePayload(result);
  const checks = checksByName(payload);

  assert.equal(result.status, 0, result.stdout);
  assert.equal(payload.status, 'NICHT_GEPRUEFT');
  assert.equal(checks.get('package').status, 'PASS');
  assert.equal(checks.get('publicBase').status, 'PASS');
  assert.equal(checks.get('entrypoints').status, 'PASS');
  assert.equal(checks.get('secrets').status, 'PASS');
  assert.equal(checks.get('php').status, 'NICHT_GEPRUEFT');
  assert.equal(checks.get('rewrite').status, 'NICHT_GEPRUEFT');
});

test('accepts the exact root public URL with or without its single trailing slash', async (t) => {
  const { packageRoot } = createPackage(t, '');

  for (const publicUrl of ['https://example.test', 'HTTPS://example.test/']) {
    await t.test(publicUrl, () => {
      const result = runPreflight(packageRoot, { publicUrl, basePath: '' });
      const payload = parsePayload(result);
      assert.equal(result.status, 0, result.stdout);
      assert.equal(checksByName(payload).get('publicBase').status, 'PASS');
      assert.notEqual(payload.status, 'PASS');
    });
  }
});

test('blocks a changed payload hash', (t) => {
  const { packageRoot } = createPackage(t);
  fs.appendFileSync(path.join(packageRoot, 'Web-App/public/index.html'), '<!-- tampered -->\n');

  const result = runPreflight(packageRoot);
  const payload = parsePayload(result);

  assert.notEqual(result.status, 0);
  assert.equal(payload.status, 'BLOCKED');
  assert.equal(checksByName(payload).get('package').status, 'BLOCKED');
});

test('blocks a self-consistent forbidden package inventory', (t) => {
  const { packageRoot } = createPackage(t);
  addManifestFile(packageRoot, 'Server/node/server.js', 'development runtime\n');

  const result = runPreflight(packageRoot);
  const payload = parsePayload(result);

  assert.notEqual(result.status, 0);
  assert.equal(payload.status, 'BLOCKED');
  assert.equal(checksByName(payload).get('package').status, 'BLOCKED');
});

test('blocks a missing required public entrypoint even with consistent metadata', (t) => {
  const { packageRoot } = createPackage(t);
  removeManifestFile(packageRoot, 'Server/public/setup.php');

  const result = runPreflight(packageRoot);
  const payload = parsePayload(result);

  assert.notEqual(result.status, 0);
  assert.equal(payload.status, 'BLOCKED');
  assert.equal(checksByName(payload).get('entrypoints').status, 'BLOCKED');
});

test('requires both public-path resolver entrypoints in the packaged inventory', async (t) => {
  for (const relativePath of [
    'Web-App/public/public-path.js',
    'Server/php/src/PublicPath.php'
  ]) {
    await t.test(relativePath, () => {
      const { packageRoot } = createPackage(t);
      removeManifestFile(packageRoot, relativePath);

      const result = runPreflight(packageRoot);
      const payload = parsePayload(result);
      assert.notEqual(result.status, 0);
      assert.equal(checksByName(payload).get('entrypoints').status, 'BLOCKED');
    });
  }
});

test('blocks packaged base-path markup that differs from the requested installation path', async (t) => {
  for (const [name, indexHtml] of [
    ['meta', '<meta name="neutral-base-path" content="/other"><base href="/meine-app/">\n'],
    ['base', '<meta name="neutral-base-path" content="/meine-app"><base href="/other/">\n']
  ]) {
    await t.test(name, () => {
      const { packageRoot } = createPackage(t);
      replaceManifestFile(packageRoot, 'Web-App/public/index.html', indexHtml);

      const result = runPreflight(packageRoot);
      const payload = parsePayload(result);
      assert.notEqual(result.status, 0);
      assert.equal(checksByName(payload).get('package').status, 'PASS');
      assert.equal(checksByName(payload).get('entrypoints').status, 'BLOCKED');
    });
  }
});

test('blocks manifest traversal and package symlinks before reading outside the package', async (t) => {
  await t.test('manifest traversal', () => {
    const { packageRoot } = createPackage(t);
    rewritePackageMetadata(packageRoot, (manifest) => {
      manifest.files[0].path = '../outside';
    });

    const result = runPreflight(packageRoot);
    const payload = parsePayload(result);
    assert.notEqual(result.status, 0);
    assert.equal(payload.status, 'BLOCKED');
  });

  await t.test('payload symlink', () => {
    const { workspace, packageRoot } = createPackage(t);
    const entrypoint = path.join(packageRoot, 'Server/public/setup.php');
    const outside = path.join(workspace, 'outside.php');
    writeFile(outside, '<?php echo "outside";\n');
    fs.rmSync(entrypoint);
    fs.symlinkSync(outside, entrypoint);

    const result = runPreflight(packageRoot);
    const payload = parsePayload(result);
    assert.notEqual(result.status, 0);
    assert.equal(payload.status, 'BLOCKED');
  });
});

test('shared package scanner rejects traversal and symlinks without relying on its caller', async (t) => {
  const { workspace, packageRoot } = createPackage(t);
  const outside = path.join(workspace, 'outside.js');
  writeFile(outside, 'safe outside content\n');

  await t.test('scanner traversal', () => {
    assert.throws(
      () => scanProductionPackage(packageRoot, { files: [{ path: '../outside.js' }] }),
      /unsafe package path/i
    );
  });

  await t.test('scanner symlink', () => {
    const linkPath = path.join(packageRoot, 'Web-App/public/outside.js');
    fs.symlinkSync(outside, linkPath);
    assert.throws(
      () => scanProductionPackage(packageRoot, { files: [{ path: 'Web-App/public/outside.js' }] }),
      /symlink/i
    );
  });
});

test('blocks manifest, CLI and public URL base-path mismatches', async (t) => {
  const { packageRoot } = createPackage(t);
  const cases = [
    { publicUrl: 'https://example.test/andere-app/', basePath: '/andere-app' },
    { publicUrl: 'https://example.test/meine-app/extra', basePath: '/meine-app' },
    { publicUrl: 'https://example.test/meine-app/', basePath: '/andere-app' }
  ];

  for (const options of cases) {
    await t.test(JSON.stringify(options), () => {
      const result = runPreflight(packageRoot, options);
      const payload = parsePayload(result);
      assert.notEqual(result.status, 0);
      assert.equal(payload.status, 'BLOCKED');
      assert.equal(checksByName(payload).get('publicBase').status, 'BLOCKED');
    });
  }
});

test('blocks malformed raw URLs, non-HTTPS URLs and public URL data without echoing values', async (t) => {
  const { packageRoot } = createPackage(t);
  const privateValue = 'private-password-value';
  const urls = [
    'http://example.test/meine-app/',
    'https:example.test/meine-app/',
    'https:/example.test/meine-app/',
    'https:///meine-app/',
    ' https://example.test/meine-app/',
    'https://example.test/meine-app/ ',
    `https://user:${privateValue}@example.test/meine-app/`,
    'https://@example.test/meine-app/',
    `https://example.test/meine-app/?token=${privateValue}`,
    `https://example.test/meine-app/#${privateValue}`,
    'https://example.test/meine-app/.',
    'https://example.test/meine-app/%2e'
  ];

  for (const publicUrl of urls) {
    await t.test(publicUrl.replaceAll(privateValue, '[SECRET]'), () => {
      const result = runPreflight(packageRoot, { publicUrl });
      const payload = parsePayload(result);
      assert.notEqual(result.status, 0);
      assert.equal(payload.status, 'BLOCKED');
      assert.equal(checksByName(payload).get('publicBase').status, 'BLOCKED');
      assert.doesNotMatch(result.stdout + result.stderr, new RegExp(privateValue));
    });
  }
});

test('uses the verified manifest base path when --base-path is omitted', (t) => {
  const { packageRoot } = createPackage(t);
  const result = runPreflight(packageRoot, { basePath: null });
  const payload = parsePayload(result);

  assert.equal(result.status, 0, result.stdout);
  assert.equal(checksByName(payload).get('publicBase').status, 'PASS');
  assert.equal(payload.status, 'NICHT_GEPRUEFT');
});

test('masks scanner findings after package hashes and inventory have passed', (t) => {
  const { packageRoot } = createPackage(t);
  const secretFixtureValue = `ghp_${'0123456789abcdefghijklmnopqrstuvwxyz'}`;
  addManifestFile(
    packageRoot,
    'Web-App/public/runtime-config.js',
    `window.token = ${JSON.stringify(secretFixtureValue)};\n`
  );

  const result = runPreflight(packageRoot);
  const payload = parsePayload(result);
  const output = result.stdout + result.stderr;

  assert.notEqual(result.status, 0);
  assert.equal(payload.status, 'BLOCKED');
  assert.equal(checksByName(payload).get('secrets').status, 'BLOCKED');
  assert.match(output, /\[MASKIERT\]/);
  assert.doesNotMatch(output, new RegExp(secretFixtureValue));
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const workflowPath = path.join(projectRoot, '.github/workflows/ftp-upload.yml');
const smokePath = path.join(projectRoot, 'scripts/production-readonly-smoke.js');
const { runSmoke } = require(smokePath);

function response(status, body, finalUrl) {
  return { status, url: finalUrl, text: async () => body };
}

function productionFixture(overrides = {}) {
  const fixtures = {
    '/': response(200, '<title data-app-title>Example App</title>'),
    '/app/': response(200, '<title data-app-title>Example App</title>'),
    '/admin.php': response(401, '<input id="loginUsername" type="text">'),
    '/api/v1/status': response(200, JSON.stringify({ ok: true, data: { status: 'ACTIVE' } })),
    '/api/v1/modules': response(200, JSON.stringify({
      ok: true,
      data: {
        accessContext: { mode: 'anonymous' },
        modules: [{ id: 'gps', clientAccess: { canView: true, canUse: true } }],
      },
    })),
    '/Server/php/bootstrap.php': response(403, ''),
    '/manifest.json': response(200, JSON.stringify({ basePath: '', sourceCommit: 'abc123', sourceDirty: false })),
    '/Web-App/app/modules/example-module/module.json': response(200, JSON.stringify({
      id: 'example-module',
      compatibility: { api: 1 },
      server: { entry: 'Server/php/modules/example-module/module.php' },
    })),
    ...overrides,
  };
  return async (url) => {
    const fixture = fixtures[new URL(url).pathname];
    return { ...fixture, url: fixture.url || url };
  };
}

test('FTPS workflow runs the permanent read-only HTTP smoke after deployment', () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');

  assert.match(workflow, /Produktionsstand rein lesend prüfen/);
  assert.match(workflow, /node scripts\/production-readonly-smoke\.js/);
  assert.match(workflow, /Produktionsziel prüfen/);
  assert.match(workflow, /validateDeploymentTarget\(process\.env\.NEUTRAL_PUBLIC_URL, process\.env\.NEUTRAL_BASE_PATH\)/);
  assert.ok(workflow.indexOf('Produktionsziel prüfen') < workflow.indexOf('Produktionsbestand per FTPS hochladen'));
  assert.ok(workflow.indexOf('Produktionsbestand per FTPS hochladen') < workflow.indexOf('Produktionsstand rein lesend prüfen'));
  assert.ok(fs.existsSync(smokePath));
  assert.match(workflow, /statuses:\s*write/);
  assert.match(workflow, /needs:\s*deploy/);
  assert.match(workflow, /createCommitStatus/);
  assert.match(workflow, /production\/ftps-http/);
  for (const stage of ['target', 'tests', 'package', 'client', 'upload', 'smoke']) {
    assert.match(workflow, new RegExp(`id: ${stage}`));
  }
  assert.match(workflow, /failed_stage/);
  assert.match(workflow, /needs\.deploy\.outputs\.failed_stage/);
  assert.match(workflow, /`production\/ftps-http\/\$\{failedStage\}`/);
});

test('production smoke covers public, protected, rewrite, viewer and module-contract boundaries', () => {
  const source = fs.readFileSync(smokePath, 'utf8');

  for (const route of [
    '/app/',
    '/admin.php',
    '/api/v1/status',
    '/api/v1/modules',
    '/Server/php/bootstrap.php',
    '/manifest.json',
    '/Web-App/app/modules/',
  ]) {
    assert.match(source, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(source, /FRAMEWORK DASHBOARD/);
  assert.match(source, /clientAccess/);
  assert.doesNotMatch(source, /reference-notes|Neutral Platform/);
  assert.doesNotMatch(source, /Authorization|Cookie|FTP_PASSWORD|FTP_USER|FTP_HOST/);
  assert.match(source, /method:\s*'GET'/);
  assert.doesNotMatch(source, /method:\s*'(POST|PUT|PATCH|DELETE)'/);
});

test('production smoke emits only bounded status evidence for a valid deployment', async () => {
  const output = [];
  const result = await runSmoke({
    baseUrl: 'https://example.test/',
    fetchImpl: productionFixture(),
    write: (line) => output.push(line),
    expectedTitle: 'Example App',
    expectedBasePath: '',
    expectedSourceCommit: 'abc123',
    expectedViewerModules: ['gps'],
    expectedModules: [{
      id: 'example-module',
      compatibility: { api: 1 },
      server: { entry: 'Server/php/modules/example-module/module.php' },
    }],
  });

  assert.deepEqual(result, {
    root: 200,
    rewrite: 200,
    adminProtected: 401,
    statusApi: 200,
    moduleCatalog: 200,
    internalCoreProtected: 403,
    deploymentRevision: true,
    moduleContracts: 1,
    viewerGps: true,
  });
  assert.deepEqual(output.map(JSON.parse), [result]);
});

test('production smoke fails closed when viewer GPS use is not granted', async () => {
  const restrictedCatalog = response(200, JSON.stringify({
    ok: true,
    data: {
      accessContext: { mode: 'anonymous' },
      modules: [{ id: 'gps', clientAccess: { canView: true, canUse: false } }],
    },
  }));

  await assert.rejects(
    runSmoke({
      baseUrl: 'https://example.test/',
      fetchImpl: productionFixture({ '/api/v1/modules': restrictedCatalog }),
      write: () => assert.fail('failed smoke must not emit a success summary'),
      expectedTitle: 'Example App',
      expectedBasePath: '',
      expectedSourceCommit: 'abc123',
      expectedViewerModules: ['gps'],
      expectedModules: [],
    }),
    /Viewer-Modul gps ist nicht nutzbar/
  );
});

test('production smoke rejects redirects outside the expected HTTPS origin and path', async () => {
  const redirectedRoot = response(200, '<title data-app-title>Example App</title>', 'http://other.test/');

  await assert.rejects(
    runSmoke({
      baseUrl: 'https://example.test/',
      fetchImpl: productionFixture({ '/': redirectedRoot }),
      write: () => assert.fail('redirected smoke must not emit a success summary'),
      expectedTitle: 'Example App',
      expectedBasePath: '',
      expectedSourceCommit: 'abc123',
      expectedViewerModules: ['gps'],
      expectedModules: [],
    }),
    /unerwarteten Ziel/
  );
});

test('production smoke rejects a public URL and manifest outside the built base path', async () => {
  await assert.rejects(
    runSmoke({
      baseUrl: 'https://example.test/',
      expectedBasePath: '/meine-app',
      fetchImpl: productionFixture(),
      write: () => assert.fail('mismatched base path must not emit a success summary'),
      expectedTitle: 'Example App',
      expectedSourceCommit: 'abc123',
      expectedViewerModules: [],
      expectedModules: [],
    }),
    /Basispfad/
  );
});

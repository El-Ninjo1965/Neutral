'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const moduleRoot = path.join(projectRoot, 'Web-App/app/modules');
const contractReferencesAvailable = fs.existsSync(path.join(moduleRoot, 'gps/module.json'))
  && fs.existsSync(path.join(moduleRoot, 'reference-notes/module.json'));

function manifest(id) {
  return JSON.parse(fs.readFileSync(path.join(moduleRoot, id, 'module.json'), 'utf8'));
}

test('GPS and reference-notes publish the same versioned server contract', { skip: contractReferencesAvailable ? false : 'contract reference modules are not included' }, () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(moduleRoot, 'index.json'), 'utf8'));
  assert.deepEqual(catalog.map((entry) => entry.id).sort(), ['gps', 'reference-notes']);

  const gps = manifest('gps');
  const notes = manifest('reference-notes');
  for (const item of [gps, notes]) {
    assert.deepEqual(item.compatibility, { core: '>=1.0.0 <2.0.0', api: 1, php: '>=8.1.0' });
    assert.match(item.server.entry, new RegExp(`^Server/php/modules/${item.id}/`));
    assert.equal(Array.isArray(item.server.services), true);
    assert.equal(Array.isArray(item.server.routes), true);
    assert.equal(fs.existsSync(path.join(projectRoot, item.server.entry)), true);
    assert.equal(item.uninstall.dataPolicy, 'retain');
  }
  assert.deepEqual(gps.database.migrations, []);
  assert.equal(notes.database.migrations.length, 1);
  assert.equal(notes.limits[0].key, 'reference-notes.items');
  assert.notDeepEqual(gps.capabilities, notes.capabilities);
});

test('reference-notes server code stays protected and central router remains module-agnostic', { skip: contractReferencesAvailable ? false : 'contract reference modules are not included' }, () => {
  const api = fs.readFileSync(path.join(projectRoot, 'Server/public/api/index.php'), 'utf8');
  assert.doesNotMatch(api, /reference-notes|gps\.status/);
  assert.equal(fs.existsSync(path.join(projectRoot, 'Server/public/modules/reference-notes')), false);
  const serverSource = fs.readFileSync(path.join(projectRoot, 'Server/php/modules/reference-notes/module.php'), 'utf8');
  assert.match(serverSource, /reference_notes_items/);
  assert.match(serverSource, /count\(/);
  assert.doesNotMatch(serverSource, /password|token|secret/i);
});

test('new app bootstrap removes the contract-only reference module from both components', () => {
  const bootstrap = fs.readFileSync(path.join(projectRoot, 'scripts/create-neutral-app.js'), 'utf8');
  assert.match(bootstrap, /reference-notes/);
  assert.match(bootstrap, /Server\/php\/modules/);
  assert.match(bootstrap, /referenceNotesRoot/);
  assert.match(bootstrap, /Server\/php\/modules\/gps/);
});

test('server module lifecycle exposes a generic inactive and downgrade-safe update route', () => {
  const runtime = fs.readFileSync(path.join(projectRoot, 'Server/php/src/Phase7ModuleRuntime.php'), 'utf8');
  const api = fs.readFileSync(path.join(projectRoot, 'Server/public/api/index.php'), 'utf8');
  assert.match(runtime, /public function update\(/);
  assert.match(runtime, /Module must be inactive before update/);
  assert.match(runtime, /Module downgrade is not allowed/);
  assert.match(runtime, /Module is already registered; use update/);
  assert.match(runtime, /Module update is required before activation/);
  assert.match(runtime, /Module installed version is unavailable/);
  assert.ok((runtime.match(/assertNoModuleDowngrade/g) || []).length >= 4);
  assert.match(runtime, /compensate/);
  assert.match(runtime, /pruneObsoleteModulePermissions/);
  assert.match(api, /admin\/modules\/\(\[a-z0-9\\-\]\+\)\/update/);
  assert.match(api, /moduleRuntime->update/);
});

test('PHP contract normalizes and resolves both reference modules', { skip: contractReferencesAvailable ? false : 'contract reference modules are not included' }, (t) => {
  const probe = spawnSync('php', ['-v'], { encoding: 'utf8' });
  if (probe.error && probe.error.code === 'ENOENT') {
    t.skip('PHP executable is not available (ENOENT).');
    return;
  }
  assert.equal(probe.status, 0);
  const script = `
require getenv('NEUTRAL_ROOT') . '/Server/php/bootstrap.php';
$contract = new \\Neutral\\Core\\ModuleContract();
$config = new \\Neutral\\Core\\AppConfig([]);
$database = new \\Neutral\\Core\\Database($config);
$registry = new \\Neutral\\Core\\ModuleServerRegistry(getenv('NEUTRAL_ROOT'), $contract, ['database' => $database]);
$result = [];
foreach (['gps', 'reference-notes'] as $id) {
  $manifest = json_decode(file_get_contents(getenv('NEUTRAL_ROOT') . '/Web-App/app/modules/' . $id . '/module.json'), true, 512, JSON_THROW_ON_ERROR);
  $normalized = $contract->normalize($manifest);
  $resolved = $registry->resolveForLifecycle(['id' => $id, 'manifest' => $manifest, 'registered' => true, 'active' => false]);
  $result[$id] = ['routes' => count($normalized['server']['routes']), 'services' => array_keys($resolved['serviceFactories']), 'migrations' => count($resolved['migrations'])];
}
echo json_encode($result, JSON_THROW_ON_ERROR);
`;
  const result = spawnSync('php', ['-r', script], {
    encoding: 'utf8',
    env: { ...process.env, NEUTRAL_ROOT: projectRoot },
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.gps.routes, 1);
  assert.deepEqual(payload.gps.services, ['module.gps.status']);
  assert.equal(payload.gps.migrations, 0);
  assert.equal(payload['reference-notes'].routes, 3);
  assert.deepEqual(payload['reference-notes'].services, ['module.reference-notes.notes']);
  assert.equal(payload['reference-notes'].migrations, 1);
});

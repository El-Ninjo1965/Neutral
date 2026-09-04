'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const contractPath = path.join(projectRoot, 'Server/php/src/ModuleContract.php');
const registryPath = path.join(projectRoot, 'Server/php/src/ModuleServerRegistry.php');
const kernelPath = path.join(projectRoot, 'Server/php/src/ModuleHttpKernel.php');
const guardPath = path.join(projectRoot, 'Server/php/src/ModuleLimitGuard.php');
const bootstrapPath = path.join(projectRoot, 'Server/php/bootstrap.php');
const apiPath = path.join(projectRoot, 'Server/public/api/index.php');

function phpAvailable() {
  const probe = spawnSync('php', ['-v'], { encoding: 'utf8' });
  return !probe.error && probe.status === 0;
}

test('PHP bootstrap exposes the isolated module contract', () => {
  assert.equal(fs.existsSync(contractPath), true);
  const bootstrap = fs.readFileSync(bootstrapPath, 'utf8');
  assert.match(bootstrap, /ModuleContract\.php/);
});

test('PHP API contains one generic module dispatch hook and no reference-module branch', () => {
  assert.equal(fs.existsSync(registryPath), true);
  assert.equal(fs.existsSync(kernelPath), true);
  const bootstrap = fs.readFileSync(bootstrapPath, 'utf8');
  const api = fs.readFileSync(apiPath, 'utf8');
  assert.match(bootstrap, /ModuleServerRegistry\.php/);
  assert.match(bootstrap, /ModuleHttpKernel\.php/);
  assert.match(api, /\$moduleHttpKernel->dispatch\(/);
  assert.doesNotMatch(api, /reference-notes/);
});

test('module services stay lazy until route authorization and migrations complete', () => {
  const registry = fs.readFileSync(registryPath, 'utf8');
  const kernel = fs.readFileSync(kernelPath, 'utf8');
  assert.match(registry, /serviceFactories/);
  assert.match(registry, /instantiateService/);
  const load = registry.slice(registry.indexOf('private function load'), registry.indexOf('public function instantiateService'));
  assert.doesNotMatch(load, /\$service\(\$this->serviceContext\)/);
  assert.ok(kernel.indexOf('Not authenticated.') < kernel.indexOf('instantiateService'));
});

test('module contract normalizes valid declarations and rejects unsafe or incompatible manifests', (t) => {
  if (!phpAvailable()) {
    t.skip('PHP executable is not available (ENOENT).');
    return;
  }

  const script = `
require ${JSON.stringify(contractPath)};
use Neutral\\Core\\ModuleContract;

$base = [
  'id' => 'reference-notes',
  'name' => 'Reference Notes',
  'version' => '1.0.0',
  'type' => 'module',
  'permissions' => [
    ['key' => 'reference-notes.view'],
    ['key' => 'reference-notes.use'],
  ],
  'compatibility' => ['core' => '>=1.0.0 <2.0.0', 'api' => 1, 'php' => '>=8.0.0'],
  'server' => [
    'entry' => 'Server/php/modules/reference-notes/module.php',
    'services' => ['module.reference-notes.notes'],
    'routes' => [[
      'method' => 'POST',
      'path' => 'items',
      'service' => 'module.reference-notes.notes',
      'action' => 'create',
      'permission' => 'reference-notes.use',
      'csrf' => true,
      'limit' => ['key' => 'reference-notes.items', 'cost' => 1, 'usageAction' => 'count'],
    ]],
  ],
  'database' => [
    'tables' => [['name' => 'reference_notes_items', 'destroyOnUninstall' => false]],
    'migrations' => [['key' => '2026_09_03_0001', 'version' => '1.0.0']],
  ],
  'limits' => [[
    'key' => 'reference-notes.items',
    'default' => 0,
    'roles' => ['user' => 100, 'admin' => null],
  ]],
  'uninstall' => ['dataPolicy' => 'retain'],
];

$contract = new ModuleContract('1.0.0', 1, PHP_VERSION);
$normalized = $contract->normalize($base);
$cases = [];
foreach ([
  'id' => ['id' => '../notes'],
  'entry' => ['server' => array_replace($base['server'], ['entry' => '../../outside.php'])],
  'permission' => ['server' => array_replace($base['server'], ['routes' => [array_replace($base['server']['routes'][0], ['permission' => 'users.write'])]])],
  'csrf' => ['server' => array_replace($base['server'], ['routes' => [array_replace($base['server']['routes'][0], ['csrf' => false])]])],
  'core' => ['compatibility' => array_replace($base['compatibility'], ['core' => '>=2.0.0 <3.0.0'])],
  'api' => ['compatibility' => array_replace($base['compatibility'], ['api' => 2])],
  'php' => ['compatibility' => array_replace($base['compatibility'], ['php' => '>=99.0.0'])],
] as $name => $change) {
  try {
    $contract->normalize(array_replace($base, $change));
    $cases[$name] = false;
  } catch (Throwable $error) {
    $cases[$name] = true;
  }
}

echo json_encode([
  'id' => $normalized['id'],
  'route' => $normalized['server']['routes'][0],
  'migration' => $normalized['database']['migrations'][0],
  'uninstall' => $normalized['uninstall'],
  'rejected' => $cases,
], JSON_THROW_ON_ERROR);
`;
  const result = spawnSync('php', ['-r', script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.id, 'reference-notes');
  assert.equal(payload.route.path, 'items');
  assert.equal(payload.route.limit.key, 'reference-notes.items');
  assert.deepEqual(payload.migration, { key: '2026_09_03_0001', version: '1.0.0' });
  assert.deepEqual(payload.uninstall, { dataPolicy: 'retain' });
  assert.deepEqual(payload.rejected, {
    id: true,
    entry: true,
    permission: true,
    csrf: true,
    core: true,
    api: true,
    php: true,
  });
});

test('module kernel dispatches only active authenticated and permitted services', (t) => {
  if (!phpAvailable()) {
    t.skip('PHP executable is not available (ENOENT).');
    return;
  }
  const script = `
require ${JSON.stringify(contractPath)};
require ${JSON.stringify(registryPath)};
require ${JSON.stringify(kernelPath)};
require ${JSON.stringify(guardPath)};
use Neutral\\Core\\ModuleContract;
use Neutral\\Core\\ModuleServerRegistry;
use Neutral\\Core\\ModuleHttpKernel;
use Neutral\\Core\\ModuleHttpException;

$root = sys_get_temp_dir() . '/neutral-module-kernel-' . bin2hex(random_bytes(6));
$dir = $root . '/Server/php/modules/reference-notes';
mkdir($dir, 0700, true);
$entry = <<<'PHP'
<?php
return [
    'moduleId' => 'reference-notes',
    'services' => [
        'module.reference-notes.notes' => static fn (array $context): object => new class {
            public function list(array $context): array { return ['items' => [], 'actor' => $context['identity']['userId']]; }
        },
    ],
];
PHP;
file_put_contents($dir . '/module.php', $entry);
$manifest = [
  'id' => 'reference-notes', 'name' => 'Reference Notes', 'version' => '1.0.0', 'type' => 'module',
  'permissions' => [['key' => 'reference-notes.view']],
  'compatibility' => ['core' => '>=1.0.0 <2.0.0', 'api' => 1, 'php' => '>=8.0.0'],
  'server' => [
    'entry' => 'Server/php/modules/reference-notes/module.php',
    'services' => ['module.reference-notes.notes'],
    'routes' => [[
      'method' => 'GET', 'path' => 'items', 'service' => 'module.reference-notes.notes',
      'action' => 'list', 'permission' => 'reference-notes.view', 'csrf' => false,
    ]],
  ],
  'database' => ['tables' => [], 'migrations' => []], 'limits' => [],
];
$active = ['id' => 'reference-notes', 'manifest' => $manifest, 'registered' => true, 'active' => true];
$registry = new ModuleServerRegistry($root, new ModuleContract());
$kernel = new ModuleHttpKernel(
  $registry,
  static fn (string $id): ?array => $id === 'reference-notes' ? $active : null,
  static fn (array $identity, string $permission): bool => in_array($permission, $identity['permissions'], true),
  static function (?string $token): void { if ($token !== 'valid') { throw new RuntimeException('invalid'); } }
);
$success = $kernel->dispatch('modules/reference-notes/items', 'GET', ['userId' => '101', 'permissions' => ['reference-notes.view'], 'via' => 'session'], [], [], []);
$statuses = [];
foreach ([
  'anonymous' => null,
  'forbidden' => ['userId' => '101', 'permissions' => [], 'via' => 'session'],
] as $key => $identity) {
  try { $kernel->dispatch('modules/reference-notes/items', 'GET', $identity, [], [], []); }
  catch (ModuleHttpException $error) { $statuses[$key] = $error->status(); }
}
$inactiveKernel = new ModuleHttpKernel($registry, static fn (string $id): ?array => array_replace($active, ['active' => false]), static fn (): bool => true, static function (): void {});
try { $inactiveKernel->dispatch('modules/reference-notes/items', 'GET', ['userId' => '101'], [], [], []); }
catch (ModuleHttpException $error) { $statuses['inactive'] = $error->status(); }
echo json_encode(['success' => $success, 'statuses' => $statuses], JSON_THROW_ON_ERROR);
`;
  const result = spawnSync('php', ['-r', script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.deepEqual(payload.success, { status: 200, data: { items: [], actor: '101' } });
  assert.deepEqual(payload.statuses, { anonymous: 401, forbidden: 403, inactive: 404 });
});

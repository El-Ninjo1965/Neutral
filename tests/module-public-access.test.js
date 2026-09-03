'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const runtimePath = path.join(projectRoot, 'Server/php/src/Phase7ModuleRuntime.php');
const apiPath = path.join(projectRoot, 'Server/public/api/index.php');

test('public module route maps persisted viewer permissions only into an anonymous module context', () => {
  const source = fs.readFileSync(apiPath, 'utf8');

  assert.match(source, /permissionsForRoles\(\['viewer'\]\)/);
  assert.match(source, /'anonymous'\s*=>\s*true/);
  assert.match(source, /'accessContext'\s*=>\s*\[\s*'mode'\s*=>\s*\$identity\s*\?\s*'authenticated'\s*:\s*'anonymous'/s);
  assert.doesNotMatch(source, /\$identity\s*=\s*\[\s*'roles'\s*=>\s*\['viewer'\]/s);
});

test('PHP module access resolver separates visibility, usage and active lifecycle', (t) => {
  const phpProbe = spawnSync('php', ['-v'], { encoding: 'utf8' });
  if (phpProbe.error && phpProbe.error.code === 'ENOENT') {
    t.skip('PHP executable is not available (ENOENT).');
    return;
  }
  assert.equal(phpProbe.status, 0);

  const script = `
require ${JSON.stringify(runtimePath)};
$class = new ReflectionClass(\\Neutral\\Core\\Phase7ModuleRuntime::class);
$runtime = $class->newInstanceWithoutConstructor();
$method = $class->getMethod('resolveClientAccess');
$method->setAccessible(true);
$sanitize = $class->getMethod('sanitizeClientAccessDefinition');
$sanitize->setAccessible(true);
$base = [
  'id' => 'gps',
  'active' => true,
  'enabled' => true,
  'status' => 'active',
  'access' => [
    'visibilityPermissions' => ['gps.view'],
    'usagePermissions' => ['gps.use'],
    'managementPermissions' => ['gps.manage'],
    'adminPermissions' => ['gps.admin'],
  ],
];
$none = ['anonymous' => true, 'permissions' => []];
$view = ['anonymous' => true, 'permissions' => ['gps.view']];
$use = ['anonymous' => true, 'permissions' => ['gps.view', 'gps.use']];
$inactive = $base;
$inactive['active'] = false;
$inactive['enabled'] = false;
$inactive['status'] = 'inactive';
echo json_encode([
  'none' => $method->invoke($runtime, $base, $none),
  'view' => $method->invoke($runtime, $base, $view),
  'use' => $method->invoke($runtime, $base, $use),
  'inactive' => $method->invoke($runtime, $inactive, $use),
  'publicAccess' => $sanitize->invoke($runtime, $base),
], JSON_THROW_ON_ERROR);
`;
  const result = spawnSync('php', ['-r', script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);

  assert.deepEqual(payload.none, { mode: 'anonymous', canView: false, canUse: false });
  assert.deepEqual(payload.view, { mode: 'anonymous', canView: true, canUse: false });
  assert.deepEqual(payload.use, { mode: 'anonymous', canView: true, canUse: true });
  assert.deepEqual(payload.inactive, { mode: 'anonymous', canView: false, canUse: false });
  assert.deepEqual(payload.publicAccess, {
    visibilityPermissions: ['gps.view'],
    usagePermissions: ['gps.use'],
  });
});

test('client catalog contains only modules approved by the resolver and exposes no effective permission list', () => {
  const source = fs.readFileSync(runtimePath, 'utf8');

  assert.match(source, /resolveClientAccess/);
  assert.match(source, /'clientAccess'\s*=>/);
  assert.match(source, /\$clientAccess\['canView'\]/);
  assert.match(source, /sanitizeClientAccessDefinition/);
  assert.doesNotMatch(source, /'effectivePermissions'\s*=>/);
  const clientMap = source.slice(source.indexOf('public function listForClient'), source.indexOf('public function getForAdmin'));
  assert.doesNotMatch(clientMap, /'permissionDefinitions'\s*=>/);
  assert.doesNotMatch(clientMap, /'database'\s*=>/);
});

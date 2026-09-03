'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const bootstrapPath = path.resolve(__dirname, '../Server/php/bootstrap.php');

test('PHP public path resolver supports root and subpath installations', (t) => {
  const script = `
require getenv('NEUTRAL_TEST_BOOTSTRAP');

use Neutral\\Core\\AppConfig;

$root = new AppConfig([]);
$subpath = new AppConfig(['NEUTRAL_BASE_PATH' => '/meine-app/']);
$invalidValues = [
    '.',
    '..',
    '/a/./b',
    '/a/../b',
    '/a%2Fb',
    '/a\\b',
    '/a' . chr(0) . 'b',
    'https://host/app',
    '/a?x=1',
    '/a#section',
    '/ä',
    '/a//b',
    "/a\n",
];
$invalid = [];
foreach ($invalidValues as $value) {
    try {
        new AppConfig(['NEUTRAL_BASE_PATH' => $value]);
        $invalid[$value] = false;
    } catch (InvalidArgumentException $exception) {
        $invalid[$value] = true;
    }
}

echo json_encode([
    'root' => [
        'base' => $root->basePath(),
        'asset' => $root->publicUrl('Web-App/public/style.css'),
        'api' => $root->apiBase(),
    ],
    'subpath' => [
        'base' => $subpath->basePath(),
        'asset' => $subpath->publicUrl('Web-App//public/style.css'),
        'api' => $subpath->apiBase(),
    ],
    'invalid' => $invalid,
    'apiRequest' => (new AppConfig(['NEUTRAL_BASE_PATH' => '/tenant/api']))
        ->apiRequestRoute('/tenant/api/api/v1/status?probe=1'),
    'legacyApiRequest' => $root->apiRequestRoute('/api/status?probe=1'),
]);
`;
  const result = spawnSync('php', ['-r', script], {
    env: { ...process.env, NEUTRAL_TEST_BOOTSTRAP: bootstrapPath },
    encoding: 'utf8'
  });

  if (result.error && result.error.code === 'ENOENT') {
    t.skip('PHP executable is not available (ENOENT).');
    return;
  }

  assert.equal(result.error, undefined, result.error && result.error.message);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const actual = JSON.parse(result.stdout);
  assert.deepEqual(actual.root, {
    base: '',
    asset: '/Web-App/public/style.css',
    api: '/api/v1'
  });
  assert.deepEqual(actual.subpath, {
    base: '/meine-app',
    asset: '/meine-app/Web-App/public/style.css',
    api: '/meine-app/api/v1'
  });
  for (const value of ['.', '..', '/a/./b', '/a/../b', '/a%2Fb', '/a\\b', '/a\0b', 'https://host/app', '/a?x=1', '/a#section', '/ä', '/a//b', '/a\n']) {
    assert.equal(actual.invalid[value], true, `Expected ${JSON.stringify(value)} to be rejected.`);
  }
  assert.deepEqual(actual.apiRequest, { version: 1, route: 'status' });
  assert.deepEqual(actual.legacyApiRequest, { version: null, route: 'status' });
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

test('PHP User UI design validator matches the public structured contract', () => {
  const file = path.join(__dirname, '../Server/php/src/UserUiDesign.php');
  const script = `require ${JSON.stringify(file)}; $v=\\Neutral\\Core\\UserUiDesign::normalize(['light'=>['primary'=>'#ABCDEF'],'dark'=>['primary'=>'#123456'],'geometry'=>['controlRadius'=>8],'customCss'=>'.user-app{opacity:.9}'], true); echo json_encode($v);`;
  const result = spawnSync('php', ['-r', script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const value = JSON.parse(result.stdout);
  assert.equal(value.light.primary, '#abcdef');
  assert.equal(value.dark.primary, '#123456');
  assert.equal(value.geometry.controlRadius, 8);
});

test('PHP User UI design validator rejects unknown properties and CSS injection', () => {
  const file = path.join(__dirname, '../Server/php/src/UserUiDesign.php');
  for (const expression of ["['unknown'=>true]", "['customCss'=>'</style><script>x</script>']"]) {
    const script = `require ${JSON.stringify(file)}; try { \\Neutral\\Core\\UserUiDesign::normalize(${expression}, true); exit(2); } catch (\\RuntimeException $e) { exit(0); }`;
    const result = spawnSync('php', ['-r', script], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
});

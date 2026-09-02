'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const probePath = path.join(projectRoot, 'Server', 'public', 'neutral-db-inspect-91c4e7a2.php');

test('temporary database probe exposes evidence without credential values', () => {
  const source = fs.readFileSync(probePath, 'utf8');

  assert.match(source, /neutral-db-inspect-91c4e7a2/);
  assert.match(source, /hash\('sha256'/);
  assert.match(source, /SHOW TABLES/);
  assert.match(source, /SELECT COUNT\(\*\)/);
  assert.match(source, /unlink\(__FILE__\)/);
  assert.doesNotMatch(source, /['"](?:DB_PASSWORD|MYSQL_PASSWORD)['"]\s*=>/);
  assert.doesNotMatch(source, /echo\s+\$database\[['"](?:password|host|user|name)['"]\]/);
});

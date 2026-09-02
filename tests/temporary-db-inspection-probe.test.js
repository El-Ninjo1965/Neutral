'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const probePath = path.join(projectRoot, 'Server', 'public', 'neutral-db-inspect-91c4e7a2.php');
const workflowPath = path.join(projectRoot, '.github', 'workflows', 'ftp-upload.yml');

test('temporary database probe exposes evidence without credential values', () => {
  const source = fs.readFileSync(probePath, 'utf8');

  assert.match(source, /neutral-db-inspect-91c4e7a2/);
  assert.match(source, /hash\('sha256'/);
  assert.match(source, /SHOW TABLES/);
  assert.match(source, /SELECT COUNT\(\*\)/);
  assert.match(source, /neutral-db-result-91c4e7a2\.php/);
  assert.match(source, /file_put_contents/);
  assert.match(source, /unlink\(__FILE__\)/);
  assert.doesNotMatch(source, /['"](?:DB_PASSWORD|MYSQL_PASSWORD)['"]\s*=>/);
  assert.doesNotMatch(source, /echo\s+\$database\[['"](?:password|host|user|name)['"]\]/);
});

test('temporary workflow evidence step prints only the sanitized database result', () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');

  assert.match(workflow, /neutral-db-result-91c4e7a2\.json/);
  assert.match(workflow, /jq.*db_fingerprint/);
  assert.doesNotMatch(workflow, /echo.*FTP_(?:PASSWORD|USER)/);
});

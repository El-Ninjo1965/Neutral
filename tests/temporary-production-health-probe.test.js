'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'Server', 'public', 'health-91c4e7a2.php'), 'utf8');
const routing = fs.readFileSync(path.resolve(__dirname, '..', '.htaccess'), 'utf8');

test('temporary production health probe is read-only and secretsafe', () => {
  assert.match(source, /neutral-health-91c4e7a2/);
  assert.match(source, /SHOW TABLES/);
  assert.match(source, /SELECT status FROM setup_status/);
  assert.match(source, /health-result-91c4e7a2\.json/);
  assert.doesNotMatch(source, /DROP|DELETE|UPDATE|INSERT|password/i);
});

test('temporary health route is exact and does not expose server internals', () => {
  assert.match(routing, /\^health-proof-91c4e7a2\$/);
  assert.match(routing, /Server\/public\/health-91c4e7a2\.php/);
});

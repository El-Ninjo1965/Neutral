const test = require('node:test');
const assert = require('node:assert/strict');
const ApiClient = require('../Web-App/public/api-client');

test('API client returns a controlled timeout instead of blocking indefinitely', async () => {
  const previousFetch = global.fetch;
  const previousDocument = global.document;
  global.document = { cookie: '' };
  global.fetch = () => new Promise(() => {});
  try {
    const client = new ApiClient('https://example.invalid');
    const result = await client.get('/status', { timeoutMs: 5 });
    assert.equal(result.ok, false);
    assert.equal(result.status, 408);
    assert.equal(result.code, 'API_TIMEOUT');
  } finally {
    global.fetch = previousFetch;
    global.document = previousDocument;
  }
});

test('admin login uses the authoritative login response without a duplicate me roundtrip', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '../Web-App/public/master-ui.js'), 'utf8');
  const loginStart = source.indexOf("loginBtn.addEventListener('click'");
  const logoutStart = source.indexOf("logoutBtn.addEventListener('click'", loginStart);
  const loginHandler = source.slice(loginStart, logoutStart);
  assert.match(loginHandler, /serverApiClient\.login/);
  assert.doesNotMatch(loginHandler, /serverApiClient\.me/);
  assert.match(loginHandler, /Session established\. Opening workspace/);
});

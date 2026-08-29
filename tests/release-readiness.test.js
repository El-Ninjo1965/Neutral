'use strict';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const ServerBootstrap = require('../Server/node/bootstrap/server.js');

let app;
let port;

const requestJson = (method, pathname, payload = null, role = 'admin', token = 'test-token') => new Promise((resolve, reject) => {
  const body = payload ? JSON.stringify(payload) : '';
  const headers = body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {};
  if (role) headers['x-framework-role'] = role;
  if (token) headers['x-admin-access-token'] = token;

  const req = http.request({
    host: '127.0.0.1',
    port,
    path: pathname,
    method,
    headers
  }, (res) => {
    let data = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        resolve({ statusCode: res.statusCode, body: data ? JSON.parse(data) : {} });
      } catch (error) {
        reject(error);
      }
    });
  });

  req.on('error', reject);
  if (body) req.write(body);
  req.end();
});

describe('Release readiness integration tests', { concurrency: false }, () => {
  before(async () => {
    app = ServerBootstrap.createServer();
    await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
    port = app.address().port;
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      app.close((error) => error ? reject(error) : resolve());
    });
  });

  test('GET /api/release/status returns a release snapshot', async () => {
    const result = await requestJson('GET', '/api/release/status', null, 'admin');
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, true);
    assert.ok(result.body.release);
    assert.ok(result.body.release.version);
    assert.ok(typeof result.body.release.status === 'string');
  });

  test('POST /api/admin/release/maintenance toggles maintenance mode', async () => {
    const enabled = await requestJson('POST', '/api/admin/release/maintenance', { maintenanceMode: true, reason: 'Scheduled maintenance' }, 'admin');
    assert.equal(enabled.statusCode, 200);
    assert.equal(enabled.body.ok, true);
    assert.equal(enabled.body.release.maintenanceMode, true);
    assert.equal(enabled.body.release.status, 'maintenance');

    const viewerBlocked = await requestJson('POST', '/api/admin/release/maintenance', { maintenanceMode: false }, 'viewer');
    assert.equal(viewerBlocked.statusCode, 403);
    assert.equal(viewerBlocked.body.ok, false);

    const disabled = await requestJson('POST', '/api/admin/release/maintenance', { maintenanceMode: false }, 'admin');
    assert.equal(disabled.statusCode, 200);
    assert.equal(disabled.body.ok, true);
    assert.equal(disabled.body.release.maintenanceMode, false);
  });
});

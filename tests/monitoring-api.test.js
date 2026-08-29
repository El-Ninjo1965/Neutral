'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const ServerBootstrap = require('../Server/node/bootstrap/server.js');

const logDir = path.resolve(__dirname, '../Server/node/runtime/logs');
const logFile = path.join(logDir, 'system.log.json');

const cleanupLogs = () => {
  if (!fs.existsSync(logDir)) {
    return;
  }
  if (fs.existsSync(logFile)) {
    fs.unlinkSync(logFile);
  }
};

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

let app;
let port;

describe('Monitoring API Integration Tests', { concurrency: false }, () => {
  before(async () => {
    cleanupLogs();
    app = ServerBootstrap.createServer();
    await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
    port = app.address().port;
  });

  after(async () => {
    cleanupLogs();
    await new Promise((resolve, reject) => {
      app.close((error) => error ? reject(error) : resolve());
    });
  });

  test('GET /api/system/info returns framework metadata', async () => {
    const result = await requestJson('GET', '/api/system/info', null, 'admin');
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, true);
    assert.ok(result.body.info);
    assert.ok(result.body.info.version);
    assert.ok(result.body.info.service);
  });

  test('GET /api/logs returns a log summary and empty list before writes', async () => {
    const result = await requestJson('GET', '/api/logs', null, 'admin');
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, true);
    assert.ok(Array.isArray(result.body.logs));
    assert.ok(result.body.summary);
    assert.ok(Number.isInteger(result.body.summary.total));
  });

  test('GET /api/admin/system/health requires admin access', async () => {
    const allowed = await requestJson('GET', '/api/admin/system/health', null, 'admin');
    assert.equal(allowed.statusCode, 200);
    assert.equal(allowed.body.ok, true);
    assert.ok(allowed.body.health);

    const forbidden = await requestJson('GET', '/api/admin/system/health', null, 'viewer');
    assert.equal(forbidden.statusCode, 403);
    assert.equal(forbidden.body.ok, false);
  });
});

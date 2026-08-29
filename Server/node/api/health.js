'use strict';

const { getHealthStatus, getRuntimeStatus } = require('../services/health-service');

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
};

const healthHandler = (req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`).pathname;

  if (pathname === '/health') {
    sendJson(res, 200, getHealthStatus());
    return true;
  }

  if (pathname === '/api/health') {
    sendJson(res, 200, getHealthStatus());
    return true;
  }

  if (pathname === '/api/status') {
    sendJson(res, 200, getRuntimeStatus());
    return true;
  }

  return false;
};

module.exports = healthHandler;
module.exports.sendJson = sendJson;

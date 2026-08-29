'use strict';

const logService = require('../services/log-service');

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
};

const logsHandler = (req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`).pathname;

  if (pathname === '/api/logs' || pathname === '/api/admin/logs') {
    const filters = {};
    const query = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`).searchParams;
    if (query.has('level')) {
      filters.level = query.get('level');
    }
    if (query.has('source')) {
      filters.source = query.get('source');
    }
    if (query.has('search')) {
      filters.search = query.get('search');
    }
    if (query.has('since')) {
      filters.since = query.get('since');
    }
    if (query.has('limit')) {
      filters.limit = Number(query.get('limit')) || 100;
    }

    sendJson(res, 200, {
      ok: true,
      logs: logService.getLogs(filters),
      summary: logService.getSummary()
    });
    return true;
  }

  return false;
};

module.exports = logsHandler;
module.exports.sendJson = sendJson;

'use strict';

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
};

const notFoundMiddleware = (req, res) => {
  sendJson(res, 404, {
    ok: false,
    code: 'NOT_FOUND',
    message: 'Resource not found.'
  });
};

module.exports = notFoundMiddleware;
module.exports.sendJson = sendJson;

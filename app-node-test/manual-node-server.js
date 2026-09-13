'use strict';

const fs = require('node:fs');
const http = require('node:http');

const [token, stateFile, timeoutRaw] = process.argv.slice(2);
const timeoutSeconds = Math.min(300, Math.max(30, Number.parseInt(timeoutRaw || '120', 10) || 120));
if (!/^[a-f0-9]{32,128}$/.test(token || '') || !stateFile) process.exit(2);

const startedAt = new Date().toISOString();
let stopping = false;
const writeState = (status, extra = {}) => {
  const temporary = `${stateFile}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify({
    owner: 'neutral-node-diagnostic', token, status, pid: process.pid,
    nodeBinary: process.execPath, nodeVersion: process.version,
    host: '127.0.0.1', startedAt, timeoutSeconds, ...extra
  }, null, 2), { mode: 0o600 });
  fs.renameSync(temporary, stateFile);
};
const stop = (reason, exitCode = 0) => {
  if (stopping) return;
  stopping = true;
  server.close(() => {
    writeState('stopped', { stoppedAt: new Date().toISOString(), stopReason: reason });
    process.exit(exitCode);
  });
  setTimeout(() => process.exit(exitCode || 1), 1500).unref();
};

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end('NODE_DIAGNOSTIC_RUNNING');
});
server.on('error', (error) => {
  writeState('failed', { stoppedAt: new Date().toISOString(), error: String(error.code || error.message).slice(0, 160) });
  process.exit(3);
});
server.listen(0, '127.0.0.1', () => {
  const address = server.address();
  writeState('running', { port: address.port });
});
process.on('SIGTERM', () => stop('manual-stop'));
process.on('SIGINT', () => stop('manual-stop'));
setTimeout(() => stop('automatic-timeout'), timeoutSeconds * 1000).unref();

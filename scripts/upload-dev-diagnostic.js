'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const source = path.resolve(__dirname, '..', 'dev.php');

function quote(value) {
  return `"${String(value).replace(/(["\\])/g, '\\$1')}"`;
}

function runLftp(commands) {
  return new Promise((resolve, reject) => {
    const child = spawn('lftp', [], { stdio: ['pipe', 'inherit', 'inherit'] });
    child.once('error', () => reject(new Error('FTPS client failed')));
    child.once('close', (status) => status === 0 ? resolve() : reject(new Error('FTPS command failed')));
    child.stdin.end(`${commands}\n`);
  });
}

function settings() {
  const value = {
    host: process.env.FTP_HOST,
    port: process.env.FTP_PORT,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    target: process.env.FTP_TARGET_DIR,
  };
  if (Object.values(value).some((item) => !String(item || '').trim())) throw new Error('Missing FTPS configuration');
  return value;
}

function connection(value) {
  return [
    'set cmd:fail-exit true', 'set net:timeout 30', 'set net:max-retries 1',
    'set ftp:ssl-force true', 'set ftp:ssl-protect-data true',
    'set ssl:check-hostname true', 'set ssl:verify-certificate true',
    `open -u ${quote(value.user)},${quote(value.password)} -p ${quote(value.port)} ${quote(value.host)}`,
  ];
}

async function main() {
  if (!fs.statSync(source).isFile()) throw new Error('Diagnostic source is missing');
  const value = settings();
  const base = value.target.replace(/\/$/, '');
  const remote = `${base}/dev.php`;
  const obsolete = `${base}/app-node-test`;

  try {
    await runLftp([...connection(value), `cls ${quote(remote)}`, 'bye'].join('\n'));
    throw new Error('Refusing to overwrite an existing dev.php');
  } catch (error) {
    if (error.message !== 'FTPS command failed') throw error;
  }

  await runLftp([...connection(value), `put ${quote(source)} -o ${quote(remote)}`, 'bye'].join('\n'));
  const verifyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-dev-verify-'));
  const downloaded = path.join(verifyDir, 'dev.php');
  try {
    await runLftp([...connection(value), `get ${quote(remote)} -o ${quote(downloaded)}`, 'bye'].join('\n'));
    if (!fs.readFileSync(source).equals(fs.readFileSync(downloaded))) throw new Error('Remote dev.php verification failed');
    await runLftp([...connection(value), `rm -r ${quote(obsolete)}`, 'bye'].join('\n'));
    try {
      await runLftp([...connection(value), `cls -d ${quote(obsolete)}`, 'bye'].join('\n'));
      throw new Error('Obsolete diagnostic directory still exists');
    } catch (error) {
      if (error.message !== 'FTPS command failed') throw error;
    }
  } finally {
    fs.rmSync(verifyDir, { recursive: true, force: true });
  }
  console.log(JSON.stringify({ status: 'OK', uploaded: 'dev.php', removed: 'app-node-test', verified: true }));
}

module.exports = { main };


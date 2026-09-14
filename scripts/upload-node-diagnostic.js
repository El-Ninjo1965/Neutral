'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'app-node-test');
const files = ['index.php', 'manual-node-server.js', '.htaccess'];

function quote(value) {
  return `"${String(value).replace(/(["\\])/g, '\\$1')}"`;
}

function config() {
  const values = {
    host: process.env.FTP_HOST,
    port: process.env.FTP_PORT,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    target: process.env.FTP_TARGET_DIR,
  };
  if (Object.values(values).some((value) => !String(value || '').trim())) {
    throw new Error('Missing FTPS configuration');
  }
  return values;
}

function runLftp(commands) {
  return new Promise((resolve, reject) => {
    const child = spawn('lftp', [], { stdio: ['pipe', 'inherit', 'inherit'] });
    child.once('error', () => reject(new Error('FTPS client failed')));
    child.once('close', (status) => status === 0 ? resolve() : reject(new Error('FTPS command failed')));
    child.stdin.end(`${commands}\n`);
  });
}

function connection(settings) {
  return [
    'set cmd:fail-exit true',
    'set net:timeout 30',
    'set net:max-retries 1',
    'set ftp:ssl-force true',
    'set ftp:ssl-protect-data true',
    'set ssl:check-hostname true',
    'set ssl:verify-certificate true',
    `open -u ${quote(settings.user)},${quote(settings.password)} -p ${quote(settings.port)} ${quote(settings.host)}`,
  ];
}

async function main() {
  const settings = config();
  for (const file of files) {
    if (!fs.statSync(path.join(source, file)).isFile()) throw new Error('Diagnostic source is incomplete');
  }

  const remote = `${settings.target.replace(/\/$/, '')}/app-node-test`;
  await runLftp([...connection(settings), `cls -d ${quote(remote)}`, 'bye'].join('\n'));

  await runLftp([
    ...connection(settings),
    `mkdir -p ${quote(remote)}`,
    ...files.map((file) => `put ${quote(path.join(source, file))} -o ${quote(`${remote}/${file}`)}`),
    'bye',
  ].join('\n'));

  const verify = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-node-diagnostic-'));
  try {
    await runLftp([
      ...connection(settings),
      ...files.map((file) => `get ${quote(`${remote}/${file}`)} -o ${quote(path.join(verify, file))}`),
      'bye',
    ].join('\n'));
    for (const file of files) {
      if (!fs.readFileSync(path.join(source, file)).equals(fs.readFileSync(path.join(verify, file)))) {
        throw new Error('Remote diagnostic verification failed');
      }
    }
  } finally {
    fs.rmSync(verify, { recursive: true, force: true });
  }
  console.log(JSON.stringify({ status: 'OK', target: 'app-node-test', files }));
}

module.exports = { main };

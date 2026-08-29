'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');

const normalizeCandidate = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  return trimmed || '';
};

const pathCandidates = () => {
  const candidates = new Set();

  for (const raw of [
    process.env.NEUTRAL_NODE_BIN,
    process.env.NODE_BIN,
    process.env.NODE_PATH,
    process.env.NODE,
    process.env.PATH,
    '/usr/local/bin',
    '/usr/bin',
    '/opt/bin',
    '/opt/local/bin',
    '/usr/local/sbin',
    '/usr/sbin',
    '/bin',
    '/sbin'
  ]) {
    const candidate = normalizeCandidate(String(raw || ''));
    if (!candidate) {
      continue;
    }

    if (candidate.includes(path.delimiter)) {
      for (const part of candidate.split(path.delimiter)) {
        const cleaned = normalizeCandidate(part);
        if (cleaned) {
          candidates.add(cleaned);
        }
      }
      continue;
    }

    candidates.add(candidate);
  }

  return Array.from(candidates);
};

const resolveCommandFromPath = (commandName) => {
  const pathEntries = pathCandidates();
  for (const entry of pathEntries) {
    const candidate = path.join(entry, commandName);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  const whichResult = spawnSync(process.platform === 'win32' ? 'where' : 'which', [commandName], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  if (whichResult.stdout && whichResult.stdout.trim()) {
    return whichResult.stdout.trim().split(/\r?\n/)[0];
  }

  return '';
};

const findNodeBinary = () => {
  const directCandidates = [
    process.env.NEUTRAL_NODE_BIN,
    process.env.NODE_BIN,
    process.env.NODE_PATH,
    process.env.NODE,
    process.execPath
  ].map(normalizeCandidate).filter(Boolean);

  for (const candidate of directCandidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  for (const commandName of ['node', 'nodejs']) {
    const resolved = resolveCommandFromPath(commandName);
    if (resolved) {
      return resolved;
    }
  }

  return '';
};

const nodeBinary = findNodeBinary();
if (!nodeBinary) {
  console.error('Neutral startup failed: no usable Node interpreter was found for this host environment.');
  console.error('Set NEUTRAL_NODE_BIN, NODE_BIN, or ensure a host-provided Node is on PATH.');
  process.exit(127);
}

const serverScript = path.join(projectRoot, 'Server', 'node', 'server.js');
if (!fs.existsSync(serverScript)) {
  console.error(`Neutral startup failed: server entry point not found at ${serverScript}`);
  process.exit(1);
}

const child = spawn(nodeBinary, [serverScript], {
  cwd: projectRoot,
  env: {
    ...process.env,
    NEUTRAL_NODE_BIN: nodeBinary,
    PATH: `${path.dirname(nodeBinary)}${path.delimiter}${process.env.PATH || ''}`
  },
  stdio: 'inherit'
});

child.on('error', (error) => {
  console.error(`Neutral startup failed: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

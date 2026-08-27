'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    ...options
  });

  if (result.error) {
    throw result.error;
  }

  return {
    status: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || ''
  };
}

function parseArgs(argv) {
  const args = new Set(argv);
  const mode = args.has('--web-app') ? 'web-app' : args.has('--server') ? 'server' : 'all';
  const shouldDeploy = args.has('--deploy');
  const shouldPush = args.has('--push');
  const shouldCommit = args.has('--commit') || args.has('--push') || args.has('--deploy');
  const message = args.has('--message') ? argv[argv.indexOf('--message') + 1] : 'chore: sync project changes';
  return { mode, shouldCommit, shouldPush, shouldDeploy, message };
}

function ensureNoTrackedSecrets() {
  const gitLsFiles = run('git', ['ls-files', '.env', '.env.*', '.env.*.*']);
  if (gitLsFiles.status !== 0) {
    return;
  }

  const tracked = (gitLsFiles.stdout || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (tracked.length > 0) {
    throw new Error(`Tracked secret files detected: ${tracked.join(', ')}. Remove them from Git before syncing.`);
  }
}

function maybeCommitAndPush({ shouldCommit, shouldPush, message, mode }) {
  const status = run('git', ['status', '--porcelain']);
  if (!status.stdout.trim()) {
    console.log(JSON.stringify({ status: 'NO_CHANGES', mode, message: 'Working tree is clean.' }, null, 2));
    return;
  }

  if (shouldCommit) {
    const add = run('git', ['add', '-A']);
    if (add.status !== 0) {
      throw new Error(`git add failed: ${add.stderr}`);
    }

    const commit = run('git', ['commit', '-m', message]);
    if (commit.status !== 0) {
      throw new Error(`git commit failed: ${commit.stderr || commit.stdout}`);
    }
    console.log(JSON.stringify({ status: 'COMMITTED', mode, message }, null, 2));
  }

  if (shouldPush) {
    const push = run('git', ['push']);
    if (push.status !== 0) {
      throw new Error(`git push failed: ${push.stderr || push.stdout}`);
    }
    console.log(JSON.stringify({ status: 'PUSHED', mode }, null, 2));
  }
}

function deployTarget(mode) {
  const deployScript = path.join(projectRoot, 'scripts', 'manual-ftps-deploy.js');
  const result = run('node', [deployScript, `--${mode === 'all' ? 'server' : mode}`]);
  if (result.status !== 0) {
    throw new Error(`Deploy failed for ${mode}: ${result.stderr || result.stdout}`);
  }
  console.log(result.stdout);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  ensureNoTrackedSecrets();

  if (args.shouldCommit || args.shouldPush || args.shouldDeploy) {
    maybeCommitAndPush(args);
  }

  if (args.shouldDeploy) {
    if (args.mode === 'all') {
      deployTarget('server');
      deployTarget('web-app');
      return;
    }
    deployTarget(args.mode);
  }

  console.log(JSON.stringify({
    status: 'READY',
    mode: args.mode,
    autoCommit: args.shouldCommit,
    autoPush: args.shouldPush,
    autoDeploy: args.shouldDeploy,
    workflow: 'git status -> optional commit/push -> optional FTPS deploy'
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({ status: 'ERROR', message: error.message }, null, 2));
  process.exit(1);
}

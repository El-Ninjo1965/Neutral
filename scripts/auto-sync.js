'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const DEFAULT_COMMIT_MESSAGE = 'chore: sync project changes';
const IGNORED_PATH_PATTERNS = [
  /^\.git(?:\/|$)/,
  /^node_modules(?:\/|$)/,
  /^\.deploy-staging(?:\/|$)/,
  /^server\/runtime(?:\/|$)/,
  /^test-results(?:\/|$)/,
  /^\.neutral-deploy-manifest\.json$/,
  /^\.env(?:\..*)?$/,
  /^config(?:\/|$)/
];

function normalizeRelative(filePath) {
  if (!filePath) {
    return '';
  }
  return filePath.split(path.sep).join('/').replace(/^\.\//, '').replace(/^\//, '');
}

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

function isIgnoredRelative(relativePath) {
  const normalized = normalizeRelative(relativePath);
  if (!normalized || normalized === '.') {
    return true;
  }

  return IGNORED_PATH_PATTERNS.some((pattern) => pattern.test(normalized));
}

function getTrackedSecretFiles() {
  const result = run('git', ['ls-files', '.env', '.env.*', '.env.*.*']);
  if (result.status !== 0) {
    return [];
  }

  return result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function ensureNoTrackedSecrets() {
  const tracked = getTrackedSecretFiles();
  if (tracked.length > 0) {
    throw new Error(`Tracked secret files detected: ${tracked.join(', ')}. Remove them from Git before syncing.`);
  }
}

function parseArgs(argv) {
  const args = new Set(argv);
  const mode = args.has('--web-app') ? 'web-app' : args.has('--server') ? 'server' : 'all';
  const shouldDeploy = args.has('--deploy');
  const shouldPush = args.has('--push');
  const shouldCommit = args.has('--commit') || args.has('--push') || args.has('--deploy');
  const watchMode = args.has('--watch');
  const message = args.has('--message') ? argv[argv.indexOf('--message') + 1] : DEFAULT_COMMIT_MESSAGE;
  return { mode, shouldCommit, shouldPush, shouldDeploy, watchMode, message };
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
      const output = `${commit.stderr || ''}\n${commit.stdout || ''}`.trim();
      throw new Error(`git commit failed: ${output || 'unknown git error'}`);
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

function triggerDeploy(mode) {
  if (mode === 'all') {
    deployTarget('server');
    deployTarget('web-app');
    return;
  }

  deployTarget(mode);
}

function startWatchLoop() {
  let timer = null;
  let syncing = false;

  const scheduleSync = () => {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      if (syncing) {
        timer = setTimeout(scheduleSync, 1000);
        return;
      }

      syncing = true;
      try {
        const result = spawnSync(process.execPath, [path.join(projectRoot, 'scripts', 'auto-sync.js'), '--commit', '--push', '--deploy'], {
          cwd: projectRoot,
          stdio: 'inherit'
        });

        if (result.status !== 0) {
          console.error(JSON.stringify({ status: 'WATCH_ERROR', message: 'Auto-sync cycle failed.' }, null, 2));
        }
      } finally {
        syncing = false;
      }
    }, 5000);
  };

  const watcher = fs.watch(projectRoot, { recursive: true }, (eventType, filename) => {
    if (!filename) {
      return;
    }

    const relative = normalizeRelative(filename);
    if (isIgnoredRelative(relative)) {
      return;
    }

    scheduleSync();
  });

  if (watcher) {
    console.log(JSON.stringify({ status: 'WATCHING', root: projectRoot, message: 'Watching for project changes.' }, null, 2));
  }

  process.on('SIGINT', () => {
    watcher.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    watcher.close();
    process.exit(0);
  });

  setInterval(() => {
    // keep the watcher alive in the Codespace process manager
  }, 60000).unref();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  ensureNoTrackedSecrets();

  if (args.watchMode) {
    startWatchLoop();
    return;
  }

  if (args.shouldCommit || args.shouldPush || args.shouldDeploy) {
    maybeCommitAndPush(args);
  }

  if (args.shouldDeploy) {
    triggerDeploy(args.mode);
    return;
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

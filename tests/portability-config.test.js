const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const configModulePath = path.resolve(__dirname, '../server/config/index.js');
const phpEnvLoaderPath = path.resolve(__dirname, '../core/php/src/EnvLoader.php');

const createAlternativeInstall = () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-portability-'));
  const appRoot = path.join(tempRoot, 'alt-install', 'app');

  fs.mkdirSync(path.join(appRoot, 'server'), { recursive: true });
  fs.mkdirSync(path.join(appRoot, 'webroot'), { recursive: true });

  fs.writeFileSync(path.join(appRoot, 'package.json'), JSON.stringify({
    name: 'neutral-portability-test',
    private: true,
    type: 'commonjs'
  }, null, 2));

  fs.writeFileSync(path.join(appRoot, '.env'), [
    'PORT=3100',
    'HOST=0.0.0.0',
    'NODE_ENV=production',
    'PUBLIC_URL=https://alt.example.test',
    'PUBLIC_WEBROOT_PATH=/alt-install/app/webroot',
    'API_BASE=/portable-api',
    'APP_API_BASE=/portable-api',
    'DB_TYPE=mysql',
    'DB_HOST=db.alt.internal',
    'DB_PORT=3307',
    'DB_NAME=neutral_portable',
    'DB_USER=portable_user',
    'DB_PASSWORD=portable-secret'
  ].join('\n'));

  return { tempRoot, appRoot };
};

const preserveEnv = () => {
  const values = {
    cwd: process.cwd(),
    NEUTRAL_APP_ROOT: process.env.NEUTRAL_APP_ROOT,
    NEUTRAL_INSTALL_ROOT: process.env.NEUTRAL_INSTALL_ROOT,
    APP_ROOT: process.env.APP_ROOT,
    INSTALL_ROOT: process.env.INSTALL_ROOT,
    APP_API_BASE: process.env.APP_API_BASE,
    NEUTRAL_API_BASE: process.env.NEUTRAL_API_BASE,
    API_BASE: process.env.API_BASE,
    PUBLIC_WEBROOT_PATH: process.env.PUBLIC_WEBROOT_PATH,
    PUBLIC_URL: process.env.PUBLIC_URL
  };

  return () => {
    process.chdir(values.cwd);
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    delete require.cache[require.resolve(configModulePath)];
  };
};

test('Node runtime resolves project root and API base from the active installation context', () => {
  const { appRoot } = createAlternativeInstall();
  const restoreEnv = preserveEnv();

  try {
    process.chdir(appRoot);
    process.env.NEUTRAL_APP_ROOT = appRoot;
    process.env.NEUTRAL_INSTALL_ROOT = appRoot;
    process.env.APP_ROOT = appRoot;
    process.env.INSTALL_ROOT = appRoot;
    process.env.APP_API_BASE = '/portable-api';
    delete require.cache[require.resolve(configModulePath)];

    const config = require(configModulePath);
    assert.equal(config.projectRoot, appRoot);
    assert.equal(config.rootDir, appRoot);
    assert.equal(config.webRootDir, path.join(appRoot, 'webroot'));
    assert.equal(config.apiBase, '/portable-api');
    assert.ok(!config.projectRoot.includes('/home/web1819'));
    assert.ok(!config.webRootDir.includes('/home/web1819'));
    assert.ok(!config.installRoot.includes('/home/web1819'));
  } finally {
    restoreEnv();
  }
});

test('PHP runtime prefers the active install root over shared-host fallback candidates', () => {
  const { appRoot } = createAlternativeInstall();
  const script = [
    `require ${JSON.stringify(phpEnvLoaderPath)};`,
    `$root = ${JSON.stringify(appRoot)};`,
    `$candidates = \\Neutral\\Core\\EnvLoader::defaultCandidates($root);`,
    `echo json_encode($candidates);`
  ].join('\n');

  const stdout = execFileSync('php', ['-r', script], { encoding: 'utf8' });
  const candidates = JSON.parse(stdout);
  assert.ok(candidates[0] === path.join(appRoot, '.env'));
  assert.ok(candidates.includes(path.join(appRoot, '.env')));
  assert.ok(candidates.includes('/home/web1819/.env'));
  assert.ok(candidates.indexOf(path.join(appRoot, '.env')) < candidates.indexOf('/home/web1819/.env'));
});

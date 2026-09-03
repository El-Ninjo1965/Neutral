'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { test, describe } = require('node:test');
const {
  allowedEntries,
  buildCleanupTargets,
  buildLftpCommandScript,
  buildRemoteDeleteTargets,
  compareDeploymentFiles,
  deploymentTargetFingerprint,
  getConfig,
  normalizeManifestPath,
  parseBooleanSetting,
  quoteLftp,
  readDeploymentManifest,
  runLftpScript,
  selectPreviousDeploymentFiles,
  writeDeploymentManifest,
  validateConfig
} = require('../scripts/manual-ftps-deploy.js');

function validFtpConfig(overrides = {}) {
  return {
    FTP_PROTOCOL: 'ftps',
    FTP_SSL_CHECK_HOSTNAME: true,
    FTP_USERNAME: 'deploy-user',
    FTP_PASSWORD: 'deploy-password',
    FTP_PORT: '21',
    FTP_SERVER: 'ftp.example.test',
    FTP_TARGET_DIR: '/public_html/app',
    ...overrides
  };
}

describe('Manual deployment manifest diffing', { concurrency: false }, () => {
  test('gps standalone entry is allowlisted for deployment', () => {
    assert.ok(allowedEntries.includes('.htaccess'));
    assert.ok(allowedEntries.includes('Web-App'));
    assert.ok(allowedEntries.includes('Server/php'));
    assert.ok(allowedEntries.includes('Server/public'));
  });

  test('production staging is the verified package built from the deployment source', (t) => {
    const { buildStagingTree } = require('../scripts/manual-ftps-deploy.js');
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-manual-deploy-'));
    const sourceRoot = path.join(tempRoot, 'source');
    const outputDir = path.join(tempRoot, 'package');
    t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));

    const files = {
      'package.json': JSON.stringify({ version: '1.0.0' }),
      '.htaccess': 'DirectoryIndex Web-App/public/index.html\n',
      '.env.example': 'DB_PASSWORD=\n',
      'Web-App/public/index.html': '<meta name="neutral-base-path" content="">\n<base href="/">\n',
      'Web-App/public/public-path.js': 'globalThis.NeutralPublicPath = {};\n',
      'Server/php/bootstrap.php': '<?php\n',
      'Server/php/src/PublicPath.php': '<?php\n',
      'Server/public/api/index.php': '<?php\n',
      'Server/node/server.js': 'development only\n'
    };
    for (const [relativePath, content] of Object.entries(files)) {
      const filePath = path.join(sourceRoot, relativePath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content);
    }

    const { stagingRoot, missing } = buildStagingTree({ sourceRoot, outputDir, basePath: '/nested' });
    assert.deepStrictEqual(missing, []);
    assert.equal(stagingRoot, outputDir);
    assert.equal(fs.existsSync(path.join(stagingRoot, '.htaccess')), true);
    assert.equal(fs.existsSync(path.join(stagingRoot, 'Server', 'node')), false);
    assert.equal(fs.existsSync(path.join(stagingRoot, 'manifest.json')), true);
    assert.equal(fs.existsSync(path.join(stagingRoot, 'SHA256SUMS')), true);
    assert.match(
      fs.readFileSync(path.join(stagingRoot, 'Web-App/public/index.html'), 'utf8'),
      /content="\/nested"/
    );
  });

  test('shared-host root routes the DirectoryIndex assets to their deployed files', () => {
    const projectRoot = path.resolve(__dirname, '..');
    const routing = fs.readFileSync(path.join(projectRoot, '.htaccess'), 'utf8');
    assert.match(routing, /\^core\/\(\.\*\)\$/);
    assert.match(routing, /Web-App\/core\/\$1/);
    assert.match(routing, /\^style\\\.css\$/);
    assert.match(routing, /Web-App\/public\/style\.css/);
    assert.match(routing, /\^user-app\\\.js\$/);
    assert.match(routing, /Web-App\/public\/user-app\.js/);
    assert.match(routing, /\^public-path\\\.js\$/);
    assert.match(routing, /Web-App\/public\/public-path\.js/);
    assert.doesNotMatch(routing, /^\s*RewriteBase\b/m);
    assert.match(routing, /RewriteCond\s+%\{REQUEST_FILENAME\}\s+-f\s+\[OR\]/);
    assert.match(routing, /RewriteCond\s+%\{REQUEST_FILENAME\}\s+-d/);
    assert.match(routing, /RewriteRule\s+\^\s+-\s+\[L\]/);
    assert.match(routing, /RewriteRule\s+\^\s+Web-App\/public\/index\.html\s+\[L\]/);
  });

  test('public API rewrites terminate at the canonical PHP router before a second per-directory pass', () => {
    const projectRoot = path.resolve(__dirname, '..');
    const routing = fs.readFileSync(path.join(projectRoot, '.htaccess'), 'utf8');

    assert.match(
      routing,
      /RewriteRule\s+\^api\(\?:\/\.\*\)\?\$\s+Server\/public\/api\/index\.php\s+\[END,QSA\]/
    );
    assert.doesNotMatch(routing, /Server\/public\/api\/\$1/);
  });

  test('new file is uploaded', () => {
    const previous = {
      'index.html': { hash: 'old-index', size: 10 },
      'app.js': { hash: 'old-app', size: 20 }
    };
    const current = {
      ...previous,
      'new-file.txt': { hash: 'new-file', size: 8 }
    };

    const result = compareDeploymentFiles(previous, current);
    assert.deepStrictEqual(result.upload, ['new-file.txt']);
    assert.deepStrictEqual(result.update, []);
    assert.deepStrictEqual(result.deleteCandidates, []);
    assert.deepStrictEqual(result.keep, ['app.js', 'index.html']);
  });

  test('changed file is updated', () => {
    const previous = {
      'app.js': { hash: 'old-app', size: 20 }
    };
    const current = {
      'app.js': { hash: 'new-app', size: 25 }
    };

    const result = compareDeploymentFiles(previous, current);
    assert.deepStrictEqual(result.upload, []);
    assert.deepStrictEqual(result.update, ['app.js']);
    assert.deepStrictEqual(result.deleteCandidates, []);
    assert.deepStrictEqual(result.keep, []);
  });

  test('unchanged file is kept without unnecessary upload', () => {
    const previous = {
      'app.js': { hash: 'same-app', size: 20 },
      'style.css': { hash: 'same-style', size: 15 }
    };
    const current = {
      'app.js': { hash: 'same-app', size: 20 },
      'style.css': { hash: 'same-style', size: 15 }
    };

    const result = compareDeploymentFiles(previous, current);
    assert.deepStrictEqual(result.upload, []);
    assert.deepStrictEqual(result.update, []);
    assert.deepStrictEqual(result.deleteCandidates, []);
    assert.deepStrictEqual(result.keep, ['app.js', 'style.css']);
  });

  test('older neutral-managed files are detected for deletion', () => {
    const previous = {
      'old-file.txt': { hash: 'old-file', size: 5 },
      'current.txt': { hash: 'current', size: 6 }
    };
    const current = {
      'current.txt': { hash: 'current', size: 6 }
    };

    const result = compareDeploymentFiles(previous, current);
    assert.deepStrictEqual(result.upload, []);
    assert.deepStrictEqual(result.update, []);
    assert.deepStrictEqual(result.deleteCandidates, ['old-file.txt']);
    assert.deepStrictEqual(result.keep, ['current.txt']);
  });

  test('[review-1] cleanup stays below the FTP target and unsafe manifest paths are rejected', (t) => {
    assert.deepStrictEqual(
      buildCleanupTargets(['assets/old.js'], '/public_html/app/'),
      ['/public_html/app/assets/old.js']
    );

    for (const unsafePath of [
      '../foreign.php',
      'assets/../../foreign.php',
      '/absolute.php',
      '\\absolute.php',
      'C:/absolute.php',
      'line\nbreak.php',
      'nul\0byte.php'
    ]) {
      assert.throws(() => normalizeManifestPath(unsafePath), /manifest path/i, unsafePath);
      assert.throws(() => buildRemoteDeleteTargets([unsafePath], '/public_html/app'), /manifest path/i, unsafePath);
    }

    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-deploy-manifest-path-'));
    const unsafeManifest = path.join(tempRoot, 'manifest.json');
    t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));
    fs.writeFileSync(unsafeManifest, JSON.stringify({
      version: 1,
      files: { '../foreign.php': { path: '../foreign.php', hash: 'abc', size: 3 } }
    }));
    assert.throws(() => readDeploymentManifest(unsafeManifest), /manifest path/i);
  });

  test('foreign server files remain untouched because they are not in the neutral manifest', () => {
    const previous = {
      'developer.php': { hash: 'foreign-file', size: 40 }
    };
    const current = {
      'developer.php': { hash: 'foreign-file', size: 40 }
    };

    const result = compareDeploymentFiles(previous, current);
    assert.deepStrictEqual(result.upload, []);
    assert.deepStrictEqual(result.update, []);
    assert.deepStrictEqual(result.deleteCandidates, []);
    assert.deepStrictEqual(result.keep, ['developer.php']);
  });

  test('root deployment requires an explicit FTP target', () => {
    const previousTarget = process.env.FTP_TARGET_DIR;
    const previousProtocol = process.env.FTP_PROTOCOL;
    try {
      delete process.env.FTP_TARGET_DIR;
      process.env.FTP_PROTOCOL = 'ftps';
      assert.equal(getConfig().FTP_TARGET_DIR, '');
    } finally {
      if (previousTarget === undefined) {
        delete process.env.FTP_TARGET_DIR;
      } else {
        process.env.FTP_TARGET_DIR = previousTarget;
      }
      if (previousProtocol === undefined) {
        delete process.env.FTP_PROTOCOL;
      } else {
        process.env.FTP_PROTOCOL = previousProtocol;
      }
    }

    assert.equal(validateConfig(validFtpConfig({ FTP_TARGET_DIR: '/' })).FTP_TARGET_DIR, '/');
  });

  test('hostname verification is mandatory for FTPS', () => {
    assert.throws(
      () => validateConfig(validFtpConfig({ FTP_SSL_CHECK_HOSTNAME: false })),
      /FTP_SSL_CHECK_HOSTNAME/
    );

    const script = buildLftpCommandScript('/tmp/staging', {
      FTP_PROTOCOL: 'ftps',
      FTP_SSL_CHECK_HOSTNAME: true,
      FTP_USERNAME: 'user',
      FTP_PASSWORD: 'secret',
      FTP_PORT: '21',
      FTP_SERVER: 'ftp.example.test',
      FTP_TARGET_DIR: '/'
    });

    assert.match(script, /set ssl:check-hostname "true"/);
    assert.match(script, /set ssl:verify-certificate true/);
  });

  test('GitHub deployment cannot override mandatory hostname verification through a secret', () => {
    const workflow = fs.readFileSync(path.resolve(__dirname, '../.github/workflows/ftp-upload.yml'), 'utf8');
    assert.match(workflow, /^\s*FTP_SSL_CHECK_HOSTNAME:\s*['"]?true['"]?\s*$/m);
    assert.doesNotMatch(workflow, /FTP_SSL_CHECK_HOSTNAME:\s*\$\{\{\s*secrets\./);
  });

  test('GitHub deployment uses the certified FTPS endpoint and protected public_html target', () => {
    const workflow = fs.readFileSync(path.resolve(__dirname, '../.github/workflows/ftp-upload.yml'), 'utf8');
    assert.match(workflow, /^\s*FTP_HOST:\s*['"]?server\.cpprotect5\.de['"]?\s*$/m);
    assert.match(workflow, /^\s*FTP_PORT:\s*['"]?21['"]?\s*$/m);
    assert.match(workflow, /^\s*FTP_TARGET_DIR:\s*\$\{\{\s*secrets\.FTP_TARGET_DIR\s*\}\}\s*$/m);
    assert.doesNotMatch(workflow, /FTP_HOST:\s*\$\{\{\s*secrets\./);
    assert.doesNotMatch(workflow, /FTP_PORT:\s*\$\{\{\s*secrets\./);
  });

  test('deployment manifests are bound to one irreversible target fingerprint', (t) => {
    assert.equal(typeof deploymentTargetFingerprint, 'function');
    assert.equal(typeof selectPreviousDeploymentFiles, 'function');

    const config = validFtpConfig();
    const fingerprint = deploymentTargetFingerprint(config, 'neutral-production');
    assert.match(fingerprint, /^[a-f0-9]{64}$/);
    assert.equal(deploymentTargetFingerprint(config, 'neutral-production'), fingerprint);

    for (const [field, replacement] of [
      ['FTP_PROTOCOL', 'ftp'],
      ['FTP_SERVER', 'other.example.test'],
      ['FTP_PORT', '2121'],
      ['FTP_USERNAME', 'other-user'],
      ['FTP_TARGET_DIR', '/public_html/other']
    ]) {
      assert.notEqual(
        deploymentTargetFingerprint(validFtpConfig({ [field]: replacement }), 'neutral-production'),
        fingerprint,
        field
      );
    }
    assert.notEqual(deploymentTargetFingerprint(config, 'other-package-format'), fingerprint);

    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-target-manifest-'));
    const filePath = path.join(tempRoot, 'manifest.json');
    t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));
    const files = {
      'old.js': { path: 'old.js', hash: 'abc', size: 3 }
    };
    writeDeploymentManifest(files, fingerprint, filePath);
    const manifest = readDeploymentManifest(filePath);

    assert.equal(manifest.version, 2);
    assert.equal(manifest.targetFingerprint, fingerprint);
    assert.deepStrictEqual(selectPreviousDeploymentFiles(manifest, fingerprint), files);
  });

  test('a changed or legacy deployment target never contributes deletion candidates', (t) => {
    assert.equal(typeof selectPreviousDeploymentFiles, 'function');
    const config = validFtpConfig();
    const currentFingerprint = deploymentTargetFingerprint(config, 'neutral-production');
    const otherFingerprint = deploymentTargetFingerprint(
      validFtpConfig({ FTP_TARGET_DIR: '/public_html/other' }),
      'neutral-production'
    );
    const previousFiles = {
      'obsolete.js': { path: 'obsolete.js', hash: 'old', size: 3 }
    };
    const currentFiles = {
      'current.js': { path: 'current.js', hash: 'new', size: 3 }
    };

    const mismatched = selectPreviousDeploymentFiles({
      version: 2,
      targetFingerprint: otherFingerprint,
      files: previousFiles
    }, currentFingerprint);
    assert.deepStrictEqual(compareDeploymentFiles(mismatched, currentFiles).deleteCandidates, []);

    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'neutral-legacy-manifest-'));
    const legacyPath = path.join(tempRoot, 'manifest.json');
    t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));
    fs.writeFileSync(legacyPath, `${JSON.stringify({ version: 1, files: previousFiles })}\n`);
    const legacy = readDeploymentManifest(legacyPath);
    assert.deepStrictEqual(selectPreviousDeploymentFiles(legacy, currentFingerprint), {});
    assert.deepStrictEqual(compareDeploymentFiles({}, currentFiles).deleteCandidates, []);
  });

  test('lftp receives credentials and commands only through stdin', async () => {
    assert.equal(typeof runLftpScript, 'function');
    const script = buildLftpCommandScript('/tmp/staging', validFtpConfig());
    const captured = {};
    const spawnProcess = (command, args, options) => {
      captured.command = command;
      captured.args = args;
      captured.options = options;
      const child = new EventEmitter();
      child.stdin = new EventEmitter();
      child.stdin.end = (input) => {
        captured.stdin = input;
        queueMicrotask(() => child.emit('close', 0));
      };
      return child;
    };

    await runLftpScript(script, spawnProcess);

    assert.equal(captured.command, 'lftp');
    assert.deepStrictEqual(captured.args, []);
    assert.deepStrictEqual(captured.options, {
      shell: false,
      stdio: ['pipe', 'inherit', 'inherit']
    });
    assert.equal(captured.stdin, `${script}\n`);
    const processLaunch = JSON.stringify([captured.command, captured.args, captured.options]);
    assert.doesNotMatch(processLaunch, /deploy-password/);
    assert.equal(processLaunch.includes(script), false);
  });

  test('[review-2] lftp values are centrally validated, escaped and quoted', () => {
    assert.equal(
      quoteLftp('back\\slash"quote$dollar`tick'),
      '"back\\\\slash\\"quote\\$dollar\\`tick"'
    );

    for (const [field, value] of [
      ['FTP_PORT', '0'],
      ['FTP_PORT', '65536'],
      ['FTP_PORT', '21x'],
      ['FTP_PROTOCOL', 'sftp'],
      ['FTP_SSL_CHECK_HOSTNAME', 'maybe'],
      ['FTP_SERVER', 'host\nset cmd:fail-exit false'],
      ['FTP_USERNAME', 'user\rbye'],
      ['FTP_PASSWORD', 'pass\0word'],
      ['FTP_TARGET_DIR', '/public_html/\u0007app'],
      ['FTP_TARGET_DIR', '/public_html/\u0085app'],
      ['FTP_TARGET_DIR', '/public_html/../other']
    ]) {
      assert.throws(() => validateConfig(validFtpConfig({ [field]: value })), /invalid ftp/i, `${field}=${value}`);
    }

    const config = validFtpConfig({
      FTP_SERVER: 'ftp.$example.test',
      FTP_USERNAME: 'deploy$user',
      FTP_PASSWORD: 'p\\ass"$word`',
      FTP_TARGET_DIR: '/public_html/app dir'
    });
    const stagingRoot = '/tmp/staging dir';
    const script = buildLftpCommandScript(stagingRoot, config, {
      upload: [],
      update: [],
      deleteCandidates: ['old file.js'],
      keep: []
    });

    for (const value of [
      config.FTP_SERVER,
      config.FTP_USERNAME,
      config.FTP_PASSWORD,
      config.FTP_PORT,
      config.FTP_TARGET_DIR,
      stagingRoot,
      '/public_html/app dir/old file.js'
    ]) {
      assert.ok(script.includes(quoteLftp(value)), `missing quoted lftp value: ${value}`);
    }
    assert.doesNotMatch(script, /ftp\.\$example\.test/);
    assert.doesNotMatch(script, /deploy\$user/);
  });

  test('boolean deploy settings reject invalid values', () => {
    assert.equal(parseBooleanSetting('true'), true);
    assert.equal(parseBooleanSetting('false'), false);
    assert.throws(() => parseBooleanSetting('maybe'), /Invalid boolean setting/);
  });

  test('critical FTPS workflow files stay present in the repository', () => {
    const projectRoot = path.resolve(__dirname, '..');
    assert.equal(fs.existsSync(path.join(projectRoot, 'scripts', 'manual-ftps-deploy.js')), true);
    assert.equal(fs.existsSync(path.join(projectRoot, '.github', 'workflows', 'ftp-upload.yml')), true);
    assert.equal(fs.existsSync(path.join(projectRoot, '.env.ftp.deploy.example')), true);
  });

  test('server documentation requires an explicit target and hostname verification', () => {
    const projectRoot = path.resolve(__dirname, '..');
    const documentation = fs.readFileSync(path.join(projectRoot, 'Install-README-Server.md'), 'utf8');

    assert.equal(/`FTP_TARGET_DIR`[^\n]*(?:ausdrücklich|explizit)/i.test(documentation), true);
    assert.equal(/`FTP_SSL_CHECK_HOSTNAME=false`[^\n]*(?:abgelehnt|unzulässig)/i.test(documentation), true);
    assert.equal(/vollständig[^\n]*(?:übertragen|transferiert)/i.test(documentation), true);
  });

  test('FTPS deployment uploads the root htaccess explicitly', () => {
    const projectRoot = path.resolve(__dirname, '..');
    const workflow = fs.readFileSync(path.join(projectRoot, '.github', 'workflows', 'ftp-upload.yml'), 'utf8');
    assert.match(workflow, /npm run package:production/);
    assert.match(workflow, /STAGING_DIR="\$GITHUB_WORKSPACE\/dist\/neutral-production"/);
    assert.match(workflow, /FTP_SERVER="\$FTP_HOST"[\s\S]*node scripts\/manual-ftps-deploy\.js/);
    assert.match(workflow, /FTP_TARGET_DIR:\s*\$\{\{\s*secrets\.FTP_TARGET_DIR\s*\}\}/);
    assert.doesNotMatch(workflow, /FTP_TARGET_DIR:[^\n]*\|\|/);
    assert.doesNotMatch(workflow, /lftp\s+<<|open -u|mirror -R/);
    assert.doesNotMatch(workflow, /copy_dir Web-App|cp -a Web-App/);

    const script = buildLftpCommandScript('/tmp/staging', {
      FTP_PROTOCOL: 'ftps',
      FTP_SSL_CHECK_HOSTNAME: true,
      FTP_USERNAME: 'user',
      FTP_PASSWORD: 'secret',
      FTP_PORT: '21',
      FTP_SERVER: 'ftp.example.test',
      FTP_TARGET_DIR: '/public_html'
    });
    assert.match(script, /put "\/tmp\/staging\/\.htaccess" -o "\/public_html\/\.htaccess"/);
    assert.doesNotMatch(script, /--only-newer/);

    const deploySource = fs.readFileSync(path.join(projectRoot, 'scripts', 'manual-ftps-deploy.js'), 'utf8');
    assert.doesNotMatch(deploySource, /\btransferTarget\s*:/);
    assert.doesNotMatch(deploySource, /\bftpProtocol\s*:/);
  });
});

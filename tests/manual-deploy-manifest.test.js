'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { test, describe } = require('node:test');
const {
  allowedEntries,
  buildLftpCommandScript,
  compareDeploymentFiles,
  parseBooleanSetting
} = require('../scripts/manual-ftps-deploy.js');

describe('Manual deployment manifest diffing', { concurrency: false }, () => {
  test('gps standalone entry is allowlisted for deployment', () => {
    assert.ok(allowedEntries.includes('.htaccess'));
    assert.ok(allowedEntries.includes('Web-App'));
    assert.ok(allowedEntries.includes('Server/php'));
    assert.ok(allowedEntries.includes('Server/public'));
  });

  test('production staging exposes routing protection and excludes Node runtime', () => {
    const { buildStagingTree } = require('../scripts/manual-ftps-deploy.js');
    const fs = require('node:fs');
    const path = require('node:path');
    const { stagingRoot, missing } = buildStagingTree();
    assert.deepStrictEqual(missing, []);
    assert.equal(fs.existsSync(path.join(stagingRoot, '.htaccess')), true);
    assert.equal(fs.existsSync(path.join(stagingRoot, 'Server', 'node')), false);
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

  test('hostname verification can be disabled explicitly for mismatched FTPS certificates', () => {
    const script = buildLftpCommandScript('/tmp/staging', {
      FTP_PROTOCOL: 'ftps',
      FTP_SSL_CHECK_HOSTNAME: false,
      FTP_USERNAME: 'user',
      FTP_PASSWORD: 'secret',
      FTP_PORT: '21',
      FTP_SERVER: 'ftp.example.test',
      FTP_TARGET_DIR: '/'
    });

    assert.match(script, /set ssl:check-hostname false/);
    assert.match(script, /set ssl:verify-certificate true/);
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
});

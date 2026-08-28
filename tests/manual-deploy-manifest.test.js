'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { test, describe } = require('node:test');
const {
  allowedEntries,
  compareDeploymentFiles,
  copyPublicWebAppBundle,
  publicWebAppDirectoryCopies,
  publicWebAppFileCopies
} = require('../scripts/manual-ftps-deploy.js');

describe('Manual deployment manifest diffing', { concurrency: false }, () => {
  test('gps standalone entry is allowlisted for deployment', () => {
    assert.ok(allowedEntries.includes('app/modules/gps/index.html'));
  });

  test('public web-app bundle is staged from the user shell sources', () => {
    assert.deepStrictEqual(
      publicWebAppFileCopies.map((entry) => entry.target),
      [
        'web-app/index.html',
        'web-app/style.css',
        'web-app/user-app.js',
        'web-app/api-client.js'
      ]
    );
    assert.deepStrictEqual(
      publicWebAppDirectoryCopies.map((entry) => entry.target),
      ['web-app/app']
    );
  });

  test('public web-app bundle copies the expected files into staging', () => {
    const stagingRoot = fs.mkdtempSync(path.join(fs.realpathSync(require('node:os').tmpdir()), 'neutral-web-app-'));
    try {
      copyPublicWebAppBundle(stagingRoot);
      for (const entry of publicWebAppFileCopies) {
        assert.ok(fs.existsSync(path.join(stagingRoot, entry.target)));
      }
      for (const entry of publicWebAppDirectoryCopies) {
        assert.ok(fs.existsSync(path.join(stagingRoot, entry.target, 'modules', 'gps', 'index.js')));
      }
    } finally {
      fs.rmSync(stagingRoot, { recursive: true, force: true });
    }
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
});

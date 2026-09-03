'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PublicPath = require('../Web-App/public/public-path.js');

test('web-app documentation names basePath as the resolver input', () => {
  const documentation = fs.readFileSync(path.join(__dirname, '..', 'Install-README-Web-App.md'), 'utf8');

  assert.equal(/public-path\.js[^\n]*liest[^\n]*`basePath`/i.test(documentation), true);
  assert.equal(/liest[^\n]*\(`basePath`,\s*`apiBase`\)/i.test(documentation), false);
  assert.equal(/<base href>/i.test(documentation), true);
});

const withBasePath = (basePath, callback) => {
  const previous = globalThis.NeutralConfig;
  globalThis.NeutralConfig = { basePath };
  try {
    callback();
  } finally {
    if (previous === undefined) {
      delete globalThis.NeutralConfig;
    } else {
      globalThis.NeutralConfig = previous;
    }
  }
};

const withDocumentBasePath = (basePath, callback) => {
  const previousConfig = globalThis.NeutralConfig;
  const previousDocument = globalThis.document;
  delete globalThis.NeutralConfig;
  globalThis.document = {
    querySelector: (selector) => selector === 'meta[name="neutral-base-path"]'
      ? { content: basePath }
      : null
  };
  try {
    callback();
  } finally {
    if (previousConfig === undefined) delete globalThis.NeutralConfig;
    else globalThis.NeutralConfig = previousConfig;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
};

test('normalizes the configured public base path', () => {
  assert.equal(PublicPath.normalize(''), '');
  assert.equal(PublicPath.normalize('/'), '');
  assert.equal(PublicPath.normalize('meine-app'), '/meine-app');
  assert.equal(PublicPath.normalize('/meine-app/'), '/meine-app');
});

test('rejects unsafe public base paths', () => {
  for (const value of ['https://host/app', '/a/../b', '/a%2Fb', '/a?x=1', '/ä', '/a//b', '/a\\b', '/a#section']) {
    assert.throws(() => PublicPath.normalize(value), /base path/i);
  }
});

test('resolves root installation URLs', () => {
  withBasePath('', () => {
    assert.equal(PublicPath.base(), '');
    assert.equal(PublicPath.join('Web-App/public/style.css'), '/Web-App/public/style.css');
    assert.equal(PublicPath.asset('style.css'), '/Web-App/public/style.css');
    assert.equal(PublicPath.api('auth/me'), '/api/v1/auth/me');
    assert.equal(PublicPath.admin(), '/admin.php');
    assert.equal(PublicPath.setup(), '/setup.php');
  });
});

test('resolves subpath installation URLs', () => {
  withBasePath('/meine-app/', () => {
    assert.equal(PublicPath.base(), '/meine-app');
    assert.equal(PublicPath.join('/Web-App//public/style.css'), '/meine-app/Web-App/public/style.css');
    assert.equal(PublicPath.asset('/style.css'), '/meine-app/Web-App/public/style.css');
    assert.equal(PublicPath.api('/auth/me'), '/meine-app/api/v1/auth/me');
    assert.equal(PublicPath.admin(), '/meine-app/admin.php');
    assert.equal(PublicPath.setup(), '/meine-app/setup.php');
  });
});

test('does not fall back to root for an invalid configured base path', () => {
  withBasePath('/a/../b', () => {
    assert.throws(() => PublicPath.base(), /base path/i);
  });
});

test('uses the static entry meta base path when runtime config is absent', () => {
  withDocumentBasePath('/meine-app', () => {
    assert.equal(PublicPath.base(), '/meine-app');
    assert.equal(PublicPath.api('status'), '/meine-app/api/v1/status');
  });
});

test('runtime config takes precedence over the static entry meta base path', () => {
  const previousDocument = globalThis.document;
  globalThis.document = { querySelector: () => ({ content: '/ignored' }) };
  try {
    withBasePath('/configured', () => {
      assert.equal(PublicPath.base(), '/configured');
    });
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});

test('the source document base keeps static assets below root on deep SPA routes', () => {
  const html = fs.readFileSync(path.join(__dirname, '../Web-App/public/index.html'), 'utf8');
  const baseMatch = html.match(/<base\b[^>]*\bhref="([^"]+)"[^>]*>/i);
  const coreSources = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((source) => /(?:^|\/)core\//.test(source));

  assert.ok(baseMatch, 'index.html must declare a document base');
  assert.equal(baseMatch[1], '/');
  assert.ok(coreSources.length > 0, 'index.html must load core scripts');
  const documentBase = new URL(baseMatch[1], 'https://example.test/orders/42/');
  for (const source of coreSources) {
    assert.equal(
      new URL(source, documentBase).pathname,
      `/core/${source.split('/').pop()}`,
      `${source} below the declared root base`
    );
  }
});

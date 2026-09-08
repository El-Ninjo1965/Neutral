'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { create, STORAGE_KEY } = require('../Web-App/public/homepage-cache.js');

const memoryStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    value: (key) => values.get(key)
  };
};

test('public homepage cache round-trips exact HTML for immediate warmstart', () => {
  const storage = memoryStorage();
  const cache = create(storage);
  const homepage = { mode: 'html', title: 'Start', content: '  <h1>TEST</h1>\n', moduleId: '' };
  assert.equal(cache.write(homepage), true);
  assert.deepEqual(cache.read(), homepage);
});

test('server refresh replaces an older cached public homepage', () => {
  const storage = memoryStorage();
  const cache = create(storage);
  cache.write({ mode: 'html', title: '', content: '<h1>OLD</h1>', moduleId: '' });
  cache.write({ mode: 'html', title: '', content: '<h1>NEW</h1>', moduleId: '' });
  assert.equal(cache.read().content, '<h1>NEW</h1>');
});

test('offline reads reject incompatible, malformed and permission-bearing records', () => {
  const incompatible = memoryStorage({
    [STORAGE_KEY]: JSON.stringify({ schemaVersion: 2, scope: 'public-homepage', homepage: { mode: 'html', title: '', content: '<h1>X</h1>', moduleId: '' } })
  });
  assert.equal(create(incompatible).read(), null);
  const authenticated = memoryStorage({
    [STORAGE_KEY]: JSON.stringify({ schemaVersion: 1, scope: 'authenticated-homepage', homepage: { mode: 'module', title: '', content: '', moduleId: 'gps' } })
  });
  assert.equal(create(authenticated).read(), null);
  assert.equal(create(memoryStorage({ [STORAGE_KEY]: '{broken' })).read(), null);
});

test('empty first-start state is not promoted to a valid warmstart', () => {
  const cache = create(memoryStorage());
  assert.equal(cache.read(), null);
  assert.equal(cache.write({ mode: 'html', title: '', content: '', moduleId: '' }), false);
  assert.equal(cache.write({ mode: 'module', title: '', content: '', moduleId: '' }), false);
});

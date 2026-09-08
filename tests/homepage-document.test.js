'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const HomepageDocument = require('../Web-App/public/homepage-document.js');

test('fragment gets explicit light and dark document defaults without changing its content', () => {
  const content = '<h1>TEST</h1>';
  const dark = HomepageDocument.build(content, 'dark');
  const light = HomepageDocument.build(content, 'light');

  assert.match(dark, /<meta name="color-scheme" content="dark">/);
  assert.match(dark, /body\{min-height:100vh;background-color:#111b2d;color:#edf3ff/);
  assert.match(light, /<meta name="color-scheme" content="light">/);
  assert.match(light, /body\{min-height:100vh;background-color:#ffffff;color:#1c2432/);
  assert.equal(dark.split(content).length - 1, 1);
  assert.equal(light.split(content).length - 1, 1);
});

test('framework defaults precede explicit administrator CSS so author styling remains authoritative', () => {
  const content = '<style>body { background: white; color: black; }</style><h1>TEST</h1>';
  const document = HomepageDocument.build(content, 'dark');

  assert.ok(document.indexOf('data-neutral-homepage-defaults') < document.indexOf(content));
  assert.ok(document.indexOf('body{min-height:100vh') < document.indexOf('body { background: white'));
  assert.equal(document.split(content).length - 1, 1);
});

test('complete HTML documents keep their exact source and receive defaults at the start of head', () => {
  const content = '<!doctype html><html lang="de"><head><style>body{background:papayawhip}</style></head><body><h1>TEST</h1></body></html>';
  const document = HomepageDocument.build(content, 'dark');

  assert.ok(document.includes(content.slice(0, content.indexOf('<head>') + 6)));
  assert.ok(document.indexOf('data-neutral-homepage-defaults') < document.indexOf('<style>body{background:papayawhip}</style>'));
  assert.equal(document.replace(/<meta name="color-scheme"[\s\S]*?<\/style>/, ''), content);
});

test('an existing iframe can be updated in place when the theme changes', () => {
  const classes = new Set();
  let load;
  const frame = {
    style: {},
    srcdoc: '',
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name)
    },
    addEventListener: (_name, handler) => { load = handler; }
  };
  const content = '<h1>TEST</h1>';

  HomepageDocument.apply(frame, content, 'dark');
  const darkDocument = frame.srcdoc;
  load();
  assert.equal(classes.has('homepage-frame-ready'), true);
  HomepageDocument.apply(frame, content, 'light');

  assert.equal(frame.style.colorScheme, 'light');
  assert.equal(frame.style.backgroundColor, '#ffffff');
  assert.equal(classes.has('homepage-frame-ready'), false);
  assert.notEqual(frame.srcdoc, darkDocument);
  assert.match(frame.srcdoc, /content="light"/);
  assert.equal(frame.srcdoc.split(content).length - 1, 1);
});

test('load gate is installed and themed before srcdoc can become visible', () => {
  const lifecycle = [];
  const classes = new Set(['homepage-frame-ready']);
  let load;
  const frame = {
    style: {},
    classList: {
      add(name) { lifecycle.push(`class:add:${name}`); classes.add(name); },
      remove(name) { lifecycle.push(`class:remove:${name}`); classes.delete(name); }
    },
    addEventListener(name, handler, options) {
      lifecycle.push(`listener:${name}:${options.once}`);
      load = handler;
    }
  };
  Object.defineProperty(frame, 'srcdoc', {
    set(value) { lifecycle.push('srcdoc'); this._srcdoc = value; },
    get() { return this._srcdoc; }
  });

  HomepageDocument.apply(frame, '<h1>TEST</h1>', 'dark');

  assert.deepEqual(lifecycle.slice(0, 3), [
    'class:remove:homepage-frame-ready',
    'listener:load:true',
    'srcdoc'
  ]);
  assert.equal(frame.style.colorScheme, 'dark');
  assert.equal(frame.style.backgroundColor, '#111b2d');
  assert.equal(classes.has('homepage-frame-ready'), false);
  load();
  assert.equal(classes.has('homepage-frame-ready'), true);
});

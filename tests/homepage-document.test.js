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
  const frame = { style: {}, srcdoc: '' };
  const content = '<h1>TEST</h1>';

  HomepageDocument.apply(frame, content, 'dark');
  const darkDocument = frame.srcdoc;
  HomepageDocument.apply(frame, content, 'light');

  assert.equal(frame.style.colorScheme, 'light');
  assert.notEqual(frame.srcdoc, darkDocument);
  assert.match(frame.srcdoc, /content="light"/);
  assert.equal(frame.srcdoc.split(content).length - 1, 1);
});

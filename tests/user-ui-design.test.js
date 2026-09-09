'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const design = require('../Web-App/public/user-ui-design');

test('user UI design keeps Light and Dark palettes separate and maps only published tokens', () => {
  const value = design.normalize({ light: { primary: '#ABCDEF' }, dark: { primary: '#123456' } }, { strict: true });
  assert.equal(value.light.primary, '#abcdef');
  assert.equal(value.dark.primary, '#123456');
  assert.equal(design.variables(value, 'dark')['--primary'], '#123456');
});

test('V2 maps component-specific actions, navigation and form controls independently', () => {
  const value = design.normalize({ dark: { primaryText: '#ffff00', navActiveBackground: '#102040', navInactiveIcon: '#ffee00', inputBorder: '#aabbcc', inputFocus: '#ddeeff' } }, { strict: true });
  const vars = design.variables(value, 'dark');
  assert.equal(vars['--action-primary-text'], '#ffff00');
  assert.equal(vars['--nav-active-bg'], '#102040');
  assert.equal(vars['--nav-inactive-icon'], '#ffee00');
  assert.equal(vars['--input-border'], '#aabbcc');
  assert.equal(vars['--input-focus'], '#ddeeff');
});

test('V1 values migrate to V2 defaults without losing configured base colors', () => {
  const value = design.normalize({ schemaVersion: 1, dark: { primary: '#123456' } }, { strict: true });
  assert.equal(value.schemaVersion, 2);
  assert.equal(value.dark.primary, '#123456');
  assert.equal(value.dark.inputBorder, design.defaults().dark.inputBorder);
});

test('user UI design rejects unknown, malformed and out-of-range structured values', () => {
  assert.throws(() => design.normalize({ light: { script: '#ffffff' } }, { strict: true }), /Unknown light token/);
  assert.throws(() => design.normalize({ mystery: true }, { strict: true }), /Unknown design property/);
  assert.throws(() => design.normalize({ dark: { text: 'white' } }, { strict: true }), /six-digit hex/);
  assert.throws(() => design.normalize({ geometry: { controlRadius: 99 } }, { strict: true }), /outside its supported range/);
});

test('custom CSS has a size and CSS-only boundary', () => {
  assert.equal(design.normalize({ customCss: '.user-app { letter-spacing: 1px; }' }, { strict: true }).customCss, '.user-app { letter-spacing: 1px; }');
  assert.throws(() => design.normalize({ customCss: '</style><script>alert(1)</script>' }, { strict: true }), /safe CSS/);
  assert.throws(() => design.normalize({ customCss: '@import "https://example.test/x.css";' }, { strict: true }), /safe CSS/);
  assert.throws(() => design.normalize({ customCss: 'x'.repeat(design.MAX_CUSTOM_CSS + 1) }, { strict: true }), /safe CSS/);
});

test('versioned public cache supplies last valid design and rejects incompatible records', () => {
  const values = new Map();
  const previous = global.localStorage;
  global.localStorage = { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  try {
    const saved = design.write({ dark: { background: '#010203' } });
    assert.equal(saved.dark.background, '#010203');
    assert.equal(design.read().dark.background, '#010203');
    values.set(design.STORAGE_KEY, JSON.stringify({ public: true, schemaVersion: 1, design: { schemaVersion: 1, dark: { primary: '#112233' } } }));
    assert.equal(design.read().dark.primary, '#112233');
    assert.equal(design.read().schemaVersion, 2);
    values.set(design.STORAGE_KEY, JSON.stringify({ public: true, schemaVersion: 99, design: { schemaVersion: 99 } }));
    assert.equal(design.read(), null);
  } finally { global.localStorage = previous; }
});

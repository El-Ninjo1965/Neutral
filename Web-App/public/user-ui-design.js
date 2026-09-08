'use strict';

(function publishUserUiDesign(root, factory) {
  const contract = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = contract;
  if (root) root.NeutralUserUiDesign = contract;
}(typeof window !== 'undefined' ? window : globalThis, () => {
  const SCHEMA_VERSION = 1;
  const STORAGE_KEY = 'neutral.public.user-ui-design.v1';
  const MAX_CUSTOM_CSS = 20000;
  const colors = ['background', 'surface', 'primary', 'text', 'muted', 'border'];
  const defaults = Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    light: Object.freeze({ background: '#f3f6fb', surface: '#ffffff', primary: '#2f6fed', text: '#1c2432', muted: '#5f7087', border: '#dfe7f3' }),
    dark: Object.freeze({ background: '#0b1220', surface: '#111b2d', primary: '#7aa2ff', text: '#edf3ff', muted: '#9db0c8', border: '#23314d' }),
    geometry: Object.freeze({ controlRadius: 11, surfaceRadius: 18, contentMaxWidth: 1120 }),
    typography: Object.freeze({ baseFontSize: 16 }),
    customCss: ''
  });
  const cloneDefaults = () => JSON.parse(JSON.stringify(defaults));
  const hex = (value) => typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : null;
  const bounded = (value, min, max) => Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max ? Number(value) : null;
  const safeCss = (value) => typeof value === 'string' && value.length <= MAX_CUSTOM_CSS && !/<\/style|@import|javascript:/i.test(value);

  const normalize = (value, { strict = false } = {}) => {
    const candidate = value && typeof value === 'object' ? value : {};
    const output = cloneDefaults();
    const errors = [];
    for (const key of Object.keys(candidate)) if (!['schemaVersion', 'light', 'dark', 'geometry', 'typography', 'customCss'].includes(key)) errors.push(`Unknown design property: ${key}`);
    if (candidate.schemaVersion !== undefined && candidate.schemaVersion !== SCHEMA_VERSION) errors.push('Unsupported user UI design schemaVersion');
    for (const mode of ['light', 'dark']) {
      const supplied = candidate[mode];
      if (supplied !== undefined && (!supplied || typeof supplied !== 'object' || Array.isArray(supplied))) errors.push(`${mode} must be an object`);
      if (supplied && typeof supplied === 'object') {
        for (const key of Object.keys(supplied)) if (!colors.includes(key)) errors.push(`Unknown ${mode} token: ${key}`);
        for (const key of colors) {
          if (supplied[key] === undefined) continue;
          const normalized = hex(supplied[key]);
          if (!normalized) errors.push(`${mode}.${key} must be a six-digit hex color`); else output[mode][key] = normalized;
        }
      }
    }
    const geometryRules = { controlRadius: [0, 32], surfaceRadius: [0, 48], contentMaxWidth: [320, 1920] };
    const typographyRules = { baseFontSize: [12, 24] };
    for (const [section, rules] of [['geometry', geometryRules], ['typography', typographyRules]]) {
      const supplied = candidate[section];
      if (supplied !== undefined && (!supplied || typeof supplied !== 'object' || Array.isArray(supplied))) errors.push(`${section} must be an object`);
      if (supplied && typeof supplied === 'object') {
        for (const key of Object.keys(supplied)) if (!rules[key]) errors.push(`Unknown ${section} token: ${key}`);
        for (const [key, range] of Object.entries(rules)) {
          if (supplied[key] === undefined) continue;
          const normalized = bounded(supplied[key], range[0], range[1]);
          if (normalized === null) errors.push(`${section}.${key} is outside its supported range`); else output[section][key] = normalized;
        }
      }
    }
    if (candidate.customCss !== undefined) {
      if (!safeCss(candidate.customCss)) errors.push(`customCss must be safe CSS text up to ${MAX_CUSTOM_CSS} bytes`); else output.customCss = candidate.customCss;
    }
    if (strict && errors.length) throw new Error(errors.join(', '));
    return errors.length ? cloneDefaults() : output;
  };

  const variables = (design, theme) => {
    const value = normalize(design);
    const palette = value[theme === 'dark' ? 'dark' : 'light'];
    return {
      '--bg': palette.background, '--bg-strong': palette.background, '--surface': palette.surface,
      '--surface-secondary': palette.surface, '--surface-tertiary': palette.surface,
      '--primary': palette.primary, '--primary-strong': palette.primary,
      '--text': palette.text, '--text-muted': palette.muted, '--border': palette.border,
      '--line-strong': palette.border, '--button-secondary-background': palette.surface,
      '--button-secondary-border': palette.border, '--button-secondary-text': palette.text,
      '--button-radius': `${value.geometry.controlRadius}px`, '--radius': `${value.geometry.surfaceRadius}px`,
      '--content-max-width': `${value.geometry.contentMaxWidth}px`, '--base-font-size': `${value.typography.baseFontSize}px`
    };
  };
  const apply = (target, design, theme) => {
    const normalized = normalize(design);
    for (const [name, value] of Object.entries(variables(normalized, theme))) target.style.setProperty(name, value);
    return normalized;
  };
  const read = () => {
    try { const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)); return parsed && parsed.public === true && parsed.schemaVersion === SCHEMA_VERSION && parsed.design?.schemaVersion === SCHEMA_VERSION ? normalize(parsed.design) : null; } catch { return null; }
  };
  const write = (design) => {
    try { const normalized = normalize(design, { strict: true }); localStorage.setItem(STORAGE_KEY, JSON.stringify({ public: true, schemaVersion: SCHEMA_VERSION, design: normalized })); return normalized; } catch { return null; }
  };
  return { SCHEMA_VERSION, STORAGE_KEY, MAX_CUSTOM_CSS, defaults: cloneDefaults, normalize, variables, apply, read, write };
}));

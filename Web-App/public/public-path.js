'use strict';

(function exposeNeutralPublicPath(root) {
  const invalidBasePath = () => {
    throw new Error('Invalid base path.');
  };

  const normalize = (value) => {
    if (typeof value !== 'string') invalidBasePath();
    if (value === '' || value === '/') return '';

    let normalized = value;
    if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
    if (!normalized.startsWith('/')) normalized = `/${normalized}`;

    if (!/^\/(?:[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*)$/.test(normalized)) invalidBasePath();
    if (normalized.split('/').slice(1).some((segment) => segment === '.' || segment === '..')) invalidBasePath();
    return normalized;
  };

  const normalizeLocalPath = (value) => {
    if (typeof value !== 'string') {
      throw new Error('Invalid public path.');
    }
    const normalized = value.replace(/\/{2,}/g, '/').replace(/^\/+|\/+$/g, '');
    if (normalized === '') return '';
    if (!/^[A-Za-z0-9._~/-]+$/.test(normalized) || normalized.split('/').some((segment) => segment === '.' || segment === '..')) {
      throw new Error('Invalid public path.');
    }
    return normalized;
  };

  const base = () => {
    const config = root.NeutralConfig;
    if (config && Object.prototype.hasOwnProperty.call(config, 'basePath')) {
      return normalize(config.basePath);
    }
    const meta = root.document && typeof root.document.querySelector === 'function'
      ? root.document.querySelector('meta[name="neutral-base-path"]')
      : null;
    return normalize(meta && typeof meta.content === 'string' ? meta.content : '');
  };

  const join = (...paths) => {
    const path = normalizeLocalPath(paths.join('/'));
    return `${base()}/${path}`;
  };

  const resolver = {
    normalize,
    base,
    join,
    asset: (path) => join('Web-App/public', path),
    api: (path = '') => join('api/v1', path),
    admin: () => join('admin.php'),
    setup: () => join('setup.php')
  };

  root.NeutralPublicPath = resolver;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = resolver;
  }
}(typeof globalThis === 'undefined' ? window : globalThis));
